"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { ComposableMap, Geographies, Geography, Graticule, Sphere, Marker, Line } from "react-simple-maps"
import { Sidebar } from "@/components/dashboard/sidebar"

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const AIRPORTS: Record<string, [number, number]> = {
  IST: [28.82, 40.98], LHR: [-0.45, 51.47], CDG: [2.55, 49.01],
  JFK: [-73.78, 40.64], FRA: [8.57, 50.03], AMS: [4.76, 52.31],
  DXB: [55.36, 25.25], BER: [13.40, 52.55], MAD: [-3.57, 40.47],
  FCO: [12.25, 41.80], SIN: [103.98, 1.36], NRT: [139.78, 35.55],
  LAX: [-118.4, 33.94], ORD: [-87.9, 41.97], GRU: [-46.47, -23.43],
  SYD: [151.18, -33.95], CAI: [31.41, 30.12], DEL: [77.10, 28.55],
  PEK: [116.59, 40.08], SVO: [37.41, 55.97], DOH: [51.61, 25.27],
  BKK: [100.75, 13.68],
}

type RouteStatus = "normal" | "warning" | "disrupted"

const ROUTE_STATUS: Record<string, RouteStatus> = {
  LHR: "disrupted", CDG: "warning", JFK: "normal", FRA: "warning",
  AMS: "normal",    DXB: "normal",  BER: "disrupted", MAD: "normal",
  FCO: "normal",    SIN: "normal",  NRT: "normal",  LAX: "normal",
  ORD: "normal",    GRU: "normal",  SYD: "normal",  CAI: "normal",
  DEL: "normal",    PEK: "normal",  SVO: "warning", DOH: "normal",
  BKK: "normal",
}

const DOT_COLOR: Record<RouteStatus, string> = {
  normal:    "rgba(255,255,255,0.6)",
  warning:   "#f59e0b",
  disrupted: "#E82040",
}

const LINE_STROKE: Record<RouteStatus, string> = {
  normal:    "rgba(200,16,46,0.22)",
  warning:   "rgba(245,158,11,0.45)",
  disrupted: "rgba(232,32,64,0.65)",
}

function Gauge({ value }: { value: number }) {
  const r = 60, cx = 80, cy = 80
  const startAngle = 215, totalSweep = 250
  const toRad = (d: number) => d * Math.PI / 180
  const pt = (a: number) => ({ x: cx + r * Math.cos(toRad(a)), y: cy + r * Math.sin(toRad(a)) })
  const s = pt(startAngle), e = pt(startAngle + totalSweep)
  const bgPath = `M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`
  const sweep = (value / 100) * totalSweep
  const ve = pt(startAngle + sweep)
  const la = sweep > 180 ? 1 : 0
  const valPath = `M ${s.x} ${s.y} A ${r} ${r} 0 ${la} 1 ${ve.x} ${ve.y}`

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="110" viewBox="0 0 160 110">
        <defs>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} strokeLinecap="round" />
        <path d={valPath} fill="none" stroke="#E82040" strokeWidth={10} strokeLinecap="round"
          filter="url(#gaugeGlow)"
          style={{ filter: "drop-shadow(0 0 8px rgba(232,32,64,0.8))" }} />
        <text x="80" y="82" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="system-ui">
          {value}%
        </text>
        <text x="80" y="98" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="system-ui">
          RİSK ENDEKSİ
        </text>
      </svg>
    </div>
  )
}

function LiveBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: "rgba(232,32,64,0.15)", border: "1px solid rgba(232,32,64,0.3)" }}>
      <span className="w-2 h-2 rounded-full bg-[#E82040] animate-pulse-live" />
      <span className="text-[#E82040] text-xs font-bold tracking-widest">Canlı</span>
    </div>
  )
}

interface DashboardStats {
  riskIndex: number
  europeLevel: "Kritik" | "Orta" | "Normal"
  asiaLevel:   "Kritik" | "Orta" | "Normal"
  naLevel:     "Kritik" | "Orta" | "Normal"
  tips: string[]
}

const FALLBACK_STATS: DashboardStats = {
  riskIndex: 75,
  europeLevel: "Kritik",
  asiaLevel:   "Orta",
  naLevel:     "Normal",
  tips: [
    "Londra için 50 otel odası ön tahsis yap — fırtına uyarısı aktif",
    "Orta Avrupa hava sistemini aşmak için rota değiştir",
    "Berlin'den 3 uçuş için yedek ekip hazırla",
  ],
}

const DELAY_COLOR: Record<string, string> = { Kritik: "#E82040", Orta: "#f59e0b", Normal: "#10b981" }

