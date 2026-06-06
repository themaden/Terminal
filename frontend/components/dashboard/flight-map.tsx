"use client"

import { useState, useEffect } from "react"
import {
  ComposableMap, Geographies, Geography,
  Graticule, Sphere, Marker, ZoomableGroup, useMapContext,
} from "react-simple-maps"
import { RotateCcw, Wifi } from "lucide-react"

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const AIRPORTS: Record<string, [number, number]> = {
  IST: [28.82, 40.98], LHR: [-0.45, 51.47], CDG: [2.55, 49.01],
  JFK: [-73.78, 40.64], FRA: [8.57, 50.03], AMS: [4.76, 52.31],
  DXB: [55.36, 25.25], BER: [13.40, 52.55], MAD: [-3.57, 40.47],
  FCO: [12.25, 41.80], SIN: [103.98, 1.36], NRT: [139.78, 35.55],
  LAX: [-118.4, 33.94], ORD: [-87.9, 41.97], GRU: [-46.47, -23.43],
  SYD: [151.18, -33.95], DEN: [-104.67, 39.86], YYZ: [-79.63, 43.68],
  MEX: [-99.07, 19.43], CAI: [31.41, 30.12], NBO: [36.92, -1.32],
  JNB: [28.24, -26.13], DEL: [77.10, 28.55], PEK: [116.59, 40.08],
  ICN: [126.45, 37.46], SVO: [37.41, 55.97], VIE: [16.57, 48.11],
  ZRH: [8.55, 47.45], BCN: [2.08, 41.30], LIS: [-9.13, 38.78],
  CPH: [12.65, 55.63], DOH: [51.61, 25.27], AUH: [54.65, 24.43],
  BKK: [100.75, 13.68], KUL: [101.71, 2.74], MXP: [8.72, 45.62],
}

const BG_AIRPORTS = [
  "FRA","AMS","MAD","FCO","SIN","NRT","LAX","ORD","GRU","SYD",
  "DEN","YYZ","MEX","CAI","NBO","JNB","DEL","PEK","ICN","SVO",
  "VIE","ZRH","BCN","LIS","CPH","DOH","AUH","BKK","KUL","MXP",
]

export interface FlightRoute {
  id: string
  from: [number, number]
  to:   [number, number]
  status: "active" | "delayed" | "cancelled"
  code: string
}

export interface FlightMarker {
  id: string
  coordinates: [number, number]
  code: string
  status: "active" | "delayed" | "cancelled" | "grounded"
}

interface FlightMapProps {
  routes:    FlightRoute[]
  markers:   FlightMarker[]
  hasCrisis?: boolean
}

// Flightradar colour scheme
const C = {
  active:    "#ff8c00",   // FR24 orange
  delayed:   "#facc15",   // yellow
  cancelled: "#ef4444",   // red
  hub:       "#E81932",   // THY red for IST
  ocean:     "#060d18",
  land:      "#111927",
  border:    "#1c2a3d",
  grid:      "#0e1e30",
}

function planeColor(status: string) {
  if (status === "cancelled") return C.cancelled
  if (status === "delayed")   return C.delayed
  return C.active
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function greatCirclePoint(from: [number, number], to: [number, number], t: number): [number, number] {
  const rad = (d: number) => d * Math.PI / 180
  const deg = (r: number) => r * 180 / Math.PI
  const [lat1, lon1, lat2, lon2] = [rad(from[1]), rad(from[0]), rad(to[1]), rad(to[0])]
  const d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon2 - lon1) / 2), 2)
  ))
  if (d < 0.0001) return [lerp(from[0], to[0], t), lerp(from[1], to[1], t)]
  const A = Math.sin((1 - t) * d) / Math.sin(d)
  const B = Math.sin(t * d) / Math.sin(d)
  const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2)
  const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2)
  const z = A * Math.sin(lat1) + B * Math.sin(lat2)
  return [deg(Math.atan2(y, x)), deg(Math.atan2(z, Math.sqrt(x * x + y * y)))]
}

function planeAngle(from: [number, number], to: [number, number]): number {
  const dx = to[0] - from[0]; const dy = -(to[1] - from[1])
  return Math.atan2(dy, dx) * (180 / Math.PI) - 90
}

