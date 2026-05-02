import React, { useState, useEffect } from 'react';
import {
  UserPlus, Shield, Pencil, Trash2, X, Check,
  Users, Mail, Clock, User, Filter, Crown,
  BookOpen, Eye, ChevronRight, AlertCircle,
} from 'lucide-react';
import { T } from '../theme';
import { useAI } from '../hooks/useAI';

const ROLES = {
  admin: {
    label:       'Admin',
    color:       T.accent,
    bg:          T.accentSoft,
    border:      T.accentBorder,
    icon:        <Crown size={14} />,
    emoji:       '👑',
    description: 'Full access — manage team, view all data, edit everything',
    permissions: ['View all data','Edit transactions','Upload documents','Manage team','Delete records','Export reports','Manage invoices','Manage AI actions'],
  },
  accountant: {
    label:       'Accountant',
    color:       T.blue,
    bg:          T.blueSoft,
    border:      'rgba(59,130,246,0.2)',
    icon:        <BookOpen size={14} />,
    emoji:       '📊',
    description: 'Can view and edit all financial data but cannot manage team',
    permissions: ['View all data','Edit transactions','Upload documents','Export reports','Manage invoices'],
  },
  staff: {
    label:       'Staff',
    color:       T.gold,
    bg:          T.goldSoft,
    border:      'rgba(245,158,11,0.2)',
    icon:        <User size={14} />,
    emoji:       '👤',
    description: 'Can upload documents and view their own uploads only',
    permissions: ['Upload documents','View own uploads'],
  },
  viewer: {
    label:       'Viewer',
    color:       T.textSub,
    bg:          'rgba(148,163,184,0.06)',
    border:      'rgba(148,163,184,0.15)',
    icon:        <Eye size={14} />,
    emoji:       '👁',
    description: 'Read only — can view dashboard and reports',
    permissions: ['View dashboard','View reports'],
  },
};

const STATUS_STYLES = {
  pending:  { label:'Pending',  color:T.gold,      bg:T.goldSoft },
  active:   { label:'Active',   color:T.accent,    bg:T.accentSoft },
  inactive: { label:'Inactive', color:T.textMuted, bg:'rgba(74,85,104,0.1)' },
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('access_token') || '';
}

async function safeFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(res.status === 500 ? 'Server error. Please try again.' : `Request failed (${res.status})`); }
  if (!res.ok) throw new Error(data?.detail || data?.message || `Request failed (${res.status})`);
  return data;
}

