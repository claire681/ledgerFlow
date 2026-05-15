import React, { useState } from 'react';
import { login, register } from '../services/api';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

const BG      = '#0A0C0F';
const PANEL   = '#161B22';
const BORDER  = '#1E2530';
const ACCENT  = '#0AB98A';
const TEXT    = '#E2E8F0';
const TEXTDIM = '#718096';
const RED     = '#FF4E6A';
const GRAD    = 'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)';
const FONT    = 'Inter, sans-serif';

const styles = {
  page: {
    minHeight: '100vh',
    background: BG,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT,
    padding: '20px',
  },
  wrap: {
    width: '100%',
    maxWidth: 440,
  },
  card: {
    padding: 40,
    background: PANEL,
    border: '1px solid ' + BORDER,
    borderRadius: 20,
    boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 56,
    height: 56,
    background: GRAD,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    boxShadow: '0 8px 24px rgba(10,185,138,0.3)',
  },
  logoText: {
    fontSize: 26,
    fontWeight: 800,
    color: TEXT,
    letterSpacing: '-0.02em',
    marginBottom: 4,
  },
  logoSub: {
    fontSize: 12,
    color: TEXTDIM,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  tabRow: {
    display: 'flex',
    background: '#111418',
    borderRadius: 10,
    padding: 4,
    marginBottom: 28,
    border: '1px solid ' + BORDER,
  },
  subtitle: {
    fontSize: 13,
    color: TEXTDIM,
    marginBottom: 24,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: TEXTDIM,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    background: '#111418',
    color: TEXT,
    border: '1px solid ' + BORDER,
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
    marginBottom: 12,
    fontFamily: FONT,
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  inputNoMargin: {
    width: '100%',
    padding: '11px 14px',
    background: '#111418',
    color: TEXT,
    border: '1px solid ' + BORDER,
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
    marginBottom: 0,
    paddingRight: 42,
    fontFamily: FONT,
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: TEXTDIM,
    display: 'flex',
    alignItems: 'center',
    padding: 0,
  },
  benefitsBox: {
    marginTop: 16,
    marginBottom: 4,
    padding: '12px 14px',
    background: 'rgba(10,185,138,0.06)',
    border: '1px solid rgba(10,185,138,0.15)',
    borderRadius: 8,
  },
  benefitsTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: ACCENT,
    marginBottom: 8,
  },
  benefitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  errorBox: {
    color: RED,
    fontSize: 12,
    marginBottom: 8,
    marginTop: 12,
    padding: '10px 14px',
    background: 'rgba(255,78,106,0.08)',
    border: '1px solid rgba(255,78,106,0.2)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  toggleRow: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 13,
    color: TEXTDIM,
    paddingTop: 20,
    borderTop: '1px solid ' + BORDER,
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 11,
    color: '#2D3748',
    lineHeight: 1.6,
  },
};

function LogoIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path
        d="M3 20 L8 9 L13 14 L18 6 L23 11"
        stroke="#0F172A"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23" cy="11" r="2.2" fill="#0F172A" />
      <circle cx="3" cy="20" r="1.6" fill="#0F172A" opacity="0.6" />
    </svg>
  );
}

