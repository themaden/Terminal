"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { baggageApi, type BagStatus, type ReconciliationReport } from "@/lib/api"
import { Luggage, RefreshCw, AlertTriangle, CheckCircle, Search, GitMerge } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  LOADED:      "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/25",
  CHECKED_IN:  "bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/25",
  SCREENING:   "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/25",
  IN_TRANSIT:  "bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/25",
  OFFLOADED:   "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/25",
  MISROUTED:   "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/35",
  DELIVERED:   "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/35",
  MISSING:     "bg-[#111111]/15 text-[#555566] border-[#555566]/25",
}

const ACTION_COLORS: Record<string, string> = {
  STATUS_OK:            "text-[#10b981]",
  AUTO_REROUTE:         "text-[#3b82f6]",
  MANUAL_INTERVENTION:  "text-[#ef4444]",
}

const MOCK_PNRS = ["ABC123", "DEF456", "GHI789", "JKL012"]
const MOCK_CRISIS_IDS = ["1", "2", "3"]

export default function BaggagePage() {
  const [pnrInput, setPnrInput] = useState("")
  const [bagStatus, setBagStatus] = useState<BagStatus | null>(null)
  const [bagLoading, setBagLoading] = useState(false)
  const [bagError, setBagError] = useState<string | null>(null)

  const [crisisId, setCrisisId] = useState(MOCK_CRISIS_IDS[0])
  const [report, setReport] = useState<ReconciliationReport | null>(null)
  const [reconciling, setReconciling] = useState(false)

  const [routingOrders, setRoutingOrders] = useState<{ total: number; orders: unknown[] }>({ total: 0, orders: [] })

  const fetchOrders = useCallback(async () => {
    try { setRoutingOrders(await baggageApi.routingOrders()) } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function lookupBag() {
    if (!pnrInput.trim()) return
    setBagLoading(true); setBagError(null)
    try { setBagStatus(await baggageApi.status(pnrInput.trim().toUpperCase())) }
    catch (e) { setBagError(e instanceof Error ? e.message : "PNR bulunamadı") }
    finally { setBagLoading(false) }
  }

  async function reconcile() {
    setReconciling(true)
    try { setReport(await baggageApi.reconcile(crisisId)) }
    catch { /* ignore */ }
    finally { setReconciling(false) }
  }

  const mockSidebar = MOCK_PNRS.slice(0, 2).map((p, i) => ({
    id: String(i), code: p, route: "IST→LHR", status: "ROTAR" as const,
    section: "Bagaj", passengers: [],
  }))

  return (
    <div className="flex h-screen bg-[#f5f5fa] overflow-hidden">
      <Sidebar activeDisruptions={mockSidebar} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-5 space-y-4">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-black text-[#111111] tracking-tight">Bagaj Uzlaştırma</h1>
              <p className="text-[11px] text-[#888899] mt-0.5">IATA Resolution 753 · Çanta-Yolcu Eşleşme · Otomatik Yönlendirme — §4.3</p>
            </div>
            <button onClick={fetchOrders} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white border border-[#e0e0ee] text-[#555566] hover:bg-[#f0f0f8] transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Yenile
            </button>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Toplam Yönlendirme Emri", value: routingOrders.total, icon: GitMerge, color: "text-[#3b82f6]" },
              { label: "Uzlaştırma Raporu", value: report ? `${report.bags_at_risk} Risk` : "—", icon: AlertTriangle, color: "text-[#f59e0b]" },
              { label: "IATA 753 Uyum", value: report ? (report.iata_753_compliant ? "Uyumlu" : "Uyumsuz") : "—", icon: CheckCircle, color: "text-[#10b981]" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-[#e8e8f0] p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#f5f5fa] flex items-center justify-center shrink-0">
                  <Icon className={`w-4.5 h-4.5 ${color}`} />
                </div>
                <div>
                  <div className="text-[18px] font-black text-[#111111] leading-none">{String(value)}</div>
                  <div className="text-[10px] text-[#888899] mt-0.5">{label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">

            {/* PNR Bagaj Sorgulama */}
            <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#f0f0f6]">
                <Search className="w-4 h-4 text-[#E81932]" />
                <span className="text-[13px] font-bold text-[#111111]">PNR Bagaj Sorgu</span>
              </div>
              <div className="p-5">
                <div className="flex gap-2 mb-4">
                  <input
                    value={pnrInput}
                    onChange={e => setPnrInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && lookupBag()}
                    placeholder="PNR girin (ör. ABC123)"
                    className="flex-1 text-[11px] border border-[#e0e0ee] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#E81932]/30 bg-[#fafafa]"
                  />
                  <button onClick={lookupBag} disabled={bagLoading}
                    className="px-4 py-2 rounded-lg text-[11px] font-bold bg-[#E81932] text-white hover:bg-[#c0101e] transition-colors disabled:opacity-50">
                    {bagLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Sorgula"}
                  </button>
                </div>

                {/* Hızlı PNR butonları */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {MOCK_PNRS.map(p => (
                    <button key={p} onClick={() => { setPnrInput(p); }}
                      className="text-[9px] font-semibold px-2 py-1 rounded-md bg-[#f5f5fa] border border-[#e8e8f0] text-[#666677] hover:bg-[#ebebf4] transition-colors">
                      {p}
                    </button>
                  ))}
                </div>

                {bagError && <p className="text-[11px] text-[#ef4444] mb-3">{bagError}</p>}

                {bagStatus && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-black text-[#111111]">{bagStatus.bag_tag}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${STATUS_COLORS[bagStatus.status] ?? "bg-[#f5f5fa] text-[#666677] border-[#e0e0ee]"}`}>
                        {bagStatus.status}
                      </span>
                    </div>
                    {bagStatus.at_risk && (
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#ef4444]/5 border border-[#ef4444]/15">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444] shrink-0 mt-0.5" />
                        <p className="text-[10px] text-[#ef4444]">{bagStatus.offload_reason ?? "Bagaj risk altında"}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-[#666677]">
                      <div><span className="text-[#aaaabc]">PNR:</span> {bagStatus.pnr}</div>
                      <div><span className="text-[#aaaabc]">Uçuş:</span> {bagStatus.original_flight}</div>
                      <div><span className="text-[#aaaabc]">Konum:</span> {bagStatus.location}</div>
                      <div><span className="text-[#aaaabc]">IATA 753:</span> {bagStatus.iata_753_tracked ? "✓ Takipte" : "✗ Kayıp"}</div>
                    </div>
                    <div className="text-[9px] text-[#aaaabc]">Son tarama: {new Date(bagStatus.last_scan).toLocaleTimeString("tr-TR")}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Kriz Uzlaştırma */}
            <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0f0f6]">
                <div className="flex items-center gap-2">
                  <Luggage className="w-4 h-4 text-[#E81932]" />
                  <span className="text-[13px] font-bold text-[#111111]">Kriz Bagaj Uzlaştırma</span>
                </div>
                <div className="flex items-center gap-2">
                  <select value={crisisId} onChange={e => setCrisisId(e.target.value)}
                    className="text-[10px] border border-[#e0e0ee] rounded-lg px-2 py-1 bg-[#fafafa] focus:outline-none">
                    {MOCK_CRISIS_IDS.map(id => <option key={id}>Kriz #{id}</option>)}
                  </select>
                  <button onClick={reconcile} disabled={reconciling}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#E81932] text-white hover:bg-[#c0101e] transition-colors disabled:opacity-50">
                    {reconciling ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Uzlaştır"}
                  </button>
                </div>
              </div>
              <div className="p-5">
                {!report ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <Luggage className="w-10 h-10 text-[#e0e0ee]" />
                    <p className="text-[11px] text-[#aaaabc] text-center">Kriz seçin ve uzlaştırma başlatın</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {[
                        { k: "Toplam Yolcu", v: report.total_passengers },
                        { k: "Takip Edilen", v: report.bags_tracked },
                        { k: "Risk Altında", v: report.bags_at_risk },
                        { k: "Yönlendirme Emri", v: report.routing_orders_issued },
                      ].map(({ k, v }) => (
                        <div key={k} className="p-2 rounded-lg bg-[#fafafa] border border-[#f0f0f6]">
                          <div className="text-[15px] font-black text-[#111111]">{v}</div>
                          <div className="text-[9px] text-[#888899]">{k}</div>
                        </div>
                      ))}
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {report.actions.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[#fafafa] border border-[#f0f0f6] text-[10px]">
                          <span className={`font-bold shrink-0 ${ACTION_COLORS[a.action] ?? "text-[#666677]"}`}>{a.action}</span>
                          <span className="text-[#888899]">{a.pnr}</span>
                          <span className="text-[#aaaabc] font-mono">{a.bag_tag}</span>
                          {a.from && a.to && <span className="text-[#3b82f6]">{a.from}→{a.to}</span>}
                        </div>
                      ))}
                    </div>
                    <div className="text-[9px] text-[#aaaabc]">
                      IATA 753: {report.iata_753_compliant ? "✓ Uyumlu" : "✗ Uyumsuz"} · {report.reconciliation_time_seconds.toFixed(3)}s
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Yönlendirme Emirleri */}
          {routingOrders.orders.length > 0 && (
            <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#f0f0f6]">
                <span className="text-[13px] font-bold text-[#111111]">Aktif Yönlendirme Emirleri ({routingOrders.total})</span>
              </div>
              <div className="divide-y divide-[#f5f5fa]">
                {(routingOrders.orders as Record<string, unknown>[]).slice(0, 10).map((o, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-[#fafafa] transition-colors">
                    <span className="font-mono text-[11px] text-[#111111] font-bold">{String(o.bag_tag)}</span>
                    <span className="text-[10px] text-[#888899]">PNR: {String(o.pnr)}</span>
                    <span className="text-[10px] text-[#3b82f6] font-medium">{String(o.from_flight)} → {String(o.to_flight)}</span>
                    <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      o.status === "PENDING" ? "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20" : "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                    }`}>{String(o.status)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
