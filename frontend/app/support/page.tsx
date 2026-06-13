"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Phone, Search, Plane, ArrowLeftRight, Scale, BookOpen, ChevronRight, MessageCircle, ChevronDown } from "lucide-react"

const QUICK_CALLS = [
  { label: "Acil Durum Hattı (Dahili)", number: "555-1234", urgent: true },
  { label: "IRROPS Masası",            number: "555-5678", urgent: true },
  { label: "BT Destek",               number: "555-9012", urgent: false },
]

const HELP_LINKS = [
  { icon: Plane,          label: "Uçuş İptalleri ve\nGecikmeler" },
  { icon: ArrowLeftRight, label: "Yeniden Rotalama\nSüreçleri" },
  { icon: Scale,          label: "Yolcu Hakları ve\nTazminat" },
  { icon: BookOpen,       label: "Sistem Kullanım\nKılavuzları" },
]

export default function SupportPage() {
  const [topic, setTopic] = useState("Sistem Hatası")
  const [showDrop, setShowDrop] = useState(false)

  const topics = ["Sistem Hatası", "Giriş Problemi", "Veri Tutarsızlığı", "Diğer"]

  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0c0e1a 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
        <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">Destek ve Teknik İletişim Paneli</h1>

        <div className="flex-1 grid grid-cols-3 gap-5 min-h-0">

          {/* Teknik Destek Formu */}
          <div className="rounded-xl p-5 flex flex-col gap-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold">Teknik Destek Formu</h3>

            <div>
              <label className="text-white/50 text-xs mb-1.5 block">Konu</label>
              <div className="relative">
                <button
                  onClick={() => setShowDrop(!showDrop)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-white/80 text-sm"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {topic}
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>
                {showDrop && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-10"
                    style={{ background: "#1a1f30", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {topics.map(t => (
                      <button key={t} onClick={() => { setTopic(t); setShowDrop(false) }}
                        className="w-full text-left px-3 py-2.5 text-white/70 text-sm hover:bg-white/5 transition-colors">
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <textarea
                placeholder="Mesaj"
                className="w-full h-full min-h-[120px] px-3 py-2.5 rounded-lg text-white/70 text-sm resize-none outline-none placeholder-white/30"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>

            <div>
              <label className="text-white/50 text-xs mb-1.5 block">Ek Dosya</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg text-white/30 text-sm"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  &nbsp;
                </div>
                <button className="p-2 rounded-lg hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Search className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>

            <button className="w-full py-3 rounded-lg text-white font-semibold text-sm"
              style={{ background: "#C8102E" }}>
              Gönder
            </button>
          </div>

          {/* Hızlı Aramalar */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-5 flex flex-col gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold">Hızlı Aramalar</h3>
              {QUICK_CALLS.map((c) => (
                <div key={c.label} className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${c.urgent ? "bg-[#C8102E]/20" : "bg-white/10"}`}>
                    <Phone className={`w-4 h-4 ${c.urgent ? "text-[#E82040]" : "text-white/50"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/60 text-xs">{c.label}</p>
                    <p className="text-white/90 text-sm font-semibold">{c.number}</p>
                  </div>
                  {c.urgent && (
                    <div className="w-2 h-2 rounded-full bg-[#E82040]" />
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-xl p-5 flex flex-col gap-3 flex-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold">Hızlı Aramalar</h3>
              {QUICK_CALLS.slice(0, 2).map((c) => (
                <div key={c.label} className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="w-8 h-8 rounded-full bg-[#C8102E]/20 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-[#E82040]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/60 text-xs">{c.label}</p>
                    <p className="text-white/90 text-sm font-semibold">{c.number}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#E82040]" />
                </div>
              ))}
            </div>
          </div>

          {/* Yardım Merkezi */}
          <div className="rounded-xl p-5 flex flex-col gap-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold">Yardım Merkezi</h3>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Search className="w-4 h-4 text-white/30 shrink-0" />
              <input placeholder="Sorularınız için arayın..."
                className="bg-transparent text-white/60 text-sm outline-none placeholder-white/30 flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-3 flex-1">
              {HELP_LINKS.map(({ icon: Icon, label }) => (
                <button key={label}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors text-center group"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.06)" }}>
                    <Icon className="w-5 h-5 text-white/60 group-hover:text-white/90 transition-colors" />
                  </div>
                  <span className="text-white/60 text-xs leading-tight group-hover:text-white/80 transition-colors whitespace-pre-line">
                    {label}
                  </span>
                  <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Canlı Destek FAB */}
        <div className="fixed bottom-8 right-8">
          <button className="flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold shadow-xl"
            style={{ background: "#C8102E", boxShadow: "0 8px 24px rgba(200,16,46,0.4)" }}>
            <MessageCircle className="w-5 h-5" />
            Canlı Destek
          </button>
        </div>
      </div>
    </div>
  )
}
