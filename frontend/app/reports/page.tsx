"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { ChevronRight, ChevronDown } from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz"]

const costData = MONTHS.map((m, i) => ({
  name: m,
  Maliyet: [420, 780, 1340, 2100, 2950, 3800][i],
}))

const satisfactionData = MONTHS.map((m, i) => ({
  name: m,
  Memnuniyet: [62, 58, 71, 74, 68, 81][i],
  Hedef:      [70, 70, 70, 75, 75, 80][i],
}))

const resourceData = MONTHS.map((m, i) => ({
  name: m,
  Oteller:  [65, 48, 72, 88, 55, 79][i],
  Kuponlar: [82, 61, 90, 110, 68, 95][i],
}))

const TOOLTIP_STYLE = {
  background: "#0a0d1a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "white",
  fontSize: 11,
  boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
}

const AXIS_TICK = { fill: "rgba(255,255,255,0.35)", fontSize: 10 }
const GRID_STYLE = { stroke: "rgba(255,255,255,0.05)", strokeDasharray: "3 3" }

const CARD = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 12,
}

export default function ReportsPage() {
  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.10) 0%, transparent 55%), linear-gradient(135deg, #0c0e1a 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
        <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">Operasyonel Raporlar ve Analitikler</h1>

        <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">

          {/* Maliyet Analizi */}
          <div className="rounded-xl p-5 flex flex-col" style={CARD}>
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-white font-semibold text-sm">Aylık IRROPS Maliyet Analizi</h3>
              <div className="flex items-center gap-1">
                <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-white/50 text-xs"
                  style={{ background: "rgba(255,255,255,0.07)" }}>
                  Trend <ChevronDown className="w-3 h-3" />
                </button>
                <button className="p-1 rounded-lg hover:bg-white/5">
                  <ChevronRight className="w-4 h-4 text-white/30" />
                </button>
              </div>
            </div>
            <p className="text-white/30 text-[10px] mb-3">Son 6 ay — TL cinsinden</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-0.5 rounded-full bg-[#E82040]" />
              <span className="text-white/40 text-xs">Maliyet</span>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#E82040" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#E82040" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                  <Area type="monotone" dataKey="Maliyet"
                    stroke="#E82040" strokeWidth={2}
                    fill="url(#costGrad)"
                    dot={{ fill: "#E82040", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#E82040", stroke: "rgba(232,32,64,0.3)", strokeWidth: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Yolcu Memnuniyeti */}
          <div className="rounded-xl p-5 flex flex-col" style={CARD}>
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-white font-semibold text-sm">Yolcu Memnuniyeti Trendleri</h3>
              <button className="p-1 rounded-lg hover:bg-white/5">
                <ChevronRight className="w-4 h-4 text-white/30" />
              </button>
            </div>
            <p className="text-white/30 text-[10px] mb-3">Son 6 ay — NPS skoru</p>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-0.5 rounded-full bg-[#E82040]" />
                <span className="text-white/40 text-xs">Memnuniyet</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-0.5 rounded-full bg-white/25" style={{ borderTop: "1px dashed" }} />
                <span className="text-white/40 text-xs">Hedef</span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={satisfactionData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="satGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#E82040" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E82040" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="rgba(255,255,255,0.15)" stopOpacity={1} />
                      <stop offset="95%" stopColor="rgba(255,255,255,0)" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} domain={[50, 90]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                  <Area type="monotone" dataKey="Hedef"
                    stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeDasharray="5 3"
                    fill="url(#targetGrad)" dot={false} />
                  <Area type="monotone" dataKey="Memnuniyet"
                    stroke="#E82040" strokeWidth={2}
                    fill="url(#satGrad)"
                    dot={{ fill: "#E82040", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#E82040", stroke: "rgba(232,32,64,0.3)", strokeWidth: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Kaynak Kullanım */}
          <div className="rounded-xl p-5 flex flex-col" style={CARD}>
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-white font-semibold text-sm">Kaynak Kullanım Verimliliği</h3>
              <button className="p-1 rounded-lg hover:bg-white/5">
                <ChevronRight className="w-4 h-4 text-white/30" />
              </button>
            </div>
            <p className="text-white/30 text-[10px] mb-3">Son 6 ay — birim sayısı</p>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: "rgba(255,255,255,0.2)" }} />
                <span className="text-white/40 text-xs">Oteller</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#E82040]" />
                <span className="text-white/40 text-xs">Kuponlar</span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={3} barCategoryGap="30%">
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="Oteller"  fill="rgba(255,255,255,0.18)" radius={[4,4,0,0]} />
                  <Bar dataKey="Kuponlar" fill="#C8102E"               radius={[4,4,0,0]}
                    style={{ filter: "drop-shadow(0 0 4px rgba(200,16,46,0.4))" }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        <p className="text-white/20 text-xs text-center shrink-0">© 2024 Turkish Airlines. All rights reserved.</p>
      </div>
    </div>
  )
}
