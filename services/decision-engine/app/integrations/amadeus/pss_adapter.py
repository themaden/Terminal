"""Amadeus PSS Adapter — flight search, availability, pricing, PNR lookup."""
import random
from datetime import datetime, timedelta
from typing import Optional

from app.integrations.amadeus.client import get_amadeus_client

# ─── Mock helpers ──────────────────────────────────────────────────────────────

AIRLINES = ["TK", "LH", "BA", "AF", "EK", "QR", "AA", "UA"]
CLASSES = ["ECONOMY", "BUSINESS", "FIRST"]


def _mock_flight_offer(origin: str, destination: str, date: str, index: int) -> dict:
    airline = random.choice(AIRLINES)
    flight_num = f"{airline}{random.randint(100, 9999)}"
    dep_hour = 6 + index * 3
    arr_hour = dep_hour + random.randint(2, 12)
    price = random.randint(120, 1800)
    seats = random.randint(0, 60)
    ticket_class = CLASSES[index % len(CLASSES)]
    return {
        "id": f"OFFER-{index+1}",
        "source": "amadeus_mock",
        "flight_number": flight_num,
        "airline_code": airline,
        "origin": origin.upper(),
        "destination": destination.upper(),
        "departure_date": date,
        "departure_time": f"{dep_hour:02d}:00",
        "arrival_time": f"{arr_hour % 24:02d}:30",
        "duration_minutes": (arr_hour - dep_hour) * 60 + random.randint(0, 59),
        "cabin_class": ticket_class,
        "available_seats": seats,
        "price_eur": price,
        "price_currency": "EUR",
        "is_codeshare": random.random() > 0.7,
        "stops": 0 if random.random() > 0.3 else 1,
    }


def _mock_pnr_record(pnr: str) -> dict:
    return {
        "pnr": pnr.upper(),
        "source": "amadeus_mock",
        "passenger_name": f"MOCK/PASSENGER",
        "ticket_number": f"235-{random.randint(1000000000, 9999999999)}",
        "booking_class": random.choice(CLASSES),
        "fare_basis": random.choice(["YOWGB", "COWGB", "JOWGB"]),
        "ticketing_date": (datetime.utcnow() - timedelta(days=random.randint(1, 60))).date().isoformat(),
        "segments": [
            {
                "flight_number": f"TK{random.randint(100, 9999)}",
                "origin": "IST", "destination": "LHR",
                "departure": datetime.utcnow().isoformat(),
                "status": random.choice(["HK", "KL", "TK"]),
            }
        ],
        "ssr_codes": [],
        "ssrf": False,
    }


# ─── Real Amadeus calls (with mock fallback) ───────────────────────────────────

async def search_flight_offers(
    origin: str,
    destination: str,
    date: str,
    adults: int = 1,
    cabin: str = "ECONOMY",
    max_results: int = 10,
) -> list[dict]:
    """Search for available flight offers via Amadeus API."""
    client = get_amadeus_client()
    if client is None:
        return [_mock_flight_offer(origin, destination, date, i) for i in range(min(max_results, 6))]
    try:
        response = client.shopping.flight_offers_search.get(
            originLocationCode=origin.upper(),
            destinationLocationCode=destination.upper(),
            departureDate=date,
            adults=adults,
            travelClass=cabin.upper(),
            max=max_results,
        )
        offers = []
        for offer in response.data:
            seg = offer["itineraries"][0]["segments"][0]
            price = float(offer["price"]["grandTotal"])
            offers.append({
                "id": offer["id"],
                "source": "amadeus_live",
                "flight_number": seg["carrierCode"] + seg["number"],
                "airline_code": seg["carrierCode"],
                "origin": seg["departure"]["iataCode"],
                "destination": seg["arrival"]["iataCode"],
                "departure_date": date,
                "departure_time": seg["departure"]["at"][11:16],
                "arrival_time": seg["arrival"]["at"][11:16],
                "duration_minutes": int(offer["itineraries"][0]["duration"].replace("PT", "").replace("H", "*60+").replace("M", "") or 0),
                "cabin_class": cabin,
                "available_seats": offer.get("numberOfBookableSeats", 0),
                "price_eur": price,
                "price_currency": offer["price"]["currency"],
                "is_codeshare": seg.get("operating") is not None,
                "stops": len(offer["itineraries"][0]["segments"]) - 1,
            })
        return offers
    except Exception as exc:
        return [_mock_flight_offer(origin, destination, date, i) for i in range(min(max_results, 6))]


async def get_flight_status_amadeus(flight_number: str, date: str) -> dict:
    """Get real-time flight status from Amadeus."""
    client = get_amadeus_client()
    if client is None:
        return {
            "flight_number": flight_number,
            "source": "amadeus_mock",
            "date": date,
            "status": random.choice(["SCHEDULED", "DEPARTED", "DELAYED", "CANCELLED"]),
            "departure_delay_minutes": random.randint(0, 90),
            "gate": f"{random.choice('ABCD')}{random.randint(1, 30)}",
            "terminal": str(random.randint(1, 4)),
        }
    try:
        iata_code = flight_number[:2]
        number = flight_number[2:]
        response = client.schedule.flights.get(
            carrierCode=iata_code,
            flightNumber=number,
            scheduledDepartureDate=date,
        )
        d = response.data[0] if response.data else {}
        return {
            "flight_number": flight_number,
            "source": "amadeus_live",
            "date": date,
            "status": d.get("flightDesignator", {}).get("operatingCarrierFlightNumber", "UNKNOWN"),
            "raw": d,
        }
    except Exception:
        return {"flight_number": flight_number, "source": "amadeus_mock_fallback", "date": date, "status": "UNKNOWN"}


async def lookup_pnr(pnr: str) -> dict:
    """Look up a PNR record via Amadeus (sandbox: always returns mock)."""
    return _mock_pnr_record(pnr)
