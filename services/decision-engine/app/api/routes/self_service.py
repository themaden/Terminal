"""Passenger Self-Service Portal — alternatives, boarding pass, vouchers."""
import random
import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.db.database import get_db
from app.db.models import PassengerDB, FlightDB, DecisionDB, CrisisDB
from app.models.crisis import CrisisStatus
from app.models.decision import DecisionStatus, DecisionAction
from app.models.flight import FlightStatus

router = APIRouter(prefix="/api/v1/self-service", tags=["self-service"])


class AlternativeFlight(BaseModel):
    flight_id: int
    flight_number: str
    origin: str
    destination: str
    scheduled_departure: str
    available_seats: int
    fare_difference_eur: float
    is_recommended: bool


class VoucherItem(BaseModel):
    type: str
    value_eur: float
    code: str
    valid_until: str
    details: str


class BoardingPass(BaseModel):
    pnr: str
    passenger_name: str
    flight_number: str
    origin: str
    destination: str
    seat: str
    gate: str
    boarding_time: str
    departure_time: str
    qr_data: str


class SelfServiceStatus(BaseModel):
    pnr: str
    passenger_name: str
    original_flight: str
    crisis_active: bool
    crisis_type: Optional[str] = None
    compensation_eur: float
    alternatives: list[AlternativeFlight]
    vouchers: list[VoucherItem]
    decision_status: str
    message: str


class RebookRequest(BaseModel):
    flight_id: int


def _voucher_code(prefix: str, seed: str) -> str:
    return f"{prefix}-{hashlib.md5(seed.encode()).hexdigest()[:8].upper()}"


@router.get("/{pnr}", response_model=SelfServiceStatus)
async def get_passenger_status(pnr: str, db: AsyncSession = Depends(get_db)):
    """Passenger portal entry — return crisis status, alternatives, and vouchers."""
    result = await db.execute(select(PassengerDB).where(PassengerDB.pnr == pnr.upper()))
    pax = result.scalar_one_or_none()
    if not pax:
        raise HTTPException(status_code=404, detail=f"PNR {pnr} bulunamadı")

    result = await db.execute(
        select(DecisionDB, CrisisDB, FlightDB)
        .join(CrisisDB, DecisionDB.crisis_id == CrisisDB.id)
        .join(FlightDB, CrisisDB.affected_flight_id == FlightDB.id)
        .where(DecisionDB.passenger_id == pax.id)
        .order_by(DecisionDB.created_at.desc())
        .limit(1)
    )
    row = result.first()

    alternatives: list[AlternativeFlight] = []
    vouchers: list[VoucherItem] = []
    crisis_active = False
    crisis_type = None
    compensation = 0.0
    decision_status = "NO_ACTION_NEEDED"
    original_flight = "—"
    message = "Uçuşunuz normal seyrinde. Herhangi bir aksiyon gerekmemektedir."

    if row:
        decision, crisis, flight = row
        original_flight = flight.flight_number
        crisis_active = crisis.status == CrisisStatus.ACTIVE
        crisis_type = crisis.crisis_type.value
        compensation = decision.compensation_amount_eur
        decision_status = decision.status.value

        message = (
            f"Uçuşunuz {crisis.crisis_type.value} nedeniyle etkilendi. Lütfen aşağıdan alternatif seçin."
            if crisis_active else
            "Kriz çözüldü. Boarding pass'iniz hazır."
        )

        alt_result = await db.execute(
            select(FlightDB)
            .where(
                FlightDB.destination == flight.destination,
                FlightDB.available_seats > 0,
                FlightDB.status == FlightStatus.SCHEDULED,
                FlightDB.id != flight.id,
            )
            .order_by(FlightDB.scheduled_departure)
            .limit(4)
        )
        for idx, af in enumerate(alt_result.scalars().all()):
            fare_diff = round(random.uniform(-50, 200), 2) if decision.action == DecisionAction.REBOOK else 0.0
            alternatives.append(AlternativeFlight(
                flight_id=af.id,
                flight_number=af.flight_number,
                origin=af.origin,
                destination=af.destination,
                scheduled_departure=af.scheduled_departure.isoformat(),
                available_seats=af.available_seats,
                fare_difference_eur=fare_diff,
                is_recommended=(idx == 0),
            ))

        if compensation > 0:
            now = datetime.utcnow()
            vouchers.append(VoucherItem(
                type="MEAL",
                value_eur=15.0,
                code=_voucher_code("ML", f"MEAL-{pnr}"),
                valid_until=(now + timedelta(hours=24)).isoformat(),
                details="Havalimanı restoranlarında geçerli yemek kuponu",
            ))
            if compensation >= 250:
                vouchers.append(VoucherItem(
                    type="HOTEL",
                    value_eur=min(round(compensation * 0.3, 2), 150.0),
                    code=_voucher_code("HT", f"HOTEL-{pnr}"),
                    valid_until=(now + timedelta(hours=48)).isoformat(),
                    details="Partner otellerde 1 gece konaklama",
                ))
            vouchers.append(VoucherItem(
                type="TRANSFER",
                value_eur=30.0,
                code=_voucher_code("TR", f"TRANS-{pnr}"),
                valid_until=(now + timedelta(hours=12)).isoformat(),
                details="Havalimanı–şehir merkezi transfer hizmeti",
            ))

    return SelfServiceStatus(
        pnr=pax.pnr,
        passenger_name=f"{pax.first_name} {pax.last_name}",
        original_flight=original_flight,
        crisis_active=crisis_active,
        crisis_type=crisis_type,
        compensation_eur=compensation,
        alternatives=alternatives,
        vouchers=vouchers,
        decision_status=decision_status,
        message=message,
    )


