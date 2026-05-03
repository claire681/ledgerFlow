import React, { useState, useEffect } from 'react';
import { L, card, page, topBar } from '../styles/light';
import {
  CheckCircle, Sparkles, ArrowRight, Crown,
  Zap, Shield, Star, AlertTriangle,
} from 'lucide-react';

const BASE     = 'https://api.getnovala.com/api/v1';
const getToken = () => localStorage.getItem('token') || '';
const ACCENT   = '#0AB98A';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

const PLANS = [
  {
    id:       'essentials',
    name:     'Essentials',
    price:    20,
    icon:     <Zap size={22} color="#0AB98A"/>,
    color:    '#0AB98A',
    bg:       'rgba(10,185,138,0.06)',
    border:   'rgba(10,185,138,0.2)',
    features: [
      'Up to 100 transactions/month',
      'Document upload & AI extraction',
      'Basic financial reports',
      'Invoice tracking',
      'Tax calculator',
      'Email support',
    ],
  },
  {
    id:       'premium',
    name:     'Premium',
    price:    30,
    icon:     <Crown size={22} color="#8B5CF6"/>,
    color:    '#8B5CF6',
    bg:       'rgba(139,92,246,0.06)',
    border:   'rgba(139,92,246,0.2)',
    popular:  true,
    features: [
      'Unlimited transactions',
      'Everything in Essentials',
      'Reconciliation & Ledger View',
      'Variance Reports',
      'Bill Pay tracking',
      'Document Comparison',
      'Advanced AI analysis',
      'Priority support',
    ],
  },
];

