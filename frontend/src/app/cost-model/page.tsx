'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { costModelApi, crisisApi, type CostBreakdown, type CostSummary } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';

const COST_ITEMS = [
  { key: 'eu261_liability_eur',    label: 'EU261 Yasal Tazminat',     icon: 'gavel',            color: 'text-rose-400',    bar: 'bg-rose-500' },
  { key: 'catering_eur',           label: 'İkram (Catering)',         icon: 'restaurant',       color: 'text-amber-400',   bar: 'bg-amber-500' },
  { key: 'hotel_eur',              label: 'Otel Konaklama',           icon: 'hotel',            color: 'text-indigo-400',  bar: 'bg-indigo-500' },
  { key: 'transfer_eur',           label: 'Transfer',                 icon: 'directions_bus',   color: 'text-cyan-400',    bar: 'bg-cyan-500' },
  { key: 'crew_overtime_eur',      label: 'Mürettebat Fazla Mesai',   icon: 'badge',            color: 'text-purple-400',  bar: 'bg-purple-500' },
  { key: 'slot_turnaround_eur',    label: 'Slot / Turnaround',        icon: 'schedule',         color: 'text-orange-400',  bar: 'bg-orange-500' },
  { key: 'fuel_idle_eur',          label: 'Bekleme Yakıtı',           icon: 'local_gas_station',color: 'text-yellow-400',  bar: 'bg-yellow-500' },
  { key: 'gds_rebooking_eur',      label: 'GDS Yeniden Yayınlama',    icon: 'cloud_sync',       color: 'text-slate-400',   bar: 'bg-slate-500' },
  { key: 'revenue_loss_eur',       label: 'Gelir Kaybı',              icon: 'trending_down',    color: 'text-rose-300',    bar: 'bg-rose-400' },
];

export default function CostModelPage() {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);
  const [benchmarks, setBenchmarks] = useState<Record<string,unknown>[]>([]);
  const [crises, setCrises] = useState<{id:number; status:string}[]>([]);
  const [selectedCrisis, setSelectedCrisis] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBase = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([costModelApi.summary(), costModelApi.benchmarks()]);
      setSummary(s); setBenchmarks(b.benchmarks);
      const c = await crisisApi.listAll(0, 20);
      setCrises(c.map((x:any) => ({ id: x.id, status: x.status })));
      if (c.length > 0 && !selectedCrisis) setSelectedCrisis(c[0].id);
      setError(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'API hatası'); }
    finally { setIsLoading(false); }
  }, [selectedCrisis]);

  useEffect(() => { fetchBase(); }, []);

  useEffect(() => {
    if (!selectedCrisis) return;
    costModelApi.crisis(selectedCrisis).then(setBreakdown).catch(() => setBreakdown(null));
  }, [selectedCrisis]);

  const maxCost = breakdown ? Math.max(...COST_ITEMS.map(i => (breakdown as any)[i.key] as number), 1) : 1;

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader icon="account_balance" title="Operasyonel Maliyet & Gelir Kaybı" subtitle="THY Kriteri: Operasyonel maliyet, gelir kaybı ve kapasite optimizasyonu — uçak tipi bazlı maliyet modeli." onRefresh={fetchBase} isRefreshing={isLoading} />

      {error && <ErrorBanner message={error} onRetry={fetchBase} />}

      {/* System KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="account_balance" label="Toplam Etki" value={`€${(summary.grand_total_eur/1000).toFixed(0)}K`} valueClass="text-primary-fixed" />
          <KpiCard icon="gavel" label="EU261 Toplam" value={`€${(summary.total_eu261_eur/1000).toFixed(0)}K`} valueClass="text-rose-400" />
          <KpiCard icon="trending_down" label="Gelir Kaybı" value={`€${(summary.total_revenue_loss_eur/1000).toFixed(0)}K`} valueClass="text-amber-400" />
          <KpiCard icon="person" label="Kişi Başı Ort." value={`€${summary.avg_cost_per_pax_eur.toFixed(0)}`} valueClass="text-emerald-400" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Crisis selector + breakdown */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/40 font-bold shrink-0">Kriz seç:</label>
            <select className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-container/60" value={selectedCrisis??''} onChange={e => setSelectedCrisis(parseInt(e.target.value))}>
              {crises.map(c => <option key={c.id} value={c.id} className="bg-slate-900">Kriz #{c.id} — {c.status}</option>)}
            </select>
          </div>

          {breakdown ? (
            <div className="glass-card rounded-2xl p-5 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-base font-display font-bold text-surface-bright">{breakdown.flight_number}</h2>
                  <p className="text-xs text-white/40">{breakdown.aircraft_type} · {breakdown.distance_km}km · {breakdown.delay_hours}s gecikme · {breakdown.affected_passengers} yolcu</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-bold text-rose-400">€{breakdown.total_impact_eur.toLocaleString()}</p>
                  <p className="text-[10px] text-white/30">Toplam Etki</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {COST_ITEMS.map(item => {
                  const val = (breakdown as any)[item.key] as number;
                  const pct = Math.max((val / maxCost) * 100, 2);
                  return (
                    <div key={item.key} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-base text-white/30 shrink-0">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/60">{item.label}</span>
                          <span className={`font-mono font-bold ${item.color}`}>€{val.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.bar} transition-all duration-700`} style={{width:`${pct}%`}} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                {[
                  { label:'Doluluk', value:`%${breakdown.load_factor_pct}`, color:'text-primary-fixed' },
                  { label:'Ort. Bilet', value:`€${breakdown.avg_fare_eur}`, color:'text-surface-bright' },
                  { label:'Kişi Başı', value:`€${breakdown.cost_per_pax_eur}`, color:'text-rose-400' },
                ].map(m => (
                  <div key={m.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <p className={`text-lg font-display font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-[9px] text-white/30 font-bold uppercase mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState icon="account_balance" title="Kriz seçin" variant="neutral" />}
        </div>

        {/* Fleet benchmarks */}
        <div className="lg:col-span-4 glass-card rounded-2xl flex flex-col">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
            <span className="material-symbols-outlined text-primary-container text-base">flight</span>
            <h2 className="text-xs font-bold font-display">Filo Maliyet Karşılaştırması</h2>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {benchmarks.map((b:any) => (
              <div key={b.aircraft} className="px-5 py-3">
                <p className="text-xs font-bold text-surface-bright mb-2">{b.aircraft}</p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className="text-white/40">Yakıt/saat</span><span className="font-mono text-amber-400">€{b.fuel_per_hour_eur.toLocaleString()}</span>
                  <span className="text-white/40">Mürettebat/saat</span><span className="font-mono text-cyan-400">€{b.crew_per_hour_eur.toLocaleString()}</span>
                  <span className="text-white/40">1s Gecikme</span><span className="font-mono font-bold text-rose-400">€{b.cost_1h_delay_eur.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By crisis type */}
      {summary && Object.keys(summary.by_crisis_type).length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
            <span className="material-symbols-outlined text-primary-container">donut_small</span>
            <h2 className="text-sm font-bold font-display">Kriz Tipine Göre Maliyet Dağılımı</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(summary.by_crisis_type).map(([type, data]) => (
              <div key={type} className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary-container text-base">crisis_alert</span>
                  <span className="text-xs font-bold text-surface-bright">{type}</span>
                </div>
                <p className="text-xl font-display font-bold text-rose-400">€{data.total_eur.toLocaleString()}</p>
                <p className="text-[10px] text-white/30">{data.count} kriz</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
