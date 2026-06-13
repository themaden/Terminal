"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { ChevronRight, ChevronDown } from "lucide-react"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts"

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran"]

const costData = MONTHS.map((m, i) => ({
  name: m,
  "Maliyet Kost": [800, 1200, 2200, 3000, 3500, 4600][i],
}))

const satisfactionData = MONTHS.map((m, i) => ({
  name: m,
  "Yolcu Memnuniyeti": [25, 30, 35, 43, 38, 55][i],
  "Baz": [28, 32, 30, 40, 35, 52][i],
}))

const resourceData = MONTHS.map((m, i) => ({
  name: m,
  Oteller: [65, 30, 40, 60, 40, 65][i],
  Kuponlar: [80, 65, 85, 120, 55, 80][i],
}))

const CHART_STYLE = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 12,
}

const TOOLTIP_STYLE = {
  background: "#0f1220",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "white",
  fontSize: 12,
}

export default function ReportsPage() {
  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0c0e1a 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
        <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">Operasyonel Raporlar ve Analitikler</h1>

        <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">

          {/* Maliyet Analizi */}
          <div className="rounded-xl p-5 flex flex-col" style={CHART_STYLE}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-white font-semibold text-sm leading-tight">Aylık IRROPS Maliyet Analizi</h3>
              <div className="flex items-center gap-1">
                <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-white/60 text-xs"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  Trendisi <ChevronDown className="w-3 h-3" />
                </button>
                <button className="p-1 rounded-lg hover:bg-white/5">
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#E82040]" />
              <span className="text-white/50 text-xs">Maliyet Kost</span>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="Maliyet Kost" stroke="#E82040" strokeWidth={2} dot={{ fill: "#E82040", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Yolcu Memnuniyeti */}
          <div className="rounded-xl p-5 flex flex-col" style={CHART_STYLE}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-white font-semibold text-sm leading-tight">Yolcu Memnuniyeti Trendleri</h3>
              <div className="flex items-center gap-1">
                <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-white/60 text-xs"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  Trendleri <ChevronDown className="w-3 h-3" />
                </button>
                <button className="p-1 rounded-lg hover:bg-white/5">
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#E82040]" />
                <span className="text-white/50 text-xs">Yolcu Memnuniyeti</span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={satisfactionData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="Yolcu Memnuniyeti" stroke="#E82040" strokeWidth={2} dot={{ fill: "#E82040", r: 4 }} />
                  <Line type="monotone" dataKey="Baz" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Kaynak Kullanım */}
          <div className="rounded-xl p-5 flex flex-col" style={CHART_STYLE}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-white font-semibold text-sm leading-tight">Kaynak Kullanım Verimliliği</h3>
              <button className="p-1 rounded-lg hover:bg-white/5">
                <ChevronRight className="w-4 h-4 text-white/40" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white/40" />
                <span className="text-white/50 text-xs">Oteller</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#E82040]" />
                <span className="text-white/50 text-xs">Kuponlar</span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="Oteller"  fill="rgba(255,255,255,0.25)" radius={[3,3,0,0]} />
                  <Bar dataKey="Kuponlar" fill="#E82040"                radius={[3,3,0,0]} />
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
