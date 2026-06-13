"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Shield, Bell, User, Sliders, Lock, Mail, Phone, Save } from "lucide-react"

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
      style={{ background: active ? "#C8102E" : "rgba(255,255,255,0.15)" }}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${active ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  )
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-4"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2.5 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(200,16,46,0.15)" }}>
          <Icon className="w-3.5 h-3.5 text-[#E82040]" />
        </div>
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InputField({ label, value, type = "text" }: { label: string; value: string; type?: string }) {
  return (
    <div>
      <label className="text-white/40 text-xs mb-1.5 block font-medium tracking-wide">{label}</label>
      <input defaultValue={value} type={type}
        className="w-full px-3.5 py-2.5 rounded-lg text-white/80 text-sm outline-none transition-colors focus:border-[rgba(200,16,46,0.5)]"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      />
    </div>
  )
}

export default function SettingsPage() {
  const [emailNotif, setEmailNotif] = useState(true)
  const [smsNotif,   setSmsNotif]   = useState(true)
  const [appNotif,   setAppNotif]   = useState(true)
  const [darkMode,   setDarkMode]   = useState(true)
  const [twoFactor,  setTwoFactor]  = useState(true)
  const [crisisAlert,setCrisisAlert]= useState(true)
  const [aiLevel,    setAiLevel]    = useState(65)

  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: "radial-gradient(ellipse 60% 50% at 5% 5%, rgba(150,8,25,0.12) 0%, transparent 55%), linear-gradient(135deg, #0f1222 0%, #080a12 100%)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
        <h1 className="text-2xl font-bold text-white tracking-tight shrink-0">Ayarlar</h1>

        <div className="flex-1 grid grid-cols-3 gap-5 overflow-auto min-h-0">

          {/* Profil Ayarları */}
          <SectionCard title="Profil Ayarları" icon={User}>
            <InputField label="Ad Soyad"  value="Ahmet Yılmaz" />
            <InputField label="E-posta"   value="ahmet.yilmaz@thy.com" />
            <InputField label="Departman" value="Operasyon Merkezi" />
            <InputField label="Telefon"   value="+90 532 123 45 67" />

            <div className="p-3 rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-white/40 text-xs mb-1">Rol</p>
              <p className="text-white/80 text-sm font-semibold">Kıdemli Operasyon Uzmanı</p>
            </div>

            <button className="w-full py-2.5 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: "#C8102E", boxShadow: "0 4px 12px rgba(200,16,46,0.3)" }}>
              <Save className="w-4 h-4" />
              Profili Güncelle
            </button>
          </SectionCard>

          {/* Orta Kolon */}
          <div className="flex flex-col gap-5">
            <SectionCard title="Sistem Tercihleri" icon={Sliders}>
              <div>
                <label className="text-white/40 text-xs mb-3 block font-medium">
                  Yapay Zeka Hassasiyeti — <span className="text-[#E82040] font-bold">{aiLevel}%</span>
                </label>
                <input type="range" min={0} max={100} value={aiLevel}
                  onChange={e => setAiLevel(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full outline-none cursor-pointer appearance-none"
                  style={{ background: `linear-gradient(to right, #C8102E ${aiLevel}%, rgba(255,255,255,0.12) ${aiLevel}%)` }}
                />
                <div className="flex justify-between text-white/25 text-[10px] mt-1.5">
                  <span>Düşük</span>
                  <span>Orta</span>
                  <span>Yüksek</span>
                </div>
              </div>

              {[
                { label: "Koyu Mod",           active: darkMode,   toggle: () => setDarkMode(!darkMode)     },
                { label: "Kriz Uyarıları",     active: crisisAlert,toggle: () => setCrisisAlert(!crisisAlert) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <span className="text-white/70 text-sm">{item.label}</span>
                  <Toggle active={item.active} onToggle={item.toggle} />
                </div>
              ))}
            </SectionCard>

            <SectionCard title="Güvenlik" icon={Shield}>
              <div className="p-3 rounded-lg flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Lock className="w-4 h-4 text-white/40 shrink-0" />
                <div className="flex-1">
                  <p className="text-white/70 text-sm font-medium">Şifre</p>
                  <p className="text-white/30 text-xs">Son değişiklik: 30 gün önce</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
                  style={{ background: "#C8102E" }}>
                  Değiştir
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">İki Faktörlü Kimlik</p>
                  <p className="text-white/30 text-xs">SMS ile doğrulama</p>
                </div>
                <Toggle active={twoFactor} onToggle={() => setTwoFactor(!twoFactor)} />
              </div>

              <div className="p-3 rounded-lg"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <p className="text-[#10b981] text-xs font-semibold">✓ Hesabınız güvende</p>
                <p className="text-[#10b981]/60 text-[10px] mt-0.5">Son giriş: Bugün, 09:14 — İstanbul</p>
              </div>
            </SectionCard>
          </div>

          {/* Bildirimler */}
          <SectionCard title="Bildirim Kanalları" icon={Bell}>
            {[
              { label: "E-posta Bildirimleri",     icon: Mail,  active: emailNotif, toggle: () => setEmailNotif(!emailNotif), desc: "ahmet.yilmaz@thy.com" },
              { label: "SMS Bildirimleri",          icon: Phone, active: smsNotif,   toggle: () => setSmsNotif(!smsNotif),     desc: "+90 532 123 45 67"     },
              { label: "Uygulama İçi Bildirimler", icon: Bell,  active: appNotif,   toggle: () => setAppNotif(!appNotif),     desc: "THY Operasyon Uygulaması" },
            ].map(item => {
              const ItemIcon = item.icon
              return (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{ background: item.active ? "rgba(200,16,46,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${item.active ? "rgba(200,16,46,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: item.active ? "rgba(200,16,46,0.15)" : "rgba(255,255,255,0.06)" }}>
                    <ItemIcon className="w-4 h-4" style={{ color: item.active ? "#E82040" : "rgba(255,255,255,0.35)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-medium">{item.label}</p>
                    <p className="text-white/30 text-xs truncate">{item.desc}</p>
                  </div>
                  <Toggle active={item.active} onToggle={item.toggle} />
                </div>
              )
            })}

            <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-white/40 text-xs font-semibold mb-3 uppercase tracking-wide">Bildirim Türleri</p>
              {[
                "Kriz Uyarıları",
                "Uçuş İptalleri",
                "Yolcu Güncellemeleri",
                "Sistem Bildirimleri",
              ].map(t => (
                <div key={t} className="flex items-center justify-between py-1.5">
                  <span className="text-white/60 text-sm">{t}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                </div>
              ))}
            </div>
          </SectionCard>

        </div>

        <p className="text-white/20 text-xs text-center shrink-0">© 2024 Turkish Airlines. All rights reserved.</p>
      </div>
    </div>
  )
}
