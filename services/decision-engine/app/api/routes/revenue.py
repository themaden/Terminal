"""Revenue Management API — Layer 4: Cost and revenue impact analysis."""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import DecisionDB, CrisisDB, FlightDB, PassengerDB

router = APIRouter(prefix="/api/v1/revenue", tags=["revenue"])


@router.get("/impact/summary")
async def revenue_impact_summary(db: AsyncSession = Depends(get_db)):
    """Revenue Management: overall cost-impact summary across all crises."""
    total_compensation = await db.scalar(
        select(func.sum(DecisionDB.compensation_amount_eur))
        .where(DecisionDB.status == "EXECUTED")
    ) or 0.0

    pending_compensation = await db.scalar(
        select(func.sum(DecisionDB.compensation_amount_eur))
        .where(DecisionDB.status == "PENDING")
    ) or 0.0

    total_crises = await db.scalar(select(func.count(CrisisDB.id))) or 0
    resolved_crises = await db.scalar(
        select(func.count(CrisisDB.id)).where(CrisisDB.status == "RESOLVED")
    ) or 0
    active_crises = await db.scalar(
        select(func.count(CrisisDB.id)).where(CrisisDB.status == "ACTIVE")
    ) or 0

    # Rebooking decisions
    rebook_count = await db.scalar(
        select(func.count(DecisionDB.id)).where(
            DecisionDB.action.in_(["REBOOK", "REBOOK_SAME_CARRIER", "REBOOK_INTERLINE"])
        )
    ) or 0

    # Hotel decisions
    hotel_count = await db.scalar(
        select(func.count(DecisionDB.id)).where(DecisionDB.hotel_name.isnot(None))
    ) or 0

    # Average compensation per passenger
    avg_comp = await db.scalar(
        select(func.avg(DecisionDB.compensation_amount_eur))
        .where(DecisionDB.compensation_amount_eur > 0)
    ) or 0.0

    return {
        "compensation": {
            "paid_eur": round(float(total_compensation), 2),
            "pending_eur": round(float(pending_compensation), 2),
            "total_eur": round(float(total_compensation + pending_compensation), 2),
            "average_per_passenger_eur": round(float(avg_comp), 2),
        },
        "crises": {
            "total": total_crises,
            "active": active_crises,
            "resolved": resolved_crises,
        },
        "decisions": {
            "rebooked_passengers": rebook_count,
            "hotel_accommodations": hotel_count,
        },
    }


@router.get("/impact/by-crisis")
async def revenue_impact_by_crisis(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Revenue Management: cost breakdown per crisis."""
    result = await db.execute(
        select(
            CrisisDB.id,
            CrisisDB.crisis_type,
            CrisisDB.severity,
            CrisisDB.status,
            CrisisDB.triggered_at,
            CrisisDB.affected_passenger_count,
            FlightDB.flight_number,
            FlightDB.origin,
            FlightDB.destination,
            func.sum(DecisionDB.compensation_amount_eur).label("total_compensation"),
            func.count(DecisionDB.id).label("decision_count"),
        )
        .join(FlightDB, FlightDB.id == CrisisDB.affected_flight_id)
        .outerjoin(DecisionDB, DecisionDB.crisis_id == CrisisDB.id)
        .group_by(CrisisDB.id, FlightDB.id)
        .order_by(func.sum(DecisionDB.compensation_amount_eur).desc().nullslast())
        .limit(limit)
    )
    rows = result.all()

    return [
        {
            "crisis_id": row.id,
            "crisis_type": row.crisis_type,
            "severity": row.severity,
            "status": row.status,
            "triggered_at": row.triggered_at.isoformat(),
            "flight_number": row.flight_number,
            "route": f"{row.origin}→{row.destination}",
            "affected_passengers": row.affected_passenger_count,
            "total_compensation_eur": round(float(row.total_compensation or 0), 2),
            "decision_count": row.decision_count,
            "avg_compensation_eur": round(
                float(row.total_compensation or 0) / max(row.decision_count, 1), 2
            ),
        }
        for row in rows
    ]


@router.get("/impact/by-class")
async def revenue_impact_by_class(db: AsyncSession = Depends(get_db)):
    """Revenue Management: compensation breakdown segmented by ticket class."""
    result = await db.execute(
        select(
            PassengerDB.ticket_class,
            func.count(DecisionDB.id).label("count"),
            func.sum(DecisionDB.compensation_amount_eur).label("total_comp"),
            func.avg(DecisionDB.compensation_amount_eur).label("avg_comp"),
        )
        .join(PassengerDB, PassengerDB.id == DecisionDB.passenger_id)
        .where(DecisionDB.compensation_amount_eur > 0)
        .group_by(PassengerDB.ticket_class)
    )
    rows = result.all()

    return [
        {
            "ticket_class": row.ticket_class,
            "affected_count": row.count,
            "total_compensation_eur": round(float(row.total_comp or 0), 2),
            "avg_compensation_eur": round(float(row.avg_comp or 0), 2),
        }
        for row in rows
    ]


@router.get("/impact/by-loyalty")
async def revenue_impact_by_loyalty(db: AsyncSession = Depends(get_db)):
    """Revenue Management: compensation breakdown by loyalty tier."""
    result = await db.execute(
        select(
            PassengerDB.loyalty_tier,
            func.count(DecisionDB.id).label("count"),
            func.sum(DecisionDB.compensation_amount_eur).label("total_comp"),
        )
        .join(PassengerDB, PassengerDB.id == DecisionDB.passenger_id)
        .group_by(PassengerDB.loyalty_tier)
        .order_by(func.sum(DecisionDB.compensation_amount_eur).desc().nullslast())
    )
    rows = result.all()

    return [
        {
            "loyalty_tier": row.loyalty_tier,
            "affected_count": row.count,
            "total_compensation_eur": round(float(row.total_comp or 0), 2),
        }
        for row in rows
    ]


@router.get("/efficiency")
async def recovery_efficiency(db: AsyncSession = Depends(get_db)):
    """Revenue Management: AI decision efficiency metrics."""
    total = await db.scalar(select(func.count(DecisionDB.id))) or 0
    executed = await db.scalar(
        select(func.count(DecisionDB.id)).where(DecisionDB.status == "EXECUTED")
    ) or 0
    pending = await db.scalar(
        select(func.count(DecisionDB.id)).where(DecisionDB.status == "PENDING")
    ) or 0
    rejected = await db.scalar(
        select(func.count(DecisionDB.id)).where(DecisionDB.status == "REJECTED")
    ) or 0
    avg_confidence = await db.scalar(
        select(func.avg(DecisionDB.agent_confidence))
    ) or 0.0

    automation_rate = round((executed / total * 100) if total > 0 else 0, 1)

    return {
        "total_decisions": total,
        "executed": executed,
        "pending": pending,
        "rejected": rejected,
        "automation_rate_pct": automation_rate,
        "avg_agent_confidence": round(float(avg_confidence), 3),
    }
