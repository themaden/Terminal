import React from 'react';
import { DollarSign, Landmark, HelpCircle } from 'lucide-react';

export default function CostBreakdown() {
  const breakdown = [
    { name: "Yeniden Rezervasyon Farkı", cost: 1250, percent: 12.5, color: "#06b6d4" },
    { name: "EU261 Tazminat Yükü", cost: 6000, percent: 60.0, color: "#f43f5e" },
    { name: "Radisson Blu / Otel Giderleri", cost: 2000, percent: 20.0, color: "#f59e0b" },
    { name: "Sıcak Yemek / Kumanya", cost: 750, percent: 7.5, color: "#10b981" }
  ];

  return (
    <div className="glass-card" style={styles.container}>
      <div style={styles.header}>
        <DollarSign size={18} color="#10b981" />
        <h3 style={styles.title}>Kriz Maliyet Analizi & Dağılımı</h3>
      </div>

      <div style={styles.content}>
        {/* Cost stats */}
        <div style={styles.totalBlock}>
          <div>
            <span style={styles.totalLabel}>Tahmini Toplam Maliyet</span>
            <div style={styles.totalCost}>10,000 EUR</div>
          </div>
          <div style={styles.savingBox}>
            <span style={styles.savingLabel}>MILP Optimizasyon Tasarrufu</span>
            <div style={styles.savingVal}>+3,450 EUR</div>
          </div>
        </div>

        {/* Progress chart representation */}
        <div style={styles.progressContainer}>
          {breakdown.map((item) => (
            <div 
              key={item.name} 
              style={{
                ...styles.progressBar,
                width: `${item.percent}%`,
                backgroundColor: item.color
              }}
              title={`${item.name}: ${item.cost} EUR`}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={styles.legend}>
          {breakdown.map((item) => (
            <div key={item.name} style={styles.legendItem}>
              <span style={{ ...styles.colorDot, backgroundColor: item.color }} />
              <div style={styles.legendText}>
                <span style={styles.legendName}>{item.name}</span>
                <strong style={styles.legendVal}>{item.cost} EUR ({item.percent}%)</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#111827',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    paddingBottom: '0.75rem'
  },
  title: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#f1f5f9'
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem'
  },
  totalBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.02)'
  },
  totalLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    fontWeight: '500'
  },
  totalCost: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#f43f5e',
    fontFamily: 'JetBrains Mono, monospace'
  },
  savingBox: {
    textAlign: 'right' as const
  },
  savingLabel: {
    fontSize: '0.7rem',
    color: '#10b981',
    textTransform: 'uppercase' as const,
    fontWeight: '600'
  },
  savingVal: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#10b981',
    fontFamily: 'JetBrains Mono, monospace'
  },
  progressContainer: {
    display: 'flex',
    height: '14px',
    borderRadius: '7px',
    overflow: 'hidden',
    backgroundColor: '#1f2937',
    border: '1px solid rgba(255, 255, 255, 0.02)'
  },
  progressBar: {
    height: '100%'
  },
  legend: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  colorDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0
  },
  legendText: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.1rem'
  },
  legendName: {
    fontSize: '0.75rem',
    color: '#94a3b8'
  },
  legendVal: {
    fontSize: '0.8rem',
    color: '#f1f5f9',
    fontFamily: 'JetBrains Mono, monospace'
  }
};
