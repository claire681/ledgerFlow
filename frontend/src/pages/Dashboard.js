import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  ArrowUp, ArrowDown, FileText, AlertTriangle,
  Download, RefreshCw, ArrowRight, Sparkles,
  Upload, Receipt, TrendingUp, Brain,
  Mail, Clock, CheckCircle, Settings,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';
import { useAI } from '../hooks/useAI';
import {
  getDashboardStats, getTransactions,
  getAIInsights, getCompanyProfile, getDailyBriefing,
} from '../services/api';
import { generateReport } from '../services/pdfGenerator';

const BASE     = 'https://api.getnovala.com/api/v1';
const ACCENT   = '#0AB98A';
const getToken = () => localStorage.getItem('token') || localStorage.getItem('access_token') || '';

// ── Mobile detection hook ─────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const fmt = (n) => {
  if (!n && n !== 0) return '$0';
  if (Math.abs(n) >= 1000000) return `$${(n/1000000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000)    return `$${(n/1000).toFixed(1)}K`;
  return `$${Number(n).toLocaleString('en', { maximumFractionDigits:0 })}`;
};

const PIE_COLORS = [
  '#0AB98A','#3B82F6','#8B5CF6',
  '#F59E0B','#EF4444','#06B6D4',
];

const INSIGHT_STYLES = {
  warning:     { bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.2)',  color:'#F59E0B' },
  opportunity: { bg:'rgba(10,185,138,0.08)',  border:'rgba(10,185,138,0.2)',  color:'#0AB98A' },
  info:        { bg:'rgba(59,130,246,0.08)',  border:'rgba(59,130,246,0.2)',  color:'#3B82F6' },
  success:     { bg:'rgba(10,185,138,0.08)',  border:'rgba(10,185,138,0.2)',  color:'#0AB98A' },
};

const TIMEZONES = [
  "America/Edmonton", "America/Vancouver", "America/Toronto",
  "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Phoenix", "America/Halifax",
  "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Africa/Lagos", "Africa/Nairobi", "Africa/Johannesburg",
  "Africa/Cairo", "Asia/Dubai", "Asia/Kolkata",
  "Asia/Singapore", "Asia/Tokyo", "Asia/Shanghai",
  "Australia/Sydney", "Pacific/Auckland", "UTC",
];

const BRIEFING_HOURS = [
  "05:00","06:00","07:00","08:00",
  "09:00","10:00","11:00","12:00",
];

// ── Briefing Settings Modal ───────────────────────────────────
function BriefingSettingsModal({ settings, onClose, onSave }) {
  const [enabled,  setEnabled]  = useState(settings?.briefing_enabled  ?? true);
  const [time,     setTime]     = useState(settings?.briefing_time     || "08:00");
  const [timezone, setTimezone] = useState(settings?.briefing_timezone || "America/Edmonton");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const res  = await fetch(`${BASE}/briefing/settings`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ briefing_enabled: enabled, briefing_time: time, briefing_timezone: timezone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to save');
      onSave(data);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const selectStyle = {
    width: '100%', padding: '9px 12px',
    background: L.pageBg, border: `1px solid ${L.border}`,
    borderRadius: L.radiusSm, color: L.text,
    fontSize: 13, fontFamily: L.font, outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${L.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#0AB98A,#0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={16} color="#fff" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: L.text }}>Morning Briefing Settings</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: L.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: L.radiusSm, background: L.pageBg, border: `1px solid ${L.border}` }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: L.text }}>Daily AI Briefing</div>
              <div style={{ fontSize: 11, color: L.textMuted, marginTop: 2 }}>Receive a morning summary of your finances</div>
            </div>
            <div onClick={() => setEnabled(e => !e)} style={{ width: 44, height: 24, borderRadius: 12, background: enabled ? ACCENT : '#E2E8F0', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 4, left: enabled ? 22 : 4, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Delivery Time</div>
            <select value={time} onChange={e => setTime(e.target.value)} style={selectStyle}>
              {BRIEFING_HOURS.map(h => (
                <option key={h} value={h}>{h === "05:00" ? "5:00 AM" : h === "06:00" ? "6:00 AM" : h === "07:00" ? "7:00 AM" : h === "08:00" ? "8:00 AM" : h === "09:00" ? "9:00 AM" : h === "10:00" ? "10:00 AM" : h === "11:00" ? "11:00 AM" : "12:00 PM"}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Your Time Zone</div>
            <select value={timezone} onChange={e => setTimezone(e.target.value)} style={selectStyle}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
            </select>
          </div>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: L.radiusSm, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 12 }}>{error}</div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: L.radiusSm, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: L.font }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: L.radiusSm, background: saving ? L.textFaint : ACCENT, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font, boxShadow: saving ? 'none' : '0 4px 12px rgba(10,185,138,0.3)' }}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Briefing Card ─────────────────────────────────────────────
function BriefingCard({ onAskWithData }) {
  const [bSettings,    setBSettings]    = useState(null);
  const [sending,      setSending]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sendResult,   setSendResult]   = useState(null);
  const isMobile = useIsMobile();

  const loadSettings = async () => {
    try {
      const res  = await fetch(`${BASE}/briefing/settings`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setBSettings(data);
    } catch (e) { console.error('briefing settings error:', e); }
  };

  useEffect(() => { loadSettings(); }, []);

  const handleSendNow = async () => {
    setSending(true); setSendResult(null);
    try {
      const res  = await fetch(`${BASE}/briefing/send`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setSendResult(data);
      if (data.success) await loadSettings();
    } catch (e) { setSendResult({ success: false, message: e.message }); }
    finally { setSending(false); }
  };

  const formatTime = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div style={{ ...card, padding: isMobile ? '16px' : '20px 24px', marginBottom: 20, border: `1px solid rgba(10,185,138,0.2)`, background: 'linear-gradient(135deg, rgba(10,185,138,0.04) 0%, rgba(14,165,233,0.04) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#0AB98A,#0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(10,185,138,0.3)', flexShrink: 0 }}>
              <Mail size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: L.text }}>Morning Briefing</div>
              <div style={{ fontSize: 12, color: L.textMuted, marginTop: 2 }}>AI sends a daily financial summary</div>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: L.radiusSm, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', fontSize: 11, fontFamily: L.font }}>
            <Settings size={11} /> Settings
          </button>
        </div>

        {bSettings && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: bSettings.briefing_enabled ? 'rgba(10,185,138,0.08)' : 'rgba(148,163,184,0.08)', border: `1px solid ${bSettings.briefing_enabled ? 'rgba(10,185,138,0.2)' : 'rgba(148,163,184,0.2)'}`, fontSize: 11, fontWeight: 600, color: bSettings.briefing_enabled ? ACCENT : L.textMuted }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: bSettings.briefing_enabled ? ACCENT : '#94A3B8' }} />
              {bSettings.briefing_enabled ? 'Active' : 'Paused'}
            </div>
            {bSettings.briefing_enabled && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 11, color: '#0EA5E9' }}>
                <Clock size={10} /> {bSettings.briefing_time}
              </div>
            )}
            {bSettings.last_briefing_at && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: L.pageBg, border: `1px solid ${L.border}`, fontSize: 11, color: L.textMuted }}>
                <CheckCircle size={10} color={ACCENT} /> Last: {formatTime(bSettings.last_briefing_at)}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(160px,1fr))', gap: 8, marginBottom: 16 }}>
          {[
            { emoji: '🚨', label: 'Overdue invoices' },
            { emoji: '💰', label: '30-day cash flow' },
            { emoji: '📊', label: 'Spending summary' },
            { emoji: '📋', label: 'Documents to review' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: L.radiusSm, background: '#fff', border: `1px solid ${L.border}`, fontSize: 11, color: L.textSub }}>
              <span>{item.emoji}</span> {item.label}
            </div>
          ))}
        </div>

        {sendResult && (
          <div style={{ padding: '10px 14px', borderRadius: L.radiusSm, background: sendResult.success ? 'rgba(10,185,138,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${sendResult.success ? 'rgba(10,185,138,0.2)' : 'rgba(239,68,68,0.2)'}`, fontSize: 12, color: sendResult.success ? ACCENT : '#EF4444', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            {sendResult.success ? <CheckCircle size={13} /> : '⚠'} {sendResult.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
          <button onClick={handleSendNow} disabled={sending}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', borderRadius: L.radiusSm, background: sending ? L.textFaint : ACCENT, color: '#fff', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font, boxShadow: sending ? 'none' : '0 4px 12px rgba(10,185,138,0.3)' }}>
            <Mail size={13} /> {sending ? 'Sending...' : 'Send Briefing Now'}
          </button>
          <button onClick={() => onAskWithData('Give me a complete financial briefing. What problems do you see and what should I do today?')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: L.radiusSm, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', color: ACCENT, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font }}>
            <Sparkles size={13} /> Preview in AI
          </button>
        </div>
      </div>

      {showSettings && (
        <BriefingSettingsModal settings={bSettings} onClose={() => setShowSettings(false)} onSave={(data) => { setBSettings(prev => ({ ...prev, ...data })); }} />
      )}
    </>
  );
}

