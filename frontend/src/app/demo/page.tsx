'use client';

import React, { useState } from 'react';
import { Loader2, Play, CheckCircle2, Clock } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const STEP_ICONS = ['satellite_alt', 'connecting_airports', 'smart_toy', 'sms', 'confirmation_number'];
const STEP_COLORS = ['#3b82f6', '#f59e0b', '#c8102e', '#10b981', '#8b5cf6'];

const DISRUPTION_OPTS = [
  { value: 'CANCELLATION', label: 'İptal (Cancellation)' },
  { value: 'DELAY',        label: 'Gecikme (Delay)' },
  { value: 'DIVERSION',    label: 'Yön Değişikliği (Diversion)' },
];

interface StepResult {
  step: number; title: string; status: string;
  duration_ms: number; details: Record<string, unknown>; timestamp: string;
}

interface FlowResult {
  flow_id: string; flight_number: string; disruption_type: string;
  trigger_time: string; total_duration_ms: number;
  steps: StepResult[]; summary: Record<string, unknown>;
}

function DetailRow({ label, value, mono = false }: { label: string; value: unknown; mono?: boolean }) {
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return (
    <div className="flex justify-between gap-4 py-1 border-b" style={{ borderColor: 'var(--border)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: mono ? 'monospace' : 'inherit', color: 'var(--text-primary)', textAlign: 'right', wordBreak: 'break-all' }}>
        {str}
      </span>
    </div>
  );
}

function StepCard({ step, index, active }: { step: StepResult; index: number; active: boolean }) {
  const [open, setOpen] = useState(false);
  const color = STEP_COLORS[index] ?? '#fff';
  const icon  = STEP_ICONS[index] ?? 'check';
  const done  = step.status === 'DONE';

  return (
    <div
      className="card"
      style={{ borderColor: active ? color : undefined, transition: 'all .3s' }}
    >
      <button
        onClick={() => done && setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4"
        style={{ cursor: done ? 'pointer' : 'default' }}
      >
        {/* Step number circle */}
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: done ? color : 'rgba(255,255,255,0.06)', transition: 'background .3s' }}>
          {done
            ? <span className="material-symbols-outlined text-white" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-faint)' }}>{step.step}</span>
          }
        </div>

        <div className="flex-1 text-left min-w-0">
          <p style={{ fontSize: 13, fontWeight: 600, color: done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            Adım {step.step} — {step.title}
          </p>
          {done && (
            <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>
              {step.duration_ms}ms · {new Date(step.timestamp).toLocaleTimeString('tr-TR')}
            </p>
          )}
        </div>

        {done && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="badge badge-emerald">TAMAMLANDI</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-faint)', transform: open ? 'rotate(180deg)' : '', transition: 'transform .2s' }}>
              expand_more
            </span>
          </div>
        )}
      </button>

      {open && done && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid var(--border)` }}>
          <div className="mt-3 flex flex-col gap-0.5">
            {Object.entries(step.details).map(([k, v]) => {
              if (typeof v === 'object' && !Array.isArray(v) && v !== null) return null;
              return <DetailRow key={k} label={k} value={v} mono={typeof v === 'number'} />;
            })}
          </div>

          {/* Array fields rendered as sub-cards */}
          {Object.entries(step.details).map(([k, v]) => {
            if (!Array.isArray(v) || v.length === 0) return null;
            return (
              <div key={k} className="mt-3">
                <p className="section-title">{k}</p>
                <div className="flex flex-col gap-1">
                  {(v as Record<string, unknown>[]).slice(0, 3).map((item, i) => (
                    <div key={i} className="rounded-md p-2" style={{ background: 'rgba(255,255,255,0.03)', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                      {JSON.stringify(item)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DemoPage() {
  const [flightNumber, setFlightNumber] = useState('TK1981');
  const [disruption,   setDisruption]   = useState('CANCELLATION');
  const [delayMin,     setDelayMin]     = useState(120);
  const [result,       setResult]       = useState<FlowResult | null>(null);
  const [running,      setRunning]      = useState(false);
  const [activeStep,   setActiveStep]   = useState(0);
  const [error,        setError]        = useState<string | null>(null);

  const run = async () => {
    setRunning(true); setResult(null); setError(null); setActiveStep(0);

    // Adımları sırayla simüle et (UI animasyonu için)
    for (let i = 1; i <= 5; i++) {
      setActiveStep(i);
      await new Promise(r => setTimeout(r, 400));
    }

    try {
      const res = await fetch(
        `${API}/api/v1/demo/full-irrops-flow?flight_number=${flightNumber}&disruption_type=${disruption}&delay_minutes=${delayMin}`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data: FlowResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setRunning(false); setActiveStep(0);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-white select-none">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-rose">THY JÜRİ DEMO</span>
            <span className="badge badge-cyan">5 ADIM</span>
          </div>
          <h1 className="font-display font-bold" style={{ fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Tam IRROPS Pipeline Simülasyonu
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, maxWidth: 600, lineHeight: 1.6 }}>
            Bir uçuş iptal/gecikmesinden yolcunun boarding pass'ine kadar tüm pipeline tek tıkla çalışır.
            Hiçbir operatör müdahalesi gerekmez — sıfır manuel işlem.
          </p>
        </div>
      </div>

      {/* Config */}
      <div className="card p-5">
        <p className="section-title">Senaryo Parametreleri</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Uçuş Numarası</label>
            <input className="input-field mt-1" value={flightNumber} onChange={e => setFlightNumber(e.target.value.toUpperCase())} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kriz Tipi</label>
            <select className="input-field mt-1" value={disruption} onChange={e => setDisruption(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              {DISRUPTION_OPTS.map(o => <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gecikme (dakika)</label>
            <input type="number" className="input-field mt-1" value={delayMin} onChange={e => setDelayMin(parseInt(e.target.value) || 0)} />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={run} disabled={running}>
              {running
                ? <><Loader2 size={14} className="animate-spin" /> İşleniyor...</>
                : <><Play size={14} /> Pipeline Başlat</>}
            </button>
          </div>
        </div>

        {/* Steps legend */}
        <div className="flex flex-wrap gap-2">
          {['Algılama', 'MCT/ACT Analizi', 'Otonom Re-Issue', 'SMS/WA Bildirim', 'Voucher + F8'].map((label, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: STEP_COLORS[i], flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{i + 1}. {label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert-critical flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#f87171' }}>error</span>
          <span style={{ fontSize: 12, color: '#f87171' }}>{error}</span>
        </div>
      )}

      {/* Running animation */}
      {running && (
        <div className="card p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div style={{ width: 20, height: 20, border: '2px solid rgba(200,16,46,0.3)', borderTop: '2px solid #c8102e', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Adım {activeStep} / 5 işleniyor...
            </span>
          </div>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{
                width: 32, height: 4, borderRadius: 2,
                background: i <= activeStep ? STEP_COLORS[i-1] : 'rgba(255,255,255,0.06)',
                transition: 'background .3s',
              }} />
            ))}
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Summary banner */}
          <div className="card p-5" style={{ borderColor: '#10b981', background: 'rgba(16,185,129,0.05)' }}>
            <div className="flex items-start gap-4 flex-wrap">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.2)' }}>
                <CheckCircle2 size={20} color="#10b981" />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 15, fontWeight: 700, color: '#34d399', marginBottom: 4 }}>
                  Tüm Pipeline Tamamlandı — {result.total_duration_ms}ms
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {result.summary.message as string}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Clock size={12} color="#34d399" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>
                  {result.total_duration_ms}ms
                </span>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid rgba(16,185,129,0.15)' }}>
              {[
                { label: 'Etkilenen Yolcu',   value: result.summary.passengers_affected },
                { label: 'Yeniden Yerleştirilen', value: result.summary.passengers_rebooked },
                { label: 'Bildirim Gönderilen',  value: result.summary.notifications_sent },
                { label: 'Voucher Üretilen',  value: result.summary.vouchers_issued },
                { label: 'Operatör Müdahalesi', value: '0 — TAM OTONOM' },
              ].map(k => (
                <div key={k.label} className="text-center">
                  <p style={{ fontSize: 20, fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#34d399' }}>{String(k.value)}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>{k.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step cards */}
          <div className="flex flex-col gap-3">
            {result.steps.map((step, i) => (
              <StepCard key={step.step} step={step} index={i} active={false} />
            ))}
          </div>

          {/* Flow ID */}
          <p style={{ fontSize: 10, color: 'var(--text-faint)', textAlign: 'right', fontFamily: 'monospace' }}>
            Flow ID: {result.flow_id} · Tetiklenme: {new Date(result.trigger_time).toLocaleString('tr-TR')}
          </p>
        </>
      )}

      {/* Empty state */}
      {!result && !running && !error && (
        <div className="card flex flex-col items-center gap-4 py-16">
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-faint)', fontVariationSettings: "'FILL' 0" }}>
            play_circle
          </span>
          <div className="text-center">
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Pipeline hazır</p>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4, maxWidth: 400 }}>
              Yukarıdan uçuş numarası ve kriz tipini seçip "Pipeline Başlat" butonuna bas.
              5 adım sırayla çalışır, sonuçlar gerçek zamanlı görüntülenir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
