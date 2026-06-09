"""PSS (Passenger Service System) API — Amadeus integration endpoints."""
from datetime import date as _date
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.integrations.amadeus.pss_adapter import (
    get_flight_status_amadeus,
    lookup_pnr,
    search_flight_offers,
)

router = APIRouter(prefix="/api/v1/pss", tags=["pss"])


class FlightSearchRequest(BaseModel):
    origin: str
    destination: str
    date: str
    adults: int = 1
    cabin: str = "ECONOMY"
    max_results: int = 10


@router.post("/amadeus/search", summary="Search Amadeus flight offers")
async def amadeus_search(req: FlightSearchRequest):
    """Search available flights via Amadeus Shopping API (sandbox or live)."""
    offers = await search_flight_offers(
        origin=req.origin,
        destination=req.destination,
        date=req.date,
        adults=req.adults,
        cabin=req.cabin,
        max_results=req.max_results,
    )
    return {
        "count": len(offers),
        "origin": req.origin.upper(),
        "destination": req.destination.upper(),
        "date": req.date,
        "offers": offers,
    }


@router.get("/amadeus/status/{flight_number}", summary="Real-time flight status from Amadeus")
async def amadeus_flight_status(
    flight_number: str,
    flight_date: str = Query(default=str(_date.today()), description="YYYY-MM-DD"),
):
    """Get real-time departure/arrival status for a flight."""
    return await get_flight_status_amadeus(flight_number.upper(), flight_date)


@router.get("/amadeus/pnr/{pnr}", summary="Look up a PNR in the PSS")
async def amadeus_pnr_lookup(pnr: str):
    """Retrieve full PNR record from Amadeus (fare, segments, SSR codes)."""
    return await lookup_pnr(pnr.upper())


@router.get("/status", summary="PSS integration health")
async def pss_status():
    """Return Amadeus connection status and configuration mode."""
    from app.integrations.amadeus.client import get_amadeus_client
    from app.config import settings
    client = get_amadeus_client()
    return {
        "provider": "Amadeus",
        "mode": "live_sandbox" if client else "mock_fallback",
        "configured": settings.amadeus_configured,
        "sandbox_url": "https://test.api.amadeus.com",
        "endpoints": ["shopping/flight-offers", "schedule/flights", "travel/analytics"],
    }