export default function MainDashboard() {
  const [stats, setStats] = useState<DashboardStats>(FALLBACK_STATS)

  useEffect(() => {
    const url   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const token = typeof window !== "undefined" ? localStorage.getItem("jetnexus_token") || "" : ""
    fetch(`${url}/api/v1/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.risk_index !== undefined) {
          setStats(prev => ({
            ...prev,
            riskIndex:   d.risk_index           ?? prev.riskIndex,
            europeLevel: d.europe_delay_level   ?? prev.europeLevel,
            asiaLevel:   d.asia_delay_level     ?? prev.asiaLevel,
            naLevel:     d.na_delay_level       ?? prev.naLevel,
            tips:        d.ai_tips?.length ? d.ai_tips : prev.tips,
          }))
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="h-screen flex overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.15) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)"
      }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <h1 className="text-2xl font-bold text-white tracking-tight">Global Operasyon Komuta Merkezi</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Search className="w-4 h-4 text-white/40" />
              <input placeholder="Uçuş, Yolcu veya Kaynak Ara"
                className="bg-transparent text-white/80 text-sm outline-none placeholder-white/30 w-52" />
            </div>
            <LiveBadge />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex gap-4 px-6 pb-5 overflow-hidden">

          {/* Map Area */}
          <div className="flex-1 rounded-2xl overflow-hidden relative"
            style={{ background: "rgba(5,8,18,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}>

            <ComposableMap
              projection="geoNaturalEarth1"
              style={{ width: "100%", height: "100%" }}
              projectionConfig={{ scale: 165, center: [15, 20] }}
            >
              <defs>
                <radialGradient id="istGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#E82040" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#E82040" stopOpacity={0} />
                </radialGradient>
                <filter id="mapGlow">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              <Sphere id="sphere" fill="#040810" stroke="transparent" strokeWidth={0} />
              <Graticule stroke="rgba(255,255,255,0.03)" strokeWidth={0.4} />

              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography key={geo.rsmKey} geography={geo}
                      fill="#111827" stroke="#0a0f1e" strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#1a2540", outline: "none" },
                        pressed: { outline: "none" },
                      }} />
                  ))
                }
              </Geographies>

              {/* Route lines — great-circle paths */}
              {Object.entries(ROUTE_STATUS).map(([code, status]) => {
                const dest = AIRPORTS[code]
                if (!dest) return null
                return (
                  <Line
                    key={code}
                    from={AIRPORTS.IST}
                    to={dest}
                    stroke={LINE_STROKE[status]}
                    strokeWidth={status === "disrupted" ? 1.2 : 0.8}
                    strokeLinecap="round"
                  />
                )
              })}

              {/* Destination airport dots */}
              {Object.entries(AIRPORTS).map(([code, coords]) => {
                if (code === "IST") return null
                const status = ROUTE_STATUS[code] ?? "normal"
                const color = DOT_COLOR[status]
                return (
                  <Marker key={code} coordinates={coords}>
                    <circle r={status === "disrupted" ? 3.5 : 2.5} fill={color}
                      style={status !== "normal" ? { filter: `drop-shadow(0 0 3px ${color})` } : {}} />
                  </Marker>
                )
              })}

              {/* IST — hub marker */}
              <Marker coordinates={AIRPORTS.IST}>
                <g>
                  <circle r={22} fill="rgba(200,16,46,0.07)" />
                  <circle r={14} fill="rgba(200,16,46,0.12)" />
                  <circle r={7}  fill="rgba(200,16,46,0.25)" />
                  <circle r={4}  fill="#E82040" style={{ filter: "drop-shadow(0 0 6px #E82040)" }} />
                  <circle r={2}  fill="white" />
                  <text x={0} y={-16} textAnchor="middle" fill="white" fontSize={7.5} fontWeight="bold" fontFamily="system-ui" letterSpacing={0.5}>
                    İSTANBUL
                  </text>
                  <text x={0} y={-8} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={6.5} fontFamily="system-ui">
                    IST
                  </text>
                </g>
              </Marker>
            </ComposableMap>

            {/* Legend overlay */}
            <div className="absolute bottom-3 left-3 flex items-center gap-4 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white/50" />
                <span className="text-white/40 text-[10px]">Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                <span className="text-white/40 text-[10px]">Gecikme</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#E82040]" />
                <span className="text-white/40 text-[10px]">Aksama</span>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-[280px] shrink-0 flex flex-col gap-3">

            {/* AI Kriz Tahmincisi */}
            <div className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm mb-1">Yapay Zeka Kriz Tahmincisi</h3>
              <p className="text-white/30 text-[10px] mb-3">Son güncelleme: 2 dk önce</p>
              <div className="flex justify-center">
                <Gauge value={stats.riskIndex} />
              </div>
            </div>

            {/* Tahmini Gecikmeler */}
            <div className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Tahmini Gecikmeler</h3>
              <div className="space-y-2.5">
                {[
                  { region: "Avrupa",    level: stats.europeLevel, delay: "+2.5s" },
                  { region: "Asya",      level: stats.asiaLevel,   delay: "+1s"   },
                  { region: "Kuzey Am.", level: stats.naLevel,     delay: "+0.3s" },
                ].map(r => {
                  const color = DELAY_COLOR[r.level]
                  return (
                    <div key={r.region} className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">{r.region}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                        <span className="text-sm font-semibold" style={{ color }}>{r.level}</span>
                        <span className="text-white/40 text-xs">{r.delay}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* YZ Önerileri */}
            <div className="rounded-xl p-4 flex-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Yapay Zeka Önerileri</h3>
              <div className="space-y-3">
                {stats.tips.map((tip, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E82040] mt-1.5 shrink-0" />
                    <p className="text-white/55 text-xs leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="text-center pb-3 shrink-0">
          <p className="text-white/20 text-xs">© 2024 Turkish Airlines. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
