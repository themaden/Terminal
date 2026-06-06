"use client"

import { useState, useEffect, useRef } from "react"
import { Plane, MessageSquare, Bell, Settings, Video, LogOut, X, CheckCircle2, AlertTriangle, Info } from "lucide-react"
import Link from "next/link"
import { getStoredUser, isAuthenticated, logout } from "@/lib/auth"

function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  if (!now) return { date: "—", time: "—:—" }
  const date = now.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase()
  const time = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
  return { date, time }
}

const MOCK_NOTIFICATIONS = [
  { id: "1", type: "critical", title: "TK1981 İptal Edildi", body: "AI karar üretimi başladı, 189 yolcu etkilendi.", time: "2dk önce", read: false },
  { id: "2", type: "warning", title: "Hub Bağlantı Riski", body: "34 yolcu aktarma süresini kaçırabilir.", time: "8dk önce", read: false },
  { id: "3", type: "success", title: "Kararlar Onaylandı", body: "Kriz #1 için 25 karar uygulandı.", time: "15dk önce", read: false },
  { id: "4", type: "info", title: "MILP Optimizasyon Tamamlandı", body: "Maliyet optimizasyonu %94 verimlilik sağladı.", time: "22dk önce", read: true },
  { id: "5", type: "success", title: "SMS/Email Gönderildi", body: "189 yolcuya bildirim başarıyla iletildi.", time: "28dk önce", read: true },
]

function notifIcon(type: string) {
  if (type === "critical") return <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
  if (type === "warning")  return <AlertTriangle className="w-3.5 h-3.5 text-[#E81932]" />
  if (type === "success")  return <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
  return <Info className="w-3.5 h-3.5 text-[#E81932]" />
}

function notifBg(type: string) {
  if (type === "critical") return "bg-[#ef4444]/10 border-[#ef4444]/20"
  if (type === "warning")  return "bg-[#E81932]/10 border-[#E81932]/20"
  if (type === "success")  return "bg-[#10b981]/10 border-[#10b981]/20"
  return "bg-[#E81932]/10 border-[#E81932]/20"
}

export function Header() {
  const { date, time } = useLiveClock()
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUser(getStoredUser())
    setAuthenticated(isAuthenticated())
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const unread = notifications.filter(n => !n.read).length

  function markAllRead() {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
  }

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "AY"

  return (
    <header className="h-14 bg-white border-b border-[#e5e5ed] flex items-center justify-between px-4 shrink-0 relative z-30 shadow-sm">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#E81932] px-3 py-1.5 rounded-lg shadow-md shadow-[#E81932]/20">
          <Plane className="w-4 h-4 text-white -rotate-45" />
          <span className="text-white font-bold text-sm tracking-tight">Aero-Response</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-px bg-[#dddde8]" />
          <h1 className="text-sm font-bold text-[#111111] tracking-wide">IRROPS Komuta Merkezi</h1>
          <div className="h-5 w-px bg-[#dddde8]" />
          <span className="text-[#555566] text-xs">Flightguard Havayolları</span>
          <div className="h-5 w-px bg-[#dddde8]" />
          <span className="text-[#555566] text-xs" suppressHydrationWarning>{date}</span>
          <div className="h-5 w-px bg-[#dddde8]" />
          <span className="text-[#111111] font-mono text-xs tabular-nums font-semibold" suppressHydrationWarning>{time}</span>
        </div>

        {/* LIVE badge */}
        <div className="flex items-center gap-1.5 ml-2 bg-[#ef4444]/10 border border-[#ef4444]/20 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
          <span className="text-[10px] font-bold text-[#ef4444] tracking-widest">CANLI</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-1">

        {/* Chat */}
        <button className="p-2 hover:bg-[#dddde8] rounded-lg transition-all duration-150 group">
          <MessageSquare className="w-4.5 h-4.5 text-[#666677] group-hover:text-[#888899] transition-colors" style={{ width: 18, height: 18 }} />
        </button>

        {/* Video */}
        <button className="relative p-2 hover:bg-[#dddde8] rounded-lg transition-all duration-150 group">
          <Video className="text-[#666677] group-hover:text-[#888899] transition-colors" style={{ width: 18, height: 18 }} />
          <span className="absolute top-1 right-1 min-w-3.5 h-3.5 bg-[#E81932] rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5">
            10
          </span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(v => !v)}
            className={`relative p-2 rounded-lg transition-all duration-150 group ${showNotif ? "bg-[#dddde8]" : "hover:bg-[#dddde8]"}`}
          >
            <Bell className={`transition-colors ${showNotif ? "text-[#E81932]" : "text-[#666677] group-hover:text-[#888899]"}`} style={{ width: 18, height: 18 }} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-3.5 h-3.5 bg-[#ef4444] rounded-full text-[9px] font-bold text-[#111111] flex items-center justify-center px-0.5 animate-pulse">
                {unread}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#e5e5ed] rounded-xl shadow-xl shadow-black/10 z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5ed] bg-[#f8f8fb]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#E81932]" />
                  <span className="text-sm font-semibold text-[#111111]">Bildirimler</span>
                  {unread > 0 && (
                    <span className="bg-[#ef4444] text-[#111111] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-[#E81932] hover:text-[#111111] transition-colors px-2 py-1 rounded hover:bg-[#dddde8]">
                      Tümünü Okundu Say
                    </button>
                  )}
                  <button onClick={() => setShowNotif(false)} className="p-1 hover:bg-[#dddde8] rounded transition-colors">
                    <X className="w-3.5 h-3.5 text-[#666677]" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-[#ededf2]">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 transition-colors hover:bg-[#f5f5f9] ${!n.read ? "bg-[#fdf5f6]" : ""}`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg border shrink-0 ${notifBg(n.type)}`}>
                      {notifIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-xs font-semibold ${!n.read ? "text-[#111111]" : "text-[#888899]"}`}>{n.title}</p>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#E81932] shrink-0" />}
                      </div>
                      <p className="text-[11px] text-[#666677] leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-[#999aaa] mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-[#e5e5ed] px-4 py-2.5 bg-[#f8f8fb]">
                <button className="text-xs text-[#E81932] hover:text-[#111111] transition-colors w-full text-center">
                  Tüm Bildirimleri Görüntüle →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <Link href="/settings" title="Ayarlar"
          className="p-2 hover:bg-[#dddde8] rounded-lg transition-all duration-150 group">
          <Settings className="text-[#666677] group-hover:text-[#888899] transition-colors" style={{ width: 18, height: 18 }} />
        </Link>

        <div className="w-px h-6 bg-[#dddde8] mx-1" />

        {/* Profile */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full border-2 border-[#E81932]/30 bg-linear-to-br from-[#E81932] to-[#B8101E] flex items-center justify-center shadow-md shadow-[#E81932]/20">
              <span className="text-white text-[11px] font-bold">{initials}</span>
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#10b981] border border-white rounded-full" />
          </div>
          {user && (
            <div className="hidden xl:flex flex-col">
              <span className="text-xs text-[#111111] font-medium max-w-[100px] truncate leading-none">{user.name}</span>
              <span className="text-[10px] text-[#666677] leading-none mt-0.5">Operatör</span>
            </div>
          )}
        </div>

        {authenticated && (
          <button onClick={logout} title="Çıkış Yap"
            className="p-2 hover:bg-[#ef4444]/10 rounded-lg transition-all duration-150 group ml-1">
            <LogOut className="text-[#666677] group-hover:text-[#ef4444] transition-colors" style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#E81932]/20 to-transparent" />
    </header>
  )
}
