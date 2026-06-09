"use client"

import { useState } from "react"
import { Bus, Loader2, CheckCircle2, Navigation } from "lucide-react"
import { recoveryApi, type BusRoute } from "@/lib/api"

interface BusPassenger {
  pnr: string
  name: string
  class: string
  status: "Tamamlandi" | "Gecikti" | "Beklemede"
  targetFlight: string
}

interface BusQueueProps {
  passengers: BusPassenger[]
  tabs: { id: string; label: string; count: number }[]
  crisisId?: string
  busRoutes?: BusRoute[]
}

function statusStyle(status: string) {
  if (status === "Tamamlandi") return "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20"
  if (status === "Gecikti")    return "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20"
  return "text-[#E81932] bg-[#E81932]/10 border-[#E81932]/20"
}

function BusRouteCard({ bus, crisisId }: { bus: BusRoute; crisisId: string }) {
  const [dispatched, setDispatched] = useState(bus.status === "DISPATCHED")
  const [loading, setLoading]       = useState(false)

  async function dispatch() {
    setLoading(true)
    try {
      await recoveryApi.dispatchBus(crisisId, bus.bus_id)
      setDispatched(true)
    } finally {
      setLoading(false)
    }
  }

  const pct = Math.round((bus.assigned_passengers / bus.capacity) * 100)

  return (
    <div className={`p-2.5 rounded-lg border transition-all ${
      dispatched ? "bg-[#3b82f6]/6 border-[#3b82f6]/25" : "bg-white border-[#e8e8f0]"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            dispatched ? "bg-[#3b82f6]" : "bg-[#f0f0f8]"
          }`}>
            <Bus className={`w-3.5 h-3.5 ${dispatched ? "text-white" : "text-[#9999bb]"}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-[#111111]">{bus.bus_id}</p>
            <p className="text-[9px] text-[#9999bb] truncate">{bus.route}</p>
          </div>
        </div>
        <button
          disabled={loading || dispatched}
          onClick={dispatch}
          className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all disabled:opacity-50 ${
            dispatched
              ? "bg-[#3b82f6]/10 text-[#3b82f6]"
              : "bg-[#3b82f6] hover:bg-[#2563eb] text-white"
          }`}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : dispatched ? <CheckCircle2 className="w-3 h-3" /> : <Navigation className="w-3 h-3" />}
          {dispatched ? "Yolda" : "Sevket"}
        </button>
      </div>
      {/* Capacity bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[#e8e8f0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#3b82f6] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[9px] text-[#9999bb] shrink-0">{bus.assigned_passengers}/{bus.capacity}</span>
        {dispatched && (
          <span className="text-[9px] font-mono text-[#3b82f6] shrink-0">ETA {bus.eta_minutes}dk</span>
        )}
      </div>
    </div>
  )
}

export function BusQueueTable({ passengers, tabs, crisisId, busRoutes }: BusQueueProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "elite")
  const hasCrisisRoutes = !!crisisId && (busRoutes?.length ?? 0) > 0

  return (
    <div className="bg-[#f9f9fc] border border-[#ebebf2] rounded-xl overflow-hidden h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#ebebf2] bg-[#f4f4f8]">
        <div className="flex items-center gap-1.5">
          <Bus className="w-3.5 h-3.5 text-[#3b82f6]" />
          <h3 className="text-[10px] font-bold text-[#555566] uppercase tracking-[0.12em]">
            {hasCrisisRoutes ? "OTOBÜS SEVKİYATI" : "Transfer Otobüs Sırası"}
          </h3>
        </div>
        {hasCrisisRoutes && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[#3b82f6] text-white">
            {busRoutes!.length} ARAÇ
          </span>
        )}
      </div>

      {hasCrisisRoutes ? (
        /* ── Crisis mode: bus routes with dispatch ── */
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {busRoutes!.map((bus, i) => (
            <BusRouteCard key={i} bus={bus} crisisId={crisisId!} />
          ))}
        </div>
      ) : (
        /* ── Normal mode: tab list ── */
        <>
          <div className="flex border-b border-[#ebebf2] bg-[#ededf4]">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-2 text-[9px] font-semibold tracking-wider transition-all duration-150 border-b-2 ${
                  activeTab === tab.id
                    ? "text-[#E81932] border-[#E81932] bg-[#E81932]/5"
                    : "text-[#999aaa] border-transparent hover:text-[#666677]"
                }`}>
                {tab.label}
                <span className={`ml-1 px-1 rounded-sm text-[8px] ${activeTab === tab.id ? "bg-[#E81932]/15 text-[#E81932]" : "bg-[#eeeef4] text-[#999aaa]"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto">
            {passengers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Bus className="w-6 h-6 text-[#bbbbcc]" />
                <p className="text-[11px] text-[#999aaa]">Sırada yolcu yok</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#ededf4] sticky top-0">
                  <tr>
                    {["PNR", "İsim", "Sınıf", "Durum", "Hedef", "İşlemler"].map(h => (
                      <th key={h} className="text-left px-2 py-1.5 text-[9px] text-[#999aaa] font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {passengers.map(p => (
                    <tr key={p.pnr} className="border-b border-[#f0f0f5] hover:bg-[#f0f0f6]/60 transition-colors">
                      <td className="px-2 py-2 text-[10px] text-[#E81932] font-mono font-semibold">{p.pnr}</td>
                      <td className="px-2 py-2 text-[11px] text-[#111111] font-medium truncate max-w-[90px]">{p.name}</td>
                      <td className="px-2 py-2 text-[10px] text-[#666677]">{p.class}</td>
                      <td className="px-2 py-2">
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${statusStyle(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-[10px] text-[#666677]">{p.targetFlight}</td>
                      <td className="px-1.5 py-1.5">
                        <div className="flex gap-1">
                          <button className="px-1.5 py-1 text-[9px] bg-[#eeeef4] hover:bg-[#e5e5ed] rounded-md text-[#555566] hover:text-[#111111] border border-[#dddde6] transition-all">
                            Oto Yerleşim
                          </button>
                          <button className="px-1.5 py-1 text-[9px] bg-[#eeeef4] hover:bg-[#e5e5ed] rounded-md text-[#555566] hover:text-[#111111] border border-[#dddde6] transition-all">
                            Otel Ata
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
