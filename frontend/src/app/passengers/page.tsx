'use client';

import React, { useState } from 'react';
import { Search, ShieldAlert, Award } from 'lucide-react';

export default function PassengersPage() {
  const [search, setSearch] = useState('');
  
  // Seed data passengers
  const passengers = [
    { id: 1, pnr: "PNR100", name: "Ahmet Yılmaz", email: "ahmet.yilmaz@example.com", phone: "+905551000000", class: "FIRST", loyalty: "PLATINUM", special: "Yok" },
    { id: 2, pnr: "PNR101", name: "Jean Smith", email: "jean.smith@example.com", phone: "+905551000001", class: "ECONOMY", loyalty: "NONE", special: "Tek Başına Çocuk (Minor)" },
    { id: 3, pnr: "PNR102", name: "Ayşe Kaya", email: "ayse.kaya@example.com", phone: "+905551000002", class: "BUSINESS", loyalty: "GOLD", special: "Yok" },
    { id: 4, pnr: "PNR103", name: "Fatma Demir", email: "fatma.demir@example.com", phone: "+905551000003", class: "ECONOMY", loyalty: "SILVER", special: "Tekerlekli Sandalye" },
    { id: 5, pnr: "PNR104", name: "Mustafa Çelik", email: "mustafa.celik@example.com", phone: "+905551000004", class: "BUSINESS", loyalty: "PLATINUM", special: "Yok" }
  ];

  const filteredPassengers = passengers.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.pnr.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-bright flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">group</span>
            Yolcu Takip ve Veri Sistemi
          </h1>
          <p className="text-xs text-surface-bright/60 mt-1">Uçuşlardaki tüm yolcuların detaylarını, PNR ve sadakat bilgilerini sorgulayın.</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 bg-[#002349] border border-white/10 rounded-full px-4 py-2 w-full md:w-80 shadow-md">
          <Search size={15} className="text-white/40" />
          <input 
            type="text" 
            placeholder="PNR veya yolcu adı ara..." 
            className="bg-transparent border-none outline-none text-xs w-full text-white placeholder-white/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Passengers Table */}
      <div className="glass-card rounded-2xl overflow-hidden p-0 border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#002349]/70 border-b border-white/10 text-surface-bright/60">
                <th className="p-4 font-bold uppercase tracking-wider">PNR Kodu</th>
                <th className="p-4 font-bold uppercase tracking-wider">Yolcu Adı</th>
                <th className="p-4 font-bold uppercase tracking-wider">Bilet Sınıfı</th>
                <th className="p-4 font-bold uppercase tracking-wider">Loyalty Programı</th>
                <th className="p-4 font-bold uppercase tracking-wider">İletişim Kanalları</th>
                <th className="p-4 font-bold uppercase tracking-wider">Özel Durum / İhtiyaç</th>
              </tr>
            </thead>
            <tbody>
              {filteredPassengers.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono font-bold text-primary-fixed">{p.pnr}</td>
                  <td className="p-4 font-bold text-surface-bright">{p.name}</td>
                  <td className="p-4">
                    <span className={`badge ${
                      p.class === 'FIRST' ? 'badge-rose' : p.class === 'BUSINESS' ? 'badge-cyan' : 'badge-amber'
                    }`}>
                      {p.class}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 font-bold text-[#4ade80]">
                      <Award size={14} className="text-primary-container" /> {p.loyalty}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[11px] text-surface-bright/70">
                    <div>{p.email}</div>
                    <div className="mt-0.5 text-white/40">{p.phone}</div>
                  </td>
                  <td className="p-4">
                    {p.special !== 'Yok' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/20 border border-rose-500/20 px-2 py-0.5 rounded">
                        <ShieldAlert size={12} /> {p.special}
                      </span>
                    ) : (
                      <span className="text-[11px] text-surface-bright/50">Standart Yolcu</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
