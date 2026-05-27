'use client';

import React, { useState } from 'react';
import { Plane, Calendar, RefreshCw } from 'lucide-react';

export default function FlightsPage() {
  const [flights, setFlights] = useState([
    { id: 1, flight: "TK1981", origin: "IST", dest: "LHR", departure: "19:30", arrival: "23:30", aircraft: "Boeing 777-300ER", status: "CANCELLED", capacity: "0 / 300 (Dolu)" },
    { id: 2, flight: "TK1821", origin: "IST", dest: "CDG", departure: "20:15", arrival: "00:15", aircraft: "Airbus A330-300", status: "DELAYED", capacity: "0 / 289 (Dolu)" },
    { id: 3, flight: "TK1983", origin: "IST", dest: "LHR", departure: "22:30", arrival: "02:30", aircraft: "Airbus A350-900", status: "SCHEDULED", capacity: "15 / 329 (Boş Koltuk)" },
    { id: 4, flight: "TK1985", origin: "IST", dest: "LHR", departure: "04:30", arrival: "08:30", aircraft: "Boeing 787-9", status: "SCHEDULED", capacity: "95 / 300 (Boş Koltuk)" },
    { id: 5, flight: "TK1587", origin: "IST", dest: "FRA", departure: "21:00", arrival: "00:00", aircraft: "Airbus A321neo", status: "SCHEDULED", capacity: "15 / 190 (Boş Koltuk)" }
  ]);

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="border-b border-flow-silver pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-display-lg font-display text-on-surface">Uçuş Kontrol ve Durum Paneli</h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant">Filodaki tüm uçuşların anlık durumlarını, koltuk kapasitelerini ve rotalarını izleyin.</p>
        </div>

        <button 
          className="px-4 py-2 border border-flow-silver/60 rounded-full hover:border-primary hover:text-primary transition-all flex items-center gap-2 text-label-sm font-bold text-on-surface bg-white"
          onClick={() => alert("Uçuş telemetrileri güncellendi.")}
        >
          <RefreshCw size={14} /> Verileri Yenile
        </button>
      </div>

      {/* Flight Information Display System (FIDS) Grid */}
      <div className="glass-card rounded-2xl overflow-hidden p-0 border border-flow-silver/40">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-light border-b border-flow-silver/40">
              <th className="p-4 text-label-sm font-bold uppercase text-on-surface-variant">Uçuş No</th>
              <th className="p-4 text-label-sm font-bold uppercase text-on-surface-variant">Güzergah</th>
              <th className="p-4 text-label-sm font-bold uppercase text-on-surface-variant">Kalkış / Varış</th>
              <th className="p-4 text-label-sm font-bold uppercase text-on-surface-variant">Uçak Tipi</th>
              <th className="p-4 text-label-sm font-bold uppercase text-on-surface-variant">Uçuş Durumu</th>
              <th className="p-4 text-label-sm font-bold uppercase text-on-surface-variant">Müsait Kapasite</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((f) => (
              <tr key={f.id} className="border-b border-flow-silver/20 hover:bg-surface-light/30 transition-colors">
                <td className="p-4 font-display font-bold text-on-surface text-lg">
                  <div className="flex items-center gap-2">
                    <Plane size={16} className="text-primary rotate-45" /> {f.flight}
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-mono text-label-md font-bold text-secondary">
                    {f.origin} ➔ {f.dest}
                  </span>
                </td>
                <td className="p-4 font-sans text-label-md text-on-surface">
                  <div className="flex items-center gap-1 font-semibold">
                    <Calendar size={14} className="text-secondary" /> {f.departure} kalkış / {f.arrival} varış
                  </div>
                </td>
                <td className="p-4 text-label-md text-on-surface-variant font-medium">{f.aircraft}</td>
                <td className="p-4">
                  <span className={`badge ${
                    f.status === 'CANCELLED' ? 'badge-rose' : f.status === 'DELAYED' ? 'badge-amber' : 'badge-emerald'
                  }`}>
                    {f.status}
                  </span>
                </td>
                <td className="p-4 font-mono font-bold text-on-surface-variant text-label-md">
                  {f.capacity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
