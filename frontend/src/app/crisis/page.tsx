'use client';

import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, ChevronRight, Filter } from 'lucide-react';
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
    <div className="flex flex-col gap-8 w-full">
      <div className="border-b border-flow-silver pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-display-lg font-display text-on-surface">Kriz Yönetim Havuzu</h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant">Aktif operasyonel aksaklıkların durumunu izleyin ve onaylayın.</p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 bg-surface-light p-1 rounded-full border border-flow-silver/40">
          <button 
            className={`px-4 py-1.5 rounded-full text-label-sm font-bold transition-all ${filter === 'ALL' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface hover:text-primary'}`}
            onClick={() => setFilter('ALL')}
          >
            Tümü
          </button>
          <button 
            className={`px-4 py-1.5 rounded-full text-label-sm font-bold transition-all ${filter === 'ACTIVE' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface hover:text-primary'}`}
            onClick={() => setFilter('ACTIVE')}
          >
            Aktif
          </button>
          <button 
            className={`px-4 py-1.5 rounded-full text-label-sm font-bold transition-all ${filter === 'RESOLVED' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface hover:text-primary'}`}
            onClick={() => setFilter('RESOLVED')}
          >
            Çözülenler
          </button>
        </div>
      </div>

      {/* Crises Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredCrises.map((crisis) => (
          <div key={crisis.id} className="glass-card rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                crisis.status === 'ACTIVE' 
                  ? 'bg-error-container/20 border-error/30 text-error' 
                  : 'bg-surface-container border-flow-silver text-secondary'
              }`}>
                {crisis.status === 'ACTIVE' ? (
                  <AlertOctagon size={24} className="animate-pulse" />
                ) : (
                  <CheckCircle2 size={24} />
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-headline-md font-display font-bold text-on-surface">
                    {crisis.flight_number}
                  </span>
                  <span className="text-body-md text-on-surface-variant font-mono">
                    {crisis.origin} ➔ {crisis.destination}
                  </span>
                  <span className={`badge ${
                    crisis.severity === 'CRITICAL' ? 'badge-rose' : 'badge-amber'
                  }`}>
                    {crisis.severity}
                  </span>
                </div>
                <p className="text-body-md text-on-surface-variant mt-2 max-w-2xl">{crisis.reason}</p>
                <div className="flex gap-4 items-center mt-3 text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span> {crisis.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">group</span> {crisis.passengers} Yolcu Etkilendi
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
              <div className="text-right">
                <span className="text-label-sm text-on-surface-variant uppercase block">Durum</span>
                <span className={`badge ${
                  crisis.status === 'ACTIVE' ? 'badge-rose' : 'badge-emerald'
                } mt-1`}>
                  {crisis.status}
                </span>
              </div>
              
              <Link 
                href="/dashboard" 
                className="bg-surface-light border border-flow-silver/60 text-on-surface text-label-sm px-5 py-2 rounded-full hover:border-primary hover:text-primary transition-all flex items-center gap-1 font-bold w-full md:w-auto justify-center"
              >
                Kararları Yönet <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
