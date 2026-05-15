import React, { useState, useEffect } from 'react';
import {
  ArrowRight, ArrowLeft, CheckCircle, TrendingUp,
  Building2, Users, FileText, Receipt, Percent,
  RefreshCw, Package, Briefcase, Shield,
} from 'lucide-react';

const BASE    = 'https://api.getnovala.com/api/v1';
const DARK    = '#08090D';
const CARD    = '#111318';
const BORDER  = '#1E2128';
const MINT    = '#00FFB2';
const MINTDIM = 'rgba(0,255,178,0.12)';
const WHITE   = '#F1F5F9';
const MUTED   = '#64748B';
const FONT    = "'Inter', -apple-system, sans-serif";

const getToken = () => localStorage.getItem('token') || localStorage.getItem('access_token') || '';

const BUSINESS_TYPES = [
  { value: 'freelancer',      label: 'Freelancer',      icon: '🧑‍💻' },
  { value: 'sole_proprietor', label: 'Sole Proprietor', icon: '🏪' },
  { value: 'llc',             label: 'LLC',             icon: '🏢' },
  { value: 'corporation',     label: 'Corporation',     icon: '🏦' },
  { value: 'partnership',     label: 'Partnership',     icon: '🤝' },
  { value: 'startup',         label: 'Startup',         icon: '🚀' },
];

const INDUSTRIES = [
  'Technology', 'Retail', 'Healthcare', 'Construction',
  'Food & Beverage', 'Professional Services',
  'Real Estate', 'Education', 'Non-profit', 'Other',
];

const FEATURES = [
  { id: 'invoicing',   label: 'Invoicing',           icon: FileText,   desc: 'Create and send invoices',        soon: false },
  { id: 'bookkeeping', label: 'Bookkeeping',          icon: TrendingUp, desc: 'Automated transaction recording', soon: false },
  { id: 'expenses',    label: 'Expense Tracking',     icon: Receipt,    desc: 'Track and categorize expenses',   soon: false },
  { id: 'payroll',     label: 'Payroll',              icon: Users,      desc: 'Manage employee payments',        soon: false },
  { id: 'tax',         label: 'Tax Management',       icon: Percent,    desc: 'Track taxes and file returns',    soon: false },
  { id: 'recurring',   label: 'Recurring Revenue',    icon: RefreshCw,  desc: 'Automate recurring billing',      soon: true  },
  { id: 'documents',   label: 'Document Management',  icon: Package,    desc: 'Upload and extract documents',    soon: false },
  { id: 'team',        label: 'Team Collaboration',   icon: Briefcase,  desc: 'Invite and manage team members',  soon: false },
];

const TEAM_SIZES = [
  { value: '1',    label: 'Just me', sub: 'Solo founder'  },
  { value: '2-5',  label: '2 – 5',   sub: 'Small team'    },
  { value: '6-20', label: '6 – 20',  sub: 'Growing team'  },
  { value: '20+',  label: '20+',     sub: 'Large team'    },
];

function ProgressBar({ step, total }) {
  return (
    <div style={{ display:'flex', gap:6, marginBottom:36 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i < step ? MINT : BORDER, transition:'background 0.4s ease' }}/>
      ))}
    </div>
  );
}

function StepLabel({ current, total, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:700, color:MINT, letterSpacing:'0.12em', textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontSize:11, color:MUTED }}>{current} of {total}</div>
    </div>
  );
}

function PrimaryBtn({ onClick, disabled, children, fullWidth }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: fullWidth ? '100%' : 'auto',
      padding:'13px 24px',
      borderRadius:12,
      background: disabled ? '#1E2128' : MINT,
      color: disabled ? MUTED : DARK,
      border:'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize:14,
      fontWeight:700,
      fontFamily:FONT,
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      gap:8,
      transition:'all 0.15s',
      boxShadow: disabled ? 'none' : '0 4px 20px rgba(0,255,178,0.25)',
      flexShrink:0,
    }}>
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding:'13px 20px',
      borderRadius:12,
      background:'transparent',
      color:MUTED,
      border:'1px solid ' + BORDER,
      cursor:'pointer',
      fontSize:14,
      fontWeight:500,
      fontFamily:FONT,
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      gap:8,
      transition:'all 0.15s',
      flexShrink:0,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#334155'; e.currentTarget.style.color=WHITE; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.color=MUTED; }}
    >
      {children}
    </button>
  );
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:16 }}>
      <span style={{ fontSize:13, color:'#EF4444' }}>{msg}</span>
    </div>
  );
}

