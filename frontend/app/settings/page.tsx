"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Settings, Key, Bell, Globe, Shield, Save, CheckCircle, Cpu, Database } from "lucide-react"

const MOCK_SIDEBAR = [
  { id: "1", code: "TK1981", route: "IST-LHR", status: "IPTAL" as const, section: "Yolcular", passengers: [] },
]

const TABS = [
  { id: "general", label: "Genel", icon: Settings },
  { id: "ai", label: "AI / LLM", icon: Cpu },
  { id: "integrations", label: "Entegrasyonlar", icon: Globe },
  { id: "notifications", label: "Bildirimler", icon: Bell },
  { id: "security", label: "Güvenlik", icon: Shield },
]

export default function SettingsPage() {
  const [tab, setTab] = useState("general")
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f2f2f6]">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeDisruptions={MOCK_SIDEBAR} />
        <div className="flex-1 flex flex-col overflow-hidden">

          <div className="flex items-center justify-between px-6 py-3 border-b border-[#e5e5ed] bg-white">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-[#E81932]" />
              <h1 className="text-base font-bold text-[#111111]">Sistem Ayarları</h1>
            </div>
            <button onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                saved ? "bg-[#10b981] text-[#111111]" : "bg-[#E81932] text-[#111111] hover:bg-[#FF2F46]"
              }`}>
              {saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? "Kaydedildi!" : "Kaydet"}
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Tab Menüsü */}
            <div className="w-52 bg-white border-r border-[#e5e5ed] py-4 space-y-1 px-3">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    tab === t.id ? "bg-[#e8e8f0] text-[#111111]" : "text-[#888899] hover:bg-[#e8e8f0]/50 hover:text-[#111111]"
                  }`}>
                  <t.icon className={`w-4 h-4 ${tab === t.id ? "text-[#E81932]" : "text-[#666677]"}`} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab İçeriği */}
            <div className="flex-1 overflow-auto p-6">
              {tab === "general" && (
                <div className="max-w-2xl space-y-6">
                  <Section title="Sistem Bilgileri">
                    <Field label="Uygulama Adı" defaultValue="JetNexus AI" />
                    <Field label="Ortam" defaultValue="development" />
                    <Field label="Sürüm" defaultValue="1.0.0" disabled />
                  </Section>
                  <Section title="Operasyon Merkezi">
                    <Field label="Havalimanı Kodu" defaultValue="LHR" />
                    <Field label="Zaman Dilimi" defaultValue="UTC+1 (London)" />
                    <Field label="Para Birimi" defaultValue="EUR" />
                  </Section>
                </div>
              )}

              {tab === "ai" && (
                <div className="max-w-2xl space-y-6">
                  <Section title="LLM Sağlayıcı">
                    <div className="space-y-3">
                      {[
                        { id: "openai", label: "OpenAI GPT-4o", desc: "En iyi performans" },
                        { id: "anthropic", label: "Anthropic Claude", desc: "Önerilen" },
                        { id: "ollama", label: "Ollama (Yerel)", desc: "Ücretsiz, internet gerekmez" },
                      ].map(p => (
                        <label key={p.id} className="flex items-center gap-3 p-3 bg-[#e8e8f0] rounded-lg cursor-pointer hover:bg-[#e2e2ec] transition-colors">
                          <input type="radio" name="provider" defaultChecked={p.id === "ollama"} className="accent-[#E81932]" />
                          <div>
                            <p className="text-sm text-[#111111] font-medium">{p.label}</p>
                            <p className="text-xs text-[#666677]">{p.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </Section>
                  <Section title="API Anahtarları">
                    <Field label="OpenAI API Key" defaultValue="" placeholder="sk-proj-..." type="password" />
                    <Field label="Anthropic API Key" defaultValue="" placeholder="sk-ant-..." type="password" />
                    <Field label="Ollama URL" defaultValue="http://localhost:11434" />
                  </Section>
                  <Section title="Model Parametreleri">
                    <Field label="Model" defaultValue="gpt-4o" />
                    <Field label="Temperature" defaultValue="0.1" />
                    <Field label="Max Tokens" defaultValue="4096" />
                  </Section>
                </div>
              )}

              {tab === "integrations" && (
                <div className="max-w-2xl space-y-6">
                  <Section title="Amadeus PSS">
                    <Field label="Client ID" defaultValue="sandbox_client_id" />
                    <Field label="Client Secret" defaultValue="" type="password" placeholder="••••••••" />
                    <StatusBadge label="Bağlantı Durumu" status="sandbox" />
                  </Section>
                  <Section title="Cirium AODB">
                    <Field label="App ID" defaultValue="your_cirium_app_id" />
                    <Field label="App Key" defaultValue="" type="password" placeholder="••••••••" />
                    <StatusBadge label="Bağlantı Durumu" status="offline" />
                  </Section>
                  <Section title="Veritabanı">
                    <Field label="Database URL" defaultValue="sqlite+aiosqlite:///aeroagent.sqlite3" />
                    <StatusBadge label="Bağlantı Durumu" status="online" />
                  </Section>
                </div>
              )}

              {tab === "notifications" && (
                <div className="max-w-2xl space-y-6">
                  <Section title="Bildirim Kanalları">
                    {[
                      { label: "SMS (Twilio)", enabled: false },
                      { label: "WhatsApp (Twilio)", enabled: false },
                      { label: "E-posta (SMTP)", enabled: true },
                      { label: "Push Bildirimi", enabled: false },
                    ].map(n => (
                      <div key={n.label} className="flex items-center justify-between p-3 bg-[#e8e8f0] rounded-lg">
                        <span className="text-sm text-[#111111]">{n.label}</span>
                        <button className={`w-10 h-5 rounded-full transition-colors relative ${n.enabled ? "bg-[#10b981]" : "bg-[#575578]"}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${n.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    ))}
                  </Section>
                </div>
              )}

              {tab === "security" && (
                <div className="max-w-2xl space-y-6">
                  <Section title="JWT & Kimlik Doğrulama">
                    <Field label="JWT Secret Key" defaultValue="••••••••••••••••" type="password" />
                    <Field label="JWT Süre (dakika)" defaultValue="480" />
                    <Field label="Algorithm" defaultValue="HS256" disabled />
                  </Section>
                  <Section title="Şifreleme">
                    <Field label="AES Encryption Key" defaultValue="••••••••••••••••" type="password" />
                  </Section>
                  <Section title="Kullanıcılar">
                    {[
                      { email: "manager@jetnexus.ai", role: "Manager" },
                      { email: "iocc@jetnexus.ai", role: "IOCC Operator" },
                      { email: "admin@jetnexus.ai", role: "Admin" },
                    ].map(u => (
                      <div key={u.email} className="flex items-center justify-between p-3 bg-[#e8e8f0] rounded-lg">
                        <div>
                          <p className="text-sm text-[#111111]">{u.email}</p>
                          <p className="text-xs text-[#666677]">{u.role}</p>
                        </div>
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded text-[10px]">
                          <Key className="w-3 h-3" /> Aktif
                        </span>
                      </div>
                    ))}
                  </Section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-[#666677] uppercase tracking-wider mb-3">{title}</h2>
      <div className="bg-white border border-[#e5e5ed] rounded-xl p-4 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, defaultValue, placeholder, type = "text", disabled = false }: {
  label: string; defaultValue?: string; placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-xs text-[#888899] mb-1">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 bg-[#f2f2f6] border border-[#e5e5ed] rounded-lg text-sm text-[#111111] placeholder-[#575578] focus:outline-none focus:border-[#2c2c40] disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  )
}

function StatusBadge({ label, status }: { label: string; status: "online" | "offline" | "sandbox" }) {
  const map = {
    online:  "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30",
    offline: "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30",
    sandbox: "bg-[#E81932]/20 text-[#E81932] border-[#E81932]/30",
  }
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#888899]">{label}</span>
      <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium ${map[status]}`}>
        <Database className="w-3 h-3" />
        {status === "online" ? "Bağlı" : status === "offline" ? "Bağlı Değil" : "Sandbox"}
      </span>
    </div>
  )
}
