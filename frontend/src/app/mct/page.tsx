'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { hubApi, type ConnectionRecord, type ConnectionSummary } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import TableContainer from '@/components/ui/TableContainer';

// MCT airport reference table (mirrors backend)
const MCT_TABLE: Record<string, Record<string, number>> = {
  'LTFM (IST)': { 'DD': 45, 'DI': 60, 'ID': 60, 'II': 60 },
  'EGLL (LHR)': { 'DD': 60, 'DI': 75, 'ID': 75, 'II': 60 },
  'EDDF (FRA)': { 'DD': 45, 'DI': 60, 'ID': 60, 'II': 45 },
  'EHAM (AMS)': { 'DD': 40, 'DI': 50, 'ID': 50, 'II': 50 },
  'LFPG (CDG)': { 'DD': 40, 'DI': 55, 'ID': 55, 'II': 45 },
  'OMDB (DXB)': { 'DD': 45, 'DI': 60, 'ID': 60, 'II': 60 },
  'KJFK (JFK)': { 'DD': 70, 'DI': 90, 'ID': 90, 'II': 90 },
};

const STATUS_BADGE: Record<string, string> = {
  OK: 'badge badge-emerald',
  AT_RISK: 'badge badge-amber',
  CRITICAL: 'badge badge-rose',
  MISSED: 'bg-slate-500/20 text-slate-400 border border-slate-500/40 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase',
};

const STATUS_LABEL: Record<string, string> = {
  OK: 'Güvenli', AT_RISK: 'Riskli', CRITICAL: 'Kritik', MISSED: 'Kaçırıldı',
};

// MCT ad-hoc calculator state
const CONN_TYPES = ['DD', 'DI', 'ID', 'II'];