export default function Onboarding({ onComplete }) {
  const [step,        setStep]        = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [bizType,     setBizType]     = useState('');
  const [industry,    setIndustry]    = useState('');
  const [features,    setFeatures]    = useState([]);
  const [teamSize,    setTeamSize]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  const firstName = localStorage.getItem('first_name') ||
    (() => {
      const raw    = localStorage.getItem('user_name') || localStorage.getItem('user_email') || '';
      const base   = raw.includes('@') ? raw.split('@')[0] : raw;
      const strip  = base.replace(/\d+$/, '');
      const cap    = strip.charAt(0).toUpperCase() + strip.slice(1);
      const match  = cap.match(/^[A-Z][a-z]+/);
      return match ? match[0] : cap || 'there';
    })();

  useEffect(() => {
    const check = async () => {
      try {
        const res  = await fetch(BASE + '/onboarding/status', { headers: { Authorization: 'Bearer ' + getToken() } });
        const data = await res.json();
        if (data.onboarding_completed) { onComplete(); return; }
        if (data.company_name) setCompanyName(data.company_name);
      } catch (e) {}
    };
    check();
  }, []);

  const save = async (s, completed = false, extra = {}) => {
    try {
      await fetch(BASE + '/onboarding/update', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: s, completed, company_name: companyName, ...extra }),
      });
    } catch (e) {}
  };

  const toggleFeature = (id) => {
    setFeatures(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Step 1 — company name required
  const handleStep1 = async () => {
    if (!companyName.trim()) {
      setError('Please enter your company name to continue.');
      return;
    }
    setError('');
    setSaving(true);
    localStorage.setItem('company_name', companyName);
    await save(2, false, { company_name: companyName });
    setSaving(false);
    setStep(2);
  };

  // Step 2 — business type AND industry required
  const handleStep2 = async () => {
    if (!bizType && !industry) {
      setError('Please select your business type and industry to continue.');
      return;
    }
    if (!bizType) {
      setError('Please select your business type to continue.');
      return;
    }
    if (!industry) {
      setError('Please select your industry to continue.');
      return;
    }
    setError('');
    setSaving(true);
    await save(3, false, { business_type: bizType, industry });
    setSaving(false);
    setStep(3);
  };

  // Step 3 — features required to Continue, Skip bypasses
  const handleStep3Continue = async () => {
    if (features.length === 0) {
      setError('Please select at least one feature to continue, or press Skip.');
      return;
    }
    setError('');
    setSaving(true);
    await save(4, false, { features_selected: features });
    setSaving(false);
    setStep(4);
  };

  const handleStep3Skip = async () => {
    setError('');
    await save(4);
    setStep(4);
  };

  // Step 4 — team size, Skip allowed
  const handleStep4Continue = async () => {
    if (!teamSize) {
      setError('Please select your team size to continue, or press Skip.');
      return;
    }
    setError('');
    setSaving(true);
    await save(5, false, { team_size: teamSize });
    setSaving(false);
    setStep(5);
  };

  const handleStep4Skip = async () => {
    setError('');
    await save(5);
    setStep(5);
  };

  const handleComplete = async () => {
    setSaving(true);
    await save(6, true);
    localStorage.setItem('onboarding_completed', 'true');
    setSaving(false);
    onComplete();
  };

  const inputStyle = {
    width:'100%',
    padding:'13px 16px',
    borderRadius:10,
    border:'1px solid ' + BORDER,
    background:'#0D0F14',
    color:WHITE,
    fontSize:14,
    fontFamily:FONT,
    outline:'none',
    boxSizing:'border-box',
    transition:'border-color 0.15s',
  };

  // Clear error when user makes a change
  const clearError = () => { if (error) setError(''); };

  return (
    <div style={{ minHeight:'100vh', background:DARK, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT, padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:560 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:MINT, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TrendingUp size={18} color={DARK}/>
            </div>
            <span style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>
              No<span style={{ color:MINT }}>vala</span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:CARD, borderRadius:20, padding:'36px', border:'1px solid '+BORDER, boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>

          <ProgressBar step={step} total={6}/>

          {/* ── STEP 1 — Welcome + Company Name ── */}
          {step === 1 && (
            <div>
              <StepLabel current={1} total={6} label="Welcome"/>
              <div style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:8, letterSpacing:'-0.03em', lineHeight:1.2 }}>
                Welcome to Novala,<br/>
                <span style={{ color:MINT }}>{firstName}!</span>
              </div>
              <div style={{ fontSize:14, color:MUTED, marginBottom:28, lineHeight:1.7 }}>
                Let's get your workspace set up — it takes less than 2 minutes.
              </div>

              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>
                  Company Name <span style={{ color:'#EF4444' }}>*</span>
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder="Acme Inc."
                  value={companyName}
                  onChange={e => { setCompanyName(e.target.value); clearError(); }}
                  onKeyDown={e => e.key === 'Enter' && handleStep1()}
                  style={{ ...inputStyle, borderColor: error ? '#EF4444' : BORDER }}
                  onFocus={e => e.target.style.borderColor = error ? '#EF4444' : MINT}
                  onBlur={e => e.target.style.borderColor = error ? '#EF4444' : BORDER}
                />
              </div>

              <ErrorMsg msg={error}/>

              {/* Feature preview */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:28 }}>
                {[
                  { icon:'📊', text:'Live financial dashboard'     },
                  { icon:'🤖', text:'AI document extraction'       },
                  { icon:'💸', text:'Invoicing & bill pay'         },
                  { icon:'🔒', text:'Bank-grade security'          },
                  { icon:'📈', text:'P&L and cash flow reports'    },
                  { icon:'🔁', text:'Recurring revenue automation' },
                ].map(f => (
                  <div key={f.text} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', background:'#0D0F14', borderRadius:10, border:'1px solid '+BORDER }}>
                    <span style={{ fontSize:15 }}>{f.icon}</span>
                    <span style={{ fontSize:12, color:'#94A3B8' }}>{f.text}</span>
                  </div>
                ))}
              </div>

              <PrimaryBtn onClick={handleStep1} disabled={saving} fullWidth>
                {saving ? 'Saving...' : 'Get started'} <ArrowRight size={16}/>
              </PrimaryBtn>
            </div>
          )}

          {/* ── STEP 2 — Business Profile ── */}
          {step === 2 && (
            <div>
              <StepLabel current={2} total={6} label="Business Profile"/>
              <div style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:8, letterSpacing:'-0.02em' }}>
                Tell us about your business
              </div>
              <div style={{ fontSize:14, color:MUTED, marginBottom:24, lineHeight:1.6 }}>
                This helps us personalize your dashboard and reports.
              </div>

              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>
                  Business Type <span style={{ color:'#EF4444' }}>*</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {BUSINESS_TYPES.map(t => (
                    <div key={t.value} onClick={() => { setBizType(t.value); clearError(); }}
                      style={{ padding:'12px 10px', borderRadius:10, border:'1px solid '+(bizType===t.value?MINT:BORDER), background:bizType===t.value?MINTDIM:'#0D0F14', cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}>
                      <div style={{ fontSize:20, marginBottom:6 }}>{t.icon}</div>
                      <div style={{ fontSize:12, fontWeight:600, color:bizType===t.value?MINT:WHITE }}>{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>
                  Industry <span style={{ color:'#EF4444' }}>*</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {INDUSTRIES.map(ind => (
                    <div key={ind} onClick={() => { setIndustry(ind); clearError(); }}
                      style={{ padding:'8px 14px', borderRadius:999, border:'1px solid '+(industry===ind?MINT:BORDER), background:industry===ind?MINTDIM:'transparent', cursor:'pointer', fontSize:12, fontWeight:industry===ind?600:400, color:industry===ind?MINT:MUTED, transition:'all 0.15s' }}>
                      {ind}
                    </div>
                  ))}
                </div>
              </div>

              <ErrorMsg msg={error}/>

              <div style={{ display:'flex', gap:10 }}>
                <GhostBtn onClick={() => { setError(''); setStep(1); }}>
                  <ArrowLeft size={15}/> Back
                </GhostBtn>
                <PrimaryBtn onClick={handleStep2} disabled={saving}>
                  {saving ? 'Saving...' : 'Continue'} <ArrowRight size={15}/>
                </PrimaryBtn>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Features ── */}
          {step === 3 && (
            <div>
              <StepLabel current={3} total={6} label="Your Goals"/>
              <div style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:8, letterSpacing:'-0.02em' }}>
                What do you want to do with Novala?
              </div>
              <div style={{ fontSize:14, color:MUTED, marginBottom:20, lineHeight:1.6 }}>
                Select everything that applies. We will tailor your experience.
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                {FEATURES.map(f => {
                  const Icon     = f.icon;
                  const selected = features.includes(f.id);
                  return (
                    <div key={f.id}
                      onClick={() => { if (!f.soon) { toggleFeature(f.id); clearError(); } }}
                      style={{ padding:'14px', borderRadius:12, border:'1px solid '+(selected?MINT:BORDER), background:selected?MINTDIM:'#0D0F14', cursor:f.soon?'default':'pointer', transition:'all 0.15s', position:'relative', opacity:f.soon?0.5:1 }}>
                      {f.soon && (
                        <div style={{ position:'absolute', top:8, right:8, fontSize:9, fontWeight:700, color:DARK, background:MINT, padding:'2px 6px', borderRadius:20 }}>SOON</div>
                      )}
                      <div style={{ width:30, height:30, borderRadius:8, background:selected?'rgba(0,255,178,0.15)':'#1E2128', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
                        <Icon size={14} color={selected?MINT:'#64748B'}/>
                      </div>
                      <div style={{ fontSize:12, fontWeight:600, color:selected?MINT:WHITE, marginBottom:3 }}>{f.label}</div>
                      <div style={{ fontSize:11, color:MUTED, lineHeight:1.4 }}>{f.desc}</div>
                    </div>
                  );
                })}
              </div>

              <ErrorMsg msg={error}/>

              <div style={{ display:'flex', gap:10 }}>
                <GhostBtn onClick={() => { setError(''); setStep(2); }}>
                  <ArrowLeft size={15}/> Back
                </GhostBtn>
                <GhostBtn onClick={handleStep3Skip}>
                  Skip
                </GhostBtn>
                <PrimaryBtn onClick={handleStep3Continue} disabled={saving}>
                  {saving ? 'Saving...' : 'Continue'} <ArrowRight size={15}/>
                </PrimaryBtn>
              </div>
            </div>
          )}

          {/* ── STEP 4 — Team Size ── */}
          {step === 4 && (
            <div>
              <StepLabel current={4} total={6} label="Your Team"/>
              <div style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:8, letterSpacing:'-0.02em' }}>
                How big is your team?
              </div>
              <div style={{ fontSize:14, color:MUTED, marginBottom:24, lineHeight:1.6 }}>
                This helps us set up the right collaboration features for you.
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
                {TEAM_SIZES.map(t => (
                  <div key={t.value}
                    onClick={() => { setTeamSize(t.value); clearError(); }}
                    style={{ padding:'20px', borderRadius:12, border:'1px solid '+(teamSize===t.value?MINT:BORDER), background:teamSize===t.value?MINTDIM:'#0D0F14', cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}>
                    <div style={{ fontSize:22, fontWeight:800, color:teamSize===t.value?MINT:WHITE, marginBottom:4 }}>{t.label}</div>
                    <div style={{ fontSize:11, color:MUTED }}>{t.sub}</div>
                  </div>
                ))}
              </div>

              <ErrorMsg msg={error}/>

              <div style={{ display:'flex', gap:10 }}>
                <GhostBtn onClick={() => { setError(''); setStep(3); }}>
                  <ArrowLeft size={15}/> Back
                </GhostBtn>
                <GhostBtn onClick={handleStep4Skip}>
                  Skip
                </GhostBtn>
                <PrimaryBtn onClick={handleStep4Continue} disabled={saving}>
                  {saving ? 'Saving...' : 'Continue'} <ArrowRight size={15}/>
                </PrimaryBtn>
              </div>
            </div>
          )}

          {/* ── STEP 5 — Connect Bank ── */}
          {step === 5 && (
            <div>
              <StepLabel current={5} total={6} label="Bank Connection"/>
              <div style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:8, letterSpacing:'-0.02em' }}>
                Connect your bank account
              </div>
              <div style={{ fontSize:14, color:MUTED, marginBottom:24, lineHeight:1.6 }}>
                Sync your transactions automatically. We use 256-bit encryption — your credentials are never stored.
              </div>

              <div style={{ padding:'28px 24px', borderRadius:14, border:'1px dashed '+BORDER, background:'#0D0F14', textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:44, marginBottom:14 }}>🏦</div>
                <div style={{ fontSize:15, fontWeight:700, color:WHITE, marginBottom:8 }}>Bank connection coming soon</div>
                <div style={{ fontSize:13, color:MUTED, marginBottom:16, lineHeight:1.6 }}>
                  We are integrating with Plaid to support 10,000+ banks. You can connect your bank from Settings once available.
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, background:MINTDIM, border:'1px solid rgba(0,255,178,0.2)' }}>
                  <Shield size={12} color={MINT}/>
                  <span style={{ fontSize:11, fontWeight:600, color:MINT }}>256-bit encrypted · Read-only access</span>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <PrimaryBtn onClick={() => { save(6); setStep(6); }} fullWidth>
                  Continue — I'll connect my bank later <ArrowRight size={15}/>
                </PrimaryBtn>
                <GhostBtn onClick={() => { setError(''); setStep(4); }}>
                  <ArrowLeft size={15}/> Back
                </GhostBtn>
              </div>
            </div>
          )}

          {/* ── STEP 6 — Done ── */}
          {step === 6 && (
            <div style={{ textAlign:'center' }}>
              <StepLabel current={6} total={6} label="All Done"/>

              <div style={{ width:80, height:80, borderRadius:'50%', background:MINTDIM, border:'2px solid '+MINT, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:'0 0 40px rgba(0,255,178,0.2)' }}>
                <CheckCircle size={40} color={MINT}/>
              </div>

              <div style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:10, letterSpacing:'-0.03em' }}>
                You are all set,{' '}
                <span style={{ color:MINT }}>{companyName || firstName}!</span>
              </div>
              <div style={{ fontSize:14, color:MUTED, marginBottom:28, lineHeight:1.7 }}>
                Your Novala workspace is ready. Your dashboard is waiting for you.
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:32, textAlign:'left' }}>
                {[
                  { icon:'📊', label:'Live Dashboard',        desc:'Real-time financial overview'      },
                  { icon:'🤖', label:'AI Document Extraction',desc:'Upload receipts and invoices'       },
                  { icon:'💸', label:'Invoicing',             desc:'Create and send invoices'           },
                  { icon:'📈', label:'Financial Reports',     desc:'P&L, Balance Sheet, Cash Flow'     },
                  { icon:'🔁', label:'Recurring Revenue',     desc:'Coming soon — on your wishlist'    },
                  { icon:'👥', label:'Team Access',           desc:'Add your team from Settings'       },
                ].map(f => (
                  <div key={f.label} style={{ padding:'12px 14px', borderRadius:10, background:'#0D0F14', border:'1px solid '+BORDER, display:'flex', alignItems:'flex-start', gap:10 }}>
                    <span style={{ fontSize:18 }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:WHITE, marginBottom:2 }}>{f.label}</div>
                      <div style={{ fontSize:10, color:MUTED }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <PrimaryBtn onClick={handleComplete} disabled={saving} fullWidth>
                <TrendingUp size={17}/>
                {saving ? 'Loading your dashboard...' : 'Go to my dashboard'}
              </PrimaryBtn>
            </div>
          )}

        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#334155' }}>
          Step {step} of 6 · Progress saved automatically
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        * { box-sizing: border-box; }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  );
}