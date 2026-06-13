"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Smile, Send, X } from "lucide-react"
import { Search } from "lucide-react"

const INITIAL_MESSAGES = [
  {
    type: "report",
    icon: "🟥",
    title: "Hava Durumu Aksaklığı Raporu - Londra Heathrow (LHR):",
    body: "Kötü hava koşulları nedeniyle yoğun gecikmeler bekleniyor. 15 uçuş etkilendi.",
    actions: ["Detayları Görüntüle", "Operasyona Aktar"],
  },
  {
    type: "report",
    icon: "🟠",
    title: "Önerilen Otel Atamaları:",
    body: "LHR çevresinde 50 öncelikli yolcu için odalar rezerve edildi (Hilton Garden Inn, 50 oda).",
    actions: ["Hepsini Onayla", "Alternatif Ara"],
  },
  {
    type: "report",
    icon: "🟠",
    title: "Öncelikli Yolcu Listesi:",
    body: "İlk 50 yolcu için yeniden rezervasyon seçenekleri hazırlandı.",
    actions: ["Listeyi Görüntüle"],
  },
]

export default function AiBotPage() {
  const [input, setInput] = useState("")

  return (
    <div className="h-screen flex overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.12) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)"
      }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <h1 className="text-2xl font-bold text-white tracking-tight">Yapay Zeka Operasyon Botu ve Raporlama</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Search className="w-4 h-4 text-white/40" />
              <input placeholder="Uçuş, Yolcu veya Kaynak Ara"
                className="bg-transparent text-white/80 text-sm outline-none placeholder-white/30 w-48" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(232,32,64,0.15)", border: "1px solid rgba(232,32,64,0.3)" }}>
              <span className="w-2 h-2 rounded-full bg-[#E82040] animate-pulse-live" />
              <span className="text-[#E82040] text-xs font-bold tracking-widest">Canlı</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-4 px-6 pb-5 min-h-0">

          {/* Chat Window */}
          <div className="flex-1 rounded-xl flex flex-col"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>

            {/* Bot Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  🤖
                </div>
                <div>
                  <p className="text-white/90 font-semibold text-sm">SkyWise AI</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                    <span className="text-[#10b981] text-xs">Aktif</span>
                  </div>
                </div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-white/5">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {INITIAL_MESSAGES.map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
                    style={{ background: "rgba(200,16,46,0.15)", border: "1px solid rgba(200,16,46,0.2)" }}>
                    <span className="text-sm">✈️</span>
                  </div>
                  <div className="flex-1 rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-white/90 text-sm font-medium mb-1">{m.icon} {m.title}</p>
                    <p className="text-white/60 text-xs mb-3 leading-relaxed">{m.body}</p>
                    <div className="flex gap-2 flex-wrap">
                      {m.actions.map(a => (
                        <button key={a}
                          className="px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90 transition-opacity"
                          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-5 pb-4 shrink-0">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                  placeholder=""
                  className="bg-transparent text-white/70 text-sm outline-none flex-1 placeholder-white/30" />
                <Smile className="w-5 h-5 text-white/40 cursor-pointer hover:text-white/70 shrink-0" />
                <button className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 hover:opacity-90"
                  style={{ background: "#C8102E" }}>
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Bot Features */}
          <div className="w-[240px] shrink-0 flex flex-col gap-4">
            <div className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm mb-3">AI Bot Özellikleri</h3>

              <div className="mb-4">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Mevcut Görevler</p>
                <div className="flex flex-col gap-1">
                  {["LHR Kriz Yönetimi", "Yolcu Koruma"].map(t => (
                    <div key={t} className="flex items-center gap-2 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E82040] shrink-0" />
                      <span className="text-white/70 text-xs">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Karar Mantığı</p>
                <div className="flex flex-col gap-1">
                  {["Hava Durumu Tahmini Entegrasyonu", "Yolcu Statüs Önceliği", "Anlık Otel Müsaitliği"].map(t => (
                    <div key={t} className="flex items-center gap-2 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E82040] shrink-0" />
                      <span className="text-white/70 text-xs">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