export default function Billing() {
  const [status,    setStatus]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [success,   setSuccess]   = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')   === 'true') setSuccess(true);
    if (params.get('cancelled') === 'true') setCancelled(true);

    const load = async () => {
      try {
        const res  = await fetch(`${BASE}/billing/status`, {
          headers: { Authorization:`Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleUpgrade = async (planId) => {
    setUpgrading(planId);
    try {
      const res  = await fetch(`${BASE}/billing/create-checkout`, {
        method:  'POST',
        headers: { Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body:    JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) { console.error(e); }
    finally { setUpgrading(null); }
  };

  const trialDaysLeft = () => {
    if (!status?.trial_ends_at) return 14;
    const diff = new Date(status.trial_ends_at) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isActive  = status?.subscription_status === 'active';
  const isTrial   = !isActive;
  const daysLeft  = trialDaysLeft();
  const pad       = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>
      <div style={{ ...topBar, flexDirection:isMobile?'column':'row', alignItems:isMobile?'flex-start':'center', gap:isMobile?10:0, padding:isMobile?'16px':undefined }}>
        <div>
          <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Billing & Plans</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Manage your Novala subscription</div>
        </div>
      </div>

      <div style={{ padding: pad }}>

        {/* Success banner */}
        {success && (
          <div style={{ padding:'14px 18px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:ACCENT, fontSize:13, fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
            <CheckCircle size={18}/> Payment successful! Your plan has been activated. Welcome to Novala Premium!
          </div>
        )}

        {/* Cancelled banner */}
        {cancelled && (
          <div style={{ padding:'14px 18px', borderRadius:L.radiusSm, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', color:'#F59E0B', fontSize:13, fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
            <AlertTriangle size={18}/> Payment was cancelled. You can upgrade anytime below.
          </div>
        )}

        {/* Trial banner */}
        {!loading && isTrial && (
          <div style={{ padding:'16px 20px', borderRadius:L.radius, background:'linear-gradient(135deg,rgba(10,185,138,0.08),rgba(14,165,233,0.08))', border:`1px solid ${L.accentBorder}`, marginBottom:24, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Sparkles size={20} color="#fff"/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:L.text }}>
                {daysLeft > 0 ? `${daysLeft} days left in your free trial` : 'Your free trial has ended'}
              </div>
              <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>
                {daysLeft > 0 ? 'Upgrade before your trial ends to keep full access' : 'Choose a plan to continue using Novala'}
              </div>
            </div>
            {daysLeft <= 3 && (
              <span style={{ fontSize:11, fontWeight:700, color:'#EF4444', background:'rgba(239,68,68,0.1)', padding:'4px 10px', borderRadius:20, border:'1px solid rgba(239,68,68,0.2)', flexShrink:0 }}>
                Expires soon
              </span>
            )}
          </div>
        )}

        {/* Current plan */}
        {!loading && isActive && (
          <div style={{ ...card, padding:isMobile?'16px':'20px 24px', marginBottom:24, display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <CheckCircle size={20} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:L.text }}>
                Active — {status?.plan === 'premium' ? 'Premium' : 'Essentials'} Plan
              </div>
              <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>Your subscription is active and renews monthly</div>
            </div>
          </div>
        )}

        {/* Plans */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(2,1fr)', gap:isMobile?14:20, marginBottom:24 }}>
          {PLANS.map(plan => {
            const isCurrentPlan = status?.plan === plan.id && isActive;
            return (
              <div key={plan.id} style={{ ...card, padding:isMobile?'20px':'28px', position:'relative', border:plan.popular?`2px solid ${plan.border}`:`1px solid ${L.border}` }}>

                {plan.popular && (
                  <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:plan.color, color:'#fff', fontSize:10, fontWeight:700, padding:'3px 14px', borderRadius:20, letterSpacing:'0.08em', whiteSpace:'nowrap' }}>
                    MOST POPULAR
                  </div>
                )}

                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:plan.bg, border:`1px solid ${plan.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {plan.icon}
                  </div>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color:L.text }}>{plan.name}</div>
                    <div style={{ fontSize:24, fontWeight:800, color:plan.color, letterSpacing:'-0.02em' }}>
                      ${plan.price}<span style={{ fontSize:13, fontWeight:500, color:L.textMuted }}>/month</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom:20 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <CheckCircle size={13} color={plan.color} style={{ flexShrink:0 }}/>
                      <span style={{ fontSize:12, color:L.textSub }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
                  disabled={isCurrentPlan || upgrading === plan.id}
                  style={{ width:'100%', padding:'12px', borderRadius:L.radiusSm, background:isCurrentPlan?L.pageBg:plan.popular?`linear-gradient(135deg,${plan.color},#0EA5E9)`:`linear-gradient(135deg,#0AB98A,#0EA5E9)`, color:isCurrentPlan?L.textMuted:'#fff', border:isCurrentPlan?`1px solid ${L.border}`:'none', cursor:isCurrentPlan?'default':'pointer', fontSize:13, fontWeight:600, fontFamily:L.font, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                  {isCurrentPlan ? (
                    <><CheckCircle size={14}/> Current Plan</>
                  ) : upgrading === plan.id ? (
                    'Redirecting to Stripe...'
                  ) : (
                    <><ArrowRight size={14}/> Get {plan.name}</>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Why upgrade */}
        <div style={{ ...card, padding:isMobile?'16px':'24px' }}>
          <div style={{ fontSize:14, fontWeight:700, color:L.text, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <Star size={15} color={ACCENT}/> Why upgrade to Premium?
          </div>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:12 }}>
            {[
              { icon:<Shield size={18} color={ACCENT}/>,   title:'Save money',      desc:'One caught overcharge or duplicate payment pays for months of subscription' },
              { icon:<Sparkles size={18} color="#8B5CF6"/>, title:'Save time',       desc:'AI does the bookkeeping work that used to take hours every week'           },
              { icon:<Zap size={18} color="#0EA5E9"/>,      title:'Stay compliant',  desc:'Never miss a bill, reconciliation issue, or budget overrun again'          },
            ].map(i => (
              <div key={i.title} style={{ padding:'14px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}` }}>
                <div style={{ marginBottom:8 }}>{i.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:L.text, marginBottom:4 }}>{i.title}</div>
                <div style={{ fontSize:11, color:L.textMuted, lineHeight:1.5 }}>{i.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}