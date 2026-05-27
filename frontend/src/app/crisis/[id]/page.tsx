'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, AlertTriangle, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react';
import CostBreakdown from '@/components/crisis/CostBreakdown';

interface Decision {
  pnr: string;
  name: string;
  ticketClass: string;
  action: string;
  newFlight: string;
  compensation: number;
  hotel: string;
  confidence: number;
  reasoning: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function CrisisDetailsPage() {
  const { id } = useParams();
  
  const [decisions, setDecisions] = useState<Decision[]>([
    {
      pnr: "PNR100",
      name: "Ahmet Yılmaz",
      ticketClass: "FIRST CLASS",
      action: "REBOOK",
      newFlight: "TK1983 (IST - LHR) - 3 saat sonra",
      compensation: 400,
      hotel: "VIP Lounge - Radisson Blu 5*",
      confidence: 99,
      reasoning: "First class yolcu sadakat düzeyi göz önüne alınarak ilk müsait alternatif uçuşa (TK1983) yerleştirildi. VIP dinlenme salonu ve 5 yıldızlı Radisson Blu otel konaklaması atandı.",
      status: 'PENDING'
    },
    {
      pnr: "PNR101",
      name: "Jean Smith",
      ticketClass: "ECONOMY CLASS",
      action: "REBOOK",
      newFlight: "TK1985 (IST - LHR) - 9 saat sonra",
      compensation: 400,
      hotel: "Airport Hotel (4*) - Gecelik",
      confidence: 95,
      reasoning: "Ekonomi yolcusu. İlk alternatifte (TK1983) yer kalmadığı için 9 saat sonra kalkacak olan TK1985 uçağına yerleştirildi. Uçuş ertesi güne sarktığından 4 yıldızlı otel tahsis edildi.",
      status: 'PENDING'
    },
    {
      pnr: "PNR102",
      name: "Ayşe Kaya",
      ticketClass: "BUSINESS CLASS",
      action: "REBOOK",
      newFlight: "TK1983 (IST - LHR) - 3 saat sonra",
      compensation: 400,
      hotel: "Radisson Blu (5*) - Gecelik",
      confidence: 98,
      reasoning: "Business yolcu önceliği uygulandı. TK1983 uçağındaki business kabine koltuk ataması yapıldı, 5 yıldızlı Radisson Blu oteli tahsis edildi.",
      status: 'PENDING'
    },
    {
      pnr: "PNR103",
      name: "Fatma Demir",
      ticketClass: "ECONOMY CLASS",
      action: "COMPENSATE",
      newFlight: "TK1983 (IST - LHR) - 3 saat sonra",
      compensation: 400,
      hotel: "Yok (Gündüz Bekleme)",
      confidence: 92,
      reasoning: "Gecikme süresi 3 saati aştığı ve mesafe 2500 km olduğu için EU261 uyarınca 400 EUR nakdi tazminat otomatik olarak onaylandı.",
      status: 'PENDING'
    }
  ]);

  const [selectedPnr, setSelectedPnr] = useState('PNR100');
  const [approvingPnr, setApprovingPnr] = useState<string | null>(null);

  const activeDecision = decisions.find(d => d.pnr === selectedPnr) || decisions[0];

  const handleStatusChange = (pnr: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setApprovingPnr(pnr);
    setTimeout(() => {
      setDecisions(prev => 
        prev.map(d => d.pnr === pnr ? { ...d, status: newStatus } : d)
      );
      setApprovingPnr(null);
    }, 800);
  };

  const handleBulkApprove = () => {
    setDecisions(prev => 
      prev.map(d => ({ ...d, status: 'APPROVED' }))
    );
    alert("JetNexus AI: Kriz altındaki tüm yolcu aksiyonları topluca onaylandı ve Twilio kuyruğuna aktarıldı!");
  };

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      
      {/* Header bar */}
      <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/crisis" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-white/20 transition-all shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-display font-bold text-surface-bright">Kriz Detay & Karar Paneli</h1>
              <span className="badge badge-rose">Kriz #{id || '1'}</span>
            </div>
            <p className="text-xs text-surface-bright/60 mt-0.5">TK1981 Londra Uçuş İptali / Kar Fırtınası - Kurtarma Kararları</p>
          </div>
        </div>

        <button 
          onClick={handleBulkApprove}
          className="bg-primary-container hover:bg-accent-red-hover text-on-primary font-sans text-xs px-6 py-2.5 rounded-full transition-all shadow-lg shadow-primary-container/20 flex items-center gap-2 font-bold"
        >
          <Check size={13} /> Tüm AI Kararlarını Topluca Onayla
        </button>
      </div>

      {/* Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Affected Passengers List */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-surface-bright font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">group</span>
                Etkilenen Yolcu Havuzu ({decisions.length})
              </h3>
              <span className="text-[10px] text-white/40 uppercase font-mono">TK1981 Telemetry</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-surface-bright/50">
                    <th className="pb-3 font-bold uppercase tracking-wider">PNR</th>
                    <th className="pb-3 font-bold uppercase tracking-wider">Yolcu Adı</th>
                    <th className="pb-3 font-bold uppercase tracking-wider">Sınıf</th>
                    <th className="pb-3 font-bold uppercase tracking-wider">AI Çözümü</th>
                    <th className="pb-3 font-bold uppercase tracking-wider">Onay Durumu</th>
                  </tr>
                </thead>
                <tbody>
                  {decisions.map((p) => {
                    const isSelected = p.pnr === selectedPnr;
                    return (
                      <tr 
                        key={p.pnr} 
                        onClick={() => setSelectedPnr(p.pnr)}
                        className={`border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                          isSelected ? 'bg-white/10' : ''
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-primary-fixed">{p.pnr}</td>
                        <td className="p-3 font-bold text-surface-bright">{p.name}</td>
                        <td className="p-3 text-[10px]">
                          <span className={`badge ${
                            p.ticketClass === 'FIRST CLASS' ? 'badge-rose' : p.ticketClass === 'BUSINESS CLASS' ? 'badge-cyan' : 'badge-amber'
                          }`}>
                            {p.ticketClass.split(' ')[0]}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-white/80">{p.action === 'REBOOK' ? 'Yeniden Rez' : 'Tazminat'}</td>
                        <td className="p-3">
                          {p.status === 'APPROVED' ? (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">Uygulandı</span>
                          ) : p.status === 'REJECTED' ? (
                            <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded font-bold">Reddedildi</span>
                          ) : (
                            <span className="text-[9px] bg-white/5 text-white/50 border border-white/10 px-2 py-0.5 rounded font-bold">Onay Bekliyor</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: AI Decision Workbench */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-gradient-to-br from-[#001c3c] to-[#002652] border border-primary-container/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(200,16,46,0.12)]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
              <h3 className="text-xs font-bold text-primary-fixed tracking-wider uppercase flex items-center gap-2">
                <span className="material-symbols-outlined animate-pulse text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  psychology
                </span>
                AI Çözümleme Hücresi
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 px-2 py-0.5 rounded-full font-bold">
                %{activeDecision.confidence} Güven Skoru
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-black/25 border border-white/5 rounded-xl p-3.5 flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40 uppercase text-[9px] font-bold">Yolcu PNR:</span>
                  <span className="text-primary-fixed font-bold font-mono">{activeDecision.pnr} ({activeDecision.name})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 uppercase text-[9px] font-bold">Önerilen Aksiyon:</span>
                  <span className="text-emerald-400 font-bold">{activeDecision.action} (Yeniden Koltuk Tahsisi)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 uppercase text-[9px] font-bold">Kurtarma Uçuşu:</span>
                  <span className="text-surface-bright font-semibold font-mono">{activeDecision.newFlight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 uppercase text-[9px] font-bold">EU261 Tazminat:</span>
                  <span className="text-emerald-400 font-mono font-bold">{activeDecision.compensation} EUR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 uppercase text-[9px] font-bold">Konaklama Tahsis:</span>
                  <span className="text-surface-bright font-semibold">{activeDecision.hotel}</span>
                </div>
              </div>

              <div className="bg-[#002349]/50 border border-white/5 rounded-xl p-3.5 text-xs leading-relaxed text-surface-bright/70">
                <strong className="text-primary-fixed block mb-1">Ajan Gerekçesi ve Operasyonel Mantık:</strong>
                {activeDecision.reasoning}
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button 
                  onClick={() => handleStatusChange(activeDecision.pnr, 'REJECTED')}
                  disabled={approvingPnr !== null || activeDecision.status !== 'PENDING'}
                  className="px-4 py-2 border border-white/10 hover:border-rose-500/50 hover:text-rose-400 transition-all text-xs font-bold rounded-full text-white/50 disabled:opacity-40"
                >
                  Geri Çevir
                </button>
                <button 
                  onClick={() => handleStatusChange(activeDecision.pnr, 'APPROVED')}
                  disabled={approvingPnr !== null || activeDecision.status !== 'PENDING'}
                  className="px-5 py-2 bg-primary-container hover:bg-accent-red-hover text-on-primary transition-all text-xs font-bold rounded-full disabled:opacity-40 flex items-center gap-1.5"
                >
                  {approvingPnr === activeDecision.pnr ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Onaylanıyor...
                    </>
                  ) : (
                    <>
                      <Check size={12} />
                      Kararı Onayla
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Cost breakdown */}
      <div className="w-full bg-surface-dark/40 border border-white/5 rounded-2xl p-5 mt-4">
        <CostBreakdown />
      </div>

    </div>
  );
}
