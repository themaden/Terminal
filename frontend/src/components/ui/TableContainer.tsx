'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface TableContainerProps {
  icon: string;
  title: string;
  badge?: React.ReactNode;
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function TableContainer({ icon, title, badge, isLoading, children }: TableContainerProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden p-0 border border-white/5">
      <div className="bg-[#002349]/70 border-b border-white/10 px-5 py-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary-container text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
        <h2 className="text-sm font-bold text-surface-bright font-display">{title}</h2>
        {badge && <span className="ml-auto">{badge}</span>}
      </div>
      {isLoading ? (
        <div className="p-10 flex items-center justify-center gap-3">
          <Loader2 size={24} className="text-primary-fixed animate-spin" />
          <span className="text-xs text-surface-bright/60">Yükleniyor...</span>
        </div>
      ) : children}
    </div>
  );
}
