'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, User, AlertCircle } from 'lucide-react';

interface AtRiskPassenger {
  passenger_id: number;
  pnr: string;
  name: string;
  ticket_class: string;
  loyalty_tier: string;
  special_needs: string | null;
  flight_number: string;
  origin: string;
  destination: string;
  crisis_type: string;
  crisis_severity: string;
  recommended_action: string;
  compensation_eur: number;
  hotel: string | null;
  decision_status: string;
  agent_confidence: number;
}

interface PCCSummary {
  pending_decisions: number;
  executed_decisions: number;
  total_compensation_paid_eur: number;
  active_crises: number;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const loyaltyColor: Record<string, string> = {
  PLATINUM: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
  GOLD: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  SILVER: 'text-slate-300 bg-slate-500/10 border-slate-500/30',
  NONE: 'text-white/40 bg-white/5 border-white/10',
};

const classColor: Record<string, string> = {
  FIRST: 'badge badge-rose',
  BUSINESS: 'badge badge-amber',
  ECONOMY: 'badge badge-emerald',
};

export default function PCCPage() {
  const [passengers, setPassengers] = useState<AtRiskPassenger[]>([]);
  const [summary, setSummary] = useState<PCCSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [paxRes, sumRes] = await Promise.all([
        fetch(`${API}/api/v1/pcc/passengers/at-risk`),
        fetch(`${API}/api/v1/pcc/summary`),
      ]);
      const paxData = await paxRes.json();
      const sumData = await sumRes.json();
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
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">

      {/* Header */}
      <div className="border-b border-white/10 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-bright flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
              support_agent
            </span>
            Yolcu Bakım Merkezi (PCC)
          </h1>
          <p className="text-xs text-surface-bright/60 mt-1">
            Etkilenen yolcuların öncelik sıralaması, aksiyon önerileri ve tazminat takibi.
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

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: 'pending_actions', label: 'Bekleyen Kararlar', value: summary.pending_decisions, color: 'text-amber-400' },
            { icon: 'task_alt', label: 'Uygulanan Kararlar', value: summary.executed_decisions, color: 'text-emerald-400' },
            { icon: 'payments', label: 'Ödenen Tazminat', value: `€${summary.total_compensation_paid_eur.toLocaleString()}`, color: 'text-primary-fixed' },
            { icon: 'crisis_alert', label: 'Aktif Kriz', value: summary.active_crises, color: summary.active_crises > 0 ? 'text-red-400' : 'text-emerald-400' },
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

      {/* Passenger Table */}
      <div className="glass-card rounded-2xl overflow-hidden p-0 border border-white/5 shadow-2xl">
        <div className="bg-[#002349]/70 border-b border-white/10 px-5 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-base">people</span>
          <h2 className="text-sm font-bold text-surface-bright font-display">Risk Altındaki Yolcular</h2>
          <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold">
            {passengers.length} yolcu
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center gap-4">
            <Loader2 size={28} className="text-primary-fixed animate-spin" />
            <p className="text-xs text-surface-bright/60">Yolcu verileri yükleniyor...</p>
          </div>
        ) : passengers.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-emerald-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            <p className="text-sm font-bold text-emerald-400">Bekleyen eylem yok</p>
            <p className="text-xs text-surface-bright/50">Tüm yolcular için kararlar uygulanmış.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#001229]/60 border-b border-white/5 text-surface-bright/50">
                  <th className="p-4 font-bold uppercase tracking-wider">Yolcu</th>
                  <th className="p-4 font-bold uppercase tracking-wider">PNR</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Sınıf / Loyalty</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Uçuş</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Kriz Tipi</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Aksiyon</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Tazminat</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Güven</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((pax) => (
                  <tr key={pax.pnr} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#002349] border border-white/10 flex items-center justify-center text-[10px] font-bold text-primary-fixed">
                          {pax.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-surface-bright">{pax.name}</span>
                        {pax.special_needs && (
                          <span className="material-symbols-outlined text-amber-400 text-xs" title={pax.special_needs}>
                            accessible
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-primary-fixed font-bold">{pax.pnr}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={classColor[pax.ticket_class] ?? 'badge badge-emerald'}>{pax.ticket_class}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${loyaltyColor[pax.loyalty_tier] ?? loyaltyColor.NONE}`}>
                          {pax.loyalty_tier}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[#adc8f6] font-bold">
                      {pax.flight_number}<br />
                      <span className="text-white/40 font-normal">{pax.origin} ➔ {pax.destination}</span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${pax.crisis_severity === 'HIGH' || pax.crisis_severity === 'CRITICAL' ? 'badge-rose' : 'badge-amber'}`}>
                        {pax.crisis_type}
                      </span>
                    </td>
                    <td className="p-4 text-primary-fixed font-bold">{pax.recommended_action}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">€{pax.compensation_eur}</td>
                    <td className="p-4">
                      <span className="text-emerald-400 font-bold">%{Math.round(pax.agent_confidence * 100)}</span>
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
