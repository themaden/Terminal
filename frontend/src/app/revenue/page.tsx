'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';

interface ImpactSummary {
  compensation: {
    paid_eur: number;
    pending_eur: number;
    total_eur: number;
    average_per_passenger_eur: number;
  };
  crises: { total: number; active: number; resolved: number };
  decisions: { rebooked_passengers: number; hotel_accommodations: number };
}

interface CrisisImpact {
  crisis_id: number;
  crisis_type: string;
  severity: string;
  status: string;
  triggered_at: string;
  flight_number: string;
  route: string;
  affected_passengers: number;
  total_compensation_eur: number;
  decision_count: number;
  avg_compensation_eur: number;
}

interface ClassBreakdown {
  ticket_class: string;
  affected_count: number;
  total_compensation_eur: number;
  avg_compensation_eur: number;
}

interface Efficiency {
  total_decisions: number;
  executed: number;
  pending: number;
  rejected: number;
  automation_rate_pct: number;
  avg_agent_confidence: number;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const classColors: Record<string, string> = {
  FIRST: 'bg-rose-500',
  BUSINESS: 'bg-amber-500',
  ECONOMY: 'bg-emerald-500',
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
      const [sumRes, crisisRes, classRes, effRes] = await Promise.all([
        fetch(`${API}/api/v1/revenue/impact/summary`),
        fetch(`${API}/api/v1/revenue/impact/by-crisis?limit=15`),
        fetch(`${API}/api/v1/revenue/impact/by-class`),
        fetch(`${API}/api/v1/revenue/efficiency`),
      ]);
      const [sumData, crisisData, classData, effData] = await Promise.all([
        sumRes.json(), crisisRes.json(), classRes.json(), effRes.json(),
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxComp = byCrisis.length > 0 ? Math.max(...byCrisis.map(c => c.total_compensation_eur), 1) : 1;

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">

      {/* Header */}
      <div className="border-b border-white/10 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-bright flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
              bar_chart_4_bars
            </span>
            Gelir Yönetimi — Maliyet & Etki Analizi
          </h1>
          <p className="text-xs text-surface-bright/60 mt-1">
            EU261 tazminatları, otel maliyetleri ve AI karar verimliliği takibi.
          </p>
        </div>
        <button
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:border-primary-container hover:text-primary-fixed transition-all flex items-center gap-2 text-xs font-bold text-surface-bright"
          onClick={fetchData}
          disabled={isLoading}
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Güncelleniyor...' : 'Yenile'}
        </button>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-red-300">Backend bağlantısı kurulamadı</p>
            <p className="text-xs text-red-400/70 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Top KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: 'payments', label: 'Toplam Tazminat', value: `€${summary.compensation.total_eur.toLocaleString()}`, color: 'text-primary-fixed' },
            { icon: 'check_circle', label: 'Ödenen', value: `€${summary.compensation.paid_eur.toLocaleString()}`, color: 'text-emerald-400' },
            { icon: 'pending', label: 'Bekleyen', value: `€${summary.compensation.pending_eur.toLocaleString()}`, color: 'text-amber-400' },
            { icon: 'person', label: 'Ort. Tazminat/Yolcu', value: `€${summary.compensation.average_per_passenger_eur.toLocaleString()}`, color: 'text-surface-bright' },
          ].map((kpi) => (
            <div key={kpi.label} className="glass-card rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#002349] flex items-center justify-center border border-white/10 shrink-0">
                <span className="material-symbols-outlined text-primary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {kpi.icon}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-surface-bright/50 uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-lg font-display font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Crisis Cost Chart */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-5 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <span className="material-symbols-outlined text-primary-container">auto_graph</span>
            <h2 className="text-sm font-bold text-surface-bright font-display">Kriz Başına Maliyet (EU261)</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="text-primary-fixed animate-spin" />
            </div>
          ) : byCrisis.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <span className="material-symbols-outlined text-white/20 text-4xl">bar_chart</span>
              <p className="text-xs text-surface-bright/40">Henüz maliyet verisi yok.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {byCrisis.map((c) => {
                const pct = (c.total_compensation_eur / maxComp) * 100;
                return (
                  <div key={c.crisis_id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#adc8f6]">{c.flight_number}</span>
                        <span className="text-white/40">{c.route}</span>
                        <span className={`badge ${c.severity === 'HIGH' || c.severity === 'CRITICAL' ? 'badge-rose' : 'badge-amber'}`}>{c.crisis_type}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">€{c.total_compensation_eur.toLocaleString()}</span>
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

        {/* Right Column */}
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
            ) : byClass.map((c) => (
              <div key={c.ticket_class} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className={`font-bold ${c.ticket_class === 'FIRST' ? 'text-rose-400' : c.ticket_class === 'BUSINESS' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {c.ticket_class}
                  </span>
                  <span className="font-mono text-surface-bright font-bold">€{c.total_compensation_eur.toLocaleString()}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${classColors[c.ticket_class] ?? 'bg-slate-500'}`} style={{ width: '70%' }} />
                </div>
                <span className="text-[10px] text-surface-bright/40">{c.affected_count} yolcu · Ort. €{c.avg_compensation_eur}</span>
              </div>
            ))}
          </div>

          {/* Efficiency */}
          {efficiency && (
            <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="material-symbols-outlined text-primary-container text-base">psychology</span>
                <h2 className="text-xs font-bold text-surface-bright font-display">AI Karar Verimliliği</h2>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-surface-bright/60">Otomasyon Oranı</span>
                    <span className="font-bold text-emerald-400">%{efficiency.automation_rate_pct}</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${efficiency.automation_rate_pct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-surface-bright/60">Ort. Ajan Güveni</span>
                    <span className="font-bold text-primary-fixed">%{Math.round(efficiency.avg_agent_confidence * 100)}</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container rounded-full" style={{ width: `${efficiency.avg_agent_confidence * 100}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { label: 'Uygulanan', value: efficiency.executed, color: 'text-emerald-400' },
                    { label: 'Bekleyen', value: efficiency.pending, color: 'text-amber-400' },
                    { label: 'Reddedilen', value: efficiency.rejected, color: 'text-rose-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                      <p className={`text-base font-display font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[9px] text-surface-bright/40 font-bold uppercase mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
