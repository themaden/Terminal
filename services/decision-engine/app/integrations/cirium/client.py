"""Cirium FlightStats API client — real-time AODB feed."""
import logging
import random
from datetime import datetime, timedelta
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

CIRIUM_BASE = "https://api.flightstats.com/flex"

FLIGHT_STATUSES = ["A", "S", "L", "C", "D", "U"]  # Active, Scheduled, Land, Cancelled, Diverted, Unknown
STATUS_LABELS = {"A": "ACTIVE", "S": "SCHEDULED", "L": "LANDED", "C": "CANCELLED", "D": "DIVERTED", "U": "UNKNOWN", "LD": "DELAYED"}

AIRPORTS = ["IST", "LHR", "CDG", "FRA", "AMS", "MAD", "FCO", "ATH", "DXB", "JFK", "ORD", "LAX"]


def _mock_flight_status(flight_number: str) -> dict:
    delay = random.randint(0, 120) if random.random() > 0.6 else 0
    status_code = "LD" if delay > 15 else random.choice(["S", "A", "S", "S"])
    now = datetime.utcnow()
    return {
        "source": "cirium_mock",
        "flight_number": flight_number,
        "status": STATUS_LABELS.get(status_code, "SCHEDULED"),
        "departure_delay_minutes": delay,
        "arrival_delay_minutes": delay + random.randint(-5, 15),
        "gate": f"{random.choice('ABCD')}{random.randint(1, 30)}",
        "terminal": str(random.randint(1, 4)),
        "actual_departure": (now + timedelta(minutes=delay)).isoformat() if delay > 0 else None,
        "scheduled_departure": now.isoformat(),
        "last_updated": now.isoformat(),
        "baggage_claim": str(random.randint(1, 12)),
        "equipment": random.choice(["Boeing 777-300ER", "Airbus A350-900", "Airbus A320neo", "Boeing 787-9"]),
    }


def _mock_departures(airport: str, n: int = 12) -> list[dict]:
    now = datetime.utcnow()
    result = []
    for i in range(n):
        dest = random.choice([a for a in AIRPORTS if a != airport])
        airline = random.choice(["TK", "LH", "BA", "AF", "EK"])
        delay = random.randint(0, 90) if random.random() > 0.65 else 0
        result.append({
            "source": "cirium_mock",
            "flight_number": f"{airline}{random.randint(100, 9999)}",
            "airline": airline,
            "destination": dest,
            "scheduled_departure": (now + timedelta(minutes=20 + i * 15)).isoformat(),
            "estimated_departure": (now + timedelta(minutes=20 + i * 15 + delay)).isoformat(),
            "delay_minutes": delay,
            "status": "DELAYED" if delay > 15 else "SCHEDULED",
            "gate": f"{random.choice('ABCD')}{random.randint(1, 30)}",
            "terminal": str(random.randint(1, 3)),
        })
    return result


def _mock_arrivals(airport: str, n: int = 12) -> list[dict]:
    now = datetime.utcnow()
    result = []
    for i in range(n):
        origin = random.choice([a for a in AIRPORTS if a != airport])
        airline = random.choice(["TK", "LH", "BA", "AF", "EK"])
        delay = random.randint(0, 60) if random.random() > 0.7 else 0
        result.append({
            "source": "cirium_mock",
            "flight_number": f"{airline}{random.randint(100, 9999)}",
            "airline": airline,
            "origin": origin,
            "scheduled_arrival": (now + timedelta(minutes=10 + i * 12)).isoformat(),
            "estimated_arrival": (now + timedelta(minutes=10 + i * 12 + delay)).isoformat(),
            "delay_minutes": delay,
            "status": "DELAYED" if delay > 15 else "ON_TIME",
            "gate": f"{random.choice('ABCD')}{random.randint(1, 30)}",
            "baggage_claim": str(random.randint(1, 12)),
        })
    return result


