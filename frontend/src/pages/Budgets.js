import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, X, Target, TrendingUp,
  AlertCircle, CheckCircle, AlertTriangle,
  DollarSign, BarChart3, PiggyBank, Edit2, Save,
  Search, TrendingDown, Award, Layers,
} from 'lucide-react';
import { L, card, page, topBar, input } from '../styles/light';
import { useAI } from '../hooks/useAI';

const CATEGORIES = [
  'Software & SaaS', 'Cloud Infrastructure', 'Marketing',
  'Rent & Facilities', 'Professional Services', 'Payroll',
  'Travel & Entertainment', 'Office Supplies', 'Hardware & Equipment',
  'Insurance', 'Legal & Compliance', 'Utilities',
  'Healthcare Services', 'Research & Development', 'Custom...',
];

const statusConfig = {
  exceeded: { color: L.red,    icon: <AlertCircle size={11} />,   label: 'Exceeded' },
  warning:  { color: L.gold,   icon: <AlertTriangle size={11} />, label: 'Warning'  },
  moderate: { color: L.blue,   icon: <BarChart3 size={11} />,     label: 'Moderate' },
  good:     { color: L.accent, icon: <CheckCircle size={11} />,   label: 'On Track' },
};

// ── Edit Modal ────────────────────────────────────────────────
function EditModal({ budget, onClose, onSave }) {
  const [limit,  setLimit]  = useState(String(budget.monthly_limit));
  const [spent,  setSpent]  = useState(String(budget.manual_spent ?? budget.spent ?? ''));
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSave = async () => {
    if (!limit || isNaN(limit)) { setError('Please enter a valid limit.'); return; }
    setSaving(true);
    setError('');
    try {
      const body = { monthly_limit: parseFloat(limit) };
      if (spent !== '' && !isNaN(spent)) body.manual_spent = parseFloat(spent);
      await onSave(budget.id, body);
      onClose();
    } catch (e) {
      setError('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ ...card, padding: 28, width: 420, maxWidth: '92vw', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: L.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit2 size={15} color={L.accent} />
            Edit — {budget.category}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: L.textMuted }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: L.radiusSm, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Monthly Limit ($)</div>
          <input type="number" min="0" placeholder="e.g. 5000" value={limit} onChange={e => setLimit(e.target.value)} style={input} />
          <div style={{ fontSize: 11, color: L.textMuted, marginTop: 4 }}>Maximum you want to spend this month in this category.</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Amount Spent ($) <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: L.textFaint }}>(optional override)</span>
          </div>
          <input type="number" min="0" placeholder="Leave blank to use auto-tracked amount" value={spent} onChange={e => setSpent(e.target.value)} style={input} />
          <div style={{ fontSize: 11, color: L.textMuted, marginTop: 4 }}>Leave blank to use transaction data automatically.</div>
        </div>

        <div style={{ padding: '12px 14px', borderRadius: L.radiusSm, background: L.pageBg, border: `1px solid ${L.border}`, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: L.textMuted, marginBottom: 8 }}>Current snapshot</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Auto-tracked',  value: `$${Number(budget.spent          || 0).toLocaleString()}` },
              { label: 'Current limit', value: `$${Number(budget.monthly_limit  || 0).toLocaleString()}` },
              { label: 'Remaining',     value: `$${Number(budget.remaining      || 0).toLocaleString()}` },
            ].map(n => (
              <div key={n.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: L.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{n.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: L.text }}>{n.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: L.radiusSm, background: saving ? L.textFaint : L.accent, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font }}>
            <Save size={13} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={onClose}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: L.radiusSm, background: 'transparent', color: L.textMuted, border: `1px solid ${L.border}`, cursor: 'pointer', fontSize: 13, fontFamily: L.font }}>
            <X size={13} /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Insight card ──────────────────────────────────────────────
function InsightCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {React.cloneElement(icon, { size: 18, color })}
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: L.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: L.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function Budgets() {
  const [budgets,   setBudgets]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [category,  setCategory]  = useState(CATEGORIES[0]);
  const [customCat, setCustomCat] = useState('');
  const [isCustom,  setIsCustom]  = useState(false);
  const [limit,     setLimit]     = useState('');
  const [currency,  setCurrency]  = useState('USD');
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(null);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');

  const { setPageContext } = useAI();
  const getToken = () => localStorage.getItem('token') || '';

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/v1/budgets/', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setBudgets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Load budgets error:', e);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Budget-specific context for AI assistant ──────────────
  useEffect(() => {
    const totalLimit     = budgets.reduce((s, b) => s + (b.monthly_limit || 0), 0);
    const totalSpent     = budgets.reduce((s, b) => s + (b.spent || 0), 0);
    const totalRemaining = budgets.reduce((s, b) => s + (b.remaining || 0), 0);
    const exceeded       = budgets.filter(b => b.status === 'exceeded');
    const warning        = budgets.filter(b => b.status === 'warning');
    const onTrack        = budgets.filter(b => b.status === 'good');
    const highest        = [...budgets].sort((a, b) => (b.spent || 0) - (a.spent || 0))[0];

    setPageContext('budgets', {
      page:              'budgets',
      total_budgets:     budgets.length,
      total_limit:       totalLimit,
      total_spent:       totalSpent,
      total_remaining:   totalRemaining,
      over_budget_count: exceeded.length,
      warning_count:     warning.length,
      on_track_count:    onTrack.length,
      highest_spending_category: highest?.category || 'None',
      highest_spending_amount:   highest?.spent    || 0,
      budget_list: budgets.map(b => ({
        category:      b.category,
        limit:         b.monthly_limit,
        spent:         b.spent,
        remaining:     b.remaining,
        percentage:    b.percentage,
        status:        b.status,
        currency:      b.currency,
      })),
      exceeded_budgets: exceeded.map(b => ({
        category:  b.category,
        overspent: (b.spent || 0) - (b.monthly_limit || 0),
      })),
    });
  }, [budgets, setPageContext]);

  // ── Live search filter ────────────────────────────────────
  const filteredBudgets = useMemo(() => {
    if (!search.trim()) return budgets;
    const q = search.toLowerCase();
    return budgets.filter(b => {
      const sc = statusConfig[b.status]?.label?.toLowerCase() || '';
      return (
        b.category.toLowerCase().includes(q)         ||
        sc.includes(q)                               ||
        String(b.monthly_limit).includes(q)          ||
        String(b.spent || 0).includes(q)
      );
    });
  }, [budgets, search]);

  // ── Insights ──────────────────────────────────────────────
  const totalLimit     = budgets.reduce((s, b) => s + (b.monthly_limit || 0), 0);
  const totalSpent     = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const totalRemaining = budgets.reduce((s, b) => s + (b.remaining || 0), 0);
  const exceededCount  = budgets.filter(b => b.status === 'exceeded').length;
  const highestCat     = [...budgets].sort((a, b) => (b.spent || 0) - (a.spent || 0))[0];

  const finalCat = isCustom ? customCat.trim() : category;

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!limit || isNaN(limit)) { setError('Please enter a valid monthly limit.'); return; }
    if (!finalCat)               { setError('Please select or enter a category.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/v1/budgets/', {
        method:  'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ category: finalCat, monthly_limit: parseFloat(limit), currency }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.detail || 'Failed to create budget.'); return; }
      setLimit(''); setCustomCat(''); setIsCustom(false);
      setCategory(CATEGORIES[0]); setShowForm(false);
      await load();
    } catch (e) {
      setError('Failed to create budget: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (budgetId, body) => {
    const res = await fetch(`/api/v1/budgets/${budgetId}`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || 'Failed to update');
    await load();
  };

  const handleDelete = async (cat) => {
    try {
      const res = await fetch(`/api/v1/budgets/${encodeURIComponent(cat)}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { const d = await res.json(); alert(d?.detail || 'Delete failed'); return; }
      setDeleting(null);
      await load();
    } catch (e) { alert('Delete failed: ' + e.message); }
  };

  const getSC = (s) => statusConfig[s] || statusConfig.good;

  return (
    <div style={page}>

      {/* ── Top bar ── */}
      <div style={topBar}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: L.text, letterSpacing: '-0.02em' }}>
            Budget Tracking
          </div>
          <div style={{ fontSize: 12, color: L.textMuted, marginTop: 2 }}>
            Set monthly limits and track spending across categories
          </div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 20px', borderRadius: L.radiusSm,
            background: showForm ? 'transparent' : L.accent,
            color:      showForm ? L.textMuted    : '#fff',
            border:     showForm ? `1px solid ${L.border}` : 'none',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font,
            boxShadow: showForm ? 'none' : '0 4px 14px rgba(10,185,138,0.3)',
            transition: 'all 0.2s',
          }}
        >
          {showForm ? <><X size={13} /> Cancel</> : <><Plus size={14} /> Set Budget</>}
        </button>
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* ── Summary cards ── */}
        {budgets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Total Budgets', value: budgets.length,                  color: L.text,   icon: <Target size={16} />      },
              { label: 'Total Limit',   value: `$${totalLimit.toLocaleString()}`,  color: L.blue,   icon: <DollarSign size={16} />  },
              { label: 'Total Spent',   value: `$${totalSpent.toLocaleString()}`,  color: L.accent, icon: <TrendingUp size={16} />  },
              { label: 'Over Budget',   value: exceededCount,                    color: L.red,    icon: <AlertCircle size={16} /> },
            ].map(item => (
              <div key={item.label} style={{ ...card, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: L.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{item.label}</div>
                  <span style={{ color: item.color, opacity: 0.6 }}>{item.icon}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Insights row ── */}
        {budgets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
            <InsightCard
              icon={<Award />}
              label="Highest Spending"
              value={highestCat ? highestCat.category : '—'}
              color="#8B5CF6"
              sub={highestCat ? `$${Number(highestCat.spent || 0).toLocaleString()} spent` : 'No data yet'}
            />
            <InsightCard
              icon={<TrendingDown />}
              label="Total Remaining"
              value={`$${totalRemaining.toLocaleString()}`}
              color={L.accent}
              sub={`across ${budgets.length} budget${budgets.length !== 1 ? 's' : ''}`}
            />
            <InsightCard
              icon={<Layers />}
              label="Budgets Exceeded"
              value={exceededCount}
              color={exceededCount > 0 ? L.red : L.accent}
              sub={exceededCount > 0 ? 'Need immediate attention' : 'All budgets in control'}
            />
          </div>
        )}

        {/* ── Search bar ── */}
        {budgets.length > 0 && (
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={14} color={L.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search budgets by name, status, or amount..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                ...input,
                paddingLeft: 36,
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: L.textMuted, display: 'flex' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* ── Create form ── */}
        {showForm && (
          <form onSubmit={handleCreate}>
            <div style={{ ...card, padding: '24px', marginBottom: 24, borderTop: `3px solid ${L.accent}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: L.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PiggyBank size={16} color={L.accent} /> New Budget
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: L.radiusSm, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: 14, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Category</div>
                  <select
                    value={isCustom ? 'Custom...' : category}
                    onChange={e => { if (e.target.value === 'Custom...') { setIsCustom(true); setCategory('Custom...'); } else { setIsCustom(false); setCategory(e.target.value); } }}
                    style={{ ...input, cursor: 'pointer' }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Monthly Limit</div>
                  <input type="number" placeholder="e.g. 5000" min="1" value={limit} onChange={e => setLimit(e.target.value)} style={input} required />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Currency</div>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...input, cursor: 'pointer' }}>
                    {['USD','EUR','GBP','CAD','AUD','NGN','KES','ZAR'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {isCustom && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: L.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Custom Category Name</div>
                  <input type="text" placeholder="e.g. Vehicle Maintenance" value={customCat} onChange={e => setCustomCat(e.target.value)} style={{ ...input, borderColor: L.accentBorder }} required={isCustom} />
                </div>
              )}

              <button type="submit" disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 28px', borderRadius: L.radiusSm, background: saving ? L.textFaint : L.accent, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font, boxShadow: saving ? 'none' : '0 4px 12px rgba(10,185,138,0.25)' }}>
                <CheckCircle size={13} /> {saving ? 'Saving...' : 'Save Budget'}
              </button>
            </div>
          </form>
        )}

        {loading && <div style={{ textAlign: 'center', padding: 48, color: L.textMuted }}>Loading budgets...</div>}

        {/* ── Empty states ── */}
        {!loading && budgets.length === 0 && !showForm && (
          <div style={{ ...card, padding: 64, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Target size={28} color={L.accent} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: L.text, marginBottom: 8 }}>No budgets set yet</div>
            <div style={{ fontSize: 13, color: L.textMuted, marginBottom: 20 }}>Set monthly spending limits to stay in control of your finances.</div>
            <button onClick={() => setShowForm(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: L.radiusSm, background: L.accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font, boxShadow: '0 4px 14px rgba(10,185,138,0.3)' }}>
              <Plus size={13} /> Set First Budget
            </button>
          </div>
        )}

        {/* Search empty state */}
        {!loading && budgets.length > 0 && filteredBudgets.length === 0 && (
          <div style={{ ...card, padding: 48, textAlign: 'center', marginBottom: 20 }}>
            <Search size={28} color={L.textMuted} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: L.text, marginBottom: 6 }}>No budgets found</div>
            <div style={{ fontSize: 13, color: L.textMuted }}>No budgets match "<strong>{search}</strong>". Try a different search.</div>
            <button onClick={() => setSearch('')}
              style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: L.radiusSm, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', fontSize: 12, fontFamily: L.font }}>
              <X size={12} /> Clear search
            </button>
          </div>
        )}

        {/* ── Budget cards ── */}
        {search && filteredBudgets.length > 0 && (
          <div style={{ fontSize: 12, color: L.textMuted, marginBottom: 12 }}>
            Showing {filteredBudgets.length} of {budgets.length} budgets
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 18 }}>
          {filteredBudgets.map(b => {
            const sc         = getSC(b.status);
            const spent      = Number(b.spent         || 0);
            const limitAmt   = Number(b.monthly_limit || 0);
            const remaining  = Number(b.remaining     || 0);
            const percentage = Number(b.percentage    || 0);

            return (
              <div
                key={b.id || b.category}
                style={{ ...card, borderTop: `3px solid ${sc.color}`, padding: '20px', transition: 'all 0.18s ease', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = ''; }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: L.text, marginBottom: 6 }}>{b.category}</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: sc.color, background: `${sc.color}10`, padding: '3px 10px', borderRadius: 20, border: `1px solid ${sc.color}25` }}>
                      {sc.icon} {sc.label}
                    </span>
                    {b.manual_spent !== null && b.manual_spent !== undefined && (
                      <div style={{ fontSize: 10, color: L.textMuted, marginTop: 5 }}>✏️ Manually adjusted</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setEditing(b)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, color: L.accent, cursor: 'pointer', borderRadius: L.radiusSm, padding: '5px 10px', fontSize: 11, fontFamily: L.font, transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(10,185,138,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = L.accentSoft}>
                      <Edit2 size={11} /> Edit
                    </button>
                    <button onClick={() => setDeleting(b.category)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: `1px solid ${L.border}`, color: L.textMuted, cursor: 'pointer', borderRadius: L.radiusSm, padding: '5px 10px', fontSize: 11, fontFamily: L.font, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = L.redBorder; e.currentTarget.style.color = L.red; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = L.border;    e.currentTarget.style.color = L.textMuted; }}>
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ background: L.pageBg, borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ width: `${Math.min(100, percentage)}%`, height: '100%', background: sc.color, borderRadius: 6, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: L.textMuted, marginBottom: 14 }}>
                  <span>{percentage}% used</span>
                  <span>${spent.toLocaleString()} / ${limitAmt.toLocaleString()}</span>
                </div>

                {/* Numbers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Spent',     value: `$${spent.toLocaleString()}`,     color: sc.color                          },
                    { label: 'Remaining', value: `$${remaining.toLocaleString()}`, color: remaining > 0 ? L.accent : L.red },
                    { label: 'Limit',     value: `$${limitAmt.toLocaleString()}`,  color: L.textSub                         },
                  ].map(n => (
                    <div key={n.label} style={{ background: L.pageBg, borderRadius: L.radiusSm, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: L.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{n.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: n.color }}>{n.value}</div>
                    </div>
                  ))}
                </div>

                {/* Status message */}
                <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: L.radiusSm, background: `${sc.color}08`, fontSize: 12, color: sc.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {sc.icon}
                  {b.status === 'exceeded'
                    ? `Over budget by $${(spent - limitAmt).toLocaleString()}`
                    : `$${remaining.toLocaleString()} remaining this month`
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Edit modal ── */}
      {editing && (
        <EditModal
          budget={editing}
          onClose={() => setEditing(null)}
          onSave={handleUpdate}
        />
      )}

      {/* ── Delete confirm modal ── */}
      {deleting && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ ...card, padding: 28, width: 360, maxWidth: '90vw', boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: L.text, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trash2 size={16} color={L.red} /> Delete Budget
            </div>
            <div style={{ fontSize: 13, color: L.textMuted, marginBottom: 24 }}>
              Delete budget for <strong style={{ color: L.text }}>{deleting}</strong>? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleDelete(deleting)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: L.radiusSm, background: L.red, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font }}>
                <Trash2 size={13} /> Delete
              </button>
              <button onClick={() => setDeleting(null)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: L.radiusSm, background: 'transparent', color: L.textMuted, border: `1px solid ${L.border}`, cursor: 'pointer', fontSize: 13, fontFamily: L.font }}>
                <X size={13} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}