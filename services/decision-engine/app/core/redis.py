"""Redis connection pool and helpers."""
import json
from typing import Any

import redis.asyncio as aioredis

from app.config import settings

_pool: aioredis.ConnectionPool | None = None


def _get_pool() -> aioredis.ConnectionPool:
    global _pool
    if _pool is None:
        _pool = aioredis.ConnectionPool.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=20,
        )
    return _pool


def get_redis() -> aioredis.Redis:
    return aioredis.Redis(connection_pool=_get_pool())


async def cache_get(key: str) -> Any | None:
    try:
        r = get_redis()
        val = await r.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None


async def cache_set(key: str, value: Any, ttl: int = 30) -> None:
    try:
        r = get_redis()
        await r.set(key, json.dumps(value, default=str), ex=ttl)
    except Exception:
        pass


async def cache_delete(key: str) -> None:
    try:
        r = get_redis()
        await r.delete(key)
    except Exception:
        pass


async def cache_invalidate_prefix(prefix: str) -> None:
    """Delete all keys matching prefix:*"""
    try:
        r = get_redis()
        async for key in r.scan_iter(f"{prefix}:*"):
            await r.delete(key)
    except Exception:
        pass
