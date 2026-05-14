import React, { useState, useEffect, useRef } from 'react';
import { L, card, page, topBar } from '../styles/light';
import {
  Upload, FileText, Trash2, RefreshCw, CheckCircle,
  AlertCircle, Eye, Download, Clock,
  FileSearch, Database, LayoutDashboard,
  ArrowUpFromLine, ShieldCheck, Zap, X, Image, Users,
  DollarSign, ZoomIn, ZoomOut, RotateCw, ScanLine,
  Folder, ArrowDownCircle, ArrowUpCircle,
} from 'lucide-react';

const BASE   = 'https://api.getnovala.com/api/v1';
const ACCENT = '#0AB98A';
const GRAD   = 'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)';
const FONT   = "'Inter', -apple-system, sans-serif";

const PROCESS_STEPS = [
  { key:'uploading',            label:'Uploading file',       icon:ArrowUpFromLine, color:'#0AB98A' },
  { key:'reading_document',     label:'Reading document',     icon:FileSearch,      color:'#0EA5E9' },
  { key:'extracting_data',      label:'Extracting data',      icon:ScanLine,        color:'#8B5CF6' },
  { key:'classifying',          label:'Classifying document', icon:ShieldCheck,     color:'#F59E0B' },
  { key:'saving_document',      label:'Saving to system',     icon:Database,        color:'#10B981' },
  { key:'creating_records',     label:'Creating records',     icon:Zap,             color:'#3B82F6' },
  { key:'refreshing_dashboard', label:'Updating dashboard',   icon:LayoutDashboard, color:'#0AB98A' },
];
const PROC_STATUS = {
  processed: { color:'#0AB98A', bg:'rgba(10,185,138,0.08)',  border:'rgba(10,185,138,0.2)',  label:'Processed' },
  review:    { color:'#F59E0B', bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.2)',  label:'Review'    },
  pending:   { color:'#94A3B8', bg:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)', label:'Pending'   },
  failed:    { color:'#EF4444', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.2)',   label:'Failed'    },
  saved:     { color:'#6B7280', bg:'rgba(107,114,128,0.08)', border:'rgba(107,114,128,0.2)', label:'Saved'     },
  reference: { color:'#6B7280', bg:'rgba(107,114,128,0.08)', border:'rgba(107,114,128,0.2)', label:'Saved'     },
};

