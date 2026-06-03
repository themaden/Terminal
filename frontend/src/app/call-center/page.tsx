'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { callCenterApi, type CallContext, type Ticket, type CallCenterStats } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import ErrorBanner from '@/components/ui/ErrorBanner';

const PRIORITY_BADGE: Record<string,string> = {
  HIGH:   'badge badge-rose',
  MEDIUM: 'badge badge-amber',
  LOW:    'badge badge-emerald',
};

const STATUS_BADGE: Record<string,string> = {
  OPEN:        'badge badge-rose',
  IN_PROGRESS: 'badge badge-amber',
  RESOLVED:    'badge badge-emerald',
  CLOSED:      'bg-slate-500/20 text-slate-400 border border-slate-500/40 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase',
};

const LOYALTY_COLOR: Record<string,string> = {
  PLATINUM:'text-cyan-300', GOLD:'text-amber-300', SILVER:'text-slate-300', NONE:'text-white/30',
};

export default function CallCenterPage() {
  const [pnr, setPnr] = useState('');
  const [ctx, setCtx] = useState<CallContext | null>(null);
  const [isLooking, setIsLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<CallCenterStats | null>(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketNotes, setTicketNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeScript, setActiveScript] = useState<keyof CallContext['agent_script'] | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([callCenterApi.tickets(), callCenterApi.stats()]);
      setTickets(t); setStats(s);
    } catch {}
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleLookup = async () => {
    if (!pnr.trim()) return;
    setIsLooking(true); setLookupError(null); setCtx(null);
    try { setCtx(await callCenterApi.lookup(pnr.trim())); }
    catch (err) { setLookupError(err instanceof Error ? err.message : 'PNR bulunamadı'); }
    finally { setIsLooking(false); }
  };

  const handleCreateTicket = async () => {
    if (!ctx || !ticketSubject.trim()) return;
    setIsCreating(true);
    try {
      await callCenterApi.createTicket(ctx.pnr, ticketSubject, ticketNotes);
      setTicketSubject(''); setTicketNotes('');
      fetchTickets();
    } catch (err) { setError(err instanceof Error ? err.message : 'Vaka oluşturulamadı'); }
    finally { setIsCreating(false); }
  };

  const handleUpdateTicket = async (id: number, status: string) => {
    await callCenterApi.updateTicket(id, status);
    fetchTickets();
  };

  const SCRIPT_KEYS: {key: keyof CallContext['agent_script']; label: string}[] = [
    { key: 'greeting', label: 'Karşılama' },
    { key: 'empathy', label: 'Empati' },
    { key: 'offer', label: 'Teklif' },
    { key: 'next', label: 'Sonraki Adım' },
    { key: 'closing', label: 'Kapanış' },
  ];

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader icon="support_agent" title="Çağrı Merkezi CRM" subtitle="THY Paydaşı: CTI entegrasyonu — gelen arama ile PNR otomatik yüklenir, AI ajan scripti üretilir, vaka kaydedilir." />

      {error && <ErrorBanner message={error} />}

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard icon="phone" label="Bugünkü Çağrı" value={stats.calls_today} />
          <KpiCard icon="assignment" label="Açık Vaka" value={stats.open} valueClass="text-rose-400" />
          <KpiCard icon="pending" label="İşlemde" value={stats.in_progress} valueClass="text-amber-400" />
          <KpiCard icon="star" label="Memnuniyet" value={`${stats.satisfaction_score}/5`} valueClass="text-emerald-400" />
          <KpiCard icon="speed" label="FCR Oranı" value={`%${stats.first_call_resolution_pct}`} valueClass="text-primary-fixed" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* PNR Lookup + Context */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Search */}
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="material-symbols-outlined text-primary-container">phone_in_talk</span>
              <h2 className="text-sm font-bold font-display">Gelen Arama — PNR Sorgula</h2>
              <span className="ml-auto text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">CTI Entegrasyonu</span>
            </div>
            <div className="flex gap-3">
              <input className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-primary-container/60 uppercase placeholder:font-normal placeholder:text-white/20" placeholder="PNR giriniz (örn: PNR100)" value={pnr} onChange={e => setPnr(e.target.value.toUpperCase())} onKeyDown={e => e.key==='Enter' && handleLookup()} maxLength={6} />
              <button onClick={handleLookup} disabled={isLooking||!pnr.trim()} className="px-6 bg-primary-container hover:bg-accent-red-hover text-on-primary font-bold text-sm rounded-xl transition-all disabled:opacity-60 flex items-center gap-2 shrink-0">
                {isLooking ? <Loader2 size={14} className="animate-spin"/> : <span className="material-symbols-outlined text-base">search</span>}
                Sorgula
              </button>
            </div>
            {lookupError && <p className="text-xs text-rose-400">{lookupError}</p>}
          </div>

          {/* Passenger Context */}
          {ctx && (
            <>
              <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#002349] border border-white/10 flex items-center justify-center text-base font-display font-bold text-primary-fixed">
                      {ctx.passenger_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <h3 className="text-base font-display font-bold text-surface-bright">{ctx.passenger_name}</h3>
                      <p className="text-xs text-white/40">PNR: <span className="font-mono font-bold text-primary-fixed">{ctx.pnr}</span> · <span className={LOYALTY_COLOR[ctx.loyalty_tier]}>{ctx.loyalty_tier}</span> · {ctx.ticket_class}</p>
                      {ctx.special_needs && <p className="text-[10px] text-amber-400 mt-0.5">⚠ {ctx.special_needs}</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-white/40">{ctx.flight_number}</p>
                    <p className="font-mono text-sm text-[#adc8f6] font-bold">{ctx.origin} → {ctx.destination}</p>
                    {ctx.crisis_active && <span className="badge badge-rose mt-1">{ctx.crisis_type}</span>}
                  </div>
                </div>
                {ctx.compensation_eur > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <span className="material-symbols-outlined text-emerald-400 text-sm">payments</span>
                    <span className="text-sm font-bold text-emerald-400">€{ctx.compensation_eur.toLocaleString()} EU261 tazminat hakkı</span>
                  </div>
                )}
              </div>

              {/* Agent Script */}
              <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <span className="material-symbols-outlined text-primary-container text-base">smart_toy</span>
                  <h3 className="text-xs font-bold font-display">AI Ajan Scripti</h3>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {SCRIPT_KEYS.map(s => (
                    <button key={s.key} onClick={() => setActiveScript(activeScript===s.key ? null : s.key)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${activeScript===s.key ? 'bg-primary-container/20 text-primary-fixed border-primary-container/40' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {activeScript && (
                  <div className="bg-[#002349]/60 border border-white/10 rounded-xl p-4">
                    <p className="text-[10px] text-primary-fixed font-bold uppercase mb-2">{SCRIPT_KEYS.find(s=>s.key===activeScript)?.label}</p>
                    <p className="text-sm text-surface-bright/80 leading-relaxed">{ctx.agent_script[activeScript] as string}</p>
                    <button onClick={() => navigator.clipboard?.writeText(ctx.agent_script[activeScript] as string)} className="mt-2 text-[10px] text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
                      <span className="material-symbols-outlined text-xs">content_copy</span> Kopyala
                    </button>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-white/30 font-bold uppercase mb-2">Hızlı Aksiyonlar</p>
                  <div className="flex flex-wrap gap-2">
                    {ctx.agent_script.quick_actions.map(a => (
                      <span key={a} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/60 font-bold">{a}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Create Ticket */}
              <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <span className="material-symbols-outlined text-primary-container text-base">add_task</span>
                  <h3 className="text-xs font-bold font-display">Vaka Kaydı Oluştur</h3>
                </div>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary-container/60" placeholder="Konu (örn: EU261 iade talebi)" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} />
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary-container/60 resize-none h-16" placeholder="Notlar..." value={ticketNotes} onChange={e => setTicketNotes(e.target.value)} />
                <button onClick={handleCreateTicket} disabled={isCreating||!ticketSubject.trim()} className="flex items-center gap-2 px-4 py-2 bg-primary-container hover:bg-accent-red-hover text-on-primary font-bold text-xs rounded-xl transition-all disabled:opacity-60 self-start">
                  {isCreating ? <Loader2 size={12} className="animate-spin"/> : <span className="material-symbols-outlined text-sm">add</span>}
                  Vaka Oluştur
                </button>
              </div>
            </>
          )}
        </div>

        {/* Tickets */}
        <div className="lg:col-span-5 glass-card rounded-2xl flex flex-col">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
            <span className="material-symbols-outlined text-primary-container">assignment</span>
            <h2 className="text-sm font-bold font-display">Açık Vakalar</h2>
            <span className="ml-auto px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-bold">{tickets.filter(t=>t.status==='OPEN').length} açık</span>
          </div>
          {tickets.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center"><span className="material-symbols-outlined text-3xl text-white/10">assignment_turned_in</span><p className="text-xs text-white/20 mt-2">Açık vaka yok</p></div>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-white/5 overflow-y-auto">
              {tickets.slice(0, 20).map(t => (
                <div key={t.ticket_id} className="px-5 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-white/30">#{t.ticket_id}</span>
                      <span className="font-mono font-bold text-primary-fixed text-[10px]">{t.pnr}</span>
                      <span className={PRIORITY_BADGE[t.priority]??'badge badge-secondary'}>{t.priority}</span>
                    </div>
                    <span className={STATUS_BADGE[t.status]??'badge badge-secondary'}>{t.status}</span>
                  </div>
                  <p className="text-xs font-bold text-surface-bright truncate">{t.subject}</p>
                  {t.notes && <p className="text-[10px] text-white/30 truncate mt-0.5">{t.notes}</p>}
                  <div className="flex gap-2 mt-2">
                    {t.status === 'OPEN' && (
                      <button onClick={() => handleUpdateTicket(t.ticket_id, 'IN_PROGRESS')} className="text-[9px] px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-bold">Başlat</button>
                    )}
                    {t.status === 'IN_PROGRESS' && (
                      <button onClick={() => handleUpdateTicket(t.ticket_id, 'RESOLVED')} className="text-[9px] px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold">Çöz</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
