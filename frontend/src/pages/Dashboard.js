import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, RefreshCw, DollarSign,
  FileText, ArrowLeftRight, Receipt, PieChart,
  Users, BarChart2, Sliders, Eye, ChevronRight, ChevronLeft,
  Plus, MoreHorizontal, Info, X,
  ShoppingCart, UserCheck, Briefcase, ClipboardList,
} from 'lucide-react';

const ACCENT = '#0AB98A';
const FONT   = "'Inter', -apple-system, sans-serif";
const API    = 'https://api.getnovala.com/api/v1';

const fmt = (n) => {
  const num = parseFloat(n) || 0;
  return (num < 0 ? '-$' : '$') + Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const APP_SHORTCUTS = [
  { label: 'Transactions',  icon: ArrowLeftRight, color: '#0AB98A', path: '/transactions' },
  { label: 'Invoices',      icon: FileText,       color: '#3B82F6', path: '/invoices'     },
  { label: 'Bill Pay',      icon: DollarSign,     color: '#8B5CF6', path: '/billpay'      },
  { label: 'Reports',       icon: BarChart2,      color: '#F59E0B', path: '/reports'      },
  { label: 'Customers',     icon: UserCheck,      color: '#06B6D4', path: '/customers'    },
  { label: 'Vendors',       icon: Briefcase,      color: '#EF4444', path: '/vendors'      },
  { label: 'Inventory',     icon: ShoppingCart,   color: '#10B981', path: '/inventory'    },
  { label: 'Team',          icon: Users,          color: '#6366F1', path: '/team'         },
  { label: 'Documents',     icon: FileText,       color: '#F59E0B', path: '/documents'    },
  { label: 'Budgets',       icon: PieChart,       color: '#EC4899', path: '/budgets'      },
  { label: 'Reconciliation',icon: ClipboardList,  color: '#14B8A6', path: '/reconciliation'},
];

const CREATE_ACTIONS = [
  { label: 'Create invoice',  path: '/invoices'     },
  { label: 'Add transaction', path: '/transactions' },
  { label: 'Upload document', path: '/documents'    },
  { label: 'Scan receipt',    path: '/receipts'     },
  { label: 'Record expense',  path: '/transactions' },
];

const ALL_CREATE = [
  {
    header: 'Customers',
    items: [
      { label: 'Invoice',         path: '/invoices'     },
      { label: 'Receive payment', path: '/transactions' },
      { label: 'Estimate',        path: '/invoices'     },
      { label: 'Sales receipt',   path: '/invoices'     },
      { label: 'Add customer',    path: '/customers'    },
    ],
  },
  {
    header: 'Suppliers',
    items: [
      { label: 'Expense',      path: '/transactions' },
      { label: 'Bill',         path: '/billpay'      },
      { label: 'Pay bills',    path: '/billpay'      },
      { label: 'Add supplier', path: '/vendors'      },
    ],
  },
  {
    header: 'Business',
    items: [
      { label: 'Upload Document', path: '/documents' },
      { label: 'Scan Receipt',    path: '/receipts'  },
      { label: 'New Budget',      path: '/budgets'   },
    ],
  },
  {
    header: 'Other',
    items: [
      { label: 'Bank deposit',  path: '/transactions' },
      { label: 'Journal entry', path: '/ledger'       },
      { label: 'Smart Search',  path: '/search'       },
      { label: 'API Access',    path: '/api-access'   },
    ],
  },
];

function StatCard({ label, subtitle, value, trend, trendUp, badge, footer, onFooter, loading }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</div>
        <MoreHorizontal size={16} color="#CBD5E1" style={{ cursor: 'pointer', flexShrink: 0 }} />
      </div>
      {subtitle && <div style={{ fontSize: 12, color: '#64748B' }}>{subtitle}</div>}
      {loading ? (
        <div style={{ height: 36, background: '#F1F5F9', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>{value}</div>
          <Info size={14} color="#CBD5E1" />
          {badge && (
            <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(10,185,138,0.1)', color: ACCENT }}>{badge}</div>
          )}
        </div>
      )}
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {trendUp ? <TrendingUp size={14} color={ACCENT} /> : <TrendingDown size={14} color="#EF4444" />}
          <span style={{ fontSize: 12, color: trendUp ? ACCENT : '#EF4444' }}>{trend}</span>
        </div>
      )}
      {footer && (
        <div
          onClick={onFooter}
          style={{ fontSize: 12, color: ACCENT, fontWeight: 500, cursor: 'pointer', marginTop: 4, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

function MiniBar({ income, expenses }) {
  const total  = income + expenses || 1;
  const incPct = (income   / total) * 100;
  const expPct = (expenses / total) * 100;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <div style={{ height: 8, borderRadius: 4, background: ACCENT,    width: incPct + '%', minWidth: 4 }} />
        <div style={{ height: 8, borderRadius: 4, background: '#EF4444', width: expPct + '%', minWidth: 4 }} />
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: ACCENT }} />
          <span style={{ fontSize: 11, color: '#64748B' }}>Income {fmt(income)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#EF4444' }} />
          <span style={{ fontSize: 11, color: '#64748B' }}>Expenses {fmt(expenses)}</span>
        </div>
      </div>
    </div>
  );
}

function CashFlowChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
        No cash flow data available
      </div>
    );
  }
  const max = Math.max(...data.map(d => Math.abs(d.amount)), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, padding: '0 4px' }}>
      {data.map((d, i) => {
        const h   = Math.max((Math.abs(d.amount) / max) * 100, 4);
        const pos = d.amount >= 0;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: '100%', height: h + '%', background: pos ? 'rgba(10,185,138,0.7)' : 'rgba(239,68,68,0.7)', borderRadius: '3px 3px 0 0', minHeight: 3 }} />
            <div style={{ fontSize: 8, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>{d.month}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const navigate  = useNavigate();
  const token     = localStorage.getItem('token');
  const rawName   = localStorage.getItem('user_name') || localStorage.getItem('full_name') || localStorage.getItem('user_email') || 'there';
  const name      = rawName.includes('@') ? rawName.split('@')[0] : rawName;
  const company   = localStorage.getItem('company_name') || 'My Business';

  const [stats,           setStats]           = useState(null);
  const [txns,            setTxns]            = useState([]);
  const [invoices,        setInvoices]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [refresh,         setRefresh]         = useState(0);
  const [briefingOn,      setBriefingOn]      = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [canScrollLeft,   setCanScrollLeft]   = useState(false);
  const [canScrollRight,  setCanScrollRight]  = useState(false);
  const [isMobile,        setIsMobile]        = useState(window.innerWidth < 768);

  const scrollRef = useRef(null);
  const headers   = { Authorization: 'Bearer ' + token };

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetch(API + '/dashboard/stats', { headers }).then(r => r.json()),
      fetch(API + '/transactions/',   { headers }).then(r => r.json()),
      fetch(API + '/invoices/',       { headers }).then(r => r.json()),
    ]).then(([statsRes, txnsRes, invRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (txnsRes.status  === 'fulfilled') {
        const t = txnsRes.value;
        setTxns(Array.isArray(t) ? t : (t.transactions || t.items || t.data || []));
      }
      if (invRes.status === 'fulfilled') {
        const v = invRes.value;
        setInvoices(Array.isArray(v) ? v : (v.invoices || v.items || v.data || []));
      }
    }).finally(() => setLoading(false));
  }, [refresh]);

  // Check scroll arrows
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scrollLeft  = () => { scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' }); };
  const scrollRight = () => { scrollRef.current?.scrollBy({ left:  200, behavior: 'smooth' }); };

  const revenue  = stats?.total_revenue || stats?.revenue || stats?.income ||
    txns.filter(t => (t.type || t.transaction_type || '').toLowerCase().includes('income') || parseFloat(t.amount || 0) > 0)
        .reduce((s, t) => s + Math.abs(parseFloat(t.amount || 0)), 0);

  const expenses = stats?.total_expenses || stats?.expenses ||
    txns.filter(t => (t.type || t.transaction_type || '').toLowerCase().includes('expense') || parseFloat(t.amount || 0) < 0)
        .reduce((s, t) => s + Math.abs(parseFloat(t.amount || 0)), 0);

  const netProfit = stats?.net_profit || stats?.profit || (revenue - expenses);

  const unpaidInvoices = invoices.filter(inv => {
    const status = (inv.status || '').toLowerCase();
    return status === 'unpaid' || status === 'pending' || status === 'sent';
  });

  const totalUnpaid = unpaidInvoices.reduce((s, inv) => s + parseFloat(inv.amount || inv.total || 0), 0);

  const cashFlowMap = {};
  txns.forEach(t => {
    const date = new Date(t.date || t.created_at || t.transaction_date || Date.now());
    const key  = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    cashFlowMap[key] = (cashFlowMap[key] || 0) + parseFloat(t.amount || 0);
  });
  const cashFlowData = Object.entries(cashFlowMap).slice(-8).map(([month, amount]) => ({ month, amount }));

  const profitUp = netProfit >= 0;

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: FONT }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        .shortcut-pill:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-1px); }
        .action-chip:hover { background: #F1F5F9 !important; }
        .create-item:hover { background: #F8FAFC; color: #0AB98A; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: isMobile ? '12px 16px' : '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{company}</div>
        <div style={{ display: 'flex', gap: isMobile ? 8 : 14, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Morning Briefing toggle */}
          <div
            title="Get a daily summary of your business each morning."
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#334155' }}
            onClick={() => setBriefingOn(p => !p)}
          >
            <ClipboardList size={13} color={briefingOn ? ACCENT : '#64748B'} />
            <span style={{ display: isMobile ? 'none' : 'inline' }}>Morning Briefing</span>
            <div style={{ padding: '2px 7px', borderRadius: 20, background: briefingOn ? 'rgba(10,185,138,0.12)' : '#F1F5F9', color: briefingOn ? ACCENT : '#94A3B8', fontSize: 10, fontWeight: 700 }}>
              {briefingOn ? 'ON' : 'OFF'}
            </div>
          </div>

          <button
            onClick={() => setRefresh(r => r + 1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12, fontFamily: FONT }}
          >
            <RefreshCw size={14} /> {!isMobile && 'Refresh'}
          </button>
          <button
            onClick={() => navigate('/settings')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12, fontFamily: FONT }}
          >
            <Sliders size={14} /> {!isMobile && 'Customize'}
          </button>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12, fontFamily: FONT }}
          >
            <Eye size={14} /> {!isMobile && 'Privacy'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 32px' }}>

        {/* Mobile back arrow — hidden on desktop */}
        {isMobile && (
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13, fontWeight: 600, marginBottom: 16, padding: 0, fontFamily: FONT }}
          >
            <ChevronLeft size={18} /> Dashboard
          </button>
        )}

        {/* Greeting */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            {greeting}, {name.charAt(0).toUpperCase() + name.slice(1)}!
          </h1>
          <div style={{ fontSize: 14, color: '#64748B' }}>
            Here is what is happening with your business today.
          </div>
        </div>

        {/* App shortcuts with scroll arrows */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              style={{ position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 32, height: 32, borderRadius: '50%', background: '#fff', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <ChevronLeft size={16} color="#334155" />
            </button>
          )}

          <div
            ref={scrollRef}
            style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}
          >
            {APP_SHORTCUTS.map(app => {
              const Icon = app.icon;
              return (
                <div
                  key={app.label}
                  className="shortcut-pill"
                  onClick={() => navigate(app.path)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 999, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: app.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color={app.color} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#334155', whiteSpace: 'nowrap' }}>{app.label}</span>
                </div>
              );
            })}
          </div>

          {canScrollRight && (
            <button
              onClick={scrollRight}
              style={{ position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 32, height: 32, borderRadius: '50%', background: '#fff', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <ChevronRight size={16} color="#334155" />
            </button>
          )}
        </div>

        {/* Create actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginRight: 4 }}>Create actions</span>
          {CREATE_ACTIONS.map(action => (
            <div
              key={action.label}
              className="action-chip"
              onClick={() => navigate(action.path)}
              style={{ padding: '7px 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#334155', transition: 'all 0.15s' }}
            >
              {action.label}
            </div>
          ))}
          <span
            onClick={() => setShowCreateModal(true)}
            style={{ fontSize: 12, color: ACCENT, fontWeight: 600, cursor: 'pointer', marginLeft: 4 }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            Show all
          </span>
        </div>

        {/* Business at a glance */}
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 16, letterSpacing: '-0.01em' }}>
          Business at a glance
        </div>

        {/* Widget grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>

          {/* Profit & Loss */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Profit & Loss</div>
              <MoreHorizontal size={16} color="#CBD5E1" style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>Net profit this month</div>
            {loading ? (
              <div style={{ height: 36, background: '#F1F5F9', borderRadius: 8 }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: profitUp ? '#0F172A' : '#EF4444', letterSpacing: '-0.02em' }}>
                  {fmt(netProfit)}
                </div>
                <Info size={14} color="#CBD5E1" />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              {profitUp ? <TrendingUp size={14} color={ACCENT} /> : <TrendingDown size={14} color="#EF4444" />}
              <span style={{ fontSize: 12, color: profitUp ? ACCENT : '#EF4444' }}>
                {profitUp ? 'Profitable this period' : 'Loss this period'}
              </span>
            </div>
            <MiniBar income={revenue} expenses={expenses} />
            <div
              onClick={() => navigate('/reports')}
              style={{ fontSize: 12, color: ACCENT, fontWeight: 500, cursor: 'pointer', marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              View full report
            </div>
          </div>

          <StatCard
            label="Expenses"
            subtitle="Total spending recorded"
            value={loading ? '—' : fmt(expenses)}
            trend={expenses > 0 ? 'Recorded this period' : 'No expenses yet'}
            trendUp={false}
            footer="View all expenses"
            onFooter={() => navigate('/transactions')}
            loading={loading}
          />

          <StatCard
            label="Outstanding Invoices"
            subtitle="Unpaid invoices"
            value={loading ? '—' : fmt(totalUnpaid)}
            badge={unpaidInvoices.length > 0 ? unpaidInvoices.length + ' unpaid' : null}
            trend={unpaidInvoices.length > 0 ? unpaidInvoices.length + ' invoices awaiting payment' : 'All invoices paid'}
            trendUp={unpaidInvoices.length === 0}
            footer="View all invoices"
            onFooter={() => navigate('/invoices')}
            loading={loading}
          />

          <StatCard
            label="Revenue"
            subtitle="Total income recorded"
            value={loading ? '—' : fmt(revenue)}
            trend={revenue > 0 ? 'Income this period' : 'No income recorded yet'}
            trendUp={revenue > 0}
            footer="View transactions"
            onFooter={() => navigate('/transactions')}
            loading={loading}
          />
        </div>

        {/* Cash Flow */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 22px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Cash Flow</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>Based on recorded transactions</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setRefresh(r => r + 1)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 11, fontFamily: FONT }}>
                <RefreshCw size={12} /> Refresh
              </button>
              <MoreHorizontal size={16} color="#CBD5E1" style={{ cursor: 'pointer' }} />
            </div>
          </div>
          {loading ? (
            <div style={{ height: 80, background: '#F1F5F9', borderRadius: 8 }} />
          ) : (
            <CashFlowChart data={cashFlowData} />
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(10,185,138,0.7)' }} />
              <span style={{ fontSize: 11, color: '#64748B' }}>Income</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(239,68,68,0.7)' }} />
              <span style={{ fontSize: 11, color: '#64748B' }}>Expenses</span>
            </div>
          </div>
          <div onClick={() => navigate('/transactions')} style={{ fontSize: 12, color: ACCENT, fontWeight: 500, cursor: 'pointer', marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            View all transactions
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 22px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Recent Transactions</div>
            <button onClick={() => navigate('/transactions')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: ACCENT, fontSize: 12, fontWeight: 600, fontFamily: FONT }}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: 40, background: '#F1F5F9', borderRadius: 8 }} />)}
            </div>
          ) : txns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: 13 }}>
              No transactions yet.
              <span onClick={() => navigate('/transactions')} style={{ color: ACCENT, cursor: 'pointer', marginLeft: 4 }}>Add one</span>
            </div>
          ) : (
            <div>
              {txns.slice(0, 6).map((t, i) => {
                const amt     = parseFloat(t.amount || 0);
                const isPos   = amt >= 0;
                const date    = new Date(t.date || t.created_at || t.transaction_date || Date.now());
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div key={t.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 5 ? '1px solid #F8FAFC' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: isPos ? 'rgba(10,185,138,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isPos ? <TrendingUp size={16} color={ACCENT} /> : <TrendingDown size={16} color="#EF4444" />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{t.description || t.name || t.memo || 'Transaction'}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{dateStr}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isPos ? ACCENT : '#EF4444' }}>
                      {isPos ? '+' : ''}{fmt(amt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'New Invoice',  icon: FileText,  path: '/invoices',     color: '#3B82F6' },
            { label: 'Add Expense',  icon: Receipt,   path: '/transactions', color: '#EF4444' },
            { label: 'View Reports', icon: BarChart2, path: '/reports',      color: '#F59E0B' },
            { label: 'Scan Receipt', icon: Receipt,   path: '/receipts',     color: '#8B5CF6' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, background: item.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} color={item.color} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{item.label}</span>
                <ChevronRight size={14} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '24px 0 8px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>
            2026 Novala. All rights reserved.
            <span style={{ margin: '0 8px', color: '#E5E7EB' }}>|</span>
            <span style={{ cursor: 'pointer', color: ACCENT }} onClick={() => navigate('/settings')}>Privacy</span>
            <span style={{ margin: '0 8px', color: '#E5E7EB' }}>|</span>
            <span style={{ cursor: 'pointer', color: ACCENT }}>Security</span>
            <span style={{ margin: '0 8px', color: '#E5E7EB' }}>|</span>
            <span style={{ cursor: 'pointer', color: ACCENT }}>Terms of Service</span>
          </div>
        </div>
      </div>

      {/* Show All Create Modal */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Create</div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 24 }}>
              {ALL_CREATE.map(col => (
                <div key={col.header}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #F1F5F9' }}>
                    {col.header}
                  </div>
                  {col.items.map(item => (
                    <div
                      key={item.label}
                      className="create-item"
                      onClick={() => { navigate(item.path); setShowCreateModal(false); }}
                      style={{ padding: '9px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#334155', lineHeight: 1.4, transition: 'all 0.12s' }}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}