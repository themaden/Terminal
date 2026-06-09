"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { StatsBar } from "@/components/dashboard/stats-bar"
import { FlightMap } from "@/components/dashboard/flight-map"
import { OperationalPanel } from "@/components/dashboard/operational-panel"
import { PassengerTable } from "@/components/dashboard/passenger-table"
import { HotelCapacityChart } from "@/components/dashboard/hotel-chart"
import { BusQueueTable } from "@/components/dashboard/bus-queue"
import {
  dashboardApi, crisisApi, pccApi, flightsApi, recoveryApi,
  type DashboardStats, type Crisis, type PccPassenger, type Flight,
  type RecoveryPlan,
} from "@/lib/api"
import { useCrisisUpdates, useFlightUpdates } from "@/lib/ws"
import { Zap, Loader2, AlertTriangle, Plane } from "lucide-react"
import { IrropsSimulator } from "@/components/dashboard/irrops-simulator"
import { ThreatRadar } from "@/components/dashboard/threat-radar"
import { CostMeter } from "@/components/dashboard/cost-meter"
import { CrisisExplainer } from "@/components/dashboard/crisis-explainer"
import { RecoveryTimeline } from "@/components/dashboard/recovery-timeline"

// ── Statik görsel veri ────────────────────────────────────────────────────────

const flightRoutes = [
  { id: "1", from: [28.82, 40.98] as [number, number], to: [-0.45, 51.47]  as [number, number], status: "active" as const, code: "IST-LHR" },
  { id: "2", from: [28.82, 40.98] as [number, number], to: [2.35, 48.86]   as [number, number], status: "active" as const, code: "IST-CDG" },
  { id: "3", from: [28.82, 40.98] as [number, number], to: [13.39, 52.51]  as [number, number], status: "active" as const, code: "IST-BER" },
  { id: "4", from: [28.82, 40.98] as [number, number], to: [-73.78, 40.64] as [number, number], status: "active" as const, code: "IST-JFK" },
]

const hotelData = [
  { name: "Hilton T4",   capacity: 320, booked: 233 },
  { name: "Radisson",    capacity: 280, booked: 235 },
  { name: "Marriott",    capacity: 240, booked: 128 },
  { name: "Sofitel",     capacity: 180, booked: 157 },
  { name: "Premier Inn", capacity: 440, booked: 242 },
]

const busPassengers = [
  { pnr: "TK1981-1", name: "IST Hub → Hilton T4",  class: "Elite",    status: "Tamamlandi" as const, targetFlight: "Transfer" },
  { pnr: "TK1981-2", name: "IST Hub → Radisson",   class: "Business", status: "Tamamlandi" as const, targetFlight: "Transfer" },
  { pnr: "TK1821-1", name: "IST Hub → Marriott",   class: "Economy",  status: "Gecikti"    as const, targetFlight: "Transfer" },
]

const busTabs = [
  { id: "elite",     label: "ELITE/VIP", count: 0 },
  { id: "families",  label: "AİLELER",   count: 0 },
  { id: "um",        label: "UM",         count: 0 },
  { id: "connecting",label: "AKTARMA",   count: 0 },
]

const operationalRules = [
  { id: "1", name: "Elite Önceliklendirme", status: "TAMAMLANDI"  as const },
  { id: "2", name: "Aile Birlikteliği",     status: "DEVAM EDIYOR" as const },
  { id: "3", name: "En Düşük Maliyet",      status: "BEKLEMEDE"   as const },
]

