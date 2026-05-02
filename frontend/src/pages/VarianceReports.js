import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Download, Sparkles, ArrowRight,
  BarChart2, RefreshCw, Target,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';
import { useAI } from '../hooks/useAI';
import { getTransactions, getBudgets } from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ACCENT = '#0AB98A';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

const fmt = (n) => new Intl.NumberFormat('en-US', {
  style:'currency', currency:'USD', minimumFractionDigits:2,
}).format(Number(n) || 0);

const fmtPct = (n) => `${n > 0 ? '+' : ''}${Number(n).toFixed(1)}%`;

const PERIODS = [
  { label:'This Month',    value:'month'   },
  { label:'This Quarter',  value:'quarter' },
  { label:'This Year',     value:'year'    },
  { label:'Last 3 Months', value:'3months' },
];

function getDateRange(period) {
  const now   = new Date();
  const start = new Date();
  switch (period) {
    case 'month':   start.setDate(1); break;
    case 'quarter': start.setMonth(Math.floor(now.getMonth()/3)*3, 1); break;
    case 'year':    start.setMonth(0,1); break;
    case '3months': start.setMonth(now.getMonth()-3); break;
    default:        start.setDate(1);
  }
  return {
    start: start.toISOString().split('T')[0],
    end:   now.toISOString().split('T')[0],
  };
}

function getPrevDateRange(period) {
  const now   = new Date();
  const start = new Date();
  const end   = new Date();
  switch (period) {
    case 'month':
      start.setMonth(now.getMonth()-1, 1);
      end.setDate(0);
      break;
    case 'quarter':
      const q = Math.floor(now.getMonth()/3);
      start.setMonth((q-1)*3, 1);
      end.setMonth(q*3, 0);
      break;
    case 'year':
      start.setFullYear(now.getFullYear()-1, 0, 1);
      end.setFullYear(now.getFullYear()-1, 11, 31);
      break;
    case '3months':
      start.setMonth(now.getMonth()-6);
      end.setMonth(now.getMonth()-3);
      break;
    default:
      start.setMonth(now.getMonth()-1, 1);
      end.setDate(0);
  }
  return {
    start: start.toISOString().split('T')[0],
    end:   end.toISOString().split('T')[0],
  };
}

function VarianceBar({ actual, budget, color }) {
  const pct = budget > 0 ? Math.min((actual/budget)*100, 150) : 0;
  const over = pct > 100;
  return (
    <div style={{ marginTop:6 }}>
      <div style={{ height:6, background:L.pageBg, borderRadius:99, overflow:'hidden', position:'relative' }}>
        <div style={{ width:`${Math.min(pct,100)}%`, height:'100%', background:over?L.red:ACCENT, borderRadius:99, transition:'width 0.5s ease' }}/>
        {over && <div style={{ position:'absolute', left:'100%', top:0, width:`${pct-100}%`, height:'100%', background:'rgba(239,68,68,0.3)', borderRadius:'0 99px 99px 0' }}/>}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
        <span style={{ fontSize:9, color:L.textFaint }}>0</span>
        <span style={{ fontSize:9, color:over?L.red:L.textFaint }}>{pct.toFixed(0)}% of budget</span>
      </div>
    </div>
  );
}

