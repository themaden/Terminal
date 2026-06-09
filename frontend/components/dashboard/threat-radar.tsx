"use client"

import { useState, useEffect, useCallback } from "react"
import { CloudLightning, Eye, Wind, Snowflake, Thermometer,
         ChevronDown, ChevronUp, Shield, Zap, Loader2, Clock } from "lucide-react"
import { predictionApi, crisisApi, type WeatherThreat, type WeatherForecast } from "@/lib/api"

// ── helpers ───────────────────────────────────────────────────────────────────

function threatIcon(type: string) {
  const cls = "w-4 h-4"
  switch (type) {
    case "THUNDERSTORM":   return <CloudLightning className={cls} />
    case "LOW_VISIBILITY": return <Eye className={cls} />
    case "CROSSWIND":      return <Wind className={cls} />
    case "SNOWSTORM":      return <Snowflake className={cls} />
    case "HEATWAVE":       return <Thermometer className={cls} />
    default:               return <CloudLightning className={cls} />
  }
}

function severityStyle(s: string) {
  switch (s) {
    case "CRITICAL": return { badge: "bg-[#ef4444] text-white",          ring: "border-[#ef4444]/30", glow: "bg-[#ef4444]/8",  text: "text-[#ef4444]" }
    case "HIGH":     return { badge: "bg-[#f97316] text-white",          ring: "border-[#f97316]/30", glow: "bg-[#f97316]/8",  text: "text-[#f97316]" }
    case "MEDIUM":   return { badge: "bg-[#eab308] text-black",          ring: "border-[#eab308]/30", glow: "bg-[#eab308]/8",  text: "text-[#eab308]" }
    default:         return { badge: "bg-[#10b981] text-white",          ring: "border-[#10b981]/30", glow: "bg-[#10b981]/8",  text: "text-[#10b981]" }
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "THUNDERSTORM":   return "Fırtına"
    case "LOW_VISIBILITY": return "Düşük Görüş"
    case "CROSSWIND":      return "Yan Rüzgar"
    case "SNOWSTORM":      return "Kar Fırtınası"
    case "HEATWAVE":       return "Aşırı Sıcak"
    default:               return type
  }
}

// Live countdown
function Countdown({ minutes }: { minutes: number }) {
  const [remaining, setRemaining] = useState(minutes * 60)

  useEffect(() => {
    setRemaining(minutes * 60)
    const id = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000)
    return () => clearInterval(id)
  }, [minutes])

  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const urgent = m < 30
  return (
    <span className={`font-mono text-[11px] tabular-nums font-bold ${urgent ? "text-[#ef4444] animate-pulse" : "text-[#666680]"}`}>
      {m}:{s.toString().padStart(2, "0")}
    </span>
  )
}

// ── main component ────────────────────────────────────────────────────────────

interface Props {
  onCrisisTriggered: () => void
}

