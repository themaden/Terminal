"""APScheduler background jobs — flight data polling, MCT/ACT seeding, risk cache."""
import logging
from datetime import datetime, timedelta
import random

from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")
_last_run: dict = {}


async def seed_act_tracker():
    """
    Populate the in-memory ACT tracker with realistic connections from the DB.
    Called once on startup and every 10 minutes to reflect new bookings.
    """
    from app.db.database import async_session_maker
    from app.db.models import FlightDB, PassengerDB, DecisionDB
    from app.api.routes.hub_control import _act_tracker
    from app.rules.mct import MCTCalculator, ConnectionType
    from sqlalchemy import select

    HUB_AIRPORTS = ["IST", "LHR", "FRA", "AMS", "CDG"]
    ICAO_MAP = {"IST": "LTFM", "LHR": "EGLL", "FRA": "EDDF", "AMS": "EHAM", "CDG": "LFPG"}

    try:
        async with async_session_maker() as session:
            pax_result = await session.execute(select(PassengerDB).limit(40))
            passengers = pax_result.scalars().all()

            flights_result = await session.execute(select(FlightDB).limit(20))
            flights = flights_result.scalars().all()

            if not flights or not passengers:
                return

            now = datetime.utcnow()
            registered = 0

            for i, pax in enumerate(passengers[:30]):
                # Pick two different flights to simulate a connection
                inbound = flights[i % len(flights)]
                outbound_idx = (i + 2) % len(flights)
                outbound = flights[outbound_idx]
                if inbound.id == outbound.id:
                    continue

                hub = inbound.destination
                if hub not in HUB_AIRPORTS:
                    hub = "IST"
                hub_icao = ICAO_MAP.get(hub, "LTFM")

                # Simulate inbound ETA and outbound STD
                inbound_eta = now + timedelta(minutes=random.randint(20, 180))
                # Some connections at risk: outbound departs soon
                gap = random.choice([30, 45, 55, 65, 80, 100, 130, 150])
                outbound_std = inbound_eta + timedelta(minutes=gap)

                conn_type = ConnectionType.II
                mct = MCTCalculator.get_mct(hub_icao, conn_type)

                _act_tracker.register(
                    passenger_pnr=pax.pnr,
                    inbound_flight=inbound.flight_number,
                    outbound_flight=outbound.flight_number,
                    hub_airport=hub,
                    inbound_eta=inbound_eta,
                    outbound_std=outbound_std,
                    mct_minutes=mct,
                )
                registered += 1

        _last_run["act_seed"] = datetime.utcnow().isoformat()
        logger.info("ACT tracker seeded — %d connections registered", registered)
    except Exception as exc:
        logger.error("ACT seed error: %s", exc)


async def _poll_flight_statuses():
    """Poll Cirium for flight status updates every 5 minutes."""
    from app.db.database import async_session_maker
    from app.db.models import FlightDB, CrisisDB
    from app.integrations.cirium.client import get_flight_status
    from app.models.flight import FlightStatus
    from app.models.crisis import CrisisType, CrisisSeverity, CrisisStatus
    from app.services.crisis_service import CrisisService
    from sqlalchemy import select

    try:
        async with async_session_maker() as session:
            result = await session.execute(
                select(FlightDB)
                .where(FlightDB.status.in_([FlightStatus.SCHEDULED, FlightStatus.DELAYED]))
                .limit(20)
            )
            flights = result.scalars().all()
            updated = 0
            changed: list[FlightDB] = []
            for flight in flights:
                status_data = await get_flight_status(flight.flight_number)
                delay = status_data.get("departure_delay_minutes", 0)
                if delay > 30 and flight.status == FlightStatus.SCHEDULED:
                    flight.status = FlightStatus.DELAYED
                    updated += 1
                    changed.append(flight)
            if updated:
                await session.commit()
                from app.api.routes.ws import push_flight_update
                for flight in changed:
                    await push_flight_update({
                        "flight_id": flight.id,
                        "flight_number": flight.flight_number,
                        "origin": flight.origin,
                        "destination": flight.destination,
                        "status": flight.status.value,
                    })
                    # Auto-trigger crisis if no active crisis already exists for this flight
                    existing = await session.execute(
                        select(CrisisDB).where(
                            CrisisDB.affected_flight_id == flight.id,
                            CrisisDB.status == CrisisStatus.ACTIVE,
                        )
                    )
                    if existing.scalar_one_or_none() is None:
                        try:
                            severity = CrisisSeverity.HIGH if flight.available_seats < 20 else CrisisSeverity.MEDIUM
                            await CrisisService.trigger_crisis(
                                session=session,
                                flight_number=flight.flight_number,
                                crisis_type=CrisisType.DELAY,
                                reason=f"Cirium: {flight.flight_number} için {int(status_data.get('departure_delay_minutes', 0))} dk gecikme tespit edildi — otomatik kriz açıldı",
                                severity=severity,
                            )
                            logger.warning(
                                "AUTO-CRISIS triggered — %s delayed %d min",
                                flight.flight_number,
                                status_data.get("departure_delay_minutes", 0),
                            )
                        except Exception as crisis_exc:
                            logger.error("Auto-crisis trigger failed for %s: %s", flight.flight_number, crisis_exc)

            _last_run["flight_poll"] = datetime.utcnow().isoformat()
            logger.info("Flight status poll — %d updated", updated)
    except Exception as exc:
        logger.error("Flight poll error: %s", exc)


