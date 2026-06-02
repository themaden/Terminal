"""Crisis management API routes."""

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

    crisis.status = status_update.status
    if status_update.status == CrisisStatus.RESOLVED:
        from datetime import datetime
        crisis.resolved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(crisis)
    return CrisisEvent.model_validate(crisis)


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
