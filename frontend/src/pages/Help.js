import React, { useState, useEffect } from 'react';
import {
  Send, CheckCircle, AlertCircle,
  MessageSquare, Book, Zap, Shield, CreditCard,
  ChevronRight, Mail, Clock,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';
import { useAI } from '../hooks/useAI';

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

const CATEGORIES = ['General', 'Billing', 'Bug Report', 'Feature Request', 'Account'];

const FAQS = [
  {
    icon: <Zap size={18} color="#0AB98A"/>,
    bg: 'rgba(10,185,138,0.08)', border: 'rgba(10,185,138,0.2)',
    question: 'How does AI document extraction work?',
    answer: 'When you upload a document, our AI reads the file and automatically extracts key information like vendor name, amount, date, and category. It then creates a transaction in your books automatically.',
  },
  {
    icon: <CreditCard size={18} color="#8B5CF6"/>,
    bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)',
    question: 'How does billing work?',
    answer: 'You get a 14-day free trial with full access. After 14 days your card is charged automatically based on the plan you chose. You can cancel anytime from the Billing page.',
  },
  {
    icon: <Shield size={18} color="#0EA5E9"/>,
    bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.2)',
    question: 'Is my financial data secure?',
    answer: 'Yes. All data is encrypted in transit and at rest. We use AWS for storage, which meets the highest security standards. We never share your data with third parties.',
  },
  {
    icon: <Book size={18} color="#F59E0B"/>,
    bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
    question: 'What file types can I upload?',
    answer: 'You can upload PDF, PNG, JPG, JPEG, CSV, TIFF, and WEBP files. Invoices, receipts, bank statements and contracts are all supported.',
  },
  {
    icon: <MessageSquare size={18} color="#EF4444"/>,
    bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',
    question: 'How do I reconcile transactions?',
    answer: 'Go to the Reconciliation page, select transactions and click Mark Reconciled. The AI can also help you find unmatched or duplicate transactions automatically.',
  },
  {
    icon: <Zap size={18} color="#0AB98A"/>,
    bg: 'rgba(10,185,138,0.08)', border: 'rgba(10,185,138,0.2)',
    question: 'How does Bill Pay work?',
    answer: 'Add your bills with vendor, amount and due date. When you mark a bill as paid, Novala automatically creates an expense transaction in your books so your records stay accurate.',
  },
];