@router.post("/{pnr}/rebook")
async def passenger_rebook(pnr: str, req: RebookRequest, db: AsyncSession = Depends(get_db)):
    """Passenger self-selects an alternative flight — no operator intervention needed."""
    result = await db.execute(select(PassengerDB).where(PassengerDB.pnr == pnr.upper()))
    pax = result.scalar_one_or_none()
    if not pax:
        raise HTTPException(status_code=404, detail=f"PNR {pnr} bulunamadı")

    result = await db.execute(select(FlightDB).where(FlightDB.id == req.flight_id))
    new_flight = result.scalar_one_or_none()
    if not new_flight or new_flight.available_seats < 1:
        raise HTTPException(status_code=400, detail="Seçilen uçuşta yer yok")

    result = await db.execute(
        select(DecisionDB).where(DecisionDB.passenger_id == pax.id)
        .order_by(DecisionDB.created_at.desc()).limit(1)
    )
    decision = result.scalar_one_or_none()
    if decision:
        decision.new_flight_id = req.flight_id
        decision.status = DecisionStatus.EXECUTED
        new_flight.available_seats = max(0, new_flight.available_seats - 1)
        await db.commit()

    return {
        "success": True,
        "message": f"{new_flight.flight_number} uçuşuna yeniden rezervasyon tamamlandı.",
        "new_flight": new_flight.flight_number,
        "departure": new_flight.scheduled_departure.isoformat(),
    }


@router.get("/{pnr}/boarding-pass", response_model=BoardingPass)
async def get_boarding_pass(pnr: str, db: AsyncSession = Depends(get_db)):
    """Generate boarding pass — instant, no operator needed."""
    result = await db.execute(select(PassengerDB).where(PassengerDB.pnr == pnr.upper()))
    pax = result.scalar_one_or_none()
    if not pax:
        raise HTTPException(status_code=404, detail=f"PNR {pnr} bulunamadı")

    result = await db.execute(
        select(DecisionDB, FlightDB)
        .join(FlightDB, DecisionDB.new_flight_id == FlightDB.id)
        .where(DecisionDB.passenger_id == pax.id)
        .order_by(DecisionDB.created_at.desc())
        .limit(1)
    )
    row = result.first()

    if not row:
        fb = await db.execute(select(FlightDB).limit(1))
        flight = fb.scalar_one_or_none()
        if not flight:
            raise HTTPException(status_code=404, detail="Uçuş bulunamadı")
    else:
        _, flight = row

    seat = f"{random.randint(10, 35)}{random.choice('ABCDEF')}"
    gate = f"{random.choice('ABCD')}{random.randint(1, 30)}"
    boarding = (flight.scheduled_departure - timedelta(minutes=40)).isoformat()

    return BoardingPass(
        pnr=pax.pnr,
        passenger_name=f"{pax.first_name} {pax.last_name}",
        flight_number=flight.flight_number,
        origin=flight.origin,
        destination=flight.destination,
        seat=seat,
        gate=gate,
        boarding_time=boarding,
        departure_time=flight.scheduled_departure.isoformat(),
        qr_data=f"JETNEXUS|{pax.pnr}|{flight.flight_number}|{seat}|{gate}",
    )
