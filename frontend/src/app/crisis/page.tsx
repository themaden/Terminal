'use client';

import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, ChevronRight, Compass } from 'lucide-react';
import Link from 'next/link';

export default function CrisisPage() {
  const [crises, setCrises] = useState([
    {
      id: 1,
      flight_number: "TK1981",
      origin: "IST",
      destination: "LHR",
      type: "CANCELLATION",
      reason: "Heathrow Airport extreme winter snow storm and high runway ice layer.",
      severity: "CRITICAL",
      status: "ACTIVE",
      passengers: 25,
      time: "10 dakika önce"
    },
    {
      id: 2,
      flight_number: "TK1821",
      origin: "IST",
      destination: "CDG",
      type: "DELAY",
      reason: "Paris Charles de Gaulle air traffic control strike.",
      severity: "HIGH",
      status: "RESOLVING",
      passengers: 25,
      time: "1 saat önce"
    },
    {
      id: 3,
      flight_number: "TK1587",
      origin: "IST",
      destination: "FRA",
      type: "DELAY",
      reason: "Technical inspection of hydraulic pressure valves.",
      severity: "MEDIUM",
      status: "RESOLVED",
      passengers: 15,
      time: "5 saat önce"
    }
  ]);

  const [filter, setFilter] = useState('ALL');

  const filteredCrises = crises.filter(c => {
    if (filter === 'ALL') return true;
    return c.status === filter;
  });

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-bright flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">crisis_alert</span>
            Kriz Yönetim Havuzu
          </h1>
          <p className="text-xs text-surface-bright/60 mt-1">Aktif operasyonel aksaklıkların durumunu izleyin ve kararları denetleyin.</p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 bg-[#002349] p-1 rounded-full border border-white/10 shrink-0 self-start md:self-auto">
          <button 
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-primary-container text-white shadow-lg shadow-primary-container/25' : 'text-surface-bright/70 hover:text-white'}`}
            onClick={() => setFilter('ALL')}
          >
            Tümü
          </button>
          <button 
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'ACTIVE' ? 'bg-primary-container text-white shadow-lg shadow-primary-container/25' : 'text-surface-bright/70 hover:text-white'}`}
            onClick={() => setFilter('ACTIVE')}
          >
            Aktif
          </button>
          <button 
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'RESOLVED' ? 'bg-[#003875] text-white' : 'text-surface-bright/70 hover:text-white'}`}
            onClick={() => setFilter('RESOLVED')}
          >
            Çözülenler
          </button>
        </div>
      </div>

      {/* Crises Grid */}
      <div className="grid grid-cols-1 gap-5">
        {filteredCrises.map((crisis) => (
          <div key={crisis.id} className="glass-card rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border shrink-0 ${
                crisis.status === 'ACTIVE' 
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-400' 
                  : 'bg-[#002349]/80 border-white/10 text-primary-fixed'
              }`}>
                {crisis.status === 'ACTIVE' ? (
                  <AlertOctagon size={22} className="animate-pulse" />
                ) : (
                  <CheckCircle2 size={22} />
                )}
              </div>
              
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xl font-display font-bold text-surface-bright tracking-tight">
                    {crisis.flight_number}
                  </span>
                  <span className="text-xs text-surface-bright/60 font-mono">
                    {crisis.origin} ➔ {crisis.destination}
                  </span>
                  <span className={`badge ${
                    crisis.severity === 'CRITICAL' ? 'badge-rose' : 'badge-amber'
                  }`}>
                    {crisis.severity}
                  </span>
                </div>
                <p className="text-xs text-surface-bright/70 mt-2 max-w-2xl leading-relaxed">{crisis.reason}</p>
                <div className="flex gap-4 items-center mt-3 text-[10px] text-surface-bright/50 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1 font-mono">
                    <span className="material-symbols-outlined text-xs">schedule</span> {crisis.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">group</span> {crisis.passengers} Yolcu Etkilendi
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3.5 w-full md:w-auto shrink-0 border-t border-white/5 md:border-none pt-4 md:pt-0">
              <div className="text-left md:text-right flex md:block items-center justify-between w-full">
                <span className="text-[10px] text-surface-bright/40 uppercase block">Durum</span>
                <span className={`badge ${
                  crisis.status === 'ACTIVE' ? 'badge-rose' : 'badge-emerald'
                } mt-1`}>
                  {crisis.status}
                </span>
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
    </div>
  );
}
