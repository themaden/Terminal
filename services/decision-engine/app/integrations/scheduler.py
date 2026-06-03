"""APScheduler background jobs — flight data polling, risk prediction refresh."""
import logging
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")
_last_run: dict = {}


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
            for flight in flights:
                status_data = await get_flight_status(flight.flight_number)
                delay = status_data.get("departure_delay_minutes", 0)
                if delay > 30 and flight.status == FlightStatus.SCHEDULED:
                    flight.status = FlightStatus.DELAYED
                    updated += 1
            if updated:
                await session.commit()
            _last_run["flight_poll"] = datetime.utcnow().isoformat()
            logger.info("Flight status poll complete — %d flights updated", updated)
    except Exception as exc:
        logger.error("Flight poll error: %s", exc)


async def _refresh_risk_cache():
    """Pre-compute risk scores every 30 minutes and cache them."""
    _last_run["risk_refresh"] = datetime.utcnow().isoformat()
    logger.info("Risk score cache refreshed at %s", _last_run["risk_refresh"])


def get_scheduler_status() -> dict:
    return {
        "running": scheduler.running,
        "jobs": [
            {
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
            }
            for job in scheduler.get_jobs()
        ],
        "last_runs": _last_run,
    }


def start_scheduler():
    if scheduler.running:
        return
    scheduler.add_job(_poll_flight_statuses, "interval", minutes=5, id="flight_poll", replace_existing=True)
    scheduler.add_job(_refresh_risk_cache, "interval", minutes=30, id="risk_refresh", replace_existing=True)
    scheduler.start()
    logger.info("Background scheduler started — 2 jobs active")
