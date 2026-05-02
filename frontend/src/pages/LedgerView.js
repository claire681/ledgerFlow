import React, { useState, useEffect } from 'react';
import {
  Download, Sparkles, ArrowRight, BookOpen,
  Calendar, Search, Filter, ChevronDown,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';
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

const fmt = (n) => new Intl.NumberFormat('en-US', {
  style:'currency', currency:'USD', minimumFractionDigits:2,
}).format(Number(n) || 0);

// Map transaction categories to account codes
function getAccountCode(category, txnType) {
  const codes = {
    'Revenue':               '4000',
    'Income':                '4000',
    'Sales':                 '4100',
    'Rent & Facilities':     '5100',
    'Software & SaaS':       '5200',
    'Utilities':             '5300',
    'Insurance':             '5400',
    'Marketing':             '5500',
    'Professional Services': '5600',
    'Hardware & Equipment':  '5700',
    'Payroll':               '5800',
    'Transportation':        '5900',
    'Food & Meals':          '6000',
    'General Expense':       '6100',
    'Uncategorized':         '6999',
  };
  if (txnType === 'income') return codes[category] || '4000';
  return codes[category] || '6100';
}

function getAccountName(category, txnType) {
  if (txnType === 'income') return 'Revenue — ' + (category || 'General Income');
  return 'Expense — ' + (category || 'General Expense');
}

export default function LedgerView() {
  const [txns,    setTxns]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');
  const [period,  setPeriod]  = useState('all');
  const { setPageContext, askAndOpen } = useAI();
  const isMobile = useIsMobile();

  useEffect(() => {
    setPageContext('ledger', { page:'ledger' });
    const load = async () => {
      try {
        const res = await getTransactions({});
        setTxns(Array.isArray(res.data) ? res.data : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Filter by period
  const now   = new Date();
  const filtered = txns.filter(t => {
    const matchSearch = !search ||
      (t.vendor||'').toLowerCase().includes(search.toLowerCase()) ||
      (t.category||'').toLowerCase().includes(search.toLowerCase());
    const matchType = filter === 'all' || t.txn_type === filter;
    let matchPeriod = true;
    if (period !== 'all' && t.txn_date) {
      const d = new Date(t.txn_date);
      if (period === 'month')   matchPeriod = d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
      if (period === 'quarter') matchPeriod = Math.floor(d.getMonth()/3)===Math.floor(now.getMonth()/3) && d.getFullYear()===now.getFullYear();
      if (period === 'year')    matchPeriod = d.getFullYear()===now.getFullYear();
    }
    return matchSearch && matchType && matchPeriod;
  }).sort((a,b) => (a.txn_date||'').localeCompare(b.txn_date||''));

  // Build ledger entries — each transaction becomes debit + credit
  const ledgerEntries = filtered.map((t, i) => {
    const amount   = Math.abs(t.amount || 0);
    const isIncome = t.txn_type === 'income';
    const ref      = `TXN-${String(t.id).padStart(5,'0')}`;
    return {
      id:       t.id,
      date:     t.txn_date || '—',
      ref,
      description: t.vendor || 'Unknown',
      account:  getAccountName(t.category, t.txn_type),
      code:     getAccountCode(t.category, t.txn_type),
      debit:    isIncome ? 0      : amount,
      credit:   isIncome ? amount : 0,
      category: t.category || 'Uncategorized',
      txnType:  t.txn_type,
    };
  });

  // Running balance
  let balance = 0;
  const entriesWithBalance = ledgerEntries.map(e => {
    balance += e.credit - e.debit;
    return { ...e, balance };
  });

  const totalDebits  = ledgerEntries.reduce((s,e) => s+e.debit,  0);
  const totalCredits = ledgerEntries.reduce((s,e) => s+e.credit, 0);
  const netBalance   = totalCredits - totalDebits;

  const exportPDF = () => {
    const doc = new jsPDF({ orientation:'landscape' });
    doc.setFontSize(18); doc.setTextColor(10,185,138);
    doc.text('Novala', 14, 16);
    doc.setFontSize(12); doc.setTextColor(100);
    doc.text('General Ledger', 14, 23);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()} · ${filtered.length} entries`, 14, 29);

    autoTable(doc, {
      startY:34,
      head:[['Date','Ref','Description','Account','Code','Debit','Credit','Balance']],
      body:entriesWithBalance.map(e => [
        e.date, e.ref, e.description, e.account, e.code,
        e.debit>0?fmt(e.debit):'—',
        e.credit>0?fmt(e.credit):'—',
        fmt(e.balance),
      ]),
      styles:{ fontSize:8 },
      headStyles:{ fillColor:[10,185,138], textColor:255 },
      columnStyles:{ 5:{halign:'right'}, 6:{halign:'right'}, 7:{halign:'right'} },
    });
    doc.save('Novala_Ledger.pdf');
  };

  const pad = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>

      {/* Top bar */}
      <div style={{ ...topBar, flexDirection:isMobile?'column':'row', alignItems:isMobile?'flex-start':'center', gap:isMobile?10:0, padding:isMobile?'16px':undefined }}>
        <div>
          <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Ledger View</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>General ledger with double-entry accounting format</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={exportPDF}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
            <Download size={13}/> Export PDF
          </button>
          <button onClick={() => askAndOpen(`Analyze my general ledger. Total debits: ${fmt(totalDebits)}, total credits: ${fmt(totalCredits)}, net balance: ${fmt(netBalance)}. Are there any issues or anomalies I should know about?`)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', border:'none', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
            <Sparkles size={13}/> Ask AI
          </button>
        </div>
      </div>

      <div style={{ padding: pad }}>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:isMobile?10:14, marginBottom:20 }}>
          {[
            { label:'Total Entries',  value:filtered.length,   color:L.text,  sub:'Ledger records'    },
            { label:'Total Debits',   value:fmt(totalDebits),  color:L.red,   sub:'Money out'         },
            { label:'Total Credits',  value:fmt(totalCredits), color:ACCENT,  sub:'Money in'          },
            { label:'Net Balance',    value:fmt(netBalance),   color:netBalance>=0?ACCENT:L.red, sub:'Credits minus debits' },
          ].map(c => (
            <div key={c.label} style={{ ...card, padding:isMobile?'12px 14px':'18px 20px' }}>
              <div style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>{c.label}</div>
              <div style={{ fontSize:isMobile?15:18, fontWeight:700, color:c.color, fontFamily:L.fontMono, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.value}</div>
              <div style={{ fontSize:10, color:L.textMuted }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          {/* Search */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:L.radiusSm, background:'#fff', border:`1px solid ${L.border}`, flex:isMobile?1:'none', minWidth:isMobile?0:220 }}>
            <Search size={13} color={L.textMuted}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor or category..."
              style={{ border:'none', outline:'none', fontSize:12, color:L.text, fontFamily:L.font, background:'transparent', width:'100%' }}/>
          </div>

          {/* Type filter */}
          <div style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none' }}>
            {[
              { value:'all',     label:'All'     },
              { value:'income',  label:'Credits' },
              { value:'expense', label:'Debits'  },
            ].map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                style={{ padding:'7px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:600, border:'1px solid', whiteSpace:'nowrap', flexShrink:0, fontFamily:L.font, borderColor:filter===f.value?L.accentBorder:L.border, background:filter===f.value?L.accentSoft:'#fff', color:filter===f.value?L.accent:L.textMuted }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Period filter */}
          <div style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none' }}>
            {[
              { value:'all',     label:'All Time'    },
              { value:'month',   label:'This Month'  },
              { value:'quarter', label:'This Quarter'},
              { value:'year',    label:'This Year'   },
            ].map(f => (
              <button key={f.value} onClick={() => setPeriod(f.value)}
                style={{ padding:'7px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:600, border:'1px solid', whiteSpace:'nowrap', flexShrink:0, fontFamily:L.font, borderColor:period===f.value?L.accentBorder:L.border, background:period===f.value?L.accentSoft:'#fff', color:period===f.value?L.accent:L.textMuted }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger table */}
        <div style={{ ...card, overflow:'hidden' }}>
          <div style={{ padding:isMobile?'14px 16px':'16px 22px', borderBottom:`1px solid ${L.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:14, fontWeight:700, color:L.text }}>General Ledger</div>
            <div style={{ fontSize:12, color:L.textMuted }}>{filtered.length} entries</div>
          </div>

          {/* Desktop header */}
          {!isMobile && (
            <div style={{ display:'grid', gridTemplateColumns:'100px 90px 1fr 180px 60px 110px 110px 110px', padding:'8px 22px', borderBottom:`1px solid ${L.border}`, background:L.pageBg }}>
              {['DATE','REF','DESCRIPTION','ACCOUNT','CODE','DEBIT','CREDIT','BALANCE'].map(h => (
                <div key={h} style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em' }}>{h}</div>
              ))}
            </div>
          )}

          {loading && <div style={{ padding:40, textAlign:'center', color:L.textMuted }}>Loading ledger...</div>}

          {!loading && filtered.length === 0 && (
            <div style={{ padding:60, textAlign:'center' }}>
              <BookOpen size={40} color={L.textFaint} style={{ marginBottom:12 }}/>
              <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:6 }}>No ledger entries</div>
              <div style={{ fontSize:13, color:L.textMuted }}>Upload documents to populate your ledger</div>
            </div>
          )}

          {entriesWithBalance.map((e, i) => {
            const isIncome = e.txnType === 'income';

            if (isMobile) {
              return (
                <div key={e.id} style={{ padding:'12px 16px', borderBottom:`1px solid ${L.border}`, background:i%2===0?'transparent':L.pageBg }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:L.text }}>{e.description}</div>
                      <div style={{ fontSize:10, color:L.textMuted, marginTop:2 }}>{e.date} · {e.ref} · {e.code}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
                      {e.debit  > 0 && <div style={{ fontSize:12, fontWeight:700, color:L.red,   fontFamily:L.fontMono }}>DR {fmt(e.debit)}</div>}
                      {e.credit > 0 && <div style={{ fontSize:12, fontWeight:700, color:ACCENT,  fontFamily:L.fontMono }}>CR {fmt(e.credit)}</div>}
                      <div style={{ fontSize:10, color:L.textMuted, fontFamily:L.fontMono }}>Bal: {fmt(e.balance)}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:10, color:L.textMuted }}>{e.account}</div>
                </div>
              );
            }

            return (
              <div key={e.id}
                style={{ display:'grid', gridTemplateColumns:'100px 90px 1fr 180px 60px 110px 110px 110px', padding:'11px 22px', borderBottom:`1px solid ${L.border}`, alignItems:'center', background:i%2===0?'transparent':L.pageBg, transition:'background 0.1s' }}
                onMouseEnter={e2 => e2.currentTarget.style.background=L.accentSoft}
                onMouseLeave={e2 => e2.currentTarget.style.background=i%2===0?'transparent':L.pageBg}>
                <div style={{ fontSize:11, color:L.textMuted, fontFamily:L.fontMono }}>{e.date}</div>
                <div style={{ fontSize:10, color:L.textFaint, fontFamily:L.fontMono }}>{e.ref}</div>
                <div style={{ fontSize:12, fontWeight:500, color:L.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.description}</div>
                <div style={{ fontSize:10, color:L.textSub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.account}</div>
                <div style={{ fontSize:10, color:L.textFaint, fontFamily:L.fontMono }}>{e.code}</div>
                <div style={{ fontSize:12, fontWeight:600, color:L.red,  fontFamily:L.fontMono, textAlign:'right' }}>{e.debit >0?fmt(e.debit):'—'}</div>
                <div style={{ fontSize:12, fontWeight:600, color:ACCENT, fontFamily:L.fontMono, textAlign:'right' }}>{e.credit>0?fmt(e.credit):'—'}</div>
                <div style={{ fontSize:12, fontWeight:700, color:e.balance>=0?ACCENT:L.red, fontFamily:L.fontMono, textAlign:'right' }}>{fmt(e.balance)}</div>
              </div>
            );
          })}

          {/* Totals row */}
          {entriesWithBalance.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr 1fr':'100px 90px 1fr 180px 60px 110px 110px 110px', padding:isMobile?'12px 16px':'12px 22px', background:L.pageBg, borderTop:`2px solid ${L.border}` }}>
              {isMobile ? (
                <>
                  <div style={{ fontSize:12, fontWeight:700, color:L.text }}>Totals</div>
                  <div style={{ fontSize:12, fontWeight:700, color:L.red,  fontFamily:L.fontMono }}>{fmt(totalDebits)}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:ACCENT, fontFamily:L.fontMono }}>{fmt(totalCredits)}</div>
                </>
              ) : (
                <>
                  <div/><div/><div style={{ fontSize:12, fontWeight:700, color:L.text }}>TOTALS</div>
                  <div/><div/>
                  <div style={{ fontSize:12, fontWeight:700, color:L.red,  fontFamily:L.fontMono, textAlign:'right' }}>{fmt(totalDebits)}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:ACCENT, fontFamily:L.fontMono, textAlign:'right' }}>{fmt(totalCredits)}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:netBalance>=0?ACCENT:L.red, fontFamily:L.fontMono, textAlign:'right' }}>{fmt(netBalance)}</div>
                </>
              )}
            </div>
          )}
        </div>

        {/* AI Help */}
        {!loading && txns.length > 0 && (
          <div style={{ ...card, padding:isMobile?'16px':'20px 24px', marginTop:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Sparkles size={18} color="#fff"/>
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:L.text }}>AI Ledger Analysis</div>
                <div style={{ fontSize:11, color:L.textMuted }}>Ask questions about your general ledger</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:8 }}>
              {[
                { q:'Are there any unusual or duplicate entries in my ledger?',      icon:'🔍' },
                { q:'Which account has the highest debit activity this period?',     icon:'📊' },
                { q:'Summarize my ledger and flag anything that looks incorrect',    icon:'⚠️' },
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