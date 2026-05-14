import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock } from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';

const ACCENT = '#0AB98A';
const FONT   = "'Inter', -apple-system, sans-serif";

export default function PlaceholderPage({ title = 'Coming Soon' }) {
  const navigate = useNavigate();
  return (
    <div style={page}>
      <div style={topBar}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: L.text, letterSpacing: '-0.02em' }}>{title}</div>
          <div style={{ fontSize: 12, color: L.textMuted, marginTop: 2 }}>Novala</div>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: L.textMuted, fontSize: 13, fontWeight: 600, fontFamily: FONT }}
        >
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ ...card, padding: '48px 40px', textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Clock size={24} color={ACCENT} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: L.text, marginBottom: 8 }}>Coming Soon</div>
          <div style={{ fontSize: 13, color: L.textMuted, lineHeight: 1.6 }}>
            This page is being built. Check back soon.
          </div>
          <button
            onClick={() => navigate('/')}
            style={{ marginTop: 24, padding: '10px 24px', borderRadius: 8, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: FONT }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}