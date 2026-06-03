"""Real-time flight data API — Cirium/AODB live feed endpoints."""
from datetime import date as _date
from fastapi import APIRouter, Query
from app.integrations.cirium.client import get_arrivals, get_departures, get_flight_status
from app.integrations.scheduler import get_scheduler_status

router = APIRouter(prefix="/api/v1/flight-data", tags=["flight-data"])


@router.get("/status/{flight_number}", summary="Real-time flight status (Cirium)")
async def realtime_flight_status(
    flight_number: str,
    carrier: str | None = Query(default=None, description="2-letter IATA carrier code"),
):
    """Fetch live flight status from Cirium FlightStats API."""
    return await get_flight_status(flight_number.upper(), carrier)


@router.get("/departures/{airport}", summary="Live departure board (AODB)")
async def departure_board(
    airport: str,
    limit: int = Query(default=12, le=50),
):
    """Get live departures for an airport from Cirium."""
    return {
        "airport": airport.upper(),
        "type": "departures",
        "count": limit,
        "flights": await get_departures(airport.upper(), limit),
    }


@router.get("/arrivals/{airport}", summary="Live arrival board (AODB)")
async def arrival_board(
    airport: str,
    limit: int = Query(default=12, le=50),
):
    """Get live arrivals for an airport from Cirium."""
    return {
        "airport": airport.upper(),
        "type": "arrivals",
        "count": limit,
        "flights": await get_arrivals(airport.upper(), limit),
    }


@router.get("/scheduler/status", summary="Background job scheduler status")
async def scheduler_status():
    """Return APScheduler job status — polling intervals and last run times."""
    return get_scheduler_status()
