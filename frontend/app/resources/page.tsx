"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Bus, Car, Wind, Coffee, Users, User } from "lucide-react"

function GaugeMeter({ value, color = "#E82040" }: { value: number; color?: string }) {
  const r = 42, cx = 50, cy = 52
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
      <svg width="100" height="80" viewBox="0 0 100 80">
        <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={8} strokeLinecap="round" />
        <path d={valPath} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${color}80)` }} />
        <text x="50" y="56" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="system-ui">
          {value}
        </text>
      </svg>
    </div>
  )
}

function ProgressBar({ value, color = "#E82040" }: { value: number; color?: string }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
    </div>
  )
}

export default function ResourcesPage() {
  return (
    <div className="h-screen flex overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.12) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)"
      }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
        <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">Kaynak Yönetimi Paneli</h1>

        <div className="flex-1 grid grid-cols-2 gap-5 min-h-0">

          {/* Konaklama Kapasitesi */}
          <div className="rounded-xl p-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold mb-4">Konaklama Kapasitesi</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "5 Yıldızlı", value: 85, pct: "85% Dolu", color: "#E82040" },
                { label: "4 Yıldızlı", value: 70, pct: "70% Dolu", color: "#E82040" },
                { label: "Butik Oteller", value: 60, pct: "60% Dolu", color: "#E82040" },
              ].map(h => (
                <div key={h.label} className="flex flex-col items-center gap-1">
                  <GaugeMeter value={h.value} color={h.color} />
                  <p className="text-white/70 text-xs text-center">{h.label}</p>
                  <p className="text-[#E82040] text-xs font-medium">{h.pct}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ulaşım ve Transfer */}
          <div className="rounded-xl p-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold mb-4">Ulaşım ve Transfer</h3>
            <div className="flex flex-col gap-3">
              {[
                { icon: Bus,  label: "Shuttle Otobüsleri", count: "20 Aktif", color: "#E82040" },
                { icon: Car,  label: "VIP Araçlar",        count: "15 Aktif", color: "#E82040" },
                { icon: Wind, label: "Helikopter",         count: "2 Aktif",  color: "#E82040" },
              ].map(t => (
                <div key={t.label} className="p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <t.icon className="w-4 h-4 text-white/60 shrink-0" />
                      <span className="text-white/80 text-sm">{t.label}</span>
                    </div>
                    <span className="text-[#E82040] text-sm font-semibold">{t.count}</span>
                  </div>
                  <ProgressBar value={t.label === "Helikopter" ? 30 : t.label === "VIP Araçlar" ? 75 : 80} color={t.color} />
                </div>
              ))}
            </div>
          </div>

          {/* İkram ve Vouchers */}
          <div className="rounded-xl p-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold mb-4">İkram ve Vouchers</h3>
            <div className="flex flex-col gap-4">
              {[
                { label: "Yemek Kuponları",    pct: 75, text: "75% Dağıtıldı" },
                { label: "İçecek Fişleri",     pct: 90, text: "90% Dağıtıldı" },
                { label: "Özel Hizmet Fişleri",pct: 50, text: "50% Dağıtıldı" },
              ].map(v => (
                <div key={v.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/70 text-sm">{v.label}</span>
                    <span className="text-[#E82040] text-xs font-medium">{v.text}</span>
                  </div>
                  <ProgressBar value={v.pct} />
                </div>
              ))}
            </div>
          </div>

          {/* Personel Durumu */}
          <div className="rounded-xl p-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold mb-4">Personel Durumu</h3>
            <div className="flex flex-col gap-3">
              {[
                { icon: Coffee, label: "Kabin Ekibi",    count: "450 Aktif", color: "#E82040" },
                { icon: User,   label: "Kokpit Ekibi",   count: "200 Aktif", color: "#E82040" },
                { icon: Users,  label: "Yer Hizmetleri", count: "600 Aktif", color: "#E82040" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.08)" }}>
                    <s.icon className="w-4.5 h-4.5 text-white/60" style={{ width: 18, height: 18 }} />
                  </div>
                  <span className="text-white/80 text-sm flex-1">{s.label}</span>
                  <span className="text-[#E82040] text-sm font-semibold">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <p className="text-white/20 text-xs text-center shrink-0">© 2024 Turkish Airlines. All rights reserved.</p>
      </div>
    </div>
  )
}
