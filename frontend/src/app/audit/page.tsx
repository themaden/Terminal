'use client';

import React, { useState } from 'react';
import { Cpu, Terminal, ShieldCheck } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState([
    { id: 1, time: "2026-05-27 17:14:23", agent: "CoordinatorAgent", action: "CRISIS_ORCHESTRATED", detail: "TK1981 nolu uçuşun iptali nedeniyle 25 yolcu için MILP çözücüsü optimal kararları verdi.", level: "INFO" },
    { id: 2, time: "2026-05-27 17:14:24", agent: "RebookingAgent", action: "REBOOK_VALIDATED", detail: "25 yolcu için TK1983/TK1985 seferlerine koltuk tahsisleri ve alternatif bağlantı süreleri doğrulandı.", level: "INFO" },
    { id: 3, time: "2026-05-27 17:14:24", agent: "CompensationAgent", action: "EU261_CALCULATED", detail: "EU261/2004 regülasyonuna göre yolcu başı 400 EUR olmak üzere toplam 10,000 EUR tazminat hesaplandı.", level: "INFO" },
    { id: 4, time: "2026-05-27 17:14:25", agent: "ComplianceAgent", action: "AUDIT_SIGNED", detail: "Tüm kararlar uluslararası sivil havacılık regülasyonlarına (EU261) %100 uyumlu bulundu.", level: "SUCCESS" },
    { id: 5, time: "2026-05-27 17:14:35", agent: "OpsManager", action: "CRISIS_APPROVED", detail: "Operasyon Direktörü Hakan Yılmaz tarafından 25 yolcunun otonom kurtarma kararı topluca onaylandı.", level: "SUCCESS" }
  ]);

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="border-b border-flow-silver pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-display-lg font-display text-on-surface">Audit Log (Denetim Günlüğü)</h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant">Yapay zeka ajanlarının kararlarını ve sistem işlemlerini saniye hassasiyetinde takip edin.</p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container text-secondary text-label-sm font-bold rounded-full border border-flow-silver/60">
          <ShieldCheck size={16} className="text-emerald" /> Regülasyon Korumalı (5 Yıl Arşiv)
        </div>
      </div>

      {/* Terminal logs list */}
      <div className="glass-card rounded-2xl p-6 bg-surface-dark border border-surface-variant/30 flex flex-col gap-4 font-mono">
        <div className="flex items-center gap-2 border-b border-flow-silver/10 pb-3 text-surface-bright">
          <Terminal size={18} className="text-primary" />
          <span className="text-label-sm font-bold tracking-wider">AeroSys Telemetry & Agent System Log Console</span>
        </div>

        <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
          {logs.map((log) => (
            <div key={log.id} className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-dark/40 border border-flow-silver/10 hover:border-primary/20 transition-all">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-label-sm text-flow-silver/60">{log.time}</span>
                  <span className="px-2 py-0.5 bg-surface-container text-secondary text-xs rounded border border-flow-silver/20 font-bold">
                    {log.agent}
                  </span>
                  <strong className="text-surface-bright text-xs tracking-wider">{log.action}</strong>
                </div>
                <span className={`badge ${
                  log.level === 'SUCCESS' ? 'badge-emerald' : 'badge-cyan'
                } text-[10px]`}>
                  {log.level}
                </span>
              </div>
              <p className="text-sm text-flow-silver font-sans leading-relaxed">{log.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
