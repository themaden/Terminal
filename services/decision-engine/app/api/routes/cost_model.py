"""
Operasyonel Maliyet & Gelir Kaybı Modeli
─────────────────────────────────────────
THY Kriteri: "Operasyonel maliyet, gelir kaybı, kapasite optimizasyonu"

Maliyet kalemleri (uçak tipi ve rota bazlı):
  1. EU261 Yasal Tazminat
  2. İkram (catering) maliyeti
  3. Otel maliyeti
  4. Transfer maliyeti
  5. Mürettebat fazla mesai
  6. Slot / turnaround maliyeti
  7. Yakıt maliyeti (beklemede yanan)
  8. GDS yeniden yayınlama ücreti
  9. Gelir kaybı (boş koltuk × ortalama bilet ücreti × doluluk)
"""
import random
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import CrisisDB, DecisionDB, FlightDB, PassengerDB
from app.models.crisis import CrisisStatus

router = APIRouter(prefix="/api/v1/cost-model", tags=["cost-model"])

# ── Aircraft cost parameters ──────────────────────────────────────────────────
_AIRCRAFT_COSTS = {
    "Boeing 777-300ER": {"fuel_per_hour": 8500, "crew_per_hour": 1200, "slot_cost": 4500, "avg_fare": 450},
    "Airbus A350-900":  {"fuel_per_hour": 7200, "crew_per_hour": 1100, "slot_cost": 4000, "avg_fare": 420},
    "Airbus A330-300":  {"fuel_per_hour": 6800, "crew_per_hour": 1000, "slot_cost": 3500, "avg_fare": 380},
    "Airbus A321neo":   {"fuel_per_hour": 3200, "crew_per_hour": 700,  "slot_cost": 2000, "avg_fare": 200},
    "Airbus A320neo":   {"fuel_per_hour": 2900, "crew_per_hour": 650,  "slot_cost": 1800, "avg_fare": 180},
    "Boeing 787-9":     {"fuel_per_hour": 6500, "crew_per_hour": 1050, "slot_cost": 3800, "avg_fare": 400},
    "DEFAULT":          {"fuel_per_hour": 5000, "crew_per_hour": 900,  "slot_cost": 3000, "avg_fare": 300},
}

_EU261_TABLE = {
    "SHORT":  {"km": 1500,  "cancelled": 250, "long_delay": 250},
    "MEDIUM": {"km": 3500,  "cancelled": 400, "long_delay": 200},
    "LONG":   {"km": 99999, "cancelled": 600, "long_delay": 300},
}


def _eu261_per_pax(distance_km: float, crisis_type: str) -> float:
    for tier in _EU261_TABLE.values():
        if distance_km <= tier["km"]:
            return float(tier["cancelled"] if "CANCEL" in crisis_type else tier["long_delay"])
    return 600.0


class CostBreakdown(BaseModel):
    crisis_id: int
    flight_number: str
    aircraft_type: str
    distance_km: float
    affected_passengers: int
    delay_hours: float

    eu261_liability_eur: float
    catering_eur: float
    hotel_eur: float
    transfer_eur: float
    crew_overtime_eur: float
    slot_turnaround_eur: float
    fuel_idle_eur: float
    gds_rebooking_eur: float

    total_operational_eur: float
    revenue_loss_eur: float
    total_impact_eur: float

    load_factor_pct: float
    avg_fare_eur: float
    cost_per_pax_eur: float
    computed_at: str


class SystemWideSummary(BaseModel):
    total_crises: int
    active_crises: int
    total_eu261_eur: float
    total_operational_eur: float
    total_revenue_loss_eur: float
    grand_total_eur: float
    avg_cost_per_crisis_eur: float
    avg_cost_per_pax_eur: float
    by_crisis_type: dict
    computed_at: str


