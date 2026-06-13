"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MessageSquare, Mail, Phone, Bell, X, ChevronRight, User } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

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
  { icon: MessageSquare, label: "SMS",       active: true  },
  { icon: Mail,          label: "E-posta",   active: true  },
  { icon: MessageSquare, label: "WhatsApp",  active: true  },
  { icon: Phone,         label: "E-pohte",   active: false },
  { icon: MessageSquare, label: "WhatsApp",  active: false },
]

const TEMPLATES = [
  { icon: X,    title: "Uçuş İptal Bilgilendirmesi",  desc: "Uçuş İptal Bilgilendirmesi bilgilendirmede yeni iptal dryunansa..." },
  { icon: Bell, title: "Uçuş Gecikme Duyurusu",       desc: "Uçuş Gecikme Duyurusu ve yeni gecikme skinsrniyor­rizin geçeritli ode..." },
  { icon: Bell, title: "Alternatif Uçuş Teklifi",     desc: "Alternatif Uçuş Teklifi 'ita avi ve kuların uçunt geldince bakatti.iluz." },
  { icon: Bell, title: "Uçuş İriçilan",               desc: "" },
]

const perfData = [
  { t: "12:00", v: 40 }, { t: "19:30", v: 60 }, { t: "22:00", v: 85 }, { t: "12:00", v: 95 },
]
const responseData = [
  { t: "12:00", v: 20 }, { t: "15:00", v: 65 }, { t: "20:00", v: 85 }, { t: "12:00", v: 80 },
]

const TOOLTIP_STYLE = {
  background: "#0f1220", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "white", fontSize: 11,
}

export default function CommunicationsPage() {
  const [channels, setChannels] = useState(CHANNELS.map(c => c.active))

  return (
    <div className="h-screen flex overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.12) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)"
      }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <h1 className="text-2xl font-bold text-white tracking-tight">İletişim ve Bildirim Merkezi Paneli</h1>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: "#C8102E" }}>
            <Bell className="w-4 h-4" />
            Yeni Bildirim Başlat
          </button>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-4 px-6 pb-5 min-h-0">

          {/* İletişim Kanalları */}
          <div className="rounded-xl p-5 flex flex-col gap-3 h-fit"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold">İletişim Kanalları</h3>
            {CHANNELS.map((ch, i) => (
              <div key={`${ch.label}-${i}`} className="flex items-center gap-3 py-1">
                <ch.icon className="w-4 h-4 text-white/50 shrink-0" />
                <span className="text-white/70 text-sm flex-1">{ch.label}</span>
                <Toggle active={channels[i]} onToggle={() => setChannels(cs => cs.map((v,j) => j===i ? !v : v))} />
              </div>
            ))}
          </div>

          {/* Bildirim Şablonları */}
          <div className="rounded-xl p-5 flex flex-col gap-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold">Bildirim Şablonları</h3>
            <div className="flex flex-col gap-2 overflow-y-auto flex-1">
              {TEMPLATES.map((t, i) => (
                <div key={i} className="p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    {i === 0
                      ? <X className="w-4 h-4 text-[#E82040] shrink-0" />
                      : <Bell className="w-4 h-4 text-[#E82040] shrink-0" />}
                    <span className="text-white/90 text-sm font-medium">{t.title}</span>
                  </div>
                  {t.desc && <p className="text-white/40 text-xs leading-relaxed">{t.desc}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <Mail className="w-3.5 h-3.5 text-white/30" />
                    <User className="w-3.5 h-3.5 text-white/30" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gönderim Performansı */}
          <div className="rounded-xl p-5 flex flex-col gap-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold">Gönderim Performansı</h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Başarılı\nGönderim Oranı", value: "%98", color: "white" },
                { label: "Geri Dönüş\nSüresi",       value: "%82", color: "#E82040" },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl text-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-white/40 text-xs mt-1 whitespace-pre-line leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-white/50 text-xs mb-2">Okunma Oranı</p>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={perfData}>
                    <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="v" stroke="#E82040" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/50 text-xs">Geri Dönüş Süresi</p>
                <span className="text-[#E82040] text-[10px] font-semibold">● Kritik</span>
              </div>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={responseData}>
                    <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="v" stroke="#E82040" strokeWidth={2} dot={false} />
                  </LineChart>
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
