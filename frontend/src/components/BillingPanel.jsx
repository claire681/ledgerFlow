import React, { useState, useEffect } from 'react';
import {
  CreditCard, Calendar, CheckCircle2, XCircle, AlertCircle,
  ExternalLink, ArrowRight,
} from 'lucide-react';
import { L } from '../styles/light';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://api.getnovala.com';
const ACCENT = '#0AB98A';

function getAuthHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token') || '';
  return token ? { Authorization: 'Bearer ' + token } : {};
}

const PLAN_NAMES = {
  starter: 'Novala Starter',
  pro: 'Novala Pro',
  premium: 'Novala Premium',
};
const PLAN_PRICES = { starter: 19, pro: 49, premium: 99 };

export default function BillingPanel() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch(API_BASE + '/api/v1/subscriptions/me', { headers: getAuthHeaders() })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) { setSub(data); setLoading(false); })
      .catch(function () { setSub(null); setLoading(false); });
  }, []);

  async function handleCancel() {
    if (!window.confirm("Cancel your Novala subscription? You'll keep access until the end of the current billing period.")) return;
    setCancelling(true);
    setMsg(null);
    try {
      const res = await fetch(API_BASE + '/api/v1/subscriptions/cancel', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error('HTTP ' + res.status + ' ' + txt);
      }
      const updated = await res.json();
      setSub(updated);
      setMsg({ type: 'success', text: 'Subscription cancelled. You keep access until the end of your billing period.' });
    } catch (err) {
      setMsg({ type: 'error', text: 'Could not cancel: ' + err.message });
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 32, color: L.textMuted, fontSize: 14, textAlign: 'center' }}>Loading billing details...</div>;
  }

  const isActive = sub && (sub.status === 'ACTIVE' || sub.status === 'APPROVAL_PENDING' || sub.status === 'APPROVED');
  const isCancelled = sub && sub.status === 'CANCELLED';

  const radius = L.radius || 12;
  const radiusSm = L.radiusSm || 8;
  const border = L.border || '#E5E7EB';

  const buttonPrimary = {
    padding: '10px 20px',
    background: ACCENT,
    color: '#fff',
    borderRadius: radiusSm,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  };

  const buttonSecondary = {
    padding: '10px 20px',
    background: 'transparent',
    color: L.text,
    border: '1px solid ' + border,
    borderRadius: radiusSm,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  };

  const buttonDanger = {
    padding: '10px 20px',
    background: 'transparent',
    color: '#EF4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: radiusSm,
    fontSize: 13,
    fontWeight: 600,
    cursor: cancelling ? 'wait' : 'pointer',
    opacity: cancelling ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  };

  const statusColor = isActive ? ACCENT : isCancelled ? '#EF4444' : '#F59E0B';
  const statusBg = isActive ? 'rgba(10, 185, 138, 0.1)' : isCancelled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)';
  const StatusIcon = isActive ? CheckCircle2 : isCancelled ? XCircle : AlertCircle;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: L.text, marginBottom: 4 }}>Billing and subscription</div>
        <div style={{ fontSize: 13, color: L.textMuted }}>Manage your Novala plan, payment method, and billing history.</div>
      </div>

      {msg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: radiusSm,
          background: msg.type === 'success' ? 'rgba(10, 185, 138, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: '1px solid ' + (msg.type === 'success' ? 'rgba(10, 185, 138, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
          color: msg.type === 'success' ? ACCENT : '#EF4444',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      <div style={{
        padding: 28,
        background: '#fff',
        border: '1px solid ' + border,
        borderRadius: radius,
      }}>
        {!sub ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CreditCard size={40} style={{ color: L.textMuted, marginBottom: 14 }} />
            <div style={{ fontSize: 17, fontWeight: 600, color: L.text, marginBottom: 6 }}>No active subscription</div>
            <div style={{ fontSize: 13, color: L.textMuted, marginBottom: 20 }}>You are on the Free plan. Upgrade anytime to unlock all features.</div>
            <a href="/pricing" style={buttonPrimary}>View plans <ArrowRight size={14} /></a>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: L.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Current plan</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: L.text, lineHeight: 1.2 }}>
                  {PLAN_NAMES[sub.plan_slug] || sub.plan_slug}
                </div>
                {PLAN_PRICES[sub.plan_slug] && (
                  <div style={{ fontSize: 14, color: L.textMuted, marginTop: 4 }}>
                    ${PLAN_PRICES[sub.plan_slug]} USD per month
                  </div>
                )}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                background: statusBg,
                color: statusColor,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
              }}>
                <StatusIcon size={12} />
                {sub.status}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 20,
              padding: '20px 0',
              borderTop: '1px solid ' + border,
              borderBottom: '1px solid ' + border,
              marginBottom: 24,
            }}>
              {sub.current_period_end && (
                <div>
                  <div style={{ fontSize: 11, color: L.textMuted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={11} /> {isActive ? 'Renews on' : 'Period ends'}
                  </div>
                  <div style={{ fontSize: 14, color: L.text, fontWeight: 600 }}>
                    {new Date(sub.current_period_end).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              )}
              {sub.last_payment_at && (
                <div>
                  <div style={{ fontSize: 11, color: L.textMuted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={11} /> Last payment
                  </div>
                  <div style={{ fontSize: 14, color: L.text, fontWeight: 600 }}>
                    {new Date(sub.last_payment_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, color: L.textMuted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CreditCard size={11} /> Payment method
                </div>
                <div style={{ fontSize: 14, color: L.text, fontWeight: 600 }}>PayPal</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {isActive && (
                <>
                  <a href="/pricing" style={buttonPrimary}>Change plan</a>
                  <button type="button" onClick={handleCancel} disabled={cancelling} style={buttonDanger}>
                    {cancelling ? 'Cancelling...' : 'Cancel subscription'}
                  </button>
                </>
              )}
              {isCancelled && (
                <a href="/pricing" style={buttonPrimary}>Resubscribe</a>
              )}
              <a href="https://www.paypal.com/myaccount/autopay/" target="_blank" rel="noopener noreferrer" style={buttonSecondary}>
                Manage on PayPal <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: L.textMuted, lineHeight: 1.6 }}>
        Need help with billing? <a href="mailto:support@getnovala.com" style={{ color: ACCENT, textDecoration: 'none', fontWeight: 600 }}>Contact support</a>.
      </div>
    </div>
  );
}
