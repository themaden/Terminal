'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { predictionApi, type FlightRiskScore, type PredictionSummary } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';

const RISK_COLOR: Record<string, string> = {
  CRITICAL: 'text-rose-400',
  HIGH: 'text-orange-400',
  MEDIUM: 'text-amber-400',
  LOW: 'text-emerald-400',
};

const RISK_BADGE: Record<string, string> = {
  CRITICAL: 'badge badge-rose',
  HIGH: 'bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase',
  MEDIUM: 'badge badge-amber',
  LOW: 'badge badge-emerald',
};

const RISK_BAR: Record<string, string> = {
  CRITICAL: 'bg-rose-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-emerald-500',
};

const SEV_COLOR: Record<string, string> = {
  CRITICAL: 'text-rose-400',
  HIGH: 'text-orange-400',
  MEDIUM: 'text-amber-400',
  LOW: 'text-emerald-400',
};

export default function PredictionPage() {
  const [scores, setScores] = useState<FlightRiskScore[]>([]);
  const [summary, setSummary] = useState<PredictionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FlightRiskScore | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const fetchData = useCallback(async () => {
    try {
      const [s, sum] = await Promise.all([predictionApi.riskScores(), predictionApi.summary()]);
      setScores(s);
      setSummary(sum);
      setError(null);
      if (s.length > 0 && !selected) setSelected(s[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API bağlantısı kurulamadı');
    } finally {
      setIsLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 30000);
    return () => clearInterval(i);
  }, [fetchData]);

  const filtered = filterLevel === 'ALL' ? scores : scores.filter(s => s.risk_level === filterLevel);

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader
        icon="radar"
        title="Proaktif Tahmin Motoru"
        subtitle="Uçuş kalkmadan 2–6 saat önce ML modeli çalışır. Risk skoru 70+ ise IOCC otomatik uyarı alır."
        onRefresh={fetchData}
        isRefreshing={isLoading}
      />

      {error && <ErrorBanner message={error} onRetry={fetchData} />}

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard icon="radar" label="Analiz Edilen Uçuş" value={summary.total_flights_scored} />
          <KpiCard icon="crisis_alert" label="Kritik Uyarı" value={summary.critical_alerts} valueClass={summary.critical_alerts > 0 ? 'text-rose-400' : 'text-emerald-400'} />
          <KpiCard icon="warning" label="Yüksek Risk" value={summary.high_risk} valueClass="text-orange-400" />
          <KpiCard icon="info" label="Orta Risk" value={summary.medium_risk} valueClass="text-amber-400" />
          <KpiCard icon="check_circle" label="Düşük Risk" value={summary.low_risk} valueClass="text-emerald-400" />
        </div>
      )}

      {/* Next run info */}
      {summary && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <span className="material-symbols-outlined text-indigo-400 text-base">schedule</span>
          <p className="text-xs text-indigo-300">
            Son analiz: <strong>{new Date(summary.last_run).toLocaleTimeString('tr-TR')}</strong>
            &nbsp;·&nbsp;
            Sonraki: <strong>{new Date(summary.next_run).toLocaleTimeString('tr-TR')}</strong>
            &nbsp;·&nbsp;Otomatik güncelleme her 30 dakikada bir
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
          <button
            key={lvl}
            onClick={() => setFilterLevel(lvl)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
              filterLevel === lvl
                ? 'bg-primary-container/20 text-primary-fixed border-primary-container/40'
                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
            }`}
          >
            {lvl === 'ALL' ? 'Tümü' : lvl}
            {lvl !== 'ALL' && summary && (
              <span className="ml-1.5 text-[9px] opacity-60">
                ({lvl === 'CRITICAL' ? summary.critical_alerts : lvl === 'HIGH' ? summary.high_risk : lvl === 'MEDIUM' ? summary.medium_risk : summary.low_risk})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Flight Risk List */}
        <div className="lg:col-span-5 glass-card rounded-2xl flex flex-col">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
            <span className="material-symbols-outlined text-primary-container">flight_takeoff</span>
            <h2 className="text-sm font-bold font-display">Risk Sıralaması</h2>
            <span className="ml-auto px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/40">{filtered.length} uçuş</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="check_circle" title="Bu seviyede risk yok" variant="neutral" />
          ) : (
            <div className="flex flex-col divide-y divide-white/5 overflow-y-auto max-h-[600px]">
              {filtered.map(f => (
                <button
                  key={f.flight_number}
                  onClick={() => setSelected(f)}
                  className={`flex items-center gap-3 px-5 py-3.5 text-left hover:bg-white/5 transition-colors ${selected?.flight_number === f.flight_number ? 'bg-white/5 border-l-2 border-primary-container' : ''}`}
                >
                  {/* Risk gauge */}
                  <div className="relative w-10 h-10 shrink-0">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15" fill="none"
                        stroke={f.risk_score >= 70 ? '#f43f5e' : f.risk_score >= 50 ? '#f97316' : f.risk_score >= 30 ? '#f59e0b' : '#10b981'}
                        strokeWidth="3"
                        strokeDasharray={`${(f.risk_score / 100) * 94.25} 94.25`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold font-display ${RISK_COLOR[f.risk_level]}`}>
                      {f.risk_score}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-surface-bright text-sm">{f.flight_number}</span>
                      <span className={RISK_BADGE[f.risk_level]}>{f.risk_level}</span>
                      {f.alert_triggered && (
                        <span className="material-symbols-outlined text-rose-400 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40 mt-0.5">{f.origin} → {f.destination} · {new Date(f.scheduled_departure).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {selected ? (
            <>
              {/* Header */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-surface-bright">{selected.flight_number}</h2>
                    <p className="text-sm text-white/50 mt-0.5">{selected.origin} → {selected.destination}</p>
                    <p className="text-xs text-white/30 mt-0.5">Planlanan kalkış: {new Date(selected.scheduled_departure).toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-4xl font-display font-bold ${RISK_COLOR[selected.risk_level]}`}>{selected.risk_score}</span>
                    <span className={RISK_BADGE[selected.risk_level]}>{selected.risk_level}</span>
                  </div>
                </div>

                {/* Score bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
                    <span>Risk Skoru</span>
                    <span>Güven: %{Math.round(selected.confidence * 100)}</span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${RISK_BAR[selected.risk_level]}`}
                      style={{ width: `${selected.risk_score}%` }}
                    />
                  </div>
                </div>

                {selected.alert_triggered && (
                  <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                    <span className="material-symbols-outlined text-rose-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                    <p className="text-xs text-rose-300 font-bold">IOCC'ye otomatik uyarı gönderildi — müdahale bekleniyor</p>
                  </div>
                )}
              </div>

              {/* Risk Factors */}
              <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <span className="material-symbols-outlined text-primary-container text-base">psychology</span>
                  <h3 className="text-xs font-bold font-display">ML Risk Faktörleri</h3>
                </div>
                {selected.risk_factors.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-4">Risk faktörü tespit edilmedi</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {selected.risk_factors.map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-sm shrink-0 ${SEV_COLOR[f.severity]}`}>
                          {f.severity === 'CRITICAL' ? 'error' : f.severity === 'HIGH' ? 'warning' : 'info'}
                        </span>
                        <div className="flex-1">
                          <p className="text-xs text-surface-bright">{f.factor}</p>
                        </div>
                        <span className={`text-xs font-mono font-bold shrink-0 ${SEV_COLOR[f.severity]}`}>{f.impact}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommended Action */}
              <div className="glass-card rounded-2xl p-5 flex items-start gap-3">
                <span className="material-symbols-outlined text-primary-container text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                <div>
                  <p className="text-xs font-bold text-primary-fixed mb-1">Önerilen Aksiyon</p>
                  <p className="text-sm text-surface-bright/80 leading-relaxed">{selected.recommended_action}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card rounded-2xl flex items-center justify-center py-24">
              <EmptyState icon="radar" title="Uçuş seçin" subtitle="Detaylı risk analizi için listeden bir uçuş seçin." variant="neutral" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