// ── FR24-style compact aircraft silhouette ────────────────────────────────────
// Total bounding box ≈ 16×16px — identical in feel to the FR24 plane icons
function PlaneShape({ color }: { color: string }) {
  return (
    <>
      {/* Fuselage */}
      <path
        d="M0,-7 C0.5,-5.5 0.7,-2 0.7,1.5 L0,3 L-0.7,1.5 C-0.7,-2 -0.5,-5.5 0,-7Z"
        fill={color}
      />
      {/* Main wings — swept back */}
      <path
        d="M0.3,0 L7.5,4.5 L7,5.8 L0.3,2.5 L-0.3,2.5 L-7,5.8 L-7.5,4.5 L-0.3,0Z"
        fill={color}
      />
      {/* Tail */}
      <path
        d="M0.4,2.5 L4,7 L3.6,7.8 L0,5.5 L-3.6,7.8 L-4,7 L-0.4,2.5Z"
        fill={color} opacity={0.85}
      />
    </>
  )
}

// ── Animated aircraft ─────────────────────────────────────────────────────────
function AnimatedPlane({ route, speed = 0.00012, offsetSeed = 0 }: {
  route: FlightRoute; speed?: number; offsetSeed?: number
}) {
  // Spread planes evenly across their routes using a deterministic seed
  const [progress, setProgress] = useState(() => (offsetSeed * 0.37 + 0.1) % 0.9)
  const [hovered,  setHovered]  = useState(false)

  useEffect(() => {
    const id = setInterval(() => setProgress(p => { const n = p + speed; return n >= 1 ? 0.02 : n }), 50)
    return () => clearInterval(id)
  }, [speed])

  const pos   = greatCirclePoint(route.from, route.to, progress)
  const prevP = greatCirclePoint(route.from, route.to, Math.max(0.001, progress - 0.015))
  const nextP = greatCirclePoint(route.from, route.to, Math.min(0.999, progress + 0.015))
  const angle = planeAngle(prevP, nextP)
  const color = planeColor(route.status)
  const pct   = Math.round(progress * 100)

  return (
    <Marker coordinates={pos}>
      {/* Hit area — invisible, larger than icon for easy hover */}
      <circle r={14} fill="transparent" style={{ cursor: "pointer" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)} />

      {/* Selection ring — only on hover */}
      {hovered && <circle r={12} fill={color} opacity={0.12} stroke={color} strokeWidth={0.8} strokeOpacity={0.5} />}

      {/* Plane icon — rotated to heading */}
      <g transform={`rotate(${angle})`} style={{ pointerEvents: "none" }}>
        <PlaneShape color={color} />
      </g>

      {/* FR24-style popup card — only on hover, offset to avoid overlap */}
      {hovered && (
        <g transform="translate(16, -32)" style={{ pointerEvents: "none" }}>
          {/* Card */}
          <rect x={0} y={0} width={88} height={46} rx={3}
            fill="rgba(4,9,20,0.96)" stroke={color} strokeWidth={0.8} />
          {/* Top colour strip */}
          <rect x={0} y={0} width={88} height={3} rx={1.5} fill={color} opacity={0.7} />
          {/* Callsign */}
          <text x={7} y={15} fill="white" fontSize={9} fontWeight="800"
            fontFamily="'Geist Mono','Courier New',monospace" letterSpacing={0.8}>
            {route.code}
          </text>
          {/* Status */}
          <rect x={7} y={20} width={route.status === "active" ? 42 : route.status === "delayed" ? 46 : 50}
            height={9} rx={2} fill={color} opacity={0.18} />
          <text x={10} y={28} fill={color} fontSize={6.5}
            fontFamily="'Geist Mono','Courier New',monospace" fontWeight="700" letterSpacing={0.5}>
            {route.status === "active" ? "EN ROUTE" : route.status === "delayed" ? "GECİKMELİ" : "İPTAL"}
          </text>
          {/* Progress bar bg */}
          <rect x={7} y={35} width={74} height={3} rx={1.5} fill="rgba(255,255,255,0.08)" />
          {/* Progress bar fill */}
          <rect x={7} y={35} width={Math.round(74 * progress)} height={3} rx={1.5} fill={color} opacity={0.7} />
          {/* Pct label */}
          <text x={81} y={38} fill={color} fontSize={5.5}
            fontFamily="monospace" textAnchor="end" opacity={0.8}>{pct}%</text>
        </g>
      )}
    </Marker>
  )
}

