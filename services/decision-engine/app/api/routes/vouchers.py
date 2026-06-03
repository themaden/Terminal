"""
Voucher Automation Engine
─────────────────────────
THY Kriteri: "Bekleme süresine göre ikram, otel, transfer veya ücret iadesi"

Kural tablosu (IATA / EU261 referanslı):
  < 2  saat  → yok (EU261 eşiği altı)
  2-3  saat  → Yemek kuponu €10/kişi
  3-6  saat  → Yemek €15 + lounge erişimi
  6-12 saat  → Yemek €15 + Otel (1 gece) + Transfer
  ≥12  saat  → Yukarıdakiler + EU261 tazminat

Otomatik sınıf çarpanı: FIRST × 1.5, BUSINESS × 1.2, ECONOMY × 1.0
"""
import hashlib
import random
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import CrisisDB, DecisionDB, FlightDB, PassengerDB
from app.models.crisis import CrisisStatus
from app.models.decision import DecisionStatus
from app.models.passenger import TicketClass

router = APIRouter(prefix="/api/v1/vouchers", tags=["vouchers"])

# ── Voucher rules ────────────────────────────────────────────────────────────

_RULES = [
    # (min_wait_hours, max_wait_hours, types, base_values_eur, label)
    (2,  3,  ["MEAL"],                          {"MEAL": 10},                      "Kısa Bekleme Paketi"),
    (3,  6,  ["MEAL", "LOUNGE"],                {"MEAL": 15, "LOUNGE": 25},        "Orta Bekleme Paketi"),
    (6,  12, ["MEAL", "HOTEL", "TRANSFER"],     {"MEAL": 15, "HOTEL": 100, "TRANSFER": 30}, "Uzun Bekleme Paketi"),
    (12, 99, ["MEAL", "HOTEL", "TRANSFER", "EU261"], {"MEAL": 15, "HOTEL": 120, "TRANSFER": 40, "EU261": 250}, "Acil Destek Paketi"),
]

_CLASS_MULTIPLIER = {
    TicketClass.FIRST:    1.5,
    TicketClass.BUSINESS: 1.2,
    TicketClass.ECONOMY:  1.0,
}

_VOUCHER_DETAILS = {
    "MEAL":     "Havalimanı restoranlarında geçerli yemek kuponu",
    "LOUNGE":   "THY CIP Lounge ücretsiz erişim",
    "HOTEL":    "Partner otellerde 1 gece konaklama (transfer dahil)",
    "TRANSFER": "Havalimanı–otel arası ücretsiz transfer",
    "EU261":    "AB 261/2004 zorunlu tazminat (nakit/banka transferi)",
}

_VOUCHER_VALIDITY_HOURS = {
    "MEAL": 24, "LOUNGE": 12, "HOTEL": 48, "TRANSFER": 12, "EU261": 720,
}


def _code(prefix: str, seed: str) -> str:
    return f"{prefix}-{hashlib.md5(seed.encode()).hexdigest()[:8].upper()}"


def _apply_rules(wait_hours: float, ticket_class: TicketClass) -> list[dict]:
    mult = _CLASS_MULTIPLIER.get(ticket_class, 1.0)
    now = datetime.utcnow()
    vouchers = []
    for min_h, max_h, types, values, label in _RULES:
        if min_h <= wait_hours < max_h:
            for vtype in types:
                base = values[vtype]
                # EU261 tazminat sınıfa göre değişmez — sabit
                value = base if vtype == "EU261" else round(base * mult, 2)
                vouchers.append({
                    "type": vtype,
                    "value_eur": value,
                    "package_label": label,
                    "details": _VOUCHER_DETAILS[vtype],
                    "valid_until": (now + timedelta(hours=_VOUCHER_VALIDITY_HOURS[vtype])).isoformat(),
                })
            break
    return vouchers


# ── Pydantic models ──────────────────────────────────────────────────────────

class VoucherBundle(BaseModel):
    pnr: str
    passenger_name: str
    ticket_class: str
    wait_hours: float
    package_label: str
    total_value_eur: float
    vouchers: list[dict]
    issued_at: str
    crisis_id: Optional[int] = None
    flight_number: Optional[str] = None


