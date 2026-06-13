"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Plane, Settings, Users, MessageSquare, Cpu, Layers,
  Headphones, User, LayoutDashboard, FileText, MessageCircle,
  ChevronRight,
} from "lucide-react"

/* ── THY Logo SVG ── */
function ThyLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#C8102E" />
      <path d="M20 8 L22 17 L31 14 L25 21 L32 26 L23 24 L20 33 L17 24 L8 26 L15 21 L9 14 L18 17 Z"
        fill="white" opacity="0.95" />
    </svg>
  )
}

/* ── Operator Sidebar (Ana Paneller) ── */
const OPERATOR_NAV = [
  { href: "/",              icon: Plane,         label: "Gerçek Zamanlı Operasyonlar" },
  { href: "/ai-analytics",  icon: Cpu,           label: "Yapay Zeka Analizleri" },
  { href: "/resources",     icon: Layers,        label: "Kaynak Yönetimi" },
  { href: "/communications",icon: MessageSquare, label: "İletişim Merkezi" },
  { href: "/settings",      icon: Settings,      label: "Ayarlar" },
  { href: "/internal-comm", icon: MessageCircle, label: "Şirket İçi İletişim" },
]

/* ── IRROPS Sidebar (Operasyonel Modül) ── */
const IRROPS_NAV = [
  { href: "/iocc",     icon: LayoutDashboard, label: "Gösterge Paneli" },
  { href: "/flights",  icon: Plane,           label: "Uçuşlar" },
  { href: "/reports",  icon: FileText,        label: "Raporlar" },
  { href: "/pcc",      icon: Users,           label: "Yolcu Listesi" },
  { href: "/support",  icon: Headphones,      label: "Destek" },
]

/* ── Passenger Sidebar ── */
const PASSENGER_NAV = [
  { href: "/passenger-portal",  icon: Plane,        label: "Uçuşum" },
  { href: "/passenger-services",icon: Layers,       label: "Hizmetlerim" },
  { href: "/passenger-settings",icon: Settings,     label: "Ayarlar" },
  { href: "/passenger-support", icon: Headphones,   label: "Destek" },
]

const OPERATOR_ROUTES = ["/", "/ai-analytics", "/resources", "/communications", "/settings", "/internal-comm", "/ai-bot"]
const IRROPS_ROUTES   = ["/iocc", "/flights", "/reports", "/pcc", "/support"]
const PASSENGER_ROUTES = ["/passenger-portal", "/passenger-services", "/passenger-settings", "/passenger-support"]

export function Sidebar() {
  const pathname = usePathname()

  if (PASSENGER_ROUTES.some(r => pathname.startsWith(r))) {
    return <PassengerSidebar pathname={pathname} />
  }
  if (IRROPS_ROUTES.includes(pathname)) {
    return <IrropsSidebar pathname={pathname} />
  }
  return <OperatorSidebar pathname={pathname} />
}

/* ═══════════════════════════════════════════════
   OPERATOR SIDEBAR
═══════════════════════════════════════════════ */
function OperatorSidebar({ pathname }: { pathname: string }) {
  return (
    <div className="w-[260px] shrink-0 flex flex-col h-full"
      style={{
        background: "linear-gradient(180deg, rgba(13,10,20,0.97) 0%, rgba(10,8,16,0.98) 100%)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(16px)",
      }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <ThyLogo size={40} />
        <div>
          <p className="text-white font-black text-sm tracking-widest leading-none">TURKISH</p>
          <p className="text-white font-black text-sm tracking-widest leading-none">AIRLINES</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {OPERATOR_NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 group ${
                active
                  ? "bg-[#C8102E]/20 border border-[#C8102E]/30"
                  : "hover:bg-white/5 border border-transparent"
              }`}>
              <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                active ? "text-[#E82040]" : "text-white/40 group-hover:text-white/70"
              }`} style={{ width: 18, height: 18 }} />
              <span className={`text-sm font-medium transition-colors leading-none ${
                active ? "text-white" : "text-white/50 group-hover:text-white/80"
              }`}>
                {label}
              </span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E82040] shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/5 p-4 space-y-2">
        <Link href="/support"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group">
          <Headphones className="w-4 h-4 text-white/40 group-hover:text-white/70 shrink-0" />
          <span className="text-sm text-white/40 group-hover:text-white/70">Destekle İletişime Geç</span>
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-[#C8102E]/20 border border-[#C8102E]/30 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-[#E82040]" />
          </div>
          <div>
            <p className="text-xs text-white/70 font-medium leading-none">Profilim</p>
            <p className="text-[10px] text-white/35 leading-none mt-0.5">Passenger: Ahmet Yılmaz</p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="px-5 pb-3">
        <p className="text-[10px] text-white/20">© 2024 Turkish Airlines. All rights reserved.</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   IRROPS SIDEBAR
═══════════════════════════════════════════════ */
function IrropsSidebar({ pathname }: { pathname: string }) {
  return (
    <div className="w-[240px] shrink-0 flex flex-col h-full"
      style={{
        background: "rgba(10,11,18,0.98)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
        <ThyLogo size={32} />
        <span className="text-white font-black text-base tracking-widest">THY</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {IRROPS_NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 group ${
                active
                  ? "bg-[#C8102E]/20 border border-[#C8102E]/30"
                  : "hover:bg-white/5 border border-transparent"
              }`}>
              <Icon className={`shrink-0 transition-colors ${
                active ? "text-[#E82040]" : "text-white/40 group-hover:text-white/70"
              }`} style={{ width: 18, height: 18 }} />
              <span className={`text-sm font-medium transition-colors ${
                active ? "text-white" : "text-white/50 group-hover:text-white/80"
              }`}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/5 p-4 space-y-2">
        <div className="flex items-center gap-2 px-3 py-2">
          <Headphones className="w-4 h-4 text-white/30 shrink-0" />
          <span className="text-xs text-white/30">Destek</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-white/50" />
          </div>
          <div>
            <p className="text-xs text-white/60 font-medium leading-none">Profilim</p>
            <p className="text-[10px] text-white/30 leading-none mt-0.5">Passenger: Ahmet Yılmaz</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   PASSENGER SIDEBAR
═══════════════════════════════════════════════ */
function PassengerSidebar({ pathname }: { pathname: string }) {
  return (
    <div className="w-[220px] shrink-0 flex flex-col h-full"
      style={{
        background: "rgba(10,11,18,0.98)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
        <ThyLogo size={32} />
        <span className="text-white font-black text-base tracking-widest">THY</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {PASSENGER_NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 group ${
                active
                  ? "bg-[#C8102E]/20 border border-[#C8102E]/30"
                  : "hover:bg-white/5 border border-transparent"
              }`}>
              <Icon className={`shrink-0 ${active ? "text-[#E82040]" : "text-white/40 group-hover:text-white/70"}`}
                style={{ width: 18, height: 18 }} />
              <span className={`text-sm font-medium ${active ? "text-white" : "text-white/50 group-hover:text-white/80"}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Profile */}
      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-[#C8102E]/20 border border-[#C8102E]/30 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-[#E82040]" />
          </div>
          <div>
            <p className="text-xs text-white/70 font-medium leading-none">Profilim</p>
            <p className="text-[10px] text-white/35 leading-none mt-0.5">Passenger: Ahmet Yılmaz</p>
          </div>
        </div>
      </div>
    </div>
  )
}
