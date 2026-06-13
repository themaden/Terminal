"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ComposableMap, Geographies, Geography, Graticule, Sphere, Marker, Line } from "react-simple-maps"
import { AlertTriangle, Zap, RefreshCw } from "lucide-react"

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

type RouteStatus = "normal" | "warning" | "disrupted"

const AIRPORTS: Record<string, [number, number]> = {
  IST: [28.82, 40.98],
  LHR: [-0.45, 51.47], CDG: [2.55, 49.01],  FRA: [8.57, 50.03],
  AMS: [4.76, 52.31],  BER: [13.40, 52.55], MAD: [-3.57, 40.47],
  JFK: [-73.78, 40.64],LAX: [-118.4, 33.94],ORD: [-87.9, 41.97],
  DXB: [55.36, 25.25], DOH: [51.61, 25.27], CAI: [31.41, 30.12],
  DEL: [77.10, 28.55], SIN: [103.98, 1.36], BKK: [100.75, 13.68],
  NRT: [139.78, 35.55],PEK: [116.59, 40.08],SVO: [37.41, 55.97],
  GRU: [-46.47, -23.43],SYD: [151.18,-33.95],FCO: [12.25, 41.80],
}

const ROUTE_STATUS: Record<string, RouteStatus> = {
  LHR: "disrupted", CDG: "warning",  FRA: "warning",  AMS: "normal",
  BER: "disrupted", MAD: "normal",   JFK: "normal",   LAX: "normal",
  ORD: "normal",    DXB: "normal",   DOH: "normal",   CAI: "normal",
  DEL: "normal",    SIN: "normal",   BKK: "normal",   NRT: "normal",
  PEK: "normal",    SVO: "warning",  GRU: "normal",   SYD: "normal",
  FCO: "normal",
}

const LINE_STROKE: Record<RouteStatus, string> = {
  normal:    "rgba(200,16,46,0.18)",
  warning:   "rgba(245,158,11,0.55)",
  disrupted: "rgba(232,32,64,0.75)",
}

const DOT_COLOR: Record<RouteStatus, string> = {
  normal:    "rgba(255,255,255,0.5)",
  warning:   "#f59e0b",
  disrupted: "#E82040",
}

const ACTIVE_CRISES = [
  { code: "TK001", route: "IST → LHR", type: "İptal",   severity: "Kritik", pax: 180, time: "12:30" },
  { code: "TK034", route: "IST → BER", type: "Gecikme", severity: "Uyarı",  pax: 95,  time: "13:15" },
  { code: "TK078", route: "IST → CDG", type: "Gecikme", severity: "Uyarı",  pax: 140, time: "14:00" },
  { code: "TK199", route: "IST → FRA", type: "Gecikme", severity: "Uyarı",  pax: 210, time: "14:45" },
  { code: "TK421", route: "IST → SVO", type: "Gecikme", severity: "Uyarı",  pax: 165, time: "15:20" },
]

interface IoccStats {
  activeDisruptions: number
  totalPassengersAffected: number
  aiRecoveryRate: number
}

const FALLBACK_STATS: IoccStats = { activeDisruptions: 12, totalPassengersAffected: 3450, aiRecoveryRate: 92 }

const disruptedRoutes = Object.entries(ROUTE_STATUS).filter(([, s]) => s === "disrupted")
const warningRoutes   = Object.entries(ROUTE_STATUS).filter(([, s]) => s === "warning")

