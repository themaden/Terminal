"use client"

import { useState, useEffect } from "react"
import {
  Zap, X, Loader2, CheckCircle, AlertTriangle,
  Wind, Wrench, Radio, CloudLightning, MessageSquare,
  Bot, SlidersHorizontal,
} from "lucide-react"
import { crisisApi, type Flight } from "@/lib/api"

// ── AI Scenarios ──────────────────────────────────────────────────────────────

interface Scenario {
  id: string
  icon: React.ReactNode
  label: string
  sublabel: string
  crisis_type: "CANCELLATION" | "DELAY"
  severity: "CRITICAL" | "HIGH" | "MEDIUM"
  reason: string
  color: string
  bg: string
  border: string
}

const SCENARIOS: Scenario[] = [
  {
    id: "storm",
    icon: <CloudLightning className="w-5 h-5" />,
    label: "Hub Fırtına",
    sublabel: "İptal · KRİTİK",
    crisis_type: "CANCELLATION",
    severity: "CRITICAL",
    reason: "IST Hub — şiddetli fırtına uyarısı, pist kapanması",
    color: "text-[#ef4444]",
    bg: "bg-[#ef4444]/8 hover:bg-[#ef4444]/14",
    border: "border-[#ef4444]/25",
  },
  {
    id: "mechanical",
    icon: <Wrench className="w-5 h-5" />,
    label: "Mekanik Arıza",
    sublabel: "Gecikme · YÜKSEK",
    crisis_type: "DELAY",
    severity: "HIGH",
    reason: "APU arızası — teknik bakım ekibi müdahalesi gerekiyor",
    color: "text-[#f97316]",
    bg: "bg-[#f97316]/8 hover:bg-[#f97316]/14",
    border: "border-[#f97316]/25",
  },
  {
    id: "atc",
    icon: <Radio className="w-5 h-5" />,
    label: "ATC Kısıtlaması",
    sublabel: "Gecikme · ORTA",
    crisis_type: "DELAY",
    severity: "MEDIUM",
    reason: "EUROCONTROL CTOT slot kısıtlaması — ground delay programme",
    color: "text-[#eab308]",
    bg: "bg-[#eab308]/8 hover:bg-[#eab308]/14",
    border: "border-[#eab308]/25",
  },
  {
    id: "runway",
    icon: <Wind className="w-5 h-5" />,
    label: "Pist Kapanması",
    sublabel: "İptal · YÜKSEK",
    crisis_type: "CANCELLATION",
    severity: "HIGH",
    reason: "FOD temizliği — 09R/27L pisti geçici kapatıldı",
    color: "text-[#8b5cf6]",
    bg: "bg-[#8b5cf6]/8 hover:bg-[#8b5cf6]/14",
    border: "border-[#8b5cf6]/25",
  },
]

// ── Pipeline ──────────────────────────────────────────────────────────────────

const PIPELINE_STEPS = ["AI Analizi", "MILP Solver", "EU261", "SMS/Email"]

