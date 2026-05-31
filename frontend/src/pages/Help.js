import React, { useState, useEffect, useRef } from 'react';
import {
  Send, CheckCircle, AlertCircle,
  MessageSquare, Book, Zap, Shield, CreditCard,
  ChevronRight, Mail, Clock, X, Trash2, ChevronDown,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';

const BASE     = 'https://api.getnovala.com/api/v1';
const ACCENT   = '#0AB98A';
const FONT     = "'Inter', -apple-system, sans-serif";
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
    icon: <Zap size={18} color="#0AB98A" />,
    bg: 'rgba(10,185,138,0.08)', border: 'rgba(10,185,138,0.2)',
    question: 'How does document extraction work?',
    answer: 'When you upload a document, Novala reads the file and automatically extracts key information like vendor name, amount, date, and category. It then creates a transaction in your books automatically.',
  },
  {
    icon: <CreditCard size={18} color="#8B5CF6" />,
    bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)',
    question: 'How does billing work?',
    answer: 'You get a 14-day free trial with full access. After 14 days your card is charged automatically based on the plan you chose. You can cancel anytime from the Billing page.',
  },
  {
    icon: <Shield size={18} color="#0EA5E9" />,
    bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.2)',
    question: 'Is my financial data secure?',
    answer: 'Yes. All data is encrypted in transit and at rest. We use AWS for storage, which meets the highest security standards. We never share your data with third parties.',
  },
  {
    icon: <Book size={18} color="#F59E0B" />,
    bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
    question: 'What file types can I upload?',
    answer: 'You can upload PDF, PNG, JPG, JPEG, CSV, TIFF, and WEBP files. Invoices, receipts, bank statements and contracts are all supported.',
  },
  {
    icon: <MessageSquare size={18} color="#EF4444" />,
    bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',
    question: 'How do I reconcile transactions?',
    answer: 'Go to the Reconciliation page, select transactions and click Mark Reconciled. Novala can also help you find unmatched or duplicate transactions automatically.',
  },
  {
    icon: <Zap size={18} color="#0AB98A" />,
    bg: 'rgba(10,185,138,0.08)', border: 'rgba(10,185,138,0.2)',
    question: 'How does Bill Pay work?',
    answer: 'Add your bills with vendor, amount and due date. When you mark a bill as paid, Novala automatically creates an expense transaction in your books so your records stay accurate.',
  },
];

const NOVA_SYSTEM = 'You are Nova, the official assistant for Novala — an automated financial management platform for small businesses and freelancers. You have complete knowledge of Novalas features, pricing, and capabilities.\n\nNOVALA OVERVIEW:\nNovala is a SaaS platform that automates bookkeeping, invoicing, bill pay, financial reporting, document processing, and reconciliation for small businesses.\n\nKEY FEATURES:\n- Automated Bookkeeping: Smart reconciliation, duplicate detection, auto-categorization\n- Document Intelligence: Upload any document — Novala reads, understands, and records every financial detail\n- Professional Invoicing: Custom logo branding, PDF generation, payment status tracking\n- Live Financial Dashboard: Real-time revenue, expenses, and cash flow visualization\n- Smart Invoice Follow-Up: Automated follow-up emails with PDF attachments\n- Bill Pay: Track and pay bills with reconciliation\n- Reports: Profit & Loss, Balance Sheet, Cash Flow, Variance Reports\n- Team Collaboration: Multi-user access, roles, timesheets\n\nPRICING:\n- Essentials $20/mo: Up to 100 docs/month, basic invoicing, financial dashboard, 14-day free trial\n- Premium $30/mo: Unlimited documents, automated follow-up emails, Smart Search, advanced reports, bill pay, tax tools\n- Enterprise Custom: Everything in Premium plus multi-user roles, white-label, API access\n\nSECURITY: Bank-grade security, encrypted data storage, SOC 2 compliant.\n\nRESPONSE RULES:\n- Be friendly, concise, and confident\n- Never say you do not have information about Novala\n- Never mention Novala, Novala, Claude, GPT, or any other product or model name\n- If a user mentions Novala say: I am Nova, the assistant for Novala. How can I help you today?\n- If asked about something outside Novala like legal advice say: That is outside what I can help with\n- Always offer next steps';

