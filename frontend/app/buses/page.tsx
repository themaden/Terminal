"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Bus, MapPin, CheckCircle, Clock, Users, AlertCircle } from "lucide-react"

const BUSES = [
  { id: "B01", plate: "34 AJK 441", driver: "Murat Demir", capacity: 55, passengers: 48, route: "LHR T4 → Hilton", status: "transit", eta: 12 },
  { id: "B02", plate: "34 BKL 882", driver: "Serkan Yıldız", capacity: 55, passengers: 55, route: "LHR T5 → Radisson", status: "loading", eta: 0 },
  { id: "B03", plate: "34 CDR 221", driver: "Hasan Çelik", capacity: 40, passengers: 40, route: "LHR T3 → Marriott", status: "arrived", eta: 0 },
  { id: "B04", plate: "34 EFG 773", driver: "Kemal Arslan", capacity: 55, passengers: 22, route: "LHR T4 → Premier Inn", status: "loading", eta: 0 },
  { id: "B05", plate: "34 HIK 994", driver: "Ömer Şahin", capacity: 40, passengers: 0, route: "Beklemede", status: "idle", eta: 0 },
  { id: "B06", plate: "34 LMN 556", driver: "Ahmet Korkmaz", capacity: 55, passengers: 51, route: "LHR T3 → Sofitel", status: "transit", eta: 8 },
]

const QUEUE = [
  { pnr: "PNR301", name: "Sarah Johnson", bus: "B01", seat: "A4", status: "transit" },
  { pnr: "PNR302", name: "Marco Ferrari", bus: "B02", seat: "B7", status: "loading" },
  { pnr: "PNR303", name: "Fatima Al-Rashid", bus: "B03", seat: "C2", status: "arrived" },
  { pnr: "PNR304", name: "David Park", bus: "B04", seat: "A1", status: "loading" },
  { pnr: "PNR305", name: "Emma Williams", bus: "B01", seat: "D5", status: "transit" },
  { pnr: "PNR306", name: "Karim Benzema", bus: "B05", seat: "—", status: "waiting" },
]

const MOCK_SIDEBAR = [
  { id: "1", code: "TK1981", route: "IST-LHR", status: "IPTAL" as const, section: "Yolcular", passengers: [] },
]

function statusStyle(s: string) {
  const m: Record<string, { label: string; cls: string }> = {
    transit:  { label: "Transfer", cls: "bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30" },
    loading:  { label: "Yükleniyor", cls: "bg-[#E81932]/20 text-[#E81932] border-[#E81932]/30" },
    arrived:  { label: "Vardı", cls: "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30" },
    idle:     { label: "Beklemede", cls: "bg-[#575578]/20 text-[#666677] border-[#575578]/30" },
    waiting:  { label: "Bekliyor", cls: "bg-[#575578]/20 text-[#888899] border-[#575578]/30" },
  }
  return m[s] ?? m.idle
}

export default function BusesPage() {
  const [activeTab, setActiveTab] = useState<"fleet" | "queue">("fleet")

  const totalPax = BUSES.reduce((s, b) => s + b.passengers, 0)
  const activeBuses = BUSES.filter(b => b.status !== "idle").length

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f2f2f6]">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeDisruptions={MOCK_SIDEBAR} />
        <div className="flex-1 flex flex-col overflow-hidden">

          <div className="flex items-center justify-between px-6 py-3 border-b border-[#e5e5ed] bg-white">
            <div className="flex items-center gap-3">
              <Bus className="w-5 h-5 text-[#E81932]" />
              <h1 className="text-base font-bold text-[#111111]">Otobüs Filosu — Transfer Yönetimi</h1>
            </div>
            <div className="flex gap-1">
              {(["fleet", "queue"] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === t ? "bg-[#E81932] text-[#111111]" : "bg-[#e8e8f0] text-[#888899] hover:bg-[#e2e2ec]"
                  }`}>
                  {t === "fleet" ? "Filo Durumu" : "Yolcu Kuyruğu"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-5 space-y-5">

            {/* KPI */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Toplam Otobüs", value: BUSES.length, color: "text-[#111111]" },
                { label: "Aktif Transfer", value: activeBuses, color: "text-[#3b82f6]" },
                { label: "Transfer Edilen", value: totalPax, color: "text-[#10b981]" },
                { label: "Bekleyen Yolcu", value: QUEUE.filter(q => q.status === "waiting").length, color: "text-[#E81932]" },
              ].map(k => (
                <div key={k.label} className="bg-white border border-[#e5e5ed] rounded-xl p-4">
                  <p className="text-[11px] text-[#666677] uppercase tracking-wider mb-1">{k.label}</p>
                  <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                </div>
              ))}
            </div>

            {activeTab === "fleet" ? (
              <div className="grid grid-cols-2 gap-4">
                {BUSES.map(b => {
                  const s = statusStyle(b.status)
                  const fill = b.capacity > 0 ? Math.round(b.passengers / b.capacity * 100) : 0
                  return (
                    <div key={b.id} className="bg-white border border-[#e5e5ed] rounded-xl p-5 hover:border-[#2c2c40] transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#e8e8f0] rounded-lg flex items-center justify-center">
                            <Bus className="w-4 h-4 text-[#E81932]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#111111]">{b.id}</p>
                            <p className="text-[10px] text-[#666677] font-mono">{b.plate}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${s.cls}`}>{s.label}</span>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-xs text-[#888899]">
                          <MapPin className="w-3 h-3 text-[#666677]" />
                          {b.route}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#888899]">
                          <Users className="w-3 h-3 text-[#666677]" />
                          {b.driver}
                        </div>
                        {b.eta > 0 && (
                          <div className="flex items-center gap-2 text-xs text-[#E81932]">
                            <Clock className="w-3 h-3" />
                            Tahmini varış: {b.eta} dk
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-[#666677] mb-1">
                          <span>Doluluk: {b.passengers}/{b.capacity}</span>
                          <span>{fill}%</span>
                        </div>
                        <div className="h-1.5 bg-[#e8e8f0] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${fill >= 100 ? "bg-[#ef4444]" : fill > 70 ? "bg-[#E81932]" : "bg-[#10b981]"}`}
                            style={{ width: `${fill}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white border border-[#e5e5ed] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#e5e5ed] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#E81932]" />
                  <h2 className="text-sm font-semibold text-[#111111] uppercase tracking-wider">Transfer Yolcu Listesi</h2>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-[#f2f2f6]">
                    <tr>
                      {["PNR", "Yolcu", "Otobüs", "Koltuk", "Durum"].map(h => (
                        <th key={h} className="text-left px-5 py-2 text-[10px] text-[#666677] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {QUEUE.map(q => {
                      const s = statusStyle(q.status)
                      return (
                        <tr key={q.pnr} className="border-b border-[#e5e5ed]/50 hover:bg-[#e8e8f0]/30 transition-colors">
                          <td className="px-5 py-3 text-[#E81932] font-mono">{q.pnr}</td>
                          <td className="px-5 py-3 text-[#111111] font-medium">{q.name}</td>
                          <td className="px-5 py-3 text-[#888899]">{q.bus}</td>
                          <td className="px-5 py-3 text-[#888899]">{q.seat}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${s.cls}`}>{s.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
