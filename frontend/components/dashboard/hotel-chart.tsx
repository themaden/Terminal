"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"

interface HotelData {
  name: string
  capacity: number
  booked: number
}

interface HotelChartProps {
  data: HotelData[]
  totalCapacity: number
  available: number
}

const BAR_COLORS = ["#E81932", "#3b82f6", "#8b5cf6", "#ec4899", "#E81932"]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function coloredBarShape(props: any) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0 } = props as { x: number; y: number; width: number; height: number; index: number }
  if (!height || height <= 0) return null
  return <rect x={x} y={y} width={width} height={height} rx={3} ry={3} fill={BAR_COLORS[index % BAR_COLORS.length]} opacity={0.85} />
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { total: number } }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const booked = payload[0].value
  const total = payload[0].payload.total
  const pct = Math.round((booked / total) * 100)
  return (
    <div className="bg-white border border-[#e5e5ed] rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-[#111111] font-semibold mb-1">{label}</p>
      <p className="text-[#E81932]">{booked} / {total} yatak</p>
      <p className="text-[#666677]">%{pct} dolu</p>
    </div>
  )
}

export function HotelCapacityChart({ data, totalCapacity, available }: HotelChartProps) {
  const chartData = data.map(h => ({ name: h.name.replace(" ", "\n"), value: h.booked, total: h.capacity }))
  const usedPct = Math.round(((totalCapacity - available) / totalCapacity) * 100)

  return (
    <div className="bg-[#f9f9fc] border border-[#ebebf2] rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#ebebf2] bg-[#f4f4f8]">
        <h3 className="text-[10px] font-bold text-[#555566] uppercase tracking-[0.12em]">Otel Ortak Kapasitesi</h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-[#17172a] border-b border-[#ebebf2]">
        <div className="px-3 py-2">
          <p className="text-[9px] text-[#999aaa] uppercase tracking-wider mb-0.5">Yolcu</p>
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

      {/* Chart */}
      <div className="flex-1 px-1 py-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap={8} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#17172a" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#36365a", fontSize: 8 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#36365a", fontSize: 8 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
            <Bar dataKey="value" shape={coloredBarShape} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
