import { useState, useRef } from 'react';
import { X } from 'lucide-react';

const GREEN = '#047857';
const TEXT = '#0F172A';
const SUBTLE = '#64748b';

export function LogoUploadModal({ isOpen, onClose, onUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
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
          <h2 style={{ fontSize: 20, fontWeight: 600, color: TEXT, margin: 0 }}>Select</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: SUBTLE }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <p style={{ fontSize: 14, color: SUBTLE, marginTop: 0, marginBottom: 20 }}>
          Select a logo that will be used for company settings.
        </p>

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
          <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT, marginTop: 0, marginBottom: 4 }}>
            Upload an Image
          </h3>
          <p style={{ fontSize: 14, color: SUBTLE, marginTop: 0, marginBottom: 16 }}>
            Drag and drop or{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                background: 'none', border: 'none', color: GREEN, fontWeight: 500,
                cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 14
              }}
            >
              browse files
            </button>
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              background: GREEN, color: '#fff', border: 'none', borderRadius: 8,
              padding: '0 24px', height: 40, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(4, 120, 87, 0.2)'
            }}
          >
            Upload
          </button>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, marginBottom: 0 }}>
            Max file size 10MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#dc2626', marginTop: 12, marginBottom: 0 }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