export default function Help() {
  const [category, setCategory] = useState('General');
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState('');
  const { askAndOpen, setPageContext } = useAI();
  const isMobile = useIsMobile();

  useEffect(() => {
    setPageContext('help', { page:'help' });
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true); setError('');
    try {
      const email = localStorage.getItem('user_email') || 'Unknown';
      const res   = await fetch(`${BASE}/support/send`, {
        method:  'POST',
        headers: { Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body:    JSON.stringify({ category, subject, message, user_email: email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Failed');
      setSent(true);
      setSubject(''); setMessage(''); setCategory('General');
    } catch (e) {
      setError('Could not send message. Please try again later.');
    } finally { setSending(false); }
  };

  const pad = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>
      <div style={{ ...topBar, flexDirection:isMobile?'column':'row', alignItems:isMobile?'flex-start':'center', gap:isMobile?10:0, padding:isMobile?'16px':undefined }}>
        <div>
          <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>Help & Support</div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>We usually reply within 24 hours</div>
        </div>
        <button onClick={() => askAndOpen('I need help with Novala. What can you help me with?')}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:L.radiusSm, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', border:'none', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
          Ask AI Instead
        </button>
      </div>

      <div style={{ padding: pad }}>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:20 }}>

          {/* Left — Contact Form */}
          <div>
            <div style={{ ...card, padding:isMobile?'16px':'24px', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#0AB98A,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <MessageSquare size={18} color="#fff"/>
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:L.text }}>Send us a message</div>
                  <div style={{ fontSize:12, color:L.textMuted }}>We will reply to your email within 24 hours</div>
                </div>
              </div>

              {sent ? (
                <div style={{ textAlign:'center', padding:'30px 0' }}>
                  <div style={{ width:60, height:60, borderRadius:16, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                    <CheckCircle size={28} color={ACCENT}/>
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:L.text, marginBottom:6 }}>Message Sent!</div>
                  <div style={{ fontSize:13, color:L.textMuted, marginBottom:20 }}>We will get back to you within 24 hours at your registered email.</div>
                  <button onClick={() => setSent(false)}
                    style={{ padding:'10px 20px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:ACCENT, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:L.font }}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Category</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setCategory(c)}
                          style={{ padding:'6px 14px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:600, border:'1px solid', fontFamily:L.font, borderColor:category===c?ACCENT:L.border, background:category===c?L.accentSoft:'#fff', color:category===c?ACCENT:L.textMuted }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Subject</div>
                    <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of your issue..."
                      style={{ width:'100%', padding:'10px 12px', background:L.pageBg, border:`1px solid ${L.border}`, borderRadius:L.radiusSm, color:L.text, fontSize:13, fontFamily:L.font, outline:'none', boxSizing:'border-box' }}
                      onFocus={e => e.target.style.borderColor=ACCENT}
                      onBlur={e  => e.target.style.borderColor=L.border}/>
                  </div>

                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Message</div>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your problem in detail. Include steps to reproduce if it's a bug..." rows={6}
                      style={{ width:'100%', padding:'10px 12px', background:L.pageBg, border:`1px solid ${L.border}`, borderRadius:L.radiusSm, color:L.text, fontSize:13, fontFamily:L.font, outline:'none', resize:'vertical', boxSizing:'border-box' }}
                      onFocus={e => e.target.style.borderColor=ACCENT}
                      onBlur={e  => e.target.style.borderColor=L.border}/>
                  </div>

                  {error && (
                    <div style={{ padding:'10px 14px', borderRadius:L.radiusSm, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', fontSize:12, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                      <AlertCircle size={13}/>{error}
                    </div>
                  )}

                  <button onClick={handleSend} disabled={sending||!subject.trim()||!message.trim()}
                    style={{ width:'100%', padding:'12px', borderRadius:L.radiusSm, background:sending||!subject.trim()||!message.trim()?L.textFaint:'linear-gradient(135deg,#0AB98A,#0EA5E9)', color:'#fff', border:'none', cursor:sending||!subject.trim()||!message.trim()?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:L.font, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <Send size={14}/>{sending?'Sending...':'Send Message'}
                  </button>
                </>
              )}
            </div>

            <div style={{ ...card, padding:'20px 24px' }}>
              <div style={{ fontSize:13, fontWeight:700, color:L.text, marginBottom:14 }}>Other ways to reach us</div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Mail size={16} color={ACCENT}/>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:L.text }}>Email Support</div>
                  <div style={{ fontSize:12, color:L.textMuted }}>novala.support@gmail.com</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Clock size={16} color={ACCENT}/>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:L.text }}>Response Time</div>
                  <div style={{ fontSize:12, color:L.textMuted }}>Within 24 hours on business days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — FAQs */}
          <div>
            <div style={{ ...card, padding:isMobile?'16px':'24px' }}>
              <div style={{ fontSize:15, fontWeight:700, color:L.text, marginBottom:4 }}>Frequently Asked Questions</div>
              <div style={{ fontSize:12, color:L.textMuted, marginBottom:20 }}>Quick answers to common questions</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {FAQS.map((faq, i) => (
                  <details key={i} style={{ borderRadius:L.radiusSm, border:`1px solid ${L.border}`, overflow:'hidden' }}>
                    <summary style={{ padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, listStyle:'none', background:'#fff' }}
                      onMouseEnter={e => e.currentTarget.style.background=L.pageBg}
                      onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                      <div style={{ width:32, height:32, borderRadius:8, background:faq.bg, border:`1px solid ${faq.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {faq.icon}
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color:L.text, flex:1 }}>{faq.question}</span>
                      <ChevronRight size={14} color={L.textMuted}/>
                    </summary>
                    <div style={{ padding:'12px 16px 16px 58px', background:L.pageBg, borderTop:`1px solid ${L.border}`, fontSize:13, color:L.textSub, lineHeight:1.6 }}>
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>

              <div style={{ marginTop:20, padding:'14px 16px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}` }}>
                <div style={{ fontSize:13, fontWeight:600, color:L.text, marginBottom:4 }}>Still have questions?</div>
                <div style={{ fontSize:12, color:L.textMuted, marginBottom:10 }}>Ask our AI assistant — it knows everything about Novala</div>
                <button onClick={() => askAndOpen('I have a question about how Novala works. Can you help me?')}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:L.radiusSm, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:L.font }}>
                  Ask AI <ChevronRight size={12}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}