// ── Route arc ─────────────────────────────────────────────────────────────────
function RouteLine({ route, projection }: {
  route: FlightRoute
  projection: (c: [number, number]) => [number, number] | null
}) {
  const color = planeColor(route.status)
  const pts   = Array.from({ length: 80 }, (_, i) => greatCirclePoint(route.from, route.to, i / 79))
  const proj  = pts.map(p => projection(p)).filter((p): p is [number, number] => p !== null)
  if (proj.length < 2) return null
  const d = proj.reduce((acc, [x, y], i) => i === 0 ? `M${x},${y}` : `${acc}L${x},${y}`, "")

  return (
    <g style={{ pointerEvents: "none" }}>
      {/* Outer glow */}
      <path d={d} fill="none" stroke={color} strokeWidth={5} strokeOpacity={0.04} />
      {/* Mid glow */}
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeOpacity={0.10} />
      {/* Main line */}
      <path d={d} fill="none" stroke={color} strokeWidth={1.2}
        strokeOpacity={route.status === "cancelled" ? 0.35 : 0.55}
        strokeDasharray={route.status === "cancelled" ? "5 4" : route.status === "delayed" ? "8 3" : "none"}
        strokeLinecap="round" />
    </g>
  )
}

// ── IST hub ───────────────────────────────────────────────────────────────────
function ISTHub({ coords }: { coords: [number, number] }) {
  return (
    <Marker coordinates={coords}>
      <g>
        <circle r={30} fill={C.hub} opacity={0.02} className="animate-ping" style={{ animationDuration: "4s" }} />
        <circle r={20} fill={C.hub} opacity={0.04} className="animate-ping" style={{ animationDuration: "3s", animationDelay: "0.8s" }} />
        <circle r={12} fill="none" stroke={C.hub} strokeWidth={0.6} strokeOpacity={0.4} />
        <circle r={5}  fill={C.hub} opacity={0.5} />
        <circle r={3}  fill={C.hub} />
        <circle r={1.2} fill="white" opacity={0.95} />
        {/* Crosshair */}
        {([[0,-18,0,-13],[0,13,0,18],[-18,0,-13,0],[13,0,18,0]] as number[][]).map(([x1,y1,x2,y2],i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={C.hub} strokeWidth={0.5} strokeOpacity={0.4} />
        ))}
        {/* Label */}
        <rect x={-14} y={-28} width={28} height={11} rx={2}
          fill="rgba(6,13,24,0.9)" stroke={C.hub} strokeWidth={0.5} strokeOpacity={0.55} />
        <text x={0} y={-20} textAnchor="middle" fill={C.hub} fontSize={7.5}
          fontWeight="800" fontFamily="monospace" letterSpacing={1.5} opacity={0.95}>IST</text>
      </g>
    </Marker>
  )
}

// ── Airport dot (FR24 style: white dot + IATA label) ─────────────────────────
function AirportDot({ code, coords, active }: { code: string; coords: [number, number]; active: boolean }) {
  if (code === "IST") return null
  if (!active) {
    return (
      <Marker coordinates={coords}>
        <circle r={1.4} fill="#2a3a50" opacity={0.7} />
      </Marker>
    )
  }
  return (
    <Marker coordinates={coords}>
      <g>
        <circle r={10} fill="white" opacity={0.04} />
        <circle r={4}  fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={0.5} />
        <circle r={2.5} fill="white" opacity={0.75} />
        <circle r={1.2} fill="white" />
        {/* IATA code tag */}
        <rect x={-13} y={-19} width={26} height={11} rx={2}
          fill="rgba(6,13,24,0.85)" stroke="rgba(255,255,255,0.18)" strokeWidth={0.4} />
        <text x={0} y={-11} textAnchor="middle" fill="rgba(255,255,255,0.7)"
          fontSize={6.5} fontWeight="600" fontFamily="monospace" letterSpacing={0.5}>
          {code}
        </text>
      </g>
    </Marker>
  )
}

