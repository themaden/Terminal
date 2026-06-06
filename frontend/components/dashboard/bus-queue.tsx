"use client"

import { useState } from "react"
import { Bus } from "lucide-react"

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
}

function statusStyle(status: string) {
  if (status === "Tamamlandi") return "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20"
  if (status === "Gecikti")    return "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20"
  return "text-[#E81932] bg-[#E81932]/10 border-[#E81932]/20"
}

export function BusQueueTable({ passengers, tabs }: BusQueueProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "elite")

  return (
    <div className="bg-[#f9f9fc] border border-[#ebebf2] rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#ebebf2] bg-[#f4f4f8]">
        <Bus className="w-3.5 h-3.5 text-[#7777aa]" />
        <h3 className="text-[10px] font-bold text-[#555566] uppercase tracking-[0.12em]">Transfer Otobüs Sırası</h3>
      </div>

      {/* Tabs */}
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

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {passengers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Bus className="w-6 h-6 text-[#17172a]" />
            <p className="text-[11px] text-[#999aaa]">Sırada yolcu yok</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#ededf4] sticky top-0">
              <tr>
                {["PNR", "İsim", "Sınıf", "Durum", "Hedef Uçuş", "İşlemler"].map(h => (
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
    </div>
  )
}