async def get_flight_status(flight_number: str, carrier: Optional[str] = None) -> dict:
    """Fetch real-time flight status from Cirium (fallback: mock)."""
    if not settings.cirium_configured:
        return _mock_flight_status(flight_number)

    iata = carrier or flight_number[:2]
    number = flight_number[2:] if not carrier else flight_number
    url = f"{CIRIUM_BASE}/flightstatus/rest/v2/json/flight/status/{iata}/{number}/dep/{{}}/{{}}?appId={settings.CIRIUM_APP_ID}&appKey={settings.CIRIUM_APP_KEY}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            now = datetime.utcnow()
            resp = await client.get(url.format(now.year, now.month, now.day))
            if resp.status_code == 200:
                data = resp.json()
                fs = data.get("flightStatuses", [{}])[0]
                return {
                    "source": "cirium_live",
                    "flight_number": flight_number,
                    "status": fs.get("status", "UNKNOWN"),
                    "departure_delay_minutes": fs.get("delays", {}).get("departureGateDelayMinutes", 0),
                    "gate": fs.get("airportResources", {}).get("departureGate", "—"),
                    "last_updated": datetime.utcnow().isoformat(),
                }
    except Exception as exc:
        logger.warning("Cirium API error for %s: %s", flight_number, exc)
    return _mock_flight_status(flight_number)


async def get_departures(airport: str, n: int = 12) -> list[dict]:
    """Get live departure board for an airport."""
    if not settings.cirium_configured:
        return _mock_departures(airport, n)
    try:
        now = datetime.utcnow()
        url = (
            f"{CIRIUM_BASE}/flightstatus/rest/v2/json/airport/departures/{airport}/"
            f"{now.year}/{now.month}/{now.day}/{now.hour}/hourOfDay/1"
            f"?appId={settings.CIRIUM_APP_ID}&appKey={settings.CIRIUM_APP_KEY}&numHours=3&maxFlights={n}"
        )
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                flights = data.get("scheduledFlights", [])
                return [
                    {
                        "source": "cirium_live",
                        "flight_number": f["carrierFsCode"] + str(f["flightNumber"]),
                        "airline": f["carrierFsCode"],
                        "destination": f["arrivalAirportFsCode"],
                        "scheduled_departure": f.get("departureTime", ""),
                        "status": f.get("status", "SCHEDULED"),
                        "gate": "—",
                        "terminal": "—",
                        "delay_minutes": 0,
                        "estimated_departure": f.get("departureTime", ""),
                    }
                    for f in flights[:n]
                ]
    except Exception as exc:
        logger.warning("Cirium departures error %s: %s", airport, exc)
    return _mock_departures(airport, n)


async def get_arrivals(airport: str, n: int = 12) -> list[dict]:
    """Get live arrival board for an airport."""
    if not settings.cirium_configured:
        return _mock_arrivals(airport, n)
    try:
        now = datetime.utcnow()
        url = (
            f"{CIRIUM_BASE}/flightstatus/rest/v2/json/airport/arrivals/{airport}/"
            f"{now.year}/{now.month}/{now.day}/{now.hour}/hourOfDay/1"
            f"?appId={settings.CIRIUM_APP_ID}&appKey={settings.CIRIUM_APP_KEY}&numHours=3&maxFlights={n}"
        )
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                flights = data.get("scheduledFlights", [])
                return [
                    {
                        "source": "cirium_live",
                        "flight_number": f["carrierFsCode"] + str(f["flightNumber"]),
                        "airline": f["carrierFsCode"],
                        "origin": f["departureAirportFsCode"],
                        "scheduled_arrival": f.get("arrivalTime", ""),
                        "estimated_arrival": f.get("arrivalTime", ""),
                        "delay_minutes": 0,
                        "status": f.get("status", "SCHEDULED"),
                        "gate": "—",
                        "baggage_claim": "—",
                    }
                    for f in flights[:n]
                ]
    except Exception as exc:
        logger.warning("Cirium arrivals error %s: %s", airport, exc)
    return _mock_arrivals(airport, n)
