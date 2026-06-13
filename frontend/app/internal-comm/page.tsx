"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Search, Share2, MoreHorizontal, Mic, AtSign, Plus, Hash, Send } from "lucide-react"

const CHANNELS = [
  { name: "firtina-istanbul", unread: 3, active: true  },
  { name: "genel",            unread: 0, active: false },
  { name: "ekip-atama",       unread: 2, active: false },
]

const UNIT_CHANNELS = [
  { name: "yer-hizmetleri", unread: 1 },
  { name: "teknik-destek",  unread: 0 },
  { name: "pcc-koordinasyon", unread: 0 },
]

const MESSAGES = [
  {
    author: "Ahmet Yılmaz", time: "12:23", avatar: "AY", isBot: false, role: "SUPERVISOR",
    text: "Aktif İksa Fırtına İstanbul — ⚡ Uçuş TK1234 iptal edildi. Tüm birimler hazır olsun.",
  },
  {
    author: "SkyWise AI", time: "12:25", avatar: "AI", isBot: true, role: "BOT",
    text: "",
    report: {
      title: "🚨 ANLIK RAPOR — Fırtına İstanbul (IST)",
      body: "Uçuş TK1234 iptal edildi. 150 yolcu etkilendi. Hilton Garden Inn çevresinde 50 oda müsait.",
      suggestion: "Önerilen Aksiyon: Otel Rezervasyonu & Yeniden Yönlendirme",
      actions: ["Otelleri Görüntüle", "Yeniden Yönlendir", "Ekip Bildirimi"],
    },
  },
  {
    author: "Operator Öztürk", time: "13:35", avatar: "OÖ", isBot: false, role: "DISPATCHER",
    text: "Anlık rapor alındı. Otel koordinasyonu başlatıldı. 3 otobüs havalimanına yönlendirildi.",
  },
  {
    author: "Zeynep Kaya", time: "13:38", avatar: "ZK", isBot: false, role: "SUPERVISOR",
    text: "Elite Plus yolcular için VIP araçlar hazırlandı. PCC onaylasın.",
  },
]

const TEAM = [
  { name: "Ahmet Yılmaz",  role: "SUPERVISOR", online: true,  status: "Çevrimiçi"       },
  { name: "Zeynep Kaya",   role: "SUPERVISOR", online: true,  status: "Çevrimiçi"       },
  { name: "Mehmet Öztürk", role: "DISPATCHER", online: false, status: "Çevrimdışı"      },
  { name: "Ali Demir",     role: "DISPATCHER", online: false, status: "Rahatsız Etmeyin" },
  { name: "Selin Aktaş",   role: "ANALYST",    online: true,  status: "Çevrimiçi"       },
]

const AVATAR_COLORS: Record<string, string> = {
  AY: "#C8102E", ZK: "#7c3aed", OÖ: "#0284c7", AI: "#1e3a8a",
}

function Avatar({ initials }: { initials: string }) {
  const color = AVATAR_COLORS[initials] ?? "#374151"
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
      style={{ background: color }}>
      {initials}
    </div>
  )
}

function StatusDot({ online, status }: { online: boolean; status: string }) {
  const color = online ? "#10b981" : status === "Rahatsız Etmeyin" ? "#ef4444" : "rgba(255,255,255,0.2)"
  return <div className="w-2.5 h-2.5 rounded-full border-2 border-[#080a12]" style={{ background: color }} />
}

