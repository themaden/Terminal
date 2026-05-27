'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('aerosys_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('aerosys_user');
    window.location.href = '/dashboard';
  };

  const menuItems = [
    { name: 'Sistem Durumu', path: '/dashboard' },
    { name: 'Kriz Yönetimi', path: '/crisis' },
    { name: 'Rota Optimizasyonu', path: '/optimization' },
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

        {/* Right-side Auth & Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 bg-surface-light border border-flow-silver/40 rounded-full px-4 py-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs font-display">
                {user.avatar}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-on-surface leading-none">{user.name}</div>
                <span className="text-[10px] text-on-surface-variant font-medium">{user.role}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-secondary hover:text-primary transition-colors p-1"
                title="Oturumu Kapat"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="bg-primary text-on-primary font-sans text-sm px-6 py-2 rounded-full hover:bg-accent-red-hover transition-colors duration-300 shadow-sm font-bold">
              Giriş
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
