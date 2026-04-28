import React, { useState } from 'react';
import { login, register } from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

const C = {
  bg:        '#0A0C0F',
  panel:     '#161B22',
  border:    '#1E2530',
  accent:    '#0AB98A',
  accentDim: 'rgba(10,185,138,0.1)',
  text:      '#E2E8F0',
  textDim:   '#718096',
  red:       '#FF4E6A',
  grad:      'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)',
};

const LogoIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <path
      d="M3 20 L8 9 L13 14 L18 6 L23 11"
      stroke="#0F172A"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="23" cy="11" r="2.2" fill="#0F172A"/>
    <circle cx="3"  cy="20" r="1.6" fill="#0F172A" opacity="0.6"/>
  </svg>
);

export default function Login({ onLogin }) {
  const [isRegister,   setIsRegister]   = useState(false);
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [name,         setName]         = useState('');
  const [company,      setCompany]      = useState('');
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        const res = await register(email, password, name, company);
        onLogin(res.data.access_token);
      } else {
        const res = await login(email, password);
        onLogin(res.data.access_token);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong';
      setError(typeof msg === 'string' ? msg : 'Please check your details');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width:        '100%',
    padding:      '11px 14px',
    background:   '#111418',
    color:        C.text,
    border:       `1px solid ${C.border}`,
    borderRadius: 8,
    fontSize:     13,
    outline:      'none',
    marginBottom: 12,
    fontFamily:   'Inter, sans-serif',
    boxSizing:    'border-box',
    transition:   'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight:      '100vh',
      background:     C.bg,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontFamily:     'Inter, sans-serif',
      padding:        '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Card */}
        <div style={{
          padding:      40,
          background:   C.panel,
          border:       `1px solid ${C.border}`,
          borderRadius: 20,
          boxShadow:    '0 24px 60px rgba(0,0,0,0.4)',
        }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              width:          56,
              height:         56,
              background:     C.grad,
              borderRadius:   16,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              margin:         '0 auto 16px',
              boxShadow:      '0 8px 24px rgba(10,185,138,0.3)',
            }}>
              <LogoIcon/>
            </div>
            <div style={{
              fontSize:      26,
              fontWeight:    800,
              color:         C.text,
              letterSpacing: '-0.02em',
              marginBottom:  6,
            }}>
              No<span style={{ color: C.accent }}>vala</span>
            </div>
            <div style={{
              fontSize:      12,
              color:         C.textDim,
              marginTop:     2,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              AI Financial Intelligence
            </div>
            <div style={{
              fontSize:  13,
              color:     C.textDim,
              marginTop: 16,
            }}>
              {isRegister
                ? 'Create your account to get started'
                : 'Welcome back — sign in to continue'}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {isRegister && (
              <>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Full Name
                  </div>
                  <input
                    style={inputStyle}
                    placeholder="Your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={e => e.target.style.borderColor = C.accent}
                    onBlur={e  => e.target.style.borderColor = C.border}
                  />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Company <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span>
                  </div>
                  <input
                    style={inputStyle}
                    placeholder="Your company name"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    onFocus={e => e.target.style.borderColor = C.accent}
                    onBlur={e  => e.target.style.borderColor = C.border}
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Email Address
              </div>
              <input
                style={inputStyle}
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e  => e.target.style.borderColor = C.border}
                required
              />
            </div>

            {/* Password with show/hide toggle */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Password
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...inputStyle, marginBottom: 0, paddingRight: 42 }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e  => e.target.style.borderColor = C.border}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position:       'absolute',
                    right:          12,
                    top:            '50%',
                    transform:      'translateY(-50%)',
                    background:     'none',
                    border:         'none',
                    cursor:         'pointer',
                    color:          C.textDim,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    padding:        0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                color:        C.red,
                fontSize:     12,
                marginBottom: 16,
                marginTop:    12,
                padding:      '10px 14px',
                background:   'rgba(255,78,106,0.08)',
                border:       '1px solid rgba(255,78,106,0.2)',
                borderRadius: 8,
                display:      'flex',
                alignItems:   'center',
                gap:          8,
              }}>
                ⚠ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width:        '100%',
                padding:      '13px',
                background:   loading ? '#1E2530' : C.grad,
                color:        loading ? C.textDim : '#fff',
                border:       'none',
                borderRadius: 10,
                fontSize:     14,
                fontWeight:   700,
                cursor:       loading ? 'not-allowed' : 'pointer',
                fontFamily:   'Inter, sans-serif',
                marginTop:    16,
                boxShadow:    loading ? 'none' : '0 4px 16px rgba(10,185,138,0.3)',
                transition:   'all 0.15s',
              }}
            >
              {loading
                ? 'Please wait...'
                : isRegister
                  ? 'Create My Account'
                  : 'Sign In to Novala'}
            </button>
          </form>

          {/* Toggle register/login */}
          <div style={{
            textAlign:  'center',
            marginTop:  24,
            fontSize:   13,
            color:      C.textDim,
            paddingTop: 20,
            borderTop:  `1px solid ${C.border}`,
          }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <span
              onClick={() => { setIsRegister(!isRegister); setError(''); setShowPassword(false); }}
              style={{
                color:      C.accent,
                cursor:     'pointer',
                marginLeft: 6,
                fontWeight: 600,
              }}
            >
              {isRegister ? 'Sign in' : 'Create account'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign:  'center',
          marginTop:  24,
          fontSize:   11,
          color:      '#2D3748',
          lineHeight: 1.6,
        }}>
          By signing in you agree to Novala's Terms of Service and Privacy Policy.
          <br/>
          © 2026 Novala — AI Financial Intelligence
        </div>
      </div>
    </div>
  );
}