export default function MCTPage() {
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [missed, setMissed] = useState<ConnectionRecord[]>([]);
  const [summary, setSummary] = useState<ConnectionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ad-hoc MCT calculator
  const [calcAirport, setCalcAirport] = useState('LTFM');
  const [connType, setConnType] = useState('II');
  const [arrivalMin, setArrivalMin] = useState(30);
  const [departureMin, setDepartureMin] = useState(90);
  const [wheelchair, setWheelchair] = useState(false);
  const [calcResult, setCalcResult] = useState<Record<string, unknown> | null>(null);
  const [isCalcing, setIsCalcing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [riskData, missedData, sumData] = await Promise.all([
        hubApi.atRisk(),
        hubApi.missed(),
        hubApi.summary(),
      ]);
      setConnections(riskData.connections ?? []);
      setMissed(missedData.connections ?? []);
      setSummary(sumData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API bağlantısı kurulamadı');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 15000);
    return () => clearInterval(i);
  }, [fetchData]);

  const handleCalc = async () => {
    setIsCalcing(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/hub/mct/check?airport_icao=${calcAirport}&inbound_arrival_in_minutes=${arrivalMin}&outbound_departure_in_minutes=${departureMin}&wheelchair=${wheelchair}`
      );
      setCalcResult(await res.json());
    } catch { setCalcResult(null); }
    finally { setIsCalcing(false); }
  };

  const fmtMin = (m: number) => m < 0 ? `${Math.abs(m)}dk GEÇTİ` : m >= 60 ? `${Math.floor(m/60)}s ${m%60}dk` : `${m}dk`;

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader
        icon="connecting_airports"
        title="MCT / ACT — Bağlantı Süresi Analizi"
        subtitle="Minimum Connection Time algoritması ve Actual Connection Time gerçek zamanlı takibi. THY IATA SSIM Bölüm 5 referanslı."
        onRefresh={fetchData}
        isRefreshing={isLoading}
      />

      {error && <ErrorBanner message={error} onRetry={fetchData} />}

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard icon="connecting_airports" label="Toplam Bağlantı" value={summary.total} />
          <KpiCard icon="check_circle" label="Güvenli" value={summary.ok} valueClass="text-emerald-400" />
          <KpiCard icon="warning" label="Risk Altında" value={summary.at_risk} valueClass="text-amber-400" />
          <KpiCard icon="emergency" label="Kritik" value={summary.critical} valueClass="text-rose-400" />
          <KpiCard icon="cancel" label="Kaçırıldı" value={summary.missed} valueClass="text-slate-400" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MCT Reference Table */}
        <div className="lg:col-span-5 glass-card rounded-2xl flex flex-col">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
            <span className="material-symbols-outlined text-primary-container">table_chart</span>
            <h2 className="text-sm font-bold font-display">MCT Referans Tablosu</h2>
            <span className="ml-auto text-[9px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full font-bold">IATA SSIM Ch.5</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#001229]/60">
                  <th className="px-4 py-3 text-left font-bold text-white/40 uppercase tracking-wider">Havalimanı</th>
                  {CONN_TYPES.map(t => (
                    <th key={t} className="px-3 py-3 text-center font-bold text-white/40 uppercase tracking-wider" title={
                      t === 'DD' ? 'Yurt içi → Yurt içi' : t === 'DI' ? 'Yurt içi → Uluslararası' :
                      t === 'ID' ? 'Uluslararası → Yurt içi' : 'Uluslararası → Uluslararası'
                    }>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(MCT_TABLE).map(([airport, vals]) => (
                  <tr key={airport} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-2.5 font-mono font-bold text-[#adc8f6]">{airport}</td>
                    {CONN_TYPES.map(t => (
                      <td key={t} className="px-3 py-2.5 text-center font-mono font-bold text-surface-bright">
                        {vals[t]}<span className="text-white/30 text-[9px]">dk</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-white/5 text-[9px] text-white/20">
            DD: Dom→Dom · DI: Dom→Int · ID: Int→Dom · II: Int→Int · WCHR: +15dk eklenir
          </div>
        </div>

        {/* Ad-hoc MCT Calculator */}
        <div className="lg:col-span-7 glass-card rounded-2xl flex flex-col">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
            <span className="material-symbols-outlined text-primary-container">calculate</span>
            <h2 className="text-sm font-bold font-display">Anlık MCT Hesaplama</h2>
          </div>
          <div className="p-5 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Hub Havalimanı (ICAO)</label>
                <input className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-primary-container/60" value={calcAirport} onChange={e => setCalcAirport(e.target.value.toUpperCase())} maxLength={4} />
              </div>
              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Bağlantı Tipi</label>
                <select className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-container/60" value={connType} onChange={e => setConnType(e.target.value)}>
                  {[['DD','Yurt İçi → Yurt İçi'],['DI','Yurt İçi → Uluslararası'],['ID','Uluslararası → Yurt İçi'],['II','Uluslararası → Uluslararası']].map(([v, l]) => (
                    <option key={v} value={v} className="bg-slate-900">{v} — {l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Gelen Uçuş İnişi (dakika sonra)</label>
                <input type="number" className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-primary-container/60" value={arrivalMin} onChange={e => setArrivalMin(parseInt(e.target.value)||0)} />
              </div>
              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Giden Uçuş Kalkışı (dakika sonra)</label>
                <input type="number" className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-primary-container/60" value={departureMin} onChange={e => setDepartureMin(parseInt(e.target.value)||0)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
              <input type="checkbox" checked={wheelchair} onChange={e => setWheelchair(e.target.checked)} className="rounded" />
              WCHR — Tekerlekli Sandalye Yolcusu (+15dk eklenir)
            </label>
            <button onClick={handleCalc} disabled={isCalcing} className="self-start flex items-center gap-2 px-6 py-2.5 bg-primary-container hover:bg-accent-red-hover text-on-primary font-bold text-sm rounded-full transition-all disabled:opacity-60">
              {isCalcing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-base">play_arrow</span>}
              MCT Hesapla
            </button>

            {calcResult && (
              <div className={`rounded-xl p-5 border ${(calcResult.is_feasible as boolean) ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`material-symbols-outlined text-2xl ${(calcResult.is_feasible as boolean) ? 'text-emerald-400' : 'text-rose-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {(calcResult.is_feasible as boolean) ? 'check_circle' : 'cancel'}
                  </span>
                  <div>
                    <p className={`text-sm font-display font-bold ${(calcResult.is_feasible as boolean) ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(calcResult.is_feasible as boolean) ? 'BAĞLANTI MÜMKÜN' : 'BAĞLANTI KAÇIRILACAK'}
                    </p>
                    <p className="text-[10px] text-white/40">{calcResult.connection_type as string} bağlantısı · {calcResult.airport as string}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'MCT', value: `${calcResult.mct_minutes}dk`, color: 'text-primary-fixed' },
                    { label: 'Mevcut Süre (ACT)', value: `${calcResult.available_minutes}dk`, color: 'text-surface-bright' },
                    { label: 'Tampon', value: `${(calcResult.buffer_minutes as number) >= 0 ? '+' : ''}${calcResult.buffer_minutes}dk`, color: (calcResult.buffer_minutes as number) >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                  ].map(m => (
                    <div key={m.label} className="bg-black/20 rounded-lg p-3 text-center">
                      <p className="text-[9px] text-white/40 font-bold uppercase mb-1">{m.label}</p>
                      <p className={`text-lg font-display font-bold ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live ACT Tracker */}
      <TableContainer icon="radar" title="Canlı ACT Takip Ekranı" isLoading={isLoading}
        badge={<span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold">{connections.length + missed.length} bağlantı</span>}>
        {connections.length + missed.length === 0 ? (
          <EmptyState icon="connecting_airports" title="Tüm bağlantılar güvende" subtitle="ACT > MCT — izleme devam ediyor." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#001229]/60 border-b border-white/5 text-white/40">
                  {['PNR', 'Gelen Uçuş', 'Giden Uçuş', 'Hub', 'ACT', 'MCT', 'Tampon', 'Durum'].map(h => (
                    <th key={h} className="p-4 font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...connections, ...missed].map(r => {
                  const buf = r.act_minutes - r.mct_minutes;
                  return (
                    <tr key={`${r.pnr}-${r.inbound_flight}`} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 font-mono font-bold text-primary-fixed">{r.pnr}</td>
                      <td className="p-4 font-mono font-bold text-[#adc8f6]">{r.inbound_flight}</td>
                      <td className="p-4 font-mono text-white/60">{r.outbound_flight}</td>
                      <td className="p-4 font-bold">{r.hub_airport}</td>
                      <td className="p-4 font-mono font-bold">{fmtMin(r.act_minutes)}</td>
                      <td className="p-4 font-mono text-white/50">{r.mct_minutes}dk</td>
                      <td className="p-4 font-mono font-bold">
                        <span className={buf < 0 ? 'text-rose-400' : buf < 10 ? 'text-amber-400' : 'text-emerald-400'}>
                          {buf >= 0 ? '+' : ''}{buf}dk
                        </span>
                      </td>
                      <td className="p-4"><span className={STATUS_BADGE[r.status]}>{STATUS_LABEL[r.status]}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableContainer>
    </div>
  );
}
