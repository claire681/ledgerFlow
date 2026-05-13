import React, { useState, useEffect } from 'react';
import { L, card, page, topBar } from '../styles/light';
import { Users, Plus, Edit2, Trash2, X, Mail, Phone, Building2, MapPin, Search, DollarSign, CheckCircle } from 'lucide-react';
import { useAI } from '../hooks/useAI';

const BASE = 'https://api.getnovala.com/api/v1';
const ACCENT = '#0AB98A';

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('access_token') || '';
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

const inp = {
  width: '100%', padding: '9px 12px',
  background: L.pageBg, border: `1px solid ${L.border}`,
  borderRadius: L.radiusSm, color: L.text,
  fontSize: 13, fontFamily: L.font, outline: 'none', boxSizing: 'border-box',
};

function Modal({ title, onClose, children }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ ...card, width: isMobile ? '100%' : 520, maxWidth: '96vw', maxHeight: isMobile ? '95vh' : '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.18)', borderRadius: isMobile ? '20px 20px 0 0' : undefined }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: `1px solid ${L.border}`, position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: L.text }}>{title}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: L.textMuted, display: 'flex' }}><X size={18}/></button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState({ name: '', email: '', phone: '', address: '', company: '', notes: '' });
  const { setPageContext }         = useAI();
  const isMobile                  = useIsMobile();

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/customers/`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch { setCustomers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    setPageContext('customers', { page: 'customers', total: customers.length, active: customers.filter(c => c.status === 'active').length });
  }, [customers]);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => {
    setForm({ name: '', email: '', phone: '', address: '', company: '', notes: '' });
    setSelected(null);
    setModal('form');
  };

  const openEdit = (c) => {
    setSelected(c);
    setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '', address: c.address || '', company: c.company || '', notes: c.notes || '' });
    setModal('form');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { window.alert('Name is required.'); return; }
    setSaving(true);
    try {
      const url    = selected ? `${BASE}/customers/${selected.id}` : `${BASE}/customers/`;
      const method = selected ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setModal(null); await load(); }
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    await fetch(`${BASE}/customers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    await load();
  };

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  );

  const pad = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>
      <div style={{ ...topBar, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 0, padding: isMobile ? '16px' : undefined }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: L.text, letterSpacing: '-0.02em' }}>Customers</div>
          <div style={{ fontSize: 12, color: L.textMuted, marginTop: 2 }}>Manage your clients and customer relationships</div>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: L.radiusSm, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font, alignSelf: isMobile ? 'stretch' : 'auto', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <Plus size={14}/> Add Customer
        </button>
      </div>

      <div style={{ padding: pad }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14, marginBottom: isMobile ? 14 : 20 }}>
          {[
            { label: 'Total Customers', value: customers.length,                                          color: L.text,    icon: <Users size={16}/> },
            { label: 'Active',          value: customers.filter(c => c.status === 'active').length,       color: ACCENT,    icon: <CheckCircle size={16}/> },
            { label: 'Total Billed',    value: `$${customers.reduce((s,c) => s+(c.total_billed||0),0).toLocaleString()}`, color: '#0ea5e9', icon: <DollarSign size={16}/> },
            { label: 'Total Paid',      value: `$${customers.reduce((s,c) => s+(c.total_paid||0),0).toLocaleString()}`,   color: ACCENT,    icon: <CheckCircle size={16}/> },
          ].map(item => (
            <div key={item.label} style={{ ...card, padding: isMobile ? '12px 14px' : '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: isMobile ? 6 : 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: L.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{item.label}</div>
                <span style={{ color: item.color, opacity: 0.6 }}>{item.icon}</span>
              </div>
              <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* List */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: isMobile ? '14px 16px' : '16px 20px', borderBottom: `1px solid ${L.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: L.text }}>All Customers</div>
            <div style={{ position: 'relative', flex: isMobile ? 1 : 'none' }}>
              <Search size={13} color={L.textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
              <input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inp, paddingLeft: 32, width: isMobile ? '100%' : 220 }}/>
            </div>
          </div>

          {loading && <div style={{ padding: 40, textAlign: 'center', color: L.textMuted }}>Loading customers…</div>}

          {!loading && customers.length === 0 && (
            <div style={{ padding: isMobile ? 40 : 60, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Users size={26} color={ACCENT}/>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: L.text, marginBottom: 6 }}>No customers yet</div>
              <div style={{ fontSize: 13, color: L.textMuted, marginBottom: 20 }}>Add your first customer to start managing relationships</div>
              <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: L.radiusSm, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font }}>
                <Plus size={13}/> Add Customer
              </button>
            </div>
          )}

          {!loading && filtered.map((c, i) => (
            <div key={c.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '14px 16px' : '14px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${L.border}` : 'none', gap: 12, flexWrap: isMobile ? 'wrap' : 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.background = L.pageBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: ACCENT }}>{(c.name || '?')[0].toUpperCase()}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: L.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 3 }}>
                    {c.email   && <span style={{ fontSize: 11, color: L.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={10}/>{c.email}</span>}
                    {c.phone   && <span style={{ fontSize: 11, color: L.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10}/>{c.phone}</span>}
                    {c.company && <span style={{ fontSize: 11, color: L.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={10}/>{c.company}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => openEdit(c)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: L.radiusSm, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, color: ACCENT, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                  <Edit2 size={11}/> Edit
                </button>
                <button onClick={() => handleDelete(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: L.radiusSm, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', fontSize: 11 }}>
                  <Trash2 size={11}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal === 'form' && (
        <Modal title={selected ? 'Edit Customer' : 'Add Customer'} onClose={() => setModal(null)}>
          <Field label="Full Name *"><input style={inp} placeholder="John Smith" value={form.name} onChange={e => sf('name', e.target.value)}/></Field>
          <Field label="Company"><input style={inp} placeholder="Acme Corp" value={form.company} onChange={e => sf('company', e.target.value)}/></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Email"><input style={inp} type="email" placeholder="john@example.com" value={form.email} onChange={e => sf('email', e.target.value)}/></Field>
            <Field label="Phone"><input style={inp} placeholder="+1 555 0000" value={form.phone} onChange={e => sf('phone', e.target.value)}/></Field>
          </div>
          <Field label="Address"><input style={inp} placeholder="123 Main St, City" value={form.address} onChange={e => sf('address', e.target.value)}/></Field>
          <Field label="Notes"><textarea style={{ ...inp, height: 72, resize: 'vertical' }} placeholder="Any notes about this customer..." value={form.notes} onChange={e => sf('notes', e.target.value)}/></Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: L.radiusSm, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: L.font }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: L.radiusSm, background: saving ? L.textFaint : ACCENT, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font }}>
              {saving ? 'Saving…' : selected ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}