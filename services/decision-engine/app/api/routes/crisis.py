"""Crisis management API routes."""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.db.database import get_db
from app.db import models as db_models
from app.models.crisis import CrisisCreate, CrisisResponse, CrisisStatus
from app.services.crisis_service import CrisisService

router = APIRouter(prefix="/crisis", tags=["crisis"])


@router.get("/", response_model=List[CrisisResponse])
async def list_crises(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List all crisis events with optional pagination."""
    service = CrisisService(db)
    return await service.list_crises(skip=skip, limit=limit)


@router.get("/{crisis_id}", response_model=CrisisResponse)
async def get_crisis(
    crisis_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific crisis event by ID."""
    service = CrisisService(db)
    crisis = await service.get_crisis(crisis_id)
    if not crisis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crisis {crisis_id} not found",
        )
    return crisis


@router.post("/", response_model=CrisisResponse, status_code=status.HTTP_201_CREATED)
async def create_crisis(
    payload: CrisisCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Create and trigger a new crisis event.
    
    The decision engine is invoked as a background task so the response
    is returned immediately while AI agents process the crisis.
    """
    service = CrisisService(db)
    crisis = await service.create_crisis(payload)
    background_tasks.add_task(service.process_crisis, str(crisis.id))
    return crisis


@router.patch("/{crisis_id}/status", response_model=CrisisResponse)
async def update_crisis_status(
    crisis_id: str,
    status_update: CrisisStatus,
    db: AsyncSession = Depends(get_db),
):
    """Manually update a crisis status (e.g., mark as resolved)."""
    service = CrisisService(db)
    crisis = await service.update_status(crisis_id, status_update.status)
    if not crisis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crisis {crisis_id} not found",
        )
    return crisis


@router.post("/{crisis_id}/retry", response_model=dict)
async def retry_crisis(
    crisis_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Retry AI decision processing for a failed or stalled crisis."""
    service = CrisisService(db)
    crisis = await service.get_crisis(crisis_id)
    if not crisis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crisis {crisis_id} not found",
        )
    background_tasks.add_task(service.process_crisis, crisis_id)
    return {"message": f"Crisis {crisis_id} requeued for processing", "crisis_id": crisis_id}
