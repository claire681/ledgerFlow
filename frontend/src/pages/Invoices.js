import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Download, CheckCircle, Clock, AlertCircle,
  Trash2, X, FileText, Eye, Edit2, Save, Printer, Mail,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';
import { useAI } from '../hooks/useAI';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS = {
  draft:   { label:'Draft',   color:'#94A3B8', bg:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)', icon:Clock        },
  sent:    { label:'Sent',    color:L.blue,    bg:L.blueSoft,               border:L.blueBorder,            icon:Mail         },
  due:     { label:'Due',     color:L.red,     bg:L.redSoft,                border:L.redBorder,             icon:AlertCircle  },
  paid:    { label:'Paid',    color:L.accent,  bg:L.accentSoft,             border:L.accentBorder,          icon:CheckCircle  },
  overdue: { label:'Overdue', color:'#F59E0B', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)',  icon:AlertCircle  },
};

const INVOICE_META_KEY = 'ledgerflow_invoice_meta_v1';
const todayString      = () => new Date().toISOString().slice(0, 10);
const plus30Days       = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); };
const emptyItem        = () => ({ description:'', qty:1, rate:0 });

const fmtDate = (s) => {
  if (!s) return '—';
  try { return new Date(`${s}T00:00:00`).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); }
  catch { return s; }
};

const loadInvoiceMeta  = () => { try { const r = localStorage.getItem(INVOICE_META_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; } };
const saveInvoiceMeta  = (m) => { try { localStorage.setItem(INVOICE_META_KEY, JSON.stringify(m)); } catch {} };
const buildMetaKey     = (inv) => inv?.id || inv?.invoice_number || '';
const getInvoiceExtras = (inv) => ({ terms:inv?.terms||'Net 30', logo_url:inv?.logo_url||'', from_phone:inv?.from_phone||'', from_bn:inv?.from_bn||'', discount:inv?.discount??0 });
const mergeInvoiceWithMeta = (inv, mm) => { const k = buildMetaKey(inv); return { ...inv, ...(k ? mm[k]||{} : {}) }; };

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

function Modal({ title, onClose, children, wide }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
      <div style={{ ...card, width: isMobile ? '100%' : wide ? 820 : 640, maxWidth: isMobile ? '100%' : '96vw', maxHeight: isMobile ? '95vh' : '94vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.18)', borderRadius: isMobile ? '20px 20px 0 0' : undefined }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 20px', borderBottom:`1px solid ${L.border}`, position:'sticky', top:0, background:'#fff', zIndex:10 }}>
          <div style={{ fontSize:15, fontWeight:700, color:L.text }}>{title}</div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:L.textMuted, padding:4, borderRadius:6, display:'flex' }}><X size={18}/></button>
        </div>
        <div style={{ padding: isMobile ? '16px' : '24px' }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>
        {label}{required && <span style={{ color:L.accent }}> *</span>}
      </div>
      {children}
    </div>
  );
}

const inp = {
  width:'100%', padding:'9px 12px',
  background:L.pageBg, border:`1px solid ${L.border}`,
  borderRadius:L.radiusSm, color:L.text,
  fontSize:13, fontFamily:L.font, outline:'none', boxSizing:'border-box',
};

