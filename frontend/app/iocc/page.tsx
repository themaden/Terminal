"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import {
  CheckCircle, XCircle, Loader2, AlertTriangle,
  RefreshCw, Clock, Activity, Shield, ChevronRight, Inbox,
} from "lucide-react"
import { ioccApi, type Crisis, type Decision, type AuditLog } from "@/lib/api"

function severityBadge(s: string) {
  const map: Record<string, string> = {
    high: "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30",
    critical: "bg-[#ef4444]/30 text-[#ef4444] border-[#ef4444]/50",
    medium: "bg-[#E81932]/20 text-[#E81932] border-[#E81932]/30",
    low: "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30",
  }
  return map[s?.toLowerCase()] ?? "bg-[#575578]/20 text-[#666677] border-[#575578]/30"
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "şimdi"
  if (diff < 60) return `${diff}dk önce`
  return `${Math.floor(diff / 60)}s önce`
}

export default function IoccPage() {
  const [crises, setCrises] = useState<Crisis[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [audit, setAudit] = useState<AuditLog[]>([])
  const [selectedCrisis, setSelectedCrisis] = useState<Crisis | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const dash = await ioccApi.dashboard()
      const activeCrises = Array.isArray(dash.active_crises) ? dash.active_crises : []
      setCrises(activeCrises)
      // pending_approvals is a count from API — keep decisions as empty array (no separate decisions endpoint)
      setDecisions([])
      if (activeCrises.length > 0 && !selectedCrisis) {
        setSelectedCrisis(activeCrises[0])
      }
      try {
        const logs = await ioccApi.audit()
        setAudit(logs ?? [])
      } catch { /* audit log endpoint boş olabilir */ }
    } catch (e) {
      console.error("IOCC fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [selectedCrisis])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 15_000)
    return () => clearInterval(id)
  }, [fetchData])

  async function handleApproveAll(crisisId: string) {
    setActionLoading(`approve-${crisisId}`)
    try {
      const result = await ioccApi.approveAll(crisisId)
      showFeedback("success", `${result.approved ?? "Tüm"} karar onaylandı`)
      setDecisions(prev => prev.map(d =>
        d.crisis_id === crisisId ? { ...d, status: "approved" } : d
      ))
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "Onay başarısız")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(crisisId: string, decisionId: string) {
    setActionLoading(`reject-${decisionId}`)
    try {
      await ioccApi.rejectDecision(crisisId, decisionId)
      showFeedback("success", "Karar reddedildi")
      setDecisions(prev => prev.filter(d => d.id !== decisionId))
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "Red başarısız")
    } finally {
      setActionLoading(null)
    }
  }

  const pendingDecisions = decisions.filter(d =>
    (!selectedCrisis || d.crisis_id === String(selectedCrisis.id)) && d.status === "pending"
  )

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
              <Activity className="w-5 h-5 text-[#E81932]" />
              <h1 className="text-base font-bold text-[#111111]">IOCC — Entegre Operasyon Kontrol Merkezi</h1>
              {crises.length > 0 && (
                <span className="px-2 py-0.5 bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 rounded-full text-[10px] font-bold">
                  {crises.length} AKTİF KRİZ
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
                  {feedback.type === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
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
                <p className="text-sm text-[#666677]">IOCC verileri yükleniyor...</p>
              </div>
            </div>
          ) : crises.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-[#e5e5ed]">
                <Inbox className="w-8 h-8 text-[#666677]" />
              </div>
              <div className="text-center">
                <p className="text-[#111111] font-semibold mb-1">Aktif kriz yok</p>
                <p className="text-sm text-[#666677]">Dashboard'dan bir kriz tetikleyerek AI sistemini test edebilirsiniz.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden p-4 gap-4">

              {/* Sol: Aktif Krizler */}
              <div className="w-72 flex flex-col gap-3">
                <div className="bg-white border border-[#e5e5ed] rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#e5e5ed] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#E81932]" />
                    <h2 className="text-sm font-semibold text-[#111111] uppercase tracking-wider">Aktif Krizler</h2>
                    <span className="ml-auto text-xs bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 rounded-full px-2 py-0.5">
                      {crises.length}
                    </span>
                  </div>
                  <div className="divide-y divide-[#1e1e2a]">
                    {crises.map(c => (
                      <button key={c.id} onClick={() => setSelectedCrisis(c)}
                        className={`w-full text-left px-4 py-3 hover:bg-[#e8e8f0]/50 transition-colors ${
                          selectedCrisis?.id === c.id ? "bg-[#e8e8f0]/70 border-l-2 border-[#E81932]" : ""
                        }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-[#111111]">{c.flight_number}</span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${severityBadge(c.severity)}`}>
                            {c.severity?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#666677]">
                          <span>{c.origin} → {c.destination}</span>
                          <span>{c.affected_passengers} yolcu</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-[#666677]">
                          <Clock className="w-3 h-3" />
                          {timeAgo(c.created_at)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Özet */}
                <div className="bg-white border border-[#e5e5ed] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-[#E81932]" />
                    <h3 className="text-xs font-semibold text-[#111111] uppercase tracking-wider">AI Özet</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#666677]">Bekleyen Karar</span>
                      <span className="text-[#E81932] font-medium">
                        {decisions.filter(d => d.status === "pending").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666677]">Onaylanan</span>
                      <span className="text-[#10b981] font-medium">
                        {decisions.filter(d => d.status === "approved").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666677]">Ort. Güven</span>
                      <span className="text-[#111111] font-medium">
                        {decisions.length
                          ? `%${Math.round((decisions.reduce((s, d) => s + (d.confidence ?? 0), 0) / decisions.length) * 100)}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orta: Bekleyen Kararlar */}
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                <div className="bg-white border border-[#e5e5ed] rounded-lg overflow-hidden flex flex-col flex-1">
                  <div className="px-4 py-3 border-b border-[#e5e5ed] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-[#111111] uppercase tracking-wider">Bekleyen AI Kararları</h2>
                      {selectedCrisis && (
                        <span className="text-xs text-[#666677]">— {selectedCrisis.flight_number}</span>
                      )}
                    </div>
                    {selectedCrisis && pendingDecisions.length > 0 && (
                      <button onClick={() => handleApproveAll(String(selectedCrisis.id))}
                        disabled={!!actionLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#10b981] hover:bg-[#10b981]/90 disabled:opacity-50 text-[#111111] text-xs font-medium rounded-lg transition-colors">
                        {actionLoading === `approve-${selectedCrisis.id}`
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <CheckCircle className="w-3.5 h-3.5" />}
                        Tümünü Onayla ({pendingDecisions.length})
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-auto">
                    {pendingDecisions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-[#666677] gap-2 py-16">
                        <CheckCircle className="w-10 h-10 opacity-30" />
                        <p className="text-sm">
                          {decisions.length > 0 ? "Tüm kararlar onaylandı" : "Bu kriz için henüz karar üretilmedi"}
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-[#f2f2f6] sticky top-0">
                          <tr>
                            {["Yolcu ID", "Aksiyon", "Detay", "Tazminat", "Güven", ""].map(h => (
                              <th key={h} className="text-left px-4 py-2 text-[10px] text-[#666677] font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pendingDecisions.map(d => (
                            <tr key={d.id} className="border-b border-[#e5e5ed]/50 hover:bg-[#e8e8f0]/30 transition-colors">
                              <td className="px-4 py-3 text-[#E81932] font-mono">{d.passenger_id}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                  d.action === "REBOOK"
                                    ? "bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30"
                                    : d.action === "HOTEL"
                                    ? "bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30"
                                    : "bg-[#E81932]/20 text-[#E81932] border-[#E81932]/30"
                                }`}>
                                  {d.action}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[#888899]">{d.new_flight ?? d.hotel ?? "—"}</td>
                              <td className="px-4 py-3 text-[#111111]">{d.compensation ? `€${d.compensation}` : "—"}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-16 h-1.5 bg-[#e8e8f0] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${(d.confidence ?? 0) * 100}%` }} />
                                  </div>
                                  <span className="text-[#888899]">%{Math.round((d.confidence ?? 0) * 100)}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  <button onClick={() => handleApproveAll(d.crisis_id)} disabled={!!actionLoading}
                                    className="p-1.5 bg-[#10b981]/10 hover:bg-[#10b981]/20 border border-[#10b981]/30 rounded transition-colors disabled:opacity-50" title="Onayla">
                                    <CheckCircle className="w-3.5 h-3.5 text-[#10b981]" />
                                  </button>
                                  <button onClick={() => handleReject(d.crisis_id, d.id)}
                                    disabled={actionLoading === `reject-${d.id}`}
                                    className="p-1.5 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 rounded transition-colors disabled:opacity-50" title="Reddet">
                                    {actionLoading === `reject-${d.id}`
                                      ? <Loader2 className="w-3.5 h-3.5 text-[#ef4444] animate-spin" />
                                      : <XCircle className="w-3.5 h-3.5 text-[#ef4444]" />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* Sağ: Audit Log */}
              <div className="w-72 flex flex-col">
                <div className="bg-white border border-[#e5e5ed] rounded-lg overflow-hidden flex flex-col h-full">
                  <div className="px-4 py-3 border-b border-[#e5e5ed] flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#666677]" />
                    <h2 className="text-sm font-semibold text-[#111111] uppercase tracking-wider">Audit Log</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-[#1e1e2a]">
                    {audit.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-xs text-[#666677]">
                        Kayıt yok
                      </div>
                    ) : audit.map(log => (
                      <div key={log.id} className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 text-[#666677] mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-[#111111] leading-snug">{log.action}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-[#666677]">
                              <span>{log.agent}</span>
                              <span>·</span>
                              <span>{timeAgo(log.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
