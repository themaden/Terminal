"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Search, ChevronDown, Calendar, CheckCircle, AlertCircle, XCircle } from "lucide-react"

const FLIGHTS = [
  { no: "TK 1024", route: "IST / CDG", planned: "10:30 / 13:30", actual: "10:45 / 13:40", type: "A350-900", risk: "ok" },
  { no: "TK 1902", route: "SAW / FCO", planned: "12:00 / 14:30", actual: "12:30 / 15:00", type: "B737-800", risk: "warn" },
  { no: "TK 2340", route: "IST / JFK", planned: "14:00 / 19:00", actual: "15:15 / 20:15", type: "B787-9",   risk: "crit" },
  { no: "TK 1024", route: "IST / CDG", planned: "10:30 / 13:30", actual: "10:45 / 13:40", type: "A350-900", risk: "ok" },
  { no: "TK 1902", route: "SAW / FCO", planned: "12:00 / 14:30", actual: "12:30 / 15:00", type: "B737-800", risk: "warn" },
  { no: "TK 2340", route: "SAW / FCO", planned: "14:00 / 19:00", actual: "15:15 / 20:15", type: "B787-9",   risk: "crit" },
]

function RiskIcon({ risk }: { risk: string }) {
  if (risk === "ok")   return <CheckCircle  className="w-5 h-5 text-[#10b981]" />
  if (risk === "warn") return <AlertCircle  className="w-5 h-5 text-[#f59e0b]" />
  return                      <XCircle      className="w-5 h-5 text-[#E82040]" />
}

export default function FlightsPage() {
  const [search, setSearch] = useState("")

  const filtered = FLIGHTS.filter(f =>
    f.no.toLowerCase().includes(search.toLowerCase()) ||
    f.route.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0c0e1a 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
        <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">Uçuş Takip ve Yönetim Paneli</h1>

        {/* Filters */}
        <div className="rounded-xl p-4 shrink-0"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Search className="w-4 h-4 text-white/40 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Uçuş Numarası veya Havalimanı Arayın..."
                className="bg-transparent text-white/80 text-sm outline-none placeholder-white/30 flex-1"
              />
            </div>

            {/* Hub Filter */}
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/70 text-sm"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Hub Filtresi: IST/SAW
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Status Filter */}
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/70 text-sm"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Durum: Tümü
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Date */}
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/70 text-sm"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Calendar className="w-4 h-4" />
              Tarih Seçimi
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          <div className="mt-4">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Uçuş No", "Kalkış/Varış", "Planlanan/Gerçekleşen", "Uçak Tipi", "Risk Durumu"].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-white/50 text-xs font-semibold uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => (
                  <tr key={i}
                    className={`transition-colors cursor-pointer ${i === 0 ? "" : "hover:bg-white/[0.02]"}`}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      background: i === 0 ? "rgba(255,255,255,0.04)" : "transparent",
                    }}>
                    <td className="px-4 py-3.5 text-white/90 text-sm font-medium">{f.no}</td>
                    <td className="px-4 py-3.5 text-white/70 text-sm">{f.route}</td>
                    <td className="px-4 py-3.5 text-white/70 text-sm">{f.planned} - {f.actual}</td>
                    <td className="px-4 py-3.5 text-white/70 text-sm">{f.type}</td>
                    <td className="px-4 py-3.5">
                      <RiskIcon risk={f.risk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
