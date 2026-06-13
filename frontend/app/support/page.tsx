"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Phone, Search, Plane, ArrowLeftRight, Scale, BookOpen, MessageCircle, ChevronDown, Headphones, Clock, CheckCircle } from "lucide-react"

const QUICK_CALLS = [
  { label: "Acil Durum Hattı",  number: "555-1234", desc: "7/24 aktif",         urgent: true  },
  { label: "IRROPS Masası",     number: "555-5678", desc: "Operasyon desteği",  urgent: true  },
  { label: "BT Destek",         number: "555-9012", desc: "Teknik sorunlar",    urgent: false },
  { label: "Yolcu Hizmetleri",  number: "555-3456", desc: "PCC koordinasyon",   urgent: false },
]

const HELP_LINKS = [
  { icon: Plane,          label: "Uçuş İptalleri ve Gecikmeler",  color: "#E82040" },
  { icon: ArrowLeftRight, label: "Yeniden Rotalama Süreçleri",    color: "#f59e0b" },
  { icon: Scale,          label: "Yolcu Hakları ve Tazminat",     color: "#10b981" },
  { icon: BookOpen,       label: "Sistem Kullanım Kılavuzları",   color: "#60a5fa" },
]

const TICKETS = [
  { id: "#4821", title: "IOCC Ekranı Hataları",     status: "Çözüldü",   time: "2s önce",   color: "#10b981" },
  { id: "#4820", title: "Giriş Problemi — PCC",     status: "İşleniyor", time: "15d önce",  color: "#f59e0b" },
  { id: "#4819", title: "Veri Yükleme Gecikmesi",   status: "Açık",      time: "1s önce",   color: "#E82040" },
]

export default function SupportPage() {
  const [topic, setTopic] = useState("Sistem Hatası")
  const [showDrop, setShowDrop] = useState(false)
  const [message, setMessage] = useState("")

  const topics = ["Sistem Hatası", "Giriş Problemi", "Veri Tutarsızlığı", "IRROPS Modülü", "Diğer"]

  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.10) 0%, transparent 55%), linear-gradient(135deg, #0c0e1a 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
        <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">Destek ve Teknik İletişim Paneli</h1>

        <div className="flex-1 grid grid-cols-3 gap-5 min-h-0">

          {/* Teknik Destek Formu */}
          <div className="rounded-xl p-5 flex flex-col gap-4 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2.5 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(200,16,46,0.15)" }}>
                <Headphones className="w-3.5 h-3.5 text-[#E82040]" />
              </div>
              <h3 className="text-white font-semibold text-sm">Teknik Destek Formu</h3>
            </div>

            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Konu Seç</label>
              <div className="relative">
                <button onClick={() => setShowDrop(!showDrop)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-white/80 text-sm"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  {topic}
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>
                {showDrop && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-20"
                    style={{ background: "#151826", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                    {topics.map(t => (
                      <button key={t} onClick={() => { setTopic(t); setShowDrop(false) }}
                        className="w-full text-left px-3.5 py-2.5 text-sm transition-colors hover:bg-white/5"
                        style={{ color: t === topic ? "#E82040" : "rgba(255,255,255,0.7)" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-white/40 text-xs mb-1.5 block">Mesajınız</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Sorununuzu detaylı açıklayın..."
                className="flex-1 min-h-[100px] px-3.5 py-2.5 rounded-lg text-white/70 text-sm resize-none outline-none placeholder-white/25"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }} />
            </div>

            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Ek Dosya (İsteğe Bağlı)</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid dashed rgba(255,255,255,0.1)" }}>
                <Search className="w-4 h-4 text-white/30" />
                <span className="text-white/30 text-sm">Dosya seç veya sürükle</span>
              </div>
            </div>

            <button className="w-full py-2.5 rounded-lg text-white font-semibold text-sm"
              style={{ background: "#C8102E", boxShadow: "0 4px 12px rgba(200,16,46,0.3)" }}>
              Talebi Gönder
            </button>

            {/* Son Talepler */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-3">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Son Taleplerim</p>
              {TICKETS.map(t => (
                <div key={t.id} className="flex items-center gap-2 py-1.5">
                  <span className="text-white/30 text-xs w-12 shrink-0">{t.id}</span>
                  <span className="text-white/60 text-xs flex-1 truncate">{t.title}</span>
                  <span className="text-[10px] font-semibold shrink-0" style={{ color: t.color }}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hızlı Aramalar */}
          <div className="flex flex-col gap-5">
            <div className="rounded-xl p-5 flex flex-col gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-[#E82040]" />
                <h3 className="text-white font-semibold text-sm">Hızlı Aramalar</h3>
              </div>
              {QUICK_CALLS.map((c) => (
                <div key={c.label}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${c.urgent ? "rgba(200,16,46,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0`}
                    style={{ background: c.urgent ? "rgba(200,16,46,0.15)" : "rgba(255,255,255,0.07)" }}>
                    <Phone className="w-4 h-4" style={{ color: c.urgent ? "#E82040" : "rgba(255,255,255,0.4)" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/80 text-sm font-medium">{c.label}</p>
                    <p className="text-white/40 text-xs">{c.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/90 text-sm font-bold">{c.number}</p>
                    {c.urgent && <div className="w-2 h-2 rounded-full bg-[#E82040] ml-auto mt-0.5" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Durum */}
            <div className="rounded-xl p-5 flex flex-col gap-3 flex-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold text-sm">Sistem Durumu</h3>
              {[
                { label: "IOCC Modülü",       status: "Aktif",   ok: true  },
                { label: "PCC Sistemi",        status: "Aktif",   ok: true  },
                { label: "AI Motoru",          status: "Aktif",   ok: true  },
                { label: "Bildirim Servisi",   status: "Yavaş",  ok: false },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">{s.label}</span>
                  <div className="flex items-center gap-1.5">
                    {s.ok
                      ? <CheckCircle className="w-3.5 h-3.5 text-[#10b981]" />
                      : <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />}
                    <span className="text-xs font-semibold" style={{ color: s.ok ? "#10b981" : "#f59e0b" }}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Yardım Merkezi */}
          <div className="rounded-xl p-5 flex flex-col gap-4 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold text-sm">Yardım Merkezi</h3>

            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <Search className="w-4 h-4 text-white/30 shrink-0" />
              <input placeholder="Soru veya konu arayın..."
                className="bg-transparent text-white/60 text-sm outline-none placeholder-white/25 flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-3 flex-1">
              {HELP_LINKS.map(({ icon: Icon, label, color }) => (
                <button key={label}
                  className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-all group text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
                    style={{ background: `${color}15` }}>
                    <Icon className="w-5 h-5 transition-colors" style={{ color }} />
                  </div>
                  <span className="text-white/60 text-xs leading-snug group-hover:text-white/85 transition-colors">
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* SSS */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-3">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Sık Sorulan Sorular</p>
              {[
                "IRROPS krizi nasıl başlatılır?",
                "Yolcu önceliği nasıl ayarlanır?",
                "EU261 tazminat hesabı nerede?",
              ].map(q => (
                <div key={q} className="flex items-center gap-2 py-2 cursor-pointer hover:text-white/70 transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-white/40 text-xs flex-1">{q}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/20 -rotate-90 shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Canlı Destek FAB */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold"
          style={{ background: "#C8102E", boxShadow: "0 8px 32px rgba(200,16,46,0.5)" }}>
          <MessageCircle className="w-5 h-5" />
          Canlı Destek
        </button>
      </div>
    </div>
  )
}
