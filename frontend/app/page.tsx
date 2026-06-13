"use client"

import { useState, useEffect } from "react"
import { Search, Activity } from "lucide-react"
import { ComposableMap, Geographies, Geography, Graticule, Sphere, Marker, Line } from "react-simple-maps"
import { Sidebar } from "@/components/dashboard/sidebar"

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const AIRPORTS: Record<string, [number, number]> = {
  IST: [28.82, 40.98],
  // Avrupa
  LHR: [-0.45, 51.47], CDG: [2.55, 49.01],  FRA: [8.57, 50.03],
  AMS: [4.76, 52.31],  BER: [13.40, 52.55], MAD: [-3.57, 40.47],
  FCO: [12.25, 41.80], VIE: [16.57, 48.11], ZRH: [8.55, 47.46],
  BCN: [2.07, 41.30],  ATH: [23.94, 37.94], MUC: [11.79, 48.35],
  LIS: [-9.14, 38.77], CPH: [12.65, 55.62], ARN: [17.93, 59.65],
  // BDT / Doğu Avrupa
  SVO: [37.41, 55.97],
  // Amerika
  JFK: [-73.78, 40.64], LAX: [-118.4, 33.94], ORD: [-87.9, 41.97],
  MIA: [-80.29, 25.79], GRU: [-46.47, -23.43], EZE: [-58.53, -34.81],
  // Orta Doğu / Afrika
  DXB: [55.36, 25.25],  DOH: [51.61, 25.27], CAI: [31.41, 30.12],
  ADD: [38.80, 8.98],   JNB: [28.24, -26.13], CMN: [-7.58, 33.37],
  // Asya / Pasifik
  DEL: [77.10, 28.55], BOM: [72.87, 19.09], SIN: [103.98, 1.36],
  BKK: [100.75, 13.68],KUL: [101.70, 2.74], CGK: [106.66, -6.13],
  NRT: [139.78, 35.55],PEK: [116.59, 40.08],PVG: [121.80, 31.14],
  SYD: [151.18, -33.95],
}

type RouteStatus = "normal" | "warning" | "disrupted"

const ROUTE_STATUS: Record<string, RouteStatus> = {
  LHR: "disrupted", CDG: "warning",  FRA: "warning",  AMS: "normal",
  BER: "disrupted", MAD: "normal",   FCO: "normal",   VIE: "normal",
  ZRH: "normal",    BCN: "normal",   ATH: "normal",   MUC: "normal",
  LIS: "normal",    CPH: "normal",   ARN: "normal",   SVO: "warning",
  JFK: "normal",    LAX: "normal",   ORD: "normal",   MIA: "normal",
  GRU: "normal",    EZE: "normal",
  DXB: "normal",    DOH: "normal",   CAI: "normal",   ADD: "normal",
  JNB: "normal",    CMN: "normal",
  DEL: "normal",    BOM: "normal",   SIN: "normal",   BKK: "normal",
  KUL: "normal",    CGK: "normal",   NRT: "normal",   PEK: "normal",
  PVG: "normal",    SYD: "normal",
}

const DOT_COLOR: Record<RouteStatus, string> = {
  normal:    "rgba(180,200,255,0.45)",
  warning:   "#f59e0b",
  disrupted: "#E82040",
}

// ────────── Gauge ──────────
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
    <svg width="160" height="110" viewBox="0 0 160 110">
      <defs>
        <filter id="gaugeGlow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} strokeLinecap="round" />
      <path d={valPath} fill="none" stroke="#E82040" strokeWidth={10} strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 8px rgba(232,32,64,0.8))" }} />
      <text x="80" y="82" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="system-ui">{value}%</text>
      <text x="80" y="98" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="system-ui">RİSK ENDEKSİ</text>
    </svg>
  )
}

// ────────── LiveBadge ──────────
function LiveBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: "rgba(232,32,64,0.15)", border: "1px solid rgba(232,32,64,0.3)" }}>
      <span className="w-2 h-2 rounded-full bg-[#E82040] animate-pulse" />
      <span className="text-[#E82040] text-xs font-bold tracking-widest">Canlı</span>
    </div>
  )
}

// ────────── Stats interfaces ──────────
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

