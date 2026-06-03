"""
Gate & Hub Congestion Management
──────────────────────────────────
THY Kriteri: "Hub yoğunluğu, gate uygunluğu ve transfer operasyonlarının sürdürülebilirliği"

- IST havalimanı terminal/pier yapısı simüle edilir (A-F terminalleri)
- Gerçek zamanlı gate doluluk skoru (0-100)
- En uygun gate önerisi (uçak tipi, terminal, mürettebat uyumluluğu)
- Hub yoğunluk skoru → uyarı eşiği %70+
"""
import random
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/gate", tags=["gate"])

# ── Gate configuration (IST simülasyonu) ─────────────────────────────────────

_TERMINALS = {
    "A": {"pier": "International", "gates": list(range(101, 131)), "capacity": 30},
    "B": {"pier": "International", "gates": list(range(201, 226)), "capacity": 25},
    "C": {"pier": "Domestic",      "gates": list(range(301, 321)), "capacity": 20},
    "D": {"pier": "Schengen",      "gates": list(range(401, 421)), "capacity": 20},
    "E": {"pier": "CIP/Business",  "gates": list(range(501, 511)), "capacity": 10},
    "F": {"pier": "Remote",        "gates": list(range(601, 616)), "capacity": 15},
}

_WIDEBODY = {"Boeing 777-300ER", "Airbus A350-900", "Airbus A330-300", "Boeing 787-9"}
_NARROWBODY = {"Airbus A321neo", "Airbus A320neo", "Airbus A319"}

# Simüle edilmiş doluluk (seed ile tutarlı olsun)
random.seed(42)
_GATE_OCCUPANCY: dict[int, dict] = {}
for terminal, cfg in _TERMINALS.items():
    for gate in cfg["gates"]:
        _GATE_OCCUPANCY[gate] = {
            "terminal": terminal,
            "pier": cfg["pier"],
            "gate": gate,
            "occupied": random.random() > 0.45,
            "aircraft": random.choice(list(_WIDEBODY | _NARROWBODY)) if random.random() > 0.45 else None,
            "flight": f"TK{random.randint(100, 9999)}" if random.random() > 0.45 else None,
            "eta": (datetime.utcnow() + timedelta(minutes=random.randint(5, 180))).isoformat() if random.random() > 0.5 else None,
            "etd": (datetime.utcnow() + timedelta(minutes=random.randint(20, 240))).isoformat() if random.random() > 0.45 else None,
            "cleaning_done": random.random() > 0.3,
            "jetway_ok": random.random() > 0.1,
        }
random.seed()  # restore randomness


class GateSuggestion(BaseModel):
    gate: int
    terminal: str
    pier: str
    reason: str
    score: float


class HubCongestion(BaseModel):
    airport: str
    overall_congestion_pct: float
    alert_level: str
    terminals: list[dict]
    total_gates: int
    occupied_gates: int
    available_gates: int
    peak_in_minutes: Optional[int]
    computed_at: str


@router.get("/availability/{airport}", response_model=HubCongestion)
async def hub_congestion(airport: str = "IST"):
    """Hub yoğunluk skoru ve terminal bazlı gate doluluk durumu."""
    terminal_stats = []
    total = occupied = 0

    for term, cfg in _TERMINALS.items():
        gates = cfg["gates"]
        occ = [g for g in gates if _GATE_OCCUPANCY[g]["occupied"]]
        avail = len(gates) - len(occ)
        congestion = round(len(occ) / len(gates) * 100, 1)
        terminal_stats.append({
            "terminal": term,
            "pier": cfg["pier"],
            "total_gates": len(gates),
            "occupied": len(occ),
            "available": avail,
            "congestion_pct": congestion,
            "alert": congestion >= 70,
        })
        total += len(gates)
        occupied += len(occ)

    overall = round(occupied / total * 100, 1)
    alert = "CRITICAL" if overall >= 80 else "HIGH" if overall >= 70 else "NORMAL"

    return HubCongestion(
        airport=airport.upper(),
        overall_congestion_pct=overall,
        alert_level=alert,
        terminals=terminal_stats,
        total_gates=total,
        occupied_gates=occupied,
        available_gates=total - occupied,
        peak_in_minutes=random.randint(20, 90),
        computed_at=datetime.utcnow().isoformat(),
    )


