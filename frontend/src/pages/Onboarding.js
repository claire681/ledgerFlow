import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, Upload, Link, CheckCircle, ArrowRight,
  Sparkles, X, FileText, Zap, ChevronRight,
} from 'lucide-react';

const BASE    = 'https://api.getnovala.com/api/v1';
const ACCENT  = '#0AB98A';
const GRAD    = 'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)';
const getToken = () => localStorage.getItem('token') || localStorage.getItem('access_token') || '';

const STEPS = [
  { id: 1, label: 'Company',      icon: Building2 },
  { id: 2, label: 'Upload',       icon: Upload    },
  { id: 3, label: 'Integrations', icon: Link      },
  { id: 4, label: 'Done',         icon: CheckCircle },
];

const INTEGRATIONS = [
  { id: 'stripe',       name: 'Stripe',      desc: 'Payment processing',    color: '#635BFF', emoji: '💳' },
  { id: 'quickbooks',   name: 'QuickBooks',  desc: 'Accounting sync',       color: '#2CA01C', emoji: '📊' },
  { id: 'slack',        name: 'Slack',       desc: 'Team notifications',    color: '#E01E5A', emoji: '💬' },
  { id: 'google_drive', name: 'Google Drive',desc: 'Document storage',      color: '#4285F4', emoji: '☁️' },
];

