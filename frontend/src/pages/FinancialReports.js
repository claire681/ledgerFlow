import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, BarChart2,
  Download, RefreshCw, Calendar, ChevronDown,
  FileText, Sparkles, ArrowRight, CheckCircle,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';
import { useAI } from '../hooks/useAI';
import { getTransactions, getDashboardStats } from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  return isMobile;
}

const ACCENT = '#0AB98A';

const fmt = (n) => {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
};

const fmtShort = (n) => {
  const num = Math.abs(Number(n) || 0);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
};

const PERIODS = [
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'Last 6 Months', value: '6months' },
  { label: 'All Time', value: 'all' },
];

const TABS = [
  { id: 'pl', label: 'Profit & Loss', icon: TrendingUp },
  { id: 'balance', label: 'Balance Sheet', icon: BarChart2 },
  { id: 'cashflow', label: 'Cash Flow', icon: DollarSign },
];

function getDateRange(period) {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case 'month':
      start.setDate(1);
      break;
    case 'quarter':
      start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'year':
      start.setMonth(0, 1);
      break;
    case '3months':
      start.setMonth(now.getMonth() - 3);
      break;
    case '6months':
      start.setMonth(now.getMonth() - 6);
      break;
    case 'all':
      start.setFullYear(2000);
      break;
    default:
      start.setDate(1);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0],
  };
}

function filterTxns(txns, period) {
  const { start, end } = getDateRange(period);

  return txns.filter((t) => {
    const d = t.txn_date || '';
    return d >= start && d <= end;
  });
}

function buildPL(txns) {
  const income = txns.filter((t) => t.txn_type === 'income');
  const expenses = txns.filter((t) => t.txn_type === 'expense');

  const totalRevenue = income.reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const grossProfit = totalRevenue - totalExpenses;
  const netIncome = grossProfit;

  const expenseByCategory = expenses.reduce((acc, t) => {
    const cat = t.category || t.ml_category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + Math.abs(t.amount || 0);
    return acc;
  }, {});

  const incomeByCategory = income.reduce((acc, t) => {
    const cat = t.category || t.ml_category || 'Revenue';
    acc[cat] = (acc[cat] || 0) + Math.abs(t.amount || 0);
    return acc;
  }, {});

  return {
    totalRevenue,
    totalExpenses,
    grossProfit,
    netIncome,
    expenseByCategory,
    incomeByCategory,
  };
}

function buildBalanceSheet(txns) {
  const income = txns
    .filter((t) => t.txn_type === 'income')
    .reduce((s, t) => s + Math.abs(t.amount || 0), 0);

  const expenses = txns
    .filter((t) => t.txn_type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount || 0), 0);

  const cash = Math.max(income - expenses, 0);
  const accountsReceiv = income * 0.15;
  const totalAssets = cash + accountsReceiv;
  const accountsPayable = expenses * 0.1;
  const totalLiabilities = accountsPayable;
  const equity = totalAssets - totalLiabilities;

  return {
    assets: {
      cash,
      accountsReceivable: accountsReceiv,
      totalAssets,
    },
    liabilities: {
      accountsPayable,
      totalLiabilities,
    },
    equity: {
      retainedEarnings: equity,
      totalEquity: equity,
    },
  };
}

function buildCashFlow(txns) {
  const operating = txns.filter(
    (t) => !['Hardware & Equipment', 'Software & SaaS'].includes(t.category || '')
  );

  const investing = txns.filter(
    (t) => ['Hardware & Equipment'].includes(t.category || '')
  );

  const operatingIn = operating
    .filter((t) => t.txn_type === 'income')
    .reduce((s, t) => s + Math.abs(t.amount || 0), 0);

  const operatingOut = operating
    .filter((t) => t.txn_type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount || 0), 0);

  const netOperating = operatingIn - operatingOut;

  const investingOut = investing
    .filter((t) => t.txn_type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount || 0), 0);

  const netInvesting = -investingOut;
  const netCashFlow = netOperating + netInvesting;

  return {
    operating: {
      inflows: operatingIn,
      outflows: operatingOut,
      net: netOperating,
    },
    investing: {
      inflows: 0,
      outflows: investingOut,
      net: netInvesting,
    },
    financing: {
      inflows: 0,
      outflows: 0,
      net: 0,
    },
    netCashFlow,
  };
}

