"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { AlertTriangle, Snowflake, Users, Target, Zap, HelpCircle, ArrowRight, TrendingUp, Brain } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const CRISIS_PREDICTIONS = [
  { city: "Londra",    event: "Fırtına Uyarısı",      pct: 85, icon: "alert",   color: "#E82040" },
  { city: "İstanbul",  event: "Yoğun Kar Yağışı",     pct: 70, icon: "snow",    color: "#60a5fa" },
  { city: "Frankfurt", event: "Sis — Görüş Kısıtı",   pct: 55, icon: "alert",   color: "#f59e0b" },
  { city: "Moskova",   event: "Dondurucu Fırtına",     pct: 78, icon: "snow",    color: "#a78bfa" },
  { city: "New York",  event: "Türbülans Riski",       pct: 62, icon: "alert",   color: "#f59e0b" },
  { city: "Berlin",    event: "Pist Bakım Gecikmesi",  pct: 45, icon: "alert",   color: "#E82040" },
]

const DECISION_CRITERIA = [
  { label: "Kapasite Kısıtları",    desc: "Mevcut uçuşlarda koltuk/kargo analizi",          color: "#E82040", num: "01" },
  { label: "Sadakat Seviyesi",      desc: "Elite Plus → Business → Economy önceliği",       color: "#f59e0b", num: "02" },
  { label: "ACT / MCT Hesabı",      desc: "Aktüel vs Minimum Connection Time kontrolü",     color: "#60a5fa", num: "03" },
  { label: "Passenger Care",        desc: "Catering, otel ve transfer kaynak yönetimi",     color: "#10b981", num: "04" },
  { label: "Maliyet / Gelir",       desc: "Müşteri değeri vs operasyon maliyeti dengesi",   color: "#a78bfa", num: "05" },
  { label: "Hub Yoğunluğu",        desc: "Merkez havalimanı slot ve bant durumu",           color: "#f472b6", num: "06" },
]

const HMW_QUADRANTS = [
  { q: "KİM?",   text: "IRROPS krizinde etkilenen yolcular, PCC operatörleri ve IOCC koordinatörleri",          color: "#E82040" },
  { q: "NE?",    text: "Yolcu dağıtımı, transfer ve passenger care operasyonlarını hızlı ve verimli yönetmek", color: "#f59e0b" },
  { q: "NEDEN?", text: "Gecikme ve iptallerde yolcu memnuniyeti düşüyor, manuel süreçler hata üretiyor",        color: "#60a5fa" },
  { q: "NASIL?", text: "Veri destekli, kural bazlı öneriler sunan AI karar destek sistemi geliştirerek",        color: "#10b981" },
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
        <text x="58" y="65" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="system-ui">{value}</text>
      </svg>
      <p className="text-white/50 text-xs text-center">{label}</p>
    </div>
  )
}

const TOOLTIP_STYLE = { background: "#0f1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 11 }

const actData  = [{ t: "12:00", v: 30 }, { t: "15:00", v: 55 }, { t: "18:00", v: 70 }, { t: "21:00", v: 95 }]
const riskData = [{ t: "12:00", v: 20 }, { t: "15:00", v: 50 }, { t: "18:00", v: 80 }, { t: "21:00", v: 85 }]

interface AiStats { riskScore: number; actScore: number; passengersAtRisk: number }
const FALLBACK: AiStats = { riskScore: 92, actScore: 78, passengersAtRisk: 435 }

const CARD = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }

