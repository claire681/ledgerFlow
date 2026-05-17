import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, title, message, confirmText, cancelText, danger, onConfirm, onCancel, L }) => {
  useEffect(() => {
    if (!isOpen) return;
    const esc = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const c = danger ? L.red : L.accent;
  const cBg = danger ? 'rgba(239,68,68,0.08)' : L.accentSoft;

  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.45)',
      zIndex: 10000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 12, padding: 24,
        maxWidth: 420, width: '100%',
        boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
        border: `1px solid ${L.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: cBg,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: c, flexShrink: 0
          }}>
            <AlertTriangle size={18} />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: L.text }}>
            {title || 'Are you sure?'}
          </h3>
        </div>
        {message && (
          <p style={{ margin: '0 0 20px', fontSize: 14, color: L.textMuted, lineHeight: 1.5 }}>
            {message}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button onClick={onCancel} style={{
            padding: '9px 18px', borderRadius: 8,
            background: 'transparent',
            border: `1px solid ${L.border}`,
            color: L.textMuted, cursor: 'pointer',
            fontSize: 13, fontFamily: L.font, fontWeight: 500
          }}>{cancelText || 'Cancel'}</button>
          <button onClick={onConfirm} style={{
            padding: '9px 18px', borderRadius: 8,
            background: c, border: 'none', color: '#fff',
            cursor: 'pointer', fontSize: 13, fontFamily: L.font, fontWeight: 600
          }}>{confirmText || 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;