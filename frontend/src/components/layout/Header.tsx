'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<{name: string; role: string; avatar: string} | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('jetnexus_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Default fallback session if local storage hasn't been set yet
      setUser({ name: 'Yasin Maden', role: 'Operations Director', avatar: 'YM' });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jetnexus_user');
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
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-dark/90 backdrop-blur-xl shadow-none border-b border-white/10 select-none">
      <div className="flex justify-between items-center px-6 md:px-16 py-4 max-w-7xl mx-auto w-full">
        {/* Brand Logo & Icon */}
        <div className="flex items-center gap-4 text-2xl font-display font-bold text-surface-bright">
          <span className="material-symbols-outlined text-primary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            flight_takeoff
          </span>
          <span className="tracking-tight">JetNexus AI</span>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
            return (
              <Link 
                key={item.name}
                href={item.path}
                className={`font-sans text-sm transition-all duration-300 pb-1 ${
                  isActive 
                    ? 'text-primary-fixed border-b-2 border-primary-container font-bold text-shadow-glow' 
                    : 'text-surface-bright/70 hover:text-primary-fixed'
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
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs font-display">
                {user.avatar}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-surface-bright leading-none">{user.name}</div>
                <span className="text-[10px] text-surface-bright/50 font-medium">{user.role}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-white/40 hover:text-primary-container transition-colors p-1 ml-1 border-l border-white/10 pl-2"
                title="Oturumu Kapat"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button className="bg-primary-container text-on-primary font-sans text-sm px-6 py-2 rounded-full hover:bg-accent-red-hover transition-colors duration-300 shadow-sm font-bold">
              Giriş
            </button>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .text-shadow-glow {
          text-shadow: 0 0 10px rgba(255, 218, 216, 0.6);
        }
      `}} />
    </header>
  );
}