// ── Map content ───────────────────────────────────────────────────────────────
function MapContent({ routes, markers, hasCrisis }: FlightMapProps) {
  const { projection } = useMapContext()
  const project = (coord: [number, number]): [number, number] | null => {
    try { const p = projection(coord); return p ? [p[0] ?? 0, p[1] ?? 0] : null }
    catch { return null }
  }

  const activeAirports = new Set<string>(["IST"])
  routes.forEach(r => {
    Object.entries(AIRPORTS).forEach(([code, coords]) => {
      if (Math.abs(coords[0] - r.to[0]) < 1.5 && Math.abs(coords[1] - r.to[1]) < 1.5)
        activeAirports.add(code)
    })
  })

  return (
    <>
      <Sphere id="ocean" fill={C.ocean} stroke="none" strokeWidth={0} />
      <Graticule stroke={C.grid} strokeWidth={0.3} strokeOpacity={0.6} />
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map(geo => (
            <Geography key={geo.rsmKey} geography={geo}
              fill={hasCrisis ? "#131f2f" : C.land}
              stroke={C.border}
              strokeWidth={0.3}
              style={{
                default: { outline: "none" },
                hover:   { outline: "none", fill: "#182334" },
                pressed: { outline: "none" },
              }}
            />
          ))
        }
      </Geographies>
      <Sphere id="border" fill="none" stroke="#0e1e30" strokeWidth={0.6} />

      {/* Background airport dots */}
      {BG_AIRPORTS.map(code => AIRPORTS[code] && (
        <AirportDot key={`bg-${code}`} code={code} coords={AIRPORTS[code]} active={false} />
      ))}

      {/* Route arcs (behind planes) */}
      {routes.map(r => <RouteLine key={r.id} route={r} projection={project} />)}

      {/* Active destination airports */}
      {Object.entries(AIRPORTS).map(([code, coords]) => (
        <AirportDot key={code} code={code} coords={coords} active={activeAirports.has(code)} />
      ))}

      {/* IST hub always on top of airports */}
      <ISTHub coords={AIRPORTS.IST} />

      {/* Animated aircraft */}
      {routes.filter(r => r.status !== "cancelled").map((r, i) => (
        <AnimatedPlane key={r.id} route={r} offsetSeed={i} speed={r.status === "delayed" ? 0.00008 : 0.00013} />
      ))}

      {/* Grounded markers */}
      {markers.filter(m => m.status === "grounded").map(m => (
        <Marker key={m.id} coordinates={m.coordinates}>
          <circle r={4} fill={C.cancelled} opacity={0.25} />
          <circle r={2} fill={C.cancelled} />
        </Marker>
      ))}
    </>
  )
}

