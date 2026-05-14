import React, { useState, useEffect } from 'react';
import {
  UserPlus, Shield, Pencil, Trash2, X, Check,
  Users, Mail, Clock, User, Filter, Crown,
  BookOpen, Eye, ChevronRight, AlertCircle, ArrowLeft,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';

const ACCENT = '#0AB98A';
const FONT   = "'Inter', -apple-system, sans-serif";
const API    = 'https://api.getnovala.com/api/v1';

const ROLES = {
  admin: {
    label:       'Admin',
    color:       ACCENT,
    bg:          'rgba(10,185,138,0.08)',
    border:      'rgba(10,185,138,0.2)',
    icon:        <Crown size={14} />,
    description: 'Full access — manage team, view all data, edit everything',
    permissions: ['View all data','Edit transactions','Upload documents','Manage team','Delete records','Export reports','Manage invoices'],
  },
  accountant: {
    label:       'Accountant',
    color:       '#3B82F6',
    bg:          'rgba(59,130,246,0.08)',
    border:      'rgba(59,130,246,0.2)',
    icon:        <BookOpen size={14} />,
    description: 'Can view and edit all financial data but cannot manage team',
    permissions: ['View all data','Edit transactions','Upload documents','Export reports','Manage invoices'],
  },
  staff: {
    label:       'Staff',
    color:       '#F59E0B',
    bg:          'rgba(245,158,11,0.08)',
    border:      'rgba(245,158,11,0.2)',
    icon:        <User size={14} />,
    description: 'Can upload documents and view their own uploads only',
    permissions: ['Upload documents','View own uploads'],
  },
  viewer: {
    label:       'Viewer',
    color:       '#64748B',
    bg:          'rgba(100,116,139,0.08)',
    border:      'rgba(100,116,139,0.2)',
    icon:        <Eye size={14} />,
    description: 'Read only — can view dashboard and reports',
    permissions: ['View dashboard','View reports'],
  },
};

const STATUS_STYLES = {
  pending:  { label: 'Pending',  color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'  },
  active:   { label: 'Active',   color: ACCENT,    bg: 'rgba(10,185,138,0.08)'  },
  inactive: { label: 'Inactive', color: '#64748B', bg: 'rgba(100,116,139,0.08)' },
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
      Authorization: 'Bearer ' + getToken(),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(res.status === 500 ? 'Server error. Please try again.' : 'Request failed (' + res.status + ')'); }
  if (!res.ok) throw new Error(data?.detail || data?.message || 'Request failed (' + res.status + ')');
  return data;
}

function Modal({ title, onClose, children }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: isMobile ? '20px 20px 0 0' : 12, width: isMobile ? '100%' : 480, maxWidth: isMobile ? '100%' : '90vw', maxHeight: isMobile ? '90vh' : '85vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, borderRadius: 6, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

function FieldInput({ label, required, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ fontSize: 10, fontWeight: 600, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          {label}{required && <span style={{ color: ACCENT }}> *</span>}
        </div>
      )}
      <input
        {...props}
        style={{ width: '100%', padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, color: '#0F172A', fontSize: 13, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => e.target.style.borderColor = ACCENT}
        onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
      />
    </div>
  );
}

function ActionBtn({ children, variant, onClick, disabled, small }) {
  const styles = {
    primary:   { bg: ACCENT,                    color: '#fff',    border: 'transparent'              },
    secondary: { bg: 'transparent',             color: '#64748B', border: '#E5E7EB'                  },
    danger:    { bg: 'rgba(239,68,68,0.08)',    color: '#EF4444', border: 'rgba(239,68,68,0.2)'      },
  };
  const s = styles[variant || 'primary'];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: small ? '6px 12px' : '9px 16px', borderRadius: 8, background: disabled ? '#E5E7EB' : s.bg, color: disabled ? '#94A3B8' : s.color, border: '1px solid ' + s.border, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: small ? 11 : 12, fontWeight: 500, fontFamily: FONT, whiteSpace: 'nowrap', opacity: disabled ? 0.7 : 1 }}
    >
      {children}
    </button>
  );
}

