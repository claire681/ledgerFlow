import React, { useState, useEffect } from 'react';
import {
  X, FileText, Download, AlertCircle,
  CheckCircle, Clock, User, Users, DollarSign,
  Calendar, Tag,
} from 'lucide-react';
import { L } from '../styles/light';

const BASE      = '/api/v1';
const getToken  = () => localStorage.getItem('token') || '';

// Processing status — AI extraction only
const PROC_STATUS = {
  processed: { color: '#0AB98A', bg: 'rgba(10,185,138,0.08)',  border: 'rgba(10,185,138,0.2)',  label: 'Processed', icon: CheckCircle },
  review:    { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  label: 'Review',    icon: AlertCircle },
  pending:   { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', label: 'Pending',   icon: Clock       },
  failed:    { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   label: 'Failed',    icon: AlertCircle },
};

// Payment status — actual money status
const PAY_STATUS = {
  paid:           { color: '#0AB98A', bg: 'rgba(10,185,138,0.08)',  border: 'rgba(10,185,138,0.2)',  label: 'Paid'    },
  due:            { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  label: 'Due'     },
  overdue:        { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   label: 'Overdue' },
  partially_paid: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', label: 'Partial' },
};

function MetaRow({ icon: Icon, label, value, color }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${L.border}` }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: L.pageBg, border: `1px solid ${L.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} color={color || L.textMuted} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: L.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: L.text, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  );
}

