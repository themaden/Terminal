'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('manager@aeronexus.ai');
  const [password, setPassword] = useState('••••••••');
  const [role, setRole] = useState('Ops Director');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      // Save authenticated user profile to local storage under new AeroNexus key
      const userProfile = {
        name: email === 'manager@aeronexus.ai' ? 'Hakan Yılmaz' : 'Selin Aksoy',
        email: email,
        role: role,
        avatar: email === 'manager@aeronexus.ai' ? 'HY' : 'SA'
      };
      localStorage.setItem('aeronexus_user', JSON.stringify(userProfile));
      setIsLoading(false);
      window.location.href = '/dashboard';
    }, 1200);
  };

  const handleQuickSelect = (selEmail: string, selRole: string) => {
    setEmail(selEmail);
    setRole(selRole);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001229] flow-bg px-6 py-12 text-white select-none">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full flex flex-col gap-6 shadow-2xl border border-white/5">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-16 h-16 rounded-full bg-[#002349] flex items-center justify-center border border-white/10 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-primary-container/10 animate-pulse"></div>
            <span className="material-symbols-outlined text-primary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              flight_takeoff
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-surface-bright mt-1">
            AeroNexus AI
          </h1>
          <p className="text-[10px] font-bold text-primary-fixed tracking-widest uppercase text-shadow-glow">
            AI Intelligence Hub Login
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-surface-bright/50 tracking-wider">Kurumsal E-posta</label>
            <div className="flex items-center gap-2.5 bg-[#002349] border border-white/10 rounded-xl px-4 py-2.5">
              <span className="material-symbols-outlined text-white/30 text-base">mail</span>
              <input 
                type="email" 
                className="bg-transparent border-none outline-none text-xs w-full text-white placeholder-white/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-surface-bright/50 tracking-wider">Erişim Rolü</label>
            <div className="flex items-center gap-2.5 bg-[#002349] border border-white/10 rounded-xl px-4 py-2.5">
              <span className="material-symbols-outlined text-white/30 text-base">manage_accounts</span>
              <select 
                className="bg-transparent border-none outline-none text-xs w-full text-white font-bold select-none cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                <option value="Ops Director" className="bg-[#002349] text-white font-semibold">Operations Director (HITL)</option>
                <option value="System Admin" className="bg-[#002349] text-white font-semibold">System Administrator</option>
                <option value="Crew Dispatch" className="bg-[#002349] text-white font-semibold">Crew Dispatcher</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-primary-container hover:bg-accent-red-hover text-on-primary font-sans text-xs py-3 rounded-full hover:scale-[1.01] transition-all shadow-lg shadow-primary-container/20 font-bold flex items-center justify-center gap-2 mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Giriş Yapılıyor...</span>
              </>
            ) : (
              <>
                <KeyRound size={14} />
                <span>Güvenli Giriş Yap</span>
              </>
            )}
          </button>
        </form>

        {/* Quick select profiles */}
        <div className="border-t border-white/10 pt-4 flex flex-col gap-2.5">
          <p className="text-[9px] font-bold uppercase text-surface-bright/40 tracking-wider text-center">Hızlı Rol Seçimi (Test)</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button 
              className="text-[10px] py-2 bg-white/5 border border-white/10 rounded-xl hover:border-primary-container hover:text-primary-fixed transition-all font-bold text-white/70"
              onClick={() => handleQuickSelect('manager@aeronexus.ai', 'Ops Director')}
            >
              Ops Director
            </button>
            <button 
              className="text-[10px] py-2 bg-white/5 border border-white/10 rounded-xl hover:border-primary-container hover:text-primary-fixed transition-all font-bold text-white/70"
              onClick={() => handleQuickSelect('admin@aeronexus.ai', 'System Admin')}
            >
              System Admin
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/40 mt-1">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span>SSO OIDC Entegrasyonu Etkin</span>
        </div>
      </div>
    </div>
  );
}
