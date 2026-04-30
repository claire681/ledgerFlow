import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Upload, X, CheckCircle, AlertCircle,
  Sparkles, Save, RefreshCw, FileImage,
  DollarSign, Calendar, Tag, Store,
  ScanLine, Zap, Database, ArrowRight,
  Edit2, Clock, Smartphone, Download, Eye,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';
import { useAI } from '../hooks/useAI';

const BASE     = 'https://api.getnovala.com/api/v1';
const getToken = () => localStorage.getItem('token') || '';
const ACCENT   = '#0AB98A';
const GRAD     = 'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)';

const SCAN_STEPS = [
  { key:'uploading',  label:'Uploading file...'    },
  { key:'processing', label:'Processing image...'  },
  { key:'extracting', label:'Extracting data...'   },
  { key:'done',       label:'Extraction complete!' },
];

const CATEGORIES = [
  'Food & Meals', 'Transportation', 'Software & SaaS', 'Office Supplies',
  'Hardware & Equipment', 'Marketing', 'Rent & Facilities', 'Utilities',
  'Insurance', 'Professional Services', 'Payroll', 'Healthcare Services',
  'Travel & Entertainment', 'Research & Development', 'General Expense',
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
}

function Spinner({ size = 14, color = ACCENT }) {
  const [deg, setDeg] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDeg(d => d + 8), 16);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ width:size, height:size, border:`2px solid ${color}30`, borderTop:`2px solid ${color}`, borderRadius:'50%', transform:`rotate(${deg}deg)`, flexShrink:0 }}/>
  );
}

