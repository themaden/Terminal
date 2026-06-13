"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Bus, Car, Wind, Coffee, Users, User, Hotel, TrendingUp } from "lucide-react"

function GaugeMeter({ value, color = "#E82040", label }: { value: number; color?: string; label?: string }) {
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
        <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} strokeLinecap="round" />
        <path d={valPath} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${color}80)` }} />
        <text x="50" y="56" textAnchor="middle" fill="white" fontSize="17" fontWeight="bold" fontFamily="system-ui">
          {value}
        </text>
      </svg>
      {label && <p className="text-white/50 text-[10px] text-center mt-0.5">{label}</p>}
    </div>
  )
}

function ProgressBar({ value, color = "#E82040", label }: { value: number; color?: string; label?: string }) {
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-white/60 text-xs">{label}</span>
          <span className="text-xs font-bold" style={{ color }}>{value}%</span>
        </div>
      )}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}60` }} />
      </div>
    </div>
  )
}

const CARD = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }

export default function ResourcesPage() {
  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.10) 0%, transparent 55%), linear-gradient(135deg, #0c0e1a 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
        <div className="flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-bold text-white tracking-tight">Kaynak Yönetimi Paneli</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <TrendingUp className="w-3.5 h-3.5 text-[#10b981]" />
            <span className="text-[#10b981] text-xs font-bold">Kapasite İzleniyor</span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-5 min-h-0">

          {/* Konaklama Kapasitesi */}
          <div className="rounded-xl p-5 flex flex-col" style={CARD}>
            <div className="flex items-center gap-2 mb-4">
              <Hotel className="w-4 h-4 text-[#E82040]" />
              <h3 className="text-white font-semibold text-sm">Konaklama Kapasitesi</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 flex-1">
              {[
                { label: "5 Yıldızlı", value: 85, rooms: "42/50 oda", color: "#E82040" },
                { label: "4 Yıldızlı", value: 70, rooms: "35/50 oda", color: "#f59e0b" },
                { label: "Butik",      value: 60, rooms: "18/30 oda", color: "#60a5fa" },
              ].map(h => (
                <div key={h.label} className="flex flex-col items-center gap-2 p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <GaugeMeter value={h.value} color={h.color} />
                  <p className="text-white/70 text-xs font-semibold text-center">{h.label}</p>
                  <p className="text-white/40 text-[10px] text-center">{h.rooms}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: `${h.color}18`, color: h.color }}>
                    {h.value}% Dolu
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl"
              style={{ background: "rgba(232,32,64,0.08)", border: "1px solid rgba(232,32,64,0.2)" }}>
              <p className="text-white/60 text-xs">Toplam Kapasite: <span className="text-white font-semibold">130 oda</span> &nbsp;|&nbsp; Kullanılan: <span className="text-[#E82040] font-semibold">95 oda</span></p>
            </div>
          </div>

          {/* Ulaşım ve Transfer */}
          <div className="rounded-xl p-5 flex flex-col" style={CARD}>
            <div className="flex items-center gap-2 mb-4">
              <Bus className="w-4 h-4 text-[#E82040]" />
              <h3 className="text-white font-semibold text-sm">Ulaşım ve Transfer</h3>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {[
                { icon: Bus,  label: "Shuttle Otobüsleri", count: "20 Aktif", pct: 80, color: "#E82040",  detail: "16/20 devrede" },
                { icon: Car,  label: "VIP Araçlar",        count: "15 Aktif", pct: 75, color: "#f59e0b",  detail: "11/15 devrede" },
                { icon: Wind, label: "Helikopter",         count: "2 Aktif",  pct: 30, color: "#60a5fa",  detail: "1/2 devrede"   },
              ].map(t => {
                const TIcon = t.icon
                return (
                  <div key={t.label} className="p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${t.color}18` }}>
                        <TIcon className="w-4 h-4" style={{ color: t.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white/80 text-sm font-medium">{t.label}</p>
                        <p className="text-white/40 text-xs">{t.detail}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: t.color }}>{t.count}</span>
                    </div>
                    <ProgressBar value={t.pct} color={t.color} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* İkram ve Vouchers */}
          <div className="rounded-xl p-5 flex flex-col" style={CARD}>
            <div className="flex items-center gap-2 mb-4">
              <Coffee className="w-4 h-4 text-[#E82040]" />
              <h3 className="text-white font-semibold text-sm">İkram ve Vouchers</h3>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: "Yemek Kuponları",     pct: 75, used: "1,875 / 2,500", color: "#E82040" },
                { label: "İçecek Fişleri",      pct: 90, used: "900 / 1,000",   color: "#f59e0b" },
                { label: "Özel Hizmet Fişleri", pct: 50, used: "250 / 500",     color: "#10b981" },
              ].map(v => (
                <div key={v.label} className="p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/70 text-sm font-medium">{v.label}</span>
                    <span className="text-white/40 text-xs">{v.used}</span>
                  </div>
                  <ProgressBar value={v.pct} color={v.color} />
                </div>
              ))}
            </div>
          </div>

          {/* Personel Durumu */}
          <div className="rounded-xl p-5 flex flex-col" style={CARD}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[#E82040]" />
              <h3 className="text-white font-semibold text-sm">Personel Durumu</h3>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: Coffee, label: "Kabin Ekibi",     total: 500, active: 450, pct: 90, color: "#E82040" },
                { icon: User,   label: "Kokpit Ekibi",    total: 220, active: 200, pct: 91, color: "#f59e0b" },
                { icon: Users,  label: "Yer Hizmetleri",  total: 800, active: 600, pct: 75, color: "#10b981" },
              ].map(s => {
                const SIcon = s.icon
                return (
                  <div key={s.label} className="p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${s.color}18` }}>
                        <SIcon className="w-4.5 h-4.5" style={{ width: 18, height: 18, color: s.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white/80 text-sm font-medium">{s.label}</p>
                        <p className="text-white/40 text-xs">{s.active} aktif / {s.total} toplam</p>
                      </div>
                      <span className="text-lg font-black" style={{ color: s.color }}>{s.active}</span>
                    </div>
                    <ProgressBar value={s.pct} color={s.color} />
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        <p className="text-white/20 text-xs text-center shrink-0">© 2024 Turkish Airlines. All rights reserved.</p>
      </div>
    </div>
  )
}