function NovaPanel({ onClose }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText) return;
    setInput('');
    const userMsg = { role: 'user', content: userText };
    const next    = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system:     NOVA_SYSTEM,
          messages:   next.map(function(m) { return { role: m.role, content: m.content }; }),
        }),
      });
      const data  = await res.json();
      const reply = (data && data.content && data.content[0] && data.content[0].text)
        ? data.content[0].text
        : 'Sorry, I could not get a response. Please try again.';
      setMessages(function(prev) { return prev.concat([{ role: 'assistant', content: reply }]); });
    } catch (err) {
      setMessages(function(prev) { return prev.concat([{ role: 'assistant', content: 'Something went wrong. Please try again.' }]); });
    }
    setLoading(false);
  };

  const iconStyle = {
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    borderRadius: 6,
    padding: '4px 6px',
    cursor: 'pointer',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, width: 380, zIndex: 300, fontFamily: FONT }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.16)', border: '1px solid #E5E7EB', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0AB98A,#0EA5E9)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', opacity: 0.9 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Nova</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
                Help and Support · Online
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={function() { setMessages([]); }} style={iconStyle}>
              <Trash2 size={14} />
            </button>
            <button onClick={function() { setMinimized(function(p) { return !p; }); }} style={iconStyle}>
              <ChevronDown size={14} />
            </button>
            <button onClick={onClose} style={iconStyle}>
              <X size={14} />
            </button>
          </div>
        </div>

        {!minimized && (
          <div>
            {/* Messages area */}
            <div style={{ height: 340, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, scrollbarWidth: 'none' }}>

              {messages.length === 0 && (
                <div style={{ textAlign: 'center', paddingTop: 40 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: L.text, marginBottom: 8 }}>What can I do for you today?</div>
                  <div style={{ fontSize: 12, color: L.textMuted, marginBottom: 20 }}>Ask me anything about Novala</div>
                  {['How does Novala work?', 'What is included in Premium?', 'How do I reconcile transactions?'].map(function(q) {
                    return (
                      <div
                        key={q}
                        onClick={function() { sendMessage(q); }}
                        style={{ padding: '10px 14px', borderRadius: 8, background: L.pageBg, border: '1px solid ' + L.border, cursor: 'pointer', fontSize: 12, color: ACCENT, fontWeight: 500, marginBottom: 8, textAlign: 'left' }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = L.accentSoft; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = L.pageBg; }}
                      >
                        {q}
                      </div>
                    );
                  })}
                </div>
              )}

              {messages.map(function(m, i) {
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {m.role === 'assistant' && (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#0AB98A,#0EA5E9)', flexShrink: 0, marginRight: 8, marginTop: 2 }} />
                    )}
                    <div style={{ maxWidth: '78%', padding: '10px 12px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: m.role === 'user' ? L.accentSoft : '#F8FAFC', border: '1px solid ' + (m.role === 'user' ? L.accentBorder : L.border), fontSize: 13, color: L.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {m.role === 'assistant' && (
                        <div style={{ fontSize: 9, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', marginBottom: 4 }}>NOVA</div>
                      )}
                      {m.content}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#0AB98A,#0EA5E9)', flexShrink: 0 }} />
                  <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 4px', background: '#F8FAFC', border: '1px solid ' + L.border, fontSize: 12, color: L.textMuted }}>
                    Nova is thinking...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid ' + L.border }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={input}
                  onChange={function(e) { setInput(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { sendMessage(); } }}
                  placeholder="Ask Nova..."
                  style={{ flex: 1, padding: '9px 12px', background: L.pageBg, border: '1px solid ' + L.border, borderRadius: 20, fontSize: 13, fontFamily: FONT, outline: 'none', color: L.text }}
                  onFocus={function(e) { e.target.style.borderColor = ACCENT; }}
                  onBlur={function(e) { e.target.style.borderColor = L.border; }}
                />
                <button
                  onClick={function() { sendMessage(); }}
                  disabled={!input.trim() || loading}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: (!input.trim() || loading) ? '#E5E7EB' : ACCENT, border: 'none', cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <Send size={14} color={(!input.trim() || loading) ? '#94A3B8' : '#fff'} />
                </button>
              </div>
              <div style={{ fontSize: 10, color: L.textMuted, marginTop: 8, lineHeight: 1.5 }}>
                Nova can make mistakes. Novala protects your privacy and adheres to responsible automation principles.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Help() {
  const [category, setCategory] = useState('General');
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState('');
  const [showNova, setShowNova] = useState(false);
  const isMobile = useIsMobile();

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setError('');
    try {
      const email = localStorage.getItem('user_email') || 'Unknown';
      const res   = await fetch(BASE + '/support/send', {
        method:  'POST',
        headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ category, subject, message, user_email: email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Failed');
      setSent(true);
      setSubject('');
      setMessage('');
      setCategory('General');
    } catch (e) {
      setError('Could not send message. Please try again later.');
    }
    setSending(false);
  };

  const pad = isMobile ? '12px' : '24px 28px';

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: L.pageBg,
    border: '1px solid ' + L.border,
    borderRadius: L.radiusSm,
    color: L.text,
    fontSize: 13,
    fontFamily: FONT,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={page}>

      {showNova && <NovaPanel onClose={function() { setShowNova(false); }} />}

      {/* Top bar */}
      <div style={Object.assign({}, topBar, { flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 0 })}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: L.text, letterSpacing: '-0.02em' }}>Help and Support</div>
          <div style={{ fontSize: 12, color: L.textMuted, marginTop: 2 }}>We usually reply within 24 hours</div>
        </div>
        <button
          onClick={function() { setShowNova(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: L.radiusSm, background: ACCENT, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: FONT, marginLeft: isMobile ? 0 : 'auto' }}
        >
          Ask Nova Instead
        </button>
      </div>

      <div style={{ padding: pad }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>

          {/* Left — Contact Form */}
          <div>
            <div style={Object.assign({}, card, { padding: isMobile ? '16px' : '24px', marginBottom: 20 })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MessageSquare size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: L.text }}>Send us a message</div>
                  <div style={{ fontSize: 12, color: L.textMuted }}>We will reply to your email within 24 hours</div>
                </div>
              </div>

              {sent ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ width: 60, height: 60, borderRadius: 16, background: L.accentSoft, border: '1px solid ' + L.accentBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle size={28} color={ACCENT} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: L.text, marginBottom: 6 }}>Message Sent!</div>
                  <div style={{ fontSize: 13, color: L.textMuted, marginBottom: 20 }}>We will get back to you within 24 hours at your registered email.</div>
                  <button
                    onClick={function() { setSent(false); }}
                    style={{ padding: '10px 20px', borderRadius: L.radiusSm, background: L.accentSoft, border: '1px solid ' + L.accentBorder, color: ACCENT, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: FONT }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <div>
                  {/* Category */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Category</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {CATEGORIES.map(function(c) {
                        return (
                          <button
                            key={c}
                            onClick={function() { setCategory(c); }}
                            style={{ padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 600, border: '1px solid', fontFamily: FONT, borderColor: category === c ? ACCENT : L.border, background: category === c ? L.accentSoft : '#fff', color: category === c ? ACCENT : L.textMuted }}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subject */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Subject</div>
                    <input
                      value={subject}
                      onChange={function(e) { setSubject(e.target.value); }}
                      placeholder="Brief description of your issue..."
                      style={inputStyle}
                      onFocus={function(e) { e.target.style.borderColor = ACCENT; }}
                      onBlur={function(e) { e.target.style.borderColor = L.border; }}
                    />
                  </div>

                  {/* Message */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Message</div>
                    <textarea
                      value={message}
                      onChange={function(e) { setMessage(e.target.value); }}
                      placeholder="Describe your problem in detail..."
                      rows={6}
                      style={Object.assign({}, inputStyle, { resize: 'vertical' })}
                      onFocus={function(e) { e.target.style.borderColor = ACCENT; }}
                      onBlur={function(e) { e.target.style.borderColor = L.border; }}
                    />
                  </div>

                  {error && (
                    <div style={{ padding: '10px 14px', borderRadius: L.radiusSm, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={13} />{error}
                    </div>
                  )}

                  <button
                    onClick={handleSend}
                    disabled={sending || !subject.trim() || !message.trim()}
                    style={{ width: '100%', padding: '12px', borderRadius: L.radiusSm, background: (sending || !subject.trim() || !message.trim()) ? L.textFaint : ACCENT, color: '#fff', border: 'none', cursor: (sending || !subject.trim() || !message.trim()) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <Send size={14} />{sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              )}
            </div>

            {/* Other contact */}
            <div style={Object.assign({}, card, { padding: '20px 24px' })}>
              <div style={{ fontSize: 13, fontWeight: 700, color: L.text, marginBottom: 14 }}>Other ways to reach us</div>
              <div
                onClick={() => {
          if (navigator && navigator.clipboard) {
            navigator.clipboard.writeText('novala.support@gmail.com').catch(() => {});
          }
          const t = document.createElement('div');
          t.textContent = 'Email copied: novala.support@gmail.com';
          t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0F5959;color:#fff;padding:10px 18px;border-radius:8px;z-index:9999;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-family:Inter,-apple-system,sans-serif;';
          document.body.appendChild(t);
          setTimeout(() => t.remove(), 2200);
        }}
                onMouseEnter={e => { e.currentTarget.style.background = L.accentSoft; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, cursor: 'pointer', borderRadius: 8, padding: '6px 8px', transition: 'background 0.15s' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: L.accentSoft, border: '1px solid ' + L.accentBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={16} color={ACCENT} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: L.text }}>Email Support</div>
                  <div style={{ fontSize: 12, color: L.textMuted }}>novala.support@gmail.com</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: L.accentSoft, border: '1px solid ' + L.accentBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={16} color={ACCENT} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: L.text }}>Response Time</div>
                  <div style={{ fontSize: 12, color: L.textMuted }}>Within 24 hours on business days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — FAQs */}
          <div>
            <div style={Object.assign({}, card, { padding: isMobile ? '16px' : '24px' })}>
              <div style={{ fontSize: 15, fontWeight: 700, color: L.text, marginBottom: 4 }}>Frequently Asked Questions</div>
              <div style={{ fontSize: 12, color: L.textMuted, marginBottom: 20 }}>Quick answers to common questions</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FAQS.map(function(faq, i) {
                  return (
                    <details key={i} style={{ borderRadius: L.radiusSm, border: '1px solid ' + L.border, overflow: 'hidden' }}>
                      <summary
                        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, listStyle: 'none', background: '#fff' }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = L.pageBg; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = '#fff'; }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: faq.bg, border: '1px solid ' + faq.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {faq.icon}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: L.text, flex: 1 }}>{faq.question}</span>
                        <ChevronRight size={14} color={L.textMuted} />
                      </summary>
                      <div style={{ padding: '12px 16px 16px 58px', background: L.pageBg, borderTop: '1px solid ' + L.border, fontSize: 13, color: L.textSub, lineHeight: 1.6 }}>
                        {faq.answer}
                      </div>
                    </details>
                  );
                })}
              </div>

              <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: L.radiusSm, background: L.accentSoft, border: '1px solid ' + L.accentBorder }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: L.text, marginBottom: 4 }}>Still have questions?</div>
                <div style={{ fontSize: 12, color: L.textMuted, marginBottom: 10 }}>Ask Nova — it knows everything about Novala</div>
                <button
                  onClick={function() { setShowNova(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: L.radiusSm, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: FONT }}
                >
                  Ask Nova <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}