export default function Login({ onLogin, defaultRegister }) {
  const [isRegister,   setIsRegister]   = useState(defaultRegister || false);
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [name,         setName]         = useState('');
  const [company,      setCompany]      = useState('');
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const switchTab = (toRegister) => {
    setIsRegister(toRegister);
    setError('');
    setShowPassword(false);
    setShowConfirm(false);
    setPassword('');
    setConfirmPass('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister && password !== confirmPass) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }
    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
   if (isRegister) {
        const res = await register(email, password, name, company);
        if (name) localStorage.setItem('user_name', name);
        onLogin(res.data.access_token, email, true);
      } else {
        const res = await login(email, password);
        onLogin(res.data.access_token, email, false);
      }
    } catch (err) {
      const detail = err.response && err.response.data && err.response.data.detail;
      if (!detail) {
        setError('Could not connect to server. Please try again.');
        return;
      }
      if (typeof detail === 'string') {
        const d = detail.toLowerCase();
        if (d.includes('password')) {
          setError('Incorrect password. Please try again.');
        } else if (d.includes('email') || d.includes('user') || d.includes('not found')) {
          setError('No account found with this email address.');
        } else if (d.includes('exist') || d.includes('already')) {
          setError('An account with this email already exists. Sign in instead.');
        } else if (d.includes('invalid')) {
          setError('Invalid email or password. Please check and try again.');
        } else {
          setError(detail);
        }
      } else {
        setError('Please check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const tabBtn = (active) => ({
    flex: 1,
    padding: '9px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: FONT,
    transition: 'all 0.15s',
    background: active ? PANEL : 'transparent',
    color: active ? TEXT : TEXTDIM,
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
  });

  const submitBtn = {
    width: '100%',
    padding: '13px',
    background: loading ? '#1E2530' : GRAD,
    color: loading ? TEXTDIM : '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: FONT,
    marginTop: 16,
    boxShadow: loading ? 'none' : '0 4px 16px rgba(10,185,138,0.3)',
    transition: 'all 0.15s',
  };

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.card}>

          {/* Logo */}
          <div style={styles.logoWrap}>
            <div style={styles.logoBox}>
              <LogoIcon />
            </div>
            <div style={styles.logoText}>
              No<span style={{ color: ACCENT }}>vala</span>
            </div>
            <div style={styles.logoSub}>Financial Intelligence Platform</div>
          </div>

          {/* Tabs */}
          <div style={styles.tabRow}>
            <button type="button" onClick={() => switchTab(false)} style={tabBtn(!isRegister)}>
              Sign In
            </button>
            <button type="button" onClick={() => switchTab(true)} style={tabBtn(isRegister)}>
              Create Account
            </button>
          </div>

          {/* Subtitle */}
          <div style={styles.subtitle}>
            {isRegister
              ? 'Start your 14-day free trial — no credit card required'
              : 'Welcome back — sign in to continue'}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {isRegister && (
              <div>
                <div style={{ marginBottom: 4 }}>
                  <div style={styles.fieldLabel}>Full Name</div>
                  <input
                    style={styles.input}
                    placeholder="Your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={e => { e.target.style.borderColor = ACCENT; }}
                    onBlur={e  => { e.target.style.borderColor = BORDER; }}
                    required
                  />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <div style={styles.fieldLabel}>
                    Company <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span>
                  </div>
                  <input
                    style={styles.input}
                    placeholder="Your company name"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    onFocus={e => { e.target.style.borderColor = ACCENT; }}
                    onBlur={e  => { e.target.style.borderColor = BORDER; }}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: 4 }}>
              <div style={styles.fieldLabel}>Email Address</div>
              <input
                style={styles.input}
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={e => { e.target.style.borderColor = ACCENT; }}
                onBlur={e  => { e.target.style.borderColor = BORDER; }}
                required
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 4 }}>
              <div style={styles.fieldLabel}>Password</div>
              <div style={{ position: 'relative' }}>
                <input
                  style={styles.inputNoMargin}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = ACCENT; }}
                  onBlur={e  => { e.target.style.borderColor = BORDER; }}
                  required
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} style={styles.eyeBtn}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            {isRegister && (
              <div style={{ marginBottom: 4, marginTop: 12 }}>
                <div style={styles.fieldLabel}>Confirm Password</div>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{
                      ...styles.inputNoMargin,
                      borderColor: confirmPass && confirmPass !== password ? RED : BORDER,
                    }}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    onFocus={e => { e.target.style.borderColor = ACCENT; }}
                    onBlur={e  => { e.target.style.borderColor = confirmPass !== password ? RED : BORDER; }}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(s => !s)} style={styles.eyeBtn}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {confirmPass && confirmPass === password && (
                    <div style={{ position: 'absolute', right: 38, top: '50%', transform: 'translateY(-50%)' }}>
                      <CheckCircle size={14} color={ACCENT} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Benefits */}
            {isRegister && (
              <div style={styles.benefitsBox}>
                <div style={styles.benefitsTitle}>What you get free for 14 days:</div>
                {[
                  'Smart document extraction',
                  'Automated bookkeeping',
                  'Financial reports and insights',
                  'Invoice and bill tracking',
                ].map(item => (
                  <div key={item} style={styles.benefitRow}>
                    <CheckCircle size={11} color={ACCENT} />
                    <span style={{ fontSize: 11, color: TEXTDIM }}>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={styles.errorBox}>
                ⚠ {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? 'Please wait...' : isRegister ? 'Create My Account — Free' : 'Sign In to Novala'}
            </button>
          </form>

          {/* Toggle */}
          <div style={styles.toggleRow}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <span
              onClick={() => switchTab(!isRegister)}
              style={{ color: ACCENT, cursor: 'pointer', marginLeft: 6, fontWeight: 600 }}
            >
              {isRegister ? 'Sign in' : 'Create account'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          By continuing you agree to Novala's Terms of Service and Privacy Policy.
          <br />
          2026 Novala — Financial Intelligence Platform
        </div>
      </div>
    </div>
  );
}