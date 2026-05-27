import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  AlertOctagon, 
  Users, 
  PlaneTakeoff, 
  FileText, 
  Settings, 
  HelpCircle 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Kriz Yönetimi', path: '/crisis', icon: AlertOctagon },
    { name: 'Yolcular', path: '/passengers', icon: Users },
    { name: 'Uçuş Durumları', path: '/flights', icon: PlaneTakeoff },
    { name: 'Audit Log', path: '/audit', icon: FileText },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Logo */}
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>🛫</div>
        <div>
          <h1 style={styles.logoText}>AERO-AGENT</h1>
          <span style={styles.logoSub}>CRISIS SYSTEM</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        <ul style={styles.ul}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
            return (
              <li key={item.name}>
                <Link href={item.path} style={{
                  ...styles.link,
                  ...(isActive ? styles.linkActive : {})
                }}>
                  <Icon size={18} color={isActive ? '#06b6d4' : '#94a3b8'} />
                  <span>{item.name}</span>
                  {item.name === 'Kriz Yönetimi' && (
                    <span style={styles.badge}>1 Aktif</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Profile / Settings */}
      <div style={styles.bottom}>
        <Link href="#" style={styles.bottomLink}>
          <Settings size={18} />
          <span>Sistem Ayarları</span>
        </Link>
        <Link href="#" style={styles.bottomLink}>
          <HelpCircle size={18} />
          <span>Yardım & Destek</span>
        </Link>
        <div style={styles.divider} />
        <div style={styles.profile}>
          <div style={styles.avatar}>OP</div>
          <div>
            <h4 style={styles.profileName}>Hakan Yılmaz</h4>
            <span style={styles.profileRole}>Ops Director</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    height: '100vh',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    backgroundColor: '#111827',
    borderRight: '1px solid rgba(148, 163, 184, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '1.5rem',
    zIndex: 100
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '2.5rem'
  },
  logoIcon: {
    fontSize: '1.75rem',
    padding: '0.25rem',
    background: 'rgba(6, 182, 212, 0.1)',
    borderRadius: '8px'
  },
  logoText: {
    fontSize: '1.15rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
    color: '#f1f5f9'
  },
  logoSub: {
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    color: '#06b6d4',
    fontWeight: '600'
  },
  nav: {
    flexGrow: 1
  },
  ul: {
    liststyle: 'none',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem'
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out'
  },
  linkActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
    color: '#f1f5f9',
    borderLeft: '3px solid #06b6d4'
  },
  badge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    color: '#fda4af',
    fontSize: '0.65rem',
    fontWeight: '700',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
    border: '1px solid rgba(244, 63, 94, 0.3)'
  },
  bottom: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem'
  },
  bottomLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: '500',
    padding: '0.5rem'
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    margin: '0.5rem 0'
  },
  profile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#06b6d4',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.85rem'
  },
  profileName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#f1f5f9'
  },
  profileRole: {
    fontSize: '0.75rem',
    color: '#94a3b8'
  }
};
