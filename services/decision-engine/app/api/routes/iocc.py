"""IOCC (Integrated Operations Control Center) API — Layer 4: Ops Control."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import CrisisDB, DecisionDB, FlightDB, AuditLogDB
from app.rules.irrops_engine import (
    IRROPSEngine, DisruptionType, FlightContext, PassengerContext
)

router = APIRouter(prefix="/api/v1/iocc", tags=["iocc"])

_irrops_engine = IRROPSEngine()


@router.get("/dashboard")
async def iocc_dashboard(db: AsyncSession = Depends(get_db)):
    """IOCC main dashboard: active crises, pending approvals, fleet overview."""
    active_crises_result = await db.execute(
        select(CrisisDB, FlightDB)
        .join(FlightDB, FlightDB.id == CrisisDB.affected_flight_id)
        .where(CrisisDB.status == "ACTIVE")
        .order_by(CrisisDB.triggered_at.desc())
    )
    crises_rows = active_crises_result.all()

    pending_approvals = await db.scalar(
        select(func.count(DecisionDB.id)).where(DecisionDB.status == "PENDING")
    )
    total_affected_pax = await db.scalar(
        select(func.sum(CrisisDB.affected_passenger_count))
        .where(CrisisDB.status == "ACTIVE")
    ) or 0

    crises = []
    for crisis, flight in crises_rows:
        crises.append({
            "crisis_id": crisis.id,
            "crisis_type": crisis.crisis_type,
            "severity": crisis.severity,
            "flight_number": flight.flight_number,
            "origin": flight.origin,
            "destination": flight.destination,
            "affected_passengers": crisis.affected_passenger_count,
            "triggered_at": crisis.triggered_at.isoformat(),
            "reason": crisis.reason,
        })

    return {
        "active_crises": crises,
        "active_crisis_count": len(crises),
        "pending_approvals": pending_approvals or 0,
        "total_affected_passengers": int(total_affected_pax),
        "act_tracker": _irrops_engine.act_tracker.summary(),
    }


@router.post("/crisis/{crisis_id}/approve-all")
async def iocc_approve_all(crisis_id: int, db: AsyncSession = Depends(get_db)):
    """IOCC: Bulk-approve all pending decisions for a crisis (Human-in-the-Loop)."""
    crisis_result = await db.execute(select(CrisisDB).where(CrisisDB.id == crisis_id))
    crisis = crisis_result.scalar_one_or_none()
    if not crisis:
        raise HTTPException(status_code=404, detail=f"Crisis {crisis_id} not found")

    await db.execute(
        update(DecisionDB)
        .where(and_(DecisionDB.crisis_id == crisis_id, DecisionDB.status == "PENDING"))
        .values(status="EXECUTED", updated_at=datetime.utcnow())
    )
    crisis.status = "RESOLVED"
    crisis.resolved_at = datetime.utcnow()

    log = AuditLogDB(
        crisis_id=crisis_id,
        agent_name="IOCC_OPERATOR",
        action="BULK_APPROVE",
        details=f"IOCC operator approved all decisions for crisis {crisis_id}",
        confidence=1.0,
    )
    db.add(log)
    await db.commit()

    return {"message": f"All decisions for crisis {crisis_id} approved.", "crisis_id": crisis_id}


@router.post("/crisis/{crisis_id}/reject-decision/{decision_id}")
async def iocc_reject_decision(
    crisis_id: int,
    decision_id: int,
    reason: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
):
    """IOCC: Reject a single AI decision and request re-evaluation."""
    result = await db.execute(
        select(DecisionDB).where(
            and_(DecisionDB.id == decision_id, DecisionDB.crisis_id == crisis_id)
        )
    )
    decision = result.scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision.status = "REJECTED"
    decision.updated_at = datetime.utcnow()

    log = AuditLogDB(
        crisis_id=crisis_id,
        agent_name="IOCC_OPERATOR",
        action="REJECT_DECISION",
        details=f"Decision {decision_id} rejected. Reason: {reason}",
        confidence=1.0,
    )
    db.add(log)
    await db.commit()

    return {"message": f"Decision {decision_id} rejected.", "reason": reason}


@router.post("/scenario/simulate")
async def simulate_scenario(
    flight_number: str,
    disruption_type: str,
    delay_minutes: int,
    db: AsyncSession = Depends(get_db),
):
    """IOCC: Scenario simulation — preview IRROPS impact without committing.

    Returns projected recovery recommendations and cost estimates WITHOUT
    writing to the database. Used for what-if analysis before triggering a crisis.
    """
    flight_result = await db.execute(
        select(FlightDB).where(FlightDB.flight_number == flight_number)
    )
    flight_db = flight_result.scalar_one_or_none()
    if not flight_db:
        raise HTTPException(status_code=404, detail=f"Flight {flight_number} not found")

    try:
        d_type = DisruptionType(disruption_type.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown disruption type: {disruption_type}")

    flight_ctx = FlightContext(
        flight_number=flight_db.flight_number,
        origin=flight_db.origin,
        destination=flight_db.destination,
        distance_km=flight_db.distance_km,
        disruption_type=d_type,
        delay_minutes=delay_minutes,
        scheduled_departure=flight_db.scheduled_departure,
        is_eu_departure=True,
    )

    # Dummy passenger contexts for simulation (use real passengers in production)
    dummy_passengers = [
        PassengerContext(passenger_id=0, pnr="SIM001", ticket_class="BUSINESS", loyalty_tier="GOLD"),
        PassengerContext(passenger_id=1, pnr="SIM002", ticket_class="ECONOMY", loyalty_tier="NONE"),
        PassengerContext(passenger_id=2, pnr="SIM003", ticket_class="FIRST", loyalty_tier="PLATINUM"),
    ]

    recommendations = _irrops_engine.evaluate(flight_ctx, dummy_passengers)
    total_est_cost = sum(r.eu261_compensation_eur for r in recommendations)

    return {
        "simulation": True,
        "flight_number": flight_number,
        "disruption_type": disruption_type,
        "delay_minutes": delay_minutes,
        "estimated_affected_passengers": flight_db.total_capacity - flight_db.available_seats,
        "estimated_eu261_cost_eur": total_est_cost,
        "sample_recommendations": [
            {
                "pnr": r.pnr,
                "action": r.recommended_action.value,
                "priority_score": r.priority_score,
                "compensation_eur": r.eu261_compensation_eur,
                "duty_meal": r.duty_of_care_meal,
                "duty_hotel": r.duty_of_care_hotel,
                "compliance_flags": r.compliance_flags,
                "reasoning": r.reasoning,
            }
            for r in recommendations
        ],
    }


@router.get("/audit/recent")
async def recent_audit_logs(limit: int = 20, db: AsyncSession = Depends(get_db)):
    """IOCC: Recent operator and agent actions for the audit panel."""
    result = await db.execute(
        select(AuditLogDB).order_by(AuditLogDB.created_at.desc()).limit(limit)
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "crisis_id": log.crisis_id,
            "agent": log.agent_name,
            "action": log.action,
            "details": log.details,
            "confidence": log.confidence,
            "timestamp": log.created_at.isoformat(),
        }
        for log in logs
    ]

from sqlalchemy import and_
