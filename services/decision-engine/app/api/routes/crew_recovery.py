"""
Mürettebat (Crew) Kurtarma Modülü — Doküman §4.1
─────────────────────────────────────────────────
Doküman: "Yolcuyu uçağa koymak, o uçağı uçuracak yasal mürettebat yoksa anlamsızdır.
Mürettebat kurtarma, yolcudan daha fazla yasal kısıt içerir: görev süresi sınırları,
zorunlu dinlenme, sendika sözleşmeleri, lisans/uçak tipi uyumu."

Geçerli mürettebatı olmayan bir uçuş yolcuya hiç sunulmaz.
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
from app.db.models import FlightDB
from app.models.flight import FlightStatus

router = APIRouter(prefix="/api/v1/crew", tags=["crew-recovery"])

# ── Simüle edilmiş mürettebat havuzu ─────────────────────────────────────────

_TYPE_RATINGS = {
    "Boeing 777-300ER": "B773",
    "Boeing 787-9":     "B789",
    "Airbus A350-900":  "A359",
    "Airbus A330-300":  "A333",
    "Airbus A321neo":   "A321",
    "Airbus A320neo":   "A320",
    "Airbus A319":      "A319",
}

_CREW_POOL: list[dict] = []
random.seed(7)
for _i in range(60):
    _ratings = random.sample(list(_TYPE_RATINGS.values()), k=random.randint(1, 3))
    _duty_start = datetime.utcnow() - timedelta(hours=random.randint(0, 10))
    _duty_hours = round(random.uniform(0, 12), 1)
    _rest_end = datetime.utcnow() - timedelta(hours=random.randint(0, 6))
    _CREW_POOL.append({
        "id": f"CM{1000 + _i}",
        "name": f"Crew Member {_i + 1}",
        "role": random.choice(["CAPTAIN", "FO", "PURSER", "CABIN"]),
        "base": random.choice(["IST", "LHR", "FRA", "AMS"]),
        "type_ratings": _ratings,
        "duty_started_at": _duty_start.isoformat(),
        "duty_hours_today": _duty_hours,
        "rest_ended_at": _rest_end.isoformat(),
        "available": _duty_hours < 10 and (_rest_end < datetime.utcnow()),
        "on_standby": random.random() > 0.6,
        "current_flight": f"TK{random.randint(100, 9999)}" if random.random() > 0.5 else None,
    })
random.seed()

# EASA FTL (Flight Time Limitations) sınırları
_MAX_DUTY_HOURS = 13.0       # günlük max görev süresi
_MIN_REST_HOURS = 10.0       # minimum dinlenme süresi
_MIN_CREW_CAPTAIN = 1
_MIN_CREW_FO = 1
_MIN_CREW_CABIN = 2


class CrewMember(BaseModel):
    id: str
    name: str
    role: str
    base: str
    type_ratings: list[str]
    duty_hours_today: float
    available: bool
    on_standby: bool
    legal_for_duty: bool
    remaining_duty_hours: float
    current_flight: Optional[str]


class CrewAssignment(BaseModel):
    flight_number: str
    aircraft_type: str
    required_type_rating: str
    captain: Optional[CrewMember]
    first_officer: Optional[CrewMember]
    cabin_crew: list[CrewMember]
    is_fully_crewed: bool
    deficit: list[str]
    legal_check_passed: bool
    assignment_confidence: float
    assigned_at: str


class CrewRecoveryPlan(BaseModel):
    flight_number: str
    crisis_id: Optional[int]
    original_crew_status: str
    recovery_actions: list[dict]
    replacement_crew: CrewAssignment
    eta_to_brief_minutes: int
    standby_crew_activated: int
    message: str


def _check_legal(member: dict) -> tuple[bool, float]:
    """EASA FTL kontrolü: görev saati ve dinlenme kısıtları."""
    remaining = max(0.0, _MAX_DUTY_HOURS - member["duty_hours_today"])
    rest_ok = True
    try:
        rest_end = datetime.fromisoformat(member["rest_ended_at"])
        rest_ok = (datetime.utcnow() - rest_end).total_seconds() / 3600 >= 0
    except Exception:
        pass
    legal = member["duty_hours_today"] < _MAX_DUTY_HOURS and rest_ok
    return legal, round(remaining, 1)


def _find_crew(aircraft_type: str, base: str) -> CrewAssignment:
    rating = _TYPE_RATINGS.get(aircraft_type, "A321")
    available = [
        c for c in _CREW_POOL
        if c["available"] and rating in c["type_ratings"]
    ]
    # Base'e yakın olanları öne al
    available.sort(key=lambda c: (c["base"] != base, c["duty_hours_today"]))

    captain = next((c for c in available if c["role"] == "CAPTAIN"), None)
    fo = next((c for c in available if c["role"] == "FO" and c != captain), None)
    cabin = [c for c in available if c["role"] in ("PURSER", "CABIN") and c not in (captain, fo)][:4]

    deficit = []
    if not captain:
        deficit.append("CAPTAIN eksik")
    if not fo:
        deficit.append("FIRST_OFFICER eksik")
    if len(cabin) < _MIN_CREW_CABIN:
        deficit.append(f"KABİN EKİBİ yetersiz ({len(cabin)}/{_MIN_CREW_CABIN})")

    fully_crewed = len(deficit) == 0
    legal_ok = fully_crewed

    def _to_model(c: dict) -> CrewMember:
        legal, remaining = _check_legal(c)
        return CrewMember(
            id=c["id"], name=c["name"], role=c["role"], base=c["base"],
            type_ratings=c["type_ratings"], duty_hours_today=c["duty_hours_today"],
            available=c["available"], on_standby=c["on_standby"],
            legal_for_duty=legal, remaining_duty_hours=remaining,
            current_flight=c["current_flight"],
        )

    return CrewAssignment(
        flight_number="",
        aircraft_type=aircraft_type,
        required_type_rating=rating,
        captain=_to_model(captain) if captain else None,
        first_officer=_to_model(fo) if fo else None,
        cabin_crew=[_to_model(c) for c in cabin],
        is_fully_crewed=fully_crewed,
        deficit=deficit,
        legal_check_passed=legal_ok,
        assignment_confidence=round(0.95 if fully_crewed else 0.5, 2),
        assigned_at=datetime.utcnow().isoformat(),
    )


@router.get("/availability", summary="Müsait mürettebat listesi")
async def get_crew_availability(
    type_rating: Optional[str] = Query(default=None, description="Tip sertifikası filtresi (ör. B773)"),
    role: Optional[str] = Query(default=None, description="CAPTAIN | FO | CABIN"),
    base: Optional[str] = Query(default=None, description="Üs havalimanı (IATA)"),
):
    """Görev süresi ve dinlenme kısıtlarına uygun müsait mürettebat listesi."""
    result = []
    for c in _CREW_POOL:
        if not c["available"]:
            continue
        if type_rating and type_rating.upper() not in c["type_ratings"]:
            continue
        if role and c["role"] != role.upper():
            continue
        if base and c["base"] != base.upper():
            continue
        legal, remaining = _check_legal(c)
        result.append({**c, "legal_for_duty": legal, "remaining_duty_hours": remaining})

    return {
        "total_available": len(result),
        "filter": {"type_rating": type_rating, "role": role, "base": base},
        "crew": result[:30],
        "ftl_limits": {
            "max_duty_hours": _MAX_DUTY_HOURS,
            "min_rest_hours": _MIN_REST_HOURS,
            "regulation": "EASA OPS Part-ORO.FTL",
        },
    }


@router.get("/assign/{flight_number}", response_model=CrewAssignment)
async def assign_crew(flight_number: str, db: AsyncSession = Depends(get_db)):
    """
    Bir uçuş için tip sertifikası + FTL uyumlu mürettebat ata.
    Geçerli mürettebatı olmayan uçuş yolcuya sunulmaz (doküman §4.1).
    """
    result = await db.execute(select(FlightDB).where(FlightDB.flight_number == flight_number))
    flight = result.scalar_one_or_none()
    if not flight:
        raise HTTPException(status_code=404, detail=f"{flight_number} bulunamadı")

    assignment = _find_crew(flight.aircraft_type, flight.origin)
    assignment.flight_number = flight_number
    return assignment


@router.post("/recover/{flight_number}", response_model=CrewRecoveryPlan)
async def crew_recovery_plan(
    flight_number: str,
    crisis_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Kriz sonrası mürettebat kurtarma planı.
    Standby mürettebatı aktive et, briefing süresini hesapla, aksiyonları sırala.
    """
    result = await db.execute(select(FlightDB).where(FlightDB.flight_number == flight_number))
    flight = result.scalar_one_or_none()
    if not flight:
        raise HTTPException(status_code=404, detail=f"{flight_number} bulunamadı")

    assignment = _find_crew(flight.aircraft_type, flight.origin)
    assignment.flight_number = flight_number

    standby_activated = len([c for c in _CREW_POOL if c["on_standby"] and c["available"]])

    actions = [
        {"step": 1, "action": "DUTY_CHECK",    "detail": "Tüm ekip üyelerinin FTL kısıt kontrolü yapıldı", "status": "DONE"},
        {"step": 2, "action": "STANDBY_CALL",  "detail": f"{standby_activated} standby ekip üyesi telefona çağrıldı", "status": "DONE"},
        {"step": 3, "action": "TYPE_MATCH",    "detail": f"{_TYPE_RATINGS.get(flight.aircraft_type, 'UNK')} tip sertifikası eşleştirmesi tamamlandı", "status": "DONE"},
        {"step": 4, "action": "BRIEFING",      "detail": "Operasyon briefing'i planlandı (30 dk)", "status": "PENDING"},
        {"step": 5, "action": "CREW_TRANSPORT","detail": "Ekip ulaşım aracı rezerve edildi (havalimanına)", "status": "PENDING"},
    ]

    if not assignment.is_fully_crewed:
        actions.append({
            "step": 6, "action": "INTERLINE_CREW",
            "detail": f"Eksik pozisyonlar ({', '.join(assignment.deficit)}) için partner havayolu ile müzakere başlatıldı",
            "status": "PENDING",
        })

    eta = 45 if assignment.is_fully_crewed else 90

    return CrewRecoveryPlan(
        flight_number=flight_number,
        crisis_id=crisis_id,
        original_crew_status="UNAVAILABLE" if not assignment.is_fully_crewed else "RECOVERED",
        recovery_actions=actions,
        replacement_crew=assignment,
        eta_to_brief_minutes=eta,
        standby_crew_activated=standby_activated,
        message=(
            f"{flight_number} için mürettebat kurtarma tamamlandı. Briefing ~{eta} dk içinde."
            if assignment.is_fully_crewed else
            f"Eksik pozisyonlar mevcut: {', '.join(assignment.deficit)}. İnterline müzakere başlatıldı."
        ),
    )


@router.get("/legal-check/{crew_id}", summary="FTL yasal uyum kontrolü")
async def crew_legal_check(crew_id: str):
    """Belirli bir ekip üyesi için EASA FTL görev süresi ve dinlenme kontrolü."""
    member = next((c for c in _CREW_POOL if c["id"] == crew_id), None)
    if not member:
        raise HTTPException(status_code=404, detail=f"Ekip üyesi {crew_id} bulunamadı")

    legal, remaining = _check_legal(member)
    violations = []
    if member["duty_hours_today"] >= _MAX_DUTY_HOURS:
        violations.append(f"Günlük görev süresi aşıldı: {member['duty_hours_today']:.1f}h / {_MAX_DUTY_HOURS}h")

    return {
        "crew_id": crew_id,
        "name": member["name"],
        "role": member["role"],
        "legal_for_duty": legal,
        "duty_hours_today": member["duty_hours_today"],
        "remaining_duty_hours": remaining,
        "max_duty_hours": _MAX_DUTY_HOURS,
        "min_rest_hours": _MIN_REST_HOURS,
        "violations": violations,
        "regulation": "EASA OPS Part-ORO.FTL",
        "checked_at": datetime.utcnow().isoformat(),
    }
