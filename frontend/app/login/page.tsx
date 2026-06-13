"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ComposableMap, Geographies, Geography, Graticule, Sphere, Marker } from "react-simple-maps"

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const ROUTES = [
  { from: [28.82, 40.98], to: [-0.45, 51.47] },
  { from: [28.82, 40.98], to: [-73.78, 40.64] },
  { from: [28.82, 40.98], to: [55.36, 25.25] },
  { from: [28.82, 40.98], to: [77.10, 28.55] },
  { from: [28.82, 40.98], to: [103.98, 1.36] },
  { from: [28.82, 40.98], to: [37.41, 55.97] },
  { from: [28.82, 40.98], to: [-118.4, 33.94] },
  { from: [28.82, 40.98], to: [116.59, 40.08] },
  { from: [28.82, 40.98], to: [8.57, 50.03] },
  { from: [28.82, 40.98], to: [2.55, 49.01] },
]

const AIRPORTS = [
  [28.82, 40.98], [-0.45, 51.47], [-73.78, 40.64], [55.36, 25.25],
  [77.10, 28.55], [103.98, 1.36], [37.41, 55.97], [-118.4, 33.94],
  [116.59, 40.08], [8.57, 50.03], [2.55, 49.01], [12.25, 41.80],
  [51.61, 25.27], [100.75, 13.68], [139.78, 35.55], [-46.47, -23.43],
]

export default function LoginPage() {
  const router = useRouter()
  const [lastName, setLastName] = useState("")
  const [pnr, setPnr] = useState("")
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      router.push("/passenger-portal")
    }, 800)
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* World Map Background */}
      <div className="absolute inset-0 z-0">
        <ComposableMap
          projection="geoNaturalEarth1"
          style={{ width: "100%", height: "100%" }}
          projectionConfig={{ scale: 155, center: [10, 20] }}
        >
          <Sphere id="sphere" fill="#0a0c18" stroke="transparent" strokeWidth={0} />
          <Graticule stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1a1f35"
                  stroke="#0d1020"
                  strokeWidth={0.5}
                  style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }}
                />
              ))
            }
          </Geographies>

          {/* Flight routes */}
          {ROUTES.map((r, i) => {
            const from = r.from as [number, number]
            const to = r.to as [number, number]
            return (
              <line key={i}
                x1="0" y1="0" x2="0" y2="0"
                stroke="rgba(200,16,46,0.4)" strokeWidth={0.8}
              />
            )
          })}

          {/* Airport dots */}
          {AIRPORTS.map((coords, i) => (
            <Marker key={i} coordinates={coords as [number, number]}>
              <circle
                r={i === 0 ? 4 : 2}
                fill={i === 0 ? "#E82040" : "rgba(255,255,255,0.5)"}
                stroke={i === 0 ? "rgba(232,32,64,0.4)" : "transparent"}
                strokeWidth={i === 0 ? 4 : 0}
              />
            </Marker>
          ))}
        </ComposableMap>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 z-10"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 20% 80%, rgba(150,8,25,0.25) 0%, transparent 50%), linear-gradient(135deg, rgba(8,10,18,0.85) 0%, rgba(8,10,18,0.75) 100%)"
        }} />

      {/* Login Form */}
      <div className="relative z-20 w-full max-w-[460px] mx-4">
        {/* Backdrop card */}
        <div className="rounded-2xl p-10"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>

          <h1 className="text-3xl font-bold text-white text-center mb-8 tracking-tight">
            Yolcu Giriş Ekranı
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Yolcu Soyadı"
                className="w-full px-5 py-4 rounded-xl text-white placeholder-white/40 text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(200,16,46,0.6)" }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)" }}
              />
            </div>

            <div>
              <input
                type="text"
                value={pnr}
                onChange={(e) => setPnr(e.target.value)}
                placeholder="PNR veya Bilet Numarası"
                className="w-full px-5 py-4 rounded-xl text-white placeholder-white/40 text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(200,16,46,0.6)" }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full font-semibold text-white text-sm transition-all duration-150 mt-2"
              style={{
                background: loading ? "rgba(200,16,46,0.6)" : "#C8102E",
                boxShadow: "0 4px 24px rgba(200,16,46,0.3)",
              }}
            >
              {loading ? "Yükleniyor..." : "Uçuşumu Yönet"}
            </button>
          </form>

          <div className="flex justify-center gap-8 mt-6">
            <button className="text-white/50 text-sm hover:text-white/80 transition-colors">Yardım Al</button>
            <button className="text-white/50 text-sm hover:text-white/80 transition-colors">Gizlilik Politikası</button>
          </div>
        </div>
      </div>
    </div>
  )
}
