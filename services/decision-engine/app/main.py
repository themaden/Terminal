from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.config import settings
from app.db.database import Base, engine, get_db
from app.db.seed import seed_data
from app.models.crisis import CrisisEvent, CrisisType, CrisisSeverity
from app.models.decision import Decision
from app.models.flight import Flight
from app.models.passenger import Passenger
from app.services.crisis_service import CrisisService
from app.db.models import FlightDB, PassengerDB, DecisionDB, CrisisDB

app = FastAPI(
    title=settings.APP_NAME,
    description="Aero-Agent Decision Engine - Aviation Crisis & Recovery System",
    version=settings.APP_VERSION,
    debug=settings.APP_DEBUG
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Automatically create tables in local development sqlite/postgres
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Auto-seed database
    async with engine.connect() as conn:
        # Check if seed is needed
        async with AsyncSession(engine) as session:
            await seed_data(session)

# ── Health Endpoint ───────────────────────
@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV
    }

# ── API Endpoints ─────────────────────────

# Trigger Crisis
@app.post("/api/v1/crisis/trigger", response_model=CrisisEvent, status_code=status.HTTP_201_CREATED)
async def trigger_crisis(
    flight_number: str,
    crisis_type: CrisisType,
    reason: str,
    severity: CrisisSeverity = CrisisSeverity.MEDIUM,
    db: AsyncSession = Depends(get_db)
):
    try:
        crisis = await CrisisService.trigger_crisis(
            session=db,
            flight_number=flight_number,
            crisis_type=crisis_type,
            reason=reason,
            severity=severity
        )
        return crisis
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Approve decisions (HITL)
@app.post("/api/v1/crisis/{id}/approve", status_code=status.HTTP_200_OK)
async def approve_crisis_decisions(id: int, db: AsyncSession = Depends(get_db)):
    success = await CrisisService.approve_decisions(db, id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not approve decisions.")
    return {"message": "All recovery decisions approved and executed successfully."}

# Get active crises
@app.get("/api/v1/crisis/active", response_model=List[CrisisEvent])
async def get_active_crises(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.db.models import CrisisDB
    from app.models.crisis import CrisisStatus
    
    result = await db.execute(
        select(CrisisDB).where(CrisisDB.status == CrisisStatus.ACTIVE)
    )
    return [CrisisEvent.model_validate(c) for c in result.scalars().all()]

# Get decisions for a crisis
@app.get("/api/v1/crisis/{id}/decisions", response_model=List[Decision])
async def get_crisis_decisions(id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.db.models import DecisionDB
    
    result = await db.execute(
        select(DecisionDB).where(DecisionDB.crisis_id == id)
    )
    return [Decision.model_validate(d) for d in result.scalars().all()]

# Get all flights
@app.get("/api/v1/flights", response_model=List[Flight])
async def get_flights(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(FlightDB))
    return [Flight.model_validate(f) for f in result.scalars().all()]

# Get all passengers
@app.get("/api/v1/passengers", response_model=List[Passenger])
async def get_passengers(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(PassengerDB))
    return [Passenger.model_validate(p) for p in result.scalars().all()]
