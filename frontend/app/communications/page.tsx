"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MessageSquare, Mail, Phone, Bell, CheckCircle, TrendingUp, Send } from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="relative w-11 h-6 rounded-full transition-colors shrink-0"
      style={{ background: active ? "#C8102E" : "rgba(255,255,255,0.15)" }}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  )
}

const CHANNELS = [
  { icon: MessageSquare, label: "SMS Bildirimleri",      active: true  },
  { icon: Mail,          label: "E-posta",               active: true  },
  { icon: MessageSquare, label: "WhatsApp",              active: true  },
  { icon: Phone,         label: "Sesli Arama",           active: false },
  { icon: Bell,          label: "Push Bildirim",         active: true  },
]

const TEMPLATES = [
  { icon: Bell,         title: "Uçuş İptal Bilgilendirmesi",  desc: "Uçuşunuz iptal edildi. Alternatif seçenekleriniz için..." , color: "#E82040" },
  { icon: Bell,         title: "Gecikme Duyurusu",            desc: "Uçuşunuz gecikmektedir. Yeni kalkış saati hakkında..."   , color: "#f59e0b" },
  { icon: CheckCircle,  title: "Alternatif Uçuş Teklifi",     desc: "Sizin için alternatif uçuş seçenekleri hazırlandı..."   , color: "#10b981" },
  { icon: Send,         title: "Otel Rezervasyon Onayı",      desc: "Otel rezervasyonunuz onaylandı. Detaylar için..."       , color: "#60a5fa" },
]

const perfData = [
  { t: "08:00", v: 62 }, { t: "10:00", v: 75 }, { t: "12:00", v: 88 },
  { t: "14:00", v: 82 }, { t: "16:00", v: 91 }, { t: "18:00", v: 95 },
]
const responseData = [
  { t: "08:00", v: 3.2 }, { t: "10:00", v: 2.8 }, { t: "12:00", v: 1.9 },
  { t: "14:00", v: 2.4 }, { t: "16:00", v: 1.5 }, { t: "18:00", v: 1.2 },
]

const TOOLTIP_STYLE = {
  background: "#0a0d1a", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "white", fontSize: 11,
}

export default function CommunicationsPage() {
  const [channels, setChannels] = useState(CHANNELS.map(c => c.active))

  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.12) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <h1 className="text-2xl font-bold text-white tracking-tight">İletişim ve Bildirim Merkezi</h1>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: "#C8102E", boxShadow: "0 4px 16px rgba(200,16,46,0.3)" }}>
            <Bell className="w-4 h-4" />
            Yeni Bildirim Başlat
          </button>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-4 px-6 pb-5 overflow-hidden">

          {/* İletişim Kanalları */}
          <div className="rounded-xl p-5 flex flex-col gap-0 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold mb-4">İletişim Kanalları</h3>
            <div className="flex flex-col gap-2">
              {CHANNELS.map((ch, i) => (
                <div key={`${ch.label}-${i}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{ background: channels[i] ? "rgba(200,16,46,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${channels[i] ? "rgba(200,16,46,0.2)" : "rgba(255,255,255,0.05)"}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: channels[i] ? "rgba(200,16,46,0.15)" : "rgba(255,255,255,0.06)" }}>
                    <ch.icon className="w-4 h-4 shrink-0" style={{ color: channels[i] ? "#E82040" : "rgba(255,255,255,0.4)" }} />
                  </div>
                  <span className="text-sm flex-1" style={{ color: channels[i] ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)" }}>
                    {ch.label}
                  </span>
                  <Toggle active={channels[i]} onToggle={() => setChannels(cs => cs.map((v, j) => j === i ? !v : v))} />
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#10b981]" />
                <span className="text-[#10b981] text-sm font-semibold">3.450 yolcu bildirimi gönderildi</span>
              </div>
              <p className="text-[#10b981]/60 text-xs mt-1">Son 24 saat içinde</p>
            </div>
          </div>

          {/* Bildirim Şablonları */}
          <div className="rounded-xl p-5 flex flex-col overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold mb-4">Bildirim Şablonları</h3>
            <div className="flex flex-col gap-2.5 overflow-y-auto flex-1">
              {TEMPLATES.map((t, i) => {
                const TIcon = t.icon
                return (
                  <div key={i} className="p-3.5 rounded-xl cursor-pointer hover:bg-white/[0.03] transition-colors"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${t.color}18` }}>
                        <TIcon className="w-3.5 h-3.5" style={{ color: t.color }} />
                      </div>
                      <span className="text-white/90 text-sm font-semibold">{t.title}</span>
                    </div>
                    <p className="text-white/40 text-xs leading-relaxed">{t.desc}</p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <button className="px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}30` }}>
                        Gönder
                      </button>
                      <button className="px-2.5 py-1 rounded-lg text-xs font-medium text-white/40"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        Düzenle
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Gönderim Performansı */}
          <div className="rounded-xl p-5 flex flex-col gap-4 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold">Gönderim Performansı</h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Başarılı Gönderim", value: "%98", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
                { label: "Geri Dönüş Oranı", value: "%82", color: "#E82040", bg: "rgba(232,32,64,0.08)",  border: "rgba(232,32,64,0.2)" },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl text-center"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-white/40 text-xs mt-1 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Okunma Oranı Chart */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/50 text-xs font-semibold">Okunma Oranı</p>
                <span className="text-[#10b981] text-[10px] font-semibold">▲ %95 Bugün</span>
              </div>
              <div style={{ height: 110 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={perfData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[50, 100]} hide />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2}
                      fill="url(#perfGrad)" dot={false}
                      activeDot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Geri Dönüş Süresi Chart */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/50 text-xs font-semibold">Geri Dönüş Süresi (dk)</p>
                <span className="text-[#E82040] text-[10px] font-semibold">● Ortalama 1.8dk</span>
              </div>
              <div style={{ height: 110 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={responseData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="respGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#E82040" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E82040" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="v" stroke="#E82040" strokeWidth={2}
                      fill="url(#respGrad)" dot={false}
                      activeDot={{ r: 4, fill: "#E82040", strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/20 text-xs text-center pb-3 shrink-0">© 2024 Turkish Airlines. All rights reserved.</p>
      </div>
    </div>
  )
}
