import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ArrowLeftRight,
  PieChart, Receipt, Percent, RefreshCw,
  BarChart3, ScanLine, Link2,
  Users, LogOut, ShieldCheck, TrendingUp,
  BarChart2, GitMerge, CreditCard, BookOpen,
  GitCompare, Settings as SettingsIcon, HelpCircle, Search,
  Users2, Package, Building2, Key, Wallet, X,
} from 'lucide-react';

const ACCENT   = '#0AB98A';
const BORDER   = 'rgba(255,255,255,0.07)';
const TEXT     = '#F1F5F9';
const TEXT_DIM = '#64748B';
const TEXT_SUB = '#94A3B8';
const HOVER    = 'rgba(255,255,255,0.05)';
const ACTIVE   = 'rgba(10,185,138,0.12)';
const GRAD     = 'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)';
const FONT     = "'Inter', -apple-system, sans-serif";

const NAV = [
  {
    section: 'Core',
    items: [
      { path: '/',             label: 'Dashboard',    icon: LayoutDashboard },
      { path: '/documents',    label: 'Documents',    icon: FileText        },
      { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight  },
    ],
  },
  {
    section: 'Finance',
    items: [
      { path: '/reports',        label: 'Reports',        icon: BarChart2,  badge: 'NEW' },
      { path: '/reconciliation', label: 'Reconciliation', icon: GitMerge                },
      { path: '/ledger',         label: 'Ledger View',    icon: BookOpen                },
      { path: '/variance',       label: 'Variance',       icon: TrendingUp              },
      { path: '/billpay',        label: 'Bill Pay',       icon: Wallet                  },
      { path: '/budgets',        label: 'Budgets',        icon: PieChart                },
      { path: '/invoices',       label: 'Invoices',       icon: Receipt                 },
      { path: '/tax',            label: 'Tax',            icon: Percent                 },
      { path: '/billing',        label: 'Billing',        icon: CreditCard              },
      { path: '/currency',       label: 'Currency',       icon: RefreshCw               },
    ],
  },
  {
    section: 'Business',
    items: [
      { path: '/customers',    label: 'Customers',    icon: Users2    },
      { path: '/inventory',    label: 'Inventory',    icon: Package   },
      { path: '/businesses',   label: 'Businesses',   icon: Building2 },
      { path: '/vendors',      label: 'Vendors',      icon: BarChart3 },
      { path: '/team',         label: 'Team',         icon: Users     },
      { path: '/integrations', label: 'Integrations', icon: Link2     },
    ],
  },
  {
    section: 'Tools',
    items: [
      { path: '/search',     label: 'Smart Search', icon: Search,     badge: 'SMART' },
      { path: '/receipts',   label: 'Scanner',      icon: ScanLine                  },
      { path: '/comparison', label: 'Doc Compare',  icon: GitCompare                },
      { path: '/api-access', label: 'API Access',   icon: Key                       },
    ],
  },
];

const ROLES = {
  admin:      { label: 'Admin',      color: '#0AB98A' },
  accountant: { label: 'Accountant', color: '#60A5FA' },
  staff:      { label: 'Staff',      color: '#94A3B8' },
  viewer:     { label: 'Viewer',     color: '#94A3B8' },
};

function LogoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M3 16 L7 7 L11 12 L15 5 L19 9"
        stroke="#0F172A"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="19" cy="9" r="2" fill="#0F172A" />
      <circle cx="3" cy="16" r="1.5" fill="#0F172A" opacity="0.6" />
    </svg>
  );
}

