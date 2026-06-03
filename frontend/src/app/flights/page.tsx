'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plane, Loader2 } from 'lucide-react';
import { flightsApi, type Flight } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';

const STATUS_BADGE: Record<string, string> = {
  CANCELLED: 'badge badge-rose',
  DELAYED: 'badge badge-amber',
  BOARDING: 'badge badge-emerald',
  SCHEDULED: 'badge badge-cyan',
  DEPARTED: 'badge badge-secondary',
};

export default function FlightsPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [originFilter, setOriginFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await flightsApi.listAll(originFilter || undefined, destFilter || undefined);
      setFlights(data);
      setApiError(null);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'API bağlantısı kurulamadı');
    } finally {
      setIsLoading(false);
    }
  }, [originFilter, destFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); }
    catch { return '—'; }
  };

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader
        icon="flight_takeoff"
        title="Uçuş Kontrol ve Durum Paneli"
        subtitle="Filodaki tüm uçuşların anlık durumlarını, koltuk kapasitelerini ve rotalarını izleyin."
        onRefresh={fetchData}
        isRefreshing={isLoading}
      />

      {apiError && <ErrorBanner message={apiError} onRetry={fetchData} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Kalkış', value: originFilter, onChange: setOriginFilter, placeholder: 'IST, LHR...' },
          { label: 'Varış', value: destFilter, onChange: setDestFilter, placeholder: 'CDG, JFK...' },
        ].map(f => (
          <div key={f.label} className="flex items-center gap-2 bg-[#002349] border border-white/10 rounded-full px-4 py-2">
            <span className="text-[10px] font-bold text-surface-bright/50 uppercase tracking-wider">{f.label}:</span>
            <input
              className="bg-transparent border-none outline-none text-xs text-white placeholder-white/30 w-20"
              value={f.value}
              onChange={e => f.onChange(e.target.value.toUpperCase())}
              placeholder={f.placeholder}
              maxLength={3}
            />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden p-0 border border-white/5 shadow-2xl">
        <div className="bg-[#002349]/70 border-b border-white/10 px-5 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-base" style={{ fontVariationSettings: "'FILL' 1" }}>flight_takeoff</span>
          <h2 className="text-sm font-bold text-surface-bright font-display">Uçuş Listesi (FIDS)</h2>
          <span className="ml-auto px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-surface-bright/60">{flights.length} sefer</span>
        </div>

        {isLoading ? (
          <div className="p-10 flex items-center justify-center gap-3">
            <Loader2 size={24} className="text-primary-fixed animate-spin" />
            <span className="text-xs text-surface-bright/60">Uçuş verileri yükleniyor...</span>
          </div>
        ) : flights.length === 0 ? (
          <EmptyState icon="flight_takeoff" title="Uçuş bulunamadı" subtitle="Filtre kriterlerinizi değiştirin veya veri tabanına uçuş ekleyin." variant="neutral" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#001229]/60 border-b border-white/5 text-surface-bright/50">
                  {['Uçuş No', 'Güzergah', 'Kalkış / Varış', 'Uçak Tipi', 'Durum', 'Müsait Koltuk', 'Mesafe'].map(h => (
                    <th key={h} className="p-4 font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flights.map(f => (
                  <tr key={f.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Plane size={13} className="text-primary-container rotate-45 shrink-0" />
                        <span className="font-display font-bold text-surface-bright">{f.flight_number}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[#adc8f6] font-bold">{f.origin} ➔ {f.destination}</td>
                    <td className="p-4 text-surface-bright/70">
                      <span className="font-medium">{formatTime(f.scheduled_departure)}</span>
                      <span className="text-white/30 mx-1">/</span>
                      <span className="font-medium">{formatTime(f.scheduled_arrival)}</span>
                    </td>
                    <td className="p-4 text-surface-bright/60">{f.aircraft_type}</td>
                    <td className="p-4">
                      <span className={STATUS_BADGE[f.status] ?? 'badge badge-secondary'}>{f.status}</span>
                    </td>
                    <td className="p-4">
                      <span className={`font-mono font-bold ${f.available_seats === 0 ? 'text-rose-400' : f.available_seats < 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {f.available_seats}
                      </span>
                      <span className="text-white/30"> / {f.total_capacity}</span>
                    </td>
                    <td className="p-4 font-mono text-surface-bright/50">{f.distance_km?.toLocaleString()} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
