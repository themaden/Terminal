import React, { useEffect, useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  label: string;
  trend: string;
  trendUp: boolean;
  glowColor: 'cyan' | 'rose' | 'emerald' | 'amber';
}

export default function StatsGrid() {
  const [counts, setCounts] = useState({
    crises: 0,
    pax: 0,
    resolved: 0,
    time: 0
  });

  useEffect(() => {
    // Smooth count-up micro-animation
    const target = { crises: 1, pax: 25, resolved: 142, time: 14 };
    let current = { crises: 0, pax: 0, resolved: 0, time: 0 };
    const duration = 1000; // 1 second
    const stepTime = 30;
    const steps = duration / stepTime;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCounts({
        crises: Math.min(target.crises, Math.ceil((target.crises / steps) * step)),
        pax: Math.min(target.pax, Math.ceil((target.pax / steps) * step)),
        resolved: Math.min(target.resolved, Math.ceil((target.resolved / steps) * step)),
        time: Math.min(target.time, Math.ceil((target.time / steps) * step))
      });
      if (step >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.grid}>
      <StatCard 
        title="Aktif Krizler" 
        value={counts.crises}
        label="TK1981 Londra Uçuş İptali"
        trend="+1 yeni"
        trendUp={true}
        glowColor="rose"
      />
      <StatCard 
        title="Etkilenen Yolcular" 
        value={counts.pax}
        label="Otomatik yeniden rezerve edildi"
        trend="25 PNR"
        trendUp={true}
        glowColor="amber"
      />
      <StatCard 
        title="Çözülen Vakalar" 
        value={counts.resolved}
        label="Son 7 günde başarıyla kurtarılan"
        trend="+94.2%"
        trendUp={true}
        glowColor="emerald"
      />
      <StatCard 
        title="Ort. Karar Süresi" 
        value={`${counts.time} sn`}
        label="Optimizasyon + Multi-Agent hızı"
        trend="-4.2 dk tasarruf"
        trendUp={false}
        glowColor="cyan"
      />
    </div>
  );
}

function StatCard({ title, value, label, trend, trendUp, glowColor }: StatCardProps) {
  const glowStyle = {
    rose: { borderLeft: '4px solid #f43f5e', boxShadow: '0 4px 20px rgba(244, 63, 94, 0.1)' },
    amber: { borderLeft: '4px solid #f59e0b', boxShadow: '0 4px 20px rgba(245, 158, 11, 0.1)' },
    emerald: { borderLeft: '4px solid #10b981', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.1)' },
    cyan: { borderLeft: '4px solid #06b6d4', boxShadow: '0 4px 20px rgba(6, 182, 212, 0.1)' }
  }[glowColor];

  const trendStyle = trendUp ? { color: '#34d399' } : { color: '#22d399' };

  return (
    <div className="glass-card" style={{ ...styles.card, ...glowStyle }}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>{title}</span>
        <span style={{ ...styles.trend, ...trendStyle }}>{trend}</span>
      </div>
      <div style={styles.value}>{value}</div>
      <div style={styles.divider} />
      <div style={styles.cardFooter}>
        <span style={styles.footerText}>{label}</span>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    width: '100%'
  },
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    borderRadius: '12px',
    backgroundColor: '#111827',
    padding: '1.25rem'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cardTitle: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
  },
  trend: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)'
  },
  value: {
    fontSize: '2.25rem',
    fontWeight: '700',
    color: '#f1f5f9',
    fontFamily: 'JetBrains Mono, monospace'
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    margin: '0.25rem 0'
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center'
  },
  footerText: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '500'
  }
};
