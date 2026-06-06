"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { hubApi, type HubSummary, type Flight } from "@/lib/api"
import {
  GitBranch, AlertTriangle, CheckCircle, Clock,
  Plane, RefreshCw, TrendingDown, Users, Timer,
} from "lucide-react"

const MOCK_SUMMARY: HubSummary = {
  at_risk_connections: 34,
  missed_connections: 8,
  avg_connection_time_minutes: 52,
  protected_count: 189,
}

const MOCK_FLIGHTS: Flight[] = [
  { id: "1", flight_number: "TK1981", origin: "IST", destination: "LHR", scheduled_departure: new Date(Date.now() + 3600000).toISOString(), scheduled_arrival: new Date(Date.now() + 7200000).toISOString(), status: "SCHEDULED", available_seats: 42, aircraft_type: "Boeing 777" },
  { id: "2", flight_number: "TK1821", origin: "IST", destination: "CDG", scheduled_departure: new Date(Date.now() + 5400000).toISOString(), scheduled_arrival: new Date(Date.now() + 9000000).toISOString(), status: "SCHEDULED", available_seats: 18, aircraft_type: "Airbus A330" },
  { id: "3", flight_number: "TK2045", origin: "IST", destination: "JFK", scheduled_departure: new Date(Date.now() + 7200000).toISOString(), scheduled_arrival: new Date(Date.now() + 18000000).toISOString(), status: "DELAYED", available_seats: 63, aircraft_type: "Boeing 777" },
  { id: "4", flight_number: "TK3312", origin: "IST", destination: "DXB", scheduled_departure: new Date(Date.now() + 1800000).toISOString(), scheduled_arrival: new Date(Date.now() + 10800000).toISOString(), status: "SCHEDULED", available_seats: 7, aircraft_type: "Airbus A321neo" },
]

const MOCK_AT_RISK = [
  { pnr: "PNR201", name: "James Carter", inbound: "BA215", outbound: "TK1981", mct: 35, available: 28, risk: "critical" },
  { pnr: "PNR202", name: "Marie Dubois", inbound: "LH441", outbound: "TK1821", mct: 45, available: 51, risk: "ok" },
  { pnr: "PNR203", name: "Yuki Tanaka", inbound: "EK507", outbound: "TK2045", mct: 60, available: 42, risk: "high" },
  { pnr: "PNR204", name: "Carlos Mendez", inbound: "TK1920", outbound: "TK3312", mct: 40, available: 25, risk: "critical" },
  { pnr: "PNR205", name: "Anna Schmidt", inbound: "AF1234", outbound: "TK1981", mct: 45, available: 55, risk: "ok" },
  { pnr: "PNR206", name: "Ali Hassan", inbound: "QR501", outbound: "TK1821", mct: 55, available: 38, risk: "high" },
]

function riskBadge(r: string) {
  const m: Record<string, string> = {
    critical: "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30",
    high: "bg-[#E81932]/20 text-[#E81932] border-[#E81932]/30",
    ok: "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30",
  }
  return m[r] ?? m.ok
}

function statusBadge(s: string) {
  const m: Record<string, string> = {
    SCHEDULED: "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30",
    DELAYED: "bg-[#E81932]/20 text-[#E81932] border-[#E81932]/30",
    CANCELLED: "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30",
  }
  return m[s] ?? m.SCHEDULED
}

