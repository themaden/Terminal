'use client';

import React, { useState } from 'react';
import StatsGrid from '@/components/dashboard/StatsGrid';
import AgentActivity from '@/components/dashboard/AgentActivity';
import DecisionPanel from '@/components/crisis/DecisionPanel';
import CostBreakdown from '@/components/crisis/CostBreakdown';
import { AlertOctagon, Plane, Users, Check } from 'lucide-react';

export default function DashboardPage() {
  const [decisions, setDecisions] = useState([
    {
      pnr: "PNR100000",
      name: "Ahmet Yılmaz",
      ticketClass: "FIRST CLASS",
      action: "Yeniden Rezervasyon",
      newFlight: "TK1983 (IST - LHR) - 3 saat sonra",
      compensation: 400,
      hotel: "VIP Lounge - Radisson Blu 5*",
      confidence: 99,
      reasoning: "First class yolcu için en yüksek sadakat skoru gözetildi. 3 saatlik gecikmeyle TK1983 seferine atandı, Radisson Blu VIP konaklama atandı.",
      onApprove: () => handleApprove("PNR100000")
    },
    {
      pnr: "PNR100001",
      name: "Jean Smith",
      ticketClass: "ECONOMY CLASS",
      action: "Yeniden Rezervasyon",
      newFlight: "TK1985 (IST - LHR) - 9 saat sonra",
      compensation: 400,
      hotel: "Airport Hotel (4*) - Gecelik",
      confidence: 95,
      reasoning: "Ekonomi sınıfı yolcu. TK1983 uçağında boş koltuk kalmadığı için gecikmeli olan TK1985 uçağına atandı. Gece kalışı nedeniyle 4 yıldızlı havalimanı oteli tahsis edildi.",
      onApprove: () => handleApprove("PNR100001")
    },
    {
      pnr: "PNR100002",
      name: "Ayşe Kaya",
      ticketClass: "BUSINESS CLASS",
      action: "Yeniden Rezervasyon",
      newFlight: "TK1983 (IST - LHR) - 3 saat sonra",
      compensation: 400,
      hotel: "Radisson Blu (5*) - Gecelik",
      confidence: 98,
      reasoning: "Business yolcu önceliği. İlk alternatif olan TK1983 uçağına business koltuk ataması yapıldı, 5 yıldızlı otel tahsis edildi.",
      onApprove: () => handleApprove("PNR100002")
    }
  ]);

  const handleApprove = (pnr: string) => {
    setDecisions(prev => prev.filter(d => d.pnr !== pnr));
  };

  const handleApproveAll = () => {
    setDecisions([]);
    alert("Tüm yolcuların kurtarma kararları onaylandı! Twilio API üzerinden kişiselleştirilmiş SMS ve WhatsApp bildirimleri 25 yolcuya gönderildi.");
  };

  return (
    <div style={styles.container}>
      {/* Active Crisis Banner */}
      <div className="glass-card" style={styles.crisisBanner}>
        <div style={styles.bannerLeft}>
          <AlertOctagon size={24} color="#f43f5e" className="pulse-glow-cyan" />
          <div>
            <h2 style={styles.bannerTitle}>Aktif Operasyonel Aksaklık: TK1981 (IST - LHR) İPTAL</h2>
            <p style={styles.bannerSubtitle}>Neden: Heathrow Havalimanı (LHR) aşırı yoğunluk ve sis fırtınası. 25 etkilenen yolcu.</p>
          </div>
        </div>
        <div style={styles.bannerRight}>
          <span className="badge badge-rose">Kritik Kriz</span>
        </div>
      </div>

      {/* KPI Grid */}
      <StatsGrid />

      {/* Split grid: Decisions Pool & Cost Breakdown */}
      <div style={styles.splitGrid}>
        <div style={styles.leftCol}>
          <DecisionPanel decisions={decisions} onApproveAll={handleApproveAll} />
        </div>
        <div style={styles.rightCol}>
          <CostBreakdown />
          
          {/* Recovery flights indicator */}
          <div className="glass-card" style={styles.flightsCard}>
            <h3 style={styles.cardTitle}>Aktif Alternatif Kapasiteler</h3>
            <div style={styles.flightRow}>
              <div>
                <strong>TK1983 (IST - LHR)</strong>
                <div style={styles.flightSub}>Airbus A350 · 3 saat gecikmeli kalkış</div>
              </div>
              <span className="badge badge-emerald">15 Boş Koltuk</span>
            </div>
            <div style={styles.flightRow}>
              <div>
                <strong>TK1985 (IST - LHR)</strong>
                <div style={styles.flightSub}>Boeing 787-9 · 9 saat gecikmeli kalkış</div>
              </div>
              <span className="badge badge-cyan">95 Boş Koltuk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Activity Grid */}
      <AgentActivity />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    width: '100%'
  },
  crisisBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
    border: '1px solid rgba(244, 63, 94, 0.2)',
    padding: '1.25rem 1.5rem',
    borderRadius: '12px'
  },
  bannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  bannerTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#f1f5f9'
  },
  bannerSubtitle: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginTop: '0.15rem'
  },
  bannerRight: {},
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '1.5rem',
    width: '100%'
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column' as const
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem'
  },
  flightsCard: {
    backgroundColor: '#111827',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1.25rem'
  },
  cardTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
    paddingBottom: '0.5rem'
  },
  flightRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.02)'
  },
  flightSub: {
    fontSize: '0.7rem',
    color: '#64748b',
    marginTop: '0.15rem'
  }
};
