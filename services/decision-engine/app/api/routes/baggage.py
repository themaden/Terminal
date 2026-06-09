"""
Bagaj Uzlaştırma Modülü — Doküman §4.3
──────────────────────────────────────
Doküman: "Yolcu yeni uçağa biner ama bagajı eski uçakta kalırsa kriz çözülmemiştir.
Yolcu yeniden rezerve edildiği an bagaj sistemine otomatik yönlendirme emri gider;
her çanta-yolcu eşleşmesi gerçek zamanlı tutulur ve IATA Resolution 753 uyumu için
yaşam döngüsü loglanır."
"""
import random
import hashlib
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import PassengerDB, FlightDB, DecisionDB, CrisisDB

router = APIRouter(prefix="/api/v1/baggage", tags=["baggage"])

# ── Simüle edilmiş bagaj durumu havuzu ───────────────────────────────────────

_BAG_STATUSES = [
    "CHECKED_IN",        # check-in yapıldı
    "SCREENING",         # güvenlik taraması
    "LOADED",            # uçağa yüklendi
    "IN_TRANSIT",        # aktarmada
    "OFFLOADED",         # indirildi (risk)
    "MISROUTED",         # yanlış uçuşa gönderildi
    "DELIVERED",         # teslim edildi
    "MISSING",           # kayıp
]

_OFFLOAD_REASONS = [
    "Yolcu son anda rebooking — bagaj eski uçakta",
    "Güvenlik taraması tamamlanamadı",
    "Kapasite aşımı — bagaj sonraki sefer",
    "Teknik gereklilik — uçak ağırlık dengesi",
]


def _bag_tag(pnr: str, flight: str) -> str:
    h = hashlib.md5(f"{pnr}{flight}".encode()).hexdigest()[:6].upper()
    return f"IST{h}"


