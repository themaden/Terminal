'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-center gap-3">
      <AlertCircle size={16} className="text-red-400 shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-bold text-red-300">Backend bağlantısı kurulamadı</p>
        <p className="text-xs text-red-400/70 mt-0.5">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 shrink-0"
        >
          <RefreshCw size={12} /> Tekrar Dene
        </button>
      )}
    </div>
  );
}
