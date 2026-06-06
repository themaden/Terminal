"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import {
  Search, RefreshCw, Users, CheckCircle, Clock,
  AlertTriangle, Crown, Loader2, ChevronDown, Inbox,
} from "lucide-react"
import { pccApi, crisisApi, vouchersApi, type PccPassenger, type PccSummary, type Crisis } from "@/lib/api"

// ── Helpers ────────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  PLATINUM: { label: "Platinum", className: "bg-[#E81932]/20 text-[#E81932] border-[#E81932]/30" },
  GOLD:     { label: "Gold",     className: "bg-[#d4a012]/20 text-[#d4a012] border-[#d4a012]/30" },
  SILVER:   { label: "Silver",   className: "bg-[#8a88bc]/20 text-[#888899] border-[#8a88bc]/30" },
  NONE:     { label: "Economy",  className: "bg-[#575578]/20 text-[#666677] border-[#575578]/30" },
}

function TierBadge({ tier }: { tier: string }) {
  const cfg = TIER_CONFIG[tier] ?? { label: tier, className: "bg-[#575578]/20 text-[#666677] border-[#575578]/30" }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${cfg.className}`}>
      {tier === "PLATINUM" && <Crown className="w-3 h-3" />}
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase()
  if (s === "approved" || s === "executed") {
    return <span className="inline-flex items-center gap-1 text-[10px] text-[#10b981]"><CheckCircle className="w-3 h-3" />Onaylandı</span>
  }
  return <span className="inline-flex items-center gap-1 text-[10px] text-[#E81932]"><Clock className="w-3 h-3" />Bekliyor</span>
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PccPage() {
  const [summary, setSummary] = useState<PccSummary | null>(null)
  const [passengers, setPassengers] = useState<PccPassenger[]>([])
  const [crises, setCrises] = useState<Crisis[]>([])
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "executed">("all")
  const [loading, setLoading] = useState(true)
  const [voucherLoading, setVoucherLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [expandedPnr, setExpandedPnr] = useState<string | null>(null)

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sum, pax, activeCrises] = await Promise.all([
        pccApi.summary(),
        pccApi.atRisk(),
        crisisApi.active(),
      ])
      setSummary(sum)
      setPassengers(pax ?? [])
      setCrises(activeCrises ?? [])
    } catch (e) {
      console.error("PCC fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 15_000)
    return () => clearInterval(id)
  }, [fetchData])

  async function issueVoucher(pnr: string) {
    setVoucherLoading(pnr)
    try {
      const pkg = await vouchersApi.get(pnr)
      showFeedback("success", `€${pkg.total_eur} değerinde kupon gönderildi (${pkg.vouchers.length} kalem)`)
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "Kupon oluşturulamadı")
    } finally {
      setVoucherLoading(null)
    }
  }

  const filtered = passengers.filter(p => {
    const matchesQuery = !query ||
      p.pnr.toLowerCase().includes(query.toLowerCase()) ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.flight_number.toLowerCase().includes(query.toLowerCase())
    const s = p.decision_status?.toLowerCase()
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && s === "pending") ||
      (filter === "executed" && (s === "approved" || s === "executed"))
    return matchesQuery && matchesFilter
  })

  const sidebarFlights = crises.map(c => ({
    id: String(c.id),
    code: c.flight_number,
    route: `${c.origin}-${c.destination}`,
    status: (c.crisis_type === "cancellation" ? "IPTAL" : "ROTAR") as "IPTAL" | "ROTAR",
    section: "Yolcular",
    passengers: [],
  }))

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f2f2f6]">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeDisruptions={sidebarFlights} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#e5e5ed] bg-white">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#E81932]" />
              <h1 className="text-base font-bold text-[#111111]">PCC — Yolcu Bakım Merkezi</h1>
              {passengers.length > 0 && (
                <span className="px-2 py-0.5 bg-[#E81932]/20 text-[#E81932] border border-[#E81932]/30 rounded-full text-[10px] font-bold">
                  {passengers.length} RİSK ALTINDA
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {feedback && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border ${
                  feedback.type === "success"
                    ? "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]"
                    : "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
                }`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {feedback.message}
                </div>
              )}
              <button onClick={fetchData} disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#e8e8f0] hover:bg-[#e2e2ec] border border-[#2c2c40] rounded-lg text-xs text-[#111111] transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Yenile
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#E81932] animate-spin" />
                <p className="text-sm text-[#666677]">PCC verileri yükleniyor...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">

              {/* KPI Kartları */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Bekleyen Karar",   value: summary?.pending_decisions ?? 0,               icon: <Clock className="w-5 h-5" />,        color: "text-[#E81932]" },
                  { label: "Tamamlanan",        value: summary?.executed_decisions ?? 0,              icon: <CheckCircle className="w-5 h-5" />,   color: "text-[#10b981]" },
                  { label: "Toplam Tazminat",   value: `€${(summary?.total_compensation_paid_eur ?? 0).toLocaleString()}`, icon: <AlertTriangle className="w-5 h-5" />, color: "text-[#E81932]" },
                  { label: "Aktif Kriz",        value: summary?.active_crises ?? 0,                  icon: <AlertTriangle className="w-5 h-5" />, color: "text-[#ef4444]" },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white border border-[#e5e5ed] rounded-lg px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#666677] uppercase tracking-wider mb-0.5">{kpi.label}</p>
                      <p className="text-2xl font-bold text-[#111111]">{kpi.value}</p>
                    </div>
                    <div className={kpi.color}>{kpi.icon}</div>
                  </div>
                ))}
              </div>

              {/* Filtreler + Arama */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666677]" />
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="PNR, isim veya uçuş ara…"
                    className="w-full bg-white border border-[#e5e5ed] rounded-lg pl-10 pr-4 py-2 text-sm text-[#111111] placeholder:text-[#666677] focus:outline-none focus:ring-1 focus:ring-[#E81932]"
                  />
                </div>
                <div className="flex gap-1">
                  {(["all", "pending", "executed"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        filter === f ? "bg-[#E81932] text-[#111111]" : "bg-white border border-[#e5e5ed] text-[#888899] hover:text-[#111111]"
                      }`}>
                      {f === "all" ? "Tümü" : f === "pending" ? "Bekleyen" : "Tamamlanan"}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-[#666677] ml-auto">{filtered.length} / {passengers.length} yolcu</span>
              </div>

              {/* Tablo */}
              <div className="flex-1 bg-white border border-[#e5e5ed] rounded-lg overflow-hidden flex flex-col min-h-0">
                {passengers.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
                    <div className="w-16 h-16 bg-[#f2f2f6] rounded-full flex items-center justify-center border border-[#e5e5ed]">
                      <Inbox className="w-8 h-8 text-[#666677]" />
                    </div>
                    <div className="text-center">
                      <p className="text-[#111111] font-semibold mb-1">Risk altında yolcu yok</p>
                      <p className="text-sm text-[#666677]">Bir kriz tetiklendiğinde AI kararlar burada görünür.</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-auto flex-1">
                    <table className="w-full text-xs">
                      <thead className="bg-[#f2f2f6] sticky top-0 z-10">
                        <tr>
                          <th className="w-6" />
                          {["PNR", "İsim", "Sınıf", "Tier", "Özel İhtiyaç", "Uçuş", "Otel", "Tazminat", "Durum", ""].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-[10px] text-[#666677] font-medium uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(p => (
                          <>
                            <tr key={p.pnr} className="border-b border-[#e5e5ed]/50 hover:bg-[#e8e8f0]/30 transition-colors">
                              <td className="pl-3">
                                <button onClick={() => setExpandedPnr(expandedPnr === p.pnr ? null : p.pnr)}
                                  className="p-1 hover:bg-[#e8e8f0] rounded transition-colors">
                                  <ChevronDown className={`w-3.5 h-3.5 text-[#666677] transition-transform ${expandedPnr === p.pnr ? "rotate-180" : ""}`} />
                                </button>
                              </td>
                              <td className="px-4 py-3 text-[#E81932] font-mono">{p.pnr}</td>
                              <td className="px-4 py-3 text-[#111111] font-medium">{p.name}</td>
                              <td className="px-4 py-3 text-[#888899]">{p.ticket_class}</td>
                              <td className="px-4 py-3"><TierBadge tier={p.loyalty_tier} /></td>
                              <td className="px-4 py-3 text-[#888899]">{p.special_needs ?? "—"}</td>
                              <td className="px-4 py-3 text-[#888899]">{p.flight_number}</td>
                              <td className="px-4 py-3 text-[#888899]">{p.hotel ?? "—"}</td>
                              <td className="px-4 py-3 text-[#111111]">{p.compensation_eur ? `€${p.compensation_eur}` : "—"}</td>
                              <td className="px-4 py-3"><StatusBadge status={p.decision_status} /></td>
                              <td className="px-4 py-3">
                                <button onClick={() => issueVoucher(p.pnr)} disabled={voucherLoading === p.pnr}
                                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#e8e8f0] hover:bg-[#e2e2ec] border border-[#2c2c40] rounded text-[10px] text-[#111111] transition-colors disabled:opacity-50">
                                  {voucherLoading === p.pnr && <Loader2 className="w-3 h-3 animate-spin" />}
                                  Kupon Gönder
                                </button>
                              </td>
                            </tr>

                            {expandedPnr === p.pnr && (
                              <tr key={`${p.pnr}-detail`} className="bg-[#f2f2f6]">
                                <td colSpan={11} className="px-8 py-4 border-b border-[#e5e5ed]/50">
                                  <div className="grid grid-cols-4 gap-6 text-xs">
                                    <div>
                                      <p className="text-[10px] text-[#666677] uppercase mb-1">Güzergah</p>
                                      <p className="text-[#111111]">{p.origin ?? "—"} → {p.destination ?? "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-[#666677] uppercase mb-1">Öncelik Skoru</p>
                                      <p className="text-[#E81932] font-bold">{p.priority_score ?? "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-[#666677] uppercase mb-1">Önerilen Aksiyon</p>
                                      <p className="text-[#111111]">{p.recommended_action ?? "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-[#666677] uppercase mb-1">AI Güveni</p>
                                      <p className="text-[#111111]">{p.agent_confidence ? `%${Math.round(p.agent_confidence * 100)}` : "—"}</p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>

                    {filtered.length === 0 && passengers.length > 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-[#666677]">
                        <Users className="w-8 h-8 opacity-30 mb-2" />
                        <p className="text-sm">Arama sonucu bulunamadı</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
