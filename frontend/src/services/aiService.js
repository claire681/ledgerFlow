/**
 * LedgerFlow AI Service — Frontend
 * Handles all AI-related API calls from the frontend.
 * No provider names anywhere — this is LedgerFlow AI.
 */

import {
  askAI as askAIApi,
  getAIHistory,
  clearAIHistory,
  getAIMemory,
  clearAIMemory,
  refreshAIMemory,
  getAIInsights,
  getAISuggestions,
} from './api';

// ── Ask LedgerFlow AI a question ──────────────────────────────────────────
export async function askLedgerFlowAI({
  question,
  sessionId   = null,
  page        = null,
  pageContext  = null,
}) {
  try {
    const res = await askAIApi(question, sessionId, page, pageContext);
    return {
      success:     true,
      reply:       res.data.reply,
      sessionId:   res.data.session_id,
      suggestions: res.data.suggestions || [],
    };
  } catch (err) {
    return {
      success:     false,
      reply:       'I am having trouble connecting. Please try again.',
      sessionId:   sessionId,
      suggestions: [],
      error:       err.message,
    };
  }
}

// ── Get conversation history ──────────────────────────────────────────────
export async function getConversationHistory(sessionId = null) {
  try {
    const res = await getAIHistory(sessionId);
    return res.data || [];
  } catch {
    return [];
  }
}

// ── Clear conversation history ────────────────────────────────────────────
export async function clearConversationHistory() {
  try {
    await clearAIHistory();
    return true;
  } catch {
    return false;
  }
}

// ── Get AI memory ─────────────────────────────────────────────────────────
export async function getMemory() {
  try {
    const res = await getAIMemory();
    return res.data || [];
  } catch {
    return [];
  }
}

// ── Clear AI memory ───────────────────────────────────────────────────────
export async function clearMemory() {
  try {
    await clearAIMemory();
    return true;
  } catch {
    return false;
  }
}

// ── Refresh AI memory ─────────────────────────────────────────────────────
export async function refreshMemory() {
  try {
    await refreshAIMemory();
    return true;
  } catch {
    return false;
  }
}

// ── Get dashboard insights ────────────────────────────────────────────────
export async function getDashboardInsights() {
  try {
    const res = await getAIInsights();
    return res.data?.insights || [];
  } catch {
    return [];
  }
}

// ── Get page suggestions ──────────────────────────────────────────────────
export async function getPageSuggestions(page) {
  try {
    const res = await getAISuggestions(page);
    return res.data?.suggestions || [];
  } catch {
    return getDefaultSuggestions(page);
  }
}

// ── Default suggestions fallback ──────────────────────────────────────────
export function getDefaultSuggestions(page) {
  const map = {
    dashboard: [
      'Summarize my financial position',
      'What should I focus on this month?',
      'How can I improve my profit?',
      'What are my biggest risks?',
    ],
    tax_calculator: [
      'Why is my tax so high?',
      'How can I reduce my tax?',
      'What deductions am I missing?',
      'What if I increase expenses by 10,000?',
    ],
    invoices: [
      'Which invoices are overdue?',
      'Who owes me the most?',
      'What is my expected cash flow?',
      'How do I get clients to pay faster?',
    ],
    transactions: [
      'Where am I spending the most?',
      'What increased this month?',
      'Which transactions are uncategorized?',
      'Show me my biggest expenses',
    ],
    budgets: [
      'Which categories am I over budget on?',
      'Where can I cut spending?',
      'Project my end of month position',
      'Compare to last month',
    ],
    receipts: [
      'Is this receipt tax deductible?',
      'How much can I deduct?',
      'What category should this be?',
      'How does this affect my taxes?',
    ],
  };

  return map[page] || [
    'Summarize my financial situation',
    'What should I do next?',
    'How is my business performing?',
    'What are my urgent financial tasks?',
  ];
}