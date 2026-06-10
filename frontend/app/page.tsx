"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  dashboardApi, crisisApi, pccApi, flightsApi,
  type DashboardStats, type Crisis, type PccPassenger, type Flight,
} from "@/lib/api"
import {
  Plane, AlertTriangle, Users, TrendingUp, CheckCircle,
  RefreshCw, Zap, LayoutDashboard, Activity, Network,
  UserCheck, Luggage, GitFork, Settings, ChevronRight,
  Clock, Euro, ArrowRight, Loader2, FileText, Hotel, Bus,
} from "lucide-react"

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
  const [stats,      setStats]      = useState<DashboardStats | null>(null)
  const [crises,     setCrises]     = useState<Crisis[]>([])
  const [passengers, setPassengers] = useState<PccPassenger[]>([])
  const [flights,    setFlights]    = useState<Flight[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [triggering, setTriggering] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [s, c, f] = await Promise.all([
        dashboardApi.stats(),
        crisisApi.active(),
        flightsApi.list(),
      ])
      setStats(s); setCrises(c); setFlights(f)
      if (c.length > 0) {
        try { setPassengers(await pccApi.atRisk()) } catch { setPassengers([]) }
      } else { setPassengers([]) }
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 15_000)
    return () => clearInterval(id)
  }, [fetchAll])

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
        </main>
      </div>
    </div>
  )
}
