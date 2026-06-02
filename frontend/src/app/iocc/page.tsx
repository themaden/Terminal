'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, AlertCircle, Check, XCircle } from 'lucide-react';

interface ActiveCrisis {
  crisis_id: number;
  crisis_type: string;
  severity: string;
  flight_number: string;
  origin: string;
  destination: string;
  affected_passengers: number;
  triggered_at: string;
  reason: string;
}

interface IOCCDashboard {
  active_crises: ActiveCrisis[];
  active_crisis_count: number;
  pending_approvals: number;
  total_affected_passengers: number;
  act_tracker: {
    total: number;
    ok: number;
    at_risk: number;
    critical: number;
    missed: number;
  };
}

interface AuditLog {
  id: number;
  crisis_id: number | null;
  agent: string;
  action: string;
  details: string;
  confidence: number;
  timestamp: string;
}

interface SimResult {
  simulation: boolean;
  flight_number: string;
  disruption_type: string;
  delay_minutes: number;
  estimated_affected_passengers: number;
  estimated_eu261_cost_eur: number;
  sample_recommendations: {
    pnr: string;
    action: string;
    priority_score: number;
    compensation_eur: number;
    compliance_flags: string[];
    reasoning: string;
  }[];
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const severityBadge: Record<string, string> = {
  CRITICAL: 'badge badge-rose',
  HIGH: 'badge badge-rose',
  MEDIUM: 'badge badge-amber',
  LOW: 'badge badge-emerald',
};

export default function IOCCPage() {
  const [data, setData] = useState<IOCCDashboard | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [showSim, setShowSim] = useState(false);
  const [simForm, setSimForm] = useState({ flight_number: 'TK1981', disruption_type: 'CANCELLATION', delay_minutes: 180 });
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, auditRes] = await Promise.all([
        fetch(`${API}/api/v1/iocc/dashboard`),
        fetch(`${API}/api/v1/iocc/audit/recent?limit=15`),
      ]);
      setData(await dashRes.json());
      setAuditLogs(await auditRes.json());
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

