'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, KeyRound, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('manager@aerosys.com');
  const [password, setPassword] = useState('••••••••');
  const [role, setRole] = useState('Ops Director');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      // Save authenticated user profile to local storage
      const userProfile = {
        name: email === 'manager@aerosys.com' ? 'Hakan Yılmaz' : 'Selin Aksoy',
        email: email,
        role: role,
        avatar: email === 'manager@aerosys.com' ? 'HY' : 'SA'
      };
      localStorage.setItem('aerosys_user', JSON.stringify(userProfile));
      setIsLoading(false);
      window.location.href = '/dashboard';
    }, 1200);
  };

  const handleQuickSelect = (selEmail: string, selRole: string) => {
    setEmail(selEmail);
    setRole(selRole);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface flow-bg px-6 py-12">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full flex flex-col gap-6 shadow-2xl border border-flow-silver/50">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center border border-flow-silver shadow-inner">
            <span className="material-symbols-outlined text-primary text-4xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              flight_takeoff
            </span>
          </div>
          <h1 className="text-display-lg font-display text-2xl tracking-tight text-on-surface">
            AeroSys Precision
          </h1>
          <p className="text-label-sm font-bold text-primary tracking-widest uppercase">
            AI Intelligence Hub Login
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm uppercase text-on-surface-variant font-bold">Kurumsal E-posta</label>
            <div className="flex items-center gap-2 bg-surface-light border border-flow-silver/60 rounded-xl px-4 py-2.5">
              <span className="material-symbols-outlined text-secondary text-lg">mail</span>
              <input 
                type="email" 
                className="bg-transparent border-none outline-none text-sm w-full text-on-surface"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm uppercase text-on-surface-variant font-bold">Şifre</label>
            <div className="flex items-center gap-2 bg-surface-light border border-flow-silver/60 rounded-xl px-4 py-2.5">
              <span className="material-symbols-outlined text-secondary text-lg">lock</span>
              <input 
                type="password" 
                className="bg-transparent border-none outline-none text-sm w-full text-on-surface"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm uppercase text-on-surface-variant font-bold">Erişim Rolü</label>
            <div className="flex items-center gap-2 bg-surface-light border border-flow-silver/60 rounded-xl px-4 py-2.5">
              <span className="material-symbols-outlined text-secondary text-lg">manage_accounts</span>
              <select 
                className="bg-transparent border-none outline-none text-sm w-full text-on-surface font-semibold"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Ops Director">Operations Director (HITL)</option>
                <option value="System Admin">System Administrator</option>
                <option value="Crew Dispatch">Crew Dispatcher</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-primary text-on-primary font-sans text-label-md py-3 rounded-full hover:bg-accent-red-hover transition-all shadow-md font-bold flex items-center justify-center gap-2 mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Giriş Yapılıyor...</span>
              </>
            ) : (
              <>
                <KeyRound size={16} />
                <span>Güvenli Giriş Yap</span>
              </>
            )}
          </button>
        </form>

        {/* Quick select profiles */}
        <div className="border-t border-flow-silver/40 pt-4 flex flex-col gap-2">
          <p className="text-label-sm uppercase text-on-surface-variant font-bold text-center">Hızlı Rol Seçimi (Test)</p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              className="text-xs py-2 bg-surface-light border border-flow-silver/60 rounded-xl hover:border-primary hover:text-primary transition-all font-bold"
              onClick={() => handleQuickSelect('manager@aerosys.com', 'Ops Director')}
            >
              Ops Director
            </button>
            <button 
              className="text-xs py-2 bg-surface-light border border-flow-silver/60 rounded-xl hover:border-primary hover:text-primary transition-all font-bold"
              onClick={() => handleQuickSelect('admin@aerosys.com', 'System Admin')}
            >
              System Admin
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-secondary mt-1">
          <ShieldCheck size={14} className="text-emerald" />
          <span>SSO OIDC Entegrasyonu Etkin</span>
        </div>
      </div>
    </div>
  );
}
