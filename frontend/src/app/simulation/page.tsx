'use client';

import React, { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { simulationApi, type SimulationResponse, type ScenarioResult } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import ErrorBanner from '@/components/ui/ErrorBanner';

const DISRUPTION_OPTIONS = [
  { value: 'CANCELLATION', label: 'İptal (Cancellation)' },
  { value: 'DELAY', label: 'Gecikme (Delay)' },
  { value: 'DIVERSION', label: 'Yön Değişikliği (Diversion)' },
];

const ITER_OPTIONS = [
  { value: 500, label: '500 iterasyon (Hızlı)' },
  { value: 1000, label: '1.000 iterasyon (Standart)' },
  { value: 5000, label: '5.000 iterasyon (Detaylı)' },
];

const SCORE_COLOR = (s: number) =>
  s >= 70 ? 'text-emerald-400' : s >= 45 ? 'text-amber-400' : 'text-rose-400';

const SCORE_BAR = (s: number) =>
  s >= 70 ? 'bg-emerald-500' : s >= 45 ? 'bg-amber-500' : 'bg-rose-500';

export default function SimulationPage() {
  const [flightNumber, setFlightNumber] = useState('TK1981');
  const [disruption, setDisruption] = useState('CANCELLATION');
  const [delayMin, setDelayMin] = useState(180);
  const [iterations, setIterations] = useState(1000);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioResult | null>(null);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    setSelectedScenario(null);
    try {
      const data = await simulationApi.run({
        flight_number: flightNumber.toUpperCase(),
        disruption_type: disruption,
        delay_minutes: delayMin,
        n_iterations: iterations,
      });
      setResult(data);
      setSelectedScenario(data.best_plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simülasyon başarısız');
    } finally {
      setIsRunning(false);
    }
  }, [flightNumber, disruption, delayMin, iterations]);

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader
        icon="science"
        title="Monte Carlo Simülasyon Motoru"
        subtitle="Operatör 'şu uçuşu iptal edersem ne olur?' sorusunu production'ı etkilemeden sandbox ortamında test eder."
      />

      {error && <ErrorBanner message={error} onRetry={handleRun} />}

      {/* Config Panel */}
      <div className="glass-card rounded-2xl p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <span className="material-symbols-outlined text-primary-container">tune</span>
          <h2 className="text-sm font-bold text-surface-bright font-display">Senaryo Parametreleri</h2>
          <span className="ml-auto text-[10px] text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">SANDBOX — Production etkilenmez</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] text-surface-bright/50 font-bold uppercase tracking-wider">Uçuş Numarası</label>
            <input
              className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-primary-container/60 transition-colors"
              value={flightNumber}
              onChange={e => setFlightNumber(e.target.value)}
              placeholder="TK1981"
            />
          </div>
          <div>
            <label className="text-[10px] text-surface-bright/50 font-bold uppercase tracking-wider">Kriz Tipi</label>
            <select
              className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-container/60 transition-colors"
              value={disruption}
              onChange={e => setDisruption(e.target.value)}
            >
              {DISRUPTION_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-surface-bright/50 font-bold uppercase tracking-wider">Gecikme (dakika)</label>
            <input
              type="number"
              className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-primary-container/60 transition-colors"
              value={delayMin}
              onChange={e => setDelayMin(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-[10px] text-surface-bright/50 font-bold uppercase tracking-wider">Monte Carlo İterasyon</label>
            <select
              className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-container/60 transition-colors"
              value={iterations}
              onChange={e => setIterations(parseInt(e.target.value))}
            >
              {ITER_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="self-end flex items-center gap-2 px-8 py-3 bg-primary-container hover:bg-accent-red-hover text-on-primary font-bold text-sm rounded-full transition-all shadow-lg shadow-primary-container/30 disabled:opacity-60"
        >
          {isRunning ? (
            <><Loader2 size={16} className="animate-spin" /> {iterations.toLocaleString()} senaryo çalışıyor...</>
          ) : (
            <><span className="material-symbols-outlined text-base">play_arrow</span> Simülasyonu Başlat</>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Recommendation Banner */}
          <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-400 text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <div>
                <p className="text-xs font-bold text-emerald-400 mb-1">AI Önerisi — {result.n_iterations.toLocaleString()} Monte Carlo Çalışması</p>
                <p className="text-sm text-surface-bright/80 leading-relaxed">{result.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Cost Distribution */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'En İyi Senaryo', value: `€${result.cost_distribution.best_plan_cost.toLocaleString()}`, color: 'text-emerald-400', icon: 'trending_down' },
              { label: 'Ortalama Maliyet', value: `€${result.cost_distribution.mean.toLocaleString()}`, color: 'text-primary-fixed', icon: 'analytics' },
              { label: 'En Kötü Senaryo', value: `€${result.cost_distribution.max.toLocaleString()}`, color: 'text-rose-400', icon: 'trending_up' },
              { label: 'Uçuş', value: result.flight_number, color: 'text-[#adc8f6]', icon: 'flight' },
            ].map(k => (
              <div key={k.label} className="glass-card rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container text-base">{k.icon}</span>
                  <span className="text-[10px] text-surface-bright/50 font-bold uppercase tracking-wider">{k.label}</span>
                </div>
                <span className={`text-xl font-display font-bold ${k.color}`}>{k.value}</span>
              </div>
            ))}
          </div>

          {/* Scenario Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Scenario List */}
            <div className="lg:col-span-5 glass-card rounded-2xl flex flex-col">
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
                <span className="material-symbols-outlined text-primary-container">leaderboard</span>
                <h2 className="text-sm font-bold font-display">Plan Skor Tablosu</h2>
              </div>
              <div className="flex flex-col divide-y divide-white/5">
                {result.scenarios.map((s, i) => (
                  <button
                    key={s.scenario_id}
                    onClick={() => setSelectedScenario(s)}
                    className={`flex items-center gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors ${selectedScenario?.scenario_id === s.scenario_id ? 'bg-white/5 border-l-2 border-primary-container' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs shrink-0 ${i === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-surface-bright truncate">{s.action_label}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">€{s.total_cost_eur.toLocaleString()} · %{s.rebooking_rate_pct} rebook</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-lg font-display font-bold ${SCORE_COLOR(s.score)}`}>{s.score}</span>
                      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${SCORE_BAR(s.score)}`} style={{ width: `${s.score}%` }} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Scenario Detail */}
            {selectedScenario && (
              <div className="lg:col-span-7 glass-card rounded-2xl flex flex-col">
                <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
                  <span className="material-symbols-outlined text-primary-container">info</span>
                  <h2 className="text-sm font-bold font-display">{selectedScenario.action_label}</h2>
                  <span className={`ml-auto text-lg font-display font-bold ${SCORE_COLOR(selectedScenario.score)}`}>
                    {selectedScenario.score}/100
                  </span>
                </div>
                <div className="p-5 flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Toplam Maliyet', value: `€${selectedScenario.total_cost_eur.toLocaleString()}`, color: 'text-primary-fixed' },
                      { label: 'EU261 Yükümlülüğü', value: `€${selectedScenario.eu261_liability_eur.toLocaleString()}`, color: 'text-rose-400' },
                      { label: 'Otel Maliyeti', value: `€${selectedScenario.hotel_cost_eur.toLocaleString()}`, color: 'text-amber-400' },
                      { label: 'Yeniden Rezervasyon', value: `%${selectedScenario.rebooking_rate_pct}`, color: 'text-emerald-400' },
                      { label: 'Etkilenen Yolcu', value: `${selectedScenario.affected_passengers} kişi`, color: 'text-surface-bright' },
                      { label: 'Ort. Gecikme', value: `${selectedScenario.avg_delay_minutes} dk`, color: 'text-surface-bright' },
                    ].map(m => (
                      <div key={m.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-[10px] text-surface-bright/40 font-bold uppercase tracking-wider mb-1">{m.label}</p>
                        <p className={`text-lg font-display font-bold ${m.color}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Cost bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-surface-bright/40 mb-1.5">
                      <span>Maliyet Dağılımı</span>
                      <span>€{result.cost_distribution.min.toLocaleString()} — €{result.cost_distribution.max.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500/60 to-rose-500/60 rounded-full"
                        style={{ width: '100%' }}
                      />
                      <div
                        className="absolute top-0 h-full w-1 bg-white rounded-full"
                        style={{
                          left: `${Math.max(0, Math.min(100, ((selectedScenario.total_cost_eur - result.cost_distribution.min) / Math.max(result.cost_distribution.max - result.cost_distribution.min, 1)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`${selectedScenario.action_label} planı onaylandı (demo). Gerçek sistemde operatör onayı workflow'a gönderilir.`)}
                    className="w-full py-3 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all border border-emerald-500/40"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Bu Planı Onayla ve Uygula
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!result && !isRunning && (
        <div className="glass-card rounded-2xl p-16 flex flex-col items-center gap-4 text-center">
          <span className="material-symbols-outlined text-5xl text-white/10">science</span>
          <p className="text-base font-bold text-surface-bright/30">Simülasyon bekleniyor</p>
          <p className="text-xs text-white/20 max-w-sm">Uçuş numarası ve kriz tipini seçerek Monte Carlo simülasyonunu başlatın. Production verisi etkilenmez.</p>
        </div>
      )}
    </div>
  );
}
