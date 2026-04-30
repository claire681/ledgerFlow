import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Sparkles, Bot, Zap, BarChart2,
  Search, FileText, TrendingUp, AlertTriangle,
  RefreshCw, ChevronRight,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';
import { useAI } from '../hooks/useAI';

const QUICK = [
  { label: 'Summarize my expenses',           icon: <BarChart2 size={11} />    },
  { label: 'Find uncategorized transactions',  icon: <Search size={11} />       },
  { label: 'Generate a P&L summary',          icon: <FileText size={11} />     },
  { label: 'What is my burn rate?',           icon: <TrendingUp size={11} />   },
  { label: 'Flag unusual transactions',        icon: <AlertTriangle size={11} /> },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Agents() {
  const [messages, setMessages] = useState([{
    role:    'assistant',
    content: 'Hello! I am your AI accounting agent for Alberta workflows. I can analyze your financials, categorize transactions, and generate reports. What would you like to know?',
  }]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [provider, setProvider] = useState('openai');

  const messagesEndRef = useRef(null);
  const { setPageContext } = useAI();
  const isMobile = useIsMobile();

  useEffect(() => {
    setPageContext('agents', {
      page:              'agents',
      provider:          provider,
      message_count:     messages.length,
      last_user_message: messages.filter(m => m.role === 'user').slice(-1)[0]?.content || null,
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    const newMsgs = [...messages, { role: 'user', content: msg }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res  = await fetch('https://api.getnovala.com/api/v1/agents/chat', {
        method:  'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMsgs, provider }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: data.reply || 'Sorry, I could not process that.',
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: 'Error: Could not connect to AI.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...page, display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* Top bar */}
      <div style={{
        ...topBar,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems:    isMobile ? 'flex-start' : 'center',
        gap:           isMobile ? 12 : 0,
        padding:       isMobile ? '16px' : undefined,
      }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: L.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={20} color={L.accent} />
            Alberta AI Agent
          </div>
          <div style={{ fontSize: 12, color: L.textMuted, marginTop: 2 }}>
            Ask anything about your Alberta finances
          </div>
        </div>

        {/* Provider toggle */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'openai', label: 'GPT-4',  icon: <Sparkles size={11} /> },
            { id: 'gemini', label: 'Gemini', icon: <Zap size={11} />      },
          ].map(p => (
            <button key={p.id} onClick={() => setProvider(p.id)} style={{
              display:     'flex', alignItems: 'center', gap: 5,
              padding:     '7px 14px', borderRadius: 20, cursor: 'pointer',
              fontSize:    11, fontWeight: 600, border: '1px solid',
              borderColor: provider === p.id ? L.accentBorder : L.border,
              background:  provider === p.id ? L.accentSoft   : '#FFFFFF',
              color:       provider === p.id ? L.accent        : L.textMuted,
              fontFamily:  L.font, transition: 'all 0.15s',
            }}>
              {p.icon}{p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{
        padding:        isMobile ? '12px' : '24px 28px',
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        gap:            16,
        overflow:       'hidden',
      }}>
        <div style={{ ...card, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 14px 8px' : '20px 20px 8px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display:        'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom:   14,
              }}>
                {m.role === 'assistant' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: L.accentSoft, border: `1px solid ${L.accentBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: 10, flexShrink: 0, marginTop: 2,
                  }}>
                    <Bot size={14} color={L.accent} />
                  </div>
                )}
                <div style={{
                  maxWidth:     isMobile ? '85%' : '72%',
                  padding:      '11px 14px',
                  borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background:   m.role === 'user' ? L.accent : L.pageBg,
                  border:       m.role === 'user' ? 'none'   : `1px solid ${L.border}`,
                }}>
                  {m.role === 'assistant' && (
                    <div style={{ fontSize: 9, fontWeight: 700, color: L.accent, letterSpacing: '0.1em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Sparkles size={9} /> NOVALA AI
                    </div>
                  )}
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: m.role === 'user' ? '#FFFFFF' : L.text, whiteSpace: 'pre-wrap' }}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color={L.accent} />
                </div>
                <div style={{ padding: '11px 14px', borderRadius: '12px 12px 12px 4px', background: L.pageBg, border: `1px solid ${L.border}`, color: L.textMuted, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions — scrollable on mobile */}
          <div style={{
            padding:    isMobile ? '8px 12px' : '8px 16px',
            borderTop:  `1px solid ${L.border}`,
            display:    'flex',
            gap:        6,
            flexWrap:   isMobile ? 'nowrap' : 'wrap',
            overflowX:  isMobile ? 'auto' : 'visible',
            scrollbarWidth: 'none',
          }}>
            {QUICK.map(q => (
              <button key={q.label} onClick={() => send(q.label)} style={{
                display:    'flex', alignItems: 'center', gap: 5,
                padding:    '5px 12px', borderRadius: 20,
                background: '#FFFFFF', border: `1px solid ${L.border}`,
                color:      L.textMuted, cursor: 'pointer', fontSize: 11,
                fontFamily: L.font, transition: 'all 0.15s',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = L.accentBorder; e.currentTarget.style.color = L.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = L.border; e.currentTarget.style.color = L.textMuted; }}
              >
                {q.icon}{q.label}<ChevronRight size={10} />
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{
            padding:    isMobile ? '10px 12px 14px' : '12px 16px',
            borderTop:  `1px solid ${L.border}`,
            display:    'flex',
            gap:        8,
            alignItems: 'flex-end',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask anything about your Alberta finances..."
              style={{
                flex:         1,
                padding:      '10px 14px',
                background:   L.pageBg,
                border:       `1px solid ${L.border}`,
                borderRadius: L.radiusSm,
                color:        L.text,
                fontSize:     13,
                fontFamily:   L.font,
                outline:      'none',
              }}
              onFocus={e => e.target.style.borderColor = L.accentBorder}
              onBlur={e  => e.target.style.borderColor = L.border}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                display:    'flex', alignItems: 'center', gap: 6,
                padding:    isMobile ? '10px 14px' : '10px 20px',
                borderRadius: L.radiusSm,
                background: (!input.trim() || loading) ? L.textFaint : L.accent,
                color:      '#fff', border: 'none',
                cursor:     (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                fontSize:   13, fontWeight: 600, fontFamily: L.font,
                flexShrink: 0,
              }}
            >
              <Send size={13} />
              {!isMobile && 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}