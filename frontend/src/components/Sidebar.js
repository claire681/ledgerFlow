import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ArrowLeftRight,
  PieChart, Receipt, Percent, RefreshCw,
  BarChart3, ScanLine, Link2,
  Users, LogOut, ShieldCheck, TrendingUp,
  BarChart2, GitMerge, CreditCard, BookOpen,
  GitCompare, Settings, HelpCircle, X, Send,
  AlertCircle, CheckCircle,
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
const BASE     = 'https://api.getnovala.com/api/v1';
const getToken = () => localStorage.getItem('token') || '';

const NAV = [
  {
    section: 'Core',
    items: [
      { path:'/',             label:'Dashboard',    icon:LayoutDashboard },
      { path:'/documents',    label:'Documents',    icon:FileText        },
      { path:'/transactions', label:'Transactions', icon:ArrowLeftRight  },
    ],
  },
  {
    section: 'Finance',
    items: [
      { path:'/reports',        label:'Reports',        icon:BarChart2,  badge:'NEW' },
      { path:'/reconciliation', label:'Reconciliation', icon:GitMerge               },
      { path:'/ledger',         label:'Ledger View',    icon:BookOpen               },
      { path:'/variance',       label:'Variance',       icon:TrendingUp             },
      { path:'/billpay',        label:'Bill Pay',       icon:CreditCard             },
      { path:'/budgets',        label:'Budgets',        icon:PieChart               },
      { path:'/invoices',       label:'Invoices',       icon:Receipt                },
      { path:'/tax',            label:'Tax',            icon:Percent                },
      { path:'/billing',        label:'Billing',        icon:CreditCard             },
      { path:'/currency',       label:'Currency',       icon:RefreshCw              },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { path:'/vendors',    label:'Vendors',     icon:BarChart3, badge:null },
      { path:'/receipts',   label:'Scanner',     icon:ScanLine,  badge:'AI' },
      { path:'/comparison', label:'Doc Compare', icon:GitCompare            },
    ],
  },
  {
    section: 'Organization',
    items: [
      { path:'/team',         label:'Team',         icon:Users },
      { path:'/integrations', label:'Integrations', icon:Link2 },
    ],
  },
];

const ROLES = {
  admin:      { label:'Admin',      color:'#0AB98A' },
  accountant: { label:'Accountant', color:'#60A5FA' },
  staff:      { label:'Staff',      color:'#94A3B8' },
  viewer:     { label:'Viewer',     color:'#94A3B8' },
};

const LogoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="19" cy="9" r="2" fill="#0F172A"/>
    <circle cx="3"  cy="16" r="1.5" fill="#0F172A" opacity="0.6"/>
  </svg>
);

