"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plane, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"
import { login, isAuthenticated } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isAuthenticated()) router.replace("/")
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      router.replace("/")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Giriş başarısız")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7fa] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-[#E81932]/4 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-[#B8101E]/6 rounded-full blur-[80px]" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#E81932 1px, transparent 1px), linear-gradient(90deg, #E81932 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[#E81932] rounded-xl flex items-center justify-center shadow-lg shadow-[#E81932]/20">
              <Plane className="w-5 h-5 text-[#09090e] -rotate-45" />
            </div>
            <div>
              <p className="text-[#111111] font-bold text-lg leading-none tracking-tight">JetNexus AI</p>
              <p className="text-[#666677] text-[10px] uppercase tracking-[0.18em] mt-0.5">Airline Operations</p>
            </div>
          </div>
          <h1 className="text-xl font-bold text-[#111111] tracking-tight">IRROPS Komuta Merkezi</h1>
          <p className="text-[#666677] text-xs mt-1">Operatör Girişi</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#dddde6] rounded-2xl p-7 shadow-2xl shadow-black/60">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-semibold text-[#555566] uppercase tracking-[0.14em] mb-1.5">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999aaa]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@jetnexus.ai"
                  required
                  className="w-full bg-[#ededf4] border border-[#dddde6] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#111111] placeholder:text-[#999aaa] focus:outline-none focus:ring-1 focus:ring-[#E81932]/40 focus:border-[#E81932]/60 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-semibold text-[#555566] uppercase tracking-[0.14em] mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999aaa]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#ededf4] border border-[#dddde6] rounded-xl pl-9 pr-10 py-2.5 text-sm text-[#111111] placeholder:text-[#999aaa] focus:outline-none focus:ring-1 focus:ring-[#E81932]/40 focus:border-[#E81932]/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999aaa] hover:text-[#555566] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-[#ef4444]/8 border border-[#ef4444]/20 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#ef4444] shrink-0" />
                <p className="text-xs text-[#ef4444]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E81932] hover:bg-[#FF2F46] disabled:opacity-50 disabled:cursor-not-allowed text-[#09090e] font-bold py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#E81932]/20 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Giriş yapılıyor…</span>
                </>
              ) : (
                <span>Sisteme Giriş Yap</span>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-3 bg-[#f9f9fc] border border-[#e4e4ee] rounded-xl">
            <p className="text-[9px] text-[#999aaa] uppercase tracking-[0.15em] mb-1.5 font-semibold">Demo Hesabı</p>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-[#666677]">
                <span className="text-[#555566]">E-posta: </span>
                <span className="text-[#111111] font-mono">manager@jetnexus.ai</span>
              </p>
            </div>
            <p className="text-[11px] text-[#666677] mt-0.5">
              <span className="text-[#555566]">Şifre: </span>
              <span className="text-[#111111] font-mono">jetnexus2024</span>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#bbbbcc] mt-5 tracking-wide">
          JetNexus AI — Airline Irregular Operations Management
        </p>
      </div>
    </div>
  )
}
