"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CheckCircle2, Loader2, Hotel, Bus, CreditCard,
  MessageSquare, Zap, ChevronDown, ChevronUp,
} from "lucide-react"
import { recoveryApi, type RecoveryPlan, type BusRoute, type HotelAssignment } from "@/lib/api"

// ── step icons ─────────────────────────────────────────────────────────────────

const STEP_ICONS: Record<string, React.ReactNode> = {
  "KRİZ TESPİT":       <Zap       className="w-3.5 h-3.5" />,
  "MILP OPTİMİZASYON": <Loader2   className="w-3.5 h-3.5" />,
  "EU261 HESAPLANDI":  <CreditCard className="w-3.5 h-3.5" />,
  "OTEL ATANDI":       <Hotel      className="w-3.5 h-3.5" />,
  "OTOBÜS HAZIRLANDI": <Bus        className="w-3.5 h-3.5" />,
  "SMS / EMAIL":       <MessageSquare className="w-3.5 h-3.5" />,
  "VOUCHER PAKETİ":    <CreditCard className="w-3.5 h-3.5" />,
}

// ── hotel tier badge ───────────────────────────────────────────────────────────

function HotelCard({ ha, crisisId, onBooked }: { ha: HotelAssignment; crisisId: string; onBooked: () => void }) {
  const [booking, setBooking] = useState(false)
  const [booked, setBooked]   = useState(false)
  const [code, setCode]       = useState("")

  const tierColor =
    ha.tier === "premium"  ? "text-[#f97316] bg-[#f97316]/8 border-[#f97316]/20" :
    ha.tier === "business" ? "text-[#3b82f6] bg-[#3b82f6]/8 border-[#3b82f6]/20" :
                             "text-[#9999bb] bg-[#9999bb]/8 border-[#9999bb]/20"

  async function book() {
    setBooking(true)
    try {
      const res = await recoveryApi.bookHotelBlock(crisisId, ha.hotel, ha.rooms_needed)
      setCode(res.confirmation_code)
      setBooked(true)
      onBooked()
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className={`flex items-start justify-between gap-2 p-3 rounded-xl border ${
      booked ? "bg-[#10b981]/6 border-[#10b981]/20" : "bg-white/70 border-[#e0e0ea]"
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-[#111111] truncate">{ha.hotel}</span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${tierColor}`}>
            {ha.tier.toUpperCase()}
          </span>
        </div>
        <p className="text-[10px] text-[#9999bb] mt-0.5">
          Terminal {ha.terminal} · {ha.passenger_count} yolcu · {ha.rooms_needed} oda · €{ha.nightly_rate_eur}/gece
        </p>
        {code && <p className="text-[9px] text-[#10b981] font-mono mt-0.5">✓ {code}</p>}
        {/* Passenger pills */}
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {ha.passengers.slice(0, 3).map(p => (
            <span key={p.pnr} className="text-[8px] font-mono px-1.5 py-0.5 bg-[#f0f0f8] rounded text-[#666680]">
              {p.pnr}
            </span>
          ))}
          {ha.passenger_count > 3 && (
            <span className="text-[8px] text-[#9999bb]">+{ha.passenger_count - 3} daha</span>
          )}
        </div>
      </div>
      <button
        disabled={booking || booked}
        onClick={book}
        className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold
          transition-all disabled:opacity-50 ${
          booked
            ? "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20"
            : "bg-[#111111] hover:bg-[#333] text-white"
        }`}
      >
        {booking ? <Loader2 className="w-3 h-3 animate-spin" /> : booked ? <CheckCircle2 className="w-3 h-3" /> : <Hotel className="w-3 h-3" />}
        {booked ? "Rezerve" : "Blok Rezervasyon"}
      </button>
    </div>
  )
}

// ── bus card ───────────────────────────────────────────────────────────────────

function BusCard({ bus, crisisId }: { bus: BusRoute; crisisId: string }) {
  const [dispatched, setDispatched] = useState(bus.status === "DISPATCHED")
  const [loading, setLoading]       = useState(false)
  const [eta, setEta]               = useState(bus.eta_minutes * 60)

  useEffect(() => {
    if (!dispatched) return
    const id = setInterval(() => setEta(e => Math.max(0, e - 1)), 1000)
    return () => clearInterval(id)
  }, [dispatched])

  async function dispatch() {
    setLoading(true)
    try {
      await recoveryApi.dispatchBus(crisisId, bus.bus_id)
      setDispatched(true)
    } finally {
      setLoading(false)
    }
  }

  const etaMin = Math.floor(eta / 60)
  const etaSec = eta % 60

  return (
    <div className={`flex items-center justify-between gap-2 p-3 rounded-xl border ${
      dispatched ? "bg-[#3b82f6]/5 border-[#3b82f6]/20" : "bg-white/70 border-[#e0e0ea]"
    }`}>
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          dispatched ? "bg-[#3b82f6]" : "bg-[#f0f0f8]"
        }`}>
          <Bus className={`w-4 h-4 ${dispatched ? "text-white" : "text-[#9999bb]"}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-[#111111]">{bus.bus_id}</p>
          <p className="text-[9px] text-[#9999bb] truncate">{bus.route}</p>
          <p className="text-[9px] text-[#666680]">
            {bus.assigned_passengers}/{bus.capacity} yolcu · {bus.driver}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {dispatched ? (
          <span className="text-[10px] font-mono font-bold text-[#3b82f6]">
            ETA {etaMin}:{etaSec.toString().padStart(2, "0")}
          </span>
        ) : (
          <span className="text-[9px] text-[#9999bb]">{bus.departure_in_minutes} dk</span>
        )}
        <button
          disabled={loading || dispatched}
          onClick={dispatch}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all disabled:opacity-50 ${
            dispatched
              ? "bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20"
              : "bg-[#3b82f6] hover:bg-[#2563eb] text-white"
          }`}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bus className="w-3 h-3" />}
          {dispatched ? "Yolda" : "Sevket"}
        </button>
      </div>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────────

interface Props {
  crisisId: string
  crisisType: string
  onRefresh: () => void
}

export function RecoveryTimeline({ crisisId, crisisType, onRefresh }: Props) {
  const [plan, setPlan]               = useState<RecoveryPlan | null>(null)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [showHotels, setShowHotels]   = useState(true)
  const [showBuses, setShowBuses]     = useState(true)
  const [loading, setLoading]         = useState(true)

  const fetchPlan = useCallback(async () => {
    try {
      const data = await recoveryApi.plan(crisisId)
      setPlan(data)
      // Animate timeline steps in
      let i = 0
      const id = setInterval(() => {
        i++
        setVisibleSteps(i)
        if (i >= (data.timeline?.length ?? 0)) clearInterval(id)
      }, 400)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [crisisId])

  useEffect(() => {
    setVisibleSteps(0)
    setLoading(true)
    fetchPlan()
  }, [crisisId, fetchPlan])

  const isCancel = crisisType === "CANCELLATION"
  const accentColor = isCancel ? "text-[#ef4444]" : "text-[#f97316]"
  const accentBg    = isCancel ? "bg-[#ef4444]"   : "bg-[#f97316]"

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Loader2 className="w-4 h-4 animate-spin text-[#9999bb]" />
      <span className="text-[11px] text-[#9999bb]">Kurtarma planı hazırlanıyor...</span>
    </div>
  )

  if (!plan) return null

  return (
    <div className="flex flex-col gap-3">

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "Toplam Yolcu", value: plan.total_passengers, color: accentColor },
          { label: "Yeniden Rezervasyon", value: plan.rebooked, color: "text-[#10b981]" },
          { label: "EU261 Tazminat", value: `€${Math.round(plan.total_compensation_eur).toLocaleString()}`, color: "text-[#f97316]" },
          { label: "Otel Gereken", value: plan.hotel_needed, color: "text-[#3b82f6]" },
        ].map(item => (
          <div key={item.label} className="bg-white/70 border border-[#e0e0ea] rounded-xl p-2.5 text-center">
            <p className="text-[8px] text-[#9999bb] uppercase tracking-wide leading-none mb-1">{item.label}</p>
            <p className={`text-sm font-bold tabular-nums ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* ── Timeline ── */}
      <div className="bg-[#f9f9fc] border border-[#ebebf2] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#ebebf2]">
          <p className="text-[10px] font-bold text-[#333355] uppercase tracking-wide">Otomatik Kurtarma Akışı</p>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${accentBg}`}>
            {plan.timeline.length} adım
          </span>
        </div>
        <div className="p-3 flex flex-col gap-1.5">
          {plan.timeline.slice(0, visibleSteps).map((evt, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-[#333355] uppercase tracking-wide">{evt.step}</span>
                  <span className="text-[8px] text-[#9999bb] font-mono">
                    {new Date(evt.at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
                <p className="text-[10px] text-[#666680] mt-0.5 leading-snug">{evt.detail}</p>
              </div>
            </div>
          ))}
          {visibleSteps < plan.timeline.length && (
            <div className="flex items-center gap-2 pl-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9999bb]" />
              <span className="text-[10px] text-[#9999bb]">İşleniyor...</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Hotels ── */}
      {plan.hotel_assignments.length > 0 && (
        <div className="bg-[#f9f9fc] border border-[#ebebf2] rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2 border-b border-[#ebebf2] hover:bg-black/3"
            onClick={() => setShowHotels(h => !h)}
          >
            <div className="flex items-center gap-2">
              <Hotel className="w-3.5 h-3.5 text-[#f97316]" />
              <p className="text-[10px] font-bold text-[#333355] uppercase tracking-wide">
                Otel Atamaları — {plan.hotel_assignments.length} Tesis
              </p>
            </div>
            {showHotels ? <ChevronUp className="w-3.5 h-3.5 text-[#9999bb]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#9999bb]" />}
          </button>
          {showHotels && (
            <div className="p-3 flex flex-col gap-2">
              {plan.hotel_assignments.map((ha, i) => (
                <HotelCard key={i} ha={ha} crisisId={crisisId} onBooked={onRefresh} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Buses ── */}
      {plan.bus_routes.length > 0 && (
        <div className="bg-[#f9f9fc] border border-[#ebebf2] rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2 border-b border-[#ebebf2] hover:bg-black/3"
            onClick={() => setShowBuses(b => !b)}
          >
            <div className="flex items-center gap-2">
              <Bus className="w-3.5 h-3.5 text-[#3b82f6]" />
              <p className="text-[10px] font-bold text-[#333355] uppercase tracking-wide">
                Otobüs Sevkiyatı — {plan.bus_routes.length} Araç
              </p>
            </div>
            {showBuses ? <ChevronUp className="w-3.5 h-3.5 text-[#9999bb]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#9999bb]" />}
          </button>
          {showBuses && (
            <div className="p-3 flex flex-col gap-2">
              {plan.bus_routes.map((bus, i) => (
                <BusCard key={i} bus={bus} crisisId={crisisId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
