import { useState, useRef } from 'react';
import { X } from 'lucide-react';

const GREEN = '#047857';
const TEXT = '#0F172A';
const SUBTLE = '#64748b';
const DANGER = '#dc2626';

export function LogoUploadModal({ isOpen, onClose, onUpload, currentLogo, onRemove }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFile = (file) => {
    setError('');
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File size must be under 10MB.'); return; }

    const reader = new FileReader();
    reader.onload = (e) => { onUpload(e.target.result); onClose(); };
    reader.onerror = () => setError('Could not read file. Try again.');
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleRemoveConfirm = () => {
    if (typeof onRemove === 'function') onRemove();
    setConfirmingRemove(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, padding: 16,
        fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12,
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          width: '100%', maxWidth: 480, padding: 24, boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: TEXT, margin: 0 }}>
            {currentLogo ? 'Update logo' : 'Upload logo'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: SUBTLE }} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p style={{ fontSize: 14, color: SUBTLE, marginTop: 0, marginBottom: 20 }}>
          {currentLogo ? 'Replace your current logo or remove it.' : 'Select a logo that will be used for company settings.'}
        </p>

        {currentLogo && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc' }}>
              <div style={{ width: 72, height: 72, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                <img src={currentLogo} alt="Current logo" style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: TEXT, marginBottom: 6 }}>Current logo</div>
                {!confirmingRemove ? (
                  <button type="button" onClick={() => setConfirmingRemove(true)} style={{ background: 'none', border: 'none', color: DANGER, fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                    Remove logo
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: SUBTLE }}>Remove?</span>
                    <button type="button" onClick={handleRemoveConfirm} style={{ background: DANGER, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Yes, remove
                    </button>
                    <button type="button" onClick={() => setConfirmingRemove(false)} style={{ background: 'none', color: SUBTLE, border: 'none', padding: '4px 8px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 11, color: SUBTLE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or upload new</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>
          </div>
        )}

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          style={{
            border: '2px dashed ' + (isDragging ? GREEN : '#cbd5e1'),
            background: isDragging ? '#ecfdf5' : '#f8fafc',
            borderRadius: 10, padding: 32, textAlign: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT, marginTop: 0, marginBottom: 4 }}>Upload an Image</h3>
          <p style={{ fontSize: 14, color: SUBTLE, marginTop: 0, marginBottom: 16 }}>
            Drag and drop or{' '}
            <button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{ background: 'none', border: 'none', color: GREEN, fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 14 }}>
              browse files
            </button>
          </p>
          <button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: 8, padding: '0 24px', height: 40, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(4, 120, 87, 0.2)' }}>
            Upload
          </button>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, marginBottom: 0 }}>Max file size 10MB</p>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
        </div>

        {error && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 12, marginBottom: 0 }}>{error}</p>}
      </div>
    </div>
  );
}
