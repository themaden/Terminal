"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { crewApi, type CrewAssignment, type CrewRecoveryPlan } from "@/lib/api"
import {
  UserCheck, RefreshCw, AlertTriangle, CheckCircle,
  Clock, Plane, Shield, ChevronRight, Users,
} from "lucide-react"

const MOCK_FLIGHTS = ["TK1981", "TK1821", "TK2045", "TK3312"]

function roleBadge(role: string) {
  const map: Record<string, string> = {
    CAPTAIN: "bg-[#E81932]/15 text-[#E81932] border-[#E81932]/25",
    FO:      "bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/25",
    PURSER:  "bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/25",
    CABIN:   "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/25",
  }
  return map[role] ?? "bg-[#f5f5fa] text-[#666677] border-[#e0e0ee]"
}

function legalBadge(legal: boolean, remaining: number) {
  if (!legal) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/25">FTL AŞIMI</span>
  if (remaining < 3) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/25">{remaining}s kaldı</span>
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25">Uygun</span>
}

export default function CrewPage() {
  const [selectedFlight, setSelectedFlight] = useState(MOCK_FLIGHTS[0])
  const [assignment, setAssignment] = useState<CrewAssignment | null>(null)
  const [recovery, setRecovery] = useState<CrewRecoveryPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [availability, setAvailability] = useState<{ total_available: number; crew: unknown[] } | null>(null)

  const fetchAssignment = useCallback(async () => {
    setLoading(true)
    try {
      const [asgn, avail] = await Promise.all([
        crewApi.assign(selectedFlight),
        crewApi.availability(),
      ])
      setAssignment(asgn)
      setAvailability(avail)
    } catch { /* mock */ }
    finally { setLoading(false) }
  }, [selectedFlight])

  useEffect(() => { fetchAssignment() }, [fetchAssignment])

  async function handleRecover() {
    setRecovering(true)
    try {
      const plan = await crewApi.recover(selectedFlight)
      setRecovery(plan)
    } catch { /* ignore */ }
    finally { setRecovering(false) }
  }

  const mockSidebar = MOCK_FLIGHTS.slice(0, 2).map((f, i) => ({
    id: String(i), code: f, route: "IST→LHR", status: "ROTAR" as const,
    section: "Mürettebat", passengers: [],
  }))

  return (
    <div className="flex h-screen bg-[#f5f5fa] overflow-hidden">
      <Sidebar activeDisruptions={mockSidebar} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Başlık */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-black text-[#111111] tracking-tight">Mürettebat Kurtarma</h1>
              <p className="text-[11px] text-[#888899] mt-0.5">EASA FTL · Tip Sertifikası · Kriz Rotasyonu — §4.1</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedFlight}
                onChange={e => setSelectedFlight(e.target.value)}
                className="text-[11px] border border-[#e0e0ee] rounded-lg px-3 py-1.5 bg-white text-[#333344] focus:outline-none focus:ring-1 focus:ring-[#E81932]/30"
              >
                {MOCK_FLIGHTS.map(f => <option key={f}>{f}</option>)}
              </select>
              <button onClick={fetchAssignment} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white border border-[#e0e0ee] text-[#555566] hover:bg-[#f0f0f8] transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Yenile
              </button>
            </div>
          </div>

          {/* KPI bar */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Müsait Mürettebat", value: (availability as { total_available?: number })?.total_available ?? "—", icon: Users, color: "text-[#3b82f6]" },
              { label: "Uçuş Durumu", value: assignment?.is_fully_crewed ? "Tam Ekip" : "Eksik", icon: Plane, color: assignment?.is_fully_crewed ? "text-[#10b981]" : "text-[#ef4444]" },
              { label: "Yasal Uyum", value: assignment?.legal_check_passed ? "Geçti" : "Başarısız", icon: Shield, color: assignment?.legal_check_passed ? "text-[#10b981]" : "text-[#ef4444]" },
              { label: "Güven Skoru", value: assignment ? `%${Math.round((assignment.assignment_confidence ?? 0) * 100)}` : "—", icon: CheckCircle, color: "text-[#E81932]" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-[#e8e8f0] p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-[#f5f5fa] flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${color}`} />
                </div>
                <div>
                  <div className="text-[18px] font-black text-[#111111] leading-none">{String(value)}</div>
                  <div className="text-[10px] text-[#888899] mt-0.5">{label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">

            {/* Mürettebat Ataması */}
            <div className="col-span-2 bg-white rounded-xl border border-[#e8e8f0] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0f0f6]">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#E81932]" />
                  <span className="text-[13px] font-bold text-[#111111]">{selectedFlight} — Mürettebat Ataması</span>
                </div>
                {assignment && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    assignment.is_fully_crewed
                      ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                      : "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20"
                  }`}>
                    {assignment.is_fully_crewed ? "TAM EKİP" : `EKSİK: ${assignment.deficit.join(", ")}`}
                  </span>
                )}
              </div>
              <div className="p-5">
                {loading ? (
                  <div className="flex items-center justify-center h-32 text-[#aaaabc] text-[12px]">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Yükleniyor…
                  </div>
                ) : assignment ? (
                  <div className="space-y-2">
                    {[
                      assignment.captain && { ...assignment.captain, roleLabel: "Kaptan" },
                      assignment.first_officer && { ...assignment.first_officer, roleLabel: "Yardımcı Pilot" },
                      ...assignment.cabin_crew.map(c => ({ ...c, roleLabel: "Kabin Ekibi" })),
                    ].filter(Boolean).map((crew) => {
                      if (!crew) return null
                      const c = crew as typeof crew & { roleLabel: string }
                      return (
                        <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#fafafa] border border-[#f0f0f6] hover:bg-[#f5f5fa] transition-colors">
                          <div className="w-8 h-8 rounded-full bg-[#e8e8f4] flex items-center justify-center shrink-0">
                            <UserCheck className="w-3.5 h-3.5 text-[#9999bb]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-semibold text-[#111111]">{c.name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${roleBadge(c.role)}`}>{c.role}</span>
                              {legalBadge(c.legal_for_duty, c.remaining_duty_hours)}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] text-[#888899]">Üs: {c.base}</span>
                              <span className="text-[10px] text-[#888899]">Görev: {c.duty_hours_today.toFixed(1)}s</span>
                              <span className="text-[10px] text-[#aaaabc]">{c.type_ratings.join(" · ")}</span>
                            </div>
                          </div>
                          {c.current_flight && (
                            <span className="text-[10px] text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded border border-[#f59e0b]/20">
                              {c.current_flight}
                            </span>
                          )}
                          {c.on_standby && (
                            <span className="text-[9px] text-[#3b82f6] bg-[#3b82f6]/10 px-1.5 py-0.5 rounded border border-[#3b82f6]/20">STANDBY</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] text-[#aaaabc] text-center py-8">Uçuş seçin</p>
                )}
              </div>
            </div>

            {/* Kurtarma Planı */}
            <div className="bg-white rounded-xl border border-[#e8e8f0] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#f0f0f6]">
                <span className="text-[12px] font-bold text-[#111111]">Kurtarma Planı</span>
                <button
                  onClick={handleRecover}
                  disabled={recovering}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#E81932] text-white hover:bg-[#c0101e] transition-colors disabled:opacity-50"
                >
                  {recovering ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                  Başlat
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {!recovery ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <AlertTriangle className="w-8 h-8 text-[#e0e0ee]" />
                    <p className="text-[11px] text-[#aaaabc] text-center">"Başlat" ile kurtarma planı oluştur</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-[#666677] mb-3">{recovery.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[#555566]">
                      <Clock className="w-3 h-3 text-[#3b82f6]" />
                      Briefing ETA: <span className="font-bold">{recovery.eta_to_brief_minutes} dk</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#555566]">
                      <Users className="w-3 h-3 text-[#10b981]" />
                      Standby aktive: <span className="font-bold">{recovery.standby_crew_activated}</span>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {recovery.recovery_actions.map(a => (
                        <div key={a.step} className="flex items-start gap-2 p-2 rounded-lg bg-[#fafafa] border border-[#f0f0f6]">
                          <span className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black mt-0.5 ${
                            a.status === "DONE" ? "bg-[#10b981]/20 text-[#10b981]" : "bg-[#f5f5fa] text-[#aaaabc]"
                          }`}>{a.step}</span>
                          <div>
                            <div className="text-[10px] font-semibold text-[#333344]">{a.action}</div>
                            <div className="text-[9px] text-[#888899]">{a.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