export default function VarianceReports() {
  const [txns,    setTxns]    = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('month');
  const [tab,     setTab]     = useState('budget');
  const { setPageContext, askAndOpen } = useAI();
  const isMobile = useIsMobile();

  useEffect(() => {
    setPageContext('variance', { page:'variance' });
    const load = async () => {
      try {
        const [tRes, bRes] = await Promise.all([getTransactions({}), getBudgets()]);
        setTxns(Array.isArray(tRes.data)  ? tRes.data  : []);
        setBudgets(Array.isArray(bRes.data) ? bRes.data : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const { start, end }         = getDateRange(period);
  const { start:ps, end:pe }   = getPrevDateRange(period);
  const periodLabel            = PERIODS.find(p => p.value === period)?.label || '';

  // Current period transactions
  const currentTxns = txns.filter(t => t.txn_date >= start && t.txn_date <= end);
  const prevTxns    = txns.filter(t => t.txn_date >= ps    && t.txn_date <= pe);

  // Expense by category — current period
  const currentExpByCategory = currentTxns
    .filter(t => t.txn_type === 'expense')
    .reduce((acc,t) => {
      const cat = t.category || 'Uncategorized';
      acc[cat]  = (acc[cat]||0) + Math.abs(t.amount||0);
      return acc;
    }, {});

  // Expense by category — previous period
  const prevExpByCategory = prevTxns
    .filter(t => t.txn_type === 'expense')
    .reduce((acc,t) => {
      const cat = t.category || 'Uncategorized';
      acc[cat]  = (acc[cat]||0) + Math.abs(t.amount||0);
      return acc;
    }, {});

  // ── Budget vs Actual ──────────────────────────────────────
  const budgetVariance = budgets.map(b => {
    const actual   = currentExpByCategory[b.category] || 0;
    const budget   = b.amount || 0;
    const variance = actual - budget;
    const pct      = budget > 0 ? (variance/budget)*100 : 0;
    const status   = actual <= budget*0.8 ? 'good' : actual <= budget ? 'warning' : 'over';
    return { category:b.category, budget, actual, variance, pct, status };
  }).sort((a,b) => b.variance - a.variance);

  // Categories with spending but no budget
  const unbudgeted = Object.entries(currentExpByCategory)
    .filter(([cat]) => !budgets.find(b => b.category === cat))
    .map(([category, actual]) => ({ category, budget:0, actual, variance:actual, pct:100, status:'over' }));

  const allBudgetRows = [...budgetVariance, ...unbudgeted];

  // ── Month over Month ──────────────────────────────────────
  const allCategories = new Set([
    ...Object.keys(currentExpByCategory),
    ...Object.keys(prevExpByCategory),
  ]);

  const momVariance = Array.from(allCategories).map(cat => {
    const current  = currentExpByCategory[cat] || 0;
    const previous = prevExpByCategory[cat]    || 0;
    const variance = current - previous;
    const pct      = previous > 0 ? (variance/previous)*100 : current > 0 ? 100 : 0;
    return { category:cat, current, previous, variance, pct };
  }).sort((a,b) => Math.abs(b.variance) - Math.abs(a.variance));

  // ── Summary stats ─────────────────────────────────────────
  const totalBudget   = budgets.reduce((s,b) => s+(b.amount||0), 0);
  const totalActual   = Object.values(currentExpByCategory).reduce((s,v) => s+v, 0);
  const totalVariance = totalActual - totalBudget;
  const overBudget    = allBudgetRows.filter(r => r.status === 'over').length;
  const currentIncome = currentTxns.filter(t => t.txn_type==='income').reduce((s,t) => s+Math.abs(t.amount||0), 0);
  const prevIncome    = prevTxns.filter(t => t.txn_type==='income').reduce((s,t) => s+Math.abs(t.amount||0), 0);
  const incomeVariance = currentIncome - prevIncome;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(10,185,138);
    doc.text('Novala', 14, 18);
    doc.setFontSize(13); doc.setTextColor(100);
    doc.text('Variance Report', 14, 26);
    doc.setFontSize(10);
    doc.text(`Period: ${periodLabel} · Generated: ${new Date().toLocaleDateString()}`, 14, 34);

    if (tab === 'budget') {
      autoTable(doc, {
        startY:42,
        head:[['Category','Budget','Actual','Variance','Status']],
        body:allBudgetRows.map(r => [
          r.category, fmt(r.budget), fmt(r.actual),
          `${r.variance>0?'+':''}${fmt(r.variance)}`,
          r.status==='over'?'Over Budget':r.status==='warning'?'Near Limit':'On Track',
        ]),
        styles:{ fontSize:9 },
        headStyles:{ fillColor:[10,185,138], textColor:255 },
        columnStyles:{ 1:{halign:'right'}, 2:{halign:'right'}, 3:{halign:'right'} },
      });
    } else {
      autoTable(doc, {
        startY:42,
        head:[['Category','Previous','Current','Variance','Change']],
        body:momVariance.map(r => [
          r.category, fmt(r.previous), fmt(r.current),
          `${r.variance>0?'+':''}${fmt(r.variance)}`,
          fmtPct(r.pct),
        ]),
        styles:{ fontSize:9 },
        headStyles:{ fillColor:[10,185,138], textColor:255 },
        columnStyles:{ 1:{halign:'right'}, 2:{halign:'right'}, 3:{halign:'right'}, 4:{halign:'right'} },
      });
    }
    doc.save(`Novala_Variance_${period}.pdf`);
  };

  const pad = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>

      {/* Top bar */}
      <div style={{ ...topBar, flexDirection:isMobile?'column':'row', alignItems:isMobile?'flex-start':'center', gap:isMobile?10:0, padding:isMobile?'16px':undefined }}>
        <div>
          <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Variance Reports</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Budget vs Actual · Month over Month · {periodLabel}</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={exportPDF}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
            <Download size={13}/> Export PDF
          </button>
          <button onClick={() => askAndOpen(`Analyze my variance report for ${periodLabel}. Budget: ${fmt(totalBudget)}, Actual: ${fmt(totalActual)}, Variance: ${fmt(totalVariance)}. I have ${overBudget} categories over budget. What should I do?`)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', border:'none', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
            <Sparkles size={13}/> Ask AI
          </button>
        </div>
      </div>

      <div style={{ padding: pad }}>

        {/* Period selector */}
        <div style={{ display:'flex', gap:6, marginBottom:20, overflowX:'auto', scrollbarWidth:'none' }}>
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              style={{ padding:'7px 14px', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:600, border:'1px solid', whiteSpace:'nowrap', flexShrink:0, fontFamily:L.font, borderColor:period===p.value?L.accentBorder:L.border, background:period===p.value?L.accentSoft:'#fff', color:period===p.value?L.accent:L.textMuted }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:isMobile?10:14, marginBottom:20 }}>
          {[
            { label:'Total Budget',    value:fmt(totalBudget),   color:L.blue,                                    icon:<Target size={16}/> },
            { label:'Total Actual',    value:fmt(totalActual),   color:totalActual>totalBudget?L.red:ACCENT,      icon:<BarChart2 size={16}/> },
            { label:'Variance',        value:fmt(Math.abs(totalVariance)), color:totalVariance>0?L.red:ACCENT,   icon:totalVariance>0?<TrendingUp size={16}/>:<TrendingDown size={16}/> },
            { label:'Over Budget',     value:`${overBudget} cat${overBudget!==1?'s':''}`, color:overBudget>0?L.red:ACCENT, icon:<AlertTriangle size={16}/> },
          ].map(c => (
            <div key={c.label} style={{ ...card, padding:isMobile?'12px 14px':'18px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em', textTransform:'uppercase' }}>{c.label}</div>
                <span style={{ color:c.color, opacity:0.7 }}>{c.icon}</span>
              </div>
              <div style={{ fontSize:isMobile?16:20, fontWeight:700, color:c.color, fontFamily:L.fontMono }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Income variance banner */}
        {(currentIncome > 0 || prevIncome > 0) && (
          <div style={{ ...card, padding:isMobile?'14px 16px':'16px 22px', marginBottom:20, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <div style={{ width:40, height:40, borderRadius:10, background:incomeVariance>=0?L.accentSoft:'rgba(239,68,68,0.08)', border:`1px solid ${incomeVariance>=0?L.accentBorder:'rgba(239,68,68,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {incomeVariance >= 0 ? <TrendingUp size={18} color={ACCENT}/> : <TrendingDown size={18} color={L.red}/>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:L.text }}>Revenue {incomeVariance >= 0 ? 'Up' : 'Down'} vs Previous Period</div>
              <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>
                Previous: {fmt(prevIncome)} → Current: {fmt(currentIncome)}
                <span style={{ color:incomeVariance>=0?ACCENT:L.red, fontWeight:600, marginLeft:8 }}>
                  {incomeVariance>=0?'+':''}{fmt(incomeVariance)} ({fmtPct(prevIncome>0?(incomeVariance/prevIncome)*100:0)})
                </span>
              </div>
            </div>
            <button onClick={() => askAndOpen(`My revenue changed from ${fmt(prevIncome)} to ${fmt(currentIncome)} — a variance of ${fmt(incomeVariance)}. Is this normal and what should I do?`)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:ACCENT, cursor:'pointer', fontSize:11, fontFamily:L.font }}>
              <Sparkles size={11}/> Analyze
            </button>
          </div>
        )}

        {/* Tab selector */}
        <div style={{ display:'flex', gap:0, marginBottom:20, background:L.pageBg, borderRadius:L.radius, padding:4, border:`1px solid ${L.border}`, width:'fit-content' }}>
          {[
            { id:'budget', label:'Budget vs Actual' },
            { id:'mom',    label:'Month over Month'  },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:isMobile?'8px 14px':'9px 20px', borderRadius:L.radiusSm, fontSize:13, fontWeight:600, fontFamily:L.font, cursor:'pointer', border:'none', background:tab===t.id?'#fff':'transparent', color:tab===t.id?L.text:L.textMuted, boxShadow:tab===t.id?'0 1px 4px rgba(0,0,0,0.08)':'none', whiteSpace:'nowrap' }}>
              {isMobile ? t.label.split(' ')[0] : t.label}
            </button>
          ))}
        </div>

        {loading && <div style={{ padding:60, textAlign:'center', color:L.textMuted }}>Loading...</div>}

        {!loading && txns.length === 0 && (
          <div style={{ ...card, padding:60, textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:16, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <BarChart2 size={24} color={L.accent}/>
            </div>
            <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:6 }}>No transaction data yet</div>
            <div style={{ fontSize:13, color:L.textMuted }}>Upload documents to generate variance reports</div>
          </div>
        )}

        {/* ── Budget vs Actual ── */}
        {!loading && tab === 'budget' && txns.length > 0 && (
          <div style={{ ...card, overflow:'hidden' }}>
            <div style={{ padding:isMobile?'14px 16px':'16px 22px', borderBottom:`1px solid ${L.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:L.text }}>Budget vs Actual Spending</div>
                <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>{periodLabel}</div>
              </div>
              {budgets.length === 0 && (
                <button onClick={() => window.location.href='/budgets'}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:L.radiusSm, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
                  <ArrowRight size={11}/> Set Budgets
                </button>
              )}
            </div>

            {budgets.length === 0 && unbudgeted.length === 0 && (
              <div style={{ padding:40, textAlign:'center', color:L.textMuted }}>
                <Target size={32} color={L.textFaint} style={{ marginBottom:12 }}/>
                <div style={{ fontSize:14, fontWeight:600, color:L.textSub, marginBottom:6 }}>No budgets set</div>
                <div style={{ fontSize:12 }}>Set budgets to compare against your actual spending</div>
              </div>
            )}

            {/* Desktop header */}
            {!isMobile && allBudgetRows.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 130px 130px 130px 100px 180px', padding:'8px 22px', borderBottom:`1px solid ${L.border}`, background:L.pageBg }}>
                {['CATEGORY','BUDGET','ACTUAL','VARIANCE','STATUS','PROGRESS'].map(h => (
                  <div key={h} style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em' }}>{h}</div>
                ))}
              </div>
            )}

            {allBudgetRows.map(row => {
              const isOver    = row.status === 'over';
              const isWarning = row.status === 'warning';
              const color     = isOver ? L.red : isWarning ? '#F59E0B' : ACCENT;

              if (isMobile) {
                return (
                  <div key={row.category} style={{ padding:'14px 16px', borderBottom:`1px solid ${L.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:L.text, flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.category}</div>
                      <span style={{ fontSize:11, fontWeight:700, color, background:`${color}15`, padding:'2px 8px', borderRadius:20, flexShrink:0, marginLeft:8 }}>
                        {isOver?'Over Budget':isWarning?'Near Limit':'On Track'}
                      </span>
                    </div>
                    <div style={{ display:'flex', gap:16, marginBottom:6 }}>
                      <div>
                        <div style={{ fontSize:9, color:L.textFaint, textTransform:'uppercase', letterSpacing:'0.08em' }}>Budget</div>
                        <div style={{ fontSize:13, fontWeight:600, color:L.textSub, fontFamily:L.fontMono }}>{fmt(row.budget)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:L.textFaint, textTransform:'uppercase', letterSpacing:'0.08em' }}>Actual</div>
                        <div style={{ fontSize:13, fontWeight:600, color, fontFamily:L.fontMono }}>{fmt(row.actual)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:L.textFaint, textTransform:'uppercase', letterSpacing:'0.08em' }}>Variance</div>
                        <div style={{ fontSize:13, fontWeight:600, color, fontFamily:L.fontMono }}>{row.variance>0?'+':''}{fmt(row.variance)}</div>
                      </div>
                    </div>
                    <VarianceBar actual={row.actual} budget={row.budget} color={color}/>
                  </div>
                );
              }

              return (
                <div key={row.category}
                  style={{ display:'grid', gridTemplateColumns:'1fr 130px 130px 130px 100px 180px', padding:'13px 22px', borderBottom:`1px solid ${L.border}`, alignItems:'center', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background=L.pageBg}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <div style={{ fontSize:13, fontWeight:500, color:L.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.category}</div>
                  <div style={{ fontSize:13, fontFamily:L.fontMono, color:L.textSub }}>{fmt(row.budget)}</div>
                  <div style={{ fontSize:13, fontFamily:L.fontMono, color, fontWeight:600 }}>{fmt(row.actual)}</div>
                  <div style={{ fontSize:13, fontFamily:L.fontMono, color, fontWeight:700 }}>{row.variance>0?'+':''}{fmt(row.variance)}</div>
                  <div>
                    <span style={{ fontSize:10, fontWeight:700, color, background:`${color}12`, padding:'3px 8px', borderRadius:20, border:`1px solid ${color}25` }}>
                      {isOver?'Over':isWarning?'Near':'OK'}
                    </span>
                  </div>
                  <div style={{ paddingRight:8 }}>
                    <VarianceBar actual={row.actual} budget={row.budget} color={color}/>
                  </div>
                </div>
              );
            })}

            {/* Total row */}
            {allBudgetRows.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'1fr 130px 130px 130px 100px 180px', padding:isMobile?'14px 16px':'14px 22px', background:L.pageBg, borderTop:`2px solid ${L.border}` }}>
                <div style={{ fontSize:13, fontWeight:700, color:L.text }}>Total</div>
                {!isMobile && <div style={{ fontSize:13, fontWeight:700, fontFamily:L.fontMono, color:L.text }}>{fmt(totalBudget)}</div>}
                <div style={{ fontSize:13, fontWeight:700, fontFamily:L.fontMono, color:totalActual>totalBudget?L.red:ACCENT }}>{fmt(totalActual)}</div>
                <div style={{ fontSize:13, fontWeight:700, fontFamily:L.fontMono, color:totalVariance>0?L.red:ACCENT }}>{totalVariance>0?'+':''}{fmt(totalVariance)}</div>
                {!isMobile && <div/>}
                {!isMobile && <div/>}
              </div>
            )}
          </div>
        )}

        {/* ── Month over Month ── */}
        {!loading && tab === 'mom' && txns.length > 0 && (
          <div style={{ ...card, overflow:'hidden' }}>
            <div style={{ padding:isMobile?'14px 16px':'16px 22px', borderBottom:`1px solid ${L.border}` }}>
              <div style={{ fontSize:14, fontWeight:700, color:L.text }}>Month over Month Spending</div>
              <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Current period vs previous period by category</div>
            </div>

            {!isMobile && momVariance.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 130px 130px 130px 120px', padding:'8px 22px', borderBottom:`1px solid ${L.border}`, background:L.pageBg }}>
                {['CATEGORY','PREVIOUS','CURRENT','CHANGE','% CHANGE'].map(h => (
                  <div key={h} style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em' }}>{h}</div>
                ))}
              </div>
            )}

            {momVariance.length === 0 && (
              <div style={{ padding:40, textAlign:'center', color:L.textMuted }}>No data for comparison period</div>
            )}

            {momVariance.map(row => {
              const improved = row.variance <= 0;
              const color    = improved ? ACCENT : L.red;

              if (isMobile) {
                return (
                  <div key={row.category} style={{ padding:'14px 16px', borderBottom:`1px solid ${L.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:L.text, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.category}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0, marginLeft:8 }}>
                        {improved ? <TrendingDown size={13} color={ACCENT}/> : <TrendingUp size={13} color={L.red}/>}
                        <span style={{ fontSize:12, fontWeight:700, color, fontFamily:L.fontMono }}>{fmtPct(row.pct)}</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:16 }}>
                      <div>
                        <div style={{ fontSize:9, color:L.textFaint, textTransform:'uppercase' }}>Previous</div>
                        <div style={{ fontSize:12, color:L.textSub, fontFamily:L.fontMono }}>{fmt(row.previous)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:L.textFaint, textTransform:'uppercase' }}>Current</div>
                        <div style={{ fontSize:12, color, fontFamily:L.fontMono, fontWeight:600 }}>{fmt(row.current)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:L.textFaint, textTransform:'uppercase' }}>Change</div>
                        <div style={{ fontSize:12, color, fontFamily:L.fontMono, fontWeight:600 }}>{row.variance>0?'+':''}{fmt(row.variance)}</div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={row.category}
                  style={{ display:'grid', gridTemplateColumns:'1fr 130px 130px 130px 120px', padding:'13px 22px', borderBottom:`1px solid ${L.border}`, alignItems:'center', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background=L.pageBg}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <div style={{ fontSize:13, fontWeight:500, color:L.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.category}</div>
                  <div style={{ fontSize:13, fontFamily:L.fontMono, color:L.textSub }}>{fmt(row.previous)}</div>
                  <div style={{ fontSize:13, fontFamily:L.fontMono, color, fontWeight:600 }}>{fmt(row.current)}</div>
                  <div style={{ fontSize:13, fontFamily:L.fontMono, color, fontWeight:700 }}>{row.variance>0?'+':''}{fmt(row.variance)}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    {improved ? <TrendingDown size={13} color={ACCENT}/> : <TrendingUp size={13} color={L.red}/>}
                    <span style={{ fontSize:12, fontWeight:700, color, fontFamily:L.fontMono }}>{fmtPct(row.pct)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AI Help */}
        {!loading && txns.length > 0 && (
          <div style={{ ...card, padding:isMobile?'16px':'20px 24px', marginTop:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Sparkles size={18} color="#fff"/>
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:L.text }}>AI Variance Analysis</div>
                <div style={{ fontSize:11, color:L.textMuted }}>Get smart insights on your spending patterns</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:8 }}>
              {[
                { q:'Which categories am I most over budget and why?',          icon:'🎯' },
                { q:'Where has my spending increased the most vs last month?',  icon:'📈' },
                { q:'How can I reduce my biggest variance categories?',          icon:'💡' },
              ].map(item => (
                <button key={item.q} onClick={() => askAndOpen(item.q)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'12px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}`, cursor:'pointer', fontFamily:L.font, textAlign:'left' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=L.accentBorder; e.currentTarget.style.background=L.accentSoft; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=L.border; e.currentTarget.style.background=L.pageBg; }}>
                  <span style={{ fontSize:20 }}>{item.icon}</span>
                  <span style={{ fontSize:12, color:L.textSub, flex:1, lineHeight:1.4 }}>{item.q}</span>
                  <ArrowRight size={12} color={L.textFaint}/>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}