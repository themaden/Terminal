'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { revenueApi, type ImpactSummary, type CrisisImpact, type ClassBreakdown, type Efficiency } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';

const CLASS_COLOR: Record<string, string> = {
  FIRST: 'bg-rose-500',
  BUSINESS: 'bg-amber-500',
  ECONOMY: 'bg-emerald-500',
};

const CLASS_TEXT: Record<string, string> = {
  FIRST: 'text-rose-400',
  BUSINESS: 'text-amber-400',
  ECONOMY: 'text-emerald-400',
};

const SEV_BADGE: Record<string, string> = {
  CRITICAL: 'badge badge-rose',
  HIGH: 'badge badge-rose',
  MEDIUM: 'badge badge-amber',
  LOW: 'badge badge-emerald',
};

export default function RevenuePage() {
  const [summary, setSummary] = useState<ImpactSummary | null>(null);
  const [byCrisis, setByCrisis] = useState<CrisisImpact[]>([]);
  const [byClass, setByClass] = useState<ClassBreakdown[]>([]);
  const [efficiency, setEfficiency] = useState<Efficiency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [sumData, crisisData, classData, effData] = await Promise.all([
        revenueApi.summary(),
        revenueApi.byCrisis(),
        revenueApi.byClass(),
        revenueApi.efficiency(),
      ]);
      setSummary(sumData);
      setByCrisis(Array.isArray(crisisData) ? crisisData : []);
      setByClass(Array.isArray(classData) ? classData : []);
      setEfficiency(effData);
      setApiError(null);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'API bağlantısı kurulamadı');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const maxComp = byCrisis.length > 0 ? Math.max(...byCrisis.map(c => c.total_compensation_eur), 1) : 1;

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader
        icon="bar_chart_4_bars"
        title="Gelir Yönetimi — Maliyet & Etki Analizi"
        subtitle="EU261 tazminatları, otel maliyetleri ve AI karar verimliliği takibi."
        onRefresh={fetchData}
        isRefreshing={isLoading}
      />

      {apiError && <ErrorBanner message={apiError} onRetry={fetchData} />}

      {/* Top KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="payments" label="Toplam Tazminat" value={`€${summary.compensation.total_eur.toLocaleString()}`} valueClass="text-primary-fixed" />
          <KpiCard icon="check_circle" label="Ödenen" value={`€${summary.compensation.paid_eur.toLocaleString()}`} valueClass="text-emerald-400" />
          <KpiCard icon="pending" label="Bekleyen" value={`€${summary.compensation.pending_eur.toLocaleString()}`} valueClass="text-amber-400" />
          <KpiCard icon="person" label="Ort. / Yolcu" value={`€${summary.compensation.average_per_passenger_eur.toLocaleString()}`} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Crisis Cost Chart */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-5 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <span className="material-symbols-outlined text-primary-container">auto_graph</span>
            <h2 className="text-sm font-bold text-surface-bright font-display">Kriz Başına Maliyet (EU261)</h2>
            <span className="ml-auto px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-surface-bright/50">{byCrisis.length} kriz</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="text-primary-fixed animate-spin" />
            </div>
          ) : byCrisis.length === 0 ? (
            <EmptyState icon="bar_chart" title="Henüz maliyet verisi yok" variant="neutral" />
          ) : (
            <div className="flex flex-col gap-4">
              {byCrisis.map(c => {
                const pct = Math.max((c.total_compensation_eur / maxComp) * 100, 2);
                return (
                  <div key={c.crisis_id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-[#adc8f6]">{c.flight_number}</span>
                        <span className="text-white/40 text-[10px]">{c.route}</span>
                        <span className={SEV_BADGE[c.severity] ?? 'badge badge-amber'}>{c.crisis_type}</span>
                        <span className={`badge ${c.status === 'RESOLVED' ? 'badge-emerald' : 'badge-rose'}`}>{c.status}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 shrink-0">€{c.total_compensation_eur.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-container to-primary-fixed rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-surface-bright/40">
                      <span>{c.affected_passengers} yolcu</span>
                      <span>·</span>
                      <span>Ort. €{c.avg_compensation_eur}/kişi</span>
                      <span>·</span>
                      <span>{new Date(c.triggered_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Class Breakdown */}
          <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="material-symbols-outlined text-primary-container text-base">airline_seat_recline_extra</span>
              <h2 className="text-xs font-bold text-surface-bright font-display">Sınıfa Göre Tazminat</h2>
            </div>
            {isLoading ? (
              <Loader2 size={20} className="text-primary-fixed animate-spin mx-auto" />
            ) : byClass.length === 0 ? (
              <p className="text-xs text-surface-bright/40 text-center py-4">Veri yok</p>
            ) : byClass.map(c => {
              const maxC = Math.max(...byClass.map(x => x.total_compensation_eur), 1);
              return (
                <div key={c.ticket_class} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className={`font-bold ${CLASS_TEXT[c.ticket_class] ?? 'text-surface-bright'}`}>{c.ticket_class}</span>
                    <span className="font-mono text-surface-bright font-bold">€{c.total_compensation_eur.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CLASS_COLOR[c.ticket_class] ?? 'bg-slate-500'}`}
                      style={{ width: `${(c.total_compensation_eur / maxC) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-surface-bright/40">{c.affected_count} yolcu · Ort. €{c.avg_compensation_eur}</span>
                </div>
              );
            })}
          </div>

          {/* Efficiency */}
          {efficiency && (
            <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="material-symbols-outlined text-primary-container text-base">psychology</span>
                <h2 className="text-xs font-bold text-surface-bright font-display">AI Karar Verimliliği</h2>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Otomasyon Oranı', pct: efficiency.automation_rate_pct, color: 'bg-emerald-500', textColor: 'text-emerald-400', display: `%${efficiency.automation_rate_pct}` },
                  { label: 'Ort. Ajan Güveni', pct: Math.round(efficiency.avg_agent_confidence * 100), color: 'bg-primary-container', textColor: 'text-primary-fixed', display: `%${Math.round(efficiency.avg_agent_confidence * 100)}` },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-surface-bright/60">{s.label}</span>
                      <span className={`font-bold ${s.textColor}`}>{s.display}</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { label: 'Uygulanan', value: efficiency.executed, color: 'text-emerald-400' },
                    { label: 'Bekleyen', value: efficiency.pending, color: 'text-amber-400' },
                    { label: 'Reddedilen', value: efficiency.rejected, color: 'text-rose-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                      <p className={`text-base font-display font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[9px] text-surface-bright/40 font-bold uppercase mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Crisis counts */}
          {summary && (
            <div className="glass-card rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="material-symbols-outlined text-primary-container text-base">crisis_alert</span>
                <h2 className="text-xs font-bold text-surface-bright font-display">Kriz Özeti</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Toplam', value: summary.crises.total, color: 'text-surface-bright' },
                  { label: 'Aktif', value: summary.crises.active, color: summary.crises.active > 0 ? 'text-rose-400' : 'text-emerald-400' },
                  { label: 'Çözüldü', value: summary.crises.resolved, color: 'text-emerald-400' },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                    <p className={`text-base font-display font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[9px] text-surface-bright/40 font-bold uppercase mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