class BulkIssueRequest(BaseModel):
    crisis_id: int
    override_wait_hours: Optional[float] = None  # if None, computed from crisis


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/{pnr}", response_model=VoucherBundle)
async def get_vouchers_for_pnr(
    pnr: str,
    wait_hours: float = Query(default=6.0, description="Bekleme süresi (saat)"),
    db: AsyncSession = Depends(get_db),
):
    """Bir yolcu için bekleme süresine göre voucher paketi üret."""
    result = await db.execute(select(PassengerDB).where(PassengerDB.pnr == pnr.upper()))
    pax = result.scalar_one_or_none()
    if not pax:
        raise HTTPException(status_code=404, detail=f"PNR {pnr} bulunamadı")

    vouchers = _apply_rules(wait_hours, pax.ticket_class)
    if not vouchers:
        raise HTTPException(
            status_code=422,
            detail=f"Bekleme süresi {wait_hours}s, EU261 eşiği (2 saat) altında — voucher üretilmedi",
        )

    # Assign codes
    for v in vouchers:
        seed = f"{pax.pnr}-{v['type']}-{datetime.utcnow().date()}"
        v["code"] = _code(v["type"][:2], seed)

    total = sum(v["value_eur"] for v in vouchers)
    label = vouchers[0]["package_label"] if vouchers else "—"

    return VoucherBundle(
        pnr=pax.pnr,
        passenger_name=f"{pax.first_name} {pax.last_name}",
        ticket_class=pax.ticket_class.value,
        wait_hours=wait_hours,
        package_label=label,
        total_value_eur=total,
        vouchers=vouchers,
        issued_at=datetime.utcnow().isoformat(),
    )


@router.post("/bulk-issue", summary="Kriz için tüm etkilenen yolculara toplu voucher")
async def bulk_issue_vouchers(req: BulkIssueRequest, db: AsyncSession = Depends(get_db)):
    """
    Bir kriz için tüm etkilenen yolculara otomatik voucher paketi üret.
    Operatör onayı gerekmez — tam otomasyon.
    """
    crisis_result = await db.execute(select(CrisisDB).where(CrisisDB.id == req.crisis_id))
    crisis = crisis_result.scalar_one_or_none()
    if not crisis:
        raise HTTPException(status_code=404, detail=f"Kriz {req.crisis_id} bulunamadı")

    # Compute wait hours from crisis trigger time
    wait_hours = req.override_wait_hours
    if wait_hours is None:
        elapsed = (datetime.utcnow() - crisis.triggered_at).total_seconds() / 3600
        wait_hours = max(elapsed, 2.0)  # minimum 2 hours for eligibility

    # Get all decisions for this crisis → passenger list
    dec_result = await db.execute(
        select(DecisionDB, PassengerDB)
        .join(PassengerDB, DecisionDB.passenger_id == PassengerDB.id)
        .where(DecisionDB.crisis_id == req.crisis_id)
    )
    rows = dec_result.all()

    bundles = []
    for decision, pax in rows:
        vouchers = _apply_rules(wait_hours, pax.ticket_class)
        for v in vouchers:
            seed = f"{pax.pnr}-{v['type']}-{crisis.id}"
            v["code"] = _code(v["type"][:2], seed)
        if not vouchers:
            continue
        total = sum(v["value_eur"] for v in vouchers)
        bundles.append({
            "pnr": pax.pnr,
            "passenger_name": f"{pax.first_name} {pax.last_name}",
            "ticket_class": pax.ticket_class.value,
            "wait_hours": wait_hours,
            "package_label": vouchers[0]["package_label"],
            "total_value_eur": total,
            "vouchers": vouchers,
        })

    grand_total = sum(b["total_value_eur"] for b in bundles)
    return {
        "crisis_id": req.crisis_id,
        "wait_hours": wait_hours,
        "passengers_issued": len(bundles),
        "grand_total_eur": round(grand_total, 2),
        "bundles": bundles,
        "issued_at": datetime.utcnow().isoformat(),
    }


@router.get("/rules/table", summary="Voucher kural tablosu")
async def voucher_rules_table():
    """UI'da gösterilecek voucher kural tablosunu döndür."""
    return {
        "class_multipliers": {"FIRST": 1.5, "BUSINESS": 1.2, "ECONOMY": 1.0},
        "rules": [
            {
                "wait_range": f"{mn}-{mx} saat",
                "package": lbl,
                "types": types,
                "base_values_eur": vals,
                "economy_total": sum(vals.values()),
                "business_total": round(sum(v * 1.2 for k, v in vals.items() if k != "EU261") + vals.get("EU261", 0), 2),
                "first_total": round(sum(v * 1.5 for k, v in vals.items() if k != "EU261") + vals.get("EU261", 0), 2),
            }
            for mn, mx, types, vals, lbl in _RULES
        ],
        "sources": ["IATA Resolution 735d", "EU Regulation 261/2004", "THY Ops Manual Rev.12"],
    }
