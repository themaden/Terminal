'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Sistem Durumu', path: '/dashboard' },
    { name: 'Kriz Yönetimi', path: '/crisis' },
    { name: 'Yolcu Takip', path: '/passengers' },
    { name: 'Uçuş Kontrol', path: '/flights' },
    { name: 'Audit Günlüğü', path: '/audit' }
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-bright/80 backdrop-blur-xl shadow-sm border-b border-flow-silver/30">
      <div className="flex justify-between items-center px-6 md:px-16 py-4 max-w-7xl mx-auto w-full">
        {/* Brand Logo & Icon */}
        <div className="flex items-center gap-4 text-2xl font-display font-bold text-on-surface">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            flight_takeoff
          </span>
          <span className="tracking-tight">AeroSys Precision</span>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
            return (
              <Link 
                key={item.name}
                href={item.path}
                className={`font-sans text-sm transition-colors duration-300 pb-1 ${
                  isActive 
                    ? 'text-primary border-b-2 border-primary font-bold' 
                    : 'text-on-surface hover:text-primary'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button className="font-sans text-sm text-on-surface hover:text-primary transition-colors duration-300 px-4 py-2">
            Giriş
          </button>
          <button className="bg-primary text-on-primary font-sans text-sm px-6 py-2 rounded-full hover:bg-accent-red-hover transition-colors duration-300 shadow-sm font-bold">
            Demo Talebi
          </button>
        </div>
      </div>
    </header>
  );
}
