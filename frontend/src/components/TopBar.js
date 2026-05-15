import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, HelpCircle,
  ChevronDown, Menu, X, Clipboard,
  Headphones, Sparkles, Users,
} from 'lucide-react';
import { getFirstName } from '../utils/userDisplay';

const TEAL = '#0F5959';
const ACCENT = '#0AB98A';
const FONT = "'Inter', -apple-system, sans-serif";

export default function TopBar({ onLogout, onMobileMenu, isMobile }) {
  const navigate = useNavigate();

  const rawName   = localStorage.getItem('user_name')    || localStorage.getItem('user_email') || '';
  const userEmail = localStorage.getItem('user_email')   || '';
  const company   = localStorage.getItem('company_name') || 'My Business';
  const savedFirst = localStorage.getItem('first_name')  || '';
  const firstName  = savedFirst || getFirstName(rawName || userEmail);
  const initial    = firstName ? firstName[0].toUpperCase() : 'U';

  const [search,        setSearch]        = useState('');
  const [showProfile,   setShowProfile]   = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNova,      setShowNova]      = useState(false);

  const iconBtn = (onClick, children, redDot) => (
    <button
      onClick={onClick}
      style={{ position:'relative', background:'none', border:'none', cursor:'pointer', color:'#64748B', padding:8, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, transition:'all 0.15s', flexShrink:0 }}
      onMouseEnter={e => { e.currentTarget.style.background='#F1F5F9'; e.currentTarget.style.color='#334155'; }}
      onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#64748B'; }}
    >
      {children}
      {redDot && <div style={{ position:'absolute', top:6, right:6, width:7, height:7, borderRadius:'50%', background:'#EF4444', border:'2px solid #fff' }}/>}
    </button>
  );

  return (
    <div style={{ height:64, background:'#fff', borderBottom:'1px solid #E8EDF3', display:'flex', alignItems:'center', padding:'0 16px', gap:10, zIndex:100, boxShadow:'0 1px 6px rgba(0,0,0,0.04)', flexShrink:0, fontFamily:FONT }}>

      {/* Hamburger — mobile only */}
     <button
        onClick={onMobileMenu}
        style={{ background:'none', border:'none', cursor:'pointer', color:'#475569', display: isMobile ? 'flex' : 'none', alignItems:'center', justifyContent:'center', padding:6, borderRadius:8, flexShrink:0, width:36, height:36, transition:'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(10,185,138,0.08)'; e.currentTarget.style.color=ACCENT; }}
        onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#475569'; }}
      >
        <Menu size={22}/>
      </button>

      {/* Logo — dark teal */}
      <div
        onClick={() => navigate('/')}
        style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', flexShrink:0 }}
      >
        <div style={{ width:30, height:30, borderRadius:9, background:TEAL, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(15,89,89,0.3)', flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
            <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="19" cy="9" r="2" fill="#fff"/>
          </svg>
        </div>
        {!isMobile && (
          <span style={{ fontSize:16, fontWeight:800, color:TEAL, letterSpacing:'-0.02em', whiteSpace:'nowrap' }}>
            No<span style={{ color:ACCENT }}>vala</span>
          </span>
        )}
      </div>

      {/* Company dropdown */}
      {!isMobile && (
        <div
          style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, border:'1px solid #E8EDF3', cursor:'pointer', flexShrink:0, maxWidth:220, transition:'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}
        >
          <span style={{ fontSize:12, fontWeight:600, color:'#334155', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180 }}>{company}</span>
          <ChevronDown size={12} color="#94A3B8" style={{ flexShrink:0 }}/>
        </div>
      )}

      {/* Search bar — flex grows, max 600px, pill shaped */}
      <div style={{ flex:1, display:'flex', justifyContent:'center', minWidth:0 }}>
        <div
          style={{ display:'flex', alignItems:'center', gap:8, background:searchFocused?'#fff':'#F1F5F9', border:`1px solid ${searchFocused?ACCENT:'#E8EDF3'}`, borderRadius:999, padding:'8px 16px', width:'100%', maxWidth:600, transition:'all 0.2s' }}
        >
          <Search size={14} color={searchFocused?ACCENT:'#94A3B8'} style={{ flexShrink:0 }}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={e => { if (e.key === 'Enter' && search.trim()) navigate('/search'); }}
            placeholder="Search transactions, contacts, help, reports, and more."
            style={{ border:'none', outline:'none', background:'transparent', fontSize:13, color:'#334155', fontFamily:FONT, width:'100%', minWidth:0 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex', padding:0, flexShrink:0 }}>
              <X size={13}/>
            </button>
          )}
        </div>
      </div>

      {/* Right icons */}
      <div style={{ display:'flex', alignItems:'center', gap:2, flexShrink:0 }}>

        {/* Contact experts — hide on mobile */}
        {!isMobile && (
          <button
            onClick={() => navigate('/help')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', borderRadius:8, background:'none', border:'none', cursor:'pointer', color:'#64748B', fontSize:12, fontWeight:500, fontFamily:FONT, transition:'all 0.15s', flexShrink:0 }}
            onMouseEnter={e => { e.currentTarget.style.background='#F1F5F9'; e.currentTarget.style.color='#334155'; }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#64748B'; }}
          >
            <div style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Users size={11} color="#fff"/>
            </div>
            <span>Contact experts</span>
          </button>
        )}

        {/* Clipboard */}
        {iconBtn(() => navigate('/documents'), <Clipboard size={18}/>)}

        {/* Headset / support */}
        {iconBtn(() => navigate('/help'), <Headphones size={18}/>)}

        {/* Bell with red dot */}
        {iconBtn(null, <Bell size={18}/>, true)}

        {/* Settings */}
        {iconBtn(() => navigate('/settings'), <Settings size={18}/>)}

        {/* Help */}
        {iconBtn(() => navigate('/help'), <HelpCircle size={18}/>)}

        {/* Profile avatar */}
        <div style={{ position:'relative' }}>
          <button
            onClick={() => setShowProfile(p => !p)}
            style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg,${TEAL},#0AB98A)`, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', marginLeft:4, flexShrink:0, boxShadow:'0 2px 8px rgba(15,89,89,0.25)', transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.06)'}
            onMouseLeave={e => e.currentTarget.style.transform='none'}
          >
            {initial}
          </button>

          {showProfile && (
            <>
              <div onClick={() => setShowProfile(false)} style={{ position:'fixed', inset:0, zIndex:199 }}/>
              <div style={{ position:'absolute', top:44, right:0, width:240, background:'#fff', borderRadius:14, boxShadow:'0 8px 40px rgba(0,0,0,0.14)', border:'1px solid #E8EDF3', zIndex:200, overflow:'hidden' }}>
                {/* Gradient header */}
                <div style={{ padding:'16px 18px', background:`linear-gradient(135deg,${TEAL},#0AB98A)` }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
                    <span style={{ fontSize:16, fontWeight:700, color:'#fff' }}>{initial}</span>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:2 }}>{firstName}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userEmail}</div>
                </div>
                {[
                  { label:'Manage account', path:'/settings' },
                  { label:'Billing',        path:'/billing'  },
                  { label:'Help',           path:'/help'     },
                ].map(item => (
                  <div
                    key={item.label}
                    onClick={() => { navigate(item.path); setShowProfile(false); }}
                    style={{ padding:'11px 18px', fontSize:13, color:'#334155', cursor:'pointer', transition:'all 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.color=ACCENT; }}
                    onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#334155'; }}
                  >
                    {item.label}
                  </div>
                ))}
                <div style={{ borderTop:'1px solid #F1F5F9' }}>
                  <div
                    onClick={() => { setShowProfile(false); onLogout(); }}
                    style={{ padding:'11px 18px', fontSize:13, color:'#EF4444', cursor:'pointer', transition:'all 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    Sign out
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Nova sparkle */}
        <button
          onClick={() => setShowNova(p => !p)}
          style={{ width:34, height:34, borderRadius:'50%', background:showNova?'rgba(10,185,138,0.1)':'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:2, flexShrink:0, transition:'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(10,185,138,0.1)'}
          onMouseLeave={e => { if (!showNova) e.currentTarget.style.background='none'; }}
          title="Ask Nova"
        >
          <Sparkles size={18} color={showNova?ACCENT:'#64748B'}/>
        </button>
      </div>
    </div>
  );
}