@router.get("/crisis/{crisis_id}", response_model=CostBreakdown)
async def get_crisis_cost(crisis_id: int, db: AsyncSession = Depends(get_db)):
    """Tek bir kriz için tam maliyet dökümü."""
    cr = await db.execute(select(CrisisDB).where(CrisisDB.id == crisis_id))
    crisis = cr.scalar_one_or_none()
    if not crisis:
        raise HTTPException(status_code=404, detail=f"Kriz {crisis_id} bulunamadı")

    fl = await db.execute(select(FlightDB).where(FlightDB.id == crisis.affected_flight_id))
    flight = fl.scalar_one_or_none()
    if not flight:
        raise HTTPException(status_code=404, detail="Uçuş bulunamadı")

    params = _AIRCRAFT_COSTS.get(flight.aircraft_type, _AIRCRAFT_COSTS["DEFAULT"])
    n_pax = crisis.affected_passenger_count or max(flight.total_capacity - flight.available_seats, 1)
    elapsed = (datetime.utcnow() - crisis.triggered_at).total_seconds() / 3600
    delay_hours = max(elapsed, 1.0)

    eu261 = _eu261_per_pax(flight.distance_km, crisis.crisis_type.value) * n_pax
    catering = n_pax * 12 * max(1, int(delay_hours / 3))        # €12/kişi / 3 saat
    hotel = (n_pax * 100) if delay_hours >= 6 else 0             # €100/kişi gece
    transfer = (n_pax * 35) if delay_hours >= 6 else 0           # €35/kişi transfer
    crew_ot = params["crew_per_hour"] * max(delay_hours - 1, 0) * 1.5
    slot = params["slot_cost"] * (1 + int(delay_hours / 2))
    fuel_idle = params["fuel_per_hour"] * 0.15 * delay_hours     # %15 idle burn
    gds = n_pax * random.uniform(8, 15)                          # GDS rebooking fee

    ops_total = catering + hotel + transfer + crew_ot + slot + fuel_idle + gds
    load = 1 - (flight.available_seats / max(flight.total_capacity, 1))
    rev_loss = flight.total_capacity * load * params["avg_fare"] * (delay_hours / 24) * 0.3

    total = eu261 + ops_total + rev_loss

    return CostBreakdown(
        crisis_id=crisis_id,
        flight_number=flight.flight_number,
        aircraft_type=flight.aircraft_type,
        distance_km=flight.distance_km,
        affected_passengers=n_pax,
        delay_hours=round(delay_hours, 1),
        eu261_liability_eur=round(eu261, 2),
        catering_eur=round(catering, 2),
        hotel_eur=round(hotel, 2),
        transfer_eur=round(transfer, 2),
        crew_overtime_eur=round(crew_ot, 2),
        slot_turnaround_eur=round(slot, 2),
        fuel_idle_eur=round(fuel_idle, 2),
        gds_rebooking_eur=round(gds, 2),
        total_operational_eur=round(ops_total, 2),
        revenue_loss_eur=round(rev_loss, 2),
        total_impact_eur=round(total, 2),
        load_factor_pct=round(load * 100, 1),
        avg_fare_eur=params["avg_fare"],
        cost_per_pax_eur=round(total / n_pax, 2),
        computed_at=datetime.utcnow().isoformat(),
    )


@router.get("/summary", response_model=SystemWideSummary)
async def system_wide_cost_summary(db: AsyncSession = Depends(get_db)):
    """Tüm krizlerin sistem geneli maliyet özeti."""
    crises_result = await db.execute(select(CrisisDB).order_by(CrisisDB.triggered_at.desc()).limit(50))
    crises = crises_result.scalars().all()

    total_eu261 = total_ops = total_rev = 0.0
    total_pax = 0
    by_type: dict = {}
    active = 0

    for crisis in crises:
        fl_r = await db.execute(select(FlightDB).where(FlightDB.id == crisis.affected_flight_id))
        flight = fl_r.scalar_one_or_none()
        if not flight:
            continue
        params = _AIRCRAFT_COSTS.get(flight.aircraft_type, _AIRCRAFT_COSTS["DEFAULT"])
        n_pax = crisis.affected_passenger_count or 1
        delay_h = max((datetime.utcnow() - crisis.triggered_at).total_seconds() / 3600, 1.0)

        eu261 = _eu261_per_pax(flight.distance_km, crisis.crisis_type.value) * n_pax
        ops = (n_pax * 12 + params["slot_cost"] + params["crew_per_hour"] * delay_h * 0.5)
        rev = flight.total_capacity * params["avg_fare"] * (delay_h / 24) * 0.2

        total_eu261 += eu261
        total_ops += ops
        total_rev += rev
        total_pax += n_pax
        if crisis.status == CrisisStatus.ACTIVE:
            active += 1

        ct = crisis.crisis_type.value
        if ct not in by_type:
            by_type[ct] = {"count": 0, "total_eur": 0.0}
        by_type[ct]["count"] += 1
        by_type[ct]["total_eur"] = round(by_type[ct]["total_eur"] + eu261 + ops + rev, 2)

    grand = total_eu261 + total_ops + total_rev
    return SystemWideSummary(
        total_crises=len(crises),
        active_crises=active,
        total_eu261_eur=round(total_eu261, 2),
        total_operational_eur=round(total_ops, 2),
        total_revenue_loss_eur=round(total_rev, 2),
        grand_total_eur=round(grand, 2),
        avg_cost_per_crisis_eur=round(grand / max(len(crises), 1), 2),
        avg_cost_per_pax_eur=round(grand / max(total_pax, 1), 2),
        by_crisis_type=by_type,
        computed_at=datetime.utcnow().isoformat(),
    )


@router.get("/fleet/benchmarks", summary="Uçak tipi bazlı maliyet kıyası")
async def fleet_benchmarks():
    """Jüri için: uçak tipi bazlı saatlik maliyet karşılaştırması."""
    return {
        "benchmarks": [
            {
                "aircraft": ac,
                "fuel_per_hour_eur": p["fuel_per_hour"],
                "crew_per_hour_eur": p["crew_per_hour"],
                "slot_cost_eur": p["slot_cost"],
                "avg_fare_eur": p["avg_fare"],
                "cost_1h_delay_eur": p["fuel_per_hour"] * 0.15 + p["crew_per_hour"] * 1.5 + p["slot_cost"],
            }
            for ac, p in _AIRCRAFT_COSTS.items() if ac != "DEFAULT"
        ],
        "source": "IATA AHM 810 / THY Fleet Cost Manual (simüle)",
    }
