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
    'How does the Transactions page work?',
    'What is my biggest expense this month?',
    'Which transactions are uncategorized?',
  ],
  documents: [
    'How does document upload work?',
    'Which files have no amount extracted?',
    'Show documents needing review',
  ],
  invoices: [
    'How does the Invoices page help me?',
    'Which invoices are overdue?',
    'What is my outstanding amount?',
  ],
  tax: [
    'How does the Tax calculator work?',
    'What counts as a deduction?',
    'How is my tax estimate calculated?',
  ],
  team: [
    'How does team access work?',
    'What can each role do?',
    'How do I invite a team member?',
  ],
  vendors: [
    'How does Vendor Analytics help me?',
    'Who are my top vendors by spend?',
    'Which vendors do I pay monthly?',
  ],
  budgets: [
    'How do budgets work in Novala?',
    'Which budgets are over limit?',
    'How much is left in my budgets?',
  ],
  scanner: [
    'How does the Receipt Scanner work?',
    'What data gets extracted from a receipt?',
    'How does AI read my documents?',
  ],
  integrations: [
    'How do integrations work?',
    'How do I connect QuickBooks?',
    'What does each integration do?',
  ],
  agents: [
    'How does the AI Compliance Agent work?',
    'What Alberta tax rules apply to me?',
    'What filings do I need to submit?',
  ],
  currency: [
    'How does Currency tracking work?',
    'What is the CAD to USD rate?',
    'How do I record foreign transactions?',
  ],
  reports: [
    'How do Financial Reports work?',
    'What is my net profit this month?',
    'How do my expenses compare to revenue?',
  ],
  reconciliation: [
    'How does Reconciliation work?',
    'Which transactions are unmatched?',
    'How do I reconcile my books?',
  ],
  billpay: [
    'How does Bill Pay work?',
    'Which bills are overdue right now?',
    'How much do I owe in total?',
  ],
  variance: [
    'How do Variance Reports work?',
    'Which categories am I over budget?',
    'How does this month compare to last?',
  ],
  ledger: [
    'How does the Ledger View work?',
    'What is my current net balance?',
    'Are there any unusual entries?',
  ],
  comparison: [
    'How does Document Comparison work?',
    'What are the key differences between these documents?',
    'Should I be concerned about these discrepancies?',
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
      const sendSessionId = currentPage === 'dashboard' ? null : sessionId;

      const res  = await askAI(
        question,
        sendSessionId,
        currentPage,
        pageContext,
        currentMode,
      );
      const data = res.data;

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