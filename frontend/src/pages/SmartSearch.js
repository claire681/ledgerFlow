import React, { useState, useEffect, useRef } from 'react';
import {
  Search, FileText, AlertTriangle,
  CheckCircle, RefreshCw, ScanLine, X,
  ZoomIn, ZoomOut, RotateCw, Download,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';

const BASE     = 'https://api.getnovala.com/api/v1';
const ACCENT   = '#0AB98A';
const FONT     = "'Inter', -apple-system, sans-serif";
const getToken = () => localStorage.getItem('token') || localStorage.getItem('access_token') || '';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

const fmt = (n) => n ? '$' + Number(n).toLocaleString() : '—';

const PAY_STATUS_STYLE = {
  paid:           { color: '#0AB98A', bg: 'rgba(10,185,138,0.08)',  border: 'rgba(10,185,138,0.2)'  },
  due:            { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)'  },
  overdue:        { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
  partially_paid: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)'  },
};

// ── Spinner ───────────────────────────────────────────────────
function Spinner({ size, color }) {
  const s = size || 16;
  const c = color || ACCENT;
  const [deg, setDeg] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDeg(function(d) { return d + 8; }), 16);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ width: s, height: s, border: '2px solid ' + c + '30', borderTop: '2px solid ' + c, borderRadius: '50%', transform: 'rotate(' + deg + 'deg)', flexShrink: 0 }} />
  );
}

