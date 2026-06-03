'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShieldAlert, Loader2 } from 'lucide-react';
import { passengersApi, type Passenger } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';

const CLASS_BADGE: Record<string, string> = {
  FIRST: 'badge badge-rose',
  BUSINESS: 'badge badge-amber',
  ECONOMY: 'badge badge-emerald',
};

const LOYALTY_COLOR: Record<string, string> = {
  PLATINUM: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
  GOLD: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  SILVER: 'text-slate-300 bg-slate-500/10 border-slate-500/30',
  NONE: 'text-white/40 bg-white/5 border-white/10',
};

export default function PassengersPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const data = await passengersApi.listAll(0, 200);
      setPassengers(data);
      setApiError(null);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'API bağlantısı kurulamadı');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = passengers.filter(p => {
    const q = search.toLowerCase();
    return (
      p.pnr.toLowerCase().includes(q) ||
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader
        icon="group"
        title="Yolcu Takip ve Veri Sistemi"
        subtitle="Uçuşlardaki tüm yolcuların detaylarını, PNR ve sadakat bilgilerini sorgulayın."
        onRefresh={fetchData}
        isRefreshing={isLoading}
        actions={
          <div className="flex items-center gap-2.5 bg-[#002349] border border-white/10 rounded-full px-4 py-2 w-72">
            <Search size={14} className="text-white/40 shrink-0" />
            <input
              type="text"
              placeholder="PNR veya yolcu adı ara..."
              className="bg-transparent border-none outline-none text-xs w-full text-white placeholder-white/30"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        }
      />

      {apiError && <ErrorBanner message={apiError} onRetry={fetchData} />}

      <div className="glass-card rounded-2xl overflow-hidden p-0 border border-white/5 shadow-2xl">
        <div className="bg-[#002349]/70 border-b border-white/10 px-5 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-base">people</span>
          <h2 className="text-sm font-bold text-surface-bright font-display">Yolcu Listesi</h2>
          <span className="ml-auto px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-surface-bright/60">{filtered.length} yolcu</span>
        </div>

        {isLoading ? (
          <div className="p-10 flex items-center justify-center gap-3">
            <Loader2 size={24} className="text-primary-fixed animate-spin" />
            <span className="text-xs text-surface-bright/60">Yolcu verileri yükleniyor...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="person_search" title={search ? 'Yolcu bulunamadı' : 'Henüz yolcu kaydı yok'} subtitle={search ? `"${search}" ile eşleşen yolcu yok.` : 'Veritabanında kayıtlı yolcu bulunamadı.'} variant="neutral" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#001229]/60 border-b border-white/5 text-surface-bright/50">
                  {['PNR', 'Yolcu Adı', 'Sınıf', 'Loyalty', 'İletişim', 'Özel Durum'].map(h => (
                    <th key={h} className="p-4 font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary-fixed">{p.pnr}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#002349] border border-white/10 flex items-center justify-center text-[10px] font-bold text-primary-fixed shrink-0">
                          {p.first_name[0]}{p.last_name[0]}
                        </div>
                        <span className="font-medium text-surface-bright">{p.first_name} {p.last_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={CLASS_BADGE[p.ticket_class] ?? 'badge badge-secondary'}>{p.ticket_class}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${LOYALTY_COLOR[p.loyalty_tier] ?? LOYALTY_COLOR.NONE}`}>
                        {p.loyalty_tier}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-surface-bright/70">
                      <div>{p.email}</div>
                      <div className="mt-0.5 text-white/40">{p.phone}</div>
                    </td>
                    <td className="p-4">
                      {p.special_needs ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/20 border border-rose-500/20 px-2 py-0.5 rounded">
                          <ShieldAlert size={11} /> {p.special_needs}
                        </span>
                      ) : (
                        <span className="text-[11px] text-surface-bright/40">Standart</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
