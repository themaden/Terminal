"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ioccApi, type AuditLog } from "@/lib/api"
import { FileText, RefreshCw, Download, Search, Filter } from "lucide-react"

const MOCK_AUDIT: AuditLog[] = [
  { id: 1, crisis_id: 1, action: "CRISIS_ORCHESTRATED", agent: "AI Koordinatör", details: "Kriz tetiklendi: TK1981 iptali", confidence: 0.95, timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, crisis_id: 1, action: "CRISIS_ORCHESTRATED", agent: "CrisisSolver", details: "MILP optimizasyon çalıştırıldı — 189 yolcu", confidence: 0.91, timestamp: new Date(Date.now() - 3540000).toISOString() },
  { id: 3, crisis_id: 1, action: "CRISIS_ORCHESTRATED", agent: "CrisisCoordinator", details: "25 yolcu için karar üretildi", confidence: 0.88, timestamp: new Date(Date.now() - 3480000).toISOString() },
  { id: 4, crisis_id: 2, action: "CRISIS_ORCHESTRATED", agent: "AI Koordinatör", details: "Kriz tetiklendi: TK1821 gecikmesi", confidence: 0.92, timestamp: new Date(Date.now() - 3000000).toISOString() },
  { id: 5, crisis_id: 1, action: "VOUCHERS_ISSUED", agent: "VouchersService", details: "Toplu otel kuponu gönderildi (105 yolcu)", confidence: 1.0, timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: 6, crisis_id: 1, action: "CRISIS_ORCHESTRATED", agent: "CompensationAgent", details: "EU261 tazminatları hesaplandı: €42.000", confidence: 0.99, timestamp: new Date(Date.now() - 1500000).toISOString() },
  { id: 7, crisis_id: 1, action: "CRISIS_APPROVED", agent: "manager@jetnexus.ai", details: "Human-in-the-Loop: Kriz #1 kararları onaylandı", confidence: 1.0, timestamp: new Date(Date.now() - 900000).toISOString() },
  { id: 8, crisis_id: 1, action: "CRISIS_ORCHESTRATED", agent: "NotificationService", details: "Yolcu bildirimleri gönderildi (SMS/Email) — 189 yolcu", confidence: 1.0, timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 9, crisis_id: 1, action: "CRISIS_ORCHESTRATED", agent: "HubControlAgent", details: "Hub bağlantı riski tespit edildi: 34 yolcu", confidence: 0.85, timestamp: new Date(Date.now() - 300000).toISOString() },
  { id: 10, crisis_id: 1, action: "CRISIS_ORCHESTRATED", agent: "TransportManager", details: "Otobüs transferi başlatıldı (6 araç)", confidence: 1.0, timestamp: new Date(Date.now() - 120000).toISOString() },
]

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "şimdi"
  if (diff < 60) return `${diff}dk önce`
  return `${Math.floor(diff / 60)}s önce`
}

function operatorColor(op: string) {
  if (op.includes("AI") || op.includes("Agent") || op.includes("Coordinator")) return "text-[#E81932]"
  if (op.includes("Service") || op.includes("Solver")) return "text-[#8b5cf6]"
  if (op.includes("@")) return "text-[#10b981]"
  return "text-[#888899]"
}

const MOCK_SIDEBAR = [
  { id: "1", code: "TK1981", route: "IST-LHR", status: "IPTAL" as const, section: "Yolcular", passengers: [] },
]

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>(MOCK_AUDIT)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ioccApi.audit()
      if (data.length) setLogs(data)
    } catch { /* mock kalır */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = logs.filter(l =>
    !search || l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.agent.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f2f2f6]">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeDisruptions={MOCK_SIDEBAR} />
        <div className="flex-1 flex flex-col overflow-hidden">

          <div className="flex items-center justify-between px-6 py-3 border-b border-[#e5e5ed] bg-white">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#E81932]" />
              <h1 className="text-base font-bold text-[#111111]">Operasyon Kayıtları — Audit Log</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchData} disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#e8e8f0] hover:bg-[#e2e2ec] border border-[#2c2c40] rounded-lg text-xs text-[#111111] transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Yenile
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#e8e8f0] hover:bg-[#e2e2ec] border border-[#2c2c40] rounded-lg text-xs text-[#111111] transition-colors">
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-5 space-y-4">

            {/* Arama */}
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#666677]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="İşlem, operatör veya hedef ara..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#e5e5ed] rounded-lg text-xs text-[#111111] placeholder-[#575578] focus:outline-none focus:border-[#2c2c40]"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e5e5ed] rounded-lg text-xs text-[#888899] hover:border-[#2c2c40] transition-colors">
                <Filter className="w-3.5 h-3.5" />
                Filtrele
              </button>
            </div>

            {/* Log Tablosu */}
            <div className="bg-white border border-[#e5e5ed] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#e5e5ed] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#111111] uppercase tracking-wider">
                  {filtered.length} kayıt
                </span>
                <div className="flex gap-4 text-[10px] text-[#666677]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#E81932]" /> AI Sistemi
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" /> Servis
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" /> İnsan
                  </span>
                </div>
              </div>

              <div className="divide-y divide-[#f0f0f5]">
                {filtered.map((log, i) => (
                  <div key={log.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#e8e8f0]/30 transition-colors">
                    <span className="text-[10px] text-[#666677] font-mono w-6 shrink-0">{i + 1}</span>
                    <div className="w-28 shrink-0 text-[10px] text-[#666677] font-mono" suppressHydrationWarning>
                      {new Date(log.timestamp).toISOString().slice(11, 19)}
                      <div className="text-[#666677]/60" suppressHydrationWarning>{timeAgo(log.timestamp)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#111111]">{log.details || log.action}</p>
                      <p className="text-[10px] text-[#666677] mt-0.5">Kriz #{log.crisis_id} · {log.action}</p>
                    </div>
                    <span className={`text-[11px] font-medium shrink-0 ${operatorColor(log.agent)}`}>
                      {log.agent}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
