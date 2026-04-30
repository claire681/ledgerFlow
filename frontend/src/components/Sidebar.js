import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ArrowLeftRight,
  PieChart, Receipt, Percent, RefreshCw,
  BarChart3, ScanLine, Link2,
  Users, LogOut, ShieldCheck, TrendingUp,
} from 'lucide-react';

const ACCENT   = '#0AB98A';
const BG       = '#0F172A';
const BORDER   = '#1E293B';
const TEXT     = '#F1F5F9';
const TEXT_DIM = '#475569';
const TEXT_SUB = '#94A3B8';
const HOVER    = 'rgba(255,255,255,0.04)';
const ACTIVE   = 'rgba(10,185,138,0.1)';
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
      { path: '/budgets',  label: 'Budgets',  icon: PieChart  },
      { path: '/invoices', label: 'Invoices', icon: Receipt   },
      { path: '/tax',      label: 'Tax',      icon: Percent   },
      { path: '/currency', label: 'Currency', icon: RefreshCw },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { path: '/vendors',  label: 'Vendors', icon: BarChart3, badge: null  },
      { path: '/receipts', label: 'Scanner', icon: ScanLine,  badge: 'AI' },
    ],
  },
  {
    section: 'Organization',
    items: [
      { path: '/team',         label: 'Team',         icon: Users },
      { path: '/integrations', label: 'Integrations', icon: Link2 },
    ],
  },
];

const ROLES = {
  admin:      { label: 'Admin',      color: '#0AB98A' },
  accountant: { label: 'Accountant', color: '#60A5FA' },
  staff:      { label: 'Staff',      color: '#94A3B8' },
  viewer:     { label: 'Viewer',     color: '#94A3B8' },
};

// ── Novala Logo Icon ──────────────────────────────────────────
const LogoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M3 16 L7 7 L11 12 L15 5 L19 9"
      stroke="#0F172A"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="19" cy="9" r="2" fill="#0F172A"/>
    <circle cx="3"  cy="16" r="1.5" fill="#0F172A" opacity="0.6"/>
  </svg>
);

