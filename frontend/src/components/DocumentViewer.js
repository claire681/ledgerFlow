import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

const BASE     = 'https://api.getnovala.com/api/v1';
const getToken = () => localStorage.getItem('token') || '';

export default function DocumentViewer({ doc, onClose }) {
  const [url,     setUrl]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [zoom,    setZoom]    = useState(1);
  const [rotate,  setRotate]  = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${BASE}/documents/${doc.id}/download`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error('Could not load file');
        const blob = await res.blob();
        setUrl(URL.createObjectURL(blob));
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    };
    load();
  }, [doc.id]);

  const isImage = ['png','jpg','jpeg','webp','gif'].includes(
    (doc.file_type || doc.filename?.split('.').pop() || '').toLowerCase()
  );
  const isPDF = (doc.file_type || doc.filename || '').toLowerCase().includes('pdf');

  const handleDownload = () => {
    if (!url) return;
    const a    = document.createElement('a');
    a.href     = url;
    a.download = doc.filename || 'document';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:2000, display:'flex', flexDirection:'column', backdropFilter:'blur(6px)' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'rgba(0,0,0,0.5)', borderBottom:'1px solid rgba(255,255,255,0.1)', flexShrink:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
          {doc.filename}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0, marginLeft:12 }}>
          {isImage && (
            <>
              <button onClick={() => setZoom(z => Math.min(z+0.25,3))}
                style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#F1F5F9', display:'flex' }}>
                <ZoomIn size={16}/>
              </button>
              <button onClick={() => setZoom(z => Math.max(z-0.25,0.25))}
                style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#F1F5F9', display:'flex' }}>
                <ZoomOut size={16}/>
              </button>
              <button onClick={() => setRotate(r => r+90)}
                style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#F1F5F9', display:'flex' }}>
                <RotateCw size={16}/>
              </button>
            </>
          )}
          <button onClick={handleDownload}
            style={{ background:'rgba(10,185,138,0.2)', border:'1px solid rgba(10,185,138,0.4)', borderRadius:8, padding:'6px 14px', cursor:'pointer', color:'#0AB98A', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
            <Download size={14}/> Download
          </button>
          <button onClick={onClose}
            style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#F1F5F9', display:'flex' }}>
            <X size={18}/>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        {loading && (
          <div style={{ color:'#94A3B8', fontSize:14 }}>Loading document...</div>
        )}
        {error && (
          <div style={{ color:'#EF4444', fontSize:14, textAlign:'center' }}>
            <div style={{ marginBottom:8 }}>⚠ {error}</div>
            <div style={{ fontSize:12, color:'#94A3B8' }}>The file may not be available for preview</div>
          </div>
        )}
        {!loading && !error && url && (
          <>
            {isImage && (
              <img src={url} alt={doc.filename}
                style={{ maxWidth:'100%', maxHeight:'80vh', objectFit:'contain', transform:`scale(${zoom}) rotate(${rotate}deg)`, transition:'transform 0.2s ease', borderRadius:8, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}/>
            )}
            {isPDF && (
              <iframe src={url} title={doc.filename}
                style={{ width:'100%', height:'80vh', border:'none', borderRadius:8 }}/>
            )}
            {!isImage && !isPDF && (
              <div style={{ textAlign:'center', color:'#94A3B8' }}>
                <div style={{ fontSize:64, marginBottom:16 }}>📄</div>
                <div style={{ fontSize:15, marginBottom:8, color:'#F1F5F9' }}>{doc.filename}</div>
                <div style={{ fontSize:13, marginBottom:24 }}>Preview not available for this file type</div>
                <button onClick={handleDownload}
                  style={{ padding:'10px 24px', borderRadius:8, background:'#0AB98A', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                  Download to View
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {(doc.vendor || doc.total_amount || doc.doc_date) && (
        <div style={{ padding:'12px 20px', background:'rgba(0,0,0,0.5)', borderTop:'1px solid rgba(255,255,255,0.1)', display:'flex', gap:20, flexWrap:'wrap', flexShrink:0 }}>
          {doc.vendor        && <div style={{ fontSize:12, color:'#94A3B8' }}>Vendor: <strong style={{ color:'#F1F5F9' }}>{doc.vendor}</strong></div>}
          {doc.total_amount  && <div style={{ fontSize:12, color:'#94A3B8' }}>Amount: <strong style={{ color:'#0AB98A' }}>${Number(doc.total_amount).toLocaleString()}</strong></div>}
          {doc.doc_date      && <div style={{ fontSize:12, color:'#94A3B8' }}>Date: <strong style={{ color:'#F1F5F9' }}>{doc.doc_date}</strong></div>}
          {doc.suggested_cat && <div style={{ fontSize:12, color:'#94A3B8' }}>Category: <strong style={{ color:'#F1F5F9' }}>{doc.suggested_cat}</strong></div>}
        </div>
      )}
    </div>
  );
}