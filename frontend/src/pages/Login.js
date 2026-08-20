import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { Eye, EyeOff, TrendingUp, Mail, ChevronRight, X, User, CheckCircle } from 'lucide-react';

const DARK    = '#0F1729';
const DARK2   = '#1A2540';
const CARD    = '#162035';
const BORDER  = '#1E2D4A';
const MINT    = '#00D4A4';
const MINTDIM = 'rgba(0,212,164,0.12)';
const MINTGLOW= '0 0 0 3px rgba(0,212,164,0.15)';
const WHITE   = '#F1F5F9';
const MUTED   = '#64748B';
const FONT    = "'Inter', -apple-system, sans-serif";
const API     = 'https://api.getnovala.com/api/v1';

function PrimaryBtn({ onClick, disabled, children, fullWidth }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: fullWidth ? '100%' : 'auto',
      padding:'13px 24px', borderRadius:12,
      background: disabled ? '#1E2D4A' : MINT,
      color: disabled ? MUTED : '#0F1729',
      border:'none', cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize:14, fontWeight:700, fontFamily:FONT,
      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      transition:'all 0.2s',
      boxShadow: disabled ? 'none' : '0 4px 20px rgba(0,212,164,0.3)',
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.boxShadow='0 8px 32px rgba(0,212,164,0.45)'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.boxShadow='0 4px 20px rgba(0,212,164,0.3)'; }}
    >
      {children}
    </button>
  );
}

function TrustCard({ title, desc }) {
  return (
    <div style={{ padding:'16px 18px', borderRadius:14, background:'rgba(255,255,255,0.04)', border:'1px solid '+BORDER, display:'flex', alignItems:'flex-start', gap:12, marginBottom:10 }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:MINT, marginTop:5, flexShrink:0 }}/>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:WHITE, marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:12, color:MUTED, lineHeight:1.5 }}>{desc}</div>
      </div>
    </div>
  );
}


// Mobile detection hook
function useIsMobileLogin() {
  const [m, setM] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
}

