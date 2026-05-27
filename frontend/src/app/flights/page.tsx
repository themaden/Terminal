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

  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("AeroSys HUD: Uçuş telemetrileri güncellendi.");
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <div className="border-b border-white/10 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-bright flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
              flight_takeoff
            </span>
            Uçuş Kontrol ve Durum Paneli
          </h1>
          <p className="text-xs text-surface-bright/60 mt-1">Filodaki tüm uçuşların anlık durumlarını, koltuk kapasitelerini ve rotalarını izleyin.</p>
        </div>

        <button 
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:border-primary-container hover:text-primary-fixed transition-all flex items-center gap-2 text-xs font-bold text-surface-bright"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> 
          {loading ? 'Güncelleniyor...' : 'Verileri Yenile'}
        </button>
      </div>

      {/* Flight Information Display System (FIDS) Grid */}
      <div className="glass-card rounded-2xl overflow-hidden p-0 border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#002349]/70 border-b border-white/10 text-surface-bright/60">
                <th className="p-4 font-bold uppercase tracking-wider">Uçuş No</th>
                <th className="p-4 font-bold uppercase tracking-wider">Güzergah</th>
                <th className="p-4 font-bold uppercase tracking-wider">Kalkış / Varış</th>
                <th className="p-4 font-bold uppercase tracking-wider">Uçak Tipi</th>
                <th className="p-4 font-bold uppercase tracking-wider">Uçuş Durumu</th>
                <th className="p-4 font-bold uppercase tracking-wider">Müsait Kapasite</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((f) => (
                <tr key={f.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-display font-bold text-surface-bright text-sm">
                    <div className="flex items-center gap-2">
                      <Plane size={15} className="text-primary-container rotate-45" /> {f.flight}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs font-bold text-[#adc8f6]">
                      {f.origin} ➔ {f.dest}
                    </span>
                  </td>
                  <td className="p-4 font-sans text-xs text-surface-bright">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar size={13} className="text-white/40" /> {f.departure} kalkış / {f.arrival} varış
                    </div>
                  </td>
                  <td className="p-4 text-xs text-surface-bright/70 font-medium">{f.aircraft}</td>
                  <td className="p-4">
                    <span className={`badge ${
                      f.status === 'CANCELLED' ? 'badge-rose' : f.status === 'DELAYED' ? 'badge-amber' : 'badge-emerald'
                    }`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-surface-bright/70 text-xs">
                    {f.capacity}
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
