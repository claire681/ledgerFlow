import React, { useState, useEffect } from 'react';
import {
  CreditCard, BookOpen, Mail, Cloud,
  MessageSquare, BarChart3, CheckCircle,
  WifiOff, AlertCircle, RefreshCw, Unlink,
  PlugZap, Link, X, Eye, EyeOff, Info,
  FlaskConical,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';
import { useAI } from '../hooks/useAI';

const BASE     = 'https://api.getnovala.com/api/v1';
const ACCENT   = '#0AB98A';
const getToken = () => localStorage.getItem('token') || localStorage.getItem('access_token') || '';

const PROVIDER_META = {
  stripe:       { icon: CreditCard,    color: '#635BFF' },
  quickbooks:   { icon: BookOpen,      color: '#2CA01C' },
  xero:         { icon: BarChart3,     color: '#1AB4D7' },
  email:        { icon: Mail,          color: '#0EA5E9' },
  google_drive: { icon: Cloud,         color: '#4285F4' },
  slack:        { icon: MessageSquare, color: '#E01E5A' },
};

const STATUS_CONFIG = {
  connected: { color:'#0AB98A', bg:'rgba(10,185,138,0.08)',  border:'rgba(10,185,138,0.2)',  label:'Connected', icon:CheckCircle },
  offline:   { color:'#94A3B8', bg:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)', label:'Offline',   icon:WifiOff     },
  error:     { color:'#EF4444', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.2)',   label:'Error',     icon:AlertCircle },
};

const SETUP_FORMS = {
  stripe: {
    title:  'Connect Stripe',
    fields: [
      { key:'stripe_secret_key',      label:'Secret Key',             placeholder:'sk_live_...', secret:true,  required:true,  helper:null },
      { key:'stripe_publishable_key', label:'Publishable Key',        placeholder:'pk_live_...', secret:false, required:true,  helper:null },
      { key:'webhook_secret',         label:'Webhook Signing Secret', placeholder:'whsec_...',   secret:true,  required:false, helper:null },
      { key:'test_mode',              label:'Test Mode',              type:'toggle',             required:false,               helper:null },
    ],
  },
  email: {
    title:  'Connect Gmail',
    fields: [
      { key:'smtp_username', label:'Email Address', placeholder:'you@gmail.com',    secret:false, required:true,  helper:null },
      { key:'smtp_password', label:'App Password',  placeholder:'••••••••••••••••', secret:true,  required:true,  helper:'Use a Google App Password, not your normal Gmail password.' },
      { key:'from_name',     label:'From Name',     placeholder:'Novala',           secret:false, required:false, helper:null },
    ],
  },
  slack: {
    title:  'Connect Slack',
    fields: [
      { key:'webhook_url',     label:'Webhook URL',     placeholder:'https://hooks.slack.com/services/...', secret:false, required:true,  helper:null },
      { key:'default_channel', label:'Default Channel', placeholder:'#finance',                             secret:false, required:false, helper:null },
    ],
  },
};

const OAUTH_PROVIDERS    = new Set(['quickbooks', 'xero', 'google_drive']);
const TESTABLE_PROVIDERS = new Set(['stripe', 'email', 'slack']);

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

async function apiFetch(path, options = {}) {
  const res  = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json', ...(options.headers || {}) },
  });
  const text = await res.text();
  let data;
  try   { data = JSON.parse(text); }
  catch { throw new Error(res.status === 500 ? 'Server error — check backend logs' : `Request failed (${res.status})`); }
  if (!res.ok) throw new Error(data?.detail || data?.message || `Request failed (${res.status})`);
  return data;
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

