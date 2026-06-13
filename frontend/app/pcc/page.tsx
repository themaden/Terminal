"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { AlertCircle, Search, Users, CheckCircle, Clock, Filter } from "lucide-react"

const PASSENGERS = [
  { name: "Ahmet Yılmaz",  status: "Elite Plus", flight: "TK 1234", act: "0s 45d", resource: "Otel (Hilton)",    critical: true,  tier: 1 },
  { name: "Ayşe Demir",    status: "Business",   flight: "TK 5678", act: "1s 30d", resource: "Kupon (50 EUR)",   critical: false, tier: 2 },
  { name: "Mehmet Kara",   status: "Classic",    flight: "TK 9012", act: "0s 30d", resource: "Otel (Ibis)",      critical: true,  tier: 4 },
  { name: "Zeynep Çelik",  status: "Elite",      flight: "TK 3456", act: "2s 15d", resource: "Kupon (100 EUR)",  critical: false, tier: 2 },
  { name: "Ali Demir",     status: "Business",   flight: "TK 5678", act: "0s 30d", resource: "Kupon (50 EUR)",   critical: false, tier: 2 },
  { name: "Selin Kaya",    status: "Business",   flight: "TK 5678", act: "1s 30d", resource: "Kupon (50 EUR)",   critical: false, tier: 2 },
  { name: "Emre Yıldız",   status: "Elite Plus", flight: "TK 9012", act: "0s 30d", resource: "Kupon (50 EUR)",   critical: true,  tier: 1 },
  { name: "Leyla Şahin",   status: "Elite",      flight: "TK 3456", act: "2s 15d", resource: "Kupon (100 EUR)",  critical: false, tier: 2 },
  { name: "Can Arslan",    status: "Classic",    flight: "TK 1234", act: "3s 00d", resource: "Bekliyor",         critical: true,  tier: 4 },
  { name: "Naz Öztürk",   status: "Business",   flight: "TK 2340", act: "1s 05d", resource: "Otel (Marriott)",  critical: false, tier: 2 },
]

const STATS = [
  { label: "Toplam Yolcu",     value: "245", icon: Users,        color: "white",   bg: "rgba(255,255,255,0.05)" },
  { label: "Kurtarıldı",       value: "180", icon: CheckCircle,  color: "#10b981", bg: "rgba(16,185,129,0.08)" },
  { label: "Bekleyen",         value: "65",  icon: Clock,        color: "#f59e0b", bg: "rgba(245,158,11,0.08)"  },
  { label: "Kritik (ACT<1s)",  value: "15",  icon: AlertCircle,  color: "#E82040", bg: "rgba(232,32,64,0.08)"   },
]

const STATUS_COLOR: Record<string, string> = {
  "Elite Plus": "#E82040",
  "Elite":      "#f59e0b",
  "Business":   "#60a5fa",
  "Classic":    "rgba(255,255,255,0.5)",
}

const TIER_LABEL: Record<number, string> = {
  1: "Tier 1", 2: "Tier 2", 3: "Tier 3", 4: "Tier 4"
}
const TIER_COLOR: Record<number, string> = {
  1: "#E82040", 2: "#f59e0b", 3: "#60a5fa", 4: "rgba(255,255,255,0.4)"
}

export default function PassengerListPage() {
  const [search, setSearch] = useState("")

  const filtered = PASSENGERS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.flight.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.10) 0%, transparent 55%), linear-gradient(135deg, #0c0e1a 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
        <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">Yolcu Takip ve Yönetim Listesi</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 shrink-0">
          {STATS.map(s => {
            const SIcon = s.icon
            return (
              <div key={s.label} className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: s.bg, border: `1px solid ${s.color}25` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${s.color}15` }}>
                  <SIcon className="w-4.5 h-4.5" style={{ width: 18, height: 18, color: s.color }} />
                </div>
                <div>
                  <p className="text-white/50 text-xs">{s.label}</p>
                  <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <Search className="w-4 h-4 text-white/40 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Yolcu adı veya uçuş numarası..."
              className="bg-transparent text-white/80 text-sm outline-none placeholder-white/30 flex-1" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/60 text-sm"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <Filter className="w-4 h-4" />
            Filtrele
            <ChevronDownIcon />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 rounded-xl overflow-auto"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <table className="w-full">
            <thead className="sticky top-0"
              style={{ background: "rgba(10,12,22,0.98)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <tr>
                {["Ad Soyad", "Sadakat", "Öncelik", "Bağlantı Uçuşu", "ACT", "Atanan Kaynak", "Durum"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={i} className="hover:bg-white/[0.025] transition-colors cursor-pointer"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: `${STATUS_COLOR[p.status] ?? "#fff"}20`, color: STATUS_COLOR[p.status] ?? "white" }}>
                        {p.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-white/90 text-sm font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold" style={{ color: STATUS_COLOR[p.status] ?? "white" }}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: `${TIER_COLOR[p.tier]}20`, color: TIER_COLOR[p.tier], border: `1px solid ${TIER_COLOR[p.tier]}40` }}>
                      {TIER_LABEL[p.tier]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-white/70 text-sm font-medium">{p.flight}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-semibold ${p.critical ? "text-[#E82040]" : "text-white/70"}`}>{p.act}</span>
                      {p.critical && <AlertCircle className="w-3.5 h-3.5 text-[#E82040]" />}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-white/60 text-sm">{p.resource}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={p.critical
                        ? { background: "rgba(232,32,64,0.15)", color: "#E82040", border: "1px solid rgba(232,32,64,0.3)" }
                        : { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                      {p.critical ? "Kritik" : "İşleniyor"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
