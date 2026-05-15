import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { Eye, EyeOff, TrendingUp } from 'lucide-react';

const DARK   = '#08090D';
const CARD   = '#111318';
const BORDER = '#1E2128';
const MINT   = '#00FFB2';
const WHITE  = '#F1F5F9';
const MUTED  = '#64748B';
const FONT   = "'Inter', -apple-system, sans-serif";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);

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

  const handleLogin = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password)     { setError('Please enter your password.');       return; }
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      localStorage.setItem('user_email', email);
      onLogin(token, email);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        const d = detail.toLowerCase();
        if (d.includes('password'))                                    setError('Incorrect password. Please try again.');
        else if (d.includes('email') || d.includes('not found'))      setError('No account found with this email.');
        else if (d.includes('invalid'))                               setError('Invalid email or password.');
        else                                                          setError(detail);
      } else {
        setError('Could not connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:DARK, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT, padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:420 }}>

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

          <div style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:6, letterSpacing:'-0.02em' }}>
            Welcome back
          </div>
          <div style={{ fontSize:14, color:MUTED, marginBottom:32, lineHeight:1.6 }}>
            Sign in to your Novala account
          </div>

          {/* Email */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Email Address</div>
            <input
              autoFocus
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => { setEmail(e.target.value); if (error) setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = MINT}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Password</div>
            <div style={{ position:'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ ...inputStyle, paddingRight:44 }}
                onFocus={e => e.target.style.borderColor = MINT}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:MUTED, display:'flex' }}>
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign:'right', marginBottom:20 }}>
            <span style={{ fontSize:12, color:MINT, cursor:'pointer', fontWeight:600 }}>Forgot password?</span>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:16 }}>
              <span style={{ fontSize:13, color:'#EF4444' }}>⚠ {error}</span>
            </div>
          )}

          {/* Submit */}
          <button onClick={handleLogin} disabled={loading} style={{
            width:'100%',
            padding:'13px',
            borderRadius:12,
            background: loading ? '#1E2128' : MINT,
            color: loading ? MUTED : DARK,
            border:'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize:14,
            fontWeight:700,
            fontFamily:FONT,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            gap:8,
            boxShadow: loading ? 'none' : '0 4px 20px rgba(0,255,178,0.25)',
            transition:'all 0.15s',
          }}>
            <TrendingUp size={16}/>
            {loading ? 'Signing in...' : 'Sign in to Novala'}
          </button>

          {/* Register link */}
          <div style={{ textAlign:'center', marginTop:24, fontSize:13, color:MUTED, paddingTop:20, borderTop:'1px solid '+BORDER }}>
            Don't have an account?{' '}
            <span onClick={() => navigate('/register')} style={{ color:MINT, cursor:'pointer', fontWeight:600 }}>
              Create account
            </span>
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:11, color:'#1E2128' }}>
          By continuing you agree to Novala's Terms of Service and Privacy Policy.
        </div>
      </div>

      <style>{`* { box-sizing: border-box; } input::placeholder { color: #334155; }`}</style>
    </div>
  );
}