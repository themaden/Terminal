"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { predictionApi, type RiskScore, type PredictionSummary } from "@/lib/api"
import { AlertTriangle, TrendingUp, RefreshCw, Zap, BarChart2, Shield } from "lucide-react"

const MOCK_SUMMARY: PredictionSummary = {
  critical_alerts: 2,
  high_risk: 5,
  medium_risk: 11,
  low_risk: 23,
}

const MOCK_RISKS: RiskScore[] = [
  { flight_number: "TK1981", origin: "IST", destination: "LHR", departure_time: new Date(Date.now() + 3600000).toISOString(), risk_level: "critical", risk_score: 0.91, risk_factors: ["Heathrow yoğunluğu", "Grev uyarısı", "Fırtına tahmini"] },
  { flight_number: "TK1821", origin: "IST", destination: "CDG", departure_time: new Date(Date.now() + 5400000).toISOString(), risk_level: "high", risk_score: 0.74, risk_factors: ["ATC kısıtlaması", "Slot gecikmesi"] },
  { flight_number: "TK2045", origin: "IST", destination: "JFK", departure_time: new Date(Date.now() + 7200000).toISOString(), risk_level: "high", risk_score: 0.68, risk_factors: ["Hava durumu — JFK", "Teknik kontrol"] },
  { flight_number: "TK3312", origin: "IST", destination: "DXB", departure_time: new Date(Date.now() + 9000000).toISOString(), risk_level: "medium", risk_score: 0.45, risk_factors: ["Kapasite sorunu"] },
  { flight_number: "TK4411", origin: "IST", destination: "FRA", departure_time: new Date(Date.now() + 10800000).toISOString(), risk_level: "medium", risk_score: 0.38, risk_factors: ["Geç biniş tahminii"] },
  { flight_number: "TK5521", origin: "IST", destination: "AMS", departure_time: new Date(Date.now() + 14400000).toISOString(), risk_level: "low", risk_score: 0.18, risk_factors: [] },
]

