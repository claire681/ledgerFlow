import React, { useState, useEffect } from 'react';
import { L, card, page, topBar } from '../styles/light';
import { Package, Plus, Edit2, Trash2, X, Search, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';
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

function Modal({ title, onClose, children }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ ...card, width: isMobile ? '100%' : 560, maxWidth: '96vw', maxHeight: isMobile ? '95vh' : '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.18)', borderRadius: isMobile ? '20px 20px 0 0' : undefined }}>
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
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>{children}</div>;
}

export default function Inventory() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [form, setForm]         = useState({ name: '', description: '', sku: '', category: '', price: '', cost: '', quantity: '', unit: 'unit', low_stock_alert: '10', status: 'active' });
  const { setPageContext }       = useAI();
  const isMobile                = useIsMobile();

  const load = async () => {
    setLoading(true);
    try { const res = await fetch(`${BASE}/inventory/`, { headers: { Authorization: `Bearer ${getToken()}` } }); setItems(Array.isArray(await res.json()) ? await res.json() : []); }
    catch { setItems([]); }
    finally { setLoading(false); }
  };

  const load2 = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/inventory/`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load2(); }, []);
  useEffect(() => { setPageContext('inventory', { page: 'inventory', total: items.length, low_stock: items.filter(i => i.quantity <= i.low_stock_alert).length }); }, [items]);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openCreate = () => { setForm({ name: '', description: '', sku: '', category: '', price: '', cost: '', quantity: '', unit: 'unit', low_stock_alert: '10', status: 'active' }); setSelected(null); setModal('form'); };
  const openEdit   = (item) => { setSelected(item); setForm({ name: item.name || '', description: item.description || '', sku: item.sku || '', category: item.category || '', price: String(item.price || ''), cost: String(item.cost || ''), quantity: String(item.quantity || ''), unit: item.unit || 'unit', low_stock_alert: String(item.low_stock_alert || 10), status: item.status || 'active' }); setModal('form'); };

  const handleSave = async () => {
    if (!form.name.trim()) { window.alert('Name is required.'); return; }
    setSaving(true);
    try {
      const url    = selected ? `${BASE}/inventory/${selected.id}` : `${BASE}/inventory/`;
      const method = selected ? 'PATCH' : 'POST';
      const body   = { ...form, price: parseFloat(form.price) || 0, cost: parseFloat(form.cost) || 0, quantity: parseInt(form.quantity) || 0, low_stock_alert: parseInt(form.low_stock_alert) || 10 };
      const res    = await fetch(url, { method, headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { setModal(null); await load2(); }
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    await fetch(`${BASE}/inventory/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    await load2();
  };

  const filtered    = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()) || (i.category || '').toLowerCase().includes(search.toLowerCase()) || (i.sku || '').toLowerCase().includes(search.toLowerCase()));
  const totalValue  = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
  const lowStock    = items.filter(i => (i.quantity || 0) <= (i.low_stock_alert || 10)).length;
  const pad         = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>
      <div style={{ ...topBar, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 0, padding: isMobile ? '16px' : undefined }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: L.text, letterSpacing: '-0.02em' }}>Inventory</div>
          <div style={{ fontSize: 12, color: L.textMuted, marginTop: 2 }}>Track your products, services and stock levels</div>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: L.radiusSm, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font, alignSelf: isMobile ? 'stretch' : 'auto', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <Plus size={14}/> Add Item
        </button>
      </div>

      <div style={{ padding: pad }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14, marginBottom: isMobile ? 14 : 20 }}>
          {[
            { label: 'Total Items',   value: items.length,                                  color: L.text,    icon: <Package size={16}/> },
            { label: 'Total Value',   value: `$${totalValue.toLocaleString()}`,             color: ACCENT,    icon: <DollarSign size={16}/> },
            { label: 'Low Stock',     value: lowStock,                                      color: '#F59E0B', icon: <AlertTriangle size={16}/> },
            { label: 'Categories',    value: [...new Set(items.map(i => i.category).filter(Boolean))].length, color: '#0ea5e9', icon: <BarChart3 size={16}/> },
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

        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: isMobile ? '14px 16px' : '16px 20px', borderBottom: `1px solid ${L.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: L.text }}>All Items</div>
            <div style={{ position: 'relative', flex: isMobile ? 1 : 'none' }}>
              <Search size={13} color={L.textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
              <input placeholder="Search inventory..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, paddingLeft: 32, width: isMobile ? '100%' : 220 }}/>
            </div>
          </div>

          {!isMobile && items.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px', padding: '8px 20px', background: L.pageBg, borderBottom: `1px solid ${L.border}` }}>
              {['ITEM', 'SKU', 'CATEGORY', 'PRICE', 'QUANTITY', 'ACTIONS'].map(h => (
                <div key={h} style={{ fontSize: 9, fontWeight: 700, color: L.textFaint, letterSpacing: '0.12em' }}>{h}</div>
              ))}
            </div>
          )}

          {loading && <div style={{ padding: 40, textAlign: 'center', color: L.textMuted }}>Loading inventory…</div>}

          {!loading && items.length === 0 && (
            <div style={{ padding: isMobile ? 40 : 60, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Package size={26} color={ACCENT}/>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: L.text, marginBottom: 6 }}>No inventory items yet</div>
              <div style={{ fontSize: 13, color: L.textMuted, marginBottom: 20 }}>Add your products and services to track stock levels</div>
              <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: L.radiusSm, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font }}>
                <Plus size={13}/> Add Item
              </button>
            </div>
          )}

          {!loading && filtered.map((item, i) => {
            const isLow = (item.quantity || 0) <= (item.low_stock_alert || 10);
            if (isMobile) return (
              <div key={item.id} style={{ padding: '14px 16px', borderBottom: i < filtered.length - 1 ? `1px solid ${L.border}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: L.text }}>{item.name}</div>
                    {item.category && <div style={{ fontSize: 11, color: L.textMuted, marginTop: 2 }}>{item.category}</div>}
                  </div>
                  {isLow && <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(245,158,11,0.2)' }}>Low Stock</span>}
                </div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 12, color: L.textSub }}>
                  <span>Price: <strong>${item.price || 0}</strong></span>
                  <span>Qty: <strong style={{ color: isLow ? '#F59E0B' : L.text }}>{item.quantity || 0} {item.unit}</strong></span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: L.radiusSm, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, color: ACCENT, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}><Edit2 size={11}/> Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: L.radiusSm, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', fontSize: 11 }}><Trash2 size={11}/></button>
                </div>
              </div>
            );
            return (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px', padding: '13px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${L.border}` : 'none', alignItems: 'center', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = L.pageBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: L.text }}>{item.name}</div>
                  {item.description && <div style={{ fontSize: 11, color: L.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{item.description}</div>}
                </div>
                <div style={{ fontSize: 12, color: L.textMuted }}>{item.sku || '—'}</div>
                <div style={{ fontSize: 12, color: L.textMuted }}>{item.category || '—'}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>${item.price || 0}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isLow ? '#F59E0B' : L.text }}>{item.quantity || 0} {item.unit}</span>
                  {isLow && <AlertTriangle size={12} color="#F59E0B"/>}
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => openEdit(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: L.radiusSm, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, color: ACCENT, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}><Edit2 size={10}/> Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', borderRadius: L.radiusSm, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', fontSize: 11 }}><Trash2 size={10}/></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal === 'form' && (
        <Modal title={selected ? 'Edit Item' : 'Add Inventory Item'} onClose={() => setModal(null)}>
          <Field label="Item Name *"><input style={inp} placeholder="Product or service name" value={form.name} onChange={e => sf('name', e.target.value)}/></Field>
          <Field label="Description"><textarea style={{ ...inp, height: 60, resize: 'vertical' }} placeholder="Brief description" value={form.description} onChange={e => sf('description', e.target.value)}/></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="SKU"><input style={inp} placeholder="SKU-001" value={form.sku} onChange={e => sf('sku', e.target.value)}/></Field>
            <Field label="Category"><input style={inp} placeholder="e.g. Services" value={form.category} onChange={e => sf('category', e.target.value)}/></Field>
            <Field label="Price ($)"><input style={inp} type="number" placeholder="0.00" value={form.price} onChange={e => sf('price', e.target.value)}/></Field>
            <Field label="Cost ($)"><input style={inp} type="number" placeholder="0.00" value={form.cost} onChange={e => sf('cost', e.target.value)}/></Field>
            <Field label="Quantity"><input style={inp} type="number" placeholder="0" value={form.quantity} onChange={e => sf('quantity', e.target.value)}/></Field>
            <Field label="Unit"><input style={inp} placeholder="unit, kg, hr..." value={form.unit} onChange={e => sf('unit', e.target.value)}/></Field>
            <Field label="Low Stock Alert">
              <input style={inp} type="number" placeholder="10" value={form.low_stock_alert} onChange={e => sf('low_stock_alert', e.target.value)}/>
            </Field>
            <Field label="Status">
              <select style={inp} value={form.status} onChange={e => sf('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: L.radiusSm, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: L.font }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: L.radiusSm, background: saving ? L.textFaint : ACCENT, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font }}>
              {saving ? 'Saving…' : selected ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}