function Modal({ title, onClose, children }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:isMobile?'flex-end':'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
      <div style={{ background:T.bgElevated, border:`1px solid ${T.border}`, borderRadius:isMobile?'20px 20px 0 0':T.radiusLg, width:isMobile?'100%':480, maxWidth:isMobile?'100%':'90vw', maxHeight:isMobile?'90vh':'85vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:`1px solid ${T.border}`, position:'sticky', top:0, background:T.bgElevated, zIndex:10 }}>
          <div style={{ fontSize:15, fontWeight:600, color:T.text }}>{title}</div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:T.textMuted, padding:4, borderRadius:6, display:'flex' }}>
            <X size={18}/>
          </button>
        </div>
        <div style={{ padding:'20px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

function Input({ label, required, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && (
        <div style={{ fontSize:10, fontWeight:600, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>
          {label}{required && <span style={{ color:T.accent }}> *</span>}
        </div>
      )}
      <input {...props} style={{ width:'100%', padding:'10px 12px', background:T.bgSurface, border:`1px solid ${T.border}`, borderRadius:T.radiusSm, color:T.text, fontSize:13, fontFamily:T.font, outline:'none', boxSizing:'border-box', ...props.style }}
        onFocus={e => e.target.style.borderColor = T.accentBorder}
        onBlur={e  => e.target.style.borderColor = T.border}/>
    </div>
  );
}

function Btn({ children, variant = 'primary', onClick, disabled, small }) {
  const styles = {
    primary:   { bg:T.accent,      color:'#07090D', border:'transparent'         },
    secondary: { bg:'transparent', color:T.textSub, border:T.border              },
    danger:    { bg:T.redSoft,     color:T.red,     border:'rgba(244,63,94,0.2)' },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{ display:'flex', alignItems:'center', gap:6, padding:small?'6px 12px':'9px 16px', borderRadius:T.radiusSm, background:disabled?T.textFaint:s.bg, color:disabled?T.textMuted:s.color, border:`1px solid ${s.border}`, cursor:disabled?'not-allowed':'pointer', fontSize:small?11:12, fontWeight:500, fontFamily:T.font, whiteSpace:'nowrap', opacity:disabled?0.6:1 }}>
      {children}
    </button>
  );
}

export default function Team() {
  const [members,      setMembers]      = useState([]);
  const [summary,      setSummary]      = useState({ total:0, active:0, pending:0, roles_used:0 });
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [activeFilter, setActiveFilter] = useState(null);

  const [invEmail, setInvEmail] = useState('');
  const [invName,  setInvName]  = useState('');
  const [invRole,  setInvRole]  = useState('viewer');
  const [editRole, setEditRole] = useState('viewer');

  const { setPageContext } = useAI();
  const isMobile = useIsMobile();

  const load = async () => {
    try {
      const data = await safeFetch('https://api.getnovala.com/api/v1/team/members');
      if (data.members) { setMembers(data.members); setSummary(data.summary || {}); }
      else if (Array.isArray(data)) { setMembers(data); }
    } catch (e) { console.error('load team error:', e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setPageContext('team', {
      page:'team', total_members:members.length,
      active:  members.filter(m=>m.status==='active').length,
      pending: members.filter(m=>m.status==='pending').length,
      roles:   ['admin','accountant','staff','viewer'],
      members_by_role: {
        admin:      members.filter(m=>m.role==='admin').length,
        accountant: members.filter(m=>m.role==='accountant').length,
        staff:      members.filter(m=>m.role==='staff').length,
        viewer:     members.filter(m=>m.role==='viewer').length,
      },
    });
  }, [members]);

  const closeModal = () => {
    setModal(null); setSelected(null); setError('');
    setInvEmail(''); setInvName(''); setInvRole('viewer');
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };

  const handleInvite = async () => {
    if (!invEmail.trim())        { setError('Email address is required'); return; }
    if (!invEmail.includes('@')) { setError('Please enter a valid email address'); return; }
    setSaving(true); setError('');
    try {
      await safeFetch('https://api.getnovala.com/api/v1/team/invite', {
        method:'POST', body:JSON.stringify({ email:invEmail.trim(), full_name:invName.trim()||null, role:invRole }),
      });
      closeModal(); showSuccess(`✓ Invitation sent to ${invEmail}`); await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleEditRole = async () => {
    if (!selected) return;
    setSaving(true); setError('');
    try {
      await safeFetch(`https://api.getnovala.com/api/v1/team/${selected.id}/role`, {
        method:'PATCH', body:JSON.stringify({ role:editRole }),
      });
      closeModal(); showSuccess(`✓ Role updated to ${ROLES[editRole]?.label}`); await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true); setError('');
    try {
      await safeFetch(`https://api.getnovala.com/api/v1/team/${selected.id}`, { method:'DELETE' });
      closeModal(); showSuccess(`✓ ${selected.email} removed from team`); await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleActivate = async (member) => {
    try {
      await safeFetch(`https://api.getnovala.com/api/v1/team/${member.id}/status`, {
        method:'PATCH', body:JSON.stringify({ status:'active' }),
      });
      showSuccess(`✓ ${member.email} marked as active`); await load();
    } catch (e) { setError(e.message); }
  };

  const filteredMembers      = activeFilter ? members.filter(m => m.role === activeFilter) : members;
  const getMemberCountByRole = (role) => members.filter(m => m.role === role).length;

  return (
    <div style={{ flex:1, overflowY:'auto', background:T.bg, fontFamily:T.font, minHeight:'100vh' }}>

      {/* Top bar */}
      <div style={{ position:'sticky', top:0, zIndex:10, background:`${T.bg}EE`, backdropFilter:'blur(12px)', borderBottom:`1px solid ${T.border}`, padding:isMobile?'14px 16px':'14px 28px', display:'flex', flexDirection:isMobile?'column':'row', justifyContent:'space-between', alignItems:isMobile?'flex-start':'center', gap:isMobile?10:0 }}>
        <div>
          <div style={{ fontSize:isMobile?16:18, fontWeight:600, color:T.text, letterSpacing:'-0.02em' }}>Team Access</div>
          <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>Manage team members and their permissions</div>
        </div>
        <button onClick={() => { setModal('invite'); setError(''); }}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:T.radiusSm, background:T.accent, color:'#07090D', border:'none', cursor:'pointer', fontSize:12, fontWeight:500, fontFamily:T.font, alignSelf:isMobile?'stretch':'auto', justifyContent:isMobile?'center':'flex-start' }}>
          <UserPlus size={13}/> Invite Member
        </button>
      </div>

      <div style={{ padding:isMobile?'16px':'24px 28px' }}>

        {success && (
          <div style={{ padding:'12px 16px', borderRadius:T.radiusSm, background:T.accentSoft, border:`1px solid ${T.accentBorder}`, color:T.accent, fontSize:13, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <Check size={14}/>{success}
          </div>
        )}

        {/* Summary cards — 2x2 on mobile, 4 across on desktop */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:isMobile?10:14, marginBottom:isMobile?16:24 }}>
          {[
            { label:'Total Members', value:summary.total  ||members.length, color:T.accent },
            { label:'Active',        value:summary.active ||0,              color:T.accent },
            { label:'Pending',       value:summary.pending||0,              color:T.gold   },
            { label:'Roles',         value:4,                               color:T.blue   },
          ].map(sc => (
            <div key={sc.label} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:T.radius, padding:isMobile?'14px':'18px 20px' }}>
              <div style={{ fontSize:9, fontWeight:600, color:T.textMuted, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>{sc.label}</div>
              <div style={{ fontSize:isMobile?20:24, fontWeight:600, color:sc.color, fontFamily:T.fontMono }}>{sc.value}</div>
            </div>
          ))}
        </div>

        {/* Role cards — 2x2 on mobile, 4 across on desktop */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:isMobile?10:12, marginBottom:isMobile?16:24 }}>
          {Object.entries(ROLES).map(([key, role]) => {
            const isSelected = activeFilter === key;
            const count      = getMemberCountByRole(key);
            return (
              <div key={key} onClick={() => setActiveFilter(isSelected ? null : key)}
                style={{ background:isSelected?role.bg:T.bgCard, border:`2px solid ${isSelected?role.color:T.border}`, borderRadius:T.radius, padding:isMobile?'12px':'16px 18px', cursor:'pointer', transition:'all 0.2s', position:'relative' }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor=role.color; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor=T.border; }}>
                {isSelected && (
                  <div style={{ position:'absolute', top:8, right:8, width:20, height:20, borderRadius:'50%', background:role.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Check size={11} color="#fff"/>
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:7, background:role.bg, border:`1px solid ${role.border}`, color:role.color, flexShrink:0 }}>
                    {role.icon}
                  </span>
                  <span style={{ fontSize:12, fontWeight:600, color:isSelected?role.color:T.text }}>{role.label}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:10, color:T.textMuted, background:T.bgSurface, padding:'2px 8px', borderRadius:20, border:`1px solid ${T.border}` }}>
                    {count} member{count!==1?'s':''}
                  </span>
                  {!isMobile && <ChevronRight size={12} color={isSelected?role.color:T.textFaint}/>}
                </div>
                {!isMobile && (
                  <>
                    <div style={{ fontSize:11, color:T.textMuted, lineHeight:1.5, marginBottom:8 }}>{role.description}</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                      {role.permissions.slice(0, 3).map(p => (
                        <div key={p} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:isSelected?T.textSub:T.textMuted }}>
                          <Check size={9} color={role.color}/>{p}
                        </div>
                      ))}
                      {role.permissions.length > 3 && (
                        <div style={{ fontSize:9, color:T.textFaint }}>+{role.permissions.length-3} more</div>
                      )}
                    </div>
                  </>
                )}
                <div style={{ marginTop:8, fontSize:9, color:isSelected?role.color:T.textFaint, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                  {isSelected ? '✓ Filtering' : 'Tap to filter'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter banner */}
        {activeFilter && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderRadius:T.radiusSm, marginBottom:14, background:ROLES[activeFilter]?.bg, border:`1px solid ${ROLES[activeFilter]?.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Filter size={13} color={ROLES[activeFilter]?.color}/>
              <span style={{ fontSize:13, color:ROLES[activeFilter]?.color, fontWeight:500 }}>
                {filteredMembers.length} {ROLES[activeFilter]?.label} member{filteredMembers.length!==1?'s':''}
              </span>
            </div>
            <button onClick={() => setActiveFilter(null)} style={{ background:'none', border:'none', cursor:'pointer', color:ROLES[activeFilter]?.color, fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
              <X size={12}/> Clear
            </button>
          </div>
        )}

        {/* Members list */}
        <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:T.radius, overflow:'hidden' }}>
          <div style={{ padding:isMobile?'14px 16px':'18px 22px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:T.text }}>
                {activeFilter ? `${ROLES[activeFilter]?.label} Members` : 'Team Members'}
              </div>
              <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>
                {filteredMembers.length} member{filteredMembers.length!==1?'s':''}
              </div>
            </div>
          </div>

          {/* Desktop table header */}
          {filteredMembers.length > 0 && !isMobile && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 140px 120px 120px 200px', padding:'8px 22px', borderBottom:`1px solid ${T.border}` }}>
              {['MEMBER','ROLE','STATUS','INVITED','ACTIONS'].map(h => (
                <div key={h} style={{ fontSize:9, fontWeight:600, color:T.textMuted, letterSpacing:'0.12em' }}>{h}</div>
              ))}
            </div>
          )}

          {loading && <div style={{ padding:40, textAlign:'center', color:T.textMuted }}>Loading team...</div>}

          {!loading && filteredMembers.length === 0 && (
            <div style={{ textAlign:'center', padding:isMobile?40:60, color:T.textMuted }}>
              <Users size={40} color={T.textFaint} style={{ marginBottom:12 }}/>
              <div style={{ fontSize:15, fontWeight:600, color:T.textSub, marginBottom:6 }}>
                {activeFilter ? `No ${ROLES[activeFilter]?.label} members yet` : 'No team members yet'}
              </div>
              <div style={{ fontSize:13, marginBottom:20 }}>
                {activeFilter ? `Invite someone as ${ROLES[activeFilter]?.label}` : 'Invite your accountant, staff or business partners'}
              </div>
              <Btn onClick={() => { if (activeFilter) setInvRole(activeFilter); setModal('invite'); }}>
                <UserPlus size={13}/> {activeFilter ? `Invite ${ROLES[activeFilter]?.label}` : 'Invite First Member'}
              </Btn>
            </div>
          )}

          {filteredMembers.map((member) => {
            const role = ROLES[member.role] || ROLES.viewer;
            const ss   = STATUS_STYLES[member.status] || STATUS_STYLES.pending;

            // ── Mobile card layout ──
            if (isMobile) {
              return (
                <div key={member.id} style={{ padding:'14px 16px', borderBottom:`1px solid ${T.border}` }}>
                  {/* Row 1: avatar + name + role badge */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:role.bg, border:`1px solid ${role.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:role.color, flexShrink:0 }}>
                      {role.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{member.full_name || 'Unnamed'}</div>
                      <div style={{ fontSize:11, color:T.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{member.email}</div>
                    </div>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:role.bg, border:`1px solid ${role.border}`, fontSize:11, fontWeight:600, color:role.color, flexShrink:0 }}>
                      {role.label}
                    </span>
                  </div>

                  {/* Row 2: status + date */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:ss.bg, fontSize:11, fontWeight:600, color:ss.color }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:ss.color }}/>{ss.label}
                    </span>
                    {member.invited_at && (
                      <span style={{ fontSize:11, color:T.textMuted, display:'flex', alignItems:'center', gap:4 }}>
                        <Clock size={10}/>
                        {new Date(member.invited_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Row 3: actions */}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {member.status === 'pending' && (
                      <button onClick={() => handleActivate(member)}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:T.radiusSm, background:T.accentSoft, border:`1px solid ${T.accentBorder}`, color:T.accent, cursor:'pointer', fontSize:11, fontFamily:T.font }}>
                        <Check size={11}/> Activate
                      </button>
                    )}
                    <button onClick={() => { setSelected(member); setEditRole(member.role); setModal('edit'); }}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:T.radiusSm, background:'transparent', border:`1px solid ${T.border}`, color:T.textMuted, cursor:'pointer', fontSize:11, fontFamily:T.font }}>
                      <Pencil size={11}/> Edit
                    </button>
                    <button onClick={() => { setSelected(member); setModal('delete'); }}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:T.radiusSm, background:'transparent', border:`1px solid ${T.border}`, color:T.textMuted, cursor:'pointer', fontSize:11, fontFamily:T.font }}>
                      <Trash2 size={11}/> Remove
                    </button>
                  </div>
                </div>
              );
            }

            // ── Desktop row layout ──
            return (
              <div key={member.id}
                style={{ display:'grid', gridTemplateColumns:'1fr 140px 120px 120px 200px', padding:'14px 22px', borderBottom:`1px solid ${T.border}`, alignItems:'center', transition:'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background=T.bgElevated}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:role.bg, border:`1px solid ${role.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:role.color, flexShrink:0 }}>
                    {role.icon}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:T.text }}>{member.full_name||'Unnamed'}</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{member.email}</div>
                  </div>
                </div>
                <div>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:role.bg, border:`1px solid ${role.border}`, fontSize:11, fontWeight:600, color:role.color }}>
                    <Shield size={10}/>{role.label}
                  </span>
                </div>
                <div>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:ss.bg, fontSize:11, fontWeight:600, color:ss.color }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:ss.color }}/>{ss.label}
                  </span>
                </div>
                <div style={{ fontSize:11, color:T.textMuted }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <Clock size={11}/>
                    {member.invited_at ? new Date(member.invited_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {member.status === 'pending' && (
                    <button onClick={() => handleActivate(member)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:T.radiusSm, background:T.accentSoft, border:`1px solid ${T.accentBorder}`, color:T.accent, cursor:'pointer', fontSize:11, fontFamily:T.font }}>
                      <Check size={11}/> Activate
                    </button>
                  )}
                  <button onClick={() => { setSelected(member); setEditRole(member.role); setModal('edit'); }}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:T.radiusSm, background:'transparent', border:`1px solid ${T.border}`, color:T.textMuted, cursor:'pointer', fontSize:11, fontFamily:T.font }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(59,130,246,0.3)'; e.currentTarget.style.color=T.blue; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.textMuted; }}>
                    <Pencil size={11}/> Edit
                  </button>
                  <button onClick={() => { setSelected(member); setModal('delete'); }}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:T.radiusSm, background:'transparent', border:`1px solid ${T.border}`, color:T.textMuted, cursor:'pointer', fontSize:11, fontFamily:T.font }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(244,63,94,0.3)'; e.currentTarget.style.color=T.red; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.textMuted; }}>
                    <Trash2 size={11}/> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INVITE MODAL */}
      {modal === 'invite' && (
        <Modal title="Invite Team Member" onClose={closeModal}>
          <Input label="Email Address" required type="email" placeholder="colleague@company.com" value={invEmail} onChange={e => setInvEmail(e.target.value)}/>
          <Input label="Full Name" placeholder="Their name (optional)" value={invName} onChange={e => setInvName(e.target.value)}/>

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:600, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>
              Role <span style={{ color:T.accent }}>*</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {Object.entries(ROLES).map(([key, role]) => (
                <div key={key} onClick={() => setInvRole(key)}
                  style={{ padding:'12px 14px', borderRadius:T.radiusSm, border:`1px solid ${invRole===key?role.border:T.border}`, background:invRole===key?role.bg:'transparent', cursor:'pointer' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                    <span style={{ color:role.color }}>{role.icon}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:invRole===key?role.color:T.textSub }}>{role.label}</span>
                  </div>
                  <div style={{ fontSize:10, color:T.textMuted, lineHeight:1.4 }}>{role.description}</div>
                </div>
              ))}
            </div>
          </div>

          {invEmail && (
            <div style={{ padding:'10px 14px', borderRadius:T.radiusSm, background:T.accentSoft, border:`1px solid ${T.accentBorder}`, fontSize:12, color:T.textSub, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <Mail size={13} color={T.accent}/>
              Inviting <strong style={{ color:T.text }}>{invEmail}</strong> as <strong style={{ color:ROLES[invRole]?.color }}>{ROLES[invRole]?.label}</strong>
            </div>
          )}

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:T.radiusSm, background:T.redSoft, border:'1px solid rgba(244,63,94,0.2)', color:T.red, fontSize:12, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <AlertCircle size={13}/>{error}
            </div>
          )}

          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
            <Btn onClick={handleInvite} disabled={saving}>
              <Mail size={12}/>{saving?'Sending...':'Send Invitation'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {modal === 'edit' && selected && (
        <Modal title="Edit Member Role" onClose={closeModal}>
          <div style={{ padding:'12px 14px', borderRadius:T.radiusSm, background:T.bgElevated, border:`1px solid ${T.border}`, marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
            <User size={14} color={T.textSub}/>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:T.text }}>{selected.full_name||'Unnamed'}</div>
              <div style={{ fontSize:11, color:T.textMuted }}>{selected.email}</div>
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:600, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Select New Role</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {Object.entries(ROLES).map(([key, role]) => (
                <div key={key} onClick={() => setEditRole(key)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:T.radiusSm, border:`1px solid ${editRole===key?role.border:T.border}`, background:editRole===key?role.bg:'transparent', cursor:'pointer' }}>
                  <span style={{ color:role.color }}>{role.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:editRole===key?role.color:T.textSub, marginBottom:2 }}>{role.label}</div>
                    <div style={{ fontSize:10, color:T.textMuted }}>{role.description}</div>
                  </div>
                  {editRole===key && <Check size={14} color={role.color}/>}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:T.radiusSm, background:T.redSoft, border:'1px solid rgba(244,63,94,0.2)', color:T.red, fontSize:12, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <AlertCircle size={13}/>{error}
            </div>
          )}

          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
            <Btn onClick={handleEditRole} disabled={saving}>
              <Check size={12}/>{saving?'Saving...':'Save Changes'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {modal === 'delete' && selected && (
        <Modal title="Remove Team Member" onClose={closeModal}>
          <div style={{ textAlign:'center', padding:'16px 0 24px' }}>
            <div style={{ width:56, height:56, borderRadius:14, background:T.redSoft, border:'1px solid rgba(244,63,94,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Trash2 size={22} color={T.red}/>
            </div>
            <div style={{ fontSize:15, fontWeight:600, color:T.text, marginBottom:8 }}>
              Remove {selected.full_name||selected.email}?
            </div>
            <div style={{ fontSize:13, color:T.textMuted, lineHeight:1.6 }}>
              This will immediately revoke their access to Novala. This action cannot be undone.
            </div>
          </div>

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:T.radiusSm, background:T.redSoft, border:'1px solid rgba(244,63,94,0.2)', color:T.red, fontSize:12, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <AlertCircle size={13}/>{error}
            </div>
          )}

          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
            <button onClick={handleDelete} disabled={saving}
              style={{ flex:1, padding:'9px 16px', borderRadius:T.radiusSm, background:T.red, color:'#fff', border:'none', cursor:saving?'not-allowed':'pointer', fontSize:12, fontWeight:600, fontFamily:T.font, opacity:saving?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Trash2 size={12}/>{saving?'Removing...':'Yes, Remove Member'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