  const handleApproveAll = async (crisisId: number) => {
    setApprovingId(crisisId);
    try {
      const res = await fetch(`${API}/api/v1/iocc/crisis/${crisisId}/approve-all`, { method: 'POST' });
      if (!res.ok) throw new Error('Onay başarısız');
      showToast(`Kriz #${crisisId} tüm kararlar onaylandı ✓`);
      fetchData();
    } catch (err) {
      showToast(`Hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
    } finally {
      setApprovingId(null);
    }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimResult(null);
    try {
      const params = new URLSearchParams({
        flight_number: simForm.flight_number,
        disruption_type: simForm.disruption_type,
        delay_minutes: String(simForm.delay_minutes),
      });
      const res = await fetch(`${API}/api/v1/iocc/scenario/simulate?${params}`, { method: 'POST' });
      if (!res.ok) throw new Error('Simülasyon başarısız');
      setSimResult(await res.json());
    } catch (err) {
      showToast(`Simülasyon hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">

      {/* Header */}
      <div className="border-b border-white/10 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-bright flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
              monitoring
            </span>
            IOCC — Operasyon Kontrol Merkezi
          </h1>
          <p className="text-xs text-surface-bright/60 mt-1">
            Kriz onay akışı, senaryo simülasyonu ve operasyonel denetim takibi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSim(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-bold rounded-full border border-indigo-500/50 transition-all"
          >
            <span className="material-symbols-outlined text-sm">science</span>
            Senaryo Simüle Et
          </button>
          <button
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:border-primary-container hover:text-primary-fixed transition-all flex items-center gap-2 text-xs font-bold text-surface-bright"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            Yenile
          </button>
        </div>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-red-300">Backend bağlantısı kurulamadı</p>
            <p className="text-xs text-red-400/70 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* KPI Bar */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: 'crisis_alert', label: 'Aktif Kriz', value: data.active_crisis_count, color: data.active_crisis_count > 0 ? 'text-rose-400' : 'text-emerald-400' },
            { icon: 'pending_actions', label: 'Bekleyen Onay', value: data.pending_approvals, color: 'text-amber-400' },
            { icon: 'groups', label: 'Etkilenen Yolcu', value: data.total_affected_passengers, color: 'text-primary-fixed' },
            { icon: 'connecting_airports', label: 'Kritik Bağlantı', value: (data.act_tracker?.critical ?? 0) + (data.act_tracker?.at_risk ?? 0), color: 'text-amber-400' },
          ].map((kpi) => (
            <div key={kpi.label} className="glass-card rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#002349] flex items-center justify-center border border-white/10 shrink-0">
                <span className="material-symbols-outlined text-primary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {kpi.icon}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-surface-bright/50 uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-2xl font-display font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Crises + Approve Flow */}
      <div className="glass-card rounded-2xl overflow-hidden p-0 border border-white/5">
        <div className="bg-[#002349]/70 border-b border-white/10 px-5 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>crisis_alert</span>
          <h2 className="text-sm font-bold text-surface-bright font-display">Aktif Krizler — Onay Akışı</h2>
        </div>

        {isLoading ? (
          <div className="p-10 flex items-center justify-center gap-3">
            <Loader2 size={24} className="text-primary-fixed animate-spin" />
            <span className="text-xs text-surface-bright/60">Kriz verileri yükleniyor...</span>
          </div>
        ) : !data || data.active_crises.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-emerald-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <p className="text-sm font-bold text-emerald-400">Aktif kriz yok</p>
            <p className="text-xs text-surface-bright/50">Tüm operasyonlar normal seyrinde.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/5">
            {data.active_crises.map((crisis) => (
              <div key={crisis.crisis_id} className="p-5 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/5 transition-colors">
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-display font-bold text-surface-bright text-base">{crisis.flight_number}</span>
                    <span className="font-mono text-[#adc8f6] font-bold text-xs">{crisis.origin} ➔ {crisis.destination}</span>
                    <span className={severityBadge[crisis.severity] ?? 'badge badge-amber'}>{crisis.crisis_type}</span>
                    <span className={severityBadge[crisis.severity] ?? 'badge badge-amber'}>{crisis.severity}</span>
                  </div>
                  <p className="text-xs text-surface-bright/60 leading-relaxed">{crisis.reason}</p>
                  <div className="flex items-center gap-4 text-[10px] text-surface-bright/40">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">groups</span>
                      {crisis.affected_passengers} yolcu etkilendi
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {new Date(crisis.triggered_at).toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleApproveAll(crisis.crisis_id)}
                  disabled={approvingId === crisis.crisis_id}
                  className="flex items-center gap-2 px-5 py-2 bg-primary-container hover:bg-accent-red-hover text-on-primary text-xs font-bold rounded-full transition-all shadow-lg shadow-primary-container/20 shrink-0 disabled:opacity-60"
                >
                  {approvingId === crisis.crisis_id ? (
                    <><Loader2 size={12} className="animate-spin" /> Onaylanıyor...</>
                  ) : (
                    <><Check size={12} /> Tümünü Onayla</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log */}
      <div className="glass-card rounded-2xl overflow-hidden p-0 border border-white/5">
        <div className="bg-[#002349]/70 border-b border-white/10 px-5 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-base">history</span>
          <h2 className="text-sm font-bold text-surface-bright font-display">Son Denetim Kayıtları</h2>
        </div>
        <div className="divide-y divide-white/5">
          {auditLogs.length === 0 ? (
            <p className="p-6 text-xs text-surface-bright/40 text-center">Denetim kaydı bulunamadı.</p>
          ) : auditLogs.map((log) => (
            <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors">
              <div className="w-7 h-7 rounded-full bg-[#002349] border border-white/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary-container text-sm">
                  {log.agent === 'IOCC_OPERATOR' ? 'manage_accounts' : 'smart_toy'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-primary-fixed">{log.agent}</span>
                  <span className="text-[10px] text-surface-bright/40">{log.action}</span>
                  {log.crisis_id && (
                    <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono text-white/40">
                      Kriz #{log.crisis_id}
                    </span>
                  )}
                </div>
                <p className="text-xs text-surface-bright/60 mt-0.5 truncate">{log.details}</p>
              </div>
              <div className="text-[10px] text-surface-bright/30 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulation Modal */}
      {showSim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">science</span>
                IRROPS Senaryo Simülasyonu
              </h3>
              <button onClick={() => { setShowSim(false); setSimResult(null); }} className="text-slate-400 hover:text-white">
                <XCircle size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Uçuş No</label>
                <input
                  className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  value={simForm.flight_number}
                  onChange={e => setSimForm(f => ({ ...f, flight_number: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kriz Tipi</label>
                <select
                  className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  value={simForm.disruption_type}
                  onChange={e => setSimForm(f => ({ ...f, disruption_type: e.target.value }))}
                >
                  <option value="CANCELLATION">İptal (CANCELLATION)</option>
                  <option value="DELAY">Gecikme (DELAY)</option>
                  <option value="DIVERSION">Yön Değişikliği (DIVERSION)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gecikme (dakika)</label>
                <input
                  type="number"
                  className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  value={simForm.delay_minutes}
                  onChange={e => setSimForm(f => ({ ...f, delay_minutes: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="flex gap-3 mb-5">
              <button onClick={() => { setShowSim(false); setSimResult(null); }} className="flex-1 px-4 py-2 text-xs font-bold text-slate-400 border border-slate-600 rounded-xl hover:bg-slate-800">
                Kapat
              </button>
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="flex-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSimulating ? <Loader2 size={13} className="animate-spin" /> : <span className="material-symbols-outlined text-sm">play_arrow</span>}
                {isSimulating ? 'Simüle ediliyor...' : 'Simülasyonu Çalıştır'}
              </button>
            </div>

            {simResult && (
              <div className="bg-slate-800/60 rounded-xl p-4 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Tahmini Yolcu</p>
                    <p className="text-xl font-display font-bold text-white">{simResult.estimated_affected_passengers}</p>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Tahmini EU261</p>
                    <p className="text-xl font-display font-bold text-emerald-400">€{simResult.estimated_eu261_cost_eur.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Örnek Kararlar</p>
                  {simResult.sample_recommendations.map((rec) => (
                    <div key={rec.pnr} className="bg-slate-900/40 rounded-lg p-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-indigo-300 font-bold">{rec.pnr}</span>
                        <span className="text-white/60 font-bold">{rec.action}</span>
                        <span className="text-emerald-400 font-bold">€{rec.compensation_eur}</span>
                      </div>
                      <p className="text-white/40 text-[10px] leading-relaxed">{rec.reasoning}</p>
                      {rec.compliance_flags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {rec.compliance_flags.map(f => (
                            <span key={f} className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <p className="text-xs font-bold">{toast}</p>
        </div>
      )}
    </div>
  );
}
