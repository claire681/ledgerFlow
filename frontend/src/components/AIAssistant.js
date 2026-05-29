import React, { useState, useEffect, useRef } from 'react';
import { useAIContext } from '../context/AIContext';
import {
  X, Send, Trash2, ChevronDown, Sparkles,
  Users, Link2, Camera, Calculator,
  BarChart2, FileText, Receipt, Target,
  Globe, TrendingUp, Wifi, HelpCircle,
  Settings as SettingsIcon, Search, MessageCircle,
} from 'lucide-react';

const C = {
  bg:           '#FFFFFF',
  pageBg:       '#F8FAFC',
  border:       '#E2E8F0',
  accent:       '#0AB98A',
  accentSoft:   'rgba(10,185,138,0.08)',
  accentBorder: 'rgba(10,185,138,0.2)',
  text:         '#0F172A',
  textSub:      '#334155',
  textMuted:    '#64748B',
  textFaint:    '#CBD5E1',
  shadow:       '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
  font:         "'Inter', -apple-system, sans-serif",
};

const PAGE_CONFIG = {
  dashboard: {
    pageName: 'Dashboard',
    intro:    'Ask me anything about your business — revenue, expenses, invoices, or overall financial health.',
    icon:     <BarChart2 size={20} color="#0AB98A"/>,
    chips:    ['How is my business doing?', 'What are my overdue invoices?', 'Summarize this month'],
  },
  transactions: {
    pageName: 'Transactions',
    intro:    'Ask about your expenses, income, categories, or spending patterns.',
    icon:     <TrendingUp size={20} color="#0AB98A"/>,
    chips:    ['What is my biggest expense?', 'Show uncategorized transactions', 'Show all software expenses'],
  },
  documents: {
    pageName: 'Documents',
    intro:    'Ask about your uploaded documents, vendors, amounts, or items needing review.',
    icon:     <FileText size={20} color="#0AB98A"/>,
    chips:    ['Which documents were processed?', 'Show documents needing review', 'Which files have no amount?'],
  },
  invoices: {
    pageName: 'Invoices',
    intro:    'Ask about overdue payments, outstanding amounts, or invoice status.',
    icon:     <Receipt size={20} color="#0AB98A"/>,
    chips:    ['Which invoices are overdue?', 'Who has not paid yet?', 'What is my outstanding amount?'],
  },
  tax: {
    pageName: 'Tax',
    intro:    'Ask about tax estimates, deductions, or how to reduce your tax bill.',
    icon:     <Calculator size={20} color="#0AB98A"/>,
    chips:    ['How is my tax calculated?', 'What counts as a deduction?', 'Can I override the tax rate?'],
  },
  team: {
    pageName: 'Team',
    intro:    'Ask about roles, permissions, or how to invite team members.',
    icon:     <Users size={20} color="#0AB98A"/>,
    chips:    ['What does Admin do?', 'Who has access?', 'How do I invite a member?'],
  },
  vendors: {
    pageName: 'Vendors',
    intro:    'Ask about your top vendors, recurring costs, or spending concentration.',
    icon:     <TrendingUp size={20} color="#0AB98A"/>,
    chips:    ['Who are my top vendors?', 'Which vendors repeat monthly?', 'How much did I spend by vendor?'],
  },
  budgets: {
    pageName: 'Budgets',
    intro:    'Ask about spending limits, over-budget categories, or remaining budget.',
    icon:     <Target size={20} color="#0AB98A"/>,
    chips:    ['Which budgets are over limit?', 'How much is left in my budgets?', 'Am I overspending anywhere?'],
  },
  receipts: {
    pageName: 'Scanner',
    intro:    'Ask about scan results, extracted data, or how to save receipts.',
    icon:     <Camera size={20} color="#0AB98A"/>,
    chips:    ['What data is extracted?', 'How do I save a scanned receipt?', 'What happens after upload?'],
  },
  integrations: {
    pageName: 'Integrations',
    intro:    'Ask about connection status, setup steps, or sync troubleshooting.',
    icon:     <Link2 size={20} color="#0AB98A"/>,
    chips:    ['How do I connect Stripe?', 'Why is this integration offline?', 'What does QuickBooks connect to?'],
  },
  agents: {
    pageName: 'Novala Assistant',
    intro:    'Ask me anything about your finances, documents, invoices, or how Novala works.',
    icon:     <MessageCircle size={20} color="#0AB98A"/>,
    chips:    ['How is my business doing?', 'Which invoices are overdue?', 'Help me understand my finances'],
  },
  currency: {
    pageName: 'Currency',
    intro:    'Ask about exchange rates, multi-currency transactions, or currency settings.',
    icon:     <Globe size={20} color="#0AB98A"/>,
    chips:    ['What is the CAD to USD rate?', 'How do I record foreign currency?', 'Which currencies are supported?'],
  },
  reports: {
    pageName: 'Reports',
    intro:    'Ask about profit, revenue trends, expenses, or how to read your reports.',
    icon:     <BarChart2 size={20} color="#0AB98A"/>,
    chips:    ['What is my net profit this month?', 'How do expenses compare to revenue?', 'Show my P&L summary'],
  },
  reconciliation: {
    pageName: 'Reconciliation',
    intro:    'Ask about unmatched transactions, flagged items, or how to reconcile faster.',
    icon:     <TrendingUp size={20} color="#0AB98A"/>,
    chips:    ['Which transactions are unmatched?', 'How do I reconcile my books?', 'How does reconciliation work?'],
  },
  billpay: {
    pageName: 'Bill Pay',
    intro:    'Ask about overdue bills, total owed, or which bills to pay first.',
    icon:     <Receipt size={20} color="#0AB98A"/>,
    chips:    ['Which bills are overdue?', 'How much do I owe in total?', 'How does bill pay work?'],
  },
  variance: {
    pageName: 'Variance',
    intro:    'Ask about over-budget categories, spending trends, or month over month changes.',
    icon:     <TrendingUp size={20} color="#0AB98A"/>,
    chips:    ['Which categories am I over budget?', 'How does this month compare to last?', 'Explain variance reports'],
  },
  ledger: {
    pageName: 'Ledger',
    intro:    'Ask about debits, credits, running balance, or any unusual entries.',
    icon:     <FileText size={20} color="#0AB98A"/>,
    chips:    ['What is my current net balance?', 'Are there any unusual entries?', 'How does ledger view work?'],
  },
  comparison: {
    pageName: 'Document Comparison',
    intro:    'Ask about differences between documents, what changed, or why it matters.',
    icon:     <FileText size={20} color="#0AB98A"/>,
    chips:    ['What are the key differences?', 'Should I be concerned?', 'How does comparison work?'],
  },
  search: {
    pageName: 'Smart Search',
    intro:    'Search your documents using natural language — vendor names, amounts, dates, or payment status.',
    icon:     <Search size={20} color="#0AB98A"/>,
    chips:    ['Show unpaid invoices', 'How much did I spend last month?', 'Do I have duplicate documents?'],
  },
  help: {
    pageName: 'Help & Support',
    intro:    'Ask me anything about how Novala works — features, billing, document upload, or account settings.',
    icon:     <HelpCircle size={20} color="#0AB98A"/>,
    chips:    ['How does Novala work?', 'How do I upload a document?', 'How does billing work?'],
  },
  settings: {
    pageName: 'Settings',
    intro:    'Ask about changing your password, notifications, profile, or subscription.',
    icon:     <SettingsIcon size={20} color="#0AB98A"/>,
    chips:    ['How do I change my password?', 'How do I update notifications?', 'How do I manage my subscription?'],
  },
  customers: {
    pageName: 'Customers',
    intro:    'Ask about your customers, outstanding balances, or client history.',
    icon:     <Users size={20} color="#0AB98A"/>,
    chips:    ['Who are my top customers?', 'Which customers have outstanding balances?', 'How do I add a customer?'],
  },
  inventory: {
    pageName: 'Inventory',
    intro:    'Ask about stock levels, low stock items, or inventory value.',
    icon:     <FileText size={20} color="#0AB98A"/>,
    chips:    ['Which items are low in stock?', 'What is my total inventory value?', 'How do I add an item?'],
  },
  businesses: {
    pageName: 'Businesses',
    intro:    'Ask about managing multiple businesses or switching between accounts.',
    icon:     <Globe size={20} color="#0AB98A"/>,
    chips:    ['How do I add a business?', 'How do I switch businesses?', 'What is multi-business support?'],
  },
};

