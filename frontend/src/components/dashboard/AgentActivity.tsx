import React from 'react';
import { Cpu, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';

interface AgentCardProps {
  name: string;
  role: string;
  status: 'IDLE' | 'THINKING' | 'DECIDING' | 'DONE';
  activity: string;
  confidence: number;
  glowColor: 'cyan' | 'rose' | 'emerald' | 'violet';
}

export default function AgentActivity() {
  const agents: AgentCardProps[] = [
    {
      name: "RebookingAgent",
      role: "Optimizasyon & Koltuk Atama",
      status: "DONE",
      activity: "25 yolcu TK1983/TK1985 seferlerine başarıyla atandı.",
      confidence: 98,
      glowColor: "cyan"
    },
    {
      name: "CompensationAgent",
      role: "EU261 Tazminat Denetleyici",
      status: "DONE",
      activity: "EU261 regülasyon analizi tamamlandı: 400 EUR x 25 yolcu.",
      confidence: 100,
      glowColor: "emerald"
    },
    {
      name: "CommunicationAgent",
      role: "Empatik Yolcu İletişim",
      status: "DONE",
      activity: "Kişiselleştirilmiş WhatsApp & SMS şablonları oluşturuldu (TR/EN).",
      confidence: 96,
      glowColor: "violet"
    },
    {
      name: "ComplianceAgent",
      role: "Regülasyon & Güvenlik Denetçisi",
      status: "DONE",
      activity: "PII verileri AES-256 ile maskelendi, audit log imzalandı.",
      confidence: 99,
      glowColor: "rose"
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Cpu size={18} color="#8b5cf6" />
        <h3 style={styles.title}>Multi-Agent Karar Sistemi Aktivitesi (CrewAI)</h3>
      </div>
      <div style={styles.grid}>
        {agents.map((agent) => (
          <AgentCard key={agent.name} {...agent} />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ name, role, status, activity, confidence, glowColor }: AgentCardProps) {
  const glowStyle = {
    cyan: { boxShadow: '0 0 15px rgba(6, 182, 212, 0.1)', borderTop: '2px solid #06b6d4' },
    rose: { boxShadow: '0 0 15px rgba(244, 63, 94, 0.1)', borderTop: '2px solid #f43f5e' },
    emerald: { boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)', borderTop: '2px solid #10b981' },
    violet: { boxShadow: '0 0 15px rgba(139, 92, 246, 0.1)', borderTop: '2px solid #8b5cf6' }
  }[glowColor];

  const statusBadge = {
    DONE: <span className="badge badge-emerald">Aktif / Tamamlandı</span>,
    THINKING: <span className="badge badge-violet">Düşünüyor...</span>,
    IDLE: <span className="badge badge-cyan">Beklemede</span>,
    DECIDING: <span className="badge badge-amber">Karar Veriyor</span>
  }[status];

  return (
    <div className="glass-card" style={{ ...styles.card, ...glowStyle }}>
      <div style={styles.cardHeader}>
        <div>
          <h4 style={styles.agentName}>{name}</h4>
          <span style={styles.agentRole}>{role}</span>
        </div>
        <div>{statusBadge}</div>
      </div>
      <p style={styles.activityText}>{activity}</p>
      <div style={styles.footer}>
        <span style={styles.confidenceLabel}>Karar Güven Skoru:</span>
        <span style={styles.confidenceValue}>{confidence}%</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    width: '100%'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    paddingBottom: '0.5rem'
  },
  title: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#f1f5f9'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.25rem'
  },
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    backgroundColor: '#111827',
    padding: '1.25rem',
    borderRadius: '10px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  agentName: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#f1f5f9',
    fontFamily: 'JetBrains Mono, monospace'
  },
  agentRole: {
    fontSize: '0.75rem',
    color: '#94a3b8'
  },
  activityText: {
    fontSize: '0.8rem',
    color: '#e2e8f0',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    lineHeight: '1.4'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    borderTop: '1px solid rgba(148, 163, 184, 0.08)',
    paddingTop: '0.5rem'
  },
  confidenceLabel: {
    color: '#64748b'
  },
  confidenceValue: {
    fontWeight: '700',
    color: '#34d399',
    fontFamily: 'JetBrains Mono, monospace'
  }
};