function HelpModal({ onClose }) {
  const [category, setCategory] = useState('General');
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState('');

  const CATEGORIES = ['General', 'Billing', 'Bug Report', 'Feature Request', 'Account'];

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true); setError('');
    try {
      const email = localStorage.getItem('user_email') || 'Unknown';
      const res   = await fetch(`${BASE}/support/send`, {
        method:  'POST',
        headers: { Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body:    JSON.stringify({ category, subject, message, user_email: email }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
      setTimeout(() => { setSent(false); onClose(); }, 3000);
    } catch (e) {
      setError('Could not send message. Please try again.');
    } finally { setSending(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', padding:16 }}>
      <div style={{ background:'#1E293B', borderRadius:16, width:'100%', maxWidth:440, boxShadow:'0 24px 60px rgba(0,0,0,0.4)', border:`1px solid ${BORDER}`, overflow:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 24px', borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <HelpCircle size={16} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:TEXT }}>Help & Support</div>
              <div style={{ fontSize:11, color:TEXT_SUB }}>We usually reply within 24 hours</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:TEXT_SUB, display:'flex' }}>
            <X size={18}/>
          </button>
        </div>

        <div style={{ padding:'20px 24px' }}>
          {sent ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ width:56, height:56, borderRadius:16, background:'rgba(10,185,138,0.1)', border:'1px solid rgba(10,185,138,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <CheckCircle size={26} color={ACCENT}/>
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:TEXT, marginBottom:6 }}>Message Sent!</div>
              <div style={{ fontSize:12, color:TEXT_SUB }}>We will get back to you within 24 hours.</div>
            </div>
          ) : (
            <>
              {/* Category */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:700, color:TEXT_SUB, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Category</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)}
                      style={{ padding:'5px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:600, border:'1px solid', fontFamily:FONT, borderColor:category===c?ACCENT:BORDER, background:category===c?'rgba(10,185,138,0.15)':'transparent', color:category===c?ACCENT:TEXT_SUB }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:700, color:TEXT_SUB, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Subject</div>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of your issue..."
                  style={{ width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.05)', border:`1px solid ${BORDER}`, borderRadius:8, color:TEXT, fontSize:13, fontFamily:FONT, outline:'none', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor=ACCENT}
                  onBlur={e  => e.target.style.borderColor=BORDER}/>
              </div>

              {/* Message */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:700, color:TEXT_SUB, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Message</div>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your problem in detail..." rows={4}
                  style={{ width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.05)', border:`1px solid ${BORDER}`, borderRadius:8, color:TEXT, fontSize:13, fontFamily:FONT, outline:'none', resize:'vertical', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor=ACCENT}
                  onBlur={e  => e.target.style.borderColor=BORDER}/>
              </div>

              {error && (
                <div style={{ padding:'10px 12px', borderRadius:8, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', fontSize:12, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                  <AlertCircle size={13}/>{error}
                </div>
              )}

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={onClose}
                  style={{ flex:1, padding:'10px', borderRadius:8, background:'transparent', border:`1px solid ${BORDER}`, color:TEXT_SUB, cursor:'pointer', fontSize:13, fontFamily:FONT }}>
                  Cancel
                </button>
                <button onClick={handleSend} disabled={sending||!subject.trim()||!message.trim()}
                  style={{ flex:1, padding:'10px', borderRadius:8, background:sending||!subject.trim()||!message.trim()?'#334155':ACCENT, color:'#fff', border:'none', cursor:sending||!subject.trim()||!message.trim()?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                  <Send size={13}/>{sending?'Sending...':'Send Message'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ onLogout, onNavigate }) {
  const navigate        = useNavigate();
  const location        = useLocation();
  const [hov,  setHov]  = useState(null);
  const [help, setHelp] = useState(false);

  const role    = localStorage.getItem('user_role')  || 'admin';
  const email   = localStorage.getItem('user_email') || '';
  const rc      = ROLES[role] || ROLES.admin;
  const initial = email ? email[0].toUpperCase() : 'U';
  const name    = email.split('@')[0] || 'User';

  const bottomItems = [
  { label:'Settings', icon:Settings,   path:'/settings', onClick: () => { navigate('/settings'); onNavigate && onNavigate(); } },
  { label:'Help',     icon:HelpCircle, path:'/help',     onClick: () => { navigate('/help'); onNavigate && onNavigate(); } },
];
  return (
    <>
      <aside style={{ width:244, minWidth:244, height:'100vh', background:BG, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', fontFamily:FONT }}>

        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:GRAD, zIndex:1 }}/>

        {/* Logo */}
        <div style={{ padding:'26px 20px 20px', borderBottom:`1px solid ${BORDER}`, marginTop:2 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 16px rgba(10,185,138,0.25)' }}>
              <LogoIcon/>
            </div>
            <div>
              <div style={{ fontSize:16.5, fontWeight:700, letterSpacing:'-0.01em', color:TEXT, lineHeight:1.1 }}>
                No<span style={{ color:ACCENT }}>vala</span>
              </div>
              <div style={{ fontSize:9, color:TEXT_DIM, letterSpacing:'0.16em', marginTop:4, fontWeight:500, textTransform:'uppercase' }}>
                AI Finance Platform
              </div>
            </div>
          </div>
        </div>

        {/* User card */}
        <div style={{ margin:'14px 14px 2px', padding:'11px 13px', background:'rgba(255,255,255,0.03)', border:`1px solid ${BORDER}`, borderRadius:10, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#0F172A', flexShrink:0 }}>
            {initial}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:TEXT, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3, textTransform:'capitalize' }}>
              {name}
            </div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px 2px 6px', borderRadius:20, background:`${rc.color}18`, border:`1px solid ${rc.color}30` }}>
              <ShieldCheck size={9} color={rc.color}/>
              <span style={{ fontSize:9, fontWeight:600, color:rc.color, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                {rc.label}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex:1, overflowY:'auto', padding:'6px 10px 4px', scrollbarWidth:'none' }}>
          {NAV.map(group => (
            <div key={group.section} style={{ marginBottom:4 }}>
              <div style={{ fontSize:9, fontWeight:600, color:TEXT_DIM, letterSpacing:'0.18em', textTransform:'uppercase', padding:'12px 8px 5px' }}>
                {group.section}
              </div>
              {group.items.map(item => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                const isHov = hov === item.path;
                const Icon  = item.icon;
                return (
                  <div key={item.path}
                    onClick={() => { navigate(item.path); onNavigate && onNavigate(); }}
                    onMouseEnter={() => setHov(item.path)}
                    onMouseLeave={() => setHov(null)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'8.5px 10px', borderRadius:8, cursor:'pointer', marginBottom:1, background:isActive?ACTIVE:isHov?HOVER:'transparent', borderLeft:`2px solid ${isActive?ACCENT:'transparent'}`, transition:'all 0.12s ease' }}>
                    <Icon size={15} color={isActive?ACCENT:isHov?TEXT_SUB:TEXT_DIM} strokeWidth={isActive?2.5:1.8} style={{ flexShrink:0 }}/>
                    <span style={{ fontSize:12.5, fontWeight:isActive?500:400, color:isActive?ACCENT:isHov?TEXT_SUB:TEXT_DIM, flex:1, letterSpacing:'0.01em' }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span style={{ fontSize:8, fontWeight:700, color:item.badge==='NEW'?'#fff':ACCENT, background:item.badge==='NEW'?ACCENT:ACTIVE, border:`1px solid ${item.badge==='NEW'?ACCENT:ACCENT+'35'}`, padding:'1px 6px', borderRadius:20, letterSpacing:'0.05em' }}>
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
        <div style={{ padding:'8px 14px 22px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:`1px solid ${BORDER}`, marginBottom:8 }}>
            <TrendingUp size={13} color={ACCENT}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, fontWeight:500, color:TEXT_SUB }}>Novala AI Online</div>
              <div style={{ fontSize:9, color:TEXT_DIM, marginTop:1 }}>GPT-4o · Gemini 1.5</div>
            </div>
            <div style={{ width:6, height:6, borderRadius:'50%', background:ACCENT, boxShadow:`0 0 6px ${ACCENT}` }}/>
          </div>

          {/* Settings and Help */}
          {bottomItems.map(item => {
            const isActive = location.pathname === item.path;
            const isHov    = hov === item.label;
            const Icon     = item.icon;
            return (
              <div key={item.label}
                onClick={item.onClick}
                onMouseEnter={() => setHov(item.label)}
                onMouseLeave={() => setHov(null)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, cursor:'pointer', marginBottom:4, background:isActive?ACTIVE:isHov?HOVER:'transparent', borderLeft:`2px solid ${isActive?ACCENT:'transparent'}`, transition:'all 0.12s ease' }}>
                <Icon size={15} color={isActive?ACCENT:isHov?TEXT_SUB:TEXT_DIM} strokeWidth={1.8} style={{ flexShrink:0 }}/>
                <span style={{ fontSize:12.5, color:isActive?ACCENT:isHov?TEXT_SUB:TEXT_DIM, letterSpacing:'0.01em' }}>
                  {item.label}
                </span>
              </div>
            );
          })}

          <button onClick={onLogout}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.07)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.18)'; e.currentTarget.style.color='#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.color=TEXT_DIM; }}
            style={{ width:'100%', padding:'9px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:400, color:TEXT_DIM, background:'transparent', border:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'center', gap:7, transition:'all 0.15s', fontFamily:FONT }}>
            <LogOut size={13}/> Sign out
          </button>
        </div>
      </aside>

      {help && <HelpModal onClose={() => setHelp(false)}/>}
    </>
  );
}