function ReportRow({ label, value, bold, indent, color, borderTop, sub }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: sub
          ? `5px 0 5px ${indent ? '24px' : '0'}`
          : `9px 0 9px ${indent ? '24px' : '0'}`,
        borderTop: borderTop ? `2px solid ${L.border}` : undefined,
        borderBottom: `1px solid ${sub ? 'transparent' : L.pageBg}`,
      }}
    >
      <span
        style={{
          fontSize: sub ? 11 : 13,
          fontWeight: bold ? 700 : 400,
          color: bold ? L.text : indent ? L.textSub : L.text,
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontSize: sub ? 11 : 13,
          fontWeight: bold ? 700 : 500,
          color: color || (bold ? L.text : L.textSub),
          fontFamily: L.fontMono,
        }}
      >
        {fmt(value)}
      </span>
    </div>
  );
}

function SectionHeader({ label }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: L.textMuted,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '16px 0 8px',
        borderBottom: `1px solid ${L.border}`,
        marginBottom: 4,
      }}
    >
      {label}
    </div>
  );
}

export default function FinancialReports() {
  const [tab, setTab] = useState('pl');
  const [period, setPeriod] = useState('year');
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState('');

  const { setPageContext, askAndOpen } = useAI();
  const isMobile = useIsMobile();

  useEffect(() => {
    setPageContext('reports', {
  page: 'reports',
  totalIncome: txns.filter(t=>t.txn_type==='income').reduce((s,t)=>s+Math.abs(t.amount||0),0),
  totalExpenses: txns.filter(t=>t.txn_type==='expense').reduce((s,t)=>s+Math.abs(t.amount||0),0),
  totalTransactions: txns.length,
});

    const load = async () => {
      try {
        const res = await getTransactions({});
        setTxns(Array.isArray(res.data) ? res.data : []);
        setCompany(localStorage.getItem('company_name') || '');
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = filterTxns(txns, period);
  const pl = buildPL(filtered);
  const balance = buildBalanceSheet(filtered);
  const cashflow = buildCashFlow(filtered);
  const { start, end } = getDateRange(period);
  const periodLabel = PERIODS.find((p) => p.value === period)?.label || 'This Year';

  const exportPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.setFontSize(20);
    doc.setTextColor(10, 185, 138);
    doc.text('Novala', 14, 18);

    doc.setFontSize(13);
    doc.setTextColor(100);
    doc.text(
      tab === 'pl'
        ? 'Profit & Loss Statement'
        : tab === 'balance'
          ? 'Balance Sheet'
          : 'Cash Flow Statement',
      14,
      26
    );

    doc.setFontSize(10);
    doc.text(`Period: ${periodLabel} (${start} to ${end})`, 14, 34);
    doc.text(`Generated: ${dateStr}`, 14, 40);

    if (tab === 'pl') {
      const rows = [
        ['REVENUE', ''],
        ...Object.entries(pl.incomeByCategory).map(([k, v]) => [k, fmt(v)]),
        ['Total Revenue', fmt(pl.totalRevenue)],
        ['', ''],
        ['EXPENSES', ''],
        ...Object.entries(pl.expenseByCategory).map(([k, v]) => [k, fmt(v)]),
        ['Total Expenses', fmt(pl.totalExpenses)],
        ['', ''],
        ['GROSS PROFIT', fmt(pl.grossProfit)],
        ['NET INCOME', fmt(pl.netIncome)],
      ];

      autoTable(doc, {
        startY: 48,
        head: [['Item', 'Amount']],
        body: rows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [10, 185, 138], textColor: 255 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      });
    } else if (tab === 'balance') {
      const rows = [
        ['ASSETS', ''],
        ['Cash & Equivalents', fmt(balance.assets.cash)],
        ['Accounts Receivable', fmt(balance.assets.accountsReceivable)],
        ['Total Assets', fmt(balance.assets.totalAssets)],
        ['', ''],
        ['LIABILITIES', ''],
        ['Accounts Payable', fmt(balance.liabilities.accountsPayable)],
        ['Total Liabilities', fmt(balance.liabilities.totalLiabilities)],
        ['', ''],
        ['EQUITY', ''],
        ['Retained Earnings', fmt(balance.equity.retainedEarnings)],
        ['Total Equity', fmt(balance.equity.totalEquity)],
      ];

      autoTable(doc, {
        startY: 48,
        head: [['Item', 'Amount']],
        body: rows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [10, 185, 138], textColor: 255 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      });
    } else {
      const rows = [
        ['OPERATING ACTIVITIES', ''],
        ['Cash Inflows', fmt(cashflow.operating.inflows)],
        ['Cash Outflows', fmt(-cashflow.operating.outflows)],
        ['Net Operating Cash Flow', fmt(cashflow.operating.net)],
        ['', ''],
        ['INVESTING ACTIVITIES', ''],
        ['Capital Expenditures', fmt(-cashflow.investing.outflows)],
        ['Net Investing Cash Flow', fmt(cashflow.investing.net)],
        ['', ''],
        ['NET CASH FLOW', fmt(cashflow.netCashFlow)],
      ];

      autoTable(doc, {
        startY: 48,
        head: [['Item', 'Amount']],
        body: rows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [10, 185, 138], textColor: 255 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      });
    }

    doc.save(
      `Novala_${tab === 'pl' ? 'PL' : tab === 'balance' ? 'BalanceSheet' : 'CashFlow'}_${period}.pdf`
    );
  };

  const exportExcel = () => {
    let data = [];

    if (tab === 'pl') {
      data = [
        ['Profit & Loss Statement'],
        [`Period: ${periodLabel}`],
        [],
        ['REVENUE'],
        ...Object.entries(pl.incomeByCategory).map(([k, v]) => [k, v]),
        ['Total Revenue', pl.totalRevenue],
        [],
        ['EXPENSES'],
        ...Object.entries(pl.expenseByCategory).map(([k, v]) => [k, v]),
        ['Total Expenses', pl.totalExpenses],
        [],
        ['GROSS PROFIT', pl.grossProfit],
        ['NET INCOME', pl.netIncome],
      ];
    } else if (tab === 'balance') {
      data = [
        ['Balance Sheet'],
        [`Period: ${periodLabel}`],
        [],
        ['ASSETS'],
        ['Cash & Equivalents', balance.assets.cash],
        ['Accounts Receivable', balance.assets.accountsReceivable],
        ['Total Assets', balance.assets.totalAssets],
        [],
        ['LIABILITIES'],
        ['Accounts Payable', balance.liabilities.accountsPayable],
        ['Total Liabilities', balance.liabilities.totalLiabilities],
        [],
        ['EQUITY'],
        ['Retained Earnings', balance.equity.retainedEarnings],
        ['Total Equity', balance.equity.totalEquity],
      ];
    } else {
      data = [
        ['Cash Flow Statement'],
        [`Period: ${periodLabel}`],
        [],
        ['OPERATING ACTIVITIES'],
        ['Cash Inflows', cashflow.operating.inflows],
        ['Cash Outflows', -cashflow.operating.outflows],
        ['Net Operating Cash Flow', cashflow.operating.net],
        [],
        ['INVESTING ACTIVITIES'],
        ['Capital Expenditures', -cashflow.investing.outflows],
        ['Net Investing Cash Flow', cashflow.investing.net],
        [],
        ['NET CASH FLOW', cashflow.netCashFlow],
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      tab === 'pl' ? 'P&L' : tab === 'balance' ? 'Balance Sheet' : 'Cash Flow'
    );

    XLSX.writeFile(wb, `Novala_${tab}_${period}.xlsx`);
  };

  const pad = isMobile ? '12px' : '24px 28px';

  return (
    <div style={page}>
      <div
        style={{
          ...topBar,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 10 : 0,
          padding: isMobile ? '16px' : undefined,
        }}
      >
        <div>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: L.text, letterSpacing: '-0.02em' }}>
            Financial Reports
          </div>
          <div style={{ fontSize: 12, color: L.textMuted, marginTop: 2 }}>
            P&L · Balance Sheet · Cash Flow · {periodLabel}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: L.radiusSm, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, color: L.accent, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: L.font }}>
            <Download size={13} /> PDF
          </button>

          <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: L.radiusSm, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: L.blue, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: L.font }}>
            <Download size={13} /> Excel
          </button>

          <button
            onClick={() => askAndOpen(`Analyze my ${tab === 'pl' ? 'profit and loss' : tab === 'balance' ? 'balance sheet' : 'cash flow'} for ${periodLabel}. What does it say about my business health?`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: L.radiusSm, background: 'linear-gradient(135deg,#0AB98A,#0EA5E9)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: L.font }}
          >
            <Sparkles size={13} /> Ask AI
          </button>
        </div>
      </div>

      <div style={{ padding: pad }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: L.font,
                transition: 'all 0.15s',
                borderColor: period === p.value ? L.accentBorder : L.border,
                background: period === p.value ? L.accentSoft : '#fff',
                color: period === p.value ? L.accent : L.textMuted,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14, marginBottom: 20 }}>
          {[
            { label: 'Total Revenue', value: fmtShort(pl.totalRevenue), color: ACCENT, icon: <TrendingUp size={16} /> },
            { label: 'Total Expenses', value: fmtShort(pl.totalExpenses), color: L.red, icon: <TrendingDown size={16} /> },
            { label: 'Net Income', value: fmtShort(pl.netIncome), color: pl.netIncome >= 0 ? ACCENT : L.red, icon: <DollarSign size={16} /> },
            { label: 'Net Cash Flow', value: fmtShort(cashflow.netCashFlow), color: cashflow.netCashFlow >= 0 ? ACCENT : L.red, icon: <BarChart2 size={16} /> },
          ].map((c) => (
            <div key={c.label} style={{ ...card, padding: isMobile ? '12px 14px' : '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: L.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {c.label}
                </div>
                <span style={{ color: c.color, opacity: 0.6 }}>{c.icon}</span>
              </div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: c.color, fontFamily: L.fontMono }}>
                {c.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: L.pageBg, borderRadius: L.radius, padding: 4, border: `1px solid ${L.border}`, width: 'fit-content' }}>
          {TABS.map((t) => {
            const Icon = t.icon;

            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: isMobile ? '8px 12px' : '9px 20px',
                  borderRadius: L.radiusSm,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: L.font,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.15s',
                  background: tab === t.id ? '#fff' : 'transparent',
                  color: tab === t.id ? L.text : L.textMuted,
                  boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={14} color={tab === t.id ? ACCENT : L.textMuted} />
                {isMobile ? t.label.split(' ')[0] : t.label}
              </button>
            );
          })}
        </div>

        {loading && (
          <div style={{ padding: 60, textAlign: 'center', color: L.textMuted }}>
            Loading...
          </div>
        )}

        {!loading && txns.length === 0 && (
          <div style={{ ...card, padding: 60, textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: L.accentSoft, border: `1px solid ${L.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FileText size={26} color={L.accent} />
            </div>

            <div style={{ fontSize: 15, fontWeight: 600, color: L.text, marginBottom: 6 }}>
              No transaction data yet
            </div>

            <div style={{ fontSize: 13, color: L.textMuted, marginBottom: 20 }}>
              Upload documents to generate your financial reports
            </div>

            <button
              onClick={() => {
                window.location.href = '/documents';
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: L.radiusSm, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font }}
            >
              <ArrowRight size={13} /> Upload Documents
            </button>
          </div>
        )}

        {!loading && txns.length > 0 && (
          <div style={{ ...card, padding: isMobile ? '16px' : '28px', maxWidth: 800 }}>
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `2px solid ${L.border}` }}>
              <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: L.text, marginBottom: 4 }}>
                {tab === 'pl' ? 'Profit & Loss Statement' : tab === 'balance' ? 'Balance Sheet' : 'Cash Flow Statement'}
              </div>
              <div style={{ fontSize: 12, color: L.textMuted }}>
                {company && `${company} · `}
                {periodLabel} · {start} to {end}
              </div>
            </div>

            {tab === 'pl' && (
              <div>
                <SectionHeader label="Revenue" />
                {Object.entries(pl.incomeByCategory).map(([k, v]) => (
                  <ReportRow key={k} label={k} value={v} indent sub />
                ))}
                <ReportRow label="Total Revenue" value={pl.totalRevenue} bold color={ACCENT} />

                <SectionHeader label="Operating Expenses" />
                {Object.entries(pl.expenseByCategory).map(([k, v]) => (
                  <ReportRow key={k} label={k} value={v} indent sub />
                ))}
                <ReportRow label="Total Operating Expenses" value={pl.totalExpenses} bold color={L.red} />

                <div style={{ height: 1, background: L.border, margin: '16px 0' }} />
                <ReportRow label="Gross Profit" value={pl.grossProfit} bold color={pl.grossProfit >= 0 ? ACCENT : L.red} borderTop />
                <ReportRow label="Net Income" value={pl.netIncome} bold color={pl.netIncome >= 0 ? ACCENT : L.red} />

                {pl.totalRevenue > 0 && (
                  <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: L.radiusSm, background: L.pageBg, border: `1px solid ${L.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: L.textMuted }}>Net Profit Margin</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: pl.netIncome >= 0 ? ACCENT : L.red }}>
                      {((pl.netIncome / pl.totalRevenue) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {tab === 'balance' && (
              <div>
                <SectionHeader label="Assets" />
                <ReportRow label="Cash & Cash Equivalents" value={balance.assets.cash} indent sub />
                <ReportRow label="Accounts Receivable" value={balance.assets.accountsReceivable} indent sub />
                <ReportRow label="Total Assets" value={balance.assets.totalAssets} bold color={ACCENT} />

                <SectionHeader label="Liabilities" />
                <ReportRow label="Accounts Payable" value={balance.liabilities.accountsPayable} indent sub />
                <ReportRow label="Total Liabilities" value={balance.liabilities.totalLiabilities} bold color={L.red} />

                <SectionHeader label="Equity" />
                <ReportRow label="Retained Earnings" value={balance.equity.retainedEarnings} indent sub />
                <ReportRow label="Total Equity" value={balance.equity.totalEquity} bold color={ACCENT} />

                <div style={{ height: 1, background: L.border, margin: '16px 0' }} />
                <ReportRow label="Total Liabilities + Equity" value={balance.liabilities.totalLiabilities + balance.equity.totalEquity} bold borderTop />

                <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: L.radiusSm, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', fontSize: 12, color: L.textMuted, lineHeight: 1.6 }}>
                  ℹ️ Balance sheet figures are estimated from your transaction data. Connect your bank account for precise figures.
                </div>
              </div>
            )}

            {tab === 'cashflow' && (
              <div>
                <SectionHeader label="Operating Activities" />
                <ReportRow label="Cash Received from Customers" value={cashflow.operating.inflows} indent sub />
                <ReportRow label="Cash Paid for Operations" value={-cashflow.operating.outflows} indent sub />
                <ReportRow label="Net Cash from Operations" value={cashflow.operating.net} bold color={cashflow.operating.net >= 0 ? ACCENT : L.red} />

                <SectionHeader label="Investing Activities" />
                <ReportRow label="Capital Expenditures" value={-cashflow.investing.outflows} indent sub />
                <ReportRow label="Net Cash from Investing" value={cashflow.investing.net} bold color={cashflow.investing.net >= 0 ? ACCENT : L.red} />

                <SectionHeader label="Financing Activities" />
                <ReportRow label="Net Cash from Financing" value={cashflow.financing.net} bold color={L.textMuted} />

                <div style={{ height: 1, background: L.border, margin: '16px 0' }} />
                <ReportRow label="Net Change in Cash" value={cashflow.netCashFlow} bold color={cashflow.netCashFlow >= 0 ? ACCENT : L.red} borderTop />

                <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: L.radiusSm, background: cashflow.netCashFlow >= 0 ? L.accentSoft : 'rgba(239,68,68,0.06)', border: `1px solid ${cashflow.netCashFlow >= 0 ? L.accentBorder : 'rgba(239,68,68,0.2)'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle size={16} color={cashflow.netCashFlow >= 0 ? ACCENT : L.red} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: cashflow.netCashFlow >= 0 ? ACCENT : L.red }}>
                      {cashflow.netCashFlow >= 0 ? 'Positive Cash Flow' : 'Negative Cash Flow'}
                    </div>
                    <div style={{ fontSize: 11, color: L.textMuted, marginTop: 2 }}>
                      {cashflow.netCashFlow >= 0
                        ? 'Your business is generating more cash than it spends.'
                        : 'Your business is spending more cash than it generates. Review expenses.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${L.border}` }}>
              <button
                onClick={() =>
                  askAndOpen(
                    `Analyze this ${tab === 'pl' ? 'Profit & Loss' : tab === 'balance' ? 'Balance Sheet' : 'Cash Flow'} report for ${periodLabel}: Revenue ${fmt(pl.totalRevenue)}, Expenses ${fmt(pl.totalExpenses)}, Net Income ${fmt(pl.netIncome)}, Cash Flow ${fmt(cashflow.netCashFlow)}. What does this say about the business? What should I focus on?`
                  )
                }
                style={{ width: '100%', padding: '12px', borderRadius: L.radiusSm, background: 'linear-gradient(135deg,#0AB98A,#0EA5E9)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: L.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(10,185,138,0.3)' }}
              >
                <Sparkles size={14} /> Get AI Analysis of This Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
