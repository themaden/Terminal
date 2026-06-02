"""Health check route — used by Docker, Kubernetes, and load balancers."""
from datetime import UTC, datetime

from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check():
    """Liveness probe — returns 200 if the service is running."""
    return {
        "status": "healthy",
        "service": "decision-engine",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/ready")
async def readiness_check():
    """Readiness probe — verifies DB and dependencies are reachable."""
    from app.db.database import engine
    try:
        async with engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {e}"

    all_ok = db_status == "ok"
    return {
        "ready": all_ok,
        "checks": {
            "database": db_status,
        },
        "timestamp": datetime.now(UTC).isoformat(),
    }
