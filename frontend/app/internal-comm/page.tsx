"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Search, Share2, MoreHorizontal, Mic, Smile, AtSign, Plus } from "lucide-react"

const CHANNELS = [
  { name: "firtina-istanbul", unread: 1 },
  { name: "genel",            unread: 0 },
  { name: "ekip-atama",       unread: 2 },
]

const UNIT_CHANNELS = [
  { name: "yer-hizmetleri", unread: 1 },
  { name: "teknik-destek",  unread: 0 },
]

const MESSAGES = [
  {
    author: "Ahmet Yılmaz", time: "12:23", avatar: "AY", isBot: false,
    text: "Aktif İmma Fırtına İstanbul -⚡- Uçuş TK1234 iptal edildi.",
  },
  {
    author: "SkyWise AI", time: "12:25", avatar: "SW", isBot: true,
    text: "",
    report: {
      title: "🚨 ANLIK RAPOR: Fırtına İstanbul (IST) - Uçuş TK1234 iptal edildi. 150 yolcu etkilendi.",
      suggestion: "Önerilen Aksiyon: Otel Rezervasyonu & Yeniden Yönlendirme.",
      actions: ["Otelleri Görüntüle", "Yeniden Yönlendir", "Ekip Bildirimi"],
    },
  },
  {
    author: "Operator Öztürk", time: "13:35", avatar: "OÖ", isBot: false,
    text: "Anlık rapor: Fırtına İstanbul (IST) - Uçuş TK1234 iptal edildi.",
  },
  {
    author: "Zeynep Kaya", time: "13:38", avatar: "ZK", isBot: false,
    text: "Operator kavar kasınan uçuş ip sak ay.nlarilamlara olamasıya eyntendliği olardır.",
  },
]

const TEAM = [
  { name: "Ahmet Yılmaz", role: "SUPERVISOR", online: true,  status: "Çevrimiçi"  },
  { name: "Zeynep Kaya",  role: "SUPERVISOR", online: true,  status: "Çevrimiçi"  },
  { name: "Mehmet Öztürk",role: "DISPATCHER", online: false, status: "Çevrimdışı" },
  { name: "Ali Demir",    role: "DISPATCHER", online: false, status: "Rahatsız Etmeyin" },
]

function Avatar({ initials, color = "#C8102E" }: { initials: string; color?: string }) {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
      style={{ background: color }}>
      {initials}
    </div>
  )
}

export default function InternalCommPage() {
  const [activeChannel, setActiveChannel] = useState("firtina-istanbul")
  const [msg, setMsg] = useState("")

  return (
    <div className="h-screen flex overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.12) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)"
      }}>
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">

        {/* Left: Channel List */}
        <div className="w-[200px] shrink-0 flex flex-col"
          style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-5 pb-3">
            <h1 className="text-lg font-bold text-white">Şirket İçi İletişim Hubı</h1>
          </div>

          <div className="px-3 mb-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <input placeholder="Ara..." className="bg-transparent text-white/60 text-xs outline-none flex-1" />
            </div>
          </div>

          {/* Channels */}
          <div className="px-3 mb-1">
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider mb-1 px-1">Operasyon Kanalları</p>
            {CHANNELS.map(ch => (
              <button key={ch.name} onClick={() => setActiveChannel(ch.name)}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm text-left transition-colors mb-0.5 ${
                  activeChannel === ch.name ? "bg-white/10 text-white" : "text-white/50 hover:text-white/70 hover:bg-white/5"
                }`}>
                <span className="text-white/30">#</span>
                <span className="flex-1">{ch.name}</span>
                {ch.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#E82040] text-[9px] text-white flex items-center justify-center">
                    {ch.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="px-3">
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider mb-1 px-1">Birimler</p>
            {UNIT_CHANNELS.map(ch => (
              <button key={ch.name}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm text-left text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors mb-0.5">
                <span className="text-white/30">#</span>
                <span className="flex-1">{ch.name}</span>
                {ch.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#E82040] text-[9px] text-white flex items-center justify-center">
                    {ch.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Chat */}
        <div className="flex-1 flex flex-col" style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Channel Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/40">#</span>
                <span className="text-white font-semibold">{activeChannel}</span>
              </div>
              <p className="text-white/30 text-xs">Aktif Konu: Fırtına İstanbul - Uçuş İptalleri</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg hover:bg-white/5"><Share2 className="w-4 h-4 text-white/40" /></button>
              <button className="p-1.5 rounded-lg hover:bg-white/5"><MoreHorizontal className="w-4 h-4 text-white/40" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {MESSAGES.map((m, i) => (
              <div key={i} className="flex gap-3">
                <Avatar initials={m.avatar} color={m.isBot ? "#1a3a6c" : "#4a4a6a"} />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-sm font-semibold ${m.isBot ? "text-[#60a5fa]" : "text-white/90"}`}>
                      {m.author}
                    </span>
                    {m.isBot && (
                      <span className="text-[9px] font-bold text-white/40 bg-white/10 px-1.5 py-0.5 rounded">BOT</span>
                    )}
                    <span className="text-white/30 text-xs">{m.time}</span>
                  </div>
                  {m.text && <p className="text-white/70 text-sm">{m.text}</p>}
                  {m.report && (
                    <div className="rounded-lg p-3 mt-1"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <p className="text-white/90 text-sm mb-1">{m.report.title}</p>
                      <p className="text-white/60 text-xs mb-3">{m.report.suggestion}</p>
                      <div className="flex gap-2 flex-wrap">
                        {m.report.actions.map(a => (
                          <button key={a} className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                            style={{ background: "#C8102E" }}>
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-5 pb-4 shrink-0">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Plus className="w-4 h-4 text-white/40 shrink-0 cursor-pointer hover:text-white/70" />
              <input value={msg} onChange={e => setMsg(e.target.value)}
                placeholder="Uçuş meskarer..."
                className="bg-transparent text-white/70 text-sm outline-none flex-1 placeholder-white/30" />
              <AtSign className="w-4 h-4 text-white/40 cursor-pointer hover:text-white/70" />
              <Mic className="w-4 h-4 text-white/40 cursor-pointer hover:text-white/70" />
            </div>
          </div>
        </div>

        {/* Right: Online Team */}
        <div className="w-[200px] shrink-0 p-4">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Çevrimiçi Ekip</p>

          {["SUPERVISOR", "DISPATCHER"].map(role => (
            <div key={role} className="mb-4">
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mb-2">{role}</p>
              {TEAM.filter(t => t.role === role).map(t => (
                <div key={t.name} className="flex items-center gap-2 mb-2">
                  <div className="relative shrink-0">
                    <Avatar initials={t.name.split(" ").map(n => n[0]).join("")} color="#2a2a4a" />
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#080a12] ${
                      t.online ? "bg-[#10b981]" : t.status === "Rahatsız Etmeyin" ? "bg-[#ef4444]" : "bg-white/30"
                    }`} />
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-medium leading-none">{t.name}</p>
                    <p className={`text-[10px] mt-0.5 ${t.online ? "text-[#10b981]" : "text-white/30"}`}>{t.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
