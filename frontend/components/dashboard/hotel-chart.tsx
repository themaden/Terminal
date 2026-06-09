"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Hotel, CheckCircle2, Loader2 } from "lucide-react"
import { recoveryApi, type HotelAssignment } from "@/lib/api"

interface HotelData {
  name: string
  capacity: number
  booked: number
}

interface HotelChartProps {
  data: HotelData[]
  totalCapacity: number
  available: number
  crisisId?: string
  crisisHotels?: HotelAssignment[]
}

const BAR_COLORS = ["#E81932", "#3b82f6", "#8b5cf6", "#ec4899", "#f97316"]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function coloredBarShape(props: any) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0 } = props as { x: number; y: number; width: number; height: number; index: number }
  if (!height || height <= 0) return null
  return <rect x={x} y={y} width={width} height={height} rx={3} ry={3} fill={BAR_COLORS[index % BAR_COLORS.length]} opacity={0.85} />
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { total: number } }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const booked = payload[0].value
  const total  = payload[0].payload.total
  const pct    = Math.round((booked / total) * 100)
  return (
    <div className="bg-white border border-[#e5e5ed] rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-[#111111] font-semibold mb-1">{label}</p>
      <p className="text-[#E81932]">{booked} / {total} yatak</p>
      <p className="text-[#666677]">%{pct} dolu</p>
    </div>
  )
}

export function HotelCapacityChart({ data, totalCapacity, available, crisisId, crisisHotels }: HotelChartProps) {
  const [bookingHotel, setBookingHotel] = useState<string | null>(null)
  const [bookedSet, setBookedSet]       = useState<Set<string>>(new Set())

  const chartData = data.map(h => ({ name: h.name.replace(" ", "\n"), value: h.booked, total: h.capacity }))
  const usedPct   = Math.round(((totalCapacity - available) / totalCapacity) * 100)
  const hasCrisis = !!crisisId && (crisisHotels?.length ?? 0) > 0

  async function bookBlock(ha: HotelAssignment) {
    if (!crisisId) return
    setBookingHotel(ha.hotel)
    try {
      await recoveryApi.bookHotelBlock(crisisId, ha.hotel, ha.rooms_needed)
      setBookedSet(s => new Set([...s, ha.hotel]))
    } finally {
      setBookingHotel(null)
    }
  }

  return (
    <div className="bg-[#f9f9fc] border border-[#ebebf2] rounded-xl overflow-hidden h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#ebebf2] bg-[#f4f4f8]">
        <div className="flex items-center gap-1.5">
          <Hotel className="w-3.5 h-3.5 text-[#f97316]" />
          <h3 className="text-[10px] font-bold text-[#555566] uppercase tracking-[0.12em]">
            {hasCrisis ? "KRİZ OTEL ATAMASI" : "Otel Ortak Kapasitesi"}
          </h3>
        </div>
        {hasCrisis && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[#ef4444] text-white animate-pulse">
            KRİZ MODU
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-[#e8e8f0] border-b border-[#ebebf2]">
        <div className="px-3 py-2">
          <p className="text-[9px] text-[#999aaa] uppercase tracking-wider mb-0.5">Kapasite</p>
          <p className="text-base font-bold text-[#111111] tabular-nums">{totalCapacity.toLocaleString()}</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-[9px] text-[#999aaa] uppercase tracking-wider mb-0.5">Müsait Yatak</p>
          <p className="text-base font-bold text-[#10b981] tabular-nums">{available}</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-[9px] text-[#999aaa] uppercase tracking-wider mb-0.5">Doluluk</p>
          <p className="text-base font-bold text-[#E81932] tabular-nums">%{usedPct}</p>
        </div>
      </div>

      {hasCrisis ? (
        /* ── Crisis mode: hotel assignment cards ── */
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {crisisHotels!.map((ha, i) => {
            const isBooked  = bookedSet.has(ha.hotel)
            const isBooking = bookingHotel === ha.hotel
            const tierColor =
              ha.tier === "premium"  ? "text-[#f97316]" :
              ha.tier === "business" ? "text-[#3b82f6]" : "text-[#9999bb]"
            return (
              <div key={i} className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border ${
                isBooked ? "bg-[#10b981]/6 border-[#10b981]/20" : "bg-white border-[#e8e8f0]"
              }`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-[#111111] truncate">{ha.hotel}</p>
                  <p className={`text-[9px] font-bold ${tierColor}`}>
                    {ha.passenger_count} yolcu · {ha.rooms_needed} oda · T{ha.terminal}
                  </p>
                </div>
                <button
                  disabled={isBooking || isBooked}
                  onClick={() => bookBlock(ha)}
                  className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${
                    isBooked
                      ? "bg-[#10b981]/10 text-[#10b981]"
                      : "bg-[#111111] hover:bg-[#333] text-white disabled:opacity-50"
                  }`}
                >
                  {isBooking ? <Loader2 className="w-3 h-3 animate-spin" /> : isBooked ? <CheckCircle2 className="w-3 h-3" /> : <Hotel className="w-3 h-3" />}
                  {isBooked ? "Rezerve" : "Blokla"}
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Normal mode: bar chart ── */
        <div className="flex-1 px-1 py-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap={8} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#e8e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#36365a", fontSize: 8 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#36365a", fontSize: 8 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
              <Bar dataKey="value" shape={coloredBarShape} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