export default function HubControlPage() {
  const [summary, setSummary] = useState<HubSummary>(MOCK_SUMMARY)
  const [flights, setFlights] = useState<Flight[]>(MOCK_FLIGHTS)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [s, f] = await Promise.all([hubApi.summary(), hubApi.activeFlights()])
      setSummary(s)
      if (f.length) setFlights(f)
    } catch { /* mock kalır */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData(); const id = setInterval(fetchData, 30_000); return () => clearInterval(id) }, [fetchData])

  const kpis = [
    { label: "Risk Altındaki Bağlantı", value: summary.at_risk_connections, icon: AlertTriangle, color: "text-[#E81932]", bg: "bg-[#E81932]/10 border-[#E81932]/20" },
    { label: "Kaçırılan Bağlantı", value: summary.missed_connections, icon: TrendingDown, color: "text-[#ef4444]", bg: "bg-[#ef4444]/10 border-[#ef4444]/20" },
    { label: "Ort. Bağlantı Süresi", value: `${summary.avg_connection_time_minutes}dk`, icon: Timer, color: "text-[#E81932]", bg: "bg-[#E81932]/10 border-[#E81932]/20" },
    { label: "Korunan Yolcu", value: summary.protected_count, icon: CheckCircle, color: "text-[#10b981]", bg: "bg-[#10b981]/10 border-[#10b981]/20" },
  ]

  const mockSidebar = MOCK_FLIGHTS.filter(f => f.status !== "SCHEDULED").map(f => ({
    id: f.id, code: f.flight_number, route: `${f.origin}-${f.destination}`,
    status: "ROTAR" as const, section: "Yolcular", passengers: [],
  }))

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f2f2f6]">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeDisruptions={mockSidebar} />
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Başlık */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#e5e5ed] bg-white">
            <div className="flex items-center gap-3">
              <GitBranch className="w-5 h-5 text-[#E81932]" />
              <h1 className="text-base font-bold text-[#111111]">Hub Kontrol — Aktarma Yönetimi</h1>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#e8e8f0] hover:bg-[#e2e2ec] border border-[#2c2c40] rounded-lg text-xs text-[#111111] transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Yenile
            </button>
          </div>

          <div className="flex-1 overflow-auto p-5 space-y-5">

            {/* KPI Kartları */}
            <div className="grid grid-cols-4 gap-4">
              {kpis.map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={`rounded-xl border p-4 ${bg} bg-white`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-[#888899] uppercase tracking-wider">{label}</span>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <span className={`text-2xl font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-4">

              {/* Risk Altındaki Bağlantılar */}
              <div className="col-span-3 bg-white border border-[#e5e5ed] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#e5e5ed] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#E81932]" />
                  <h2 className="text-sm font-semibold text-[#111111] uppercase tracking-wider">Risk Altındaki Bağlantılar</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#f2f2f6]">
                      <tr>
                        {["PNR", "Yolcu", "Gelen", "Giden", "MCT", "Mevcut Süre", "Durum"].map(h => (
                          <th key={h} className="text-left px-4 py-2 text-[10px] text-[#666677] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_AT_RISK.map(r => (
                        <tr key={r.pnr} className="border-b border-[#e5e5ed]/50 hover:bg-[#e8e8f0]/30 transition-colors">
                          <td className="px-4 py-3 text-[#E81932] font-mono">{r.pnr}</td>
                          <td className="px-4 py-3 text-[#111111] font-medium">{r.name}</td>
                          <td className="px-4 py-3 text-[#888899]">{r.inbound}</td>
                          <td className="px-4 py-3 text-[#888899]">{r.outbound}</td>
                          <td className="px-4 py-3 text-[#666677]">{r.mct}dk</td>
                          <td className="px-4 py-3">
                            <span className={r.available < r.mct ? "text-[#ef4444]" : "text-[#10b981]"}>
                              {r.available}dk
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${riskBadge(r.risk)}`}>
                              {r.risk.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Aktif Uçuşlar */}
              <div className="col-span-2 bg-white border border-[#e5e5ed] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#e5e5ed] flex items-center gap-2">
                  <Plane className="w-4 h-4 text-[#E81932]" />
                  <h2 className="text-sm font-semibold text-[#111111] uppercase tracking-wider">Aktif Uçuşlar</h2>
                </div>
                <div className="divide-y divide-[#1e1e2a]">
                  {flights.map(f => (
                    <div key={f.id} className="px-5 py-3 hover:bg-[#e8e8f0]/30 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-[#111111]">{f.flight_number}</span>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${statusBadge(f.status)}`}>
                          {f.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#666677] mb-1">
                        <span>{f.origin}</span>
                        <span>→</span>
                        <span>{f.destination}</span>
                        <span className="ml-auto flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {f.available_seats} koltuk
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#666677]">
                        <Clock className="w-3 h-3" />
                        <span suppressHydrationWarning>{new Date(f.scheduled_departure).toISOString().slice(11, 16)}</span>
                        <span className="ml-1 text-[#666677]">• {f.aircraft_type}</span>
                      </div>
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
