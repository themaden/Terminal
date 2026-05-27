'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState('systems');
  const [counts, setCounts] = useState({ crises: 1, pax: 25, resolved: 142, speed: 1.4 });
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = (pnr: string) => {
    setDecisions(prev => prev.filter(d => d.pnr !== pnr));
  };

  const handleApproveAll = () => {
    setIsApproving(true);
    setTimeout(() => {
      setDecisions([]);
      setIsApproving(false);
      alert("AeroSys AI: Tüm yolcuların kurtarma kararları onaylandı ve Twilio API üzerinden WhatsApp/SMS bildirimleri kuyruğa alındı!");
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-12 w-full">
      
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <h1 className="text-display-lg font-display text-on-surface">
            AeroSys <span className="text-primary">AI Intelligence</span> Hub
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
            Real-time precision monitoring and mathematical optimization (MILP) driven by advanced neural networks. Ensuring peak operational safety and cost recovery during irregular flight operations.
          </p>
          
          <div className="flex flex-wrap gap-4 items-center mt-4">
            <div className="glass-card rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center border border-flow-silver">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant uppercase">Sistem Durumu</p>
                <p className="text-headline-md font-display font-bold text-on-surface">99.9% Optimal</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center border border-flow-silver relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
                <span className="material-symbols-outlined text-secondary text-2xl">insights</span>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant uppercase">Aktif Kriz Akışı</p>
                <p className="text-headline-md font-display font-bold text-on-surface">TK1981 İptal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Turbine Graphic */}
        <div className="lg:col-span-5 h-[340px] rounded-2xl relative overflow-hidden shadow-lg border border-flow-silver bg-surface-dark flex items-center justify-center">
          <img 
            alt="Abstract rendering of an airplane turbine" 
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeV4uhOUPSgaFL0Iam92dbcs9F4v0rEURl6Qf_qMWveveE_TB6hkgEdcqY3V1BFg1bxWonsv2gvx0s4CBlK-eEeX_e0sDc3JUhj-OKRa_zFaMBlAoDTBQ8p0FtvsI9boMFKNPfc4gduqomcZBYW3urqTGX1waQFhFTpPYrmyL2xp3GdhLEwJL27lEz6lNqrdG69e3OhlHbrU7bEJVOzYI1Nw1XHBefdsVRObpegYCvGOI-OwzGSAdJEJfMtKDnBe_RJhOAeeuafLXs"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent opacity-80"></div>
          <div className="relative z-10 glass-card p-6 rounded-xl flex flex-col items-center justify-center backdrop-blur-md bg-surface-dark/40 border-surface-variant/30 text-center">
            <span className="material-symbols-outlined text-primary-fixed text-5xl mb-2 animate-bounce">radar</span>
            <p className="text-label-md font-label-md text-surface-bright tracking-widest uppercase font-bold">Gerçek Zamanlı Telemetri</p>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-flow-silver to-transparent my-2"></div>

      {/* Grid: Predictive Analytics & Systems Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Faux Graphic Line Chart */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-8 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-flow-silver pb-4">
            <h2 className="text-headline-md font-display font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_graph</span>
              Yapay Zeka Karar & İyileştirme Grafiği
            </h2>
            <span className="px-3 py-1 bg-surface-container-high text-secondary rounded-full text-label-sm font-label-sm border border-secondary/20">Son 24s Trendi</span>
          </div>

          <div className="h-64 bg-surface-container-lowest rounded-xl border border-flow-silver flex items-end p-4 gap-2 relative overflow-hidden">
            {/* Custom SVG Path Chart */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <path d="M 0 150 Q 50 120, 100 140 T 200 100 T 300 80 T 400 110 T 500 50 L 500 250 L 0 250 Z" fill="rgba(158, 0, 31, 0.05)"></path>
              <path className="opacity-70" d="M 0 150 Q 50 120, 100 140 T 200 100 T 300 80 T 400 110 T 500 50" fill="none" stroke="#9e001f" strokeWidth="2.5"></path>
              <path className="opacity-50" d="M 0 200 Q 100 180, 200 190 T 400 150 T 500 130" fill="none" stroke="#455f88" strokeDasharray="4" strokeWidth="2"></path>
            </svg>
            
            {/* Chart Legends */}
            <div className="absolute top-4 left-4 flex flex-col gap-1 z-10 bg-white/60 backdrop-blur-sm p-2 rounded border border-flow-silver/40">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-primary rounded"></div>
                <span className="text-label-sm font-label-sm text-on-surface-variant font-bold">Karar Doğruluğu (%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-secondary rounded"></div>
                <span className="text-label-sm font-label-sm text-on-surface-variant font-bold">Operasyonel Kapasite</span>
              </div>
            </div>
          </div>

          {/* Action Needed Card */}
          <div className="bg-error-container/20 border border-error/30 rounded-xl p-4 flex items-start gap-4">
            <span className="material-symbols-outlined text-error mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
            <div>
              <p className="text-label-md font-label-md text-on-surface font-bold">Acil Eylem Gerekli: 25 Yolcu Onay Bekliyor</p>
              <p className="text-body-md font-body-md text-on-surface-variant mt-1">
                LHR (Heathrow) kar fırtınası nedeniyle iptal edilen TK1981 seferine ait 25 yolcu için matematiksel MILP optimizasyonu ve AI koordinatörü kararları oluşturuldu. Human-in-the-Loop onayı bekleniyor.
              </p>
            </div>
          </div>
        </div>

        {/* Core Systems Health gauges */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h2 className="text-headline-md font-display font-bold text-on-surface mb-2">Çözüm Sistemleri</h2>
          
          <div className="glass-card rounded-xl p-4 flex flex-col gap-3 group hover:shadow-md cursor-pointer">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors">memory</span>
                <span className="text-label-md font-label-md text-on-surface font-bold">MILP Optimizasyon</span>
              </div>
              <span className="text-label-sm font-label-sm text-primary font-bold">100% Optimal</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full"></div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 flex flex-col gap-3 group hover:shadow-md cursor-pointer">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors">psychology</span>
                <span className="text-label-md font-label-md text-on-surface font-bold">Multi-Agent (CrewAI)</span>
              </div>
              <span className="text-label-sm font-label-sm text-primary font-bold">98% Güven</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[98%]"></div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 flex flex-col gap-3 group hover:shadow-md cursor-pointer">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors">quickreply</span>
                <span className="text-label-md font-label-md text-on-surface font-bold">Twilio Bildirim Hattı</span>
              </div>
              <span className="text-label-sm font-label-sm text-primary font-bold">100% Bağlı</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full"></div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 flex flex-col gap-3 group hover:shadow-md cursor-pointer">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors">shield</span>
                <span className="text-label-md font-label-md text-on-surface font-bold">EU261 Compliance</span>
              </div>
              <span className="text-label-sm font-label-sm text-primary font-bold">100% Uyum</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: 3D Schematic & Maintenance Forecast */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 3D Blueprint Airplane graphic */}
        <div className="lg:col-span-6 glass-card rounded-2xl h-[400px] relative overflow-hidden flex items-center justify-center bg-surface-dark border-surface-variant/30">
          <img 
            alt="Wireframe airplane graphic" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDL5-4Gg4iVKdsIA5GsKb1YdIsNdyeBCzBd6K_zKfgJxRZiXvT5nu88zRO0CPlIuOzGTxsccK-iqo3LwkhpjIqRw6QB9M8_kKK3b3obK5Tkcw4rIvDVzI-mWN6__vAdDucsOIBDFdyPcucVsi83er2tBw-uQMFKsxhIMJcd2XC0dRQtTC5le3XoLPGFVykva4koicUUjt7h6eVsegkJlbrwggogKz9Nd-ZHl65BdmCjDwc628qx-ND0iDED1wiBDJDqQxszzmxBhUO1"
          />
          {/* Glowing pulse points over aircraft wireframe */}
          <div className="absolute top-[40%] left-[30%] w-3 h-3 bg-primary rounded-full animate-ping"></div>
          <div className="absolute top-[40%] left-[30%] w-3 h-3 bg-primary rounded-full"></div>
          
          <div className="absolute top-[60%] left-[65%] w-3 h-3 bg-secondary rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-[60%] left-[65%] w-3 h-3 bg-secondary rounded-full"></div>
          
          <div className="absolute bottom-4 left-4 glass-card p-3 rounded-lg bg-surface-dark/60 text-surface-bright">
            <p className="text-label-sm font-mono uppercase tracking-widest text-flow-silver">Uçuş Radar Takip Sensörü: 1,402</p>
          </div>
        </div>

        {/* Dynamic Cost breakdown */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <CostBreakdown />
        </div>
      </section>

      {/* Human-in-the-Loop Approvals Panel */}
      <section className="flex flex-col gap-6 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-flow-silver pb-4">
          <div>
            <h2 className="text-headline-md font-display font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">verified_user</span>
              Human-in-the-Loop Onay & Karar Havuzu
            </h2>
            <p className="text-body-md font-body-md text-on-surface-variant">Yapay zeka ve matematiksel model tarafından üretilen kararları onaylayın.</p>
          </div>
          
          {decisions.length > 0 && (
            <button 
              className="bg-primary text-on-primary font-sans text-label-md px-6 py-2.5 rounded-full hover:bg-accent-red-hover transition-colors duration-300 shadow-md flex items-center gap-2 font-bold"
              onClick={handleApproveAll}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Onaylanıyor...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Tüm Kararları Onayla & Twilio SMS Gönder</span>
                </>
              )}
            </button>
          )}
        </div>

        {decisions.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
            <span className="material-symbols-outlined text-emerald text-5xl">task_alt</span>
            <h3 className="text-headline-md font-display font-bold text-on-surface">Tüm Kararlar Onaylandı!</h3>
            <p className="text-body-md font-body-md text-on-surface-variant max-w-md">Aktif krizdeki tüm etkilenen yolcular başarıyla alternatif uçuşlara yerleştirildi ve bildirimleri gönderildi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decisions.map((dec) => (
              <div key={dec.pnr} className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 bg-surface-container text-secondary text-label-sm font-mono rounded border border-flow-silver/40 mr-2">
                      {dec.pnr}
                    </span>
                    <strong className="text-on-surface font-bold text-body-md">{dec.name}</strong>
                  </div>
                  <span className="text-label-sm font-mono text-emerald font-bold">%{dec.confidence} Güven</span>
                </div>

                <div className="flex flex-col gap-2 bg-surface-light/40 p-3 rounded-xl border border-flow-silver/30 font-sans text-label-md">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant text-label-sm uppercase font-bold">Aksiyon:</span>
                    <span className="text-primary font-bold">{dec.action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant text-label-sm uppercase font-bold">Yeni Uçuş:</span>
                    <span className="text-secondary font-mono">{dec.newFlight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant text-label-sm uppercase font-bold">Tazminat:</span>
                    <span className="text-emerald font-mono font-bold">{dec.compensation} EUR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant text-label-sm uppercase font-bold">Otel:</span>
                    <span className="text-on-surface font-semibold">{dec.hotel}</span>
                  </div>
                </div>

                <div className="text-label-sm text-on-surface-variant italic bg-white/50 p-2.5 rounded border border-flow-silver/20 leading-relaxed">
                  <strong>Ajan Gerekçesi:</strong> {dec.reasoning}
                </div>

                <div className="flex gap-2 justify-end mt-2">
                  <button 
                    className="px-4 py-1.5 border border-flow-silver hover:border-primary hover:text-primary transition-colors text-label-sm rounded-full"
                    onClick={() => handleApprove(dec.pnr)}
                  >
                    Reddet
                  </button>
                  <button 
                    className="px-4 py-1.5 bg-primary text-on-primary hover:bg-accent-red-hover transition-colors text-label-sm font-bold rounded-full"
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
    </div>
  );
}
