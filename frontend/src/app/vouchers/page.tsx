'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { voucherApi, crisisApi, type VoucherBundle } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';

const VOUCHER_ICON: Record<string,string> = { MEAL:'restaurant', LOUNGE:'airline_seat_recline_extra', HOTEL:'hotel', TRANSFER:'directions_bus', EU261:'gavel' };
const VOUCHER_COLOR: Record<string,string> = {
  MEAL:    'text-amber-400  bg-amber-500/10  border-amber-500/30',
  LOUNGE:  'text-purple-400 bg-purple-500/10 border-purple-500/30',
  HOTEL:   'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  TRANSFER:'text-cyan-400   bg-cyan-500/10   border-cyan-500/30',
  EU261:   'text-rose-400   bg-rose-500/10   border-rose-500/30',
};

export default function VouchersPage() {
  const [pnr, setPnr] = useState('');
  const [waitHours, setWaitHours] = useState(6);
  const [bundle, setBundle] = useState<VoucherBundle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [crises, setCrises] = useState<{id:number; flight_number:string; status:string}[]>([]);
  const [bulkCrisisId, setBulkCrisisId] = useState<number | null>(null);
  const [bulkResult, setBulkResult] = useState<{passengers_issued:number; grand_total_eur:number} | null>(null);
  const [isBulking, setIsBulking] = useState(false);

  const [rules, setRules] = useState<{rules: {wait_range:string; package:string; economy_total:number; business_total:number; first_total:number}[]}>({rules:[]});

  useEffect(() => {
    crisisApi.listAll(0, 20).then(c => setCrises(c.map((x:any) => ({ id: x.id, flight_number: (x as any).flight_number ?? `Kriz #${x.id}`, status: x.status }))));
    voucherApi.rules().then(r => setRules(r as any));
  }, []);

  const handleLookup = async () => {
    if (!pnr.trim()) return;
    setIsLoading(true); setError(null); setBundle(null);
    try {
      setBundle(await voucherApi.forPnr(pnr.trim(), waitHours));
    } catch (err) { setError(err instanceof Error ? err.message : 'Hata'); }
    finally { setIsLoading(false); }
  };

  const handleBulk = async () => {
    if (!bulkCrisisId) return;
    setIsBulking(true); setBulkResult(null);
    try {
      const r = await voucherApi.bulkIssue(bulkCrisisId);
      setBulkResult(r);
    } catch (err) { setError(err instanceof Error ? err.message : 'Toplu çıkarma başarısız'); }
    finally { setIsBulking(false); }
  };

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader icon="confirmation_number" title="Voucher Otomasyon Motoru"
        subtitle="THY Kriteri: Bekleme süresine göre ikram, otel, transfer veya ücret iadesi — IATA 735d & EU261 referanslı." />

      {error && <ErrorBanner message={error} />}

      {/* Rule Table */}
      <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <span className="material-symbols-outlined text-primary-container">table_chart</span>
          <h2 className="text-sm font-bold font-display">Voucher Kural Tablosu</h2>
          <span className="ml-auto text-[9px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full font-bold">IATA 735d · EU261/2004</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                {['Bekleme Süresi','Paket','Economy Toplam','Business Toplam','First Toplam'].map(h => (
                  <th key={h} className="px-4 py-2 text-left font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.rules.map((r,i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono font-bold text-[#adc8f6]">{r.wait_range}</td>
                  <td className="px-4 py-3 font-bold text-surface-bright">{r.package}</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">€{r.economy_total}</td>
                  <td className="px-4 py-3 font-mono font-bold text-amber-400">€{r.business_total}</td>
                  <td className="px-4 py-3 font-mono font-bold text-rose-400">€{r.first_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PNR Lookup */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <span className="material-symbols-outlined text-primary-container">person_search</span>
            <h2 className="text-sm font-bold font-display">PNR Bazlı Voucher</h2>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">PNR</label>
              <input className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-primary-container/60 uppercase" placeholder="PNR100" value={pnr} onChange={e => setPnr(e.target.value.toUpperCase())} onKeyDown={e => e.key==='Enter' && handleLookup()} maxLength={6} />
            </div>
            <div>
              <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Bekleme Süresi (saat)</label>
              <div className="flex gap-2 mt-1.5">
                {[2,3,6,12,18].map(h => (
                  <button key={h} onClick={() => setWaitHours(h)} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${waitHours===h ? 'bg-primary-container/20 text-primary-fixed border-primary-container/40' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}>{h}s</button>
                ))}
              </div>
            </div>
            <button onClick={handleLookup} disabled={isLoading || !pnr.trim()} className="flex items-center justify-center gap-2 py-2.5 bg-primary-container hover:bg-accent-red-hover text-on-primary font-bold text-sm rounded-xl transition-all disabled:opacity-60">
              {isLoading ? <Loader2 size={14} className="animate-spin"/> : <span className="material-symbols-outlined text-base">confirmation_number</span>}
              Voucher Üret
            </button>
          </div>

          {bundle && (
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-display font-bold text-surface-bright">{bundle.passenger_name}</p>
                  <p className="text-white/40">{bundle.ticket_class} · {bundle.wait_hours}s bekleme · {bundle.package_label}</p>
                </div>
                <p className="text-lg font-display font-bold text-primary-fixed">€{bundle.total_value_eur}</p>
              </div>
              {bundle.vouchers.map(v => (
                <div key={v.code} className={`flex items-center gap-3 p-3 rounded-xl border ${VOUCHER_COLOR[v.type]}`}>
                  <span className="material-symbols-outlined text-xl" style={{fontVariationSettings:"'FILL' 1"}}>{VOUCHER_ICON[v.type]??'receipt'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">{v.type} <span className="opacity-60 font-normal">€{v.value_eur}</span></p>
                    <p className="text-[9px] opacity-60 truncate">{v.details}</p>
                  </div>
                  <code className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded shrink-0">{v.code}</code>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bulk Issue */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <span className="material-symbols-outlined text-primary-container">groups</span>
            <h2 className="text-sm font-bold font-display">Toplu Voucher — Kriz Bazlı</h2>
            <span className="ml-auto text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">TAM OTOMASYon</span>
          </div>
          <p className="text-xs text-white/40 leading-relaxed">Seçilen kriz için tüm etkilenen yolculara bekleme süresi bazlı voucher paketi otomatik üretilir ve gönderilir. Operatör müdahalesi gerekmez.</p>
          <div>
            <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Kriz Seç</label>
            <select className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-container/60" value={bulkCrisisId ?? ''} onChange={e => setBulkCrisisId(parseInt(e.target.value)||null)}>
              <option value="">— Kriz seçin —</option>
              {crises.map(c => <option key={c.id} value={c.id} className="bg-slate-900">Kriz #{c.id} — {c.status}</option>)}
            </select>
          </div>
          <button onClick={handleBulk} disabled={isBulking||!bulkCrisisId} className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all border border-emerald-500/40 disabled:opacity-60">
            {isBulking ? <Loader2 size={14} className="animate-spin"/> : <span className="material-symbols-outlined text-base">send</span>}
            Toplu Voucher Gönder
          </button>
          {bulkResult && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-display font-bold text-emerald-400">{bulkResult.passengers_issued}</p>
              <p className="text-xs text-white/60">yolcuya voucher gönderildi</p>
              <p className="text-lg font-display font-bold text-primary-fixed mt-1">€{bulkResult.grand_total_eur.toLocaleString()}</p>
              <p className="text-[10px] text-white/30">toplam voucher değeri</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
