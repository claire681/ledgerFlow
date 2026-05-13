import React, { useState, useEffect } from 'react';
import { L, card, page, topBar } from '../styles/light';
import { Building2, Plus, Edit2, Trash2, X, Globe, Phone, Mail, Hash } from 'lucide-react';
import { useAI } from '../hooks/useAI';

const BASE = 'https://api.getnovala.com/api/v1';
const ACCENT = '#0AB98A';
function getToken() { return localStorage.getItem('token') || localStorage.getItem('access_token') || ''; }
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return isMobile;
}
const inp = { width: '100%', padding: '9px 12px', background: L.pageBg, border: `1px solid ${L.border}`, borderRadius: L.radiusSm, color: L.text, fontSize: 13, fontFamily: L.font, outline: 'none', boxSizing: 'border-box' };

function Field({ label, children }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>{children}</div>;
}

export default function Businesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({ name: '', email: '', phone: '', address: '', currency: 'CAD', tax_number: '', logo_url: '' });
  const { setPageContext }           = useAI();
  const isMobile                    = useIsMobile();

  const load = async () => {
    setLoading(true);
    try { const res = await fetch(`${BASE}/businesses/`, { headers: { Authorization: `Bearer ${getToken()}` } }); const data = await res.json(); setBusinesses(Array.isArray(data) ? data : []); }
    catch { setBusinesses([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); setPageContext('businesses', { page: 'businesses' }); }, []);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openCreate = () => { setForm({ name: '', email: '', phone: '', address: '', currency: 'CAD', tax_number: '', logo_url: '' }); setSelected(null); setModal('form'); };
  const openEdit   = (b) => { setSelected(b); setForm({ name: b.name || '', email: b.email || '', phone: b.phone || '', address: b.address || '', currency: b.currency || 'CAD', tax_number: b.tax_number || '', logo_url: b.logo_url || '' }); setModal('form'); };

  const handleSave = async () => {
    if (!form.name.trim()) { window.alert('Business name is required.'); return; }
    setSaving(true);
    try {
      const url    = selected ? `${BASE}/businesses/${selected.id}` : `${BASE}/businesses/`;
      const method = selected ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setModal(null); await load(); }
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this business?')) return;
    await fetch(`${BASE}/businesses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    await load();
  };

  const pad = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>
      <div style={{ ...topBar, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 0, padding: isMobile ? '16px' : undefined }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: L.text, letterSpacing: '-0.02em' }}>My Businesses</div>
          <div style={{ fontSize: 12, color: L.textMuted, marginTop: 2 }}>Manage multiple businesses from one Novala account</div>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: L.radiusSm, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font, alignSelf: isMobile ? 'stretch' : 'auto', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <Plus size={14}/> Add Business
        </button>
      </div>

      <div style={{ padding: pad }}>
        {/* Info */}
        <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, fontSize: 13, color: L.textMuted, lineHeight: 1.6 }}>
          <strong style={{ color: L.text }}>Multi-Business Support</strong> — Add all your companies, freelance brands, or client accounts. Switch between them to keep financials separate and organized.
        </div>

        {loading && <div style={{ padding: 40, textAlign: 'center', color: L.textMuted }}>Loading businesses…</div>}

        {!loading && businesses.length === 0 && (
          <div style={{ ...card, padding: isMobile ? 40 : 60, textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Building2 size={26} color={ACCENT}/>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: L.text, marginBottom: 6 }}>No businesses yet</div>
            <div style={{ fontSize: 13, color: L.textMuted, marginBottom: 20 }}>Add your first business to manage multiple companies</div>
            <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: L.radiusSm, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font }}>
              <Plus size={13}/> Add Business
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {businesses.map((b, i) => (
            <div key={b.id} style={{ ...card, padding: '22px 24px', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(10,185,138,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {b.logo_url ? <img src={b.logo_url} alt="" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }}/> : <Building2 size={20} color={ACCENT}/>}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: L.text }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: L.textMuted, marginTop: 2 }}>Currency: {b.currency || 'CAD'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(b)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: L.radiusSm, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, color: ACCENT, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}><Edit2 size={10}/></button>
                  <button onClick={() => handleDelete(b.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', borderRadius: L.radiusSm, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', fontSize: 11 }}><Trash2 size={10}/></button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {b.email      && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: L.textMuted }}><Mail size={11} color={ACCENT}/>{b.email}</div>}
                {b.phone      && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: L.textMuted }}><Phone size={11} color={ACCENT}/>{b.phone}</div>}
                {b.address    && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: L.textMuted }}><Globe size={11} color={ACCENT}/>{b.address}</div>}
                {b.tax_number && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: L.textMuted }}><Hash size={11} color={ACCENT}/>Tax: {b.tax_number}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal === 'form' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ ...card, width: isMobile ? '100%' : 520, maxWidth: '96vw', maxHeight: isMobile ? '95vh' : '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.18)', borderRadius: isMobile ? '20px 20px 0 0' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: `1px solid ${L.border}`, position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: L.text }}>{selected ? 'Edit Business' : 'Add Business'}</div>
              <button onClick={() => setModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: L.textMuted, display: 'flex' }}><X size={18}/></button>
            </div>
            <div style={{ padding: '24px' }}>
              <Field label="Business Name *"><input style={inp} placeholder="Acme Inc." value={form.name} onChange={e => sf('name', e.target.value)}/></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Email"><input style={inp} type="email" placeholder="hello@acme.com" value={form.email} onChange={e => sf('email', e.target.value)}/></Field>
                <Field label="Phone"><input style={inp} placeholder="+1 555 0000" value={form.phone} onChange={e => sf('phone', e.target.value)}/></Field>
              </div>
              <Field label="Address"><input style={inp} placeholder="123 Business Ave, City" value={form.address} onChange={e => sf('address', e.target.value)}/></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Currency">
                  <select style={inp} value={form.currency} onChange={e => sf('currency', e.target.value)}>
                    {['CAD','USD','GBP','EUR','AUD','AED','KES','NGN'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Tax / GST Number"><input style={inp} placeholder="GST-123456789" value={form.tax_number} onChange={e => sf('tax_number', e.target.value)}/></Field>
              </div>
              <Field label="Logo URL (optional)"><input style={inp} placeholder="https://..." value={form.logo_url} onChange={e => sf('logo_url', e.target.value)}/></Field>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: L.radiusSm, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: L.font }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: L.radiusSm, background: saving ? L.textFaint : ACCENT, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font }}>
                  {saving ? 'Saving…' : selected ? 'Save Changes' : 'Add Business'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}