"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { ComposableMap, Geographies, Geography, Graticule, Sphere, Marker } from "react-simple-maps"
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
  BKK: [100.75, 13.68], NBO: [36.92, -1.32], JNB: [28.24, -26.13],
}

const ROUTES = [
  "LHR","CDG","JFK","FRA","AMS","DXB","BER","MAD","FCO",
  "SIN","NRT","LAX","ORD","GRU","SYD","CAI","DEL","PEK","SVO","DOH","BKK"
]

function Gauge({ value }: { value: number }) {
  const r = 60, cx = 80, cy = 80
  const startAngle = 215, totalSweep = 250
  const toRad = (d: number) => d * Math.PI / 180
  const pt = (a: number) => ({
    x: cx + r * Math.cos(toRad(a)),
    y: cy + r * Math.sin(toRad(a))
  })
  const s = pt(startAngle), e = pt(startAngle + totalSweep)
  const bgPath = `M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`
  const sweep = (value / 100) * totalSweep
  const ve = pt(startAngle + sweep)
  const la = sweep > 180 ? 1 : 0
  const valPath = `M ${s.x} ${s.y} A ${r} ${r} 0 ${la} 1 ${ve.x} ${ve.y}`

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="110" viewBox="0 0 160 110">
        <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={10} strokeLinecap="round" />
        <path d={valPath} fill="none" stroke="#E82040" strokeWidth={10} strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px rgba(232,32,64,0.7))" }} />
        <text x="80" y="85" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="system-ui">
          {value}%
        </text>
      </svg>
      <p className="text-white/60 text-xs text-center mt-1">Aksaklık<br/>Risk Endeksi</p>
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

export default function MainDashboard() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="h-screen flex overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.15) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)"
      }}>
      <Sidebar />

      {/* Main Content */}
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
            style={{ background: "rgba(8,10,20,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>

            <ComposableMap
              projection="geoNaturalEarth1"
              style={{ width: "100%", height: "100%" }}
              projectionConfig={{ scale: 165, center: [15, 20] }}
            >
              <Sphere id="sphere" fill="#060c1c" stroke="transparent" strokeWidth={0} />
              <Graticule stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography key={geo.rsmKey} geography={geo}
                      fill="#1a2035" stroke="#0d1525" strokeWidth={0.5}
                      style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }} />
                  ))
                }
              </Geographies>

              {/* Routes from IST */}
              {ROUTES.map((code) => {
                const dest = AIRPORTS[code]
                const ist = AIRPORTS.IST
                if (!dest) return null
                return (
                  <line key={code}
                    x1={ist[0]} y1={ist[1]} x2={dest[0]} y2={dest[1]}
                    stroke="rgba(200,16,46,0.35)" strokeWidth={1}
                  />
                )
              })}

              {/* Airport dots */}
              {Object.entries(AIRPORTS).map(([code, coords]) => (
                <Marker key={code} coordinates={coords}>
                  {code === "IST" ? (
                    <g>
                      <circle r={10} fill="rgba(200,16,46,0.15)" />
                      <circle r={5} fill="#E82040" />
                      <circle r={3} fill="white" />
                      <text y={-14} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">
                        İstanbul{"\n"}(IST)
                      </text>
                    </g>
                  ) : (
                    <circle r={2.5} fill="rgba(255,255,255,0.5)" />
                  )}
                </Marker>
              ))}
            </ComposableMap>
          </div>

          {/* Right Panel */}
          <div className="w-[280px] shrink-0 flex flex-col gap-3">

            {/* AI Kriz Tahmincisi */}
            <div className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Yapay Zeka Kriz Tahmincisi</h3>
              <div className="flex justify-center py-2">
                <Gauge value={75} />
              </div>
            </div>

            {/* Tahmini Gecikmeler */}
            <div className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Tahmini Gecikmeler</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Europe</span>
                  <span className="text-sm">
                    <span className="text-[#E82040] font-semibold">Major</span>
                    <span className="text-white/50">, +2.5h</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Asia</span>
                  <span className="text-sm">
                    <span className="text-[#f59e0b] font-semibold">Moderate</span>
                    <span className="text-white/50">, +1h</span>
                  </span>
                </div>
              </div>
            </div>

            {/* YZ Önerileri */}
            <div className="rounded-xl p-4 flex-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Yapay Zeka Önerileri</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E82040] mt-1.5 shrink-0" />
                  <p className="text-white/60 text-xs leading-relaxed">
                    Pre-allocate 50 hotel rooms in London due to incoming storm
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E82040] mt-1.5 shrink-0" />
                  <p className="text-white/60 text-xs leading-relaxed">
                    Reroute flights over central Europe to avoid weather system.
                  </p>
                </div>
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
