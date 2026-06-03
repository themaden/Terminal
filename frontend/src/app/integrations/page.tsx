'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { pssApi, flightDataApi, authApi, type PssStatus, type SchedulerStatus, type FlightOffer } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import ErrorBanner from '@/components/ui/ErrorBanner';

const STATUS_DOT = (ok: boolean) => ok
  ? 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse'
  : 'w-2 h-2 rounded-full bg-amber-400';

const CABINS = ['ECONOMY', 'BUSINESS', 'FIRST'];

export default function IntegrationsPage() {
  const [pssStatus, setPssStatus] = useState<PssStatus | null>(null);
  const [scheduler, setScheduler] = useState<SchedulerStatus | null>(null);
  const [users, setUsers] = useState<{ email: string; role: string; avatar: string; last_login: string | null }[]>([]);
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PSS search form
  const [origin, setOrigin] = useState('IST');
  const [destination, setDestination] = useState('LHR');
  const [travelDate, setTravelDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [cabin, setCabin] = useState('ECONOMY');
  const [isSearching, setIsSearching] = useState(false);

  // Departure board
  const [airport, setAirport] = useState('IST');
  const [departures, setDepartures] = useState<{ flight_number: string; destination: string; status: string; delay_minutes: number; gate: string; scheduled_departure: string }[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const [pss, sched] = await Promise.all([
        pssApi.status(),
        flightDataApi.schedulerStatus(),
      ]);
      setPssStatus(pss);
      setScheduler(sched);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API bağlantısı kurulamadı');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const u = await authApi.users();
      setUsers(u as any);
    } catch {
      // non-admin: silently ignore
    }
  }, []);

  useEffect(() => { fetchStatus(); fetchUsers(); }, [fetchStatus, fetchUsers]);

  const handleSearch = async () => {
    setIsSearching(true);
    setOffers([]);
    try {
      const res = await pssApi.search(origin, destination, travelDate, cabin);
      setOffers(res.offers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Arama başarısız');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadBoard = async () => {
    setLoadingBoard(true);
    try {
      const res = await flightDataApi.departures(airport);
      setDepartures(res.flights as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kalkış tahtası yüklenemedi');
    } finally {
      setLoadingBoard(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader
        icon="settings_input_component"
        title="Entegrasyon Merkezi"
        subtitle="PostgreSQL auth, Amadeus PSS (sandbox), Cirium AODB akışı ve arka plan zamanlayıcı durumu."
        onRefresh={fetchStatus}
        isRefreshing={isLoading}
      />

      {error && <ErrorBanner message={error} onRetry={fetchStatus} />}

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Auth / PostgreSQL */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            </div>
            <div>
              <p className="text-xs font-bold text-surface-bright">JWT Auth</p>
              <p className="text-[10px] text-white/40">PostgreSQL / SQLite</p>
            </div>
            <div className={`ml-auto ${STATUS_DOT(true)}`} />
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Algoritma', value: 'HS256 (JWT)' },
              { label: 'Token Süresi', value: '8 saat' },
              { label: 'Şifre Hash', value: 'bcrypt rounds=12' },
              { label: 'Demo Şifre', value: 'jetnexus2024' },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-[11px]">
                <span className="text-white/40">{r.label}</span>
                <span className="font-mono font-bold text-surface-bright">{r.value}</span>
              </div>
            ))}
          </div>
          {users.length > 0 && (
            <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
              <p className="text-[9px] font-bold uppercase text-white/30 tracking-wider">Kullanıcılar ({users.length})</p>
              {users.map(u => (
                <div key={u.email} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#002349] border border-white/10 flex items-center justify-center text-[9px] font-bold text-primary-fixed">{(u as any).avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-surface-bright truncate">{u.email}</p>
                    <p className="text-[9px] text-white/30">{(u as any).role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Amadeus PSS */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-400 text-base">flight</span>
            </div>
            <div>
              <p className="text-xs font-bold text-surface-bright">Amadeus PSS</p>
              <p className="text-[10px] text-white/40">{pssStatus?.mode ?? '—'}</p>
            </div>
            <div className={`ml-auto ${STATUS_DOT(pssStatus?.configured ?? false)}`} />
          </div>
          {pssStatus && (
            <div className="flex flex-col gap-2">
              {[
                { label: 'Sağlayıcı', value: pssStatus.provider },
                { label: 'Mod', value: pssStatus.mode },
                { label: 'Yapılandırıldı', value: pssStatus.configured ? 'Evet' : 'Mock (Sandbox)' },
                { label: 'Sandbox URL', value: 'test.api.amadeus.com' },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-[11px]">
                  <span className="text-white/40">{r.label}</span>
                  <span className={`font-mono font-bold ${r.label === 'Yapılandırıldı' && !pssStatus.configured ? 'text-amber-400' : 'text-surface-bright'}`}>{r.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-white/10 pt-3">
            <p className="text-[9px] text-white/30 leading-relaxed">
              Gerçek key için: developers.amadeus.com → Self-Service → API key &amp; secret alın → .env dosyasına AMADEUS_CLIENT_ID ve AMADEUS_CLIENT_SECRET ekleyin.
            </p>
          </div>
        </div>

        {/* Cirium + Scheduler */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-400 text-base">radar</span>
            </div>
            <div>
              <p className="text-xs font-bold text-surface-bright">Cirium AODB</p>
              <p className="text-[10px] text-white/40">FlightStats API</p>
            </div>
            <div className={`ml-auto ${STATUS_DOT(scheduler?.running ?? false)}`} />
          </div>
          {scheduler && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/40">Zamanlayıcı</span>
                <span className={`font-bold ${scheduler.running ? 'text-emerald-400' : 'text-rose-400'}`}>{scheduler.running ? 'Aktif' : 'Durdu'}</span>
              </div>
              {scheduler.jobs.map(j => (
                <div key={j.id} className="flex justify-between text-[11px]">
                  <span className="text-white/40">{j.id === 'flight_poll' ? 'Uçuş Poll (5dk)' : 'Risk Cache (30dk)'}</span>
                  <span className="font-mono text-surface-bright/60 text-[9px]">
                    {j.next_run ? new Date(j.next_run).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-white/10 pt-3">
            <p className="text-[9px] text-white/30 leading-relaxed">
              Cirium key için: developer.cirium.com → App ID &amp; Key → .env dosyasına CIRIUM_APP_ID ve CIRIUM_APP_KEY ekleyin.
            </p>
          </div>
        </div>
      </div>

      {/* Amadeus Flight Search */}
      <div className="glass-card rounded-2xl p-5 flex flex-col gap-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <span className="material-symbols-outlined text-primary-container">search</span>
          <h2 className="text-sm font-bold font-display">Amadeus Uçuş Arama (PSS)</h2>
          <span className="ml-auto text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
            {pssStatus?.configured ? 'LIVE' : 'MOCK'}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <input className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-primary-container/60" placeholder="Kalkış (IST)" value={origin} onChange={e => setOrigin(e.target.value.toUpperCase())} maxLength={3} />
          <input className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-primary-container/60" placeholder="Varış (LHR)" value={destination} onChange={e => setDestination(e.target.value.toUpperCase())} maxLength={3} />
          <input type="date" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-container/60" value={travelDate} onChange={e => setTravelDate(e.target.value)} />
          <select className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-container/60" value={cabin} onChange={e => setCabin(e.target.value)}>
            {CABINS.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
          </select>
          <button onClick={handleSearch} disabled={isSearching} className="bg-primary-container hover:bg-accent-red-hover text-on-primary text-xs font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-1.5">
            {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-sm">search</span>}
            Ara
          </button>
        </div>
        {offers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/40">
                  {['Uçuş', 'Kaynak', 'Kalkış', 'Varış', 'Sınıf', 'Koltuk', 'Fiyat'].map(h => (
                    <th key={h} className="px-3 py-2 font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {offers.map(o => (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-3 py-3 font-display font-bold text-surface-bright">{o.flight_number}</td>
                    <td className="px-3 py-3"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${o.source === 'amadeus_live' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30'}`}>{o.source}</span></td>
                    <td className="px-3 py-3 font-mono text-white/60">{o.departure_time}</td>
                    <td className="px-3 py-3 font-mono text-white/60">{o.arrival_time}</td>
                    <td className="px-3 py-3 text-white/60">{o.cabin_class}</td>
                    <td className="px-3 py-3 font-bold text-emerald-400">{o.available_seats}</td>
                    <td className="px-3 py-3 font-mono font-bold text-primary-fixed">€{o.price_eur.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AODB Departure Board */}
      <div className="glass-card rounded-2xl p-5 flex flex-col gap-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <span className="material-symbols-outlined text-primary-container">flight_takeoff</span>
          <h2 className="text-sm font-bold font-display">Canlı Kalkış Tahtası (Cirium/AODB)</h2>
        </div>
        <div className="flex gap-3">
          <input className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-primary-container/60 w-28" placeholder="Havalimanı" value={airport} onChange={e => setAirport(e.target.value.toUpperCase())} maxLength={3} />
          <button onClick={handleLoadBoard} disabled={loadingBoard} className="px-5 py-2 bg-primary-container hover:bg-accent-red-hover text-on-primary text-xs font-bold rounded-xl transition-all disabled:opacity-60 flex items-center gap-1.5">
            {loadingBoard ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-sm">refresh</span>}
            Yükle
          </button>
        </div>
        {departures.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/40">
                  {['Uçuş', 'Varış', 'Planlanan', 'Gecikme', 'Durum', 'Kapı'].map(h => (
                    <th key={h} className="px-3 py-2 font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {departures.map((d, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-3 py-3 font-display font-bold text-surface-bright">{d.flight_number}</td>
                    <td className="px-3 py-3 font-mono text-[#adc8f6] font-bold">{d.destination}</td>
                    <td className="px-3 py-3 text-white/60">{new Date(d.scheduled_departure).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-3 py-3">
                      {d.delay_minutes > 0
                        ? <span className="text-amber-400 font-mono font-bold">+{d.delay_minutes}dk</span>
                        : <span className="text-emerald-400 font-bold">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${d.status === 'DELAYED' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-white/60">{d.gate}</td>
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
