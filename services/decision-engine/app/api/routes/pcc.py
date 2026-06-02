"""PCC (Passenger Care Center) API — Layer 4 User Screen."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import PassengerDB, DecisionDB, CrisisDB, FlightDB

router = APIRouter(prefix="/api/v1/pcc", tags=["pcc"])


@router.get("/passengers/at-risk")
async def get_at_risk_passengers(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """PCC Dashboard: passengers with pending recovery decisions (at-risk view)."""
    result = await db.execute(
        select(PassengerDB, DecisionDB, CrisisDB, FlightDB)
        .join(DecisionDB, DecisionDB.passenger_id == PassengerDB.id)
        .join(CrisisDB, CrisisDB.id == DecisionDB.crisis_id)
        .join(FlightDB, FlightDB.id == CrisisDB.affected_flight_id)
        .where(DecisionDB.status == "PENDING")
        .order_by(PassengerDB.loyalty_tier.desc())
        .limit(limit)
    )
    rows = result.all()

    passengers = []
    for pax, decision, crisis, flight in rows:
        passengers.append({
            "passenger_id": pax.id,
            "pnr": pax.pnr,
            "name": f"{pax.first_name} {pax.last_name}",
            "ticket_class": pax.ticket_class,
            "loyalty_tier": pax.loyalty_tier,
            "special_needs": pax.special_needs,
            "flight_number": flight.flight_number,
            "origin": flight.origin,
            "destination": flight.destination,
            "crisis_type": crisis.crisis_type,
            "crisis_severity": crisis.severity,
            "recommended_action": decision.action,
            "compensation_eur": decision.compensation_amount_eur,
            "hotel": decision.hotel_name,
            "decision_status": decision.status,
            "agent_confidence": decision.agent_confidence,
        })

    return {"count": len(passengers), "passengers": passengers}


@router.get("/passengers/{pnr}")
async def get_passenger_detail(pnr: str, db: AsyncSession = Depends(get_db)):
    """PCC: Full passenger profile with all decisions and current flight status."""
    result = await db.execute(select(PassengerDB).where(PassengerDB.pnr == pnr))
    pax = result.scalar_one_or_none()
    if not pax:
        raise HTTPException(status_code=404, detail=f"Passenger PNR {pnr} not found")

    decisions_result = await db.execute(
        select(DecisionDB).where(DecisionDB.passenger_id == pax.id)
        .order_by(DecisionDB.created_at.desc())
    )
    decisions = decisions_result.scalars().all()

    return {
        "passenger": {
            "id": pax.id,
            "pnr": pax.pnr,
            "name": f"{pax.first_name} {pax.last_name}",
            "email": pax.email,
            "phone": pax.phone,
            "ticket_class": pax.ticket_class,
            "loyalty_tier": pax.loyalty_tier,
            "special_needs": pax.special_needs,
            "booking_reference": pax.booking_reference,
        },
        "decisions": [
            {
                "id": d.id,
                "crisis_id": d.crisis_id,
                "action": d.action,
                "new_flight_id": d.new_flight_id,
                "compensation_eur": d.compensation_amount_eur,
                "hotel": d.hotel_name,
                "status": d.status,
                "confidence": d.agent_confidence,
                "reasoning": d.agent_reasoning,
                "created_at": d.created_at.isoformat(),
            }
            for d in decisions
        ],
    }


@router.get("/summary")
async def pcc_summary(db: AsyncSession = Depends(get_db)):
    """PCC Dashboard KPIs: pending actions, compensations, special-needs count."""
    pending = await db.scalar(
        select(func.count(DecisionDB.id)).where(DecisionDB.status == "PENDING")
    )
    executed = await db.scalar(
        select(func.count(DecisionDB.id)).where(DecisionDB.status == "EXECUTED")
    )
    total_comp = await db.scalar(
        select(func.sum(DecisionDB.compensation_amount_eur))
        .where(DecisionDB.status == "EXECUTED")
    ) or 0.0
    active_crises = await db.scalar(
        select(func.count(CrisisDB.id)).where(CrisisDB.status == "ACTIVE")
    )

    return {
        "pending_decisions": pending or 0,
        "executed_decisions": executed or 0,
        "total_compensation_paid_eur": round(total_comp, 2),
        "active_crises": active_crises or 0,
    }
