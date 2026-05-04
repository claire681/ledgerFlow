import React, { useState, useEffect } from 'react';
import {
  Search, Sparkles, FileText, AlertTriangle,
  CheckCircle, Brain, RefreshCw,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';
import { useAI } from '../hooks/useAI';

const BASE     = 'https://api.getnovala.com/api/v1';
const ACCENT   = '#0AB98A';
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

const fmt = (n) => n ? `$${Number(n).toLocaleString()}` : '—';

export default function SmartSearch() {
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [embedding,  setEmbedding]  = useState(false);
  const [embedded,   setEmbedded]   = useState(false);
  const [error,      setError]      = useState('');
  const [tab,        setTab]        = useState('search');

  const { setPageContext, askAndOpen } = useAI();
  const isMobile = useIsMobile();

  useEffect(() => {
    setPageContext('search', { page:'search' });
    loadDuplicates();
  }, []);

  const embedAll = async () => {
    setEmbedding(true); setError('');
    try {
      await fetch(`${BASE}/rag/embed-all`, {
        method: 'POST', headers: { Authorization:`Bearer ${getToken()}` },
      });
      setEmbedded(true);
    } catch (e) { setError('Could not index documents.'); }
    finally { setEmbedding(false); }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setError(''); setResults([]);
    try {
      const res  = await fetch(`${BASE}/rag/search`, {
        method:  'POST',
        headers: { Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body:    JSON.stringify({ query: query.trim(), limit: 8 }),
      });
      const data = await res.json();
      setResults(data.results || []);
      if (!data.results?.length) setError('No matching documents found.');
    } catch (e) { setError('Search failed. Please try again.'); }
    finally { setSearching(false); }
  };

  const loadDuplicates = async () => {
    try {
      const res  = await fetch(`${BASE}/rag/duplicates`, { headers: { Authorization:`Bearer ${getToken()}` } });
      const data = await res.json();
      setDuplicates(data.duplicates || []);
    } catch (e) {}
  };

  const pad = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>
      <div style={{ ...topBar, flexDirection:isMobile?'column':'row', alignItems:isMobile?'flex-start':'center', gap:isMobile?10:0, padding:isMobile?'16px':undefined }}>
        <div>
          <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Smart Search</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Search documents or ask AI questions about your finances</div>
        </div>
        <button onClick={embedAll} disabled={embedding}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:embedding?'not-allowed':'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
          <RefreshCw size={13}/>{embedding ? 'Indexing...' : embedded ? 'Re-index Docs' : 'Index Documents'}
        </button>
      </div>

      <div style={{ padding: pad }}>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, marginBottom:20, background:L.pageBg, borderRadius:L.radius, padding:4, border:`1px solid ${L.border}`, width:'fit-content' }}>
          {[
            { id:'search',     label:'Search Documents' },
            { id:'duplicates', label:`Duplicates${duplicates.length>0?` (${duplicates.length})`:''}`},
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:'8px 20px', borderRadius:L.radiusSm, fontSize:13, fontWeight:600, fontFamily:L.font, cursor:'pointer', border:'none', background:tab===t.id?'#fff':'transparent', color:tab===t.id?L.text:L.textMuted, boxShadow:tab===t.id?'0 1px 4px rgba(0,0,0,0.08)':'none', whiteSpace:'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search tab */}
        {tab === 'search' && (
          <>
            <div style={{ ...card, padding:isMobile?'16px':'24px', marginBottom:20 }}>
              <div style={{ display:'flex', gap:10, flexDirection:isMobile?'column':'row' }}>
                <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:L.radiusSm, background:L.pageBg, border:`2px solid ${L.border}` }}>
                  <Search size={16} color={L.textMuted}/>
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by vendor, date, amount, status..."
                    style={{ flex:1, border:'none', outline:'none', fontSize:13, color:L.text, fontFamily:L.font, background:'transparent' }}
                  />
                </div>
                <button onClick={handleSearch} disabled={searching||!query.trim()}
                  style={{ padding:'12px 24px', borderRadius:L.radiusSm, background:searching||!query.trim()?L.textFaint:'linear-gradient(135deg,#0AB98A,#0EA5E9)', color:'#fff', border:'none', cursor:searching||!query.trim()?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:L.font, display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <Search size={14}/>{searching?'Searching...':'Search'}
                </button>
              </div>

              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:11, color:L.textMuted, marginBottom:8 }}>Quick searches:</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['invoices','paid','overdue','this month','last month','2026','receipts','over $500'].map(q => (
                    <button key={q} onClick={() => setQuery(q)}
                      style={{ padding:'5px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:500, border:`1px solid ${L.border}`, background:'#fff', color:L.textSub, fontFamily:L.font }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor=ACCENT; e.currentTarget.style.color=ACCENT; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor=L.border; e.currentTarget.style.color=L.textSub; }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div style={{ padding:'10px 16px', borderRadius:L.radiusSm, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', fontSize:13, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <AlertTriangle size={14}/>{error}
              </div>
            )}

            {results.length > 0 && (
              <div style={{ ...card, overflow:'hidden' }}>
                <div style={{ padding:isMobile?'14px 16px':'16px 22px', borderBottom:`1px solid ${L.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:L.text }}>{results.length} results for "{query}"</div>
                </div>
                {results.map((r, i) => {
                  const meta = r.metadata || {};
                  return (
                    <div key={i} style={{ padding:isMobile?'14px 16px':'14px 22px', borderBottom:i<results.length-1?`1px solid ${L.border}`:'none', display:'flex', alignItems:'flex-start', gap:12 }}
                      onMouseEnter={e => e.currentTarget.style.background=L.pageBg}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <div style={{ width:36, height:36, borderRadius:10, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <FileText size={16} color={ACCENT}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:L.text, marginBottom:4 }}>{meta.filename || 'Document'}</div>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {meta.vendor        && <span style={{ fontSize:10, color:L.textSub, background:L.pageBg, padding:'2px 8px', borderRadius:20, border:`1px solid ${L.border}` }}>📦 {meta.vendor}</span>}
                          {meta.client_name   && <span style={{ fontSize:10, color:'#0EA5E9', background:'rgba(14,165,233,0.08)', padding:'2px 8px', borderRadius:20, border:'1px solid rgba(14,165,233,0.2)' }}>👤 {meta.client_name}</span>}
                          {meta.amount        && <span style={{ fontSize:10, color:ACCENT, background:L.accentSoft, padding:'2px 8px', borderRadius:20, border:`1px solid ${L.accentBorder}` }}>💰 {fmt(meta.amount)}</span>}
                          {meta.doc_date      && <span style={{ fontSize:10, color:L.textSub, background:L.pageBg, padding:'2px 8px', borderRadius:20, border:`1px solid ${L.border}` }}>📅 {meta.doc_date}</span>}
                          {meta.category      && <span style={{ fontSize:10, color:'#8B5CF6', background:'rgba(139,92,246,0.08)', padding:'2px 8px', borderRadius:20, border:'1px solid rgba(139,92,246,0.2)' }}>🏷 {meta.category}</span>}
                          {meta.doc_type      && <span style={{ fontSize:10, color:L.textSub, background:L.pageBg, padding:'2px 8px', borderRadius:20, border:`1px solid ${L.border}` }}>📄 {meta.doc_type}</span>}
                          {meta.payment_status && <span style={{ fontSize:10, color:meta.payment_status==='paid'?ACCENT:'#F59E0B', background:meta.payment_status==='paid'?L.accentSoft:'rgba(245,158,11,0.08)', padding:'2px 8px', borderRadius:20, border:`1px solid ${meta.payment_status==='paid'?L.accentBorder:'rgba(245,158,11,0.2)'}` }}>{meta.payment_status}</span>}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <button onClick={async () => {
                          try {
                            const res  = await fetch(`${BASE}/documents/${r.document_id}/view-url`, { headers:{ Authorization:`Bearer ${getToken()}` } });
                            const data = await res.json();
                            if (data.url) window.open(data.url, '_blank');
                            else alert('Could not load document.');
                          } catch (e) { alert('Could not load document.'); }
                        }}
                          style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:ACCENT, cursor:'pointer', fontSize:11, fontFamily:L.font }}>
                          <FileText size={11}/> View
                        </button>
                        <button onClick={() => askAndOpen(`Tell me about this document: ${meta.filename} — vendor: ${meta.vendor}, amount: ${meta.amount}, date: ${meta.doc_date}`)}
                          style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11, fontFamily:L.font }}>
                          <Sparkles size={11}/> Ask AI
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {results.length === 0 && !searching && !error && (
              <div style={{ ...card, padding:isMobile?'40px 20px':60, textAlign:'center' }}>
                <div style={{ width:60, height:60, borderRadius:16, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <Brain size={26} color={ACCENT}/>
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:6 }}>Search Your Documents</div>
                <div style={{ fontSize:13, color:L.textMuted, maxWidth:400, margin:'0 auto' }}>
                  Search by vendor name, date, amount, or payment status. Click the AI button to ask questions about any document.
                </div>
              </div>
            )}
          </>
        )}

        {/* Duplicates tab */}
        {tab === 'duplicates' && (
          <div style={{ ...card, overflow:'hidden' }}>
            <div style={{ padding:isMobile?'14px 16px':'16px 22px', borderBottom:`1px solid ${L.border}` }}>
              <div style={{ fontSize:14, fontWeight:700, color:L.text }}>Potential Duplicate Documents</div>
              <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Documents that look similar — you may have been charged twice</div>
            </div>
            {duplicates.length === 0 ? (
              <div style={{ padding:60, textAlign:'center' }}>
                <CheckCircle size={40} color={ACCENT} style={{ marginBottom:12 }}/>
                <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:6 }}>No duplicates found</div>
                <div style={{ fontSize:13, color:L.textMuted }}>Your documents look clean</div>
              </div>
            ) : (
              duplicates.map((d, i) => (
                <div key={i} style={{ padding:isMobile?'14px 16px':'16px 22px', borderBottom:i<duplicates.length-1?`1px solid ${L.border}`:'none', background:'rgba(245,158,11,0.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <AlertTriangle size={14} color="#F59E0B"/>
                    <span style={{ fontSize:13, fontWeight:600, color:'#F59E0B' }}>{Math.round((d.similarity||0)*100)}% similar</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div style={{ padding:'10px 12px', borderRadius:L.radiusSm, background:'#fff', border:`1px solid ${L.border}` }}>
                      <div style={{ fontSize:10, color:L.textFaint, marginBottom:4 }}>DOCUMENT 1</div>
                      <div style={{ fontSize:12, color:L.text }}>{d.doc1_content}</div>
                    </div>
                    <div style={{ padding:'10px 12px', borderRadius:L.radiusSm, background:'#fff', border:`1px solid ${L.border}` }}>
                      <div style={{ fontSize:10, color:L.textFaint, marginBottom:4 }}>DOCUMENT 2</div>
                      <div style={{ fontSize:12, color:L.text }}>{d.doc2_content}</div>
                    </div>
                  </div>
                  <button onClick={() => askAndOpen(`Are these two documents duplicates? "${d.doc1_content}" and "${d.doc2_content}"`)}
                    style={{ marginTop:10, display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:L.radiusSm, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', color:'#F59E0B', cursor:'pointer', fontSize:11, fontFamily:L.font }}>
                    <Sparkles size={11}/> Ask AI about this
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}