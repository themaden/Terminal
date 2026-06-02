"""Flights API routes — Query available flights for rebooking."""
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.flight import Flight

router = APIRouter(prefix="/flights", tags=["flights"])


@router.get("/", response_model=list[Flight])
async def list_flights(
    origin: str | None = Query(None, description="IATA origin airport code"),
    destination: str | None = Query(None, description="IATA destination airport code"),
    departure_date: date | None = Query(None, description="Departure date (YYYY-MM-DD)"),
    available_seats: int | None = Query(None, ge=1, description="Minimum available seats"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """List flights with optional filtering by route, date, and seat availability.

    Used by the Rebooking Agent to find candidate flights for displaced passengers.
    """
    from sqlalchemy import and_, select

    from app.db.models import FlightDB as Flight

    stmt = select(Flight)
    filters = []

    if origin:
        filters.append(Flight.origin == origin.upper())
    if destination:
        filters.append(Flight.destination == destination.upper())
    if departure_date:
        filters.append(Flight.departure_time >= departure_date)
    if available_seats is not None:
        filters.append(Flight.available_seats >= available_seats)

    if filters:
        stmt = stmt.where(and_(*filters))

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{flight_id}", response_model=Flight)
async def get_flight(
    flight_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get full details for a specific flight."""
    from sqlalchemy import select

    from app.db.models import FlightDB as Flight

    result = await db.execute(select(Flight).where(Flight.id == flight_id))
    flight = result.scalar_one_or_none()
    if not flight:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight {flight_id} not found",
        )
    return flight