const DISRUPTED_COUNT = Object.values(ROUTE_STATUS).filter(s => s === "disrupted").length
const WARNING_COUNT   = Object.values(ROUTE_STATUS).filter(s => s === "warning").length
const TOTAL_ROUTES    = Object.keys(ROUTE_STATUS).length

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
      style={{ background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.15) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)" }}>
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

        {/* Content */}
        <div className="flex-1 flex gap-4 px-6 pb-5 overflow-hidden">

          {/* ══════════ MAP ══════════ */}
          <div className="flex-1 rounded-2xl overflow-hidden relative"
            style={{ background: "#020508", border: "1px solid rgba(100,130,200,0.12)" }}>

            <ComposableMap
              projection="geoNaturalEarth1"
              style={{ width: "100%", height: "100%" }}
              projectionConfig={{ scale: 172, center: [18, 15] }}
            >
              <defs>
                {/* Ocean gradient */}
                <radialGradient id="oceanGrad" cx="35%" cy="40%" r="70%">
                  <stop offset="0%"   stopColor="#060c1c" />
                  <stop offset="100%" stopColor="#020508" />
                </radialGradient>
                {/* Glow filters */}
                <filter id="redGlow"  x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="3.5" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="warnGlow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="2.5" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="hubGlow"  x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="5" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              <Sphere id="sphere" fill="url(#oceanGrad)" stroke="rgba(80,120,200,0.06)" strokeWidth={0.6} />
              <Graticule stroke="rgba(80,110,180,0.04)" strokeWidth={0.5} />

              <Geographies geography={GEO_URL}>
                {({ geographies }) => geographies.map(geo => (
                  <Geography key={geo.rsmKey} geography={geo}
                    fill="#0d1628" stroke="#060e1c" strokeWidth={0.6}
                    style={{
                      default: { outline: "none" },
                      hover:   { fill: "#162040", outline: "none" },
                      pressed: { outline: "none" },
                    }} />
                ))}
              </Geographies>

              {/* ── Normal routes (drawn first / bottom layer) ── */}
              {Object.entries(ROUTE_STATUS)
                .filter(([, s]) => s === "normal")
                .map(([code]) => {
                  const dest = AIRPORTS[code]
                  if (!dest) return null
                  return (
                    <Line key={`n-${code}`} from={AIRPORTS.IST} to={dest}
                      stroke="rgba(120,150,220,0.15)" strokeWidth={0.7} strokeLinecap="round" />
                  )
                })}

              {/* ── Warning routes ── */}
              {Object.entries(ROUTE_STATUS)
                .filter(([, s]) => s === "warning")
                .map(([code]) => {
                  const dest = AIRPORTS[code]
                  if (!dest) return null
                  return (
                    <Line key={`w-${code}`} from={AIRPORTS.IST} to={dest}
                      stroke="rgba(245,158,11,0.60)" strokeWidth={1.4} strokeLinecap="round" />
                  )
                })}

              {/* ── Disrupted routes (top layer, thickest) ── */}
              {Object.entries(ROUTE_STATUS)
                .filter(([, s]) => s === "disrupted")
                .map(([code]) => {
                  const dest = AIRPORTS[code]
                  if (!dest) return null
                  return (
                    <Line key={`d-${code}`} from={AIRPORTS.IST} to={dest}
                      stroke="rgba(232,32,64,0.85)" strokeWidth={2.0} strokeLinecap="round" />
                  )
                })}

              {/* ── Destination airport markers ── */}
              {Object.entries(AIRPORTS).map(([code, coords]) => {
                if (code === "IST") return null
                const status = ROUTE_STATUS[code] ?? "normal"
                const color  = DOT_COLOR[status]
                const dotR   = status === "disrupted" ? 4.5 : status === "warning" ? 3.5 : 2.0

                return (
                  <Marker key={code} coordinates={coords}>
                    <g>
                      {/* Animated ring — disrupted */}
                      {status === "disrupted" && (
                        <circle r={0} fill="none" stroke="#E82040" strokeWidth={1.5} opacity={0}>
                          <animate attributeName="r"       from={dotR.toString()} to={(dotR * 5.5).toString()} dur="1.8s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.75" to="0" dur="1.8s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {/* Animated ring — warning */}
                      {status === "warning" && (
                        <circle r={0} fill="none" stroke="#f59e0b" strokeWidth={1} opacity={0}>
                          <animate attributeName="r"       from={dotR.toString()} to={(dotR * 4.5).toString()} dur="2.6s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.55" to="0" dur="2.6s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {/* Core dot */}
                      <circle r={dotR} fill={color}
                        filter={status === "disrupted" ? "url(#redGlow)" : status === "warning" ? "url(#warnGlow)" : undefined}
                        style={status !== "normal" ? { filter: `drop-shadow(0 0 ${dotR + 2}px ${color})` } : {}}
                      />
                      {/* Airport code label */}
                      {status !== "normal" && (
                        <text y={-(dotR + 4.5)} textAnchor="middle"
                          fill={color} fontSize={6} fontWeight="bold" fontFamily="system-ui">
                          {code}
                        </text>
                      )}
                    </g>
                  </Marker>
                )
              })}

              {/* ══ IST HUB — animated pulse ══ */}
              <Marker coordinates={AIRPORTS.IST}>
                <g>
                  {/* Wave 1 */}
                  <circle r={0} fill="none" stroke="rgba(232,32,64,0.60)" strokeWidth={1.8}>
                    <animate attributeName="r"       from="9" to="52" dur="2.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.70" to="0" dur="2.6s" repeatCount="indefinite" />
                  </circle>
                  {/* Wave 2 */}
                  <circle r={0} fill="none" stroke="rgba(232,32,64,0.40)" strokeWidth={1.2}>
                    <animate attributeName="r"       from="9" to="52" dur="2.6s" begin="0.87s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.55" to="0" dur="2.6s" begin="0.87s" repeatCount="indefinite" />
                  </circle>
                  {/* Wave 3 */}
                  <circle r={0} fill="none" stroke="rgba(232,32,64,0.22)" strokeWidth={0.8}>
                    <animate attributeName="r"       from="9" to="52" dur="2.6s" begin="1.74s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.40" to="0" dur="2.6s" begin="1.74s" repeatCount="indefinite" />
                  </circle>

                  {/* Static glow halos */}
                  <circle r={26} fill="rgba(200,16,46,0.05)" />
                  <circle r={16} fill="rgba(200,16,46,0.10)" />
                  <circle r={9}  fill="rgba(200,16,46,0.20)" />

                  {/* Core */}
                  <circle r={5.5} fill="#C8102E" filter="url(#hubGlow)"
                    style={{ filter: "drop-shadow(0 0 12px rgba(200,16,46,0.95))" }} />
                  <circle r={2.5} fill="white" style={{ filter: "drop-shadow(0 0 3px white)" }} />

                  {/* Labels */}
                  <text y={-30} textAnchor="middle" fill="white"
                    fontSize={9.5} fontWeight="bold" fontFamily="system-ui" letterSpacing={1.5}>
                    İSTANBUL
                  </text>
                  <text y={-18} textAnchor="middle" fill="rgba(232,32,64,0.85)"
                    fontSize={7.5} fontWeight="bold" fontFamily="system-ui" letterSpacing={2.5}>
                    IST HUB
                  </text>
                </g>
              </Marker>
            </ComposableMap>

            {/* ── Top-left overlay: network stats ── */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(6,10,24,0.80)", border: "1px solid rgba(100,130,200,0.12)", backdropFilter: "blur(8px)" }}>
                <Activity className="w-3 h-3 text-white/35" />
                <span className="text-white/45 text-[10px] font-semibold">{TOTAL_ROUTES} Güzergah</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(232,32,64,0.15)", border: "1px solid rgba(232,32,64,0.35)", backdropFilter: "blur(8px)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#E82040] animate-pulse" />
                <span className="text-[#E82040] text-[10px] font-bold">{DISRUPTED_COUNT} Aksama</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)", backdropFilter: "blur(8px)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                <span className="text-[#f59e0b] text-[10px] font-bold">{WARNING_COUNT} Gecikme</span>
              </div>
            </div>

            {/* ── Bottom legend ── */}
            <div className="absolute bottom-3 left-3 flex items-center gap-4 px-3.5 py-2 rounded-xl"
              style={{ background: "rgba(2,5,12,0.80)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(10px)" }}>
              {[
                { color: "rgba(180,200,255,0.45)", label: "Normal Sefer"      },
                { color: "#f59e0b",                label: "Gecikme Uyarısı"  },
                { color: "#E82040",                label: "Aksama / İptal"   },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
                  <span className="text-white/40 text-[10px]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══════════ RIGHT PANEL ══════════ */}
          <div className="w-[280px] shrink-0 flex flex-col gap-3">

            {/* AI Risk Gauge */}
            <div className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm mb-1">Yapay Zeka Kriz Tahmincisi</h3>
              <p className="text-white/30 text-[10px] mb-2">Son güncelleme: 2 dk önce</p>
              <div className="flex justify-center">
                <Gauge value={stats.riskIndex} />
              </div>
            </div>

            {/* Delay by region */}
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
                        <span className="text-white/35 text-xs">{r.delay}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* AI Tips */}
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
