"""WebSocket — gerçek zamanlı kriz ve uçuş güncellemeleri."""
import asyncio
import json
import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.core.redis import get_redis

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Thread-safe WebSocket bağlantı havuzu."""

    def __init__(self) -> None:
        # channel → set of websockets
        self._channels: dict[str, set[WebSocket]] = {}

    async def connect(self, ws: WebSocket, channel: str) -> None:
        await ws.accept()
        self._channels.setdefault(channel, set()).add(ws)
        logger.info("WS connect: channel=%s total=%d", channel, len(self._channels[channel]))

    def disconnect(self, ws: WebSocket, channel: str) -> None:
        ch = self._channels.get(channel, set())
        ch.discard(ws)
        logger.info("WS disconnect: channel=%s remaining=%d", channel, len(ch))

    async def broadcast(self, channel: str, payload: dict[str, Any]) -> None:
        dead: list[WebSocket] = []
        for ws in list(self._channels.get(channel, set())):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._channels.get(channel, set()).discard(ws)

    async def broadcast_all(self, payload: dict[str, Any]) -> None:
        for channel in list(self._channels):
            await self.broadcast(channel, payload)


manager = ConnectionManager()


# ── Kriz kanalı ──────────────────────────────────────────────────────────────
@router.websocket("/ws/crisis")
async def crisis_ws(
    websocket: WebSocket,
    token: str = Query(default=""),   # ?token=<jwt>  (optional for now)
):
    """
    Kriz güncellemelerini real-time gönderir.
    İstemci bağlanınca son durumu Redis'ten alır, sonra poll loop çalışır.
    """
    channel = "crisis"
    await manager.connect(websocket, channel)
    try:
        # İlk bağlantıda mevcut durumu gönder
        snapshot = await _get_crisis_snapshot()
        await websocket.send_json({"type": "snapshot", "data": snapshot, "ts": _now()})

        # Ping/pong döngüsü — istemci bağlantıyı canlı tutar
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if msg == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                # Heartbeat gönder
                await websocket.send_json({"type": "heartbeat", "ts": _now()})
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception as exc:
        logger.exception("WS error: %s", exc)
        manager.disconnect(websocket, channel)


# ── Uçuş takip kanalı ────────────────────────────────────────────────────────
@router.websocket("/ws/flights")
async def flights_ws(websocket: WebSocket):
    """Aktif uçuş pozisyon güncellemeleri."""
    channel = "flights"
    await manager.connect(websocket, channel)
    try:
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if msg == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "heartbeat", "ts": _now()})
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)


# ── Yayın yardımcıları (diğer route'lardan çağrılır) ─────────────────────────
async def push_crisis_update(crisis_data: dict[str, Any]) -> None:
    """Kriz değiştiğinde tüm bağlı istemcilere bildir."""
    await manager.broadcast("crisis", {
        "type": "crisis_update",
        "data": crisis_data,
        "ts": _now(),
    })


async def push_flight_update(flight_data: dict[str, Any]) -> None:
    """Uçuş durumu değiştiğinde gönder."""
    await manager.broadcast("flights", {
        "type": "flight_update",
        "data": flight_data,
        "ts": _now(),
    })


# ── Yardımcılar ───────────────────────────────────────────────────────────────
def _now() -> str:
    return datetime.utcnow().isoformat() + "Z"


async def _get_crisis_snapshot() -> dict[str, Any]:
    """Redis'ten mevcut kriz özetini al; yoksa boş döndür."""
    try:
        r = get_redis()
        raw = await r.get("crisis:snapshot")
        return json.loads(raw) if raw else {"active_crises": [], "pending_approvals": 0}
    except Exception:
        return {"active_crises": [], "pending_approvals": 0}