export function ThreatRadar({ onCrisisTriggered }: Props) {
  const [forecast, setForecast]   = useState<WeatherForecast | null>(null)
  const [open, setOpen]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [protecting, setProtecting] = useState<string | null>(null)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({})
  const [expanded, setExpanded]   = useState<string | null>(null)

  const fetchForecast = useCallback(async () => {
    try {
      const data = await predictionApi.weatherForecast()
      setForecast(data)
    } catch { /* backend not ready yet */ }
  }, [])

  useEffect(() => {
    fetchForecast()
    const id = setInterval(fetchForecast, 60_000)
    return () => clearInterval(id)
  }, [fetchForecast])

  const threats = forecast?.threats ?? []
  const imminent = threats.filter(t => t.time_to_impact_minutes < 90)
  const hasThreats = threats.length > 0

  async function handleProtect(t: WeatherThreat) {
    setProtecting(t.id)
    try {
      await predictionApi.autoProtect(t.affected_flights[0] ?? "TK1981", t.type)
      setActionMsg(m => ({ ...m, [t.id]: `✓ ${t.affected_flights[0]} korunuyor — kapasite hold, mürettebat uyarıldı` }))
    } catch (e: unknown) {
      setActionMsg(m => ({ ...m, [t.id]: `Hata: ${e instanceof Error ? e.message : "Bilinmeyen"}` }))
    } finally {
      setProtecting(null)
    }
  }

  async function handleTrigger(t: WeatherThreat) {
    const flight = t.affected_flights[0] ?? "TK1981"
    setTriggering(t.id)
    try {
      const crisis = await crisisApi.trigger({
        flight_number: flight,
        crisis_type: "CANCELLATION",
        severity: t.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
        reason: t.description,
      })
      setActionMsg(m => ({ ...m, [t.id]: `✓ Kriz #${crisis.id} açıldı — AI devreye girdi` }))
      onCrisisTriggered()
    } catch (e: unknown) {
      setActionMsg(m => ({ ...m, [t.id]: `Hata: ${e instanceof Error ? e.message : "Bilinmeyen"}` }))
    } finally {
      setTriggering(null)
    }
  }

  return (
    <>
      {/* ── Threat Strip (always visible when threats exist) ── */}
      {hasThreats && (
        <div
          className={`flex items-center gap-3 px-4 py-1.5 border-b cursor-pointer transition-colors
            ${imminent.length > 0
              ? "bg-[#ef4444]/6 border-[#ef4444]/20 hover:bg-[#ef4444]/10"
              : "bg-[#f97316]/5 border-[#f97316]/15 hover:bg-[#f97316]/8"}`}
          onClick={() => setOpen(true)}
        >
          {/* Radar pulse */}
          <div className="relative w-4 h-4 shrink-0">
            <div className={`absolute inset-0 rounded-full ${imminent.length > 0 ? "bg-[#ef4444]/20 animate-ping" : "bg-[#f97316]/20 animate-pulse"}`} />
            <div className={`absolute inset-1 rounded-full ${imminent.length > 0 ? "bg-[#ef4444]" : "bg-[#f97316]"}`} />
          </div>

          <span className={`text-[10px] font-bold uppercase tracking-wider ${imminent.length > 0 ? "text-[#ef4444]" : "text-[#f97316]"}`}>
            {imminent.length > 0 ? `⚠ ${imminent.length} ACİL TEHDİT` : `HAVA UYARISI`}
          </span>

          <div className="flex gap-1.5">
            {threats.slice(0, 3).map(t => {
              const st = severityStyle(t.severity)
              return (
                <span key={t.id} className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${st.badge}`}>
                  {t.airport} {typeLabel(t.type)} · {t.time_to_impact_minutes}dk
                </span>
              )
            })}
          </div>

          <span className="ml-auto text-[9px] text-[#9999bb]">Detaylar →</span>
        </div>
      )}

      {/* ── Floating Radar Button (when no strip or as supplement) ── */}
      {!hasThreats && (
        <button
          onClick={() => { setLoading(true); fetchForecast().finally(() => setLoading(false)); setOpen(true) }}
          className="fixed bottom-16 left-5 z-40 flex items-center gap-2 px-3 py-2
            bg-white border border-[#e0e0ea] text-[#666680] hover:border-[#10b981]/40
            hover:text-[#10b981] rounded-full shadow text-[10px] font-semibold transition-all duration-150"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
          Hava Radarı
        </button>
      )}

      {/* ── Modal Panel ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-start p-5 pt-20">
          <div className="absolute inset-0 bg-black/15 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-[500px] bg-white border border-[#e0e0ea] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#ebebf2] bg-[#f9f9fc] shrink-0">
              <div className="flex items-center gap-2.5">
                {/* Animated radar icon */}
                <div className="relative w-8 h-8">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={`absolute inset-0 rounded-full border ${
                      hasThreats && imminent.length > 0 ? "border-[#ef4444]/30" : "border-[#10b981]/30"
                    } animate-ping`} style={{ animationDelay: `${i * 300}ms`, animationDuration: "2s" }} />
                  ))}
                  <div className={`absolute inset-2.5 rounded-full ${
                    hasThreats && imminent.length > 0 ? "bg-[#ef4444]" : "bg-[#10b981]"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111111]">Hava Durumu Radar</p>
                  <p className="text-[10px] text-[#9999bb]">
                    {forecast ? `${threats.length} tehdit · ${forecast.total_affected_flights} uçuş · ${forecast.source === "openai_gpt4o" ? "GPT-4o" : "Kural tabanlı"}` : "Yükleniyor..."}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#ebebf2]">
                <ChevronDown className="w-4 h-4 text-[#9999bb]" />
              </button>
            </div>

            {/* Narrative */}
            {forecast?.narrative && (
              <div className="px-5 py-3 border-b border-[#ebebf2] bg-[#fffbf0] shrink-0">
                <p className="text-[11px] text-[#666640] leading-snug">{forecast.narrative}</p>
              </div>
            )}

            {/* Threats list */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {threats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Shield className="w-8 h-8 text-[#10b981]" />
                  <p className="text-xs text-[#9999bb]">Aktif hava tehdidi yok — nominal koşullar</p>
                </div>
              ) : threats.map(t => {
                const st = severityStyle(t.severity)
                const isExpanded = expanded === t.id
                const msg = actionMsg[t.id]
                return (
                  <div key={t.id} className={`rounded-xl border ${st.ring} ${st.glow} overflow-hidden`}>
                    {/* Threat header */}
                    <button
                      className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-black/3 transition-colors"
                      onClick={() => setExpanded(isExpanded ? null : t.id)}
                    >
                      <div className={`shrink-0 ${st.text} mt-0.5`}>{threatIcon(t.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold ${st.text}`}>{typeLabel(t.type)} — {t.airport}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${st.badge}`}>{t.severity}</span>
                          {t.auto_trigger_recommended && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#ef4444] text-white font-bold animate-pulse">ACİL</span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#666680] mt-0.5 truncate">{t.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#9999bb]" />
                            <Countdown minutes={t.time_to_impact_minutes} />
                          </div>
                          <span className="text-[10px] text-[#9999bb]">%{Math.round(t.probability * 100)} olasılık</span>
                          <span className="text-[10px] text-[#9999bb]">{t.wind_speed_kt} kt · {t.visibility_m}m görüş</span>
                        </div>
                        {/* Probability bar */}
                        <div className="mt-2 h-1 bg-[#ebebf2] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              t.severity === "CRITICAL" ? "bg-[#ef4444]" :
                              t.severity === "HIGH"     ? "bg-[#f97316]" : "bg-[#eab308]"
                            }`}
                            style={{ width: `${Math.round(t.probability * 100)}%` }}
                          />
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#9999bb] shrink-0 mt-1" /> : <ChevronDown className="w-3.5 h-3.5 text-[#9999bb] shrink-0 mt-1" />}
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 flex flex-col gap-2.5 border-t border-white/60">
                        {/* Affected flights */}
                        <div className="pt-2.5">
                          <p className="text-[9px] text-[#9999bb] uppercase tracking-wide mb-1.5">Etkilenen Uçuşlar</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {t.affected_flights.map(fn => (
                              <span key={fn} className="font-mono text-[10px] px-2 py-0.5 bg-white/80 border border-[#e0e0ea] rounded-md text-[#333355]">{fn}</span>
                            ))}
                          </div>
                        </div>

                        {/* Recommended action */}
                        <div className="text-[10px] text-[#555570] leading-snug bg-white/60 px-2.5 py-2 rounded-lg">
                          <span className="font-semibold text-[#333355]">Öneri:</span> {t.recommended_action}
                        </div>

                        {/* Action message */}
                        {msg && (
                          <p className={`text-[10px] font-medium ${msg.startsWith("✓") ? "text-[#10b981]" : "text-[#ef4444]"}`}>{msg}</p>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            disabled={!!protecting || !!triggering}
                            onClick={() => handleProtect(t)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3
                              bg-white border border-[#e0e0ea] hover:border-[#10b981]/50 hover:text-[#10b981]
                              rounded-lg text-[10px] font-semibold text-[#666680] transition-all disabled:opacity-50"
                          >
                            {protecting === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                            Proaktif Koru
                          </button>
                          <button
                            disabled={!!protecting || !!triggering || t.affected_flights.length === 0}
                            onClick={() => handleTrigger(t)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3
                              rounded-lg text-[10px] font-semibold text-white transition-all disabled:opacity-50
                              ${t.auto_trigger_recommended
                                ? "bg-[#ef4444] hover:bg-[#c7111f] animate-pulse"
                                : "bg-[#f97316] hover:bg-[#ea6c0a]"}`}
                          >
                            {triggering === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                            {t.auto_trigger_recommended ? "Acil Kriz Aç" : "Kriz Aç"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-[#ebebf2] bg-[#f9f9fc] shrink-0 flex items-center justify-between">
              <span className="text-[9px] text-[#9999bb]">
                {forecast ? `Son güncelleme: ${new Date(forecast.generated_at).toLocaleTimeString("tr-TR")}` : "—"}
              </span>
              <button onClick={fetchForecast} className="text-[9px] text-[#9999bb] hover:text-[#666680] transition-colors">
                Yenile ↻
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
