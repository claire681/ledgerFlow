import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { askAI } from '../services/api';

const AIContext = createContext(null);

const PAGE_SUGGESTIONS = {
  dashboard: [
    'How is my business doing?',
    'What is my estimated tax?',
    'Which invoices are overdue?',
  ],
  transactions: [
    'What is my biggest expense?',
    'Which transactions are uncategorized?',
    'Show all software expenses',
  ],
  documents: [
    'Which documents were processed?',
    'Which files have no amount?',
    'Show documents needing review',
  ],
  invoices: [
    'Which invoices are overdue?',
    'Who has not paid yet?',
    'What is my outstanding amount?',
  ],
  tax: [
    'How is my tax calculated?',
    'What counts as a deduction?',
    'Can I override the tax rate?',
  ],
  team: [
    'What does Admin do?',
    'Who has access?',
    'How do I invite a member?',
  ],
  vendors: [
    'Who are my top vendors?',
    'Which vendors repeat monthly?',
    'How much did I spend by vendor?',
  ],
  budgets: [
    'Which budgets are over limit?',
    'How much is left in my budgets?',
    'Am I overspending anywhere?',
  ],
  scanner: [
    'What happens after I upload a receipt?',
    'What data is extracted from a receipt?',
    'How do I save a scanned receipt?',
  ],
  integrations: [
    'What does QuickBooks connect to?',
    'How do I connect Stripe?',
    'Why is this integration offline?',
  ],
  agents: [
    'What Alberta tax rules apply to me?',
    'What filings do Alberta businesses need?',
    'Explain Alberta compliance',
  ],
  currency: [
    'What is the CAD to USD rate?',
    'How do I record foreign currency?',
    'Which currencies are supported?',
  ],
};

export function AIProvider({ children }) {
  const [isOpen,          setIsOpen]           = useState(false);
  const [loading,         setLoading]          = useState(false);
  const [messages,        setMessages]         = useState([]);
  const [sessionId,       setSessionId]        = useState(null);
  const [suggestions,     setSuggestions]      = useState(PAGE_SUGGESTIONS.dashboard);
  const [currentPage,     setCurrentPage]      = useState('dashboard');
  const [currentMode,     setCurrentMode]      = useState('dashboard');
  const [pageContext,     setPageContextState] = useState(null);
  const [error,           setError]            = useState(null);

  const prevPageRef = useRef('dashboard');

  const setPageContext = useCallback((page, context) => {
    if (prevPageRef.current !== page) {
      prevPageRef.current = page;
      setMessages([]);
      setSessionId(null);
      setError(null);
    }
    setCurrentPage(page);
    setCurrentMode(page);
    setPageContextState(context);
    setSuggestions(PAGE_SUGGESTIONS[page] || PAGE_SUGGESTIONS.dashboard);
  }, []);

  const ask = useCallback(async (question) => {
    if (!question?.trim()) return;

    setMessages(prev => [...prev, {
      role:      'user',
      content:   question,
      timestamp: new Date().toISOString(),
    }]);
    setLoading(true);
    setError(null);

    try {
      // Dashboard always sends null session_id to force fresh context
      // Other pages use their session for conversation continuity
      const sendSessionId = currentPage === 'dashboard' ? null : sessionId;

      const res  = await askAI(
        question,
        sendSessionId,
        currentPage,
        pageContext,
        currentMode,
      );
      const data = res.data;

      // Only store session for non-dashboard pages
      if (currentPage !== 'dashboard' && data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }

      setMessages(prev => [...prev, {
        role:      'assistant',
        content:   data.reply,
        timestamp: new Date().toISOString(),
      }]);

      return data.reply;

    } catch (err) {
      const errorMsg = 'I am having trouble connecting right now. Please try again.';
      setError(errorMsg);
      setMessages(prev => [...prev, {
        role:      'assistant',
        content:   errorMsg,
        timestamp: new Date().toISOString(),
        isError:   true,
      }]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, currentPage, currentMode, pageContext]);

  const openAssistant   = useCallback(() => setIsOpen(true),    []);
  const closeAssistant  = useCallback(() => setIsOpen(false),   []);
  const toggleAssistant = useCallback(() => setIsOpen(p => !p), []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  return (
    <AIContext.Provider value={{
      isOpen, loading, messages, sessionId,
      suggestions, currentPage, currentMode, pageContext, error,
      ask, setPageContext,
      openAssistant, closeAssistant, toggleAssistant, clearConversation,
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAIContext() {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAIContext must be used inside AIProvider');
  return context;
}

export default AIContext;