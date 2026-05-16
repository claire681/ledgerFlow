import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Eye, EyeOff, CheckCircle } from 'lucide-react';

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

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token,        setToken]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [success,      setSuccess]      = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) {
      setError('Invalid or missing reset link. Please request a new one.');
    } else {
      setToken(t);
    }
  }, []);

  const inputStyle = {
    width:'100%', padding:'13px 16px', borderRadius:10,
    border:'1px solid ' + BORDER, background:'#0D1526',
    color:WHITE, fontSize:14, fontFamily:FONT,
    outline:'none', boxSizing:'border-box',
    transition:'border-color 0.2s, box-shadow 0.2s',
  };

  const handleReset = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPass) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(API + '/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Could not reset password. Please try again.');
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (e) {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg, ${DARK} 0%, ${DARK2} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT, padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:420 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:MINT, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(0,212,164,0.3)' }}>
              <TrendingUp size={18} color="#0F1729"/>
            </div>
            <span style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>
              No<span style={{ color:MINT }}>vala</span>
            </span>
          </div>
        </div>

        <div style={{ background:CARD, borderRadius:20, padding:'36px', border:'1px solid '+BORDER, boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }}>

          {success ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:MINTDIM, border:'2px solid '+MINT, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 0 32px rgba(0,212,164,0.2)' }}>
                <CheckCircle size={32} color={MINT}/>
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:10 }}>Password updated!</div>
              <div style={{ fontSize:14, color:MUTED, lineHeight:1.6 }}>
                Your password has been successfully updated. Taking you to the sign in page in a moment.
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:6, letterSpacing:'-0.02em' }}>
                Create new password
              </div>
              <div style={{ fontSize:14, color:MUTED, marginBottom:28, lineHeight:1.6 }}>
                Enter your new password below. Make sure it is at least 8 characters.
              </div>

              {/* New password */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
                  New Password
                </div>
                <div style={{ position:'relative' }}>
                  <input
                    autoFocus
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
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
                  Confirm Password
                </div>
                <div style={{ position:'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPass}
                    onChange={e => { setConfirmPass(e.target.value); if (error) setError(''); }}
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

              {error && (
                <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:16 }}>
                  <span style={{ fontSize:13, color:'#EF4444' }}>⚠ {error}</span>
                </div>
              )}

              <button onClick={handleReset} disabled={loading || !token} style={{
                width:'100%', padding:'13px', borderRadius:12,
                background: loading || !token ? '#1E2D4A' : MINT,
                color: loading || !token ? MUTED : '#0F1729',
                border:'none', cursor: loading || !token ? 'not-allowed' : 'pointer',
                fontSize:14, fontWeight:700, fontFamily:FONT,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow: loading || !token ? 'none' : '0 4px 20px rgba(0,212,164,0.3)',
                transition:'all 0.2s',
              }}>
                <TrendingUp size={16}/>
                {loading ? 'Updating password...' : 'Update my password'}
              </button>

              <div style={{ textAlign:'center', marginTop:16 }}>
                <span onClick={() => navigate('/login')}
                  style={{ fontSize:12, color:MUTED, cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color=MINT}
                  onMouseLeave={e => e.currentTarget.style.color=MUTED}>
                  Back to sign in
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`* { box-sizing: border-box; } input::placeholder { color: #334155; }`}</style>
    </div>
  );
}