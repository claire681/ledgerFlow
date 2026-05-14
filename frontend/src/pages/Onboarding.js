import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, Upload, Link, CheckCircle, ArrowRight,
  X, FileText, Zap, ChevronRight, TrendingUp,
  Users, Shield, BarChart2, CreditCard, ArrowLeft,
} from 'lucide-react';

const BASE   = 'https://api.getnovala.com/api/v1';
const ACCENT = '#0AB98A';
const FONT   = "'Inter', -apple-system, sans-serif";

const getToken = () => localStorage.getItem('token') || localStorage.getItem('access_token') || '';

const STEPS = [
  { id: 1, label: 'Company',      icon: Building2   },
  { id: 2, label: 'Business',     icon: TrendingUp  },
  { id: 3, label: 'Team',         icon: Users       },
  { id: 4, label: 'Upload',       icon: Upload      },
  { id: 5, label: 'Integrations', icon: Link        },
  { id: 6, label: 'Done',         icon: CheckCircle },
];

const INDUSTRIES = [
  'Retail', 'Technology', 'Healthcare', 'Construction',
  'Food & Beverage', 'Professional Services', 'Manufacturing',
  'Real Estate', 'Education', 'Non-profit', 'Other',
];

const BUSINESS_SIZES = [
  { label: 'Just me', value: '1'      },
  { label: '2-10',    value: '2-10'   },
  { label: '11-50',   value: '11-50'  },
  { label: '51-200',  value: '51-200' },
  { label: '200+',    value: '200+'   },
];

const INTEGRATIONS = [
  { id: 'stripe',       name: 'Stripe',       desc: 'Payment processing',  emoji: '💳' },
  { id: 'quickbooks',   name: 'QuickBooks',   desc: 'Accounting sync',     emoji: '📊' },
  { id: 'slack',        name: 'Slack',        desc: 'Team notifications',  emoji: '💬' },
  { id: 'google_drive', name: 'Google Drive', desc: 'Document storage',    emoji: '☁️' },
  { id: 'xero',         name: 'Xero',         desc: 'Accounting platform', emoji: '📈' },
  { id: 'paypal',       name: 'PayPal',       desc: 'Payment collection',  emoji: '💰' },
];

function StepDot({ step, current, completed }) {
  const Icon     = step.icon;
  const isDone   = completed >= step.id;
  const isActive = current === step.id;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: isDone ? ACCENT : isActive ? 'rgba(10,185,138,0.12)' : '#F1F5F9', border: '2px solid ' + (isDone || isActive ? ACCENT : '#E2E8F0'), display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}>
        {isDone ? <CheckCircle size={16} color="#fff" /> : <Icon size={14} color={isActive ? ACCENT : '#94A3B8'} />}
      </div>
      <div style={{ fontSize: 9, fontWeight: 600, color: isActive ? ACCENT : '#94A3B8', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
        {step.label}
      </div>
    </div>
  );
}