export default function IrropsDashboard() {
  const [stats, setStats] = useState<IoccStats>(FALLBACK_STATS)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState("Şimdi")

  const fetchStats = () => {
    setLoading(true)
    const url   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const token = typeof window !== "undefined" ? localStorage.getItem("jetnexus_token") || "" : ""
    fetch(`${url}/api/v1/iocc/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.active_disruptions !== undefined) {
          setStats({
            activeDisruptions:       d.active_disruptions,
            totalPassengersAffected: d.total_passengers_affected ?? FALLBACK_STATS.totalPassengersAffected,
            aiRecoveryRate:          d.ai_recovery_rate          ?? FALLBACK_STATS.aiRecoveryRate,
          })
          setLastUpdated("Az önce")
        }
      })
      .catch(() => setLastUpdated("Bağlanamadı — Mock Data"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStats() }, [])

  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.12) 0%, transparent 55%), linear-gradient(135deg, #0c0e1a 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-5 gap-4">

        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-bold text-white tracking-tight">IRROPS Gösterge Paneli</h1>
          <div className="flex items-center gap-3">
            <span className="text-white/25 text-xs">{lastUpdated}</span>
            <button onClick={fetchStats} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 text-xs hover:text-white/80 transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Yenile
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(232,32,64,0.15)", border: "1px solid rgba(232,32,64,0.3)" }}>
              <span className="w-2 h-2 rounded-full bg-[#E82040] animate-pulse" />
              <span className="text-[#E82040] text-xs font-bold">Canlı İzleme</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 shrink-0">
          {[
            { label: "Aktif Kesintiler",    value: stats.activeDisruptions.toString(),               warn: true,  ok: false },
            { label: "Etkilenen Yolcular",  value: stats.totalPassengersAffected.toLocaleString("tr-TR"), warn: false, ok: false },
            { label: "AI Kurtarma Oranı",   value: `%${stats.aiRecoveryRate}`,                       warn: false, ok: true  },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${s.warn ? "rgba(232,32,64,0.25)" : s.ok ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.08)"}` }}>
              <p className="text-white/55 text-sm mb-2">{s.label}</p>
              <p className={`text-4xl font-black ${s.ok ? "text-[#10b981]" : s.warn ? "text-[#E82040]" : "text-white"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Map + Right Panel */}
        <div className="flex-1 flex gap-4 min-h-0">

          {/* Map */}
          <div className="flex-1 rounded-xl overflow-hidden relative"
            style={{ background: "rgba(4,6,14,0.97)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <ComposableMap
              projection="geoNaturalEarth1"
              style={{ width: "100%", height: "100%" }}
              projectionConfig={{ scale: 168, center: [15, 20] }}
            >
              <defs>
                <filter id="hubGlow">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <radialGradient id="istBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#E82040" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#E82040" stopOpacity={0} />
                </radialGradient>
              </defs>

              <Sphere id="sphere" fill="#030507" stroke="transparent" strokeWidth={0} />
              <Graticule stroke="rgba(255,255,255,0.025)" strokeWidth={0.4} />

              <Geographies geography={GEO_URL}>
                {({ geographies }) => geographies.map((geo) => (
                  <Geography key={geo.rsmKey} geography={geo}
                    fill="#0f1828" stroke="#080e1c" strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover:   { fill: "#182038", outline: "none" },
                      pressed: { outline: "none" },
                    }} />
                ))}
              </Geographies>

              {/* Route lines — great-circle arcs */}
              {Object.entries(ROUTE_STATUS).map(([code, status]) => {
                const dest = AIRPORTS[code]
                if (!dest) return null
                return (
                  <Line key={code}
                    from={AIRPORTS.IST}
                    to={dest}
                    stroke={LINE_STROKE[status]}
                    strokeWidth={status === "disrupted" ? 1.6 : status === "warning" ? 1.1 : 0.65}
                    strokeLinecap="round"
                  />
                )
              })}

              {/* Destination dots */}
              {Object.entries(AIRPORTS).map(([code, coords]) => {
                if (code === "IST") return null
                const status = ROUTE_STATUS[code] ?? "normal"
                const color  = DOT_COLOR[status]
                return (
                  <Marker key={code} coordinates={coords}>
                    <circle
                      r={status === "disrupted" ? 4.5 : status === "warning" ? 3.5 : 2.2}
                      fill={color}
                      style={status !== "normal" ? { filter: `drop-shadow(0 0 5px ${color})` } : {}}
                    />
                    {status !== "normal" && (
                      <text y={-8} textAnchor="middle" fill={color} fontSize={5.5}
                        fontFamily="system-ui" fontWeight="bold">{code}</text>
                    )}
                  </Marker>
                )
              })}

              {/* IST hub */}
              <Marker coordinates={AIRPORTS.IST}>
                <g>
                  <circle r={32} fill="url(#istBg)" />
                  <circle r={20} fill="rgba(200,16,46,0.10)" />
                  <circle r={11} fill="rgba(200,16,46,0.20)" />
                  <circle r={6}  fill="rgba(200,16,46,0.40)" />
                  <circle r={3.5} fill="#E82040" filter="url(#hubGlow)"
                    style={{ filter: "drop-shadow(0 0 8px rgba(232,32,64,0.9))" }} />
                  <circle r={1.5} fill="white" />
                  <text y={-23} textAnchor="middle" fill="white" fontSize={8.5}
                    fontWeight="bold" fontFamily="system-ui" letterSpacing={1}>IST HUB</text>
                  <text y={-13} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={6.5}
                    fontFamily="system-ui">İSTANBUL</text>
                </g>
              </Marker>
            </ComposableMap>

            {/* Status badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(232,32,64,0.15)", border: "1px solid rgba(232,32,64,0.35)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#E82040] animate-pulse" />
                <span className="text-[#E82040] text-[10px] font-bold">{disruptedRoutes.length} Aksama</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                <span className="text-[#f59e0b] text-[10px] font-bold">{warningRoutes.length} Gecikme</span>
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex items-center gap-3 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[
                { color: "rgba(255,255,255,0.45)", label: "Normal"  },
                { color: "#f59e0b",                label: "Gecikme" },
                { color: "#E82040",                label: "Aksama"  },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  <span className="text-white/40 text-[10px]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-[265px] shrink-0 flex flex-col gap-3">

            {/* Active Crises */}
            <div className="rounded-xl p-4 flex-1 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[#E82040]" />
                <h3 className="text-white font-semibold text-sm">Aktif Krizler</h3>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "calc(100% - 40px)" }}>
                {ACTIVE_CRISES.map(c => (
                  <div key={c.code} className="p-3 rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${c.severity === "Kritik" ? "rgba(232,32,64,0.25)" : "rgba(245,158,11,0.18)"}`,
                    }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/90 text-xs font-bold">{c.code}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: c.severity === "Kritik" ? "rgba(232,32,64,0.15)" : "rgba(245,158,11,0.12)",
                          color: c.severity === "Kritik" ? "#E82040" : "#f59e0b",
                        }}>{c.severity}</span>
                    </div>
                    <p className="text-white/65 text-xs font-medium">{c.route}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-white/30 text-[10px]">{c.type} · {c.time}</span>
                      <span className="text-white/45 text-[10px]">{c.pax} yolcu</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#E82040]" />
                <h3 className="text-white font-semibold text-sm">AI Önerileri</h3>
              </div>
              <div className="space-y-2">
                {[
                  "Londra'daki 180 yolcu için otel ön tahsisi başlat",
                  "Berlin krizini PCC'ye bildir — ekip ataması gerekli",
                  "3 Avrupa güzergahı için alternatif rota planla",
                ].map((tip, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E82040] mt-1.5 shrink-0" />
                    <p className="text-white/55 text-xs leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Acil Eylemler</h3>
              <div className="space-y-2">
                {["Gecikmiş Uçuşları İncele", "Alternatif Rotaları Planla"].map(a => (
                  <button key={a} className="w-full py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    style={{ background: "#C8102E" }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        <p className="text-white/20 text-xs text-center shrink-0">© 2024 Turkish Airlines. All rights reserved.</p>
      </div>
    </div>
  )
}
