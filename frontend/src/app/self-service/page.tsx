'use client';

import React, { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { selfServiceApi, type SelfServiceStatus, type AlternativeFlight, type BoardingPass } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import ErrorBanner from '@/components/ui/ErrorBanner';

const VOUCHER_ICON: Record<string, string> = {
  MEAL: 'restaurant',
  HOTEL: 'hotel',
  TRANSFER: 'directions_bus',
};

const VOUCHER_COLOR: Record<string, string> = {
  MEAL: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  HOTEL: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  TRANSFER: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
};

export default function SelfServicePage() {
  const [pnr, setPnr] = useState('');
  const [status, setStatus] = useState<SelfServiceStatus | null>(null);
  const [boardingPass, setBoardingPass] = useState<BoardingPass | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingFlight, setBookingFlight] = useState<number | null>(null);
  const [rebookSuccess, setRebookSuccess] = useState<string | null>(null);
  const [loadingBP, setLoadingBP] = useState(false);

  const lookup = useCallback(async () => {
    if (!pnr.trim()) return;
    setIsLoading(true);
    setError(null);
    setStatus(null);
    setBoardingPass(null);
    setRebookSuccess(null);
    try {
      const data = await selfServiceApi.status(pnr.trim());
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PNR bulunamadı');
    } finally {
      setIsLoading(false);
    }
  }, [pnr]);

  const handleRebook = async (alt: AlternativeFlight) => {
    if (!status) return;
    setBookingFlight(alt.flight_id);
    try {
      const res = await selfServiceApi.rebook(status.pnr, alt.flight_id);
      setRebookSuccess(res.message);
      const updated = await selfServiceApi.status(status.pnr);
      setStatus(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rezervasyon başarısız');
    } finally {
      setBookingFlight(null);
    }
  };

  const handleBoardingPass = async () => {
    if (!status) return;
    setLoadingBP(true);
    setBoardingPass(null);
    try {
      const bp = await selfServiceApi.boardingPass(status.pnr);
      setBoardingPass(bp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Boarding pass üretilemedi');
    } finally {
      setLoadingBP(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader
        icon="self_improvement"
        title="Yolcu Self-Service Portalı"
        subtitle="IRROPS anında yolcu alternatif uçuşunu seçer, yeni boarding pass ve voucherlarını anında alır. Operatör müdahalesi gerekmez."
      />

      {error && <ErrorBanner message={error} onRetry={status ? undefined : lookup} />}
      {rebookSuccess && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <span className="material-symbols-outlined text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <p className="text-sm text-emerald-300 font-bold">{rebookSuccess}</p>
        </div>
      )}

      {/* PNR Lookup */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-5">
          <span className="material-symbols-outlined text-primary-container">search</span>
          <h2 className="text-sm font-bold font-display">PNR ile Sorgula</h2>
        </div>
        <div className="flex gap-3 max-w-md">
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-primary-container/60 transition-colors uppercase placeholder:normal-case placeholder:font-normal placeholder:text-white/20"
            placeholder="PNR giriniz (örn: ABC123)"
            value={pnr}
            onChange={e => setPnr(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            maxLength={6}
          />
          <button
            onClick={lookup}
            disabled={isLoading || !pnr.trim()}
            className="px-6 py-3 bg-primary-container hover:bg-accent-red-hover text-on-primary font-bold text-sm rounded-xl transition-all disabled:opacity-60 flex items-center gap-2 shrink-0"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <span className="material-symbols-outlined text-base">search</span>}
            Sorgula
          </button>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className="flex flex-col gap-6">
          {/* Passenger Info & Crisis Banner */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#002349] border border-white/10 flex items-center justify-center text-lg font-display font-bold text-primary-fixed">
                  {status.passenger_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-surface-bright">{status.passenger_name}</h2>
                  <p className="text-xs text-white/40 mt-0.5">PNR: <span className="font-mono font-bold text-primary-fixed">{status.pnr}</span></p>
                  <p className="text-xs text-white/40">Orijinal uçuş: <span className="font-mono font-bold text-[#adc8f6]">{status.original_flight}</span></p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {status.compensation_eur > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <span className="material-symbols-outlined text-emerald-400 text-sm">payments</span>
                    <span className="text-sm font-display font-bold text-emerald-400">€{status.compensation_eur.toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-400/60">EU261 tazminat</span>
                  </div>
                )}
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                  status.decision_status === 'EXECUTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  status.decision_status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  'bg-white/5 text-white/40 border-white/10'
                }`}>
                  {status.decision_status}
                </span>
              </div>
            </div>

            {/* Message */}
            <div className={`mt-4 flex items-start gap-3 px-4 py-3 rounded-xl border ${
              status.crisis_active
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}>
              <span className={`material-symbols-outlined text-base mt-0.5 ${status.crisis_active ? 'text-rose-400' : 'text-emerald-400'}`}
                style={{ fontVariationSettings: "'FILL' 1" }}>
                {status.crisis_active ? 'crisis_alert' : 'check_circle'}
              </span>
              <div>
                {status.crisis_type && (
                  <p className={`text-[10px] font-bold uppercase mb-0.5 ${status.crisis_active ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {status.crisis_type}
                  </p>
                )}
                <p className={`text-sm ${status.crisis_active ? 'text-rose-200' : 'text-emerald-200'}`}>{status.message}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alternative Flights */}
            {status.alternatives.length > 0 && (
              <div className="glass-card rounded-2xl flex flex-col">
                <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
                  <span className="material-symbols-outlined text-primary-container">flight_takeoff</span>
                  <h3 className="text-sm font-bold font-display">Alternatif Uçuşlar</h3>
                </div>
                <div className="flex flex-col divide-y divide-white/5">
                  {status.alternatives.map(alt => (
                    <div key={alt.flight_id} className={`flex items-center gap-4 px-5 py-4 ${alt.is_recommended ? 'bg-primary-container/5' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display font-bold text-surface-bright">{alt.flight_number}</span>
                          {alt.is_recommended && (
                            <span className="text-[9px] bg-primary-container/20 text-primary-fixed border border-primary-container/30 px-1.5 py-0.5 rounded font-bold">ÖNERİLEN</span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/40">{alt.origin} → {alt.destination}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {new Date(alt.scheduled_departure).toLocaleString('tr-TR')}
                          <span className="ml-2">{alt.available_seats} koltuk</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {alt.fare_difference_eur !== 0 && (
                          <span className={`text-xs font-mono font-bold ${alt.fare_difference_eur > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {alt.fare_difference_eur > 0 ? '+' : ''}€{alt.fare_difference_eur.toFixed(0)}
                          </span>
                        )}
                        <button
                          onClick={() => handleRebook(alt)}
                          disabled={bookingFlight === alt.flight_id}
                          className="px-4 py-1.5 bg-primary-container hover:bg-accent-red-hover text-on-primary text-[10px] font-bold rounded-full transition-all disabled:opacity-60 flex items-center gap-1.5"
                        >
                          {bookingFlight === alt.flight_id
                            ? <Loader2 size={10} className="animate-spin" />
                            : <span className="material-symbols-outlined text-xs">flight_takeoff</span>}
                          Seç
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vouchers */}
            {status.vouchers.length > 0 && (
              <div className="glass-card rounded-2xl flex flex-col">
                <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
                  <span className="material-symbols-outlined text-primary-container">confirmation_number</span>
                  <h3 className="text-sm font-bold font-display">Voucherlarınız</h3>
                </div>
                <div className="flex flex-col gap-3 p-5">
                  {status.vouchers.map(v => (
                    <div key={v.code} className={`flex items-start gap-3 p-4 rounded-xl border ${VOUCHER_COLOR[v.type] ?? 'text-white/50 bg-white/5 border-white/10'}`}>
                      <span className="material-symbols-outlined text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {VOUCHER_ICON[v.type] ?? 'receipt'}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold">{v.type}</p>
                          <span className="text-lg font-display font-bold">€{v.value_eur}</span>
                        </div>
                        <p className="text-[10px] opacity-70 mt-0.5">{v.details}</p>
                        <div className="flex items-center justify-between mt-2">
                          <code className="text-[11px] font-mono bg-black/20 px-2 py-0.5 rounded">{v.code}</code>
                          <p className="text-[9px] opacity-50">Son: {new Date(v.valid_until).toLocaleString('tr-TR')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Boarding Pass */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-5">
              <span className="material-symbols-outlined text-primary-container">boarding_pass</span>
              <h3 className="text-sm font-bold font-display">Boarding Pass</h3>
            </div>

            {!boardingPass ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <span className="material-symbols-outlined text-4xl text-white/10">boarding_pass</span>
                <p className="text-xs text-white/30">Boarding pass'inizi anında oluşturun</p>
                <button
                  onClick={handleBoardingPass}
                  disabled={loadingBP}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600/80 hover:bg-indigo-500 text-white font-bold text-sm rounded-full transition-all border border-indigo-500/40 disabled:opacity-60"
                >
                  {loadingBP ? <Loader2 size={14} className="animate-spin" /> : <span className="material-symbols-outlined text-base">qr_code_2</span>}
                  Boarding Pass Oluştur
                </button>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {/* BP Header */}
                <div className="bg-[#001229] px-6 py-4 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>flight_takeoff</span>
                    <div>
                      <p className="font-display font-bold text-surface-bright text-lg">{boardingPass.flight_number}</p>
                      <p className="text-xs text-white/40">JetNexus AI — Boarding Pass</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-primary-fixed text-xl">{boardingPass.pnr}</p>
                    <p className="text-xs text-white/40">PNR</p>
                  </div>
                </div>
                {/* BP Body */}
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Yolcu', value: boardingPass.passenger_name },
                    { label: 'Güzergah', value: `${boardingPass.origin} → ${boardingPass.destination}` },
                    { label: 'Koltuk', value: boardingPass.seat },
                    { label: 'Kapı', value: boardingPass.gate },
                    { label: 'Biniş', value: new Date(boardingPass.boarding_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) },
                    { label: 'Kalkış', value: new Date(boardingPass.departure_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mb-1">{f.label}</p>
                      <p className="text-sm font-display font-bold text-surface-bright">{f.value}</p>
                    </div>
                  ))}
                </div>
                {/* QR placeholder */}
                <div className="flex items-center gap-4 px-6 py-4 border-t border-white/10">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0">
                    <div className="grid grid-cols-4 gap-0.5">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-sm ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-surface-bright">Dijital Boarding Pass</p>
                    <p className="text-[10px] text-white/30 mt-0.5 font-mono">{boardingPass.qr_data}</p>
                    <p className="text-[10px] text-white/20 mt-1">Kapı okuyucusuna gösterin veya indirin</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!status && !isLoading && !error && (
        <div className="glass-card rounded-2xl p-20 flex flex-col items-center gap-4 text-center">
          <span className="material-symbols-outlined text-5xl text-white/10">person_search</span>
          <p className="text-base font-bold text-surface-bright/30">PNR ile sorgulayın</p>
          <p className="text-xs text-white/20 max-w-sm">
            Yolcu PNR numarasını girerek uçuş durumunu, alternatifleri, voucherları ve boarding pass'i görüntüleyin.
          </p>
        </div>
      )}
    </div>
  );
}