// ── Reusable styled button ────────────────────────────────────
function Btn({ onClick, disabled, children, variant = 'primary', style = {} }) {
  const base = {
    borderRadius: 12, fontSize: 14, fontWeight: 700,
    fontFamily: FONT, cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, border: 'none', transition: 'all 0.15s',
  };
  const variants = {
    primary:   { background: disabled ? '#E2E8F0' : ACCENT, color: disabled ? '#94A3B8' : '#fff', padding: '12px', flex: 1, boxShadow: disabled ? 'none' : '0 4px 14px rgba(10,185,138,0.25)' },
    secondary: { background: 'transparent', border: '2px solid #E2E8F0', color: '#94A3B8', padding: '12px 20px' },
    ghost:     { background: 'transparent', border: '2px solid #E2E8F0', color: '#94A3B8', padding: '12px 16px', fontSize: 13, fontWeight: 500 },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export default function Onboarding({ onComplete }) {
  const [step,        setStep]        = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [industry,    setIndustry]    = useState('');
  const [bizSize,     setBizSize]     = useState('');
  const [website,     setWebsite]     = useState('');
  const [phone,       setPhone]       = useState('');
  const [teamEmails,  setTeamEmails]  = useState(['']);
  const [file,        setFile]        = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [connected,   setConnected]   = useState([]);
  const [dragOver,    setDragOver]    = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(BASE + '/onboarding/status', { headers: { Authorization: 'Bearer ' + getToken() } });
        const data = await res.json();
        if (data.onboarding_completed) { onComplete(); return; }
        if (data.onboarding_step > 0)  setStep(data.onboarding_step);
        if (data.company_name)         setCompanyName(data.company_name);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const saveProgress = async (s, completed = false, extra = {}) => {
    try {
      await fetch(BASE + '/onboarding/update', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' },
        body:   JSON.stringify({ step: s, completed, company_name: companyName, ...extra }),
      });
    } catch (e) { console.error(e); }
  };

  const handleComplete = async () => {
    setSaving(true);
    await saveProgress(6, true);
    setSaving(false);
    onComplete();
  };

  const handleStep1 = async () => {
    if (!companyName.trim()) return;
    setSaving(true);
    localStorage.setItem('company_name', companyName);
    await saveProgress(2, false, { company_name: companyName });
    setSaving(false);
    setStep(2);
  };

  const handleStep2 = async () => {
    setSaving(true);
    await saveProgress(3, false, { industry, business_size: bizSize });
    setSaving(false);
    setStep(3);
  };

  const handleStep3 = async () => {
    setSaving(true);
    const validEmails = teamEmails.filter(e => e.trim() && e.includes('@'));
    if (validEmails.length > 0) {
      try {
        await Promise.allSettled(validEmails.map(email =>
          fetch(BASE + '/team/invite', {
            method:  'POST',
            headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, role: 'viewer' }),
          })
        ));
      } catch (e) { console.error(e); }
    }
    await saveProgress(4);
    setSaving(false);
    setStep(4);
  };

  const handleFileUpload = async () => {
    setSaving(true);
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        await fetch(BASE + '/documents/upload?txn_type=expense', {
          method:  'POST',
          headers: { Authorization: 'Bearer ' + getToken() },
          body:    formData,
        });
      } catch (e) { console.error(e); }
    }
    await saveProgress(5);
    setSaving(false);
    setStep(5);
  };

  const addTeamEmail  = ()      => setTeamEmails(p => [...p, '']);
  const updateEmail   = (i, v)  => setTeamEmails(p => p.map((e, idx) => idx === i ? v : e));
  const removeEmail   = (i)     => setTeamEmails(p => p.filter((_, idx) => idx !== i));

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '2px solid #E2E8F0', fontSize: 14, fontFamily: FONT,
    outline: 'none', boxSizing: 'border-box', color: '#0F172A',
    transition: 'border-color 0.15s',
  };

  const focusInput  = e => e.target.style.borderColor = ACCENT;
  const blurInput   = e => e.target.style.borderColor = '#E2E8F0';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F0FDF9 0%, #F8FAFC 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 600 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(10,185,138,0.3)' }}>
              <TrendingUp size={20} color="#fff" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              No<span style={{ color: ACCENT }}>vala</span>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#64748B' }}>Set up your account in a few minutes</div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, marginBottom: 32, overflowX: 'auto', paddingBottom: 4 }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <StepDot step={s} current={step} completed={step - 1} />
              {i < STEPS.length - 1 && (
                <div style={{ width: 40, height: 2, background: step > s.id ? ACCENT : '#E2E8F0', margin: '0 2px', marginBottom: 20, transition: 'background 0.3s ease', flexShrink: 0 }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 36, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #F1F5F9' }}>

          {/* ── STEP 1 — Company ── */}
          {step === 1 && (
            <div>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Building2 size={24} color={ACCENT} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.02em' }}>Welcome to Novala</div>
              <div style={{ fontSize: 14, color: '#64748B', marginBottom: 28, lineHeight: 1.6 }}>
                Let's get your financial management set up. First, what's your company called?
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Company Name *</div>
                <input autoFocus type="text" placeholder="Acme Inc." value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && companyName.trim() && handleStep1()}
                  style={inputStyle} onFocus={focusInput} onBlur={blurInput}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Phone Number (optional)</div>
                <input type="tel" placeholder="+1 (555) 000-0000" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={inputStyle} onFocus={focusInput} onBlur={blurInput}
                />
              </div>

              {/* Benefits */}
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 18px', marginBottom: 24, border: '1px solid #E8EDF3' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>What you get with Novala:</div>
                {[
                  { icon: BarChart2,  text: 'Real-time financial dashboards and reports'  },
                  { icon: FileText,   text: 'Smart document extraction and bookkeeping'   },
                  { icon: Shield,     text: 'Bank-grade security for your financial data' },
                  { icon: CreditCard, text: 'Invoice management and payment tracking'     },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(10,185,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={13} color={ACCENT} />
                      </div>
                      <span style={{ fontSize: 12, color: '#475569' }}>{item.text}</span>
                    </div>
                  );
                })}
              </div>

              <Btn onClick={handleStep1} disabled={!companyName.trim() || saving} style={{ width: '100%' }}>
                {saving ? 'Saving...' : 'Continue'} <ArrowRight size={16} />
              </Btn>
            </div>
          )}

          {/* ── STEP 2 — Business Details ── */}
          {step === 2 && (
            <div>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <TrendingUp size={24} color={ACCENT} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Tell us about your business</div>
              <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
                This helps us customize your dashboard and reports.
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Industry</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {INDUSTRIES.map(ind => (
                    <div key={ind} onClick={() => setIndustry(ind)}
                      style={{ padding: '9px 10px', borderRadius: 8, border: '2px solid ' + (industry === ind ? ACCENT : '#E2E8F0'), background: industry === ind ? 'rgba(10,185,138,0.06)' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: industry === ind ? 600 : 400, color: industry === ind ? ACCENT : '#334155', textAlign: 'center', transition: 'all 0.15s' }}>
                      {ind}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Company Size</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {BUSINESS_SIZES.map(size => (
                    <div key={size.value} onClick={() => setBizSize(size.value)}
                      style={{ padding: '9px 16px', borderRadius: 8, border: '2px solid ' + (bizSize === size.value ? ACCENT : '#E2E8F0'), background: bizSize === size.value ? 'rgba(10,185,138,0.06)' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: bizSize === size.value ? 600 : 400, color: bizSize === size.value ? ACCENT : '#334155', transition: 'all 0.15s' }}>
                      {size.label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Website (optional)</div>
                <input type="url" placeholder="https://yourcompany.com" value={website}
                  onChange={e => setWebsite(e.target.value)}
                  style={inputStyle} onFocus={focusInput} onBlur={blurInput}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="secondary" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</Btn>
                <Btn onClick={handleStep2} disabled={saving}>
                  {saving ? 'Saving...' : 'Continue'} <ArrowRight size={15} />
                </Btn>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Team ── */}
          {step === 3 && (
            <div>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Users size={24} color={ACCENT} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Invite your team</div>
              <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
                Invite colleagues, accountants or business partners. They will receive an email to join Novala.
              </div>

              {teamEmails.map((email, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input type="email" placeholder="colleague@company.com" value={email}
                    onChange={e => updateEmail(i, e.target.value)}
                    style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                    onFocus={focusInput} onBlur={blurInput}
                  />
                  {teamEmails.length > 1 && (
                    <button onClick={() => removeEmail(i)} style={{ padding: '0 12px', borderRadius: 10, border: '2px solid #E2E8F0', background: 'transparent', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}

              <button onClick={addTeamEmail} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: ACCENT, fontSize: 13, fontWeight: 600, marginBottom: 24, padding: 0, fontFamily: FONT }}>
                + Add another email
              </button>

              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(10,185,138,0.06)', border: '1px solid rgba(10,185,138,0.15)', marginBottom: 20, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                Team members will receive an invitation email with a link to join. New users will be asked to create an account, existing users will be taken directly to your workspace.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="secondary" onClick={() => setStep(2)}><ArrowLeft size={15} /> Back</Btn>
                <Btn onClick={handleStep3} disabled={saving}>
                  {saving ? 'Sending...' : 'Continue'} <ArrowRight size={15} />
                </Btn>
                <Btn variant="ghost" onClick={() => setStep(4)}>Skip</Btn>
              </div>
            </div>
          )}

          {/* ── STEP 4 — Upload ── */}
          {step === 4 && (
            <div>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Upload size={24} color={ACCENT} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Upload your first document</div>
              <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
                Drop an invoice, receipt or bank statement. Novala will extract and organize the data automatically.
              </div>

              <div
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                style={{ border: '2px dashed ' + (dragOver ? ACCENT : file ? ACCENT : '#E2E8F0'), borderRadius: 14, padding: '32px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver || file ? 'rgba(10,185,138,0.04)' : '#FAFAFA', marginBottom: 20, transition: 'all 0.2s' }}
              >
                <input ref={fileRef} type="file" accept=".pdf,.csv,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                {file ? (
                  <div>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: 'rgba(10,185,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <FileText size={20} color={ACCENT} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: ACCENT, marginBottom: 8 }}>Ready to upload</div>
                    <button onClick={e => { e.stopPropagation(); setFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <X size={12} /> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Upload size={20} color="#94A3B8" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Drop a file here or click to browse</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>PDF, CSV, PNG, JPG supported</div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="secondary" onClick={() => setStep(3)}><ArrowLeft size={15} /> Back</Btn>
                <Btn onClick={handleFileUpload} disabled={saving}>
                  {saving ? 'Uploading...' : file ? <><Zap size={14} /> Upload & Continue</> : <><ArrowRight size={14} /> Continue</>}
                </Btn>
              </div>
            </div>
          )}

          {/* ── STEP 5 — Integrations ── */}
          {step === 5 && (
            <div>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Link size={24} color={ACCENT} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Connect your tools</div>
              <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
                Connect your existing tools to streamline your workflow. You can always do this later.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {INTEGRATIONS.map(intg => {
                  const isConnected = connected.includes(intg.id);
                  return (
                    <div key={intg.id}
                      onClick={() => setConnected(p => p.includes(intg.id) ? p.filter(i => i !== intg.id) : [...p, intg.id])}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 12, border: '2px solid ' + (isConnected ? ACCENT : '#E2E8F0'), background: isConnected ? 'rgba(10,185,138,0.04)' : '#FAFAFA', transition: 'all 0.2s', cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: 26, flexShrink: 0 }}>{intg.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{intg.name}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{intg.desc}</div>
                      </div>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: isConnected ? ACCENT : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                        {isConnected ? <CheckCircle size={14} color="#fff" /> : <ChevronRight size={13} color="#94A3B8" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="secondary" onClick={() => setStep(4)}><ArrowLeft size={15} /> Back</Btn>
                <Btn onClick={() => { saveProgress(6); setStep(6); }}>
                  {connected.length > 0 ? 'Connect ' + connected.length + ' & Continue' : 'Continue'} <ArrowRight size={15} />
                </Btn>
                <Btn variant="ghost" onClick={() => { saveProgress(6); setStep(6); }}>Skip</Btn>
              </div>
            </div>
          )}

          {/* ── STEP 6 — Done ── */}
          {step === 6 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 10, letterSpacing: '-0.02em' }}>
                You're all set, {companyName || 'there'}!
              </div>
              <div style={{ fontSize: 14, color: '#64748B', marginBottom: 28, lineHeight: 1.7 }}>
                Your Novala account is ready. Your financial dashboard is being prepared with your data.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28, textAlign: 'left' }}>
                {[
                  { emoji: '📊', label: 'Smart Dashboard',     desc: 'Real-time financial overview'  },
                  { emoji: '📄', label: 'Document Manager',    desc: 'Upload and track documents'    },
                  { emoji: '💰', label: 'Invoice Tracking',    desc: 'Create and send invoices'      },
                  { emoji: '📈', label: 'Financial Reports',   desc: 'P&L, Balance Sheet, Cash Flow' },
                  { emoji: '👥', label: 'Team Access',         desc: 'Collaborate with your team'    },
                  { emoji: '🔒', label: 'Bank-grade Security', desc: 'Your data is always safe'      },
                ].map(f => (
                  <div key={f.label} style={{ padding: '14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{f.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{f.desc}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleComplete}
                disabled={saving}
                style={{ width: '100%', padding: '15px', borderRadius: 12, background: saving ? '#E2E8F0' : ACCENT, color: saving ? '#94A3B8' : '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 800, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 20px rgba(10,185,138,0.35)', letterSpacing: '-0.01em' }}
              >
                <TrendingUp size={18} /> {saving ? 'Loading...' : 'Go to My Dashboard'}
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#94A3B8' }}>
          Step {step} of 6 · Your progress is saved automatically
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}