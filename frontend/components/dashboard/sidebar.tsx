"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users, Hotel, Bus, FileText,
  ChevronDown, ChevronRight, Settings, User,
  MoreHorizontal, Activity, LayoutDashboard, Network, TrendingUp,
} from "lucide-react"

interface Flight {
  id: string
  code: string
  route: string
  status: "IPTAL" | "ROTAR"
  delay?: string
  passengers?: { name: string; type?: string }[]
  section?: string
}

interface SidebarProps {
  activeDisruptions: Flight[]
  onFlightSelect?: (flight: Flight) => void
}

const NAV_ITEMS = [
  { href: "/",            icon: LayoutDashboard, label: "Panel",  tooltip: "Ana Panel" },
  { href: "/iocc",        icon: Activity,        label: "IOCC",   tooltip: "IOCC Merkezi" },
  { href: "/pcc",         icon: Users,           label: "PCC",    tooltip: "Yolcu Koordinasyon" },
  { href: "/hub-control", icon: Network,         label: "Hub",    tooltip: "Hub Kontrol" },
  { href: "/prediction",  icon: TrendingUp,      label: "Risk",   tooltip: "Risk Tahmini" },
]

const SUB_NAV = [
  { href: "/pcc",    icon: Users,    label: "Yolcu Yönetimi" },
  { href: "/hotels", icon: Hotel,    label: "Otel Ortakları" },
  { href: "/buses",  icon: Bus,      label: "Otobüs Filosu" },
  { href: "/audit",  icon: FileText, label: "Operasyon Kayıtları" },
]

