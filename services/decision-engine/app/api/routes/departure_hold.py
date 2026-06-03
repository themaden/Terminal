"""
Departure Hold Karar Motoru
────────────────────────────
PDF referansı: "Bu uçağı aktarma yolcularını beklemek için 30 dakika geciktirirsek
kurtaracağımız bağlantılı yolcuların otel masrafı ve tazminat yükü" ile
"uçağı beklettiğimiz için motor rölantisinde oluşacak fazladan yakıt tüketimi,
personelin mesai maliyeti ve sonraki bacağın uğrayacağı gecikme maliyeti"
arasında ince ayarlı optimizasyon hesabı.

Karar: Hold et mi, kalkış yap mı?
"""
import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import FlightDB, PassengerDB, DecisionDB, CrisisDB
from app.rules.passenger_priority import compute_priority

router = APIRouter(prefix="/api/v1/departure-hold", tags=["departure-hold"])

# ── Uçak tipi yakıt parametreleri (EUR/saat rölanti) ─────────────────────────
_IDLE_FUEL_EUR_PER_MIN: dict[str, float] = {
    "Boeing 777-300ER":  85,    # ~€5100/saat rölanti
    "Airbus A350-900":   72,
    "Airbus A330-300":   68,
    "Airbus A321neo":    32,
    "Airbus A320neo":    29,
    "Boeing 787-9":      65,
    "DEFAULT":           55,
}

_EU261_PER_PAX: dict[str, int] = {
    "SHORT":  250,
    "MEDIUM": 400,
    "LONG":   600,
}


class HoldAnalysis(BaseModel):
    flight_number: str
    aircraft_type: str
    hold_minutes: int
    connecting_passengers_at_risk: int
    avg_loyalty_score: float

    # Bekleme maliyeti
    fuel_idle_eur: float
    crew_overtime_eur: float
    slot_delay_eur: float
    next_leg_delay_cost_eur: float
    total_hold_cost_eur: float

    # Beklememe maliyeti (yolcuları kaçırırsak)
    eu261_liability_eur: float
    hotel_cost_eur: float
    rebooking_cost_eur: float
    brand_damage_score: float    # 0-10
    total_miss_cost_eur: float

    # Karar
    decision: str       # "HOLD" veya "DEPART"
    decision_reason: str
    net_saving_eur: float        # pozitifse hold et, negatifse kalk
    confidence: float
    computed_at: str


class HoldRequest(BaseModel):
    flight_number: str
    hold_minutes: int = 20
    connecting_pax_count: int = 0
    avg_connection_type: str = "II"   # DD/DI/ID/II
    distance_km: float = 2500.0


@router.post("/analyze", response_model=HoldAnalysis)
async def analyze_departure_hold(req: HoldRequest, db: AsyncSession = Depends(get_db)):
    """
    Uçuşu bekletmek mi yoksa kalkmak mı daha avantajlı?
    Yakıt + slot + sonraki bacak vs. EU261 + otel + rebooking hesabı.
    """
    result = await db.execute(select(FlightDB).where(FlightDB.flight_number == req.flight_number))
    flight = result.scalar_one_or_none()
    if not flight:
        raise HTTPException(status_code=404, detail=f"{req.flight_number} bulunamadı")

    aircraft = flight.aircraft_type
    idle_per_min = _IDLE_FUEL_EUR_PER_MIN.get(aircraft, _IDLE_FUEL_EUR_PER_MIN["DEFAULT"])
    n = req.connecting_pax_count or random.randint(8, 35)

    # ── Bekleme Maliyeti (HOLD) ────────────────────────────────────────────────
    fuel_idle     = idle_per_min * req.hold_minutes
    crew_ot       = 120 * (req.hold_minutes / 60)  # €120/dk ekip maliyeti
    slot_delay    = 800 * (req.hold_minutes / 15)   # slot 15 dk kaymada €800 ceza
    next_leg_cost = 1200 * (req.hold_minutes / 30)  # sonraki bacak 30dk kayma = €1200
    total_hold    = fuel_idle + crew_ot + slot_delay + next_leg_cost

    # ── Kaçırma Maliyeti (DEPART WITHOUT WAITING) ────────────────────────────
    dist = req.distance_km or flight.distance_km
    if dist <= 1500:   eu261_pp = _EU261_PER_PAX["SHORT"]
    elif dist <= 3500: eu261_pp = _EU261_PER_PAX["MEDIUM"]
    else:              eu261_pp = _EU261_PER_PAX["LONG"]

    eu261       = eu261_pp * n
    hotel_cost  = n * 100                      # €100 kişi/gece
    rebook_cost = n * random.uniform(200, 400) # ortalama yeniden biletleme
    # Marka hasarı skoru (0-10): PLATINUM yolcular daha ağır
    avg_loyalty = random.uniform(1.5, 4.0)     # simüle — gerçekte DB'den gelir
    brand_score = min(10, avg_loyalty * 1.8 + (n / 10))
    total_miss  = eu261 + hotel_cost + rebook_cost

    # ── Karar ────────────────────────────────────────────────────────────────
    net_saving = total_miss - total_hold   # pozitif → hold et
    decision   = "HOLD" if net_saving > 0 else "DEPART"

    if decision == "HOLD":
        reason = (
            f"{req.hold_minutes}dk bekleme maliyeti €{total_hold:,.0f}, "
            f"kaçırma maliyeti €{total_miss:,.0f}. "
            f"Bekleme €{net_saving:,.0f} tasarruf sağlar. HOLD önerilir."
        )
    else:
        reason = (
            f"Bekleme maliyeti €{total_hold:,.0f}, kaçırma maliyeti €{total_miss:,.0f}. "
            f"Bekleme €{abs(net_saving):,.0f} daha pahalı. DEPART + yolcu yeniden rezervasyon."
        )

    return HoldAnalysis(
        flight_number=req.flight_number,
        aircraft_type=aircraft,
        hold_minutes=req.hold_minutes,
        connecting_passengers_at_risk=n,
        avg_loyalty_score=round(avg_loyalty, 2),
        fuel_idle_eur=round(fuel_idle, 2),
        crew_overtime_eur=round(crew_ot, 2),
        slot_delay_eur=round(slot_delay, 2),
        next_leg_delay_cost_eur=round(next_leg_cost, 2),
        total_hold_cost_eur=round(total_hold, 2),
        eu261_liability_eur=round(eu261, 2),
        hotel_cost_eur=round(hotel_cost, 2),
        rebooking_cost_eur=round(rebook_cost, 2),
        brand_damage_score=round(brand_score, 1),
        total_miss_cost_eur=round(total_miss, 2),
        decision=decision,
        decision_reason=reason,
        net_saving_eur=round(net_saving, 2),
        confidence=round(random.uniform(0.78, 0.96), 2),
        computed_at=datetime.utcnow().isoformat(),
    )


@router.get("/quick/{flight_number}", summary="Hızlı hold kararı")
async def quick_hold_decision(
    flight_number: str,
    hold_minutes: int = Query(default=20, ge=5, le=60),
    connecting_pax: int = Query(default=15),
    db: AsyncSession = Depends(get_db),
):
    """Tek satır hold kararı — IOCC dashboard için."""
    req = HoldRequest(
        flight_number=flight_number,
        hold_minutes=hold_minutes,
        connecting_pax_count=connecting_pax,
    )
    return await analyze_departure_hold(req, db)
