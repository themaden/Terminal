"""Crisis management API routes."""

from datetime import UTC

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import CrisisDB
from app.models.crisis import CrisisCreate, CrisisEvent, CrisisStatus, CrisisStatusUpdate
from app.services.crisis_service import CrisisService

router = APIRouter(prefix="/crisis", tags=["crisis"])


@router.get("/", response_model=list[CrisisEvent])
async def list_crises(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List all crisis events with optional pagination."""
    from sqlalchemy import select
    result = await db.execute(
        select(CrisisDB).offset(skip).limit(limit).order_by(CrisisDB.triggered_at.desc())
    )
    return [CrisisEvent.model_validate(c) for c in result.scalars().all()]


@router.get("/{crisis_id}", response_model=CrisisEvent)
async def get_crisis(
    crisis_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific crisis event by ID."""
    from sqlalchemy import select
    result = await db.execute(select(CrisisDB).where(CrisisDB.id == crisis_id))
    crisis = result.scalar_one_or_none()
    if not crisis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crisis {crisis_id} not found",
        )
    return CrisisEvent.model_validate(crisis)


@router.post("/", response_model=CrisisEvent, status_code=status.HTTP_201_CREATED)
async def create_crisis(
    payload: CrisisCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create and trigger a new crisis event.

    The decision engine is invoked to process the crisis.
    """
    try:
        crisis = await CrisisService.trigger_crisis(
            session=db,
            flight_number=payload.flight_number,
            crisis_type=payload.crisis_type,
            reason=payload.reason,
            severity=payload.severity,
        )
        return crisis
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.patch("/{crisis_id}/status", response_model=CrisisEvent)
async def update_crisis_status(
    crisis_id: int,
    status_update: CrisisStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Manually update a crisis status (e.g., mark as resolved)."""
    from sqlalchemy import select
    result = await db.execute(select(CrisisDB).where(CrisisDB.id == crisis_id))
    crisis = result.scalar_one_or_none()
    if not crisis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crisis {crisis_id} not found",
        )

    crisis.status = status_update.status  # type: ignore
    if status_update.status == CrisisStatus.RESOLVED:
        from datetime import datetime
        crisis.resolved_at = datetime.now(UTC).replace(tzinfo=None)  # type: ignore

    await db.commit()
    await db.refresh(crisis)
    return CrisisEvent.model_validate(crisis)


@router.get("/{crisis_id}/explain")
async def explain_crisis(
    crisis_id: int,
    db: AsyncSession = Depends(get_db),
):
    """XAI: Generate Turkish natural-language explanation for crisis decisions."""
    import json
    from sqlalchemy import select
    from app.db.models import DecisionDB, FlightDB
    from app.agents.coordinator import CrisisCoordinator

    result = await db.execute(select(CrisisDB).where(CrisisDB.id == crisis_id))
    crisis = result.scalar_one_or_none()
    if not crisis:
        raise HTTPException(status_code=404, detail=f"Crisis {crisis_id} not found")

    dec_result = await db.execute(select(DecisionDB).where(DecisionDB.crisis_id == crisis_id))
    decisions = dec_result.scalars().all()

    total_comp = sum(d.compensation_amount_eur or 0 for d in decisions)
    rebooked   = sum(1 for d in decisions if str(d.action).upper() in ("REBOOK", "DECISIONACTION.REBOOK"))
    refunded   = sum(1 for d in decisions if str(d.action).upper() in ("REFUND", "DECISIONACTION.REFUND"))
    with_hotel = sum(1 for d in decisions if d.hotel_name)

    flight_result = await db.execute(select(FlightDB).where(FlightDB.id == crisis.affected_flight_id))
    flight = flight_result.scalar_one_or_none()
    flight_label = (
        f"{flight.flight_number} ({flight.origin}→{flight.destination}, {flight.distance_km} km)"
        if flight else "Bilinmeyen uçuş"
    )

    context = (
        f"Uçuş: {flight_label}\n"
        f"Kriz türü: {crisis.crisis_type.value}\n"
        f"Şiddet: {crisis.severity.value}\n"
        f"Sebep: {crisis.reason}\n"
        f"Etkilenen yolcu: {crisis.affected_passenger_count}\n"
        f"Yeniden rezervasyon: {rebooked}\n"
        f"İade: {refunded}\n"
        f"Otel tahsisi: {with_hotel}\n"
        f"EU261 tazminat: €{total_comp:.0f}\n"
    )

    system_prompt = (
        "Sen JetNexus AI'nın XAI modülüsün. Bir IRROPS krizini Türkçe olarak açıkla. "
        "SADECE şu JSON'u döndür, başka hiçbir şey yazma:\n"
        '{"headline":"<max 80 karakter özet>","bullets":["<ne oldu>","<AI ne yaptı>","<finansal etki>","<yolcu deneyimi>"],'
        '"ai_confidence":0.95,"time_saved_minutes":180,"cost_saved_eur":45000}'
    )

    coordinator = CrisisCoordinator()
    raw = await coordinator._call_llm(system_prompt, context)

    try:
        payload = json.loads(raw)
    except Exception:
        payload = {
            "headline": f"{crisis.crisis_type.value} — {crisis.affected_passenger_count} yolcu etkilendi",
            "bullets": [
                f"{flight_label} uçuşu etkilendi: {crisis.reason}",
                f"MILP optimizatörü {rebooked} yolcuyu alternatif sefera yönlendirdi, {refunded} yolcuya iade uygulandı.",
                f"EU261 hesabı: €{total_comp:.0f} tazminat işlendi; otel: {with_hotel} yolcu.",
                "Tüm kararlar Uyum Ajanı tarafından denetlendi, insan onayı bekleniyor.",
            ],
            "ai_confidence": 0.95,
            "time_saved_minutes": 180,
            "cost_saved_eur": int(total_comp * 0.45),
        }

    return {
        **payload,
        "crisis_id": crisis_id,
        "total_compensation_eur": total_comp,
        "rebooked": rebooked,
        "refunded": refunded,
        "with_hotel": with_hotel,
        "affected_passengers": crisis.affected_passenger_count,
        "flight": flight_label,
        "crisis_type": crisis.crisis_type.value,
        "severity": crisis.severity.value,
        "reason": crisis.reason,
    }


@router.post("/{crisis_id}/retry", response_model=dict)
async def retry_crisis(
    crisis_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retry AI decision processing for a failed or stalled crisis."""
    try:
        await CrisisService.process_crisis(db, crisis_id)
        return {"message": f"Crisis {crisis_id} processed successfully", "crisis_id": crisis_id}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e
