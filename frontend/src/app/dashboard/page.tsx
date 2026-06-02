'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Check, Loader2, Award, ShieldAlert, Cpu, RefreshCw, Zap } from 'lucide-react';
import CostBreakdown from '@/components/crisis/CostBreakdown';
import { crisisApi, statsApi, type CrisisEvent, type Decision, type Stats } from '@/lib/api';

export default function DashboardPage() {
  // ── State ──────────────────────────────────────────────
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [activeCrises, setActiveCrises] = useState<CrisisEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [approvingCrisisId, setApprovingCrisisId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Trigger Crisis Form ────────────────────────────────
  const [showTrigger, setShowTrigger] = useState(false);
  const [triggerForm, setTriggerForm] = useState({
    flight_number: 'TK1981',
    crisis_type: 'CANCELLATION',
    reason: 'Severe weather conditions at LHR',
    severity: 'HIGH',
  });
  const [isTriggering, setIsTriggering] = useState(false);

  // ── Data Fetching ──────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsData, crisesData] = await Promise.all([
        statsApi.get(),
        crisisApi.listActive(),
      ]);
      setStats(statsData);
      setActiveCrises(crisesData);
      setApiError(null);

      // Load decisions from the first active crisis
      if (crisesData.length > 0) {
        const dec = await crisisApi.getDecisions(crisesData[0].id);
        setDecisions(dec.filter((d) => d.status === 'PENDING'));
      } else {
        setDecisions([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API bağlantısı kurulamadı';
      console.error('Dashboard data fetch error:', err);
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // ── Handlers ───────────────────────────────────────────
  const handleApprove = async (decision: Decision) => {
    try {
      await crisisApi.approve(decision.crisis_id);
      setDecisions((prev) => prev.filter((d) => d.id !== decision.id));
      showToastMsg(`Karar #${decision.id} onaylandı ✓`);
      fetchDashboardData();
    } catch (e) {
      showToastMsg(`Hata: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`);
    }
  };

  const handleApproveAll = async () => {
    if (activeCrises.length === 0) return;
    setIsApproving(true);
    setApprovingCrisisId(activeCrises[0].id);
    try {
      await crisisApi.approve(activeCrises[0].id);
      setDecisions([]);
      showToastMsg('Tüm kararlar onaylandı! SMS ve WhatsApp bildirimleri gönderildi. ✈️');
      fetchDashboardData();
    } catch (e) {
      showToastMsg(`Onay hatası: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsApproving(false);
      setApprovingCrisisId(null);
    }
  };

  const handleTriggerCrisis = async () => {
    setIsTriggering(true);
    try {
      const crisis = await crisisApi.trigger(triggerForm);
      showToastMsg(`Kriz oluşturuldu! #${crisis.id} — AI karar motoru çalışıyor...`);
      setShowTrigger(false);
      setTimeout(fetchDashboardData, 3000); // Wait for AI to process
    } catch (e) {
      showToastMsg(`Kriz tetiklenemedi: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const showToastMsg = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 6000);
  };

  // ── Mock decisions for offline/dev display ─────────────
  const displayDecisions = decisions.length > 0 ? decisions : [];

  return (
    <div className="flex flex-col gap-12 w-full select-none text-white">
      
      {/* 🚨 API Error Banner */}
      {apiError && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-red-300">Backend bağlantısı kurulamadı</p>
            <p className="text-xs text-red-400/70 mt-0.5">{apiError}</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 shrink-0"
          >
            <RefreshCw size={12} /> Tekrar Dene
          </button>
        </div>
      )}

      {/* 🚀 Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
            JetNexus <span className="text-primary-container text-shadow-glow">AI Intelligence</span> Hub
          </h1>
          <p className="text-lg font-body-lg text-surface-bright/70 max-w-2xl leading-relaxed">
            Gelişmiş sinir ağları ve matematiksel optimizasyon (MILP) motoru ile uçuş operasyonlarında anlık kriz takibi ve operasyonel maliyet yönetimi kontrol merkezi.
          </p>
          
          <div className="flex flex-wrap gap-4 items-center mt-4">
            <div className="glass-card rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#002349] flex items-center justify-center border border-white/10">
                <span className="material-symbols-outlined text-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-surface-bright/50 uppercase tracking-wider">Toplam Çözüldü</p>
                <p className="text-lg font-display font-bold text-surface-bright">
                  {stats ? stats.crises.resolved : '—'}
                </p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#002349] flex items-center justify-center border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary-container/10 animate-pulse"></div>
                <span className="material-symbols-outlined text-primary-fixed text-2xl">insights</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-surface-bright/50 uppercase tracking-wider">Aktif Krizler</p>
                <p className="text-lg font-display font-bold text-surface-bright">
                  {stats ? (
                    <span className={stats.crises.active > 0 ? 'text-red-400' : 'text-emerald-400'}>
                      {stats.crises.active} {stats.crises.active > 0 ? '🔴' : '✅'}
                    </span>
                  ) : '—'}
                </p>
              </div>
            </div>

            {/* Trigger Crisis Button */}
            <button
              onClick={() => setShowTrigger(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600/80 hover:bg-rose-500 text-white text-sm font-bold rounded-xl border border-rose-500/50 transition-all shadow-lg shadow-rose-500/20"
            >
              <Zap size={14} />
              Kriz Tetikle
            </button>
          </div>
        </div>

        {/* Turbine Graphic */}
        <div className="lg:col-span-5 h-[320px] rounded-2xl relative overflow-hidden shadow-2xl border border-white/10 bg-surface-dark flex items-center justify-center group">
          <img 
            alt="Turbine Schematic" 
            className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeV4uhOUPSgaFL0Iam92dbcs9F4v0rEURl6Qf_qMWveveE_TB6hkgEdcqY3V1BFg1bxWonsv2gvx0s4CBlK-eEeX_e0sDc3JUhj-OKRa_zFaMBlAoDTBQ8p0FtvsI9boMFKNPfc4gduqomcZBYW3urqTGX1waQFhFTpPYrmyL2xp3GdhLEwJL27lEz6lNqrdG69e3OhlHbrU7bEJVOzYI1Nw1XHBefdsVRObpegYCvGOI-OwzGSAdJEJfMtKDnBe_RJhOAeeuafLXs"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent opacity-85"></div>
          <div className="relative z-10 glass-card p-6 rounded-xl flex flex-col items-center justify-center backdrop-blur-md bg-[#001229]/40 border-white/5 text-center">
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


      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2"></div>

      {/* Grid: Predictive Analytics & Systems Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Faux Graphic Line Chart */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-surface-bright font-display tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">auto_graph</span>
              Yapay Zeka Karar & İyileştirme Grafiği
            </h2>
            <span className="px-3 py-1 bg-white/5 text-primary-fixed rounded-full text-xs border border-white/10 font-bold">Son 24s Trendi</span>
          </div>

          <div className="h-64 bg-[#001832]/80 rounded-xl border border-white/5 flex items-end p-4 gap-2 relative overflow-hidden">
            {/* Custom SVG Path Chart */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <path d="M 0 150 Q 50 120, 100 140 T 200 100 T 300 80 T 400 110 T 500 50 L 500 250 L 0 250 Z" fill="rgba(158, 0, 31, 0.08)"></path>
              <path className="opacity-70" d="M 0 150 Q 50 120, 100 140 T 200 100 T 300 80 T 400 110 T 500 50" fill="none" stroke="#C8102E" strokeWidth="2.5"></path>
              <path className="opacity-45" d="M 0 200 Q 100 180, 200 190 T 400 150 T 500 130" fill="none" stroke="#455f88" strokeDasharray="4" strokeWidth="2"></path>
            </svg>
            
            {/* Chart Legends */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 bg-[#002349]/90 backdrop-blur-md p-3 rounded-lg border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-primary-container rounded"></div>
                <span className="text-[10px] text-surface-bright/70 font-bold uppercase tracking-wider">Karar Doğruluğu (%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-secondary rounded"></div>
                <span className="text-[10px] text-surface-bright/70 font-bold uppercase tracking-wider">Operasyonel Kapasite</span>
              </div>
            </div>
          </div>

          {/* Action Needed Card */}
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4 flex items-start gap-4">
            <span className="material-symbols-outlined text-rose-400 mt-0.5 animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
            <div>
              <p className="text-xs font-bold text-surface-bright uppercase tracking-wider">Acil Eylem Gerekli: 25 Yolcu Onay Bekliyor</p>
              <p className="text-xs text-surface-bright/70 mt-1 leading-relaxed">
                LHR kar fırtınası nedeniyle iptal edilen TK1981 seferine ait 25 yolcu için matematiksel MILP optimizasyonu ve AI koordinatörü kararları oluşturuldu. Human-in-the-Loop onayı bekleniyor.
              </p>
            </div>
          </div>
        </div>

        {/* Core Systems Health gauges */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-surface-bright font-display tracking-tight">Çözüm Sistemleri</h2>
          
          <div className="glass-card rounded-xl p-4 flex flex-col gap-3 group hover:border-white/15 cursor-pointer">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Cpu size={15} className="text-primary-fixed group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-surface-bright">MILP Optimizasyon</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">100% Optimal</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full"></div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 flex flex-col gap-3 group hover:border-white/15 cursor-pointer">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed text-base group-hover:scale-110 transition-transform">psychology</span>
                <span className="text-xs font-bold text-surface-bright">Multi-Agent Brain</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">98% Güven</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[98%]"></div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 flex flex-col gap-3 group hover:border-white/15 cursor-pointer">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed text-base">quickreply</span>
                <span className="text-xs font-bold text-surface-bright">Twilio Bildirim Hattı</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">100% Bağlı</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full"></div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 flex flex-col gap-3 group hover:border-white/15 cursor-pointer">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed text-base">shield</span>
                <span className="text-xs font-bold text-surface-bright">EU261 Compliance</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">100% Uyum</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: 3D Schematic & Maintenance Forecast */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 3D Blueprint Airplane graphic */}
        <div className="lg:col-span-6 glass-card rounded-2xl h-[380px] relative overflow-hidden flex items-center justify-center bg-surface-dark border-white/5">
          <img 
            alt="Aircraft schematic wireframe" 
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-screen pointer-events-none scale-105" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDL5-4Gg4iVKdsIA5GsKb1YdIsNdyeBCzBd6K_zKfgJxRZiXvT5nu88zRO0CPlIuOzGTxsccK-iqo3LwkhpjIqRw6QB9M8_kKK3b3obK5Tkcw4rIvDVzI-mWN6__vAdDucsOIBDFdyPcucVsi83er2tBw-uQMFKsxhIMJcd2XC0dRQtTC5le3XoLPGFVykva4koicUUjt7h6eVsegkJlbrwggogKz9Nd-ZHl65BdmCjDwc628qx-ND0iDED1wiBDJDqQxszzmxBhUO1"
          />
          {/* Glowing pulse points over aircraft wireframe */}
          <div className="absolute top-[42%] left-[28%] w-2.5 h-2.5 bg-primary-container rounded-full animate-ping"></div>
          <div className="absolute top-[42%] left-[28%] w-2.5 h-2.5 bg-primary-container rounded-full"></div>
          
          <div className="absolute top-[58%] left-[62%] w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-[58%] left-[62%] w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
          
          <div className="absolute bottom-4 left-4 glass-card px-3 py-1.5 rounded-lg bg-[#001229]/65 text-white/90 text-[10px] font-mono tracking-widest border border-white/5">
            UÇUŞ RADAR AKTİF SENSÖRÜ: 1,402
          </div>
        </div>

        {/* Dynamic Cost breakdown */}
        <div className="lg:col-span-6 flex flex-col gap-6 bg-surface-dark/40 rounded-2xl border border-white/5 p-5">
          <CostBreakdown />
        </div>
      </section>

      {/* Human-in-the-Loop Approvals Panel */}
      <section className="flex flex-col gap-6 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-surface-bright font-display tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">verified_user</span>
              Human-in-the-Loop Onay & Karar Havuzu
            </h2>
            <p className="text-xs text-surface-bright/60 mt-1">Yapay zeka ve matematiksel model tarafından üretilen kararları onaylayın.</p>
          </div>
          
          {displayDecisions.length > 0 && (
            <button 
              className="bg-primary-container hover:bg-accent-red-hover text-on-primary font-sans text-xs px-6 py-2.5 rounded-full transition-all shadow-lg shadow-primary-container/20 flex items-center gap-2 font-bold"
              onClick={handleApproveAll}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Onaylanıyor...</span>
                </>
              ) : (
                <>
                  <Check size={13} />
                  <span>Tüm Kararları Onayla & SMS Gönder</span>
                </>
              )}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
            <Loader2 size={32} className="text-primary-fixed animate-spin" />
            <p className="text-xs text-surface-bright/60">Backend'den kararlar yükleniyor...</p>
          </div>
        ) : displayDecisions.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 border border-emerald-500/20 bg-emerald-950/10">
            <span className="material-symbols-outlined text-emerald-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            <h3 className="text-base font-bold text-emerald-400 tracking-wide uppercase">
              {activeCrises.length === 0 ? 'Aktif Kriz Yok' : 'Tüm Kararlar Onaylandı!'}
            </h3>
            <p className="text-xs text-surface-bright/60 max-w-md leading-relaxed">
              {activeCrises.length === 0
                ? 'Şu anda aktif kriz bulunmuyor. "Kriz Tetikle" butonu ile senaryo başlatabilirsiniz.'
                : 'Tüm etkilenen yolcular başarıyla alternatif uçuşlara yerleştirildi ve Twilio bildirimleri gönderildi.'}
            </p>
            <button
              onClick={() => setShowTrigger(true)}
              className="mt-2 flex items-center gap-2 px-5 py-2 bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold rounded-xl border border-rose-500/50 transition-all"
            >
              <Zap size={13} /> Kriz Tetikle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayDecisions.map((dec) => (
              <div key={dec.id} className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-white/10 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 bg-white/5 text-primary-fixed text-[10px] font-mono rounded border border-white/10 mr-2">
                      #{dec.id}
                    </span>
                    <span className="text-surface-bright font-bold text-xs">Karar {dec.action}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    %{Math.round((dec.agent_confidence ?? 0) * 100)} Güven
                  </span>
                </div>

                <div className="flex flex-col gap-2 bg-black/25 p-3 rounded-xl border border-white/5 font-sans text-xs">
                  <div className="flex justify-between">
                    <span className="text-surface-bright/40 uppercase text-[9px] font-bold">Aksiyon:</span>
                    <span className="text-primary-fixed font-bold">{dec.action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-bright/40 uppercase text-[9px] font-bold">Yeni Uçuş ID:</span>
                    <span className="text-surface-bright font-mono font-medium">
                      {dec.new_flight_id ? `#${dec.new_flight_id}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-bright/40 uppercase text-[9px] font-bold">Tazminat:</span>
                    <span className="text-emerald-400 font-mono font-bold">{dec.compensation_amount_eur} EUR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-bright/40 uppercase text-[9px] font-bold">Otel:</span>
                    <span className="text-surface-bright font-semibold">{dec.hotel_name ?? '—'}</span>
                  </div>
                </div>

                {dec.agent_reasoning && (
                  <div className="text-[11px] text-surface-bright/70 italic bg-white/5 p-2.5 rounded border border-white/5 leading-relaxed line-clamp-3">
                    <strong>Ajan Gerekçesi:</strong> {dec.agent_reasoning}
                  </div>
                )}

                <div className="flex gap-2 justify-end mt-1">
                  <button 
                    className="px-3.5 py-1.5 border border-white/10 hover:border-red-500/50 hover:text-red-400 transition-colors text-[10px] font-bold rounded-full text-white/60"
                    onClick={() => setDecisions(prev => prev.filter(d => d.id !== dec.id))}
                  >
                    Reddet
                  </button>
                  <button 
                    className="px-3.5 py-1.5 bg-primary-container hover:bg-accent-red-hover text-on-primary transition-colors text-[10px] font-bold rounded-full"
                    onClick={() => handleApprove(dec)}
                  >
                    Tekil Onay
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🚨 Trigger Crisis Modal */}
      {showTrigger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Zap size={16} className="text-rose-400" /> Kriz Senaryosu Tetikle
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              AI karar motoru gerçek zamanlı analiz yaparak yolcuları yeniden atar.
            </p>
            
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Uçuş No</label>
                <input
                  className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  value={triggerForm.flight_number}
                  onChange={e => setTriggerForm(f => ({ ...f, flight_number: e.target.value }))}
                  placeholder="TK1981"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kriz Tipi</label>
                <select
                  className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  value={triggerForm.crisis_type}
                  onChange={e => setTriggerForm(f => ({ ...f, crisis_type: e.target.value }))}
                >
                  <option value="CANCELLATION">İptal (CANCELLATION)</option>
                  <option value="DELAY">Gecikme (DELAY)</option>
                  <option value="DIVERSION">Yön Değişikliği (DIVERSION)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sebep</label>
                <input
                  className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  value={triggerForm.reason}
                  onChange={e => setTriggerForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Severe weather conditions at LHR"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Şiddet</label>
                <select
                  className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  value={triggerForm.severity}
                  onChange={e => setTriggerForm(f => ({ ...f, severity: e.target.value }))}
                >
                  <option value="LOW">Düşük</option>
                  <option value="MEDIUM">Orta</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="CRITICAL">Kritik</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTrigger(false)}
                className="flex-1 px-4 py-2 text-xs font-bold text-slate-400 border border-slate-600 rounded-xl hover:bg-slate-800 transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleTriggerCrisis}
                disabled={isTriggering}
                className="flex-1 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isTriggering ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                {isTriggering ? 'Tetikleniyor...' : 'Krizi Başlat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in max-w-sm">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <p className="text-xs font-bold">{toastMessage}</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .animate-slide-in {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}} />
    </div>
  );
}

