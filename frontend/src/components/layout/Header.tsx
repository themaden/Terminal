'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Durum', path: '/dashboard', icon: 'dashboard' },
  { name: 'Kriz', path: '/crisis', icon: 'crisis_alert' },
  { name: 'PCC', path: '/pcc', icon: 'support_agent' },
  { name: 'Hub', path: '/hub-control', icon: 'hub' },
  { name: 'IOCC', path: '/iocc', icon: 'monitoring' },
  { name: 'Gelir', path: '/revenue', icon: 'bar_chart_4_bars' },
  { name: 'Simülasyon', path: '/simulation', icon: 'science' },
  { name: 'Tahmin', path: '/prediction', icon: 'radar' },
  { name: 'Self-Service', path: '/self-service', icon: 'self_improvement' },
  { name: 'Optimizasyon', path: '/optimization', icon: 'route' },
  { name: 'Yolcular', path: '/passengers', icon: 'group' },
  { name: 'Uçuşlar', path: '/flights', icon: 'flight_takeoff' },
  { name: 'Audit', path: '/audit', icon: 'shield_with_heart' },
];

interface User { name: string; role: string; avatar: string }

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('jetnexus_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    } else {
      setUser({ name: 'Yasin Maden', role: 'Ops Director', avatar: 'YM' });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jetnexus_user');
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#001229]/90 backdrop-blur-xl border-b border-white/10 select-none">
      <div className="flex justify-between items-center px-6 md:px-12 py-3 max-w-[1600px] mx-auto w-full">

        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 text-xl font-display font-bold text-surface-bright hover:text-primary-fixed transition-colors shrink-0">
          <span className="material-symbols-outlined text-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            flight_takeoff
          </span>
          JetNexus AI
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-container/20 text-primary-fixed border border-primary-container/30'
                    : 'text-surface-bright/60 hover:text-surface-bright hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right: user pill */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-[10px] font-display shrink-0">
                {user.avatar}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-surface-bright leading-none">{user.name}</div>
                <span className="text-[10px] text-surface-bright/50">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Oturumu Kapat"
                className="text-white/40 hover:text-primary-container transition-colors p-1 ml-1 border-l border-white/10 pl-2"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 text-surface-bright/60 hover:text-white"
            onClick={() => setMenuOpen(v => !v)}
          >
            <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-[#001229]/98 border-t border-white/10 px-6 py-4 grid grid-cols-2 gap-2">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary-container/20 text-primary-fixed border border-primary-container/30'
                    : 'text-surface-bright/60 hover:text-surface-bright hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