export default function ReceiptScanner() {
  const [image,        setImage]        = useState(null);
  const [imageURL,     setImageURL]     = useState('');
  const [scanning,     setScanning]     = useState(false);
  const [scanStep,     setScanStep]     = useState(0);
  const [result,       setResult]       = useState(null);
  const [saved,        setSaved]        = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [dragOver,     setDragOver]     = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [txnType,      setTxnType]      = useState('expense');
  const [cameraMsg,    setCameraMsg]    = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [downloading,  setDownloading]  = useState(false);

  const [vendor,   setVendor]   = useState('');
  const [amount,   setAmount]   = useState('');
  const [date,     setDate]     = useState('');
  const [category, setCategory] = useState('');

  const fileInputRef   = useRef(null);
  const cameraInputRef = useRef(null);
  const pollingRef     = useRef(null);
  const { setPageContext } = useAI();
  const isMobile = useIsMobile();

  useEffect(() => { setPageContext('scanner', { page:'scanner' }); }, []);
  useEffect(() => () => stopPolling(), []);

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  const handleFile = (file) => {
    if (!file) return;
    const allowed = ['image/jpeg','image/png','image/webp','image/heic','image/tiff','application/pdf'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic|tiff|pdf)$/i)) {
      setError('Please upload an image or PDF file'); return;
    }
    setError(''); setCameraMsg(''); setResult(null); setSaved(false); setImage(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setImageURL(e.target.result);
      reader.readAsDataURL(file);
    } else { setImageURL(''); }
  };

  const handleTakePhoto = () => {
    if (isMobileDevice()) { setCameraMsg(''); cameraInputRef.current?.click(); }
    else { setCameraMsg('Camera capture works best on mobile. Please use Browse Files on desktop.'); }
  };

  const populateFields = (data) => {
    setVendor(data.vendor || '');
    setAmount(String(data.total_amount || ''));
    setDate(data.doc_date || new Date().toISOString().split('T')[0]);
    setCategory(data.suggested_cat || 'General Expense');
    setTxnType(data.doc_type === 'invoice_sent' ? 'income' : 'expense');
  };

  const handleScan = async () => {
    if (!image) return;
    setScanning(true); setError(''); setScanStep(0); setResult(null); setCameraMsg('');
    setShowOriginal(false);
    try {
      const formData = new FormData();
      formData.append('file', image);
      const res  = await fetch(`${BASE}/documents/upload?txn_type=${txnType === 'income' ? 'income' : 'expense'}`, {
        method:'POST', headers:{ Authorization:`Bearer ${getToken()}` }, body:formData,
      });
      const data = await res.json();
      if (!res.ok)      throw new Error(data.detail || 'Upload failed');
      if (!data.job_id) throw new Error('No job ID returned');
      setScanStep(1);

      pollingRef.current = setInterval(async () => {
        try {
          const statusRes  = await fetch(`${BASE}/documents/upload-status/${data.job_id}`, { headers:{ Authorization:`Bearer ${getToken()}` } });
          const statusData = await statusRes.json();
          if (['extracting_data','classifying','saving_document'].includes(statusData.current_step)) setScanStep(2);
          if (statusData.status === 'completed') {
            stopPolling(); setScanStep(3);
            const docsRes  = await fetch(`${BASE}/documents/`, { headers:{ Authorization:`Bearer ${getToken()}` } });
            const docsList = await docsRes.json();
            const latest   = Array.isArray(docsList) ? docsList[0] : null;
            if (latest) { setResult(latest); populateFields(latest); }
            setScanning(false);
          }
          if (statusData.status === 'failed') { stopPolling(); throw new Error(statusData.error_message || 'Processing failed'); }
        } catch (pollErr) { stopPolling(); setError('Scan failed: ' + pollErr.message); setScanning(false); }
      }, 1500);
    } catch (e) { stopPolling(); setError('Scan failed: ' + e.message); setScanning(false); }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true); setError('');
    try {
      await fetch(`${BASE}/documents/${result.id}`, {
        method:'PATCH', headers:{ Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body:JSON.stringify({ vendor, total_amount:parseFloat(amount)||0, doc_date:date, suggested_cat:category }),
      });
      await fetch(`${BASE}/transactions/`, {
        method:'POST', headers:{ Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body:JSON.stringify({
          vendor:vendor||'Unknown', amount:parseFloat(amount)||0,
          currency:result.currency||'USD',
          txn_date:date||new Date().toISOString().split('T')[0],
          category:category||'General Expense', txn_type:txnType,
          notes:`Scanned receipt: ${result.filename}`, document_id:result.id,
        }),
      });
      setSaved(true); setEditing(false);
    } catch (e) { setError('Failed to save: ' + e.message); }
    finally { setSaving(false); }
  };

  // ── Download original file from S3 ───────────────────────
  const handleDownloadOriginal = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const res = await fetch(`${BASE}/documents/${result.id}/download`, {
        headers:{ Authorization:`Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = result.filename || 'receipt';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { setError('Download failed: ' + e.message); }
    finally { setDownloading(false); }
  };

  const reset = () => {
    stopPolling(); setImage(null); setImageURL(''); setResult(null); setSaved(false);
    setError(''); setCameraMsg(''); setScanning(false); setScanStep(0); setEditing(false);
    setVendor(''); setAmount(''); setDate(''); setCategory(''); setTxnType('expense');
    setShowOriginal(false); setDownloading(false);
    if (fileInputRef.current)   fileInputRef.current.value   = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const paymentStatus = result ? (txnType === 'expense' ? 'paid' : (result.payment_status || 'due')) : null;
  const payStyle = paymentStatus === 'paid'
    ? { color:ACCENT,    bg:'rgba(10,185,138,0.08)', border:'rgba(10,185,138,0.2)' }
    : { color:'#F59E0B', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)' };

  const inputStyle = {
    width:'100%', padding:'8px 10px',
    border:`1px solid ${L.border}`, borderRadius:L.radiusSm,
    fontSize:13, color:L.text, fontFamily:L.font,
    background:'#fff', outline:'none', boxSizing:'border-box',
  };

  const pad = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>
      <style>{`
        @keyframes fadeIn  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      `}</style>

      <input ref={fileInputRef}   type="file" accept="image/*,.pdf" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])}/>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])}/>

      {/* Top bar */}
      <div style={{ ...topBar, flexDirection:isMobile?'column':'row', alignItems:isMobile?'flex-start':'center', gap:isMobile?12:0, padding:isMobile?'16px':undefined }}>
        <div>
          <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Receipt Scanner</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Upload a receipt or invoice — AI extracts all data automatically</div>
        </div>
        <div style={{ display:'flex', gap:4, padding:'4px', background:L.pageBg, borderRadius:L.radiusSm, border:`1px solid ${L.border}`, alignSelf:isMobile?'stretch':'auto' }}>
          {[
            { label:isMobile?'🧾 Expense':'🧾 Receipt (Expense)', value:'expense' },
            { label:isMobile?'📄 Income' :'📄 Invoice (Income)',  value:'income'  },
          ].map(opt => (
            <button key={opt.value} onClick={() => setTxnType(opt.value)}
              style={{ flex:isMobile?1:'auto', padding:'6px 14px', borderRadius:L.radiusSm, fontSize:12, fontWeight:600, fontFamily:L.font, cursor:'pointer', border:'none', background:txnType===opt.value?ACCENT:'transparent', color:txnType===opt.value?'#fff':L.textMuted }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: pad }}>

        {/* ── Main grid — stack on mobile ── */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:isMobile?14:20 }}>

          {/* LEFT — Upload */}
          <div>
            {/* Drop zone */}
            <div
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !image && fileInputRef.current?.click()}
              style={{ border:`2px dashed ${dragOver?ACCENT:L.border}`, borderRadius:L.radius, padding:isMobile?20:24, background:dragOver?'rgba(10,185,138,0.04)':'#FFFFFF', cursor:image?'default':'pointer', marginBottom:12, minHeight:isMobile?180:280, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:L.shadow }}
            >
              {imageURL ? (
                <div style={{ position:'relative', width:'100%', textAlign:'center' }}>
                  <img src={imageURL} alt="Receipt" style={{ maxWidth:'100%', maxHeight:isMobile?220:320, borderRadius:L.radiusSm, objectFit:'contain' }}/>
                  <div style={{ position:'absolute', top:8, right:8 }}>
                    <button onClick={e => { e.stopPropagation(); reset(); }} style={{ background:'rgba(0,0,0,0.5)', border:'none', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
                      <X size={14}/>
                    </button>
                  </div>
                </div>
              ) : image && !imageURL ? (
                <div style={{ textAlign:'center' }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                    <FileImage size={24} color={ACCENT}/>
                  </div>
                  <div style={{ fontSize:14, fontWeight:600, color:L.text }}>{image.name}</div>
                  <div style={{ fontSize:12, color:L.textMuted, marginTop:4 }}>Ready to scan</div>
                </div>
              ) : (
                <div style={{ textAlign:'center' }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                    <ScanLine size={24} color={ACCENT}/>
                  </div>
                  <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:6 }}>
                    {isMobile ? 'Tap to upload receipt' : 'Drop receipt here'}
                  </div>
                  <div style={{ fontSize:12, color:L.textMuted }}>
                    {isMobile ? 'JPG, PNG, PDF supported' : 'or click to browse — JPG, PNG, PDF, HEIC supported'}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              {image ? (
                <>
                  <button onClick={handleScan} disabled={scanning||saved}
                    style={{ flex:1, padding:'10px', borderRadius:L.radiusSm, background:scanning||saved?L.textFaint:ACCENT, color:'#fff', border:'none', cursor:scanning||saved?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:L.font, display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:scanning||saved?'none':'0 4px 12px rgba(10,185,138,0.3)' }}>
                    {scanning?<><Spinner size={13}/> Scanning...</>:<><Sparkles size={13}/> Scan Receipt</>}
                  </button>
                  <button onClick={reset} style={{ padding:'10px 14px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:13, fontFamily:L.font, display:'flex', alignItems:'center', gap:6 }}>
                    <X size={13}/> Clear
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setCameraMsg(''); fileInputRef.current?.click(); }}
                    style={{ flex:1, padding:'10px', borderRadius:L.radiusSm, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:L.font, display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:'0 4px 12px rgba(10,185,138,0.3)' }}>
                    <Upload size={13}/> Browse Files
                  </button>
                  <button onClick={handleTakePhoto}
                    style={{ flex:1, padding:'10px', borderRadius:L.radiusSm, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', color:ACCENT, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:L.font, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                    <Camera size={13}/> Take Photo
                  </button>
                </>
              )}
            </div>

            {cameraMsg && (
              <div style={{ padding:'10px 14px', borderRadius:L.radiusSm, background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)', color:'#0EA5E9', fontSize:12, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}><Smartphone size={14} style={{ flexShrink:0 }}/><span>{cameraMsg}</span></div>
                <button onClick={() => setCameraMsg('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#0EA5E9', flexShrink:0 }}><X size={13}/></button>
              </div>
            )}
            {error && (
              <div style={{ padding:'10px 14px', borderRadius:L.radiusSm, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', fontSize:12, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}><AlertCircle size={13}/>{error}</div>
                <button onClick={() => setError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444' }}><X size={13}/></button>
              </div>
            )}
          </div>

          {/* RIGHT — Results */}
          <div>

            {/* Scanning state */}
            {scanning && (
              <div style={{ ...card, padding:isMobile?20:32, textAlign:'center', animation:'fadeIn 0.3s ease' }}>
                <div style={{ width:56, height:56, borderRadius:16, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 4px 20px rgba(10,185,138,0.35)' }}>
                  <Sparkles size={24} color="#fff"/>
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:L.text, marginBottom:4 }}>
                  AI is reading your {txnType==='income'?'invoice':'receipt'}...
                </div>
                <div style={{ fontSize:12, color:L.textMuted, marginBottom:20 }}>This usually takes 5–15 seconds</div>
                <div style={{ height:6, background:'#E2E8F0', borderRadius:99, overflow:'hidden', marginBottom:20 }}>
                  <div style={{ height:'100%', width:`${((scanStep+1)/SCAN_STEPS.length)*100}%`, background:'linear-gradient(90deg,#0AB98A,#0EA5E9,#0AB98A)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite linear', borderRadius:99, transition:'width 0.5s ease' }}/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10, textAlign:'left' }}>
                  {SCAN_STEPS.map((step,idx) => {
                    const done=idx<scanStep, active=idx===scanStep;
                    return (
                      <div key={step.key} style={{ display:'flex', alignItems:'center', gap:10, opacity:done||active?1:0.3 }}>
                        <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, background:done?'rgba(10,185,138,0.12)':active?'rgba(10,185,138,0.08)':'#F1F5F9', border:`1px solid ${done?'rgba(10,185,138,0.3)':active?'rgba(10,185,138,0.2)':'#E2E8F0'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {done?<CheckCircle size={12} color={ACCENT}/>:active?<Spinner size={11}/>:<Clock size={11} color="#CBD5E1"/>}
                        </div>
                        <span style={{ fontSize:13, fontWeight:active?600:done?500:400, color:done?L.text:active?ACCENT:L.textMuted }}>{step.label}</span>
                        {!isMobile&&active&&<span style={{ fontSize:9, fontWeight:700, color:ACCENT, background:'rgba(10,185,138,0.1)', border:'1px solid rgba(10,185,138,0.25)', padding:'1px 7px', borderRadius:20 }}>RUNNING</span>}
                        {!isMobile&&done  &&<span style={{ fontSize:9, fontWeight:700, color:ACCENT, background:'rgba(10,185,138,0.1)', border:'1px solid rgba(10,185,138,0.25)', padding:'1px 7px', borderRadius:20 }}>DONE</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!scanning && !result && (
              <div style={{ ...card, padding:isMobile?40:60, textAlign:'center', minHeight:isMobile?160:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:56, height:56, borderRadius:14, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                  <FileImage size={24} color={ACCENT}/>
                </div>
                <div style={{ fontSize:14, fontWeight:600, color:L.textSub, marginBottom:6 }}>Results will appear here</div>
                <div style={{ fontSize:12, color:L.textMuted }}>Upload a receipt and click Scan</div>
              </div>
            )}

            {/* ── Results panel ── */}
            {result && !scanning && (
              <div style={{ ...card, padding:isMobile?16:24, animation:'fadeIn 0.4s ease' }}>

                {/* Success banner */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:L.radiusSm, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <CheckCircle size={16} color={ACCENT}/>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:ACCENT }}>
                        {txnType==='income'?'Invoice':'Receipt'} scanned successfully
                      </div>
                      <div style={{ fontSize:11, color:L.textMuted }}>
                        AI confidence: {Math.round((result.confidence||0)*100)}% · {result.filename}
                      </div>
                    </div>
                  </div>
                  {!saved && (
                    <button onClick={() => setEditing(!editing)}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:L.radiusSm, background:editing?'rgba(10,185,138,0.12)':'transparent', border:`1px solid ${editing?'rgba(10,185,138,0.3)':L.border}`, color:editing?ACCENT:L.textMuted, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font, flexShrink:0 }}>
                      <Edit2 size={11}/>{editing?'Done':'Edit'}
                    </button>
                  )}
                </div>

                {/* ── View Original Image (if uploaded image) ── */}
                {imageURL && (
                  <div style={{ marginBottom:14 }}>
                    <button onClick={() => setShowOriginal(!showOriginal)}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:L.radiusSm, background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)', color:'#0EA5E9', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font, width:'100%', justifyContent:'center' }}>
                      <Eye size={12}/> {showOriginal ? 'Hide Original Receipt' : 'View Original Receipt'}
                    </button>
                    {showOriginal && (
                      <div style={{ marginTop:10, padding:12, borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}`, textAlign:'center', animation:'fadeIn 0.2s ease' }}>
                        <img src={imageURL} alt="Original receipt" style={{ maxWidth:'100%', maxHeight:300, borderRadius:L.radiusSm, objectFit:'contain' }}/>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment status */}
                <div style={{ marginBottom:14 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, color:payStyle.color, background:payStyle.bg, border:`1px solid ${payStyle.border}` }}>
                    <DollarSign size={10}/>
                    {txnType==='expense'?'Expense — Paid':`Income — ${paymentStatus==='paid'?'Paid':'Due'}`}
                  </span>
                </div>

                {/* Editable fields */}
                <div style={{ display:'flex', flexDirection:'column', gap:0, marginBottom:14 }}>
                  {[
                    { label:'Vendor',   icon:<Store size={12}/>,      display:<span style={{ fontSize:13, fontWeight:600, color:L.text }}>{vendor||'—'}</span>,                                                 input:<input value={vendor} onChange={e=>setVendor(e.target.value)} style={inputStyle} placeholder="Vendor name"/> },
                    { label:'Amount',   icon:<DollarSign size={12}/>,  display:<span style={{ fontSize:18, fontWeight:700, color:ACCENT, fontFamily:L.fontMono }}>${Number(amount||0).toLocaleString()}</span>,  input:<input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={inputStyle} placeholder="0.00"/> },
                    { label:'Date',     icon:<Calendar size={12}/>,    display:<span style={{ fontSize:13, fontWeight:500, color:L.text }}>{date||'—'}</span>,                                                    input:<input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inputStyle}/> },
                    { label:'Category', icon:<Tag size={12}/>,         display:<span style={{ fontSize:13, fontWeight:500, color:L.text }}>{category||'—'}</span>,                                               input:<select value={category} onChange={e=>setCategory(e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select> },
                  ].map(row => (
                    <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${L.border}`, gap:8 }}>
                      <span style={{ fontSize:12, color:L.textMuted, display:'flex', alignItems:'center', gap:6, minWidth:70, flexShrink:0 }}>
                        {row.icon} {row.label}
                      </span>
                      <div style={{ flex:1, minWidth:0, textAlign:'right' }}>
                        {editing ? row.input : row.display}
                      </div>
                    </div>
                  ))}

                  {result.tax_amount > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${L.border}` }}>
                      <span style={{ fontSize:12, color:L.textMuted, display:'flex', alignItems:'center', gap:6, minWidth:70 }}><DollarSign size={12}/> Tax</span>
                      <span style={{ fontSize:13, fontWeight:500, color:L.text }}>${Number(result.tax_amount||0).toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ padding:'12px 0' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:12, color:L.textMuted }}>AI Confidence</span>
                      <span style={{ fontSize:12, fontWeight:600, color:(result.confidence||0)>=0.7?ACCENT:'#F59E0B' }}>{Math.round((result.confidence||0)*100)}%</span>
                    </div>
                    <div style={{ height:6, background:'#E2E8F0', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ width:`${Math.round((result.confidence||0)*100)}%`, height:'100%', background:(result.confidence||0)>=0.7?ACCENT:'#F59E0B', borderRadius:99, transition:'width 0.5s ease' }}/>
                    </div>
                    {(result.confidence||0) < 0.7 && (
                      <div style={{ fontSize:11, color:'#F59E0B', marginTop:4 }}>Low confidence — please review the extracted data above</div>
                    )}
                  </div>
                </div>

                {/* ── Save / Download / Scan Another ── */}
                <div style={{ display:'flex', gap:8, flexDirection:isMobile?'column':'row' }}>
                  {!saved ? (
                    <button onClick={handleSave} disabled={saving}
                      style={{ flex:1, padding:'11px', borderRadius:L.radiusSm, background:saving?L.textFaint:ACCENT, color:'#fff', border:'none', cursor:saving?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:L.font, display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:saving?'none':'0 4px 12px rgba(10,185,138,0.3)' }}>
                      {saving?<><Spinner size={13}/> Saving...</>:<><Save size={13}/> Confirm & Save</>}
                    </button>
                  ) : (
                    <div style={{ flex:1, padding:'11px', borderRadius:L.radiusSm, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', color:ACCENT, fontSize:13, fontWeight:600, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                      <CheckCircle size={13}/> Saved to Transactions & Documents ✓
                    </div>
                  )}

                  {/* Download original */}
                  {result.has_file && (
                    <button onClick={handleDownloadOriginal} disabled={downloading}
                      style={{ padding:'11px 14px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:downloading?'not-allowed':'pointer', fontSize:13, fontFamily:L.font, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                      title="Download original file">
                      {downloading?<Spinner size={13}/>:<Download size={13}/>}
                    </button>
                  )}

                  <button onClick={reset} style={{ padding:'11px 14px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:13, fontFamily:L.font, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <RefreshCw size={13}/> {isMobile ? 'New Scan' : 'Scan Another'}
                  </button>
                </div>

                {/* ── Post-save message ── */}
                {saved && (
                  <div style={{ marginTop:12, padding:'10px 14px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}`, fontSize:12, color:L.textMuted, display:'flex', alignItems:'center', gap:8 }}>
                    <CheckCircle size={13} color={ACCENT}/>
                    This document is now in your <strong style={{ color:L.accent }}>Documents</strong> page with full view and download access.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* How it works — 2x2 on mobile */}
        <div style={{ ...card, padding:isMobile?16:20, marginTop:isMobile?14:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:L.text, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <Zap size={15} color={ACCENT}/> How Receipt Scanner Works
          </div>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:isMobile?10:14 }}>
            {[
              { icon:<Camera size={20} color={ACCENT}/>,   step:'1', title:'Upload File',    desc:'Upload a photo or PDF of any receipt or invoice' },
              { icon:<Sparkles size={20} color={ACCENT}/>, step:'2', title:'AI Reads It',    desc:'AI scans and identifies all text, numbers and fields' },
              { icon:<Edit2 size={20} color={ACCENT}/>,    step:'3', title:'Review & Edit',  desc:'Check the extracted data and correct any mistakes' },
              { icon:<Database size={20} color={ACCENT}/>, step:'4', title:'Confirm & Save', desc:'One click saves to your transactions and documents' },
            ].map(item => (
              <div key={item.step} style={{ background:L.pageBg, borderRadius:L.radiusSm, padding:isMobile?12:16, border:`1px solid ${L.border}` }}>
                <div style={{ width:38, height:38, borderRadius:10, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
                  {item.icon}
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, background:'rgba(10,185,138,0.08)', color:ACCENT, fontSize:9, fontWeight:700, marginBottom:6 }}>
                  <ArrowRight size={9}/> STEP {item.step}
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:L.text, marginBottom:4 }}>{item.title}</div>
                <div style={{ fontSize:11, color:L.textMuted, lineHeight:1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}