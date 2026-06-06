"use client"

import { useState, useEffect, useRef } from "react"
import { Plane, Users, RefreshCw, AlertTriangle, Hotel, Bus } from "lucide-react"

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(target)
  const prevRef = useRef(target)

  useEffect(() => {
    const from = prevRef.current
    if (from === target) return
    prevRef.current = target

    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(from + (target - from) * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])

  return value
}

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  accent: string
  pulse?: boolean
  animate?: boolean
}

function StatCard({ title, value, icon, accent, pulse, animate }: StatCardProps) {
  const numValue   = typeof value === "number" ? value : 0
  const animated   = useCountUp(animate ? numValue : numValue, 600)
  const displayVal = typeof value === "string" ? value : animated

  return (
    <div className="relative rounded-xl px-3.5 py-3 flex items-center justify-between overflow-hidden group cursor-default transition-all duration-200 hover:scale-[1.01]"
      style={{ backgroundColor: "#ffffff", border: `1px solid ${accent}25`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 80% 50%, ${accent}0a 0%, transparent 65%)` }} />

      {/* Left: label + value */}
      <div className="relative z-10">
        <p className="text-[9px] uppercase tracking-[0.16em] mb-1.5 font-semibold"
          style={{ color: `${accent}80` }}>
          {title}
        </p>
        <p className="text-[22px] font-bold tabular-nums text-[#111111] leading-none"
          style={{ textShadow: `0 0 20px ${accent}30` }}>
          {displayVal}
        </p>
      </div>

      {/* Right: icon */}
      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${accent}12` }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
        {pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />}
      </div>

      {/* Bottom line */}
      <div className="absolute bottom-0 left-8 right-8 h-px opacity-30"
        style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />
    </div>
  )
}

interface StatsBarProps {
  stats: {
    impactedFlights: number
    totalPassengers: number
    reAccommodated: number
    manualCheck: number
    hotelBeds: number
    busStatus: string
  }
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-6 gap-2 px-3 py-2.5 bg-[#f7f7fa] border-b border-[#e8e8f0]">
      <StatCard title="Etkilenen Uçuşlar"  value={stats.impactedFlights}  icon={<Plane      className="w-4.5 h-4.5" style={{width:18,height:18}} />} accent="#E81932" pulse={stats.impactedFlights > 0} animate />
      <StatCard title="Toplam Yolcu"        value={stats.totalPassengers}  icon={<Users      className="w-4.5 h-4.5" style={{width:18,height:18}} />} accent="#E81932" animate />
      <StatCard title="Yeniden Yerleşim"    value={stats.reAccommodated}   icon={<RefreshCw  className="w-4.5 h-4.5" style={{width:18,height:18}} />} accent="#10b981" animate />
      <StatCard title="Manuel Kontrol"      value={stats.manualCheck}      icon={<AlertTriangle className="w-4.5 h-4.5" style={{width:18,height:18}} />} accent="#ef4444" pulse={stats.manualCheck > 0} animate />
      <StatCard title="Otel Yatak"          value={stats.hotelBeds}        icon={<Hotel      className="w-4.5 h-4.5" style={{width:18,height:18}} />} accent="#8b5cf6" animate />
      <StatCard title="Transfer Otobüs"     value={stats.busStatus}        icon={<Bus        className="w-4.5 h-4.5" style={{width:18,height:18}} />} accent="#E81932" />
    </div>
  )
}
