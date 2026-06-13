"use client"

import { Search } from "lucide-react"
import Link from "next/link"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BedDouble, Utensils, Calendar, MessageCircle, ChevronRight } from "lucide-react"

export default function PassengerPortalPage() {
  return (
    <div className="h-screen flex overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.12) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)"
      }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <h1 className="text-2xl font-bold text-white tracking-tight">Yolcu Geri Kazanım Portalı</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Search className="w-4 h-4 text-white/40" />
              <input placeholder="Uçuş, Yolcu veya Kaynak Ara"
                className="bg-transparent text-white/80 text-sm outline-none placeholder-white/30 w-48" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(232,32,64,0.15)", border: "1px solid rgba(232,32,64,0.3)" }}>
              <span className="w-2 h-2 rounded-full bg-[#E82040] animate-pulse-live" />
              <span className="text-[#E82040] text-xs font-bold tracking-widest">Canlı</span>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 pb-5 flex flex-col gap-5 overflow-y-auto">

          {/* Welcome + Flight Status */}
          <div className="rounded-xl p-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-2xl font-bold text-white mb-1">Hoş Geldiniz, Ahmet Yılmaz.</h2>
            <p className="text-white/60 text-base mb-5">Uçuşunuzu sizin için yönetiyoruz.</p>

            {/* Flight Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: "#C8102E", border: "1px solid rgba(232,32,64,0.3)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <span className="text-lg">✈️</span>
              </div>
              <div className="flex-1">
                <p className="text-white/80 text-xs font-medium">Uçuş Durumu:</p>
                <p className="text-white font-bold">TK1923 IST-JFK, 12:00</p>
                <p className="text-white/70 text-xs">DURUM: AKSAMA VAR - Yönetim Altında</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70" />
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: BedDouble, label: "Otel Konaklaması",
                status: "Onaylandı", statusColor: "#10b981",
              },
              {
                icon: Utensils, label: "Yemek Kuponu",
                status: "Hazırlanıyor", statusColor: "#f59e0b",
              },
              {
                icon: Calendar, label: "Yeni Uçuş Planı",
                status: "Gözden Geçiriliyor", statusColor: "#94a3b8",
              },
            ].map(s => (
              <div key={s.label}
                className="flex flex-col items-center gap-3 p-5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  <s.icon className="w-6 h-6 text-white/70" />
                </div>
                <p className="text-white/90 text-sm font-medium text-center">{s.label}</p>
                <p className="text-xs font-semibold" style={{ color: s.statusColor }}>{s.status}</p>
              </div>
            ))}
          </div>

          {/* Live Support */}
          <div className="flex justify-center">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <MessageCircle className="w-5 h-5" />
              Canlı Destek
            </button>
          </div>

        </div>

        <p className="text-white/20 text-xs text-center pb-3 shrink-0">© 2024 Turkish Airlines. All rights reserved.</p>
      </div>
    </div>
  )
}
