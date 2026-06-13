"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { AlertTriangle, Snowflake, Users } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const CRISIS_PREDICTIONS = [
  { city: "Londra",   event: "Fırtına Uyarısı",    pct: 85, icon: "alert" },
  { city: "İstanbul", event: "Yoğun Kar Yağışı",   pct: 70, icon: "snow"  },
  { city: "İnla",     event: "Yoğun Kar Yağışı",   pct: 70, icon: "snow"  },
  { city: "Kritik",   event: "Yoğun Sunırt Yağışı",pct: 70, icon: "snow"  },
  { city: "Londra",   event: "Fırtına Uyarısı",    pct: 85, icon: "alert" },
  { city: "İstanbul", event: "Yoğun Kar Yağışı",   pct: 70, icon: "snow"  },
]

function GaugeMeter({ value, label, color = "#E82040" }: { value: number; label: string; color?: string }) {
  const r = 48, cx = 58, cy = 60
  const startAngle = 210, totalSweep = 240
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
      <svg width="116" height="90" viewBox="0 0 116 90">
        <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={9} strokeLinecap="round" />
        <path d={valPath} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${color}80)` }} />
        <text x="58" y="65" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="system-ui">
          {value}
        </text>
      </svg>
      <p className="text-white/50 text-xs text-center">{label}</p>
    </div>
  )
}

const TOOLTIP_STYLE = {
  background: "#0f1220", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "white", fontSize: 11,
}

const actData = [
  { t: "12:00", v: 30 }, { t: "19:30", v: 55 }, { t: "22:00", v: 70 }, { t: "12:00", v: 95 },
]
const riskData = [
  { t: "12:00", v: 20 }, { t: "15:00", v: 50 }, { t: "20:00", v: 80 }, { t: "12:00", v: 85 },
]

export default function AiAnalyticsPage() {
  return (
    <div className="h-screen flex overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.12) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)"
      }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
        <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">AI Yapay Zeka Analizleri Paneli</h1>

        <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">

          {/* Kriz Tahminleri */}
          <div className="rounded-xl p-4 flex flex-col"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold text-sm mb-3">Kriz Tahminleri</h3>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1">
              {CRISIS_PREDICTIONS.map((p, i) => (
                <div key={i} className="p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {p.icon === "alert"
                      ? <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
                      : <Snowflake     className="w-3.5 h-3.5 text-[#60a5fa] shrink-0" />}
                    <span className="text-white/90 text-xs font-semibold">{p.city}</span>
                  </div>
                  <p className="text-white/50 text-[10px] leading-tight">{p.event}</p>
                  <p className="text-[#f59e0b] text-xs font-semibold mt-1">%{p.pct} Olasılık</p>
                  <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: "#E82040" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Akıllı Yolcu Önceliklendirme + Önerilen Aksiyonlar */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-4 flex-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Akıllı Yolcu Önceliklendirme</h3>
              <div className="flex flex-col gap-3">
                {[
                  { icon: Users, label: "Elite Plus:",           count: "150 Yolcu", pct: 75 },
                  { icon: Users, label: "Business:",             count: "200 Yolcu", pct: 90 },
                  { icon: Users, label: "Kısa Bağlantılı Yolcular:", count: "85 Yolcu",  pct: 45 },
                ].map(p => (
                  <div key={p.label}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <p.icon className="w-4 h-4 text-white/40 shrink-0" />
                      <span className="text-white/70 text-sm flex-1">{p.label}</span>
                      <span className="text-[#E82040] text-sm font-semibold">{p.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: "#E82040" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Önerilen Aksiyonlar</h3>
              <div className="flex flex-col gap-2">
                {["Otel Rezervasyonu Başlat", "Yedek Uçak Ata", "Yolcu İletişimi Gönder"].map(a => (
                  <button key={a} className="w-full py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    style={{ background: "#C8102E" }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Operasyonel Risk Skorları */}
          <div className="rounded-xl p-4 flex flex-col gap-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold text-sm">Operasyonel Risk Skorları</h3>

            <div className="grid grid-cols-2 gap-3">
              <GaugeMeter value={78} label="ACT Skoru&#10;78 (Orta Risk)" color="rgba(255,255,255,0.7)" />
              <GaugeMeter value={92} label="Risk Skoru&#10;92 (Kritik)"   color="#E82040" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-white/50 text-xs">ACT Skoru</p>
              </div>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={actData}>
                    <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0,100]} hide />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="v" stroke="#E82040" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-white/50 text-xs">Real-Time Trend</p>
                <span className="text-[#E82040] text-[10px] font-semibold">● Kritik</span>
              </div>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={riskData}>
                    <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0,100]} hide />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="v" stroke="#E82040" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>

        <p className="text-white/20 text-xs text-center shrink-0">© 2024 Turkish Airlines. All rights reserved.</p>
      </div>
    </div>
  )
}