// ── Ticker mesajları ──────────────────────────────────────────────────────────
const TICKER_MSGS = [
  "AI sistemi aktif — MILP optimizasyon motoru hazır",
  "Hub bağlantı monitörü çalışıyor — IST Hub",
  "Bildirim servisi online — SMS/Email hazır",
  "EU261 uyum motoru yüklendi — CompensationAgent",
  "50 yolcu • 7 uçuş • 200 karar verisi yüklendi",
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function crisisToSidebarFlight(c: Crisis) {
  return {
    id: String(c.id), code: c.flight_number,
    route: `${c.origin}-${c.destination}`,
    status: (c.crisis_type === "delay" ? "ROTAR" : "IPTAL") as "IPTAL" | "ROTAR",
    delay: c.crisis_type === "delay" ? "240dk" : undefined,
    section: "Yolcular", passengers: [] as { name: string; type?: string }[],
  }
}

function flightToSidebarFlight(f: Flight) {
  return {
    id: String(f.id), code: f.flight_number,
    route: `${f.origin}-${f.destination}`,
    status: (f.status === "DELAYED" ? "ROTAR" : "IPTAL") as "IPTAL" | "ROTAR",
    section: "Yolcular", passengers: [] as { name: string; type?: string }[],
  }
}

function pccToTablePassenger(p: PccPassenger) {
  return {
    pnr: p.pnr, name: p.name, company: p.flight_number,
    profile: p.loyalty_tier, location: p.origin ?? "",
    assignedHotel: p.hotel ?? "—", status: p.decision_status,
  }
}

// ── Loading Screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  const [phase, setPhase] = useState(0)
  const phases = [
    "Backend'e bağlanıyor...",
    "Uçuş verileri yükleniyor...",
    "AI servisleri başlatılıyor...",
    "Sistem hazırlanıyor...",
  ]
  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % phases.length), 800)
    return () => clearInterval(id)
  }, [phases.length])

  return (
    <div className="h-screen flex flex-col bg-[#f7f7fa]">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          {/* Radar circle */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-[#E81932]/10" />
            <div className="absolute inset-2 rounded-full border border-[#E81932]/15" />
            <div className="absolute inset-4 rounded-full border border-[#E81932]/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#E81932] animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full border border-[#E81932]/30 animate-ping" />
          </div>
          {/* Title */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Plane className="w-4 h-4 text-[#E81932] -rotate-45" />
              <span className="text-sm font-bold text-[#111111] tracking-widest uppercase">IRROPS Komuta Merkezi</span>
            </div>
            <p className="text-xs text-[#999aaa] font-mono">{phases[phase]}</p>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {phases.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i <= phase ? "bg-[#E81932]" : "bg-[#dddde8]"
              }`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats]         = useState<DashboardStats | null>(null)
  const [crises, setCrises]       = useState<Crisis[]>([])
  const [passengers, setPassengers] = useState<PccPassenger[]>([])
  const [flights, setFlights]     = useState<Flight[]>([])
  const [loading, setLoading]     = useState(true)
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null)
  const [tickerIdx, setTickerIdx] = useState(0)
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlan | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [s, c, f] = await Promise.all([dashboardApi.stats(), crisisApi.active(), flightsApi.list()])
      setStats(s); setCrises(c); setFlights(f)
      if (c.length > 0) {
        try { setPassengers(await pccApi.atRisk()) } catch { /* kriz yoksa boş */ }
        try {
          const plan = await recoveryApi.plan(String(c[0].id))
          setRecoveryPlan(plan)
        } catch { /* ignore */ }
      } else {
        setPassengers([])
        setRecoveryPlan(null)
      }
    } catch (e) { console.error("API hatası:", e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 15_000)
    return () => clearInterval(interval)
  }, [fetchAll])

  // Backend pushes crisis_update / flight_update events over WebSocket —
  // refresh immediately instead of waiting up to 15s for the next poll.
  useCrisisUpdates(fetchAll)
  useFlightUpdates(fetchAll)

  // Ticker rotation
  useEffect(() => {
    const id = setInterval(() => setTickerIdx(i => (i + 1) % TICKER_MSGS.length), 4000)
    return () => clearInterval(id)
  }, [])

  async function handleTriggerCrisis(flightNumber: string, type: "cancellation" | "delay") {
    setTriggerLoading(true); setTriggerMsg(null)
    try {
      await crisisApi.trigger({ flight_number: flightNumber, crisis_type: type, severity: "high",
        reason: `IRROPS Demo — ${flightNumber} ${type}` })
      setTriggerMsg(`✓ ${flightNumber} krizi tetiklendi — AI kararlar üretiyor...`)
      setTimeout(() => { setTriggerMsg(null); fetchAll() }, 3000)
    } catch (e: unknown) {
      setTriggerMsg(`✗ ${e instanceof Error ? e.message : "Hata"}`)
      setTimeout(() => setTriggerMsg(null), 4000)
    } finally { setTriggerLoading(false) }
  }

  if (loading) return <LoadingScreen />

  const hasCrisis = crises.length > 0

  const statsBarData = stats ? {
    impactedFlights: stats.crises.active,
    totalPassengers: stats.passengers,
    reAccommodated:  stats.decisions,
    manualCheck:     stats.crises.active,
    hotelBeds:       1200,
    busStatus:       "15/20",
  } : { impactedFlights: 0, totalPassengers: 0, reAccommodated: 0, manualCheck: 0, hotelBeds: 0, busStatus: "—" }

  const activeCrisisId = crises[0]?.id ? String(crises[0].id) : ""

  const operationalActions = [
    { id: "1", label: `TOPLU OTEL KUPONU (${stats?.crises.active ?? 0} kriz)`, variant: "primary"    as const, crisisId: activeCrisisId, actionType: "voucher" as const },
    { id: "2", label: "TRANSFER OTOBÜSÜ SEVKİ",                                variant: "secondary"  as const, crisisId: activeCrisisId, actionType: "bus"     as const },
    { id: "3", label: "YER EKİBİ BİLDİRİMİ",                                  variant: "secondary"  as const, crisisId: activeCrisisId, actionType: "notify"  as const },
  ]

  const sidebarFlights = hasCrisis
    ? crises.map(crisisToSidebarFlight)
    : flights.filter(f => f.status !== "SCHEDULED").slice(0, 3).map(flightToSidebarFlight)

  const flightMarkers = flights.slice(0, 8).map((f, i) => ({
    id: String(i),
    coordinates: [28.82 + (i * 5), 40.98 + (i * 2)] as [number, number],
    code: f.flight_number,
    status: f.status === "CANCELLED" ? "grounded" as const
          : f.status === "DELAYED"   ? "delayed"  as const
          : "active" as const,
  }))

  const dynamicRoutes = hasCrisis
    ? flightRoutes.map(r => ({
        ...r,
        status: crises.some(c => c.crisis_type === "cancellation") ? "cancelled" as const :
                crises.some(c => c.crisis_type === "delay")        ? "delayed"   as const :
                "active" as const,
      }))
    : flightRoutes

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-700 ${hasCrisis ? "bg-[#ededf4]" : "bg-[#f7f7fa]"}`}>

      {/* Crisis Alert Banner */}
      {hasCrisis ? (
        <div className="relative bg-[#ef4444]/8 border-b border-[#ef4444]/20 px-4 py-2 flex items-center justify-between gap-4 overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-linear-to-r from-[#ef4444]/5 via-transparent to-[#ef4444]/5 pointer-events-none" />
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ef4444] animate-pulse" />
            <span className="text-xs font-bold text-[#ef4444] uppercase tracking-wider">
              KRİZ MODU AKTİF — {crises.length} AKSAKLIK
            </span>
            <div className="flex gap-1.5 ml-2">
              {crises.map(c => (
                <span key={c.id} className="px-2 py-0.5 bg-[#ef4444]/10 border border-[#ef4444]/25 rounded-full text-[10px] text-[#ef4444] font-semibold">
                  {c.flight_number} {c.crisis_type === "cancellation" ? "İPTAL" : "GECİKME"}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#ef4444]/60">{crises.reduce((s, c) => s + (c.affected_passengers ?? 0), 0)} yolcu etkilendi</span>
          </div>
        </div>
      ) : (
        /* Demo Banner */
        <div className="relative bg-[#f7f7fa] border-b border-[#ebebf2] px-4 py-1.5 flex items-center justify-center gap-4 overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#E81932]/4 to-transparent pointer-events-none" />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E81932] animate-pulse" />
            <span className="text-[10px] text-[#999aaa] font-medium">Demo:</span>
          </div>
          {triggerMsg ? (
            <span className={`text-xs font-semibold ${triggerMsg.startsWith("✓") ? "text-[#10b981]" : "text-[#ef4444]"}`}>
              {triggerMsg}
            </span>
          ) : (
            <div className="flex gap-1.5 items-center">
              {flights.slice(0, 3).map(f => (
                <button key={f.id} disabled={triggerLoading} onClick={() => handleTriggerCrisis(f.flight_number, "cancellation")}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#ef4444]/8 hover:bg-[#ef4444]/14 border border-[#ef4444]/20 rounded-full text-[10px] text-[#ef4444]/80 hover:text-[#ef4444] font-semibold transition-all duration-150 disabled:opacity-50">
                  {triggerLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                  {f.flight_number} İptal
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Header />

      {/* Cost Meter — EU261 canlı sayaç */}
      {stats && (
        <CostMeter
          totalCompensationEur={stats.total_compensation_eur}
          activeCrises={stats.crises.active}
          affectedPassengers={stats.passengers}
        />
      )}

      {/* Threat Radar strip + floating panel */}
      <ThreatRadar onCrisisTriggered={fetchAll} />

      {/* AI Ticker */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-[#f7f7fa] border-b border-[#e8e8f0] shrink-0 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1 h-1 rounded-full bg-[#E81932] animate-pulse" />
          <span className="text-[8px] font-bold text-[#9999bb] uppercase tracking-[0.2em]">SİSTEM</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <p key={tickerIdx} className="text-[10px] text-[#999aaa] font-mono truncate transition-all duration-500">
            &gt; {TICKER_MSGS[tickerIdx]}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-[#10b981]" />
          <span className="text-[8px] text-[#10b981] font-mono">NOMINAL</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeDisruptions={sidebarFlights} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <StatsBar stats={statsBarData} />

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col p-2.5 gap-2.5 overflow-hidden">

              {/* Map */}
              <div className="flex-1 min-h-0">
                <FlightMap routes={dynamicRoutes} markers={flightMarkers} hasCrisis={hasCrisis} />
              </div>

              {/* Bottom panels */}
              <div className="grid grid-cols-3 gap-2.5 h-56">
                <PassengerTable
                  passengers={passengers.map(pccToTablePassenger)}
                  title="Risk Altındaki Yolcular"
                />
                <HotelCapacityChart
                  data={hotelData}
                  totalCapacity={1460}
                  available={995}
                  crisisId={activeCrisisId || undefined}
                  crisisHotels={recoveryPlan?.hotel_assignments}
                />
                <BusQueueTable
                  passengers={busPassengers}
                  tabs={busTabs.map(t => ({ ...t, count: crises.reduce((s, c) => s + (c.affected_passengers ?? 0), 0) }))}
                  crisisId={activeCrisisId || undefined}
                  busRoutes={recoveryPlan?.bus_routes}
                />
              </div>
            </div>

            <div className="flex flex-col overflow-hidden">
              <OperationalPanel
                rules={operationalRules}
                actions={operationalActions}
                onRefresh={fetchAll}
                hasCrisis={hasCrisis}
              />
              {hasCrisis && activeCrisisId && (
                <div className="px-2 pb-2 flex flex-col gap-2 overflow-y-auto max-h-72">
                  <CrisisExplainer
                    crisisId={activeCrisisId}
                    crisisType={crises[0]?.crisis_type?.toUpperCase() ?? "CANCELLATION"}
                  />
                  <RecoveryTimeline
                    crisisId={activeCrisisId}
                    crisisType={crises[0]?.crisis_type?.toUpperCase() ?? "CANCELLATION"}
                    onRefresh={fetchAll}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <IrropsSimulator flights={flights} onCrisisTriggered={fetchAll} />
    </div>
  )
}
