import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, BarChart2, Grid, Plus, Bookmark,
  LayoutDashboard, FileText, ArrowLeftRight,
  PieChart, Receipt, Percent, RefreshCw,
  BarChart3, ScanLine, Link2, Users,
  TrendingUp, CreditCard, BookOpen,
  GitCompare, Search, Users2, Package,
  Building2, Key, Wallet, GitMerge,
  Settings as SettingsIcon, HelpCircle,
  ChevronRight, X, LogOut,
} from 'lucide-react';

const ACCENT = '#0AB98A';
const FONT   = "'Inter', -apple-system, sans-serif";

// ── All apps grouped for flyout ─────────────────────────────
const APP_GROUPS = [
  {
    label: 'Core',
    color: '#0AB98A',
    items: [
      { label: 'Dashboard',    path: '/',             icon: LayoutDashboard },
      { label: 'Documents',    path: '/documents',    icon: FileText        },
      { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight  },
    ],
  },
  {
    label: 'Finance',
    color: '#3B82F6',
    items: [
      { label: 'Reports',        path: '/reports',        icon: BarChart2  },
      { label: 'Reconciliation', path: '/reconciliation', icon: GitMerge   },
      { label: 'Ledger View',    path: '/ledger',         icon: BookOpen   },
      { label: 'Variance',       path: '/variance',       icon: TrendingUp },
      { label: 'Bill Pay',       path: '/billpay',        icon: Wallet     },
      { label: 'Budgets',        path: '/budgets',        icon: PieChart   },
      { label: 'Invoices',       path: '/invoices',       icon: Receipt    },
      { label: 'Tax',            path: '/tax',            icon: Percent    },
      { label: 'Billing',        path: '/billing',        icon: CreditCard },
      { label: 'Currency',       path: '/currency',       icon: RefreshCw  },
    ],
  },
  {
    label: 'Business',
    color: '#8B5CF6',
    items: [
      { label: 'Customers',    path: '/customers',    icon: Users2    },
      { label: 'Inventory',    path: '/inventory',    icon: Package   },
      { label: 'Businesses',   path: '/businesses',   icon: Building2 },
      { label: 'Vendors',      path: '/vendors',      icon: BarChart3 },
      { label: 'Team',         path: '/team',         icon: Users     },
      { label: 'Integrations', path: '/integrations', icon: Link2     },
    ],
  },
  {
    label: 'Tools',
    color: '#F59E0B',
    items: [
      { label: 'Smart Search', path: '/search',     icon: Search    },
      { label: 'Scanner',      path: '/receipts',   icon: ScanLine  },
      { label: 'Doc Compare',  path: '/comparison', icon: GitCompare},
      { label: 'API Access',   path: '/api-access', icon: Key       },
    ],
  },
];

// ── Quick create items ───────────────────────────────────────
const CREATE_ITEMS = [
  { label: 'New Invoice',     path: '/invoices',    color: '#0AB98A' },
  { label: 'New Transaction', path: '/transactions',color: '#3B82F6' },
  { label: 'Upload Document', path: '/documents',   color: '#8B5CF6' },
  { label: 'Scan Receipt',    path: '/receipts',    color: '#F59E0B' },
  { label: 'Add Bill',        path: '/billpay',     color: '#EF4444' },
  { label: 'New Budget',      path: '/budgets',     color: '#06B6D4' },
];

// ── Slim sidebar icons ────────────────────────────────────────
const SLIM_ITEMS = [
  { id: 'home',     icon: Home,     label: 'Home',     path: '/'        },
  { id: 'create',   icon: Plus,     label: 'Create',   flyout: 'create' },
  { id: 'reports',  icon: BarChart2,label: 'Reports',  flyout: 'reports'},
  { id: 'allapps',  icon: Grid,     label: 'All Apps', flyout: 'apps'   },
  { id: 'settings', icon: SettingsIcon, label: 'Settings', path: '/settings' },
  { id: 'help',     icon: HelpCircle,   label: 'Help',     path: '/help'     },
];