// ── Setup Modal ───────────────────────────────────────────────
function SetupModal({ provider, onClose, onSave }) {
  const form    = SETUP_FORMS[provider];
  const isOAuth = OAUTH_PROVIDERS.has(provider);
  const meta    = PROVIDER_META[provider] || { icon:PlugZap, color:'#64748B' };
  const Icon    = meta.icon;

  const [values,   setValues]   = useState({});
  const [showPass, setShowPass] = useState({});
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleSave = async () => {
    if (!form) return;
    const missing = form.fields.filter(f => f.required && f.type !== 'toggle' && !String(values[f.key] || '').trim()).map(f => f.label);
    if (missing.length) { setError(`Please fill in: ${missing.join(', ')}`); return; }
    setSaving(true); setError('');
    try { await onSave(provider, values); onClose(); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const inputStyle = {
    width:'100%', padding:'9px 12px',
    background:L.pageBg, border:`1px solid ${L.border}`,
    borderRadius:L.radiusSm, color:L.text,
    fontSize:13, fontFamily:L.font, outline:'none',
    boxSizing:'border-box', transition:'border-color 0.15s',
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, backdropFilter:'blur(4px)', padding:'16px' }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.18)' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:`1px solid ${L.border}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${meta.color}15`, border:`1px solid ${meta.color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon size={18} color={meta.color}/>
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:L.text }}>{form?.title || `Connect ${provider}`}</div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:L.textMuted, display:'flex' }}><X size={18}/></button>
        </div>

        <div style={{ padding:24 }}>
          {isOAuth && (
            <div style={{ padding:16, borderRadius:L.radiusSm, background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <Info size={16} color="#0EA5E9"/>
                <div style={{ fontSize:14, fontWeight:600, color:'#0EA5E9' }}>OAuth Required</div>
              </div>
              <div style={{ fontSize:13, color:L.textMuted, lineHeight:1.6 }}>
                This integration requires OAuth authorization which is coming soon.
              </div>
            </div>
          )}

          {!isOAuth && form && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {form.fields.map(field => (
                <div key={field.key}>
                  <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>
                    {field.label}{field.required && <span style={{ color:ACCENT }}> *</span>}
                  </div>
                  {field.type === 'toggle' ? (
                    <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                      <div onClick={() => setValues(v => ({ ...v, [field.key]:!v[field.key] }))}
                        style={{ width:40, height:22, borderRadius:11, background:values[field.key] ? ACCENT : '#E2E8F0', position:'relative', cursor:'pointer', transition:'background 0.2s' }}>
                        <div style={{ position:'absolute', top:3, left:values[field.key] ? 20 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
                      </div>
                      <span style={{ fontSize:13, color:L.textSub }}>{values[field.key] ? 'Enabled (Test Mode)' : 'Disabled (Live Mode)'}</span>
                    </label>
                  ) : (
                    <div style={{ position:'relative' }}>
                      <input type={field.secret && !showPass[field.key] ? 'password' : 'text'} placeholder={field.placeholder}
                        value={values[field.key] || ''} onChange={e => setValues(v => ({ ...v, [field.key]:e.target.value }))}
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = ACCENT}
                        onBlur={e  => e.target.style.borderColor = L.border}/>
                      {field.secret && (
                        <button onClick={() => setShowPass(s => ({ ...s, [field.key]:!s[field.key] }))}
                          style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:L.textMuted, display:'flex' }}>
                          {showPass[field.key] ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                      )}
                    </div>
                  )}
                  {field.helper && (
                    <div style={{ marginTop:6, display:'flex', alignItems:'flex-start', gap:5, fontSize:11, color:L.textMuted, lineHeight:1.5 }}>
                      <Info size={11} color={L.textMuted} style={{ flexShrink:0, marginTop:1 }}/>{field.helper}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{ marginTop:16, padding:'10px 14px', borderRadius:L.radiusSm, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', fontSize:12, display:'flex', alignItems:'center', gap:8 }}>
              <AlertCircle size={13}/> {error}
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginTop:24 }}>
            <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:13, fontFamily:L.font }}>Cancel</button>
            {!isOAuth && (
              <button onClick={handleSave} disabled={saving}
                style={{ flex:1, padding:'10px', borderRadius:L.radiusSm, background:saving ? L.textFaint : ACCENT, color:'#fff', border:'none', cursor:saving ? 'not-allowed' : 'pointer', fontSize:13, fontWeight:600, fontFamily:L.font, boxShadow:saving ? 'none' : '0 4px 12px rgba(10,185,138,0.3)' }}>
                {saving ? 'Connecting...' : 'Save & Connect'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Integration Card ──────────────────────────────────────────
function IntegrationCard({ integration, onConnect, onDisconnect, onSync, onTest, loading, testResult }) {
  const meta        = PROVIDER_META[integration.provider] || { icon:PlugZap, color:'#64748B' };
  const ss          = STATUS_CONFIG[integration.status]   || STATUS_CONFIG.offline;
  const Icon        = meta.icon;
  const SIcon       = ss.icon;
  const isConnected = integration.status === 'connected';
  const isBusy      = loading === integration.provider;
  const isTestable  = TESTABLE_PROVIDERS.has(integration.provider);
  const thisResult  = testResult?.provider === integration.provider ? testResult : null;

  return (
    <div style={{ ...card, padding:16, display:'flex', flexDirection:'column', gap:12, overflow:'hidden', boxSizing:'border-box' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:`${meta.color}15`, border:`1px solid ${meta.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon size={20} color={meta.color}/>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color:L.text }}>{integration.name}</div>
            <div style={{ fontSize:11, color:L.textMuted, marginTop:2, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{integration.description}</div>
          </div>
        </div>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, fontSize:10, fontWeight:700, color:ss.color, background:ss.bg, border:`1px solid ${ss.border}`, flexShrink:0, marginLeft:8 }}>
          <SIcon size={10}/> {ss.label}
        </span>
      </div>

      {/* Timestamps */}
      {integration.last_sync_at && (
        <div style={{ fontSize:11, color:L.textMuted, display:'flex', alignItems:'center', gap:5 }}>
          <RefreshCw size={10}/> Last synced: {formatDate(integration.last_sync_at)}
        </div>
      )}
      {isConnected && !integration.last_sync_at && integration.connected_at && (
        <div style={{ fontSize:11, color:L.textMuted, display:'flex', alignItems:'center', gap:5 }}>
          <CheckCircle size={10} color={ACCENT}/> Connected: {formatDate(integration.connected_at)}
        </div>
      )}

      {/* Config preview */}
      {isConnected && integration.config && Object.keys(integration.config).length > 0 && (
        <div style={{ padding:'10px 12px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}` }}>
          {Object.entries(integration.config).filter(([,v]) => v).slice(0, 2).map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:L.textMuted, marginBottom:2 }}>
              <span style={{ textTransform:'capitalize' }}>{k.replace(/_/g, ' ')}</span>
              <span style={{ fontFamily:'monospace', color:L.textSub }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Test result */}
      {thisResult && (
        <div style={{ padding:'10px 12px', borderRadius:L.radiusSm, background:thisResult.success ? 'rgba(10,185,138,0.08)' : 'rgba(239,68,68,0.08)', border:`1px solid ${thisResult.success ? 'rgba(10,185,138,0.2)' : 'rgba(239,68,68,0.2)'}`, fontSize:12, color:thisResult.success ? ACCENT : '#EF4444', display:'flex', alignItems:'flex-start', gap:8 }}>
          {thisResult.success ? <CheckCircle size={13} style={{ flexShrink:0, marginTop:1 }}/> : <AlertCircle size={13} style={{ flexShrink:0, marginTop:1 }}/>}
          <span>{thisResult.message}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:'auto' }}>
        {!isConnected ? (
          <button onClick={() => onConnect(integration.provider)} disabled={isBusy}
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px', borderRadius:L.radiusSm, background:isBusy ? L.pageBg : ACCENT, color:isBusy ? L.textMuted : '#fff', border:'none', cursor:isBusy ? 'not-allowed' : 'pointer', fontSize:12, fontWeight:600, fontFamily:L.font, boxShadow:isBusy ? 'none' : '0 2px 8px rgba(10,185,138,0.25)' }}>
            <Link size={12}/>{isBusy ? 'Connecting...' : 'Connect'}
          </button>
        ) : (
          <>
            <button onClick={() => onSync(integration.provider)} disabled={isBusy}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px', borderRadius:L.radiusSm, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', color:ACCENT, cursor:isBusy ? 'not-allowed' : 'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(10,185,138,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(10,185,138,0.08)'}>
              <RefreshCw size={12} style={{ animation:isBusy ? 'spin 1s linear infinite' : 'none' }}/>
              {isBusy ? 'Syncing...' : 'Sync'}
            </button>
            {isTestable && (
              <button onClick={() => onTest(integration.provider)} disabled={isBusy}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'9px 12px', borderRadius:L.radiusSm, background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)', color:'#8B5CF6', cursor:isBusy ? 'not-allowed' : 'pointer', fontSize:12, fontFamily:L.font, fontWeight:600 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.08)'}>
                <FlaskConical size={12}/> Test
              </button>
            )}
            <button onClick={() => onDisconnect(integration.provider)} disabled={isBusy}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'9px 12px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:isBusy ? 'not-allowed' : 'pointer', fontSize:12, fontFamily:L.font }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#FCA5A5'; e.currentTarget.style.color = '#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = L.border; e.currentTarget.style.color = L.textMuted; }}>
              <Unlink size={12}/> Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function Integrations() {
  const [integrations,  setIntegrations]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const [setupModal,    setSetupModal]    = useState(null);
  const [testResult,    setTestResult]    = useState(null);
  const { setPageContext } = useAI();
  const isMobile = useIsMobile();

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/integrations/');
      const list = Array.isArray(data) ? data : [];
      setIntegrations(list);
      setPageContext('integrations', { page:'integrations', connected:list.filter(i => i.status === 'connected').length, total:list.length });
    } catch (e) {
      setError('Could not load integrations: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 5000); };

  const handleConnect    = (provider) => { setTestResult(null); setSetupModal(provider); };
  const handleSaveConfig = async (provider, config) => {
    setActionLoading(provider);
    try { const data = await apiFetch(`/integrations/${provider}/connect`, { method:'POST', body:JSON.stringify({ config }) }); showSuccess(data.message || `${provider} connected`); await load(); }
    finally { setActionLoading(null); }
  };
  const handleDisconnect = async (provider) => {
    setActionLoading(provider); setTestResult(null); setError('');
    try { const data = await apiFetch(`/integrations/${provider}/disconnect`, { method:'POST' }); showSuccess(data.message || `${provider} disconnected`); await load(); }
    catch (e) { setError(e.message); } finally { setActionLoading(null); }
  };
  const handleSync = async (provider) => {
    setActionLoading(provider); setError('');
    try { const data = await apiFetch(`/integrations/${provider}/sync`, { method:'POST' }); showSuccess(data.message || `${provider} synced`); await load(); }
    catch (e) { setError(e.message); } finally { setActionLoading(null); }
  };
  const handleTest = async (provider) => {
    setActionLoading(provider); setTestResult(null); setError('');
    try { const data = await apiFetch(`/integrations/${provider}/test`, { method:'POST' }); setTestResult({ provider, success:data.success, message:data.message }); if (data.success) showSuccess(data.message); }
    catch (e) { setTestResult({ provider, success:false, message:e.message }); }
    finally { setActionLoading(null); }
  };

  const connected = integrations.filter(i => i.status === 'connected').length;
  const offline   = integrations.filter(i => i.status === 'offline').length;
  const pad       = isMobile ? '16px' : '24px 28px';

  return (
    <div style={page}>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* Top bar */}
      <div style={{
        ...topBar,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems:    isMobile ? 'flex-start' : 'center',
        gap:           isMobile ? 8 : 0,
        padding:       isMobile ? '16px' : undefined,
      }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Integrations</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Connect your tools and automate your workflow</div>
        </div>
        {!loading && (
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ fontSize:12, color:ACCENT, fontWeight:600 }}>{connected} connected</div>
            <div style={{ fontSize:12, color:L.textMuted }}>{offline} offline</div>
          </div>
        )}
      </div>

      <div style={{ padding: pad, overflow:'hidden', boxSizing:'border-box' }}>

        {success && (
          <div style={{ padding:'12px 16px', borderRadius:L.radiusSm, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', color:ACCENT, fontSize:13, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <CheckCircle size={14}/> {success}
          </div>
        )}
        {error && (
          <div style={{ padding:'12px 16px', borderRadius:L.radiusSm, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', fontSize:13, marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}><AlertCircle size={14}/>{error}</div>
            <button onClick={() => setError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444' }}><X size={14}/></button>
          </div>
        )}

        {/* Summary cards — 3 cols always, smaller on mobile */}
        {!loading && integrations.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: isMobile ? 8 : 14, marginBottom: isMobile ? 16 : 24 }}>
            {[
              { label:'Total',     value:integrations.length, color:L.text   },
              { label:'Connected', value:connected,           color:ACCENT    },
              { label:'Offline',   value:offline,             color:'#94A3B8' },
            ].map(s => (
              <div key={s.label} style={{ ...card, padding: isMobile ? '12px 14px' : '16px 20px' }}>
                <div style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:6 }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? 20 : 24, fontWeight:700, color:s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ textAlign:'center', padding:60, color:L.textMuted }}>
            <RefreshCw size={28} color={ACCENT} style={{ animation:'spin 1s linear infinite', marginBottom:12 }}/>
            <div style={{ fontSize:13 }}>Loading integrations...</div>
          </div>
        )}

        {/* Integration cards — 1 col on mobile, auto on desktop */}
        {!loading && (
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px,1fr))', gap: isMobile ? 12 : 16, overflow:'hidden' }}>
            {integrations.map(integration => (
              <IntegrationCard
                key={integration.provider}
                integration={integration}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onSync={handleSync}
                onTest={handleTest}
                loading={actionLoading}
                testResult={testResult}
              />
            ))}
          </div>
        )}

        {!loading && integrations.length === 0 && !error && (
          <div style={{ ...card, padding: isMobile ? 40 : 60, textAlign:'center' }}>
            <div style={{ width:64, height:64, borderRadius:18, background:'rgba(10,185,138,0.08)', border:'1px solid rgba(10,185,138,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <PlugZap size={28} color={ACCENT}/>
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:L.text, marginBottom:8 }}>No integrations available</div>
            <div style={{ fontSize:13, color:L.textMuted }}>Check your backend connection and try refreshing.</div>
          </div>
        )}
      </div>

      {setupModal && <SetupModal provider={setupModal} onClose={() => setSetupModal(null)} onSave={handleSaveConfig}/>}
    </div>
  );
}