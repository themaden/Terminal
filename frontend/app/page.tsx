"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Activity } from "lucide-react"
import dynamic from "next/dynamic"
import { Sidebar } from "@/components/dashboard/sidebar"

// Three.js / WebGL — SSR devre dışı
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false })

// ─────────────────────────────────────────────
//  Havalimanı koordinatları  [lng, lat]
// ─────────────────────────────────────────────
const IST_COORDS: [number, number] = [28.82, 40.98]

const AIRPORTS: Record<string, [number, number]> = {
  IST: IST_COORDS,
  // Avrupa
  LHR: [-0.45, 51.47], CDG: [2.55, 49.01],  FRA: [8.57, 50.03],
  AMS: [4.76, 52.31],  BER: [13.40, 52.55], MAD: [-3.57, 40.47],
  FCO: [12.25, 41.80], VIE: [16.57, 48.11], ZRH: [8.55, 47.46],
  BCN: [2.07, 41.30],  ATH: [23.94, 37.94], MUC: [11.79, 48.35],
  LIS: [-9.14, 38.77], CPH: [12.65, 55.62], ARN: [17.93, 59.65],
  // BDT
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
type PointStatus = RouteStatus | "hub"

const ROUTE_STATUS: Record<string, RouteStatus> = {
  LHR: "disrupted", CDG: "warning", FRA: "warning", AMS: "normal",
  BER: "disrupted", MAD: "normal",  FCO: "normal",  VIE: "normal",
  ZRH: "normal",    BCN: "normal",  ATH: "normal",  MUC: "normal",
  LIS: "normal",    CPH: "normal",  ARN: "normal",  SVO: "warning",
  JFK: "normal",    LAX: "normal",  ORD: "normal",  MIA: "normal",
  GRU: "normal",    EZE: "normal",
  DXB: "normal",    DOH: "normal",  CAI: "normal",  ADD: "normal",
  JNB: "normal",    CMN: "normal",
  DEL: "normal",    BOM: "normal",  SIN: "normal",  BKK: "normal",
  KUL: "normal",    CGK: "normal",  NRT: "normal",  PEK: "normal",
  PVG: "normal",    SYD: "normal",
}

// ─────────────────────────────────────────────
//  Globe.gl veri nesneleri
// ─────────────────────────────────────────────
type ArcDatum = {
  code: string
  startLat: number; startLng: number
  endLat: number;   endLng: number
  status: RouteStatus
  initialGap: number   // sabit rassal ofseti (yeniden render'da değişmez)
}

type PointDatum = {
  code: string
  lat: number; lng: number
  status: PointStatus
}

const ARCS: ArcDatum[] = Object.entries(ROUTE_STATUS).flatMap(([code, status]) => {
  const d = AIRPORTS[code]
  if (!d) return []
  return [{
    code,
    startLat: IST_COORDS[1], startLng: IST_COORDS[0],
    endLat:   d[1],           endLng:   d[0],
    status,
    initialGap: Math.random(),
  }]
})

const POINTS: PointDatum[] = Object.entries(AIRPORTS).map(([code, [lng, lat]]) => ({
  code, lat, lng,
  status: code === "IST" ? "hub" : (ROUTE_STATUS[code] ?? "normal"),
}))

const IST_RINGS = [{ lat: IST_COORDS[1], lng: IST_COORDS[0] }]

// ─────────────────────────────────────────────
//  Globe.gl accessor fonksiyonlar
// ─────────────────────────────────────────────
const arcColor = (d: object): string[] => {
  const { status } = d as ArcDatum
  if (status === "disrupted") return ["rgba(232,32,64,0)", "rgba(232,32,64,0.95)", "rgba(232,32,64,0)"]
  if (status === "warning")   return ["rgba(245,158,11,0)", "rgba(245,158,11,0.88)", "rgba(245,158,11,0)"]
  return ["rgba(100,150,230,0)", "rgba(100,150,230,0.28)", "rgba(100,150,230,0)"]
}

const arcAnimTime = (d: object): number => {
  const { status } = d as ArcDatum
  return status === "disrupted" ? 1050 : status === "warning" ? 1700 : 4200
}

const arcWidth = (d: object): number => {
  const { status } = d as ArcDatum
  return status === "disrupted" ? 0.70 : status === "warning" ? 0.50 : 0.22
}

const pointColor = (d: object): string => {
  const { status } = d as PointDatum
  if (status === "hub")       return "#C8102E"
  if (status === "disrupted") return "#E82040"
  if (status === "warning")   return "#f59e0b"
  return "rgba(170,195,255,0.50)"
}

const pointRadius = (d: object): number => {
  const { status } = d as PointDatum
  if (status === "hub")       return 0.55
  if (status === "disrupted") return 0.33
  if (status === "warning")   return 0.25
  return 0.11
}

const pointAlt = (d: object): number => {
  const { status } = d as PointDatum
  if (status === "hub")       return 0.035
  if (status !== "normal")    return 0.014
  return 0.004
}

const labelText  = (d: object) => (d as PointDatum).code
const labelColor = (d: object): string => {
  const { status } = d as PointDatum
  if (status === "hub")       return "#ffffff"
  if (status === "disrupted") return "#E82040"
  if (status === "warning")   return "#f59e0b"
  return "rgba(200,220,255,0.7)"
}
const labelSize = (d: object): number => {
  const { status } = d as PointDatum
  return status === "hub" ? 0.75 : 0.52
}
const labelAlt = (d: object): number => {
  const { status } = d as PointDatum
  return status === "hub" ? 0.055 : 0.022
}

// ─────────────────────────────────────────────
//  Gauge
// ─────────────────────────────────────────────
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
      <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} strokeLinecap="round" />
      <path d={valPath} fill="none" stroke="#E82040" strokeWidth={10} strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 8px rgba(232,32,64,0.85))" }} />
      <text x="80" y="82" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="system-ui">{value}%</text>
      <text x="80" y="98" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="system-ui">RİSK ENDEKSİ</text>
    </svg>
  )
}

function LiveBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: "rgba(232,32,64,0.15)", border: "1px solid rgba(232,32,64,0.3)" }}>
      <span className="w-2 h-2 rounded-full bg-[#E82040] animate-pulse" />
      <span className="text-[#E82040] text-xs font-bold tracking-widest">Canlı</span>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Dashboard stats
// ─────────────────────────────────────────────
interface DashboardStats {
  riskIndex: number
  europeLevel: "Kritik" | "Orta" | "Normal"
  asiaLevel:   "Kritik" | "Orta" | "Normal"
  naLevel:     "Kritik" | "Orta" | "Normal"
  tips: string[]
}

const FALLBACK: DashboardStats = {
  riskIndex: 75, europeLevel: "Kritik", asiaLevel: "Orta", naLevel: "Normal",
  tips: [
    "Londra için 50 otel odası ön tahsis yap — fırtına uyarısı aktif",
    "Orta Avrupa hava sistemini aşmak için rota değiştir",
    "Berlin'den 3 uçuş için yedek ekip hazırla",
  ],
}

const DELAY_COLOR: Record<string, string> = { Kritik: "#E82040", Orta: "#f59e0b", Normal: "#10b981" }

const DISRUPTED_N = Object.values(ROUTE_STATUS).filter(s => s === "disrupted").length
const WARNING_N   = Object.values(ROUTE_STATUS).filter(s => s === "warning").length
const TOTAL_N     = Object.keys(ROUTE_STATUS).length

// Etiket: IST + disrupted + warning havalimanları
const LABEL_POINTS = POINTS.filter(p => p.status === "hub" || p.status === "disrupted" || p.status === "warning")

