import axios from 'axios';

const API_BASE = 'https://api.getnovala.com/api/v1';
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Automatically attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If token expires redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (email, password, fullName, company) =>
  api.post('/auth/register', {
    email,
    password,
    full_name: fullName,
    company,
  });

// ── Documents ─────────────────────────────────────────────────────────────
export const getDocuments = () =>
  api.get('/documents/');

export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteDocument = (id) =>
  api.delete(`/documents/${id}`);

export const updateDocument = (id, data) =>
  api.patch(`/documents/${id}`, data);

// ── Transactions ──────────────────────────────────────────────────────────
export const getTransactions = (params) =>
  api.get('/transactions/', { params });

export const updateTransaction = (id, data) =>
  api.patch(`/transactions/${id}`, data);

export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}`);

export const categorizeTransaction = (id) =>
  api.post(`/transactions/${id}/categorize`);

// ── Budgets ───────────────────────────────────────────────────────────────
export const getBudgets = () =>
  api.get('/budgets/');

export const createBudget = (data) =>
  api.post('/budgets/', data);

export const deleteBudget = (category) =>
  api.delete(`/budgets/${encodeURIComponent(category)}`);

// ── Invoices ──────────────────────────────────────────────────────────────
export const getInvoices          = ()         => api.get('/invoices/');
export const createInvoice        = (data)     => api.post('/invoices/', data);
export const getInvoice           = (id)       => api.get(`/invoices/${id}`);
export const updateInvoice        = (id, data) => api.patch(`/invoices/${id}`, data);
export const deleteInvoice        = (id)       => api.delete(`/invoices/${id}`);
export const markInvoicePaid      = (id)       => api.post(`/invoices/${id}/mark-paid`);
export const autoCreateInvoice    = (docId)    => api.post(`/invoices/auto-create/${docId}`);
export const autoCreateAllInvoices= ()         => api.post('/invoices/auto-create-all');

// ── Team ──────────────────────────────────────────────────────────────────
export const getTeamMembers   = ()         => api.get('/team/members');
export const inviteTeamMember = (data)     => api.post('/team/invite', data);
export const updateTeamMember = (id, data) => api.patch(`/team/${id}/role`, data);
export const removeTeamMember = (id)       => api.delete(`/team/${id}`);

// ── Analytics ─────────────────────────────────────────────────────────────
export const getDashboardStats = () => api.get('/analytics/dashboard');
export const getCashFlow       = () => api.get('/analytics/cash-flow');

// ── Agents ────────────────────────────────────────────────────────────────
export const agentChat  = (messages, provider = 'openai') =>
  api.post('/agents/chat', { messages, provider });

export const getAgentLogs = () =>
  api.get('/agents/logs');

// ── Integrations ──────────────────────────────────────────────────────────
export const getIntegrations      = ()         => api.get('/integrations/');
export const connectIntegration    = (provider) => api.post(`/integrations/${provider}/connect`);
export const disconnectIntegration = (provider) => api.post(`/integrations/${provider}/disconnect`);

// ── Company Profile ───────────────────────────────────────────────────────
export const getCompanyProfile  = ()     => api.get('/company/profile');
export const saveCompanyProfile = (data) => api.post('/company/profile', data);
export const patchCompanyProfile= (data) => api.patch('/company/profile', data);

// ── Tax Reports ───────────────────────────────────────────────────────────
export const getTaxReports  = ()     => api.get('/tax-reports/');
export const getTaxReport   = (id)   => api.get(`/tax-reports/${id}`);
export const createTaxReport= (data) => api.post('/tax-reports/', data);
export const deleteTaxReport= (id)   => api.delete(`/tax-reports/${id}`);

// ── What-If Scenarios ─────────────────────────────────────────────────────
export const getScenarios   = ()     => api.get('/scenarios/');
export const getScenario    = (id)   => api.get(`/scenarios/${id}`);
export const createScenario = (data) => api.post('/scenarios/', data);
export const deleteScenario = (id)   => api.delete(`/scenarios/${id}`);

// ── AI ────────────────────────────────────────────────────────────────────
export const askAI = (question, sessionId, page, pageContext, mode) =>
  api.post('/ai/ask', {
    question,
    session_id:   sessionId   || null,
    page:         page        || 'dashboard',
    mode:         mode        || page || 'dashboard',
    page_context: pageContext || null,
  });

export const getAIHistory    = (sessionId) =>
  api.get('/ai/history', { params: { session_id: sessionId } });

export const clearAIHistory  = () => api.delete('/ai/history');
export const getAIMemory     = () => api.get('/ai/memory');
export const clearAIMemory   = () => api.delete('/ai/memory');
export const refreshAIMemory = () => api.post('/ai/memory/refresh');
export const getAIInsights   = () => api.get('/ai/insights');
export const getAISuggestions= (page) =>
  api.get('/ai/suggestions', { params: { page } });

// ── Snapshots ─────────────────────────────────────────────────────────────
export const getLatestSnapshot    = ()       => api.get('/snapshots/latest');
export const getSnapshotTimeline  = (months) => api.get('/snapshots/', { params: { months: months || 12 } });
export const generateSnapshot     = ()       => api.post('/snapshots/generate');

// ── Preferences ───────────────────────────────────────────────────────────
export const getPreferences     = ()           => api.get('/preferences/');
export const setPreference      = (key, value) => api.post('/preferences/', { key, value });
export const setPreferencesBulk = (data)       => api.post('/preferences/bulk', data);
export const deletePreference   = (key)        => api.delete(`/preferences/${key}`);

export const getDailyBriefing = () => api.get('/analytics/briefing');
// ── Financial Reports ─────────────────────────────────────────────────────
export const getPLReport       = (params) => api.get('/analytics/pl-report', { params });
export const getBalanceSheet   = (params) => api.get('/analytics/balance-sheet', { params });
export const getCashFlowReport = (params) => api.get('/analytics/cash-flow-report', { params });

export default api;