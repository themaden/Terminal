'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, ChevronDown } from 'lucide-react';

// ── 5 kategoriye ayrılmış nav ─────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Operasyon',
    icon: 'monitoring',
    items: [
      { name: 'Dashboard',   path: '/dashboard',   icon: 'dashboard' },
      { name: 'Kriz',        path: '/crisis',       icon: 'crisis_alert' },
      { name: 'IOCC',        path: '/iocc',         icon: 'monitoring' },
      { name: 'Hub Kontrol', path: '/hub-control',  icon: 'hub' },
      { name: 'MCT / ACT',   path: '/mct',          icon: 'connecting_airports' },
    ],
  },
  {
    label: 'Yolcu',
    icon: 'groups',
    items: [
      { name: 'PCC',          path: '/pcc',          icon: 'support_agent' },
      { name: 'Yolcular',     path: '/passengers',   icon: 'group' },
      { name: 'Self-Service', path: '/self-service', icon: 'self_improvement' },
      { name: 'Çağrı Merkezi',path: '/call-center',  icon: 'phone_in_talk' },
      { name: 'Voucher',      path: '/vouchers',     icon: 'confirmation_number' },
    ],
  },
  {
    label: 'Uçuşlar',
    icon: 'flight',
    items: [
      { name: 'Uçuşlar',     path: '/flights',      icon: 'flight_takeoff' },
      { name: 'Gate & Hub',  path: '/gate',         icon: 'map' },
      { name: 'Tahmin',      path: '/prediction',   icon: 'radar' },
      { name: 'Optimizasyon',path: '/optimization', icon: 'route' },
    ],
  },
  {
    label: 'Analitik',
    icon: 'analytics',
    items: [
      { name: 'Gelir',       path: '/revenue',      icon: 'bar_chart_4_bars' },
      { name: 'Maliyet',     path: '/cost-model',   icon: 'account_balance' },
      { name: 'Simülasyon',  path: '/simulation',   icon: 'science' },
      { name: 'Audit',       path: '/audit',        icon: 'shield_with_heart' },
    ],
  },
  {
    label: 'Sistem',
    icon: 'settings',
    items: [
      { name: 'Entegrasyon', path: '/integrations', icon: 'settings_input_component' },
    ],
  },
];

// Tüm sayfaların düz listesi (aktif grup tespiti için)
const ALL_PATHS = NAV_GROUPS.flatMap(g => g.items.map(i => i.path));

interface User { name: string; role: string; avatar: string }

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('jetnexus_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    } else {
      setUser({ name: 'Yasin Maden', role: 'Ops Director', avatar: 'YM' });
    }
  }, []);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jetnexus_user');
    localStorage.removeItem('jetnexus_token');
    window.location.href = '/login';
  };

  const isGroupActive = (group: typeof NAV_GROUPS[0]) =>
    group.items.some(i => pathname === i.path || pathname?.startsWith(i.path + '/'));

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#001229]/95 backdrop-blur-xl border-b border-white/10 select-none">
      <div className="flex items-center justify-between px-6 md:px-10 py-2.5 max-w-[1600px] mx-auto w-full gap-4">

        {/* ── Brand ── */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-lg font-display font-bold text-surface-bright hover:text-primary-fixed transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            flight_takeoff
          </span>
          JetNexus AI
        </Link>

        {/* ── Desktop grouped nav ── */}
        <nav ref={navRef} className="hidden lg:flex items-center gap-1">
          {NAV_GROUPS.map(group => {
            const active = isGroupActive(group);
            const open = openGroup === group.label;

            return (
              <div key={group.label} className="relative">
                <button
                  onClick={() => setOpenGroup(open ? null : group.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-primary-container/20 text-primary-fixed border border-primary-container/30'
                      : 'text-surface-bright/60 hover:text-surface-bright hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                    {group.icon}
                  </span>
                  {group.label}
                  <ChevronDown size={11} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {open && (
                  <div className="absolute top-full left-0 mt-1.5 w-48 bg-[#001a35]/98 border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                    {group.items.map(item => {
                      const itemActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setOpenGroup(null)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors ${
                            itemActive
                              ? 'bg-primary-container/20 text-primary-fixed'
                              : 'text-surface-bright/60 hover:bg-white/5 hover:text-surface-bright'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: itemActive ? "'FILL' 1" : "'FILL' 0" }}>
                            {item.icon}
                          </span>
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Right: user pill + mobile button ── */}
        <div className="flex items-center gap-2 shrink-0">
          {user && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-2.5 py-1.5">
              <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-[9px] font-display shrink-0">
                {user.avatar}
              </div>
              <div className="hidden md:block text-left leading-none">
                <p className="text-[11px] font-bold text-surface-bright">{user.name}</p>
                <p className="text-[9px] text-surface-bright/40">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Çıkış"
                className="text-white/30 hover:text-primary-container transition-colors pl-2 ml-1 border-l border-white/10"
              >
                <LogOut size={12} />
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 text-surface-bright/60 hover:text-white"
            onClick={() => setMobileOpen(v => !v)}
          >
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* ── Mobile menu: gruplu accordion ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#001229]/99 border-t border-white/10 px-4 py-3 flex flex-col gap-1 max-h-[80vh] overflow-y-auto">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <button
                onClick={() => setOpenGroup(openGroup === group.label ? null : group.label)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-surface-bright/50 hover:text-surface-bright hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">{group.icon}</span>
                  {group.label}
                </div>
                <ChevronDown size={11} className={`transition-transform ${openGroup === group.label ? 'rotate-180' : ''}`} />
              </button>
              {openGroup === group.label && (
                <div className="ml-4 flex flex-col gap-0.5 mt-0.5">
                  {group.items.map(item => {
                    const active = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          active
                            ? 'bg-primary-container/20 text-primary-fixed border border-primary-container/30'
                            : 'text-surface-bright/60 hover:text-surface-bright hover:bg-white/5'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                          {item.icon}
                        </span>
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
