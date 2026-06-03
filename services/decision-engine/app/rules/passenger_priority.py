"""
Yolcu Önceliklendirme Matrisi
──────────────────────────────
PDF referansı: "İlk gelen ilk alır yaklaşımı değil; bilet sınıfı ve FFP statüsü
odaklı algoritmik hiyerarşi izlenir."

Öncelik skoru (yüksek = önce işlenir):
  Sadakat: PLATINUM(40) > GOLD(30) > SILVER(20) > NONE(0)
  Sınıf:   FIRST(30)   > BUSINESS(20) > ECONOMY(10)
  Özel:    UMNR(+25)   > PRM/WCHR(+20) > Tıbbi(+15)
  Bağlantı riski: ACT < MCT(+20), ACT < MCT+15(+10)

Kaynak: Lufthansa OPR, Amadeus Passenger Recovery, IATA PRM Guidelines
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class LoyaltyTier(str, Enum):
    PLATINUM = "PLATINUM"
    GOLD     = "GOLD"
    SILVER   = "SILVER"
    NONE     = "NONE"


class TicketClass(str, Enum):
    FIRST    = "FIRST"
    BUSINESS = "BUSINESS"
    ECONOMY  = "ECONOMY"


class SSRCode(str, Enum):
    WCHR = "WCHR"   # Tekerlekli sandalye
    WCHC = "WCHC"   # Tekerlekli sandalye + tam destek
    UMNR = "UMNR"   # Refakatsiz çocuk
    MEDA = "MEDA"   # Tıbbi destek
    BLND = "BLND"   # Görme engelli
    DEAF = "DEAF"   # İşitme engelli
    DPNA = "DPNA"   # Zihinsel engelli


_LOYALTY_SCORE: dict[str, int] = {
    "PLATINUM": 40,
    "GOLD":     30,
    "SILVER":   20,
    "NONE":      0,
}

_CLASS_SCORE: dict[str, int] = {
    "FIRST":    30,
    "BUSINESS": 20,
    "ECONOMY":  10,
}

_SSR_SCORE: dict[str, int] = {
    "UMNR": 25,   # Refakatsiz çocuk — en yüksek
    "WCHC": 20,   # Tam destek gerektiren tekerlekli sandalye
    "WCHR": 20,   # Tekerlekli sandalye
    "MEDA": 15,   # Tıbbi destek
    "BLND": 10,
    "DEAF": 10,
    "DPNA": 15,
}


@dataclass
class PriorityResult:
    passenger_id: int
    pnr: str
    name: str
    priority_score: int
    loyalty_tier: str
    ticket_class: str
    ssr_codes: list[str]
    connection_at_risk: bool
    requires_staff_escort: bool
    recovery_notes: list[str]


def compute_priority(
    passenger_id: int,
    pnr: str,
    name: str,
    loyalty_tier: str,
    ticket_class: str,
    ssr_codes: Optional[list[str]] = None,
    act_minutes: Optional[int] = None,
    mct_minutes: Optional[int] = None,
) -> PriorityResult:
    """
    Yolcu kurtarma öncelik skoru hesapla.
    Koltuk tahsisinde bu skor yüksek olan önce işlenir.
    """
    score = 0
    notes: list[str] = []
    ssr_codes = ssr_codes or []

    # 1. Sadakat skoru
    loyalty_pts = _LOYALTY_SCORE.get(loyalty_tier.upper(), 0)
    score += loyalty_pts
    if loyalty_pts >= 30:
        notes.append(f"{loyalty_tier} üyesi — yüksek öncelik koltuk tahsisi")

    # 2. Bilet sınıfı skoru
    class_pts = _CLASS_SCORE.get(ticket_class.upper(), 10)
    score += class_pts

    # 3. SSR (Özel Hizmet) kodları
    requires_escort = False
    for ssr in ssr_codes:
        ssr_upper = ssr.upper()
        pts = _SSR_SCORE.get(ssr_upper, 5)
        score += pts
        if ssr_upper == "UMNR":
            requires_escort = True
            notes.append("UMNR — refakatsiz çocuk, personel eskort zorunlu")
        elif ssr_upper in ("WCHR", "WCHC"):
            requires_escort = True
            notes.append(f"{ssr_upper} — tekerlekli sandalye, MCT'ye +15dk eklendi")
        elif ssr_upper == "MEDA":
            notes.append("MEDA — tıbbi destek gerekli, sağlık ekibi bilgilendir")

    # 4. Bağlantı riski
    connection_at_risk = False
    if act_minutes is not None and mct_minutes is not None:
        buffer = act_minutes - mct_minutes
        if buffer < 0:
            score += 20
            connection_at_risk = True
            notes.append(f"Bağlantı kaçırılacak (tampon {buffer}dk) — acil rebooking")
        elif buffer < 15:
            score += 10
            connection_at_risk = True
            notes.append(f"Bağlantı kritik (tampon +{buffer}dk) — öncelikli işlem")

    return PriorityResult(
        passenger_id=passenger_id,
        pnr=pnr,
        name=name,
        priority_score=score,
        loyalty_tier=loyalty_tier,
        ticket_class=ticket_class,
        ssr_codes=ssr_codes,
        connection_at_risk=connection_at_risk,
        requires_staff_escort=requires_escort,
        recovery_notes=notes,
    )


def rank_passengers(passengers: list[dict]) -> list[PriorityResult]:
    """
    Yolcu listesini öncelik skoruna göre sırala.
    Her dict: {id, pnr, name, loyalty_tier, ticket_class, ssr_codes, act_minutes, mct_minutes}
    """
    results = [
        compute_priority(
            passenger_id=p.get("id", 0),
            pnr=p.get("pnr", ""),
            name=p.get("name", ""),
            loyalty_tier=p.get("loyalty_tier", "NONE"),
            ticket_class=p.get("ticket_class", "ECONOMY"),
            ssr_codes=p.get("ssr_codes", []),
            act_minutes=p.get("act_minutes"),
            mct_minutes=p.get("mct_minutes"),
        )
        for p in passengers
    ]
    return sorted(results, key=lambda r: r.priority_score, reverse=True)
