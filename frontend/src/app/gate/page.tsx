'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gateApi, type HubCongestion, type GateSuggestion } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import ErrorBanner from '@/components/ui/ErrorBanner';

const TERMINAL_COLOR: Record<string,string> = {
  A:'bg-blue-500/20 border-blue-500/40 text-blue-400',
  B:'bg-indigo-500/20 border-indigo-500/40 text-indigo-400',
  C:'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
  D:'bg-purple-500/20 border-purple-500/40 text-purple-400',
  E:'bg-amber-500/20 border-amber-500/40 text-amber-400',
  F:'bg-slate-500/20 border-slate-500/40 text-slate-400',
};

const AIRCRAFT_TYPES = ['Boeing 777-300ER','Airbus A350-900','Airbus A330-300','Airbus A321neo','Airbus A320neo','Boeing 787-9'];

export default function GatePage() {
  const [congestion, setCongestion] = useState<HubCongestion | null>(null);
  const [suggestions, setSuggestions] = useState<GateSuggestion[]>([]);
  const [board, setBoard] = useState<Record<string,unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [aircraft, setAircraft] = useState('Boeing 777-300ER');
  const [flightType, setFlightType] = useState('international');
  const [boardTerminal, setBoardTerminal] = useState('');
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);
  const [assignGate, setAssignGate] = useState<number|null>(null);
  const [assignFlight, setAssignFlight] = useState('TK1981');
  const [assignMsg, setAssignMsg] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([gateApi.congestion('IST'), gateApi.suggest(aircraft, flightType)]);
      setCongestion(c); setSuggestions(s); setError(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'API hatası'); }
    finally { setIsLoading(false); }
  }, [aircraft, flightType]);

  useEffect(() => { fetchData(); }, [aircraft, flightType]);

  const handleLoadBoard = async () => {
    setIsLoadingBoard(true);
    try { const r = await gateApi.board(boardTerminal||undefined); setBoard(r.gates); }
    catch { setBoard([]); }
    finally { setIsLoadingBoard(false); }
  };

  const handleAssign = async () => {
    if (!assignGate) return;
    try {
      const r = await gateApi.assign(assignFlight, assignGate, aircraft);
      setAssignMsg(r.message);
    } catch (err) { setAssignMsg(err instanceof Error ? err.message : 'Atama başarısız'); }
  };

  const congPct = congestion?.overall_congestion_pct ?? 0;
  const alertColor = congPct >= 80 ? 'text-rose-400' : congPct >= 70 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader icon="map" title="Gate & Hub Yoğunluk Yönetimi" subtitle="THY Kriteri: Hub yoğunluğu, gate uygunluğu ve transfer operasyonlarının sürdürülebilirliği. IST terminali simülasyonu." onRefresh={fetchData} isRefreshing={isLoading} />

      {error && <ErrorBanner message={error} onRetry={fetchData} />}

      {congestion && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="hub" label="Genel Yoğunluk" value={`%${congestion.overall_congestion_pct}`} valueClass={alertColor} />
          <KpiCard icon="check_circle" label="Müsait Gate" value={congestion.available_gates} valueClass="text-emerald-400" />
          <KpiCard icon="block" label="Dolu Gate" value={congestion.occupied_gates} valueClass="text-rose-400" />
          <KpiCard icon="warning" label="Uyarı Seviyesi" value={congestion.alert_level} valueClass={alertColor} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Terminal Congestion Map */}
        <div className="lg:col-span-7 glass-card rounded-2xl flex flex-col">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
            <span className="material-symbols-outlined text-primary-container">map</span>
            <h2 className="text-sm font-bold font-display">IST Terminal Yoğunluk Haritası</h2>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
            {congestion?.terminals.map(t => {
              const pct = t.congestion_pct;
              return (
                <div key={t.terminal} className={`rounded-xl p-4 border ${t.alert ? 'border-rose-500/40 bg-rose-500/5' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-display font-bold text-sm ${TERMINAL_COLOR[t.terminal]}`}>
                      {t.terminal}
                    </div>
                    {t.alert && <span className="material-symbols-outlined text-rose-400 text-sm" style={{fontVariationSettings:"'FILL' 1"}}>warning</span>}
                  </div>
                  <p className="text-[10px] text-white/40 mb-1">{t.pier}</p>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/40">{t.occupied}/{t.total_gates}</span>
                    <span className={`font-bold ${pct>=70?'text-rose-400':pct>=50?'text-amber-400':'text-emerald-400'}`}>%{pct}</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${pct>=70?'bg-rose-500':pct>=50?'bg-amber-500':'bg-emerald-500'}`} style={{width:`${pct}%`}} />
                  </div>
                  <p className="text-[9px] text-white/30 mt-1">{t.available} müsait</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gate Suggestions */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="material-symbols-outlined text-primary-container text-base">recommend</span>
              <h2 className="text-xs font-bold font-display">Gate Önerisi</h2>
            </div>
            <div>
              <label className="text-[10px] text-white/40 font-bold uppercase">Uçak Tipi</label>
              <select className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" value={aircraft} onChange={e => setAircraft(e.target.value)}>
                {AIRCRAFT_TYPES.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-white/40 font-bold uppercase">Uçuş Tipi</label>
              <div className="flex gap-2 mt-1.5">
                {['international','domestic','schengen'].map(t => (
                  <button key={t} onClick={() => setFlightType(t)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all capitalize ${flightType===t ? 'bg-primary-container/20 text-primary-fixed border-primary-container/40' : 'bg-white/5 text-white/40 border-white/10'}`}>{t}</button>
                ))}
              </div>
            </div>
            {suggestions.map((s,i) => (
              <div key={s.gate} onClick={() => setAssignGate(s.gate)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${assignGate===s.gate ? 'border-primary-container/40 bg-primary-container/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-display font-bold text-sm ${TERMINAL_COLOR[s.terminal]}`}>{s.gate}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-surface-bright">Terminal {s.terminal} — {s.pier}</p>
                  <p className="text-[9px] text-white/40 truncate">{s.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-display font-bold text-emerald-400">{s.score}</p>
                  <p className="text-[9px] text-white/30">skor</p>
                </div>
              </div>
            ))}
            {assignGate && (
              <div className="flex gap-2 border-t border-white/10 pt-3">
                <input className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none uppercase" placeholder="Uçuş No" value={assignFlight} onChange={e => setAssignFlight(e.target.value.toUpperCase())} />
                <button onClick={handleAssign} className="px-4 py-2 bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all border border-emerald-500/40">Gate Ata</button>
              </div>
            )}
            {assignMsg && <p className="text-xs text-emerald-400 font-bold">{assignMsg}</p>}
          </div>

          {/* Board loader */}
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="material-symbols-outlined text-primary-container text-base">grid_view</span>
              <h2 className="text-xs font-bold font-display">Gate Tahtası</h2>
            </div>
            <div className="flex gap-2">
              <input className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" placeholder="Terminal (A-F, boş=tümü)" value={boardTerminal} onChange={e => setBoardTerminal(e.target.value.toUpperCase())} maxLength={1} />
              <button onClick={handleLoadBoard} disabled={isLoadingBoard} className="px-4 py-2 bg-primary-container/80 hover:bg-primary-container text-on-primary text-xs font-bold rounded-xl transition-all disabled:opacity-60">Yükle</button>
            </div>
            {board.length > 0 && (
              <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
                {board.slice(0, 60).map((g:any) => (
                  <div key={g.gate} className={`rounded p-1.5 text-center border text-[9px] font-bold font-mono ${g.occupied ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'}`}>
                    {g.gate}
                  </div>
                ))}
              </div>
            )}
            {board.length > 0 && (
              <div className="flex gap-3 text-[9px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-400"/>Dolu</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400"/>Müsait</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
