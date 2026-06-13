"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Search, ChevronDown, Calendar, CheckCircle, AlertCircle, XCircle, Plane, Clock } from "lucide-react"

const FLIGHTS = [
  { no: "TK 1024", dep: "IST", arr: "CDG", planned: "10:30", actual: "10:45", delay: "+15d", type: "A350-900", risk: "ok",   status: "Kalkış Yaptı"  },
  { no: "TK 1902", dep: "SAW", arr: "FCO", planned: "12:00", actual: "12:30", delay: "+30d", type: "B737-800", risk: "warn", status: "Gecikti"       },
  { no: "TK 2340", dep: "IST", arr: "JFK", planned: "14:00", actual: "15:15", delay: "+75d", type: "B787-9",   risk: "crit", status: "Aksama Var"    },
  { no: "TK 0880", dep: "IST", arr: "LHR", planned: "08:15", actual: "08:15", delay: "—",    type: "A320neo", risk: "ok",   status: "Zamanında"     },
  { no: "TK 3301", dep: "IST", arr: "DXB", planned: "16:45", actual: "17:20", delay: "+35d", type: "B777-300", risk: "warn", status: "Gecikti"       },
  { no: "TK 0056", dep: "IST", arr: "SIN", planned: "23:00", actual: "23:00", delay: "—",    type: "B787-9",   risk: "ok",   status: "Planlandı"    },
  { no: "TK 1555", dep: "SAW", arr: "BER", planned: "09:30", actual: "11:45", delay: "+135d",type: "A321",    risk: "crit", status: "Aksama Var"    },
  { no: "TK 0099", dep: "IST", arr: "NRT", planned: "01:20", actual: "01:20", delay: "—",    type: "B777-300", risk: "ok",   status: "Planlandı"    },
]

const RISK_CONFIG = {
  ok:   { icon: CheckCircle, color: "#10b981", label: "Normal"  },
  warn: { icon: AlertCircle, color: "#f59e0b", label: "Gecikme" },
  crit: { icon: XCircle,     color: "#E82040", label: "Aksama"  },
}

const STAT_CARDS = [
  { label: "Toplam Uçuş",  value: "248",  color: "white"   },
  { label: "Zamanında",    value: "189",  color: "#10b981" },
  { label: "Geciken",      value: "43",   color: "#f59e0b" },
  { label: "Aksama Var",   value: "16",   color: "#E82040" },
]

export default function FlightsPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("Tümü")

  const filtered = FLIGHTS.filter(f => {
    const matchSearch = f.no.toLowerCase().includes(search.toLowerCase()) ||
      f.dep.toLowerCase().includes(search.toLowerCase()) ||
      f.arr.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "Tümü" ||
      (filter === "Aksama" && f.risk === "crit") ||
      (filter === "Gecikme" && f.risk === "warn") ||
      (filter === "Normal" && f.risk === "ok")
    return matchSearch && matchFilter
  })

  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.10) 0%, transparent 55%), linear-gradient(135deg, #0c0e1a 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
        <div className="flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-bold text-white tracking-tight">Uçuş Takip ve Yönetim Paneli</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(232,32,64,0.15)", border: "1px solid rgba(232,32,64,0.3)" }}>
            <span className="w-2 h-2 rounded-full bg-[#E82040] animate-pulse-live" />
            <span className="text-[#E82040] text-xs font-bold tracking-widest">Canlı</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 shrink-0">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Plane className="w-5 h-5 text-white/30 shrink-0" />
              <div>
                <p className="text-white/50 text-xs">{s.label}</p>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <Search className="w-4 h-4 text-white/40 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Uçuş no, kalkış veya varış havalimanı..."
              className="bg-transparent text-white/80 text-sm outline-none placeholder-white/30 flex-1" />
          </div>
          {["Tümü", "Normal", "Gecikme", "Aksama"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: filter === f ? "rgba(200,16,46,0.2)" : "rgba(255,255,255,0.05)",
                border: filter === f ? "1px solid rgba(200,16,46,0.4)" : "1px solid rgba(255,255,255,0.09)",
                color: filter === f ? "#E82040" : "rgba(255,255,255,0.6)",
              }}>
              {f}
            </button>
          ))}
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/60 text-sm"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <Calendar className="w-4 h-4" />
            Tarih
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                {["Uçuş No", "Güzergah", "Planlanan", "Gerçekleşen", "Gecikme", "Uçak", "Durum", "Risk"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => {
                const rc = RISK_CONFIG[f.risk as keyof typeof RISK_CONFIG]
                const RIcon = rc.icon
                return (
                  <tr key={i} className="group hover:bg-white/[0.025] transition-colors cursor-pointer"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-5 py-3.5">
                      <span className="text-white font-semibold text-sm">{f.no}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-white/90 text-sm font-medium">{f.dep}</span>
                        <Plane className="w-3 h-3 text-white/30" />
                        <span className="text-white/90 text-sm font-medium">{f.arr}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-white/60 text-sm">{f.planned}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-white/60 text-sm">{f.actual}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold" style={{ color: f.delay === "—" ? "rgba(255,255,255,0.4)" : rc.color }}>
                        {f.delay}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-white/50 text-sm">{f.type}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: `${rc.color}20`, color: rc.color, border: `1px solid ${rc.color}40` }}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <RIcon className="w-4 h-4" style={{ color: rc.color }} />
                        <span className="text-xs" style={{ color: rc.color }}>{rc.label}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
