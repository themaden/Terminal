'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import '@/app/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <title>Aero-Agent - Otonom Kriz Yönetim Sistemi</title>
        <meta name="description" content="Uçuş iptalleri ve rötarlar için yapay zeka ve yöneylem destekli otonom kurtarma aracı" />
      </head>
      <body>
        <div className="dashboard-layout">
          <Sidebar />
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main className="main-content">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
