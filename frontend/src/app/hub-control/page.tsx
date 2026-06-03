'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { hubApi, type ConnectionRecord, type ConnectionSummary, type Flight } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import TableContainer from '@/components/ui/TableContainer';

const STATUS_BADGE: Record<string, string> = {
  OK: 'badge badge-emerald',
  AT_RISK: 'badge badge-amber',
  CRITICAL: 'badge badge-rose',
  MISSED: 'bg-slate-500/20 text-slate-400 border border-slate-500/40 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase',
};

const STATUS_LABEL: Record<string, string> = {
  OK: 'Güvenli',
  AT_RISK: 'Riskli',
  CRITICAL: 'Kritik',
  MISSED: 'Kaçırıldı',
};

const FLIGHT_STATUS_BADGE: Record<string, string> = {
  DELAYED: 'badge badge-amber',
  BOARDING: 'badge badge-emerald',
  CANCELLED: 'badge badge-rose',
  SCHEDULED: 'badge badge-cyan',
  DEPARTED: 'badge badge-secondary',
};

export default function HubControlPage() {
  const [atRisk, setAtRisk] = useState<ConnectionRecord[]>([]);
  const [missed, setMissed] = useState<ConnectionRecord[]>([]);
  const [summary, setSummary] = useState<ConnectionSummary | null>(null);
  const [activeFlights, setActiveFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [riskData, missedData, sumData, flightsData] = await Promise.all([
        hubApi.atRisk(),
        hubApi.missed(),
        hubApi.summary(),
        hubApi.activeFlights(),
      ]);
      setAtRisk(riskData.connections ?? []);
      setMissed(missedData.connections ?? []);
      setSummary(sumData);
      setActiveFlights(Array.isArray(flightsData) ? flightsData : []);
      setApiError(null);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'API bağlantısı kurulamadı');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 15000);
    return () => clearInterval(i);
  }, [fetchData]);

  const fmtMin = (mins: number) => {
    if (mins < 0) return `${Math.abs(mins)} dk geçti`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
  };

  const fmtTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); }
    catch { return '—'; }
  };

  const allAtRisk = [...atRisk, ...missed];

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader
        icon="hub"
        title="Hub Kontrol — Aktarma Yönetimi"
        subtitle="MCT/ACT analizi ile risk altındaki bağlantı uçuşlarının gerçek zamanlı takibi."
        onRefresh={fetchData}
        isRefreshing={isLoading}
      />

      {apiError && <ErrorBanner message={apiError} onRetry={fetchData} />}

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard icon="connecting_airports" label="Toplam Bağlantı" value={summary.total} />
          <KpiCard icon="check_circle" label="Güvenli" value={summary.ok} valueClass="text-emerald-400" />
          <KpiCard icon="warning" label="Risk Altında" value={summary.at_risk} valueClass="text-amber-400" />
          <KpiCard icon="emergency" label="Kritik" value={summary.critical} valueClass="text-rose-400" />
          <KpiCard icon="cancel" label="Kaçırıldı" value={summary.missed} valueClass="text-slate-400" fill={false} />
        </div>
      )}

      {/* At-Risk Connections */}
      <TableContainer
        icon="warning"
        title="Risk Altındaki Bağlantılar"
        isLoading={isLoading}
        badge={
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold">
            {allAtRisk.length} kayıt
          </span>
        }
      >
        {allAtRisk.length === 0 ? (
          <EmptyState icon="connecting_airports" title="Tüm bağlantılar güvende" subtitle="ACT > MCT — Risk altında bağlantı yok." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#001229]/60 border-b border-white/5 text-surface-bright/50">
                  {['PNR', 'Gelen / Giden', 'Hub', 'Mevcut Süre', 'MCT', 'Tampon', 'Durum'].map(h => (
                    <th key={h} className="p-4 font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allAtRisk.map(r => {
                  const buf = r.act_minutes - r.mct_minutes;
                  return (
                    <tr key={`${r.pnr}-${r.inbound_flight}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-primary-fixed">{r.pnr}</td>
                      <td className="p-4">
                        <div className="font-mono font-bold text-[#adc8f6]">{r.inbound_flight}</div>
                        <div className="text-white/40 text-[10px]">→ {r.outbound_flight}</div>
                      </td>
                      <td className="p-4 font-bold text-surface-bright">{r.hub_airport}</td>
                      <td className="p-4 font-mono font-bold">{fmtMin(r.act_minutes)}</td>
                      <td className="p-4 font-mono text-white/60">{r.mct_minutes}dk</td>
                      <td className="p-4 font-mono font-bold">
                        <span className={buf < 0 ? 'text-rose-400' : 'text-amber-400'}>
                          {buf >= 0 ? '+' : ''}{buf}dk
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={STATUS_BADGE[r.status]}>{STATUS_LABEL[r.status] ?? r.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableContainer>

      {/* Active Flights Board */}
      <TableContainer icon="flight_takeoff" title="Aktif Uçuş Tahtası" isLoading={isLoading}>
        {activeFlights.length === 0 ? (
          <EmptyState icon="flight_takeoff" title="Aktif uçuş bulunamadı" variant="neutral" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#001229]/60 border-b border-white/5 text-surface-bright/50">
                  {['Uçuş No', 'Güzergah', 'Planlı Kalkış', 'Uçak', 'Durum', 'Müsait'].map(h => (
                    <th key={h} className="p-4 font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeFlights.map(f => (
                  <tr key={f.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-display font-bold text-surface-bright">{f.flight_number}</td>
                    <td className="p-4 font-mono text-[#adc8f6] font-bold">{f.origin} ➔ {f.destination}</td>
                    <td className="p-4 text-surface-bright/70">{fmtTime(f.scheduled_departure)}</td>
                    <td className="p-4 text-surface-bright/60">{f.aircraft_type}</td>
                    <td className="p-4">
                      <span className={FLIGHT_STATUS_BADGE[f.status] ?? 'badge badge-secondary'}>{f.status}</span>
                    </td>
                    <td className="p-4 font-mono font-bold">
                      <span className={f.available_seats === 0 ? 'text-rose-400' : f.available_seats < 20 ? 'text-amber-400' : 'text-emerald-400'}>
                        {f.available_seats}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableContainer>
    </div>
  );
}
