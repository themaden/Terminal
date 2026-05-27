'use client';

import React, { useState } from 'react';
import { Terminal, ShieldCheck } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState([
    { id: 1, time: "2026-05-27 17:14:23", agent: "CoordinatorAgent", action: "CRISIS_ORCHESTRATED", detail: "TK1981 nolu uçuşun iptali nedeniyle 25 yolcu için MILP çözücüsü optimal kararları verdi.", level: "INFO" },
    { id: 2, time: "2026-05-27 17:14:24", agent: "RebookingAgent", action: "REBOOK_VALIDATED", detail: "25 yolcu için TK1983/TK1985 seferlerine koltuk tahsisleri ve alternatif bağlantı süreleri doğrulandı.", level: "INFO" },
    { id: 3, time: "2026-05-27 17:14:24", agent: "CompensationAgent", action: "EU261_CALCULATED", detail: "EU261/2004 regülasyonuna göre yolcu başı 400 EUR olmak üzere toplam 10,000 EUR tazminat hesaplandı.", level: "INFO" },
    { id: 4, time: "2026-05-27 17:14:25", agent: "ComplianceAgent", action: "AUDIT_SIGNED", detail: "Tüm kararlar uluslararası sivil havacılık regülasyonlarına (EU261) %100 uyumlu bulundu.", level: "SUCCESS" },
    { id: 5, time: "2026-05-27 17:14:35", agent: "OpsManager", action: "CRISIS_APPROVED", detail: "Operasyon Direktörü Yasin Maden tarafından 25 yolcunun otonom kurtarma kararı topluca onaylandı.", level: "SUCCESS" }
  ]);

  return (
    <div className="flex flex-col gap-8 w-full select-none text-white">
      <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-bright flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">shield_with_heart</span>
            Audit Log (Denetim Günlüğü)
          </h1>
          <p className="text-xs text-surface-bright/60 mt-1">Yapay zeka ajanlarının kararlarını ve sistem işlemlerini saniye hassasiyetinde takip edin.</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-1.5 bg-[#002349] text-primary-fixed text-xs font-bold rounded-full border border-white/10 shrink-0 self-start md:self-auto shadow-md">
          <ShieldCheck size={15} className="text-emerald-400" /> Regülasyon Korumalı (5 Yıl Arşiv)
        </div>
      </div>

      {/* Terminal logs list */}
      <div className="glass-card rounded-2xl p-6 bg-surface-dark/95 border border-white/5 flex flex-col gap-4 font-mono shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3 text-surface-bright select-none">
          <Terminal size={16} className="text-primary-container animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/50">AeroSys Telemetry & Agent System Log Console</span>
        </div>

        <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {logs.map((log) => (
            <div key={log.id} className="flex flex-col gap-2 p-3.5 rounded-lg bg-black/25 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] text-white/40">{log.time}</span>
                  <span className="px-2 py-0.5 bg-[#002349] text-primary-fixed text-[9px] rounded border border-white/5 font-bold">
                    {log.agent}
                  </span>
                  <strong className="text-surface-bright text-xs tracking-wider font-display font-semibold">{log.action}</strong>
                </div>
                <span className={`badge ${
                  log.level === 'SUCCESS' ? 'badge-emerald' : 'badge-cyan'
                }`}>
                  {log.level}
                </span>
              </div>
              <p className="text-xs text-surface-bright/70 font-sans leading-relaxed pl-1">{log.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
