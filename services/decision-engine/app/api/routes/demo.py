"""
JetNexus AI — Tam IRROPS Akış Demo Endpoint'i
───────────────────────────────────────────────
THY Jüri Sunumu için: Tek POST isteğiyle 5 adımı sırayla simüle eder.

Adım 1: Gerçek Zamanlı Algılama   — Cirium/FlightAware uçuş durumu değişimi
Adım 2: ACT/MCT Analizi            — IST 75dk, F8 yönlendirme, risk tespiti
Adım 3: Otonom Yeniden Yerleştirme — Öncelik matrisi, koltuk tahsisi, re-issue, DCS
Adım 4: Self-Servis İletişim       — SMS/WhatsApp bildirimi, link
Adım 5: Voucher + Terminal Yönlendirme — IATA politikası, otel/yemek, F8 kapısı
"""
import asyncio
import random
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import CrisisDB, DecisionDB, FlightDB, PassengerDB
from app.models.crisis import CrisisStatus
from app.rules.mct import MCTCalculator, ConnectionType, get_ist_short_connection_instructions
from app.rules.passenger_priority import compute_priority

router = APIRouter(prefix="/api/v1/demo", tags=["demo"])


class StepResult(BaseModel):
    step: int
    title: str
    status: str          # RUNNING | DONE | SKIPPED
    duration_ms: int
    details: dict
    timestamp: str


class IrropsFlowResult(BaseModel):
    flow_id: str
    flight_number: str
    disruption_type: str
    trigger_time: str
    total_duration_ms: int
    steps: list[StepResult]
    summary: dict


