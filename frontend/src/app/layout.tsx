'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import '@/app/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="light">
      <head>
        <title>AeroSys AI Intelligence Hub</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700&family=Inter:wght@300;400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface text-on-surface font-sans antialiased flow-bg min-h-screen flex flex-col relative overflow-x-hidden">
        <Header />
        <main className="flex-grow pt-32 pb-16 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto w-full flex flex-col gap-12 z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
