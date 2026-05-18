import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, MoreHorizontal, Edit2, CheckCircle, Download, Bell, Trash2, Sparkles } from 'lucide-react';

const InvoiceRowActions = ({ inv, fuStatus, L, openView, openEdit, handleStatus, exportPDF, handleFollowUp, handleDelete }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
    setMenuStyle({
      position: 'fixed',
      right: (window.innerWidth - rect.right) + 'px',
      ...(openUp
        ? { bottom: (window.innerHeight - rect.top + 4) + 'px' }
        : { top: (rect.bottom + 4) + 'px' })
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)
          && triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const isPaid = inv.status === 'paid';
  const isDraft = inv.status === 'draft';

  const item = (icon, label, onClick, danger=false) => (
    <button
      onClick={(e) => { e.stopPropagation(); setOpen(false); onClick(); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '12px 14px',
        background: 'transparent', border: 'none',
        cursor: 'pointer', fontSize: 13, fontFamily: L.font,
        color: danger ? L.red : L.text, textAlign: 'left'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.06)' : L.pageBg}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {icon}<span>{label}</span>
    </button>
  );

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        onClick={(e) => { e.stopPropagation(); openView(inv); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 12px', borderRadius: L.radiusSm,
          background: L.blueSoft, border: `1px solid ${L.blueBorder}`,
          color: L.blue, cursor: 'pointer',
          fontSize: 12, fontWeight: 600, fontFamily: L.font
        }}>
        <Eye size={12} /> View
      </button>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: L.radiusSm,
          background: open ? L.pageBg : 'transparent',
          border: `1px solid ${L.border}`,
          color: L.textMuted, cursor: 'pointer'
        }}>
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div
          ref={menuRef}
          style={{
            ...menuStyle,
            background: '#fff',
            border: `1px solid ${L.border}`,
            borderRadius: L.radiusSm,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: 200,
            maxHeight: '70vh',
            overflowY: 'auto',
            zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            paddingTop: 4, paddingBottom: 4,
          }}>
          {item(<Edit2 size={13} />, 'Edit', () => openEdit(inv))}

          {item(<Sparkles size={13} />, 'Open in new editor', () => navigate('/invoices/' + inv.id + '/edit'))}
          {!isPaid && !isDraft && item(<CheckCircle size={13} />, 'Mark Paid', () => handleStatus(inv.id, 'paid'))}
          {item(<Download size={13} />, 'Download PDF', () => exportPDF(inv))}
          {!isPaid && !fuStatus && item(<Bell size={13} />, 'Send Follow Up', () => handleFollowUp(inv))}
          <div style={{ height: 1, background: L.border, margin: '4px 0' }} />
          {item(<Trash2 size={13} />, 'Delete', () => handleDelete(inv.id), true)}
        </div>
      )}
    </div>
  );
};

export default InvoiceRowActions;