"""JetNexus AI — Decision Engine Entry Point."""

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routes.hub_control import router as hub_router
from app.api.routes.iocc import router as iocc_router
from app.api.routes.pcc import router as pcc_router
from app.api.routes.revenue import router as revenue_router
from app.api.routes.simulation import router as simulation_router
from app.api.routes.prediction import router as prediction_router
from app.api.routes.self_service import router as self_service_router
from app.api.routes.auth import router as auth_router
from app.api.routes.pss import router as pss_router
from app.api.routes.flight_data import router as flight_data_router
from app.api.routes.vouchers import router as vouchers_router
from app.api.routes.cost_model import router as cost_model_router
from app.api.routes.gate import router as gate_router
from app.api.routes.call_center import router as call_center_router
from app.api.routes.departure_hold import router as departure_hold_router
from app.api.routes.proactive import router as proactive_router
from app.config import settings
from app.db.database import Base, engine, get_db
from app.db.models import AuditLogDB, CrisisDB, DecisionDB, FlightDB, PassengerDB
from app.db.seed import seed_data
from app.models.crisis import CrisisEvent, CrisisSeverity, CrisisType
from app.models.decision import Decision
from app.models.flight import Flight
from app.models.passenger import Passenger
from app.services.crisis_service import CrisisService

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "JetNexus AI — Autonomous Aviation Crisis Management System. "
        "Powered by MILP optimization, EU261 regulation engine, and multi-agent AI."
    ),
    version=settings.APP_VERSION,
    debug=settings.APP_DEBUG,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Layer 4 Routers ───────────────────────────────────────
app.include_router(pcc_router)
app.include_router(hub_router)
app.include_router(iocc_router)
app.include_router(revenue_router)
app.include_router(simulation_router)
app.include_router(prediction_router)
app.include_router(self_service_router)
app.include_router(auth_router)
app.include_router(pss_router)
app.include_router(flight_data_router)
app.include_router(vouchers_router)
app.include_router(cost_model_router)
app.include_router(gate_router)
app.include_router(call_center_router)
app.include_router(departure_hold_router)
app.include_router(proactive_router)

# ── CORS ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Create DB tables, seed demo data, and start background jobs."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSession(engine) as session:
        await seed_data(session)
    from app.integrations.scheduler import start_scheduler, seed_act_tracker
    start_scheduler()
    await seed_act_tracker()


@app.on_event("shutdown")
async def shutdown_event():
    from app.integrations.scheduler import scheduler
    if scheduler.running:
        scheduler.shutdown(wait=False)

# ═══════════════════════════════════════════════════════════
# HEALTH
# ═══════════════════════════════════════════════════════════

@app.get("/health", tags=["health"], status_code=status.HTTP_200_OK)
async def health_check():
    """Liveness probe — returns 200 if the service is running."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
    }


@app.get("/health/ready", tags=["health"])
async def readiness_check():
    """Readiness probe — verifies the database is reachable."""
    from sqlalchemy import text
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    return {
        "ready": db_ok,
        "checks": {"database": "ok" if db_ok else "error"},
    }

# ═══════════════════════════════════════════════════════════
# CRISIS ENDPOINTS
# ═══════════════════════════════════════════════════════════

@app.post(
    "/api/v1/crisis/trigger",
    response_model=CrisisEvent,
    status_code=status.HTTP_201_CREATED,
    tags=["crisis"],
    summary="Trigger a new flight crisis",
)
async def trigger_crisis(
    flight_number: str,
    crisis_type: CrisisType,
    reason: str,
    severity: CrisisSeverity = CrisisSeverity.MEDIUM,
    db: AsyncSession = Depends(get_db),
):
    """Trigger a crisis event for a flight.

    The system will:
    1. Mark the flight as cancelled/delayed
    2. Identify affected passengers
    3. Run MILP optimization to find best rebooking
    4. Generate AI decisions for each passenger
    5. Calculate EU261 compensation amounts
    """
    try:
        crisis = await CrisisService.trigger_crisis(
            session=db,
            flight_number=flight_number,
            crisis_type=crisis_type,
            reason=reason,
            severity=severity,
        )
        return crisis
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get(
    "/api/v1/crisis/active",
    response_model=list[CrisisEvent],
    tags=["crisis"],
    summary="List all active crises",
)
async def get_active_crises(db: AsyncSession = Depends(get_db)):
    """Return all crises currently in ACTIVE status."""
    from sqlalchemy import select

    from app.models.crisis import CrisisStatus
    result = await db.execute(
        select(CrisisDB).where(CrisisDB.status == CrisisStatus.ACTIVE)
    )
    return [CrisisEvent.model_validate(c) for c in result.scalars().all()]


@app.get(
    "/api/v1/crisis",
    response_model=list[CrisisEvent],
    tags=["crisis"],
    summary="List all crises",
)
async def list_all_crises(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Return all crises with pagination."""
    from sqlalchemy import select
    result = await db.execute(
        select(CrisisDB).offset(skip).limit(limit).order_by(CrisisDB.triggered_at.desc())
    )
    return [CrisisEvent.model_validate(c) for c in result.scalars().all()]


@app.get(
    "/api/v1/crisis/{crisis_id}",
    response_model=CrisisEvent,
    tags=["crisis"],
    summary="Get a specific crisis",
)
async def get_crisis(crisis_id: int, db: AsyncSession = Depends(get_db)):
    """Get details of a specific crisis by ID."""
    from sqlalchemy import select
    result = await db.execute(select(CrisisDB).where(CrisisDB.id == crisis_id))
    crisis = result.scalar_one_or_none()
    if not crisis:
        raise HTTPException(status_code=404, detail=f"Crisis {crisis_id} not found")
    return CrisisEvent.model_validate(crisis)


