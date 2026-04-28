import { useCallback } from 'react';
import { useAIContext } from '../context/AIContext';

/**
 * useAI — Simple hook for any page to use the AI assistant.
 *
 * Usage:
 *   const { ask, loading, suggestions, setPageContext } = useAI();
 *
 *   // Tell AI what page you are on and what data is visible
 *   useEffect(() => {
 *     setPageContext('invoices', {
 *       page: 'invoices',
 *       totalInvoices: 24,
 *       overdueCount: 3,
 *       overdueAmount: 4200,
 *     });
 *   }, [invoices]);
 *
 *   // Ask a question
 *   const reply = await ask('Which invoices are overdue?');
 */
export function useAI() {
  const {
    ask,
    loading,
    error,
    messages,
    suggestions,
    currentPage,
    pageContext,
    setPageContext,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    clearConversation,
    isOpen,
  } = useAIContext();

  // Ask a question and open the assistant panel
  const askAndOpen = useCallback(async (question) => {
    openAssistant();
    return ask(question);
  }, [ask, openAssistant]);

  return {
    // Core
    ask,
    askAndOpen,
    loading,
    error,
    messages,

    // Page context
    setPageContext,
    currentPage,
    pageContext,

    // Suggestions
    suggestions,

    // Assistant panel
    isOpen,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    clearConversation,
  };
}

export default useAI;