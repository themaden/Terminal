'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AlertOctagon, CheckCircle2, ChevronRight, Loader2, Zap, XCircle } from 'lucide-react';
import { crisisApi, type CrisisEvent } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import ErrorBanner from '@/components/ui/ErrorBanner';
import { useToast } from '@/hooks/useToast';

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'badge badge-rose',
  HIGH: 'badge badge-rose',
  MEDIUM: 'badge badge-amber',
  LOW: 'badge badge-emerald',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge badge-rose',
  RESOLVING: 'badge badge-amber',
  RESOLVED: 'badge badge-emerald',
};

export default function CrisisPage() {
  const [crises, setCrises] = useState<CrisisEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [showTrigger, setShowTrigger] = useState(false);
  const [triggerForm, setTriggerForm] = useState({ flight_number: 'TK1981', crisis_type: 'CANCELLATION', reason: 'Severe weather at LHR', severity: 'HIGH' });
  const [isTriggering, setIsTriggering] = useState(false);
  const { toast, show: showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const data = await crisisApi.listAll(0, 100);
      setCrises(data);
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

  const handleTrigger = async () => {
    setIsTriggering(true);
    try {
      const crisis = await crisisApi.trigger(triggerForm);
      showToast(`Kriz oluşturuldu! #${crisis.id}`);
      setShowTrigger(false);
      setTimeout(fetchData, 2000);
    } catch (e) {
      showToast(`Hata: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const filtered = crises.filter(c => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return c.status === 'ACTIVE';
    return c.status === 'RESOLVED';
  });

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m} dakika önce`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} saat önce`;
    return `${Math.floor(h / 24)} gün önce`;
  };

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader
        icon="crisis_alert"
        title="Kriz Yönetim Havuzu"
        subtitle="Aktif operasyonel aksaklıkların durumunu izleyin ve kararları denetleyin."
        onRefresh={fetchData}
        isRefreshing={isLoading}
        actions={
          <>
            {/* Filter */}
            <div className="flex gap-1 bg-[#002349] p-1 rounded-full border border-white/10">
              {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === f ? 'bg-primary-container text-white shadow-lg' : 'text-surface-bright/70 hover:text-white'}`}
                >
                  {f === 'ALL' ? 'Tümü' : f === 'ACTIVE' ? 'Aktif' : 'Çözülenler'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTrigger(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold rounded-full border border-rose-500/50 transition-all"
            >
              <Zap size={12} /> Kriz Tetikle
            </button>
          </>
        }
      />

      {apiError && <ErrorBanner message={apiError} onRetry={fetchData} />}

      {isLoading ? (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4">
          <Loader2 size={32} className="text-primary-fixed animate-spin" />
          <p className="text-xs text-surface-bright/60">Kriz verileri yükleniyor...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 border border-emerald-500/20 bg-emerald-950/10">
          <span className="material-symbols-outlined text-emerald-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          <p className="text-sm font-bold text-emerald-400">
            {filter === 'ALL' ? 'Henüz kriz kaydı yok' : filter === 'ACTIVE' ? 'Aktif kriz yok' : 'Çözülen kriz yok'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filtered.map(crisis => (
            <div key={crisis.id} className="glass-card rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border shrink-0 ${
                  crisis.status === 'ACTIVE' ? 'bg-rose-950/20 border-rose-500/30 text-rose-400' : 'bg-[#002349]/80 border-white/10 text-primary-fixed'
                }`}>
                  {crisis.status === 'ACTIVE'
                    ? <AlertOctagon size={22} className="animate-pulse" />
                    : <CheckCircle2 size={22} />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xl font-display font-bold text-surface-bright">Kriz #{crisis.id}</span>
                    <span className="text-xs text-surface-bright/50 font-mono">Uçuş #{crisis.affected_flight_id}</span>
                    <span className={SEVERITY_BADGE[crisis.severity] ?? 'badge badge-amber'}>{crisis.severity}</span>
                    <span className="badge badge-secondary">{crisis.crisis_type}</span>
                  </div>
                  <p className="text-xs text-surface-bright/70 mt-2 max-w-2xl leading-relaxed">{crisis.reason}</p>
                  <div className="flex gap-4 items-center mt-3 text-[10px] text-surface-bright/50 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1 font-mono">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {formatTime(crisis.triggered_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">group</span>
                      {crisis.affected_passenger_count} Yolcu
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3.5 shrink-0 border-t border-white/5 md:border-none pt-4 md:pt-0 w-full md:w-auto">
                <div className="flex md:block items-center justify-between w-full">
                  <span className="text-[10px] text-surface-bright/40 uppercase">Durum</span>
                  <span className={`${STATUS_BADGE[crisis.status] ?? 'badge badge-amber'} mt-0 md:mt-1`}>{crisis.status}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="bg-white/5 border border-white/10 text-surface-bright text-xs px-5 py-2 rounded-full hover:border-primary-container hover:text-primary-fixed transition-all flex items-center gap-1 font-bold w-full md:w-auto justify-center"
                >
                  Kararları Yönet <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trigger Modal */}
      {showTrigger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><Zap size={16} className="text-rose-400" /> Kriz Tetikle</h3>
              <button onClick={() => setShowTrigger(false)}><XCircle size={18} className="text-slate-400 hover:text-white" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Uçuş No</label>
                <input className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500" value={triggerForm.flight_number} onChange={e => setTriggerForm(f => ({ ...f, flight_number: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kriz Tipi</label>
                <select className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500" value={triggerForm.crisis_type} onChange={e => setTriggerForm(f => ({ ...f, crisis_type: e.target.value }))}>
                  <option value="CANCELLATION">İptal</option>
                  <option value="DELAY">Gecikme</option>
                  <option value="DIVERSION">Yön Değişikliği</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sebep</label>
                <input className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500" value={triggerForm.reason} onChange={e => setTriggerForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Şiddet</label>
                <select className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500" value={triggerForm.severity} onChange={e => setTriggerForm(f => ({ ...f, severity: e.target.value }))}>
                  <option value="LOW">Düşük</option>
                  <option value="MEDIUM">Orta</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="CRITICAL">Kritik</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowTrigger(false)} className="flex-1 px-4 py-2 text-xs font-bold text-slate-400 border border-slate-600 rounded-xl hover:bg-slate-800">İptal</button>
              <button onClick={handleTrigger} disabled={isTriggering} className="flex-1 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                {isTriggering ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                {isTriggering ? 'Tetikleniyor...' : 'Başlat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <p className="text-xs font-bold">{toast}</p>
        </div>
      )}
    </div>
  );
}