@app.post(
    "/api/v1/crisis/{crisis_id}/approve",
    tags=["crisis"],
    summary="Approve all decisions for a crisis (Human-in-the-Loop)",
)
async def approve_crisis_decisions(crisis_id: int, db: AsyncSession = Depends(get_db)):
    """Human-in-the-Loop approval — marks all pending decisions as approved
    and triggers passenger notifications."""
    success = await CrisisService.approve_decisions(db, crisis_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not approve decisions.")
    return {"message": "All recovery decisions approved and executed successfully.", "crisis_id": crisis_id}


@app.get(
    "/api/v1/crisis/{crisis_id}/decisions",
    response_model=list[Decision],
    tags=["crisis"],
    summary="Get all decisions for a crisis",
)
async def get_crisis_decisions(crisis_id: int, db: AsyncSession = Depends(get_db)):
    """Return all AI-generated decisions for a specific crisis."""
    from sqlalchemy import select
    result = await db.execute(
        select(DecisionDB).where(DecisionDB.crisis_id == crisis_id)
    )
    return [Decision.model_validate(d) for d in result.scalars().all()]


@app.get(
    "/api/v1/crisis/{crisis_id}/audit",
    tags=["crisis"],
    summary="Get audit log for a crisis",
)
async def get_crisis_audit(crisis_id: int, db: AsyncSession = Depends(get_db)):
    """Return the full audit trail for a specific crisis."""
    from sqlalchemy import select
    result = await db.execute(
        select(AuditLogDB).where(AuditLogDB.crisis_id == crisis_id)
        .order_by(AuditLogDB.created_at)
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "agent": log.agent_name,
            "action": log.action,
            "details": log.details,
            "confidence": log.confidence,
            "timestamp": log.created_at.isoformat(),
        }
        for log in logs
    ]

# ═══════════════════════════════════════════════════════════
# FLIGHTS ENDPOINTS
# ═══════════════════════════════════════════════════════════

@app.get(
    "/api/v1/flights",
    response_model=list[Flight],
    tags=["flights"],
    summary="List all flights",
)
async def get_flights(
    origin: str | None = None,
    destination: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """List flights with optional filtering by origin/destination."""
    from sqlalchemy import and_, select
    stmt = select(FlightDB)
    filters = []
    if origin:
        filters.append(FlightDB.origin == origin.upper())
    if destination:
        filters.append(FlightDB.destination == destination.upper())
    if filters:
        stmt = stmt.where(and_(*filters))
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [Flight.model_validate(f) for f in result.scalars().all()]


@app.get(
    "/api/v1/flights/{flight_id}",
    response_model=Flight,
    tags=["flights"],
    summary="Get a specific flight",
)
async def get_flight(flight_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(FlightDB).where(FlightDB.id == flight_id))
    flight = result.scalar_one_or_none()
    if not flight:
        raise HTTPException(status_code=404, detail=f"Flight {flight_id} not found")
    return Flight.model_validate(flight)


# ═══════════════════════════════════════════════════════════
# PASSENGERS ENDPOINTS
# ═══════════════════════════════════════════════════════════

@app.get(
    "/api/v1/passengers",
    response_model=list[Passenger],
    tags=["passengers"],
    summary="List all passengers",
)
async def get_passengers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """List all passengers in the system."""
    from sqlalchemy import select
    result = await db.execute(select(PassengerDB).offset(skip).limit(limit))
    return [Passenger.model_validate(p) for p in result.scalars().all()]


@app.get(
    "/api/v1/passengers/{passenger_id}",
    response_model=Passenger,
    tags=["passengers"],
    summary="Get a specific passenger",
)
async def get_passenger(passenger_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(PassengerDB).where(PassengerDB.id == passenger_id))
    pax = result.scalar_one_or_none()
    if not pax:
        raise HTTPException(status_code=404, detail=f"Passenger {passenger_id} not found")
    return Passenger.model_validate(pax)


# ═══════════════════════════════════════════════════════════
# STATS ENDPOINT (Dashboard)
# ═══════════════════════════════════════════════════════════

@app.get(
    "/api/v1/stats",
    tags=["dashboard"],
    summary="Get system-wide statistics for the dashboard",
)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Return aggregate statistics for the dashboard."""
    from sqlalchemy import func, select

    from app.models.crisis import CrisisStatus

    total_crises = await db.scalar(select(func.count(CrisisDB.id)))
    active_crises = await db.scalar(
        select(func.count(CrisisDB.id)).where(CrisisDB.status == CrisisStatus.ACTIVE)
    )
    resolved_crises = await db.scalar(
        select(func.count(CrisisDB.id)).where(CrisisDB.status == CrisisStatus.RESOLVED)
    )
    total_passengers = await db.scalar(select(func.count(PassengerDB.id)))
    total_flights = await db.scalar(select(func.count(FlightDB.id)))
    total_decisions = await db.scalar(select(func.count(DecisionDB.id)))
    total_compensation = await db.scalar(select(func.sum(DecisionDB.compensation_amount_eur))) or 0.0

    return {
        "crises": {
            "total": total_crises or 0,
            "active": active_crises or 0,
            "resolved": resolved_crises or 0,
        },
        "passengers": total_passengers or 0,
        "flights": total_flights or 0,
        "decisions": total_decisions or 0,
        "total_compensation_eur": round(total_compensation, 2),
    }