function StepDot({ step, current, completed }) {
  const Icon    = step.icon;
  const isDone  = completed >= step.id;
  const isActive = current === step.id;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: isDone ? ACCENT : isActive ? 'rgba(10,185,138,0.12)' : '#F1F5F9',
        border: `2px solid ${isDone || isActive ? ACCENT : '#E2E8F0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease',
      }}>
        {isDone
          ? <CheckCircle size={18} color="#fff"/>
          : <Icon size={16} color={isActive ? ACCENT : '#94A3B8'}/>}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: isActive ? ACCENT : '#94A3B8', letterSpacing: '0.05em' }}>
        {step.label}
      </div>
    </div>
  );
}

export default function Onboarding({ onComplete }) {
  const [step,        setStep]        = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [file,        setFile]        = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [connected,   setConnected]   = useState([]);
  const [dragOver,    setDragOver]    = useState(false);
  const fileRef = useRef(null);

  // Load saved progress on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${BASE}/onboarding/status`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        if (data.onboarding_completed) { onComplete(); return; }
        if (data.onboarding_step > 0)  setStep(data.onboarding_step);
        if (data.company_name)         setCompanyName(data.company_name);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const saveProgress = async (s, completed = false, name = companyName) => {
    try {
      await fetch(`${BASE}/onboarding/update`, {
        method:  'POST',
        headers: { Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body:    JSON.stringify({ step: s, completed, company_name: name }),
      });
    } catch (e) { console.error(e); }
  };

  const next = async (skipSave = false) => {
    const nextStep = step + 1;
    if (!skipSave) await saveProgress(nextStep);
    setStep(nextStep);
  };

  const skip = () => next(false);

  const handleComplete = async () => {
    setSaving(true);
    await saveProgress(4, true);
    setSaving(false);
    onComplete();
  };

  const handleStep1 = async () => {
    if (!companyName.trim()) return;
    setSaving(true);
    await saveProgress(2, false, companyName);
    setSaving(false);
    setStep(2);
  };

  const handleFileUpload = async () => {
    if (!file) { skip(); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await fetch(`${BASE}/documents/upload?txn_type=expense`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body:    formData,
      });
    } catch (e) { console.error(e); }
    await saveProgress(3);
    setSaving(false);
    setStep(3);
  };

  const toggleConnect = (id) => {
    setConnected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div style={{
      minHeight:      '100vh',
      background:     'linear-gradient(135deg, #F0FDF9 0%, #EFF6FF 100%)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontFamily:     "'Inter', -apple-system, sans-serif",
      padding:        '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(10,185,138,0.3)' }}>
              <Sparkles size={20} color="#fff"/>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              No<span style={{ color: ACCENT }}>vala</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, marginBottom: 40 }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <StepDot step={s} current={step} completed={step - 1}/>
              {i < STEPS.length - 1 && (
                <div style={{ width: 60, height: 2, background: step > s.id ? ACCENT : '#E2E8F0', margin: '0 4px', marginBottom: 22, transition: 'background 0.3s ease' }}/>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: 40, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #F1F5F9' }}>

          {/* ── Step 1: Company Profile ── */}
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Building2 size={26} color={ACCENT}/>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.02em' }}>
                Welcome to Novala 👋
              </div>
              <div style={{ fontSize: 15, color: '#64748B', marginBottom: 32, lineHeight: 1.6 }}>
                Let's get your account set up in under 2 minutes. First, what's your company called?
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Company Name *
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder="Acme Inc."
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && companyName.trim() && handleStep1()}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #E2E8F0', fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s', color: '#0F172A' }}
                  onFocus={e => e.target.style.borderColor = ACCENT}
                  onBlur={e  => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <button
                onClick={handleStep1}
                disabled={!companyName.trim() || saving}
                style={{ width: '100%', padding: '14px', borderRadius: 12, background: !companyName.trim() || saving ? '#E2E8F0' : GRAD, color: !companyName.trim() || saving ? '#94A3B8' : '#fff', border: 'none', cursor: !companyName.trim() || saving ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: companyName.trim() ? '0 4px 14px rgba(10,185,138,0.3)' : 'none', transition: 'all 0.2s' }}>
                {saving ? 'Saving...' : 'Continue'} <ArrowRight size={16}/>
              </button>
            </div>
          )}

          {/* ── Step 2: Upload Document ── */}
          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Upload size={26} color={ACCENT}/>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.02em' }}>
                Upload your first document
              </div>
              <div style={{ fontSize: 15, color: '#64748B', marginBottom: 28, lineHeight: 1.6 }}>
                Drop an invoice, receipt or bank statement. AI will extract all the data automatically.
              </div>

              {/* Drop zone */}
              <div
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? ACCENT : file ? ACCENT : '#E2E8F0'}`, borderRadius: 16, padding: '36px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver || file ? 'rgba(10,185,138,0.04)' : '#FAFAFA', marginBottom: 20, transition: 'all 0.2s' }}
              >
                <input ref={fileRef} type="file" accept=".pdf,.csv,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])}/>
                {file ? (
                  <div>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(10,185,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <FileText size={22} color={ACCENT}/>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: ACCENT }}>Ready to upload ✓</div>
                    <button onClick={e => { e.stopPropagation(); setFile(null); }} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <X size={12}/> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Upload size={22} color="#94A3B8"/>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Drop a file here or click to browse</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>PDF, CSV, PNG, JPG supported</div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleFileUpload} disabled={saving}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, background: saving ? '#E2E8F0' : GRAD, color: saving ? '#94A3B8' : '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(10,185,138,0.3)' }}>
                  {saving ? 'Uploading...' : file ? <><Zap size={15}/> Upload & Continue</> : <><ArrowRight size={15}/> Continue</>}
                </button>
                {!file && (
                  <button onClick={skip} style={{ padding: '13px 20px', borderRadius: 12, background: 'transparent', border: '2px solid #E2E8F0', color: '#94A3B8', cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                    Skip
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Integrations ── */}
          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Link size={26} color={ACCENT}/>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.02em' }}>
                Connect your tools
              </div>
              <div style={{ fontSize: 15, color: '#64748B', marginBottom: 28, lineHeight: 1.6 }}>
                Connect your favourite tools to automate your workflow. You can always do this later.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {INTEGRATIONS.map(intg => {
                  const isConnected = connected.includes(intg.id);
                  return (
                    <div key={intg.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: `2px solid ${isConnected ? ACCENT : '#E2E8F0'}`, background: isConnected ? 'rgba(10,185,138,0.04)' : '#FAFAFA', transition: 'all 0.2s', cursor: 'pointer' }}
                      onClick={() => toggleConnect(intg.id)}>
                      <div style={{ fontSize: 28, flexShrink: 0 }}>{intg.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{intg.name}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{intg.desc}</div>
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isConnected ? ACCENT : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
                        {isConnected
                          ? <CheckCircle size={16} color="#fff"/>
                          : <ChevronRight size={14} color="#94A3B8"/>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { saveProgress(4); setStep(4); }}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, background: GRAD, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(10,185,138,0.3)' }}>
                  {connected.length > 0 ? `Connect ${connected.length} & Continue` : 'Continue'} <ArrowRight size={15}/>
                </button>
                <button onClick={() => { saveProgress(4); setStep(4); }}
                  style={{ padding: '13px 20px', borderRadius: 12, background: 'transparent', border: '2px solid #E2E8F0', color: '#94A3B8', cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Done ── */}
          {step === 4 && (
            <div style={{ animation: 'fadeIn 0.3s ease', textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 12, letterSpacing: '-0.02em' }}>
                You're all set, {companyName || 'there'}!
              </div>
              <div style={{ fontSize: 15, color: '#64748B', marginBottom: 32, lineHeight: 1.6 }}>
                Your Novala account is ready. AI is working in the background to analyze your finances and prepare your first briefing.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
                {[
                  { emoji: '🤖', label: 'AI Briefings',    desc: 'Daily financial summary' },
                  { emoji: '📊', label: 'Smart Dashboard',  desc: 'Real-time insights'      },
                  { emoji: '📄', label: 'Auto Invoicing',   desc: 'Create & track invoices' },
                  { emoji: '💰', label: 'Tax Estimates',    desc: 'Always know what you owe' },
                ].map(f => (
                  <div key={f.label} style={{ padding: '16px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #F1F5F9', textAlign: 'left' }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{f.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{f.desc}</div>
                  </div>
                ))}
              </div>

              <button onClick={handleComplete} disabled={saving}
                style={{ width: '100%', padding: '16px', borderRadius: 12, background: saving ? '#E2E8F0' : GRAD, color: saving ? '#94A3B8' : '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 800, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 20px rgba(10,185,138,0.35)', letterSpacing: '-0.01em' }}>
                <Sparkles size={18}/> {saving ? 'Loading...' : 'Go to My Dashboard'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#94A3B8' }}>
          Step {step} of 4 · Your progress is saved automatically
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
