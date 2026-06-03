'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, Zap, XCircle } from 'lucide-react';
import { crisisApi, statsApi, type CrisisEvent, type Decision, type Stats } from '@/lib/api';
import KpiCard from '@/components/ui/KpiCard';
import ErrorBanner from '@/components/ui/ErrorBanner';
import { useToast } from '@/hooks/useToast';

export default function DashboardPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [activeCrises, setActiveCrises] = useState<CrisisEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showTrigger, setShowTrigger] = useState(false);
  const [triggerForm, setTriggerForm] = useState({
    flight_number: 'TK1981',
    crisis_type: 'CANCELLATION',
    reason: 'Severe weather conditions at LHR',
    severity: 'HIGH',
  });
  const [isTriggering, setIsTriggering] = useState(false);
  const { toast, show: showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [statsData, crisesData] = await Promise.all([statsApi.get(), crisisApi.listActive()]);
      setStats(statsData);
      setActiveCrises(crisesData);
      setApiError(null);
      if (crisesData.length > 0) {
        const dec = await crisisApi.getDecisions(crisesData[0].id);
        setDecisions(dec.filter(d => d.status === 'PENDING'));
      } else {
        setDecisions([]);
      }
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

  const handleApprove = async (dec: Decision) => {
    try {
      await crisisApi.approve(dec.crisis_id);
      setDecisions(prev => prev.filter(d => d.id !== dec.id));
      showToast(`Karar #${dec.id} onaylandı ✓`);
      fetchData();
    } catch (e) {
      showToast(`Hata: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`);
    }
  };

  const handleApproveAll = async () => {
    if (activeCrises.length === 0) return;
    setIsApproving(true);
    try {
      await crisisApi.approve(activeCrises[0].id);
      setDecisions([]);
      showToast('Tüm kararlar onaylandı! SMS ve WhatsApp bildirimleri gönderildi. ✈️');
      fetchData();
    } catch (e) {
      showToast(`Onay hatası: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleTriggerCrisis = async () => {
    setIsTriggering(true);
    try {
      const crisis = await crisisApi.trigger(triggerForm);
      showToast(`Kriz oluşturuldu! #${crisis.id} — AI karar motoru çalışıyor...`);
      setShowTrigger(false);
      setTimeout(fetchData, 3000);
    } catch (e) {
      showToast(`Kriz tetiklenemedi: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="flex flex-col gap-12 w-full select-none text-white">

      {apiError && <ErrorBanner message={apiError} onRetry={fetchData} />}

      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
            JetNexus <span className="text-primary-container text-shadow-glow">AI Intelligence</span> Hub
          </h1>
          <p className="text-lg text-surface-bright/70 max-w-2xl leading-relaxed">
            MILP optimizasyon motoru ve çok ajanlı AI orkestrasyonu ile uçuş krizlerini saniyeler içinde çözen, EU261 tazminatlarını otomatik hesaplayan operasyon kontrol merkezi.
          </p>

          {/* KPI mini row */}
          <div className="flex flex-wrap gap-4 items-center mt-2">
            {stats && (
              <>
                <div className="glass-card rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#002349] flex items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-primary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-surface-bright/50 uppercase tracking-wider">Toplam Çözüldü</p>
                    <p className="text-lg font-display font-bold">{stats.crises.resolved}</p>
                  </div>
                </div>
                <div className="glass-card rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#002349] flex items-center justify-center border border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary-container/10 animate-pulse" />
                    <span className="material-symbols-outlined text-primary-fixed text-xl">insights</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-surface-bright/50 uppercase tracking-wider">Aktif Krizler</p>
                    <p className={`text-lg font-display font-bold ${stats.crises.active > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {stats.crises.active} {stats.crises.active > 0 ? '🔴' : '✅'}
                    </p>
                  </div>
                </div>
              </>
            )}
            <button
              onClick={() => setShowTrigger(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600/80 hover:bg-rose-500 text-white text-sm font-bold rounded-xl border border-rose-500/50 transition-all shadow-lg shadow-rose-500/20"
            >
              <Zap size={14} /> Kriz Tetikle
            </button>
          </div>
        </div>

        {/* Radar graphic */}
        <div className="lg:col-span-5 h-[320px] rounded-2xl relative overflow-hidden shadow-2xl border border-white/10 bg-surface-dark flex items-center justify-center group">
          <img
            alt="Turbine Schematic"
            className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeV4uhOUPSgaFL0Iam92dbcs9F4v0rEURl6Qf_qMWveveE_TB6hkgEdcqY3V1BFg1bxWonsv2gvx0s4CBlK-eEeX_e0sDc3JUhj-OKRa_zFaMBlAoDTBQ8p0FtvsI9boMFKNPfc4gduqomcZBYW3urqTGX1waQFhFTpPYrmyL2xp3GdhLEwJL27lEz6lNqrdG69e3OhlHbrU7bEJVOzYI1Nw1XHBefdsVRObpegYCvGOI-OwzGSAdJEJfMtKDnBe_RJhOAeeuafLXs"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent opacity-85" />
          <div className="relative z-10 glass-card p-6 rounded-xl flex flex-col items-center text-center backdrop-blur-md bg-[#001229]/40 border-white/5">
            <span className="material-symbols-outlined text-primary-fixed text-4xl mb-2 animate-bounce">radar</span>
            <p className="text-[11px] font-bold text-primary-fixed tracking-widest uppercase">Gerçek Zamanlı Telemetri Aktif</p>
            {stats && (
              <p className="text-[10px] text-primary-fixed/70 mt-2">
                {stats.passengers} yolcu · {stats.flights} sefer · {stats.decisions} karar
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Stats grid */}
      {stats && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="crisis_alert" label="Toplam Kriz" value={stats.crises.total} />
          <KpiCard icon="warning" label="Aktif Kriz" value={stats.crises.active} valueClass={stats.crises.active > 0 ? 'text-rose-400' : 'text-emerald-400'} />
          <KpiCard icon="groups" label="Toplam Yolcu" value={stats.passengers} />
          <KpiCard icon="payments" label="Toplam Tazminat" value={`€${stats.total_compensation_eur?.toLocaleString() ?? 0}`} valueClass="text-emerald-400" />
        </section>
      )}

      {/* Systems health */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-surface-bright font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">auto_graph</span>
              AI Karar & İyileştirme Grafiği
            </h2>
            <span className="px-3 py-1 bg-white/5 text-primary-fixed rounded-full text-xs border border-white/10 font-bold">Son 24s</span>
          </div>
          <div className="h-64 bg-[#001832]/80 rounded-xl border border-white/5 flex items-end p-4 gap-2 relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <path d="M 0 150 Q 50 120, 100 140 T 200 100 T 300 80 T 400 110 T 500 50 L 500 250 L 0 250 Z" fill="rgba(158, 0, 31, 0.08)" />
              <path className="opacity-70" d="M 0 150 Q 50 120, 100 140 T 200 100 T 300 80 T 400 110 T 500 50" fill="none" stroke="#C8102E" strokeWidth="2.5" />
              <path className="opacity-45" d="M 0 200 Q 100 180, 200 190 T 400 150 T 500 130" fill="none" stroke="#455f88" strokeDasharray="4" strokeWidth="2" />
            </svg>
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 bg-[#002349]/90 backdrop-blur-md p-3 rounded-lg border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-primary-container rounded" />
                <span className="text-[10px] text-surface-bright/70 font-bold uppercase tracking-wider">Karar Doğruluğu (%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-secondary rounded" />
                <span className="text-[10px] text-surface-bright/70 font-bold uppercase tracking-wider">Operasyonel Kapasite</span>
              </div>
            </div>
          </div>
          {activeCrises.length > 0 && (
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4 flex items-start gap-4">
              <span className="material-symbols-outlined text-rose-400 mt-0.5 animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <div>
                <p className="text-xs font-bold text-surface-bright uppercase tracking-wider">Acil Eylem: {activeCrises[0].affected_passenger_count} Yolcu Onay Bekliyor</p>
                <p className="text-xs text-surface-bright/70 mt-1 leading-relaxed">
                  {activeCrises[0].reason} — AI kararları hazır, HITL onayı bekleniyor.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-surface-bright font-display">Çözüm Sistemleri</h2>
          {[
            { icon: 'memory', label: 'MILP Optimizasyon', status: '100% Optimal', pct: 100, color: 'bg-emerald-500' },
            { icon: 'psychology', label: 'Multi-Agent Brain', status: '98% Güven', pct: 98, color: 'bg-emerald-500' },
            { icon: 'quickreply', label: 'Twilio Bildirim', status: '100% Bağlı', pct: 100, color: 'bg-emerald-500' },
            { icon: 'shield', label: 'EU261 Compliance', status: '100% Uyum', pct: 100, color: 'bg-emerald-500' },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-fixed text-base">{s.icon}</span>
                  <span className="text-xs font-bold text-surface-bright">{s.label}</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">{s.status}</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HITL Approval panel */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-surface-bright font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">verified_user</span>
              Human-in-the-Loop Onay Havuzu
            </h2>
            <p className="text-xs text-surface-bright/60 mt-1">AI ve MILP tarafından üretilen kararları onaylayın.</p>
          </div>
          {decisions.length > 0 && (
            <button
              onClick={handleApproveAll}
              disabled={isApproving}
              className="bg-primary-container hover:bg-accent-red-hover text-on-primary font-sans text-xs px-6 py-2.5 rounded-full transition-all shadow-lg shadow-primary-container/20 flex items-center gap-2 font-bold disabled:opacity-60"
            >
              {isApproving ? <><Loader2 size={13} className="animate-spin" /> Onaylanıyor...</> : <><Check size={13} /> Tüm Kararları Onayla & SMS Gönder</>}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-primary-fixed animate-spin" />
            <p className="text-xs text-surface-bright/60">Kararlar yükleniyor...</p>
          </div>
        ) : decisions.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 border border-emerald-500/20 bg-emerald-950/10">
            <span className="material-symbols-outlined text-emerald-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            <h3 className="text-base font-bold text-emerald-400 uppercase tracking-wide">
              {activeCrises.length === 0 ? 'Aktif Kriz Yok' : 'Tüm Kararlar Onaylandı'}
            </h3>
            <p className="text-xs text-surface-bright/60 max-w-md text-center leading-relaxed">
              {activeCrises.length === 0
                ? 'Şu anda aktif kriz bulunmuyor. "Kriz Tetikle" ile senaryo başlatabilirsiniz.'
                : 'Etkilenen yolcular başarıyla alternatif uçuşlara yerleştirildi ve Twilio bildirimleri gönderildi.'}
            </p>
            <button onClick={() => setShowTrigger(true)} className="mt-2 flex items-center gap-2 px-5 py-2 bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold rounded-xl border border-rose-500/50 transition-all">
              <Zap size={13} /> Kriz Tetikle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decisions.map(dec => (
              <div key={dec.id} className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-white/10 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 bg-white/5 text-primary-fixed text-[10px] font-mono rounded border border-white/10 mr-2">#{dec.id}</span>
                    <span className="text-surface-bright font-bold text-xs">{dec.action}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    %{Math.round((dec.agent_confidence ?? 0) * 100)} Güven
                  </span>
                </div>
                <div className="flex flex-col gap-2 bg-black/25 p-3 rounded-xl border border-white/5 text-xs">
                  {[
                    ['Aksiyon', dec.action, 'text-primary-fixed'],
                    ['Yeni Uçuş', dec.new_flight_id ? `#${dec.new_flight_id}` : '—', 'text-surface-bright font-mono'],
                    ['Tazminat', `${dec.compensation_amount_eur} EUR`, 'text-emerald-400 font-mono font-bold'],
                    ['Otel', dec.hotel_name ?? '—', 'text-surface-bright'],
                  ].map(([label, val, cls]) => (
                    <div key={label as string} className="flex justify-between">
                      <span className="text-surface-bright/40 uppercase text-[9px] font-bold">{label}:</span>
                      <span className={cls as string}>{val}</span>
                    </div>
                  ))}
                </div>
                {dec.agent_reasoning && (
                  <p className="text-[11px] text-surface-bright/70 italic bg-white/5 p-2.5 rounded border border-white/5 leading-relaxed line-clamp-3">
                    <strong>Ajan Gerekçesi:</strong> {dec.agent_reasoning}
                  </p>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setDecisions(prev => prev.filter(d => d.id !== dec.id))}
                    className="px-3.5 py-1.5 border border-white/10 hover:border-red-500/50 hover:text-red-400 transition-colors text-[10px] font-bold rounded-full text-white/60"
                  >
                    Reddet
                  </button>
                  <button
                    onClick={() => handleApprove(dec)}
                    className="px-3.5 py-1.5 bg-primary-container hover:bg-accent-red-hover text-on-primary transition-colors text-[10px] font-bold rounded-full"
                  >
                    Onayla
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trigger Modal */}
      {showTrigger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><Zap size={16} className="text-rose-400" /> Kriz Senaryosu Tetikle</h3>
              <button onClick={() => setShowTrigger(false)}><XCircle size={18} className="text-slate-400 hover:text-white" /></button>
            </div>
            <div className="flex flex-col gap-3">
              {(['flight_number', 'reason'] as const).map(field => (
                <div key={field}>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{field === 'flight_number' ? 'Uçuş No' : 'Sebep'}</label>
                  <input
                    className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                    value={triggerForm[field]}
                    onChange={e => setTriggerForm(f => ({ ...f, [field]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kriz Tipi</label>
                <select className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" value={triggerForm.crisis_type} onChange={e => setTriggerForm(f => ({ ...f, crisis_type: e.target.value }))}>
                  <option value="CANCELLATION">İptal (CANCELLATION)</option>
                  <option value="DELAY">Gecikme (DELAY)</option>
                  <option value="DIVERSION">Yön Değişikliği (DIVERSION)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Şiddet</label>
                <select className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" value={triggerForm.severity} onChange={e => setTriggerForm(f => ({ ...f, severity: e.target.value }))}>
                  <option value="LOW">Düşük</option>
                  <option value="MEDIUM">Orta</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="CRITICAL">Kritik</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowTrigger(false)} className="flex-1 px-4 py-2 text-xs font-bold text-slate-400 border border-slate-600 rounded-xl hover:bg-slate-800">İptal</button>
              <button onClick={handleTriggerCrisis} disabled={isTriggering} className="flex-1 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                {isTriggering ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                {isTriggering ? 'Tetikleniyor...' : 'Krizi Başlat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm" style={{ animation: 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards' }}>
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <p className="text-xs font-bold">{toast}</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      ` }} />
    </div>
  );
}