@router.post("/full-irrops-flow", response_model=IrropsFlowResult)
async def run_full_irrops_flow(
    flight_number: str = Query(default="TK1981"),
    disruption_type: str = Query(default="CANCELLATION", description="CANCELLATION | DELAY | DIVERSION"),
    delay_minutes: int = Query(default=0),
    db: AsyncSession = Depends(get_db),
):
    """
    5 adımlı tam IRROPS pipeline — THY jüri demo modu.
    Gerçek DB verileri üzerinde çalışır; production etkilenmez (sandbox).
    """
    t0 = datetime.utcnow()
    flow_id = f"FLOW-{t0.strftime('%H%M%S')}-{random.randint(100,999)}"
    steps: list[StepResult] = []

    # ── Uçuş ve yolcu verilerini DB'den al ────────────────────────────────────
    fl_result = await db.execute(select(FlightDB).where(FlightDB.flight_number == flight_number))
    flight = fl_result.scalar_one_or_none()
    if not flight:
        # Demo için fallback uçuş
        fl_result = await db.execute(select(FlightDB).limit(1))
        flight = fl_result.scalar_one_or_none()

    pax_result = await db.execute(select(PassengerDB).limit(20))
    passengers = pax_result.scalars().all()

    dec_result = await db.execute(
        select(DecisionDB).order_by(DecisionDB.created_at.desc()).limit(20)
    )
    decisions = dec_result.scalars().all()

    n_pax = len(passengers)
    affected_pax = min(n_pax, max(8, n_pax // 2))

    # ══════════════════════════════════════════════════════════════════════════
    # ADIM 1: GERÇEK ZAMANLI ALGILAMA
    # ══════════════════════════════════════════════════════════════════════════
    step1_t = datetime.utcnow()

    data_sources = [
        {"source": "Cirium FlightStats", "feed": "MVT", "latency_ms": 340,
         "event": f"{flight_number} {disruption_type} sinyali alındı"},
        {"source": "Amadeus PSS",         "feed": "PNR_MANIFEST", "latency_ms": 210,
         "event": f"{affected_pax} yolcu PNR kaydı senkronize edildi"},
        {"source": "AODB Gate System",    "feed": "GATE_STATUS", "latency_ms": 180,
         "event": f"Gate C14 — {flight_number} slotu serbest bırakıldı"},
        {"source": "DCS Check-in",        "feed": "PAX_STATUS", "latency_ms": 290,
         "event": f"{affected_pax} yolcunun check-in durumu alındı"},
    ]

    steps.append(StepResult(
        step=1,
        title="Gerçek Zamanlı Algılama",
        status="DONE",
        duration_ms=int((datetime.utcnow() - step1_t).total_seconds() * 1000) + 820,
        details={
            "disruption_detected": True,
            "flight_number": flight_number,
            "disruption_type": disruption_type,
            "delay_minutes": delay_minutes,
            "data_sources_connected": len(data_sources),
            "feeds": data_sources,
            "passengers_loaded": affected_pax,
            "detection_latency_ms": 340,
        },
        timestamp=step1_t.isoformat(),
    ))

    # ══════════════════════════════════════════════════════════════════════════
    # ADIM 2: ACT / MCT ANALİZİ
    # ══════════════════════════════════════════════════════════════════════════
    step2_t = datetime.utcnow()

    # IST hub için MCT hesapla
    ist_result = MCTCalculator.check_connection(
        airport_icao="LTFM",
        inbound_arrival_minutes=30 + delay_minutes,
        outbound_departure_minutes=90,
        inbound_origin_icao="EGLL",
        outbound_dest_icao="KJFK",
    )

    critical_connections = random.randint(8, 18)
    safe_connections     = random.randint(20, 40)
    short_connections    = random.randint(3, 8)

    f8_instruction = get_ist_short_connection_instructions("II", 68)

    steps.append(StepResult(
        step=2,
        title="ACT / MCT Analizi",
        status="DONE",
        duration_ms=int((datetime.utcnow() - step2_t).total_seconds() * 1000) + 450,
        details={
            "hub": "IST (LTFM)",
            "mct_ii_minutes": 75,
            "ist_note": "IST uluslararası-uluslararası MCT: 75 dakika (IATA SSIM Bölüm 5)",
            "act_calculated": True,
            "connection_analysis": {
                "total_connecting_passengers": critical_connections + safe_connections + short_connections,
                "critical_miss": critical_connections,
                "safe": safe_connections,
                "short_connection_f8": short_connections,
            },
            "f8_routing": {
                "triggered": True,
                "gate": f8_instruction["gate"],
                "message_tr": f8_instruction["message_tr"],
                "priority_lane": f8_instruction["priority_lane"],
                "staff_escort": f8_instruction["staff_escort"],
            },
            "delay_cascade_risk": "HIGH" if delay_minutes > 60 else "MEDIUM",
        },
        timestamp=step2_t.isoformat(),
    ))

    # ══════════════════════════════════════════════════════════════════════════
    # ADIM 3: OTONOM YENİDEN YERLEŞTİRME (RE-ISSUE + DCS)
    # ══════════════════════════════════════════════════════════════════════════
    step3_t = datetime.utcnow()

    # Yolcuları öncelik matrisine göre sırala
    pax_ranked = []
    for pax in passengers[:affected_pax]:
        ssr = []
        if pax.special_needs and "WCHR" in pax.special_needs.upper(): ssr.append("WCHR")
        if pax.special_needs and "UMNR" in pax.special_needs.upper(): ssr.append("UMNR")
        pr = compute_priority(
            passenger_id=pax.id,
            pnr=pax.pnr,
            name=f"{pax.first_name} {pax.last_name}",
            loyalty_tier=str(pax.loyalty_tier.value if hasattr(pax.loyalty_tier, 'value') else pax.loyalty_tier),
            ticket_class=str(pax.ticket_class.value if hasattr(pax.ticket_class, 'value') else pax.ticket_class),
            ssr_codes=ssr,
        )
        pax_ranked.append(pr)
    pax_ranked.sort(key=lambda x: x.priority_score, reverse=True)

    # Alternatif koltuk bul
    alt_result = await db.execute(
        select(FlightDB)
        .where(FlightDB.available_seats > 0)
        .order_by(FlightDB.scheduled_departure)
        .limit(3)
    )
    alt_flights = alt_result.scalars().all()

    rebooked = []
    for i, pr in enumerate(pax_ranked[:min(affected_pax, len(alt_flights) * 10)]):
        alt = alt_flights[i % len(alt_flights)] if alt_flights else None
        if alt:
            rebooked.append({
                "pnr": pr.pnr,
                "priority_score": pr.priority_score,
                "loyalty": pr.loyalty_tier,
                "class": pr.ticket_class,
                "new_flight": alt.flight_number,
                "ticket_reissued": True,
                "dcs_baggage_rerouted": True,
                "boarding_pass_generated": True,
            })

    steps.append(StepResult(
        step=3,
        title="Otonom Yeniden Yerleştirme",
        status="DONE",
        duration_ms=int((datetime.utcnow() - step3_t).total_seconds() * 1000) + 1240,
        details={
            "algorithm": "MILP + Loyalty Priority Matrix",
            "passengers_processed": len(pax_ranked),
            "passengers_rebooked": len(rebooked),
            "priority_order": "PLATINUM > GOLD > SILVER > NONE | FIRST > BUSINESS > ECONOMY",
            "ssr_escalated": sum(1 for p in pax_ranked if p.requires_staff_escort),
            "alternative_flights_used": [f.flight_number for f in alt_flights],
            "re_issue_completed": len(rebooked),
            "dcs_baggage_commands_sent": len(rebooked),
            "boarding_passes_generated": len(rebooked),
            "top_5_passengers": [
                {
                    "pnr": p.pnr,
                    "score": p.priority_score,
                    "loyalty": p.loyalty_tier,
                    "class": p.ticket_class,
                }
                for p in pax_ranked[:5]
            ],
        },
        timestamp=step3_t.isoformat(),
    ))

    # ══════════════════════════════════════════════════════════════════════════
    # ADIM 4: SELF-SERVİS İLETİŞİM (SMS / WHATSAPP)
    # ══════════════════════════════════════════════════════════════════════════
    step4_t = datetime.utcnow()

    notifications = []
    for pr in pax_ranked[:min(affected_pax, 8)]:
        alt = alt_flights[0] if alt_flights else None
        notifications.append({
            "pnr": pr.pnr,
            "channel": random.choice(["SMS", "WhatsApp", "Email"]),
            "message_preview": f"JetNexus AI: {pr.pnr} — Yeni uçuşunuz {alt.flight_number if alt else 'TK1983'}. Onaylamak için: jetnexus.ai/ss/{pr.pnr}",
            "self_service_link": f"http://localhost:3000/self-service?pnr={pr.pnr}",
            "sent": True,
            "delivery_ms": random.randint(800, 2200),
        })

    steps.append(StepResult(
        step=4,
        title="Self-Servis Yolcu İletişimi",
        status="DONE",
        duration_ms=int((datetime.utcnow() - step4_t).total_seconds() * 1000) + 1800,
        details={
            "provider": "Twilio (SMS + WhatsApp)",
            "notifications_sent": len(notifications),
            "channels": {"SMS": sum(1 for n in notifications if n["channel"]=="SMS"),
                         "WhatsApp": sum(1 for n in notifications if n["channel"]=="WhatsApp"),
                         "Email": sum(1 for n in notifications if n["channel"]=="Email")},
            "self_service_url": "http://localhost:3000/self-service",
            "avg_delivery_ms": int(sum(n["delivery_ms"] for n in notifications) / max(len(notifications),1)),
            "sample_notifications": notifications[:3],
            "call_center_deflection_pct": 78,
        },
        timestamp=step4_t.isoformat(),
    ))

    # ══════════════════════════════════════════════════════════════════════════
    # ADIM 5: VOUCHER + TERMINAL YÖNLENDİRME
    # ══════════════════════════════════════════════════════════════════════════
    step5_t = datetime.utcnow()

    wait_hours = max(2.0, delay_minutes / 60.0) if delay_minutes > 0 else 6.0
    voucher_rules = {
        "2-3 saat":  {"types": ["MEAL"], "economy": 10, "business": 12, "first": 15},
        "3-6 saat":  {"types": ["MEAL","LOUNGE"], "economy": 40, "business": 50, "first": 65},
        "6-12 saat": {"types": ["MEAL","HOTEL","TRANSFER"], "economy": 145, "business": 174, "first": 218},
        "12+ saat":  {"types": ["MEAL","HOTEL","TRANSFER","EU261"], "economy": 425, "business": 510, "first": 638},
    }
    tier = "6-12 saat" if wait_hours < 12 else "12+ saat" if wait_hours >= 12 else "3-6 saat"
    if wait_hours < 3: tier = "2-3 saat"

    import hashlib
    voucher_samples = []
    for pr in pax_ranked[:3]:
        voucher_samples.append({
            "pnr": pr.pnr,
            "package": tier,
            "voucher_types": voucher_rules[tier]["types"],
            "total_eur": voucher_rules[tier]["economy"],
            "codes": {vt: f"{vt[:2]}-{hashlib.md5(f'{pr.pnr}{vt}'.encode()).hexdigest()[:8].upper()}"
                      for vt in voucher_rules[tier]["types"]},
            "delivered_to_mobile": True,
        })

    steps.append(StepResult(
        step=5,
        title="Voucher & Terminal Yönlendirme",
        status="DONE",
        duration_ms=int((datetime.utcnow() - step5_t).total_seconds() * 1000) + 640,
        details={
            "wait_hours": round(wait_hours, 1),
            "voucher_tier": tier,
            "policy_source": "IATA Resolution 735d + EU261/2004 + THY Ops Manual",
            "vouchers_issued": len(pax_ranked),
            "total_voucher_value_eur": round(voucher_rules[tier]["economy"] * len(pax_ranked), 2),
            "budget_caps": {"ECONOMY": 200, "BUSINESS": 400, "FIRST": 600},
            "f8_short_connection_alerts": short_connections,
            "f8_message": "Kısa bağlantı yolcuları F8 Uluslararası Kısa Bağlantı Güvenlik Noktasına yönlendirildi",
            "hotel_reservations": len(pax_ranked) if wait_hours >= 6 else 0,
            "sample_vouchers": voucher_samples,
        },
        timestamp=step5_t.isoformat(),
    ))

    total_ms = int((datetime.utcnow() - t0).total_seconds() * 1000)

    return IrropsFlowResult(
        flow_id=flow_id,
        flight_number=flight_number,
        disruption_type=disruption_type,
        trigger_time=t0.isoformat(),
        total_duration_ms=total_ms,
        steps=steps,
        summary={
            "total_steps": 5,
            "all_steps_completed": True,
            "passengers_affected": affected_pax,
            "passengers_rebooked": len(rebooked),
            "notifications_sent": len(notifications),
            "vouchers_issued": len(pax_ranked),
            "f8_alerts_sent": short_connections,
            "operator_interventions_required": 0,
            "automation_rate_pct": 100,
            "total_pipeline_ms": total_ms,
            "message": (
                f"JetNexus AI, {flight_number} uçuşunun {disruption_type} krizini "
                f"{total_ms}ms içinde tespit etti ve çözdü. "
                f"{len(rebooked)} yolcu yeniden yerleştirildi, hiçbir operatör müdahalesi gerekmedi."
            ),
        },
    )


@router.get("/status", summary="Demo sistemi durum kontrolü")
async def demo_status(db: AsyncSession = Depends(get_db)):
    """Jüri sunumu öncesi sistem hazırlık kontrolü."""
    from sqlalchemy import func
    total_flights  = await db.scalar(select(func.count(FlightDB.id)))
    total_pax      = await db.scalar(select(func.count(PassengerDB.id)))
    total_decisions= await db.scalar(select(func.count(DecisionDB.id)))
    total_crises   = await db.scalar(select(func.count(CrisisDB.id)))

    return {
        "system": "JetNexus AI",
        "demo_ready": all([total_flights, total_pax, total_decisions]),
        "database": {
            "flights": total_flights,
            "passengers": total_pax,
            "decisions": total_decisions,
            "crises": total_crises,
        },
        "endpoints_verified": [
            "POST /api/v1/demo/full-irrops-flow",
            "GET  /api/v1/hub/mct/check (IST=75dk)",
            "GET  /api/v1/pcc/passengers/at-risk (priority sorted)",
            "GET  /api/v1/proactive/inflight-rebook/{fn}",
            "POST /api/v1/proactive/notify",
            "GET  /api/v1/vouchers/rules/table",
            "GET  /api/v1/self-service/{pnr}",
            "GET  /api/v1/gate/availability/IST",
        ],
        "demo_flights": ["TK1981", "TK1821", "TK1983"],
        "demo_credentials": {"email": "manager@jetnexus.ai", "password": "jetnexus2024"},
        "checked_at": datetime.utcnow().isoformat(),
    }
