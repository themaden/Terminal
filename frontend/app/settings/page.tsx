"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="relative w-11 h-6 rounded-full transition-colors shrink-0"
      style={{ background: active ? "#C8102E" : "rgba(255,255,255,0.15)" }}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  )
}

export default function SettingsPage() {
  const [emailNotif,  setEmailNotif]  = useState(true)
  const [smsNotif,    setSmsNotif]    = useState(true)
  const [appNotif,    setAppNotif]    = useState(true)
  const [darkMode,    setDarkMode]    = useState(true)
  const [twoFactor,   setTwoFactor]  = useState(true)
  const [aiLevel,     setAiLevel]    = useState(65)

  return (
    <div className="h-screen flex overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.12) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)"
      }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
        <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">Ayarlar</h1>

        <div className="flex-1 grid grid-cols-3 gap-5 min-h-0 overflow-auto">

          {/* Profil Ayarları */}
          <div className="rounded-xl p-5 flex flex-col gap-4 h-fit"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold">Profil Ayarları</h3>

            {[
              { label: "Ad Soyad", value: "Ahmet Yılmaz" },
              { label: "E-posta",  value: "ahmet.yilmaz@thy.com" },
              { label: "Telefon",  value: "+90 532 123 45 67" },
            ].map(f => (
              <div key={f.label}>
                <label className="text-white/50 text-xs mb-1.5 block">{f.label}</label>
                <input defaultValue={f.value}
                  className="w-full px-3 py-2.5 rounded-lg text-white/80 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
            ))}

            <button className="w-full py-3 rounded-lg text-white font-semibold text-sm mt-1"
              style={{ background: "#C8102E" }}>
              Profili Güncelle
            </button>
          </div>

          {/* Sistem Tercihleri + Güvenlik */}
          <div className="flex flex-col gap-4 h-fit">
            {/* Sistem */}
            <div className="rounded-xl p-5 flex flex-col gap-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold">Sistem Tercihleri</h3>

              <div>
                <label className="text-white/50 text-xs mb-3 block">Yapay Zeka Hassasiyeti</label>
                <div className="relative">
                  <input type="range" min={0} max={100} value={aiLevel}
                    onChange={e => setAiLevel(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full outline-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #C8102E ${aiLevel}%, rgba(255,255,255,0.15) ${aiLevel}%)`
                    }}
                  />
                  <div className="flex justify-between text-white/30 text-xs mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Koyu Mod</span>
                <Toggle active={darkMode} onToggle={() => setDarkMode(!darkMode)} />
              </div>
            </div>

            {/* Güvenlik */}
            <div className="rounded-xl p-5 flex flex-col gap-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-white font-semibold">Güvenlik</h3>

              <button className="w-full py-3 rounded-lg text-white font-semibold text-sm"
                style={{ background: "#C8102E" }}>
                Şifreyi Değiştir
              </button>

              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">İki Faktörlü Kimlik Doğrulama</span>
                <Toggle active={twoFactor} onToggle={() => setTwoFactor(!twoFactor)} />
              </div>
            </div>
          </div>

          {/* Bildirim Kanalları */}
          <div className="rounded-xl p-5 flex flex-col gap-4 h-fit"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-semibold">Bildirim Kanalları</h3>

            {[
              { label: "E-posta Bildirimleri",    active: emailNotif, toggle: () => setEmailNotif(!emailNotif) },
              { label: "SMS Bildirimleri",         active: smsNotif,   toggle: () => setSmsNotif(!smsNotif)     },
              { label: "Uygulama İçi Bildirimler", active: appNotif,   toggle: () => setAppNotif(!appNotif)   },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <span className="text-white/70 text-sm">{item.label}</span>
                <Toggle active={item.active} onToggle={item.toggle} />
              </div>
            ))}
          </div>

        </div>

        <p className="text-white/20 text-xs text-center shrink-0">© 2024 Turkish Airlines. All rights reserved.</p>
      </div>
    </div>
  )
}
