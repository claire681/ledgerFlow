import React, { useState, useEffect } from 'react';
import {
  Search, Sparkles, FileText, AlertTriangle,
  CheckCircle, ArrowRight, Brain, RefreshCw,
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
      const res  = await fetch(`${BASE}/rag/embed-all`, {
        method: 'POST', headers: { Authorization:`Bearer ${getToken()}` },
      });
      const data = await res.json();
      setEmbedded(true);
      setError('');
    } catch (e) { setError('Could not index documents. Please try again.'); }
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
      if (data.results?.length === 0) setError('No matching documents found. Try different keywords.');
    } catch (e) { setError('Search failed. Please try again.'); }
    finally { setSearching(false); }
  };

  const loadDuplicates = async () => {
    try {
      const res  = await fetch(`${BASE}/rag/duplicates`, {
        headers: { Authorization:`Bearer ${getToken()}` },
      });
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
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Search all your documents using natural language</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={embedAll} disabled={embedding}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, cursor:embedding?'not-allowed':'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
            <RefreshCw size={13} style={{ animation: embedding?'spin 1s linear infinite':undefined }}/> 
            {embedding ? 'Indexing...' : embedded ? 'Re-index Docs' : 'Index Documents'}
          </button>
          <button onClick={() => askAndOpen('Search my documents and find any patterns or issues I should know about')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', border:'none', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
            <Sparkles size={13}/> Ask AI
          </button>
        </div>
      </div>

      <div style={{ padding: pad }}>

        {/* Info banner */}
        {!embedded && (
          <div style={{ padding:'14px 18px', borderRadius:L.radiusSm, background:'linear-gradient(135deg,rgba(10,185,138,0.08),rgba(14,165,233,0.08))', border:`1px solid ${L.accentBorder}`, marginBottom:20, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <Brain size={20} color={ACCENT}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:L.text }}>Index your documents first</div>
              <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Click "Index Documents" to enable AI-powered search across all your uploaded files</div>
            </div>
            <button onClick={embedAll} disabled={embedding}
              style={{ padding:'8px 16px', borderRadius:L.radiusSm, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font, flexShrink:0 }}>
              {embedding ? 'Indexing...' : 'Index Now'}
            </button>
          </div>
        )}

        {embedded && (
          <div style={{ padding:'10px 16px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:ACCENT, fontSize:13, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <CheckCircle size={14}/> Documents indexed successfully — smart search is ready
          </div>
        )}

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
            {/* Search box */}
            <div style={{ ...card, padding:isMobile?'16px':'24px', marginBottom:20 }}>
              <div style={{ display:'flex', gap:10, flexDirection:isMobile?'column':'row' }}>
                <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:L.radiusSm, background:L.pageBg, border:`2px solid ${L.border}` }}
                  onFocusCapture={e => e.currentTarget.style.borderColor=ACCENT}
                  onBlurCapture={e  => e.currentTarget.style.borderColor=L.border}>
                  <Search size={16} color={L.textMuted}/>
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Search in plain English — e.g. 'AWS invoices from March' or 'receipts over $500'"
                    style={{ flex:1, border:'none', outline:'none', fontSize:13, color:L.text, fontFamily:L.font, background:'transparent' }}
                  />
                </div>
                <button onClick={handleSearch} disabled={searching||!query.trim()}
                  style={{ padding:'12px 24px', borderRadius:L.radiusSm, background:searching||!query.trim()?L.textFaint:'linear-gradient(135deg,#0AB98A,#0EA5E9)', color:'#fff', border:'none', cursor:searching||!query.trim()?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:L.font, display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <Search size={14}/>{searching?'Searching...':'Search'}
                </button>
              </div>

              {/* Quick searches */}
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:11, color:L.textMuted, marginBottom:8 }}>Quick searches:</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {[
  'invoices',
  'paid',
  'overdue',
  'this month',
  'last month',
  '2026',
  'receipts',
  'over $500',
].map(q => (
                    <button key={q} onClick={() => { setQuery(q); }}
                      style={{ padding:'5px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:500, border:`1px solid ${L.border}`, background:'#fff', color:L.textSub, fontFamily:L.font }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor=ACCENT; e.currentTarget.style.color=ACCENT; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor=L.border; e.currentTarget.style.color=L.textSub; }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding:'10px 16px', borderRadius:L.radiusSm, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', fontSize:13, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <AlertTriangle size={14}/>{error}
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div style={{ ...card, overflow:'hidden' }}>
                <div style={{ padding:isMobile?'14px 16px':'16px 22px', borderBottom:`1px solid ${L.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:L.text }}>{results.length} results for "{query}"</div>
                  <button onClick={() => askAndOpen(`I searched for "${query}" in my documents. Help me analyze these results and what they mean for my finances.`)}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:ACCENT, cursor:'pointer', fontSize:11, fontFamily:L.font }}>
                    <Sparkles size={11}/> Analyze
                  </button>
                </div>
                {results.map((r, i) => {
                  const meta = r.metadata || {};
                  const similarity = Math.round((r.similarity || 0) * 100);
                  return (
                    <div key={i}
                      style={{ padding:isMobile?'14px 16px':'14px 22px', borderBottom:i<results.length-1?`1px solid ${L.border}`:'none', display:'flex', alignItems:'flex-start', gap:12 }}
                      onMouseEnter={e => e.currentTarget.style.background=L.pageBg}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <div style={{ width:36, height:36, borderRadius:10, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <FileText size={16} color={ACCENT}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:L.text, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {meta.filename || 'Document'}
                        </div>
                       <div style={{ fontSize:12, color:L.textMuted, marginBottom:6 }}>{r.content}</div>
<div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
  {meta.vendor && <span style={{ fontSize:10, color:L.textSub, background:L.pageBg, padding:'2px 8px', borderRadius:20, border:`1px solid ${L.border}` }}>📦 {meta.vendor}</span>}
  {meta.client_name && <span style={{ fontSize:10, color:'#0EA5E9', background:'rgba(14,165,233,0.08)', padding:'2px 8px', borderRadius:20, border:'1px solid rgba(14,165,233,0.2)' }}>👤 {meta.client_name}</span>}
  {meta.amount && <span style={{ fontSize:10, color:ACCENT, background:L.accentSoft, padding:'2px 8px', borderRadius:20, border:`1px solid ${L.accentBorder}` }}>💰 {fmt(meta.amount)}</span>}
  {meta.doc_date && <span style={{ fontSize:10, color:L.textSub, background:L.pageBg, padding:'2px 8px', borderRadius:20, border:`1px solid ${L.border}` }}>📅 {meta.doc_date}</span>}
  {meta.category && <span style={{ fontSize:10, color:'#8B5CF6', background:'rgba(139,92,246,0.08)', padding:'2px 8px', borderRadius:20, border:'1px solid rgba(139,92,246,0.2)' }}>🏷 {meta.category}</span>}
  {meta.doc_type && <span style={{ fontSize:10, color:L.textSub, background:L.pageBg, padding:'2px 8px', borderRadius:20, border:`1px solid ${L.border}` }}>📄 {meta.doc_type}</span>}
  {meta.payment_status && <span style={{ fontSize:10, color:meta.payment_status==='paid'?ACCENT:'#F59E0B', background:meta.payment_status==='paid'?L.accentSoft:'rgba(245,158,11,0.08)', padding:'2px 8px', borderRadius:20, border:`1px solid ${meta.payment_status==='paid'?L.accentBorder:'rgba(245,158,11,0.2)'}` }}>{meta.payment_status}</span>}
  <span style={{ fontSize:10, color:similarity>80?ACCENT:'#F59E0B', background:similarity>80?L.accentSoft:'rgba(245,158,11,0.08)', padding:'2px 8px', borderRadius:20, border:`1px solid ${similarity>80?L.accentBorder:'rgba(245,158,11,0.2)'}` }}>
    {similarity}% match
  </span>
</div>
                      </div>
                      <button onClick={() => askAndOpen(`Tell me more about this document: ${r.content}`)}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:11, fontFamily:L.font, flexShrink:0 }}>
                        <ArrowRight size={11}/>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {results.length === 0 && !searching && !error && (
              <div style={{ ...card, padding:isMobile?'40px 20px':60, textAlign:'center' }}>
                <div style={{ width:60, height:60, borderRadius:16, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <Brain size={26} color={ACCENT}/>
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:6 }}>AI-Powered Document Search</div>
                <div style={{ fontSize:13, color:L.textMuted, maxWidth:400, margin:'0 auto' }}>
                  Search across all your documents using natural language. Find invoices, receipts, and contracts instantly.
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
                <div style={{ fontSize:13, color:L.textMuted }}>Your documents look clean — no suspicious duplicates detected</div>
              </div>
            ) : (
              duplicates.map((d, i) => (
                <div key={i} style={{ padding:isMobile?'14px 16px':'16px 22px', borderBottom:i<duplicates.length-1?`1px solid ${L.border}`:'none', background:'rgba(245,158,11,0.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <AlertTriangle size={14} color="#F59E0B"/>
                    <span style={{ fontSize:13, fontWeight:600, color:'#F59E0B' }}>
                      {Math.round((d.similarity||0)*100)}% similar
                    </span>
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
                  <button onClick={() => askAndOpen(`I found two similar documents: "${d.doc1_content}" and "${d.doc2_content}". Are these duplicates and should I be concerned?`)}
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