@router.get("/suggest", response_model=list[GateSuggestion])
async def suggest_gate(
    aircraft_type: str = Query(default="Boeing 777-300ER"),
    flight_type: str = Query(default="international", description="international | domestic | schengen"),
    n: int = Query(default=3, le=10),
):
    """
    Uçak tipi ve uçuş tipine göre en uygun gate önerisi.
    Widebody için uzun pier, narrowbody için kısa pier öncelikli.
    """
    is_wide = aircraft_type in _WIDEBODY
    preferred_piers = {
        "international": ["A", "B"],
        "domestic": ["C"],
        "schengen": ["D"],
        "cip": ["E"],
    }.get(flight_type.lower(), ["A", "B"])

    candidates = []
    for gate_no, info in _GATE_OCCUPANCY.items():
        if info["occupied"]:
            continue
        if not info["jetway_ok"] and is_wide:
            continue

        pier_score = 30 if info["terminal"] in preferred_piers else 10
        clean_score = 20 if info["cleaning_done"] else 0
        jetway_score = 20 if info["jetway_ok"] else 0
        size_score = 20 if is_wide and info["terminal"] in ["A", "B"] else 15

        total_score = pier_score + clean_score + jetway_score + size_score + random.uniform(0, 10)

        reason_parts = []
        if info["terminal"] in preferred_piers:
            reason_parts.append(f"Tercih edilen terminal ({info['pier']})")
        if info["jetway_ok"]:
            reason_parts.append("Jetway hazır")
        if info["cleaning_done"]:
            reason_parts.append("Temizlik tamamlandı")

        candidates.append(GateSuggestion(
            gate=gate_no,
            terminal=info["terminal"],
            pier=info["pier"],
            reason=" · ".join(reason_parts) or "Müsait",
            score=round(total_score, 1),
        ))

    candidates.sort(key=lambda x: x.score, reverse=True)
    return candidates[:n]


@router.get("/board", summary="Tüm gate'lerin anlık durumu")
async def gate_board(terminal: Optional[str] = Query(default=None)):
    """Gate tahtası — terminal filtreli veya tüm terminal."""
    gates = list(_GATE_OCCUPANCY.values())
    if terminal:
        gates = [g for g in gates if g["terminal"] == terminal.upper()]
    return {
        "airport": "IST",
        "terminal": terminal.upper() if terminal else "ALL",
        "count": len(gates),
        "gates": sorted(gates, key=lambda g: g["gate"]),
        "snapshot_at": datetime.utcnow().isoformat(),
    }


@router.post("/assign", summary="Gate ata ve kilitle")
async def assign_gate(
    flight_number: str,
    gate: int,
    aircraft_type: str = "Boeing 777-300ER",
):
    """Bir uçuşa gate ata (simülasyon — production'da AODB'ye yazılır)."""
    if gate not in _GATE_OCCUPANCY:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Gate {gate} bulunamadı")
    if _GATE_OCCUPANCY[gate]["occupied"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail=f"Gate {gate} dolu")

    _GATE_OCCUPANCY[gate]["occupied"] = True
    _GATE_OCCUPANCY[gate]["flight"] = flight_number
    _GATE_OCCUPANCY[gate]["aircraft"] = aircraft_type
    _GATE_OCCUPANCY[gate]["etd"] = (datetime.utcnow() + timedelta(minutes=90)).isoformat()

    return {
        "success": True,
        "message": f"{flight_number} → Gate {gate} ({_GATE_OCCUPANCY[gate]['terminal']}) atandı",
        "gate": _GATE_OCCUPANCY[gate],
    }