export default function AiAnalyticsPage() {
  const [aiStats, setAiStats] = useState<AiStats>(FALLBACK)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const token = typeof window !== "undefined" ? localStorage.getItem("jetnexus_token") || "" : ""
    fetch(`${url}/api/v1/predictions/risk-scores`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.risk_score !== undefined) {
          setAiStats({ riskScore: d.risk_score, actScore: d.act_score ?? FALLBACK.actScore, passengersAtRisk: d.passengers_at_risk ?? FALLBACK.passengersAtRisk })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.12) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
        <div className="flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Yapay Zeka Analizleri Paneli</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)" }}>
            <Brain className="w-3.5 h-3.5 text-[#a855f7]" />
            <span className="text-[#a855f7] text-xs font-bold">SkyWise AI · Aktif</span>
          </div>
        </div>

        {/* Row 1: Existing analytics */}
        <div className="grid grid-cols-3 gap-4 min-h-0" style={{ flex: "0 0 48%" }}>

          {/* Kriz Tahminleri */}
          <div className="rounded-xl p-4 flex flex-col overflow-hidden" style={CARD}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
              <h3 className="text-white font-semibold text-sm">Kriz Tahminleri</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1">
              {CRISIS_PREDICTIONS.map((p, i) => (
                <div key={i} className="p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {p.icon === "alert"
                      ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: p.color }} />
                      : <Snowflake     className="w-3.5 h-3.5 shrink-0" style={{ color: p.color }} />}
                    <span className="text-white/90 text-xs font-semibold">{p.city}</span>
                  </div>
                  <p className="text-white/50 text-[10px] leading-tight mb-1">{p.event}</p>
                  <p className="text-xs font-semibold" style={{ color: p.color }}>%{p.pct} Olasılık</p>
                  <div className="h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Önceliklendirme + Aksiyonlar */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-4 flex-1 overflow-hidden" style={CARD}>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-[#E82040]" />
                <h3 className="text-white font-semibold text-sm">Akıllı Yolcu Önceliklendirme</h3>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Elite Plus",              count: "150 Yolcu", pct: 75, color: "#E82040"  },
                  { label: "Business",                count: "200 Yolcu", pct: 90, color: "#f59e0b"  },
                  { label: "Kısa Bağlantılı",         count: "85 Yolcu",  pct: 45, color: "#60a5fa"  },
                ].map(p => (
                  <div key={p.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-white/70 text-xs flex-1">{p.label}</span>
                      <span className="text-xs font-semibold" style={{ color: p.color }}>{p.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color, boxShadow: `0 0 6px ${p.color}60` }} />
                    </div>
                  </div>
                ))}
                <div className="mt-1 p-2 rounded-lg text-center" style={{ background: "rgba(200,16,46,0.08)", border: "1px solid rgba(200,16,46,0.2)" }}>
                  <p className="text-[#E82040] text-xs font-semibold">{aiStats.passengersAtRisk} Yolcu Risk Altında</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-4" style={CARD}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#E82040]" />
                <h3 className="text-white font-semibold text-sm">Önerilen Aksiyonlar</h3>
              </div>
              <div className="flex flex-col gap-2">
                {["Otel Rezervasyonu Başlat", "Yedek Uçak Ata", "Yolcu İletişimi Gönder"].map(a => (
                  <button key={a} className="w-full py-2 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    style={{ background: "#C8102E" }}>
                    {a} <ArrowRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Skorları */}
          <div className="rounded-xl p-4 flex flex-col gap-3 overflow-hidden" style={CARD}>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#E82040]" />
              <h3 className="text-white font-semibold text-sm">Operasyonel Risk Skorları</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <GaugeMeter value={aiStats.actScore}  label="ACT Skoru"   color="rgba(255,255,255,0.6)" />
              <GaugeMeter value={aiStats.riskScore} label="Risk Skoru"  color="#E82040"              />
            </div>
            <div>
              <p className="text-white/40 text-[10px] mb-1">ACT Trendi</p>
              <div style={{ height: 70 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={actData}>
                    <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0,100]} hide />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="v" stroke="#60a5fa" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-[10px]">Risk Trendi</p>
                <span className="text-[#E82040] text-[10px] font-bold">● Kritik</span>
              </div>
              <div style={{ height: 70 }}>
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

        {/* Row 2: PDF Content — IRROPS Bağlam + Karar Kriterleri + HMW Canvas */}
        <div className="grid grid-cols-3 gap-4 min-h-0 flex-1">

          {/* IRROPS Operasyonel Bağlam */}
          <div className="rounded-xl p-4 flex flex-col overflow-hidden" style={CARD}>
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-[#60a5fa]" />
              <h3 className="text-white font-semibold text-sm">IRROPS Operasyonel Bağlam</h3>
            </div>
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
              <div className="p-3 rounded-xl" style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)" }}>
                <p className="text-[#60a5fa] text-[10px] font-bold uppercase tracking-wide mb-1">IRROPS Nedir?</p>
                <p className="text-white/60 text-xs leading-relaxed">
                  Irregular Operations — hava koşulları, teknik arıza veya operasyonel nedenlerle planlı uçuş programının dışına çıkılan durumlar.
                </p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "rgba(232,32,64,0.08)", border: "1px solid rgba(232,32,64,0.2)" }}>
                <p className="text-[#E82040] text-[10px] font-bold uppercase tracking-wide mb-1">Etkileri</p>
                <ul className="text-white/55 text-xs space-y-1 leading-relaxed">
                  <li>• Yolcu bekleme ve memnuniyet kaybı</li>
                  <li>• Ekip ve uçak rotasyonu bozulması</li>
                  <li>• Tazminat ve EU261 yükümlülükleri</li>
                  <li>• Bagaj kayıp / hasar riski</li>
                </ul>
              </div>
              <div className="p-3 rounded-xl flex-1" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <p className="text-[#10b981] text-[10px] font-bold uppercase tracking-wide mb-2">Challenge Statement</p>
                <p className="text-white/55 text-[10px] leading-relaxed italic">
                  &ldquo;IRROPS süreçlerinde yolcu dağıtımı, transfer yönetimi ve passenger care operasyonlarını daha hızlı ve verimli yönetebilmek için, veri destekli ve kural bazlı öneriler sunan bir karar destek sistemini nasıl geliştirebiliriz?&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Karar Kriterleri */}
          <div className="rounded-xl p-4 flex flex-col overflow-hidden" style={CARD}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#f59e0b]" />
              <h3 className="text-white font-semibold text-sm">Karar Kriterleri</h3>
              <span className="ml-auto text-[10px] text-white/30">PDF · 6 Kriter</span>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto">
              {DECISION_CRITERIA.map(c => (
                <div key={c.num} className="p-3 rounded-xl flex flex-col gap-1"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${c.color}22` }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-black" style={{ color: c.color }}>{c.num}</span>
                    <span className="text-white/80 text-[10px] font-semibold leading-tight">{c.label}</span>
                  </div>
                  <p className="text-white/40 text-[9px] leading-tight">{c.desc}</p>
                  <div className="mt-auto">
                    <div className="h-0.5 rounded-full" style={{ background: `${c.color}30` }}>
                      <div className="h-full rounded-full" style={{ width: "60%", background: c.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How Might We Canvas */}
          <div className="rounded-xl p-4 flex flex-col overflow-hidden" style={CARD}>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-[#a855f7]" />
              <h3 className="text-white font-semibold text-sm">How Might We Canvas</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              {HMW_QUADRANTS.map(q => (
                <div key={q.q} className="p-3 rounded-xl flex flex-col"
                  style={{ background: `${q.color}08`, border: `1px solid ${q.color}25` }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: `${q.color}20` }}>
                      <span className="text-[8px] font-black" style={{ color: q.color }}>{q.q[0]}</span>
                    </div>
                    <span className="text-[10px] font-black" style={{ color: q.color }}>{q.q}</span>
                  </div>
                  <p className="text-white/55 text-[10px] leading-relaxed flex-1">{q.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)" }}>
              <p className="text-[#a855f7] text-[9px] font-bold uppercase tracking-wide mb-1">SkyWise AI Sistemi</p>
              <p className="text-white/45 text-[10px] leading-relaxed">
                Bu canvas&apos;tan doğan karar destek sistemi — JetNexus AI platformuna entegre olarak çalışmaktadır.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