export default function Sidebar({ onLogout, onNavigate }) {
  const navigate      = useNavigate();
  const location      = useLocation();
  const [hov, setHov] = useState(null);

  const role    = localStorage.getItem('user_role')  || 'admin';
  const email   = localStorage.getItem('user_email') || '';
  const rc      = ROLES[role] || ROLES.admin;
  const initial = email ? email[0].toUpperCase() : 'U';
  const name    = localStorage.getItem('user_name') || email.split('@')[0] || 'User';

  const bottomItems = [
    {
      label: 'Settings',
      icon:  SettingsIcon,
      path:  '/settings',
      onClick: () => { navigate('/settings'); onNavigate && onNavigate(); },
    },
    {
      label: 'Help',
      icon:  HelpCircle,
      path:  '/help',
      onClick: () => { navigate('/help'); onNavigate && onNavigate(); },
    },
  ];

  return (
    <aside style={{
      width:          260,
      minWidth:       260,
      height:         '100vh',
      background:     'linear-gradient(180deg, #0F172A 0%, #0D1526 100%)',
      display:        'flex',
      flexDirection:  'column',
      overflow:       'hidden',
      position:       'relative',
      fontFamily:     FONT,
      boxShadow:      '4px 0 32px rgba(0,0,0,0.25)',
    }}>

      {/* Top gradient accent line */}
      <div style={{
        position:   'absolute',
        top:        0,
        left:       0,
        right:      0,
        height:     2,
        background: GRAD,
        zIndex:     1,
      }} />

      {/* Header */}
      <div style={{
        padding:      '20px 20px 18px',
        borderBottom: `1px solid ${BORDER}`,
        marginTop:    2,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width:        40,
            height:       40,
            borderRadius: 11,
            background:   GRAD,
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            flexShrink:   0,
            boxShadow:    '0 4px 16px rgba(10,185,138,0.3)',
          }}>
            <LogoIcon />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: TEXT, lineHeight: 1.1 }}>
              No<span style={{ color: ACCENT }}>vala</span>
            </div>
            <div style={{ fontSize: 9, color: TEXT_DIM, letterSpacing: '0.14em', marginTop: 4, fontWeight: 500, textTransform: 'uppercase' }}>
              Financial Intelligence
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => onNavigate && onNavigate()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_DIM, display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = HOVER; e.currentTarget.style.color = TEXT_SUB; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = TEXT_DIM; }}
        >
          <X size={18} />
        </button>
      </div>

      {/* User card */}
      <div style={{
        margin:        '14px 14px 4px',
        padding:       '12px 14px',
        background:    'rgba(255,255,255,0.03)',
        border:        `1px solid ${BORDER}`,
        borderRadius:  12,
        display:       'flex',
        alignItems:    'center',
        gap:           12,
      }}>
        <div style={{
          width:          38,
          height:         38,
          borderRadius:   10,
          background:     GRAD,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       15,
          fontWeight:     700,
          color:          '#0F172A',
          flexShrink:     0,
        }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4, textTransform: 'capitalize' }}>
            {name}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 6px', borderRadius: 20, background: `${rc.color}18`, border: `1px solid ${rc.color}30` }}>
            <ShieldCheck size={9} color={rc.color} />
            <span style={{ fontSize: 9, fontWeight: 700, color: rc.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {rc.label}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 10px', scrollbarWidth: 'none' }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom: 2 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: TEXT_DIM, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '14px 10px 6px' }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              const isHov = hov === item.path;
              const Icon  = item.icon;
              return (
                <div
                  key={item.path}
                  onClick={() => { navigate(item.path); onNavigate && onNavigate(); }}
                  onMouseEnter={() => setHov(item.path)}
                  onMouseLeave={() => setHov(null)}
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            12,
                    padding:        '10px 12px',
                    borderRadius:   10,
                    cursor:         'pointer',
                    marginBottom:   2,
                    background:     isActive ? ACTIVE : isHov ? HOVER : 'transparent',
                    borderLeft:     `3px solid ${isActive ? ACCENT : 'transparent'}`,
                    transition:     'all 0.15s ease',
                  }}
                >
                  <Icon
                    size={18}
                    color={isActive ? ACCENT : isHov ? TEXT_SUB : TEXT_DIM}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 400, color: isActive ? ACCENT : isHov ? TEXT_SUB : TEXT_DIM, flex: 1, letterSpacing: '0.01em' }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span style={{
                      fontSize:   8,
                      fontWeight: 700,
                      color:      item.badge === 'NEW' ? '#fff' : ACCENT,
                      background: item.badge === 'NEW' ? ACCENT : ACTIVE,
                      border:     `1px solid ${item.badge === 'SMART' ? ACCENT + '35' : 'transparent'}`,
                      padding:    '2px 7px',
                      borderRadius: 20,
                      letterSpacing: '0.05em',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '8px 14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(10,185,138,0.06)', border: '1px solid rgba(10,185,138,0.15)', marginBottom: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 8px ${ACCENT}`, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_SUB }}>Smart Automation Active</div>
            <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 1 }}>Powered by Novala Intelligence</div>
          </div>
        </div>

        {bottomItems.map(item => {
          const isActive = location.pathname === item.path;
          const isHov    = hov === item.label;
          const Icon     = item.icon;
          return (
            <div
              key={item.label}
              onClick={item.onClick}
              onMouseEnter={() => setHov(item.label)}
              onMouseLeave={() => setHov(null)}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          12,
                padding:      '10px 12px',
                borderRadius: 10,
                cursor:       'pointer',
                marginBottom: 4,
                background:   isActive ? ACTIVE : isHov ? HOVER : 'transparent',
                borderLeft:   `3px solid ${isActive ? ACCENT : 'transparent'}`,
                transition:   'all 0.15s ease',
              }}
            >
              <Icon
                size={18}
                color={isActive ? ACCENT : isHov ? TEXT_SUB : TEXT_DIM}
                strokeWidth={1.8}
                style={{ flexShrink: 0 }}
              />
              <span style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 400, color: isActive ? ACCENT : isHov ? TEXT_SUB : TEXT_DIM }}>
                {item.label}
              </span>
            </div>
          );
        })}

        <button
          onClick={onLogout}
          onMouseEnter={e => {
            e.currentTarget.style.background   = 'rgba(239,68,68,0.08)';
            e.currentTarget.style.borderColor  = 'rgba(239,68,68,0.2)';
            e.currentTarget.style.color        = '#EF4444';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background   = 'transparent';
            e.currentTarget.style.borderColor  = BORDER;
            e.currentTarget.style.color        = TEXT_DIM;
          }}
          style={{
            width:          '100%',
            padding:        '10px 14px',
            borderRadius:   10,
            cursor:         'pointer',
            fontSize:       13,
            fontWeight:     500,
            color:          TEXT_DIM,
            background:     'transparent',
            border:         `1px solid ${BORDER}`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            8,
            transition:     'all 0.15s',
            fontFamily:     FONT,
            marginTop:      4,
          }}
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}