function FlyoutPanel({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 72, height: '100vh', width: 280, background: '#fff', boxShadow: '4px 0 24px rgba(0,0,0,0.1)', zIndex: 45, display: 'flex', flexDirection: 'column', borderRight: '1px solid #F1F5F9', animation: 'slideIn 0.2s ease' }}>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(-10px) } to { opacity:1; transform:translateX(0) } }`}</style>
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', letterSpacing: '0.01em' }}>{title}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 2 }}>
          <X size={16}/>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {children}
      </div>
    </div>
  );
}

export default function Sidebar({ onLogout, mobileOpen, onMobileClose }) {
  const navigate      = useNavigate();
  const location      = useLocation();
  const [flyout, setFlyout] = useState(null);
  const [hovItem, setHovItem] = useState(null);
  const sidebarRef = useRef(null);

  // Close flyout when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setFlyout(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleItemClick = (item) => {
    if (item.path) {
      navigate(item.path);
      setFlyout(null);
      onMobileClose && onMobileClose();
    } else if (item.flyout) {
      setFlyout(flyout === item.flyout ? null : item.flyout);
    }
  };

  const goTo = (path) => {
    navigate(path);
    setFlyout(null);
    onMobileClose && onMobileClose();
  };

  const isMobile = window.innerWidth < 768;

  return (
    <div ref={sidebarRef}>

      {/* ── Slim vertical sidebar ─────────────────────────── */}
      <aside style={{
        position:      'fixed',
        top:           56,
        left:          0,
        width:         72,
        height:        'calc(100vh - 56px)',
        background:    '#fff',
        borderRight:   '1px solid #E8EDF3',
        display:       isMobile ? 'none' : 'flex',
        flexDirection: 'column',
        alignItems:    'center',
        paddingTop:    12,
        paddingBottom: 16,
        zIndex:        44,
        fontFamily:    FONT,
        boxShadow:     '1px 0 0 #E8EDF3',
      }}>

        {SLIM_ITEMS.map(item => {
          const Icon     = item.icon;
          const isActive = item.path
            ? (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)))
            : flyout === item.flyout;
          const isHov    = hovItem === item.id;

          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setHovItem(item.id)}
              onMouseLeave={() => setHovItem(null)}
              style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                gap:            4,
                padding:        '10px 8px',
                borderRadius:   10,
                cursor:         'pointer',
                width:          56,
                marginBottom:   2,
                background:     isActive ? 'rgba(10,185,138,0.08)' : isHov ? '#F8FAFC' : 'transparent',
                transition:     'all 0.15s ease',
              }}
            >
              <div style={{
                width:          36,
                height:         36,
                borderRadius:   10,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                background:     isActive ? 'rgba(10,185,138,0.12)' : 'transparent',
              }}>
                <Icon
                  size={20}
                  color={isActive ? ACCENT : isHov ? '#334155' : '#64748B'}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span style={{
                fontSize:   9,
                fontWeight: isActive ? 700 : 500,
                color:      isActive ? ACCENT : isHov ? '#334155' : '#94A3B8',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                textAlign:  'center',
                lineHeight: 1.2,
              }}>
                {item.label}
              </span>
            </div>
          );
        })}

        {/* Divider */}
        <div style={{ width: 40, height: 1, background: '#F1F5F9', margin: '8px 0' }}/>

        {/* Sign out */}
        <div
          onClick={onLogout}
          onMouseEnter={() => setHovItem('logout')}
          onMouseLeave={() => setHovItem(null)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', width: 56, marginTop: 'auto', background: hovItem === 'logout' ? 'rgba(239,68,68,0.06)' : 'transparent', transition: 'all 0.15s' }}
        >
          <LogOut size={20} color={hovItem === 'logout' ? '#EF4444' : '#94A3B8'} strokeWidth={1.8}/>
          <span style={{ fontSize: 9, fontWeight: 500, color: hovItem === 'logout' ? '#EF4444' : '#94A3B8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Out</span>
        </div>
      </aside>

      {/* ── Mobile full drawer ────────────────────────────── */}
      <div style={{
        position:   'fixed',
        top:        0,
        left:       0,
        width:      280,
        height:     '100vh',
        background: 'linear-gradient(180deg,#0F172A 0%,#0D1526 100%)',
        zIndex:     50,
        transform:  mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        display:    isMobile ? 'flex' : 'none',
        flexDirection: 'column',
        fontFamily: FONT,
        boxShadow:  '4px 0 32px rgba(0,0,0,0.3)',
      }}>
        {/* Mobile header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em' }}>
            No<span style={{ color: ACCENT }}>vala</span>
          </div>
          <button onClick={onMobileClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
            <X size={20}/>
          </button>
        </div>

        {/* Mobile nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', scrollbarWidth: 'none' }}>
          {APP_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '12px 10px 6px' }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const Icon     = item.icon;
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <div
                    key={item.path}
                    onClick={() => goTo(item.path)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 2, background: isActive ? 'rgba(10,185,138,0.12)' : 'transparent', borderLeft: `3px solid ${isActive ? ACCENT : 'transparent'}`, transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={18} color={isActive ? ACCENT : '#64748B'} strokeWidth={isActive ? 2.5 : 1.8}/>
                    <span style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 400, color: isActive ? ACCENT : '#94A3B8' }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Mobile sign out */}
        <div style={{ padding: '12px 16px 28px' }}>
          <button
            onClick={onLogout}
            style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: '#64748B', cursor: 'pointer', fontSize: 13, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
          >
            <LogOut size={15}/> Sign out
          </button>
        </div>
      </div>

      {/* ── Flyout panels (desktop only) ─────────────────── */}
      {flyout === 'create' && (
        <FlyoutPanel title="Quick Create" onClose={() => setFlyout(null)}>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Create New</div>
            {CREATE_ITEMS.map(item => (
              <div
                key={item.label}
                onClick={() => goTo(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4 }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }}/>
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{item.label}</span>
                <ChevronRight size={13} color="#CBD5E1" style={{ marginLeft: 'auto' }}/>
              </div>
            ))}
          </div>
        </FlyoutPanel>
      )}

      {flyout === 'reports' && (
        <FlyoutPanel title="Reports" onClose={() => setFlyout(null)}>
          <div style={{ padding: '12px 16px' }}>
            {[
              { label: 'Financial Reports',  path: '/reports'        },
              { label: 'Variance Reports',   path: '/variance'       },
              { label: 'Ledger View',        path: '/ledger'         },
              { label: 'Reconciliation',     path: '/reconciliation' },
              { label: 'Smart Search',       path: '/search'         },
            ].map(item => (
              <div
                key={item.label}
                onClick={() => goTo(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2 }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500, flex: 1 }}>{item.label}</span>
                <ChevronRight size={13} color="#CBD5E1"/>
              </div>
            ))}
          </div>
        </FlyoutPanel>
      )}

      {flyout === 'apps' && (
        <FlyoutPanel title="All Apps" onClose={() => setFlyout(null)}>
          <div style={{ padding: '8px 12px' }}>
            {APP_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '10px 8px 6px' }}>
                  {group.label}
                </div>
                {group.items.map(item => {
                  const Icon     = item.icon;
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <div
                      key={item.path}
                      onClick={() => goTo(item.path)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, background: isActive ? 'rgba(10,185,138,0.06)' : 'transparent' }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${group.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={14} color={isActive ? ACCENT : group.color}/>
                      </div>
                      <span style={{ fontSize: 13, color: isActive ? ACCENT : '#334155', fontWeight: isActive ? 600 : 400, flex: 1 }}>
                        {item.label}
                      </span>
                      {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT }}/>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </FlyoutPanel>
      )}
    </div>
  );
}