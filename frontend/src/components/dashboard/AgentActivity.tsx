import React from 'react';
import { Cpu } from 'lucide-react';

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
        <Cpu size={16} color="#c8102e" className="animate-pulse" />
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
    cyan: { boxShadow: '0 0 15px rgba(6, 182, 212, 0.12)', borderTop: '3px solid #06b6d4' },
    rose: { boxShadow: '0 0 15px rgba(244, 63, 94, 0.12)', borderTop: '3px solid #f43f5e' },
    emerald: { boxShadow: '0 0 15px rgba(16, 185, 129, 0.12)', borderTop: '3px solid #10b981' },
    violet: { boxShadow: '0 0 15px rgba(139, 92, 246, 0.12)', borderTop: '3px solid #8b5cf6' }
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
    gap: '1.25rem',
    width: '100%',
    color: '#ffffff',
    userSelect: 'none' as const
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '0.6rem'
  },
  title: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#adc8f6',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
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
    background: 'rgba(0, 35, 73, 0.55)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '1.25rem',
    borderRadius: '10px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  agentName: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Inter, sans-serif'
  },
  agentRole: {
    fontSize: '0.7rem',
    color: '#adc8f6',
    fontWeight: '500',
    marginTop: '0.15rem',
    display: 'block'
  },
  activityText: {
    fontSize: '0.75rem',
    color: '#e2e8f0',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    lineHeight: '1.4'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '0.5rem'
  },
  confidenceLabel: {
    color: '#adc8f6',
    fontWeight: '500'
  },
  confidenceValue: {
    fontWeight: '700',
    color: '#34d399',
    fontFamily: 'Inter, sans-serif'
  }
};