export function Sidebar({ activeDisruptions, onFlightSelect }: SidebarProps) {
  const pathname = usePathname()
  const [expandedFlights, setExpandedFlights] = useState<string[]>([
    activeDisruptions[0]?.id,
    activeDisruptions[1]?.id,
  ])
  const [expandedSections, setExpandedSections] = useState<string[]>([
    `passengers-${activeDisruptions[0]?.id}`,
    `passengers-${activeDisruptions[1]?.id}`,
  ])

  function toggleFlight(id: string) {
    setExpandedFlights(p => p.includes(id) ? p.filter(f => f !== id) : [...p, id])
  }
  function toggleSection(s: string) {
    setExpandedSections(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  }

  return (
    <div className="flex h-full">

      {/* ── Icon Rail ── */}
      <div className="w-[60px] bg-white border-r border-[#e8e8f0] flex flex-col items-center pt-2 pb-3 gap-0.5"
        style={{ boxShadow: "1px 0 0 0 #e8e8f0" }}>

        {/* Logo mark */}
        <div className="w-8 h-8 rounded-lg bg-[#E81932] flex items-center justify-center mb-4 mt-1 shadow-sm shadow-[#E81932]/30">
          <span className="text-white font-black text-[11px] tracking-tight">JN</span>
        </div>

        {NAV_ITEMS.map(({ href, icon: Icon, label, tooltip }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} title={tooltip}
              className={`relative w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all duration-150 group gap-0.5 ${
                active
                  ? "bg-[#E81932]/8 shadow-sm"
                  : "hover:bg-[#f5f5fa]"
              }`}>
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#E81932] rounded-r-full" />
              )}
              <Icon className={`w-[17px] h-[17px] transition-colors ${
                active ? "text-[#E81932]" : "text-[#b0b0c8] group-hover:text-[#555566]"
              }`} />
              <span className={`text-[8px] font-semibold leading-none transition-colors ${
                active ? "text-[#E81932]" : "text-[#c0c0d0] group-hover:text-[#777788]"
              }`}>
                {label}
              </span>
            </Link>
          )
        })}

        <div className="flex-1" />

        {/* Divider */}
        <div className="w-6 h-px bg-[#ebebf4] mb-1" />

        <Link href="/settings" title="Ayarlar"
          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 group ${
            pathname === "/settings" ? "bg-[#E81932]/8" : "hover:bg-[#f5f5fa]"
          }`}>
          <Settings className={`w-[17px] h-[17px] transition-colors ${
            pathname === "/settings" ? "text-[#E81932]" : "text-[#b0b0c8] group-hover:text-[#555566]"
          }`} />
          <span className={`text-[8px] font-semibold leading-none transition-colors ${
            pathname === "/settings" ? "text-[#E81932]" : "text-[#c0c0d0] group-hover:text-[#777788]"
          }`}>
            Ayarlar
          </span>
        </Link>
      </div>

      {/* ── Main Sidebar ── */}
      <div className="w-[224px] bg-[#fafafa] border-r border-[#e8e8f0] flex flex-col h-full">

        {/* Room Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#ebebf2]"
          style={{ background: "linear-gradient(135deg, #fff 0%, #faf5f5 100%)" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
            <span className="text-[9px] text-[#999aaa] uppercase tracking-[0.18em] font-semibold">Aktif Kriz Odası</span>
          </div>
          <h2 className="text-[22px] font-black text-[#111111] tracking-tight leading-none">LHR SIS</h2>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-[#888899]">{activeDisruptions.length} aksaklık</span>
            <span className="text-[9px] bg-[#E81932]/8 text-[#E81932] font-bold px-2 py-0.5 rounded-full border border-[#E81932]/20">
              CANLI
            </span>
          </div>
        </div>

        {/* Flight List */}
        <div className="flex-1 overflow-y-auto">

          {/* Section header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#ebebf2] bg-white">
            <span className="text-[9px] font-bold text-[#aaaabc] uppercase tracking-[0.14em]">
              Uçuş Aksaklıkları
            </span>
            <button className="p-1 hover:bg-[#f0f0f8] rounded-md transition-colors">
              <MoreHorizontal className="w-3.5 h-3.5 text-[#c0c0d0]" />
            </button>
          </div>

          <div className="py-1">
            {activeDisruptions.length === 0 ? (
              <p className="text-[11px] text-[#aaaabc] px-4 py-4 text-center italic">Aktif aksaklık yok</p>
            ) : activeDisruptions.map(flight => (
              <div key={flight.id}>
                <button
                  onClick={() => { toggleFlight(flight.id); onFlightSelect?.(flight) }}
                  className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-white transition-colors text-left border-b border-[#f0f0f6] last:border-0"
                >
                  <span className={`shrink-0 mt-0.5 transition-transform duration-150 ${expandedFlights.includes(flight.id) ? "rotate-90" : ""}`}>
                    <ChevronRight className="w-3 h-3 text-[#c0c0d0]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] text-[#111111] font-bold">{flight.code}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        flight.status === "IPTAL"
                          ? "bg-[#ef4444]/10 text-[#ef4444]"
                          : "bg-[#f59e0b]/10 text-[#f59e0b]"
                      }`}>
                        {flight.status === "IPTAL" ? "İPTAL" : `+${flight.delay ?? "?"}`}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#888899] mt-0.5 block">{flight.route}</span>
                  </div>
                </button>

                {expandedFlights.includes(flight.id) && (
                  <div className="ml-5 border-l-2 border-[#f0f0f6] mb-1">
                    <button
                      onClick={() => toggleSection(`passengers-${flight.id}`)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white transition-colors text-left"
                    >
                      <ChevronDown className={`w-3 h-3 text-[#c0c0d0] transition-transform ${expandedSections.includes(`passengers-${flight.id}`) ? "" : "-rotate-90"}`} />
                      <Users className="w-3.5 h-3.5 text-[#9999cc]" />
                      <span className="text-[11px] text-[#666677] font-medium">{flight.section ?? "Yolcular"}</span>
                    </button>

                    {expandedSections.includes(`passengers-${flight.id}`) && flight.passengers?.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/80 transition-colors">
                        <div className="w-5 h-5 rounded-full bg-[#e8e8f4] flex items-center justify-center shrink-0">
                          <User className="w-2.5 h-2.5 text-[#9999bb]" />
                        </div>
                        <span className="text-[10px] text-[#666677]">{p.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sub Navigation */}
          <div className="mt-1 border-t border-[#ebebf2]">
            <div className="px-4 py-2">
              <span className="text-[9px] font-bold text-[#aaaabc] uppercase tracking-[0.14em]">Modüller</span>
            </div>
            {SUB_NAV.map(({ href, icon: Icon, label }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-all duration-150 group border-l-2 ${
                    active
                      ? "border-[#E81932] bg-[#E81932]/5"
                      : "border-transparent hover:bg-white hover:border-[#E81932]/30"
                  }`}>
                  <Icon className={`w-3.5 h-3.5 transition-colors ${
                    active ? "text-[#E81932]" : "text-[#9999bb] group-hover:text-[#555566]"
                  }`} />
                  <span className={`text-[11px] font-medium transition-colors flex-1 ${
                    active ? "text-[#E81932]" : "text-[#666677] group-hover:text-[#333344]"
                  }`}>
                    {label}
                  </span>
                  <ChevronRight className={`w-3 h-3 transition-all ${
                    active ? "text-[#E81932]" : "text-[#dddde8] group-hover:text-[#9999bb] group-hover:translate-x-0.5"
                  }`} />
                </Link>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}
