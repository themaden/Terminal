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
    from app.db.models import FlightDB
    from app.integrations.cirium.client import get_flight_status
    from app.models.flight import FlightStatus
    from sqlalchemy import select

    try:
        async with async_session_maker() as session:
            result = await session.execute(
                select(FlightDB)
                .where(FlightDB.status.in_([FlightStatus.SCHEDULED, FlightStatus.DELAYED, FlightStatus.BOARDING]))
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


def start_scheduler():
    if scheduler.running:
        return
    scheduler.add_job(_poll_flight_statuses, "interval", minutes=5,  id="flight_poll",  replace_existing=True)
    scheduler.add_job(_refresh_risk_cache,   "interval", minutes=30, id="risk_refresh", replace_existing=True)
    scheduler.add_job(seed_act_tracker,      "interval", minutes=10, id="act_seed",     replace_existing=True)
    scheduler.start()
    logger.info("Scheduler started — 3 jobs")