// ── Live clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState("")
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  return <span className="text-[9px] text-white/35 font-mono tabular-nums tracking-widest">{time} UTC+3</span>
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────
export function FlightMap({ routes, markers, hasCrisis = false }: FlightMapProps) {
  const [zoom,   setZoom]   = useState(1)
  const [center, setCenter] = useState<[number, number]>([15, 25])

  const activeCount    = routes.filter(r => r.status === "active").length
  const delayedCount   = routes.filter(r => r.status === "delayed").length
  const cancelledCount = routes.filter(r => r.status === "cancelled").length

  return (
    <div className={`relative h-full overflow-hidden transition-all duration-500 ${
      hasCrisis
        ? "ring-1 ring-[#ef4444]/40 shadow-lg shadow-[#ef4444]/10"
        : "ring-1 ring-white/5"
    }`} style={{ background: C.ocean, borderRadius: "10px" }}>

      <style>{`
        @keyframes fr24Scan {
          0%   { transform: translateY(-2px); opacity: 0; }
          8%   { opacity: 0.6; }
          92%  { opacity: 0.25; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        .fr24-scanline { animation: fr24Scan 14s linear infinite; pointer-events: none; }
      `}</style>

      {/* Scanline */}
      <div className="fr24-scanline absolute left-0 right-0 h-px z-10"
        style={{ background: `linear-gradient(to right, transparent, ${hasCrisis ? C.cancelled : C.active}60 50%, transparent)` }} />

      {/* Vignette */}
      <div className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 92% 88% at 50% 50%, transparent 50%, rgba(3,7,15,0.7) 100%)" }} />

      {/* ── Top bar (FR24 style) ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2"
        style={{ background: "linear-gradient(to bottom, rgba(3,7,15,0.85) 0%, transparent 100%)" }}>

        {/* Left: status badges */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold tracking-[0.12em] border ${
            hasCrisis
              ? "bg-[#ef4444]/15 border-[#ef4444]/30 text-[#ef4444]"
              : "bg-[#ff8c00]/10 border-[#ff8c00]/25 text-[#ff8c00]"
          }`}>
            <Wifi className="w-2.5 h-2.5" />
            {hasCrisis ? "KRİZ MODU" : "LIVE"}
          </div>

          {activeCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/40 border border-white/8 text-[9px] font-semibold text-white/55">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff8c00]" />
              {activeCount} uçuşta
            </div>
          )}
          {delayedCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/40 border border-white/8 text-[9px] font-semibold text-[#facc15]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]" />
              {delayedCount} gecikmeli
            </div>
          )}
          {cancelledCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#ef4444]/10 border border-[#ef4444]/25 text-[9px] font-semibold text-[#ef4444] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
              {cancelledCount} iptal
            </div>
          )}
        </div>

        {/* Right: legend + clock */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            {[["#ff8c00","Aktif"],["#facc15","Gecikmeli"],["#ef4444","İptal"]] .map(([col, lbl]) => (
              <div key={lbl} className="flex items-center gap-1">
                <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: col }} />
                <span className="text-[8px] text-white/30 font-mono">{lbl}</span>
              </div>
            ))}
          </div>
          <LiveClock />
        </div>
      </div>

      {/* ── Zoom controls (FR24 right-side style) ── */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-0.5">
        {[
          { onClick: () => setZoom(z => Math.min(+(z + 0.5).toFixed(1), 8)), label: "+" },
          { onClick: () => setZoom(z => Math.max(+(z - 0.5).toFixed(1), 0.8)), label: "−" },
        ].map(({ onClick, label }, i) => (
          <button key={i} onClick={onClick}
            className="w-6 h-6 bg-black/60 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-black/80 hover:border-white/20 transition-all text-sm font-bold leading-none"
            style={{ borderRadius: i === 0 ? "4px 4px 0 0" : "0 0 4px 4px" }}>
            {label}
          </button>
        ))}
        <button onClick={() => { setZoom(1); setCenter([15, 25]) }}
          className="w-6 h-6 mt-1 bg-black/60 border border-white/10 rounded flex items-center justify-center hover:bg-black/80 hover:border-white/20 transition-all">
          <RotateCcw className="w-3 h-3 text-white/35 hover:text-white/70" />
        </button>
        <span className="text-[7px] text-white/20 font-mono text-center mt-1 tabular-nums">{zoom.toFixed(1)}x</span>
      </div>

      {/* ── Map ── */}
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 175 }}
        className="w-full h-full"
        style={{ backgroundColor: "transparent" }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          minZoom={0.8}
          maxZoom={8}
          onMoveEnd={({ coordinates, zoom: z }) => { setCenter(coordinates); setZoom(z) }}
        >
          <MapContent routes={routes} markers={markers} hasCrisis={hasCrisis} />
        </ZoomableGroup>
      </ComposableMap>

      {/* ── Bottom status bar ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5"
        style={{ background: "linear-gradient(to top, rgba(3,7,15,0.9) 0%, transparent 100%)" }}>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">IST HUB</span>
          <span className="text-[7px] text-white/10 font-mono">│</span>
          <span className="text-[9px] text-white/25 font-mono">{routes.length} rota izleniyor</span>
          <span className="text-[7px] text-white/10 font-mono">│</span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[9px] text-[#22c55e]/60 font-mono">SİSTEM NORMAL</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Colour key dots */}
          <span className="w-2 h-2 rounded-full bg-[#ff8c00]" title="Aktif" />
          <span className="w-2 h-2 rounded-full bg-[#facc15]" title="Gecikmeli" />
          <span className="w-2 h-2 rounded-full bg-[#ef4444]" title="İptal" />
        </div>
      </div>
    </div>
  )
}
