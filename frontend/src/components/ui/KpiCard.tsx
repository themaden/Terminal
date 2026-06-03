'use client';

import React from 'react';

interface KpiCardProps {
  icon: string;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  fill?: boolean;
}

export default function KpiCard({ icon, label, value, valueClass = 'text-surface-bright', fill = true }: KpiCardProps) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-[#002349] flex items-center justify-center border border-white/10 shrink-0">
        <span
          className="material-symbols-outlined text-primary-container text-xl"
          style={{ fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0" }}
        >
          {icon}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-surface-bright/50 uppercase tracking-wider">{label}</p>
        <p className={`text-xl font-display font-bold ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}
