import React, { useState, useEffect, useRef } from 'react';
import { useAIContext } from '../context/AIContext';
import {
  X, Send, Trash2, ChevronDown, Sparkles,
  Users, Link2, Bot, Camera, Calculator,
  BarChart2, FileText, Receipt, Target,
  Globe, TrendingUp, Wifi, HelpCircle,
  Settings as SettingsIcon, Search,
} from 'lucide-react';
const C = {
  bg:          '#FFFFFF',
  pageBg:      '#F8FAFC',
  border:      '#E2E8F0',
  accent:      '#0AB98A',
  accentSoft:  'rgba(10,185,138,0.08)',
  accentBorder:'rgba(10,185,138,0.2)',
  text:        '#0F172A',
  textSub:     '#334155',
  textMuted:   '#64748B',
  textFaint:   '#CBD5E1',
  shadow:      '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
  font:        "'Inter', -apple-system, sans-serif",
};

const PAGE_AI_CONFIG = {
  dashboard: {
    name:     'Executive Finance Copilot',
    pageName: 'Dashboard',
    intro:    'I have full access to all your financial data. Ask me anything about your business — expenses, invoices, tax, team, or overall health.',
    icon:     <BarChart2 size={20} color="#0AB98A" />,
    chips: [
      'How is my business doing?',
      'What is my estimated tax?',
      'Which invoices are overdue?',
    ],
  },
  transactions: {
    name:     'Transaction Analyst',
    pageName: 'Transactions',
    intro:    'I focus on your transactions. Ask about expenses, income, categories, duplicate charges, or spending patterns.',
    icon:     <TrendingUp size={20} color="#0AB98A" />,
    chips: [
      'What is my biggest expense?',
      'Which transactions are uncategorized?',
      'Show all software expenses',
    ],
  },
  documents: {
    name:     'Document Assistant',
    pageName: 'Documents',
    intro:    'I help with your uploaded documents. Ask about extraction results, vendors, amounts, or documents needing review.',
    icon:     <FileText size={20} color="#0AB98A" />,
    chips: [
      'Which documents were processed?',
      'Which files have no amount?',
      'Show documents needing review',
    ],
  },
  invoices: {
    name:     'Billing Assistant',
    pageName: 'Invoices',
    intro:    'I manage your invoices. Ask about overdue payments, outstanding amounts, invoice status, or how to create a new invoice.',
    icon:     <Receipt size={20} color="#0AB98A" />,
    chips: [
      'Which invoices are overdue?',
      'Who has not paid yet?',
      'What is my outstanding amount?',
    ],
  },
  tax: {
    name:     'Tax Preparation Assistant',
    pageName: 'Tax Calculator',
    intro:    'I help with tax estimates and deductions. Ask what you owe, what is deductible, or how to reduce your tax bill.',
    icon:     <Calculator size={20} color="#0AB98A" />,
    chips: [
      'How is my tax calculated?',
      'What counts as a deduction?',
      'Can I override the tax rate?',
    ],
  },
  team: {
    name:     'Team Access Assistant',
    pageName: 'Team',
    intro:    'I manage team access and permissions. Ask about roles, who has access, how to invite members, or what each role can do.',
    icon:     <Users size={20} color="#0AB98A" />,
    chips: [
      'What does Admin do?',
      'Who has access?',
      'How do I invite a member?',
    ],
  },
  vendors: {
    name:     'Vendor Analytics Assistant',
    pageName: 'Vendor Analytics',
    intro:    'I analyze vendor spending. Ask about your top vendors, recurring costs, subscription patterns, or spending concentration.',
    icon:     <TrendingUp size={20} color="#0AB98A" />,
    chips: [
      'Who are my top vendors?',
      'Which vendors repeat monthly?',
      'How much did I spend by vendor?',
    ],
  },
  budgets: {
    name:     'Budget Management Assistant',
    pageName: 'Budgets',
    intro:    'I track your budgets. Ask about spending limits, over-budget categories, remaining budget, or budget recommendations.',
    icon:     <Target size={20} color="#0AB98A" />,
    chips: [
      'Which budgets are over limit?',
      'How much is left in my budgets?',
      'Am I overspending anywhere?',
    ],
  },
  scanner: {
    name:     'Receipt Scanner Assistant',
    pageName: 'Receipt Scanner',
    intro:    'I help scan receipts. Ask about extracted data, scan results, how to save receipts, or why a scan failed.',
    icon:     <Camera size={20} color="#0AB98A" />,
    chips: [
      'What happens after I upload a receipt?',
      'What data is extracted?',
      'How do I save a scanned receipt?',
    ],
  },
  integrations: {
    name:     'Integrations Assistant',
    pageName: 'Integrations',
    intro:    'I help connect external tools. Ask about connection status, how to set up an integration, or sync troubleshooting.',
    icon:     <Link2 size={20} color="#0AB98A" />,
    chips: [
      'What does QuickBooks connect to?',
      'How do I connect Stripe?',
      'Why is this integration offline?',
    ],
  },
  agents: {
    name:     'Alberta AI Agent',
    pageName: 'Alberta Agent',
    intro:    'I handle Alberta-specific workflows. Ask about provincial tax rules, compliance requirements, or Alberta business regulations.',
    icon:     <Bot size={20} color="#0AB98A" />,
    chips: [
      'What Alberta tax rules apply to me?',
      'What filings do Alberta businesses need?',
      'Explain Alberta compliance',
    ],
  },
  currency: {
    name:     'Currency Assistant',
    pageName: 'Currency',
    intro:    'I help with currency conversion and multi-currency transactions. Ask about exchange rates or currency settings.',
    icon:     <Globe size={20} color="#0AB98A" />,
    chips: [
      'What is the CAD to USD rate?',
      'How do I record foreign currency?',
      'Which currencies are supported?',
    ],
  },
  reports: {
    name:     'Financial Reports Assistant',
    pageName: 'Financial Reports',
    intro:    'I help you understand your P&L, Balance Sheet and Cash Flow. Ask about profit, revenue trends, expenses or how to read your reports.',
    icon:     <BarChart2 size={20} color="#0AB98A" />,
    chips: [
      'How do Financial Reports work?',
      'What is my net profit this month?',
      'How do my expenses compare to revenue?',
    ],
  },
  reconciliation: {
    name:     'Reconciliation Assistant',
    pageName: 'Reconciliation',
    intro:    'I help you match and verify transactions against your records. Ask about unmatched transactions, flagged items or how to reconcile faster.',
    icon:     <TrendingUp size={20} color="#0AB98A" />,
    chips: [
      'How does Reconciliation work?',
      'Which transactions are unmatched?',
      'How do I reconcile my books?',
    ],
  },
  billpay: {
    name:     'Bill Pay Assistant',
    pageName: 'Bill Pay',
    intro:    'I track your bills and due dates. Ask about overdue bills, total owed, which to pay first, or how bill pay works.',
    icon:     <Receipt size={20} color="#0AB98A" />,
    chips: [
      'How does Bill Pay work?',
      'Which bills are overdue right now?',
      'How much do I owe in total?',
    ],
  },
  variance: {
    name:     'Variance Reports Assistant',
    pageName: 'Variance Reports',
    intro:    'I compare your budget vs actual spending and month over month changes. Ask about over-budget categories, spending trends or variance explanations.',
    icon:     <TrendingUp size={20} color="#0AB98A" />,
    chips: [
      'How do Variance Reports work?',
      'Which categories am I over budget?',
      'How does this month compare to last?',
    ],
  },
  ledger: {
    name:     'Ledger Assistant',
    pageName: 'Ledger View',
    intro:    'I help you read your general ledger in double-entry accounting format. Ask about debits, credits, running balance or any unusual entries.',
    icon:     <FileText size={20} color="#0AB98A" />,
    chips: [
      'How does the Ledger View work?',
      'What is my current net balance?',
      'Are there any unusual entries?',
    ],
  },
 comparison: {
    name:     'Document Comparison Assistant',
    pageName: 'Document Comparison',
    intro:    'I compare two documents side by side and explain the differences. Upload two invoices, receipts or contracts and ask me what changed and why it matters.',
    icon:     <FileText size={20} color="#0AB98A" />,
    chips: [
      'How does Document Comparison work?',
      'What are the key differences?',
      'Should I be concerned about these differences?',
    ],
  },
  search: {
    name:     'Smart Search Assistant',
    pageName: 'Smart Search',
    intro:    'Ask me anything about your documents. I search your actual files to answer — vendor names, amounts, dates, payment status.',
    icon:     <Search size={20} color="#0AB98A"/>,
    chips: [
      'What are my unpaid invoices?',
      'How much did I spend last month?',
      'Do I have any duplicate documents?',
      'Show me all paid invoices',
    ],
    search: {
  name:     'Smart Search Assistant',
  pageName: 'Smart Search',
  intro:    'Search your documents using keywords, dates, amounts or vendor names. I can help you find anything.',
  icon:     <Search size={20} color="#0AB98A"/>,
  chips: [
    'Show all overdue invoices',
    'Receipts from last month',
    'Documents over $500',
  ],
},
  },
  help: {
    name:     'Novala Support Assistant',
    pageName: 'Help & Support',
    intro:    'I can answer any question about how Novala works. Ask me about features, billing, document upload, AI extraction, or anything else.',
    icon:     <HelpCircle size={20} color="#0AB98A" />,
    chips: [
      'How does Novala work?',
      'How do I upload a document?',
      'How does billing work?',
    ],
  },
  settings: {
    name:     'Settings Assistant',
    pageName: 'Settings',
    intro:    'I can help you with your account settings. Ask me about changing your password, updating your profile, managing notifications, or billing.',
    icon:     <SettingsIcon size={20} color="#0AB98A" />,
    chips: [
      'How do I change my password?',
      'How do I update my notification schedule?',
      'How do I manage my subscription?',
    ],
  },
};

