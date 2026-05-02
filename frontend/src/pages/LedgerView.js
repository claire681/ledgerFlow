import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, X, Sparkles, ArrowRight, FileText,
  CheckCircle, AlertTriangle, GitCompare,
  Download, Eye, ChevronRight,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';
import { useAI } from '../hooks/useAI';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ACCENT   = '#0AB98A';
const BASE     = 'https://api.getnovala.com/api/v1';
const getToken = () => localStorage.getItem('token') || '';

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

function DropZone({ label, file, onFile, onClear, isMobile }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);

  return (
    <div style={{ flex:1 }}>
      <div style={{ fontSize:11, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
      <div
        onDrop={e => { e.preventDefault(); setDrag(false); const f=e.dataTransfer.files[0]; if(f) onFile(f); }}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onClick={() => !file && ref.current?.click()}
        style={{ border:`2px dashed ${drag?ACCENT:file?ACCENT:L.border}`, borderRadius:L.radius, padding:isMobile?20:28, textAlign:'center', cursor:file?'default':'pointer', background:drag||file?'rgba(10,185,138,0.04)':'#fff', transition:'all 0.2s', minHeight:120, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <input ref={ref} type="file" accept=".pdf,.png,.jpg,.jpeg,.csv" style={{ display:'none' }} onChange={e => onFile(e.target.files[0])}/>
        {file ? (
          <div>
            <div style={{ width:40, height:40, borderRadius:10, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
              <FileText size={20} color={ACCENT}/>
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:L.text, marginBottom:4 }}>{file.name}</div>
            <div style={{ fontSize:11, color:ACCENT, marginBottom:10 }}>Ready to compare ✓</div>
            <button onClick={e => { e.stopPropagation(); onClear(); }}
              style={{ background:'none', border:`1px solid ${L.border}`, borderRadius:L.radiusSm, padding:'4px 12px', cursor:'pointer', fontSize:11, color:L.textMuted, fontFamily:L.font, display:'inline-flex', alignItems:'center', gap:4 }}>
              <X size={11}/> Remove
            </button>
          </div>
        ) : (
          <div>
            <div style={{ width:40, height:40, borderRadius:10, background:L.pageBg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
              <Upload size={20} color={L.textMuted}/>
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:L.text, marginBottom:4 }}>{isMobile?'Tap to upload':'Drop file here'}</div>
            <div style={{ fontSize:11, color:L.textMuted }}>PDF, PNG, JPG, CSV</div>
          </div>
        )}
      </div>
    </div>
  );
}

function DiffRow({ label, val1, val2, type }) {
  const isDiff  = String(val1) !== String(val2);
  const isNum   = type === 'number';
  const numDiff = isNum ? (Number(val2)||0) - (Number(val1)||0) : null;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 1fr 120px', padding:'10px 20px', borderBottom:`1px solid ${L.border}`, alignItems:'center', background:isDiff?'rgba(245,158,11,0.04)':'transparent' }}>
      <div style={{ fontSize:11, color:L.textMuted, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:12, color:L.text, fontFamily:isNum?L.fontMono:'inherit', padding:'4px 8px', borderRadius:6, background:isDiff?'rgba(239,68,68,0.06)':'transparent' }}>
        {isNum && val1 ? fmt(val1) : val1 || '—'}
      </div>
      <div style={{ fontSize:12, color:L.text, fontFamily:isNum?L.fontMono:'inherit', padding:'4px 8px', borderRadius:6, background:isDiff?'rgba(10,185,138,0.06)':'transparent' }}>
        {isNum && val2 ? fmt(val2) : val2 || '—'}
      </div>
      <div style={{ fontSize:11, fontWeight:600 }}>
        {isDiff ? (
          isNum && numDiff !== null ? (
            <span style={{ color:numDiff>0?L.red:ACCENT }}>
              {numDiff>0?'+':''}{fmt(numDiff)}
            </span>
          ) : (
            <span style={{ color:'#F59E0B', display:'flex', alignItems:'center', gap:4 }}>
              <AlertTriangle size={11}/> Changed
            </span>
          )
        ) : (
          <span style={{ color:ACCENT, display:'flex', alignItems:'center', gap:4 }}>
            <CheckCircle size={11}/> Match
          </span>
        )}
      </div>
    </div>
  );
}

export default function DocumentComparison() {
  const [file1,     setFile1]     = useState(null);
  const [file2,     setFile2]     = useState(null);
  const [doc1,      setDoc1]      = useState(null);
  const [doc2,      setDoc2]      = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compared,  setCompared]  = useState(false);
  const [error,     setError]     = useState('');
  const { setPageContext, askAndOpen } = useAI();
  const isMobile = useIsMobile();

  useEffect(() => { setPageContext('comparison', { page:'comparison' }); }, []);

  const uploadDoc = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res  = await fetch(`${BASE}/documents/upload?txn_type=expense`, {
      method:'POST', headers:{ Authorization:`Bearer ${getToken()}` }, body:formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Upload failed');

    // Poll for completion
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const statusRes  = await fetch(`${BASE}/documents/upload-status/${data.job_id}`, { headers:{ Authorization:`Bearer ${getToken()}` } });
          const statusData = await statusRes.json();
          if (statusData.status === 'completed') {
            clearInterval(interval);
            const docsRes  = await fetch(`${BASE}/documents/`, { headers:{ Authorization:`Bearer ${getToken()}` } });
            const docsList = await docsRes.json();
            resolve(Array.isArray(docsList) ? docsList[0] : null);
          }
          if (statusData.status === 'failed') {
            clearInterval(interval);
            reject(new Error('Processing failed'));
          }
        } catch (e) { clearInterval(interval); reject(e); }
      }, 1500);
    });
  };

  const handleCompare = async () => {
    if (!file1 || !file2) return;
    setComparing(true); setError(''); setDoc1(null); setDoc2(null); setCompared(false);
    try {
      const [d1, d2] = await Promise.all([uploadDoc(file1), uploadDoc(file2)]);
      setDoc1(d1); setDoc2(d2); setCompared(true);
    } catch (e) { setError('Comparison failed: ' + e.message); }
    finally { setComparing(false); }
  };

  const reset = () => {
    setFile1(null); setFile2(null); setDoc1(null); setDoc2(null);
    setCompared(false); setError('');
  };

  const differences = compared && doc1 && doc2 ? [
    { label:'Vendor',       val1:doc1.vendor,        val2:doc2.vendor,        type:'text'   },
    { label:'Total Amount', val1:doc1.total_amount,  val2:doc2.total_amount,  type:'number' },
    { label:'Date',         val1:doc1.doc_date,      val2:doc2.doc_date,      type:'text'   },
    { label:'Category',     val1:doc1.suggested_cat, val2:doc2.suggested_cat, type:'text'   },
    { label:'Tax Amount',   val1:doc1.tax_amount,    val2:doc2.tax_amount,    type:'number' },
    { label:'Document Type',val1:doc1.doc_type,      val2:doc2.doc_type,      type:'text'   },
  ] : [];

  const diffCount = differences.filter(d => String(d.val1) !== String(d.val2)).length;

  const exportPDF = () => {
    if (!compared) return;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(10,185,138);
    doc.text('Novala', 14, 16);
    doc.setFontSize(12); doc.setTextColor(100);
    doc.text('Document Comparison Report', 14, 23);
    doc.setFontSize(9);
    doc.text(`${file1?.name} vs ${file2?.name} · Generated: ${new Date().toLocaleDateString()}`, 14, 29);
    doc.text(`${diffCount} difference${diffCount!==1?'s':''} found`, 14, 35);

    autoTable(doc, {
      startY:40,
      head:[['Field','Document 1','Document 2','Status']],
      body:differences.map(d => [
        d.label,
        d.type==='number'&&d.val1?fmt(d.val1):d.val1||'—',
        d.type==='number'&&d.val2?fmt(d.val2):d.val2||'—',
        String(d.val1)===String(d.val2)?'Match':'Different',
      ]),
      styles:{ fontSize:9 },
      headStyles:{ fillColor:[10,185,138], textColor:255 },
    });
    doc.save('Novala_DocComparison.pdf');
  };

  const pad = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>

      {/* Top bar */}
      <div style={{ ...topBar, flexDirection:isMobile?'column':'row', alignItems:isMobile?'flex-start':'center', gap:isMobile?10:0, padding:isMobile?'16px':undefined }}>
        <div>
          <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Document Comparison</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Upload two documents — AI extracts and compares key fields</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {compared && (
            <button onClick={exportPDF}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
              <Download size={13}/> Export PDF
            </button>
          )}
          {compared && (
            <button onClick={() => askAndOpen(`Compare these two documents: Doc1 vendor=${doc1?.vendor}, amount=${doc1?.total_amount}, date=${doc1?.doc_date}. Doc2 vendor=${doc2?.vendor}, amount=${doc2?.total_amount}, date=${doc2?.doc_date}. There are ${diffCount} differences. What do these differences mean and should I be concerned?`)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', border:'none', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
              <Sparkles size={13}/> Ask AI
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: pad }}>

        {/* Upload area */}
        <div style={{ ...card, padding:isMobile?'16px':'24px', marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:L.text, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <GitCompare size={15} color={ACCENT}/> Upload Documents to Compare
          </div>

          <div style={{ display:'flex', gap:16, flexDirection:isMobile?'column':'row', marginBottom:20 }}>
            <DropZone label="Document 1" file={file1} onFile={setFile1} onClear={() => setFile1(null)} isMobile={isMobile}/>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', color:L.textFaint, fontSize:isMobile?20:24, flexShrink:0 }}>VS</div>
            <DropZone label="Document 2" file={file2} onFile={setFile2} onClear={() => setFile2(null)} isMobile={isMobile}/>
          </div>

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:L.radiusSm, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', fontSize:12, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <AlertTriangle size={13}/>{error}
            </div>
          )}

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleCompare} disabled={!file1||!file2||comparing}
              style={{ flex:1, padding:'12px', borderRadius:L.radiusSm, background:!file1||!file2||comparing?L.textFaint:'linear-gradient(135deg,#0AB98A,#0EA5E9)', color:'#fff', border:'none', cursor:!file1||!file2||comparing?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:L.font, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:file1&&file2&&!comparing?'0 4px 14px rgba(10,185,138,0.3)':'none' }}>
              {comparing ? (
                <><span>AI is analyzing both documents...</span></>
              ) : (
                <><GitCompare size={14}/> Compare Documents</>
              )}
            </button>
            {compared && (
              <button onClick={reset}
                style={{ padding:'12px 18px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:13, fontFamily:L.font }}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {compared && doc1 && doc2 && (
          <>
            {/* Summary */}
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(3,1fr)', gap:isMobile?10:14, marginBottom:20 }}>
              {[
                { label:'Fields Compared', value:differences.length,                                    color:L.text  },
                { label:'Differences',     value:diffCount,                                              color:diffCount>0?'#F59E0B':ACCENT },
                { label:'Matches',         value:differences.length-diffCount,                          color:ACCENT  },
              ].map(c => (
                <div key={c.label} style={{ ...card, padding:isMobile?'12px 14px':'18px 20px' }}>
                  <div style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>{c.label}</div>
                  <div style={{ fontSize:isMobile?24:32, fontWeight:700, color:c.color, fontFamily:L.fontMono }}>{c.value}</div>
                </div>
              ))}
            </div>

            {/* Diff banner */}
            <div style={{ padding:'12px 16px', borderRadius:L.radiusSm, background:diffCount>0?'rgba(245,158,11,0.08)':L.accentSoft, border:`1px solid ${diffCount>0?'rgba(245,158,11,0.2)':L.accentBorder}`, marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
              {diffCount > 0 ? <AlertTriangle size={16} color="#F59E0B"/> : <CheckCircle size={16} color={ACCENT}/>}
              <div style={{ fontSize:13, fontWeight:600, color:diffCount>0?'#F59E0B':ACCENT }}>
                {diffCount > 0 ? `${diffCount} difference${diffCount!==1?'s':''} found between the two documents` : 'Documents match on all key fields'}
              </div>
            </div>

            {/* Comparison table */}
            <div style={{ ...card, overflow:'hidden' }}>
              <div style={{ padding:isMobile?'14px 16px':'16px 22px', borderBottom:`1px solid ${L.border}` }}>
                <div style={{ fontSize:14, fontWeight:700, color:L.text }}>Field Comparison</div>
                <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>{file1?.name} vs {file2?.name}</div>
              </div>

              {/* Header */}
              {!isMobile && (
                <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 1fr 120px', padding:'8px 20px', borderBottom:`1px solid ${L.border}`, background:L.pageBg }}>
                  {['FIELD','DOCUMENT 1','DOCUMENT 2','STATUS'].map(h => (
                    <div key={h} style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em' }}>{h}</div>
                  ))}
                </div>
              )}

              {isMobile ? (
                differences.map(d => {
                  const isDiff = String(d.val1) !== String(d.val2);
                  return (
                    <div key={d.label} style={{ padding:'12px 16px', borderBottom:`1px solid ${L.border}`, background:isDiff?'rgba(245,158,11,0.04)':'transparent' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:L.textMuted }}>{d.label}</div>
                        {isDiff ? (
                          <span style={{ fontSize:10, fontWeight:600, color:'#F59E0B', display:'flex', alignItems:'center', gap:3 }}><AlertTriangle size={10}/> Changed</span>
                        ) : (
                          <span style={{ fontSize:10, fontWeight:600, color:ACCENT, display:'flex', alignItems:'center', gap:3 }}><CheckCircle size={10}/> Match</span>
                        )}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        <div style={{ padding:'6px 8px', borderRadius:6, background:isDiff?'rgba(239,68,68,0.06)':L.pageBg }}>
                          <div style={{ fontSize:9, color:L.textFaint, marginBottom:2 }}>DOC 1</div>
                          <div style={{ fontSize:12, color:L.text, fontFamily:d.type==='number'?L.fontMono:'inherit' }}>
                            {d.type==='number'&&d.val1?fmt(d.val1):d.val1||'—'}
                          </div>
                        </div>
                        <div style={{ padding:'6px 8px', borderRadius:6, background:isDiff?'rgba(10,185,138,0.06)':L.pageBg }}>
                          <div style={{ fontSize:9, color:L.textFaint, marginBottom:2 }}>DOC 2</div>
                          <div style={{ fontSize:12, color:L.text, fontFamily:d.type==='number'?L.fontMono:'inherit' }}>
                            {d.type==='number'&&d.val2?fmt(d.val2):d.val2||'—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                differences.map(d => (
                  <DiffRow key={d.label} label={d.label} val1={d.val1} val2={d.val2} type={d.type}/>
                ))
              )}
            </div>
          </>
        )}

        {/* Empty state */}
        {!compared && !comparing && (
          <div style={{ ...card, padding:isMobile?'40px 20px':60, textAlign:'center' }}>
            <div style={{ width:60, height:60, borderRadius:16, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <GitCompare size={26} color={ACCENT}/>
            </div>
            <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:6 }}>Compare any two documents</div>
            <div style={{ fontSize:13, color:L.textMuted, marginBottom:20, maxWidth:400, margin:'0 auto 20px' }}>
              Upload two invoices, receipts, or contracts and AI will extract and compare all key fields — vendor, amount, date, category, and more.
            </div>
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:10, maxWidth:500, margin:'0 auto' }}>
              {[
                { emoji:'📄', label:'Invoice vs Invoice',  desc:'Spot billing discrepancies' },
                { emoji:'🧾', label:'Receipt vs Statement', desc:'Verify payment records'     },
                { emoji:'📋', label:'Contract vs Invoice',  desc:'Check terms vs charges'     },
              ].map(u => (
                <div key={u.label} style={{ padding:'14px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}` }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{u.emoji}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:L.text, marginBottom:4 }}>{u.label}</div>
                  <div style={{ fontSize:11, color:L.textMuted }}>{u.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}