import React, { useState, useEffect, useRef } from 'react';
import { L, card, page, topBar } from '../styles/light';
import {
  Upload, FileText, Trash2, RefreshCw, CheckCircle,
  AlertCircle, Sparkles, Eye, Download, Clock,
  FileSearch, Brain, Database, LayoutDashboard,
  ArrowUpFromLine, ShieldCheck, Zap, X, Image, Users,
  DollarSign,
} from 'lucide-react';
import { useAI } from '../hooks/useAI';
import DocumentViewer from '../components/DocumentViewer';

const BASE   = 'https://api.getnovala.com/api/v1';
const ACCENT = '#0AB98A';
const GRAD   = 'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)';

const PROCESS_STEPS = [
  { key:'uploading',            label:'Uploading file',            icon:ArrowUpFromLine, color:'#0AB98A' },
  { key:'reading_document',     label:'Reading document',          icon:FileSearch,      color:'#0EA5E9' },
  { key:'extracting_data',      label:'Extracting financial data', icon:Brain,           color:'#8B5CF6' },
  { key:'classifying',          label:'Classifying document',      icon:ShieldCheck,     color:'#F59E0B' },
  { key:'saving_document',      label:'Saving to system',          icon:Database,        color:'#10B981' },
  { key:'creating_records',     label:'Creating records',          icon:Zap,             color:'#3B82F6' },
  { key:'refreshing_dashboard', label:'Updating dashboard',        icon:LayoutDashboard, color:'#0AB98A' },
];

const PROC_STATUS = {
  processed: { color:'#0AB98A', bg:'rgba(10,185,138,0.08)',  border:'rgba(10,185,138,0.2)',  label:'Processed' },
  review:    { color:'#F59E0B', bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.2)',  label:'Review'    },
  pending:   { color:'#94A3B8', bg:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)', label:'Pending'   },
  failed:    { color:'#EF4444', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.2)',   label:'Failed'    },
};

const PAY_STATUS = {
  paid:           { color:'#0AB98A', bg:'rgba(10,185,138,0.08)',  border:'rgba(10,185,138,0.2)',  label:'Paid'    },
  due:            { color:'#F59E0B', bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.2)',  label:'Due'     },
  overdue:        { color:'#EF4444', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.2)',   label:'Overdue' },
  partially_paid: { color:'#8B5CF6', bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.2)', label:'Partial' },
};

const DOC_TYPE_STYLE = {
  invoice_sent:     { label:'Invoice Sent',     color:'#0AB98A' },
  invoice_received: { label:'Invoice Received', color:'#0EA5E9' },
  receipt:          { label:'Receipt',          color:'#8B5CF6' },
  bank_statement:   { label:'Bank Statement',   color:'#F59E0B' },
  contract:         { label:'Contract',         color:'#94A3B8' },
  other:            { label:'Other',            color:'#94A3B8' },
};

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('access_token') || '';
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function Spinner({ size = 16, color = ACCENT }) {
  const [deg, setDeg] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDeg(d => d + 8), 16);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ width:size, height:size, border:`2px solid ${color}30`, borderTop:`2px solid ${color}`, borderRadius:'50%', transform:`rotate(${deg}deg)`, flexShrink:0 }}/>
  );
}

