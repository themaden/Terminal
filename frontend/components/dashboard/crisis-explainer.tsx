"use client"

import { useState, useEffect, useRef } from "react"
import { Brain, ChevronDown, ChevronUp, Loader2, CheckCircle2, Sparkles } from "lucide-react"
import { crisisApi, type CrisisExplanation } from "@/lib/api"

interface Props {
  crisisId: string
  crisisType: string
}

function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState("")
  useEffect(() => {
    setDisplayed("")
    if (!text) return
    let i = 0
    const id = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return displayed
}

export function CrisisExplainer({ crisisId, crisisType }: Props) {
  const [data, setData]       = useState<CrisisExplanation | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(true)
  const [visibleBullets, setVisibleBullets] = useState(0)
  const fetched = useRef<string | null>(null)

  useEffect(() => {
    if (!crisisId || fetched.current === crisisId) return
    fetched.current = crisisId
    setLoading(true)
    setData(null)
    setVisibleBullets(0)

    crisisApi.explain(crisisId)
      .then(d => {
        setData(d)
        let i = 0
        const id = setInterval(() => {
          i++
          setVisibleBullets(i)
          if (i >= (d.bullets?.length ?? 0)) clearInterval(id)
        }, 700)
      })
      .catch(() => { fetched.current = null })
      .finally(() => setLoading(false))
  }, [crisisId])

  const headline = useTypewriter(data?.headline ?? "")

  const severityColor = crisisType === "CANCELLATION" ? "text-[#ef4444]" : "text-[#f97316]"
  const severityBg    = crisisType === "CANCELLATION" ? "bg-[#ef4444]/8 border-[#ef4444]/20" : "bg-[#f97316]/8 border-[#f97316]/20"

  return (
    <div className={`rounded-xl border ${severityBg} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-black/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className={`w-3.5 h-3.5 ${severityColor}`} />
          <span className={`text-[11px] font-bold ${severityColor} uppercase tracking-wide`}>XAI — AI Karar Açıklaması</span>
          {data && (
            <span className="text-[9px] text-[#9999bb] font-mono bg-white/60 px-1.5 py-0.5 rounded-full border border-white/80">
              {Math.round((data.ai_confidence ?? 0.95) * 100)}% güven
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-3 h-3 text-[#9999bb]" /> : <ChevronDown className="w-3 h-3 text-[#9999bb]" />}
      </button>

      {open && (
        <div className="px-3.5 pb-3">
          {loading && (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className={`w-3.5 h-3.5 animate-spin ${severityColor}`} />
              <span className="text-[11px] text-[#9999bb]">GPT-4o analiz üretiyor...</span>
            </div>
          )}

          {data && (
            <>
              {/* Headline with typewriter */}
              <p className={`text-xs font-semibold ${severityColor} mb-2.5 leading-snug`}>
                {headline}
                {headline.length < (data.headline?.length ?? 0) && (
                  <span className="inline-block w-0.5 h-3 bg-current ml-0.5 animate-pulse" />
                )}
              </p>

              {/* Bullet points */}
              <ul className="flex flex-col gap-1.5 mb-3">
                {(data.bullets ?? []).slice(0, visibleBullets).map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-[#10b981] shrink-0 mt-0.5" />
                    <span className="text-[10px] text-[#444466] leading-snug">{b}</span>
                  </li>
                ))}
              </ul>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-white/70 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[9px] text-[#9999bb]">Tasarruf</p>
                  <p className={`text-xs font-bold ${severityColor}`}>€{(data.cost_saved_eur ?? 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/70 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[9px] text-[#9999bb]">Süre Kazanımı</p>
                  <p className={`text-xs font-bold ${severityColor}`}>{data.time_saved_minutes ?? 180} dk</p>
                </div>
                <div className="bg-white/70 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[9px] text-[#9999bb]">Rez / İade</p>
                  <p className={`text-xs font-bold ${severityColor}`}>{data.rebooked}↑ {data.refunded}↩</p>
                </div>
              </div>

              {/* Powered by badge */}
              <div className="flex items-center justify-end gap-1 mt-2">
                <Sparkles className="w-2.5 h-2.5 text-[#9999bb]" />
                <span className="text-[9px] text-[#9999bb] font-mono">GPT-4o · XAI v1</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