export default function InternalCommPage() {
  const [activeChannel, setActiveChannel] = useState("firtina-istanbul")
  const [msg, setMsg] = useState("")

  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.12) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">

        {/* Left: Channel List */}
        <div className="w-[210px] shrink-0 flex flex-col"
          style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>

          <div className="px-4 pt-5 pb-3">
            <h1 className="text-sm font-bold text-white tracking-wide mb-3">Şirket İçi İletişim</h1>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <input placeholder="Kanal ara..." className="bg-transparent text-white/60 text-xs outline-none flex-1" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3">
            <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1">Operasyon</p>
            {CHANNELS.map(ch => (
              <button key={ch.name} onClick={() => setActiveChannel(ch.name)}
                className={`w-full flex items-center gap-1.5 px-2 py-2 rounded-lg text-left transition-all mb-0.5 ${
                  activeChannel === ch.name ? "bg-white/10" : "hover:bg-white/5"
                }`}>
                <Hash className="w-3 h-3 shrink-0" style={{ color: activeChannel === ch.name ? "#E82040" : "rgba(255,255,255,0.25)" }} />
                <span className={`flex-1 text-xs font-medium truncate ${activeChannel === ch.name ? "text-white" : "text-white/50"}`}>
                  {ch.name}
                </span>
                {ch.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#E82040] text-[9px] text-white flex items-center justify-center shrink-0 font-bold">
                    {ch.unread}
                  </span>
                )}
              </button>
            ))}

            <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1 mt-4">Birimler</p>
            {UNIT_CHANNELS.map(ch => (
              <button key={ch.name}
                className="w-full flex items-center gap-1.5 px-2 py-2 rounded-lg text-left text-white/40 hover:text-white/65 hover:bg-white/5 transition-colors mb-0.5">
                <Hash className="w-3 h-3 shrink-0 text-white/20" />
                <span className="flex-1 text-xs truncate">{ch.name}</span>
                {ch.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#E82040] text-[9px] text-white flex items-center justify-center font-bold">
                    {ch.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Chat */}
        <div className="flex-1 flex flex-col min-w-0" style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>

          {/* Channel Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-white/40" />
              <span className="text-white font-semibold text-sm">{activeChannel}</span>
              <span className="text-white/25 text-xs mx-1">|</span>
              <span className="text-white/30 text-xs">Aktif: Fırtına İstanbul - Uçuş İptalleri</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"><Share2 className="w-3.5 h-3.5 text-white/35" /></button>
              <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"><MoreHorizontal className="w-3.5 h-3.5 text-white/35" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
            {MESSAGES.map((m, i) => (
              <div key={i} className="flex gap-3">
                <Avatar initials={m.avatar} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-sm font-semibold ${m.isBot ? "text-[#60a5fa]" : "text-white/90"}`}>
                      {m.author}
                    </span>
                    {m.isBot && (
                      <span className="text-[9px] font-bold text-white/40 bg-white/10 px-1.5 py-0.5 rounded uppercase">Bot</span>
                    )}
                    <span className="text-white/25 text-xs">{m.time}</span>
                  </div>
                  {m.text && (
                    <p className="text-white/65 text-sm leading-relaxed">{m.text}</p>
                  )}
                  {m.report && (
                    <div className="rounded-xl p-4 mt-1"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                      <p className="text-white/90 text-sm font-semibold mb-1">{m.report.title}</p>
                      <p className="text-white/55 text-xs mb-1">{m.report.body}</p>
                      <p className="text-[#f59e0b] text-xs font-medium mb-3">→ {m.report.suggestion}</p>
                      <div className="flex gap-2 flex-wrap">
                        {m.report.actions.map(a => (
                          <button key={a} className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity"
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
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Plus className="w-4 h-4 text-white/35 cursor-pointer hover:text-white/65 shrink-0" />
              <input value={msg} onChange={e => setMsg(e.target.value)}
                placeholder={`#${activeChannel} kanalına mesaj yaz...`}
                className="bg-transparent text-white/70 text-sm outline-none flex-1 placeholder-white/25" />
              <AtSign className="w-4 h-4 text-white/35 cursor-pointer hover:text-white/65" />
              <Mic className="w-4 h-4 text-white/35 cursor-pointer hover:text-white/65" />
              <button className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: msg ? "#C8102E" : "rgba(255,255,255,0.08)" }}>
                <Send className="w-3.5 h-3.5" style={{ color: msg ? "white" : "rgba(255,255,255,0.3)" }} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Online Team */}
        <div className="w-[195px] shrink-0 p-4 overflow-y-auto">
          <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest mb-4">Çevrimiçi Ekip</p>

          {["SUPERVISOR", "DISPATCHER", "ANALYST"].map(role => {
            const members = TEAM.filter(t => t.role === role)
            if (!members.length) return null
            return (
              <div key={role} className="mb-5">
                <p className="text-white/25 text-[9px] font-bold uppercase tracking-widest mb-2">{role}</p>
                {members.map(t => (
                  <div key={t.name} className="flex items-center gap-2 mb-3">
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: t.online ? "rgba(200,16,46,0.25)" : "rgba(255,255,255,0.08)" }}>
                        {t.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <StatusDot online={t.online} status={t.status} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white/75 text-xs font-medium leading-none truncate">{t.name}</p>
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: t.online ? "#10b981" : "rgba(255,255,255,0.25)" }}>
                        {t.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
