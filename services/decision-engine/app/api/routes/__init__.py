"""API Routes package."""
from .crisis import router as crisis_router
from .flights import router as flights_router
from .health import router as health_router

__all__ = ["crisis_router", "flights_router", "health_router"]
