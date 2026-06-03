'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { pccApi, type AtRiskPassenger, type PCCSummary } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import TableContainer from '@/components/ui/TableContainer';
import { useToast } from '@/hooks/useToast';

const LOYALTY_COLOR: Record<string, string> = {
  PLATINUM: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
  GOLD: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  SILVER: 'text-slate-300 bg-slate-500/10 border-slate-500/30',
  NONE: 'text-white/40 bg-white/5 border-white/10',
};

const CLASS_BADGE: Record<string, string> = {
  FIRST: 'badge badge-rose',
  BUSINESS: 'badge badge-amber',
  ECONOMY: 'badge badge-emerald',
};

const SEV_BADGE: Record<string, string> = {
  CRITICAL: 'badge badge-rose',
  HIGH: 'badge badge-rose',
  MEDIUM: 'badge badge-amber',
  LOW: 'badge badge-emerald',
};

export default function PCCPage() {
  const [passengers, setPassengers] = useState<AtRiskPassenger[]>([]);
  const [summary, setSummary] = useState<PCCSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [recoveringPnr, setRecoveringPnr] = useState<string | null>(null);
  const { toast, show: showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [paxData, sumData] = await Promise.all([pccApi.atRisk(), pccApi.summary()]);
      setPassengers(paxData.passengers ?? []);
      setSummary(sumData);
      setApiError(null);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'API bağlantısı kurulamadı');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 20000);
    return () => clearInterval(i);
  }, [fetchData]);

  const handleRecover = async (pnr: string) => {
    setRecoveringPnr(pnr);
    try {
      await pccApi.recover(pnr);
      showToast(`${pnr} için kurtarma aksiyonu başlatıldı ✓`);
      fetchData();
    } catch (err) {
      showToast(`Hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
    } finally {
      setRecoveringPnr(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader
        icon="support_agent"
        title="Yolcu Bakım Merkezi (PCC)"
        subtitle="Etkilenen yolcuların öncelik sıralaması, aksiyon önerileri ve tazminat takibi."
        onRefresh={fetchData}
        isRefreshing={isLoading}
      />

      {apiError && <ErrorBanner message={apiError} onRetry={fetchData} />}

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="pending_actions" label="Bekleyen Kararlar" value={summary.pending_decisions} valueClass="text-amber-400" />
          <KpiCard icon="task_alt" label="Uygulanan Kararlar" value={summary.executed_decisions} valueClass="text-emerald-400" />
          <KpiCard icon="payments" label="Ödenen Tazminat" value={`€${summary.total_compensation_paid_eur.toLocaleString()}`} valueClass="text-primary-fixed" />
          <KpiCard icon="crisis_alert" label="Aktif Kriz" value={summary.active_crises} valueClass={summary.active_crises > 0 ? 'text-rose-400' : 'text-emerald-400'} />
        </div>
      )}

      <TableContainer
        icon="people"
        title="Risk Altındaki Yolcular"
        isLoading={isLoading}
        badge={
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold">
            {passengers.length} yolcu
          </span>
        }
      >
        {passengers.length === 0 ? (
          <EmptyState icon="task_alt" title="Bekleyen eylem yok" subtitle="Tüm yolcular için kararlar uygulanmış." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#001229]/60 border-b border-white/5 text-surface-bright/50">
                  {['Yolcu', 'PNR', 'Sınıf / Loyalty', 'Uçuş', 'Kriz', 'Aksiyon', 'Tazminat', 'Güven', ''].map(h => (
                    <th key={h} className="p-4 font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {passengers.map(pax => (
                  <tr key={pax.pnr} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#002349] border border-white/10 flex items-center justify-center text-[10px] font-bold text-primary-fixed shrink-0">
                          {pax.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-surface-bright">{pax.name}</span>
                        {pax.special_needs && (
                          <span className="material-symbols-outlined text-amber-400 text-xs" title={pax.special_needs}>accessible</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-primary-fixed font-bold">{pax.pnr}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={CLASS_BADGE[pax.ticket_class] ?? 'badge badge-secondary'}>{pax.ticket_class}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${LOYALTY_COLOR[pax.loyalty_tier] ?? LOYALTY_COLOR.NONE}`}>
                          {pax.loyalty_tier}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[#adc8f6] font-bold">
                      {pax.flight_number}
                      <br />
                      <span className="text-white/40 font-normal text-[10px]">{pax.origin} ➔ {pax.destination}</span>
                    </td>
                    <td className="p-4">
                      <span className={SEV_BADGE[pax.crisis_severity] ?? 'badge badge-amber'}>{pax.crisis_type}</span>
                    </td>
                    <td className="p-4 text-primary-fixed font-bold">{pax.recommended_action}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">€{pax.compensation_eur}</td>
                    <td className="p-4">
                      <span className="text-emerald-400 font-bold">%{Math.round(pax.agent_confidence * 100)}</span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleRecover(pax.pnr)}
                        disabled={recoveringPnr === pax.pnr}
                        className="px-3 py-1.5 bg-primary-container hover:bg-accent-red-hover text-on-primary text-[10px] font-bold rounded-full transition-all disabled:opacity-60 flex items-center gap-1"
                      >
                        {recoveringPnr === pax.pnr
                          ? <Loader2 size={10} className="animate-spin" />
                          : <span className="material-symbols-outlined text-xs">autorenew</span>}
                        Kurtar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableContainer>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <p className="text-xs font-bold">{toast}</p>
        </div>
      )}
    </div>
  );
}
