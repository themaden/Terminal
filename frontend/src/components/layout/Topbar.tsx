'use client';

import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';

interface User { name: string; role: string; avatar: string }

export default function Topbar() {
  const [user, setUser] = useState<User | null>(null);
  const [time, setTime] = useState('');
  const [activeCrises, setActiveCrises] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('jetnexus_user');
    if (saved) { try { setUser(JSON.parse(saved)); } catch {} }

    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }) + ' UTC');
    };
    tick();
    const t = setInterval(tick, 1000);

    // Poll active crises count
    const pollCrises = async () => {
      try {
        const r = await fetch('http://localhost:8000/api/v1/crisis/active');
        if (r.ok) {
          const d = await r.json();
          setActiveCrises(Array.isArray(d) ? d.length : 0);
        }
      } catch {}
    };
    pollCrises();
    const c = setInterval(pollCrises, 15000);

    return () => { clearInterval(t); clearInterval(c); };
  }, []);

  const logout = () => {
    localStorage.removeItem('jetnexus_user');
    localStorage.removeItem('jetnexus_token');
    window.location.href = '/login';
  };

  return (
    <header
      className="flex items-center px-5 gap-4 flex-shrink-0"
      style={{
        height: 52,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span className="dot-green live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>CANLI</span>
      </div>

      <div className="w-px h-4" style={{ background: 'var(--border)' }} />

      {/* Time */}
      <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
        {time}
      </span>

      <div className="w-px h-4" style={{ background: 'var(--border)' }} />

      {/* Active crises alert */}
      {activeCrises > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' }}>
          <span className="dot-red dot-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171' }}>{activeCrises} AKTİF KRİZ</span>
        </div>
      )}

      <div className="flex-1" />

      {/* System label */}
      <span style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' }}>
        JetNexus AI — IRROPS Karar Destek Sistemi
      </span>

      <div className="w-px h-4" style={{ background: 'var(--border)' }} />

      {/* User */}
      {user && (
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold flex-shrink-0"
            style={{ background: '#c8102e', fontSize: 10, color: '#fff' }}
          >
            {user.avatar}
          </div>
          <div className="hidden md:block leading-none">
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</p>
            <p style={{ fontSize: 10, color: 'var(--text-faint)' }}>{user.role}</p>
          </div>
          <button
            onClick={logout}
            className="ml-1 transition-colors"
            style={{ color: 'var(--text-faint)' }}
            title="Çıkış"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </header>
  );
}
