"""Amadeus API client — sandbox-first, graceful mock fallback."""
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

_client = None


def get_amadeus_client():
    """Return singleton Amadeus client, or None if not configured."""
    global _client
    if _client is not None:
        return _client
    if not settings.AMADEUS_CLIENT_ID or settings.AMADEUS_CLIENT_ID == "sandbox_client_id":
        logger.warning("Amadeus credentials not configured — using mock data")
        return None
    try:
        from amadeus import Client, ResponseError  # noqa: F401
        _client = Client(
            client_id=settings.AMADEUS_CLIENT_ID,
            client_secret=settings.AMADEUS_CLIENT_SECRET,
            hostname="test",  # sandbox
            log_level="warning",
        )
        logger.info("Amadeus sandbox client initialized")
        return _client
    except Exception as exc:
        logger.error("Failed to init Amadeus client: %s", exc)
        return None
