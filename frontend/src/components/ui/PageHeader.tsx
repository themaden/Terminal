'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface PageHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  actions?: React.ReactNode;
}

export default function PageHeader({ icon, title, subtitle, onRefresh, isRefreshing, actions }: PageHeaderProps) {
  return (
    <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
      <div>
        <h1 className="text-3xl font-display font-bold text-surface-bright flex items-center gap-2">
          <span
            className="material-symbols-outlined text-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
          {title}
        </h1>
        {subtitle && <p className="text-xs text-surface-bright/60 mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0 self-start">
        {actions}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:border-primary-container hover:text-primary-fixed transition-all flex items-center gap-2 text-xs font-bold text-surface-bright disabled:opacity-60"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Güncelleniyor...' : 'Yenile'}
          </button>
        )}
      </div>
    </div>
  );
}
