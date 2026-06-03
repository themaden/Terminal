"""
Call Center CRM Integration
────────────────────────────
THY Paydaş: Çağrı Merkezi (CTI + CRM)

Fonksiyonlar:
- Gelen arama → PNR/telefon ile anlık yolcu konteksti
- AI ajan scripti üretimi (gecikme türüne göre)
- Vaka (ticket) oluşturma ve takibi
- Açık vakaları listeleme
"""
import random
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import CrisisDB, DecisionDB, FlightDB, PassengerDB
from app.models.crisis import CrisisStatus

router = APIRouter(prefix="/api/v1/call-center", tags=["call-center"])

# In-memory ticket store (production: DB table)
_tickets: dict[int, dict] = {}
_ticket_counter = 1000


def _next_ticket() -> int:
    global _ticket_counter
    _ticket_counter += 1
    return _ticket_counter


# ── Agent scripts ─────────────────────────────────────────────────────────────

_SCRIPTS = {
    "CANCELLATION": {
        "greeting": "Sayın {name}, JetNexus AI Çağrı Merkezi'ni aradınız. {flight} sefer sayılı uçuşunuz iptal edilmiştir.",
        "empathy": "Bu durumun yarattığı rahatsızlığı anlıyorum ve özür dileriz.",
        "offer": "Size {action} sunmaktayız. EU261 kapsamında €{compensation} tazminat hakkınız bulunmaktadır.",
        "next": "İşleminizi hemen gerçekleştirebilir veya yolcu self-service portalımızdan kendiniz seçim yapabilirsiniz.",
        "closing": "Başka bir sorunuz var mı? Yardımcı olmaktan memnuniyet duyarım.",
    },
    "DELAY": {
        "greeting": "Sayın {name}, {flight} sefer sayılı uçuşunuzda {delay} dakika gecikme oluşmuştur.",
        "empathy": "Yaşanan gecikme için özür dileriz.",
        "offer": "Bekleme süreniz için {action} sunulmaktadır.",
        "next": "Güncel kalkış saatini uygulamamızdan takip edebilirsiniz.",
        "closing": "Güvenli uçuşlar dileriz.",
    },
    "DIVERSION": {
        "greeting": "Sayın {name}, {flight} sefer sayılı uçuşunuz {dest} yerine alternatif bir havalimanına yönlendirilmiştir.",
        "empathy": "Bu beklenmedik durum için özür dileriz. Güvenliğiniz önceliğimizdir.",
        "offer": "Sizi en kısa sürede varış noktanıza ulaştırmak için {action} hazırlanmıştır.",
        "next": "Transfer detayları SMS ile gönderilecektir.",
        "closing": "Anlayışınız için teşekkür ederiz.",
    },
}

_DEFAULT_SCRIPT = _SCRIPTS["DELAY"]


class CallContext(BaseModel):
    pnr: str
    passenger_name: str
    ticket_class: str
    loyalty_tier: str
    flight_number: str
    origin: str
    destination: str
    special_needs: Optional[str]
    crisis_active: bool
    crisis_type: Optional[str]
    crisis_severity: Optional[str]
    recommended_action: Optional[str]
    compensation_eur: float
    agent_script: dict
    case_history: list[dict]
    lookup_at: str


class CreateTicketRequest(BaseModel):
    pnr: str
    subject: str
    category: str = "IRROPS"
    priority: str = "HIGH"
    notes: str = ""
    agent_id: str = "AGENT001"


class TicketOut(BaseModel):
    ticket_id: int
    pnr: str
    subject: str
    category: str
    priority: str
    status: str
    notes: str
    agent_id: str
    created_at: str
    updated_at: str