const DEFAULT_CONFIG = PAGE_AI_CONFIG.dashboard;

// ── Mobile detection ──────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function MessageBubble({ message, aiName }) {
  const isUser = message.role === 'user';
  return (
    <div style={{ display:'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom:12 }}>
      {!isUser && (
        <div style={{ width:28, height:28, borderRadius:8, background:C.accentSoft, border:`1px solid ${C.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginRight:8, marginTop:2 }}>
          <Sparkles size={13} color={C.accent} />
        </div>
      )}
      <div style={{ maxWidth:'78%', padding:'10px 13px', borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: isUser ? C.accent : C.pageBg, border: isUser ? 'none' : `1px solid ${C.border}`, boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
        {!isUser && (
          <div style={{ fontSize:9, fontWeight:700, color:C.accent, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5, display:'flex', alignItems:'center', gap:4 }}>
            <Sparkles size={8} color={C.accent} />{aiName}
          </div>
        )}
        <div style={{ fontSize:13, lineHeight:1.6, color: isUser ? '#FFFFFF' : C.text, fontFamily:C.font, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
          {message.content}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
      <div style={{ width:28, height:28, borderRadius:8, background:C.accentSoft, border:`1px solid ${C.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Sparkles size={13} color={C.accent} />
      </div>
      <div style={{ padding:'10px 14px', borderRadius:'12px 12px 12px 4px', background:C.pageBg, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:4 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:C.accent, opacity:0.6, animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>
        ))}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const {
    isOpen, loading, messages, suggestions,
    currentPage, ask, toggleAssistant,
    closeAssistant, clearConversation,
  } = useAIContext();

  const [input,       setInput]     = useState('');
  const [isMinimized, setMinimized] = useState(false);
  const messagesEndRef               = useRef(null);
  const inputRef                     = useRef(null);
  const isMobile                     = useIsMobile();

  const config       = PAGE_AI_CONFIG[currentPage] || DEFAULT_CONFIG;
  const displayChips = config.chips;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

 const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');

    // Use RAG for Smart Search page
    if (currentPage === 'search') {
      try {
        const token = localStorage.getItem('token') || '';
        const res   = await fetch('https://api.getnovala.com/api/v1/rag/ask', {
          method:  'POST',
          headers: { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
          body:    JSON.stringify({ question: q }),
        });
        const data = await res.json();
        await ask(q, data.answer);
      } catch (e) {
        await ask(q);
      }
      return;
    }

    await ask(q);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Mobile dimensions ─────────────────────────────────────
  const mobileHeight = isMinimized ? 56 : '55vh';

  // ── Desktop dimensions ────────────────────────────────────
  const desktopHeight = isMinimized ? 56 : 580;

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%,60%,100% { transform:translateY(0); }
          30%          { transform:translateY(-4px); }
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(16px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes slideUpMobile {
          from { transform:translateY(100%); }
          to   { transform:translateY(0); }
        }
        @keyframes pulse {
          0%,100% { box-shadow:0 0 0 0   rgba(10,185,138,0.4); }
          50%     { box-shadow:0 0 0 8px rgba(10,185,138,0);   }
        }
      `}</style>

      {/* ── Floating button ── */}
      {!isOpen && (
        <button
          onClick={toggleAssistant}
          title={`Ask ${config.name}`}
          style={{
            position:     'fixed',
            bottom:       isMobile ? 20 : 28,
            right:        isMobile ? 16 : 28,
            width:        isMobile ? 48 : 52,
            height:       isMobile ? 48 : 52,
            borderRadius: 16,
            background:   'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)',
            border:       'none', cursor:'pointer',
            display:      'flex', alignItems:'center', justifyContent:'center',
            zIndex:       9999,
            boxShadow:    '0 4px 20px rgba(10,185,138,0.4)',
            animation:    'pulse 3s ease-in-out infinite',
          }}
        >
          <Sparkles size={isMobile ? 20 : 22} color="#FFFFFF" />
        </button>
      )}

      {/* ── Mobile overlay backdrop ── */}
      {isOpen && isMobile && !isMinimized && (
        <div
          onClick={closeAssistant}
          style={{
            position:   'fixed',
            inset:      0,
            background: 'rgba(0,0,0,0.3)',
            zIndex:     9998,
          }}
        />
      )}

      {/* ── Chat panel ── */}
      {isOpen && (
        <div style={{
          position:   'fixed',
          // Mobile: bottom sheet from bottom edge
          // Desktop: floating bottom right
          ...(isMobile ? {
            bottom:       0,
            left:         0,
            right:        0,
            width:        '100%',
            height:       mobileHeight,
            borderRadius: '20px 20px 0 0',
            animation:    'slideUpMobile 0.3s ease',
          } : {
            bottom:       28,
            right:        28,
            width:        380,
            height:       desktopHeight,
            borderRadius: 20,
            animation:    'slideUp 0.2s ease',
          }),
          background:     C.bg,
          border:         `1px solid ${C.border}`,
          boxShadow:      C.shadow,
          zIndex:         9999,
          display:        'flex',
          flexDirection:  'column',
          overflow:       'hidden',
          fontFamily:     C.font,
          transition:     'height 0.25s ease',
        }}>

          {/* ── Header ── */}
          <div
            onClick={() => setMinimized(p => !p)}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        isMobile ? '14px 20px' : '14px 16px',
              background:     'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)',
              flexShrink:     0,
              cursor:         'pointer',
            }}
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div style={{
                position:     'absolute',
                top:          8,
                left:         '50%',
                transform:    'translateX(-50%)',
                width:        40,
                height:       4,
                borderRadius: 2,
                background:   'rgba(255,255,255,0.5)',
              }}/>
            )}

            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Sparkles size={14} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 13 : 11, fontWeight:700, color:'#FFFFFF', letterSpacing:'0.02em' }}>
                  {config.name}
                </div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', gap:4 }}>
                  <Wifi size={8} color="rgba(255,255,255,0.85)" />
                  {config.pageName} • Online
                </div>
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              {messages.length > 0 && (
                <button onClick={e => { e.stopPropagation(); clearConversation(); }}
                  style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, cursor:'pointer', padding:5, display:'flex', color:'#FFFFFF' }}>
                  <Trash2 size={12} />
                </button>
              )}
              {!isMobile && (
                <button onClick={e => { e.stopPropagation(); setMinimized(p => !p); }}
                  style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, cursor:'pointer', padding:5, display:'flex', color:'#FFFFFF', transform: isMinimized ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>
                  <ChevronDown size={13} />
                </button>
              )}
              <button onClick={e => { e.stopPropagation(); closeAssistant(); }}
                style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, cursor:'pointer', padding:5, display:'flex', color:'#FFFFFF' }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* ── Messages ── */}
              <div style={{ flex:1, overflowY:'auto', padding: isMobile ? '14px 16px 8px' : '16px 14px 8px', scrollbarWidth:'thin', scrollbarColor:`${C.textFaint} transparent` }}>

                {messages.length === 0 && (
                  <div style={{ textAlign:'center', padding: isMobile ? '16px' : '20px 16px' }}>
                    <div style={{ width:48, height:48, borderRadius:14, background:C.accentSoft, border:`1px solid ${C.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                      {config.icon}
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:8 }}>{config.name}</div>
                    <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.7 }}>{config.intro}</div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} aiName={config.name} />
                ))}

                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Chips ── */}
              {messages.length < 2 && (
                <div style={{ padding:'6px 14px 4px', borderTop:`1px solid ${C.border}`, display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 }}>
                  {displayChips.slice(0, 3).map(s => (
                    <button key={s} onClick={() => ask(s)} disabled={loading} style={{ padding:'5px 10px', borderRadius:20, background:C.accentSoft, border:`1px solid ${C.accentBorder}`, color:C.accent, cursor:'pointer', fontSize:10, fontWeight:500, fontFamily:C.font, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%' }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Input ── */}
              <div style={{ padding: isMobile ? '10px 16px 20px' : '10px 12px 14px', borderTop:`1px solid ${C.border}`, display:'flex', gap:8, alignItems:'flex-end', flexShrink:0, background:C.bg }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask ${config.name}...`}
                  rows={1}
                  style={{ flex:1, padding:'9px 12px', background:C.pageBg, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:13, fontFamily:C.font, outline:'none', resize:'none', maxHeight:80, lineHeight:1.5 }}
                  onFocus={e => e.target.style.borderColor = C.accentBorder}
                  onBlur={e  => e.target.style.borderColor = C.border}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  style={{ width:36, height:36, borderRadius:10, background: !input.trim() || loading ? C.textFaint : C.accent, border:'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Send size={14} color="#FFFFFF" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}