import React, { useState, useEffect } from 'react';
import { getTransactions, updateTransaction } from '../services/api';
import { L, card, page, topBar, badge } from '../styles/light';
import { useAI } from '../hooks/useAI';
import {
  Upload, Trash2, CheckCircle, AlertCircle,
  TrendingUp, TrendingDown, Tag, Calendar,
  DollarSign, Filter, X,
} from 'lucide-react';

export default function Transactions() {
  const [txns,    setTxns]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [editing, setEditing] = useState(null);
  const [editCat, setEditCat] = useState('');
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  const { setPageContext } = useAI();

  const load = async () => {
    try {
      const res = await getTransactions({});
      setTxns(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setError('Could not load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setPageContext('transactions', {
      page:         'transactions',
      total:        txns.length,
      income_count: txns.filter(t => t.txn_type === 'income').length,
      expense_count: txns.filter(t => t.txn_type === 'expense').length,
      uncategorized: txns.filter(t => !t.category).length,
      total_income:  txns.filter(t => t.txn_type === 'income').reduce((s, t) => s + (t.amount || 0), 0),
      total_expenses: txns.filter(t => t.txn_type === 'expense').reduce((s, t) => s + (t.amount || 0), 0),
    });
  }, [txns]);

  const handleSave = async (id) => {
    try {
      await updateTransaction(id, { category: editCat });
      setEditing(null);
      setSuccess('Category saved');
      setTimeout(() => setSuccess(''), 3000);
      load();
    } catch (e) {
      setError('Save failed');
    }
  };

  const handleDelete = async (id, vendor) => {
    if (!window.confirm(`Delete transaction from "${vendor}"?`)) return;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const res   = await fetch(`/api/v1/transactions/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        setSuccess('Transaction deleted');
        setTimeout(() => setSuccess(''), 3000);
        setTxns(prev => prev.filter(t => t.id !== id));
      } else {
        throw new Error(`Delete failed: ${res.status}`);
      }
    } catch (e) {
      setError('Delete failed: ' + e.message);
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res  = await fetch('/api/v1/transactions/import-csv', {
        method:  'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body:    formData,
      });
      const data = await res.json();
      setSuccess(`✅ ${data.message}`);
      setTimeout(() => setSuccess(''), 5000);
      load();
    } catch (err) {
      setError('Import failed: ' + err.message);
    }
  };

  const getTypeBadge = (txnType) => {
    const isIncome = txnType === 'income';
    return (
      <span style={{
        ...badge(
          isIncome ? L.accent : L.red,
          isIncome ? L.accentSoft : 'rgba(239,68,68,0.08)',
          isIncome ? L.accentBorder : 'rgba(239,68,68,0.2)',
        ),
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>
        {isIncome
          ? <TrendingUp size={10} />
          : <TrendingDown size={10} />}
        {isIncome ? 'Income' : 'Expense'}
      </span>
    );
  };

  const getCategoryBadge = (cat, txnType) => {
    if (!cat || cat.toLowerCase() === 'other') {
      return (
        <span style={{
          ...badge(L.textMuted, L.pageBg, L.border),
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <Tag size={10} />
          {txnType === 'income' ? 'Income' : 'Expense'}
        </span>
      );
    }
    return (
      <span style={{
        ...badge(L.blue, L.blueSoft, L.blueBorder),
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>
        <Tag size={10} />
        {cat}
      </span>
    );
  };

  const filters  = ['all', 'income', 'expense', 'uncategorized'];
  const filtered = txns.filter(t => {
    if (filter === 'income')        return t.txn_type === 'income';
    if (filter === 'expense')       return t.txn_type === 'expense';
    if (filter === 'uncategorized') return !t.category;
    return true;
  });

  return (
    <div style={page}>

      {/* Top bar */}
      <div style={topBar}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>
            Transactions
          </div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>
            Auto-categorized by AI · Click a row to edit category
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input type="file" accept=".csv" id="csv-import"
            style={{ display:'none' }} onChange={handleImportCSV}/>
          <button
            onClick={() => document.getElementById('csv-import').click()}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'8px 14px', borderRadius:L.radiusSm,
              background:L.accentSoft, border:`1px solid ${L.accentBorder}`,
              color:L.accent, cursor:'pointer', fontSize:12,
              fontWeight:600, fontFamily:L.font,
            }}
          >
            <Upload size={13} />
            Import CSV
          </button>
          {filters.map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              style={{
                display:'flex', alignItems:'center', gap:5,
                padding:'7px 14px', borderRadius:20, cursor:'pointer',
                fontSize:11, fontWeight:600, border:'1px solid',
                borderColor: filter === f ? L.accentBorder : L.border,
                background:  filter === f ? L.accentSoft   : '#FFFFFF',
                color:       filter === f ? L.accent        : L.textMuted,
                fontFamily:  L.font, transition:'all 0.15s',
              }}
            >
              {f === 'income'        && <TrendingUp size={10} />}
              {f === 'expense'       && <TrendingDown size={10} />}
              {f === 'uncategorized' && <Tag size={10} />}
              {f === 'all'           && <Filter size={10} />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'24px 28px' }}>

        {/* Success */}
        {success && (
          <div style={{
            padding:'10px 16px', borderRadius:L.radiusSm,
            background:L.accentSoft, border:`1px solid ${L.accentBorder}`,
            color:L.accent, fontSize:13, marginBottom:16,
            display:'flex', alignItems:'center', gap:8,
          }}>
            <CheckCircle size={14} />
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding:'10px 16px', borderRadius:L.radiusSm,
            background:'rgba(239,68,68,0.08)',
            border:'1px solid rgba(239,68,68,0.2)',
            color:L.red, fontSize:13, marginBottom:16,
            display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <AlertCircle size={14} />
              {error}
            </div>
            <button onClick={() => setError('')}
              style={{ background:'none', border:'none', color:L.red, cursor:'pointer', display:'flex' }}>
              <X size={16} />
            </button>
          </div>
        )}

        <div style={{ ...card, overflow:'hidden' }}>

          {/* Table header */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: '110px 1fr 110px 110px 150px 90px 50px',
            padding:             '10px 20px',
            borderBottom:        `1px solid ${L.borderLight}`,
            background:          L.pageBg,
          }}>
            {[
              { label:'DATE',     icon:<Calendar size={9} /> },
              { label:'VENDOR',   icon:<DollarSign size={9} /> },
              { label:'AMOUNT',   icon:<DollarSign size={9} /> },
              { label:'TYPE',     icon:<TrendingUp size={9} /> },
              { label:'CATEGORY', icon:<Tag size={9} /> },
              { label:'STATUS',   icon:<CheckCircle size={9} /> },
              { label:'',         icon:null },
            ].map(h => (
              <div key={h.label} style={{
                fontSize:9, fontWeight:700,
                color:L.textFaint, letterSpacing:'0.12em',
                display:'flex', alignItems:'center', gap:4,
              }}>
                {h.icon}
                {h.label}
              </div>
            ))}
          </div>

          {loading && (
            <div style={{ padding:40, textAlign:'center', color:L.textMuted, fontSize:13 }}>
              Loading transactions...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding:60, textAlign:'center' }}>
              <div style={{
                width:56, height:56, borderRadius:16,
                background:L.accentSoft, border:`1px solid ${L.accentBorder}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 16px',
              }}>
                <DollarSign size={24} color={L.accent} />
              </div>
              <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:6 }}>
                No transactions found
              </div>
              <div style={{ fontSize:13, color:L.textMuted }}>
                Upload documents to auto-create transactions
              </div>
            </div>
          )}

          {filtered.map((t) => (
            <div key={t.id}>
              <div
                style={{
                  display:             'grid',
                  gridTemplateColumns: '110px 1fr 110px 110px 150px 90px 50px',
                  padding:             '13px 20px',
                  cursor:              'pointer',
                  borderBottom:        `1px solid ${L.borderLight}`,
                  transition:          'background 0.1s',
                  alignItems:          'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = L.rowHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => {
                  setEditing(editing === t.id ? null : t.id);
                  setEditCat(t.category || '');
                }}
              >
                {/* Date */}
                <div style={{
                  fontSize:12, color:L.textMuted, fontFamily:L.fontMono,
                  display:'flex', alignItems:'center', gap:5,
                }}>
                  <Calendar size={11} color={L.textFaint} />
                  {t.txn_date || '—'}
                </div>

                {/* Vendor */}
                <div style={{
                  fontSize:13, fontWeight:600, color:L.text,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                }}>
                  {t.vendor || '—'}
                </div>

                {/* Amount */}
                <div style={{
                  fontSize:13, fontWeight:700, fontFamily:L.fontMono,
                  color: t.txn_type === 'income' ? L.accent : L.red,
                  display:'flex', alignItems:'center', gap:4,
                }}>
                  {t.txn_type === 'income'
                    ? <TrendingUp size={12} />
                    : <TrendingDown size={12} />}
                  {t.txn_type === 'income' ? '+' : '-'}
                  ${Math.abs(t.amount || 0).toLocaleString('en', { minimumFractionDigits:2, maximumFractionDigits:2 })}
                </div>

                {/* Type */}
                <div onClick={e => e.stopPropagation()}>
                  {getTypeBadge(t.txn_type)}
                </div>

                {/* Category */}
                <div>
                  {getCategoryBadge(t.category, t.txn_type)}
                </div>

                {/* Status */}
                <div>
                  <span style={{
                    ...badge(
                      t.status === 'flagged' ? L.gold      : L.accent,
                      t.status === 'flagged' ? L.goldSoft  : L.accentSoft,
                      t.status === 'flagged' ? L.goldBorder : L.accentBorder,
                    ),
                    display:'inline-flex', alignItems:'center', gap:4,
                  }}>
                    {t.status === 'flagged'
                      ? <AlertCircle size={10} />
                      : <CheckCircle size={10} />}
                    {t.status === 'flagged' ? 'Flagged' : 'OK'}
                  </span>
                </div>

                {/* Delete */}
                <div onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleDelete(t.id, t.vendor)}
                    title="Delete transaction"
                    style={{
                      width:28, height:28, borderRadius:6,
                      background:'transparent',
                      border:`1px solid ${L.border}`,
                      cursor:'pointer', display:'flex',
                      alignItems:'center', justifyContent:'center',
                      transition:'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
                      e.currentTarget.style.background  = 'rgba(239,68,68,0.08)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = L.border;
                      e.currentTarget.style.background  = 'transparent';
                    }}
                  >
                    <Trash2 size={12} color={L.red} />
                  </button>
                </div>
              </div>

              {/* Edit row */}
              {editing === t.id && (
                <div style={{
                  padding:      '12px 20px',
                  background:   L.accentSoft,
                  borderBottom: `1px solid ${L.accentBorder}`,
                  display:      'flex', gap:10, alignItems:'center', flexWrap:'wrap',
                }}>
                  <span style={{
                    fontSize:12, color:L.textMuted,
                    display:'flex', alignItems:'center', gap:5,
                  }}>
                    <Tag size={12} />
                    Set category:
                  </span>
                  {[
                    'Caregiver Wages', 'Software & SaaS', 'Transportation',
                    'Office Supplies', 'Rent & Facilities', 'Insurance',
                    'Utilities', 'Food & Meals', 'Marketing',
                    'Professional Services', 'Payroll', 'Income',
                  ].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setEditCat(cat)}
                      style={{
                        padding:'4px 10px', borderRadius:20,
                        background: editCat === cat ? L.accent : L.pageBg,
                        color:      editCat === cat ? '#fff'   : L.textMuted,
                        border:`1px solid ${editCat === cat ? L.accent : L.border}`,
                        cursor:'pointer', fontSize:11, fontFamily:L.font,
                        whiteSpace:'nowrap',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                  <input
                    value={editCat}
                    onChange={e => setEditCat(e.target.value)}
                    placeholder="Or type custom..."
                    style={{
                      flex:1, padding:'6px 10px', background:'#FFFFFF',
                      border:`1px solid ${L.border}`, borderRadius:L.radiusSm,
                      color:L.text, fontSize:12, fontFamily:L.font, outline:'none',
                    }}
                  />
                  <button
                    onClick={() => handleSave(t.id)}
                    style={{
                      padding:'7px 16px', background:L.accent, color:'#fff',
                      border:'none', borderRadius:L.radiusSm, cursor:'pointer',
                      fontSize:12, fontWeight:600, fontFamily:L.font,
                      display:'flex', alignItems:'center', gap:5,
                    }}
                  >
                    <CheckCircle size={12} />
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    style={{
                      padding:'7px 14px', background:'transparent', color:L.textMuted,
                      border:`1px solid ${L.border}`, borderRadius:L.radiusSm,
                      cursor:'pointer', fontSize:12, fontFamily:L.font,
                      display:'flex', alignItems:'center', gap:5,
                    }}
                  >
                    <X size={12} />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}