// ─────────────────────────────────────────────
//  Ana bileşen
// ─────────────────────────────────────────────
export default function MainDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef   = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims]   = useState({ w: 0, h: 0 })
  const [stats, setStats] = useState<DashboardStats>(FALLBACK)

  // Konteyner boyutunu ölç
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setDims({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight })
      }
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  // Globe hazır olduğunda: kamera + oto-döndür
  const onGlobeReady = () => {
    if (!globeRef.current) return
    globeRef.current.pointOfView({ lat: 30, lng: 28, altitude: 2.0 }, 1500)
    const ctrl = globeRef.current.controls()
    if (ctrl) {
      ctrl.autoRotate      = true
      ctrl.autoRotateSpeed = 0.10
      ctrl.enableZoom      = true
      ctrl.minDistance     = 220
      ctrl.maxDistance     = 750
      ctrl.enableDamping   = true
      ctrl.dampingFactor   = 0.08
    }
  }

  // Backend stats
  useEffect(() => {
    const url   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const token = typeof window !== "undefined" ? localStorage.getItem("jetnexus_token") || "" : ""
    fetch(`${url}/api/v1/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.risk_index !== undefined)
          setStats(p => ({
            ...p,
            riskIndex:   d.risk_index         ?? p.riskIndex,
            europeLevel: d.europe_delay_level  ?? p.europeLevel,
            asiaLevel:   d.asia_delay_level    ?? p.asiaLevel,
            naLevel:     d.na_delay_level      ?? p.naLevel,
            tips:        d.ai_tips?.length ? d.ai_tips : p.tips,
          }))
      })
      .catch(() => {})
  }, [])

  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.15) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Üst Bar ── */}
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

        {/* ── İçerik ── */}
        <div className="flex-1 flex gap-4 px-6 pb-5 overflow-hidden">

          {/* ══ 3D DÜNYA KÜRESİ ══ */}
          <div ref={containerRef} className="flex-1 rounded-2xl overflow-hidden relative"
            style={{ background: "#020407", border: "1px solid rgba(100,130,220,0.13)" }}>

            {dims.w > 0 && (
              <Globe
                ref={globeRef}
                width={dims.w}
                height={dims.h}
                onGlobeReady={onGlobeReady}
                backgroundColor="rgba(0,0,0,0)"

                /* ── Küre görünümü ── */
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                atmosphereColor="#1a3f98"
                atmosphereAltitude={0.20}

                /* ── Uçuş arkleri (hareketli "uçak izleri") ── */
                arcsData={ARCS}
                arcStartLat="startLat"
                arcStartLng="startLng"
                arcEndLat="endLat"
                arcEndLng="endLng"
                arcColor={arcColor}
                arcDashLength={0.04}
                arcDashGap={0.96}
                arcDashAnimateTime={arcAnimTime}
                arcDashInitialGap="initialGap"
                arcStroke={arcWidth}
                arcAltitudeAutoScale={0.40}

                /* ── Havalimanı noktaları ── */
                pointsData={POINTS}
                pointLat="lat"
                pointLng="lng"
                pointColor={pointColor}
                pointRadius={pointRadius}
                pointAltitude={pointAlt}
                pointsMerge={false}

                /* ── IST nabız halkaları ── */
                ringsData={IST_RINGS}
                ringLat="lat"
                ringLng="lng"
                ringColor={() => (t: number) => `rgba(200,16,46,${Math.sqrt(1 - t) * 0.85})`}
                ringMaxRadius={4.8}
                ringPropagationSpeed={2.4}
                ringRepeatPeriod={850}

                /* ── Havalimanı etiketleri (IST + disrupted + warning) ── */
                labelsData={LABEL_POINTS}
                labelLat="lat"
                labelLng="lng"
                labelText={labelText}
                labelColor={labelColor}
                labelSize={labelSize}
                labelAltitude={labelAlt}
                labelResolution={3}
                labelIncludeDot={false}
              />
            )}

            {/* Sol üst: ağ istatistikleri */}
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(2,4,10,0.82)", border: "1px solid rgba(100,130,200,0.14)", backdropFilter: "blur(10px)" }}>
                <Activity className="w-3 h-3 text-white/35" />
                <span className="text-white/45 text-[10px] font-semibold">{TOTAL_N} Güzergah</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(232,32,64,0.18)", border: "1px solid rgba(232,32,64,0.40)", backdropFilter: "blur(10px)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#E82040] animate-pulse" />
                <span className="text-[#E82040] text-[10px] font-bold">{DISRUPTED_N} Aksama</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(245,158,11,0.13)", border: "1px solid rgba(245,158,11,0.30)", backdropFilter: "blur(10px)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                <span className="text-[#f59e0b] text-[10px] font-bold">{WARNING_N} Gecikme</span>
              </div>
            </div>

            {/* Alt: legend */}
            <div className="absolute bottom-3 left-3 flex items-center gap-4 px-3.5 py-2 rounded-xl pointer-events-none"
              style={{ background: "rgba(2,4,10,0.84)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
              {[
                { color: "rgba(170,195,255,0.5)", label: "Normal Sefer"     },
                { color: "#f59e0b",               label: "Gecikme Uyarısı" },
                { color: "#E82040",               label: "Aksama / İptal"  },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                  <span className="text-white/40 text-[10px]">{l.label}</span>
                </div>
              ))}
            </div>

            {/* Sağ alt: kontrol ipucu */}
            <div className="absolute bottom-3 right-3 pointer-events-none">
              <p className="text-white/15 text-[9px]">Sürükle: döndür &nbsp;·&nbsp; Tekerlek: zoom</p>
            </div>
          </div>

          {/* ══ SAĞ PANEL ══ */}
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

            {/* Bölgesel gecikmeler */}
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

            {/* AI önerileri */}
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
