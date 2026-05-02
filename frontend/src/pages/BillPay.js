import React, { useState, useEffect } from 'react';
import {
  Plus, Check, Clock, AlertTriangle, Download,
  Trash2, X, Sparkles, ArrowRight, FileText,
  CheckCircle, Calendar,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';
import { useAI } from '../hooks/useAI';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ACCENT    = '#0AB98A';
const BASE      = 'https://api.getnovala.com/api/v1';
const getToken  = () => localStorage.getItem('token') || '';

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

const CATEGORIES = [
  'Rent & Facilities','Software & SaaS','Utilities','Insurance',
  'Marketing','Professional Services','Hardware & Equipment',
  'Payroll','Transportation','Food & Meals','General Expense',
];

const STATUS_STYLES = {
  unpaid:  { label:'Unpaid',  color:'#F59E0B', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)' },
  paid:    { label:'Paid',    color:ACCENT,    bg:'rgba(10,185,138,0.08)', border:'rgba(10,185,138,0.2)' },
  overdue: { label:'Overdue', color:'#EF4444', bg:'rgba(239,68,68,0.08)',  border:'rgba(239,68,68,0.2)'  },
};

function getStatus(bill) {
  if (bill.status === 'paid') return 'paid';
  const today = new Date().toISOString().split('T')[0];
  if (bill.due_date < today) return 'overdue';
  return 'unpaid';
}

function daysUntilDue(dueDate) {
  const today = new Date();
  const due   = new Date(dueDate);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function Modal({ title, onClose, children }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:isMobile?'flex-end':'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:isMobile?'20px 20px 0 0':16, width:isMobile?'100%':500, maxWidth:isMobile?'100%':'90vw', maxHeight:isMobile?'90vh':'85vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 24px', borderBottom:`1px solid ${L.border}`, position:'sticky', top:0, background:'#fff', zIndex:10 }}>
          <div style={{ fontSize:15, fontWeight:700, color:L.text }}>{title}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:L.textMuted, display:'flex' }}><X size={18}/></button>
        </div>
        <div style={{ padding:'20px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>
        {label}{required && <span style={{ color:ACCENT }}> *</span>}
      </div>
      <input {...props} style={{ width:'100%', padding:'10px 12px', background:L.pageBg, border:`1px solid ${L.border}`, borderRadius:L.radiusSm, color:L.text, fontSize:13, fontFamily:L.font, outline:'none', boxSizing:'border-box', ...props.style }}
        onFocus={e => e.target.style.borderColor=ACCENT}
        onBlur={e  => e.target.style.borderColor=L.border}/>
    </div>
  );
}

export default function BillPay() {
  const [bills,      setBills]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [filter,     setFilter]     = useState('all');
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const { setPageContext, askAndOpen } = useAI();
  const isMobile = useIsMobile();

  const [vendor,    setVendor]    = useState('');
  const [amount,    setAmount]    = useState('');
  const [dueDate,   setDueDate]   = useState('');
  const [category,  setCategory]  = useState('General Expense');
  const [notes,     setNotes]     = useState('');
  const [recurring, setRecurring] = useState(false);

  const load = async () => {
    try {
      const res  = await fetch(`${BASE}/bills/`, { headers:{ Authorization:`Bearer ${getToken()}` } });
      const data = await res.json();
      setBills(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    setPageContext('billpay', { page:'billpay' });
  }, []);

  useEffect(() => {
    const overdue   = bills.filter(b => getStatus(b) === 'overdue').length;
    const totalOwed = bills.filter(b => b.status !== 'paid').reduce((s,b) => s+(Number(b.amount)||0), 0);
    setPageContext('billpay', { page:'billpay', total_bills:bills.length, overdue, total_owed:totalOwed });
  }, [bills]);

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };
  const resetForm   = () => { setVendor(''); setAmount(''); setDueDate(''); setCategory('General Expense'); setNotes(''); setRecurring(false); };

  const handleAddBill = async () => {
    if (!vendor.trim() || !amount || !dueDate) return;
    setSaving(true);
    try {
      const res  = await fetch(`${BASE}/bills/`, {
        method:'POST',
        headers:{ Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body:JSON.stringify({ vendor:vendor.trim(), amount:parseFloat(amount), due_date:dueDate, category, notes:notes.trim()||null, recurring }),
      });
      const data = await res.json();
      setBills(prev => [data, ...prev]);
      resetForm(); setModal(null);
      showSuccess(`✓ Bill from ${vendor} added`);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleMarkPaid = async (bill) => {
    setSaving(true);
    try {
      await fetch(`${BASE}/bills/${bill.id}/pay`, {
        method:'PATCH', headers:{ Authorization:`Bearer ${getToken()}` },
      });
      setBills(prev => prev.map(b => b.id === bill.id ? { ...b, status:'paid' } : b));
      showSuccess(`✓ ${bill.vendor} marked as paid — transaction created`);
      setModal(null);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${BASE}/bills/${id}`, {
        method:'DELETE', headers:{ Authorization:`Bearer ${getToken()}` },
      });
      setBills(prev => prev.filter(b => b.id !== id));
      setModal(null);
      showSuccess('Bill deleted');
    } catch (e) { console.error(e); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(10,185,138);
    doc.text('Novala', 14, 18);
    doc.setFontSize(13); doc.setTextColor(100);
    doc.text('Bill Pay Report', 14, 26);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);
    autoTable(doc, {
      startY:42,
      head:[['Vendor','Amount','Due Date','Category','Status']],
      body:filtered.map(b => [b.vendor, fmt(b.amount), b.due_date, b.category, STATUS_STYLES[getStatus(b)]?.label||'—']),
      styles:{ fontSize:9 },
      headStyles:{ fillColor:[10,185,138], textColor:255 },
      columnStyles:{ 1:{ halign:'right' } },
    });
    doc.save('Novala_BillPay.pdf');
  };

  const filtered = bills.filter(b => {
    if (filter === 'overdue') return getStatus(b) === 'overdue';
    if (filter === 'unpaid')  return getStatus(b) === 'unpaid';
    if (filter === 'paid')    return b.status === 'paid';
    return true;
  }).sort((a,b) => {
    const sa = getStatus(a), sb = getStatus(b);
    if (sa==='overdue' && sb!=='overdue') return -1;
    if (sb==='overdue' && sa!=='overdue') return  1;
    return (a.due_date||'').localeCompare(b.due_date||'');
  });

  const totalOwed    = bills.filter(b => b.status !== 'paid').reduce((s,b) => s+(Number(b.amount)||0), 0);
  const totalOverdue = bills.filter(b => getStatus(b) === 'overdue').reduce((s,b) => s+(Number(b.amount)||0), 0);
  const totalPaid    = bills.filter(b => b.status === 'paid').reduce((s,b) => s+(Number(b.amount)||0), 0);
  const overdueCount = bills.filter(b => getStatus(b) === 'overdue').length;
  const selectedBill = bills.find(b => b.id === selectedId);
  const pad          = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>

      {/* Top bar */}
      <div style={{ ...topBar, flexDirection:isMobile?'column':'row', alignItems:isMobile?'flex-start':'center', gap:isMobile?10:0, padding:isMobile?'16px':undefined }}>
        <div>
          <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Bill Pay</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Track bills and payments — auto-creates transactions when paid</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignSelf:isMobile?'stretch':'auto' }}>
          <button onClick={exportPDF}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
            <Download size={13}/> Export PDF
          </button>
          <button onClick={() => askAndOpen(`I have ${bills.length} bills. ${overdueCount} are overdue totaling ${fmt(totalOverdue)}. Total owed: ${fmt(totalOwed)}. Help me prioritize what to pay first.`)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', border:'none', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
            <Sparkles size={13}/> Ask AI
          </button>
          <button onClick={() => { resetForm(); setModal('add'); }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:L.radiusSm, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font, flex:isMobile?1:'none', justifyContent:'center' }}>
            <Plus size={13}/> Add Bill
          </button>
        </div>
      </div>

      <div style={{ padding: pad }}>

        {success && (
          <div style={{ padding:'10px 16px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, fontSize:13, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <CheckCircle size={14}/>{success}
          </div>
        )}

        {/* Overdue alert */}
        {overdueCount > 0 && (
          <div style={{ padding:'12px 16px', borderRadius:L.radiusSm, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
            <AlertTriangle size={16} color="#EF4444"/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#EF4444' }}>{overdueCount} overdue bill{overdueCount!==1?'s':''} — {fmt(totalOverdue)} past due</div>
              <div style={{ fontSize:11, color:L.textMuted, marginTop:2 }}>Pay these immediately to avoid late fees</div>
            </div>
            <button onClick={() => setFilter('overdue')}
              style={{ padding:'5px 12px', borderRadius:L.radiusSm, background:'#EF4444', color:'#fff', border:'none', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
              View
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:isMobile?10:14, marginBottom:20 }}>
          {[
            { label:'Total Bills',     value:bills.length,    color:L.text,    sub:'All bills'           },
            { label:'Total Owed',      value:fmt(totalOwed),  color:'#F59E0B', sub:'Outstanding balance' },
            { label:'Overdue',         value:fmt(totalOverdue), color:'#EF4444', sub:`${overdueCount} bills` },
            { label:'Paid',            value:fmt(totalPaid),  color:ACCENT,    sub:'Completed payments'  },
          ].map(c => (
            <div key={c.label} style={{ ...card, padding:isMobile?'12px 14px':'18px 20px' }}>
              <div style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>{c.label}</div>
              <div style={{ fontSize:isMobile?15:18, fontWeight:700, color:c.color, fontFamily:L.fontMono, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.value}</div>
              <div style={{ fontSize:10, color:L.textMuted }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto', scrollbarWidth:'none' }}>
          {[
            { value:'all',     label:`All (${bills.length})`                                         },
            { value:'overdue', label:`Overdue (${bills.filter(b=>getStatus(b)==='overdue').length})`  },
            { value:'unpaid',  label:`Unpaid (${bills.filter(b=>getStatus(b)==='unpaid').length})`    },
            { value:'paid',    label:`Paid (${bills.filter(b=>b.status==='paid').length})`            },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              style={{ padding:'7px 14px', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:600, border:'1px solid', whiteSpace:'nowrap', flexShrink:0, fontFamily:L.font, borderColor:filter===f.value?L.accentBorder:L.border, background:filter===f.value?L.accentSoft:'#fff', color:filter===f.value?L.accent:L.textMuted }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Bills list */}
        <div style={{ ...card, overflow:'hidden' }}>
          <div style={{ padding:isMobile?'14px 16px':'16px 22px', borderBottom:`1px solid ${L.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:14, fontWeight:700, color:L.text }}>
              {filtered.length} bill{filtered.length!==1?'s':''}{filter!=='all'?` · ${filter}`:''}
            </div>
            <button onClick={() => { resetForm(); setModal('add'); }}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:L.radiusSm, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
              <Plus size={11}/> Add Bill
            </button>
          </div>

          {/* Desktop header */}
          {!isMobile && filtered.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 130px 160px 110px 180px', padding:'8px 22px', borderBottom:`1px solid ${L.border}`, background:L.pageBg }}>
              {['VENDOR','AMOUNT','DUE DATE','CATEGORY','STATUS','ACTIONS'].map(h => (
                <div key={h} style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em' }}>{h}</div>
              ))}
            </div>
          )}

          {loading && <div style={{ padding:40, textAlign:'center', color:L.textMuted }}>Loading bills...</div>}

          {!loading && filtered.length === 0 && (
            <div style={{ padding:isMobile?40:60, textAlign:'center' }}>
              <div style={{ width:56, height:56, borderRadius:16, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <FileText size={24} color={L.accent}/>
              </div>
              <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:6 }}>
                {bills.length === 0 ? 'No bills yet' : 'No bills match this filter'}
              </div>
              <div style={{ fontSize:13, color:L.textMuted, marginBottom:20 }}>
                {bills.length === 0 ? 'Add your first bill to start tracking payments' : 'Try a different filter'}
              </div>
              {bills.length === 0 && (
                <button onClick={() => { resetForm(); setModal('add'); }}
                  style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:L.radiusSm, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:L.font }}>
                  <Plus size={13}/> Add First Bill
                </button>
              )}
            </div>
          )}

          {filtered.map(bill => {
            const status = getStatus(bill);
            const st     = STATUS_STYLES[status];
            const days   = daysUntilDue(bill.due_date);

            if (isMobile) {
              return (
                <div key={bill.id} style={{ padding:'14px 16px', borderBottom:`1px solid ${L.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:L.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{bill.vendor}</div>
                      <div style={{ fontSize:10, color:L.textMuted, marginTop:2 }}>{bill.category}</div>
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, fontFamily:L.fontMono, color:status==='paid'?ACCENT:status==='overdue'?'#EF4444':'#F59E0B', flexShrink:0, marginLeft:8 }}>
                      {fmt(bill.amount)}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                    <span style={{ fontSize:10, fontWeight:600, color:st.color, background:st.bg, padding:'2px 10px', borderRadius:20, border:`1px solid ${st.border}` }}>{st.label}</span>
                    <span style={{ fontSize:10, color:L.textMuted, display:'flex', alignItems:'center', gap:4 }}>
                      <Calendar size={10}/>{bill.due_date}
                      {status!=='paid' && <span style={{ color:days<0?'#EF4444':days<=3?'#F59E0B':L.textMuted }}>{days<0?` · ${Math.abs(days)}d overdue`:days===0?' · Due today':` · ${days}d left`}</span>}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {status !== 'paid' && (
                      <button onClick={() => { setSelectedId(bill.id); setModal('pay'); }}
                        style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px', borderRadius:L.radiusSm, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
                        <Check size={11}/> Mark Paid
                      </button>
                    )}
                    <button onClick={() => { setSelectedId(bill.id); setModal('delete'); }}
                      style={{ padding:'7px 12px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11, fontFamily:L.font, display:'flex', alignItems:'center', gap:4 }}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={bill.id}
                style={{ display:'grid', gridTemplateColumns:'1fr 120px 130px 160px 110px 180px', padding:'13px 22px', borderBottom:`1px solid ${L.border}`, alignItems:'center', transition:'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background=L.pageBg}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:L.text }}>{bill.vendor}</div>
                  {bill.notes && <div style={{ fontSize:10, color:L.textMuted, marginTop:2 }}>{bill.notes}</div>}
                  {bill.recurring && <span style={{ fontSize:9, color:L.accent, background:L.accentSoft, padding:'1px 6px', borderRadius:20, marginTop:3, display:'inline-block' }}>Recurring</span>}
                </div>
                <div style={{ fontSize:13, fontWeight:700, fontFamily:L.fontMono, color:status==='paid'?ACCENT:status==='overdue'?'#EF4444':'#F59E0B' }}>{fmt(bill.amount)}</div>
                <div>
                  <div style={{ fontSize:12, color:L.textMuted, fontFamily:L.fontMono }}>{bill.due_date}</div>
                  {status !== 'paid' && (
                    <div style={{ fontSize:10, color:days<0?'#EF4444':days<=3?'#F59E0B':L.textMuted, marginTop:2 }}>
                      {days<0?`${Math.abs(days)}d overdue`:days===0?'Due today':`${days}d left`}
                    </div>
                  )}
                </div>
                <div style={{ fontSize:11, color:L.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{bill.category}</div>
                <div>
                  <span style={{ fontSize:11, fontWeight:600, color:st.color, background:st.bg, padding:'3px 10px', borderRadius:20, border:`1px solid ${st.border}`, display:'inline-flex', alignItems:'center', gap:4 }}>
                    {status==='paid'    && <CheckCircle size={10}/>}
                    {status==='overdue' && <AlertTriangle size={10}/>}
                    {status==='unpaid'  && <Clock size={10}/>}
                    {st.label}
                  </span>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {status !== 'paid' && (
                    <button onClick={() => { setSelectedId(bill.id); setModal('pay'); }}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:ACCENT, cursor:'pointer', fontSize:11, fontFamily:L.font }}>
                      <Check size={11}/> Pay
                    </button>
                  )}
                  <button onClick={() => { setSelectedId(bill.id); setModal('delete'); }}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11, fontFamily:L.font }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(239,68,68,0.4)'; e.currentTarget.style.color='#EF4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=L.border; e.currentTarget.style.color=L.textMuted; }}>
                    <Trash2 size={11}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Help */}
        {bills.length > 0 && (
          <div style={{ ...card, padding:isMobile?'16px':'20px 24px', marginTop:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Sparkles size={18} color="#fff"/>
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:L.text }}>AI Bill Advisor</div>
                <div style={{ fontSize:11, color:L.textMuted }}>Get help managing your payables</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:8 }}>
              {[
                { q:'Which bills should I pay first this week?',         icon:'⚡' },
                { q:'How much cash do I need to clear all overdue bills?', icon:'💰' },
                { q:'Are any of my bills unusually high this month?',    icon:'📊' },
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

      {/* ADD BILL MODAL */}
      {modal === 'add' && (
        <Modal title="Add New Bill" onClose={() => setModal(null)}>
          <Field label="Vendor / Payee" required placeholder="e.g. AWS, Office Landlord" value={vendor} onChange={e => setVendor(e.target.value)}/>
          <Field label="Amount" required type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}/>
          <Field label="Due Date" required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}/>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Category</div>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ width:'100%', padding:'10px 12px', background:L.pageBg, border:`1px solid ${L.border}`, borderRadius:L.radiusSm, color:L.text, fontSize:13, fontFamily:L.font, outline:'none' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Field label="Notes (optional)" placeholder="Reference number, invoice #, etc." value={notes} onChange={e => setNotes(e.target.value)}/>
          <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, cursor:'pointer' }}>
            <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} style={{ width:15, height:15, accentColor:ACCENT }}/>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:L.textSub }}>Recurring monthly bill</div>
              <div style={{ fontSize:10, color:L.textMuted }}>Mark as a monthly repeating expense</div>
            </div>
          </label>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setModal(null)}
              style={{ flex:1, padding:'10px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:13, fontFamily:L.font }}>
              Cancel
            </button>
            <button onClick={handleAddBill} disabled={saving||!vendor.trim()||!amount||!dueDate}
              style={{ flex:1, padding:'10px', borderRadius:L.radiusSm, background:saving||!vendor.trim()||!amount||!dueDate?L.textFaint:ACCENT, color:'#fff', border:'none', cursor:saving||!vendor.trim()||!amount||!dueDate?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:L.font }}>
              {saving ? 'Adding...' : 'Add Bill'}
            </button>
          </div>
        </Modal>
      )}

      {/* MARK PAID MODAL */}
      {modal === 'pay' && selectedBill && (
        <Modal title="Mark Bill as Paid" onClose={() => setModal(null)}>
          <div style={{ padding:'16px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}`, marginBottom:20 }}>
            <div style={{ fontSize:15, fontWeight:700, color:L.text, marginBottom:4 }}>{selectedBill.vendor}</div>
            <div style={{ fontSize:22, fontWeight:800, color:ACCENT, fontFamily:L.fontMono, marginBottom:4 }}>{fmt(selectedBill.amount)}</div>
            <div style={{ fontSize:12, color:L.textMuted }}>Due: {selectedBill.due_date} · {selectedBill.category}</div>
          </div>
          <div style={{ padding:'12px 14px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, fontSize:12, color:L.textSub, marginBottom:20, display:'flex', alignItems:'flex-start', gap:8 }}>
            <CheckCircle size={14} color={ACCENT} style={{ flexShrink:0, marginTop:1 }}/>
            Marking as paid will automatically create an expense transaction in your books.
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setModal(null)}
              style={{ flex:1, padding:'10px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:13, fontFamily:L.font }}>
              Cancel
            </button>
            <button onClick={() => handleMarkPaid(selectedBill)} disabled={saving}
              style={{ flex:1, padding:'10px', borderRadius:L.radiusSm, background:saving?L.textFaint:ACCENT, color:'#fff', border:'none', cursor:saving?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:L.font, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
              <Check size={13}/>{saving?'Processing...':'Confirm Payment'}
            </button>
          </div>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {modal === 'delete' && selectedBill && (
        <Modal title="Delete Bill" onClose={() => setModal(null)}>
          <div style={{ textAlign:'center', padding:'16px 0 24px' }}>
            <div style={{ width:56, height:56, borderRadius:14, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Trash2 size={22} color="#EF4444"/>
            </div>
            <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:8 }}>Delete {selectedBill.vendor}?</div>
            <div style={{ fontSize:13, color:L.textMuted }}>This will remove the bill permanently.</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setModal(null)}
              style={{ flex:1, padding:'10px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:13, fontFamily:L.font }}>
              Cancel
            </button>
            <button onClick={() => handleDelete(selectedBill.id)}
              style={{ flex:1, padding:'10px', borderRadius:L.radiusSm, background:'#EF4444', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:L.font }}>
              Delete Bill
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}