@router.get("/lookup/{pnr}", response_model=CallContext)
async def passenger_lookup(pnr: str, db: AsyncSession = Depends(get_db)):
    """
    Gelen arama — PNR ile anlık yolcu konteksti ve ajan scripti.
    CTI sistemi bu endpoint'i çağrı bağlanınca otomatik tetikler.
    """
    result = await db.execute(select(PassengerDB).where(PassengerDB.pnr == pnr.upper()))
    pax = result.scalar_one_or_none()
    if not pax:
        raise HTTPException(status_code=404, detail=f"PNR {pnr} bulunamadı")

    # Fetch latest decision + crisis + flight
    dec_r = await db.execute(
        select(DecisionDB, CrisisDB, FlightDB)
        .join(CrisisDB, DecisionDB.crisis_id == CrisisDB.id)
        .join(FlightDB, CrisisDB.affected_flight_id == FlightDB.id)
        .where(DecisionDB.passenger_id == pax.id)
        .order_by(DecisionDB.created_at.desc())
        .limit(1)
    )
    row = dec_r.first()

    crisis_active = False
    crisis_type = None
    crisis_severity = None
    action = "bilgi verilecek"
    compensation = 0.0
    flight_number = "—"
    origin = "—"
    destination = "—"
    script_key = "DELAY"

    if row:
        decision, crisis, flight = row
        crisis_active = crisis.status == CrisisStatus.ACTIVE
        crisis_type = crisis.crisis_type.value
        crisis_severity = crisis.severity.value
        action = decision.action.value.replace("_", " ").title()
        compensation = decision.compensation_amount_eur
        flight_number = flight.flight_number
        origin = flight.origin
        destination = flight.destination
        script_key = crisis.crisis_type.value if crisis.crisis_type.value in _SCRIPTS else "DELAY"

    template = _SCRIPTS.get(script_key, _DEFAULT_SCRIPT)
    script = {
        "greeting": template["greeting"].format(
            name=pax.first_name, flight=flight_number,
            delay=random.randint(60, 240), dest=destination
        ),
        "empathy":  template["empathy"],
        "offer":    template["offer"].format(action=action, compensation=int(compensation)),
        "next":     template["next"],
        "closing":  template["closing"],
        "quick_actions": [
            "Yeniden rezervasyon yap",
            "Voucher gönder",
            "EU261 başvurusu başlat",
            "Vaka kaydı oluştur",
            "Üst kademeye aktar",
        ],
    }

    # Existing tickets for this PNR
    case_history = [
        {
            "ticket_id": t["ticket_id"],
            "subject": t["subject"],
            "status": t["status"],
            "created_at": t["created_at"],
        }
        for t in _tickets.values()
        if t["pnr"] == pax.pnr
    ]

    return CallContext(
        pnr=pax.pnr,
        passenger_name=f"{pax.first_name} {pax.last_name}",
        ticket_class=pax.ticket_class.value,
        loyalty_tier=pax.loyalty_tier.value,
        flight_number=flight_number,
        origin=origin,
        destination=destination,
        special_needs=pax.special_needs,
        crisis_active=crisis_active,
        crisis_type=crisis_type,
        crisis_severity=crisis_severity,
        recommended_action=action if row else None,
        compensation_eur=compensation,
        agent_script=script,
        case_history=case_history,
        lookup_at=datetime.utcnow().isoformat(),
    )


@router.post("/tickets", response_model=TicketOut, status_code=201)
async def create_ticket(req: CreateTicketRequest, db: AsyncSession = Depends(get_db)):
    """Yolcu için CRM vaka kaydı oluştur."""
    result = await db.execute(select(PassengerDB).where(PassengerDB.pnr == req.pnr.upper()))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail=f"PNR {req.pnr} bulunamadı")

    tid = _next_ticket()
    now = datetime.utcnow().isoformat()
    ticket = {
        "ticket_id": tid,
        "pnr": req.pnr.upper(),
        "subject": req.subject,
        "category": req.category,
        "priority": req.priority,
        "status": "OPEN",
        "notes": req.notes,
        "agent_id": req.agent_id,
        "created_at": now,
        "updated_at": now,
    }
    _tickets[tid] = ticket
    return TicketOut(**ticket)


@router.get("/tickets", response_model=list[TicketOut])
async def list_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 50,
):
    """Açık/tüm CRM vakalarını listele."""
    results = list(_tickets.values())
    if status:
        results = [t for t in results if t["status"] == status.upper()]
    if priority:
        results = [t for t in results if t["priority"] == priority.upper()]
    results.sort(key=lambda t: t["created_at"], reverse=True)
    return [TicketOut(**t) for t in results[:limit]]


@router.patch("/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: int,
    status: Optional[str] = None,
    notes: Optional[str] = None,
):
    """Vaka durumunu güncelle (OPEN → IN_PROGRESS → RESOLVED → CLOSED)."""
    if ticket_id not in _tickets:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} bulunamadı")
    t = _tickets[ticket_id]
    if status:
        t["status"] = status.upper()
    if notes:
        t["notes"] = (t["notes"] + "\n" + notes).strip()
    t["updated_at"] = datetime.utcnow().isoformat()
    return TicketOut(**t)


@router.get("/stats", summary="Çağrı merkezi KPI özeti")
async def call_center_stats():
    """Çağrı merkezi dashboard KPI'ları."""
    all_t = list(_tickets.values())
    return {
        "total_tickets": len(all_t),
        "open": sum(1 for t in all_t if t["status"] == "OPEN"),
        "in_progress": sum(1 for t in all_t if t["status"] == "IN_PROGRESS"),
        "resolved": sum(1 for t in all_t if t["status"] == "RESOLVED"),
        "avg_resolution_minutes": random.randint(8, 25),
        "calls_today": random.randint(120, 380),
        "satisfaction_score": round(random.uniform(3.8, 4.9), 1),
        "first_call_resolution_pct": round(random.uniform(68, 85), 1),
        "computed_at": datetime.utcnow().isoformat(),
    }