const PAY_STATUS = {
  paid:           { color:'#0AB98A', bg:'rgba(10,185,138,0.08)',  border:'rgba(10,185,138,0.2)',  label:'Paid'    },
  due:            { color:'#F59E0B', bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.2)',  label:'Due'     },
  overdue:        { color:'#EF4444', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.2)',   label:'Overdue' },
  partially_paid: { color:'#8B5CF6', bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.2)', label:'Partial' },
  unknown:        { color:'#94A3B8', bg:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)', label:'Review needed' },
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
    <div style={{ width:size, height:size, border:'2px solid ' + color + '30', borderTop:'2px solid ' + color, borderRadius:'50%', transform:'rotate(' + deg + 'deg)', flexShrink:0 }} />
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

// ── Document Viewer — fixed ──────────────────────────────────
function DocViewerModal({ doc, onClose }) {
  const [url,     setUrl]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [zoom,    setZoom]    = useState(1);
  const [rotate,  setRotate]  = useState(0);

  const filename = doc.filename || doc.file_name || '';
  const ext = (
    doc.file_type ||
    (filename.includes('.') ? filename.split('.').pop() : '') ||
    ''
  ).toLowerCase().replace('.', '');

  const isImage = ['png','jpg','jpeg','webp','gif','tiff'].includes(ext);
  const isPDF   = ext === 'pdf';

 useEffect(() => {
    let objectUrl = null;

    const tryLoad = async () => {
      setLoading(true);
      setError('');
      try {
        // Use presigned S3 URL — no CORS issues, works in iframe and img
        const res = await fetch(BASE + '/documents/' + doc.id + '/view-url', {
          headers: { Authorization: 'Bearer ' + getToken() },
        });
        if (res.ok) {
          const data = await res.json();
          const presignedUrl = data.url || data.file_url || data.signed_url;
          if (presignedUrl) {
            setUrl(presignedUrl);
            setLoading(false);
            return;
          }
        }
        // Fallback to direct stream
        const res2 = await fetch(BASE + '/documents/' + doc.id + '/view', {
          headers: { Authorization: 'Bearer ' + getToken() },
        });
        if (res2.ok) {
          const blob = await res2.blob();
          if (blob.size > 0) {
            objectUrl = URL.createObjectURL(blob);
            setUrl(objectUrl);
            setLoading(false);
            return;
          }
        }
        setError('Preview not available. Use the download button to open the file.');
      } catch (e) {
        setError('Could not load document. Please try downloading instead.');
      }
      setLoading(false);
    };

    tryLoad();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc.id]);
 const handleDownload = async () => {
    try {
      // Get presigned URL for direct download — works without CORS issues
      const res = await fetch(BASE + '/documents/' + doc.id + '/view-url', {
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      if (res.ok) {
        const data = await res.json();
        const presignedUrl = data.url || data.file_url || data.signed_url;
        if (presignedUrl) {
          const a = document.createElement('a');
          a.href     = presignedUrl;
          a.download = filename || 'document';
          a.target   = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }
      }
      // Fallback to stream download
      const res2 = await fetch(BASE + '/documents/' + doc.id + '/download', {
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      if (!res2.ok) throw new Error('Download failed');
      const blob    = await res2.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a       = document.createElement('a');
      a.href     = blobUrl;
      a.download = filename || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
      setError('Download failed. Please try again.');
    }
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:2000, display:'flex', flexDirection:'column', backdropFilter:'blur(8px)' }}
    >
      {/* Header bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'rgba(0,0,0,0.6)', borderBottom:'1px solid rgba(255,255,255,0.1)', flexShrink:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
          {filename}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0, marginLeft:12 }}>
          {isImage && url && !error && (
            <>
              <button onClick={() => setZoom(z => Math.min(z + 0.25, 4))} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#F1F5F9', display:'flex' }}><ZoomIn size={16}/></button>
              <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#F1F5F9', display:'flex' }}><ZoomOut size={16}/></button>
              <button onClick={() => setRotate(r => r + 90)} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#F1F5F9', display:'flex' }}><RotateCw size={16}/></button>
            </>
          )}
          <button
            onClick={handleDownload}
            style={{ background:'rgba(10,185,138,0.2)', border:'1px solid rgba(10,185,138,0.4)', borderRadius:8, padding:'6px 14px', cursor:'pointer', color:'#0AB98A', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:6, fontFamily:FONT }}
          >
            <Download size={14}/> Download
          </button>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#F1F5F9', display:'flex' }}>
            <X size={18}/>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex:1, overflow:'auto', display:'flex', alignItems:'center', justifyContent:'center', padding:24, minHeight:0 }}>

        {loading && (
          <div style={{ textAlign:'center', color:'#94A3B8' }}>
            <Spinner size={32} color="#0AB98A" />
            <div style={{ fontSize:14, marginTop:16 }}>Loading document...</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>📄</div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:8, color:'#F1F5F9' }}>{filename}</div>
            <div style={{ fontSize:13, marginBottom:24, color:'#94A3B8' }}>{error}</div>
            <button
              onClick={handleDownload}
              style={{ padding:'12px 28px', borderRadius:10, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:FONT }}
            >
              Download File
            </button>
          </div>
        )}

        {!loading && !error && url && (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {isImage && (
              <img
                src={url}
                alt={filename}
                style={{ maxWidth:'100%', maxHeight:'75vh', objectFit:'contain', transform:'scale(' + zoom + ') rotate(' + rotate + 'deg)', transition:'transform 0.2s ease', borderRadius:8, boxShadow:'0 8px 40px rgba(0,0,0,0.5)' }}
              />
            )}
         {isPDF && (
              <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' }}>
                <style>{`
                  @keyframes glow-pulse {
                    0%, 100% { box-shadow: 0 0 24px rgba(10,185,138,0.15), 0 0 48px rgba(10,185,138,0.08), 0 24px 48px rgba(0,0,0,0.4); }
                    50% { box-shadow: 0 0 32px rgba(10,185,138,0.25), 0 0 64px rgba(10,185,138,0.12), 0 24px 48px rgba(0,0,0,0.4); }
                  }
                  @keyframes float-card {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                  }
                `}</style>

                {/* Premium PDF card */}
                <div style={{
                  width: 160,
                  height: 200,
                  borderRadius: 16,
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(20px)',
                  animation: 'glow-pulse 3s ease-in-out infinite, float-card 4s ease-in-out infinite',
                  marginBottom: 28,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>

                  {/* Folded corner */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '0 32px 32px 0',
                    borderColor: 'transparent rgba(10,185,138,0.4) transparent transparent',
                  }}/>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(225deg, rgba(10,185,138,0.15), transparent)',
                    borderBottomLeftRadius: 8,
                  }}/>

                  {/* Top accent line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: 'linear-gradient(90deg, transparent, #0AB98A, transparent)',
                  }}/>

                  {/* PDF badge */}
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(10,185,138,0.25), rgba(14,165,233,0.15))',
                    border: '1px solid rgba(10,185,138,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#0AB98A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="14 2 14 8 20 8" stroke="#0AB98A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="16" y1="13" x2="8" y2="13" stroke="#0AB98A" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="16" y1="17" x2="8" y2="17" stroke="#0AB98A" strokeWidth="1.5" strokeLinecap="round"/>
                      <polyline points="10 9 9 9 8 9" stroke="#0AB98A" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {/* PDF label */}
                  <div style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.15em',
                    color: '#0AB98A',
                    background: 'rgba(10,185,138,0.12)',
                    border: '1px solid rgba(10,185,138,0.25)',
                    padding: '3px 10px',
                    borderRadius: 20,
                  }}>PDF</div>

                  {/* Shimmer overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)',
                    borderRadius: 16,
                    pointerEvents: 'none',
                  }}/>
                </div>

                {/* Filename */}
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 6, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {filename}
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 24 }}>
                  Click below to open or download
                </div>

                {/* Buttons — unchanged */}
                <button
                  onClick={() => window.open(url, '_blank')}
                  style={{ padding:'12px 28px', borderRadius:10, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:FONT, marginRight:12 }}
                >
                  Open PDF
                </button>
                <button
                  onClick={handleDownload}
                  style={{ padding:'12px 28px', borderRadius:10, background:'transparent', color:ACCENT, border:'1px solid ' + ACCENT, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:FONT }}
                >
                  Download
                </button>
              </div>
            )}
            {!isImage && !isPDF && (
              <div style={{ textAlign:'center', color:'#94A3B8' }}>
                <div style={{ fontSize:64, marginBottom:16 }}>📄</div>
                <div style={{ fontSize:15, marginBottom:8, color:'#F1F5F9' }}>{filename}</div>
                <div style={{ fontSize:13, marginBottom:24 }}>Preview not available for this file type</div>
                <button
                  onClick={handleDownload}
                  style={{ padding:'12px 28px', borderRadius:10, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:FONT }}
                >
                  Download to View
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer metadata */}
      {(doc.vendor || doc.total_amount || doc.doc_date || doc.suggested_cat) && (
        <div style={{ padding:'12px 20px', background:'rgba(0,0,0,0.5)', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:24, flexWrap:'wrap', flexShrink:0 }}>
          {doc.vendor       && <div style={{ fontSize:12, color:'#64748B' }}>Vendor: <strong style={{ color:'#F1F5F9' }}>{doc.vendor}</strong></div>}
          {doc.total_amount && <div style={{ fontSize:12, color:'#64748B' }}>Amount: <strong style={{ color:ACCENT }}>${Number(doc.total_amount).toLocaleString()}</strong></div>}
          {doc.doc_date     && <div style={{ fontSize:12, color:'#64748B' }}>Date: <strong style={{ color:'#F1F5F9' }}>{doc.doc_date}</strong></div>}
          {doc.suggested_cat&& <div style={{ fontSize:12, color:'#64748B' }}>Category: <strong style={{ color:'#F1F5F9' }}>{doc.suggested_cat}</strong></div>}
        </div>
      )}
    </div>
  );
}

