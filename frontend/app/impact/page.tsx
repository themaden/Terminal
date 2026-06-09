"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { impactApi, type ImpactGraph } from "@/lib/api"
import {
  GitFork, RefreshCw, AlertTriangle, Users,
  ChevronRight, TrendingUp, Shield,
} from "lucide-react"

const MOCK_CRISIS_IDS = ["1", "2", "3"]

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "1. Derece — UM/Engelli", color: "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20" },
  2: { label: "2. Derece — Elite/Platinum", color: "text-[#E81932] bg-[#E81932]/10 border-[#E81932]/20" },
  3: { label: "3. Derece — Aile/Grup", color: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20" },
  4: { label: "4. Derece — Standart", color: "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20" },
}

const IMPACT_COLORS: Record<string, string> = {
  DIRECT:             "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20",
  MISSED_CONNECTION:  "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
  FAMILY_SPLIT_RISK:  "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20",
  CASCADED:           "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20",
}

export default function ImpactPage() {
  const [crisisId, setCrisisId] = useState(MOCK_CRISIS_IDS[0])
  const [graph, setGraph] = useState<ImpactGraph | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"passengers" | "family" | "domino">("passengers")

  const fetchGraph = useCallback(async () => {
    setLoading(true)
    try { setGraph(await impactApi.graph(crisisId)) }
    catch { /* ignore */ }
    finally { setLoading(false) }
  }, [crisisId])

  const mockSidebar = MOCK_CRISIS_IDS.slice(0, 2).map((id, i) => ({
    id: String(i), code: `Kriz #${id}`, route: "IST→LHR", status: "IPTAL" as const,
    section: "Etki", passengers: [],
  }))

  return (
    <div className="flex h-screen bg-[#f5f5fa] overflow-hidden">
      <Sidebar activeDisruptions={mockSidebar} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Başlık + kontroller */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-black text-[#111111] tracking-tight">Etki Grafiği</h1>
              <p className="text-[11px] text-[#888899] mt-0.5">Domino Etkisi · Aile Bölünme Riski · Bağlantı Kaçırma — §2 Katman 2</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={crisisId} onChange={e => setCrisisId(e.target.value)}
                className="text-[11px] border border-[#e0e0ee] rounded-lg px-3 py-1.5 bg-white text-[#333344] focus:outline-none focus:ring-1 focus:ring-[#E81932]/30">
                {MOCK_CRISIS_IDS.map(id => <option key={id}>Kriz #{id}</option>)}
              </select>
              <button onClick={fetchGraph} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#E81932] text-white hover:bg-[#c0101e] transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Hesapla
              </button>
            </div>
          </div>

          {!graph ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 bg-white rounded-xl border border-[#e8e8f0]">
              <GitFork className="w-12 h-12 text-[#e0e0ee]" />
              <p className="text-[12px] text-[#aaaabc]">Kriz seçin ve "Hesapla" butonuna basın</p>
            </div>
          ) : (
            <>
              {/* Anlatı */}
              <div className="bg-white rounded-xl border border-[#e8e8f0] p-4">
                <p className="text-[11px] text-[#333344] leading-relaxed">{graph.narrative}</p>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Gerçekten Etkilenen", value: graph.truly_affected, sub: `/${graph.total_onboard} yolcu`, color: "text-[#E81932]" },
                  { label: "Bağlantı Kaçırma", value: graph.missed_connections, sub: "yolcu", color: "text-[#f59e0b]" },
                  { label: "Aile Bölünme Riski", value: graph.family_split_risks, sub: "grup", color: "text-[#ef4444]" },
                  { label: "EU261 Yükümlülük", value: `€${(graph.total_eu261_liability_eur / 1000).toFixed(0)}K`, sub: "tahmini", color: "text-[#10b981]" },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="bg-white rounded-xl border border-[#e8e8f0] p-4">
                    <div className={`text-[22px] font-black leading-none ${color}`}>{String(value)}</div>
                    <div className="text-[9px] text-[#aaaabc] mt-0.5">{sub}</div>
                    <div className="text-[10px] text-[#666677] mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {/* 4-Derece Breakdown */}
              <div className="bg-white rounded-xl border border-[#e8e8f0] p-5">
                <h3 className="text-[12px] font-bold text-[#111111] mb-3">Öncelik Dağılımı — §3</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { tier: 1, count: graph.tier1_passengers },
                    { tier: 2, count: graph.tier2_passengers },
                    { tier: 3, count: graph.tier3_passengers },
                    { tier: 4, count: graph.tier4_passengers },
                  ].map(({ tier, count }) => {
                    const cfg = TIER_LABELS[tier]
                    return (
                      <div key={tier} className={`rounded-lg border p-3 ${cfg.color}`}>
                        <div className="text-[20px] font-black leading-none">{count}</div>
                        <div className="text-[9px] mt-1 opacity-80">{cfg.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden">
                <div className="flex border-b border-[#f0f0f6]">
                  {(["passengers", "family", "domino"] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-5 py-3 text-[11px] font-semibold transition-colors border-b-2 ${
                        activeTab === tab
                          ? "border-[#E81932] text-[#E81932]"
                          : "border-transparent text-[#888899] hover:text-[#555566]"
                      }`}>
                      {tab === "passengers" && `Yolcular (${graph.passenger_impacts.length})`}
                      {tab === "family" && `Aile Grupları (${graph.family_groups.length})`}
                      {tab === "domino" && `Domino Zinciri (${graph.domino_chain.length})`}
                    </button>
                  ))}
                </div>

                <div className="max-h-80 overflow-y-auto">

                  {activeTab === "passengers" && (
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-[#f5f5fa] text-[9px] text-[#aaaabc] uppercase tracking-wide">
                          <th className="text-left px-4 py-2.5 font-semibold">PNR</th>
                          <th className="text-left px-4 py-2.5 font-semibold">İsim</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Etki</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Öncelik</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Tazminat</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f5f5fa]">
                        {graph.passenger_impacts.map(p => (
                          <tr key={p.pnr} className="hover:bg-[#fafafa] transition-colors">
                            <td className="px-4 py-2.5 font-mono font-bold text-[#111111]">{p.pnr}</td>
                            <td className="px-4 py-2.5 text-[#333344]">{p.name}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${IMPACT_COLORS[p.impact_type] ?? ""}`}>
                                {p.impact_type.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${TIER_LABELS[p.priority_tier]?.color ?? ""}`}>
                                {p.priority_tier}. Derece
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-[#10b981]">€{p.compensation_eur}</td>
                            <td className="px-4 py-2.5 text-[#888899]">{p.recovery_status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === "family" && (
                    <div className="p-4 space-y-2">
                      {graph.family_groups.length === 0 ? (
                        <p className="text-[11px] text-[#aaaabc] text-center py-8">Aile grubu bulunamadı</p>
                      ) : graph.family_groups.map(g => (
                        <div key={g.group_id} className={`flex items-center gap-4 p-3 rounded-lg border ${
                          g.split_risk ? "bg-[#ef4444]/5 border-[#ef4444]/15" : "bg-[#f5f5fa] border-[#e8e8f0]"
                        }`}>
                          <Users className={`w-4 h-4 shrink-0 ${g.split_risk ? "text-[#ef4444]" : "text-[#9999bb]"}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[#111111]">Grup: {g.group_id}</span>
                              <span className="text-[9px] text-[#888899]">{g.size} kişi</span>
                            </div>
                            <div className="text-[10px] text-[#888899] mt-0.5">{g.members.join(" · ")}</div>
                          </div>
                          {g.split_risk && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20">
                              BÖLÜNME RİSKİ
                            </span>
                          )}
                          {g.same_flight_possible && (
                            <span className="text-[9px] text-[#10b981]">Aynı uçuş mümkün</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "domino" && (
                    <div className="p-4 space-y-2">
                      {graph.domino_chain.map((node, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-[#fafafa] border border-[#e8e8f0]">
                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: node.cascade_depth }).map((_, d) => (
                              <ChevronRight key={d} className="w-3 h-3 text-[#dddde8]" />
                            ))}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[#111111]">{node.flight_number}</span>
                              <span className="text-[10px] text-[#888899]">{node.route}</span>
                            </div>
                            <div className="text-[10px] text-[#888899] mt-0.5">
                              {node.affected_passengers} yolcu · +{node.delay_minutes} dk gecikme
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            node.delay_minutes > 120
                              ? "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20"
                              : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"
                          }`}>
                            Dalga {node.cascade_depth}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  )
}
