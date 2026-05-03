import React, { useState, useEffect } from 'react';
import {
  User, Lock, Bell, CreditCard, Trash2,
  CheckCircle, AlertCircle, Save, Eye, EyeOff,
  Sparkles, ArrowRight, Shield,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';

const BASE     = 'https://api.getnovala.com/api/v1';
const ACCENT   = '#0AB98A';
const getToken = () => localStorage.getItem('token') || '';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

const TABS = [
  { id:'profile',       label:'Profile',       icon:User       },
  { id:'security',      label:'Security',       icon:Lock       },
  { id:'notifications', label:'Notifications',  icon:Bell       },
  { id:'billing',       label:'Billing',        icon:CreditCard },
  { id:'danger',        label:'Danger Zone',    icon:Trash2     },
];

const TIMEZONES = [
  "America/Edmonton","America/Vancouver","America/Toronto","America/New_York",
  "America/Chicago","America/Denver","America/Los_Angeles","America/Phoenix",
  "America/Halifax","Europe/London","Europe/Paris","Europe/Berlin",
  "Africa/Lagos","Africa/Nairobi","Africa/Johannesburg","Africa/Cairo",
  "Asia/Dubai","Asia/Kolkata","Asia/Singapore","Asia/Tokyo","Asia/Shanghai",
  "Australia/Sydney","Pacific/Auckland","UTC",
];

const FREQUENCIES = [
  { value:'daily',     label:'Daily',          desc:'Every day at your chosen time'          },
  { value:'weekly',    label:'Weekly',          desc:'Once a week on your chosen day'         },
  { value:'monthly',   label:'Monthly',         desc:'Once a month on your chosen date'       },
  { value:'quarterly', label:'Every 3 Months',  desc:'4 times a year on your chosen date'     },
  { value:'biannual',  label:'Every 6 Months',  desc:'Twice a year on your chosen date'       },
];

const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const HOURS    = ['05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
const DAYS     = Array.from({length:28}, (_,i) => i+1);

function Section({ title, desc, children }) {
  return (
    <div style={{ ...card, padding:'24px', marginBottom:16 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:15, fontWeight:700, color:L.text }}>{title}</div>
        {desc && <div style={{ fontSize:12, color:L.textMuted, marginTop:4 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      <input {...props} style={{ width:'100%', padding:'10px 12px', background:L.pageBg, border:`1px solid ${L.border}`, borderRadius:L.radiusSm, color:L.text, fontSize:13, fontFamily:L.font, outline:'none', boxSizing:'border-box' }}
        onFocus={e => e.target.style.borderColor=ACCENT}
        onBlur={e  => e.target.style.borderColor=L.border}/>
    </div>
  );
}

function Alert({ type, message }) {
  const isSuccess = type === 'success';
  return (
    <div style={{ padding:'10px 14px', borderRadius:L.radiusSm, background:isSuccess?L.accentSoft:'rgba(239,68,68,0.08)', border:`1px solid ${isSuccess?L.accentBorder:'rgba(239,68,68,0.2)'}`, color:isSuccess?ACCENT:'#EF4444', fontSize:12, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
      {isSuccess ? <CheckCircle size={13}/> : <AlertCircle size={13}/>}{message}
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const isMobile = useIsMobile();

  // Profile state
  const [fullName,    setFullName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [company,     setCompany]     = useState('');
  const [savingP,     setSavingP]     = useState(false);
  const [profileMsg,  setProfileMsg]  = useState(null);

  // Security state
  const [currentPw,   setCurrentPw]  = useState('');
  const [newPw,        setNewPw]      = useState('');
  const [confirmPw,    setConfirmPw]  = useState('');
  const [showPw,       setShowPw]     = useState(false);
  const [savingS,      setSavingS]    = useState(false);
  const [securityMsg,  setSecurityMsg] = useState(null);

  // Notifications state
  const [briefEnabled,  setBriefEnabled]  = useState(true);
  const [frequency,     setFrequency]     = useState('daily');
  const [briefTime,     setBriefTime]     = useState('08:00');
  const [briefDay,      setBriefDay]      = useState('Monday');
  const [briefDate,     setBriefDate]     = useState(1);
  const [timezone,      setTimezone]      = useState('America/Edmonton');
  const [savingN,       setSavingN]       = useState(false);
  const [notifMsg,      setNotifMsg]      = useState(null);

  // Billing state
  const [billingStatus, setBillingStatus] = useState(null);

  // Danger state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => {
    // Load profile
    const em = localStorage.getItem('user_email') || '';
    const nm = localStorage.getItem('user_name')  || '';
    const co = localStorage.getItem('company_name') || '';
    setEmail(em); setFullName(nm); setCompany(co);

    // Load briefing settings
    fetch(`${BASE}/briefing/settings`, { headers:{ Authorization:`Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => {
        setBriefEnabled(d.briefing_enabled ?? true);
        setBriefTime(d.briefing_time || '08:00');
        setTimezone(d.briefing_timezone || 'America/Edmonton');
      }).catch(() => {});

    // Load billing status
    fetch(`${BASE}/billing/status`, { headers:{ Authorization:`Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => setBillingStatus(d))
      .catch(() => {});
  }, []);

  const saveProfile = async () => {
    setSavingP(true); setProfileMsg(null);
    try {
      const res = await fetch(`${BASE}/auth/profile`, {
        method:  'PATCH',
        headers: { Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body:    JSON.stringify({ full_name:fullName, company }),
      });
      if (!res.ok) throw new Error('Failed to save');
      localStorage.setItem('user_name', fullName);
      localStorage.setItem('company_name', company);
      setProfileMsg({ type:'success', text:'Profile saved successfully' });
    } catch (e) {
      setProfileMsg({ type:'error', text:'Could not save profile. Please try again.' });
    } finally { setSavingP(false); }
  };

  const savePassword = async () => {
    if (newPw !== confirmPw) { setSecurityMsg({ type:'error', text:'Passwords do not match' }); return; }
    if (newPw.length < 8)    { setSecurityMsg({ type:'error', text:'Password must be at least 8 characters' }); return; }
    setSavingS(true); setSecurityMsg(null);
    try {
      const res = await fetch(`${BASE}/auth/change-password`, {
        method:  'POST',
        headers: { Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body:    JSON.stringify({ current_password:currentPw, new_password:newPw }),
      });
      if (!res.ok) throw new Error('Failed');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setSecurityMsg({ type:'success', text:'Password changed successfully' });
    } catch (e) {
      setSecurityMsg({ type:'error', text:'Could not change password. Check your current password.' });
    } finally { setSavingS(false); }
  };

  const saveNotifications = async () => {
    setSavingN(true); setNotifMsg(null);
    try {
      const res = await fetch(`${BASE}/briefing/settings`, {
        method:  'POST',
        headers: { Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body:    JSON.stringify({
          briefing_enabled:   briefEnabled,
          briefing_time:      briefTime,
          briefing_timezone:  timezone,
          briefing_frequency: frequency,
          briefing_day:       briefDay,
          briefing_date:      briefDate,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setNotifMsg({ type:'success', text:'Notification settings saved' });
    } catch (e) {
      setNotifMsg({ type:'error', text:'Could not save settings. Please try again.' });
    } finally { setSavingN(false); }
  };

  const trialDaysLeft = () => {
    if (!billingStatus?.trial_ends_at) return 14;
    return Math.max(0, Math.ceil((new Date(billingStatus.trial_ends_at) - new Date()) / (1000*60*60*24)));
  };

  const selectStyle = { width:'100%', padding:'10px 12px', background:L.pageBg, border:`1px solid ${L.border}`, borderRadius:L.radiusSm, color:L.text, fontSize:13, fontFamily:L.font, outline:'none', marginBottom:16 };

  return (
    <div style={page}>
      <div style={{ ...topBar, padding:isMobile?'16px':undefined }}>
        <div>
          <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Settings</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Manage your account and preferences</div>
        </div>
      </div>

      <div style={{ padding:isMobile?'12px':'24px 28px', display:'flex', gap:20, flexDirection:isMobile?'column':'row', alignItems:'flex-start' }}>

        {/* Tab sidebar */}
        <div style={{ ...card, padding:'8px', width:isMobile?'100%':200, flexShrink:0 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon     = tab.icon;
            return (
              <div key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:L.radiusSm, cursor:'pointer', marginBottom:2, background:isActive?L.accentSoft:'transparent', color:isActive?ACCENT:L.textMuted, transition:'all 0.1s' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background=L.pageBg; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent'; }}>
                <Icon size={14} color={isActive?ACCENT:L.textMuted}/>
                <span style={{ fontSize:13, fontWeight:isActive?600:400, color:isActive?ACCENT:L.textMuted }}>{tab.label}</span>
                {tab.id==='danger' && <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#EF4444' }}/>}
              </div>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* Profile */}
          {activeTab === 'profile' && (
            <Section title="Profile" desc="Update your personal and business information">
              {profileMsg && <Alert type={profileMsg.type} message={profileMsg.text}/>}
              <Field label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name"/>
              <Field label="Email Address" value={email} disabled placeholder="your@email.com" style={{ opacity:0.6, cursor:'not-allowed' }}/>
              <div style={{ fontSize:11, color:L.textMuted, marginTop:-12, marginBottom:16 }}>Email cannot be changed. Contact support to update.</div>
              <Field label="Company Name" value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company name"/>
              <button onClick={saveProfile} disabled={savingP}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:L.radiusSm, background:savingP?L.textFaint:ACCENT, color:'#fff', border:'none', cursor:savingP?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:L.font }}>
                <Save size={13}/>{savingP?'Saving...':'Save Profile'}
              </button>
            </Section>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <Section title="Security" desc="Change your password to keep your account secure">
              {securityMsg && <Alert type={securityMsg.type} message={securityMsg.text}/>}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Current Password</div>
                <div style={{ position:'relative' }}>
                  <input type={showPw?'text':'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password"
                    style={{ width:'100%', padding:'10px 40px 10px 12px', background:L.pageBg, border:`1px solid ${L.border}`, borderRadius:L.radiusSm, color:L.text, fontSize:13, fontFamily:L.font, outline:'none', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor=ACCENT}
                    onBlur={e  => e.target.style.borderColor=L.border}/>
                  <button onClick={() => setShowPw(p => !p)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:L.textMuted, display:'flex' }}>
                    {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
              <Field label="New Password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 8 characters"/>
              <Field label="Confirm New Password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password"/>
              <div style={{ padding:'10px 14px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}`, fontSize:12, color:L.textMuted, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <Shield size={13} color={ACCENT}/> Use at least 8 characters with a mix of letters and numbers
              </div>
              <button onClick={savePassword} disabled={savingS||!currentPw||!newPw||!confirmPw}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:L.radiusSm, background:savingS||!currentPw||!newPw||!confirmPw?L.textFaint:ACCENT, color:'#fff', border:'none', cursor:savingS||!currentPw||!newPw||!confirmPw?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:L.font }}>
                <Lock size={13}/>{savingS?'Changing...':'Change Password'}
              </button>
            </Section>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Section title="Notifications" desc="Control when and how often you receive your financial briefing">
              {notifMsg && <Alert type={notifMsg.type} message={notifMsg.text}/>}

              {/* Toggle */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}`, marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:L.text }}>Morning Briefing</div>
                  <div style={{ fontSize:11, color:L.textMuted, marginTop:2 }}>AI sends a financial summary to your email</div>
                </div>
                <div onClick={() => setBriefEnabled(p => !p)} style={{ width:44, height:24, borderRadius:12, background:briefEnabled?ACCENT:'#E2E8F0', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:4, left:briefEnabled?22:4, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
                </div>
              </div>

              {briefEnabled && (
                <>
                  {/* Frequency */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Frequency</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {FREQUENCIES.map(f => (
                        <div key={f.value} onClick={() => setFrequency(f.value)}
                          style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:L.radiusSm, border:`2px solid ${frequency===f.value?ACCENT:L.border}`, background:frequency===f.value?L.accentSoft:'#fff', cursor:'pointer', transition:'all 0.15s' }}>
                          <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${frequency===f.value?ACCENT:L.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {frequency===f.value && <div style={{ width:8, height:8, borderRadius:'50%', background:ACCENT }}/>}
                          </div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:L.text }}>{f.label}</div>
                            <div style={{ fontSize:11, color:L.textMuted }}>{f.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Day picker for weekly */}
                  {frequency === 'weekly' && (
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Day of Week</div>
                      <select value={briefDay} onChange={e => setBriefDay(e.target.value)} style={selectStyle}>
                        {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Date picker for monthly/quarterly/biannual */}
                  {['monthly','quarterly','biannual'].includes(frequency) && (
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Day of Month</div>
                      <select value={briefDate} onChange={e => setBriefDate(Number(e.target.value))} style={selectStyle}>
                        {DAYS.map(d => <option key={d} value={d}>{d}{d===1?'st':d===2?'nd':d===3?'rd':'th'} of the month</option>)}
                      </select>
                    </div>
                  )}

                  {/* Time */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Time</div>
                    <select value={briefTime} onChange={e => setBriefTime(e.target.value)} style={selectStyle}>
                      {HOURS.map(h => {
                        const [hr] = h.split(':');
                        const hour = parseInt(hr);
                        const ampm = hour < 12 ? 'AM' : 'PM';
                        const disp = hour === 0 ? '12' : hour > 12 ? hour-12 : hour;
                        return <option key={h} value={h}>{disp}:00 {ampm}</option>;
                      })}
                    </select>
                  </div>

                  {/* Timezone */}
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Timezone</div>
                    <select value={timezone} onChange={e => setTimezone(e.target.value)} style={selectStyle}>
                      {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace('_',' ')}</option>)}
                    </select>
                  </div>
                </>
              )}

              <button onClick={saveNotifications} disabled={savingN}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:L.radiusSm, background:savingN?L.textFaint:ACCENT, color:'#fff', border:'none', cursor:savingN?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:L.font }}>
                <Save size={13}/>{savingN?'Saving...':'Save Notifications'}
              </button>
            </Section>
          )}

          {/* Billing */}
          {activeTab === 'billing' && (
            <Section title="Billing & Plan" desc="Manage your subscription and payment details">
              <div style={{ padding:'16px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}`, marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:L.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Current Plan</div>
                <div style={{ fontSize:18, fontWeight:700, color:L.text, marginBottom:4, textTransform:'capitalize' }}>
                  {billingStatus?.plan || 'Trial'} Plan
                </div>
                <div style={{ fontSize:12, color:L.textMuted }}>
                  {billingStatus?.subscription_status === 'active' ? 'Active subscription — renews monthly' :
                   billingStatus?.subscription_status === 'trialing' ? 'In trial period' :
                   `${trialDaysLeft()} days left in free trial`}
                </div>
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button onClick={() => window.location.href='/billing'}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:L.radiusSm, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:L.font }}>
                  <Sparkles size={13}/> Manage Billing
                </button>
                {billingStatus?.subscription_status === 'active' && (
                  <button onClick={async () => {
                    const res  = await fetch(`${BASE}/billing/portal`, { method:'POST', headers:{ Authorization:`Bearer ${getToken()}` } });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:L.radiusSm, background:'transparent', border:`1px solid ${L.border}`, color:L.textMuted, cursor:'pointer', fontSize:13, fontFamily:L.font }}>
                    <ArrowRight size={13}/> Manage Subscription
                  </button>
                )}
              </div>
            </Section>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && (
            <div style={{ ...card, padding:'24px', marginBottom:16, border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.02)' }}>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#EF4444' }}>Danger Zone</div>
                <div style={{ fontSize:12, color:L.textMuted, marginTop:4 }}>These actions are permanent and cannot be undone</div>
              </div>

              <div style={{ padding:'16px', borderRadius:L.radiusSm, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:L.text, marginBottom:4 }}>Delete Account</div>
                <div style={{ fontSize:12, color:L.textMuted, marginBottom:16 }}>
                  This will permanently delete your account, all documents, transactions and financial data. This cannot be reversed.
                </div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:L.textMuted, marginBottom:6 }}>Type <strong>DELETE</strong> to confirm</div>
                  <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="Type DELETE here"
                    style={{ width:'100%', padding:'10px 12px', background:'#fff', border:'1px solid rgba(239,68,68,0.3)', borderRadius:L.radiusSm, color:L.text, fontSize:13, fontFamily:L.font, outline:'none', boxSizing:'border-box' }}/>
                </div>
                <button
                  disabled={deleteConfirm !== 'DELETE' || deleting}
                  onClick={() => { if (deleteConfirm === 'DELETE') alert('Account deletion coming soon. Please contact support@novala.com'); }}
                  style={{ padding:'10px 20px', borderRadius:L.radiusSm, background:deleteConfirm==='DELETE'?'#EF4444':'#CBD5E1', color:'#fff', border:'none', cursor:deleteConfirm==='DELETE'?'pointer':'not-allowed', fontSize:13, fontWeight:600, fontFamily:L.font }}>
                  {deleting ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}