function ProgressRing({ progress, size = 120 }) {
  const r    = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={8}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#pgrd)" strokeWidth={8} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash} style={{ transition:'stroke-dashoffset 0.4s ease' }}/>
      <defs>
        <linearGradient id="pgrd" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#0AB98A"/>
          <stop offset="100%" stopColor="#0EA5E9"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Documents() {
  const [docs,          setDocs]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [uploading,     setUploading]     = useState(false);
  const [dragOver,      setDragOver]      = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const [pendingFile,   setPendingFile]   = useState(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [uploadStatus,  setUploadStatus]  = useState(null);
  const [viewingDoc,    setViewingDoc]    = useState(null);
  const [search,        setSearch]        = useState('');
  const [markingPaid,   setMarkingPaid]   = useState(null);

  const pollingRef   = useRef(null);
  const fileInputRef = useRef(null);
  const { setPageContext } = useAI();
  const isMobile = useIsMobile();

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };
  useEffect(() => () => stopPolling(), []);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/documents/`, { headers:{ Authorization:`Bearer ${getToken()}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list = await res.json();
      const docs = Array.isArray(list) ? list : [];
      setDocs(docs);
      setPageContext('documents', {
        page:'documents', total_documents:docs.length,
        processed:    docs.filter(d => d.status === 'processed').length,
        total_value:  docs.reduce((s,d) => s + (d.total_amount || 0), 0),
        with_clients: docs.filter(d => d.client_name).length,
        unpaid:       docs.filter(d => ['due','overdue','partially_paid'].includes(d.payment_status)).length,
      });
    } catch (e) {
      setError('Could not load documents: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pollUploadStatus = (jobId, fileName) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${BASE}/documents/upload-status/${jobId}`, { headers:{ Authorization:`Bearer ${getToken()}` } });
        if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
        const data = await res.json();
        setUploadStatus(data);
        if (data.status === 'completed') {
          stopPolling(); setUploading(false);
          setSuccess(`${fileName} processed successfully`);
          await load();
          setTimeout(() => { setSuccess(''); setUploadStatus(null); }, 5000);
        }
        if (data.status === 'failed') {
          stopPolling(); setUploading(false);
          setError(data.error_message || 'Upload failed while processing.');
        }
      } catch (e) {
        stopPolling(); setUploading(false); setError(e.message);
      }
    }, 1500);
  };

  const handleUpload = async (file, txnType = 'auto') => {
    if (!file) return;
    const token = getToken();
    if (!token) { setError('Not logged in.'); return; }
    const allowed = ['pdf','csv','png','jpg','jpeg','tiff','webp','txt'];
    const ext     = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) { setError(`File type .${ext} is not supported.`); return; }
    setUploading(true); setError(''); setSuccess('');
    setUploadStatus({ status:'uploaded', current_step:'uploading', progress:0, filename:file.name });
    setShowTypeModal(false); setPendingFile(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res  = await fetch(`${BASE}/documents/upload?txn_type=${txnType}`, {
        method:'POST', headers:{ Authorization:`Bearer ${token}` }, body:formData,
      });
      const data = await res.json();
      if (!res.ok)      throw new Error(data.detail || `Upload failed: ${res.status}`);
      if (!data.job_id) throw new Error('Backend did not return job_id.');
      setUploadStatus(data);
      pollUploadStatus(data.job_id, file.name);
    } catch (e) {
      setUploading(false); setError(`Upload failed: ${e.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res  = await fetch(`${BASE}/documents/${doc.id}/download`, { headers:{ Authorization:`Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = doc.filename || 'document';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { setError('Download failed: ' + e.message); }
  };

  const handleDelete = async (id, filename) => {
    if (!window.confirm(`Delete "${filename}"?`)) return;
    try {
      const res = await fetch(`${BASE}/documents/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${getToken()}` } });
      if (res.ok || res.status === 204) {
        setSuccess('Document deleted'); await load();
        setTimeout(() => setSuccess(''), 3000);
      } else throw new Error(`Delete failed: ${res.status}`);
    } catch (e) { setError('Delete failed: ' + e.message); }
  };

  const handleMarkPaid = async (doc) => {
    if (!window.confirm(`Mark "${doc.filename}" as paid?`)) return;
    setMarkingPaid(doc.id);
    try {
      const res  = await fetch(`${BASE}/documents/${doc.id}/mark-paid`, { method:'PATCH', headers:{ Authorization:`Bearer ${getToken()}` } });
      const data = await res.json();
      if (!res.ok) { setError(data?.detail || 'Failed to mark as paid.'); return; }
      setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, payment_status:'paid', paid_at:data.paid_at } : d));
      setSuccess(`${doc.filename} marked as paid`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) { setError('Failed to mark as paid: ' + e.message); }
    finally { setMarkingPaid(null); }
  };

  const needsMarkPaid = (doc) => ['due','overdue','partially_paid'].includes(doc.payment_status);

  const currentStepIndex = PROCESS_STEPS.findIndex(s => s.key === uploadStatus?.current_step);
  const progress         = uploadStatus?.progress || 0;

  const getDocIcon = (doc) => {
    const ext = (doc.file_type || '').toLowerCase();
    if (['png','jpg','jpeg','webp','gif'].includes(ext)) return <Image size={15} color={ACCENT}/>;
    return <FileText size={15} color={ACCENT}/>;
  };

  const filteredDocs = search.trim() === '' ? docs : docs.filter(doc => {
    const q = search.toLowerCase();
    return (
      (doc.filename       || '').toLowerCase().includes(q) ||
      (doc.vendor         || '').toLowerCase().includes(q) ||
      (doc.client_name    || '').toLowerCase().includes(q) ||
      (doc.doc_type       || '').toLowerCase().includes(q) ||
      (doc.status         || '').toLowerCase().includes(q) ||
      (doc.payment_status || '').toLowerCase().includes(q) ||
      (doc.suggested_cat  || '').toLowerCase().includes(q) ||
      (doc.doc_date       || '').toLowerCase().includes(q) ||
      String(doc.total_amount || '').includes(q) ||
      (DOC_TYPE_STYLE[doc.doc_type]?.label   || '').toLowerCase().includes(q) ||
      (PROC_STATUS[doc.status]?.label        || '').toLowerCase().includes(q) ||
      (PAY_STATUS[doc.payment_status]?.label || '').toLowerCase().includes(q)
    );
  });

  const pad = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>
      <style>{`
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(10,185,138,0.4)} 70%{box-shadow:0 0 0 12px rgba(10,185,138,0)} 100%{box-shadow:0 0 0 0 rgba(10,185,138,0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Top bar */}
      <div style={{
        ...topBar,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems:    isMobile ? 'flex-start' : 'center',
        gap:           isMobile ? 10 : 0,
        padding:       isMobile ? '16px' : undefined,
      }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Documents</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Upload invoices and receipts — AI extracts data automatically</div>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:12, fontFamily:L.font }}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      <div style={{ padding: pad }}>

        {/* Alerts */}
        {success && (
          <div style={{ padding:'12px 16px', borderRadius:L.radiusSm, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', color:ACCENT, fontSize:13, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between', animation:'fadeIn 0.3s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}><CheckCircle size={15}/>{success}</div>
            <button onClick={() => setSuccess('')} style={{ background:'none', border:'none', cursor:'pointer', color:ACCENT }}><X size={14}/></button>
          </div>
        )}
        {error && (
          <div style={{ padding:'12px 16px', borderRadius:L.radiusSm, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', fontSize:13, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between', animation:'fadeIn 0.3s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}><AlertCircle size={15}/>{error}</div>
            <button onClick={() => setError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444' }}><X size={14}/></button>
          </div>
        )}

        {/* Upload zone */}
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) { setPendingFile(f); setShowTypeModal(true); } }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{ border:`2px dashed ${dragOver ? ACCENT : uploading ? 'transparent' : '#E2E8F0'}`, borderRadius:16, padding: uploading ? (isMobile ? '24px 16px' : '32px 24px') : (isMobile ? '32px 16px' : '44px 24px'), textAlign:'center', cursor:uploading ? 'default' : 'pointer', background:uploading ? 'linear-gradient(135deg,rgba(10,185,138,0.03),rgba(14,165,233,0.03))' : dragOver ? 'rgba(10,185,138,0.04)' : '#FFFFFF', marginBottom:16, transition:'all 0.25s ease', position:'relative', overflow:'hidden' }}
        >
          <input ref={fileInputRef} type="file" accept=".pdf,.csv,.png,.jpg,.jpeg,.tiff,.webp,.txt" style={{ display:'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { setPendingFile(f); setShowTypeModal(true); } }}/>

          {uploading ? (
            <div style={{ animation:'fadeIn 0.4s ease' }}>
              <div style={{ position:'relative', width: isMobile ? 90 : 120, height: isMobile ? 90 : 120, margin:'0 auto 16px' }}>
                <ProgressRing progress={progress} size={isMobile ? 90 : 120}/>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ width: isMobile ? 42 : 56, height: isMobile ? 42 : 56, borderRadius:16, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(10,185,138,0.35)', animation:'pulse-ring 2s infinite' }}>
                    <Sparkles size={isMobile ? 18 : 24} color="#fff"/>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: isMobile ? 14 : 16, fontWeight:700, color:L.text, marginBottom:4 }}>AI is processing your document</div>
              <div style={{ fontSize:13, color:L.textMuted, marginBottom:6 }}>{uploadStatus?.filename || ''}</div>
              <div style={{ width: isMobile ? '100%' : 320, height:6, background:'#E2E8F0', borderRadius:99, margin:'0 auto 20px', overflow:'hidden' }}>
                <div style={{ width:`${progress}%`, height:'100%', borderRadius:99, background:'linear-gradient(90deg,#0AB98A,#0EA5E9,#0AB98A)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite linear', transition:'width 0.4s ease' }}/>
              </div>
              <div style={{ display:'inline-flex', flexDirection:'column', gap:8, textAlign:'left' }}>
                {PROCESS_STEPS.map((step, index) => {
                  const done   = index < currentStepIndex || uploadStatus?.status === 'completed';
                  const active = step.key === uploadStatus?.current_step;
                  const Icon   = step.icon;
                  return (
                    <div key={step.key} style={{ display:'flex', alignItems:'center', gap:8, opacity:done || active ? 1 : 0.35 }}>
                      <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, background:done ? 'rgba(10,185,138,0.12)' : active ? `${step.color}18` : '#F1F5F9', border:`1px solid ${done ? 'rgba(10,185,138,0.3)' : active ? `${step.color}35` : '#E2E8F0'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {done ? <CheckCircle size={12} color={ACCENT}/> : active ? <Spinner size={12} color={step.color}/> : <Icon size={12} color="#CBD5E1"/>}
                      </div>
                      <span style={{ fontSize: isMobile ? 12 : 13, fontWeight:active ? 600 : done ? 500 : 400, color:done ? L.text : active ? step.color : L.textMuted }}>{step.label}</span>
                      {!isMobile && active && <div style={{ fontSize:10, fontWeight:700, color:step.color, background:`${step.color}15`, border:`1px solid ${step.color}30`, padding:'1px 7px', borderRadius:20 }}>RUNNING</div>}
                      {!isMobile && done   && <div style={{ fontSize:10, fontWeight:700, color:ACCENT, background:'rgba(10,185,138,0.1)', border:'1px solid rgba(10,185,138,0.25)', padding:'1px 7px', borderRadius:20 }}>DONE</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight:800, color:L.text, marginTop:16, letterSpacing:'-0.03em' }}>{progress}%</div>
            </div>
          ) : (
            <div style={{ animation:'fadeIn 0.3s ease' }}>
              <div style={{ width:64, height:64, borderRadius:18, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', animation:'float 3s ease-in-out infinite' }}>
                <Upload size={26} color={ACCENT}/>
              </div>
              <div style={{ fontSize: isMobile ? 15 : 16, fontWeight:700, color:L.text, marginBottom:6 }}>
                {dragOver ? 'Drop to upload' : isMobile ? 'Tap to upload a document' : 'Drop files here or click to browse'}
              </div>
              <div style={{ fontSize:13, color:L.textMuted, marginBottom:16 }}>PDF, CSV, PNG, JPG — invoices, receipts, bank statements</div>
              <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                style={{ padding:'10px 28px', borderRadius:10, background:GRAD, color:'#FFFFFF', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, boxShadow:'0 4px 14px rgba(10,185,138,0.3)' }}>
                Choose File
              </button>
              {!isMobile && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginTop:16, flexWrap:'wrap' }}>
                  {[{icon:Brain,label:'AI Extraction'},{icon:ShieldCheck,label:'Auto-categorized'},{icon:Zap,label:'Instant records'},{icon:Users,label:'Client detection'}].map(({icon:Icon,label}) => (
                    <div key={label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:L.textMuted }}>
                      <Icon size={12} color={ACCENT}/> {label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Document list */}
        <div style={{ ...card, overflow:'hidden' }}>

          {/* Header */}
          <div style={{ padding: isMobile ? '14px 16px' : '16px 20px', borderBottom:`1px solid ${L.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:L.text }}>Uploaded Documents</div>
              <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>
                {loading ? 'Loading…' : `${docs.length} document${docs.length !== 1 ? 's' : ''}`}
              </div>
            </div>
            {docs.length > 0 && (
              <div style={{ fontSize:11, color:L.textMuted }}>
                Total: <strong style={{ color:L.text }}>${docs.reduce((s,d) => s + (d.total_amount || 0), 0).toLocaleString()}</strong>
              </div>
            )}
          </div>

          {/* Search */}
          {docs.length > 0 && (
            <div style={{ padding: isMobile ? '10px 12px' : '12px 20px', borderBottom:`1px solid ${L.border}` }}>
              <div style={{ position:'relative' }}>
                <FileSearch size={14} color={L.textMuted} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                <input type="text" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width:'100%', padding:'8px 32px 8px 32px', background:L.pageBg, border:`1px solid ${L.border}`, borderRadius:L.radiusSm, color:L.text, fontSize:13, fontFamily:L.font, outline:'none', boxSizing:'border-box' }}
                  onFocus={e => e.currentTarget.style.borderColor = ACCENT}
                  onBlur={e  => e.currentTarget.style.borderColor = L.border}/>
                {search && (
                  <button onClick={() => setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:L.textMuted, display:'flex', padding:2 }}>
                    <X size={13}/>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Desktop table header */}
          {docs.length > 0 && !isMobile && (
            <div style={{ display:'grid', gridTemplateColumns:'2fr 110px 120px 120px 100px 150px 200px', padding:'8px 20px', background:L.pageBg, borderBottom:`1px solid ${L.border}` }}>
              {['FILE NAME','TYPE','VENDOR','CLIENT','AMOUNT','STATUS','ACTIONS'].map(h => (
                <div key={h} style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em' }}>{h}</div>
              ))}
            </div>
          )}

          {loading && (
            <div style={{ padding:48, textAlign:'center' }}>
              <Spinner size={28}/><div style={{ fontSize:13, color:L.textMuted, marginTop:12 }}>Loading documents…</div>
            </div>
          )}

          {!loading && docs.length === 0 && (
            <div style={{ padding: isMobile ? 40 : 64, textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:18, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <FileText size={28} color={ACCENT}/>
              </div>
              <div style={{ fontSize:16, fontWeight:700, color:L.text, marginBottom:6 }}>No documents yet</div>
              <div style={{ fontSize:13, color:L.textMuted }}>Upload your first invoice or receipt above.</div>
            </div>
          )}

          {!loading && docs.length > 0 && filteredDocs.length === 0 && (
            <div style={{ padding:'40px 20px', textAlign:'center' }}>
              <FileSearch size={28} color={L.textMuted} style={{ marginBottom:10 }}/>
              <div style={{ fontSize:14, fontWeight:600, color:L.text, marginBottom:4 }}>No documents found</div>
              <div style={{ fontSize:13, color:L.textMuted, marginBottom:14 }}>No results for "<strong>{search}</strong>"</div>
              <button onClick={() => setSearch('')} style={{ fontSize:12, color:ACCENT, background:'transparent', border:`1px solid rgba(10,185,138,0.3)`, borderRadius:L.radiusSm, padding:'6px 14px', cursor:'pointer', fontFamily:L.font }}>
                Clear search
              </button>
            </div>
          )}

          {/* Document rows */}
          {filteredDocs.map((doc, i) => {
            const ps       = PROC_STATUS[doc.status]        || PROC_STATUS.pending;
            const pay      = PAY_STATUS[doc.payment_status] || null;
            const dts      = DOC_TYPE_STYLE[doc.doc_type]   || DOC_TYPE_STYLE.other;
            const isPaying = markingPaid === doc.id;

            // ── Mobile card layout ──
            if (isMobile) {
              return (
                <div key={doc.id} style={{ padding:'14px 16px', borderBottom: i < filteredDocs.length - 1 ? `1px solid ${L.border}` : 'none', animation:'fadeIn 0.3s ease' }}>
                  {/* Row 1: icon + filename + amount */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {getDocIcon(doc)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:L.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.filename}</div>
                      <div style={{ fontSize:11, color:L.textMuted, marginTop:2 }}>
                        {doc.doc_date && `${doc.doc_date} · `}
                        <span style={{ color:dts.color, fontWeight:600 }}>{dts.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:doc.total_amount ? ACCENT : L.textMuted, flexShrink:0 }}>
                      {doc.total_amount ? `$${Number(doc.total_amount).toLocaleString()}` : '—'}
                    </div>
                  </div>

                  {/* Row 2: vendor + client */}
                  {(doc.vendor || doc.client_name) && (
                    <div style={{ display:'flex', gap:12, marginBottom:8, fontSize:12, color:L.textSub }}>
                      {doc.vendor && <span>📦 {doc.vendor}</span>}
                      {doc.client_name && <span>👤 {doc.client_name}</span>}
                    </div>
                  )}

                  {/* Row 3: status badges */}
                  <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:700, color:ps.color, background:ps.bg, border:`1px solid ${ps.border}` }}>
                      {doc.status === 'processed' ? <CheckCircle size={8}/> : doc.status === 'review' ? <AlertCircle size={8}/> : <Clock size={8}/>}
                      {ps.label}
                    </span>
                    {pay && (
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:700, color:pay.color, background:pay.bg, border:`1px solid ${pay.border}` }}>
                        <DollarSign size={8}/>{pay.label}
                      </span>
                    )}
                  </div>

                  {/* Row 4: action buttons */}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {doc.has_file && (
                      <button onClick={() => setViewingDoc(doc)}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:L.radiusSm, background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)', color:'#0EA5E9', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
                        <Eye size={11}/> View
                      </button>
                    )}
                    {needsMarkPaid(doc) && (
                      <button onClick={() => handleMarkPaid(doc)} disabled={isPaying}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:L.radiusSm, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.3)', color:ACCENT, cursor:isPaying ? 'not-allowed' : 'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}>
                        {isPaying ? <Spinner size={10} color={ACCENT}/> : <CheckCircle size={10}/>}
                        {isPaying ? '…' : 'Mark Paid'}
                      </button>
                    )}
                    {doc.has_file && (
                      <button onClick={() => handleDownload(doc)}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11 }}>
                        <Download size={11}/>
                      </button>
                    )}
                    <button onClick={() => handleDelete(doc.id, doc.filename)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11 }}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                </div>
              );
            }

            // ── Desktop row layout ──
            return (
              <div key={doc.id}
                style={{ display:'grid', gridTemplateColumns:'2fr 110px 120px 120px 100px 150px 200px', padding:'13px 20px', borderBottom: i < filteredDocs.length - 1 ? `1px solid ${L.border}` : 'none', alignItems:'center', transition:'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = L.pageBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {getDocIcon(doc)}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:L.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:190 }}>{doc.filename}</div>
                    {doc.doc_date && <div style={{ fontSize:11, color:L.textMuted, marginTop:1 }}>{doc.doc_date}</div>}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize:10, fontWeight:700, color:dts.color, background:`${dts.color}12`, padding:'3px 8px', borderRadius:20, border:`1px solid ${dts.color}25` }}>{dts.label}</span>
                </div>

                <div style={{ fontSize:13, color:L.textSub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.vendor || '—'}</div>

                <div style={{ minWidth:0 }}>
                  {doc.client_name ? (
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <Users size={11} color="#0EA5E9" style={{ flexShrink:0 }}/>
                      <span style={{ fontSize:12, color:'#0EA5E9', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:90 }}>{doc.client_name}</span>
                    </div>
                  ) : <span style={{ fontSize:12, color:L.textFaint }}>—</span>}
                </div>

                <div style={{ fontSize:14, fontWeight:700, color:doc.total_amount ? ACCENT : L.textMuted }}>
                  {doc.total_amount ? `$${Number(doc.total_amount).toLocaleString()}` : '—'}
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:700, color:ps.color, background:ps.bg, border:`1px solid ${ps.border}`, width:'fit-content' }}>
                    {doc.status === 'processed' ? <CheckCircle size={8}/> : doc.status === 'review' ? <AlertCircle size={8}/> : <Clock size={8}/>}
                    {ps.label}
                  </span>
                  {pay && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:700, color:pay.color, background:pay.bg, border:`1px solid ${pay.border}`, width:'fit-content' }}>
                      <DollarSign size={8}/>{pay.label}
                    </span>
                  )}
                </div>

                <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap' }}>
                  {doc.has_file && (
                    <button onClick={() => setViewingDoc(doc)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 9px', borderRadius:L.radiusSm, background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)', color:'#0EA5E9', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(14,165,233,0.08)'}>
                      <Eye size={11}/> View
                    </button>
                  )}
                  {needsMarkPaid(doc) && (
                    <button onClick={() => handleMarkPaid(doc)} disabled={isPaying}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 9px', borderRadius:L.radiusSm, background:isPaying ? L.pageBg : 'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.3)', color:ACCENT, cursor:isPaying ? 'not-allowed' : 'pointer', fontSize:11, fontWeight:600, fontFamily:L.font }}
                      onMouseEnter={e => { if (!isPaying) e.currentTarget.style.background = 'rgba(10,185,138,0.16)'; }}
                      onMouseLeave={e => { if (!isPaying) e.currentTarget.style.background = 'rgba(10,185,138,0.08)'; }}>
                      {isPaying ? <Spinner size={10} color={ACCENT}/> : <CheckCircle size={10}/>}
                      {isPaying ? '…' : 'Paid'}
                    </button>
                  )}
                  {doc.has_file && (
                    <button onClick={() => handleDownload(doc)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 7px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(10,185,138,0.4)'; e.currentTarget.style.color = ACCENT; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = L.border; e.currentTarget.style.color = L.textMuted; }}>
                      <Download size={11}/>
                    </button>
                  )}
                  <button onClick={() => handleDelete(doc.id, doc.filename)}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 7px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#FCA5A5'; e.currentTarget.style.color = '#EF4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = L.border; e.currentTarget.style.color = L.textMuted; }}>
                    <Trash2 size={11}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document type modal */}
      {showTypeModal && pendingFile && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)', padding:'16px' }}>
          <div style={{ background:'#FFFFFF', borderRadius:20, padding: isMobile ? 24 : 32, width:'100%', maxWidth:420, boxShadow:'0 24px 60px rgba(0,0,0,0.18)', animation:'fadeIn 0.25s ease' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 4px 16px rgba(10,185,138,0.3)' }}>
              <FileText size={22} color="#fff"/>
            </div>
            <div style={{ fontSize:18, fontWeight:700, color:L.text, textAlign:'center', marginBottom:6 }}>What is this document?</div>
            <div style={{ fontSize:13, color:L.textMuted, textAlign:'center', marginBottom:24, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pendingFile.name}</div>

            <button onClick={() => handleUpload(pendingFile, 'expense')}
              style={{ width:'100%', padding:'16px 20px', borderRadius:12, background:'rgba(239,68,68,0.05)', border:'2px solid rgba(239,68,68,0.2)', cursor:'pointer', marginBottom:10, textAlign:'left', fontFamily:L.font }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.09)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><AlertCircle size={18} color="#EF4444"/></div>
                <div><div style={{ fontSize:14, fontWeight:700, color:L.text }}>Expense</div><div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>I paid this — receipt, bill, invoice received</div></div>
              </div>
            </button>

            <button onClick={() => handleUpload(pendingFile, 'income')}
              style={{ width:'100%', padding:'16px 20px', borderRadius:12, background:'rgba(10,185,138,0.05)', border:'2px solid rgba(10,185,138,0.2)', cursor:'pointer', marginBottom:16, textAlign:'left', fontFamily:L.font }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(10,185,138,0.10)'; e.currentTarget.style.borderColor = 'rgba(10,185,138,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,185,138,0.05)'; e.currentTarget.style.borderColor = 'rgba(10,185,138,0.2)'; }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:'rgba(10,185,138,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><CheckCircle size={18} color={ACCENT}/></div>
                <div><div style={{ fontSize:14, fontWeight:700, color:L.text }}>Income</div><div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>I received this — invoice sent, payment received</div></div>
              </div>
            </button>

            <button onClick={() => { setPendingFile(null); setShowTypeModal(false); }}
              style={{ width:'100%', padding:'10px', borderRadius:10, background:'transparent', border:`1px solid ${L.border}`, cursor:'pointer', fontSize:13, color:L.textMuted, fontFamily:L.font }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Document viewer */}
      {viewingDoc && <DocumentViewer doc={viewingDoc} onClose={() => setViewingDoc(null)}/>}
    </div>
  );
}