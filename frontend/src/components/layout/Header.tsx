import React, { useState, useEffect } from 'react';
import { Bell, Clock, Search, ShieldCheck } from 'lucide-react';

export default function Header() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('tr-TR', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={styles.header}>
      {/* Search system */}
      <div style={styles.searchBar}>
        <Search size={16} color="#64748b" />
        <input 
          type="text" 
          placeholder="PNR, uçuş numarası veya yolcu adı ara..." 
          style={styles.searchInput}
        />
      </div>

      {/* Right panel indicators */}
      <div style={styles.right}>
        {/* Connection Safety Indicator */}
        <div style={styles.indicator}>
          <ShieldCheck size={16} color="#10b981" />
          <span style={styles.indicatorText}>Güvenli Bağlantı (SSO)</span>
        </div>

        {/* Real-time Clock */}
        <div style={styles.clock}>
          <Clock size={16} color="#06b6d4" />
          <span style={styles.timeText}>{time} Istanbul</span>
        </div>

        {/* Notifications */}
        <div style={styles.notificationBell}>
          <Bell size={18} color="#f1f5f9" />
          <span style={styles.badge} />
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
    backgroundColor: '#0a0e1a',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 90,
    marginLeft: '260px' // Sidebar offset
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#111827',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    width: '320px'
  },
  searchInput: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#f1f5f9',
    fontSize: '0.85rem',
    width: '100%',
    fontFamily: 'inherit'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.75rem',
    color: '#94a3b8',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    border: '1px solid rgba(16, 185, 129, 0.15)'
  },
  indicatorText: {
    fontWeight: '500'
  },
  clock: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    border: '1px solid rgba(6, 182, 212, 0.15)',
    fontSize: '0.75rem',
    color: '#06b6d4',
    fontFamily: 'JetBrains Mono, monospace',
    fontWeight: '500'
  },
  timeText: {
    letterSpacing: '0.05em'
  },
  notificationBell: {
    position: 'relative' as const,
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    }
  },
  badge: {
    position: 'absolute' as const,
    top: '3px',
    right: '3px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#f43f5e',
    boxShadow: '0 0 10px #f43f5e'
  }
};