function EmptyState({ icon: Icon, title, description, action, onAction, onAsk, askLabel }) {
  return (
    <div style={{ padding:'36px 20px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <div style={{ width:52, height:52, borderRadius:14, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4 }}>
        <Icon size={22} color={L.accent}/>
      </div>
      <div style={{ fontSize:14, fontWeight:700, color:L.text }}>{title}</div>
      <div style={{ fontSize:12, color:L.textMuted, lineHeight:1.6, maxWidth:240 }}>{description}</div>
      <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap', justifyContent:'center' }}>
        {action && onAction && (
          <button onClick={onAction} style={{ padding:'7px 16px', borderRadius:L.radiusSm, background:L.accent, color:'#FFFFFF', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>{action}</button>
        )}
        {onAsk && (
          <button onClick={onAsk} style={{ padding:'7px 16px', borderRadius:L.radiusSm, background:L.accentSoft, color:L.accent, border:`1px solid ${L.accentBorder}`, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font, display:'flex', alignItems:'center', gap:5 }}>
            <Sparkles size={11}/>{askLabel || 'Ask AI'}
          </button>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color, icon: Icon, loading, onClick, isEmpty, emptyText }) {
  return (
    <div onClick={onClick} style={{ ...card, padding:'16px', cursor:onClick ? 'pointer' : 'default', transition:'all 0.2s', position:'relative', overflow:'hidden' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:9, fontWeight:700, color:L.textMuted, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
          {loading ? (
            <div style={{ height:24, width:60, borderRadius:6, background:L.pageBg, animation:'pulse 1.5s infinite' }}/>
          ) : isEmpty ? (
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:L.textFaint, fontFamily:L.fontMono }}>$0</div>
              <div style={{ fontSize:9, color:L.accent, marginTop:4, fontWeight:500 }}>{emptyText}</div>
            </div>
          ) : (
            <div style={{ fontSize:22, fontWeight:700, color, letterSpacing:'-0.02em', lineHeight:1, fontFamily:L.fontMono }}>{value}</div>
          )}
          <div style={{ fontSize:10, color:L.textMuted, marginTop:4 }}>{sub}</div>
        </div>
        <div style={{ width:34, height:34, borderRadius:10, background:`${color}12`, border:`1px solid ${color}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:8 }}>
          <Icon size={15} color={color}/>
        </div>
      </div>
      {onClick && (
        <div style={{ fontSize:9, color:L.accent, marginTop:10, display:'flex', alignItems:'center', gap:4, borderTop:`1px solid ${L.pageBg}`, paddingTop:8 }}>
          <Sparkles size={9}/>Ask AI
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [stats,       setStats]       = useState(null);
  const [txns,        setTxns]        = useState([]);
  const [insights,    setInsights]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [userEmail,   setUserEmail]   = useState('');
  const [success,     setSuccess]     = useState('');
  const [briefing,    setBriefing]    = useState(null);

  const { setPageContext, askAndOpen } = useAI();
  const statsRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => { setPageContext('dashboard', { page: 'dashboard' }); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([getDashboardStats(), getTransactions({})]);
      const sData  = s.data || {};
      const tData  = Array.isArray(t.data) ? t.data : [];
      setStats(sData);
      setTxns(tData.slice(0, 8));
      statsRef.current = sData;

      let fetchedName = '';
      try { const profile = await getCompanyProfile(); fetchedName = profile.data?.company_name || ''; setCompanyName(fetchedName); }
      catch { setCompanyName(''); }

      const email = localStorage.getItem('user_email') || '';
      setUserEmail(email);

      try { const ins = await getAIInsights(); setInsights(ins.data?.insights || []); }
      catch { setInsights([]); }

      try { const b = await getDailyBriefing(); setBriefing(b.data); }
      catch { setBriefing(null); }

      const revenue  = sData?.total_revenue  || 0;
      const expenses = sData?.total_expenses || 0;
      const net      = revenue - expenses;
      const docs     = sData?.docs_processed || 0;

      setPageContext('dashboard', {
        page: 'dashboard', company_name: fetchedName,
        total_revenue: revenue, total_expenses: expenses, net_profit: net,
        docs_processed: docs, uncategorized: sData?.uncategorized || 0,
        recent_txns: tData.slice(0, 5),
        monthly_summary: sData?.monthly_summary || [],
        expense_breakdown: sData?.expense_breakdown || [],
        summary_text: `Revenue: $${revenue.toFixed(2)}, Expenses: $${expenses.toFixed(2)}, Net: $${net.toFixed(2)}, Documents: ${docs}`,
      });
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const askWithData = (question) => {
    const s = statsRef.current;
    if (s && (s.total_revenue > 0 || s.total_expenses > 0)) {
      const revenue  = s.total_revenue  || 0;
      const expenses = s.total_expenses || 0;
      const net      = revenue - expenses;
      const docs     = s.docs_processed || 0;
      const enriched = `${question}\n\nDASHBOARD DATA:\n- Revenue: $${revenue.toFixed(2)}\n- Expenses: $${expenses.toFixed(2)}\n- Net profit: $${net.toFixed(2)}\n- Documents: ${docs}\n- Estimated tax (15%): $${(net * 0.15).toFixed(2)}`;
      return askAndOpen(enriched);
    }
    return askAndOpen(question);
  };

  useEffect(() => {
    load();
    const handleDocumentUploaded = (event) => {
      load();
      const parts = [];
      if (event.detail?.filename)            parts.push(`${event.detail.filename} processed`);
      if (event.detail?.transaction_created) parts.push('transaction created');
      if (event.detail?.invoice_created)     parts.push(`invoice ${event.detail.invoice_number} created`);
      if (parts.length > 0) { setSuccess(`✅ ${parts.join(' — ')}`); setTimeout(() => setSuccess(''), 6000); }
    };
    window.addEventListener('ledgerflow:document-uploaded', handleDocumentUploaded);
    return () => window.removeEventListener('ledgerflow:document-uploaded', handleDocumentUploaded);
  }, []);

  const net     = (stats?.total_revenue || 0) - (stats?.total_expenses || 0);
  const hasData = (stats?.total_revenue || 0) > 0 || (stats?.total_expenses || 0) > 0;
  const hasTxns = txns.length > 0;
  const hasPie  = (stats?.expense_breakdown || []).length > 0;

  const chartData = stats?.monthly_summary?.length
    ? [...stats.monthly_summary].reverse().map(m => ({ month: m.month?.slice(0, 7) || '', expenses: Math.abs(m.total_expenses || 0), income: m.total_income || 0 }))
    : ['Jan','Feb','Mar','Apr','May','Jun'].map(m => ({ month:m, expenses:0, income:0 }));

  const pieData = (stats?.expense_breakdown || []).slice(0, 6).map(b => ({ name: b.category, value: b.total }));

  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName   = companyName || (userEmail ? userEmail.split('@')[0].split('.')[0] : '');
  const displayName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : '';

  const padding = isMobile ? '16px' : '24px 28px';

  return (
    <div style={page}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.98)} }`}</style>

      {/* ── Top bar ── */}
      {!isMobile && (
        <div style={topBar}>
          <div>
            <div style={{ fontSize:12, color:L.textMuted, marginBottom:3 }}>
              {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </div>
            <div style={{ fontSize:22, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>
              {greeting}{displayName ? `, ${displayName}` : ''} 👋🏽
            </div>
            <div style={{ fontSize:12, color:L.textMuted, marginTop:3 }}>
              {hasData ? 'Here is your business financial summary' : 'Welcome to Novala — let us get your finances set up'}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:12, fontFamily:L.font }}>
              <RefreshCw size={13}/> Refresh
            </button>
            <button onClick={async () => { try { const t = await getTransactions({}); if (!t.data || t.data.length === 0) { alert('No transactions to export yet.'); return; } generateReport(stats, t.data, companyName || 'Novala'); } catch (err) { alert('Could not generate report: ' + err.message); } }}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:12, fontFamily:L.font, fontWeight:500 }}>
              <Download size={13}/> Export PDF
            </button>
            <button onClick={() => askWithData('Give me a complete summary of my business finances with revenue, expenses, net profit, and 3 specific recommendations.')}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:L.radiusSm, background:'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)', border:'none', color:'#FFFFFF', cursor:'pointer', fontSize:12, fontFamily:L.font, fontWeight:600, boxShadow:'0 2px 8px rgba(10,185,138,0.3)' }}>
              <Sparkles size={13}/> Ask AI
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile header ── */}
      {isMobile && (
        <div style={{ padding:'16px', borderBottom:`1px solid ${L.border}`, background:'#fff' }}>
          <div style={{ fontSize:18, fontWeight:700, color:L.text, marginBottom:4 }}>
            {greeting}{displayName ? `, ${displayName}` : ''} 👋🏽
          </div>
          <div style={{ fontSize:11, color:L.textMuted, marginBottom:12 }}>
            {hasData ? 'Your financial summary' : 'Welcome to Novala'}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={load} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:12, fontFamily:L.font }}>
              <RefreshCw size={13}/> Refresh
            </button>
            <button onClick={() => askWithData('Give me a complete summary of my business finances.')}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px', borderRadius:L.radiusSm, background:'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)', border:'none', color:'#FFFFFF', cursor:'pointer', fontSize:12, fontFamily:L.font, fontWeight:600 }}>
              <Sparkles size={13}/> Ask AI
            </button>
          </div>
        </div>
      )}

      {success && (
        <div style={{ margin: isMobile ? '12px 16px' : '0 28px 16px', padding:'12px 16px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:8 }}>
          <Sparkles size={14}/>{success}
        </div>
      )}

      <div style={{ padding, maxWidth:1400, margin:'0 auto' }}>

        {/* Morning Briefing Card */}
        <BriefingCard onAskWithData={askWithData} />

        {/* Money Brain */}
        {briefing && (briefing.observations?.length > 0 || briefing.actions?.length > 0) && (
          <div style={{ ...card, padding: isMobile ? '16px' : '20px 24px', marginBottom:20, border:`1px solid rgba(10,185,138,0.2)`, background:'linear-gradient(135deg, rgba(10,185,138,0.04) 0%, rgba(14,165,233,0.04) 100%)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(10,185,138,0.3)', flexShrink:0 }}>
                  <Brain size={18} color="#FFFFFF"/>
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:L.text }}>Novala Money Brain</div>
                  <div style={{ fontSize:11, color:L.textMuted }}>Proactive financial intelligence</div>
                </div>
              </div>
              <button onClick={() => askWithData('Give me a full financial briefing. What problems do you see and what should I do today?')}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:20, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
                <Sparkles size={10}/> Briefing
              </button>
            </div>
            {briefing.observations?.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>What I noticed</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {briefing.observations.map((obs, i) => (
                    <div key={i} onClick={() => askWithData(`Tell me more about this: ${obs}`)}
                      style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 12px', borderRadius:L.radiusSm, background:'rgba(10,185,138,0.06)', border:'1px solid rgba(10,185,138,0.12)', cursor:'pointer' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:L.accent, flexShrink:0, marginTop:5 }}/>
                      <span style={{ fontSize:12, color:L.textSub, lineHeight:1.5 }}>{obs}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {briefing.actions?.length > 0 && (
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Recommended actions</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {briefing.actions.map((action, i) => (
                    <button key={i} onClick={() => askWithData(`Help me: ${action}`)}
                      style={{ padding:'6px 14px', borderRadius:20, background:L.accent, color:'#FFFFFF', border:'none', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font, display:'flex', alignItems:'center', gap:5, boxShadow:'0 2px 6px rgba(10,185,138,0.3)' }}>
                      <ArrowRight size={10}/>{action}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Getting started */}
        {!loading && !hasData && (
          <div style={{ ...card, padding: isMobile ? '16px' : '20px 24px', marginBottom:20, background:'linear-gradient(135deg, rgba(10,185,138,0.06) 0%, rgba(14,165,233,0.06) 100%)', border:`1px solid ${L.accentBorder}` }}>
            <div style={{ fontSize:15, fontWeight:700, color:L.text, marginBottom:6 }}>🚀 Get started with Novala</div>
            <div style={{ fontSize:13, color:L.textMuted, marginBottom:16, lineHeight:1.6 }}>Upload your first document to start tracking expenses, revenue, and taxes automatically.</div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(180px,1fr))', gap:10 }}>
              {[
                { icon:Upload,     label:'Upload document', sub:'Invoice or receipt',    path:'/documents', color:L.accent  },
                { icon:Receipt,    label:'Scan receipt',    sub:'AI reads it instantly', path:'/receipts',  color:L.blue    },
                { icon:TrendingUp, label:'Set budget',      sub:'Track spending',        path:'/budgets',   color:'#8B5CF6' },
                { icon:Sparkles,   label:'Ask AI',          sub:'Financial advisor',     onClick:() => askAndOpen('I just joined Novala. What should I do first?'), color:'#F59E0B' },
              ].map(item => (
                <button key={item.label} onClick={item.onClick || (() => window.location.href = item.path)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'12px', borderRadius:L.radiusSm, background:'#FFFFFF', border:`1px solid ${L.border}`, cursor:'pointer', fontFamily:L.font }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`${item.color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <item.icon size={15} color={item.color}/>
                  </div>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:L.text }}>{item.label}</div>
                    <div style={{ fontSize:10, color:L.textMuted }}>{item.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Metric cards — 2x2 on mobile, 4 across on desktop ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}>
          <MetricCard label="Documents" value={stats?.docs_processed ?? 0} sub="Total uploaded" color={L.accent} icon={FileText} loading={loading} isEmpty={!loading && !stats?.docs_processed} emptyText="Upload first doc" onClick={() => askWithData('How many documents have I uploaded and what was extracted?')} />
          <MetricCard label="Expenses" value={fmt(stats?.total_expenses)} sub="This period" color={L.red} icon={ArrowDown} loading={loading} isEmpty={!loading && !stats?.total_expenses} emptyText="No expenses yet" onClick={() => askWithData('Break down my total expenses by category. Which costs the most?')} />
          <MetricCard label="Revenue" value={fmt(stats?.total_revenue)} sub="This period" color={L.accent} icon={ArrowUp} loading={loading} isEmpty={!loading && !stats?.total_revenue} emptyText="No revenue yet" onClick={() => askWithData('Summarize my total revenue. Where is it coming from?')} />
          <MetricCard label="Net Position" value={fmt(net)} sub="Revenue minus expenses" color={net >= 0 ? L.accent : L.red} icon={net >= 0 ? ArrowUp : ArrowDown} loading={loading} isEmpty={!loading && !hasData} emptyText="Add data to see" onClick={() => askWithData('What is my net financial position and how can I improve it?')} />
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:L.text, marginBottom:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <Sparkles size={14} color={L.accent}/>
                AI Insights
                {companyName && !isMobile && <span style={{ color:L.textMuted, fontWeight:400 }}>— for {companyName}</span>}
              </div>
              <button onClick={() => askWithData('Generate fresh financial insights for my business')}
                style={{ fontSize:11, color:L.accent, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, borderRadius:20, padding:'4px 12px', cursor:'pointer', fontFamily:L.font, display:'flex', alignItems:'center', gap:5 }}>
                <RefreshCw size={10}/> Refresh
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px,1fr))', gap:10 }}>
              {insights.map((ins, i) => {
                const s = INSIGHT_STYLES[ins.type] || INSIGHT_STYLES.info;
                return (
                  <div key={i} onClick={() => askWithData(ins.action || ins.title)}
                    style={{ padding:'12px 14px', borderRadius:L.radiusSm, background:s.bg, border:`1px solid ${s.border}`, cursor:'pointer' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:s.color, marginBottom:5 }}>{ins.title}</div>
                    <div style={{ fontSize:11, color:L.textMuted, lineHeight:1.6, marginBottom:6 }}>{ins.description}</div>
                    <div style={{ fontSize:10, color:s.color, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}><ArrowRight size={10}/>{ins.action}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Charts — stack on mobile ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
          gap: 14,
          marginBottom: 20,
        }}>
          <div style={{ ...card, padding: isMobile ? '16px' : '22px 24px', position:'relative' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:L.text }}>Cash Flow</div>
                <div style={{ fontSize:12, color:L.textMuted, marginTop:3 }}>Income vs expenses</div>
              </div>
              <button onClick={() => askWithData('Analyze my cash flow. Is my business growing or shrinking?')}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:20, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:10, fontWeight:600, fontFamily:L.font }}>
                <Sparkles size={9}/> Analyze
              </button>
            </div>
            {!hasData && (
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', zIndex:2, pointerEvents:'none', width:'80%' }}>
                <div style={{ fontSize:13, fontWeight:600, color:L.textMuted }}>Upload documents to see trends</div>
              </div>
            )}
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
              <AreaChart data={chartData} margin={{ top:4, right:4, left:-16, bottom:0 }}>
                <defs>
                  <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={L.accent} stopOpacity={0.12}/><stop offset="100%" stopColor={L.accent} stopOpacity={0}/></linearGradient>
                  <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={L.red} stopOpacity={0.08}/><stop offset="100%" stopColor={L.red} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid stroke={L.border} strokeDasharray="4 4" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill:L.textMuted, fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:L.textMuted, fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`}/>
                <Tooltip contentStyle={{ background:'#FFFFFF', border:`1px solid ${L.border}`, borderRadius:L.radiusSm, fontSize:12, boxShadow:L.shadowMd }} formatter={(v, n) => [fmt(v), n === 'income' ? 'Income' : 'Expenses']}/>
                <Area type="monotone" dataKey="income"   stroke={L.accent} strokeWidth={2.5} fill="url(#gI)" dot={false}/>
                <Area type="monotone" dataKey="expenses" stroke={L.red}    strokeWidth={2.5} fill="url(#gE)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:20, marginTop:12 }}>
              {[{ color:L.accent, label:'Income' },{ color:L.red, label:'Expenses' }].map(l => (
                <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:14, height:2, borderRadius:1, background:l.color }}/><span style={{ fontSize:11, color:L.textMuted }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, padding: isMobile ? '16px' : '22px 24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:L.text }}>Expense Breakdown</div>
                <div style={{ fontSize:12, color:L.textMuted, marginTop:3 }}>Spending by category</div>
              </div>
              {hasPie && (
                <button onClick={() => askWithData('Which expense category costs me the most? How can I reduce it?')}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:20, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:10, fontWeight:600, fontFamily:L.font }}>
                  <Sparkles size={9}/> Analyze
                </button>
              )}
            </div>
            {!hasPie ? (
              <EmptyState icon={Receipt} title="No expense categories yet" description="Upload receipts and invoices to see your spending breakdown" action="Upload document" onAction={() => window.location.href = '/documents'} onAsk={() => askWithData('What expense categories should I be tracking?')} askLabel="Ask AI"/>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{ background:'#FFFFFF', border:`1px solid ${L.border}`, borderRadius:L.radiusSm, fontSize:11 }} formatter={v => [fmt(v)]}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                  {pieData.slice(0, 4).map((d, i) => (
                    <div key={d.name} onClick={() => askWithData(`Tell me about my ${d.name} expenses. How can I reduce this?`)}
                      style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'4px 6px', borderRadius:6 }}>
                      <div style={{ width:9, height:9, borderRadius:2, flexShrink:0, background:PIE_COLORS[i % PIE_COLORS.length] }}/>
                      <span style={{ fontSize:11, color:L.textSub, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</span>
                      <span style={{ fontSize:11, fontWeight:600, color:L.text, fontFamily:L.fontMono }}>{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Bottom row — stack on mobile ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
          gap: 14,
        }}>
          <div style={{ ...card, overflow:'hidden' }}>
            <div style={{ padding: isMobile ? '14px 16px' : '16px 22px', borderBottom:`1px solid ${L.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:L.text }}>Recent Transactions</div>
                <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>{hasTxns ? `${txns.length} most recent` : 'No transactions yet'}</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {hasTxns && !isMobile && (
                  <button onClick={() => askWithData('Analyze my recent transactions. Any unusual expenses?')}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:20, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
                    <Sparkles size={10}/> Analyze
                  </button>
                )}
                <button onClick={() => window.location.href = '/transactions'}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11, fontFamily:L.font }}>
                  View all <ArrowRight size={11}/>
                </button>
              </div>
            </div>

            {hasTxns && !isMobile && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 130px 90px', padding:'8px 22px', borderBottom:`1px solid ${L.pageBg}`, background:L.pageBg }}>
                {['VENDOR','AMOUNT','CATEGORY','STATUS'].map(h => (
                  <div key={h} style={{ fontSize:9, fontWeight:700, color:L.textMuted, letterSpacing:'0.12em' }}>{h}</div>
                ))}
              </div>
            )}

            {loading ? (
              <div style={{ padding:40, textAlign:'center', color:L.textMuted, fontSize:13 }}>Loading transactions...</div>
            ) : !hasTxns ? (
              <EmptyState icon={TrendingUp} title="No transactions yet" description="Upload an invoice or receipt and AI will automatically create transactions" action="Upload document" onAction={() => window.location.href = '/documents'} onAsk={() => askAndOpen('How do I add transactions to Novala?')} askLabel="How do I add transactions?"/>
            ) : isMobile ? (
              // Mobile transaction list — simplified
              txns.map((t, i) => (
                <div key={t.id} onClick={() => askWithData(`Tell me about: ${t.vendor} $${Math.abs(t.amount)} on ${t.txn_date}. Is it deductible?`)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom: i < txns.length - 1 ? `1px solid ${L.pageBg}` : 'none', cursor:'pointer' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:L.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.vendor || '—'}</div>
                    <div style={{ fontSize:10, color:L.textMuted, marginTop:2 }}>{t.txn_date} · {t.category || 'Uncategorized'}</div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, fontFamily:L.fontMono, color: t.txn_type === 'income' ? L.accent : L.red, flexShrink:0 }}>
                    {t.txn_type === 'income' ? '+' : '-'}{fmt(Math.abs(t.amount))}
                  </div>
                </div>
              ))
            ) : (
              txns.map((t, i) => (
                <div key={t.id} onClick={() => askWithData(`Tell me about: ${t.vendor} $${Math.abs(t.amount)} on ${t.txn_date}. Is it deductible?`)}
                  style={{ display:'grid', gridTemplateColumns:'1fr 110px 130px 90px', padding:'12px 22px', borderBottom: i < txns.length - 1 ? `1px solid ${L.pageBg}` : 'none', alignItems:'center', cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = L.pageBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:L.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.vendor || '—'}</div>
                    {t.txn_date && <div style={{ fontSize:10, color:L.textMuted, marginTop:2 }}>{t.txn_date}</div>}
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, fontFamily:L.fontMono, color: t.txn_type === 'income' ? L.accent : L.red }}>
                    {t.txn_type === 'income' ? '+' : '-'}{fmt(Math.abs(t.amount))}
                  </div>
                  <div>
                    {(t.category || t.ml_category) ? (
                      <span style={{ fontSize:10, fontWeight:500, color:L.blue, background:L.blueSoft, padding:'2px 8px', borderRadius:20, border:`1px solid ${L.blueBorder}` }}>{t.category || t.ml_category}</span>
                    ) : (
                      <span style={{ fontSize:10, color:L.textMuted, background:L.pageBg, padding:'2px 8px', borderRadius:20, border:`1px solid ${L.border}` }}>Uncategorized</span>
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize:10, fontWeight:600, color: t.status === 'flagged' ? '#F59E0B' : L.accent, background: t.status === 'flagged' ? 'rgba(245,158,11,0.08)' : L.accentSoft, padding:'2px 8px', borderRadius:20, border:`1px solid ${t.status === 'flagged' ? 'rgba(245,158,11,0.2)' : L.accentBorder}` }}>
                      {t.status === 'flagged' ? '⚠ Flagged' : '✓ OK'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ ...card, padding:'18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 8px rgba(10,185,138,0.25)' }}>
                  <Sparkles size={16} color="#FFFFFF"/>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:L.text }}>Talk to your finances</div>
                  <div style={{ fontSize:11, color:L.textMuted }}>Ask anything in plain English</div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[
                  { q:'How much did I spend this month?',    icon:'💰' },
                  { q:'Which expenses are tax deductible?',  icon:'📋' },
                  { q:'What is my estimated tax this year?', icon:'🧮' },
                  { q:'Find my largest transactions',         icon:'🔍' },
                  { q:'How is my business doing overall?',   icon:'📊' },
                  { q:'What should I focus on this week?',   icon:'🎯' },
                ].map(item => (
                  <button key={item.q} onClick={() => askWithData(item.q)}
                    style={{ padding:'8px 12px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}`, color:L.textSub, cursor:'pointer', fontSize:12, fontFamily:L.font, textAlign:'left', display:'flex', alignItems:'center', gap:8 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = L.accentBorder; e.currentTarget.style.color = L.accent; e.currentTarget.style.background = L.accentSoft; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = L.border; e.currentTarget.style.color = L.textSub; e.currentTarget.style.background = L.pageBg; }}>
                    <span style={{ fontSize:14 }}>{item.icon}</span>
                    <span style={{ flex:1 }}>{item.q}</span>
                    <ArrowRight size={11}/>
                  </button>
                ))}
              </div>
            </div>

            {stats?.uncategorized > 0 && (
              <div onClick={() => askWithData(`I have ${stats.uncategorized} uncategorized transactions. Help me categorize them.`)}
                style={{ padding:'12px 14px', borderRadius:L.radiusSm, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <AlertTriangle size={16} color="#F59E0B"/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#F59E0B' }}>{stats.uncategorized} transactions need review</div>
                  <div style={{ fontSize:11, color:L.textMuted, marginTop:2 }}>Click to ask AI for help</div>
                </div>
                <ArrowRight size={12} color="#F59E0B"/>
              </div>
            )}

            {(companyName || userEmail) && (
              <div style={{ ...card, padding:'14px 16px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Business Profile</div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:14, fontWeight:700, color:'#FFFFFF' }}>
                    {(companyName || userEmail)[0].toUpperCase()}
                  </div>
                  <div>
                    {companyName && <div style={{ fontSize:13, fontWeight:700, color:L.text }}>{companyName}</div>}
                    <div style={{ fontSize:11, color:L.textMuted }}>{userEmail}</div>
                  </div>
                </div>
                <button onClick={() => window.location.href = '/company-profile'}
                  style={{ marginTop:10, width:'100%', padding:'7px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11, fontFamily:L.font }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = L.accentBorder; e.currentTarget.style.color = L.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = L.border; e.currentTarget.style.color = L.textMuted; }}>
                  Edit company profile →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}