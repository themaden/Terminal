"""
Auto-Recovery Planlayıcı
────────────────────────
Kriz tetiklendiğinde otomatik olarak:
  - Otel atamalarını gruplar
  - Otobüs rotalarını oluşturur
  - Tam kurtarma planını döndürür
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import CrisisDB, DecisionDB, FlightDB, PassengerDB
from app.models.crisis import CrisisStatus

router = APIRouter(prefix="/api/v1/recovery", tags=["recovery"])

# Sabit otel havuzu (mock PSS otel envanteri)
HOTEL_POOL = [
    {"name": "Radisson Blu Airport 5★",  "terminal": "T1", "bus_eta_min": 12, "nightly_rate": 250, "tier": "premium"},
    {"name": "Hilton Garden Inn IST 4★",  "terminal": "T1", "bus_eta_min": 15, "nightly_rate": 180, "tier": "business"},
    {"name": "Aviation Airport Hotel 4★", "terminal": "T2", "bus_eta_min": 18, "nightly_rate": 100, "tier": "economy"},
    {"name": "Marriott Airport Suites 5★","terminal": "T1", "bus_eta_min": 10, "nightly_rate": 280, "tier": "premium"},
    {"name": "Premier Inn Terminal 3★",   "terminal": "T2", "bus_eta_min": 22, "nightly_rate": 75,  "tier": "economy"},
]

BUS_CAPACITY = 52


def _hotel_for_class(ticket_class: str, hotel_name_from_decision: str | None) -> str:
    """Decision'dan hotel_name varsa onu kullan, yoksa class'a göre ata."""
    if hotel_name_from_decision:
        return hotel_name_from_decision
    tc = (ticket_class or "").upper()
    if tc in ("FIRST",):
        return HOTEL_POOL[3]["name"]   # Marriott 5★
    if tc in ("BUSINESS",):
        return HOTEL_POOL[0]["name"]   # Radisson Blu
    if tc in ("ECONOMY",):
        return HOTEL_POOL[2]["name"]   # Aviation Hotel
    return HOTEL_POOL[2]["name"]


@router.get("/plan/{crisis_id}")
async def get_recovery_plan(crisis_id: int, db: AsyncSession = Depends(get_db)):
    """
    Kriz için tam otomatik kurtarma planı:
    MILP kararlarından otel atamalarını grupla,
    otobüs rotalarını hesapla, timeline üret.
    """
    # 1. Kriz doğrula
    cr_res = await db.execute(select(CrisisDB).where(CrisisDB.id == crisis_id))
    crisis = cr_res.scalar_one_or_none()
    if not crisis:
        raise HTTPException(status_code=404, detail=f"Crisis {crisis_id} not found")

    # 2. Etkilenen uçuş
    fl_res = await db.execute(select(FlightDB).where(FlightDB.id == crisis.affected_flight_id))
    flight = fl_res.scalar_one_or_none()

    # 3. Kararları ve yolcuları birlikte çek
    rows = await db.execute(
        select(DecisionDB, PassengerDB)
        .join(PassengerDB, DecisionDB.passenger_id == PassengerDB.id)
        .where(DecisionDB.crisis_id == crisis_id)
    )
    dec_pax = rows.all()

    # 4. Otel grupları
    hotel_map: dict[str, list[dict]] = {}
    total_comp = 0.0
    rebooked = refunded = hotel_needed = 0

    for dec, pax in dec_pax:
        action = str(dec.action).upper()
        if "REBOOK" in action:
            rebooked += 1
        elif "REFUND" in action:
            refunded += 1

        total_comp += dec.compensation_amount_eur or 0

        # Gecelik hotel gerekiyor mu?
        hotel_name = _hotel_for_class(
            str(pax.ticket_class),
            dec.hotel_name,
        )
        # Sadece rebook + hotel ya da refund + overnight için
        if dec.hotel_name or (refunded and True):
            hotel_name_key = hotel_name
            if hotel_name_key not in hotel_map:
                hotel_map[hotel_name_key] = []
            hotel_map[hotel_name_key].append({
                "pnr": pax.pnr,
                "name": f"{pax.first_name} {pax.last_name}",
                "ticket_class": str(pax.ticket_class).replace("TicketClass.", ""),
                "loyalty_tier": str(pax.loyalty_tier).replace("LoyaltyTier.", ""),
                "compensation_eur": dec.compensation_amount_eur or 0,
            })
            hotel_needed += 1

    # Eğer decision'dan hotel assign edilmediyse, tüm yolcuları class bazlı dağıt
    if not hotel_map and dec_pax:
        for dec, pax in dec_pax:
            tc = str(pax.ticket_class).upper()
            if "FIRST" in tc:
                hname = HOTEL_POOL[3]["name"]
            elif "BUSINESS" in tc:
                hname = HOTEL_POOL[0]["name"]
            else:
                hname = HOTEL_POOL[2]["name"]
            if hname not in hotel_map:
                hotel_map[hname] = []
            hotel_map[hname].append({
                "pnr": pax.pnr,
                "name": f"{pax.first_name} {pax.last_name}",
                "ticket_class": str(pax.ticket_class).replace("TicketClass.", ""),
                "loyalty_tier": str(pax.loyalty_tier).replace("LoyaltyTier.", ""),
                "compensation_eur": dec.compensation_amount_eur or 0,
            })
            hotel_needed += 1

    # 5. Otel atama listesi
    hotel_assignments = []
    for hname, pax_list in hotel_map.items():
        meta = next((h for h in HOTEL_POOL if h["name"] == hname), HOTEL_POOL[2])
        hotel_assignments.append({
            "hotel": hname,
            "terminal": meta["terminal"],
            "tier": meta["tier"],
            "nightly_rate_eur": meta["nightly_rate"],
            "bus_eta_minutes": meta["bus_eta_min"],
            "passenger_count": len(pax_list),
            "passengers": pax_list[:5],   # UI için ilk 5
            "rooms_needed": max(1, len(pax_list) // 2),
            "total_hotel_cost_eur": len(pax_list) * meta["nightly_rate"],
            "status": "CONFIRMED",
        })
    hotel_assignments.sort(key=lambda x: -x["passenger_count"])

    # 6. Otobüs rotaları
    bus_routes = []
    bus_id = 1
    for ha in hotel_assignments:
        n_buses = max(1, -(-ha["passenger_count"] // BUS_CAPACITY))  # ceil div
        for b in range(n_buses):
            pax_start = b * BUS_CAPACITY
            pax_end   = min((b + 1) * BUS_CAPACITY, ha["passenger_count"])
            bus_routes.append({
                "bus_id": f"BUS-{bus_id:03d}",
                "route": f"{ha['terminal']} Çıkış → {ha['hotel']}",
                "hotel": ha["hotel"],
                "terminal": ha["terminal"],
                "assigned_passengers": pax_end - pax_start,
                "capacity": BUS_CAPACITY,
                "eta_minutes": ha["bus_eta_minutes"],
                "departure_in_minutes": 5 + (b * 3),
                "status": "STAGED" if b == 0 else "STANDBY",
                "driver": f"Şoför-{bus_id:02d}",
            })
            bus_id += 1

    # 7. Recovery timeline events
    t = datetime.utcnow()
    timeline = [
        {"at": (t - timedelta(seconds=30)).isoformat(), "step": "KRİZ TESPİT",    "detail": f"{flight.flight_number if flight else '—'} etkilendi — {crisis.reason}", "status": "DONE"},
        {"at": (t - timedelta(seconds=25)).isoformat(), "step": "MILP OPTİMİZASYON", "detail": f"{rebooked} yolcu yeniden rezervasyon · {refunded} yolcu iade",   "status": "DONE"},
        {"at": (t - timedelta(seconds=20)).isoformat(), "step": "EU261 HESAPLANDI",   "detail": f"Toplam tazminat: €{total_comp:.0f} ({len(dec_pax)} yolcu)",           "status": "DONE"},
        {"at": (t - timedelta(seconds=15)).isoformat(), "step": "OTEL ATANDI",        "detail": f"{hotel_needed} yolcu · {len(hotel_assignments)} otel · {sum(h['rooms_needed'] for h in hotel_assignments)} oda", "status": "DONE"},
        {"at": (t - timedelta(seconds=10)).isoformat(), "step": "OTOBÜS HAZIRLANDI",  "detail": f"{len(bus_routes)} otobüs oluşturuldu · {sum(r['assigned_passengers'] for r in bus_routes)} yolcu",              "status": "DONE"},
        {"at": (t - timedelta(seconds=5)).isoformat(),  "step": "SMS / EMAIL",         "detail": f"{len(dec_pax)} yolcuya kişisel bildirim gönderildi",                 "status": "DONE"},
        {"at": t.isoformat(),                           "step": "VOUCHER PAKETİ",      "detail": f"Her yolcuya €{int(total_comp / max(len(dec_pax), 1))} ortalama tazminat kuponu hazırlandı", "status": "DONE"},
    ]

    return {
        "crisis_id": crisis_id,
        "flight_number": flight.flight_number if flight else "—",
        "crisis_type": crisis.crisis_type.value,
        "severity": crisis.severity.value,
        "reason": crisis.reason,
        "status": crisis.status.value,
        "total_passengers": len(dec_pax),
        "rebooked": rebooked,
        "refunded": refunded,
        "hotel_needed": hotel_needed,
        "total_compensation_eur": total_comp,
        "hotel_assignments": hotel_assignments,
        "bus_routes": bus_routes,
        "timeline": timeline,
        "recovery_complete": crisis.status == CrisisStatus.RESOLVED,
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.post("/dispatch-bus/{crisis_id}/{bus_id}")
async def dispatch_bus(crisis_id: int, bus_id: str, db: AsyncSession = Depends(get_db)):
    """Otobüsü yola çıkar — durumunu DISPATCHED olarak işaretle."""
    cr_res = await db.execute(select(CrisisDB).where(CrisisDB.id == crisis_id))
    if not cr_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Crisis not found")
    return {
        "bus_id": bus_id,
        "status": "DISPATCHED",
        "dispatched_at": datetime.utcnow().isoformat(),
        "message": f"{bus_id} yola çıktı — GPS takip aktif",
    }


@router.post("/book-hotel-block/{crisis_id}")
async def book_hotel_block(crisis_id: int, hotel_name: str, room_count: int, db: AsyncSession = Depends(get_db)):
    """Bir otele blok rezervasyon yap."""
    return {
        "crisis_id": crisis_id,
        "hotel": hotel_name,
        "rooms_booked": room_count,
        "confirmation_code": f"HTL{crisis_id:03d}-{abs(hash(hotel_name)) % 9999:04d}",
        "status": "CONFIRMED",
        "booked_at": datetime.utcnow().isoformat(),
    }
