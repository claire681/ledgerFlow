import React, { useState, useEffect, useRef } from 'react';
import CompanyProfileBanner from "../components/company/CompanyProfileBanner";
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, RefreshCw, DollarSign,
  FileText, ArrowLeftRight, Receipt, PieChart,
  Users, BarChart2, Sliders, Eye, ChevronRight, ChevronLeft,
  Plus, MoreHorizontal, Info, X, Search, Star,
  ShoppingCart, UserCheck, Briefcase, ClipboardList,
  Calendar, Clock, Pause, Play, Save, Bell,
  Building2, CreditCard, Percent, Package,
  ChevronDown,
  Landmark, Wallet, BarChart3, Tag, Zap,
  BookOpen, GitMerge, ScanLine, Link2, Coffee,
  SlidersHorizontal, Megaphone,
} from 'lucide-react';
import { getFirstName } from '../utils/userDisplay';
import TrialBanner from '../components/TrialBanner';

const ACCENT  = '#0AB98A';
const FONT    = "'Inter', -apple-system, sans-serif";
const API     = 'https://api.getnovala.com/api/v1';

const fmt = (n) => {
  const num = parseFloat(n) || 0;
  return (num < 0 ? '-$' : '$') + Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const NAV_CATS = [
  { label: 'Accounting',          icon: BookOpen,   color: '#0AB98A', bg: '#E6F7F2', path: '/reconciliation' },
  { label: 'Expenses & Pay Bills',icon: Receipt,    color: '#EF4444', bg: '#FEE2E2', path: '/transactions'   },
  { label: 'Sales & Get Paid',    icon: TrendingUp, color: '#3B82F6', bg: '#DBEAFE', path: '/invoices'       },
  { label: 'Customer Hub',        icon: UserCheck,  color: '#0AB98A', bg: '#E6F7F2', path: '/customers'      },
  { label: 'Payroll',             icon: Wallet,     color: '#8B5CF6', bg: '#EDE9FE', path: '/team'           },
  { label: 'Team',                icon: Users,      color: '#6366F1', bg: '#E0E7FF', path: '/team'           },
  { label: 'Sales Tax',           icon: Percent,    color: '#F59E0B', bg: '#FEF3C7', path: '/tax'            },
  { label: 'Marketing',           icon: Megaphone,  color: '#F97316', bg: '#FFF7ED', path: '/marketing'      },
];

const ALL_CREATE_ACTIONS = [
  { label: 'Create invoice',         path: '/invoices',     cat: 'Customers', fav: true  },
  { label: 'Create sales receipt',   path: '/invoices',     cat: 'Customers', fav: true  },
  { label: 'Get paid online',        path: '/invoices',     cat: 'Customers', fav: false },
  { label: 'Record payment',         path: '/transactions', cat: 'Customers', fav: false },
  { label: 'Create estimate',        path: '/invoices',     cat: 'Customers', fav: false },
  { label: 'Add customer',           path: '/customers',    cat: 'Customers', fav: false },
  { label: 'Record expense',         path: '/transactions', cat: 'Suppliers', fav: true  },
  { label: 'Create bill',            path: '/billpay',      cat: 'Suppliers', fav: false },
  { label: 'Pay bills',              path: '/billpay',      cat: 'Suppliers', fav: true  },
  { label: 'Add supplier',           path: '/vendors',      cat: 'Suppliers', fav: false },
  { label: 'Run payroll',            path: '/team',         cat: 'Payroll',   fav: true  },
  { label: 'Add employee',           path: '/team',         cat: 'Payroll',   fav: false },
  { label: 'Add time entry',         path: '/team',         cat: 'Payroll',   fav: false },
  { label: 'Upload document',        path: '/documents',    cat: 'Business',  fav: false },
  { label: 'Add bank deposit',       path: '/transactions', cat: 'Business',  fav: false },
  { label: 'Create journal entry',   path: '/ledger',       cat: 'Business',  fav: false },
  { label: 'Add product or service', path: '/inventory',    cat: 'Business',  fav: false },
  { label: 'Create tax return',      path: '/tax',          cat: 'Tax',       fav: false },
  { label: 'Download tax summary',   path: '/tax',          cat: 'Tax',       fav: false },
];

const QUICK_CREATE = [
  { label: 'Create invoice',       path: '/invoices'     },
  { label: 'Create sales receipt', path: '/invoices'     },
  { label: 'Run payroll',          path: '/team'         },
  { label: 'Get paid online',      path: '/invoices'     },
  { label: 'Record expense',       path: '/transactions' },
];

const FREQUENCIES = [
  { value: 'daily',   label: 'Daily',         desc: 'Every day'                    },
  { value: 'every7',  label: 'Every 7 days',  desc: 'Once a week'                  },
  { value: 'every14', label: 'Every 14 days', desc: 'Every two weeks'              },
  { value: 'monthly', label: 'Monthly',       desc: 'Once a month on chosen date'  },
  { value: 'yearly',  label: 'Yearly',        desc: 'Once a year on chosen date'   },
  { value: 'custom',  label: 'Custom',        desc: 'Set your own interval in days'},
];

const HOURS = Array.from({ length: 19 }, (_, i) => {
  const h = i + 5;
  const ampm = h < 12 ? 'AM' : 'PM';
  const disp = h === 12 ? 12 : h > 12 ? h - 12 : h;
  return { value: h + ':00', label: disp + ':00 ' + ampm };
});

const TIMEZONES = [
  'America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
  'America/Toronto','America/Vancouver','America/Edmonton','America/Halifax',
  'Europe/London','Europe/Paris','Europe/Berlin',
  'Africa/Lagos','Africa/Nairobi','Africa/Johannesburg','Africa/Cairo',
  'Asia/Dubai','Asia/Kolkata','Asia/Singapore','Asia/Tokyo',
  'Australia/Sydney','Pacific/Auckland','UTC',
];

function BriefingModal({ onClose, onSave, initial }) {
  const [enabled,    setEnabled]    = useState(initial?.enabled    ?? true);
  const [paused,     setPaused]     = useState(initial?.paused     ?? false);
  const [frequency,  setFrequency]  = useState(initial?.frequency  ?? 'daily');
  const [time,       setTime]       = useState(initial?.time       ?? '8:00');
  const [timezone,   setTimezone]   = useState(initial?.timezone   ?? 'America/New_York');
  const [startDate,  setStartDate]  = useState(initial?.startDate  ?? new Date().toISOString().split('T')[0]);
  const [customDays, setCustomDays] = useState(initial?.customDays ?? 3);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const settings = { enabled, paused, frequency, time, timezone, startDate, customDays };
    try {
      await fetch(API + '/briefing/settings', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefing_enabled: enabled && !paused, briefing_time: time, briefing_timezone: timezone, briefing_frequency: frequency, briefing_start: startDate, briefing_interval: customDays }),
      });
    } catch (e) { console.error(e); }
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); onSave(settings); }, 800);
  };

  const sel = { width:'100%', padding:'9px 12px', background:'#F8FAFC', border:'1px solid #E5E7EB', borderRadius:8, color:'#0F172A', fontSize:13, fontFamily:FONT, outline:'none' };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.15)' }}>
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(10,185,138,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Bell size={18} color={ACCENT}/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#0F172A' }}>Morning Briefing</div>
              <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>Schedule your daily business summary</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex' }}><X size={20}/></button>
        </div>
        <div style={{ padding:'20px 24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', background:'#F8FAFC', borderRadius:10, border:'1px solid #E5E7EB', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>Enable Morning Briefing</div>
              <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>Receive a business summary by email</div>
            </div>
            <div onClick={() => setEnabled(p => !p)} style={{ width:44, height:24, borderRadius:12, background:enabled?ACCENT:'#E2E8F0', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
              <div style={{ position:'absolute', top:4, left:enabled?22:4, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
            </div>
          </div>
          {enabled && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:paused?'rgba(245,158,11,0.06)':'rgba(10,185,138,0.04)', borderRadius:10, border:'1px solid '+(paused?'rgba(245,158,11,0.2)':'rgba(10,185,138,0.15)'), marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{paused?'Briefing is paused':'Briefing is active'}</div>
                  <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{paused?'Click Resume to start receiving briefings again':'You are receiving scheduled briefings'}</div>
                </div>
                <button onClick={() => setPaused(p => !p)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, background:paused?'rgba(10,185,138,0.1)':'rgba(245,158,11,0.1)', border:'1px solid '+(paused?'rgba(10,185,138,0.2)':'rgba(245,158,11,0.2)'), color:paused?ACCENT:'#F59E0B', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:FONT }}>
                  {paused ? <><Play size={12}/> Resume</> : <><Pause size={12}/> Pause</>}
                </button>
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Frequency</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {FREQUENCIES.map(f => (
                    <div key={f.value} onClick={() => setFrequency(f.value)} style={{ padding:'10px 12px', borderRadius:8, border:'1px solid '+(frequency===f.value?'rgba(10,185,138,0.4)':'#E5E7EB'), background:frequency===f.value?'rgba(10,185,138,0.06)':'#fff', cursor:'pointer', transition:'all 0.15s' }}>
                      <div style={{ fontSize:12, fontWeight:600, color:frequency===f.value?ACCENT:'#0F172A', marginBottom:2 }}>{f.label}</div>
                      <div style={{ fontSize:10, color:'#64748B' }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              {frequency === 'custom' && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Interval (days)</div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <input type="number" min={1} max={365} value={customDays} onChange={e => setCustomDays(Math.max(1, parseInt(e.target.value)||1))} style={{ ...sel, width:100 }}/>
                    <span style={{ fontSize:13, color:'#64748B' }}>days between briefings</span>
                  </div>
                </div>
              )}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>{frequency==='monthly'||frequency==='yearly'?'Date':'Start Date'}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Calendar size={16} color="#94A3B8"/>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...sel, flex:1 }} onFocus={e => e.target.style.borderColor=ACCENT} onBlur={e => e.target.style.borderColor='#E5E7EB'}/>
                </div>
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Time</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Clock size={16} color="#94A3B8"/>
                  <select value={time} onChange={e => setTime(e.target.value)} style={{ ...sel, flex:1 }}>
                    {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Timezone</div>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} style={sel}>
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div style={{ padding:'12px 16px', background:'rgba(10,185,138,0.04)', border:'1px solid rgba(10,185,138,0.15)', borderRadius:10, marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:600, color:ACCENT, marginBottom:6 }}>Schedule Summary</div>
                <div style={{ fontSize:12, color:'#334155', lineHeight:1.8 }}>
                  {paused?'Briefing is currently paused.':frequency==='daily'?'Every day at '+time:frequency==='every7'?'Every 7 days at '+time:frequency==='every14'?'Every 14 days at '+time:frequency==='monthly'?'Monthly on the '+(startDate?new Date(startDate).getDate():1)+'th at '+time:frequency==='yearly'?'Yearly on '+(startDate?new Date(startDate).toLocaleDateString('en-US',{month:'long',day:'numeric'}):'chosen date')+' at '+time:'Every '+customDays+' days at '+time}
                </div>
              </div>
            </>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:8, background:'transparent', border:'1px solid #E5E7EB', color:'#64748B', cursor:'pointer', fontSize:13, fontFamily:FONT }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ flex:2, padding:'11px', borderRadius:8, background:saving?'#E5E7EB':saved?'rgba(10,185,138,0.8)':ACCENT, color:saving?'#94A3B8':'#fff', border:'none', cursor:saving?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s' }}>
              <Save size={14}/>{saving?'Saving...':saved?'Saved!':'Save Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatePanel({ onClose, onNavigate }) {
  const [search,    setSearch]    = useState('');
  const [favorites, setFavorites] = useState(ALL_CREATE_ACTIONS.filter(a => a.fav).map(a => a.label));
  const toggleFav = (label) => setFavorites(prev => prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]);
  const filtered  = search.trim() ? ALL_CREATE_ACTIONS.filter(a => a.label.toLowerCase().includes(search.toLowerCase())) : ALL_CREATE_ACTIONS;
  const cats      = [...new Set(filtered.map(a => a.cat))];
  const favItems  = filtered.filter(a => favorites.includes(a.label));
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200, backdropFilter:'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ position:'absolute', top:0, right:0, width:380, height:'100vh', background:'#fff', boxShadow:'-8px 0 40px rgba(0,0,0,0.15)', display:'flex', flexDirection:'column', animation:'slideFromRight 0.25s ease' }}>
        <style>{`@keyframes slideFromRight { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)' }}>
          <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>Create actions</div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', color:'#fff', display:'flex', borderRadius:8, padding:6 }}><X size={18}/></button>
        </div>
        <div style={{ padding:'12px 20px', borderBottom:'1px solid #F1F5F9', flexShrink:0 }}>
          <div style={{ position:'relative' }}>
            <Search size={14} color="#94A3B8" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actions..." style={{ width:'100%', padding:'9px 10px 9px 32px', background:'#F8FAFC', border:'1px solid #E5E7EB', borderRadius:10, fontSize:13, fontFamily:FONT, outline:'none', boxSizing:'border-box', color:'#0F172A' }} onFocus={e => e.target.style.borderColor=ACCENT} onBlur={e => e.target.style.borderColor='#E5E7EB'}/>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', scrollbarWidth:'none' }}>
          {favItems.length > 0 && !search && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>⭐ Favourites</div>
              {favItems.map(item => <CreateItem key={item.label} item={item} isFav={true} onToggleFav={toggleFav} onNavigate={onNavigate} onClose={onClose}/>)}
            </div>
          )}
          {cats.map(cat => (
            <div key={cat} style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>{cat}</div>
              {filtered.filter(a => a.cat === cat).map(item => <CreateItem key={item.label} item={item} isFav={favorites.includes(item.label)} onToggleFav={toggleFav} onNavigate={onNavigate} onClose={onClose}/>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreateItem({ item, isFav, onToggleFav, onNavigate, onClose }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:hov?'#F0FDF9':'transparent', cursor:'pointer', marginBottom:2, transition:'all 0.12s', border:'1px solid '+(hov?'rgba(10,185,138,0.15)':'transparent') }}>
      <div onClick={() => { onNavigate(item.path); onClose(); }} style={{ flex:1, fontSize:13, color:hov?ACCENT:'#334155', fontWeight:500 }}>{item.label}</div>
      <button onClick={e => { e.stopPropagation(); onToggleFav(item.label); }} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', padding:2, opacity:isFav||hov?1:0, transition:'opacity 0.15s' }}>
        <Star size={13} color={isFav?'#F59E0B':'#CBD5E1'} fill={isFav?'#F59E0B':'none'}/>
      </button>
    </div>
  );
}

function MiniBar({ income, expenses }) {
  const total  = income + expenses || 1;
  const incPct = (income / total) * 100;
  const expPct = (expenses / total) * 100;
  return (
    <div style={{ marginTop:10 }}>
      <div style={{ display:'flex', gap:3, marginBottom:10, height:10, borderRadius:6, overflow:'hidden' }}>
        <div style={{ height:'100%', background:'linear-gradient(90deg,#0AB98A,#0DD9A3)', width:incPct+'%', minWidth:4, borderRadius:6 }}/>
        <div style={{ height:'100%', background:'linear-gradient(90deg,#3B82F6,#06B6D4)', width:expPct+'%', minWidth:4, borderRadius:6 }}/>
      </div>
      <div style={{ display:'flex', gap:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:10, height:10, borderRadius:3, background:'#0AB98A' }}/>
          <span style={{ fontSize:11, color:'#64748B', fontWeight:500 }}>Income {fmt(income)}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:10, height:10, borderRadius:3, background:'#94A3B8' }}/>
          <span style={{ fontSize:11, color:'#64748B', fontWeight:500 }}>Expenses {fmt(expenses)}</span>
        </div>
      </div>
    </div>
  );
}

function CashFlowBars({ data, tab }) {
  if (!data || data.length === 0) {
    return <div style={{ height:100, display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8', fontSize:13 }}>No cash flow data available</div>;
  }
  const values = data.map(d => {
    if (tab === 'money-in')  return Math.max(d.amount, 0);
    if (tab === 'money-out') return Math.abs(Math.min(d.amount, 0));
    return d.amount;
  });
  const max = Math.max(...values.map(Math.abs), 1);
  return (
    <div style={{ position:'relative' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:20, display:'flex', flexDirection:'column', justifyContent:'space-between', pointerEvents:'none' }}>
        {[100,75,50,25,0].map(pct => <div key={pct} style={{ borderTop:'1px dashed #F1F5F9', width:'100%' }}/>)}
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:100, padding:'0 2px', position:'relative' }}>
        {data.map((d, i) => {
          const v   = values[i];
          const h   = Math.max((Math.abs(v) / max) * 100, 3);
          const pos = tab === 'money-out' ? false : d.amount >= 0;
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:'100%', height:h+'%', background:pos?'linear-gradient(180deg,#CBD5E1,#94A3B8)':'linear-gradient(180deg,#E2E8F0,#CBD5E1)', borderRadius:'4px 4px 0 0', minHeight:4, cursor:'pointer', transition:'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity='0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}
              />
              <div style={{ fontSize:9, color:'#94A3B8', whiteSpace:'nowrap' }}>{d.month}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CashFlowCard({ data, balance, loading, onView, title, subtitle }) {
  const [tab,   setTab]   = useState('balance');
  const [range, setRange] = useState('6M');
  const moneyIn  = data.filter(d => d.amount > 0).reduce((s,d) => s + d.amount, 0);
  const moneyOut = data.filter(d => d.amount < 0).reduce((s,d) => s + Math.abs(d.amount), 0);
  return (
    <div style={{ background:'#fff', border:'1px solid #E8F0FE', borderRadius:16, padding:'24px 26px', marginBottom:24, boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'#0F172A', marginBottom:4 }}>{title || 'Cash Flow'}</div>
          {subtitle && <div style={{ fontSize:12, color:'#64748B' }}>{subtitle}</div>}
          <div style={{ fontSize:30, fontWeight:800, color:'#0F172A', letterSpacing:'-0.03em', marginTop:8 }}>{loading ? '—' : fmt(balance)}</div>
          <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>Today's cash balance</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {['1M','3M','6M','1Y'].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{ padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', border:'1px solid '+(range===r?ACCENT:'#E5E7EB'), background:range===r?'rgba(10,185,138,0.08)':'transparent', color:range===r?ACCENT:'#94A3B8', fontFamily:FONT, transition:'all 0.15s' }}>{r}</button>
          ))}
          <MoreHorizontal size={16} color="#CBD5E1" style={{ cursor:'pointer', marginLeft:4 }}/>
        </div>
      </div>
      <div style={{ display:'flex', gap:16, marginBottom:20, padding:'14px 16px', background:'#F8FAFC', borderRadius:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:'#94A3B8', fontWeight:600, marginBottom:4 }}>Money in</div>
          <div style={{ fontSize:18, fontWeight:800, color:'#0F172A' }}>{fmt(moneyIn)}</div>
        </div>
        <div style={{ width:1, background:'#E5E7EB' }}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:'#94A3B8', fontWeight:600, marginBottom:4 }}>Money out</div>
          <div style={{ fontSize:18, fontWeight:800, color:'#0F172A' }}>{fmt(moneyOut)}</div>
        </div>
        <div style={{ width:1, background:'#E5E7EB' }}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:'#94A3B8', fontWeight:600, marginBottom:4 }}>Net</div>
          <div style={{ fontSize:18, fontWeight:800, color:balance>=0?'#0AB98A':'#EF4444' }}>{fmt(balance)}</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {['balance','money-in','money-out'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'7px 16px', borderRadius:999, fontSize:12, fontWeight:600, cursor:'pointer', border:'1px solid '+(tab===t?ACCENT:'#E5E7EB'), background:tab===t?'rgba(10,185,138,0.1)':'#fff', color:tab===t?ACCENT:'#64748B', fontFamily:FONT, transition:'all 0.15s', boxShadow:tab===t?'0 2px 8px rgba(10,185,138,0.15)':'none' }}>
            {t === 'balance' ? 'Cash balance' : t === 'money-in' ? 'Money in' : 'Money out'}
          </button>
        ))}
      </div>
      {loading ? <div style={{ height:100, background:'linear-gradient(90deg,#F1F5F9,#E2E8F0)', borderRadius:8, animation:'pulse 1.5s infinite' }}/> : <CashFlowBars data={data} tab={tab}/>}
      <div style={{ display:'flex', gap:20, marginTop:16, paddingTop:16, borderTop:'1px solid #F1F5F9', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:12, height:12, borderRadius:3, background:'#94A3B8' }}/><span style={{ fontSize:12, color:'#64748B' }}>Income</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:12, height:12, borderRadius:3, background:'#CBD5E1' }}/><span style={{ fontSize:12, color:'#64748B' }}>Expenses</span>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <span onClick={onView} style={{ fontSize:13, color:ACCENT, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}
            onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
            View cash flow <ChevronRight size={14}/>
          </span>
        </div>
      </div>
    </div>
  );
}

function AddWidgetCard({ onAdd }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onAdd} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'#fff', border:'2px dashed '+(hov?ACCENT:'#CBD5E1'), borderRadius:16, padding:'24px 20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, cursor:'pointer', transition:'all 0.2s', minHeight:200 }}>
      <div style={{ fontSize:14, fontWeight:600, color:hov?ACCENT:'#374151' }}>Add widgets</div>
      <div style={{ width:44, height:44, borderRadius:'50%', background:hov?'rgba(10,185,138,0.1)':'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
        <Plus size={22} color={hov?ACCENT:'#9CA3AF'}/>
      </div>
      <div style={{ width:'60%', height:1, background:'#E5E7EB' }}/>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12, color:'#9CA3AF' }}>✨ Smart suggestions</span>
      </div>
      <div style={{ fontSize:11, color:'#CBD5E1', textAlign:'center', lineHeight:1.6, maxWidth:160 }}>
        Nothing new here yet. Check back later for new suggestions.
      </div>
      <Coffee size={16} color="#D1D5DB"/>
    </div>
  );
}

function DashCard({ label, subtitle, value, valueColor, trend, trendUp, children, footer, onFooter, loading, accentColor, topBorder }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'#fff', border:'1px solid #E8F0FE', borderRadius:16, padding:'22px 24px', display:'flex', flexDirection:'column', minWidth:0, transition:'all 0.2s', boxShadow:hov?'0 8px 32px rgba(0,0,0,0.1)':'0 2px 12px rgba(0,0,0,0.04)', transform:hov?'translateY(-2px)':'none', borderTop:topBorder?'3px solid '+topBorder:'1px solid #E8F0FE' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em', textTransform:'uppercase' }}>{label}</div>
        <MoreHorizontal size={16} color="#CBD5E1" style={{ cursor:'pointer', flexShrink:0 }}/>
      </div>
      {subtitle && <div style={{ fontSize:12, color:'#94A3B8', marginBottom:8 }}>{subtitle}</div>}
      {loading
        ? <div style={{ height:40, background:'linear-gradient(90deg,#F1F5F9,#E2E8F0)', borderRadius:8, animation:'pulse 1.5s infinite', marginBottom:10 }}/>
        : value !== undefined && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ fontSize:32, fontWeight:800, color:valueColor||'#0F172A', letterSpacing:'-0.03em', lineHeight:1 }}>{value}</div>
            <Info size={13} color="#CBD5E1"/>
          </div>
        )
      }
      {trend && (
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:20, background:trendUp?'rgba(10,185,138,0.1)':'rgba(239,68,68,0.1)' }}>
            {trendUp ? <TrendingUp size={12} color="#0AB98A"/> : <TrendingDown size={12} color="#EF4444"/>}
            <span style={{ fontSize:11, fontWeight:600, color:trendUp?'#0AB98A':'#EF4444' }}>{trend}</span>
          </div>
        </div>
      )}
      {children}
      {footer && (
        <div onClick={onFooter} style={{ fontSize:12, color:accentColor||ACCENT, fontWeight:600, cursor:'pointer', marginTop:'auto', paddingTop:14, borderTop:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:4 }}
          onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
          {footer} <ChevronRight size={12}/>
        </div>
      )}
    </div>
  );
}

function PillsRow({ navigate, isMobile, scrollTop, headerHeight, sidebarWidth }) {
  const navScrollRef = useRef(null);
  const [showLeft,  setShowLeft]  = useState(false);
  const [showRight, setShowRight] = useState(true);

  const GREETING_HEIGHT = 168;
  const isFixed = scrollTop > GREETING_HEIGHT;

  const updateChevrons = () => {
    const el = navScrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;
    updateChevrons();
    el.addEventListener('scroll', updateChevrons, { passive: true });
    window.addEventListener('resize', updateChevrons);
    return () => {
      el.removeEventListener('scroll', updateChevrons);
      window.removeEventListener('resize', updateChevrons);
    };
  }, []);

  const containerStyle = isFixed ? {
    position:'fixed', top:headerHeight, left:sidebarWidth, right:0, zIndex:35,
    background:'#fff', borderBottom:'1px solid #E5E7EB',
    boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
    paddingTop:10, paddingBottom:10,
    paddingLeft:isMobile?16:32, paddingRight:isMobile?16:32,
    transition:'background 0.2s, box-shadow 0.2s',
  } : {
    position:'relative', background:'transparent',
    borderBottom:'1px solid transparent',
    marginBottom:32,
    marginLeft:isMobile?-16:-32, marginRight:isMobile?-16:-32,
    paddingLeft:isMobile?16:32, paddingRight:isMobile?16:32,
    paddingTop:10, paddingBottom:10,
    transition:'background 0.2s, box-shadow 0.2s',
  };

  return (
    <>
      <div style={containerStyle}>
        <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
          {showLeft && (
            <>
              <div style={{ position:'absolute', left:32, top:0, bottom:0, width:48, background:`linear-gradient(to right,${isFixed?'#fff':'#F8FAFC'},transparent)`, zIndex:9, pointerEvents:'none' }}/>
              <div onClick={() => navScrollRef.current?.scrollBy({ left:-240, behavior:'smooth' })}
                style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, background:isFixed?'#fff':'#F8FAFC', border:'1px solid #E5E7EB', borderRadius:'50%', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.10)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='#0AB98A'}
                onMouseLeave={e => e.currentTarget.style.borderColor='#E5E7EB'}>
                <ChevronLeft size={15} color="#374151"/>
              </div>
            </>
          )}
          {showRight && (
            <>
              <div style={{ position:'absolute', right:32, top:0, bottom:0, width:48, background:`linear-gradient(to left,${isFixed?'#fff':'#F8FAFC'},transparent)`, zIndex:9, pointerEvents:'none' }}/>
              <div onClick={() => navScrollRef.current?.scrollBy({ left:240, behavior:'smooth' })}
                style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, background:isFixed?'#fff':'#F8FAFC', border:'1px solid #E5E7EB', borderRadius:'50%', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.10)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='#0AB98A'}
                onMouseLeave={e => e.currentTarget.style.borderColor='#E5E7EB'}>
                <ChevronRight size={15} color="#374151"/>
              </div>
            </>
          )}
          <div ref={navScrollRef} onScroll={updateChevrons}
            style={{ display:'flex', gap:10, overflowX:'auto', scrollbarWidth:'none', msOverflowStyle:'none', WebkitOverflowScrolling:'touch', padding:'4px 2px', alignItems:'center', flexWrap:'nowrap', width:'100%' }}>
            {NAV_CATS.map(cat => {
              const Icon     = cat.icon;
              const isActive = window.location.pathname === cat.path;
              return (
                <div key={cat.label} onClick={() => navigate(cat.path)}
                  style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 18px', background:isActive?cat.bg:'#F8FAFC', border:'1px solid '+(isActive?cat.color+'40':'#E5E7EB'), borderRadius:999, cursor:'pointer', flexShrink:0, transition:'all 0.18s ease', whiteSpace:'nowrap', boxShadow:isActive?'0 2px 10px '+cat.color+'20':'0 1px 4px rgba(0,0,0,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.background=cat.bg; e.currentTarget.style.borderColor=cat.color+'40'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 14px '+cat.color+'25'; }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'; } e.currentTarget.style.transform='none'; }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:cat.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={15} color={cat.color} strokeWidth={2.2}/>
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:isActive?cat.color:'#374151' }}>{cat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {isFixed && <div style={{ height:62, marginBottom:32 }}/>}
    </>
  );
}
export default function Dashboard() {
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');

  const rawName     = localStorage.getItem('user_name') || localStorage.getItem('full_name') || localStorage.getItem('user_email') || '';
  const userEmail   = localStorage.getItem('user_email') || '';
  const company     = localStorage.getItem('company_name') || 'My Business';
  const savedFirst  = localStorage.getItem('first_name') || '';
  const displayName = savedFirst || getFirstName(rawName || userEmail);

  const [stats,            setStats]            = useState(null);
  const [txns,             setTxns]             = useState([]);
  const [invoices,         setInvoices]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [refresh,          setRefresh]          = useState(0);
  const [showBriefing,     setShowBriefing]     = useState(false);
  const [briefingSettings, setBriefingSettings] = useState(null);
  const [showCreatePanel,  setShowCreatePanel]  = useState(false);
  const [isMobile,         setIsMobile]         = useState(window.innerWidth < 768);
  const [scrollTop,        setScrollTop]        = useState(0);
  const pageRef  = useRef(null);
  const headers  = { Authorization: 'Bearer ' + token };

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const briefingOn     = briefingSettings?.enabled && !briefingSettings?.paused;
  const briefingPaused = briefingSettings?.paused;

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    pageRef.current = main;
    const onScroll = () => setScrollTop(main.scrollTop);
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetch(API + '/dashboard/stats',   { headers }).then(r => r.json()),
      fetch(API + '/transactions/',     { headers }).then(r => r.json()),
      fetch(API + '/invoices/',         { headers }).then(r => r.json()),
      fetch(API + '/briefing/settings', { headers }).then(r => r.json()),
    ]).then(([statsRes, txnsRes, invRes, briefRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (txnsRes.status  === 'fulfilled') { const t = txnsRes.value; setTxns(Array.isArray(t)?t:(t.transactions||t.items||t.data||[])); }
      if (invRes.status   === 'fulfilled') { const v = invRes.value;  setInvoices(Array.isArray(v)?v:(v.invoices||v.items||v.data||[])); }
      if (briefRes.status === 'fulfilled') {
        const b = briefRes.value;
        setBriefingSettings({ enabled:b.briefing_enabled??false, paused:b.briefing_paused??false, frequency:b.briefing_frequency||'daily', time:b.briefing_time||'8:00', timezone:b.briefing_timezone||'America/New_York', startDate:b.briefing_start||new Date().toISOString().split('T')[0], customDays:b.briefing_interval||3 });
      }
    }).finally(() => setLoading(false));
  }, [refresh]);

  const revenue   = stats?.total_revenue || stats?.revenue || stats?.income || txns.filter(t => parseFloat(t.amount||0) > 0).reduce((s,t) => s + Math.abs(parseFloat(t.amount||0)), 0);
  const expenses  = stats?.total_expenses || stats?.expenses || txns.filter(t => parseFloat(t.amount||0) < 0).reduce((s,t) => s + Math.abs(parseFloat(t.amount||0)), 0);
  const netProfit = stats?.net_profit || stats?.profit || (revenue - expenses);
  const profitUp  = netProfit >= 0;
  const unpaidInv = invoices.filter(inv => ['unpaid','pending','sent'].includes((inv.status||'').toLowerCase()));

  const cashFlowMap = {};
  txns.forEach(t => {
    const date = new Date(t.date || t.created_at || t.transaction_date || Date.now());
    const key  = date.toLocaleString('default', { month:'short', year:'2-digit' });
    cashFlowMap[key] = (cashFlowMap[key]||0) + parseFloat(t.amount||0);
  });
  const cashFlowData = Object.entries(cashFlowMap).slice(-8).map(([month,amount]) => ({ month, amount }));

  const promoDismissed = localStorage.getItem('nova_banner_dismissed') === 'true';
  const headerHeight   = (promoDismissed ? 0 : 40) + 64;
  const sidebarWidth   = isMobile ? 0 : 80;

  return (
    <div style={{ background:'#F8FAFC', minHeight:'100vh', fontFamily:FONT }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .action-chip:hover { background:#E8F7F3 !important; color:#0AB98A !important; border-color:rgba(10,185,138,0.3) !important; }
        div::-webkit-scrollbar { display:none; }
      `}</style>

      {showBriefing    && <BriefingModal onClose={() => setShowBriefing(false)} onSave={s => { setBriefingSettings(s); setShowBriefing(false); }} initial={briefingSettings}/>}
      {showCreatePanel && <CreatePanel  onClose={() => setShowCreatePanel(false)} onNavigate={navigate}/>}

      <div style={{ maxWidth:1600, margin:'0', width:'100%', padding:isMobile?'32px 16px':'48px 32px 32px' }}>

          <CompanyProfileBanner />


        {/* ── GREETING ── */}
        <div style={{ position:'relative', textAlign:'center', marginBottom:32 }}>
          {!isMobile && (
            <div style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center', gap:24 }}>
              <button onClick={() => navigate('/settings')}
                style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'#6B7280', fontSize:13, fontFamily:FONT, transition:'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color='#0F172A'}
                onMouseLeave={e => e.currentTarget.style.color='#6B7280'}>
                <SlidersHorizontal size={15}/> Customize
              </button>
              <button style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'#6B7280', fontSize:13, fontFamily:FONT, transition:'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color='#0F172A'}
                onMouseLeave={e => e.currentTarget.style.color='#6B7280'}>
                <Eye size={15}/> Privacy
              </button>
            </div>
          )}
          <h1 style={{ fontSize:isMobile?24:32, fontWeight:600, color:'#0F172A', margin:0, letterSpacing:'-0.02em' }}>
            {greeting}, {displayName}!
          </h1>
          {briefingPaused && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:10, padding:'6px 14px', borderRadius:20, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', fontSize:12, color:'#F59E0B' }}>
              Morning Briefing is paused.
              <span onClick={() => setShowBriefing(true)} style={{ fontWeight:700, cursor:'pointer', textDecoration:'underline' }}>Resume</span>
            </div>
          )}
        </div>

        {/* ── PILLS ROW ── */}
        <TrialBanner />

        <PillsRow
          navigate={navigate}
          isMobile={isMobile}
          scrollTop={scrollTop}
          headerHeight={headerHeight}
          sidebarWidth={sidebarWidth}
        />

        {/* ── CREATE ACTIONS ── */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24, flexWrap:'wrap' }}>
          <span style={{ fontSize:13, fontWeight:600, color:'#374151', marginRight:4 }}>Create actions</span>
          {QUICK_CREATE.map(action => (
            <div key={action.label} className="action-chip" onClick={() => navigate(action.path)}
              style={{ padding:'7px 16px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:999, cursor:'pointer', fontSize:12, fontWeight:500, color:'#475569', transition:'all 0.15s', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
              {action.label}
            </div>
          ))}
          <span onClick={() => setShowCreatePanel(true)}
            style={{ fontSize:12, color:ACCENT, fontWeight:600, cursor:'pointer', marginLeft:4 }}
            onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
            Show all
          </span>
        </div>

        {/* ══ SECTION A ══ */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:20, fontWeight:700, color:'#0F172A', letterSpacing:'-0.02em' }}>Business at a glance</div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(4,1fr)', gap:16, marginBottom:20 }}>

          {/* Card 1 — P&L */}
          <div onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.04)'; }}
            style={{ background:'#fff', border:'1px solid #E8F0FE', borderTop:'3px solid #E2E8F0', borderRadius:16, padding:'22px 24px', display:'flex', flexDirection:'column', minWidth:0, transition:'all 0.2s', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em', textTransform:'uppercase' }}>Profit & Loss</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ fontSize:11, color:'#64748B', cursor:'pointer', display:'flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:6, border:'1px solid #E5E7EB', background:'#F8FAFC' }}>
                  Last month <ChevronDown size={11} color="#94A3B8"/>
                </div>
                <MoreHorizontal size={16} color="#CBD5E1" style={{ cursor:'pointer' }}/>
              </div>
            </div>
            <div style={{ fontSize:12, color:'#94A3B8', marginBottom:8 }}>Net profit this month</div>
            {loading
              ? <div style={{ height:40, background:'linear-gradient(90deg,#F1F5F9,#E2E8F0)', borderRadius:8, animation:'pulse 1.5s infinite', marginBottom:10 }}/>
              : (
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <div style={{ fontSize:32, fontWeight:800, color:'#0F172A', letterSpacing:'-0.03em', lineHeight:1 }}>{fmt(netProfit)}</div>
                  <Info size={13} color="#CBD5E1"/>
                  <div style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:profitUp?'rgba(10,185,138,0.1)':'rgba(239,68,68,0.1)', color:profitUp?'#0AB98A':'#EF4444' }}>
                    {profitUp?'↑':'↓'} {profitUp?'73%':'12%'}
                  </div>
                </div>
              )
            }
            {!loading && (
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:20, background:profitUp?'rgba(10,185,138,0.1)':'rgba(239,68,68,0.1)' }}>
                  {profitUp ? <TrendingUp size={12} color="#0AB98A"/> : <TrendingDown size={12} color="#EF4444"/>}
                  <span style={{ fontSize:11, fontWeight:600, color:profitUp?'#0AB98A':'#EF4444' }}>{profitUp?'Up':'Down'} vs prior month</span>
                </div>
              </div>
            )}
            {!loading && (
              <div style={{ marginBottom:12 }}>
                <div style={{ height:10, borderRadius:6, overflow:'hidden', display:'flex', marginBottom:8 }}>
                  <div style={{ background:'linear-gradient(90deg,#0AB98A,#0DD9A3)', width:revenue+expenses>0?(revenue/(revenue+expenses)*100)+'%':'50%', minWidth:4 }}/>
                  <div style={{ background:'#E2E8F0', flex:1, minWidth:4 }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:'#0AB98A' }}/>
                    <span style={{ fontSize:10, color:'#64748B' }}>Income {fmt(revenue)}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:'#CBD5E1' }}/>
                    <span style={{ fontSize:10, color:'#64748B' }}>Expenses {fmt(expenses)}</span>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto', paddingTop:14, borderTop:'1px solid #F1F5F9' }}>
              <div onClick={() => navigate('/transactions')} style={{ fontSize:12, color:ACCENT, fontWeight:600, cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                Categorize {txns.length} transactions
              </div>
              <MoreHorizontal size={14} color="#CBD5E1" style={{ cursor:'pointer' }}/>
            </div>
          </div>

          {/* Card 2 — Expenses */}
          <div onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.04)'; }}
            style={{ background:'#fff', border:'1px solid #E8F0FE', borderTop:'3px solid #E2E8F0', borderRadius:16, padding:'22px 24px', display:'flex', flexDirection:'column', minWidth:0, transition:'all 0.2s', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em', textTransform:'uppercase' }}>Expenses</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ fontSize:11, color:'#64748B', cursor:'pointer', display:'flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:6, border:'1px solid #E5E7EB', background:'#F8FAFC' }}>
                  Last 30 days <ChevronDown size={11} color="#94A3B8"/>
                </div>
                <MoreHorizontal size={16} color="#CBD5E1" style={{ cursor:'pointer' }}/>
              </div>
            </div>
            <div style={{ fontSize:12, color:'#94A3B8', marginBottom:8 }}>Spending for last 30 days</div>
            {loading
              ? <div style={{ height:40, background:'linear-gradient(90deg,#F1F5F9,#E2E8F0)', borderRadius:8, animation:'pulse 1.5s infinite', marginBottom:10 }}/>
              : (
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <div style={{ fontSize:32, fontWeight:800, color:'#0F172A', letterSpacing:'-0.03em', lineHeight:1 }}>{fmt(expenses)}</div>
                  <Info size={13} color="#CBD5E1"/>
                  <div style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'rgba(15,23,42,0.06)', color:'#64748B' }}>100%</div>
                </div>
              )
            }
            {!loading && (
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:20, background:'rgba(239,68,68,0.1)' }}>
                  <TrendingDown size={12} color="#EF4444"/>
                  <span style={{ fontSize:11, fontWeight:600, color:'#EF4444' }}>Up 24% from prior 30 days</span>
                </div>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', margin:'8px 0 12px' }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="28" fill="none" stroke="#E5E7EB" strokeWidth="12"/>
                {expenses > 0 && (
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#94A3B8" strokeWidth="12"
                    strokeDasharray={String(Math.min((expenses/(expenses+1000))*175,175)) + ' 175'}
                    strokeLinecap="round" transform="rotate(-90 40 40)"/>
                )}
                <text x="40" y="44" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">
                  {expenses > 0 ? 'Payroll' : 'None'}
                </text>
              </svg>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#94A3B8' }}/>
              <span style={{ fontSize:11, color:'#64748B' }}>Payroll expenses</span>
            </div>
            <div onClick={() => navigate('/transactions')} style={{ fontSize:12, color:ACCENT, fontWeight:600, cursor:'pointer', marginTop:'auto', paddingTop:14, borderTop:'1px solid #F1F5F9' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
              View all spending
            </div>
          </div>

          {/* Card 3 — Add Widgets */}
          <AddWidgetCard onAdd={() => navigate('/settings')}/>

          {/* Card 4 — Bank Accounts */}
          <div onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.04)'; }}
            style={{ background:'#fff', border:'1px solid #E8F0FE', borderTop:'3px solid #E2E8F0', borderRadius:16, padding:'22px 24px', display:'flex', flexDirection:'column', minWidth:0, transition:'all 0.2s', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em', textTransform:'uppercase' }}>Bank Accounts</div>
              <MoreHorizontal size={16} color="#CBD5E1" style={{ cursor:'pointer' }}/>
            </div>
            <div style={{ fontSize:12, color:'#94A3B8', marginBottom:6 }}>As of today</div>
            <div style={{ fontSize:13, color:'#94A3B8', marginBottom:4 }}>Total bank balance</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{ fontSize:32, fontWeight:800, color:'#0F172A', letterSpacing:'-0.03em', lineHeight:1 }}>$0</div>
              <Info size={13} color="#CBD5E1"/>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:10, background:'#F8FAFC', border:'1px solid #E5E7EB', marginBottom:8 }}>
              <Landmark size={15} color="#94A3B8"/>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'#374151' }}>No bank connected</div>
                <div style={{ fontSize:11, color:'#9CA3AF', marginTop:1 }}>Connect to sync transactions</div>
              </div>
            </div>
            <div onClick={() => navigate('/integrations')} style={{ fontSize:12, color:ACCENT, fontWeight:600, cursor:'pointer', marginTop:'auto', paddingTop:14, borderTop:'1px solid #F1F5F9' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
              Connect bank account
            </div>
          </div>
        </div>

        {/* Cash Flow A */}
        <CashFlowCard
          data={cashFlowData.length > 0 ? cashFlowData : [
            { month:'Jan', amount:12000 }, { month:'Feb', amount:8000  },
            { month:'Mar', amount:15000 }, { month:'Apr', amount:11000 },
            { month:'May', amount:18000 }, { month:'Jun', amount:14000 },
          ]}
          balance={revenue - expenses}
          loading={loading}
          onView={() => navigate('/transactions')}
          title="Cash Flow"
          subtitle="Based on your recorded transactions"
        />

        {/* Recent Transactions */}
        <div style={{ background:'#fff', border:'1px solid #E8F0FE', borderRadius:16, padding:'22px 24px', marginBottom:24, boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#0F172A' }}>Recent Transactions</div>
            <button onClick={() => navigate('/transactions')} style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', borderRadius:999, cursor:'pointer', color:ACCENT, fontSize:12, fontWeight:600, fontFamily:FONT, padding:'6px 12px' }}>
              View all <ChevronRight size={14}/>
            </button>
          </div>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[1,2,3].map(i => <div key={i} style={{ height:44, background:'linear-gradient(90deg,#F1F5F9,#E2E8F0)', borderRadius:10, animation:'pulse 1.5s infinite' }}/>)}
            </div>
          ) : txns.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'#94A3B8', fontSize:13 }}>
              No transactions yet.
              <span onClick={() => navigate('/transactions')} style={{ color:ACCENT, cursor:'pointer', marginLeft:4, fontWeight:600 }}>Add one →</span>
            </div>
          ) : txns.slice(0,6).map((t,i) => {
            const amt     = parseFloat(t.amount||0);
            const isPos   = amt >= 0;
            const date    = new Date(t.date||t.created_at||t.transaction_date||Date.now());
            const dateStr = date.toLocaleDateString('en-US',{month:'short',day:'numeric'});
            return (
              <div key={t.id||i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:i<5?'1px solid #F8FAFC':'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:'#F8FAFC', border:'1px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {isPos ? <TrendingUp size={17} color="#0AB98A"/> : <TrendingDown size={17} color="#EF4444"/>}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{t.description||t.name||t.memo||'Transaction'}</div>
                    <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{dateStr}</div>
                  </div>
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:isPos?'#0AB98A':'#EF4444', letterSpacing:'-0.01em' }}>
                  {isPos?'+':''}{fmt(amt)}
                </div>
              </div>
            );
          })}
        </div>

        {/* ══ SECTION B ══ */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, marginTop:8 }}>
          <div style={{ fontSize:20, fontWeight:700, color:'#0F172A', letterSpacing:'-0.02em' }}>Banking & Payroll</div>
          <div style={{ padding:'4px 12px', borderRadius:20, background:'#F1F5F9', border:'1px solid #E2E8F0' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#64748B' }}>COMING SOON</span>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(auto-fit,minmax(230px,1fr))', gap:16, marginBottom:20 }}>
          <DashCard label="Profit & Loss" subtitle="Net accounting profit" value="$48,200" valueColor="#0F172A" trend="+24% vs last month" trendUp={true} footer="View accounting report" onFooter={() => navigate('/reports')} topBorder="#E2E8F0">
            <MiniBar income={72000} expenses={23800}/>
            <div style={{ marginTop:8, display:'inline-flex', fontSize:9, fontWeight:700, color:'#94A3B8', background:'#F1F5F9', border:'1px solid #E2E8F0', padding:'2px 8px', borderRadius:20 }}>SAMPLE DATA</div>
          </DashCard>
          <DashCard label="Expenses" subtitle="Total business expenses" value="$23,800" valueColor="#0F172A" trend="Across all accounts" trendUp={false} footer="View expense breakdown" onFooter={() => navigate('/transactions')} topBorder="#E2E8F0">
            <div style={{ marginTop:8 }}>
              {[
                { label:'Operations', pct:45, color:'#94A3B8' },
                { label:'Payroll',    pct:35, color:'#64748B' },
                { label:'Marketing',  pct:20, color:'#CBD5E1' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:10, color:'#64748B' }}>{item.label}</span>
                    <span style={{ fontSize:10, fontWeight:700, color:'#475569' }}>{item.pct}%</span>
                  </div>
                  <div style={{ height:4, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:item.pct+'%', background:item.color, borderRadius:99 }}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:8, display:'inline-flex', fontSize:9, fontWeight:700, color:'#94A3B8', background:'#F1F5F9', border:'1px solid #E2E8F0', padding:'2px 8px', borderRadius:20 }}>SAMPLE DATA</div>
          </DashCard>
          <DashCard label="Bank Accounts" subtitle="Connected accounts balance" value="$84,320" valueColor="#0F172A" footer="Connect bank account" onFooter={() => navigate('/integrations')} topBorder="#E2E8F0">
            <div style={{ marginTop:4 }}>
              {[
                { name:'Business Chequing', bal:'$62,100' },
                { name:'Business Savings',  bal:'$22,220' },
              ].map(acc => (
                <div key={acc.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderRadius:10, background:'#F8FAFC', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#CBD5E1' }}/>
                    <span style={{ fontSize:12, color:'#475569', fontWeight:500 }}>{acc.name}</span>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>{acc.bal}</span>
                </div>
              ))}
              <div style={{ fontSize:10, color:'#94A3B8', marginTop:4 }}>Last updated just now</div>
            </div>
            <div style={{ marginTop:8, display:'inline-flex', fontSize:9, fontWeight:700, color:'#94A3B8', background:'#F1F5F9', border:'1px solid #E2E8F0', padding:'2px 8px', borderRadius:20 }}>SAMPLE DATA</div>
          </DashCard>
          <DashCard label="Payroll Expenses" subtitle="This pay period" value="$14,200" valueColor="#0F172A" footer="Run payroll" onFooter={() => navigate('/team')} topBorder="#E2E8F0">
            <div style={{ marginTop:8, padding:'10px 12px', background:'#F8FAFC', borderRadius:10, border:'1px solid #E5E7EB' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <Users size={13} color="#64748B"/>
                <span style={{ fontSize:12, fontWeight:600, color:'#475569' }}>6 employees active</span>
              </div>
              <div style={{ fontSize:11, color:'#94A3B8' }}>Next payroll run: May 31</div>
            </div>
            <div style={{ marginTop:8, display:'inline-flex', fontSize:9, fontWeight:700, color:'#94A3B8', background:'#F1F5F9', border:'1px solid #E2E8F0', padding:'2px 8px', borderRadius:20 }}>SAMPLE DATA</div>
          </DashCard>
          <AddWidgetCard onAdd={() => navigate('/settings')}/>
        </div>

        {/* Cash Flow B */}
        <CashFlowCard
          data={[
            { month:'Nov', amount:18000 }, { month:'Dec', amount:22000 },
            { month:'Jan', amount:19500 }, { month:'Feb', amount:24800 },
            { month:'Mar', amount:21200 }, { month:'Apr', amount:27600 },
            { month:'May', amount:23400 }, { month:'Jun', amount:31000 },
          ]}
          balance={84320}
          loading={false}
          onView={() => navigate('/transactions')}
          title="Banking Cash Flow"
          subtitle="Connected bank accounts · Sample data"
        />

        {/* Suggestions */}
        <div style={{ background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', borderRadius:16, padding:'24px 28px', marginBottom:24, color:'#fff' }}>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>Suggestions for you</div>
          <div style={{ fontSize:13, opacity:0.85, marginBottom:20 }}>Based on your business activity this month</div>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
            {[
              { icon:'📨', title:'Send invoice reminders', desc:unpaidInv.length>0?unpaidInv.length+' invoices overdue':'All invoices up to date', action:() => navigate('/invoices'), btn:'View invoices' },
              { icon:'🏦', title:'Connect your bank',      desc:'Auto-sync transactions and reconcile faster', action:() => navigate('/integrations'), btn:'Connect now' },
              { icon:'📊', title:'Run a financial report', desc:'See your profit & loss for this quarter',     action:() => navigate('/reports'),      btn:'Run report'  },
            ].map(s => (
              <div key={s.title} style={{ background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'16px', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{s.title}</div>
                <div style={{ fontSize:11, opacity:0.8, marginBottom:12 }}>{s.desc}</div>
                <button onClick={s.action} style={{ padding:'7px 16px', borderRadius:999, background:'rgba(255,255,255,0.25)', border:'1px solid rgba(255,255,255,0.4)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:FONT, transition:'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'}>
                  {s.btn}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'New Invoice',  icon:FileText,  path:'/invoices',     color:'#0F172A', bg:'#F1F5F9' },
            { label:'Add Expense',  icon:Receipt,   path:'/transactions', color:'#0F172A', bg:'#F1F5F9' },
            { label:'View Reports', icon:BarChart2, path:'/reports',      color:'#0F172A', bg:'#F1F5F9' },
            { label:'Scan Receipt', icon:ScanLine,  path:'/receipts',     color:'#0F172A', bg:'#F1F5F9' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} onClick={() => navigate(item.path)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 18px', background:'#fff', border:'1px solid #E8F0FE', borderRadius:14, cursor:'pointer', transition:'all 0.2s', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,0.1)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform='none'; }}>
                <div style={{ width:40, height:40, borderRadius:12, background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={18} color={item.color} strokeWidth={2}/>
                </div>
                <span style={{ fontSize:13, fontWeight:600, color:'#334155' }}>{item.label}</span>
                <ChevronRight size={14} color="#CBD5E1" style={{ marginLeft:'auto' }}/>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', padding:'24px 0 8px', borderTop:'1px solid #E5E7EB' }}>
          <div style={{ fontSize:12, color:'#94A3B8' }}>
            2026 Novala. All rights reserved.
            {[['Privacy','/settings'],['Security',null],['Terms of Service',null]].map(([label,path]) => (
              <React.Fragment key={label}>
                <span style={{ margin:'0 8px', color:'#E5E7EB' }}>|</span>
                <span style={{ cursor:'pointer', color:ACCENT }} onClick={() => path && navigate(path)}>{label}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}