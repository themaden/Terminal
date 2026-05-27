'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, Loader2, Award, ShieldAlert, Cpu } from 'lucide-react';
import CostBreakdown from '@/components/crisis/CostBreakdown';

export default function DashboardPage() {
  const [decisions, setDecisions] = useState([
    {
      pnr: "PNR100",
      name: "Ahmet Yılmaz",
      ticketClass: "FIRST CLASS",
      action: "Yeniden Rezervasyon",
      newFlight: "TK1983 (IST - LHR) - 3 saat sonra",
      compensation: 400,
      hotel: "VIP Lounge - Radisson Blu 5*",
      confidence: 99,
      reasoning: "First class yolcu için en yüksek sadakat skoru gözetildi. 3 saatlik gecikmeyle TK1983 seferine atandı, Radisson Blu VIP konaklama atandı."
    },
    {
      pnr: "PNR101",
      name: "Jean Smith",
      ticketClass: "ECONOMY CLASS",
      action: "Yeniden Rezervasyon",
      newFlight: "TK1985 (IST - LHR) - 9 saat sonra",
      compensation: 400,
      hotel: "Airport Hotel (4*) - Gecelik",
      confidence: 95,
      reasoning: "Ekonomi sınıfı yolcu. TK1983 uçağında boş koltuk kalmadığı için gecikmeli olan TK1985 uçağına atandı. Gece kalışı nedeniyle 4 yıldızlı havalimanı oteli tahsis edildi."
    },
    {
      pnr: "PNR102",
      name: "Ayşe Kaya",
      ticketClass: "BUSINESS CLASS",
      action: "Yeniden Rezervasyon",
      newFlight: "TK1983 (IST - LHR) - 3 saat sonra",
      compensation: 400,
      hotel: "Radisson Blu (5*) - Gecelik",
      confidence: 98,
      reasoning: "Business yolcu önceliği. İlk alternatif olan TK1983 uçağına business koltuk ataması yapıldı, 5 yıldızlı otel tahsis edildi."
    }
  ]);

  const [counts, setCounts] = useState({ crises: 1, pax: 25, resolved: 142, speed: 1.4 });
  const [isApproving, setIsApproving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleApprove = (pnr: string) => {
    setDecisions(prev => prev.filter(d => d.pnr !== pnr));
    addToastAction(`Yolcu ${pnr} kararı onaylandı.`);
  };

  const handleApproveAll = () => {
    setIsApproving(true);
    setTimeout(() => {
      setDecisions([]);
      setIsApproving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }, 1500);
  };

  const addToastAction = (msg: string) => {
    alert(`JetNexus HUD: ${msg}`);
  };

  return (
    <div className="flex flex-col gap-12 w-full select-none text-white">
      
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
                <p className="text-[10px] font-bold text-surface-bright/50 uppercase tracking-wider">Sistem Optimizasyonu</p>
                <p className="text-lg font-display font-bold text-surface-bright">99.9% Optimal</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#002349] flex items-center justify-center border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary-container/10 animate-pulse"></div>
                <span className="material-symbols-outlined text-primary-fixed text-2xl">insights</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-surface-bright/50 uppercase tracking-wider">Aktif Kriz Akışı</p>
                <p className="text-lg font-display font-bold text-surface-bright">TK1981 İptal</p>
              </div>
            </div>
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
          
          {decisions.length > 0 && (
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
                  <span>Tüm Kararları Onayla & SMS Bildirilerini Gönder</span>
                </>
              )}
            </button>
          )}
        </div>

        {decisions.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 border border-emerald-500/20 bg-emerald-950/10">
            <span className="material-symbols-outlined text-emerald-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            <h3 className="text-base font-bold text-emerald-400 tracking-wide uppercase">Tüm Kararlar Başarıyla Onaylandı!</h3>
            <p className="text-xs text-surface-bright/60 max-w-md leading-relaxed">Aktif krizdeki tüm etkilenen yolcular başarıyla alternatif uçuşlara yerleştirildi ve Twilio bildirimleri gönderildi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decisions.map((dec) => (
              <div key={dec.pnr} className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-white/10 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 bg-white/5 text-primary-fixed text-[10px] font-mono rounded border border-white/10 mr-2">
                      {dec.pnr}
                    </span>
                    <strong className="text-surface-bright font-bold text-xs">{dec.name}</strong>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">%{dec.confidence} Güven</span>
                </div>

                <div className="flex flex-col gap-2 bg-black/25 p-3 rounded-xl border border-white/5 font-sans text-xs">
                  <div className="flex justify-between">
                    <span className="text-surface-bright/40 uppercase text-[9px] font-bold">Aksiyon:</span>
                    <span className="text-primary-fixed font-bold">{dec.action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-bright/40 uppercase text-[9px] font-bold">Yeni Uçuş:</span>
                    <span className="text-surface-bright font-mono font-medium">{dec.newFlight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-bright/40 uppercase text-[9px] font-bold">Tazminat:</span>
                    <span className="text-emerald-400 font-mono font-bold">{dec.compensation} EUR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-bright/40 uppercase text-[9px] font-bold">Otel:</span>
                    <span className="text-surface-bright font-semibold">{dec.hotel}</span>
                  </div>
                </div>

                <div className="text-[11px] text-surface-bright/70 italic bg-white/5 p-2.5 rounded border border-white/5 leading-relaxed">
                  <strong>Ajan Gerekçesi:</strong> {dec.reasoning}
                </div>

                <div className="flex gap-2 justify-end mt-1">
                  <button 
                    className="px-3.5 py-1.5 border border-white/10 hover:border-primary-container hover:text-primary-container transition-colors text-[10px] font-bold rounded-full text-white/60"
                    onClick={() => handleApprove(dec.pnr)}
                  >
                    Reddet
                  </button>
                  <button 
                    className="px-3.5 py-1.5 bg-primary-container hover:bg-accent-red-hover text-on-primary transition-colors text-[10px] font-bold rounded-full"
                    onClick={() => handleApprove(dec.pnr)}
                  >
                    Tekil Onay
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🔔 Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <p className="text-xs font-bold">AeroSys AI: Tüm yolcuların kurtarma kararları onaylandı ve SMS/WhatsApp bildirimleri kuyruğa alındı!</p>
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
      `}} />
    </div>
  );
}
