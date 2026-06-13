"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { ComposableMap, Geographies, Geography, Graticule, Sphere, Marker } from "react-simple-maps"

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const AIRPORTS: Array<[number,number]> = [
  [28.82, 40.98], [-0.45, 51.47], [-73.78, 40.64], [55.36, 25.25],
  [77.10, 28.55], [103.98, 1.36], [37.41, 55.97], [-118.4, 33.94],
  [116.59, 40.08], [8.57, 50.03], [2.55, 49.01], [-46.47, -23.43],
  [151.18, -33.95], [12.25, 41.80], [51.61, 25.27],
]

export default function IrropsDashboard() {
  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0c0e1a 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-5 gap-4">
        <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">IRROPS Gösterge Paneli</h1>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 shrink-0">
          {[
            { label: "Aktif Kesintiler", value: "12", hi: false },
            { label: "Toplam Etkilenen Yolcular", value: "3,450", hi: false },
            { label: "Yapay Zeka Kurtarma Oranı", value: "92%", hi: true },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/60 text-sm mb-2">{s.label}</p>
              <p className={`text-4xl font-black ${s.hi ? "text-[#10b981]" : "text-white"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Map + Right Panel */}
        <div className="flex-1 flex gap-4 min-h-0">

          {/* Map */}
          <div className="flex-1 rounded-xl overflow-hidden"
            style={{ background: "rgba(8,10,18,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <ComposableMap
              projection="geoNaturalEarth1"
              style={{ width: "100%", height: "100%" }}
              projectionConfig={{ scale: 160, center: [15, 20] }}
            >
              <Sphere id="sphere" fill="#06090f" stroke="transparent" strokeWidth={0} />
              <Graticule stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography key={geo.rsmKey} geography={geo}
                      fill="#1c2235" stroke="#0d1120" strokeWidth={0.5}
                      style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }} />
                  ))
                }
              </Geographies>

              {AIRPORTS.map((coords, i) => (
                <Marker key={i} coordinates={coords}>
                  <circle
                    r={i === 0 ? 5 : 2.5}
                    fill={i === 0 ? "#E82040" : "rgba(255,255,255,0.6)"}
                    stroke={i === 0 ? "rgba(232,32,64,0.35)" : "transparent"}
                    strokeWidth={i === 0 ? 6 : 0}
                  />
                </Marker>
              ))}
            </ComposableMap>
          </div>

          {/* Right Panel */}
          <div className="w-[260px] shrink-0 flex flex-col gap-3">
            <div className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm mb-3">AI Tahminleri</h3>
              <div className="space-y-3">
                {[
                  "İstanbul'da Yüksek Gecikme Olasılığı (Önümüzdeki 4 Saat)",
                  "Fırtına Nedeniyle 10 Sefer Riski",
                ].map((t) => (
                  <div key={t} className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#E82040] mt-1 shrink-0" />
                    <p className="text-white/60 text-xs leading-relaxed">{t}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Acil Eylemler</h3>
              <div className="space-y-2">
                <button className="w-full py-3 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "#C8102E" }}>
                  Gecikmiş Uçuşları İncele
                </button>
                <button className="w-full py-3 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "#C8102E" }}>
                  Alternatif Rotaları Planla
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/20 text-xs text-center shrink-0">© 2024 Turkish Airlines. All rights reserved.</p>
      </div>
    </div>
  )
}