export default function DocumentViewer({ doc: initialDoc, onClose }) {
  const [doc,       setDoc]       = useState(initialDoc);
  const [blobUrl,   setBlobUrl]   = useState(null);
  const [fileType,  setFileType]  = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [marking,   setMarking]   = useState(false);
  const [markError, setMarkError] = useState('');

  // Keep doc in sync if parent passes new one
  useEffect(() => { setDoc(initialDoc); }, [initialDoc?.id]);

  useEffect(() => {
    let objectUrl = null;

    const fetchFile = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const res = await fetch(`${BASE}/documents/${doc.id}/view`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error(`Failed to load file (${res.status})`);
        const contentType = res.headers.get('content-type') || '';
        setFileType(contentType);
        const blob = await res.blob();
        objectUrl  = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (e) {
        setLoadError(e.message || 'Could not load file preview.');
      } finally {
        setLoading(false);
      }
    };

    if (doc?.has_file) {
      fetchFile();
    } else {
      setLoading(false);
    }

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [doc?.id]);

  const handleDownload = async () => {
    try {
      const res = await fetch(`${BASE}/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = doc.filename || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Download failed: ' + e.message);
    }
  };

  const handleMarkPaid = async () => {
    if (!window.confirm('Mark this document as paid?')) return;
    setMarking(true);
    setMarkError('');
    try {
      const res = await fetch(`${BASE}/documents/${doc.id}/mark-paid`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) { setMarkError(data?.detail || 'Failed to mark as paid.'); return; }
      setDoc(prev => ({ ...prev, payment_status: 'paid', paid_at: data.paid_at }));
    } catch (e) {
      setMarkError('Failed: ' + e.message);
    } finally {
      setMarking(false);
    }
  };

  const isImage = fileType && fileType.startsWith('image/');
  const isPDF   = fileType && fileType.includes('pdf');

  const ps  = PROC_STATUS[doc.status]         || PROC_STATUS.pending;
  const pay = PAY_STATUS[doc.payment_status]  || null;
  const PIcon = ps.icon;

  const isInvoice    = ['invoice_sent', 'invoice_received'].includes(doc.doc_type);
  const needsMarkPaid = isInvoice && ['due', 'overdue', 'partially_paid'].includes(doc.payment_status);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '92vw', maxWidth: 1100, height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.22)', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: `1px solid ${L.border}`, background: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(10,185,138,0.1)', border: '1px solid rgba(10,185,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} color="#0AB98A" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: L.text }}>{doc.filename}</div>
              <div style={{ fontSize: 11, color: L.textMuted, marginTop: 1 }}>
                {doc.file_type?.toUpperCase()} · {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleDownload}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: L.radiusSm, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', color: '#0AB98A', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: L.font }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(10,185,138,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(10,185,138,0.08)'}>
              <Download size={13} /> Download
            </button>
            <button onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, background: 'transparent', border: `1px solid ${L.border}`, cursor: 'pointer', color: L.textMuted }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = '#FCA5A5'; e.currentTarget.style.color = '#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = L.border; e.currentTarget.style.color = L.textMuted; }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── File Preview ── */}
          <div style={{ flex: 1, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            {loading && (
              <div style={{ textAlign: 'center', color: L.textMuted }}>
                <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTop: '3px solid #0AB98A', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 13 }}>Loading preview...</div>
              </div>
            )}

            {!loading && loadError && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <AlertCircle size={24} color="#EF4444" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: L.text, marginBottom: 6 }}>Preview unavailable</div>
                <div style={{ fontSize: 13, color: L.textMuted, marginBottom: 16 }}>{loadError}</div>
                <button onClick={handleDownload} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: L.radiusSm, background: '#0AB98A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <Download size={13} /> Download instead
                </button>
              </div>
            )}

            {!loading && !loadError && !doc.has_file && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <FileText size={48} color={L.textMuted} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: L.text, marginBottom: 6 }}>No file stored</div>
                <div style={{ fontSize: 13, color: L.textMuted }}>The original file is not available for preview.</div>
              </div>
            )}

            {!loading && !loadError && blobUrl && isPDF && (
              <iframe src={blobUrl} title={doc.filename} style={{ width: '100%', height: '100%', border: 'none' }} />
            )}

            {!loading && !loadError && blobUrl && isImage && (
              <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <img src={blobUrl} alt={doc.filename} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }} />
              </div>
            )}

            {!loading && !loadError && blobUrl && !isPDF && !isImage && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <FileText size={48} color={L.textMuted} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: L.text, marginBottom: 6 }}>Preview not supported</div>
                <div style={{ fontSize: 13, color: L.textMuted, marginBottom: 16 }}>This file type cannot be previewed in the browser.</div>
                <button onClick={handleDownload} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: L.radiusSm, background: '#0AB98A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <Download size={13} /> Download File
                </button>
              </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>

          {/* ── Extracted Data Panel ── */}
          <div style={{ width: 300, borderLeft: `1px solid ${L.border}`, overflowY: 'auto', background: '#fff', flexShrink: 0 }}>
            <div style={{ padding: '20px 20px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: L.text, marginBottom: 14, letterSpacing: '-0.01em' }}>
                Extracted Data
              </div>

              {/* ── Dual status badges ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>

                {/* Processing status */}
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: L.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                    Processing
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: ps.color, background: ps.bg, border: `1px solid ${ps.border}` }}>
                    <PIcon size={10} /> {ps.label}
                  </div>
                </div>

                {/* Payment status */}
                {pay && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: L.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                      Payment
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: pay.color, background: pay.bg, border: `1px solid ${pay.border}` }}>
                      <DollarSign size={10} /> {pay.label}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Mark as Paid button ── */}
              {needsMarkPaid && (
                <div style={{ marginBottom: 16 }}>
                  {markError && (
                    <div style={{ fontSize: 11, color: '#EF4444', marginBottom: 6 }}>{markError}</div>
                  )}
                  <button
                    onClick={handleMarkPaid}
                    disabled={marking}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 14px', borderRadius: L.radiusSm, background: marking ? L.pageBg : '#0AB98A', color: marking ? L.textMuted : '#fff', border: 'none', cursor: marking ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, fontFamily: L.font, transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (!marking) e.currentTarget.style.background = '#089e76'; }}
                    onMouseLeave={e => { if (!marking) e.currentTarget.style.background = '#0AB98A'; }}
                  >
                    <CheckCircle size={13} />
                    {marking ? 'Marking as paid...' : 'Mark as Paid'}
                  </button>
                </div>
              )}

              {/* ── Extracted fields ── */}
              <MetaRow icon={User}       label="Vendor"          value={doc.vendor}                                                                color="#8B5CF6" />
              <MetaRow icon={Users}      label="Client / Bill To" value={doc.client_name}                                                          color="#0EA5E9" />
              <MetaRow icon={DollarSign} label="Amount"          value={doc.total_amount ? `$${Number(doc.total_amount).toLocaleString()}` : null}  color="#0AB98A" />
              <MetaRow icon={Calendar}   label="Date"            value={doc.doc_date}                                                              color="#0EA5E9" />
              <MetaRow icon={Tag}        label="Category"        value={doc.suggested_cat}                                                         color="#F59E0B" />
              <MetaRow icon={FileText}   label="Type"            value={doc.doc_type || doc.file_type?.toUpperCase()}                              color="#94A3B8" />

              {doc.tax_amount > 0 && (
                <MetaRow icon={DollarSign} label="Tax Amount" value={`$${Number(doc.tax_amount).toLocaleString()}`} color="#EF4444" />
              )}

              {doc.paid_at && (
                <MetaRow icon={CheckCircle} label="Paid On" value={new Date(doc.paid_at).toLocaleDateString()} color="#0AB98A" />
              )}

              {/* AI Confidence */}
              {doc.confidence && (
                <div style={{ padding: '10px 0', borderBottom: `1px solid ${L.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: L.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>AI Confidence</div>
                  <div style={{ background: L.pageBg, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((doc.confidence || 0) * 100)}%`, height: '100%', background: doc.confidence >= 0.7 ? '#0AB98A' : '#F59E0B', borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 11, color: L.textMuted, marginTop: 4 }}>{Math.round((doc.confidence || 0) * 100)}% confident</div>
                </div>
              )}

              {/* Notes */}
              {doc.notes && (
                <div style={{ padding: '10px 0', borderBottom: `1px solid ${L.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: L.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Notes</div>
                  <div style={{ fontSize: 12, color: L.textMuted, lineHeight: 1.6 }}>{doc.notes}</div>
                </div>
              )}

              {/* Linked invoice */}
              {doc.linked_invoice_number && (
                <div style={{ margin: '16px 0', padding: '12px 14px', borderRadius: L.radiusSm, background: 'rgba(10,185,138,0.06)', border: '1px solid rgba(10,185,138,0.15)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#0AB98A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Linked Invoice</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: L.text }}>{doc.linked_invoice_number}</div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}