 import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, CheckCircle, TrendingUp,
  Users, FileText, Receipt, Percent, Shield,
  RefreshCw, FolderOpen, Users2, BarChart3,
  BookOpen, Briefcase, Store, Building2, Landmark,
  Rocket, Eye, EyeOff, Phone,
} from 'lucide-react';
import { register } from '../services/api';

const DARK     = '#FFFFFF';
const DARK2    = '#0B3D3D';
const CARD     = '#FFFFFF';
const BORDER   = '#E2E8E8';
const MINT     = '#0F9599';
const MINTDIM  = 'rgba(15,149,153,0.12)';
const MINTGLOW = '0 0 0 3px rgba(15,149,153,0.15)';
const WHITE    = '#0E1A1A';
const MUTED    = '#5B6B6B';
const FONT     = "'Inter', -apple-system, sans-serif";

const BUSINESS_TYPES = [
  { value: 'freelancer',      label: 'Freelancer',      icon: Briefcase  },
  { value: 'sole_proprietor', label: 'Sole Proprietor', icon: Store      },
  { value: 'llc',             label: 'LLC',             icon: Building2  },
  { value: 'corporation',     label: 'Corporation',     icon: Landmark   },
  { value: 'partnership',     label: 'Partnership',     icon: Users      },
  { value: 'startup',         label: 'Startup',         icon: Rocket     },
];

const INDUSTRIES = [
  'Technology', 'Retail', 'Healthcare', 'Construction',
  'Food and Beverage', 'Professional Services',
  'Real Estate', 'Education', 'Nonprofit', 'Other',
];

const FEATURES = [
  { id: 'invoicing',   label: 'Invoicing',          icon: FileText,   desc: 'Create and send invoices',       soon: false },
  { id: 'bookkeeping', label: 'Bookkeeping',         icon: BookOpen,   desc: 'Automated transaction recording', soon: false },
  { id: 'expenses',    label: 'Expense Tracking',    icon: Receipt,    desc: 'Track and categorize expenses',  soon: false },
  { id: 'payroll',     label: 'Payroll',             icon: Users,      desc: 'Manage employee payments',       soon: false },
  { id: 'tax',         label: 'Tax Management',      icon: Percent,    desc: 'Track taxes and file returns',   soon: false },
  { id: 'recurring',   label: 'Recurring Revenue',   icon: RefreshCw,  desc: 'Automate recurring billing',     soon: true  },
  { id: 'documents',   label: 'Document Management', icon: FolderOpen, desc: 'Upload and extract documents',   soon: false },
  { id: 'team',        label: 'Team Collaboration',  icon: Users2,     desc: 'Invite and manage team members', soon: false },
];

const TEAM_SIZES = [
  { value: '1',    label: 'Just me', sub: 'Solo founder' },
  { value: '2-5',  label: '2 to 5',  sub: 'Small team'   },
  { value: '6-20', label: '6 to 20', sub: 'Growing team' },
  { value: '20+',  label: '20 plus', sub: 'Large team'   },
];

const COUNTRY_CODES = [
  { code: '+1',   label: 'US/CA' },
  { code: '+44',  label: 'UK'    },
  { code: '+234', label: 'NG'    },
  { code: '+254', label: 'KE'    },
  { code: '+27',  label: 'ZA'    },
  { code: '+49',  label: 'DE'    },
  { code: '+33',  label: 'FR'    },
  { code: '+91',  label: 'IN'    },
  { code: '+61',  label: 'AU'    },
  { code: '+64',  label: 'NZ'    },
];