// ── Document viewer modal (same fix as Documents.js) ──────────
function DocViewerModal({ doc, onClose }) {
  const [url,     setUrl]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [zoom,    setZoom]    = useState(1);
  const [rotate,  setRotate]  = useState(0);

  const filename = doc.filename || doc.file_name || doc.metadata?.filename || '';
  const rawExt   = (doc.file_type || doc.metadata?.file_type || (filename.includes('.') ? filename.split('.').pop() : '') || '').toLowerCase().replace('.', '');
  const isImage  = ['png','jpg','jpeg','webp','gif','tiff'].includes(rawExt);
  const isPDF    = rawExt === 'pdf';
  const docId    = doc.id || doc.document_id;

  useEffect(() => {
    let objectUrl = null;

    const tryLoad = async () => {
      setLoading(true);
      setError('');

      const endpoints = [
        BASE + '/documents/' + docId + '/view',
        BASE + '/documents/' + docId + '/download',
        BASE + '/documents/' + docId + '/file',
      ];

      for (var i = 0; i < endpoints.length; i++) {
        try {
          const res = await fetch(endpoints[i], {
            headers: { Authorization: 'Bearer ' + getToken() },
          });
          if (!res.ok) continue;

          const contentType = res.headers.get('content-type') || '';

          if (contentType.includes('application/json')) {
            const data = await res.json();
            const signed = data.url || data.file_url || data.download_url || data.signed_url;
            if (signed) {
              setUrl(signed);
              setLoading(false);
              return;
            }
            continue;
          }

          const blob = await res.blob();
          if (blob.size === 0) continue;
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
          setLoading(false);
          return;
        } catch (e) {
          continue;
        }
      }

      setError('Preview not available. Use the download button to open the file.');
      setLoading(false);
    };

    tryLoad();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [docId]);

  const handleDownload = async () => {
    try {
      const res = await fetch(BASE + '/documents/' + docId + '/download', {
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      if (!res.ok) throw new Error('failed');
      const blob    = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a       = document.createElement('a');
      a.href     = blobUrl;
      a.download = filename || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
      if (url) window.open(url, '_blank');
    }
  };

  return (
    <div
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', flexDirection: 'column', backdropFilter: 'blur(8px)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {filename || 'Document'}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
          {isImage && url && !error && (
            <>
              <button onClick={() => setZoom(function(z) { return Math.min(z + 0.25, 4); })} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#F1F5F9', display: 'flex' }}><ZoomIn size={16}/></button>
              <button onClick={() => setZoom(function(z) { return Math.max(z - 0.25, 0.25); })} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#F1F5F9', display: 'flex' }}><ZoomOut size={16}/></button>
              <button onClick={() => setRotate(function(r) { return r + 90; })} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#F1F5F9', display: 'flex' }}><RotateCw size={16}/></button>
            </>
          )}
          <button
            onClick={handleDownload}
            style={{ background: 'rgba(10,185,138,0.2)', border: '1px solid rgba(10,185,138,0.4)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: '#0AB98A', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT }}
          >
            <Download size={14}/> Download
          </button>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#F1F5F9', display: 'flex' }}>
            <X size={18}/>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 0 }}>
        {loading && (
          <div style={{ textAlign: 'center', color: '#94A3B8' }}>
            <Spinner size={32} color={ACCENT} />
            <div style={{ fontSize: 14, marginTop: 16 }}>Loading document...</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#F1F5F9' }}>{filename}</div>
            <div style={{ fontSize: 13, marginBottom: 24, color: '#94A3B8' }}>{error}</div>
            <button
              onClick={handleDownload}
              style={{ padding: '12px 28px', borderRadius: 10, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: FONT }}
            >
              Download File
            </button>
          </div>
        )}

        {!loading && !error && url && (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isImage && (
              <img
                src={url}
                alt={filename}
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', transform: 'scale(' + zoom + ') rotate(' + rotate + 'deg)', transition: 'transform 0.2s ease', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
              />
            )}
            {isPDF && (
              <iframe
                src={url + '#toolbar=1&navpanes=0&scrollbar=1'}
                title={filename}
                style={{ width: '100%', height: '78vh', border: 'none', borderRadius: 8, background: '#fff' }}
              />
            )}
            {!isImage && !isPDF && (
              <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📄</div>
                <div style={{ fontSize: 15, marginBottom: 8, color: '#F1F5F9' }}>{filename}</div>
                <div style={{ fontSize: 13, marginBottom: 24 }}>Preview not available for this file type</div>
                <button
                  onClick={handleDownload}
                  style={{ padding: '12px 28px', borderRadius: 10, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: FONT }}
                >
                  Download to View
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer metadata */}
      {(doc.metadata?.vendor || doc.metadata?.amount || doc.metadata?.doc_date) && (
        <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 24, flexWrap: 'wrap', flexShrink: 0 }}>
          {doc.metadata?.vendor   && <div style={{ fontSize: 12, color: '#64748B' }}>Vendor: <strong style={{ color: '#F1F5F9' }}>{doc.metadata.vendor}</strong></div>}
          {doc.metadata?.amount   && <div style={{ fontSize: 12, color: '#64748B' }}>Amount: <strong style={{ color: ACCENT }}>{fmt(doc.metadata.amount)}</strong></div>}
          {doc.metadata?.doc_date && <div style={{ fontSize: 12, color: '#64748B' }}>Date: <strong style={{ color: '#F1F5F9' }}>{doc.metadata.doc_date}</strong></div>}
          {doc.metadata?.payment_status && <div style={{ fontSize: 12, color: '#64748B' }}>Status: <strong style={{ color: '#F1F5F9' }}>{doc.metadata.payment_status}</strong></div>}
        </div>
      )}
    </div>
  );
}

// ── Client-side filter ────────────────────────────────────────
function clientFilter(hits, q) {
  const ql = q.toLowerCase().trim();

  if (ql === 'overdue' || ql.includes('overdue')) {
    return hits.filter(function(r) {
      const ps = (r.metadata?.payment_status || r.payment_status || '').toLowerCase();
      return ps === 'overdue';
    });
  }
  if (ql === 'unpaid' || ql.includes('unpaid')) {
    return hits.filter(function(r) {
      const ps = (r.metadata?.payment_status || r.payment_status || '').toLowerCase();
      return ps === 'due' || ps === 'overdue' || ps === 'partially_paid';
    });
  }
  if (ql === 'paid' || ql === 'all paid') {
    return hits.filter(function(r) {
      const ps = (r.metadata?.payment_status || r.payment_status || '').toLowerCase();
      return ps === 'paid';
    });
  }
  if (ql === 'invoices' || ql === 'invoice') {
    return hits.filter(function(r) {
      const dt = (r.metadata?.doc_type || r.doc_type || '').toLowerCase();
      const fn = (r.metadata?.filename  || r.filename  || '').toLowerCase();
      return dt.includes('invoice') || fn.includes('invoice');
    });
  }
  if (ql === 'receipts' || ql === 'receipt') {
    return hits.filter(function(r) {
      const dt = (r.metadata?.doc_type || r.doc_type || '').toLowerCase();
      const fn = (r.metadata?.filename  || r.filename  || '').toLowerCase();
      return dt.includes('receipt') || fn.includes('receipt');
    });
  }
  if (ql === 'bank statement' || ql === 'bank statements') {
    return hits.filter(function(r) {
      const dt = (r.metadata?.doc_type || r.doc_type || '').toLowerCase();
      const fn = (r.metadata?.filename  || r.filename  || '').toLowerCase();
      return dt.includes('bank') || fn.includes('bank');
    });
  }
  const overMatch  = ql.match(/over\s*\$?(\d+)/);
  const underMatch = ql.match(/under\s*\$?(\d+)/);
  if (overMatch)  return hits.filter(function(r) { return Number(r.metadata?.amount || r.amount || 0) > Number(overMatch[1]); });
  if (underMatch) return hits.filter(function(r) { return Number(r.metadata?.amount || r.amount || 0) < Number(underMatch[1]); });

  return hits;
}

// ── Fallback direct document search ──────────────────────────
async function fallbackSearch(q) {
  try {
    const res  = await fetch(BASE + '/documents/', { headers: { Authorization: 'Bearer ' + getToken() } });
    if (!res.ok) return [];
    const list = await res.json();
    const docs = Array.isArray(list) ? list : [];
    const ql   = q.toLowerCase().trim();

    return docs.filter(function(doc) {
      const ps  = (doc.payment_status || '').toLowerCase();
      const dt  = (doc.doc_type       || '').toLowerCase();
      const fn  = (doc.filename       || '').toLowerCase();
      const vn  = (doc.vendor         || '').toLowerCase();
      const amt = Number(doc.total_amount || 0);

      if (ql === 'overdue')                                   return ps === 'overdue';
      if (ql === 'unpaid')                                    return ps === 'due' || ps === 'overdue' || ps === 'partially_paid';
      if (ql === 'paid')                                      return ps === 'paid';
      if (ql === 'invoices' || ql === 'invoice')             return dt.includes('invoice') || fn.includes('invoice');
      if (ql === 'receipts' || ql === 'receipt')             return dt.includes('receipt') || fn.includes('receipt');
      if (ql === 'bank statement' || ql === 'bank statements') return dt.includes('bank') || fn.includes('bank');

      const overMatch  = ql.match(/over\s*\$?(\d+)/);
      const underMatch = ql.match(/under\s*\$?(\d+)/);
      if (overMatch)  return amt > Number(overMatch[1]);
      if (underMatch) return amt < Number(underMatch[1]);

      return fn.includes(ql) || vn.includes(ql) ||
        (doc.client_name   || '').toLowerCase().includes(ql) ||
        (doc.suggested_cat || '').toLowerCase().includes(ql);

    }).map(function(doc) {
      return {
        document_id: doc.id,
        id:          doc.id,
        metadata: {
          filename:       doc.filename,
          vendor:         doc.vendor,
          client_name:    doc.client_name,
          amount:         doc.total_amount,
          doc_date:       doc.doc_date,
          doc_type:       doc.doc_type,
          payment_status: doc.payment_status,
          category:       doc.suggested_cat,
          file_type:      doc.file_type,
        },
      };
    });
  } catch (e) {
    return [];
  }
}

export default function SmartSearch() {
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [embedding,  setEmbedding]  = useState(false);
  const [embedded,   setEmbedded]   = useState(false);
  const [error,      setError]      = useState('');
  const [tab,        setTab]        = useState('search');
  const [searched,   setSearched]   = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const isMobile = useIsMobile();

  useEffect(function() { loadDuplicates(); }, []);

  const embedAll = async function() {
    setEmbedding(true); setError('');
    try {
      await fetch(BASE + '/rag/embed-all', {
        method:  'POST',
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      setEmbedded(true);
    } catch (e) { setError('Could not index documents.'); }
    setEmbedding(false);
  };

  const handleSearch = async function() {
    const q = query.trim();
    if (!q) return;
    setSearching(true); setError(''); setResults([]); setSearched(false);

    try {
      let hits = [];
      try {
        const res = await fetch(BASE + '/rag/search', {
          method:  'POST',
          headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' },
          body:    JSON.stringify({ query: q, limit: 20 }),
        });
        if (res.ok) {
          const data = await res.json();
          hits = data.results || [];
        }
      } catch (e) {}

      let filtered = clientFilter(hits, q);

      if (filtered.length === 0) {
        filtered = await fallbackSearch(q);
      }

      setResults(filtered);
      setSearched(true);

      if (filtered.length === 0) {
        setError('No documents found for "' + q + '". Try uploading and indexing your documents first.');
      }
    } catch (e) {
      setError('Search failed. Please try again.');
    }

    setSearching(false);
  };

  const loadDuplicates = async function() {
    try {
      const res  = await fetch(BASE + '/rag/duplicates', { headers: { Authorization: 'Bearer ' + getToken() } });
      const data = await res.json();
      setDuplicates(data.duplicates || []);
    } catch (e) {}
  };

  const pad = isMobile ? '12px' : '24px 28px';

  const quickSearches = [
    { label: 'Overdue',    q: 'overdue'    },
    { label: 'Paid',       q: 'paid'       },
    { label: 'Unpaid',     q: 'unpaid'     },
    { label: 'This month', q: 'this month' },
    { label: 'Last month', q: 'last month' },
    { label: 'Invoices',   q: 'invoices'   },
    { label: 'Receipts',   q: 'receipts'   },
    { label: 'Over $500',  q: 'over $500'  },
  ];

  return (
    <div style={page}>

      {viewingDoc && (
        <DocViewerModal
          doc={viewingDoc}
          onClose={function() { setViewingDoc(null); }}
        />
      )}

      <div style={Object.assign({}, topBar, { flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 0 })}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: L.text, letterSpacing: '-0.02em' }}>Smart Search</div>
          <div style={{ fontSize: 12, color: L.textMuted, marginTop: 2 }}>Search your documents by vendor, amount, date, or payment status</div>
        </div>
        <button
          onClick={embedAll}
          disabled={embedding}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: L.radiusSm, background: L.accentSoft, border: '1px solid ' + L.accentBorder, color: L.accent, cursor: embedding ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, fontFamily: FONT, marginLeft: isMobile ? 0 : 'auto' }}
        >
          <RefreshCw size={13}/>{embedding ? 'Indexing...' : embedded ? 'Re-index Docs' : 'Index Documents'}
        </button>
      </div>

      <div style={{ padding: pad }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: L.pageBg, borderRadius: L.radius, padding: 4, border: '1px solid ' + L.border, width: 'fit-content' }}>
          {[
            { id: 'search',     label: 'Search Documents' },
            { id: 'duplicates', label: 'Duplicates' + (duplicates.length > 0 ? ' (' + duplicates.length + ')' : '') },
          ].map(function(t) {
            return (
              <button
                key={t.id}
                onClick={function() { setTab(t.id); }}
                style={{ padding: '8px 20px', borderRadius: L.radiusSm, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', border: 'none', background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? L.text : L.textMuted, boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', whiteSpace: 'nowrap' }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Search tab */}
        {tab === 'search' && (
          <div>
            <div style={Object.assign({}, card, { padding: isMobile ? '16px' : '24px', marginBottom: 20 })}>
              <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: L.radiusSm, background: L.pageBg, border: '2px solid ' + L.border, transition: 'border-color 0.2s' }}>
                  <Search size={16} color={L.textMuted}/>
                  <input
                    value={query}
                    onChange={function(e) { setQuery(e.target.value); if (searched) { setResults([]); setSearched(false); setError(''); } }}
                    onKeyDown={function(e) { if (e.key === 'Enter') handleSearch(); }}
                    placeholder="Search by vendor, amount, date, status..."
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: L.text, fontFamily: FONT, background: 'transparent' }}
                  />
                  {query && (
                    <button
                      onClick={function() { setQuery(''); setResults([]); setError(''); setSearched(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: L.textMuted, fontSize: 18, lineHeight: 1, display: 'flex' }}
                    >
                      <X size={16}/>
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching || !query.trim()}
                  style={{ padding: '12px 24px', borderRadius: L.radiusSm, background: (searching || !query.trim()) ? L.textFaint : ACCENT, color: '#fff', border: 'none', cursor: (searching || !query.trim()) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
                >
                  <Search size={14}/>{searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Quick searches */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: L.textMuted, marginBottom: 8 }}>Quick searches:</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {quickSearches.map(function(item) {
                    return (
                      <button
                        key={item.q}
                        onClick={function() { setQuery(item.q); setResults([]); setSearched(false); setError(''); }}
                        style={{ padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 500, border: '1px solid ' + L.border, background: '#fff', color: L.textSub, fontFamily: FONT, transition: 'all 0.15s' }}
                        onMouseEnter={function(e) { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; e.currentTarget.style.background = 'rgba(10,185,138,0.04)'; }}
                        onMouseLeave={function(e) { e.currentTarget.style.borderColor = L.border; e.currentTarget.style.color = L.textSub; e.currentTarget.style.background = '#fff'; }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 16px', borderRadius: L.radiusSm, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14}/>{error}
              </div>
            )}

            {results.length > 0 && (
              <div style={Object.assign({}, card, { overflow: 'hidden' })}>
                <div style={{ padding: isMobile ? '14px 16px' : '16px 22px', borderBottom: '1px solid ' + L.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: L.text }}>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</div>
                </div>

                {results.map(function(r, i) {
                  const meta   = r.metadata || {};
                  const payKey = (meta.payment_status || '').toLowerCase();
                  const paySt  = PAY_STATUS_STYLE[payKey];

                  return (
                    <div
                      key={i}
                      style={{ padding: isMobile ? '14px 16px' : '14px 22px', borderBottom: i < results.length - 1 ? '1px solid ' + L.border : 'none', display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'background 0.1s' }}
                      onMouseEnter={function(e) { e.currentTarget.style.background = L.pageBg; }}
                      onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: L.accentSoft, border: '1px solid ' + L.accentBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} color={ACCENT}/>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: L.text, marginBottom: 6 }}>{meta.filename || 'Document'}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {meta.vendor      && <span style={{ fontSize: 10, color: L.textSub, background: L.pageBg, padding: '2px 8px', borderRadius: 20, border: '1px solid ' + L.border }}>📦 {meta.vendor}</span>}
                          {meta.client_name && <span style={{ fontSize: 10, color: '#0EA5E9', background: 'rgba(14,165,233,0.08)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(14,165,233,0.2)' }}>👤 {meta.client_name}</span>}
                          {meta.amount      && <span style={{ fontSize: 10, color: ACCENT, background: L.accentSoft, padding: '2px 8px', borderRadius: 20, border: '1px solid ' + L.accentBorder }}>💰 {fmt(meta.amount)}</span>}
                          {meta.doc_date    && <span style={{ fontSize: 10, color: L.textSub, background: L.pageBg, padding: '2px 8px', borderRadius: 20, border: '1px solid ' + L.border }}>📅 {meta.doc_date}</span>}
                          {meta.doc_type    && <span style={{ fontSize: 10, color: L.textSub, background: L.pageBg, padding: '2px 8px', borderRadius: 20, border: '1px solid ' + L.border }}>📄 {(meta.doc_type || '').replace(/_/g, ' ')}</span>}
                          {paySt && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: paySt.color, background: paySt.bg, padding: '2px 10px', borderRadius: 20, border: '1px solid ' + paySt.border }}>
                              {payKey.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* View button only — no Ask button */}
                      <button
                        onClick={function() { setViewingDoc(r); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: L.radiusSm, background: L.accentSoft, border: '1px solid ' + L.accentBorder, color: ACCENT, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: FONT, flexShrink: 0 }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(10,185,138,0.15)'; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = L.accentSoft; }}
                      >
                        <FileText size={11}/> View
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {!searching && !error && !searched && (
              <div style={Object.assign({}, card, { padding: isMobile ? '40px 20px' : 60, textAlign: 'center' })}>
                <div style={{ width: 60, height: 60, borderRadius: 16, background: L.accentSoft, border: '1px solid ' + L.accentBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <ScanLine size={26} color={ACCENT}/>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: L.text, marginBottom: 6 }}>Search Your Documents</div>
                <div style={{ fontSize: 13, color: L.textMuted, maxWidth: 400, margin: '0 auto', lineHeight: 1.65 }}>
                  Search by vendor name, date, amount, or payment status. Try "overdue", "paid", or "invoices".
                </div>
              </div>
            )}
          </div>
        )}

        {/* Duplicates tab */}
        {tab === 'duplicates' && (
          <div style={Object.assign({}, card, { overflow: 'hidden' })}>
            <div style={{ padding: isMobile ? '14px 16px' : '16px 22px', borderBottom: '1px solid ' + L.border }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: L.text }}>Potential Duplicate Documents</div>
              <div style={{ fontSize: 12, color: L.textMuted, marginTop: 2 }}>Documents that look similar — you may have been charged twice</div>
            </div>

            {duplicates.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <CheckCircle size={40} color={ACCENT} style={{ marginBottom: 12 }}/>
                <div style={{ fontSize: 15, fontWeight: 600, color: L.text, marginBottom: 6 }}>No duplicates found</div>
                <div style={{ fontSize: 13, color: L.textMuted }}>Your documents look clean</div>
              </div>
            ) : (
              duplicates.map(function(d, i) {
                return (
                  <div
                    key={i}
                    style={{ padding: isMobile ? '14px 16px' : '16px 22px', borderBottom: i < duplicates.length - 1 ? '1px solid ' + L.border : 'none', background: 'rgba(245,158,11,0.04)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <AlertTriangle size={14} color="#F59E0B"/>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>{Math.round((d.similarity || 0) * 100)}% similar</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                      <div style={{ padding: '10px 12px', borderRadius: L.radiusSm, background: '#fff', border: '1px solid ' + L.border }}>
                        <div style={{ fontSize: 10, color: L.textFaint, marginBottom: 4 }}>DOCUMENT 1</div>
                        <div style={{ fontSize: 12, color: L.text }}>{d.doc1_content}</div>
                      </div>
                      <div style={{ padding: '10px 12px', borderRadius: L.radiusSm, background: '#fff', border: '1px solid ' + L.border }}>
                        <div style={{ fontSize: 10, color: L.textFaint, marginBottom: 4 }}>DOCUMENT 2</div>
                        <div style={{ fontSize: 12, color: L.text }}>{d.doc2_content}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}