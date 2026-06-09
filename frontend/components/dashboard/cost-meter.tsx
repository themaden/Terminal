"use client"

import { useEffect, useRef, useState } from "react"
import { TrendingDown, Euro } from "lucide-react"

interface Props {
  totalCompensationEur: number
  activeCrises: number
  affectedPassengers: number
}

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const start = prev.current
    const diff  = target - start
    if (diff === 0) return

    const steps = 60
    const stepMs = duration / steps
    let step = 0

    const id = setInterval(() => {
      step++
      const progress = step / steps
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(start + diff * eased))
      if (step >= steps) {
        setValue(target)
        prev.current = target
        clearInterval(id)
      }
    }, stepMs)

    return () => clearInterval(id)
  }, [target, duration])

  return value
}

export function CostMeter({ totalCompensationEur, activeCrises, affectedPassengers }: Props) {
  const displayed = useCountUp(Math.round(totalCompensationEur))
  const manualEstimate = Math.round(totalCompensationEur * 5.5)
  const savings = manualEstimate - Math.round(totalCompensationEur)
  const savingsDisplayed = useCountUp(savings)

  const isActive = activeCrises > 0

  return (
    <div className={`flex items-center gap-4 px-4 py-2 border-b transition-colors duration-500 ${
      isActive
        ? "bg-[#ef4444]/5 border-[#ef4444]/15"
        : "bg-[#f0fdf4]/50 border-[#10b981]/10"
    }`}>

      {/* EU261 sayaç */}
      <div className="flex items-center gap-2">
        <div className={`relative flex items-center justify-center w-5 h-5 rounded-full ${isActive ? "bg-[#ef4444]/10" : "bg-[#10b981]/10"}`}>
          <Euro className={`w-3 h-3 ${isActive ? "text-[#ef4444]" : "text-[#10b981]"}`} />
          {isActive && (
            <span className="absolute inset-0 rounded-full bg-[#ef4444]/20 animate-ping" />
          )}
        </div>
        <div>
          <p className="text-[8px] text-[#9999bb] uppercase tracking-wide leading-none mb-0.5">EU261 Tazminat</p>
          <p className={`text-sm font-bold tabular-nums leading-none ${isActive ? "text-[#ef4444]" : "text-[#10b981]"}`}>
            €{displayed.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="w-px h-7 bg-[#e0e0ea]" />

      {/* Manuel vs AI tasarruf */}
      <div className="flex items-center gap-2">
        <TrendingDown className="w-3.5 h-3.5 text-[#10b981]" />
        <div>
          <p className="text-[8px] text-[#9999bb] uppercase tracking-wide leading-none mb-0.5">Manuel Süreç Farkı</p>
          <p className="text-sm font-bold text-[#10b981] tabular-nums leading-none">
            +€{savingsDisplayed.toLocaleString()} <span className="text-[9px] font-normal text-[#9999bb]">tasarruf</span>
          </p>
        </div>
      </div>

      <div className="w-px h-7 bg-[#e0e0ea]" />

      {/* Yolcu başı */}
      {affectedPassengers > 0 && (
        <div className="text-center">
          <p className="text-[8px] text-[#9999bb] uppercase tracking-wide leading-none mb-0.5">Yolcu Başı</p>
          <p className={`text-xs font-bold tabular-nums leading-none ${isActive ? "text-[#ef4444]" : "text-[#666680]"}`}>
            €{affectedPassengers > 0 ? Math.round(totalCompensationEur / affectedPassengers) : 0}
          </p>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <span className="text-[9px] text-[#9999bb] font-mono">
          {isActive ? `${activeCrises} aktif kriz` : "Kriz yok"}
        </span>
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#ef4444] animate-pulse" : "bg-[#10b981]"}`} />
      </div>
    </div>
  )
}