const DEFAULT_CONFIG = PAGE_CONFIG.dashboard;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: 8, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 2 }}>
          <Sparkles size={13} color={C.accent}/>
        </div>
      )}
      <div style={{ maxWidth: '78%', padding: '10px 13px', borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: isUser ? C.accent : C.pageBg, border: isUser ? 'none' : `1px solid ${C.border}`, boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
        {!isUser && (
          <div style={{ fontSize: 9, fontWeight: 700, color: C.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
            Novala Assistant
          </div>
        )}
        <div style={{ fontSize: 13, lineHeight: 1.6, color: isUser ? '#FFFFFF' : C.text, fontFamily: C.font, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Sparkles size={13} color={C.accent}/>
      </div>
      <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 4px', background: C.pageBg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 4 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, opacity: 0.6, animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>
        ))}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const {
    isOpen, loading, messages,
    currentPage, ask, toggleAssistant,
    closeAssistant, clearConversation,
  } = useAIContext();

  const [input,       setInput]     = useState('');
  const [isMinimized, setMinimized] = useState(false);

  const [position, setPosition] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nova_button_position") || "null");
      if (saved && typeof saved.x === "number" && typeof saved.y === "number") return saved;
    } catch (e) {}
    return {
      x: typeof window !== "undefined" ? window.innerWidth - 84 : 20,
      y: typeof window !== "undefined" ? window.innerHeight - 84 : 20
    };
  });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false });
  const messagesEndRef               = useRef(null);
  const inputRef                     = useRef(null);
  const isMobile                     = useIsMobile();

  const config = PAGE_CONFIG[currentPage] || DEFAULT_CONFIG;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    const handleMove = (e) => {
      if (!dragRef.current.dragging) return;
      const t = e.touches && e.touches[0];
      const cx = t ? t.clientX : e.clientX;
      const cy = t ? t.clientY : e.clientY;
      const dx = cx - dragRef.current.startX;
      const dy = cy - dragRef.current.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.moved = true;
      const sz = 64;
      const nx = Math.max(0, Math.min(window.innerWidth - sz, dragRef.current.origX + dx));
      const ny = Math.max(0, Math.min(window.innerHeight - sz, dragRef.current.origY + dy));
      setPosition({ x: nx, y: ny });
      if (t && e.preventDefault) e.preventDefault();
    };
    const handleEnd = () => {
      if (!dragRef.current.dragging) return;
      dragRef.current.dragging = false;
      if (dragRef.current.moved) {
        setPosition(p => {
          try { localStorage.setItem("nova_button_position", JSON.stringify(p)); } catch (e) {}
          return p;
        });
      }
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      const sz = 64;
      setPosition(p => ({
        x: Math.max(0, Math.min(window.innerWidth - sz, p.x)),
        y: Math.max(0, Math.min(window.innerHeight - sz, p.y))
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleDragStart = (e) => {
    const t = e.touches && e.touches[0];
    const cx = t ? t.clientX : e.clientX;
    const cy = t ? t.clientY : e.clientY;
    dragRef.current = { dragging: true, startX: cx, startY: cy, origX: position.x, origY: position.y, moved: false };
  };

  const handleButtonClick = (e) => {
    if (dragRef.current.moved) {
      if (e && e.preventDefault) e.preventDefault();
      if (e && e.stopPropagation) e.stopPropagation();
      return;
    }
    toggleAssistant();
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    if (currentPage === 'search') {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('access_token') || '';
        const res   = await fetch('https://api.getnovala.com/api/v1/rag/ask', {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({ question: q }),
        });
        const data = await res.json();
        await ask(q, data.answer);
      } catch { await ask(q); }
      return;
    }
    await ask(q);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

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
        @keyframes glow {
          0%,100% { box-shadow:0 4px 20px rgba(10,185,138,0.4); }
          50%      { box-shadow:0 4px 32px rgba(10,185,138,0.7); }
        }
      `}</style>

      {/* ── Floating button ── */}
      {!isOpen && (
        <button
          onClick={handleButtonClick}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
          title="Novala Assistant"
          style={{
            position:     'fixed',
            bottom:       isMobile ? 20 : 28,
            right:        isMobile ? 16 : 28,
            width:        isMobile ? 52 : 56,
            height:       isMobile ? 52 : 56,
            borderRadius: 16,
            background:   'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)',
            border:       'none',
            cursor:       'pointer',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            zIndex:       9999,
            animation:    'glow 3s ease-in-out infinite',
          }}
        >
          <MessageCircle size={isMobile ? 22 : 24} color="#FFFFFF"/>
        </button>
      )}

      {/* ── Mobile backdrop ── */}
      {isOpen && isMobile && !isMinimized && (
        <div onClick={closeAssistant} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 9998 }}/>
      )}

      {/* ── Chat panel ── */}
      {isOpen && (
        <div style={{
          position:  'fixed',
          ...(isMobile ? {
            bottom: 0, left: 0, right: 0, width: '100%',
            height: isMinimized ? 56 : '58vh',
            borderRadius: '20px 20px 0 0',
            animation: 'slideUpMobile 0.3s ease',
          } : {
            bottom: 28, right: 28, width: 380,
            height: isMinimized ? 56 : 580,
            borderRadius: 20,
            animation: 'slideUp 0.2s ease',
          }),
          background:    C.bg,
          border:        `1px solid ${C.border}`,
          boxShadow:     C.shadow,
          zIndex:        9999,
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
          fontFamily:    C.font,
          transition:    'height 0.25s ease',
        }}>

          {/* Header */}
          <div
            onClick={() => setMinimized(p => !p)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '14px 20px' : '14px 16px', background: 'linear-gradient(135deg, #0AB98A 0%, #0EA5E9 100%)', flexShrink: 0, cursor: 'pointer', position: 'relative' }}>
            {isMobile && (
              <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.5)' }}/>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={14} color="#FFFFFF"/>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.02em' }}>
                  Novala Assistant
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Wifi size={8} color="rgba(255,255,255,0.85)"/>
                  {config.pageName} · Online
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {messages.length > 0 && (
                <button onClick={e => { e.stopPropagation(); clearConversation(); }}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 7, cursor: 'pointer', padding: 5, display: 'flex', color: '#FFFFFF' }}>
                  <Trash2 size={12}/>
                </button>
              )}
              {!isMobile && (
                <button onClick={e => { e.stopPropagation(); setMinimized(p => !p); }}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 7, cursor: 'pointer', padding: 5, display: 'flex', color: '#FFFFFF', transform: isMinimized ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <ChevronDown size={13}/>
                </button>
              )}
              <button onClick={e => { e.stopPropagation(); closeAssistant(); }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 7, cursor: 'pointer', padding: 5, display: 'flex', color: '#FFFFFF' }}>
                <X size={13}/>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 16px 8px' : '16px 14px 8px', scrollbarWidth: 'thin', scrollbarColor: `${C.textFaint} transparent` }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: isMobile ? '16px' : '20px 16px' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      {config.icon}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>Novala Assistant</div>
                    <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.7 }}>{config.intro}</div>
                  </div>
                )}
                {messages.map((msg, i) => <MessageBubble key={i} message={msg}/>)}
                {loading && <TypingIndicator/>}
                <div ref={messagesEndRef}/>
              </div>

              {/* Chips */}
              {messages.length < 2 && (
                <div style={{ padding: '6px 14px 4px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
                  {config.chips.slice(0,3).map(s => (
                    <button key={s} onClick={() => ask(s)} disabled={loading}
                      style={{ padding: '5px 10px', borderRadius: 20, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, color: C.accent, cursor: 'pointer', fontSize: 10, fontWeight: 500, fontFamily: C.font, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{ padding: isMobile ? '10px 16px 20px' : '10px 12px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0, background: C.bg }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Novala Assistant..."
                  rows={1}
                  style={{ flex: 1, padding: '9px 12px', background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, fontFamily: C.font, outline: 'none', resize: 'none', maxHeight: 80, lineHeight: 1.5 }}
                  onFocus={e => e.target.style.borderColor = C.accentBorder}
                  onBlur={e  => e.target.style.borderColor = C.border}
                />
                <button onClick={handleSend} disabled={!input.trim() || loading}
                  style={{ width: 36, height: 36, borderRadius: 10, background: !input.trim() || loading ? C.textFaint : C.accent, border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Send size={14} color="#FFFFFF"/>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}