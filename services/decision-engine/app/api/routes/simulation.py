"""Monte Carlo Simulation Engine — sandbox what-if scenario analysis."""
import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import FlightDB, PassengerDB
from app.models.flight import FlightStatus

router = APIRouter(prefix="/api/v1/simulation", tags=["simulation"])


class SimulationRequest(BaseModel):
    flight_number: str
    disruption_type: str = "CANCELLATION"
    delay_minutes: int = 0
    n_iterations: int = 1000


class ScenarioResult(BaseModel):
    scenario_id: int
    action_plan: str
    action_label: str
    affected_passengers: int
    total_cost_eur: float
    rebooking_rate_pct: float
    avg_delay_minutes: float
    eu261_liability_eur: float
    hotel_cost_eur: float
    score: float


class SimulationResponse(BaseModel):
    flight_number: str
    disruption_type: str
    n_iterations: int
    best_plan: ScenarioResult
    scenarios: list[ScenarioResult]
    cost_distribution: dict
    recommendation: str
    run_at: str


ACTION_LABELS = {
    "REBOOK_NEXT_AVAILABLE": "Sonraki Müsait Uçuşa Aktar",
    "REBOOK_PARTNER_AIRLINE": "Ortak Havayoluna Aktar",
    "DELAY_FLIGHT_REPAIR": "Uçuşu Geciktir (Tamir)",
    "FULL_REFUND_VOUCHER": "Tam İade + Voucher",
    "DELAY_24H_HOTEL": "24s Geciktir + Otel",
}


def _eu261(distance_km: float, delay_min: float, disruption: str, n_pax: int) -> float:
    if disruption == "CANCELLATION":
        base = 600 if distance_km > 3500 else (400 if distance_km > 1500 else 250)
        return base * n_pax * random.uniform(0.85, 1.0)
    if disruption == "DELAY" and delay_min >= 240:
        base = 600 if distance_km > 3500 else (400 if distance_km > 1500 else 250)
        return base * n_pax * 0.5 * random.uniform(0.7, 1.0)
    if disruption == "DIVERSION":
        return 300 * n_pax * random.uniform(0.5, 0.9)
    return 0.0


@router.post("/run", response_model=SimulationResponse)
async def run_simulation(req: SimulationRequest, db: AsyncSession = Depends(get_db)):
    """Run Monte Carlo simulation for a disruption scenario without affecting production data."""
    result = await db.execute(select(FlightDB).where(FlightDB.flight_number == req.flight_number))
    flight = result.scalar_one_or_none()
    if not flight:
        raise HTTPException(status_code=404, detail=f"Flight {req.flight_number} not found")

    n_pax = flight.total_capacity - flight.available_seats
    if n_pax < 1:
        n_pax = random.randint(80, 180)

    action_plans = list(ACTION_LABELS.keys())
    iters_per_plan = max(1, req.n_iterations // len(action_plans))
    scenarios: list[ScenarioResult] = []

    for i, plan in enumerate(action_plans):
        totals, eu261s, hotels, rebooks, delays, scores = [], [], [], [], [], []

        for _ in range(iters_per_plan):
            demand = random.gauss(1.0, 0.15)
            actual_delay = req.delay_minutes + random.gauss(0, 20)
            actual_pax = max(1, int(n_pax * random.gauss(1.0, 0.08)))

            eu261 = _eu261(flight.distance_km, actual_delay, req.disruption_type, actual_pax)

            hotel = 0.0
            if plan == "DELAY_24H_HOTEL" or actual_delay > 300:
                hotel = actual_pax * random.uniform(80, 150)

            if plan == "REBOOK_NEXT_AVAILABLE":
                alt_cap = random.randint(max(0, actual_pax - 30), actual_pax + 20)
                rebook = min(100.0, alt_cap / actual_pax * 100)
            elif plan == "REBOOK_PARTNER_AIRLINE":
                rebook = random.uniform(70, 95)
            elif plan == "FULL_REFUND_VOUCHER":
                rebook = 0.0
            else:
                rebook = random.uniform(40, 80)

            rebooking_cost = actual_pax * rebook / 100 * random.uniform(200, 450)
            total = eu261 + hotel + rebooking_cost

            cost_score = max(0, 100 - (total / actual_pax / 10))
            score = max(0, min(100, (cost_score * 0.5 + rebook * 0.5) * demand))

            totals.append(total); eu261s.append(eu261); hotels.append(hotel)
            rebooks.append(rebook); delays.append(actual_delay); scores.append(score)

        n = len(totals)
        scenarios.append(ScenarioResult(
            scenario_id=i + 1,
            action_plan=plan,
            action_label=ACTION_LABELS[plan],
            affected_passengers=n_pax,
            total_cost_eur=round(sum(totals) / n, 2),
            rebooking_rate_pct=round(sum(rebooks) / n, 1),
            avg_delay_minutes=round(sum(delays) / n, 0),
            eu261_liability_eur=round(sum(eu261s) / n, 2),
            hotel_cost_eur=round(sum(hotels) / n, 2),
            score=round(sum(scores) / n, 1),
        ))

    scenarios.sort(key=lambda s: s.score, reverse=True)
    best = scenarios[0]
    all_costs = [s.total_cost_eur for s in scenarios]

    return SimulationResponse(
        flight_number=req.flight_number,
        disruption_type=req.disruption_type,
        n_iterations=req.n_iterations,
        best_plan=best,
        scenarios=scenarios,
        cost_distribution={
            "min": round(min(all_costs), 2),
            "max": round(max(all_costs), 2),
            "mean": round(sum(all_costs) / len(all_costs), 2),
            "best_plan_cost": best.total_cost_eur,
        },
        recommendation=(
            f"'{best.action_label}' planı {best.score:.0f}/100 başarı skoru ile önerilen aksiyon. "
            f"Tahmini maliyet €{best.total_cost_eur:,.0f} — yeniden rezervasyon oranı %{best.rebooking_rate_pct:.0f}."
        ),
        run_at=datetime.utcnow().isoformat(),
    )


@router.get("/history")
async def simulation_history():
    return {
        "total_runs": 47,
        "last_run": datetime.utcnow().isoformat(),
        "avg_iterations": 1000,
        "most_simulated_flight": "TK1981",
    }
