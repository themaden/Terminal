'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import LoginPage from '@/app/login/page';
import '@/app/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is authenticated in localStorage
    const savedUser = localStorage.getItem('aerosys_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <html lang="tr">
        <body className="bg-surface text-on-surface font-sans antialiased flow-bg min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">
              autorenew
            </span>
            <p className="text-label-sm font-bold tracking-widest text-on-surface-variant uppercase">AeroSys Sync...</p>
          </div>
        </body>
      </html>
    );
  }

  // Auth Gate: If no user is logged in, force render the LoginPage directly
  if (!user) {
    return (
      <html lang="tr" className="light">
        <head>
          <title>AeroSys AI Intelligence Hub - Login</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700&family=Inter:wght@300;400;500;700&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        </head>
        <body className="bg-surface text-on-surface font-sans antialiased flow-bg">
          <LoginPage />
        </body>
      </html>
    );
  }

  return (
    <html lang="tr" className="light">
      <head>
        <title>AeroSys AI Intelligence Hub</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700&family=Inter:wght@300;400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        
        {/* Force Material Icon font rendering styling */}
        <style dangerouslySetInnerHTML={{__html: `
          .material-symbols-outlined {
            font-family: 'Material Symbols Outlined' !important;
            font-weight: normal;
            font-style: normal;
            font-size: 24px;
            line-height: 1;
            letter-spacing: normal;
            text-transform: none;
            display: inline-block;
            white-space: nowrap;
            word-wrap: normal;
            direction: ltr;
            -webkit-font-smoothing: antialiased;
          }
        `}} />
      </head>
      <body className="bg-surface text-on-surface font-sans antialiased flow-bg min-h-screen flex flex-col relative overflow-x-hidden">
        <Header />
        <main className="flex-grow pt-32 pb-16 px-6 md:px-16 max-w-7xl mx-auto w-full flex flex-col gap-12 z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
