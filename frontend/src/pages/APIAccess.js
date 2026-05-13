import React, { useState, useEffect } from 'react';
import { L, card, page, topBar } from '../styles/light';
import { Key, Plus, Trash2, X, Copy, Eye, EyeOff, Shield, Zap, Check } from 'lucide-react';
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

export default function APIAccess() {
  const [keys, setKeys]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [newKey, setNewKey]       = useState(null);
  const [copied, setCopied]       = useState(false);
  const [form, setForm]           = useState({ name: '', permissions: ['read'], expires_days: '' });
  const { setPageContext }         = useAI();
  const isMobile                  = useIsMobile();

  const load = async () => {
    setLoading(true);
    try { const res = await fetch(`${BASE}/apikeys/`, { headers: { Authorization: `Bearer ${getToken()}` } }); setKeys(Array.isArray(await res.json()) ? await res.json() : []); }
    catch { setKeys([]); }
    finally { setLoading(false); }
  };

  const load2 = async () => {
    setLoading(true);
    try { const res = await fetch(`${BASE}/apikeys/`, { headers: { Authorization: `Bearer ${getToken()}` } }); const data = await res.json(); setKeys(Array.isArray(data) ? data : []); }
    catch { setKeys([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load2(); setPageContext('api', { page: 'api-access' }); }, []);

  const togglePerm = (p) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(p) ? prev.permissions.filter(x => x !== p) : [...prev.permissions, p]
    }));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { window.alert('Name is required.'); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${BASE}/apikeys/`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, permissions: form.permissions, expires_days: form.expires_days ? parseInt(form.expires_days) : null }) });
      const data = await res.json();
      if (res.ok) { setNewKey(data.raw_key); setModal(false); setForm({ name: '', permissions: ['read'], expires_days: '' }); await load2(); }
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this API key? This cannot be undone.')) return;
    await fetch(`${BASE}/apikeys/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    await load2();
  };

  const handleToggle = async (id) => {
    await fetch(`${BASE}/apikeys/${id}/toggle`, { method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}` } });
    await load2();
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pad = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>
      <div style={{ ...topBar, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 0, padding: isMobile ? '16px' : undefined }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: L.text, letterSpacing: '-0.02em' }}>API Access</div>
          <div style={{ fontSize: 12, color: L.textMuted, marginTop: 2 }}>Manage API keys to connect Novala with your own tools</div>
        </div>
        <button onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: L.radiusSm, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font, alignSelf: isMobile ? 'stretch' : 'auto', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <Plus size={14}/> Generate API Key
        </button>
      </div>

      <div style={{ padding: pad }}>
        {/* Info banner */}
        <div style={{ background: 'rgba(10,185,138,0.06)', border: '1px solid rgba(10,185,138,0.15)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <Shield size={20} color={ACCENT} style={{ flexShrink: 0, marginTop: 2 }}/>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: L.text, marginBottom: 6 }}>Novala API</div>
            <div style={{ fontSize: 13, color: L.textMuted, lineHeight: 1.6, marginBottom: 12 }}>
              Use API keys to integrate Novala with your own software, automate workflows, or build custom dashboards. Base URL: <code style={{ background: L.pageBg, padding: '2px 8px', borderRadius: 6, fontSize: 12, fontFamily: 'monospace' }}>https://api.getnovala.com/api/v1</code>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[{ icon: <Zap size={12} color={ACCENT}/>, text: 'RESTful JSON API' }, { icon: <Shield size={12} color={ACCENT}/>, text: 'Bearer token auth' }, { icon: <Key size={12} color={ACCENT}/>, text: 'Granular permissions' }].map(f => (
                <span key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: L.textMuted, fontWeight: 500 }}>{f.icon}{f.text}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Keys list */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: isMobile ? '14px 16px' : '16px 20px', borderBottom: `1px solid ${L.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: L.text }}>API Keys ({keys.length})</div>
          </div>

          {loading && <div style={{ padding: 40, textAlign: 'center', color: L.textMuted }}>Loading keys…</div>}

          {!loading && keys.length === 0 && (
            <div style={{ padding: isMobile ? 40 : 60, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Key size={26} color={ACCENT}/>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: L.text, marginBottom: 6 }}>No API keys yet</div>
              <div style={{ fontSize: 13, color: L.textMuted, marginBottom: 20 }}>Generate your first API key to start integrating</div>
              <button onClick={() => setModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: L.radiusSm, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font }}>
                <Plus size={13}/> Generate Key
              </button>
            </div>
          )}

          {!loading && keys.map((key, i) => (
            <div key={key.id} style={{ padding: isMobile ? '14px 16px' : '16px 20px', borderBottom: i < keys.length - 1 ? `1px solid ${L.border}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: L.text }}>{key.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: key.is_active ? ACCENT : '#94a3b8', background: key.is_active ? 'rgba(10,185,138,0.1)' : 'rgba(148,163,184,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                    {key.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: L.textMuted, marginBottom: 4 }}>{key.key_preview}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {(key.permissions || []).map(p => (
                    <span key={p} style={{ fontSize: 10, fontWeight: 700, color: '#0ea5e9', background: 'rgba(14,165,233,0.08)', padding: '2px 8px', borderRadius: 99 }}>{p}</span>
                  ))}
                  <span style={{ fontSize: 11, color: L.textMuted }}>Created {new Date(key.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => handleToggle(key.id)} style={{ padding: '6px 10px', borderRadius: L.radiusSm, background: key.is_active ? 'rgba(245,158,11,0.08)' : L.accentSoft, border: `1px solid ${key.is_active ? 'rgba(245,158,11,0.2)' : L.accentBorder}`, color: key.is_active ? '#F59E0B' : ACCENT, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: L.font }}>
                  {key.is_active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(key.id)} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: L.radiusSm, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', fontSize: 11 }}>
                  <Trash2 size={11}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ ...card, width: isMobile ? '100%' : 480, maxWidth: '96vw', maxHeight: isMobile ? '95vh' : '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.18)', borderRadius: isMobile ? '20px 20px 0 0' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: `1px solid ${L.border}`, position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: L.text }}>Generate API Key</div>
              <button onClick={() => setModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: L.textMuted, display: 'flex' }}><X size={18}/></button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Key Name *</div>
                <input style={inp} placeholder="e.g. Production Key, My App" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Permissions</div>
                {['read', 'write', 'delete'].map(p => (
                  <div key={p} onClick={() => togglePerm(p)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `1px solid ${form.permissions.includes(p) ? L.accentBorder : L.border}`, background: form.permissions.includes(p) ? L.accentSoft : 'transparent', cursor: 'pointer', marginBottom: 8, transition: 'all 0.2s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${form.permissions.includes(p) ? ACCENT : L.border}`, background: form.permissions.includes(p) ? ACCENT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      {form.permissions.includes(p) && <Check size={11} color="#fff" strokeWidth={3}/>}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: L.text, textTransform: 'capitalize' }}>{p}</div>
                      <div style={{ fontSize: 11, color: L.textMuted }}>
                        {p === 'read' ? 'Read financial data and reports' : p === 'write' ? 'Create and update records' : 'Delete records and data'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Expires In (Days)</div>
                <input style={inp} type="number" placeholder="Leave blank for no expiry" value={form.expires_days} onChange={e => setForm(p => ({ ...p, expires_days: e.target.value }))}/>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setModal(false)} style={{ padding: '9px 18px', borderRadius: L.radiusSm, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: L.font }}>Cancel</button>
                <button onClick={handleCreate} disabled={saving} style={{ padding: '9px 22px', borderRadius: L.radiusSm, background: saving ? L.textFaint : ACCENT, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font }}>
                  {saving ? 'Generating…' : 'Generate Key'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show new key modal */}
      {newKey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ ...card, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '24px' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Key size={22} color={ACCENT}/>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: L.text, textAlign: 'center', marginBottom: 8 }}>API Key Generated</div>
              <div style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', marginBottom: 16, fontWeight: 600 }}>⚠️ Copy this key now — it will never be shown again</div>
              <div style={{ background: L.pageBg, border: `1px solid ${L.border}`, borderRadius: 10, padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: L.text, wordBreak: 'break-all', marginBottom: 16 }}>
                {newKey}
              </div>
              <button onClick={() => copyKey(newKey)} style={{ width: '100%', padding: '12px', borderRadius: L.radiusSm, background: copied ? L.accentSoft : ACCENT, color: copied ? ACCENT : '#fff', border: `1px solid ${copied ? L.accentBorder : 'transparent'}`, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: L.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10, transition: 'all 0.2s' }}>
                {copied ? <><Check size={14}/> Copied!</> : <><Copy size={14}/> Copy API Key</>}
              </button>
              <button onClick={() => setNewKey(null)} style={{ width: '100%', padding: '12px', borderRadius: L.radiusSm, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: L.font }}>
                I've copied it, close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}