def _simulate_bag(pnr: str, flight_number: str, rebooked: bool = False) -> dict:
    seed = int(hashlib.md5(f"{pnr}{flight_number}".encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)

    if rebooked:
        status = rng.choice(["OFFLOADED", "IN_TRANSIT", "LOADED", "OFFLOADED"])
    else:
        status = rng.choice(["LOADED", "LOADED", "IN_TRANSIT", "CHECKED_IN", "OFFLOADED"])

    at_risk = status in ("OFFLOADED", "MISROUTED", "MISSING")
    return {
        "bag_tag": _bag_tag(pnr, flight_number),
        "pnr": pnr,
        "original_flight": flight_number,
        "status": status,
        "at_risk": at_risk,
        "offload_reason": rng.choice(_OFFLOAD_REASONS) if status == "OFFLOADED" else None,
        "location": f"IST T{rng.randint(1,3)} Belt {rng.randint(1,20)}" if status == "DELIVERED" else "IST Hub BHS",
        "last_scan": (datetime.utcnow() - timedelta(minutes=rng.randint(2, 60))).isoformat(),
        "iata_753_tracked": True,
    }


# In-memory routing orders (production'da BRS/DCS'e yazılır)
_routing_orders: dict[str, dict] = {}


class BagStatus(BaseModel):
    bag_tag: str
    pnr: str
    original_flight: str
    status: str
    at_risk: bool
    offload_reason: Optional[str]
    location: str
    last_scan: str
    iata_753_tracked: bool


class BagRoutingOrder(BaseModel):
    bag_tag: str
    pnr: str
    from_flight: str
    to_flight: str
    issued_at: str
    priority: str       # URGENT | NORMAL
    reason: str
    status: str         # PENDING | EXECUTED | FAILED


class ReconciliationReport(BaseModel):
    crisis_id: int
    total_passengers: int
    bags_tracked: int
    bags_at_risk: int
    routing_orders_issued: int
    iata_753_compliant: bool
    reconciliation_time_seconds: float
    actions: list[dict]
    generated_at: str


@router.get("/status/{pnr}", response_model=BagStatus)
async def get_bag_status(pnr: str, db: AsyncSession = Depends(get_db)):
    """Yolcu PNR'ına göre bagaj durumu ve IATA 753 takip kaydı."""
    result = await db.execute(select(PassengerDB).where(PassengerDB.pnr == pnr.upper()))
    pax = result.scalar_one_or_none()
    if not pax:
        raise HTTPException(status_code=404, detail=f"PNR {pnr} bulunamadı")

    # Son decision var mı — rebooking oldu mu?
    dec_result = await db.execute(
        select(DecisionDB).where(DecisionDB.passenger_id == pax.id)
        .order_by(DecisionDB.created_at.desc()).limit(1)
    )
    decision = dec_result.scalar_one_or_none()
    rebooked = decision is not None

    flight_num = "TK1981"
    if rebooked and decision.new_flight_id:
        fr = await db.execute(select(FlightDB).where(FlightDB.id == decision.new_flight_id))
        nf = fr.scalar_one_or_none()
        if nf:
            flight_num = nf.flight_number

    bag = _simulate_bag(pax.pnr, flight_num, rebooked=rebooked)
    return BagStatus(**bag)


@router.post("/reroute", response_model=BagRoutingOrder)
async def reroute_bag(
    pnr: str,
    from_flight: str,
    to_flight: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Yolcu rebooking'i sonrası bagajı yeni uçuşa yönlendir.
    Doküman: "Yolcu yeniden rezerve edildiği an bagaj sistemine otomatik yönlendirme emri gider."
    """
    result = await db.execute(select(PassengerDB).where(PassengerDB.pnr == pnr.upper()))
    pax = result.scalar_one_or_none()
    if not pax:
        raise HTTPException(status_code=404, detail=f"PNR {pnr} bulunamadı")

    bag_tag = _bag_tag(pnr.upper(), from_flight)
    order = BagRoutingOrder(
        bag_tag=bag_tag,
        pnr=pnr.upper(),
        from_flight=from_flight.upper(),
        to_flight=to_flight.upper(),
        issued_at=datetime.utcnow().isoformat(),
        priority="URGENT",
        reason=f"Yolcu {pnr} rebooking: {from_flight} → {to_flight}",
        status="PENDING",
    )
    _routing_orders[bag_tag] = order.model_dump()
    return order


@router.get("/routing-orders", summary="Aktif bagaj yönlendirme emirleri")
async def list_routing_orders(status: Optional[str] = Query(default=None)):
    orders = list(_routing_orders.values())
    if status:
        orders = [o for o in orders if o["status"] == status.upper()]
    return {"total": len(orders), "orders": orders}


@router.post("/reconcile/{crisis_id}", response_model=ReconciliationReport)
async def reconcile_crisis_baggage(crisis_id: int, db: AsyncSession = Depends(get_db)):
    """
    Kriz sonrası tüm etkilenen yolcuların bagajını uzlaştır.
    IATA Resolution 753 uyumu: her çanta için yaşam döngüsü kaydı.
    """
    from app.db.models import CrisisDB
    crisis_result = await db.execute(select(CrisisDB).where(CrisisDB.id == crisis_id))
    crisis = crisis_result.scalar_one_or_none()
    if not crisis:
        raise HTTPException(status_code=404, detail=f"Kriz {crisis_id} bulunamadı")

    dec_result = await db.execute(
        select(DecisionDB, PassengerDB, FlightDB)
        .join(PassengerDB, DecisionDB.passenger_id == PassengerDB.id)
        .outerjoin(FlightDB, DecisionDB.new_flight_id == FlightDB.id)
        .where(DecisionDB.crisis_id == crisis_id)
    )
    rows = dec_result.all()

    original_flight_result = await db.execute(
        select(FlightDB).where(FlightDB.id == crisis.affected_flight_id)
    )
    original_flight = original_flight_result.scalar_one_or_none()
    orig_fn = original_flight.flight_number if original_flight else "UNKNOWN"

    start = datetime.utcnow()
    actions = []
    at_risk = 0
    orders_issued = 0

    for decision, pax, new_flight in rows:
        bag = _simulate_bag(pax.pnr, orig_fn, rebooked=(new_flight is not None))
        if bag["at_risk"]:
            at_risk += 1
        if new_flight and bag["status"] == "OFFLOADED":
            bag_tag = _bag_tag(pax.pnr, orig_fn)
            _routing_orders[bag_tag] = {
                "bag_tag": bag_tag,
                "pnr": pax.pnr,
                "from_flight": orig_fn,
                "to_flight": new_flight.flight_number,
                "issued_at": datetime.utcnow().isoformat(),
                "priority": "URGENT",
                "reason": f"Kriz {crisis_id} rebooking — bagaj otomatik yönlendirme",
                "status": "PENDING",
            }
            orders_issued += 1
            actions.append({
                "pnr": pax.pnr,
                "bag_tag": bag_tag,
                "action": "AUTO_REROUTE",
                "from": orig_fn,
                "to": new_flight.flight_number,
                "iata_753_event": "OFFLOAD_TRANSFER",
            })
        else:
            actions.append({
                "pnr": pax.pnr,
                "bag_tag": _bag_tag(pax.pnr, orig_fn),
                "action": "STATUS_OK" if not bag["at_risk"] else "MANUAL_INTERVENTION",
                "bag_status": bag["status"],
                "iata_753_event": "LIFECYCLE_LOG",
            })

    elapsed = (datetime.utcnow() - start).total_seconds()

    return ReconciliationReport(
        crisis_id=crisis_id,
        total_passengers=len(rows),
        bags_tracked=len(rows),
        bags_at_risk=at_risk,
        routing_orders_issued=orders_issued,
        iata_753_compliant=True,
        reconciliation_time_seconds=round(elapsed, 3),
        actions=actions,
        generated_at=datetime.utcnow().isoformat(),
    )
