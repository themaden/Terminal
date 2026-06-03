'use client';

import React from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  variant?: 'success' | 'neutral';
}

export default function EmptyState({ icon, title, subtitle, action, variant = 'success' }: EmptyStateProps) {
  const color = variant === 'success' ? 'text-emerald-400' : 'text-white/30';
  return (
    <div className="p-12 flex flex-col items-center gap-3">
      <span
        className={`material-symbols-outlined text-4xl ${color}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <p className={`text-sm font-bold ${color}`}>{title}</p>
      {subtitle && <p className="text-xs text-surface-bright/50 text-center max-w-sm">{subtitle}</p>}
      {action}
    </div>
  );
}
