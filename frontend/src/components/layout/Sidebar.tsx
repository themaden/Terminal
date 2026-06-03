'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  {
    section: 'ANA',
    items: [
      { path: '/dashboard', icon: 'grid_view',     label: 'Dashboard' },
    ],
  },
  {
    section: 'KRİZ YÖNETİMİ',
    items: [
      { path: '/crisis',     icon: 'crisis_alert', label: 'Aktif Krizler' },
      { path: '/iocc',       icon: 'monitoring',   label: 'IOCC Merkezi' },
    ],
  },
  {
    section: 'TRANSFER OPS',
    items: [
      { path: '/hub-control',icon: 'hub',                  label: 'Hub Kontrol' },
      { path: '/mct',        icon: 'connecting_airports',  label: 'MCT / ACT' },
      { path: '/gate',       icon: 'door_sliding',         label: 'Gate & Apron' },
    ],
  },
  {
    section: 'YOLCU',
    items: [
      { path: '/pcc',          icon: 'support_agent',    label: 'PCC' },
      { path: '/passengers',   icon: 'group',            label: 'Yolcular' },
      { path: '/self-service', icon: 'smartphone',       label: 'Self-Service' },
      { path: '/call-center',  icon: 'phone_in_talk',    label: 'Çağrı Merkezi' },
      { path: '/vouchers',     icon: 'confirmation_number', label: 'Voucher' },
    ],
  },
  {
    section: 'UÇUŞLAR',
    items: [
      { path: '/flights',    icon: 'flight_takeoff', label: 'Uçuş Tahtası' },
      { path: '/prediction', icon: 'radar',          label: 'Risk Tahmini' },
      { path: '/optimization',icon: 'route',         label: 'Optimizasyon' },
    ],
  },
  {
    section: 'ANALİTİK',
    items: [
      { path: '/revenue',    icon: 'bar_chart',       label: 'Gelir Yönetimi' },
      { path: '/cost-model', icon: 'account_balance', label: 'Maliyet Modeli' },
      { path: '/simulation', icon: 'science',         label: 'Simülasyon' },
    ],
  },
  {
    section: 'SİSTEM',
    items: [
      { path: '/audit',        icon: 'shield',                  label: 'Audit Log' },
      { path: '/integrations', icon: 'settings_input_component', label: 'Entegrasyonlar' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="flex-shrink-0 flex flex-col border-r transition-all duration-200"
      style={{
        width: collapsed ? 52 : 220,
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        minHeight: '100vh',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: '#c8102e' }}>
          <span className="material-symbols-outlined text-white" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>
            flight_takeoff
          </span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display font-bold text-white leading-none" style={{ fontSize: 14 }}>JetNexus</p>
            <p style={{ fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.1em' }}>IRROPS AI</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="ml-auto text-white/20 hover:text-white/60 transition-colors flex-shrink-0"
          style={{ fontSize: 18 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
        {NAV.map(group => (
          <div key={group.section}>
            {!collapsed && (
              <p className="sidebar-label">{group.section}</p>
            )}
            {collapsed && <div className="my-2 border-t" style={{ borderColor: 'var(--border)' }} />}
            {group.items.map(item => {
              const active = pathname === item.path || pathname?.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`sidebar-item ${active ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  style={collapsed ? { justifyContent: 'center', padding: '8px' } : {}}
                >
                  <span
                    className="material-symbols-outlined flex-shrink-0"
                    style={{
                      fontSize: 18,
                      fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                      color: active ? '#c8102e' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && <span style={{ fontSize: 13 }}>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
