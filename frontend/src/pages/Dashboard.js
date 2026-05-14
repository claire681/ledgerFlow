import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, RefreshCw, DollarSign,
  FileText, ArrowLeftRight, Receipt, PieChart,
  Users, BarChart2, Sliders, Eye, ChevronRight, ChevronLeft,
  Plus, MoreHorizontal, Info, X, Search, Star,
  ShoppingCart, UserCheck, Briefcase, ClipboardList,
  Calendar, Clock, Pause, Play, Save, Bell,
  Building2, CreditCard, Percent, Package,
  ChevronDown, Settings, HelpCircle, LogOut,
  Landmark, Wallet, BarChart3, Tag,
} from 'lucide-react';

const ACCENT  = '#0AB98A';
const FONT    = "'Inter', -apple-system, sans-serif";
const API     = 'https://api.getnovala.com/api/v1';

const fmt = (n) => {
  const num = parseFloat(n) || 0;
  return (num < 0 ? '-$' : '$') + Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// ── Nav categories ────────────────────────────────────────────
const NAV_CATS = [
  { label: 'Transactions',      icon: ArrowLeftRight, color: '#0AB98A', path: '/transactions'  },
  { label: 'Invoices',          icon: FileText,       color: '#3B82F6', path: '/invoices'      },
  { label: 'Bill Pay',          icon: DollarSign,     color: '#8B5CF6', path: '/billpay'       },
  { label: 'Reports',           icon: BarChart2,      color: '#F59E0B', path: '/reports'       },
  { label: 'Customers',         icon: UserCheck,      color: '#06B6D4', path: '/customers'     },
  { label: 'Vendors',           icon: Briefcase,      color: '#EF4444', path: '/vendors'       },
  { label: 'Inventory',         icon: Package,        color: '#10B981', path: '/inventory'     },
  { label: 'Team',              icon: Users,          color: '#6366F1', path: '/team'          },
  { label: 'Accounting',        icon: ClipboardList,  color: '#14B8A6', path: '/reconciliation'},
  { label: 'Expenses & Pay',    icon: Receipt,        color: '#EF4444', path: '/transactions'  },
  { label: 'Sales & Get Paid',  icon: TrendingUp,     color: '#0AB98A', path: '/invoices'      },
  { label: 'Customer Hub',      icon: UserCheck,      color: '#06B6D4', path: '/customers'     },
  { label: 'Payroll',           icon: Wallet,         color: '#3B82F6', path: '/team'          },
  { label: 'Sales Tax',         icon: Percent,        color: '#F59E0B', path: '/tax'           },
  { label: 'Marketing',         icon: Tag,            color: '#EC4899', path: '/marketing'     },
  { label: 'Documents',         icon: FileText,       color: '#F59E0B', path: '/documents'     },
  { label: 'Budgets',           icon: PieChart,       color: '#EC4899', path: '/budgets'       },
];

// ── All create actions ────────────────────────────────────────
const ALL_CREATE_ACTIONS = [
  { label: 'Create invoice',         path: '/invoices',     cat: 'Customers',  fav: true  },
  { label: 'Create sales receipt',   path: '/invoices',     cat: 'Customers',  fav: true  },
  { label: 'Get paid online',        path: '/invoices',     cat: 'Customers',  fav: false },
  { label: 'Record payment',         path: '/transactions', cat: 'Customers',  fav: false },
  { label: 'Create estimate',        path: '/invoices',     cat: 'Customers',  fav: false },
  { label: 'Add customer',           path: '/customers',    cat: 'Customers',  fav: false },
  { label: 'Record expense',         path: '/transactions', cat: 'Suppliers',  fav: true  },
  { label: 'Create bill',            path: '/billpay',      cat: 'Suppliers',  fav: false },
  { label: 'Pay bills',              path: '/billpay',      cat: 'Suppliers',  fav: true  },
  { label: 'Add supplier',           path: '/vendors',      cat: 'Suppliers',  fav: false },
  { label: 'Run payroll',            path: '/team',         cat: 'Payroll',    fav: true  },
  { label: 'Add employee',           path: '/team',         cat: 'Payroll',    fav: false },
  { label: 'Add time entry',         path: '/team',         cat: 'Payroll',    fav: false },
  { label: 'Upload document',        path: '/documents',    cat: 'Business',   fav: false },
  { label: 'Add bank deposit',       path: '/transactions', cat: 'Business',   fav: false },
  { label: 'Create journal entry',   path: '/ledger',       cat: 'Business',   fav: false },
  { label: 'Add product or service', path: '/inventory',    cat: 'Business',   fav: false },
  { label: 'Create tax return',      path: '/tax',          cat: 'Tax',        fav: false },
  { label: 'Download tax summary',   path: '/tax',          cat: 'Tax',        fav: false },
];

const QUICK_CREATE = ALL_CREATE_ACTIONS.filter(a => a.fav).slice(0, 5);

const FREQUENCIES = [
  { value: 'daily',   label: 'Daily',         desc: 'Every day'                     },
  { value: 'every7',  label: 'Every 7 days',  desc: 'Once a week'                   },
  { value: 'every14', label: 'Every 14 days', desc: 'Every two weeks'               },
  { value: 'monthly', label: 'Monthly',       desc: 'Once a month on chosen date'   },
  { value: 'yearly',  label: 'Yearly',        desc: 'Once a year on chosen date'    },
  { value: 'custom',  label: 'Custom',        desc: 'Set your own interval in days' },
];

const HOURS = Array.from({ length: 19 }, (_, i) => {
  const h    = i + 5;
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

// ── Briefing Modal ────────────────────────────────────────────
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
        method:  'POST',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefing_enabled:   enabled && !paused,
          briefing_time:      time,
          briefing_timezone:  timezone,
          briefing_frequency: frequency,
          briefing_start:     startDate,
          briefing_interval:  customDays,
        }),
      });
    } catch (e) { console.error(e); }
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); onSave(settings); }, 800);
  };

  const sel = { width: '100%', padding: '9px 12px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, color: '#0F172A', fontSize: 13, fontFamily: FONT, outline: 'none' };

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
                <div style={{ fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
                  {frequency==='monthly'||frequency==='yearly'?'Date':'Start Date'}
                </div>
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
                  {paused ? 'Briefing is currently paused.' : frequency==='daily' ? 'Every day at '+time+' ('+timezone.replace(/_/g,' ')+') starting '+startDate : frequency==='every7' ? 'Every 7 days at '+time : frequency==='every14' ? 'Every 14 days at '+time : frequency==='monthly' ? 'Monthly on the '+(startDate?new Date(startDate).getDate():1)+'th at '+time : frequency==='yearly' ? 'Yearly on '+(startDate?new Date(startDate).toLocaleDateString('en-US',{month:'long',day:'numeric'}):'chosen date')+' at '+time : 'Every '+customDays+' days at '+time}
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

// ── Create Actions Panel ──────────────────────────────────────
function CreatePanel({ onClose, onNavigate }) {
  const [search,    setSearch]    = useState('');
  const [favorites, setFavorites] = useState(ALL_CREATE_ACTIONS.filter(a => a.fav).map(a => a.label));

  const toggleFav = (label) => {
    setFavorites(prev => prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]);
  };

  const filtered = search.trim()
    ? ALL_CREATE_ACTIONS.filter(a => a.label.toLowerCase().includes(search.toLowerCase()))
    : ALL_CREATE_ACTIONS;

  const cats = [...new Set(filtered.map(a => a.cat))];
  const favItems = filtered.filter(a => favorites.includes(a.label));

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200, backdropFilter:'blur(4px)' }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ position:'absolute', top:0, right:0, width:380, height:'100vh', background:'#fff', boxShadow:'-8px 0 40px rgba(0,0,0,0.12)', display:'flex', flexDirection:'column', animation:'slideFromRight 0.25s ease' }}
      >
        <style>{`@keyframes slideFromRight { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>

        {/* Header */}
        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ fontSize:16, fontWeight:700, color:'#0F172A' }}>Create actions</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex' }}><X size={20}/></button>
        </div>

        {/* Search */}
        <div style={{ padding:'12px 20px', borderBottom:'1px solid #F1F5F9', flexShrink:0 }}>
          <div style={{ position:'relative' }}>
            <Search size={14} color="#94A3B8" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search actions..."
              style={{ width:'100%', padding:'8px 10px 8px 32px', background:'#F8FAFC', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, fontFamily:FONT, outline:'none', boxSizing:'border-box', color:'#0F172A' }}
              onFocus={e => e.target.style.borderColor=ACCENT}
              onBlur={e  => e.target.style.borderColor='#E5E7EB'}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', scrollbarWidth:'none' }}>

          {/* Favourites */}
          {favItems.length > 0 && !search && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Favourites</div>
              {favItems.map(item => (
                <CreateItem key={item.label} item={item} isFav={true} onToggleFav={toggleFav} onNavigate={onNavigate} onClose={onClose}/>
              ))}
            </div>
          )}

          {/* Categories */}
          {cats.map(cat => {
            const items = filtered.filter(a => a.cat === cat);
            return (
              <div key={cat} style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>{cat}</div>
                {items.map(item => (
                  <CreateItem key={item.label} item={item} isFav={favorites.includes(item.label)} onToggleFav={toggleFav} onNavigate={onNavigate} onClose={onClose}/>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CreateItem({ item, isFav, onToggleFav, onNavigate, onClose }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, background:hov?'#F8FAFC':'transparent', cursor:'pointer', marginBottom:2, transition:'all 0.12s' }}
    >
      <div onClick={() => { onNavigate(item.path); onClose(); }} style={{ flex:1, fontSize:13, color:hov?ACCENT:'#334155', fontWeight:500 }}>
        {item.label}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onToggleFav(item.label); }}
        style={{ background:'none', border:'none', cursor:'pointer', display:'flex', padding:2, opacity:isFav||hov?1:0, transition:'opacity 0.15s' }}
      >
        <Star size={13} color={isFav?'#F59E0B':'#CBD5E1'} fill={isFav?'#F59E0B':'none'}/>
      </button>
    </div>
  );
}

// ── Profile Dropdown ──────────────────────────────────────────
function ProfileDropdown({ user, onClose, onNavigate, onLogout }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ position:'absolute', top:60, right:16, width:240, background:'#fff', borderRadius:14, boxShadow:'0 8px 40px rgba(0,0,0,0.14)', border:'1px solid #E5E7EB', overflow:'hidden' }}
      >
        {/* User info */}
        <div style={{ padding:'16px 18px', borderBottom:'1px solid #F1F5F9', background:'#F8FAFC' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#0F172A', marginBottom:2 }}>{user.fullName}</div>
          <div style={{ fontSize:12, color:'#64748B' }}>{user.email}</div>
        </div>
        {/* Menu items */}
        {[
          { label:'Settings', icon:Settings,  path:'/settings' },
          { label:'Billing',  icon:CreditCard, path:'/billing'  },
          { label:'Help',     icon:HelpCircle, path:'/help'     },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              onClick={() => { onNavigate(item.path); onClose(); }}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 18px', cursor:'pointer', fontSize:13, color:'#334155', transition:'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.color=ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#334155'; }}
            >
              <Icon size={15} color="currentColor"/>{item.label}
            </div>
          );
        })}
        <div style={{ height:1, background:'#F1F5F9', margin:'4px 0' }}/>
        <div
          onClick={() => { onLogout(); onClose(); }}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 18px', cursor:'pointer', fontSize:13, color:'#EF4444', transition:'all 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}
        >
          <LogOut size={15} color="#EF4444"/> Sign out
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, subtitle, value, trend, trendUp, badge, footer, onFooter, loading, accent = ACCENT }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px 22px', display:'flex', flexDirection:'column', gap:10, minWidth:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase' }}>{label}</div>
        <MoreHorizontal size={16} color="#CBD5E1" style={{ cursor:'pointer', flexShrink:0 }}/>
      </div>
      {subtitle && <div style={{ fontSize:12, color:'#64748B' }}>{subtitle}</div>}
      {loading
        ? <div style={{ height:36, background:'#F1F5F9', borderRadius:8, animation:'pulse 1.5s infinite' }}/>
        : (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontSize:28, fontWeight:800, color:'#0F172A', letterSpacing:'-0.02em' }}>{value}</div>
            <Info size={14} color="#CBD5E1"/>
            {badge && <div style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:`rgba(10,185,138,0.1)`, color:accent }}>{badge}</div>}
          </div>
        )
      }
      {trend && (
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {trendUp ? <TrendingUp size={14} color={accent}/> : <TrendingDown size={14} color="#EF4444"/>}
          <span style={{ fontSize:12, color:trendUp?accent:'#EF4444' }}>{trend}</span>
        </div>
      )}
      {footer && (
        <div onClick={onFooter} style={{ fontSize:12, color:accent, fontWeight:500, cursor:'pointer', marginTop:4, paddingTop:10, borderTop:'1px solid #F1F5F9' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
          {footer}
        </div>
      )}
    </div>
  );
}

// ── Mini Bar ──────────────────────────────────────────────────
function MiniBar({ income, expenses }) {
  const total  = income + expenses || 1;
  const incPct = (income   / total) * 100;
  const expPct = (expenses / total) * 100;
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex', gap:4, marginBottom:8 }}>
        <div style={{ height:8, borderRadius:4, background:ACCENT,    width:incPct+'%', minWidth:4 }}/>
        <div style={{ height:8, borderRadius:4, background:'#EF4444', width:expPct+'%', minWidth:4 }}/>
      </div>
      <div style={{ display:'flex', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:ACCENT }}/><span style={{ fontSize:11, color:'#64748B' }}>Income {fmt(income)}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:'#EF4444' }}/><span style={{ fontSize:11, color:'#64748B' }}>Expenses {fmt(expenses)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Cash Flow Chart ───────────────────────────────────────────
function CashFlowChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8', fontSize:13 }}>No cash flow data available</div>;
  }
  const max = Math.max(...data.map(d => Math.abs(d.amount)), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:80, padding:'0 4px' }}>
      {data.map((d, i) => {
        const h   = Math.max((Math.abs(d.amount) / max) * 100, 4);
        const pos = d.amount >= 0;
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <div style={{ width:'100%', height:h+'%', background:pos?'rgba(10,185,138,0.7)':'rgba(239,68,68,0.7)', borderRadius:'3px 3px 0 0', minHeight:3 }}/>
            <div style={{ fontSize:8, color:'#94A3B8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%', textAlign:'center' }}>{d.month}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Cash Flow Card ────────────────────────────────────────────
function CashFlowCard({ data, balance, loading, onView }) {
  const [tab, setTab] = useState('balance');
  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px 22px', marginBottom:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>Cash Flow</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#0F172A', letterSpacing:'-0.02em' }}>
            {loading ? '—' : fmt(balance)}
          </div>
          <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>Today's cash balance</div>
        </div>
        <MoreHorizontal size={16} color="#CBD5E1" style={{ cursor:'pointer' }}/>
      </div>
      {/* Toggle */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {['balance','money-in','money-out'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ padding:'5px 12px', borderRadius:999, fontSize:11, fontWeight:600, cursor:'pointer', border:'1px solid '+(tab===t?ACCENT:'#E5E7EB'), background:tab===t?'rgba(10,185,138,0.08)':'transparent', color:tab===t?ACCENT:'#64748B', fontFamily:FONT, transition:'all 0.15s' }}
          >
            {t === 'balance' ? 'Cash balance' : t === 'money-in' ? 'Money in' : 'Money out'}
          </button>
        ))}
      </div>
      {loading ? <div style={{ height:80, background:'#F1F5F9', borderRadius:8 }}/> : <CashFlowChart data={data}/>}
      <div style={{ display:'flex', gap:16, marginTop:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:10, height:10, borderRadius:2, background:'rgba(10,185,138,0.7)' }}/><span style={{ fontSize:11, color:'#64748B' }}>Income</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:10, height:10, borderRadius:2, background:'rgba(239,68,68,0.7)' }}/><span style={{ fontSize:11, color:'#64748B' }}>Expenses</span></div>
      </div>
      <div onClick={onView} style={{ fontSize:12, color:ACCENT, fontWeight:500, cursor:'pointer', marginTop:12, paddingTop:10, borderTop:'1px solid #F1F5F9' }}
        onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
        onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
        View cash flow
      </div>
    </div>
  );
}

// ── Add Widget Card ───────────────────────────────────────────
function AddWidgetCard({ onAdd }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onAdd}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:hov?'#F8FAFC':'#fff', border:'2px dashed '+(hov?ACCENT:'#E5E7EB'), borderRadius:12, padding:'20px 22px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', transition:'all 0.2s', minHeight:140 }}
    >
      <div style={{ width:36, height:36, borderRadius:10, background:hov?'rgba(10,185,138,0.1)':'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
        <Plus size={18} color={hov?ACCENT:'#94A3B8'}/>
      </div>
      <div style={{ fontSize:13, fontWeight:600, color:hov?ACCENT:'#94A3B8', transition:'color 0.2s' }}>Add Widget</div>
      <div style={{ fontSize:11, color:'#CBD5E1', textAlign:'center' }}>Add more metrics to your dashboard</div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');

  // ── User info — first name only ──
  const rawName  = localStorage.getItem('user_name') || localStorage.getItem('full_name') || localStorage.getItem('user_email') || 'there';
  const fullName = rawName.includes('@') ? rawName.split('@')[0] : rawName;
  const firstName = fullName.split(' ')[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const userEmail   = localStorage.getItem('user_email') || '';
  const company     = localStorage.getItem('company_name') || 'My Business';
  const initials    = displayName.charAt(0).toUpperCase() + (fullName.split(' ')[1]?.charAt(0).toUpperCase() || '');

  const [stats,            setStats]            = useState(null);
  const [txns,             setTxns]             = useState([]);
  const [invoices,         setInvoices]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [refresh,          setRefresh]          = useState(0);
  const [showBriefing,     setShowBriefing]     = useState(false);
  const [briefingSettings, setBriefingSettings] = useState(null);
  const [showCreatePanel,  setShowCreatePanel]  = useState(false);
  const [showProfile,      setShowProfile]      = useState(false);
  const [canScrollLeft,    setCanScrollLeft]    = useState(false);
  const [canScrollRight,   setCanScrollRight]   = useState(false);
  const [isMobile,         setIsMobile]         = useState(window.innerWidth < 768);
  const scrollRef = useRef(null);
  const headers   = { Authorization: 'Bearer ' + token };

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
    setLoading(true);
    Promise.allSettled([
      fetch(API + '/dashboard/stats', { headers }).then(r => r.json()),
      fetch(API + '/transactions/',   { headers }).then(r => r.json()),
      fetch(API + '/invoices/',       { headers }).then(r => r.json()),
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

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => { if (el) el.removeEventListener('scroll', checkScroll); window.removeEventListener('resize', checkScroll); };
  }, []);

  const scrollLeft  = () => scrollRef.current?.scrollBy({ left: -200, behavior:'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left:  200, behavior:'smooth' });

  // ── Derived numbers ──
  const revenue  = stats?.total_revenue || stats?.revenue || stats?.income ||
    txns.filter(t => parseFloat(t.amount||0) > 0).reduce((s,t) => s + Math.abs(parseFloat(t.amount||0)), 0);
  const expenses = stats?.total_expenses || stats?.expenses ||
    txns.filter(t => parseFloat(t.amount||0) < 0).reduce((s,t) => s + Math.abs(parseFloat(t.amount||0)), 0);
  const netProfit   = stats?.net_profit || stats?.profit || (revenue - expenses);
  const profitUp    = netProfit >= 0;
  const unpaidInv   = invoices.filter(inv => ['unpaid','pending','sent'].includes((inv.status||'').toLowerCase()));
  const totalUnpaid = unpaidInv.reduce((s,inv) => s + parseFloat(inv.amount||inv.total||0), 0);

  const cashFlowMap = {};
  txns.forEach(t => {
    const date = new Date(t.date || t.created_at || t.transaction_date || Date.now());
    const key  = date.toLocaleString('default', { month:'short', year:'2-digit' });
    cashFlowMap[key] = (cashFlowMap[key]||0) + parseFloat(t.amount||0);
  });
  const cashFlowData = Object.entries(cashFlowMap).slice(-8).map(([month,amount]) => ({ month, amount }));

  const briefingBadgeColor = briefingPaused?'#F59E0B':briefingOn?ACCENT:'#94A3B8';
  const briefingBadgeBg    = briefingPaused?'rgba(245,158,11,0.1)':briefingOn?'rgba(10,185,138,0.1)':'#F1F5F9';
  const briefingLabel      = briefingPaused?'PAUSED':briefingOn?'ON':'OFF';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ background:'#F8FAFC', minHeight:'100vh', fontFamily:FONT }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .shortcut-pill:hover { box-shadow:0 4px 12px rgba(0,0,0,0.1); transform:translateY(-1px); }
        .action-chip:hover { background:#F1F5F9 !important; color:#0AB98A !important; }
      `}</style>

      {/* Modals */}
      {showBriefing    && <BriefingModal onClose={() => setShowBriefing(false)} onSave={(s) => { setBriefingSettings(s); setShowBriefing(false); }} initial={briefingSettings}/>}
      {showCreatePanel && <CreatePanel  onClose={() => setShowCreatePanel(false)} onNavigate={navigate}/>}
      {showProfile     && <ProfileDropdown user={{ fullName, email:userEmail }} onClose={() => setShowProfile(false)} onNavigate={navigate} onLogout={handleLogout}/>}

      {/* ── TOP BAR ── sticky ────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', padding:isMobile?'10px 16px':'10px 28px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100, gap:12, flexWrap:'wrap' }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#334155' }}>{company}</div>
        <div style={{ display:'flex', gap:isMobile?8:12, alignItems:'center' }}>

          {/* Briefing pill */}
          <div
            onClick={() => setShowBriefing(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:999, border:'1px solid '+(briefingOn?'rgba(10,185,138,0.3)':briefingPaused?'rgba(245,158,11,0.3)':'#E5E7EB'), background:'#fff', cursor:'pointer', fontSize:12, fontWeight:500, color:'#334155', transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
          >
            <ClipboardList size={13} color={briefingBadgeColor}/>
            {!isMobile && <span>Morning Briefing</span>}
            <div style={{ padding:'2px 7px', borderRadius:20, background:briefingBadgeBg, color:briefingBadgeColor, fontSize:10, fontWeight:700 }}>{briefingLabel}</div>
          </div>

          <button onClick={() => setRefresh(r => r+1)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'#64748B', fontSize:12, fontFamily:FONT }}>
            <RefreshCw size={14}/>{!isMobile && 'Refresh'}
          </button>
          <button onClick={() => navigate('/settings')} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'#64748B', fontSize:12, fontFamily:FONT }}>
            <Sliders size={14}/>{!isMobile && 'Customize'}
          </button>

          {/* Profile avatar */}
          <div
            onClick={() => setShowProfile(p => !p)}
            style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, boxShadow:'0 2px 8px rgba(10,185,138,0.25)', transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform='none'}
          >
            <span style={{ fontSize:13, fontWeight:700, color:'#fff', letterSpacing:'0.02em' }}>{initials || displayName.charAt(0)}</span>
          </div>
        </div>
      </div>

      {/* ── STICKY NAV CATEGORY ROW ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'0 28px', position:'sticky', top:57, zIndex:99 }}>
        <div style={{ position:'relative' }}>
          {canScrollLeft && (
            <button onClick={scrollLeft} style={{ position:'absolute', left:-16, top:'50%', transform:'translateY(-50%)', zIndex:2, width:28, height:28, borderRadius:'50%', background:'#fff', border:'1px solid #E5E7EB', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
              <ChevronLeft size={14} color="#334155"/>
            </button>
          )}
          <div ref={scrollRef} style={{ display:'flex', gap:0, overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
            {NAV_CATS.map(cat => {
              const Icon    = cat.icon;
              const isActive = window.location.pathname === cat.path;
              return (
                <div
                  key={cat.label}
                  className="shortcut-pill"
                  onClick={() => navigate(cat.path)}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'12px 16px', cursor:'pointer', flexShrink:0, transition:'all 0.15s', borderBottom:'2px solid '+(isActive?ACCENT:'transparent'), color:isActive?ACCENT:'#475569', position:'relative' }}
                  onMouseEnter={e => { e.currentTarget.style.color=ACCENT; e.currentTarget.style.background='#F8FAFC'; }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color='#475569'; e.currentTarget.style.background='transparent'; } }}
                >
                  <Icon size={14} color="currentColor" strokeWidth={2}/>
                  <span style={{ fontSize:12, fontWeight:500, whiteSpace:'nowrap' }}>{cat.label}</span>
                </div>
              );
            })}
          </div>
          {canScrollRight && (
            <button onClick={scrollRight} style={{ position:'absolute', right:-16, top:'50%', transform:'translateY(-50%)', zIndex:2, width:28, height:28, borderRadius:'50%', background:'#fff', border:'1px solid #E5E7EB', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
              <ChevronRight size={14} color="#334155"/>
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:isMobile?'20px 16px':'28px 32px' }}>

        {/* ── GREETING ── */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:isMobile?22:28, fontWeight:700, color:'#0F172A', margin:'0 0 6px', letterSpacing:'-0.02em' }}>
            {greeting}, {displayName}!
          </h1>
          <div style={{ fontSize:13, color:'#64748B' }}>Here is what is happening with {company} today.</div>
          {briefingPaused && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:10, padding:'6px 14px', borderRadius:20, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', fontSize:12, color:'#F59E0B' }}>
              Morning Briefing is paused.
              <span onClick={() => setShowBriefing(true)} style={{ fontWeight:600, cursor:'pointer', textDecoration:'underline' }}>Resume</span>
            </div>
          )}
        </div>

        {/* ── CREATE ACTIONS ROW ── */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:28, flexWrap:'wrap' }}>
          <span style={{ fontSize:13, fontWeight:600, color:'#334155', marginRight:4 }}>Create</span>
          {QUICK_CREATE.map(action => (
            <div
              key={action.label}
              className="action-chip"
              onClick={() => navigate(action.path)}
              style={{ padding:'7px 14px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:999, cursor:'pointer', fontSize:12, fontWeight:500, color:'#475569', transition:'all 0.15s' }}
            >
              {action.label}
            </div>
          ))}
          <span
            onClick={() => setShowCreatePanel(true)}
            style={{ fontSize:12, color:ACCENT, fontWeight:600, cursor:'pointer', marginLeft:4, padding:'7px 14px', borderRadius:999, border:'1px solid rgba(10,185,138,0.3)', background:'rgba(10,185,138,0.05)' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(10,185,138,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(10,185,138,0.05)'; }}
          >
            Show all
          </span>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION A — App Business Dashboard (existing)
        ══════════════════════════════════════════════════════ */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:'#0F172A', letterSpacing:'-0.01em' }}>Business at a Glance</div>
            <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>Your app — documents, invoices, transactions</div>
          </div>
          <button onClick={() => navigate('/reports')} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:ACCENT, fontSize:12, fontWeight:600, fontFamily:FONT }}>
            Full report <ChevronRight size={14}/>
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(auto-fit,minmax(220px,1fr))', gap:14, marginBottom:16 }}>

          {/* Profit & Loss */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase' }}>Profit & Loss</div>
              <MoreHorizontal size={16} color="#CBD5E1" style={{ cursor:'pointer' }}/>
            </div>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:8 }}>Net profit this month</div>
            {loading
              ? <div style={{ height:36, background:'#F1F5F9', borderRadius:8 }}/>
              : <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <div style={{ fontSize:28, fontWeight:800, color:profitUp?'#0F172A':'#EF4444', letterSpacing:'-0.02em' }}>{fmt(netProfit)}</div>
                  <Info size={14} color="#CBD5E1"/>
                </div>
            }
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              {profitUp ? <TrendingUp size={14} color={ACCENT}/> : <TrendingDown size={14} color="#EF4444"/>}
              <span style={{ fontSize:12, color:profitUp?ACCENT:'#EF4444' }}>{profitUp?'Profitable this period':'Loss this period'}</span>
            </div>
            <MiniBar income={revenue} expenses={expenses}/>
            <div onClick={() => navigate('/reports')} style={{ fontSize:12, color:ACCENT, fontWeight:500, cursor:'pointer', marginTop:12, paddingTop:10, borderTop:'1px solid #F1F5F9' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
              View full report
            </div>
          </div>

          <StatCard label="Expenses"             subtitle="Total spending recorded"  value={loading?'—':fmt(expenses)}    trend={expenses>0?'Recorded this period':'No expenses yet'}                    trendUp={false}               footer="View all expenses"  onFooter={() => navigate('/transactions')} loading={loading}/>
          <StatCard label="Outstanding Invoices" subtitle="Unpaid invoices"          value={loading?'—':fmt(totalUnpaid)} badge={unpaidInv.length>0?unpaidInv.length+' unpaid':null} trend={unpaidInv.length>0?unpaidInv.length+' awaiting payment':'All invoices paid'} trendUp={unpaidInv.length===0} footer="View all invoices"  onFooter={() => navigate('/invoices')}     loading={loading}/>
          <StatCard label="Revenue"              subtitle="Total income recorded"    value={loading?'—':fmt(revenue)}     trend={revenue>0?'Income this period':'No income recorded yet'}                trendUp={revenue>0}           footer="View transactions"  onFooter={() => navigate('/transactions')} loading={loading}/>

          <AddWidgetCard onAdd={() => navigate('/settings')}/>
        </div>

        {/* Cash Flow — Section A */}
        <CashFlowCard data={cashFlowData} balance={revenue - expenses} loading={loading} onView={() => navigate('/transactions')}/>

        {/* ══════════════════════════════════════════════════════
            SECTION B — Banking / Payroll / Accounting Dashboard
        ══════════════════════════════════════════════════════ */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, marginTop:8 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:'#0F172A', letterSpacing:'-0.01em' }}>Banking & Payroll at a Glance</div>
            <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>Connected accounts, payroll, and accounting overview</div>
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)' }}>
            <span style={{ fontSize:10, fontWeight:700, color:'#3B82F6' }}>COMING SOON</span>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(auto-fit,minmax(220px,1fr))', gap:14, marginBottom:16 }}>

          {/* Profit & Loss — Banking */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px 22px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:10, right:10, fontSize:9, fontWeight:700, color:'#3B82F6', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)', padding:'2px 8px', borderRadius:20 }}>SAMPLE</div>
            <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>Profit & Loss</div>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:8 }}>Net accounting profit</div>
            <div style={{ fontSize:28, fontWeight:800, color:'#0F172A', letterSpacing:'-0.02em', marginBottom:8 }}>$48,200</div>
            <MiniBar income={72000} expenses={23800}/>
            <div style={{ fontSize:12, color:ACCENT, fontWeight:500, cursor:'pointer', marginTop:12, paddingTop:10, borderTop:'1px solid #F1F5F9' }}>View accounting report</div>
          </div>

          {/* Expenses — Banking */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px 22px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:10, right:10, fontSize:9, fontWeight:700, color:'#3B82F6', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)', padding:'2px 8px', borderRadius:20 }}>SAMPLE</div>
            <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>Expenses</div>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:8 }}>Total business expenses</div>
            <div style={{ fontSize:28, fontWeight:800, color:'#EF4444', letterSpacing:'-0.02em', marginBottom:8 }}>$23,800</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <TrendingDown size={14} color="#EF4444"/>
              <span style={{ fontSize:12, color:'#EF4444' }}>Across all accounts</span>
            </div>
            <div style={{ fontSize:12, color:ACCENT, fontWeight:500, cursor:'pointer', marginTop:12, paddingTop:10, borderTop:'1px solid #F1F5F9' }}>View expense breakdown</div>
          </div>

          {/* Bank Accounts */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px 22px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:10, right:10, fontSize:9, fontWeight:700, color:'#3B82F6', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)', padding:'2px 8px', borderRadius:20 }}>SAMPLE</div>
            <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>Bank Accounts</div>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:12 }}>Connected accounts balance</div>
            <div style={{ fontSize:28, fontWeight:800, color:'#0F172A', letterSpacing:'-0.02em', marginBottom:12 }}>$84,320</div>
            {[
              { name:'Business Chequing', bal:'$62,100', color:'#0AB98A' },
              { name:'Business Savings',  bal:'$22,220', color:'#3B82F6' },
            ].map(acc => (
              <div key={acc.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #F8FAFC' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:acc.color }}/>
                  <span style={{ fontSize:12, color:'#475569' }}>{acc.name}</span>
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:'#0F172A' }}>{acc.bal}</span>
              </div>
            ))}
            <div onClick={() => navigate('/integrations')} style={{ fontSize:12, color:ACCENT, fontWeight:500, cursor:'pointer', marginTop:12, paddingTop:10, borderTop:'1px solid #F1F5F9' }}>Connect bank account</div>
          </div>

          {/* Payroll Expenses */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px 22px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:10, right:10, fontSize:9, fontWeight:700, color:'#3B82F6', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)', padding:'2px 8px', borderRadius:20 }}>SAMPLE</div>
            <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>Payroll Expenses</div>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:8 }}>This pay period</div>
            <div style={{ fontSize:28, fontWeight:800, color:'#0F172A', letterSpacing:'-0.02em', marginBottom:8 }}>$14,200</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <Users size={13} color="#6366F1"/>
              <span style={{ fontSize:12, color:'#6366F1' }}>6 employees · Next run May 31</span>
            </div>
            <div onClick={() => navigate('/team')} style={{ fontSize:12, color:ACCENT, fontWeight:500, cursor:'pointer', marginTop:4, paddingTop:10, borderTop:'1px solid #F1F5F9' }}>Run payroll</div>
          </div>

          <AddWidgetCard onAdd={() => navigate('/settings')}/>
        </div>

        {/* Cash Flow — Section B */}
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
        />

        {/* ── RECENT TRANSACTIONS ── */}
        <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px 22px', marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#0F172A' }}>Recent Transactions</div>
            <button onClick={() => navigate('/transactions')} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:ACCENT, fontSize:12, fontWeight:600, fontFamily:FONT }}>
              View all <ChevronRight size={14}/>
            </button>
          </div>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[1,2,3].map(i => <div key={i} style={{ height:40, background:'#F1F5F9', borderRadius:8 }}/>)}
            </div>
          ) : txns.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'#94A3B8', fontSize:13 }}>
              No transactions yet.
              <span onClick={() => navigate('/transactions')} style={{ color:ACCENT, cursor:'pointer', marginLeft:4 }}>Add one</span>
            </div>
          ) : (
            txns.slice(0,6).map((t,i) => {
              const amt     = parseFloat(t.amount||0);
              const isPos   = amt >= 0;
              const date    = new Date(t.date||t.created_at||t.transaction_date||Date.now());
              const dateStr = date.toLocaleDateString('en-US',{month:'short',day:'numeric'});
              return (
                <div key={t.id||i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:i<5?'1px solid #F8FAFC':'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:isPos?'rgba(10,185,138,0.1)':'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {isPos ? <TrendingUp size={16} color={ACCENT}/> : <TrendingDown size={16} color="#EF4444"/>}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500, color:'#0F172A' }}>{t.description||t.name||t.memo||'Transaction'}</div>
                      <div style={{ fontSize:11, color:'#94A3B8', marginTop:1 }}>{dateStr}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:isPos?ACCENT:'#EF4444' }}>
                    {isPos?'+':''}{fmt(amt)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:24 }}>
          {[
            { label:'New Invoice',  icon:FileText,  path:'/invoices',     color:'#3B82F6' },
            { label:'Add Expense',  icon:Receipt,   path:'/transactions', color:'#EF4444' },
            { label:'View Reports', icon:BarChart2, path:'/reports',      color:'#F59E0B' },
            { label:'Scan Receipt', icon:Receipt,   path:'/receipts',     color:'#8B5CF6' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} onClick={() => navigate(item.path)} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none'; }}>
                <div style={{ width:36, height:36, borderRadius:9, background:item.color+'15', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={17} color={item.color} strokeWidth={2}/>
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
            <span style={{ margin:'0 8px', color:'#E5E7EB' }}>|</span>
            <span style={{ cursor:'pointer', color:ACCENT }} onClick={() => navigate('/settings')}>Privacy</span>
            <span style={{ margin:'0 8px', color:'#E5E7EB' }}>|</span>
            <span style={{ cursor:'pointer', color:ACCENT }}>Security</span>
            <span style={{ margin:'0 8px', color:'#E5E7EB' }}>|</span>
            <span style={{ cursor:'pointer', color:ACCENT }}>Terms of Service</span>
          </div>
        </div>
      </div>
    </div>
  );
}