function ProgressBar({ step, total }) {
  return (
    <div style={{ display:'flex', gap:6, marginBottom:36 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex:1, height:3, borderRadius:99,
          background: i < step ? MINT : BORDER,
          transition:'background 0.4s ease',
          boxShadow: i < step ? '0 0 8px rgba(15,149,153,0.4)' : 'none',
        }}/>
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
      background: disabled ? '#E2E8E8' : MINT,
      color: disabled ? MUTED : '#FFFFFF',
      border:'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize:14,
      fontWeight:700,
      fontFamily:FONT,
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      gap:8,
      transition:'all 0.2s',
      boxShadow: disabled ? 'none' : '0 4px 20px rgba(15,149,153,0.3)',
      flexShrink:0,
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.boxShadow='0 8px 32px rgba(15,149,153,0.45)'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.boxShadow='0 4px 20px rgba(15,149,153,0.3)'; }}
    >
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
      transition:'all 0.2s',
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
      <span style={{ fontSize:13, color:'#EF4444' }}>⚠ {msg}</span>
    </div>
  );
}

export default function Onboarding({ onComplete }) {
  const navigate = useNavigate();

  // Invite-token handling: skip company/business steps for team invitees
  const _inviteParams = new URLSearchParams(window.location.search);
  const inviteToken = _inviteParams.get('invite_token');
  const invitedEmail = _inviteParams.get('email');
  const isInvitedTeamMember = Boolean(inviteToken);
  const [step, setStep] = useState(isInvitedTeamMember ? 5 : 1);
  const [companyName,  setCompanyName]  = useState('');
  const [bizType,      setBizType]      = useState('');
  const [industry,     setIndustry]     = useState('');
  const [otherIndustry,setOtherIndustry]= useState('');
  const [features,     setFeatures]     = useState([]);
  const [teamSize,     setTeamSize]     = useState('');
  const [error,        setError]        = useState('');
  const [saving,       setSaving]       = useState(false);

  const [fullName,     setFullName]     = useState('');
  const [email, setEmail] = useState(invitedEmail || '');
  const [countryCode,  setCountryCode]  = useState('+1');
  const [phone,        setPhone]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const clearError = () => { if (error) setError(''); };

  const toggleFeature = (id) => {
    setFeatures(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const effectiveIndustry = industry === 'Other' ? otherIndustry : industry;

  const handleStep1 = () => {
    if (!companyName.trim()) {
      setError('Please enter your company name to continue.');
      return;
    }
    setError('');
    localStorage.setItem('company_name', companyName);
    setStep(2);
  };

  const handleStep2 = () => {
    if (!bizType) {
      setError('Please select your business type to continue.');
      return;
    }
    if (!industry) {
      setError('Please select your industry to continue.');
      return;
    }
    if (industry === 'Other' && !otherIndustry.trim()) {
      setError('Please describe your industry to continue.');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleStep3Continue = () => {
    if (features.length === 0) {
      setError('Please select at least one feature, or press Skip.');
      return;
    }
    setError('');
    setStep(4);
  };

  const handleStep4Continue = () => {
    if (!teamSize) {
      setError('Please select your team size, or press Skip.');
      return;
    }
    setError('');
    setStep(5);
  };

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPass) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await register(email, password, fullName, companyName);
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_name', fullName);
      localStorage.setItem('company_name', companyName);
      // Auto-save first name for personalized greetings (no need for user to visit Settings)
      const firstWord = fullName.trim().split(/\s+/)[0] || '';
      if (firstWord) {
        const firstName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
        localStorage.setItem('first_name', firstName);
        localStorage.setItem('full_name', fullName.trim());
        // Persist to backend so it follows the user across devices
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('access_token');
          if (token) {
            await fetch('https://api.getnovala.com/api/v1/auth/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
              body: JSON.stringify({ first_name: firstName, full_name: fullName.trim() })
            });
          }
        } catch (e) { /* non-fatal */ }
      }
      localStorage.setItem('saved_account_email', email);
      try {
        // Auto-accept invite for team members coming from /accept-invite
        if (isInvitedTeamMember && inviteToken) {
          try {
            const _tok = (res && res.access_token) || localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
            await fetch(
              'https://api.getnovala.com/api/v1/team/invites/' + inviteToken + '/accept',
              { method: 'POST', headers: { Authorization: 'Bearer ' + _tok } }
            );
          } catch (e) { console.warn('Auto-accept failed:', e); }
          navigate('/');
          return;
        }

        await fetch('https://api.getnovala.com/api/v1/onboarding/update', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: 6,
            completed: true,
            company_name: companyName,
            business_type: bizType,
            industry: effectiveIndustry,
            features_selected: features,
            team_size: teamSize,
            phone: countryCode + phone,
          }),
        });
      } catch (e) {}
      onComplete();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        if (detail.toLowerCase().includes('exist') || detail.toLowerCase().includes('already')) {
          setError('An account with this email already exists. Sign in instead.');
        } else {
          setError(detail);
        }
      } else {
        setError('Could not create your account. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width:'100%',
    padding:'13px 16px',
    borderRadius:10,
    border:'1px solid ' + BORDER,
    background:'#FFFFFF',
    color:WHITE,
    fontSize:14,
    fontFamily:FONT,
    outline:'none',
    boxSizing:'border-box',
    transition:'border-color 0.2s, box-shadow 0.2s',
  };

  const pageStyle = {
    minHeight:'100vh',
    background:'#F9FAFA',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    fontFamily:FONT,
    padding:'24px',
  };

  return (
    <div style={pageStyle}>
      <div style={{ width:'100%', maxWidth:580 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:MINT, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(15,149,153,0.3)' }}>
              <TrendingUp size={18} color="#FFFFFF"/>
            </div>
            <span style={{ fontSize:22, fontWeight:800, color:'#0E1A1A', letterSpacing:'-0.02em' }}>
              No<span style={{ color:MINT }}>vala</span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:CARD, borderRadius:20, padding:'36px', border:'1px solid '+BORDER, boxShadow:'0 8px 32px rgba(15,149,153,0.08)' }}>

          <ProgressBar step={step} total={6}/>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div style={{ animation:'fadeUp 0.2s ease' }}>
              <StepLabel current={1} total={6} label="Welcome"/>
              <div style={{ fontSize:26, fontWeight:800, color:'#0E1A1A', marginBottom:8, letterSpacing:'-0.03em', lineHeight:1.2 }}>
                Welcome to Novala!
              </div>
              <div style={{ fontSize:14, color:MUTED, marginBottom:28, lineHeight:1.7 }}>
                Let's get your workspace ready in under 2 minutes.
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
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = MINT; e.target.style.boxShadow = MINTGLOW; }}
                  onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <ErrorMsg msg={error}/>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:28 }}>
                {[
                  { icon: BarChart3,  text: 'Live financial dashboard'     },
                  { icon: FileText,   text: 'Smart document extraction'    },
                  { icon: Receipt,    text: 'Invoicing and bill pay'       },
                  { icon: Shield,     text: 'Bank level security'          },
                  { icon: TrendingUp, text: 'P&L and cash flow reports'    },
                  { icon: RefreshCw,  text: 'Recurring revenue automation' },
                ].map(f => {
                  const Icon = f.icon;
                  return (
                    <div key={f.text} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', background:'#FFFFFF', borderRadius:12, border:'1px solid '+BORDER }}>
                      <Icon size={15} color={MINT}/>
                      <span style={{ fontSize:12, color:'#94A3B8' }}>{f.text}</span>
                    </div>
                  );
                })}
              </div>

              <PrimaryBtn onClick={handleStep1} fullWidth>
                Get started <ArrowRight size={16}/>
              </PrimaryBtn>

              <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:MUTED }}>
                Already have an account?{' '}
                <span onClick={() => navigate('/login')} style={{ color:MINT, cursor:'pointer', fontWeight:600 }}>Sign in</span>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div style={{ animation:'fadeUp 0.2s ease' }}>
              <StepLabel current={2} total={6} label="Business Profile"/>
              <div style={{ fontSize:24, fontWeight:800, color:'#0E1A1A', marginBottom:8, letterSpacing:'-0.02em' }}>
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
                  {BUSINESS_TYPES.map(t => {
                    const Icon = t.icon;
                    const sel  = bizType === t.value;
                    return (
                      <div key={t.value} onClick={() => { setBizType(t.value); clearError(); }}
                        style={{ padding:'14px 10px', borderRadius:12, border:'1px solid '+(sel?MINT:BORDER), background:sel?MINTDIM:'#0D1526', cursor:'pointer', textAlign:'center', transition:'all 0.2s', boxShadow:sel?MINTGLOW:'none' }}>
                        <Icon size={24} color={sel?MINT:MUTED} style={{ marginBottom:8 }}/>
                        <div style={{ fontSize:12, fontWeight:600, color:sel?MINT:WHITE }}>{t.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>
                  Industry <span style={{ color:'#EF4444' }}>*</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {INDUSTRIES.map(ind => {
                    const sel = industry === ind;
                    return (
                      <div key={ind} onClick={() => { setIndustry(ind); clearError(); }}
                        style={{ padding:'8px 16px', borderRadius:999, border:'1px solid '+(sel?MINT:BORDER), background:sel?MINTDIM:'transparent', cursor:'pointer', fontSize:12, fontWeight:sel?600:400, color:sel?MINT:MUTED, transition:'all 0.2s', boxShadow:sel?MINTGLOW:'none' }}>
                        {ind}
                      </div>
                    );
                  })}
                </div>

                {industry === 'Other' && (
                  <div style={{ marginTop:12 }}>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Please describe your industry"
                      value={otherIndustry}
                      onChange={e => { setOtherIndustry(e.target.value); clearError(); }}
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = MINT; e.target.style.boxShadow = MINTGLOW; }}
                      onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                )}
              </div>

              <ErrorMsg msg={error}/>

              <div style={{ display:'flex', gap:10 }}>
                <GhostBtn onClick={() => { setError(''); setStep(1); }}>
                  <ArrowLeft size={15}/> Back
                </GhostBtn>
                <PrimaryBtn onClick={handleStep2}>
                  Continue <ArrowRight size={15}/>
                </PrimaryBtn>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div style={{ animation:'fadeUp 0.2s ease' }}>
              <StepLabel current={3} total={6} label="Your Goals"/>
              <div style={{ fontSize:24, fontWeight:800, color:'#0E1A1A', marginBottom:8, letterSpacing:'-0.02em' }}>
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
                      style={{ padding:'14px', borderRadius:12, border:'1px solid '+(selected?MINT:BORDER), background:selected?MINTDIM:'#0D1526', cursor:f.soon?'default':'pointer', transition:'all 0.2s', position:'relative', opacity:f.soon?0.5:1, boxShadow:selected?MINTGLOW:'none' }}>
                      {f.soon && (
                        <div style={{ position:'absolute', top:8, right:8, fontSize:9, fontWeight:700, color:'#FFFFFF', background:MINT, padding:'2px 7px', borderRadius:20 }}>SOON</div>
                      )}
                      <div style={{ width:32, height:32, borderRadius:8, background:selected?'rgba(15,149,153,0.15)':'#E2E8E8', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
                        <Icon size={16} color={selected?MINT:MUTED}/>
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
                <GhostBtn onClick={() => { setError(''); setStep(4); }}>
                  Skip
                </GhostBtn>
                <PrimaryBtn onClick={handleStep3Continue}>
                  Continue <ArrowRight size={15}/>
                </PrimaryBtn>
              </div>
            </div>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <div style={{ animation:'fadeUp 0.2s ease' }}>
              <StepLabel current={4} total={6} label="Your Team"/>
              <div style={{ fontSize:24, fontWeight:800, color:'#0E1A1A', marginBottom:8, letterSpacing:'-0.02em' }}>
                How big is your team?
              </div>
              <div style={{ fontSize:14, color:MUTED, marginBottom:24, lineHeight:1.6 }}>
                This helps us set up the right collaboration features for you.
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
                {TEAM_SIZES.map(t => {
                  const sel = teamSize === t.value;
                  return (
                    <div key={t.value}
                      onClick={() => { setTeamSize(t.value); clearError(); }}
                      style={{ padding:'20px', borderRadius:12, border:'1px solid '+(sel?MINT:BORDER), background:sel?MINTDIM:'#0D1526', cursor:'pointer', textAlign:'center', transition:'all 0.2s', boxShadow:sel?MINTGLOW:'none' }}>
                      <div style={{ fontSize:22, fontWeight:800, color:sel?MINT:WHITE, marginBottom:4 }}>{t.label}</div>
                      <div style={{ fontSize:11, color:MUTED }}>{t.sub}</div>
                    </div>
                  );
                })}
              </div>

              <ErrorMsg msg={error}/>

              <div style={{ display:'flex', gap:10 }}>
                <GhostBtn onClick={() => { setError(''); setStep(3); }}>
                  <ArrowLeft size={15}/> Back
                </GhostBtn>
                <GhostBtn onClick={() => { setError(''); setStep(5); }}>
                  Skip
                </GhostBtn>
                <PrimaryBtn onClick={handleStep4Continue}>
                  Continue <ArrowRight size={15}/>
                </PrimaryBtn>
              </div>
            </div>
          )}

          {/* ── STEP 5 ── */}
          {step === 5 && (
            <div style={{ animation:'fadeUp 0.2s ease' }}>
              <StepLabel current={5} total={6} label="Bank Connection"/>
              <div style={{ fontSize:24, fontWeight:800, color:'#0E1A1A', marginBottom:8, letterSpacing:'-0.02em' }}>
                Connect your bank account
              </div>
              <div style={{ fontSize:14, color:MUTED, marginBottom:24, lineHeight:1.6 }}>
                Sync transactions automatically. We use 256 bit encryption. Your credentials are never stored.
              </div>

              <div style={{ padding:'28px 24px', borderRadius:16, border:'1px dashed '+BORDER, background:'#FFFFFF', textAlign:'center', marginBottom:20 }}>
                <div style={{ width:56, height:56, borderRadius:14, background:MINTDIM, border:'1px solid rgba(15,149,153,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                  <Landmark size={28} color={MINT}/>
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:WHITE, marginBottom:8 }}>Bank connection coming soon</div>
                <div style={{ fontSize:13, color:MUTED, marginBottom:16, lineHeight:1.6 }}>
                  We are integrating with Plaid to support 10,000 plus banks. Connect from Settings once available.
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, background:MINTDIM, border:'1px solid rgba(15,149,153,0.2)' }}>
                  <Shield size={12} color={MINT}/>
                  <span style={{ fontSize:11, fontWeight:600, color:MINT }}>256 bit encrypted · Read only access</span>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <PrimaryBtn onClick={() => { setError(''); setStep(6); }} fullWidth>
                  Continue, I'll connect my bank later <ArrowRight size={15}/>
                </PrimaryBtn>
                <GhostBtn onClick={() => { setError(''); setStep(4); }}>
                  <ArrowLeft size={15}/> Back
                </GhostBtn>
              </div>
            </div>
          )}

          {/* ── STEP 6 — Create Account ── */}
          {step === 6 && (
            <div style={{ animation:'fadeUp 0.2s ease' }}>
              <StepLabel current={6} total={6} label="Create Account"/>
              <div style={{ fontSize:24, fontWeight:800, color:'#0E1A1A', marginBottom:8, letterSpacing:'-0.02em' }}>
                Almost there! Create your account
              </div>
              <div style={{ fontSize:14, color:MUTED, marginBottom:24, lineHeight:1.6 }}>
                Your workspace{companyName ? <> for <span style={{ color:MINT, fontWeight:600 }}>{companyName}</span></> : ""} is ready. Set up your login details below.
              </div>

              {/* Full name */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
                  Full Name <span style={{ color:'#EF4444' }}>*</span>
                </div>
                <input autoFocus type="text" placeholder="Your full name" value={fullName}
                  onChange={e => { setFullName(e.target.value); clearError(); }}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor=MINT; e.target.style.boxShadow=MINTGLOW; }}
                  onBlur={e => { e.target.style.borderColor=BORDER; e.target.style.boxShadow='none'; }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
                  Business Email <span style={{ color:'#EF4444' }}>*</span>
                </div>
                <input type="email" placeholder="you@company.com" value={email}
                  onChange={e => { setEmail(e.target.value); clearError(); }}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor=MINT; e.target.style.boxShadow=MINTGLOW; }}
                  onBlur={e => { e.target.style.borderColor=BORDER; e.target.style.boxShadow='none'; }}
                />
              </div>

              {/* Phone */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
                  Phone Number <span style={{ color:'#EF4444' }}>*</span>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                    style={{ ...inputStyle, width:100, flexShrink:0, paddingLeft:10, paddingRight:10, cursor:'pointer' }}>
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} {c.label}</option>
                    ))}
                  </select>
                  <div style={{ position:'relative', flex:1 }}>
                    <Phone size={15} color={MUTED} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                    <input type="tel" placeholder="Phone number" value={phone}
                      onChange={e => { setPhone(e.target.value); clearError(); }}
                      style={{ ...inputStyle, paddingLeft:40 }}
                      onFocus={e => { e.target.style.borderColor=MINT; e.target.style.boxShadow=MINTGLOW; }}
                      onBlur={e => { e.target.style.borderColor=BORDER; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
                  Password <span style={{ color:'#EF4444' }}>*</span>
                </div>
                <div style={{ position:'relative' }}>
                  <input type={showPassword?'text':'password'} placeholder="Min 8 characters" value={password}
                    onChange={e => { setPassword(e.target.value); clearError(); }}
                    style={{ ...inputStyle, paddingRight:44 }}
                    onFocus={e => { e.target.style.borderColor=MINT; e.target.style.boxShadow=MINTGLOW; }}
                    onBlur={e => { e.target.style.borderColor=BORDER; e.target.style.boxShadow='none'; }}
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:MUTED, display:'flex' }}>
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
                  Confirm Password <span style={{ color:'#EF4444' }}>*</span>
                </div>
                <div style={{ position:'relative' }}>
                  <input type={showConfirm?'text':'password'} placeholder="Re-enter your password" value={confirmPass}
                    onChange={e => { setConfirmPass(e.target.value); clearError(); }}
                    style={{ ...inputStyle, paddingRight:44, borderColor: confirmPass && confirmPass !== password ? '#EF4444' : BORDER }}
                    onFocus={e => { e.target.style.borderColor=MINT; e.target.style.boxShadow=MINTGLOW; }}
                    onBlur={e => { e.target.style.borderColor=confirmPass && confirmPass !== password ? '#EF4444' : BORDER; e.target.style.boxShadow='none'; }}
                  />
                  <button type="button" onClick={() => setShowConfirm(s => !s)}
                    style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:MUTED, display:'flex' }}>
                    {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                  {confirmPass && confirmPass === password && (
                    <div style={{ position:'absolute', right:40, top:'50%', transform:'translateY(-50%)' }}>
                      <CheckCircle size={14} color={MINT}/>
                    </div>
                  )}
                </div>
              </div>

              <ErrorMsg msg={error}/>

              <PrimaryBtn onClick={handleRegister} disabled={saving} fullWidth>
                <TrendingUp size={16}/>
                {saving ? 'Creating your account...' : 'Create account and go to dashboard'}
              </PrimaryBtn>

              <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:MUTED }}>
                By creating an account you agree to our{' '}
                <span style={{ color:MINT, cursor:'pointer' }}>Terms of Service</span>{' '}
                and{' '}
                <span style={{ color:MINT, cursor:'pointer' }}>Privacy Policy</span>
              </div>

              <div style={{ display:'flex', justifyContent:'center', marginTop:12 }}>
                <GhostBtn onClick={() => { setError(''); setStep(5); }}>
                  <ArrowLeft size={15}/> Back
                </GhostBtn>
              </div>
            </div>
          )}

        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#334155' }}>
          Step {step} of 6 · Your progress is saved locally
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        * { box-sizing: border-box; }
        input::placeholder { color: #334155; }
        select { appearance: none; }
        select option { background: #FFFFFF; color: #0E1A1A; }
      `}</style>
    </div>
  );
}