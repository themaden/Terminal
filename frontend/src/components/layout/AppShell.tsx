'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

const NO_SHELL = ['/login', '/'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<object | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem('jetnexus_user');
    if (saved) { try { setUser(JSON.parse(saved)); } catch {} }
    setReady(true);
  }, []);

  const isPublic = NO_SHELL.includes(pathname ?? '');
  const isOptimization = pathname === '/optimization';

  // Loading spinner
  if (!ready) {
    return (
      <div style={{ background: '#020d1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, margin: '0 auto 14px',
            border: '2px solid rgba(200,16,46,0.25)',
            borderTop: '2px solid #c8102e',
            borderRadius: '50%',
            animation: 'spin .7s linear infinite',
          }} />
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', fontFamily: 'Inter,sans-serif' }}>
            JETNEXUS AI
          </p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!user && !isPublic) {
    if (typeof window !== 'undefined') { window.location.href = '/login'; return null; }
  }

  // Public pages (login, root) — no shell
  if (isPublic || !user) {
    return <div style={{ background: '#020d1a', minHeight: '100vh' }}>{children}</div>;
  }

  // Full-screen pages (optimization)
  if (isOptimization) {
    return (
      <div style={{ background: '#020d1a', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        {children}
      </div>
    );
  }

  // Main shell: sidebar + topbar + scrollable content
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Topbar />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