function riskColor(level: string) {
  return {
    critical: { text: "text-[#ef4444]", bg: "bg-[#ef4444]/10 border-[#ef4444]/20", bar: "bg-[#ef4444]" },
    high:     { text: "text-[#E81932]", bg: "bg-[#E81932]/10 border-[#E81932]/20", bar: "bg-[#E81932]" },
    medium:   { text: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10 border-[#3b82f6]/20", bar: "bg-[#3b82f6]" },
    low:      { text: "text-[#10b981]", bg: "bg-[#10b981]/10 border-[#10b981]/20", bar: "bg-[#10b981]" },
  }[level] ?? { text: "text-[#666677]", bg: "bg-[#575578]/10 border-[#575578]/20", bar: "bg-[#575578]" }
}

export default function PredictionPage() {
  const [summary, setSummary] = useState<PredictionSummary>(MOCK_SUMMARY)
  const [risks, setRisks] = useState<RiskScore[]>(MOCK_RISKS)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [s, r] = await Promise.all([predictionApi.summary(), predictionApi.riskScores()])
      setSummary(s)
      if (r.length) setRisks(r)
    } catch { /* mock kalır */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData(); const id = setInterval(fetchData, 60_000); return () => clearInterval(id) }, [fetchData])

  const kpis = [
    { label: "Kritik Uyarı", value: summary.critical_alerts, color: riskColor("critical") },
    { label: "Yüksek Risk", value: summary.high_risk, color: riskColor("high") },
    { label: "Orta Risk", value: summary.medium_risk, color: riskColor("medium") },
    { label: "Düşük Risk", value: summary.low_risk, color: riskColor("low") },
  ]

  const mockSidebar = risks.filter(r => r.risk_level === "critical" || r.risk_level === "high").slice(0, 2).map((r, i) => ({
    id: String(i), code: r.flight_number, route: `${r.origin}-${r.destination}`,
    status: "ROTAR" as const, section: "Yolcular", passengers: [],
  }))

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f2f2f6]">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeDisruptions={mockSidebar} />
        <div className="flex-1 flex flex-col overflow-hidden">

          <div className="flex items-center justify-between px-6 py-3 border-b border-[#e5e5ed] bg-white">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#E81932]" />
              <h1 className="text-base font-bold text-[#111111]">Risk Tahmin — AI Erken Uyarı Sistemi</h1>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#e8e8f0] hover:bg-[#e2e2ec] border border-[#2c2c40] rounded-lg text-xs text-[#111111] transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Yenile
            </button>
          </div>

          <div className="flex-1 overflow-auto p-5 space-y-5">

            {/* KPI */}
            <div className="grid grid-cols-4 gap-4">
              {kpis.map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl border p-4 bg-white ${color.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-[#888899] uppercase tracking-wider">{label}</span>
                    <AlertTriangle className={`w-4 h-4 ${color.text}`} />
                  </div>
                  <span className={`text-2xl font-bold ${color.text}`}>{value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Risk Listesi */}
              <div className="col-span-2 bg-white border border-[#e5e5ed] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#e5e5ed] flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#E81932]" />
                  <h2 className="text-sm font-semibold text-[#111111] uppercase tracking-wider">Uçuş Risk Skorları</h2>
                </div>
                <div className="divide-y divide-[#1e1e2a]">
                  {risks.map(r => {
                    const c = riskColor(r.risk_level)
                    return (
                      <div key={r.flight_number} className="px-5 py-4 hover:bg-[#e8e8f0]/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-20 shrink-0">
                            <span className="text-sm font-bold text-[#111111]">{r.flight_number}</span>
                            <div className="text-[10px] text-[#666677] mt-0.5">{r.origin} → {r.destination}</div>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex gap-1.5 flex-wrap">
                                {r.risk_factors.map(f => (
                                  <span key={f} className="px-2 py-0.5 bg-[#e8e8f0] rounded text-[10px] text-[#888899]">
                                    {f}
                                  </span>
                                ))}
                                {r.risk_factors.length === 0 && (
                                  <span className="text-[10px] text-[#666677]">Risk faktörü yok</span>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ml-2 shrink-0 ${c.bg} ${c.text}`}>
                                {r.risk_level.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-[#e8e8f0] rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${r.risk_score * 100}%` }} />
                              </div>
                              <span className={`text-xs font-mono font-bold ${c.text}`}>
                                {Math.round(r.risk_score * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Sağ Panel */}
              <div className="flex flex-col gap-4">
                <div className="bg-white border border-[#e5e5ed] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-[#E81932]" />
                    <h3 className="text-sm font-semibold text-[#111111] uppercase tracking-wider">Anlık Uyarılar</h3>
                  </div>
                  <div className="space-y-3">
                    {risks.filter(r => r.risk_level === "critical" || r.risk_level === "high").map(r => (
                      <div key={r.flight_number} className="flex items-start gap-3 p-3 bg-[#f2f2f6] rounded-lg border border-[#e5e5ed]">
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${riskColor(r.risk_level).bar}`} />
                        <div>
                          <p className="text-xs text-[#111111] font-medium">{r.flight_number} — {r.origin}→{r.destination}</p>
                          <p className="text-[10px] text-[#666677] mt-0.5">{r.risk_factors[0] ?? "—"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#e5e5ed] rounded-xl p-5 flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-[#10b981]" />
                    <h3 className="text-sm font-semibold text-[#111111] uppercase tracking-wider">Model Durumu</h3>
                  </div>
                  <div className="space-y-3 text-xs">
                    {[
                      { label: "Hava Durumu Modeli", status: "Aktif", ok: true },
                      { label: "ATC Akış Modeli", status: "Aktif", ok: true },
                      { label: "Teknik Risk Modeli", status: "Aktif", ok: true },
                      { label: "Amadeus Entegrasyonu", status: "Sandbox", ok: false },
                    ].map(m => (
                      <div key={m.label} className="flex items-center justify-between">
                        <span className="text-[#888899]">{m.label}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${m.ok ? "bg-[#10b981]/20 text-[#10b981]" : "bg-[#E81932]/20 text-[#E81932]"}`}>
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
