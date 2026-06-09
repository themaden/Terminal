"""Amadeus PSS Adapter — flight search, availability, pricing, PNR lookup."""
import logging
import random
from datetime import datetime, timedelta
from typing import Optional

from app.integrations.amadeus.client import get_amadeus_client

logger = logging.getLogger(__name__)

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
        flight_points = d.get("flightPoints") or []
        departure_point = next((p for p in flight_points if "departure" in p), {})
        timings = (departure_point.get("departure") or {}).get("timings") or []
        scheduled = next((t.get("value") for t in timings if t.get("qualifier") == "STD"), None)
        estimated = next((t.get("value") for t in timings if t.get("qualifier") in ("ETD", "ETA")), None)

        delay_minutes = 0
        if scheduled and estimated:
            try:
                delay_minutes = max(0, int((datetime.fromisoformat(estimated) - datetime.fromisoformat(scheduled)).total_seconds() // 60))
            except ValueError:
                delay_minutes = 0

        designator = d.get("flightDesignator") or {}
        return {
            "flight_number": flight_number,
            "source": "amadeus_live",
            "date": date,
            "status": "DELAYED" if delay_minutes > 15 else "SCHEDULED",
            "departure_delay_minutes": delay_minutes,
            "scheduled_departure": scheduled,
            "estimated_departure": estimated,
            "carrier_code": designator.get("carrierCode", iata_code),
            "operating_flight_number": designator.get("flightNumber", number),
        }
    except Exception as exc:
        logger.warning("Amadeus flight status error for %s: %s", flight_number, exc)
        return {"flight_number": flight_number, "source": "amadeus_mock_fallback", "date": date, "status": "UNKNOWN"}


async def lookup_pnr(pnr: str) -> dict:
    """Look up a PNR / flight order record via Amadeus (live if configured, else mock)."""
    client = get_amadeus_client()
    if client is None:
        return _mock_pnr_record(pnr)
    try:
        response = client.booking.flight_order(pnr).get()
        order = response.data or {}
        travelers = order.get("travelers") or []
        traveler = travelers[0] if travelers else {}
        name = traveler.get("name") or {}
        documents = traveler.get("documents") or []

        segments = []
        for offer in order.get("flightOffers") or []:
            for itinerary in offer.get("itineraries") or []:
                for seg in itinerary.get("segments") or []:
                    departure = seg.get("departure") or {}
                    arrival = seg.get("arrival") or {}
                    segments.append({
                        "flight_number": f"{seg.get('carrierCode', '')}{seg.get('number', '')}",
                        "origin": departure.get("iataCode", ""),
                        "destination": arrival.get("iataCode", ""),
                        "departure": departure.get("at", ""),
                        "status": "HK",
                    })

        creation_date = ((order.get("associatedRecords") or [{}])[0]).get("creationDateTime", "")
        return {
            "pnr": pnr.upper(),
            "source": "amadeus_live",
            "passenger_name": (f"{name.get('firstName', '')} {name.get('lastName', '')}".strip() or "UNKNOWN"),
            "ticket_number": documents[0].get("number", "") if documents else "",
            "booking_class": "",
            "fare_basis": "",
            "ticketing_date": creation_date[:10] if creation_date else "",
            "segments": segments or _mock_pnr_record(pnr)["segments"],
            "ssr_codes": [],
            "ssrf": False,
        }
    except Exception as exc:
        logger.warning("Amadeus PNR lookup error for %s: %s", pnr, exc)
        return _mock_pnr_record(pnr)