export default function Login({ onLogin }) {
  const isMobile = useIsMobileLogin();
  const navigate = useNavigate();
  const savedEmail = localStorage.getItem('saved_account_email') || '';

  const [screen,        setScreen]        = useState(savedEmail ? 'saved' : 'email');
  const [email,         setEmail]         = useState(savedEmail);
  const [emailInput,    setEmailInput]    = useState('');
  const [password,      setPassword]      = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [codeMode,      setCodeMode]      = useState('');
  const [codeSent,      setCodeSent]      = useState(false);
  const [code,          setCode]          = useState('');
  const [codeSending,   setCodeSending]   = useState(false);
  const [codeError,     setCodeError]     = useState('');
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [forgotEmail,   setForgotEmail]   = useState('');
  const [forgotError,   setForgotError]   = useState('');
  const [forgotSent,    setForgotSent]    = useState(false);
  const [forgotSending, setForgotSending] = useState(false);

  const inputStyle = {
    width:'100%', padding:'13px 16px', borderRadius:10,
    border:'1px solid ' + BORDER, background:'#0D1526',
    color:WHITE, fontSize:14, fontFamily:FONT,
    outline:'none', boxSizing:'border-box',
    transition:'border-color 0.2s, box-shadow 0.2s',
  };

  const handlePasswordLogin = async () => {
    if (!password) { setError('Please enter your password.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      localStorage.setItem('user_email', email);
      localStorage.setItem('saved_account_email', email);
      // Fetch user profile so name displays consistently everywhere
      try {
        const profRes = await fetch('https://api.getnovala.com/api/v1/auth/profile', {
          headers: { Authorization: 'Bearer ' + token }
        });
        if (profRes.ok) {
          const prof = await profRes.json();
          if (prof.full_name) {
            localStorage.setItem('full_name', prof.full_name);
            localStorage.setItem('user_name', prof.full_name);
            const firstWord = prof.full_name.trim().split(' ')[0];
            if (firstWord) localStorage.setItem('first_name', firstWord);
          }
          if (prof.first_name) localStorage.setItem('first_name', prof.first_name);
        }
      } catch (profErr) {
        console.warn('Profile fetch failed (non-fatal):', profErr);
      }
      onLogin(token, email);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        const d = detail.toLowerCase();
        if (d.includes('password'))                               setError('Incorrect password. Please try again.');
        else if (d.includes('email') || d.includes('not found')) { setError('No account found. Redirecting to register...'); setTimeout(function() { window.location.href = '/onboarding'; }, 1200); }
        else if (d.includes('invalid'))                          setError('Invalid email or password.');
        else                                                     setError(detail);
      } else {
        setError('Could not connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailCode = async () => {
    setCodeSending(true);
    setCodeError('');
    try {
      const res = await fetch(API + '/auth/send-login-code', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setCodeError(data.detail || 'Could not send code. Please try again.');
        return;
      }
      setCodeSent(true);
      setCodeMode('email');
    } catch (e) {
      setCodeError('Could not connect to server. Please try again.');
    } finally {
      setCodeSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) { setCodeError('Please enter the 6 digit code.'); return; }
    setCodeVerifying(true);
    setCodeError('');
    try {
      const res = await fetch(API + '/auth/verify-login-code', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCodeError(data.detail || 'Invalid or expired code.');
        return;
      }
      const token = data.access_token;
      localStorage.setItem('token', token);
      localStorage.setItem('user_email', email);
      localStorage.setItem('saved_account_email', email);
      onLogin(token, email);
    } catch (e) {
      setCodeError('Could not verify code. Please try again.');
    } finally {
      setCodeVerifying(false);
    }
  };

  const handleEmailSubmit = () => {
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setEmail(emailInput);
    setError('');
    setScreen('password');
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    setForgotError('');
    setForgotSending(true);
    try {
      await fetch(API + '/auth/forgot-password', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } catch (e) {
      setForgotError('Could not send reset email. Please try again.');
    } finally {
      setForgotSending(false);
    }
  };

  const pageStyle = {
    minHeight:'100vh',
    background:'linear-gradient(160deg, #0F1729 0%, #1A2540 100%)',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    fontFamily:FONT,
    padding:'24px',
  };

  const Logo = () => (
    <div style={{ textAlign:'center', marginBottom:32 }}>
      <div style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:MINT, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(0,212,164,0.3)' }}>
          <TrendingUp size={18} color="#0F1729"/>
        </div>
        <span style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>
          No<span style={{ color:MINT }}>vala</span>
        </span>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={{ width:'100%', maxWidth:isMobile?'100%':900, display:'flex', flexDirection:isMobile?'column':'row', gap:isMobile?20:40, alignItems:'center', padding:isMobile?'16px':0 }}>

        {/* Left — main card */}
        <div style={{ flex:1, maxWidth:isMobile?'100%':440, width:'100%' }}>
          <Logo/>

          <div style={{ background:CARD, borderRadius:20, padding:'36px', border:'1px solid '+BORDER, boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }}>

            {/* ── SCREEN 1: Saved Account ── */}
            {screen === 'saved' && (
              <div style={{ animation:'fadeUp 0.2s ease' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:6, letterSpacing:'-0.02em' }}>
                  Let's get you in to Novala
                </div>
                <div style={{ fontSize:14, color:MUTED, marginBottom:28 }}>
                  Welcome back. Select your account to continue.
                </div>

                <div onClick={() => setScreen('password')}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderRadius:14, border:'1px solid '+BORDER, background:'#0D1526', cursor:'pointer', marginBottom:20, transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=MINT; e.currentTarget.style.boxShadow=MINTGLOW; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.boxShadow='none'; }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:MINTDIM, border:'1px solid rgba(0,212,164,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <User size={20} color={MINT}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:WHITE, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{savedEmail}</div>
                    <div style={{ fontSize:11, color:MUTED }}>Tap to sign in to this account</div>
                  </div>
                  <ChevronRight size={18} color={MUTED}/>
                </div>

                <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Other actions</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div onClick={() => { setScreen('email'); setEmail(''); }}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:10, border:'1px solid '+BORDER, cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor=MINT}
                    onMouseLeave={e => e.currentTarget.style.borderColor=BORDER}>
                    <Mail size={15} color={MUTED}/>
                    <span style={{ fontSize:13, color:WHITE }}>Use a different account</span>
                  </div>
                  <div onClick={() => { localStorage.removeItem('saved_account_email'); setScreen('email'); setEmail(''); }}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:10, border:'1px solid '+BORDER, cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='#EF4444'}
                    onMouseLeave={e => e.currentTarget.style.borderColor=BORDER}>
                    <X size={15} color="#EF4444"/>
                    <span style={{ fontSize:13, color:'#EF4444' }}>Remove this account</span>
                  </div>
                </div>

                <div style={{ textAlign:'center', marginTop:24, fontSize:13, color:MUTED, paddingTop:20, borderTop:'1px solid '+BORDER }}>
                  New to Novala?{' '}
                  <span onClick={() => navigate('/register')} style={{ color:MINT, cursor:'pointer', fontWeight:600 }}>Create an account</span>
                </div>
              </div>
            )}

            {/* ── SCREEN 1b: Email input ── */}
            {screen === 'email' && (
              <div style={{ animation:'fadeUp 0.2s ease' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:6, letterSpacing:'-0.02em' }}>
                  Let's get you in to Novala
                </div>
                <div style={{ fontSize:14, color:MUTED, marginBottom:28 }}>
                  Enter your email address to continue.
                </div>

                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Email Address</div>
                  <input autoFocus type="email" placeholder="you@company.com" value={emailInput}
                    onChange={e => { setEmailInput(e.target.value); if (error) setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor=MINT; e.target.style.boxShadow=MINTGLOW; }}
                    onBlur={e => { e.target.style.borderColor=BORDER; e.target.style.boxShadow='none'; }}
                  />
                </div>

                {error && (
                  <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:16 }}>
                    <span style={{ fontSize:13, color:'#EF4444' }}>⚠️ {error}</span>
                  </div>
                )}

                <PrimaryBtn onClick={handleEmailSubmit} fullWidth>
                  Continue <ChevronRight size={16}/>
                </PrimaryBtn>

                <div style={{ textAlign:'center', marginTop:24, fontSize:13, color:MUTED, paddingTop:20, borderTop:'1px solid '+BORDER }}>
                  New to Novala?{' '}
                  <span onClick={() => navigate('/register')} style={{ color:MINT, cursor:'pointer', fontWeight:600 }}>Create an account</span>
                </div>
              </div>
            )}

            {/* ── SCREEN 2: Password + Code options ── */}
            {screen === 'password' && (
              <div style={{ animation:'fadeUp 0.2s ease' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:6, letterSpacing:'-0.02em' }}>
                  Enter your Novala password
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ fontSize:14, color:MINT, fontWeight:600 }}>{email}</div>
                </div>
                <div onClick={() => { setScreen(savedEmail ? 'saved' : 'email'); setPassword(''); setError(''); setCodeSent(false); setCode(''); setCodeMode(''); }}
                  style={{ fontSize:12, color:MUTED, cursor:'pointer', marginBottom:24, display:'inline-block' }}
                  onMouseEnter={e => e.currentTarget.style.color=MINT}
                  onMouseLeave={e => e.currentTarget.style.color=MUTED}>
                  Use a different account
                </div>

                {!codeSent ? (
                  <>
                    <div style={{ marginBottom:8 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Password</div>
                      <div style={{ position:'relative' }}>
                        <input type={showPassword?'text':'password'} placeholder="••••••••••••" value={password}
                          onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
                          onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                          style={{ ...inputStyle, paddingRight:44 }}
                          onFocus={e => { e.target.style.borderColor=MINT; e.target.style.boxShadow=MINTGLOW; }}
                          onBlur={e => { e.target.style.borderColor=BORDER; e.target.style.boxShadow='none'; }}
                          autoFocus
                        />
                        <button type="button" onClick={() => setShowPassword(s => !s)}
                          style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:MUTED, display:'flex' }}>
                          {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      </div>
                    </div>

                    <div style={{ textAlign:'right', marginBottom:20 }}>
                      <span onClick={() => { setScreen('forgot'); setForgotEmail(email); }}
                        style={{ fontSize:12, color:MINT, cursor:'pointer', fontWeight:600 }}>
                        Forgot password?
                      </span>
                    </div>

                    {error && (
                      <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:16 }}>
                        <span style={{ fontSize:13, color:'#EF4444' }}>⚠️ {error}</span>
                      </div>
                    )}

                    <PrimaryBtn onClick={handlePasswordLogin} disabled={loading} fullWidth>
                      <TrendingUp size={16}/>
                      {loading ? 'Signing in...' : 'Continue'}
                    </PrimaryBtn>

                    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
                      <div style={{ flex:1, height:1, background:BORDER }}/>
                      <span style={{ fontSize:12, color:MUTED, fontWeight:600 }}>OR</span>
                      <div style={{ flex:1, height:1, background:BORDER }}/>
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      <div onClick={handleSendEmailCode}
                        style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderRadius:12, border:'1px solid '+BORDER, background:'#0D1526', cursor: codeSending?'not-allowed':'pointer', transition:'all 0.2s', opacity: codeSending?0.6:1 }}
                        onMouseEnter={e => { if (!codeSending) e.currentTarget.style.borderColor=MINT; }}
                        onMouseLeave={e => e.currentTarget.style.borderColor=BORDER}>
                        <Mail size={18} color={MINT}/>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:WHITE }}>
                            {codeSending ? 'Sending code...' : 'Email a code to ' + email.replace(/(.{2}).(@.)/, '$1***$2')}
                          </div>
                          <div style={{ fontSize:11, color:MUTED }}>We will send a 6 digit code to your email</div>
                        </div>
                      </div>
                    </div>

                    {codeError && (
                      <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', marginTop:12 }}>
                        <span style={{ fontSize:13, color:'#EF4444' }}>⚠️ {codeError}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <div style={{ padding:'14px 16px', borderRadius:12, background:MINTDIM, border:'1px solid rgba(0,212,164,0.2)', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
                      <Mail size={16} color={MINT}/>
                      <span style={{ fontSize:13, color:WHITE }}>Code sent to <strong style={{ color:MINT }}>{email}</strong></span>
                    </div>

                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Enter 6 digit code</div>
                      <input
                        autoFocus
                        type="text"
                        placeholder="000000"
                        value={code}
                        maxLength={6}
                        onChange={e => { setCode(e.target.value.replace(/\D/g,'')); if (codeError) setCodeError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                        style={{ ...inputStyle, fontSize:24, fontWeight:700, letterSpacing:'0.3em', textAlign:'center' }}
                        onFocus={e => { e.target.style.borderColor=MINT; e.target.style.boxShadow=MINTGLOW; }}
                        onBlur={e => { e.target.style.borderColor=BORDER; e.target.style.boxShadow='none'; }}
                      />
                    </div>

                    {codeError && (
                      <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:16 }}>
                        <span style={{ fontSize:13, color:'#EF4444' }}>⚠️ {codeError}</span>
                      </div>
                    )}

                    <PrimaryBtn onClick={handleVerifyCode} disabled={codeVerifying || code.length !== 6} fullWidth>
                      <CheckCircle size={16}/>
                      {codeVerifying ? 'Verifying...' : 'Verify and sign in'}
                    </PrimaryBtn>

                    <div style={{ textAlign:'center', marginTop:14 }}>
                      <span onClick={() => { setCodeSent(false); setCode(''); setCodeError(''); }}
                        style={{ fontSize:12, color:MUTED, cursor:'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.color=MINT}
                        onMouseLeave={e => e.currentTarget.style.color=MUTED}>
                        Use password instead
                      </span>
                      <span style={{ color:BORDER, margin:'0 8px' }}>·</span>
                      <span onClick={handleSendEmailCode}
                        style={{ fontSize:12, color:MUTED, cursor:'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.color=MINT}
                        onMouseLeave={e => e.currentTarget.style.color=MUTED}>
                        Resend code
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SCREEN: Forgot Password ── */}
            {screen === 'forgot' && (
              <div style={{ animation:'fadeUp 0.2s ease' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:6, letterSpacing:'-0.02em' }}>
                  Reset your password
                </div>
                <div style={{ fontSize:14, color:MUTED, marginBottom:28, lineHeight:1.6 }}>
                  Enter your email address and we will send you a link to reset your password.
                </div>

                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Email Address</div>
                  <input
                    autoFocus
                    type="email"
                    placeholder="you@company.com"
                    value={forgotEmail}
                    onChange={e => { setForgotEmail(e.target.value); if (forgotError) setForgotError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor=MINT; e.target.style.boxShadow=MINTGLOW; }}
                    onBlur={e => { e.target.style.borderColor=BORDER; e.target.style.boxShadow='none'; }}
                  />
                </div>

                {forgotError && (
                  <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:16 }}>
                    <span style={{ fontSize:13, color:'#EF4444' }}>⚠️ {forgotError}</span>
                  </div>
                )}

                {forgotSent && (
                  <div style={{ padding:'14px 16px', borderRadius:12, background:MINTDIM, border:'1px solid rgba(0,212,164,0.2)', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
                    <CheckCircle size={16} color={MINT}/>
                    <span style={{ fontSize:13, color:WHITE }}>Reset link sent to <strong style={{ color:MINT }}>{forgotEmail}</strong>. Check your inbox.</span>
                  </div>
                )}

                {!forgotSent && (
                  <PrimaryBtn onClick={handleForgotPassword} disabled={forgotSending} fullWidth>
                    <Mail size={16}/>
                    {forgotSending ? 'Sending...' : 'Send reset link'}
                  </PrimaryBtn>
                )}

                <div style={{ textAlign:'center', marginTop:16 }}>
                  <span
                    onClick={() => { setScreen('password'); setForgotError(''); setForgotSent(false); }}
                    style={{ fontSize:12, color:MUTED, cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.color=MINT}
                    onMouseLeave={e => e.currentTarget.style.color=MUTED}>
                    Back to sign in
                  </span>
                </div>
              </div>
            )}

          </div>

          <div style={{ textAlign:'center', marginTop:20, fontSize:11, color:'#1E2D4A' }}>
            By continuing you agree to Novala's Terms of Service and Privacy Policy.
          </div>
        </div>

        {/* Right — trust panel */}
        <div style={{ flex:1, maxWidth:isMobile?'100%':340, width:'100%', display:'flex', flexDirection:'column', gap:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Why Novala</div>
          <TrustCard
            title="Built for small businesses"
            desc="Novala gives you the financial tools that used to cost thousands of dollars, built for teams of any size."
          />
          <TrustCard
            title="Get paid faster with Novala"
            desc="Send invoices, track payments, and follow up automatically so you spend less time chasing money."
          />
          <TrustCard
            title="Bank level security"
            desc="Your financial data is protected with 256 bit encryption and read only bank access. We never store your credentials."
          />
          <TrustCard
            title="Real time financial clarity"
            desc="See your profit and loss, cash flow, and outstanding invoices at a glance from one clean dashboard."
          />
        </div>

      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        * { box-sizing: border-box; }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  );
}