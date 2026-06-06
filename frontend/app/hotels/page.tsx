"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Hotel, Star, MapPin, Phone, CheckCircle, XCircle, Users } from "lucide-react"

const HOTELS = [
  { id: 1, name: "Hilton London Heathrow T4", location: "LHR Terminal 4", stars: 5, total: 320, available: 87, booked: 233, price: 189, status: "active", phone: "+44 20 8759 7755" },
  { id: 2, name: "Radisson Blu Heathrow", location: "LHR Terminal 4", stars: 4, total: 280, available: 45, booked: 235, price: 145, status: "active", phone: "+44 20 8757 1011" },
  { id: 3, name: "Marriott London Heathrow", location: "LHR Terminal 3", stars: 4, total: 240, available: 112, booked: 128, price: 162, status: "active", phone: "+44 20 8990 1100" },
  { id: 4, name: "Sofitel London Heathrow", location: "LHR Terminal 5", stars: 5, total: 180, available: 23, booked: 157, price: 245, status: "active", phone: "+44 20 8757 7777" },
  { id: 5, name: "Premier Inn Heathrow", location: "LHR Terminal 3", stars: 3, total: 440, available: 198, booked: 242, price: 89, status: "active", phone: "+44 871 527 8646" },
  { id: 6, name: "Ibis Budget Heathrow", location: "LHR Bath Road", stars: 2, total: 350, available: 0, booked: 350, price: 65, status: "full", phone: "+44 20 8759 4888" },
]

const MOCK_SIDEBAR = [
  { id: "1", code: "TK1981", route: "IST-LHR", status: "IPTAL" as const, section: "Yolcular", passengers: [] },
]

function stars(n: number) {
  return Array.from({ length: n }, (_, i) => (
    <Star key={i} className="w-3 h-3 fill-[#d4a012] text-[#d4a012]" />
  ))
}

export default function HotelsPage() {
  const [filter, setFilter] = useState<"all" | "available" | "full">("all")

  const filtered = HOTELS.filter(h => {
    if (filter === "available") return h.available > 0
    if (filter === "full") return h.available === 0
    return true
  })

  const totalCapacity = HOTELS.reduce((s, h) => s + h.total, 0)
  const totalAvailable = HOTELS.reduce((s, h) => s + h.available, 0)
  const totalBooked = HOTELS.reduce((s, h) => s + h.booked, 0)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f2f2f6]">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeDisruptions={MOCK_SIDEBAR} />
        <div className="flex-1 flex flex-col overflow-hidden">

          <div className="flex items-center justify-between px-6 py-3 border-b border-[#e5e5ed] bg-white">
            <div className="flex items-center gap-3">
              <Hotel className="w-5 h-5 text-[#E81932]" />
              <h1 className="text-base font-bold text-[#111111]">Otel Ortakları — LHR Havalimanı</h1>
            </div>
            <div className="flex gap-1">
              {(["all", "available", "full"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === f ? "bg-[#E81932] text-[#111111]" : "bg-[#e8e8f0] text-[#888899] hover:bg-[#e2e2ec]"
                  }`}>
                  {f === "all" ? "Tümü" : f === "available" ? "Müsait" : "Dolu"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-5 space-y-5">
            {/* Özet */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-[#e5e5ed] rounded-xl p-4">
                <p className="text-[11px] text-[#666677] uppercase tracking-wider mb-1">Toplam Kapasite</p>
                <p className="text-2xl font-bold text-[#111111]">{totalCapacity.toLocaleString()}</p>
                <p className="text-xs text-[#666677] mt-1">{HOTELS.length} otel partneri</p>
              </div>
              <div className="bg-white border border-[#10b981]/20 rounded-xl p-4">
                <p className="text-[11px] text-[#666677] uppercase tracking-wider mb-1">Müsait Oda</p>
                <p className="text-2xl font-bold text-[#10b981]">{totalAvailable}</p>
                <p className="text-xs text-[#666677] mt-1">%{Math.round(totalAvailable / totalCapacity * 100)} doluluk oranı</p>
              </div>
              <div className="bg-white border border-[#E81932]/20 rounded-xl p-4">
                <p className="text-[11px] text-[#666677] uppercase tracking-wider mb-1">Rezerve Oda</p>
                <p className="text-2xl font-bold text-[#E81932]">{totalBooked}</p>
                <p className="text-xs text-[#666677] mt-1">IRROPS kapsamındaki yolcular</p>
              </div>
            </div>

            {/* Otel Kartları */}
            <div className="grid grid-cols-2 gap-4">
              {filtered.map(h => (
                <div key={h.id} className="bg-white border border-[#e5e5ed] rounded-xl p-5 hover:border-[#2c2c40] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#111111] mb-1">{h.name}</h3>
                      <div className="flex">{stars(h.stars)}</div>
                    </div>
                    {h.status === "full" ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 rounded text-[10px] font-medium">
                        <XCircle className="w-3 h-3" /> DOLU
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded text-[10px] font-medium">
                        <CheckCircle className="w-3 h-3" /> MÜSAİT
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-[#888899]">
                      <MapPin className="w-3 h-3 text-[#666677]" />
                      {h.location}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#888899]">
                      <Phone className="w-3 h-3 text-[#666677]" />
                      {h.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#888899]">
                      <Users className="w-3 h-3 text-[#666677]" />
                      {h.booked} / {h.total} oda rezerve
                    </div>
                  </div>

                  {/* Kapasite Barı */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-[#666677] mb-1">
                      <span>Doluluk</span>
                      <span>{Math.round(h.booked / h.total * 100)}%</span>
                    </div>
                    <div className="h-2 bg-[#e8e8f0] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${h.available === 0 ? "bg-[#ef4444]" : h.available < 50 ? "bg-[#E81932]" : "bg-[#10b981]"}`}
                        style={{ width: `${Math.round(h.booked / h.total * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#666677]">
                      <span className="text-[#111111] font-bold">{h.available}</span> oda müsait
                    </span>
                    <span className="text-xs text-[#888899]">
                      £{h.price}<span className="text-[#666677]">/gece</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