function InvoicePreview({ inv }) {
  const isMobile  = useIsMobile();
  const lineItems = inv.line_items || inv.items || [];
  const subtotal  = Number(inv.subtotal || lineItems.reduce((s,it) => s + (Number(it.quantity??it.qty??1)) * (Number(it.price??it.rate??0)), 0));
  const taxAmt    = Number(inv.tax_amount || 0);
  const totalAmt  = Number(inv.total || subtotal + taxAmt);
  const paid      = inv.status === 'paid';

  return (
    <div style={{ fontFamily:"'Georgia','Times New Roman',serif", background:'#fff', color:'#1a1a2e', lineHeight:1.6, padding: isMobile ? '24px 16px' : '48px 52px', position:'relative' }}>

      {/* Header — stack on mobile */}
      <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom: isMobile ? 20 : 40, gap: isMobile ? 12 : 0 }}>
        <div>
          <div style={{ fontSize: isMobile ? 28 : 38, fontWeight:700, color:'#52b788', letterSpacing:'0.02em', marginBottom:12 }}>INVOICE</div>
          {inv.from_name    && <div style={{ fontSize:14, fontWeight:700, color:'#1a1a2e', marginBottom:2 }}>{inv.from_name}</div>}
          {inv.from_bn      && <div style={{ fontSize:13, color:'#444', marginBottom:2 }}>BN {inv.from_bn}</div>}
          {inv.from_address && <div style={{ fontSize:13, color:'#444', whiteSpace:'pre-line', marginBottom:2 }}>{inv.from_address}</div>}
          {inv.from_email   && <div style={{ fontSize:13, color:'#444', marginBottom:2 }}>{inv.from_email}</div>}
          {inv.from_phone   && <div style={{ fontSize:13, color:'#444' }}>{inv.from_phone}</div>}
        </div>
        {inv.logo_url && (
          <img src={inv.logo_url} alt="logo" style={{ maxHeight: isMobile ? 48 : 80, maxWidth: isMobile ? 140 : 220, objectFit:'contain', display:'block' }}/>
        )}
      </div>

      {/* Bill to + Invoice details — stack on mobile */}
      <div style={{ background:'#eaf7f0', padding: isMobile ? '16px' : '24px 28px', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 40, marginBottom:0 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#1a1a2e', marginBottom:6 }}>Bill to</div>
          <div style={{ fontSize:14, color:'#1a1a2e' }}>{inv.to_name||'—'}</div>
          {inv.to_email   && <div style={{ fontSize:13, color:'#444' }}>{inv.to_email}</div>}
          {inv.to_address && <div style={{ fontSize:13, color:'#444', whiteSpace:'pre-line' }}>{inv.to_address}</div>}
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#1a1a2e', marginBottom:6 }}>Invoice details</div>
          {[
            ['Invoice no.:',  inv.invoice_number||'—'],
            ['Terms:',        inv.terms||'Net 30'],
            ['Invoice date:', fmtDate(inv.date)],
            ['Due date:',     fmtDate(inv.due_date)],
          ].map(([l,v]) => (
            <div key={l} style={{ display:'flex', gap:8, fontSize:13, color:'#1a1a2e', marginBottom:3, flexWrap:'wrap' }}>
              <span style={{ minWidth: isMobile ? 90 : 100, fontWeight:600 }}>{l}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Line items table — scrollable on mobile */}
      <div style={{ overflowX: isMobile ? 'auto' : 'visible', marginTop:0 }}>
        <table style={{ width: isMobile ? 'max-content' : '100%', minWidth: isMobile ? 480 : 'auto', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr>
              {[{label:'#',align:'left',w:30},{label:'Description',align:'left',w:160},{label:'',align:'left',w:''},{label:'Qty',align:'right',w:50},{label:'Rate',align:'right',w:90},{label:'Amount',align:'right',w:90}].map(col => (
                <th key={col.label} style={{ padding:'12px 8px', textAlign:col.align, fontWeight:600, color:'#1a1a2e', fontSize:13, width:col.w||'auto', borderBottom:'1px solid #bbb', whiteSpace:'nowrap' }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:'32px 0', color:'#94a3b8', fontSize:13 }}>No line items</td></tr>
            ) : lineItems.map((item,i) => {
              const qty=Number(item.quantity??item.qty??1), price=Number(item.price??item.rate??0);
              return (
                <tr key={i} style={{ borderBottom:'1px solid #eee' }}>
                  <td style={{ padding:'12px 8px', fontSize:13, color:'#1a1a2e', verticalAlign:'top' }}>{i+1}.</td>
                  <td style={{ padding:'12px 8px', fontSize:13, fontWeight:700, color:'#1a1a2e', verticalAlign:'top' }}>{item.service||item.description||'—'}</td>
                  <td style={{ padding:'12px 8px', fontSize:13, color:'#444', verticalAlign:'top' }}>{item.service?item.description:''}</td>
                  <td style={{ padding:'12px 8px', fontSize:13, color:'#1a1a2e', textAlign:'right', verticalAlign:'top' }}>{qty}</td>
                  <td style={{ padding:'12px 8px', fontSize:13, color:'#1a1a2e', textAlign:'right', verticalAlign:'top', whiteSpace:'nowrap' }}>${price.toFixed(2)}</td>
                  <td style={{ padding:'12px 8px', fontSize:13, fontWeight:600, color:'#1a1a2e', textAlign:'right', verticalAlign:'top', whiteSpace:'nowrap' }}>${(qty*price).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:20, marginBottom:32 }}>
        <div style={{ width: isMobile ? '100%' : 300 }}>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #ddd' }}>
            <span style={{ fontSize:13, color:'#444' }}>Total</span>
            <span style={{ fontSize:13, color:'#1a1a2e', fontWeight:600 }}>${totalAmt.toFixed(2)}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #ddd' }}>
            <span style={{ fontSize:13, color:'#444' }}>Payment</span>
            <span style={{ fontSize:13, color:'#444' }}>{paid?`-$${totalAmt.toFixed(2)}`:'$0.00'}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0' }}>
            <span style={{ fontSize:14, color:'#1a1a2e', fontWeight:700 }}>Balance due</span>
            <span style={{ fontSize:14, color:paid?'#52b788':'#1a1a2e', fontWeight:700 }}>{paid?'$0.00':`$${totalAmt.toFixed(2)}`}</span>
          </div>
          {paid && <div style={{ textAlign:'right', color:'#52b788', fontSize:13, marginTop:4 }}>Paid in Full</div>}
        </div>
      </div>

      {/* Notes */}
      {inv.notes && (
        <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Notes</div>
          <div style={{ fontSize:13, color:'#64748b', lineHeight:1.7 }}>{inv.notes}</div>
        </div>
      )}
    </div>
  );
}

function LineItemRow({ item, index, onChange, onRemove, isMobile }) {
  const amount = (parseFloat(item.qty)||0) * (parseFloat(item.rate)||0);
  return isMobile ? (
    <div style={{ background:L.pageBg, border:`1px solid ${L.border}`, borderRadius:L.radiusSm, padding:'12px', marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style={{ fontSize:11, fontWeight:700, color:L.textMuted }}>Item {index+1}</div>
        <button onClick={() => onRemove(index)} style={{ background:'transparent', border:'none', cursor:'pointer', color:L.textMuted, display:'flex' }}>
          <X size={14}/>
        </button>
      </div>
      <input style={{ ...inp, marginBottom:8 }} placeholder="Description" value={item.description} onChange={e => onChange(index,'description',e.target.value)}/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <div>
          <div style={{ fontSize:9, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>QTY</div>
          <input style={{ ...inp, textAlign:'center' }} type="number" min="0" value={item.qty} onChange={e => onChange(index,'qty',e.target.value)}/>
        </div>
        <div>
          <div style={{ fontSize:9, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>RATE ($)</div>
          <input style={{ ...inp, textAlign:'right' }} type="number" placeholder="0.00" value={item.rate} onChange={e => onChange(index,'rate',e.target.value)}/>
        </div>
      </div>
      <div style={{ textAlign:'right', fontSize:13, fontWeight:700, color:L.text, marginTop:8 }}>
        Amount: ${amount.toFixed(2)}
      </div>
    </div>
  ) : (
    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 28px', gap:8, marginBottom:8 }}>
      <input style={inp} placeholder="Product / service description" value={item.description} onChange={e => onChange(index,'description',e.target.value)}/>
      <input style={{ ...inp, textAlign:'center' }} type="number" min="0" value={item.qty} onChange={e => onChange(index,'qty',e.target.value)}/>
      <input style={{ ...inp, textAlign:'right' }} type="number" placeholder="0.00" value={item.rate} onChange={e => onChange(index,'rate',e.target.value)}/>
      <div style={{ padding:'9px 10px', background:L.pageBg, border:`1px solid ${L.border}`, borderRadius:L.radiusSm, fontSize:13, fontWeight:700, color:L.text, textAlign:'right' }}>
        ${amount.toFixed(2)}
      </div>
      <button onClick={() => onRemove(index)}
        style={{ background:'transparent', border:`1px solid ${L.border}`, borderRadius:L.radiusSm, cursor:'pointer', color:L.textMuted, display:'flex', alignItems:'center', justifyContent:'center' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=L.redBorder; e.currentTarget.style.color=L.red; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor=L.border; e.currentTarget.style.color=L.textMuted; }}>
        <X size={12}/>
      </button>
    </div>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const printRef = useRef(null);
  const isMobile = useIsMobile();

  const [form, setFormState] = useState({
    invoice_number:'', date:todayString(), due_date:plus30Days(), terms:'Net 30',
    from_name:'', from_email:'', from_address:'', from_phone:'', from_bn:'', logo_url:'',
    to_name:'', to_email:'', to_address:'', notes:'', tax_rate:'0', discount:'0',
    items:[emptyItem()],
  });

  const { setPageContext } = useAI();
  const getHeaders = (extra={}) => ({ Authorization:`Bearer ${localStorage.getItem('token')}`, ...extra });
  const safeJson   = async (res) => { try { return await res.json(); } catch { return null; } };

  const mergeInvoices = useCallback((serverInvoices) => {
    const mm = loadInvoiceMeta();
    return (Array.isArray(serverInvoices)?serverInvoices:[]).map(inv => mergeInvoiceWithMeta(inv, mm));
  }, []);

  const persistInvoiceMeta = useCallback((inv) => {
    const k = buildMetaKey(inv); if (!k) return;
    const mm = loadInvoiceMeta(); mm[k] = getInvoiceExtras(inv); saveInvoiceMeta(mm);
  }, []);

  const removeInvoiceMeta = useCallback((inv) => {
    const k = buildMetaKey(inv); if (!k) return;
    const mm = loadInvoiceMeta(); delete mm[k]; saveInvoiceMeta(mm);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch('https://api.getnovala.com/api/v1/invoices/', { headers:getHeaders() });
      const data = await safeJson(res);
      setInvoices(mergeInvoices(data));
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    setPageContext('invoices', {
      page:'invoices', total:invoices.length,
      paid:    invoices.filter(i=>i.status==='paid').length,
      overdue: invoices.filter(i=>['overdue','due'].includes(i.status)).length,
      total_paid: invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+(Number(i.total)||0),0),
    });
  }, [invoices, setPageContext]);

  const sf = useCallback((k,v) => setFormState(p=>({...p,[k]:v})), []);
  const handleItemChange = useCallback((i,k,v) => setFormState(p => { const items=[...p.items]; items[i]={...items[i],[k]:v}; return {...p,items}; }), []);
  const handleItemRemove = useCallback((i) => setFormState(p => { const items=p.items.filter((_,j)=>j!==i); return {...p,items:items.length?items:[emptyItem()]}; }), []);
  const handleItemAdd    = useCallback(() => setFormState(p=>({...p,items:[...p.items,emptyItem()]})), []);
  const handleLogoUpload = useCallback((e) => {
    const file=e.target.files?.[0]; if (!file) return;
    const r=new FileReader(); r.onload=()=>sf('logo_url',r.result); r.readAsDataURL(file);
  }, [sf]);

  const calcTotals = (items,taxRate,discountPct) => {
    const sub  = items.reduce((s,it)=>(parseFloat(it.qty)||0)*(parseFloat(it.rate)||0)+s,0);
    const disc = (sub*(parseFloat(discountPct)||0))/100;
    const tax  = ((sub-disc)*(parseFloat(taxRate)||0))/100;
    return { subtotal:sub, discount:disc, tax, total:sub-disc+tax };
  };

  const { subtotal, discount:discAmt, tax, total } = calcTotals(form.items, form.tax_rate, form.discount);

  const buildPayload = (status) => {
    const t = calcTotals(form.items, form.tax_rate, form.discount);
    return {
      invoice_number:form.invoice_number, date:form.date, due_date:form.due_date||null,
      terms:form.terms, from_name:form.from_name, from_email:form.from_email,
      from_address:form.from_address, from_phone:form.from_phone, from_bn:form.from_bn,
      logo_url:form.logo_url||'', to_name:form.to_name, to_email:form.to_email,
      to_address:form.to_address||'', notes:form.notes,
      tax_rate:parseFloat(form.tax_rate)||0, discount:parseFloat(form.discount)||0,
      subtotal:t.subtotal, tax_amount:t.tax, total:t.total, currency:'USD',
      status:status||'draft',
      items:form.items.map(it=>({ description:it.description?.trim()||'', quantity:parseFloat(it.qty)||0, price:parseFloat(it.rate)||0 })).filter(it=>it.description||it.quantity||it.price),
    };
  };

  const resetForm = (num) => setFormState({
    invoice_number:num, date:todayString(), due_date:plus30Days(), terms:'Net 30',
    from_name:'', from_email:'', from_address:'', from_phone:'', from_bn:'', logo_url:'',
    to_name:'', to_email:'', to_address:'', notes:'', tax_rate:'0', discount:'0', items:[emptyItem()],
  });

  const openCreate = async () => {
    try { const res=await fetch('https://api.getnovala.com/api/v1/invoices/',{headers:getHeaders()}); const d=await safeJson(res); resetForm(`INV-${String((Array.isArray(d)?d.length:0)+1001).padStart(4,'0')}`); }
    catch { resetForm('INV-1001'); }
    setModal('create');
  };

  const openView = (inv) => { setSelected(inv); setModal('view'); };

  const openEdit = (inv) => {
    setSelected(inv);
    const li=(inv.line_items||inv.items||[]).map(it=>({ description:it.description||'', qty:it.quantity??it.qty??1, rate:it.price??it.rate??0 }));
    setFormState({
      invoice_number:inv.invoice_number||'', date:inv.date||todayString(), due_date:inv.due_date||plus30Days(),
      terms:inv.terms||'Net 30', from_name:inv.from_name||'', from_email:inv.from_email||'',
      from_address:inv.from_address||'', from_phone:inv.from_phone||'', from_bn:inv.from_bn||'',
      logo_url:inv.logo_url||'', to_name:inv.to_name||'', to_email:inv.to_email||'',
      to_address:inv.to_address||'', notes:inv.notes||'', tax_rate:String(inv.tax_rate??0),
      discount:String(inv.discount??0), items:li.length?li:[emptyItem()],
    });
    setModal('edit');
  };

  const handleSave = async (isEdit) => {
    if (!form.to_name?.trim()) { window.alert('Client name is required.'); return; }
    setSaving(true);
    try {
      const payload = buildPayload(isEdit?selected?.status:'draft');
      const url     = isEdit?`https://api.getnovala.com/api/v1/invoices/${selected.id}`:'https://api.getnovala.com/api/v1/invoices/';
      const res     = await fetch(url, { method:isEdit?'PATCH':'POST', headers:getHeaders({'Content-Type':'application/json'}), body:JSON.stringify(payload) });
      const data    = await safeJson(res);
      if (!res.ok) { window.alert(data?.detail||'Failed to save invoice.'); return; }
      const merged = { ...(data||{}), ...getInvoiceExtras(payload), to_address:payload.to_address||'' };
      persistInvoiceMeta({ id:data?.id, invoice_number:data?.invoice_number||payload.invoice_number, ...merged });
      if (data?.id) setSelected(merged);
      setModal(null); await load();
    } catch { window.alert('Failed to save invoice.'); }
    finally { setSaving(false); }
  };

  const handleStatus = async (id, status) => {
    const res = await fetch(`https://api.getnovala.com/api/v1/invoices/${id}`, { method:'PATCH', headers:getHeaders({'Content-Type':'application/json'}), body:JSON.stringify({status}) });
    if (res.ok) { await load(); if (selected?.id===id) setSelected(p=>p?{...p,status}:p); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    const inv = invoices.find(i=>i.id===id)||(selected?.id===id?selected:null);
    const res = await fetch(`https://api.getnovala.com/api/v1/invoices/${id}`, { method:'DELETE', headers:getHeaders() });
    if (res.ok||res.status===204) { if (inv) removeInvoiceMeta(inv); setModal(null); await load(); }
  };

  const exportPDF = (inv) => {
    try {
      const doc       = new jsPDF({ unit:'mm', format:'a4' });
      const lineItems = inv.line_items||inv.items||[];
      const tot       = Number(inv.total||0);
      const paid      = inv.status==='paid';

      doc.setFontSize(30); doc.setFont('helvetica','bold'); doc.setTextColor(82,183,136);
      doc.text('INVOICE', 14, 24);
      if (inv.from_name) { doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,46); doc.text(inv.from_name, 14, 34); }
      doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(68,68,68);
      let y=40;
      if (inv.from_bn)      { doc.text(`BN ${inv.from_bn}`, 14, y); y+=5; }
      if (inv.from_address) { doc.text(inv.from_address, 14, y); y+=5; }
      if (inv.from_email)   { doc.text(inv.from_email, 14, y); y+=5; }
      if (inv.from_phone)   { doc.text(inv.from_phone, 14, y); }
      if (inv.logo_url) { try { doc.addImage(inv.logo_url,'JPEG',150,10,46,24); } catch { try { doc.addImage(inv.logo_url,'PNG',150,10,46,24); } catch {} } }

      const boxY=68;
      doc.setFillColor(234,247,240); doc.rect(0,boxY,210,36,'F');
      doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,46);
      doc.text('Bill to', 14, boxY+8);
      doc.setFontSize(11); doc.setFont('helvetica','normal'); doc.text(inv.to_name||'—', 14, boxY+16);
      if (inv.to_email)   { doc.setFontSize(9); doc.text(inv.to_email, 14, boxY+22); }
      if (inv.to_address) { doc.setFontSize(9); doc.text(inv.to_address, 14, boxY+27); }
      doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.text('Invoice details', 110, boxY+8);
      doc.setFontSize(9); doc.setFont('helvetica','normal');
      [['Invoice no.:',inv.invoice_number||'—'],['Terms:',inv.terms||'Net 30'],['Invoice date:',fmtDate(inv.date)],['Due date:',fmtDate(inv.due_date)]].forEach(([l,v],i) => { doc.text(l,110,boxY+16+i*6); doc.text(v,150,boxY+16+i*6); });

      const rows=lineItems.map((it,idx)=>{ const q=Number(it.quantity??it.qty??1),p=Number(it.price??it.rate??0); return [`${idx+1}.`,it.service||it.description||'',it.service?it.description||'':'',String(q),`$${p.toFixed(2)}`,`$${(q*p).toFixed(2)}`]; });
      autoTable(doc,{ startY:boxY+42, head:[['#','Product or service','Description','Qty','Rate','Amount']], body:rows.length?rows:[['1.','No items','','','','']], styles:{fontSize:9,cellPadding:{top:5,bottom:5,left:4,right:4},textColor:[26,26,46]}, headStyles:{fillColor:[255,255,255],textColor:[26,26,46],fontStyle:'bold',fontSize:9,lineColor:[187,187,187],lineWidth:0.3}, columnStyles:{0:{cellWidth:10},1:{fontStyle:'bold',cellWidth:42},2:{cellWidth:68},3:{halign:'right',cellWidth:16},4:{halign:'right',cellWidth:28},5:{halign:'right',cellWidth:28,fontStyle:'bold'}}, tableLineColor:[238,238,238], tableLineWidth:0.2 });

      const tableEnd=(doc.lastAutoTable?.finalY||160)+10;
      const totalsX=130; let ty=tableEnd;
      const addRow=(label,value,bold)=>{ doc.setFont('helvetica',bold?'bold':'normal'); doc.setFontSize(10); doc.setTextColor(26,26,46); doc.text(label,totalsX,ty); doc.text(value,196,ty,{align:'right'}); doc.setDrawColor(221,221,221); doc.line(totalsX,ty+2,196,ty+2); ty+=9; };
      addRow('Total',`$${tot.toFixed(2)}`,true);
      addRow('Payment',paid?`-$${tot.toFixed(2)}`:'$0.00',false);
      doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(26,26,46);
      doc.text('Balance due',totalsX,ty+2); doc.text(paid?'$0.00':`$${tot.toFixed(2)}`,196,ty+2,{align:'right'});
      if (paid) { ty+=10; doc.setFontSize(12); doc.setTextColor(82,183,136); doc.text('Paid in Full',196,ty,{align:'right'}); }
      if (inv.notes) { const ny=tableEnd+60; doc.setDrawColor(226,232,240); doc.line(14,ny,196,ny); doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(148,163,184); doc.text('NOTES',14,ny+6); doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139); doc.text(doc.splitTextToSize(inv.notes,170),14,ny+13); }
      doc.save(`Invoice_${inv.invoice_number||'invoice'}.pdf`);
    } catch (e) { console.error('PDF error:',e); window.alert('Could not generate PDF.'); }
  };

  const printInvoice = () => {
    const el=printRef.current; if (!el) return;
    const win=window.open('','_blank');
    win.document.write(`<html><head><title>Invoice</title><style>body{margin:0;padding:0;font-family:'Georgia',serif;}@media print{body{margin:0;}}</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(()=>{ win.print(); win.close(); }, 300);
  };

  const totalRevenue = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+(Number(i.total)||0),0);
  const totalDue     = invoices.filter(i=>['due','overdue'].includes(i.status)).reduce((s,i)=>s+(Number(i.total)||0),0);
  const totalDraft   = invoices.filter(i=>i.status==='draft').reduce((s,i)=>s+(Number(i.total)||0),0);

  const renderForm = (isEdit) => (
    <>
      {/* Header fields — 2 cols on mobile, 4 on desktop */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap:12, marginBottom:16 }}>
        <Field label="Invoice #">
          <input style={{ ...inp, background:'#f7fafc', color:L.textMuted }} value={form.invoice_number} readOnly/>
        </Field>
        <Field label="Terms">
          <input style={inp} placeholder="Net 30" value={form.terms} onChange={e=>sf('terms',e.target.value)}/>
        </Field>
        <Field label="Invoice Date" required>
          <input style={inp} type="date" value={form.date} onChange={e=>sf('date',e.target.value)}/>
        </Field>
        <Field label="Due Date">
          <input style={inp} type="date" value={form.due_date} onChange={e=>sf('due_date',e.target.value)}/>
        </Field>
      </div>

      {/* From / To — stack on mobile */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ padding:14, background:L.pageBg, borderRadius:10, border:`1px solid ${L.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, color:L.accent, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>From (Your Business)</div>
          {[{p:'Company / Your name',k:'from_name'},{p:'Email',k:'from_email'},{p:'Address',k:'from_address'},{p:'Phone (optional)',k:'from_phone'},{p:'Business Number / BN',k:'from_bn'}].map(({p,k}) => (
            <input key={k} style={{ ...inp, marginBottom:8 }} placeholder={p} value={form[k]} onChange={e=>sf(k,e.target.value)}/>
          ))}
          <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Company Logo (optional)</div>
          <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ fontSize:12, color:L.textMuted, width:'100%' }}/>
          {form.logo_url && (
            <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10 }}>
              <img src={form.logo_url} alt="Logo" style={{ maxHeight:48, maxWidth:140, objectFit:'contain', borderRadius:6, border:`1px solid ${L.border}` }}/>
              <button onClick={()=>sf('logo_url','')} style={{ fontSize:11, color:L.red, background:'transparent', border:'none', cursor:'pointer' }}>Remove</button>
            </div>
          )}
        </div>

        <div style={{ padding:14, background:L.pageBg, borderRadius:10, border:`1px solid ${L.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, color:L.blue, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Bill To (Client) *</div>
          {[{p:'Client name *',k:'to_name'},{p:'Client email',k:'to_email'},{p:'Client address (optional)',k:'to_address'}].map(({p,k}) => (
            <input key={k} style={{ ...inp, marginBottom:8 }} placeholder={p} value={form[k]} onChange={e=>sf(k,e.target.value)}/>
          ))}
        </div>
      </div>

      {/* Line items */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:L.text, marginBottom:10 }}>Line Items</div>
        {!isMobile && (
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 28px', gap:8, marginBottom:6 }}>
            {['DESCRIPTION','QTY','RATE','AMOUNT',''].map(h => (
              <div key={h} style={{ fontSize:9, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textAlign:h==='AMOUNT'||h==='RATE'?'right':h==='QTY'?'center':'left' }}>{h}</div>
            ))}
          </div>
        )}
        {form.items.map((item,i) => (
          <LineItemRow key={i} item={item} index={i} onChange={handleItemChange} onRemove={handleItemRemove} isMobile={isMobile}/>
        ))}
        <button onClick={handleItemAdd} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
          <Plus size={11}/> Add Line Item
        </button>
      </div>

      {/* Tax / Discount */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Field label="Tax Rate (%)">
          <input style={inp} type="number" min="0" max="100" placeholder="0" value={form.tax_rate} onChange={e=>sf('tax_rate',e.target.value)}/>
        </Field>
        <Field label="Discount (%)">
          <input style={inp} type="number" min="0" max="100" placeholder="0" value={form.discount} onChange={e=>sf('discount',e.target.value)}/>
        </Field>
      </div>

      {/* Totals */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <div style={{ width: isMobile ? '100%' : 260, background:L.pageBg, borderRadius:10, padding:'14px 16px', border:`1px solid ${L.border}` }}>
          {[{label:'Subtotal',value:`$${subtotal.toFixed(2)}`},{label:`Discount (${form.discount}%)`,value:`−$${discAmt.toFixed(2)}`},{label:`Tax (${form.tax_rate}%)`,value:`$${tax.toFixed(2)}`}].map(row => (
            <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${L.border}` }}>
              <span style={{ fontSize:12, color:L.textMuted }}>{row.label}</span>
              <span style={{ fontSize:12, fontWeight:600, color:L.textSub }}>{row.value}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 0' }}>
            <span style={{ fontSize:14, fontWeight:700, color:L.text }}>Total</span>
            <span style={{ fontSize:18, fontWeight:800, color:L.accent }}>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Field label="Notes / Payment Terms">
        <textarea style={{ ...inp, height:72, resize:'vertical' }} placeholder="Payment due within 30 days. Thank you for your business." value={form.notes} onChange={e=>sf('notes',e.target.value)}/>
      </Field>

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <button onClick={()=>setModal(null)} style={{ padding:'9px 18px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:13, fontFamily:L.font, display:'flex', alignItems:'center', gap:6, flex: isMobile ? 1 : 'auto', justifyContent:'center' }}>
          <X size={13}/> Cancel
        </button>
        <button onClick={()=>handleSave(isEdit)} disabled={saving}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 22px', borderRadius:L.radiusSm, background:saving?L.textFaint:L.accent, color:'#fff', border:'none', cursor:saving?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:L.font, flex: isMobile ? 1 : 'auto', justifyContent:'center' }}>
          {isEdit?<Save size={13}/>:<Plus size={13}/>}
          {saving?'Saving…':isEdit?'Save Changes':'Create Invoice'}
        </button>
      </div>
    </>
  );

  const pad = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>
      {/* Top bar */}
      <div style={{
        ...topBar,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems:    isMobile ? 'flex-start' : 'center',
        gap:           isMobile ? 10 : 0,
        padding:       isMobile ? '16px' : undefined,
      }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Invoices</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Create, manage and track client invoices</div>
        </div>
        <button onClick={openCreate}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:L.radiusSm, background:L.accent, color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:L.font, alignSelf: isMobile ? 'stretch' : 'auto', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <Plus size={14}/> New Invoice
        </button>
      </div>

      <div style={{ padding: pad }}>

        {/* Summary cards — 2x2 on mobile, 4 across on desktop */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14, marginBottom: isMobile ? 14 : 20 }}>
          {[
            { label:'Total Invoices', value:invoices.length,             color:L.text,   icon:<FileText size={16}/> },
            { label:'Paid Revenue',   value:`$${totalRevenue.toFixed(2)}`, color:L.accent, icon:<CheckCircle size={16}/> },
            { label:'Outstanding',    value:`$${totalDue.toFixed(2)}`,    color:L.red,    icon:<AlertCircle size={16}/> },
            { label:'In Draft',       value:`$${totalDraft.toFixed(2)}`,  color:'#F59E0B',icon:<Clock size={16}/> },
          ].map(item => (
            <div key={item.label} style={{ ...card, padding: isMobile ? '12px 14px' : '18px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom: isMobile ? 6 : 10 }}>
                <div style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em', textTransform:'uppercase' }}>{item.label}</div>
                <span style={{ color:item.color, opacity:0.6 }}>{item.icon}</span>
              </div>
              <div style={{ fontSize: isMobile ? 16 : 22, fontWeight:700, color:item.color, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Invoice list */}
        <div style={{ ...card, overflow:'hidden' }}>
          <div style={{ padding: isMobile ? '14px 16px' : '16px 20px', borderBottom:`1px solid ${L.border}` }}>
            <div style={{ fontSize:14, fontWeight:700, color:L.text }}>All Invoices</div>
          </div>

          {/* Desktop table header */}
          {invoices.length > 0 && !isMobile && (
            <div style={{ display:'grid', gridTemplateColumns:'130px 1fr 1fr 110px 120px 1fr', padding:'8px 20px', background:L.pageBg, borderBottom:`1px solid ${L.border}` }}>
              {['NUMBER','CLIENT','FROM','TOTAL','STATUS','ACTIONS'].map(h => (
                <div key={h} style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em' }}>{h}</div>
              ))}
            </div>
          )}

          {loading && <div style={{ padding:40, textAlign:'center', color:L.textMuted }}>Loading invoices…</div>}

          {!loading && invoices.length === 0 && (
            <div style={{ padding: isMobile ? 40 : 60, textAlign:'center' }}>
              <div style={{ width:60, height:60, borderRadius:16, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <FileText size={26} color={L.accent}/>
              </div>
              <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:6 }}>No invoices yet</div>
              <div style={{ fontSize:13, color:L.textMuted, marginBottom:20 }}>Create your first invoice to start billing clients</div>
              <button onClick={openCreate} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:L.radiusSm, background:L.accent, color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:L.font }}>
                <Plus size={13}/> Create Invoice
              </button>
            </div>
          )}

          {invoices.map((inv, i) => {
            const sc   = STATUS[inv.status] || STATUS.draft;
            const Icon = sc.icon;

            // ── Mobile card layout ──
            if (isMobile) {
              return (
                <div key={inv.id} style={{ padding:'14px 16px', borderBottom: i < invoices.length-1 ? `1px solid ${L.border}` : 'none' }}>
                  {/* Row 1: invoice number + total */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <FileText size={12} color={L.blue}/>
                      <span style={{ fontSize:13, fontWeight:700, color:L.blue }}>{inv.invoice_number}</span>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:inv.status==='paid'?L.accent:L.text }}>${Number(inv.total||0).toFixed(2)}</div>
                  </div>

                  {/* Row 2: client + status */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:L.text }}>{inv.to_name||'—'}</div>
                      {inv.from_name && <div style={{ fontSize:11, color:L.textMuted }}>From: {inv.from_name}</div>}
                    </div>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600, color:sc.color, background:sc.bg, border:`1px solid ${sc.border}` }}>
                      <Icon size={10}/>{sc.label}
                    </span>
                  </div>

                  {/* Row 3: actions */}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <button onClick={() => openView(inv)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:L.radiusSm, background:L.blueSoft, border:`1px solid ${L.blueBorder}`, color:L.blue, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
                      <Eye size={10}/> View
                    </button>
                    <button onClick={() => openEdit(inv)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
                      <Edit2 size={10}/> Edit
                    </button>
                    {inv.status !== 'paid' && (
                      <button onClick={() => handleStatus(inv.id,'paid')}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:L.radiusSm, background:'rgba(10,185,138,0.06)', border:'1px solid rgba(10,185,138,0.2)', color:L.accent, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
                        <CheckCircle size={10}/> Paid
                      </button>
                    )}
                    <button onClick={() => exportPDF(inv)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11 }}>
                      <Download size={11}/>
                    </button>
                    <button onClick={() => handleDelete(inv.id)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11 }}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                </div>
              );
            }

            // ── Desktop row layout ──
            return (
              <div key={inv.id}
                style={{ display:'grid', gridTemplateColumns:'130px 1fr 1fr 110px 120px 1fr', padding:'14px 20px', alignItems:'center', borderBottom: i < invoices.length-1 ? `1px solid ${L.border}` : 'none', transition:'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ fontSize:13, fontWeight:700, color:L.blue, display:'flex', alignItems:'center', gap:5 }}>
                  <FileText size={12} color={L.blue}/>{inv.invoice_number}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:L.text }}>{inv.to_name||'—'}</div>
                  {inv.to_email && <div style={{ fontSize:11, color:L.textMuted }}>{inv.to_email}</div>}
                </div>
                <div style={{ fontSize:12, color:L.textMuted }}>{inv.from_name||'—'}</div>
                <div style={{ fontSize:14, fontWeight:700, color:inv.status==='paid'?L.accent:L.text }}>${Number(inv.total||0).toFixed(2)}</div>
                <div>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600, color:sc.color, background:sc.bg, border:`1px solid ${sc.border}` }}>
                    <Icon size={10}/>{sc.label}
                  </span>
                </div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  <button onClick={e=>{e.stopPropagation();openView(inv);}}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 9px', borderRadius:L.radiusSm, background:L.blueSoft, border:`1px solid ${L.blueBorder}`, color:L.blue, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
                    <Eye size={10}/> View
                  </button>
                  <button onClick={e=>{e.stopPropagation();openEdit(inv);}}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 9px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
                    <Edit2 size={10}/> Edit
                  </button>
                  {inv.status !== 'paid' && (
                    <button onClick={e=>{e.stopPropagation();handleStatus(inv.id,'paid');}}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 9px', borderRadius:L.radiusSm, background:'rgba(10,185,138,0.06)', border:'1px solid rgba(10,185,138,0.2)', color:L.accent, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
                      <CheckCircle size={10}/> Paid
                    </button>
                  )}
                  <button onClick={e=>{e.stopPropagation();exportPDF(inv);}}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 8px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11 }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=L.accentBorder;e.currentTarget.style.color=L.accent;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=L.border;e.currentTarget.style.color=L.textMuted;}}>
                    <Download size={11}/>
                  </button>
                  <button onClick={e=>{e.stopPropagation();handleDelete(inv.id);}}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 8px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11 }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=L.redBorder;e.currentTarget.style.color=L.red;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=L.border;e.currentTarget.style.color=L.textMuted;}}>
                    <Trash2 size={11}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create modal */}
      {modal === 'create' && (
        <Modal title="New Invoice" onClose={()=>setModal(null)} wide>{renderForm(false)}</Modal>
      )}

      {/* Edit modal */}
      {modal === 'edit' && selected && (
        <Modal title={`Edit — ${selected.invoice_number}`} onClose={()=>setModal(null)} wide>{renderForm(true)}</Modal>
      )}

      {/* View modal */}
      {modal === 'view' && selected && (
        <Modal title={`Invoice ${selected.invoice_number}`} onClose={()=>setModal(null)} wide>
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
            <button onClick={()=>{setModal(null);openEdit(selected);}}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font, flex: isMobile ? 1 : 'auto', justifyContent:'center' }}>
              <Edit2 size={12}/> Edit
            </button>
            {selected.status !== 'paid' && (
              <button onClick={()=>handleStatus(selected.id,'paid')}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:L.accent, border:'none', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font, flex: isMobile ? 1 : 'auto', justifyContent:'center' }}>
                <CheckCircle size={12}/> Mark Paid
              </button>
            )}
            {!isMobile && (
              <button onClick={printInvoice}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:12, fontFamily:L.font }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=L.accentBorder;e.currentTarget.style.color=L.accent;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=L.border;e.currentTarget.style.color=L.textMuted;}}>
                <Printer size={12}/> Print
              </button>
            )}
            <button onClick={()=>exportPDF(selected)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:12, fontFamily:L.font, flex: isMobile ? 1 : 'auto', justifyContent:'center' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=L.accentBorder;e.currentTarget.style.color=L.accent;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=L.border;e.currentTarget.style.color=L.textMuted;}}>
              <Download size={12}/> PDF
            </button>
            <button onClick={()=>handleDelete(selected.id)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.redBorder}`, color:L.red, cursor:'pointer', fontSize:12, fontFamily:L.font, flex: isMobile ? 1 : 'auto', justifyContent:'center' }}>
              <Trash2 size={12}/> Delete
            </button>
          </div>

          <div style={{ background:'#f1f5f9', borderRadius:12, padding: isMobile ? 8 : 20, overflowX: isMobile ? 'auto' : 'visible' }}>
            <div ref={printRef} style={{ boxShadow:'0 4px 24px rgba(0,0,0,0.10)', borderRadius:8, overflow:'hidden' }}>
              <InvoicePreview inv={selected}/>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