// ── Upload Type Modal — 3 options ────────────────────────────
function UploadTypeModal({ file, onChoose, onCancel, isMobile }) {
  const OPTIONS = [
    {
      type:  'expense',
      Icon:  ArrowDownCircle,
      color: '#EF4444',
      bg:    '#FEE2E2',
      label: 'Expense',
      desc:  'Money I paid out. Receipts, bills, or invoices I received.',
    },
    {
      type:  'income',
      Icon:  ArrowUpCircle,
      color: '#0AB98A',
      bg:    '#E8F4F0',
      label: 'Income',
      desc:  'Money I received. Invoices I sent or payments deposited.',
    },
    {
      type:  'reference',
      Icon:  Folder,
      color: '#6B7280',
      bg:    '#F1F5F9',
      label: 'Just Save',
      desc:  'Store for reference only. Do not add to my books.',
    },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:isMobile ? 24 : 32, width:'100%', maxWidth:440, boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>

        {/* Icon */}
        <div style={{ width:52, height:52, borderRadius:14, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 4px 16px rgba(10,185,138,0.3)' }}>
          <FileText size={22} color="#fff"/>
        </div>

        {/* Title */}
        <div style={{ fontSize:18, fontWeight:700, color:L.text, textAlign:'center', marginBottom:6 }}>
          What is this document?
        </div>
        <div style={{ fontSize:12, color:L.textMuted, textAlign:'center', marginBottom:24, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingLeft:16, paddingRight:16 }}>
          {file.name}
        </div>

        {/* Options */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {OPTIONS.map(function(opt) {
            return (
              <button
                key={opt.type}
                onClick={function() { onChoose(opt.type); }}
                style={{ width:'100%', padding:'14px 16px', borderRadius:12, background:'#fff', border:'1px solid #E5E7EB', cursor:'pointer', textAlign:'left', fontFamily:FONT, transition:'all 0.15s ease' }}
                onMouseEnter={function(e) {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = opt.color;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={function(e) {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.transform = 'none';
                }}
                onMouseDown={function(e) { e.currentTarget.style.transform = 'scale(0.99)'; }}
                onMouseUp={function(e) { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:opt.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <opt.Icon size={20} color={opt.color}/>
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:2 }}>{opt.label}</div>
                    <div style={{ fontSize:12, color:L.textMuted }}>{opt.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Cancel */}
        <button
          onClick={onCancel}
          style={{ width:'100%', padding:'10px', borderRadius:10, background:'transparent', border:'none', cursor:'pointer', fontSize:13, color:'#6B7280', fontFamily:FONT }}
          onMouseEnter={function(e) { e.currentTarget.style.color = '#0F172A'; }}
          onMouseLeave={function(e) { e.currentTarget.style.color = '#6B7280'; }}
        >
          Cancel
        </button>
      </div>
    </div>
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
const [activeTab,     setActiveTab]     = useState('all');

  const pollingRef   = useRef(null);
  const fileInputRef = useRef(null);
  const isMobile     = useIsMobile();

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };
  useEffect(() => () => stopPolling(), []);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(BASE + '/documents/', { headers: { Authorization: 'Bearer ' + getToken() } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const list = await res.json();
      setDocs(Array.isArray(list) ? list : []);
    } catch (e) {
      setError('Could not load documents: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pollUploadStatus = (jobId, fileName) => {
    stopPolling();
    let attempts = 0;
    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 120) {
        stopPolling(); setUploading(false);
        setError('Processing is taking longer than expected. Please refresh.');
        return;
      }
      try {
        const res  = await fetch(BASE + '/documents/upload-status/' + jobId, {
          headers: { Authorization: 'Bearer ' + getToken() },
        });
        if (!res.ok) throw new Error('Status check failed');
        const data = await res.json();
        setUploadStatus(data);
        if (data.status === 'completed') {
          stopPolling(); setUploading(false);
          setSuccess(fileName + ' processed successfully');
          await load();
          setTimeout(() => { setSuccess(''); setUploadStatus(null); }, 5000);
        }
        if (data.status === 'failed') {
          stopPolling(); setUploading(false);
          setError(data.error_message || 'Processing failed. Please try again.');
        }
      } catch (e) {
        stopPolling(); setUploading(false);
        setError('Could not check processing status. Please refresh.');
      }
    }, 2000);
  };

  const handleUpload = async (file, txnType) => {
    if (!file) return;
    const token = getToken();
    if (!token) { setError('Not logged in.'); return; }
    const allowed = ['pdf','csv','png','jpg','jpeg','tiff','webp','txt'];
    const ext     = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) { setError('File type .' + ext + ' is not supported.'); return; }
    if (file.size > 20 * 1024 * 1024) { setError('File size must be under 20MB.'); return; }

    setUploading(true); setError(''); setSuccess('');
    setUploadStatus({ status:'uploading', current_step:'uploading', progress:5, filename:file.name });
    setShowTypeModal(false); setPendingFile(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Payment status comes from the document content, not from the upload type choice.
      // txnType only tells the backend the direction (expense/income/reference).
      const res = await fetch(BASE + '/documents/upload?txn_type=' + txnType, {
        method:  'POST',
        headers: { Authorization: 'Bearer ' + token },
        body:    formData,
      });

      let data;
      try { data = await res.json(); } catch { throw new Error('Server error: ' + res.status); }
      if (!res.ok) throw new Error(data.detail || 'Upload failed: ' + res.status);

      // Just Save — no job polling needed, just reload
      if (txnType === 'reference') {
        setUploading(false);
        setSuccess(file.name + ' saved to your documents.');
        setUploadStatus(null);
        await load();
        setTimeout(() => setSuccess(''), 4000);
        return;
      }

      if (!data.job_id) throw new Error('Upload succeeded but no job ID returned.');
      setUploadStatus(prev => Object.assign({}, prev, data));
      pollUploadStatus(data.job_id, file.name);

    } catch (e) {
      setUploading(false);
      setUploadStatus(null);
      setError('Upload failed: ' + e.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

const handleDownload = async (doc) => {
    try {
      // Try presigned URL first — avoids S3 key errors
      const res = await fetch(BASE + '/documents/' + doc.id + '/view-url', {
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      if (res.ok) {
        const data = await res.json();
        const presignedUrl = data.url || data.file_url || data.signed_url;
        if (presignedUrl) {
          const a = document.createElement('a');
          a.href     = presignedUrl;
          a.download = doc.filename || 'document';
          a.target   = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }
      }
      // Fallback to stream download
      const res2 = await fetch(BASE + '/documents/' + doc.id + '/download', {
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      if (!res2.ok) throw new Error('Download failed');
      const blob = await res2.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = doc.filename || 'document';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError('Download failed: ' + e.message); }
  };
  const handleDelete = async (id, filename) => {
    if (!window.confirm('Delete "' + filename + '"?')) return;
    try {
      const res = await fetch(BASE + '/documents/' + id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      if (res.ok || res.status === 204) {
        setSuccess('Document deleted'); await load();
        setTimeout(() => setSuccess(''), 3000);
      } else throw new Error('Delete failed: ' + res.status);
    } catch (e) { setError('Delete failed: ' + e.message); }
  };

  const handleMarkPaid = async (doc) => {
    if (!window.confirm('Mark "' + doc.filename + '" as paid?')) return;
    setMarkingPaid(doc.id);
    try {
      const res  = await fetch(BASE + '/documents/' + doc.id + '/mark-paid', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.detail || 'Failed to mark as paid.'); return; }
      setDocs(prev => prev.map(d => d.id === doc.id ? Object.assign({}, d, { payment_status:'paid', paid_at:data.paid_at }) : d));
      setSuccess(doc.filename + ' marked as paid');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) { setError('Failed to mark as paid: ' + e.message); }
    finally { setMarkingPaid(null); }
  };

  const hasAmount = (doc) =>
    doc.total_amount !== null &&
    doc.total_amount !== undefined &&
    Number(doc.total_amount) > 0;

  const isReference = (doc) =>
    doc.txn_type === 'reference' ||
    doc.doc_category === 'reference' ||
    doc.doc_type === 'other' ||
    (!hasAmount(doc) && !doc.vendor && !doc.invoice_number);

  const needsMarkPaid = (doc) =>
    !isReference(doc) &&
    hasAmount(doc) &&
    ['due','overdue','partially_paid'].includes(doc.payment_status);

  const currentStepIndex = PROCESS_STEPS.findIndex(s => s.key === uploadStatus?.current_step);
  const progress         = uploadStatus?.progress || 0;

  const getDocIcon = (doc) => {
    const ext = (doc.file_type || '').toLowerCase();
    if (['png','jpg','jpeg','webp','gif'].includes(ext)) return <Image size={15} color={ACCENT}/>;
    return <FileText size={15} color={ACCENT}/>;
  };



const tabDocs = docs.filter(function(doc) {
  if (activeTab === 'financial') return !isReference(doc);
  if (activeTab === 'saved')     return isReference(doc);
  return true;
});

const filteredDocs = search.trim() === '' ? tabDocs : tabDocs.filter(function(doc) {
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
      <div style={Object.assign({}, topBar, { flexDirection:isMobile?'column':'row', alignItems:isMobile?'flex-start':'center', gap:isMobile?10:0 })}>
        <div>
          <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Documents</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Upload invoices and receipts — data extracted and organized automatically</div>
        </div>
        <button
          onClick={load}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:'transparent', border:'1px solid ' + L.border, color:L.textMuted, cursor:'pointer', fontSize:12, fontFamily:FONT, marginLeft:isMobile?0:'auto' }}
        >
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      <div style={{ padding:pad }}>

        {success && (
          <div style={{ padding:'12px 16px', borderRadius:L.radiusSm, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', color:ACCENT, fontSize:13, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}><CheckCircle size={15}/>{success}</div>
            <button onClick={() => setSuccess('')} style={{ background:'none', border:'none', cursor:'pointer', color:ACCENT }}><X size={14}/></button>
          </div>
        )}

        {error && (
          <div style={{ padding:'12px 16px', borderRadius:L.radiusSm, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', fontSize:13, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}><AlertCircle size={15}/>{error}</div>
            <button onClick={() => setError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444' }}><X size={14}/></button>
          </div>
        )}

        {/* Upload zone */}
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f && !uploading) { setPendingFile(f); setShowTypeModal(true); } }}
          onDragOver={e => { e.preventDefault(); if (!uploading) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{ border:'2px dashed ' + (dragOver ? ACCENT : uploading ? 'transparent' : '#E2E8F0'), borderRadius:16, padding:uploading ? (isMobile?'24px 16px':'32px 24px') : (isMobile?'32px 16px':'44px 24px'), textAlign:'center', cursor:uploading?'default':'pointer', background:uploading?'linear-gradient(135deg,rgba(10,185,138,0.03),rgba(14,165,233,0.03))':dragOver?'rgba(10,185,138,0.04)':'#FFFFFF', marginBottom:16, transition:'all 0.25s ease', position:'relative', overflow:'hidden' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv,.png,.jpg,.jpeg,.tiff,.webp,.txt"
            style={{ display:'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f && !uploading) { setPendingFile(f); setShowTypeModal(true); } }}
          />

          {uploading ? (
            <div>
              <div style={{ position:'relative', width:isMobile?90:120, height:isMobile?90:120, margin:'0 auto 16px' }}>
                <ProgressRing progress={progress} size={isMobile?90:120}/>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ width:isMobile?42:56, height:isMobile?42:56, borderRadius:16, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(10,185,138,0.35)', animation:'pulse-ring 2s infinite' }}>
                    <ScanLine size={isMobile?18:24} color="#fff"/>
                  </div>
                </div>
              </div>
              <div style={{ fontSize:isMobile?14:16, fontWeight:700, color:L.text, marginBottom:4 }}>Processing your document</div>
              <div style={{ fontSize:13, color:L.textMuted, marginBottom:6 }}>{uploadStatus?.filename || ''}</div>
              <div style={{ width:isMobile?'100%':320, height:6, background:'#E2E8F0', borderRadius:99, margin:'0 auto 20px', overflow:'hidden' }}>
                <div style={{ width:progress + '%', height:'100%', borderRadius:99, background:'linear-gradient(90deg,#0AB98A,#0EA5E9,#0AB98A)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite linear', transition:'width 0.4s ease' }}/>
              </div>
              <div style={{ display:'inline-flex', flexDirection:'column', gap:8, textAlign:'left' }}>
                {PROCESS_STEPS.map(function(step, index) {
                  const done   = index < currentStepIndex || uploadStatus?.status === 'completed';
                  const active = step.key === uploadStatus?.current_step;
                  const Icon   = step.icon;
                  return (
                    <div key={step.key} style={{ display:'flex', alignItems:'center', gap:8, opacity:done||active?1:0.35 }}>
                      <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, background:done?'rgba(10,185,138,0.12)':active?step.color+'18':'#F1F5F9', border:'1px solid ' + (done?'rgba(10,185,138,0.3)':active?step.color+'35':'#E2E8F0'), display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {done ? <CheckCircle size={12} color={ACCENT}/> : active ? <Spinner size={12} color={step.color}/> : <Icon size={12} color="#CBD5E1"/>}
                      </div>
                      <span style={{ fontSize:isMobile?12:13, fontWeight:active?600:done?500:400, color:done?L.text:active?step.color:L.textMuted }}>{step.label}</span>
                      {!isMobile && active && <div style={{ fontSize:10, fontWeight:700, color:step.color, background:step.color+'15', border:'1px solid ' + step.color + '30', padding:'1px 7px', borderRadius:20 }}>RUNNING</div>}
                      {!isMobile && done  && <div style={{ fontSize:10, fontWeight:700, color:ACCENT, background:'rgba(10,185,138,0.1)', border:'1px solid rgba(10,185,138,0.25)', padding:'1px 7px', borderRadius:20 }}>DONE</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize:isMobile?22:28, fontWeight:800, color:L.text, marginTop:16, letterSpacing:'-0.03em' }}>{progress}%</div>
            </div>
          ) : (
            <div>
              <div style={{ width:64, height:64, borderRadius:18, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', animation:'float 3s ease-in-out infinite' }}>
                <Upload size={26} color={ACCENT}/>
              </div>
              <div style={{ fontSize:isMobile?15:16, fontWeight:700, color:L.text, marginBottom:6 }}>
                {dragOver ? 'Drop to upload' : isMobile ? 'Tap to upload a document' : 'Drop files here or click to browse'}
              </div>
              <div style={{ fontSize:13, color:L.textMuted, marginBottom:16 }}>PDF, CSV, PNG, JPG — invoices, receipts, bank statements</div>
              <button
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                style={{ padding:'10px 28px', borderRadius:10, background:GRAD, color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, boxShadow:'0 4px 14px rgba(10,185,138,0.3)' }}
              >
                Choose File
              </button>
              {!isMobile && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginTop:16, flexWrap:'wrap' }}>
                  {[
                    { icon:ScanLine,   label:'Smart Extraction' },
                    { icon:ShieldCheck,label:'Auto-categorized' },
                    { icon:Zap,        label:'Instant records'  },
                    { icon:Users,      label:'Client detection' },
                  ].map(function(item) {
                    return (
                      <div key={item.label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:L.textMuted }}>
                        <item.icon size={12} color={ACCENT}/> {item.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

       {/* Document list */}
        <div style={Object.assign({}, card, { overflow:'hidden' })}>
          <div style={{ padding:isMobile?'14px 16px':'16px 20px', borderBottom:'1px solid ' + L.border, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:L.text }}>Uploaded Documents</div>
              <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>{loading ? 'Loading...' : docs.length + ' document' + (docs.length !== 1 ? 's' : '')}</div>
            </div>
            {docs.length > 0 && (
              <div style={{ fontSize:11, color:L.textMuted }}>
                Total: <strong style={{ color:L.text }}>${docs.filter(function(d) { return !isReference(d); }).reduce(function(s, d) { return s + (d.total_amount || 0); }, 0).toLocaleString()}</strong>
              </div>
            )}
          </div>

          {/* Tabs — All / Financial / Saved */}
          <div style={{ padding:'10px 20px', borderBottom:'1px solid ' + L.border, display:'flex', gap:6 }}>
            {[
              { id:'all',       label:'All',       count: docs.length },
              { id:'financial', label:'Financial', count: docs.filter(function(d) { return !isReference(d); }).length },
              { id:'saved',     label:'Saved',     count: docs.filter(function(d) { return isReference(d); }).length },
            ].map(function(tab) {
              return (
                <button
                  key={tab.id}
                  onClick={function() { setActiveTab(tab.id); }}
                  style={{ padding:'5px 14px', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:600, border:'1px solid', fontFamily:FONT, transition:'all 0.15s', borderColor: activeTab === tab.id ? ACCENT : L.border, background: activeTab === tab.id ? 'rgba(10,185,138,0.08)' : '#fff', color: activeTab === tab.id ? ACCENT : L.textMuted }}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          {docs.length > 0 && (
            <div style={{ padding:isMobile?'10px 12px':'12px 20px', borderBottom:'1px solid ' + L.border }}>
              <div style={{ position:'relative' }}>
                <FileSearch size={14} color={L.textMuted} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width:'100%', padding:'8px 32px', background:L.pageBg, border:'1px solid ' + L.border, borderRadius:L.radiusSm, color:L.text, fontSize:13, fontFamily:FONT, outline:'none', boxSizing:'border-box' }}
                  onFocus={e => e.currentTarget.style.borderColor = ACCENT}
                  onBlur={e  => e.currentTarget.style.borderColor = L.border}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:L.textMuted, display:'flex', padding:2 }}>
                    <X size={13}/>
                  </button>
                )}
              </div>
            </div>
          )}

          {docs.length > 0 && !isMobile && (
            <div style={{ display:'grid', gridTemplateColumns:'2fr 110px 120px 120px 100px 150px 200px', padding:'8px 20px', background:L.pageBg, borderBottom:'1px solid ' + L.border }}>
              {['FILE NAME','TYPE','VENDOR','CLIENT','AMOUNT','STATUS','ACTIONS'].map(function(h) {
                return <div key={h} style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em' }}>{h}</div>;
              })}
            </div>
          )}

          {loading && (
            <div style={{ padding:48, textAlign:'center' }}>
              <Spinner size={28}/>
              <div style={{ fontSize:13, color:L.textMuted, marginTop:12 }}>Loading documents...</div>
            </div>
          )}

          {!loading && docs.length === 0 && (
            <div style={{ padding:isMobile?40:64, textAlign:'center' }}>
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
              <div style={{ fontSize:13, color:L.textMuted, marginBottom:14 }}>No results for "{search}"</div>
              <button onClick={() => setSearch('')} style={{ fontSize:12, color:ACCENT, background:'transparent', border:'1px solid rgba(10,185,138,0.3)', borderRadius:L.radiusSm, padding:'6px 14px', cursor:'pointer', fontFamily:FONT }}>
                Clear search
              </button>
            </div>
          )}

          {filteredDocs.map(function(doc, i) {
            const ps       = PROC_STATUS[doc.status]        || PROC_STATUS.pending;
            const pay      = PAY_STATUS[doc.payment_status] || null;
            const dts      = DOC_TYPE_STYLE[doc.doc_type]   || DOC_TYPE_STYLE.other;
            const isPaying = markingPaid === doc.id;

            if (isMobile) {
              return (
                <div key={doc.id} style={{ padding:'14px 16px', borderBottom:i < filteredDocs.length-1 ? '1px solid ' + L.border : 'none' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {getDocIcon(doc)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:L.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.filename}</div>
                      <div style={{ fontSize:11, color:L.textMuted, marginTop:2 }}>
                        {doc.doc_date && doc.doc_date + ' · '}<span style={{ color:dts.color, fontWeight:600 }}>{dts.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:doc.total_amount?ACCENT:L.textMuted, flexShrink:0 }}>
                    {hasAmount(doc) ? '$' + Number(doc.total_amount).toLocaleString() : '—'}
                    </div>
                  </div>
                  {(doc.vendor || doc.client_name) && (
                    <div style={{ display:'flex', gap:12, marginBottom:8, fontSize:12, color:L.textSub }}>
                      {doc.vendor      && <span>📦 {doc.vendor}</span>}
                      {doc.client_name && <span>👤 {doc.client_name}</span>}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:700, color: isReference(doc) ? '#6B7280' : ps.color, background: isReference(doc) ? 'rgba(107,114,128,0.08)' : ps.bg, border:'1px solid ' + (isReference(doc) ? 'rgba(107,114,128,0.2)' : ps.border) }}>
                      {isReference(doc) ? <Folder size={8}/> : doc.status==='processed'?<CheckCircle size={8}/>:doc.status==='review'?<AlertCircle size={8}/>:<Clock size={8}/>}{isReference(doc) ? 'Saved' : ps.label}
                    </span>
                 {pay && !isReference(doc) && hasAmount(doc) && <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:700, color:pay.color, background:pay.bg, border:'1px solid ' + pay.border }}><DollarSign size={8}/>{pay.label}</span>}
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <button
                      onClick={() => setViewingDoc(doc)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:L.radiusSm, background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)', color:'#0EA5E9', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:FONT }}
                    >
                      <Eye size={11}/> View
                    </button>
                    {needsMarkPaid(doc) && (
                      <button
                        onClick={() => handleMarkPaid(doc)}
                        disabled={isPaying}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:L.radiusSm, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.3)', color:ACCENT, cursor:isPaying?'not-allowed':'pointer', fontSize:11, fontWeight:600, fontFamily:FONT }}
                      >
                        {isPaying ? <Spinner size={10} color={ACCENT}/> : <CheckCircle size={10}/>}{isPaying ? '...' : 'Mark Paid'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(doc)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:L.radiusSm, background:'transparent', border:'1px solid ' + L.border, color:L.textMuted, cursor:'pointer', fontSize:11 }}
                    >
                      <Download size={11}/>
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.filename)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:L.radiusSm, background:'transparent', border:'1px solid ' + L.border, color:L.textMuted, cursor:'pointer', fontSize:11 }}
                    >
                      <Trash2 size={11}/>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={doc.id}
                style={{ display:'grid', gridTemplateColumns:'2fr 110px 120px 120px 100px 150px 200px', padding:'13px 20px', borderBottom:i<filteredDocs.length-1?'1px solid ' + L.border:'none', alignItems:'center', transition:'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = L.pageBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
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
                  <span style={{ fontSize:10, fontWeight:700, color:dts.color, background:dts.color+'12', padding:'3px 8px', borderRadius:20, border:'1px solid ' + dts.color+'25' }}>{dts.label}</span>
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

     <div style={{ fontSize:14, fontWeight:700, color:hasAmount(doc)?ACCENT:L.textMuted }}>
                  {hasAmount(doc) ? '$' + Number(doc.total_amount).toLocaleString() : '—'}
                </div>
               <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:700, color: isReference(doc) ? '#6B7280' : ps.color, background: isReference(doc) ? 'rgba(107,114,128,0.08)' : ps.bg, border:'1px solid ' + (isReference(doc) ? 'rgba(107,114,128,0.2)' : ps.border), width:'fit-content' }}>
                    {isReference(doc) ? <Folder size={8}/> : doc.status==='processed' ? <CheckCircle size={8}/> : doc.status==='review' ? <AlertCircle size={8}/> : <Clock size={8}/>}{isReference(doc) ? 'Saved' : ps.label}
                  </span>
                 {pay && !isReference(doc) && hasAmount(doc) && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:700, color:pay.color, background:pay.bg, border:'1px solid ' + pay.border, width:'fit-content' }}>
                      <DollarSign size={8}/>{pay.label}
                    </span>
                  )}
                </div>

                <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap' }}>
                  <button
                    onClick={() => setViewingDoc(doc)}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 9px', borderRadius:L.radiusSm, background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)', color:'#0EA5E9', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:FONT }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(14,165,233,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(14,165,233,0.08)'}
                  >
                    <Eye size={11}/> View
                  </button>

                  {needsMarkPaid(doc) && (
                    <button
                      onClick={() => handleMarkPaid(doc)}
                      disabled={isPaying}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 9px', borderRadius:L.radiusSm, background:isPaying?L.pageBg:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.3)', color:ACCENT, cursor:isPaying?'not-allowed':'pointer', fontSize:11, fontWeight:600, fontFamily:FONT }}
                      onMouseEnter={e => { if (!isPaying) e.currentTarget.style.background='rgba(10,185,138,0.16)'; }}
                      onMouseLeave={e => { if (!isPaying) e.currentTarget.style.background='rgba(10,185,138,0.08)'; }}
                    >
                      {isPaying ? <Spinner size={10} color={ACCENT}/> : <CheckCircle size={10}/>}{isPaying ? '...' : 'Paid'}
                    </button>
                  )}

                  <button
                    onClick={() => handleDownload(doc)}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 7px', borderRadius:L.radiusSm, background:'transparent', border:'1px solid ' + L.border, color:L.textMuted, cursor:'pointer', fontSize:11 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(10,185,138,0.4)'; e.currentTarget.style.color=ACCENT; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=L.border; e.currentTarget.style.color=L.textMuted; }}
                  >
                    <Download size={11}/>
                  </button>

                  <button
                    onClick={() => handleDelete(doc.id, doc.filename)}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 7px', borderRadius:L.radiusSm, background:'transparent', border:'1px solid ' + L.border, color:L.textMuted, cursor:'pointer', fontSize:11 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#FCA5A5'; e.currentTarget.style.color='#EF4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=L.border; e.currentTarget.style.color=L.textMuted; }}
                  >
                    <Trash2 size={11}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload type modal */}
      {showTypeModal && pendingFile && (
        <UploadTypeModal
          file={pendingFile}
          isMobile={isMobile}
          onChoose={function(type) { handleUpload(pendingFile, type); }}
          onCancel={function() { setPendingFile(null); setShowTypeModal(false); }}
        />
      )}

      {/* Document viewer */}
      {viewingDoc && (
        <DocViewerModal
          doc={viewingDoc}
          onClose={function() { setViewingDoc(null); }}
        />
      )}
    </div>
  );
}