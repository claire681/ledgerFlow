import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, BarChart2, Grid, Plus,
  LayoutDashboard, FileText, ArrowLeftRight,
  PieChart, Receipt, Percent, RefreshCw,
  BarChart3, ScanLine, Link2, Users,
  TrendingUp, CreditCard, BookOpen,
  GitCompare, Search, Users2, Package,
  Building2, Key, Wallet, GitMerge,
  Settings as SettingsIcon, HelpCircle,
  ChevronRight, ChevronDown, X, LogOut,
  Sliders, MoreHorizontal, Bookmark,
  Keyboard, ClipboardList, MessageSquare, Zap,
  Gem, Pin, PinOff, GripVertical,
} from 'lucide-react';

const ACCENT  = '#0AB98A';
const FONT    = "'Inter', -apple-system, sans-serif";
const DEFAULT = '#0F172A';
const MUTED   = '#334155';

const SLIDE_IN = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-12px) }
    to   { opacity: 1; transform: translateX(0) }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.97) }
    to   { opacity: 1; transform: scale(1) }
  }
`;

function AsteriskIcon({ size, color }) {
  const s  = size || 22;
  const cx = s / 2;
  const r  = s / 2 - 2;
  const lines = Array.from({ length: 8 }, function(_, i) {
    const angle = (i * 45 * Math.PI) / 180;
    return { x1: cx, y1: cx, x2: cx + r * Math.cos(angle), y2: cx + r * Math.sin(angle) };
  });
  return (
    <svg width={s} height={s} viewBox={'0 0 ' + s + ' ' + s} fill="none">
      {lines.map(function(l, i) {
        return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={color || DEFAULT} strokeWidth="2.5" strokeLinecap="round"/>;
      })}
    </svg>
  );
}

const ALL_APPS = [
  {
    id: 'accounting', label: 'Accounting', color: '#0AB98A', icon: LayoutDashboard,
    items: [
      { label: 'Bank transactions',        path: '/accounting/bank-transactions'  },
      { label: 'Integration transactions', path: '/integrations'                  },
      { label: 'Receipts',                 path: '/receipts'                      },
      { label: 'Reconcile',                path: '/reconciliation'                },
      { label: 'Rules',                    path: '/accounting/rules'              },
      { label: 'Chart of accounts',        path: '/accounting/chart-of-accounts' },
      { label: 'Recurring transactions',   path: '/accounting/recurring'         },
      { label: 'My accountant',            path: '/accounting/my-accountant'     },
    ],
  },
  {
    id: 'expenses', label: 'Expenses & Bills', color: '#EF4444', icon: Receipt,
    items: [
      { label: 'Expenses',        path: '/transactions'             },
      { label: 'Bills',           path: '/billpay'                  },
      { label: 'Vendors',         path: '/vendors'                  },
      { label: 'Purchase orders', path: '/expenses/purchase-orders' },
    ],
  },
  {
    id: 'sales', label: 'Sales & Get Paid', color: '#F59E0B', icon: TrendingUp,
    items: [
      { label: 'Invoices',          path: '/invoices'        },
      { label: 'New invoice',        path: '/invoices/new' },
      { label: 'Estimates',         path: '/sales/estimates' },
      { label: 'Payments received', path: '/transactions'    },
      { label: 'Sales receipts',    path: '/receipts'        },
    ],
  },
  {
    id: 'customers', label: 'Customer Hub', color: '#06B6D4', icon: Users2,
    items: [
      { label: 'Customers',           path: '/customers'            },
      { label: 'Products & services', path: '/inventory'            },
      { label: 'Statements',          path: '/customers/statements' },
    ],
  },
  {
    id: 'payroll', label: 'Payroll', color: '#3B82F6', icon: Users,
    items: [
      { label: 'Overview',      path: '/payroll/overview'   },
      { label: 'Employees',     path: '/payroll/employees'  },
      { label: 'Payroll taxes', path: '/payroll/taxes'      },
      { label: 'Compliance',    path: '/payroll/compliance' },
    ],
  },
  {
    id: 'team', label: 'Team', color: '#6366F1', icon: Users,
    items: [
      { label: 'Team members',        path: '/team'            },
      { label: 'Timesheets',          path: '/team/timesheets' },
      { label: 'Roles & permissions', path: '/team/roles'      },
    ],
  },
  {
    id: 'salestax', label: 'Sales Tax', color: '#F59E0B', icon: Percent,
    items: [
      { label: 'Sales tax overview', path: '/tax'         },
      { label: 'Tax rates',          path: '/tax/rates'   },
      { label: 'Tax filings',        path: '/tax/filings' },
    ],
  },
  {
    id: 'marketing', label: 'Marketing', color: '#F97316', icon: Zap, premium: true,
    items: [
      { label: 'Campaigns',       path: '/marketing/campaigns' },
      { label: 'Email templates', path: '/marketing/templates' },
      { label: 'Audience',        path: '/marketing/audience'  },
    ],
  },
];

const APP_GROUPS = [
  {
    label: 'Core', color: '#0AB98A',
    items: [
      { label: 'Dashboard',    path: '/',             icon: LayoutDashboard },
      { label: 'Documents',    path: '/documents',    icon: FileText        },
      { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight  },
    ],
  },
  {
    label: 'Finance', color: '#3B82F6',
    items: [
      { label: 'Reports',        path: '/reports',        icon: BarChart2  },
      { label: 'Reconciliation', path: '/reconciliation', icon: GitMerge   },
      { label: 'Ledger View',    path: '/ledger',         icon: BookOpen   },
      { label: 'Variance',       path: '/variance',       icon: TrendingUp },
      { label: 'Bill Pay',       path: '/billpay',        icon: Wallet     },
      { label: 'Budgets',        path: '/budgets',        icon: PieChart   },
      { label: 'Invoices',       path: '/invoices',       icon: Receipt    },
      { label: 'Tax',            path: '/tax',            icon: Percent    },
      { label: 'Billing',        path: '/billing',        icon: CreditCard },
      { label: 'Currency',       path: '/currency',       icon: RefreshCw  },
    ],
  },
  {
    label: 'Business', color: '#8B5CF6',
    items: [
      { label: 'Customers',    path: '/customers',    icon: Users2    },
      { label: 'Inventory',    path: '/inventory',    icon: Package   },
      { label: 'Businesses',   path: '/businesses',   icon: Building2 },
      { label: 'Vendors',      path: '/vendors',      icon: BarChart3 },
      { label: 'Team',         path: '/team',         icon: Users     },
      { label: 'Integrations', path: '/integrations', icon: Link2     },
    ],
  },
  {
    label: 'Tools', color: '#F59E0B',
    items: [
      { label: 'Smart Search', path: '/search',     icon: Search     },
      { label: 'Scanner',      path: '/receipts',   icon: ScanLine   },
      { label: 'Doc Compare',  path: '/comparison', icon: GitCompare },
      { label: 'API Access',   path: '/api-access', icon: Key        },
    ],
  },
];

const CREATE_COLUMNS = [
  {
    header: 'Customers',
    items: [
      { label: 'Invoice',          path: '/invoices'              },
      { label: 'Payment links',    path: '/create/payment-links'  },
      { label: 'Receive payment',  path: '/transactions'          },
      { label: 'Statement',        path: '/create/statement'      },
      { label: 'Estimate',         path: '/invoices'              },
      { label: 'Credit memo',      path: '/create/credit-memo'    },
      { label: 'Sales receipt',    path: '/invoices'              },
      { label: 'Refund receipt',   path: '/create/refund-receipt' },
      { label: 'Add customer',     path: '/customers'             },
    ],
  },
  {
    header: 'Suppliers',
    items: [
      { label: 'Expense',            path: '/transactions'               },
      { label: 'Cheque',             path: '/create/cheque'              },
      { label: 'Bill',               path: '/billpay'                    },
      { label: 'Pay bills',          path: '/billpay'                    },
      { label: 'Purchase order',     path: '/create/purchase-order', premium: true },
      { label: 'Supplier credit',    path: '/create/supplier-credit'    },
      { label: 'Credit card credit', path: '/create/credit-card-credit' },
      { label: 'Print cheques',      path: '/create/print-cheques'      },
      { label: 'Add supplier',       path: '/vendors'                   },
    ],
  },
  {
    header: 'Team',
    items: [
      { label: 'Weekly timesheet', path: '/team/timesheets', premium: true },
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
      { label: 'Task',                  path: '/create/task'                },
      { label: 'Bank deposit',          path: '/transactions'               },
      { label: 'Transfer',              path: '/create/transfer'            },
      { label: 'Journal entry',         path: '/ledger'                     },
      { label: 'Pay down credit card',  path: '/create/pay-down-credit-card'},
      { label: 'Add product/service',   path: '/create/product-service'    },
      { label: 'Smart Search',          path: '/search'                     },
      { label: 'New chat', path: null, isChat: true                         },
    ],
  },
];

const REPORTS_ITEMS = [
  { label: 'Financial Reports',  path: '/reports',                  section: 'standard' },
  { label: 'Variance Reports',   path: '/variance',                 section: 'standard' },
  { label: 'Ledger View',        path: '/ledger',                   section: 'standard' },
  { label: 'Reconciliation',     path: '/reconciliation',           section: 'standard' },
  { label: 'Smart Search',       path: '/search',                   section: 'standard' },
  { label: 'Custom reports',     path: '/reports/custom',           section: 'advanced' },
  { label: 'Management reports', path: '/reports/management',       section: 'advanced' },
  { label: 'Cash flow overview', path: '/reports/cash-flow-overview', section: 'advanced' },
  { label: 'Cash flow planner',  path: '/reports/cash-flow-planner',  section: 'advanced' },
];

const SLIM_ITEMS = [
  { id: 'create',    icon: Plus,      label: 'Create',    flyout: 'create'    },
  { id: 'bookmarks', icon: Bookmark,  label: 'Bookmarks', flyout: 'bookmarks' },
  { id: 'home',      icon: Home,      label: 'Home',      path: '/'           },
  { id: 'feed',      icon: null,      label: 'Feed',      flyout: 'feed'      },
  { id: 'reports',   icon: BarChart2, label: 'Reports',   flyout: 'reports'   },
  { id: 'allapps',   icon: Grid,      label: 'All Apps',  flyout: 'apps'      },
];

const SLIM_BOTTOM = [
  { id: 'more',      icon: MoreHorizontal, label: 'More',      flyout: 'more'      },
  { id: 'customize', icon: Sliders,        label: 'Customize', action: 'customize' },
];

const MORE_ITEMS = [
  { label: 'Audit Log',          icon: ClipboardList, path: '/tools/audit-log'   },
  { label: 'Settings',           icon: SettingsIcon,  path: '/settings'          },
  { label: 'Help & Support',     icon: HelpCircle,    path: '/help'              },
  { label: 'Keyboard Shortcuts', icon: Keyboard,      path: null                 },
  { label: "What's New",         icon: Zap,           path: '/profile/whats-new' },
  { label: 'Send Feedback',      icon: MessageSquare, path: '/profile/feedback'  },
];

const DEFAULT_APP_ORDER = [
  'accounting', 'expenses', 'sales', 'customers', 'payroll', 'team', 'salestax', 'marketing',
];

// ── The key fix: flyout ID passed to handlers so panel keeps itself open ──
function useHoverFlyout() {
  const hoverTimers = useRef({});
  const closeTimers = useRef({});

  const startOpen = function(id, setter, delay) {
    clearTimeout(closeTimers.current[id]);
    hoverTimers.current[id] = setTimeout(function() {
      setter(id);
    }, delay !== undefined ? delay : 300);
  };

  const startClose = function(id, setter, currentFlyout) {
    clearTimeout(hoverTimers.current[id]);
    closeTimers.current[id] = setTimeout(function() {
      setter(function(prev) { return prev === id ? null : prev; });
    }, 200);
  };

  const cancelClose = function(id) {
    clearTimeout(closeTimers.current[id]);
  };

  const cancelOpen = function(id) {
    clearTimeout(hoverTimers.current[id]);
  };

  return { startOpen, startClose, cancelClose, cancelOpen };
}

function CreateFlyout({ onClose, onNavigate, flyoutId, onPanelEnter, onPanelLeave }) {
  return (
    <div
      onMouseEnter={function() { onPanelEnter(flyoutId); }}
      onMouseLeave={function() { onPanelLeave(flyoutId); }}
      style={{ position:'fixed', top:104, left:80, height:'calc(100vh - 104px)', width:780, background:'#fff', boxShadow:'4px 0 32px rgba(0,0,0,0.12)', zIndex:45, display:'flex', flexDirection:'column', animation:'slideIn 0.2s ease', borderRight:'1px solid #F1F5F9' }}
    >
      <style>{SLIDE_IN}</style>
      <div style={{ padding:'16px 24px 12px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:15, fontWeight:700, color:'#0F172A' }}>Create</div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:MUTED, display:'flex', alignItems:'center' }}><X size={18}/></button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:20 }}>
        {CREATE_COLUMNS.map(function(col) {
          return (
            <div key={col.header}>
              <div style={{ fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:14, paddingBottom:8, borderBottom:'1px solid #F1F5F9' }}>{col.header}</div>
              {col.items.map(function(item) {
                return (
                  <div
                    key={item.label}
                    onClick={function() {
                      if (item.isChat) { onClose(); return; }
                      onNavigate(item.path);
                      onClose();
                    }}
                    style={{ padding:'8px', borderRadius:6, cursor:'pointer', fontSize:13, color:'#0A2540', lineHeight:1.4, transition:'all 0.12s', display:'flex', alignItems:'center', gap:6, minHeight:36 }}
                    onMouseEnter={function(e) { e.currentTarget.style.background='#F1F5F9'; }}
                    onMouseLeave={function(e) { e.currentTarget.style.background='transparent'; }}
                  >
                    <span style={{ flex:1 }}>{item.label}</span>
                    {item.premium && <Gem size={12} color={ACCENT}/>}
                    {item.isChat && <div style={{ width:6, height:6, borderRadius:'50%', background:'#00D4A4', flexShrink:0 }}/>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FlyoutPanel({ title, onClose, children, width, flyoutId, onPanelEnter, onPanelLeave }) {
  const w = width || 280;
  return (
    <div
      onMouseEnter={function() { if (onPanelEnter) onPanelEnter(flyoutId); }}
      onMouseLeave={function() { if (onPanelLeave) onPanelLeave(flyoutId); }}
      style={{ position:'fixed', top:104, left:80, height:'calc(100vh - 104px)', width:w, background:'#fff', boxShadow:'4px 0 24px rgba(0,0,0,0.1)', zIndex:45, display:'flex', flexDirection:'column', animation:'slideIn 0.2s ease', borderRight:'1px solid #F1F5F9' }}
    >
      <style>{SLIDE_IN}</style>
      <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>{title}</div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:MUTED, display:'flex', alignItems:'center' }}><X size={16}/></button>
      </div>
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none' }}>{children}</div>
    </div>
  );
}

function AllAppsFlyout({ onClose, onNavigate, expandedId, location, flyoutId, onPanelEnter, onPanelLeave }) {
  const [expanded, setExpanded] = useState(expandedId || 'accounting');
  return (
    <FlyoutPanel title="All Apps" onClose={onClose} width={300} flyoutId={flyoutId} onPanelEnter={onPanelEnter} onPanelLeave={onPanelLeave}>
      <div style={{ padding:'8px 12px' }}>
        {ALL_APPS.map(function(app) {
          const isExpanded = expanded === app.id;
          const Icon = app.icon;
          return (
            <div key={app.id} style={{ marginBottom:2 }}>
              <div
                onClick={function() { setExpanded(isExpanded ? null : app.id); }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', borderRadius:8, cursor:'pointer', background:isExpanded?app.color+'10':'transparent', transition:'all 0.15s' }}
                onMouseEnter={function(e) { if (!isExpanded) e.currentTarget.style.background='#F1F5F9'; }}
                onMouseLeave={function(e) { if (!isExpanded) e.currentTarget.style.background='transparent'; }}
              >
                <div style={{ width:28, height:28, borderRadius:7, background:app.color+'15', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={14} color={app.color} strokeWidth={2}/>
                </div>
                <span style={{ fontSize:13, fontWeight:isExpanded?600:500, color:isExpanded?app.color:DEFAULT, flex:1 }}>{app.label}</span>
                {app.premium && <span style={{ fontSize:9, color:'#F97316', background:'rgba(249,115,22,0.1)', padding:'1px 5px', borderRadius:4, marginRight:4 }}>PRO</span>}
                {isExpanded ? <ChevronDown size={13} color={app.color}/> : <ChevronRight size={13} color="#CBD5E1"/>}
              </div>
              {isExpanded && (
                <div style={{ paddingLeft:12, marginBottom:4 }}>
                  {app.items.map(function(item, idx) {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                      <div
                        key={item.label}
                        onClick={function() { onNavigate(item.path); onClose(); }}
                        style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:isActive?600:400, color:isActive?ACCENT:idx===0?DEFAULT:MUTED, background:isActive?'rgba(10,185,138,0.06)':'transparent', transition:'all 0.12s', marginBottom:1 }}
                        onMouseEnter={function(e) { if (!isActive) { e.currentTarget.style.background='#F1F5F9'; e.currentTarget.style.color=ACCENT; } }}
                        onMouseLeave={function(e) { if (!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=idx===0?DEFAULT:MUTED; } }}
                      >
                        {isActive && <div style={{ width:4, height:4, borderRadius:'50%', background:ACCENT, flexShrink:0 }}/>}
                        {item.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </FlyoutPanel>
  );
}

function HoverPreviewCard({ app, anchorTop, onNavigate, onMouseEnter, onMouseLeave }) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ position:'fixed', top:Math.max(64,anchorTop-20), left:88, width:220, background:'#fff', borderRadius:10, boxShadow:'0 8px 32px rgba(0,0,0,0.18)', zIndex:60, padding:'12px 0', border:'1px solid #F1F5F9', animation:'slideIn 0.15s ease' }}
    >
      <style>{SLIDE_IN}</style>
      <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', letterSpacing:'0.14em', textTransform:'uppercase', padding:'0 14px 8px', borderBottom:'1px solid #F8FAFC', marginBottom:4 }}>
        {app.label}
      </div>
      {app.items.map(function(item, idx) {
        return (
          <div
            key={item.label}
            onClick={function() { onNavigate(item.path); }}
            style={{ padding:'8px 14px', fontSize:12, fontWeight:idx===0?600:400, color:idx===0?DEFAULT:MUTED, cursor:'pointer', transition:'all 0.1s' }}
            onMouseEnter={function(e) { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.color=ACCENT; }}
            onMouseLeave={function(e) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=idx===0?DEFAULT:MUTED; }}
          >
            {item.label}
          </div>
        );
      })}
    </div>
  );
}

function CustomizeModal({ onClose, pinnedApps, appOrder, onSave }) {
  const [order,    setOrder]    = useState(appOrder || DEFAULT_APP_ORDER);
  const [pinned,   setPinned]   = useState(pinnedApps || ['accounting']);
  const [dragging, setDragging] = useState(null);

  const togglePin = function(id) {
    setPinned(function(prev) {
      return prev.includes(id) ? prev.filter(function(p) { return p !== id; }) : [...prev, id];
    });
  };

  const handleDragStart = function(id) { setDragging(id); };
  const handleDragOver  = function(e, id) {
    e.preventDefault();
    if (!dragging || dragging === id) return;
    setOrder(function(prev) {
      const next  = [...prev];
      const fromI = next.indexOf(dragging);
      const toI   = next.indexOf(id);
      if (fromI === -1 || toI === -1) return prev;
      next.splice(fromI, 1);
      next.splice(toI, 0, dragging);
      return next;
    });
  };
  const handleDragEnd = function() { setDragging(null); };
  const reset = function() { setOrder(DEFAULT_APP_ORDER); setPinned(['accounting']); };

  const appMap = {};
  ALL_APPS.forEach(function(a) { appMap[a.id] = a; });

  return (
    <div
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
    >
      <style>{SLIDE_IN}</style>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:520, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', animation:'fadeIn 0.2s ease', overflow:'hidden' }}>
        <div style={{ padding:'24px 24px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:'#0F172A', marginBottom:4 }}>Customize your app menus</div>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.5 }}>Drag and drop to reorder apps, and pin your top apps for easy access.</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:MUTED, display:'flex', padding:4, marginLeft:16, flexShrink:0 }}><X size={20}/></button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'12px 24px' }}>
          {order.map(function(id) {
            const app = appMap[id];
            if (!app) return null;
            const Icon     = app.icon;
            const isPinned = pinned.includes(id);
            return (
              <div
                key={id}
                draggable
                onDragStart={function() { handleDragStart(id); }}
                onDragOver={function(e) { handleDragOver(e, id); }}
                onDragEnd={handleDragEnd}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 8px', borderRadius:10, marginBottom:4, background:dragging===id?'#F8FAFC':'transparent', border:dragging===id?'1px dashed #CBD5E1':'1px solid transparent', cursor:'grab', transition:'all 0.15s' }}
              >
                <GripVertical size={16} color="#CBD5E1" style={{ flexShrink:0, cursor:'grab' }}/>
                <button onClick={function() { togglePin(id); }} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', padding:2, flexShrink:0 }}>
                  {isPinned ? <Pin size={16} color={ACCENT}/> : <PinOff size={16} color="#CBD5E1"/>}
                </button>
                <div style={{ width:32, height:32, borderRadius:8, background:app.color+'15', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={16} color={app.color} strokeWidth={2}/>
                </div>
                <span style={{ fontSize:14, fontWeight:500, color:'#0F172A', flex:1 }}>{app.label}</span>
                {app.premium && <Gem size={14} color='#F97316'/>}
              </div>
            );
          })}
        </div>
        <div style={{ padding:'16px 24px', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <button onClick={reset} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:MUTED, fontFamily:FONT, textDecoration:'underline' }}>Reset to default</button>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, background:'#fff', border:'1px solid #E2E8F0', cursor:'pointer', fontSize:13, fontWeight:500, color:MUTED, fontFamily:FONT }}>Cancel</button>
            <button onClick={function() { onSave(pinned, order); onClose(); }} style={{ padding:'9px 20px', borderRadius:8, background:ACCENT, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:'#fff', fontFamily:FONT }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ onLogout, mobileOpen, onMobileClose, isMobile }) {
  const location = useLocation();
  const hasTopBar = location.pathname === '/';
  const sidebarTop = hasTopBar ? 104 : 0;
  const sidebarHeight = hasTopBar ? 'calc(100vh - 104px)' : '100vh';
  const navigate = useNavigate();
  

  const [flyout,        setFlyout]        = useState(null);
  const [flyoutExpanded,setFlyoutExpanded]= useState(null);
  const [hovItem,       setHovItem]       = useState(null);
  const [preview,       setPreview]       = useState(null);
  const [localMobile,   setLocalMobile]   = useState(window.innerWidth < 768);
  const [showCustomize, setShowCustomize] = useState(false);
  const [pinnedApps,    setPinnedApps]    = useState(['accounting']);
  const [appOrder,      setAppOrder]      = useState(DEFAULT_APP_ORDER);
  const [flyoutPinned,  setFlyoutPinned]  = useState(false);
  const [toast,         setToast]         = useState(false);

  const sidebarRef  = useRef(null);
  const hoverTimers = useRef({});
  const closeTimers = useRef({});

  const mobile = isMobile !== undefined ? isMobile : localMobile;

  useEffect(function() {
    const h = function() { setLocalMobile(window.innerWidth < 768); };
    window.addEventListener('resize', h);
    return function() { window.removeEventListener('resize', h); };
  }, []);

  useEffect(function() {
    const handler = function(e) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target) && !flyoutPinned) {
        setFlyout(null);
        setPreview(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return function() { document.removeEventListener('mousedown', handler); };
  }, [flyoutPinned]);

  useEffect(function() {
    const handler = function(e) {
      if (e.key === 'Escape') {
        setFlyout(null);
        setShowCustomize(false);
        setFlyoutPinned(false);
      }
    };
    document.addEventListener('keydown', handler);
    return function() { document.removeEventListener('keydown', handler); };
  }, []);

  const goTo = function(path) {
    navigate(path);
    setFlyout(null);
    setFlyoutExpanded(null);
    setPreview(null);
    setFlyoutPinned(false);
    if (onMobileClose) onMobileClose();
  };

  // ── Hover open/close with grace period ───────────────────────
  const startOpen = function(id, delay) {
    clearTimeout(closeTimers.current[id]);
    hoverTimers.current[id] = setTimeout(function() {
      if (!flyoutPinned) setFlyout(id);
    }, delay !== undefined ? delay : 300);
  };

  const startClose = function(id) {
    clearTimeout(hoverTimers.current[id]);
    if (!flyoutPinned) {
      closeTimers.current[id] = setTimeout(function() {
        setFlyout(function(prev) { return prev === id ? null : prev; });
      }, 200);
    }
  };

  const cancelClose = function(id) {
    clearTimeout(closeTimers.current[id]);
  };

  // Called when mouse enters the flyout panel itself — keeps it open
  const onPanelEnter = function(id) {
    clearTimeout(closeTimers.current[id]);
  };

  // Called when mouse leaves the flyout panel — starts close timer
  const onPanelLeave = function(id) {
    if (!flyoutPinned) {
      closeTimers.current[id] = setTimeout(function() {
        setFlyout(function(prev) { return prev === id ? null : prev; });
      }, 200);
    }
  };

  const handleItemClick = function(item) {
    Object.values(hoverTimers.current).forEach(clearTimeout);
    setPreview(null);
    if (item.path) {
      goTo(item.path);
    } else if (item.action === 'customize') {
      setShowCustomize(true);
    } else if (item.flyout) {
      if (flyout === item.flyout && flyoutPinned) {
        setFlyout(null);
        setFlyoutPinned(false);
      } else {
        setFlyout(item.flyout);
        setFlyoutPinned(true);
      }
      setFlyoutExpanded(null);
    }
  };

  const handleAccountingClick = function() {
    Object.values(hoverTimers.current).forEach(clearTimeout);
    setPreview(null);
    setFlyout('apps');
    setFlyoutExpanded('accounting');
    setFlyoutPinned(true);
  };

  const startPreview = function(app, e) {
    clearTimeout(closeTimers.current['preview']);
    const rect = e.currentTarget.getBoundingClientRect();
    hoverTimers.current['preview'] = setTimeout(function() {
      setPreview({ app: app, top: rect.top });
    }, 300);
  };

  const endPreview = function() {
    clearTimeout(hoverTimers.current['preview']);
    closeTimers.current['preview'] = setTimeout(function() { setPreview(null); }, 200);
  };

  const keepPreview = function() {
    clearTimeout(closeTimers.current['preview']);
  };

  const handleSaveCustomize = function(newPinned, newOrder) {
    setPinnedApps(newPinned);
    setAppOrder(newOrder);
    setToast(true);
    setTimeout(function() { setToast(false); }, 3000);
  };

  const renderSlimItem = function(item) {
    const isActive = item.path
      ? (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)))
      : flyout === item.flyout;
    const isHov     = hovItem === item.id;
    const iconColor  = isActive || isHov ? ACCENT : DEFAULT;
    const labelColor = isActive || isHov ? ACCENT : DEFAULT;
    const bg         = isActive ? '#E2F5F0' : isHov ? '#F1F5F9' : 'transparent';

    return (
      <div
        key={item.id}
        onClick={function() { handleItemClick(item); }}
        onMouseEnter={function() {
          setHovItem(item.id);
          if (item.flyout) startOpen(item.flyout, 300);
        }}
        onMouseLeave={function() {
          setHovItem(null);
          if (item.flyout) startClose(item.flyout);
        }}
        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'8px 6px', borderRadius:10, cursor:'pointer', width:68, marginBottom:2, background:bg, transition:'all 0.15s ease', position:'relative' }}
      >
        {isActive && (
          <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:24, borderRadius:'0 3px 3px 0', background:ACCENT }}/>
        )}
        <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {item.id === 'feed'
            ? <AsteriskIcon size={22} color={iconColor}/>
            : item.icon ? <item.icon size={22} color={iconColor} strokeWidth={2}/> : null
          }
        </div>
        <span style={{ fontSize:11, fontWeight:500, color:labelColor, letterSpacing:'0.02em', textAlign:'center', lineHeight:1.3 }}>
          {item.label}
        </span>
      </div>
    );
  };

  const renderAccountingPinned = function() {
    const isActive  = flyout === 'apps' && flyoutExpanded === 'accounting';
    const isHov     = hovItem === 'accounting';
    const iconColor = isActive || isHov ? ACCENT : DEFAULT;
    const bg        = isActive ? '#E2F5F0' : isHov ? '#F1F5F9' : 'transparent';
    return (
      <div
        onClick={handleAccountingClick}
        onMouseEnter={function(e) { setHovItem('accounting'); startPreview(ALL_APPS[0], e); }}
        onMouseLeave={function() { setHovItem(null); endPreview(); }}
        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'8px 6px', borderRadius:10, cursor:'pointer', width:68, marginBottom:2, background:bg, transition:'all 0.15s ease', position:'relative' }}
      >
        {isActive && (
          <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:24, borderRadius:'0 3px 3px 0', background:ACCENT }}/>
        )}
        <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <LayoutDashboard size={22} color={iconColor} strokeWidth={2}/>
        </div>
        <span style={{ fontSize:11, fontWeight:500, color:iconColor, textAlign:'center', lineHeight:1.3 }}>Accounting</span>
      </div>
    );
  };

  return (
    <div ref={sidebarRef}>
      <style>{SLIDE_IN}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#0F172A', color:'#fff', padding:'10px 20px', borderRadius:10, fontSize:13, fontWeight:500, zIndex:999, boxShadow:'0 8px 24px rgba(0,0,0,0.2)', animation:'fadeIn 0.2s ease' }}>
          App menu updated
        </div>
      )}

      {/* Customize modal */}
      {showCustomize && (
        <CustomizeModal
          onClose={function() { setShowCustomize(false); }}
          pinnedApps={pinnedApps}
          appOrder={appOrder}
          onSave={handleSaveCustomize}
        />
      )}

      {/* Hover preview */}
      {!mobile && preview && (
        <HoverPreviewCard
          app={preview.app}
          anchorTop={preview.top}
          onNavigate={function(path) { goTo(path); setPreview(null); }}
          onMouseEnter={keepPreview}
          onMouseLeave={endPreview}
        />
      )}

      {/* Desktop slim sidebar */}
     <aside style={{ position:'fixed',
      top:sidebarTop,
      left:0,
      width:80,
      height:sidebarHeight, background:'#FAFAFA', borderRight:'1px solid #E8EDF3', display:mobile?'none':'flex', flexDirection:'column', alignItems:'center', paddingTop:16, paddingBottom:8, zIndex:44, fontFamily:FONT, overflowY:'auto', scrollbarWidth:'none' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%', paddingTop:4 }}>
          {SLIM_ITEMS.map(function(item) { return renderSlimItem(item); })}
        </div>
        <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 0 4px' }}>
          <div style={{ fontSize:9, fontWeight:600, color:'#475569', letterSpacing:'0.08em', textTransform:'uppercase', textAlign:'center', marginBottom:6 }}>PINNED</div>
          {renderAccountingPinned()}
        </div>
        <div style={{ width:48, height:1, background:'#E8EDF3', margin:'8px 0', flexShrink:0 }}/>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%', marginTop:'auto' }}>
          {SLIM_BOTTOM.map(function(item) { return renderSlimItem(item); })}
          <div style={{ width:48, height:1, background:'#E8EDF3', margin:'6px 0', flexShrink:0 }}/>
          <div
            onClick={onLogout}
            onMouseEnter={function() { setHovItem('logout'); }}
            onMouseLeave={function() { setHovItem(null); }}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'8px 6px', borderRadius:10, cursor:'pointer', width:68, marginBottom:4, background:hovItem==='logout'?'rgba(239,68,68,0.06)':'transparent', transition:'all 0.15s' }}
          >
            <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <LogOut size={22} color={hovItem==='logout'?'#EF4444':DEFAULT} strokeWidth={2}/>
            </div>
            <span style={{ fontSize:11, fontWeight:500, color:hovItem==='logout'?'#EF4444':DEFAULT, textAlign:'center' }}>Sign Out</span>
          </div>
        </div>
      </aside>

      {/* Mobile dark drawer */}
      <div style={{ position:'fixed', top:0, left:0, width:300, height:'100vh', background:'linear-gradient(180deg,#0F1A2E 0%,#0D1526 100%)', zIndex:50, transform:mobileOpen?'translateX(0)':'translateX(-100%)', transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)', display:mobile?'flex':'none', flexDirection:'column', fontFamily:FONT, boxShadow:'4px 0 32px rgba(0,0,0,0.4)' }}>
        <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ fontSize:18, fontWeight:800, color:'#F1F5F9', letterSpacing:'-0.02em' }}>No<span style={{ color:ACCENT }}>vala</span></div>
          <button onClick={onMobileClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, cursor:'pointer', color:'#94A3B8', display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, flexShrink:0 }}><X size={18}/></button>
        </div>
        <nav style={{ flex:1, overflowY:'auto', padding:'8px 12px', scrollbarWidth:'none' }}>
          {APP_GROUPS.map(function(group) {
            return (
              <div key={group.label} style={{ marginBottom:4 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#475569', letterSpacing:'0.16em', textTransform:'uppercase', padding:'14px 10px 6px' }}>{group.label}</div>
                {group.items.map(function(item) {
                  const Icon     = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <div
                      key={item.path}
                      onClick={function() { goTo(item.path); }}
                      style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 12px', borderRadius:10, cursor:'pointer', marginBottom:1, background:isActive?'rgba(10,185,138,0.12)':'transparent', borderLeft:'3px solid '+(isActive?ACCENT:'transparent'), transition:'all 0.15s' }}
                      onMouseEnter={function(e) { if (!isActive) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
                      onMouseLeave={function(e) { if (!isActive) e.currentTarget.style.background='transparent'; }}
                    >
                      <div style={{ width:32, height:32, borderRadius:8, background:isActive?group.color+'25':'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Icon size={16} color={isActive?ACCENT:'#94A3B8'} strokeWidth={2}/>
                      </div>
                      <span style={{ fontSize:14, fontWeight:isActive?600:400, color:isActive?'#F1F5F9':'#94A3B8' }}>{item.label}</span>
                      {isActive && <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:ACCENT, flexShrink:0 }}/>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div style={{ padding:'12px 16px 32px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
          <button
            onClick={onLogout}
            style={{ width:'100%', padding:'12px', borderRadius:10, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'#64748B', cursor:'pointer', fontSize:14, fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all 0.15s' }}
            onMouseEnter={function(e) { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.color='#EF4444'; e.currentTarget.style.borderColor='rgba(239,68,68,0.2)'; }}
            onMouseLeave={function(e) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#64748B'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}
          >
            <LogOut size={16}/> Sign Out
          </button>
        </div>
      </div>

      {/* Flyout panels desktop only */}
      {!mobile && flyout === 'create' && (
        <CreateFlyout
          flyoutId="create"
          onClose={function() { setFlyout(null); setFlyoutPinned(false); }}
          onNavigate={goTo}
          onPanelEnter={onPanelEnter}
          onPanelLeave={onPanelLeave}
        />
      )}

      {!mobile && flyout === 'bookmarks' && (
        <FlyoutPanel
          title="Bookmarks"
          flyoutId="bookmarks"
          onClose={function() { setFlyout(null); setFlyoutPinned(false); }}
          onPanelEnter={onPanelEnter}
          onPanelLeave={onPanelLeave}
        >
          <div style={{ padding:'24px 20px', textAlign:'center' }}>
            <Bookmark size={32} color="#CBD5E1" style={{ marginBottom:12 }}/>
            <div style={{ fontSize:14, fontWeight:600, color:DEFAULT, marginBottom:6 }}>No bookmarks yet</div>
            <div style={{ fontSize:12, color:MUTED, marginBottom:20 }}>Add a bookmark to get started</div>
            <button onClick={function() { setFlyout(null); }} style={{ padding:'8px 16px', borderRadius:8, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:FONT }}>
              + Bookmark current page
            </button>
          </div>
        </FlyoutPanel>
      )}

      {!mobile && flyout === 'feed' && (
        <FlyoutPanel
          title="Feed"
          flyoutId="feed"
          onClose={function() { setFlyout(null); setFlyoutPinned(false); }}
          onPanelEnter={onPanelEnter}
          onPanelLeave={onPanelLeave}
        >
          <div style={{ padding:'24px 20px', textAlign:'center' }}>
            <AsteriskIcon size={32} color="#CBD5E1"/>
            <div style={{ fontSize:14, fontWeight:600, color:DEFAULT, marginBottom:6, marginTop:12 }}>Your activity feed</div>
            <div style={{ fontSize:12, color:MUTED }}>Recent transactions and updates will appear here.</div>
          </div>
        </FlyoutPanel>
      )}

      {!mobile && flyout === 'reports' && (
        <FlyoutPanel
          title="Reports"
          flyoutId="reports"
          onClose={function() { setFlyout(null); setFlyoutPinned(false); }}
          onPanelEnter={onPanelEnter}
          onPanelLeave={onPanelLeave}
        >
          <div style={{ padding:'8px 12px' }}>
            <div style={{ fontSize:9, fontWeight:700, color:MUTED, letterSpacing:'0.14em', textTransform:'uppercase', padding:'10px 8px 6px' }}>STANDARD</div>
            {REPORTS_ITEMS.filter(function(r) { return r.section === 'standard'; }).map(function(item) {
              return (
                <div
                  key={item.label}
                  onClick={function() { goTo(item.path); }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, cursor:'pointer', marginBottom:2, transition:'all 0.15s' }}
                  onMouseEnter={function(e) { e.currentTarget.style.background='#F1F5F9'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background='transparent'; }}
                >
                  <span style={{ fontSize:13, color:DEFAULT, fontWeight:500, flex:1 }}>{item.label}</span>
                  <ChevronRight size={13} color="#CBD5E1"/>
                </div>
              );
            })}
            <div style={{ fontSize:9, fontWeight:700, color:MUTED, letterSpacing:'0.14em', textTransform:'uppercase', padding:'14px 8px 6px' }}>ADVANCED</div>
            {REPORTS_ITEMS.filter(function(r) { return r.section === 'advanced'; }).map(function(item) {
              return (
                <div
                  key={item.label}
                  onClick={function() { goTo(item.path); }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, cursor:'pointer', marginBottom:2, transition:'all 0.15s' }}
                  onMouseEnter={function(e) { e.currentTarget.style.background='#F1F5F9'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background='transparent'; }}
                >
                  <span style={{ fontSize:13, color:DEFAULT, fontWeight:500, flex:1 }}>{item.label}</span>
                  <ChevronRight size={13} color="#CBD5E1"/>
                </div>
              );
            })}
          </div>
        </FlyoutPanel>
      )}

      {!mobile && flyout === 'apps' && (
        <AllAppsFlyout
          flyoutId="apps"
          onClose={function() { setFlyout(null); setFlyoutExpanded(null); setFlyoutPinned(false); }}
          onNavigate={goTo}
          expandedId={flyoutExpanded}
          location={location}
          onPanelEnter={onPanelEnter}
          onPanelLeave={onPanelLeave}
        />
      )}

      {!mobile && flyout === 'more' && (
        <FlyoutPanel
          title="More"
          flyoutId="more"
          onClose={function() { setFlyout(null); setFlyoutPinned(false); }}
          onPanelEnter={onPanelEnter}
          onPanelLeave={onPanelLeave}
        >
          <div style={{ padding:'8px 12px' }}>
            <div style={{ fontSize:9, fontWeight:700, color:MUTED, letterSpacing:'0.14em', textTransform:'uppercase', padding:'10px 8px 6px' }}>MORE</div>
            {ALL_APPS.filter(function(a) { return !pinnedApps.includes(a.id); }).map(function(app) {
              const Icon = app.icon;
              return (
                <div
                  key={app.id}
                  onClick={function() { setFlyout('apps'); setFlyoutExpanded(app.id); setFlyoutPinned(true); }}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:8, cursor:'pointer', marginBottom:2, transition:'all 0.15s' }}
                  onMouseEnter={function(e) { e.currentTarget.style.background='#F1F5F9'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background='transparent'; }}
                >
                  <div style={{ width:28, height:28, borderRadius:7, background:app.color+'15', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={14} color={app.color} strokeWidth={2}/>
                  </div>
                  <span style={{ fontSize:13, color:DEFAULT, fontWeight:500, flex:1 }}>{app.label}</span>
                  <ChevronRight size={12} color="#CBD5E1"/>
                </div>
              );
            })}
            <div style={{ height:1, background:'#F1F5F9', margin:'8px 0' }}/>
            {MORE_ITEMS.map(function(item) {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  onClick={function() { if (item.path) goTo(item.path); else setFlyout(null); }}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:8, cursor:'pointer', marginBottom:2, transition:'all 0.15s' }}
                  onMouseEnter={function(e) { e.currentTarget.style.background='#F1F5F9'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background='transparent'; }}
                >
                  <div style={{ width:28, height:28, borderRadius:7, background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={14} color={DEFAULT} strokeWidth={2}/>
                  </div>
                  <span style={{ fontSize:13, color:DEFAULT, fontWeight:400, flex:1 }}>{item.label}</span>
                  <ChevronRight size={12} color="#CBD5E1"/>
                </div>
              );
            })}
          </div>
        </FlyoutPanel>
      )}
    </div>
  );
}