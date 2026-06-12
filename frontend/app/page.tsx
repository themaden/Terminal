"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  dashboardApi, crisisApi, pccApi, flightsApi, hubApi, recoveryApi, ioccApi,
  type DashboardStats, type Crisis, type PccPassenger, type Flight,
  type HubSummary, type RecoveryPlan, type Decision,
} from "@/lib/api"
import {
  Plane, AlertTriangle, Users, TrendingUp, CheckCircle,
  RefreshCw, Zap, LayoutDashboard, Activity, Network,
  UserCheck, Luggage, GitFork, Settings, ChevronRight,
  Clock, Euro, ArrowRight, Loader2, FileText, Hotel, Bus,
} from "lucide-react"
import { FlightMap, type FlightRoute, type FlightMarker } from "@/components/dashboard/flight-map"

// ─── 1. Flight Status Alert Panel ────────────────────────────────────────────

function FlightStatusPanel({ crisis, flights }: { crisis: Crisis; flights: Flight[] }) {
  const isCancel = crisis.crisis_type === "cancellation"
  const nextFlight = flights.find(f => f.flight_number !== crisis.flight_number && f.status === "SCHEDULED")
  const transit = Math.floor(crisis.affected_passengers * 0.35)
  const local   = crisis.affected_passengers - transit

  return (
    <div className={`rounded-xl border p-5 ${isCancel ? "bg-[#ef4444]/5 border-[#ef4444]/20" : "bg-[#f59e0b]/5 border-[#f59e0b]/20"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCancel ? "bg-[#ef4444]/15" : "bg-[#f59e0b]/15"}`}>
            <AlertTriangle className={`w-5 h-5 ${isCancel ? "text-[#ef4444]" : "text-[#f59e0b]"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[20px] font-black text-[#111111]">{crisis.flight_number}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white ${isCancel ? "bg-[#ef4444]" : "bg-[#f59e0b]"}`}>
                {isCancel ? "CANCELLED" : "DELAYED"}
              </span>
            </div>
            <div className="text-[12px] text-[#666677]">{crisis.origin} → {crisis.destination}</div>
          </div>
        </div>
        {nextFlight && (
          <div className="text-right bg-white/60 rounded-xl px-4 py-2.5">
            <div className="text-[9px] text-[#888899] font-medium uppercase tracking-wide">Yeni Sefer</div>
            <div className="text-[16px] font-black text-[#10b981]">{nextFlight.flight_number}</div>
            <div className="text-[11px] text-[#666677]">
              {new Date(nextFlight.scheduled_departure).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Etkilenen Yolcu", value: crisis.affected_passengers, color: "text-[#ef4444]" },
          { label: "Transit",         value: transit,                     color: "text-[#3b82f6]" },
          { label: "Lokal",           value: local,                       color: "text-[#8b5cf6]" },
          { label: "Kriz Tipi",       value: isCancel ? "İptal" : "Gecikme", color: "text-[#f59e0b]" },
        ].map(i => (
          <div key={i.label} className="bg-white/60 rounded-lg p-3 text-center">
            <div className={`text-[22px] font-black ${i.color}`}>{i.value}</div>
            <div className="text-[9px] text-[#888899] mt-0.5">{i.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 2. Alternative Flight Assignment ────────────────────────────────────────

function AlternativeFlightPanel({
  decisions, altFlights, passengers, onExecute, executing,
}: {
  decisions: Decision[]
  altFlights: Flight[]
  passengers: PccPassenger[]
  onExecute: () => void
  executing: boolean
}) {
  const rebooked = decisions.filter(d => d.action === "REBOOK" || d.action === "rebook").length
  const topAlts  = altFlights.filter(f => f.status === "SCHEDULED").slice(0, 3)

  const tierCounts = [
    { tier: "PLATINUM", color: "text-[#E81932] bg-[#E81932]/10", count: passengers.filter(p => p.loyalty_tier === "PLATINUM").length },
    { tier: "GOLD",     color: "text-[#f59e0b] bg-[#f59e0b]/10", count: passengers.filter(p => p.loyalty_tier === "GOLD").length },
    { tier: "SILVER",   color: "text-[#888899] bg-[#888899]/10", count: passengers.filter(p => p.loyalty_tier === "SILVER").length },
    { tier: "NONE",     color: "text-[#666677] bg-[#f5f5fa]",    count: passengers.filter(p => p.loyalty_tier === "NONE").length },
  ]

  return (
    <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f6]">
        <div className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-[#E81932]" />
          <span className="text-[13px] font-bold text-[#111111]">Alternatif Uçuş Ataması</span>
        </div>
        <span className="text-[10px] text-[#888899]">{rebooked} yeniden atandı</span>
      </div>

      <div className="p-3 space-y-2">
        {topAlts.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-[11px] text-[#aaaabc]">Mevcut alternatif uçuş yok</div>
        ) : topAlts.map(f => (
          <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#e8e8f0] bg-[#fafafa]">
            <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
              <Plane className="w-3.5 h-3.5 text-[#10b981] -rotate-45" />
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-bold text-[#111111]">{f.flight_number}</div>
              <div className="text-[10px] text-[#888899]">
                {new Date(f.scheduled_departure).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} · {f.available_seats} koltuk
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">MÜSAİT</span>
          </div>
        ))}
      </div>

      <div className="px-3 pb-2">
        <div className="text-[9px] font-bold text-[#888899] mb-2 uppercase tracking-wide">Öncelik Ataması</div>
        <div className="grid grid-cols-4 gap-1.5">
          {tierCounts.map(t => (
            <div key={t.tier} className={`rounded-lg px-2 py-1.5 text-center ${t.color}`}>
              <div className="text-[13px] font-black">{t.count}</div>
              <div className="text-[8px] font-medium">{t.tier}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 pb-3 pt-1">
        <button onClick={onExecute} disabled={executing || rebooked > 0}
          className="w-full py-2.5 rounded-lg bg-[#E81932] text-white text-[12px] font-bold hover:bg-[#c01428] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {executing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Uygulanıyor…</>
            : rebooked > 0 ? <><CheckCircle className="w-3.5 h-3.5" />Kararlar Onaylandı</>
            : "Tümünü Onayla — Execute"}
        </button>
      </div>
    </div>
  )
}

// ─── 3. Hotel Arrangements ────────────────────────────────────────────────────

function HotelArrangementsPanel({ recoveryPlan }: { recoveryPlan: RecoveryPlan | null }) {
  return (
    <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f6]">
        <div className="flex items-center gap-2">
          <Hotel className="w-4 h-4 text-[#E81932]" />
          <span className="text-[13px] font-bold text-[#111111]">Otel & Konaklama</span>
        </div>
        <span className="text-[10px] text-[#888899]">{recoveryPlan?.hotel_needed ?? 0} yolcu</span>
      </div>

      {!recoveryPlan || recoveryPlan.hotel_assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <Hotel className="w-8 h-8 text-[#e0e0ee]" />
          <p className="text-[11px] text-[#aaaabc]">Kriz aktifken otel atamaları görünür</p>
        </div>
      ) : (
        <div className="p-3 space-y-2 max-h-56 overflow-y-auto">
          {recoveryPlan.hotel_assignments.map((h, i) => (
            <div key={i} className="rounded-lg border border-[#e8e8f0] p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-[12px] font-bold text-[#111111] leading-tight">{h.hotel}</div>
                  <div className="text-[9px] text-[#888899] mt-0.5">{h.terminal} · {h.tier} · €{h.nightly_rate_eur}/gece</div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  h.status === "confirmed"
                    ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                    : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"
                }`}>{h.status === "confirmed" ? "ONAYLANDI" : "BEKLİYOR"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-[14px] font-black text-[#111111]">{h.rooms_needed}</div><div className="text-[8px] text-[#aaaabc]">Oda</div></div>
                <div><div className="text-[14px] font-black text-[#3b82f6]">{h.passenger_count}</div><div className="text-[8px] text-[#aaaabc]">Yolcu</div></div>
                <div><div className="text-[14px] font-black text-[#f59e0b]">{h.bus_eta_minutes}dk</div><div className="text-[8px] text-[#aaaabc]">Otobüs ETA</div></div>
              </div>
              {h.passengers.some(p => p.loyalty_tier === "PLATINUM") && (
                <div className="mt-2 pt-2 border-t border-[#f5f5fa] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E81932] shrink-0" />
                  <span className="text-[9px] font-bold text-[#E81932]">
                    {h.passengers.filter(p => p.loyalty_tier === "PLATINUM").length} PLATINUM — özel transfer
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="px-3 pb-3 border-t border-[#f5f5fa] pt-2">
        <Link href="/hotels"
          className="w-full py-2 rounded-lg border border-[#e8e8f0] text-[11px] font-semibold text-[#666677] hover:bg-[#f5f5fa] flex items-center justify-center gap-1.5 transition-colors">
          <Bus className="w-3.5 h-3.5" />
          Transfer Detayları
        </Link>
      </div>
    </div>
  )
}

// ─── 4. Passenger Rights Panel ────────────────────────────────────────────────

function PassengerRightsPanel({ crisis }: { crisis: Crisis | null }) {
  const [elapsedMin, setElapsedMin] = useState(0)

  useEffect(() => {
    if (!crisis) { setElapsedMin(0); return }
    const start = new Date(crisis.created_at).getTime()
    const tick  = () => setElapsedMin(Math.floor((Date.now() - start) / 60_000))
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [crisis?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const rights = [
    { minMin: 120, label: "İçecek Kuponu",  icon: Clock,        desc: "Su, meşrubat",   color: "text-[#10b981]", bg: "bg-[#10b981]" },
    { minMin: 180, label: "Sıcak Yemek",    icon: Users,        desc: "Tam öğün",        color: "text-[#f59e0b]", bg: "bg-[#f59e0b]" },
    { minMin: 300, label: "Otel Konaklama", icon: Hotel,        desc: "EASA hakkı",      color: "text-[#3b82f6]", bg: "bg-[#3b82f6]" },
    { minMin: 60,  label: "EU261 Tazminat", icon: Euro,         desc: "€250–€600",       color: "text-[#E81932]", bg: "bg-[#E81932]" },
  ]

  const compEur = crisis
    ? crisis.affected_passengers * (elapsedMin >= 180 ? 400 : elapsedMin >= 60 ? 250 : 0)
    : 0

  return (
    <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f6]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#E81932]" />
          <span className="text-[13px] font-bold text-[#111111]">Yolcu Hakları Sayacı</span>
        </div>
        {crisis && (
          <span className={`text-[11px] font-black tabular-nums px-2 py-0.5 rounded-full ${
            elapsedMin >= 180 ? "bg-[#ef4444]/10 text-[#ef4444]"
            : elapsedMin >= 120 ? "bg-[#f59e0b]/10 text-[#f59e0b]"
            : "bg-[#10b981]/10 text-[#10b981]"
          }`}>
            {Math.floor(elapsedMin / 60)}s {elapsedMin % 60}dk
          </span>
        )}
      </div>

      {!crisis ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <CheckCircle className="w-8 h-8 text-[#e0e0ee]" />
          <p className="text-[11px] text-[#aaaabc]">Kriz yok — sayaç durdu</p>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          {rights.map((r) => {
            const progress  = Math.min(100, (elapsedMin / r.minMin) * 100)
            const unlocked  = elapsedMin >= r.minMin
            const nearLimit = progress > 75 && !unlocked
            const Icon      = r.icon

            return (
              <div key={r.label} className={`rounded-lg border p-2.5 transition-all ${
                unlocked    ? "border-[#10b981]/25 bg-[#10b981]/4"
                : nearLimit ? "border-[#f59e0b]/25 bg-[#f59e0b]/4"
                : "border-[#e8e8f0] bg-[#fafafa]"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${r.color}`} />
                    <div>
                      <div className="text-[11px] font-bold text-[#111111]">{r.label}</div>
                      <div className="text-[9px] text-[#888899]">{r.desc}</div>
                    </div>
                  </div>
                  {unlocked
                    ? <span className="text-[8px] font-black text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded-full">HAK KAZANDI</span>
                    : <span className="text-[8px] text-[#888899]">{Math.floor(r.minMin / 60)}s sonra</span>
                  }
                </div>
                <div className="h-1 bg-[#e8e8f0] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${
                    unlocked ? "bg-[#10b981]" : nearLimit ? "bg-[#f59e0b]" : r.bg
                  }`} style={{ width: `${progress}%` }} />
                </div>
              </div>
            )
          })}

          <div className="mt-1 px-3 py-2.5 rounded-lg bg-[#E81932]/5 border border-[#E81932]/15">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-[#E81932]">Anlık EU261 Maliyet</div>
              <div className="text-[15px] font-black text-[#E81932]">€{compEur.toLocaleString()}</div>
            </div>
            <div className="text-[9px] text-[#E81932]/60 mt-0.5">
              {crisis.affected_passengers} yolcu × €{elapsedMin >= 180 ? 400 : elapsedMin >= 60 ? 250 : 0}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 5. OTP + ACT KPI Panel ───────────────────────────────────────────────────

function OtpActPanel({ flights, hubSummary }: { flights: Flight[]; hubSummary: HubSummary | null }) {
  const total     = flights.length || 1
  const onTime    = flights.filter(f => ["SCHEDULED", "ACTIVE"].includes(f.status)).length
  const delayed   = flights.filter(f => f.status === "DELAYED").length
  const cancelled = flights.filter(f => f.status === "CANCELLED").length
  const otp       = Math.round((onTime / total) * 100)

  const bars = [
    { label: "Zamanında", value: onTime,    pct: (onTime    / total) * 100, color: "bg-[#10b981]" },
    { label: "Gecikmeli", value: delayed,   pct: (delayed   / total) * 100, color: "bg-[#f59e0b]" },
    { label: "İptal",     value: cancelled, pct: (cancelled / total) * 100, color: "bg-[#ef4444]" },
  ]

  const atRisk      = hubSummary?.at_risk_connections ?? 0
  const missed      = hubSummary?.missed_connections ?? 0
  const avgConn     = hubSummary?.avg_connection_time_minutes ?? 0
  const MIN_CONN    = 45
  const connCritical = avgConn > 0 && avgConn < MIN_CONN

  return (
    <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f0f0f6]">
        <TrendingUp className="w-4 h-4 text-[#E81932]" />
        <span className="text-[13px] font-bold text-[#111111]">Performans & Risk Göstergeleri</span>
      </div>

      <div className="p-4 grid grid-cols-2 gap-5">
        {/* OTP */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-[#555566]">OTP — Zamanında Kalkış</span>
            <span className={`text-[16px] font-black ${otp >= 80 ? "text-[#10b981]" : otp >= 60 ? "text-[#f59e0b]" : "text-[#ef4444]"}`}>
              %{otp}
            </span>
          </div>
          <div className="space-y-2">
            {bars.map(b => (
              <div key={b.label} className="flex items-center gap-2">
                <div className="text-[9px] text-[#888899] w-16 shrink-0">{b.label}</div>
                <div className="flex-1 h-2.5 bg-[#f5f5fa] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${b.color} transition-all`}
                    style={{ width: `${Math.max(b.pct, b.value > 0 ? 3 : 0)}%` }} />
                </div>
                <div className="text-[10px] font-bold text-[#555566] w-4 text-right">{b.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="bg-[#f5f5fa] rounded-lg p-2">
              <div className="text-[15px] font-black text-[#111111]">{flights.length}</div>
              <div className="text-[8px] text-[#aaaabc]">Toplam Sefer</div>
            </div>
            <div className={`rounded-lg p-2 ${otp >= 80 ? "bg-[#10b981]/8" : "bg-[#f59e0b]/8"}`}>
              <div className={`text-[15px] font-black ${otp >= 80 ? "text-[#10b981]" : "text-[#f59e0b]"}`}>%{otp}</div>
              <div className="text-[8px] text-[#aaaabc]">OTP Skoru</div>
            </div>
          </div>
        </div>

        {/* ACT Connection Risk */}
        <div>
          <div className="text-[11px] font-bold text-[#555566] mb-3">ACT — Bağlantı Süresi Riski</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className={`rounded-lg p-2 text-center ${atRisk > 0 ? "bg-[#f59e0b]/8 border border-[#f59e0b]/20" : "bg-[#f5f5fa] border border-[#e8e8f0]"}`}>
              <div className={`text-[16px] font-black ${atRisk > 0 ? "text-[#f59e0b]" : "text-[#111111]"}`}>{atRisk}</div>
              <div className="text-[8px] text-[#888899]">Risk</div>
            </div>
            <div className={`rounded-lg p-2 text-center ${missed > 0 ? "bg-[#ef4444]/8 border border-[#ef4444]/20" : "bg-[#f5f5fa] border border-[#e8e8f0]"}`}>
              <div className={`text-[16px] font-black ${missed > 0 ? "text-[#ef4444]" : "text-[#111111]"}`}>{missed}</div>
              <div className="text-[8px] text-[#888899]">Kaçırılan</div>
            </div>
            <div className={`rounded-lg p-2 text-center ${connCritical ? "bg-[#ef4444]/8 border border-[#ef4444]/20" : "bg-[#10b981]/8 border border-[#10b981]/20"}`}>
              <div className={`text-[14px] font-black ${connCritical ? "text-[#ef4444]" : "text-[#10b981]"}`}>{avgConn}dk</div>
              <div className="text-[8px] text-[#888899]">Ort. Süre</div>
            </div>
          </div>

          {connCritical ? (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#ef4444]/8 border border-[#ef4444]/20">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444] shrink-0 mt-0.5" />
              <span className="text-[10px] font-semibold text-[#ef4444]">
                Min. bağlantı süresi ({MIN_CONN}dk) altında — kritik
              </span>
            </div>
          ) : atRisk > 0 ? (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#f59e0b]/8 border border-[#f59e0b]/20">
              <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] shrink-0 mt-0.5" />
              <span className="text-[10px] font-semibold text-[#f59e0b]">
                {atRisk} bağlantı risk altında — müdahale önerilir
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#10b981]/8 border border-[#10b981]/20">
              <CheckCircle className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
              <span className="text-[10px] font-semibold text-[#10b981]">Tüm bağlantılar güvende</span>
            </div>
          )}

          <Link href="/hub-control"
            className="mt-2 w-full py-1.5 rounded-lg border border-[#e8e8f0] text-[10px] font-semibold text-[#666677] hover:bg-[#f5f5fa] flex items-center justify-center gap-1 transition-colors">
            Hub Detayı <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar nav ─────────────────────────────────────────────────────────────

const NAV = [
  { href: "/",          icon: LayoutDashboard, label: "Dashboard"    },
  { href: "/iocc",      icon: Activity,        label: "IOCC"         },
  { href: "/pcc",       icon: Users,           label: "Yolcular"     },
  { href: "/crew",      icon: UserCheck,       label: "Mürettebat"   },
  { href: "/baggage",   icon: Luggage,         label: "Bagaj"        },
  { href: "/impact",    icon: GitFork,         label: "Etki Grafiği" },
  { href: "/hub-control", icon: Network,       label: "Hub"          },
  { href: "/prediction",  icon: TrendingUp,    label: "Risk"         },
  { href: "/hotels",    icon: Hotel,           label: "Oteller"      },
  { href: "/buses",     icon: Bus,             label: "Otobüsler"    },
  { href: "/audit",     icon: FileText,        label: "Kayıtlar"     },
]

function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 bg-white border-r border-[#e8e8f0] flex flex-col shrink-0 h-full">
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-[#e8e8f0]">
        <div className="w-8 h-8 rounded-lg bg-[#E81932] flex items-center justify-center shadow-sm shadow-[#E81932]/30">
          <Plane className="w-4 h-4 text-white -rotate-45" />
        </div>
        <div>
          <div className="text-[13px] font-black text-[#111111] leading-none">JetNexus</div>
          <div className="text-[9px] text-[#aaaabc] mt-0.5">IRROPS AI</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-0.5 transition-all group ${
                active ? "bg-[#E81932]/8 text-[#E81932]" : "text-[#666677] hover:bg-[#f5f5fa] hover:text-[#333344]"
              }`}>
              <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[#E81932]" : "text-[#aaaabc] group-hover:text-[#666677]"}`} />
              <span className="text-[12px] font-medium">{label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto text-[#E81932]" />}
            </Link>
          )
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-[#e8e8f0] p-2">
        <Link href="/settings"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[#666677] hover:bg-[#f5f5fa] hover:text-[#333344] transition-all group">
          <Settings className="w-4 h-4 text-[#aaaabc] group-hover:text-[#666677]" />
          <span className="text-[12px] font-medium">Ayarlar</span>
        </Link>
      </div>
    </aside>
  )
}

// ─── Crisis Card ──────────────────────────────────────────────────────────────

function CrisisCard({ crisis }: { crisis: Crisis }) {
  const isCancel = crisis.crisis_type === "cancellation"
  return (
    <div className={`rounded-xl border p-4 ${isCancel ? "bg-[#ef4444]/4 border-[#ef4444]/15" : "bg-[#f59e0b]/4 border-[#f59e0b]/15"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCancel ? "bg-[#ef4444]/10" : "bg-[#f59e0b]/10"}`}>
            <AlertTriangle className={`w-4 h-4 ${isCancel ? "text-[#ef4444]" : "text-[#f59e0b]"}`} />
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#111111]">{crisis.flight_number}</div>
            <div className="text-[10px] text-[#888899]">{crisis.origin} → {crisis.destination}</div>
          </div>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
          isCancel
            ? "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20"
            : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"
        }`}>
          {isCancel ? "İPTAL" : "GECİKME"}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-[#666677]">
          <Users className="w-3.5 h-3.5" />
          <span>{crisis.affected_passengers} yolcu</span>
        </div>
        <Link href="/iocc"
          className="flex items-center gap-1 text-[10px] font-semibold text-[#E81932] hover:underline">
          Detay <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e8e8f0] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-[#888899] font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}/10`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className={`text-[26px] font-black leading-none ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-[#aaaabc] mt-1">{sub}</div>}
    </div>
  )
}

// ─── Flight Row ───────────────────────────────────────────────────────────────

function FlightRow({ flight }: { flight: Flight }) {
  const statusMap: Record<string, { label: string; color: string }> = {
    SCHEDULED: { label: "Planlandı",  color: "text-[#10b981] bg-[#10b981]/8 border-[#10b981]/15" },
    DELAYED:   { label: "Gecikmeli", color: "text-[#f59e0b] bg-[#f59e0b]/8 border-[#f59e0b]/15" },
    CANCELLED: { label: "İptal",     color: "text-[#ef4444] bg-[#ef4444]/8 border-[#ef4444]/15" },
    ACTIVE:    { label: "Aktif",     color: "text-[#3b82f6] bg-[#3b82f6]/8 border-[#3b82f6]/15" },
  }
  const s = statusMap[flight.status] ?? statusMap.SCHEDULED
  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-[#fafafa] transition-colors border-b border-[#f5f5fa] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#f0f0f8] flex items-center justify-center shrink-0">
        <Plane className="w-3.5 h-3.5 text-[#9999bb] -rotate-45" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-bold text-[#111111]">{flight.flight_number}</div>
        <div className="text-[10px] text-[#888899]">{flight.origin} → {flight.destination}</div>
      </div>
      <div className="text-right">
        <div className="text-[10px] text-[#666677]">{flight.available_seats} koltuk</div>
        <div className="text-[9px] text-[#aaaabc]">{flight.aircraft_type}</div>
      </div>
      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>
    </div>
  )
}

// ─── Passenger Row ────────────────────────────────────────────────────────────

function PassengerRow({ p }: { p: PccPassenger }) {
  const tierColor: Record<string, string> = {
    PLATINUM: "text-[#E81932] bg-[#E81932]/8 border-[#E81932]/15",
    GOLD:     "text-[#f59e0b] bg-[#f59e0b]/8 border-[#f59e0b]/15",
    SILVER:   "text-[#888899] bg-[#888899]/8 border-[#888899]/15",
    NONE:     "text-[#aaaabc] bg-[#f5f5fa] border-[#e0e0ee]",
  }
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa] transition-colors border-b border-[#f5f5fa] last:border-0">
      <div className="w-7 h-7 rounded-full bg-[#e8e8f4] flex items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-[#9999bb]">{p.name.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-[#111111] truncate">{p.name}</div>
        <div className="text-[9px] text-[#888899]">{p.pnr} · {p.flight_number}</div>
      </div>
      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${tierColor[p.loyalty_tier] ?? tierColor.NONE}`}>
        {p.loyalty_tier}
      </span>
      {p.compensation_eur && p.compensation_eur > 0 && (
        <span className="text-[10px] font-semibold text-[#10b981] shrink-0">€{p.compensation_eur}</span>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats,             setStats]             = useState<DashboardStats | null>(null)
  const [crises,            setCrises]            = useState<Crisis[]>([])
  const [passengers,        setPassengers]        = useState<PccPassenger[]>([])
  const [flights,           setFlights]           = useState<Flight[]>([])
  const [decisions,         setDecisions]         = useState<Decision[]>([])
  const [recoveryPlan,      setRecoveryPlan]      = useState<RecoveryPlan | null>(null)
  const [hubSummary,        setHubSummary]        = useState<HubSummary | null>(null)
  const [loading,           setLoading]           = useState(true)
  const [refreshing,        setRefreshing]        = useState(false)
  const [triggering,        setTriggering]        = useState<string | null>(null)
  const [executingApproval, setExecutingApproval] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [s, c, f, hub] = await Promise.all([
        dashboardApi.stats(),
        crisisApi.active(),
        flightsApi.list(),
        hubApi.summary().catch(() => null),
      ])
      setStats(s); setCrises(c); setFlights(f); setHubSummary(hub)
      if (c.length > 0) {
        const crisisId = c[0].id
        const [p, dec, recovery] = await Promise.all([
          pccApi.atRisk().catch(() => []),
          crisisApi.decisions(crisisId).catch(() => []),
          recoveryApi.plan(crisisId).catch(() => null),
        ])
        setPassengers(p); setDecisions(dec); setRecoveryPlan(recovery)
      } else {
        setPassengers([]); setDecisions([]); setRecoveryPlan(null)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 15_000)
    return () => clearInterval(id)
  }, [fetchAll])

  async function executeAllDecisions() {
    if (crises.length === 0) return
    setExecutingApproval(true)
    try {
      await ioccApi.approveAll(crises[0].id)
      await fetchAll()
    } catch { /* ignore */ }
    finally { setExecutingApproval(false) }
  }

  async function triggerCrisis(flight: Flight) {
    setTriggering(flight.flight_number)
    try {
      await crisisApi.trigger({
        flight_number: flight.flight_number,
        crisis_type: "cancellation",
        severity: "high",
        reason: `Demo — ${flight.flight_number} iptal`,
      })
      await fetchAll()
    } catch { /* ignore */ }
    finally { setTriggering(null) }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f5f5fa]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E81932] flex items-center justify-center shadow-lg shadow-[#E81932]/30">
            <Plane className="w-6 h-6 text-white -rotate-45" />
          </div>
          <Loader2 className="w-5 h-5 text-[#E81932] animate-spin" />
          <span className="text-[12px] text-[#888899]">Yükleniyor…</span>
        </div>
      </div>
    )
  }

  const hasCrisis = crises.length > 0

  const STATIC_ROUTES: FlightRoute[] = [
    { id: "1", from: [28.82, 40.98], to: [-0.45,  51.47], status: "active", code: "IST-LHR" },
    { id: "2", from: [28.82, 40.98], to: [2.55,   49.01], status: "active", code: "IST-CDG" },
    { id: "3", from: [28.82, 40.98], to: [8.57,   50.03], status: "active", code: "IST-FRA" },
    { id: "4", from: [28.82, 40.98], to: [-73.78, 40.64], status: "active", code: "IST-JFK" },
    { id: "5", from: [28.82, 40.98], to: [55.36,  25.25], status: "active", code: "IST-DXB" },
    { id: "6", from: [28.82, 40.98], to: [103.98,  1.36], status: "active", code: "IST-SIN" },
  ]

  const dynamicRoutes: FlightRoute[] = hasCrisis
    ? STATIC_ROUTES.map((r, i) => ({
        ...r,
        status: i === 0
          ? (crises[0]?.crisis_type === "cancellation" ? "cancelled" : "delayed")
          : "active",
      }))
    : STATIC_ROUTES

  const flightMarkers: FlightMarker[] = flights.slice(0, 6).map((f, i) => ({
    id: String(i),
    coordinates: [28.82 + i * 6, 40.98 + i * 1.5] as [number, number],
    code: f.flight_number,
    status: f.status === "CANCELLED" ? "grounded"
          : f.status === "DELAYED"   ? "delayed"
          : "active",
  }))

  return (
    <div className="h-screen flex bg-[#f5f5fa] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-[#e8e8f0] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-black text-[#111111]">Dashboard</h1>
            {hasCrisis && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 text-[10px] font-bold text-[#ef4444]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                {crises.length} KRİZ AKTİF
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#888899]">{new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}</span>
            <button onClick={() => { setRefreshing(true); fetchAll() }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#f5f5fa] border border-[#e0e0ee] text-[#555566] hover:bg-[#ebebf4] transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Yenile
            </button>
          </div>
        </header>

        {/* Crisis banner */}
        {hasCrisis && (
          <div className="bg-[#ef4444]/6 border-b border-[#ef4444]/15 px-6 py-2.5 flex items-center gap-3 shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0" />
            <span className="text-[12px] font-bold text-[#ef4444]">Kriz Modu Aktif</span>
            <span className="text-[11px] text-[#ef4444]/70">
              {crises.reduce((s, c) => s + (c.affected_passengers ?? 0), 0)} yolcu etkilendi
            </span>
            <Link href="/iocc" className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-[#E81932] hover:underline">
              IOCC Merkezi <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            <StatCard label="Aktif Kriz"    value={stats?.crises.active ?? 0}   icon={AlertTriangle} color="text-[#ef4444]" sub="şu an devam eden" />
            <StatCard label="Etkilenen Yolcu" value={stats?.passengers ?? 0}    icon={Users}         color="text-[#f59e0b]" sub="kriz kapsamında" />
            <StatCard label="Verilen Karar" value={stats?.decisions ?? 0}        icon={CheckCircle}   color="text-[#10b981]" sub="AI otomatik" />
            <StatCard label="EU261 Maliyet" value={`€${((stats?.total_compensation_eur ?? 0) / 1000).toFixed(0)}K`} icon={Euro} color="text-[#3b82f6]" sub="toplam tazminat" />
          </div>

          {/* Dünya Haritası */}
          <div className="mb-5 h-64 rounded-xl overflow-hidden">
            <FlightMap routes={dynamicRoutes} markers={flightMarkers} hasCrisis={hasCrisis} />
          </div>

          <div className="grid grid-cols-3 gap-4">

            {/* Sol kolon: Aktif Krizler + Demo */}
            <div className="flex flex-col gap-4">

              {/* Aktif Krizler */}
              <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f6]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#E81932]" />
                    <span className="text-[13px] font-bold text-[#111111]">Aktif Krizler</span>
                  </div>
                  <span className="text-[10px] text-[#888899]">{crises.length} kriz</span>
                </div>
                <div className="p-3 space-y-2">
                  {crises.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <CheckCircle className="w-8 h-8 text-[#10b981]/40" />
                      <p className="text-[11px] text-[#aaaabc]">Aktif kriz yok</p>
                    </div>
                  ) : crises.map(c => <CrisisCard key={c.id} crisis={c} />)}
                </div>
              </div>

              {/* Demo — Kriz Tetikle */}
              <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f0f0f6]">
                  <Zap className="w-4 h-4 text-[#f59e0b]" />
                  <span className="text-[13px] font-bold text-[#111111]">Demo — Kriz Tetikle</span>
                </div>
                <div className="p-3 space-y-1.5">
                  {flights.slice(0, 4).map(f => (
                    <button key={f.id} onClick={() => triggerCrisis(f)}
                      disabled={!!triggering}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#fafafa] border border-[#e8e8f0] hover:bg-[#f0f0f8] hover:border-[#E81932]/20 transition-colors text-left disabled:opacity-50">
                      <div>
                        <div className="text-[11px] font-bold text-[#111111]">{f.flight_number}</div>
                        <div className="text-[9px] text-[#888899]">{f.origin} → {f.destination}</div>
                      </div>
                      {triggering === f.flight_number
                        ? <Loader2 className="w-3.5 h-3.5 text-[#E81932] animate-spin" />
                        : <span className="text-[9px] font-bold text-[#E81932]">İptal Et</span>
                      }
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Orta kolon: Risk Altındaki Yolcular */}
            <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f6]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#E81932]" />
                  <span className="text-[13px] font-bold text-[#111111]">Risk Altındaki Yolcular</span>
                </div>
                <Link href="/pcc" className="text-[10px] font-semibold text-[#E81932] hover:underline flex items-center gap-0.5">
                  Tümü <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                {passengers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <Users className="w-8 h-8 text-[#e0e0ee]" />
                    <p className="text-[11px] text-[#aaaabc]">
                      {hasCrisis ? "Yolcu verisi yükleniyor…" : "Aktif kriz yok"}
                    </p>
                  </div>
                ) : passengers.slice(0, 12).map(p => <PassengerRow key={p.pnr} p={p} />)}
              </div>
            </div>

            {/* Sağ kolon: Uçuşlar + Hızlı Erişim */}
            <div className="flex flex-col gap-4">

              {/* Aktif Uçuşlar */}
              <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden flex-1">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f6]">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-[#E81932] -rotate-45" />
                    <span className="text-[13px] font-bold text-[#111111]">Uçuşlar</span>
                  </div>
                  <span className="text-[10px] text-[#888899]">{flights.length} uçuş</span>
                </div>
                <div className="overflow-y-auto max-h-64">
                  {flights.slice(0, 8).map(f => <FlightRow key={f.id} flight={f} />)}
                </div>
              </div>

              {/* Hızlı Erişim */}
              <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f0f0f6]">
                  <Clock className="w-4 h-4 text-[#E81932]" />
                  <span className="text-[13px] font-bold text-[#111111]">Hızlı Erişim</span>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {[
                    { href: "/iocc",      icon: Activity,   label: "IOCC",        color: "text-[#E81932]",  bg: "bg-[#E81932]/8"  },
                    { href: "/pcc",       icon: Users,      label: "Yolcular",    color: "text-[#3b82f6]",  bg: "bg-[#3b82f6]/8"  },
                    { href: "/crew",      icon: UserCheck,  label: "Mürettebat",  color: "text-[#10b981]",  bg: "bg-[#10b981]/8"  },
                    { href: "/baggage",   icon: Luggage,    label: "Bagaj",       color: "text-[#f59e0b]",  bg: "bg-[#f59e0b]/8"  },
                    { href: "/impact",    icon: GitFork,    label: "Etki",        color: "text-[#8b5cf6]",  bg: "bg-[#8b5cf6]/8"  },
                    { href: "/prediction",icon: TrendingUp, label: "Risk",        color: "text-[#06b6d4]",  bg: "bg-[#06b6d4]/8"  },
                  ].map(({ href, icon: Icon, label, color, bg }) => (
                    <Link key={href} href={href}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-[#e8e8f0] hover:bg-[#f5f5fa] hover:border-[#d0d0e4] transition-all group">
                      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <span className="text-[10px] font-semibold text-[#666677] group-hover:text-[#333344]">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── 1. Flight Status Alert Panel ─────────────────────────────── */}
          {hasCrisis && crises[0] && (
            <div className="mt-4">
              <FlightStatusPanel crisis={crises[0]} flights={flights} />
            </div>
          )}

          {/* ── 2 & 3. Alternative Flight Assignment + Hotel Arrangements ── */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <AlternativeFlightPanel
              decisions={decisions}
              altFlights={flights.filter(f => !crises.some(c => c.flight_number === f.flight_number))}
              passengers={passengers}
              onExecute={executeAllDecisions}
              executing={executingApproval}
            />
            <HotelArrangementsPanel recoveryPlan={recoveryPlan} />
          </div>

          {/* ── 4 & 5. Passenger Rights + OTP/ACT KPI ───────────────────── */}
          <div className="grid grid-cols-3 gap-4 mt-4 mb-2">
            <PassengerRightsPanel crisis={crises[0] ?? null} />
            <div className="col-span-2">
              <OtpActPanel flights={flights} hubSummary={hubSummary} />
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
