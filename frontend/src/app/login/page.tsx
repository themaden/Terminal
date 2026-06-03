'use client';

import React, { useState } from 'react';
import { Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { authApi } from '@/lib/api';

const PROFILES = [
  { email: 'manager@jetnexus.ai', password: 'jetnexus2024', label: 'Ops Director' },
  { email: 'iocc@jetnexus.ai',    password: 'jetnexus2024', label: 'IOCC Operator' },
  { email: 'admin@jetnexus.ai',   password: 'jetnexus2024', label: 'System Admin' },
];

export default function LoginPage() {
  const [email, setEmail] = useState(PROFILES[0].email);
  const [password, setPassword] = useState('jetnexus2024');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem('jetnexus_token', res.access_token);
      localStorage.setItem('jetnexus_user', JSON.stringify({
        name: res.user.name,
        role: res.user.role,
        avatar: res.user.avatar,
        email: res.user.email,
      }));
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  const quickSelect = (p: typeof PROFILES[0]) => {
    setEmail(p.email);
    setPassword(p.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001229] flow-bg px-6 py-12 text-white select-none">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full flex flex-col gap-6 shadow-2xl border border-white/5">

        {/* Brand */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-16 h-16 rounded-full bg-[#002349] flex items-center justify-center border border-white/10 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-primary-container/10 animate-pulse" />
            <span className="material-symbols-outlined text-primary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              flight_takeoff
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-surface-bright mt-1">JetNexus AI</h1>
          <p className="text-[10px] font-bold text-primary-fixed tracking-widest uppercase">
            AI Intelligence Hub
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-surface-bright/50 tracking-wider">Kurumsal E-posta</label>
            <div className="flex items-center gap-2.5 bg-[#002349] border border-white/10 rounded-xl px-4 py-2.5">
              <span className="material-symbols-outlined text-white/30 text-base">mail</span>
              <input
                type="email"
                className="bg-transparent border-none outline-none text-xs w-full text-white placeholder-white/30"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-surface-bright/50 tracking-wider">Şifre</label>
            <div className="flex items-center gap-2.5 bg-[#002349] border border-white/10 rounded-xl px-4 py-2.5">
              <span className="material-symbols-outlined text-white/30 text-base">lock</span>
              <input
                type="password"
                className="bg-transparent border-none outline-none text-xs w-full text-white placeholder-white/30"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <span className="material-symbols-outlined text-rose-400 text-sm">error</span>
              <p className="text-xs text-rose-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-container hover:bg-accent-red-hover text-on-primary font-sans text-xs py-3 rounded-full transition-all shadow-lg shadow-primary-container/20 font-bold flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          >
            {isLoading ? <><Loader2 size={14} className="animate-spin" /> Giriş Yapılıyor...</> : <><KeyRound size={14} /> Güvenli Giriş Yap</>}
          </button>
        </form>

        {/* Quick Profiles */}
        <div className="border-t border-white/10 pt-4 flex flex-col gap-2.5">
          <p className="text-[9px] font-bold uppercase text-surface-bright/40 tracking-wider text-center">Hızlı Rol Seçimi (Demo)</p>
          <div className="grid grid-cols-3 gap-2">
            {PROFILES.map(p => (
              <button
                key={p.email}
                onClick={() => quickSelect(p)}
                className={`text-[10px] py-2 px-1 border rounded-xl font-bold transition-all ${
                  email === p.email
                    ? 'border-primary-container text-primary-fixed bg-primary-container/10'
                    : 'bg-white/5 border-white/10 text-white/70 hover:border-primary-container hover:text-primary-fixed'
                }`}
              >
                {p.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/40">
          <ShieldCheck size={12} className="text-emerald-400" />
          SSO OIDC Entegrasyonu Etkin
        </div>
      </div>
    </div>
  );
}
