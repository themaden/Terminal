"""Hub Control API — Layer 4: Gate/Transfer real-time connection management."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import FlightDB, PassengerDB, DecisionDB, CrisisDB
from app.rules.mct import MCTCalculator
from app.rules.act import ACTTracker, ConnectionStatus

router = APIRouter(prefix="/api/v1/hub", tags=["hub-control"])

# Shared ACT tracker instance (in production would be backed by Redis)
_act_tracker = ACTTracker()


@router.get("/connections/at-risk")
async def get_at_risk_connections():
    """Hub Control: real-time list of connections that are at risk or critical."""
    records = _act_tracker.get_at_risk_connections()
    return {
        "count": len(records),
        "connections": [
            {
                "pnr": r.passenger_pnr,
                "inbound_flight": r.inbound_flight,
                "outbound_flight": r.outbound_flight,
                "hub_airport": r.hub_airport,
                "inbound_eta": r.inbound_eta.isoformat(),
                "outbound_std": r.outbound_std.isoformat(),
                "act_minutes": r.act_minutes,
                "mct_minutes": r.mct_minutes,
                "status": r.status.value,
                "last_updated": r.last_updated.isoformat(),
            }
            for r in records
        ],
    }


@router.get("/connections/missed")
async def get_missed_connections():
    """Hub Control: passengers whose connections are already missed."""
    records = _act_tracker.get_missed_connections()
    return {
        "count": len(records),
        "connections": [
            {
                "pnr": r.passenger_pnr,
                "inbound_flight": r.inbound_flight,
                "outbound_flight": r.outbound_flight,
                "hub_airport": r.hub_airport,
                "act_minutes": r.act_minutes,
                "mct_minutes": r.mct_minutes,
                "status": r.status.value,
            }
            for r in records
        ],
    }


@router.get("/connections/summary")
async def connections_summary():
    """Hub Control dashboard KPIs for the connection board."""
    return _act_tracker.summary()


@router.post("/connections/register")
async def register_connection(
    pnr: str,
    inbound_flight: str,
    outbound_flight: str,
    hub_airport: str,
    inbound_eta: datetime,
    outbound_std: datetime,
):
    """Register a new connecting passenger pair for live tracking."""
    from app.rules.mct import MCTCalculator, ConnectionType
    mct = MCTCalculator.get_mct(hub_airport, ConnectionType.II)  # default II, refined later
    record = _act_tracker.register(
        passenger_pnr=pnr,
        inbound_flight=inbound_flight,
        outbound_flight=outbound_flight,
        hub_airport=hub_airport,
        inbound_eta=inbound_eta,
        outbound_std=outbound_std,
        mct_minutes=mct,
    )
    return {
        "status": "registered",
        "pnr": pnr,
        "connection_status": record.status.value,
        "act_minutes": record.act_minutes,
        "mct_minutes": record.mct_minutes,
    }


@router.post("/connections/update-eta")
async def update_inbound_eta(flight_number: str, new_eta: datetime):
    """Hub Control: push a new inbound ETA and get all affected connections."""
    affected = _act_tracker.update_inbound_eta(flight_number, new_eta)
    return {
        "affected_count": len(affected),
        "connections": [
            {
                "pnr": r.passenger_pnr,
                "outbound_flight": r.outbound_flight,
                "status": r.status.value,
                "act_minutes": r.act_minutes,
                "mct_minutes": r.mct_minutes,
            }
            for r in affected
        ],
    }


@router.get("/mct/check")
async def check_mct(
    airport_icao: str,
    inbound_arrival_in_minutes: int,
    outbound_departure_in_minutes: int,
    inbound_origin: str = "",
    outbound_dest: str = "",
    wheelchair: bool = False,
):
    """Hub Control: one-off MCT check for a given airport and time window."""
    result = MCTCalculator.check_connection(
        airport_icao=airport_icao,
        inbound_arrival_minutes=inbound_arrival_in_minutes,
        outbound_departure_minutes=outbound_departure_in_minutes,
        inbound_origin_icao=inbound_origin,
        outbound_dest_icao=outbound_dest,
        passenger_needs_wheelchair=wheelchair,
    )
    return {
        "airport": result.airport,
        "connection_type": result.connection_type.value,
        "mct_minutes": result.mct_minutes,
        "available_minutes": result.available_minutes,
        "buffer_minutes": result.buffer_minutes,
        "is_feasible": result.is_connection_feasible,
    }


@router.get("/flights/active")
async def get_active_flights(db: AsyncSession = Depends(get_db)):
    """Hub Control: all flights currently in DELAYED or BOARDING status."""
    result = await db.execute(
        select(FlightDB).where(
            FlightDB.status.in_(["DELAYED", "BOARDING", "DEPARTED"])
        ).order_by(FlightDB.scheduled_departure)
    )
    flights = result.scalars().all()
    return [
        {
            "id": f.id,
            "flight_number": f.flight_number,
            "origin": f.origin,
            "destination": f.destination,
            "scheduled_departure": f.scheduled_departure.isoformat(),
            "status": f.status,
            "available_seats": f.available_seats,
            "aircraft_type": f.aircraft_type,
        }
        for f in flights
    ]