export default function Team() {
  const [members,      setMembers]      = useState([]);
  const [summary,      setSummary]      = useState({ total: 0, active: 0, pending: 0 });
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [invEmail,     setInvEmail]     = useState('');
  const [invName,      setInvName]      = useState('');
  const [invRole,      setInvRole]      = useState('viewer');
  const [editRole,     setEditRole]     = useState('viewer');
  const isMobile = useIsMobile();

  const load = async () => {
    try {
      const data = await safeFetch(API + '/team/members');
      if (data.members) { setMembers(data.members); setSummary(data.summary || {}); }
      else if (Array.isArray(data)) setMembers(data);
    } catch (e) { console.error('load team error:', e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

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
      await safeFetch(API + '/team/invite', {
        method: 'POST',
        body: JSON.stringify({
          email:     invEmail.trim(),
          full_name: invName.trim() || null,
          role:      invRole,
          // The invite link in the email will take new users to /register
          // and existing users to /login — handled by the invite token flow
          redirect_url: window.location.origin + '/accept-invite',
        }),
      });
      closeModal();
      showSuccess('Invitation sent to ' + invEmail);
      await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleEditRole = async () => {
    if (!selected) return;
    setSaving(true); setError('');
    try {
      await safeFetch(API + '/team/' + selected.id + '/role', {
        method: 'PATCH',
        body: JSON.stringify({ role: editRole }),
      });
      closeModal();
      showSuccess('Role updated to ' + (ROLES[editRole]?.label));
      await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true); setError('');
    try {
      await safeFetch(API + '/team/' + selected.id, { method: 'DELETE' });
      closeModal();
      showSuccess(selected.email + ' removed from team');
      await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleActivate = async (member) => {
    try {
      await safeFetch(API + '/team/' + member.id + '/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' }),
      });
      showSuccess(member.email + ' marked as active');
      await load();
    } catch (e) { setError(e.message); }
  };

  const filteredMembers      = activeFilter ? members.filter(m => m.role === activeFilter) : members;
  const getMemberCountByRole = (role) => members.filter(m => m.role === role).length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC', fontFamily: FONT, minHeight: '100vh' }}>

      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(248,250,252,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E5E7EB', padding: isMobile ? '14px 16px' : '14px 32px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 0 }}>

        {/* Back arrow — mobile only */}
        {isMobile && (
          <button
            onClick={() => window.location.href = '/'}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13, fontWeight: 600, fontFamily: FONT, padding: 0, marginBottom: 4 }}
          >
            <ArrowLeft size={16} /> Dashboard
          </button>
        )}

        <div>
          <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>Team Access</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Manage team members and their permissions</div>
        </div>
        <button
          onClick={() => { setModal('invite'); setError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: FONT, alignSelf: isMobile ? 'stretch' : 'auto', justifyContent: isMobile ? 'center' : 'flex-start' }}
        >
          <UserPlus size={14} /> Invite Member
        </button>
      </div>

      <div style={{ padding: isMobile ? '16px' : '24px 32px' }}>

        {success && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', color: ACCENT, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={14} />{success}
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14, marginBottom: isMobile ? 16 : 24 }}>
          {[
            { label: 'Total Members', value: summary.total  || members.length, color: ACCENT    },
            { label: 'Active',        value: summary.active  || 0,             color: ACCENT    },
            { label: 'Pending',       value: summary.pending || 0,             color: '#F59E0B' },
            { label: 'Roles',         value: 4,                                color: '#3B82F6' },
          ].map(sc => (
            <div key={sc.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: isMobile ? '14px' : '18px 20px' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{sc.label}</div>
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: sc.color }}>{sc.value}</div>
            </div>
          ))}
        </div>

        {/* Role cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 12, marginBottom: isMobile ? 16 : 24 }}>
          {Object.entries(ROLES).map(([key, role]) => {
            const isSelected = activeFilter === key;
            const count      = getMemberCountByRole(key);
            return (
              <div
                key={key}
                onClick={() => setActiveFilter(isSelected ? null : key)}
                style={{ background: isSelected ? role.bg : '#fff', border: '2px solid ' + (isSelected ? role.color : '#E5E7EB'), borderRadius: 12, padding: isMobile ? '12px' : '16px 18px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = role.color; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#E5E7EB'; }}
              >
                {isSelected && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: role.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={11} color="#fff" />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: role.bg, border: '1px solid ' + role.border, color: role.color, flexShrink: 0 }}>
                    {role.icon}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? role.color : '#0F172A' }}>{role.label}</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>{count} member{count !== 1 ? 's' : ''}</div>
                {!isMobile && (
                  <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>{role.description}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Filter banner */}
        {activeFilter && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 8, marginBottom: 14, background: ROLES[activeFilter]?.bg, border: '1px solid ' + ROLES[activeFilter]?.border }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={13} color={ROLES[activeFilter]?.color} />
              <span style={{ fontSize: 13, color: ROLES[activeFilter]?.color, fontWeight: 500 }}>
                {filteredMembers.length} {ROLES[activeFilter]?.label} member{filteredMembers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button onClick={() => setActiveFilter(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ROLES[activeFilter]?.color, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <X size={12} /> Clear
            </button>
          </div>
        )}

        {/* Members list */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: isMobile ? '14px 16px' : '18px 22px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                {activeFilter ? ROLES[activeFilter]?.label + ' Members' : 'Team Members'}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {!isMobile && filteredMembers.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 120px 200px', padding: '8px 22px', borderBottom: '1px solid #E5E7EB' }}>
              {['MEMBER', 'ROLE', 'STATUS', 'INVITED', 'ACTIONS'].map(h => (
                <div key={h} style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.12em' }}>{h}</div>
              ))}
            </div>
          )}

          {loading && <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading team...</div>}

          {!loading && filteredMembers.length === 0 && (
            <div style={{ textAlign: 'center', padding: isMobile ? 40 : 60, color: '#64748B' }}>
              <Users size={40} color="#CBD5E1" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
                {activeFilter ? 'No ' + ROLES[activeFilter]?.label + ' members yet' : 'No team members yet'}
              </div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>
                Invite your accountant, staff or business partners
              </div>
              <ActionBtn onClick={() => { if (activeFilter) setInvRole(activeFilter); setModal('invite'); }}>
                <UserPlus size={13} /> Invite Member
              </ActionBtn>
            </div>
          )}

          {filteredMembers.map((member) => {
            const role = ROLES[member.role] || ROLES.viewer;
            const ss   = STATUS_STYLES[member.status] || STATUS_STYLES.pending;

            if (isMobile) {
              return (
                <div key={member.id} style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: role.bg, border: '1px solid ' + role.border, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color, flexShrink: 0 }}>
                      {role.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.full_name || 'Unnamed'}</div>
                      <div style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: role.bg, border: '1px solid ' + role.border, fontSize: 11, fontWeight: 600, color: role.color, flexShrink: 0 }}>
                      {role.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: ss.bg, fontSize: 11, fontWeight: 600, color: ss.color }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: ss.color }} />{ss.label}
                    </span>
                    {member.invited_at && (
                      <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} />
                        {new Date(member.invited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {member.status === 'pending' && (
                      <button onClick={() => handleActivate(member)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', color: ACCENT, cursor: 'pointer', fontSize: 11, fontFamily: FONT }}>
                        <Check size={11} /> Activate
                      </button>
                    )}
                    <button onClick={() => { setSelected(member); setEditRole(member.role); setModal('edit'); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, background: 'transparent', border: '1px solid #E5E7EB', color: '#64748B', cursor: 'pointer', fontSize: 11, fontFamily: FONT }}>
                      <Pencil size={11} /> Edit
                    </button>
                    <button onClick={() => { setSelected(member); setModal('delete'); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, background: 'transparent', border: '1px solid #E5E7EB', color: '#64748B', cursor: 'pointer', fontSize: 11, fontFamily: FONT }}>
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={member.id}
                style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 120px 200px', padding: '14px 22px', borderBottom: '1px solid #E5E7EB', alignItems: 'center', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: role.bg, border: '1px solid ' + role.border, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color, flexShrink: 0 }}>
                    {role.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{member.full_name || 'Unnamed'}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{member.email}</div>
                  </div>
                </div>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: role.bg, border: '1px solid ' + role.border, fontSize: 11, fontWeight: 600, color: role.color }}>
                    <Shield size={10} />{role.label}
                  </span>
                </div>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: ss.bg, fontSize: 11, fontWeight: 600, color: ss.color }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: ss.color }} />{ss.label}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>
                  {member.invited_at
                    ? new Date(member.invited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {member.status === 'pending' && (
                    <button onClick={() => handleActivate(member)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: 'rgba(10,185,138,0.08)', border: '1px solid rgba(10,185,138,0.2)', color: ACCENT, cursor: 'pointer', fontSize: 11, fontFamily: FONT }}>
                      <Check size={11} /> Activate
                    </button>
                  )}
                  <button
                    onClick={() => { setSelected(member); setEditRole(member.role); setModal('edit'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: 'transparent', border: '1px solid #E5E7EB', color: '#64748B', cursor: 'pointer', fontSize: 11, fontFamily: FONT }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; e.currentTarget.style.color = '#3B82F6'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#64748B'; }}
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={() => { setSelected(member); setModal('delete'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: 'transparent', border: '1px solid #E5E7EB', color: '#64748B', cursor: 'pointer', fontSize: 11, fontFamily: FONT }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#EF4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#64748B'; }}
                  >
                    <Trash2 size={11} /> Remove
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
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(10,185,138,0.06)', border: '1px solid rgba(10,185,138,0.15)', fontSize: 12, color: '#64748B', marginBottom: 16, lineHeight: 1.6 }}>
            The invited person will receive an email with a link. If they are new to Novala they will be taken to create an account. If they already have an account they will be taken to sign in. After signing in they will automatically have access based on the role you assign.
          </div>
          <FieldInput label="Email Address" required type="email" placeholder="colleague@company.com" value={invEmail} onChange={e => setInvEmail(e.target.value)} />
          <FieldInput label="Full Name" placeholder="Their name (optional)" value={invName} onChange={e => setInvName(e.target.value)} />

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Role <span style={{ color: ACCENT }}>*</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(ROLES).map(([key, role]) => (
                <div
                  key={key}
                  onClick={() => setInvRole(key)}
                  style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid ' + (invRole === key ? role.border : '#E5E7EB'), background: invRole === key ? role.bg : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <span style={{ color: role.color }}>{role.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: invRole === key ? role.color : '#334155' }}>{role.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B', lineHeight: 1.4 }}>{role.description}</div>
                </div>
              ))}
            </div>
          </div>

          {invEmail && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(10,185,138,0.06)', border: '1px solid rgba(10,185,138,0.15)', fontSize: 12, color: '#334155', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={13} color={ACCENT} />
              Inviting <strong>{invEmail}</strong> as <strong style={{ color: ROLES[invRole]?.color }}>{ROLES[invRole]?.label}</strong>
            </div>
          )}

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={13} />{error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <ActionBtn variant="secondary" onClick={closeModal}>Cancel</ActionBtn>
            <ActionBtn onClick={handleInvite} disabled={saving}>
              <Mail size={12} />{saving ? 'Sending...' : 'Send Invitation'}
            </ActionBtn>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {modal === 'edit' && selected && (
        <Modal title="Edit Member Role" onClose={closeModal}>
          <div style={{ padding: '12px 14px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E5E7EB', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={14} color="#64748B" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{selected.full_name || 'Unnamed'}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>{selected.email}</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Select New Role</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(ROLES).map(([key, role]) => (
                <div
                  key={key}
                  onClick={() => setEditRole(key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + (editRole === key ? role.border : '#E5E7EB'), background: editRole === key ? role.bg : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <span style={{ color: role.color }}>{role.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: editRole === key ? role.color : '#334155', marginBottom: 2 }}>{role.label}</div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>{role.description}</div>
                  </div>
                  {editRole === key && <Check size={14} color={role.color} />}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={13} />{error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <ActionBtn variant="secondary" onClick={closeModal}>Cancel</ActionBtn>
            <ActionBtn onClick={handleEditRole} disabled={saving}>
              <Check size={12} />{saving ? 'Saving...' : 'Save Changes'}
            </ActionBtn>
          </div>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {modal === 'delete' && selected && (
        <Modal title="Remove Team Member" onClose={closeModal}>
          <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={22} color="#EF4444" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
              Remove {selected.full_name || selected.email}?
            </div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
              This will immediately revoke their access to Novala. This action cannot be undone.
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={13} />{error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <ActionBtn variant="secondary" onClick={closeModal}>Cancel</ActionBtn>
            <button
              onClick={handleDelete}
              disabled={saving}
              style={{ flex: 1, padding: '9px 16px', borderRadius: 8, background: '#EF4444', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, fontFamily: FONT, opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Trash2 size={12} />{saving ? 'Removing...' : 'Yes, Remove Member'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}