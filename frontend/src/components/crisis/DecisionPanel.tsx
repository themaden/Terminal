import React from 'react';
import { ShieldCheck, UserCheck, Check, AlertCircle } from 'lucide-react';

interface DecisionCardProps {
  pnr: string;
  name: string;
  ticketClass: string;
  action: string;
  newFlight: string;
  compensation: number;
  hotel: string;
  confidence: number;
  reasoning: string;
  onApprove: () => void;
}

export default function DecisionPanel({ decisions, onApproveAll }: { decisions: DecisionCardProps[], onApproveAll: () => void }) {
  return (
    <div className="glass-card" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <ShieldCheck size={18} color="#06b6d4" />
          <h3 style={styles.title}>Human-in-the-Loop Karar & Onay Havuzu</h3>
        </div>
        <button className="btn btn-primary" onClick={onApproveAll} style={styles.bulkBtn}>
          <Check size={16} />
          <span>Tüm Kararları Onayla & SMS/WhatsApp Gönder</span>
        </button>
      </div>

      <div style={styles.list}>
        {decisions.map((dec) => (
          <div key={dec.pnr} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <span className="badge badge-cyan" style={styles.pnrBadge}>{dec.pnr}</span>
                <strong style={styles.paxName}>{dec.name}</strong>
                <span style={styles.classText}>({dec.ticketClass})</span>
              </div>
              <div style={styles.confidenceBadge}>
                <span style={styles.confText}>AI Güven: {dec.confidence}%</span>
              </div>
            </div>

            <div style={styles.decisionContent}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Önerilen Karar:</span>
                <span className="badge badge-rose">{dec.action}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Yeni Uçuş:</span>
                <strong style={styles.highlightText}>{dec.newFlight}</strong>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>EU261 Tazminat:</span>
                <strong style={styles.emeraldText}>{dec.compensation} EUR</strong>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Konaklama / Otel:</span>
                <span style={styles.detailVal}>{dec.hotel}</span>
              </div>
            </div>

            <div style={styles.reasoningBox}>
              <AlertCircle size={14} color="#8b5cf6" style={{ marginTop: '2px' }} />
              <p style={styles.reasoningText}><strong>Ajan Gerekçesi:</strong> {dec.reasoning}</p>
            </div>

            <div style={styles.cardActions}>
              <button className="btn btn-secondary" style={styles.actionBtn}>Düzenle</button>
              <button className="btn btn-primary" onClick={dec.onApprove} style={styles.actionBtn}>
                Tekil Onay
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    backgroundColor: '#111827',
    borderRadius: '12px',
    padding: '1.5rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    paddingBottom: '1rem'
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  title: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#f1f5f9'
  },
  bulkBtn: {
    padding: '0.5rem 1rem',
    fontSize: '0.8rem'
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
    maxHeight: '520px',
    overflowY: 'auto' as const,
    paddingRight: '0.5rem'
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(148, 163, 184, 0.08)',
    borderRadius: '10px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    transition: 'all 0.2s ease'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pnrBadge: {
    marginRight: '0.5rem'
  },
  paxName: {
    color: '#f1f5f9',
    fontSize: '0.9rem'
  },
  classText: {
    color: '#64748b',
    fontSize: '0.75rem',
    marginLeft: '0.25rem'
  },
  confidenceBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '4px',
    padding: '0.15rem 0.4rem'
  },
  confText: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#34d399',
    fontFamily: 'JetBrains Mono, monospace'
  },
  decisionContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.02)'
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.15rem'
  },
  detailLabel: {
    fontSize: '0.7rem',
    color: '#64748b',
    textTransform: 'uppercase' as const,
    fontWeight: '500'
  },
  detailVal: {
    fontSize: '0.8rem',
    color: '#cbd5e1'
  },
  highlightText: {
    fontSize: '0.85rem',
    color: '#06b6d4',
    fontFamily: 'JetBrains Mono, monospace'
  },
  emeraldText: {
    fontSize: '0.85rem',
    color: '#10b981',
    fontFamily: 'JetBrains Mono, monospace'
  },
  reasoningBox: {
    display: 'flex',
    gap: '0.4rem',
    backgroundColor: 'rgba(139, 92, 246, 0.03)',
    border: '1px solid rgba(139, 92, 246, 0.1)',
    borderRadius: '6px',
    padding: '0.5rem'
  },
  reasoningText: {
    fontSize: '0.75rem',
    color: '#c084fc',
    lineHeight: '1.4'
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    borderTop: '1px solid rgba(148, 163, 184, 0.06)',
    paddingTop: '0.75rem'
  },
  actionBtn: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.75rem',
    borderRadius: '6px'
  }
};