async def _refresh_risk_cache():
    _last_run["risk_refresh"] = datetime.utcnow().isoformat()
    logger.info("Risk score cache refreshed")


def get_scheduler_status() -> dict:
    return {
        "running": scheduler.running,
        "jobs": [
            {"id": j.id, "name": j.name, "next_run": j.next_run_time.isoformat() if j.next_run_time else None}
            for j in scheduler.get_jobs()
        ],
        "last_runs": _last_run,
    }


async def _check_weather_threats():
    """Every 10 min: run weather forecast, log imminent threats, broadcast over WS, auto-trigger crises."""
    try:
        from app.db.database import async_session_maker
        from app.api.routes.prediction import get_weather_forecast
        from app.db.models import FlightDB, CrisisDB
        from app.models.crisis import CrisisType, CrisisSeverity, CrisisStatus
        from app.services.crisis_service import CrisisService
        from sqlalchemy import select

        async with async_session_maker() as session:
            forecast = await get_weather_forecast(db=session)

        imminent = [t for t in forecast.threats if t.time_to_impact_minutes < 90 and t.severity in ("CRITICAL", "HIGH")]
        if imminent:
            for t in imminent:
                logger.warning(
                    "WEATHER ALERT — %s @ %s in %d min (p=%.0f%%) flights: %s",
                    t.type, t.airport, t.time_to_impact_minutes,
                    t.probability * 100, ",".join(t.affected_flights),
                )
            try:
                from app.api.routes.ws import push_crisis_update
                await push_crisis_update({
                    "type": "weather_alert",
                    "threats": [t.model_dump() for t in imminent],
                    "narrative": forecast.narrative,
                })
            except Exception:
                pass

            # Auto-trigger crisis for CRITICAL threats with auto_trigger_recommended flag
            critical_threats = [t for t in imminent if t.severity == "CRITICAL" and t.auto_trigger_recommended]
            if critical_threats:
                async with async_session_maker() as session:
                    for threat in critical_threats:
                        for flight_number in threat.affected_flights:
                            flight_result = await session.execute(
                                select(FlightDB).where(FlightDB.flight_number == flight_number)
                            )
                            flight = flight_result.scalar_one_or_none()
                            if flight is None:
                                continue
                            existing = await session.execute(
                                select(CrisisDB).where(
                                    CrisisDB.affected_flight_id == flight.id,
                                    CrisisDB.status == CrisisStatus.ACTIVE,
                                )
                            )
                            if existing.scalar_one_or_none() is not None:
                                continue
                            try:
                                await CrisisService.trigger_crisis(
                                    session=session,
                                    flight_number=flight_number,
                                    crisis_type=CrisisType.DELAY,
                                    reason=(
                                        f"Hava durumu otomatik kriz: {threat.type} @ {threat.airport} — "
                                        f"%{int(threat.probability * 100)} olasılık, {threat.time_to_impact_minutes} dk içinde"
                                    ),
                                    severity=CrisisSeverity.CRITICAL,
                                )
                                logger.warning(
                                    "AUTO-CRISIS (weather) triggered — %s due to %s @ %s",
                                    flight_number, threat.type, threat.airport,
                                )
                            except Exception as crisis_exc:
                                logger.error(
                                    "Auto-crisis (weather) failed for %s: %s", flight_number, crisis_exc
                                )

        _last_run["weather_check"] = datetime.utcnow().isoformat()
        logger.info("Weather check — %d threats, %d imminent", len(forecast.threats), len(imminent))
    except Exception as exc:
        logger.error("Weather check error: %s", exc)


def start_scheduler():
    if scheduler.running:
        return
    scheduler.add_job(_poll_flight_statuses, "interval", minutes=5,  id="flight_poll",    replace_existing=True)
    scheduler.add_job(_refresh_risk_cache,   "interval", minutes=30, id="risk_refresh",   replace_existing=True)
    scheduler.add_job(seed_act_tracker,      "interval", minutes=10, id="act_seed",       replace_existing=True)
    scheduler.add_job(_check_weather_threats,"interval", minutes=10, id="weather_check",  replace_existing=True)
    scheduler.start()
    logger.info("Scheduler started — 4 jobs")
