'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';

interface ConnectionRecord {
  pnr: string;
  inbound_flight: string;
  outbound_flight: string;
  hub_airport: string;
  inbound_eta: string;
  outbound_std: string;
  act_minutes: number;
  mct_minutes: number;
  status: 'OK' | 'AT_RISK' | 'CRITICAL' | 'MISSED';
  last_updated: string;
}

interface ConnectionSummary {
  total: number;
  ok: number;
  at_risk: number;
  critical: number;
  missed: number;
}

interface ActiveFlight {
  id: number;
  flight_number: string;
  origin: string;
  destination: string;
  scheduled_departure: string;
  status: string;
  available_seats: number;
  aircraft_type: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const statusBadge: Record<string, string> = {
  OK: 'badge badge-emerald',
  AT_RISK: 'badge badge-amber',
  CRITICAL: 'badge badge-rose',
  MISSED: 'bg-slate-500/20 text-slate-400 border border-slate-500/40 px-2 py-0.5 rounded-full text-[9px] font-bold',
};

const statusIcon: Record<string, string> = {
  OK: 'check_circle',
  AT_RISK: 'warning',
  CRITICAL: 'emergency',
  MISSED: 'cancel',
};

export default function HubControlPage() {
  const [atRisk, setAtRisk] = useState<ConnectionRecord[]>([]);
  const [missed, setMissed] = useState<ConnectionRecord[]>([]);
  const [summary, setSummary] = useState<ConnectionSummary | null>(null);
  const [activeFlights, setActiveFlights] = useState<ActiveFlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [riskRes, missedRes, sumRes, flightsRes] = await Promise.all([
        fetch(`${API}/api/v1/hub/connections/at-risk`),
        fetch(`${API}/api/v1/hub/connections/missed`),
        fetch(`${API}/api/v1/hub/connections/summary`),
        fetch(`${API}/api/v1/hub/flights/active`),
      ]);
      const [riskData, missedData, sumData, flightsData] = await Promise.all([
        riskRes.json(), missedRes.json(), sumRes.json(), flightsRes.json(),
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
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatMinutes = (mins: number) => {
    if (mins < 0) return `${Math.abs(mins)} dk geçti`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
  };

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">

      {/* Header */}
      <div className="border-b border-white/10 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-bright flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
              hub
            </span>
            Hub Kontrol — Aktarma Yönetimi
          </h1>
          <p className="text-xs text-surface-bright/60 mt-1">
            MCT/ACT analizi ile risk altındaki bağlantı uçuşlarının gerçek zamanlı takibi.
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
          <div className="flex-1">
            <p className="text-xs font-bold text-red-300">Backend bağlantısı kurulamadı</p>
            <p className="text-xs text-red-400/70 mt-0.5">{apiError}</p>
          </div>
          <button onClick={fetchData} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 shrink-0">
            <RefreshCw size={12} /> Tekrar Dene
          </button>
        </div>
      )}

      {/* KPI Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Toplam Bağlantı', value: summary.total, icon: 'connecting_airports', color: 'text-surface-bright' },
            { label: 'Güvenli', value: summary.ok, icon: 'check_circle', color: 'text-emerald-400' },
            { label: 'Risk Altında', value: summary.at_risk, icon: 'warning', color: 'text-amber-400' },
            { label: 'Kritik', value: summary.critical, icon: 'emergency', color: 'text-rose-400' },
            { label: 'Kaçırıldı', value: summary.missed, icon: 'cancel', color: 'text-slate-400' },
          ].map((kpi) => (
            <div key={kpi.label} className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#002349] flex items-center justify-center border border-white/10 shrink-0">
                <span className="material-symbols-outlined text-primary-container text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {kpi.icon}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-surface-bright/50 uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-xl font-display font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* At-Risk + Critical Connections */}
      <div className="glass-card rounded-2xl overflow-hidden p-0 border border-white/5">
        <div className="bg-[#002349]/70 border-b border-white/10 px-5 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <h2 className="text-sm font-bold text-surface-bright font-display">Risk Altındaki Bağlantılar</h2>
          <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold">
            {atRisk.length} kayıt
          </span>
        </div>

        {isLoading ? (
          <div className="p-10 flex items-center justify-center gap-3">
            <Loader2 size={24} className="text-primary-fixed animate-spin" />
            <span className="text-xs text-surface-bright/60">Bağlantı verileri yükleniyor...</span>
          </div>
        ) : atRisk.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-emerald-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>connecting_airports</span>
            <p className="text-sm font-bold text-emerald-400">Tüm bağlantılar güvende</p>
            <p className="text-xs text-surface-bright/50">ACT &gt; MCT — Risk altında bağlantı yok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#001229]/60 border-b border-white/5 text-surface-bright/50">
                  <th className="p-4 font-bold uppercase tracking-wider">PNR</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Gelen / Giden Uçuş</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Hub</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Mevcut Süre</th>
                  <th className="p-4 font-bold uppercase tracking-wider">MCT</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Tampon</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Durum</th>
                </tr>
              </thead>
              <tbody>
                {atRisk.map((r) => {
                  const buffer = r.act_minutes - r.mct_minutes;
                  return (
                    <tr key={`${r.pnr}-${r.inbound_flight}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-primary-fixed">{r.pnr}</td>
                      <td className="p-4">
                        <div className="font-mono font-bold text-[#adc8f6]">{r.inbound_flight}</div>
                        <div className="text-white/40 text-[10px]">→ {r.outbound_flight}</div>
                      </td>
                      <td className="p-4 font-bold text-surface-bright">{r.hub_airport}</td>
                      <td className="p-4 font-mono font-bold text-surface-bright">{formatMinutes(r.act_minutes)}</td>
                      <td className="p-4 font-mono text-white/60">{r.mct_minutes}dk</td>
                      <td className="p-4 font-mono font-bold">
                        <span className={buffer < 0 ? 'text-rose-400' : 'text-amber-400'}>
                          {buffer >= 0 ? '+' : ''}{buffer}dk
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={statusBadge[r.status]}>
                          {r.status === 'AT_RISK' ? 'RİSKTE' : r.status === 'CRITICAL' ? 'KRİTİK' : r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Flights Board */}
      <div className="glass-card rounded-2xl overflow-hidden p-0 border border-white/5">
        <div className="bg-[#002349]/70 border-b border-white/10 px-5 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-base">flight_takeoff</span>
          <h2 className="text-sm font-bold text-surface-bright font-display">Aktif Uçuş Tahtası</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#001229]/60 border-b border-white/5 text-surface-bright/50">
                <th className="p-4 font-bold uppercase tracking-wider">Uçuş No</th>
                <th className="p-4 font-bold uppercase tracking-wider">Güzergah</th>
                <th className="p-4 font-bold uppercase tracking-wider">Planlı Kalkış</th>
                <th className="p-4 font-bold uppercase tracking-wider">Uçak</th>
                <th className="p-4 font-bold uppercase tracking-wider">Durum</th>
                <th className="p-4 font-bold uppercase tracking-wider">Müsait Koltuk</th>
              </tr>
            </thead>
            <tbody>
              {activeFlights.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-surface-bright/40 text-xs">
                    {isLoading ? 'Yükleniyor...' : 'Aktif uçuş bulunamadı.'}
                  </td>
                </tr>
              ) : activeFlights.map((f) => (
                <tr key={f.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-display font-bold text-surface-bright text-sm">{f.flight_number}</td>
                  <td className="p-4 font-mono text-[#adc8f6] font-bold">{f.origin} ➔ {f.destination}</td>
                  <td className="p-4 text-surface-bright/70">
                    {new Date(f.scheduled_departure).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 text-surface-bright/60">{f.aircraft_type}</td>
                  <td className="p-4">
                    <span className={`badge ${f.status === 'DELAYED' ? 'badge-amber' : f.status === 'BOARDING' ? 'badge-emerald' : 'badge-rose'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-surface-bright/70">{f.available_seats}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
