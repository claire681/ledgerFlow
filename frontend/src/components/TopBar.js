import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, HelpCircle,
  ChevronDown, Menu, X,
} from 'lucide-react';

const ACCENT = '#0AB98A';
const FONT   = "'Inter', -apple-system, sans-serif";

export default function TopBar({ onLogout, onMobileMenu }) {
  const navigate        = useNavigate();
  const email           = localStorage.getItem('user_email')   || '';
  const name            = localStorage.getItem('user_name')    || email.split('@')[0] || 'User';
  const company         = localStorage.getItem('company_name') || 'My Business';
  const initial         = name ? name[0].toUpperCase() : 'U';
  const [search,        setSearch]        = useState('');
  const [showProfile,   setShowProfile]   = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #E8EDF3', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, zIndex: 100, boxShadow: '0 1px 6px rgba(0,0,0,0.04)', flexShrink: 0, fontFamily: FONT }}>

      {/* Hamburger — mobile only */}
      <button
        onClick={onMobileMenu}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 8, flexShrink: 0, width: 36, height: 36, transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(10,185,138,0.08)'; e.currentTarget.style.color = ACCENT; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#475569'; }}
      >
        <Menu size={22} />
      </button>

      {/* Logo */}
      <div
        onClick={() => navigate('/')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#0AB98A,#0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(10,185,138,0.25)', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
            <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="19" cy="9" r="2" fill="#0F172A"/>
          </svg>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
          No<span style={{ color: ACCENT }}>vala</span>
        </span>
      </div>

      {/* Company name — hide on very small screens */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid #E8EDF3', cursor: 'pointer', flexShrink: 0, maxWidth: 160, transition: 'all 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company}</span>
        <ChevronDown size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
      </div>

      {/* Search bar — flex grows */}
      <div
        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: searchFocused ? '#fff' : '#F8FAFC', border: `1px solid ${searchFocused ? ACCENT : '#E8EDF3'}`, borderRadius: 10, padding: '8px 14px', minWidth: 0, transition: 'all 0.2s' }}
      >
        <Search size={14} color={searchFocused ? ACCENT : '#94A3B8'} style={{ flexShrink: 0 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search transactions, reports, pages..."
          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#334155', fontFamily: FONT, width: '100%', minWidth: 0 }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 0, flexShrink: 0 }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Right icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>

        {/* Notifications */}
        <button
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#334155'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748B'; }}
        >
          <Bell size={18} />
          <div style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', border: '2px solid #fff' }} />
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#334155'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748B'; }}
        >
          <Settings size={18} />
        </button>

        {/* Help */}
        <button
          onClick={() => navigate('/help')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#334155'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748B'; }}
        >
          <HelpCircle size={18} />
        </button>

        {/* Profile avatar */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfile(p => !p)}
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#0AB98A,#0EA5E9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', marginLeft: 4, flexShrink: 0 }}
          >
            {initial}
          </button>

          {showProfile && (
            <>
              {/* Click outside to close */}
              <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
              <div style={{ position: 'absolute', top: 42, right: 0, width: 220, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #E8EDF3', zIndex: 200, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'capitalize' }}>{name}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
                </div>
                {[
                  { label: 'Dashboard', path: '/'         },
                  { label: 'Settings',  path: '/settings'  },
                  { label: 'Billing',   path: '/billing'   },
                  { label: 'Help',      path: '/help'      },
                ].map(item => (
                  <div
                    key={item.label}
                    onClick={() => { navigate(item.path); setShowProfile(false); }}
                    style={{ padding: '11px 16px', fontSize: 13, color: '#334155', cursor: 'pointer', transition: 'all 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {item.label}
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #F1F5F9' }}>
                  <div
                    onClick={() => { setShowProfile(false); onLogout(); }}
                    style={{ padding: '11px 16px', fontSize: 13, color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Sign Out
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}