'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Terminal, ShieldCheck, Loader2 } from 'lucide-react';
import { auditApi, type AuditLog } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';

const LEVEL_BADGE: Record<string, string> = {
  SUCCESS: 'badge badge-emerald',
  INFO: 'badge badge-cyan',
  WARNING: 'badge badge-amber',
  ERROR: 'badge badge-rose',
};

const AGENT_ICON: Record<string, string> = {
  CoordinatorAgent: 'hub',
  RebookingAgent: 'flight_takeoff',
  CompensationAgent: 'payments',
  ComplianceAgent: 'shield',
  CommunicationAgent: 'quickreply',
  IOCC_OPERATOR: 'manage_accounts',
  OpsManager: 'supervisor_account',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await auditApi.recent(50);
      setLogs(data);
      setApiError(null);
    } catch {
      // fallback: try generic audit endpoint
      try {
        const data = await auditApi.listAll(0, 50);
        setLogs(data);
        setApiError(null);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'API bağlantısı kurulamadı');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatConfidence = (c: number) => c > 0 ? `%${Math.round(c * 100)}` : '—';

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <PageHeader
        icon="shield_with_heart"
        title="Audit Log — Denetim Günlüğü"
        subtitle="AI ajanlarının kararlarını ve sistem işlemlerini saniye hassasiyetinde takip edin."
        onRefresh={fetchData}
        isRefreshing={isLoading}
        actions={
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#002349] text-primary-fixed text-xs font-bold rounded-full border border-white/10">
            <ShieldCheck size={14} className="text-emerald-400" />
            Regülasyon Korumalı (5 Yıl Arşiv)
          </div>
        }
      />

      {apiError && <ErrorBanner message={apiError} onRetry={fetchData} />}

      <div className="glass-card rounded-2xl p-6 bg-surface-dark/95 border border-white/5 flex flex-col gap-4 shadow-2xl font-mono">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Terminal size={15} className="text-primary-container animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/50">AeroSys Telemetry & Agent System Log Console</span>
          <span className="ml-auto px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-surface-bright/40">{logs.length} kayıt</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 gap-3">
            <Loader2 size={24} className="text-primary-fixed animate-spin" />
            <span className="text-xs text-surface-bright/60 font-sans">Denetim kayıtları yükleniyor...</span>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon="history" title="Denetim kaydı bulunamadı" subtitle="Henüz işlem gerçekleşmedi." variant="neutral" />
        ) : (
          <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2">
            {logs.map((log, i) => (
              <div key={log.id ?? i} className="flex flex-col gap-2 p-3.5 rounded-lg bg-black/25 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-6 h-6 rounded-full bg-[#002349] border border-white/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary-container text-xs">
                        {AGENT_ICON[log.agent] ?? 'smart_toy'}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/40">{new Date(log.timestamp).toLocaleString('tr-TR')}</span>
                    <span className="px-2 py-0.5 bg-[#002349] text-primary-fixed text-[9px] rounded border border-white/5 font-bold">{log.agent}</span>
                    <strong className="text-surface-bright text-xs tracking-wider font-sans font-semibold">{log.action}</strong>
                    {log.crisis_id && (
                      <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono text-white/40">
                        Kriz #{log.crisis_id}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {log.confidence > 0 && (
                      <span className="text-[9px] text-emerald-400 font-bold">{formatConfidence(log.confidence)}</span>
                    )}
                    <span className={LEVEL_BADGE['INFO']}>LOG</span>
                  </div>
                </div>
                <p className="text-xs text-surface-bright/70 font-sans leading-relaxed pl-1">{log.details}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