export default function Sidebar({ onLogout, onNavigate }) {
  const navigate      = useNavigate();
  const location      = useLocation();
  const [hov, setHov] = useState(null);

  const role    = localStorage.getItem('user_role')  || 'admin';
  const email   = localStorage.getItem('user_email') || '';
  const rc      = ROLES[role] || ROLES.admin;
  const initial = email ? email[0].toUpperCase() : 'U';
  const name    = email.split('@')[0] || 'User';

  return (
    <aside style={{
      width:         244,
      minWidth:      244,
      height:        '100vh',
      background:    BG,
      display:       'flex',
      flexDirection: 'column',
      overflow:      'hidden',
      position:      'relative',
      fontFamily:    FONT,
    }}>

      {/* Top accent line */}
      <div style={{
        position:   'absolute',
        top:        0, left: 0, right: 0,
        height:     2,
        background: GRAD,
        zIndex:     1,
      }}/>

      {/* ── Logo ── */}
      <div style={{
        padding:      '26px 20px 20px',
        borderBottom: `1px solid ${BORDER}`,
        marginTop:    2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width:          42,
            height:         42,
            borderRadius:   12,
            background:     GRAD,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
            boxShadow:      '0 4px 16px rgba(10,185,138,0.25)',
          }}>
            <LogoIcon/>
          </div>
          <div>
            <div style={{
              fontSize:      16.5,
              fontWeight:    700,
              letterSpacing: '-0.01em',
              color:         TEXT,
              lineHeight:    1.1,
            }}>
              No<span style={{ color: ACCENT }}>vala</span>
            </div>
            <div style={{
              fontSize:      9,
              color:         TEXT_DIM,
              letterSpacing: '0.16em',
              marginTop:     4,
              fontWeight:    500,
              textTransform: 'uppercase',
            }}>
              AI Finance Platform
            </div>
          </div>
        </div>
      </div>

      {/* ── User card ── */}
      <div style={{
        margin:       '14px 14px 2px',
        padding:      '11px 13px',
        background:   'rgba(255,255,255,0.03)',
        border:       `1px solid ${BORDER}`,
        borderRadius: 10,
        display:      'flex',
        alignItems:   'center',
        gap:          10,
      }}>
        <div style={{
          width:          36,
          height:         36,
          borderRadius:   10,
          background:     GRAD,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       14,
          fontWeight:     700,
          color:          '#0F172A',
          flexShrink:     0,
        }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize:      12,
            fontWeight:    600,
            color:         TEXT,
            overflow:      'hidden',
            textOverflow:  'ellipsis',
            whiteSpace:    'nowrap',
            marginBottom:  3,
            textTransform: 'capitalize',
          }}>
            {name}
          </div>
          <div style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          4,
            padding:      '2px 8px 2px 6px',
            borderRadius: 20,
            background:   `${rc.color}18`,
            border:       `1px solid ${rc.color}30`,
          }}>
            <ShieldCheck size={9} color={rc.color}/>
            <span style={{
              fontSize:      9,
              fontWeight:    600,
              color:         rc.color,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {rc.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex:           1,
        overflowY:      'auto',
        padding:        '6px 10px 4px',
        scrollbarWidth: 'none',
      }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom: 4 }}>

            {/* Section label */}
            <div style={{
              fontSize:      9,
              fontWeight:    600,
              color:         TEXT_DIM,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding:       '12px 8px 5px',
            }}>
              {group.section}
            </div>

            {/* Items */}
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
                    display:      'flex',
                    alignItems:   'center',
                    gap:          10,
                    padding:      '8.5px 10px',
                    borderRadius: 8,
                    cursor:       'pointer',
                    marginBottom: 1,
                    background:   isActive ? ACTIVE : isHov ? HOVER : 'transparent',
                    borderLeft:   `2px solid ${isActive ? ACCENT : 'transparent'}`,
                    transition:   'all 0.12s ease',
                  }}
                >
                  <Icon
                    size={15}
                    color={isActive ? ACCENT : isHov ? TEXT_SUB : TEXT_DIM}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ flexShrink: 0 }}
                  />
                  <span style={{
                    fontSize:      12.5,
                    fontWeight:    isActive ? 500 : 400,
                    color:         isActive ? ACCENT : isHov ? TEXT_SUB : TEXT_DIM,
                    flex:          1,
                    letterSpacing: '0.01em',
                  }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span style={{
                      fontSize:      8,
                      fontWeight:    700,
                      color:         ACCENT,
                      background:    ACTIVE,
                      border:        `1px solid ${ACCENT}35`,
                      padding:       '1px 6px',
                      borderRadius:  20,
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

      {/* ── Bottom ── */}
      <div style={{ padding: '8px 14px 22px' }}>

        {/* AI Status */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          8,
          padding:      '9px 12px',
          borderRadius: 8,
          background:   'rgba(255,255,255,0.02)',
          border:       `1px solid ${BORDER}`,
          marginBottom: 8,
        }}>
          <TrendingUp size={13} color={ACCENT}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: TEXT_SUB }}>
              Novala AI Online
            </div>
            <div style={{ fontSize: 9, color: TEXT_DIM, marginTop: 1 }}>
              GPT-4o · Gemini 1.5
            </div>
          </div>
          <div style={{
            width:      6,
            height:     6,
            borderRadius: '50%',
            background: ACCENT,
            boxShadow:  `0 0 6px ${ACCENT}`,
          }}/>
        </div>

        {/* Sign out */}
        <button
          onClick={onLogout}
          onMouseEnter={e => {
            e.currentTarget.style.background  = 'rgba(239,68,68,0.07)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.18)';
            e.currentTarget.style.color       = '#EF4444';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'transparent';
            e.currentTarget.style.borderColor = BORDER;
            e.currentTarget.style.color       = TEXT_DIM;
          }}
          style={{
            width:          '100%',
            padding:        '9px 14px',
            borderRadius:   8,
            cursor:         'pointer',
            fontSize:       12,
            fontWeight:     400,
            color:          TEXT_DIM,
            background:     'transparent',
            border:         `1px solid ${BORDER}`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            7,
            transition:     'all 0.15s',
            fontFamily:     FONT,
          }}
        >
          <LogOut size={13}/>
          Sign out
        </button>
      </div>
    </aside>
  );
}