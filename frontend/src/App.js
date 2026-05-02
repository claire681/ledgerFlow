import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Upload, Download, Search, Filter, Sparkles,
  ArrowRight, DollarSign, Calendar, Tag,
  CheckSquare, Square, TrendingUp, TrendingDown,
} from 'lucide-react';
import { L, card, page, topBar } from './styles/light';
import { useAI } from '../hooks/useAI';
import { getTransactions } from '../services/api';
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

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:2 }).format(Number(n)||0);

const STATUS = {
  matched:    { label:'Matched',    color:ACCENT,    bg:'rgba(10,185,138,0.08)',  border:'rgba(10,185,138,0.2)'  },
  unmatched:  { label:'Unmatched',  color:'#F59E0B', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)'  },
  reconciled: { label:'Reconciled', color:'#3B82F6', bg:'rgba(59,130,246,0.08)', border:'rgba(59,130,246,0.2)'  },
  flagged:    { label:'Flagged',    color:L.red,     bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.2)'   },
};

export default function Reconciliation() {
  const [txns,         setTxns]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState(new Set());
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reconciled,   setReconciled]   = useState(new Set());
  const [flagged,      setFlagged]      = useState(new Set());
  const [saving,       setSaving]       = useState(false);
  const [success,      setSuccess]      = useState('');
  const { setPageContext, askAndOpen }  = useAI();
  const isMobile = useIsMobile();

  useEffect(() => {
    setPageContext('reconciliation', { page:'reconciliation' });
    const load = async () => {
      try {
        const res = await getTransactions({});
        setTxns(Array.isArray(res.data) ? res.data : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const getStatus = (t) => {
    if (reconciled.has(t.id)) return 'reconciled';
    if (flagged.has(t.id))    return 'flagged';
    if (t.status === 'flagged') return 'unmatched';
    if (t.category && t.category !== 'Uncategorized') return 'matched';
    return 'unmatched';
  };

  const filtered = txns.filter(t => {
    const matchSearch = !search ||
      (t.vendor||'').toLowerCase().includes(search.toLowerCase()) ||
      (t.category||'').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || getStatus(t) === filterStatus;
    return matchSearch && matchStatus;
  });

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(t => t.id)));
  };

  const reconcileSelected = () => {
    setSaving(true);
    setTimeout(() => {
      setReconciled(prev => {
        const next = new Set(prev);
        selected.forEach(id => next.add(id));
        return next;
      });
      setFlagged(prev => {
        const next = new Set(prev);
        selected.forEach(id => next.delete(id));
        return next;
      });
      setSelected(new Set());
      setSuccess(`✓ ${selected.size} transaction${selected.size!==1?'s':''} reconciled`);
      setTimeout(() => setSuccess(''), 4000);
      setSaving(false);
    }, 600);
  };

  const flagSelected = () => {
    setFlagged(prev => {
      const next = new Set(prev);
      selected.forEach(id => next.add(id));
      return next;
    });
    setSelected(new Set());
    setSuccess(`⚑ ${selected.size} transaction${selected.size!==1?'s':''} flagged for review`);
    setTimeout(() => setSuccess(''), 4000);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(10,185,138);
    doc.text('Novala', 14, 18);
    doc.setFontSize(13); doc.setTextColor(100);
    doc.text('Reconciliation Report', 14, 26);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);
    doc.text(`Total transactions: ${txns.length} · Reconciled: ${reconciled.size} · Flagged: ${flagged.size}`, 14, 40);

    const rows = filtered.map(t => [
      t.txn_date||'—',
      t.vendor||'—',
      fmt(t.amount),
      t.txn_type,
      t.category||'Uncategorized',
      STATUS[getStatus(t)]?.label||'—',
    ]);

    autoTable(doc, {
      startY:48,
      head:[['Date','Vendor','Amount','Type','Category','Status']],
      body:rows,
      styles:{ fontSize:9 },
      headStyles:{ fillColor:[10,185,138], textColor:255 },
      columnStyles:{ 2:{ halign:'right' } },
    });
    doc.save('Novala_Reconciliation.pdf');
  };

  // ── Summary stats ─────────────────────────────────────────
  const totalMatched    = txns.filter(t => getStatus(t) === 'matched').length;
  const totalReconciled = reconciled.size;
  const totalUnmatched  = txns.filter(t => getStatus(t) === 'unmatched').length;
  const totalFlagged    = flagged.size + txns.filter(t => t.status==='flagged').length;
  const reconciledAmt   = txns.filter(t => reconciled.has(t.id)).reduce((s,t) => s+Math.abs(t.amount||0), 0);
  const unreconciledAmt = txns.filter(t => !reconciled.has(t.id)).reduce((s,t) => s+Math.abs(t.amount||0), 0);
  const progress        = txns.length ? Math.round(((totalMatched+totalReconciled)/txns.length)*100) : 0;

  const pad = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>

      {/* Top bar */}
      <div style={{ ...topBar, flexDirection:isMobile?'column':'row', alignItems:isMobile?'flex-start':'center', gap:isMobile?10:0, padding:isMobile?'16px':undefined }}>
        <div>
          <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Reconciliation</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Match and verify your transactions against your records</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={exportPDF}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
            <Download size={13}/> Export PDF
          </button>
          <button onClick={() => askAndOpen(`I have ${txns.length} transactions. ${totalUnmatched} are unmatched and ${totalFlagged} are flagged. Help me reconcile my books and identify any discrepancies.`)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', border:'none', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
            <Sparkles size={13}/> Ask AI
          </button>
        </div>
      </div>

      <div style={{ padding: pad }}>

        {/* Success banner */}
        {success && (
          <div style={{ padding:'10px 16px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, fontSize:13, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <CheckCircle size={14}/>{success}
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:isMobile?10:14, marginBottom:20 }}>
          {[
            { label:'Total Transactions', value:txns.length,       color:L.text,    sub:'All records'         },
            { label:'Reconciled',         value:totalReconciled,   color:ACCENT,    sub:fmt(reconciledAmt)    },
            { label:'Unmatched',          value:totalUnmatched,    color:'#F59E0B', sub:'Need review'          },
            { label:'Flagged',            value:totalFlagged,      color:L.red,     sub:'Requires attention'   },
          ].map(c => (
            <div key={c.label} style={{ ...card, padding:isMobile?'12px 14px':'18px 20px' }}>
              <div style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>{c.label}</div>
              <div style={{ fontSize:isMobile?20:26, fontWeight:700, color:c.color, fontFamily:L.fontMono, marginBottom:4 }}>{c.value}</div>
              <div style={{ fontSize:10, color:L.textMuted }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ ...card, padding:isMobile?'14px 16px':'18px 24px', marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:L.text }}>Reconciliation Progress</div>
            <div style={{ fontSize:13, fontWeight:700, color:ACCENT }}>{progress}%</div>
          </div>
          <div style={{ height:8, background:L.pageBg, borderRadius:99, overflow:'hidden', marginBottom:8 }}>
            <div style={{ width:`${progress}%`, height:'100%', background:`linear-gradient(90deg, ${ACCENT}, #0EA5E9)`, borderRadius:99, transition:'width 0.5s ease' }}/>
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {[
              { color:ACCENT,    label:`${totalMatched} matched`    },
              { color:'#3B82F6', label:`${totalReconciled} reconciled` },
              { color:'#F59E0B', label:`${totalUnmatched} unmatched` },
              { color:L.red,     label:`${totalFlagged} flagged`    },
            ].map(l => (
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:l.color }}/>
                <span style={{ fontSize:11, color:L.textMuted }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          {/* Search */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:L.radiusSm, background:'#fff', border:`1px solid ${L.border}`, flex:isMobile?1:'none', minWidth:isMobile?0:240 }}>
            <Search size={13} color={L.textMuted}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor or category..."
              style={{ border:'none', outline:'none', fontSize:12, color:L.text, fontFamily:L.font, background:'transparent', width:'100%' }}/>
          </div>

          {/* Status filter */}
          <div style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none' }}>
            {['all','matched','unmatched','reconciled','flagged'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding:'7px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:600, border:'1px solid', whiteSpace:'nowrap', flexShrink:0, fontFamily:L.font, borderColor:filterStatus===s?L.accentBorder:L.border, background:filterStatus===s?L.accentSoft:'#fff', color:filterStatus===s?L.accent:L.textMuted }}>
                {s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, marginBottom:16, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:600, color:L.accent }}>{selected.size} selected</span>
            <button onClick={reconcileSelected} disabled={saving}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:L.radiusSm, background:ACCENT, color:'#fff', border:'none', cursor:saving?'not-allowed':'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
              <CheckCircle size={12}/> {saving?'Reconciling...':'Mark Reconciled'}
            </button>
            <button onClick={flagSelected}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:L.radiusSm, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', color:'#F59E0B', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
              <AlertTriangle size={12}/> Flag for Review
            </button>
            <button onClick={() => setSelected(new Set())}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:12, fontFamily:L.font }}>
              Clear
            </button>
          </div>
        )}

        {/* Transactions table */}
        <div style={{ ...card, overflow:'hidden' }}>
          <div style={{ padding:isMobile?'14px 16px':'16px 22px', borderBottom:`1px solid ${L.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:14, fontWeight:700, color:L.text }}>
              {filtered.length} transaction{filtered.length!==1?'s':''}
              {filterStatus!=='all'?` · ${filterStatus}`:''}
            </div>
            {!isMobile && filtered.length > 0 && (
              <button onClick={selectAll}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11, fontFamily:L.font }}>
                {selected.size===filtered.length?<CheckSquare size={12} color={ACCENT}/>:<Square size={12}/>}
                {selected.size===filtered.length?'Deselect all':'Select all'}
              </button>
            )}
          </div>

          {/* Desktop header */}
          {!isMobile && filtered.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'40px 100px 1fr 110px 110px 150px 120px', padding:'8px 22px', borderBottom:`1px solid ${L.border}`, background:L.pageBg }}>
              {['','DATE','VENDOR','AMOUNT','TYPE','CATEGORY','STATUS'].map(h => (
                <div key={h} style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em' }}>{h}</div>
              ))}
            </div>
          )}

          {loading && <div style={{ padding:40, textAlign:'center', color:L.textMuted }}>Loading transactions...</div>}

          {!loading && filtered.length === 0 && (
            <div style={{ padding:60, textAlign:'center' }}>
              <CheckCircle size={40} color={L.textFaint} style={{ marginBottom:12 }}/>
              <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:6 }}>
                {txns.length === 0 ? 'No transactions yet' : 'No transactions match your filter'}
              </div>
              <div style={{ fontSize:13, color:L.textMuted }}>
                {txns.length === 0 ? 'Upload documents to start reconciling' : 'Try changing the filter or search term'}
              </div>
            </div>
          )}

          {filtered.map((t) => {
            const status  = getStatus(t);
            const st      = STATUS[status] || STATUS.unmatched;
            const isIncome = t.txn_type === 'income';
            const isSel   = selected.has(t.id);

            if (isMobile) {
              return (
                <div key={t.id} style={{ padding:'14px 16px', borderBottom:`1px solid ${L.border}`, background:isSel?L.accentSoft:'transparent' }}
                  onClick={() => toggleSelect(t.id)}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                      <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${isSel?ACCENT:L.border}`, background:isSel?ACCENT:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {isSel && <CheckCircle size={12} color="#fff"/>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:L.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.vendor||'—'}</div>
                        <div style={{ fontSize:10, color:L.textMuted }}>{t.txn_date||'—'}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, fontFamily:L.fontMono, color:isIncome?ACCENT:L.red, flexShrink:0, marginLeft:8 }}>
                      {isIncome?'+':'-'}{fmt(Math.abs(t.amount||0))}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontSize:10, color:L.textMuted, background:L.pageBg, padding:'2px 8px', borderRadius:20, border:`1px solid ${L.border}` }}>
                      {t.category||'Uncategorized'}
                    </span>
                    <span style={{ fontSize:10, fontWeight:600, color:st.color, background:st.bg, padding:'2px 10px', borderRadius:20, border:`1px solid ${st.border}` }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div key={t.id}
                style={{ display:'grid', gridTemplateColumns:'40px 100px 1fr 110px 110px 150px 120px', padding:'12px 22px', borderBottom:`1px solid ${L.border}`, alignItems:'center', background:isSel?L.accentSoft:'transparent', cursor:'pointer', transition:'background 0.1s' }}
                onClick={() => toggleSelect(t.id)}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background=L.pageBg; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background='transparent'; }}>
                {/* Checkbox */}
                <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${isSel?ACCENT:L.border}`, background:isSel?ACCENT:'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {isSel && <CheckCircle size={11} color="#fff"/>}
                </div>
                {/* Date */}
                <div style={{ fontSize:12, color:L.textMuted, fontFamily:L.fontMono, display:'flex', alignItems:'center', gap:4 }}>
                  <Calendar size={10} color={L.textFaint}/>{t.txn_date||'—'}
                </div>
                {/* Vendor */}
                <div style={{ fontSize:13, fontWeight:500, color:L.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.vendor||'—'}</div>
                {/* Amount */}
                <div style={{ fontSize:13, fontWeight:700, fontFamily:L.fontMono, color:isIncome?ACCENT:L.red, display:'flex', alignItems:'center', gap:4 }}>
                  {isIncome?<TrendingUp size={11}/>:<TrendingDown size={11}/>}
                  {fmt(Math.abs(t.amount||0))}
                </div>
                {/* Type */}
                <div style={{ fontSize:11, fontWeight:600, color:isIncome?ACCENT:L.red }}>
                  {isIncome?'Income':'Expense'}
                </div>
                {/* Category */}
                <div style={{ fontSize:11, color:L.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {t.category||'Uncategorized'}
                </div>
                {/* Status */}
                <div>
                  <span style={{ fontSize:11, fontWeight:600, color:st.color, background:st.bg, padding:'3px 10px', borderRadius:20, border:`1px solid ${st.border}`, display:'inline-flex', alignItems:'center', gap:4 }}>
                    {status==='reconciled' && <CheckCircle size={10}/>}
                    {status==='flagged'    && <AlertTriangle size={10}/>}
                    {status==='matched'    && <CheckCircle size={10}/>}
                    {status==='unmatched'  && <XCircle size={10}/>}
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Help */}
        {!loading && txns.length > 0 && (
          <div style={{ ...card, padding:isMobile?'16px':'20px 24px', marginTop:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Sparkles size={18} color="#fff"/>
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:L.text }}>AI Reconciliation Help</div>
                <div style={{ fontSize:11, color:L.textMuted }}>Let AI help you find discrepancies and reconcile faster</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:8 }}>
              {[
                { q:'Find transactions that might be duplicates',                    icon:'🔍' },
                { q:'Which unmatched transactions need my attention most urgently?', icon:'⚡' },
                { q:'Summarize my reconciliation status and what I should do next',  icon:'📊' },
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