interface PipelineState {
  step: number
  passengers: number
  notified: number
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Result {
  crisis_id: number
  flight: string
  passengers: number
  type: string
  mode: "ai" | "manual"
}

interface Props {
  flights: Flight[]
  onCrisisTriggered: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IrropsSimulator({ flights, onCrisisTriggered }: Props) {
  const [open, setOpen]       = useState(false)
  const [tab, setTab]         = useState<"ai" | "manual">("ai")
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [error, setError]     = useState<string | null>(null)
  const [pipeline, setPipeline] = useState<PipelineState | null>(null)

  // Manual form state
  const [manFlight,   setManFlight]   = useState("")
  const [manType,     setManType]     = useState<"CANCELLATION" | "DELAY" | "DIVERSION">("CANCELLATION")
  const [manSeverity, setManSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH")
  const [manReason,   setManReason]   = useState("")

  const availableFlights = flights.filter(f => f.status === "SCHEDULED" || f.status === "DELAYED")

  // Reset form flight when flights load
  useEffect(() => {
    if (!manFlight && availableFlights.length > 0)
      setManFlight(availableFlights[0].flight_number)
  }, [availableFlights, manFlight])

  // Notification counter animation
  useEffect(() => {
    if (!pipeline || pipeline.step !== 3) return
    const total = pipeline.passengers
    let n = 0
    const id = setInterval(() => {
      n = Math.min(n + Math.ceil(total / 20), total)
      setPipeline(prev => prev ? { ...prev, notified: n } : null)
      if (n >= total) clearInterval(id)
    }, 60)
    return () => clearInterval(id)
  }, [pipeline?.step, pipeline?.passengers])

  // ── Shared trigger logic ───────────────────────────────────────────────────

  async function runTrigger(opts: {
    id: string
    flight_number: string
    crisis_type: string
    severity: string
    reason: string
    mode: "ai" | "manual"
  }) {
    setLoading(opts.id)
    setError(null)
    setPipeline({ step: 0, passengers: 0, notified: 0 })

    let crisis
    try {
      crisis = await crisisApi.trigger({
        flight_number: opts.flight_number,
        crisis_type: opts.crisis_type,
        severity: opts.severity,
        reason: opts.reason,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata")
      setLoading(null)
      setPipeline(null)
      return
    }

    const pax = crisis.affected_passengers ?? 25

    for (let s = 1; s <= 3; s++) {
      await new Promise(r => setTimeout(r, 600))
      setPipeline({ step: s, passengers: pax, notified: 0 })
    }
    await new Promise(r => setTimeout(r, 1200))
    setPipeline({ step: 4, passengers: pax, notified: pax })

    setResults(prev => [{
      crisis_id: Number(crisis.id),
      flight: opts.flight_number,
      passengers: pax,
      type: opts.crisis_type,
      mode: opts.mode,
    }, ...prev.slice(0, 2)])

    setLoading(null)
    onCrisisTriggered()
  }

  // ── AI tab trigger ─────────────────────────────────────────────────────────

  function triggerScenario(sc: Scenario, flightNumber: string) {
    runTrigger({ id: sc.id, flight_number: flightNumber, crisis_type: sc.crisis_type,
      severity: sc.severity, reason: sc.reason, mode: "ai" })
  }

  const targetFlight = (idx: number) =>
    availableFlights[idx % Math.max(availableFlights.length, 1)]?.flight_number ?? "TK1981"

  // ── Manual tab trigger ─────────────────────────────────────────────────────

  function triggerManual() {
    if (!manFlight.trim() || !manReason.trim()) {
      setError("Uçuş numarası ve sebep zorunludur.")
      return
    }
    runTrigger({ id: "manual", flight_number: manFlight.trim().toUpperCase(),
      crisis_type: manType, severity: manSeverity, reason: manReason.trim(), mode: "manual" })
  }

  // ── Severity badge helpers ─────────────────────────────────────────────────

  const severityColors: Record<string, string> = {
    LOW:      "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20",
    MEDIUM:   "bg-[#eab308]/10 text-[#eab308] border-[#eab308]/20",
    HIGH:     "bg-[#f97316]/10 text-[#f97316] border-[#f97316]/20",
    CRITICAL: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20",
  }

  const busy = !!loading

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5
          bg-[#E81932] hover:bg-[#c7111f] text-white rounded-full shadow-lg
          text-xs font-bold tracking-wide transition-all duration-150 hover:scale-105 active:scale-95"
      >
        <Zap className="w-3.5 h-3.5" />
        IRROPS SİMÜLATÖR
      </button>

      {/* ── Modal ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-5">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-[480px] bg-white border border-[#e0e0ea] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#ebebf2] bg-[#f9f9fc] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#E81932]/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-[#E81932]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111111]">IRROPS Simülatör</p>
                  <p className="text-[10px] text-[#9999bb]">{availableFlights.length} uygun uçuş mevcut</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#ebebf2] transition-colors">
                <X className="w-4 h-4 text-[#9999bb]" />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-[#ebebf2] bg-[#f9f9fc] shrink-0">
              {([["ai", <Bot key="b" className="w-3.5 h-3.5" />, "AI Senaryolar"],
                 ["manual", <SlidersHorizontal key="s" className="w-3.5 h-3.5" />, "Manuel Giriş"]] as const).map(
                ([id, icon, label]) => (
                  <button
                    key={id}
                    onClick={() => { setTab(id); setError(null) }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold
                      transition-colors border-b-2 ${
                        tab === id
                          ? "border-[#E81932] text-[#E81932] bg-white"
                          : "border-transparent text-[#9999bb] hover:text-[#666680]"
                      }`}
                  >
                    {icon}{label}
                  </button>
                )
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">

              {/* ── AI Tab ── */}
              {tab === "ai" && (
                <div className="p-4 grid grid-cols-2 gap-2.5">
                  {SCENARIOS.map((sc, idx) => {
                    const flight = targetFlight(idx)
                    const isLoading = loading === sc.id
                    return (
                      <button
                        key={sc.id}
                        disabled={busy || availableFlights.length === 0}
                        onClick={() => triggerScenario(sc, flight)}
                        className={`relative flex flex-col gap-2 p-3.5 rounded-xl border text-left
                          transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                          ${sc.bg} ${sc.border}`}
                      >
                        <div className={sc.color}>{sc.icon}</div>
                        <div>
                          <p className={`text-xs font-bold ${sc.color}`}>{sc.label}</p>
                          <p className="text-[10px] text-[#9999bb] mt-0.5">{sc.sublabel}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-[#666680] bg-white/60 px-1.5 py-0.5 rounded-md border border-white/80">
                            {flight}
                          </span>
                          {isLoading
                            ? <Loader2 className={`w-3.5 h-3.5 animate-spin ${sc.color}`} />
                            : <Zap className={`w-3 h-3 ${sc.color} opacity-60`} />}
                        </div>
                        <p className="text-[9px] text-[#aaaacc] leading-tight line-clamp-2">{sc.reason}</p>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* ── Manuel Tab ── */}
              {tab === "manual" && (
                <div className="p-4 flex flex-col gap-3">

                  {/* Flight selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-[#666680] uppercase tracking-wide">Uçuş Numarası</label>
                    <div className="flex gap-2">
                      <select
                        value={manFlight}
                        onChange={e => setManFlight(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 border border-[#e0e0ea] rounded-lg bg-white focus:outline-none focus:border-[#E81932]/50 text-[#111111]"
                      >
                        {availableFlights.map(f => (
                          <option key={f.id} value={f.flight_number}>
                            {f.flight_number} — {f.origin}→{f.destination} ({f.status})
                          </option>
                        ))}
                        {availableFlights.length === 0 && <option value="">Uygun uçuş yok</option>}
                      </select>
                      <input
                        type="text"
                        placeholder="veya yaz: TK1234"
                        value={manFlight}
                        onChange={e => setManFlight(e.target.value.toUpperCase())}
                        className="w-32 text-xs px-3 py-2 border border-[#e0e0ea] rounded-lg bg-white
                          focus:outline-none focus:border-[#E81932]/50 text-[#111111] font-mono"
                      />
                    </div>
                  </div>

                  {/* Crisis type */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-[#666680] uppercase tracking-wide">Kriz Türü</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["CANCELLATION", "DELAY", "DIVERSION"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setManType(t)}
                          className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${
                            manType === t
                              ? "bg-[#E81932] text-white border-[#E81932]"
                              : "bg-white text-[#666680] border-[#e0e0ea] hover:border-[#E81932]/30"
                          }`}
                        >
                          {t === "CANCELLATION" ? "İPTAL" : t === "DELAY" ? "GECİKME" : "ROTA DEĞ."}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Severity */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-[#666680] uppercase tracking-wide">Şiddet</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setManSeverity(s)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                            manSeverity === s
                              ? severityColors[s] + " border-current"
                              : "bg-white text-[#9999bb] border-[#e0e0ea] hover:border-[#ccc]"
                          }`}
                        >
                          {s === "LOW" ? "DÜŞÜK" : s === "MEDIUM" ? "ORTA" : s === "HIGH" ? "YÜKSEK" : "KRİTİK"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-[#666680] uppercase tracking-wide">Sebep / Açıklama</label>
                    <textarea
                      rows={3}
                      placeholder="Kriz sebebini açıklayın — AI bu metni kullanarak karar üretecek..."
                      value={manReason}
                      onChange={e => setManReason(e.target.value)}
                      className="text-xs px-3 py-2.5 border border-[#e0e0ea] rounded-lg bg-white resize-none
                        focus:outline-none focus:border-[#E81932]/50 text-[#111111] leading-relaxed
                        placeholder:text-[#bbbbcc]"
                    />
                  </div>

                  {/* Quick reason chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Hava muhalefeti — fırtına",
                      "Teknik arıza — mekanik",
                      "Mürettebat duty limit aşımı",
                      "ATC slot kısıtlaması",
                      "Tıbbi acil durum",
                    ].map(chip => (
                      <button
                        key={chip}
                        onClick={() => setManReason(chip)}
                        className="text-[9px] px-2 py-1 rounded-full border border-[#e0e0ea] text-[#9999bb]
                          hover:border-[#E81932]/30 hover:text-[#E81932] transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Trigger button */}
                  <button
                    disabled={busy || !manFlight.trim() || !manReason.trim()}
                    onClick={triggerManual}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl
                      bg-[#E81932] hover:bg-[#c7111f] text-white text-xs font-bold
                      disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-98"
                  >
                    {loading === "manual"
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Zap className="w-4 h-4" />}
                    {manFlight || "—"} için Kriz Tetikle
                  </button>
                </div>
              )}
            </div>

            {/* Pipeline animation */}
            {pipeline && (
              <div className="px-4 pb-3 shrink-0">
                <div className="bg-[#f9f9fc] border border-[#ebebf2] rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    {PIPELINE_STEPS.map((label, idx) => {
                      const done    = pipeline.step > idx
                      const running = pipeline.step === idx
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                            done    ? "bg-[#10b981] text-white" :
                            running ? "bg-[#E81932] text-white animate-pulse" :
                                      "bg-[#ebebf2] text-[#9999bb]"
                          }`}>
                            {done    ? <CheckCircle className="w-3.5 h-3.5" />
                            : running ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <span className="text-[9px] font-bold">{idx + 1}</span>}
                          </div>
                          <span className={`text-[8px] font-medium text-center leading-tight ${
                            done ? "text-[#10b981]" : running ? "text-[#E81932]" : "text-[#9999bb]"
                          }`}>{label}</span>
                        </div>
                      )
                    })}
                  </div>
                  {pipeline.step >= 3 && (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#10b981]/8 border border-[#10b981]/20 rounded-lg">
                      <MessageSquare className="w-3 h-3 text-[#10b981] shrink-0" />
                      <span className="text-[10px] text-[#10b981] font-medium tabular-nums">
                        {pipeline.step === 4
                          ? `✓ ${pipeline.passengers} yolcuya SMS/Email gönderildi`
                          : `SMS gönderiliyor… ${pipeline.notified}/${pipeline.passengers}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results / Error */}
            {(results.length > 0 || error) && (
              <div className="px-4 pb-4 flex flex-col gap-1.5 shrink-0">
                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#ef4444]/8 border border-[#ef4444]/20 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444] shrink-0" />
                    <span className="text-[11px] text-[#ef4444]">{error}</span>
                  </div>
                )}
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#10b981]/8 border border-[#10b981]/20 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                    <span className="text-[11px] text-[#10b981] font-medium">
                      Kriz #{r.crisis_id} — {r.flight} · {r.passengers} yolcu
                      <span className="ml-1 text-[#9999bb]">({r.mode === "ai" ? "AI senaryo" : "Manuel"})</span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-[#ebebf2] bg-[#f9f9fc] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${tab === "ai" ? "bg-[#E81932]" : "bg-[#8b5cf6]"}`} />
                <span className="text-[10px] text-[#9999bb]">
                  {tab === "ai" ? "AI Senaryo Modu" : "Manuel Giriş Modu"}
                </span>
              </div>
              <span className="text-[10px] text-[#9999bb] font-mono">AI → MILP → EU261 → SMS</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
