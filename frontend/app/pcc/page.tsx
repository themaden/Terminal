"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { AlertCircle } from "lucide-react"

const PASSENGERS = [
  { name: "Ahmet Yılmaz",    status: "Elite Plus", flight: "TK 1234", act: "0h 45m", resource: "Otel (Hilton)", critical: true,  statusColor: "#E82040" },
  { name: "Ayşe Demir",      status: "Business",   flight: "TK 5678", act: "1h 30m", resource: "Kupon (50 EUR)",  critical: false, statusColor: "#E82040" },
  { name: "Mehmet Kara",     status: "Classic",    flight: "TK 9012", act: "0h 30m", resource: "Otel (Ibis)",    critical: true,  statusColor: "white" },
  { name: "Zeynep Çelik",    status: "Elite",      flight: "TK 3456", act: "2h 15m", resource: "Kupon (100 EUR)", critical: false, statusColor: "white" },
  { name: "Alton Devin",     status: "Business",   flight: "TK 5678", act: "0h 30m", resource: "Kupon (50 EUR)", critical: false, statusColor: "#E82040" },
  { name: "Surom to Mönt",   status: "Business",   flight: "TK 5678", act: "1h 30m", resource: "Kupon (50 EUR)", critical: false, statusColor: "white" },
  { name: "Mehmet Kara",     status: "Elite Plus", flight: "TK 9012", act: "0h 30m", resource: "Kupon (50 EUR)", critical: true,  statusColor: "#E82040" },
  { name: "Zeynep Çelik",    status: "Elite",      flight: "TK 3456", act: "2h 15m", resource: "Kupon (100 EUR)", critical: false, statusColor: "white" },
]

const STATS = [
  { label: "Toplam Yolcu", value: "245", red: false },
  { label: "Kurtarılan",   value: "180", red: false },
  { label: "Bekleyen",     value: "65",  red: true  },
  { label: "Kritik (ACT < 1s)", value: "15", red: true },
]

export default function PassengerListPage() {
  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0c0e1a 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
        <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">Yolcu Takip ve Yönetim Listesi</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 shrink-0">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${s.red ? "rgba(232,32,64,0.3)" : "rgba(255,255,255,0.08)"}` }}>
              <p className="text-white/60 text-xs mb-1">{s.label}</p>
              <p className={`text-3xl font-black ${s.red ? "text-[#E82040]" : "text-white"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Ad-Soyad", "Sadakat Statüsü", "Bağlantılı Uçuş No", "ACT (Bağlantı Süresi)", "Atanan Kaynak (Otel/Kupon)"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-white/50 text-xs font-semibold uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PASSENGERS.map((p, i) => (
                <tr key={i}
                  className="transition-colors hover:bg-white/[0.02] cursor-pointer"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td className="px-5 py-3.5 text-white/90 text-sm">{p.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold" style={{ color: p.statusColor }}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-white/70 text-sm">{p.flight}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${p.critical ? "text-[#E82040]" : "text-white/70"}`}>{p.act}</span>
                      {p.critical && <AlertCircle className="w-3.5 h-3.5 text-[#E82040]" />}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-white/70 text-sm">{p.resource}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
