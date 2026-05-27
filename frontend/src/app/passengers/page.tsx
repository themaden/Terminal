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
    <div className="flex flex-col gap-8 w-full">
      <div className="border-b border-flow-silver pb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-display-lg font-display text-on-surface">Yolcu Takip ve Veri Sistemi</h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant">Uçuşlardaki tüm yolcuların detaylarını, PNR ve sadakat bilgilerini sorgulayın.</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-surface-light border border-flow-silver/60 rounded-full px-4 py-2 w-full md:w-80">
          <Search size={16} className="text-secondary" />
          <input 
            type="text" 
            placeholder="PNR veya yolcu adı ara..." 
            className="bg-transparent border-none outline-none text-sm w-full text-on-surface placeholder:text-on-surface-variant/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Passengers Table */}
      <div className="glass-card rounded-2xl overflow-hidden p-0 border border-flow-silver/40">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-light border-b border-flow-silver/40">
              <th className="p-4 text-label-sm font-bold uppercase text-on-surface-variant">PNR</th>
              <th className="p-4 text-label-sm font-bold uppercase text-on-surface-variant">Yolcu Adı</th>
              <th className="p-4 text-label-sm font-bold uppercase text-on-surface-variant">Bilet Sınıfı</th>
              <th className="p-4 text-label-sm font-bold uppercase text-on-surface-variant">Loyalty Programı</th>
              <th className="p-4 text-label-sm font-bold uppercase text-on-surface-variant">İletişim</th>
              <th className="p-4 text-label-sm font-bold uppercase text-on-surface-variant">Özel Durum / İhtiyaç</th>
            </tr>
          </thead>
          <tbody>
            {filteredPassengers.map((p) => (
              <tr key={p.id} className="border-b border-flow-silver/20 hover:bg-surface-light/30 transition-colors">
                <td className="p-4 font-mono font-bold text-primary">{p.pnr}</td>
                <td className="p-4 font-bold text-on-surface">{p.name}</td>
                <td className="p-4">
                  <span className={`badge ${
                    p.class === 'FIRST' ? 'badge-rose' : p.class === 'BUSINESS' ? 'badge-cyan' : 'badge-amber'
                  }`}>
                    {p.class}
                  </span>
                </td>
                <td className="p-4">
                  <span className="flex items-center gap-1 font-bold text-secondary">
                    <Award size={16} className="text-primary" /> {p.loyalty}
                  </span>
                </td>
                <td className="p-4 text-label-sm text-on-surface-variant font-mono">
                  <div>{p.email}</div>
                  <div className="mt-0.5">{p.phone}</div>
                </td>
                <td className="p-4">
                  {p.special !== 'Yok' ? (
                    <span className="flex items-center gap-1 text-label-sm font-bold text-error bg-error-container/10 border border-error/20 px-2 py-0.5 rounded">
                      <ShieldAlert size={14} /> {p.special}
                    </span>
                  ) : (
                    <span className="text-label-sm text-on-surface-variant">Standart Yolcu</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
