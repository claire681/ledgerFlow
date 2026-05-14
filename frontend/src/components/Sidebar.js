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
} from 'lucide-react';

const ACCENT  = '#0AB98A';
const FONT    = "'Inter', -apple-system, sans-serif";
const DEFAULT = '#334155';
const MUTED   = '#64748B';

const SLIDE_IN = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-12px) }
    to   { opacity: 1; transform: translateX(0) }
  }
`;

function AsteriskIcon({ size, color }) {
  const s  = size || 22;
  const cx = s / 2;
  const r  = s / 2 - 2;
  const lines = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 * Math.PI) / 180;
    return {
      x1: cx, y1: cx,
      x2: cx + r * Math.cos(angle),
      y2: cx + r * Math.sin(angle),
    };
  });
  return (
    <svg width={s} height={s} viewBox={'0 0 ' + s + ' ' + s} fill="none">
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={color || DEFAULT} strokeWidth="2.5" strokeLinecap="round" />
      ))}
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
      { label: 'Expenses',        path: '/transactions'            },
      { label: 'Bills',           path: '/billpay'                 },
      { label: 'Vendors',         path: '/vendors'                 },
      { label: 'Purchase orders', path: '/expenses/purchase-orders'},
    ],
  },
  {
    id: 'sales', label: 'Sales & Get Paid', color: '#F59E0B', icon: TrendingUp,
    items: [
      { label: 'Invoices',          path: '/invoices'        },
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
      { label: 'Team members',       path: '/team'            },
      { label: 'Timesheets',         path: '/team/timesheets' },
      { label: 'Roles & permissions',path: '/team/roles'      },
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
    ],
  },
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
  { id: 'customize', icon: Sliders,        label: 'Customize', flyout: 'customize' },
];

const MORE_ITEMS = [
  { label: 'Bookmarks',          icon: Bookmark,     path: null        },
  { label: 'Audit Log',          icon: ClipboardList,path: '/reports'  },
  { label: 'Settings',           icon: SettingsIcon, path: '/settings' },
  { label: 'Help & Support',     icon: HelpCircle,   path: '/help'     },
  { label: 'Keyboard Shortcuts', icon: Keyboard,     path: null        },
  { label: "What's New",         icon: Zap,          path: null        },
  { label: 'Send Feedback',      icon: MessageSquare,path: null        },
];

function CreateFlyout({ onClose, onNavigate }) {
  return (
    <div style={{ position: 'fixed', top: 56, left: 80, height: 'calc(100vh - 56px)', width: 680, background: '#fff', boxShadow: '4px 0 32px rgba(0,0,0,0.12)', zIndex: 45, display: 'flex', flexDirection: 'column', animation: 'slideIn 0.2s ease', borderRight: '1px solid #F1F5F9' }}>
      <style>{SLIDE_IN}</style>
      <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Create</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center' }}>
          <X size={18} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
        {CREATE_COLUMNS.map(col => (
          <div key={col.header}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #F1F5F9' }}>
              {col.header}
            </div>
            {col.items.map(item => (
              <div
                key={item.label}
                onClick={() => { onNavigate(item.path); onClose(); }}
                style={{ padding: '9px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: DEFAULT, lineHeight: 1.4, transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DEFAULT; }}
              >
                {item.label}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function FlyoutPanel({ title, onClose, children, width }) {
  const w = width || 280;
  return (
    <div style={{ position: 'fixed', top: 56, left: 80, height: 'calc(100vh - 56px)', width: w, background: '#fff', boxShadow: '4px 0 24px rgba(0,0,0,0.1)', zIndex: 45, display: 'flex', flexDirection: 'column', animation: 'slideIn 0.2s ease', borderRight: '1px solid #F1F5F9' }}>
      <style>{SLIDE_IN}</style>
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{title}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center' }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {children}
      </div>
    </div>
  );
}

function AllAppsFlyout({ onClose, onNavigate, expandedId, location }) {
  const [expanded, setExpanded] = useState(expandedId || 'accounting');
  return (
    <FlyoutPanel title="All Apps" onClose={onClose} width={300}>
      <div style={{ padding: '8px 12px' }}>
        {ALL_APPS.map(app => {
          const isExpanded = expanded === app.id;
          const Icon       = app.icon;
          return (
            <div key={app.id} style={{ marginBottom: 2 }}>
              <div
                onClick={() => setExpanded(isExpanded ? null : app.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 8, cursor: 'pointer', background: isExpanded ? app.color + '10' : 'transparent', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#F1F5F9'; }}
                onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 7, background: app.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={app.color} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 13, fontWeight: isExpanded ? 600 : 400, color: isExpanded ? app.color : DEFAULT, flex: 1 }}>
                  {app.label}
                </span>
                {app.premium && (
                  <span style={{ fontSize: 9, color: '#F97316', background: 'rgba(249,115,22,0.1)', padding: '1px 5px', borderRadius: 4, marginRight: 4 }}>PRO</span>
                )}
                {isExpanded
                  ? <ChevronDown size={13} color={app.color} />
                  : <ChevronRight size={13} color="#CBD5E1" />
                }
              </div>
              {isExpanded && (
                <div style={{ paddingLeft: 12, marginBottom: 4 }}>
                  {app.items.map((item, idx) => {
                    const isActive = location.pathname === item.path ||
                      (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                      <div
                        key={item.label}
                        onClick={() => { onNavigate(item.path); onClose(); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: idx === 0 || isActive ? 600 : 400, color: isActive ? ACCENT : idx === 0 ? DEFAULT : MUTED, background: isActive ? 'rgba(10,185,138,0.06)' : 'transparent', transition: 'all 0.12s', marginBottom: 1 }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = ACCENT; } }}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = idx === 0 ? DEFAULT : MUTED; } }}
                      >
                        {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: ACCENT, flexShrink: 0 }} />}
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
      style={{ position: 'fixed', top: Math.max(64, anchorTop - 20), left: 88, width: 220, background: '#fff', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 60, padding: '12px 0', border: '1px solid #F1F5F9', animation: 'slideIn 0.15s ease' }}
    >
      <style>{SLIDE_IN}</style>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '0 14px 8px', borderBottom: '1px solid #F8FAFC', marginBottom: 4 }}>
        {app.label}
      </div>
      {app.items.map((item, idx) => (
        <div
          key={item.label}
          onClick={() => onNavigate(item.path)}
          style={{ padding: '8px 14px', fontSize: 12, fontWeight: idx === 0 ? 600 : 400, color: idx === 0 ? DEFAULT : MUTED, cursor: 'pointer', transition: 'all 0.1s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = ACCENT; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = idx === 0 ? DEFAULT : MUTED; }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

export default function Sidebar({ onLogout, mobileOpen, onMobileClose, isMobile }) {
  const navigate                          = useNavigate();
  const location                          = useLocation();
  const [flyout,         setFlyout]       = useState(null);
  const [flyoutExpanded, setFlyoutExpanded] = useState(null);
  const [hovItem,        setHovItem]      = useState(null);
  const [preview,        setPreview]      = useState(null);
  const [localMobile,    setLocalMobile]  = useState(window.innerWidth < 768);
  const sidebarRef   = useRef(null);
  const hoverTimer   = useRef(null);
  const closeTimer   = useRef(null);

  const mobile = (isMobile !== undefined) ? isMobile : localMobile;

  useEffect(() => {
    const h = () => setLocalMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setFlyout(null);
        setPreview(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goTo = (path) => {
    navigate(path);
    setFlyout(null);
    setFlyoutExpanded(null);
    setPreview(null);
    if (onMobileClose) onMobileClose();
  };

  const handleItemClick = (item) => {
    clearTimeout(hoverTimer.current);
    setPreview(null);
    if (item.path) {
      goTo(item.path);
    } else if (item.flyout) {
      setFlyout(flyout === item.flyout ? null : item.flyout);
      setFlyoutExpanded(null);
    }
  };

  const handleAccountingClick = () => {
    clearTimeout(hoverTimer.current);
    setPreview(null);
    setFlyout('apps');
    setFlyoutExpanded('accounting');
  };

  const startPreview = (app, e) => {
    clearTimeout(closeTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    hoverTimer.current = setTimeout(() => {
      setPreview({ app, top: rect.top });
    }, 300);
  };

  const endPreview = () => {
    clearTimeout(hoverTimer.current);
    closeTimer.current = setTimeout(() => setPreview(null), 200);
  };

  const keepPreview = () => {
    clearTimeout(closeTimer.current);
  };

  const renderSlimItem = (item) => {
    const isActive = item.path
      ? (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)))
      : flyout === item.flyout;
    const isHov    = hovItem === item.id;
    const iconColor  = isActive || isHov ? ACCENT : DEFAULT;
    const labelColor = isActive || isHov ? ACCENT : DEFAULT;
    const bg         = isActive ? '#E2F5F0' : isHov ? '#F1F5F9' : 'transparent';

    return (
      <div
        key={item.id}
        onClick={() => handleItemClick(item)}
        onMouseEnter={e => { setHovItem(item.id); }}
        onMouseLeave={() => setHovItem(null)}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 6px', borderRadius: 10, cursor: 'pointer', width: 68, marginBottom: 2, background: bg, transition: 'all 0.15s ease', position: 'relative' }}
      >
        {isActive && (
          <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 24, borderRadius: '0 3px 3px 0', background: ACCENT }} />
        )}
        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {item.id === 'feed'
            ? <AsteriskIcon size={22} color={iconColor} />
            : item.icon ? <item.icon size={22} color={iconColor} strokeWidth={2} /> : null
          }
        </div>
        <span style={{ fontSize: 10, fontWeight: 500, color: labelColor, letterSpacing: '0.02em', textAlign: 'center', lineHeight: 1.2 }}>
          {item.label}
        </span>
      </div>
    );
  };

  const renderAccountingPinned = () => {
    const isActive = flyout === 'apps' && flyoutExpanded === 'accounting';
    const isHov    = hovItem === 'accounting';
    const iconColor = isActive || isHov ? ACCENT : DEFAULT;
    const bg        = isActive ? '#E2F5F0' : isHov ? '#F1F5F9' : 'transparent';
    return (
      <div
        onClick={handleAccountingClick}
        onMouseEnter={e => { setHovItem('accounting'); startPreview(ALL_APPS[0], e); }}
        onMouseLeave={() => { setHovItem(null); endPreview(); }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 6px', borderRadius: 10, cursor: 'pointer', width: 68, marginBottom: 2, background: bg, transition: 'all 0.15s ease', position: 'relative' }}
      >
        {isActive && (
          <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 24, borderRadius: '0 3px 3px 0', background: ACCENT }} />
        )}
        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LayoutDashboard size={22} color={iconColor} strokeWidth={2} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 500, color: iconColor, textAlign: 'center', lineHeight: 1.2 }}>
          Accounting
        </span>
      </div>
    );
  };

  return (
    <div ref={sidebarRef}>

      {/* Hover preview */}
      {!mobile && preview && (
        <HoverPreviewCard
          app={preview.app}
          anchorTop={preview.top}
          onNavigate={(path) => { goTo(path); setPreview(null); }}
          onMouseEnter={keepPreview}
          onMouseLeave={endPreview}
        />
      )}

      {/* Desktop slim sidebar */}
      <aside style={{ position: 'fixed', top: 56, left: 0, width: 80, height: 'calc(100vh - 56px)', background: '#FAFAFA', borderRight: '1px solid #E8EDF3', display: mobile ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, paddingBottom: 8, zIndex: 44, fontFamily: FONT, overflowY: 'auto', scrollbarWidth: 'none' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingTop: 4 }}>
          {SLIM_ITEMS.map(item => renderSlimItem(item))}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 4px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 6 }}>
            PINNED
          </div>
          {renderAccountingPinned()}
        </div>

        <div style={{ width: 48, height: 1, background: '#E8EDF3', margin: '8px 0', flexShrink: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: 'auto' }}>
          {SLIM_BOTTOM.map(item => renderSlimItem(item))}
          <div style={{ width: 48, height: 1, background: '#E8EDF3', margin: '6px 0', flexShrink: 0 }} />
          <div
            onClick={onLogout}
            onMouseEnter={() => setHovItem('logout')}
            onMouseLeave={() => setHovItem(null)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 6px', borderRadius: 10, cursor: 'pointer', width: 68, marginBottom: 4, background: hovItem === 'logout' ? 'rgba(239,68,68,0.06)' : 'transparent', transition: 'all 0.15s' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={22} color={hovItem === 'logout' ? '#EF4444' : DEFAULT} strokeWidth={2} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 500, color: hovItem === 'logout' ? '#EF4444' : DEFAULT, textAlign: 'center' }}>
              Sign Out
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile dark drawer */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: 300, height: '100vh', background: 'linear-gradient(180deg,#0F1A2E 0%,#0D1526 100%)', zIndex: 50, transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)', display: mobile ? 'flex' : 'none', flexDirection: 'column', fontFamily: FONT, boxShadow: '4px 0 32px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em' }}>
            No<span style={{ color: ACCENT }}>vala</span>
          </div>
          <button onClick={onMobileClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', scrollbarWidth: 'none' }}>
          {APP_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.16em', textTransform: 'uppercase', padding: '14px 10px 6px' }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const Icon     = item.icon;
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <div
                    key={item.path}
                    onClick={() => goTo(item.path)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 1, background: isActive ? 'rgba(10,185,138,0.12)' : 'transparent', borderLeft: '3px solid ' + (isActive ? ACCENT : 'transparent'), transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: isActive ? group.color + '25' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={isActive ? ACCENT : '#94A3B8'} strokeWidth={2} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, color: isActive ? '#F1F5F9' : '#94A3B8' }}>
                      {item.label}
                    </span>
                    {isActive && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: ACCENT, flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ padding: '12px 16px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button
            onClick={onLogout}
            style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#64748B', cursor: 'pointer', fontSize: 14, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Flyout panels desktop only */}
      {!mobile && flyout === 'create' && (
        <CreateFlyout onClose={() => setFlyout(null)} onNavigate={goTo} />
      )}

      {!mobile && flyout === 'bookmarks' && (
        <FlyoutPanel title="Bookmarks" onClose={() => setFlyout(null)}>
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <Bookmark size={32} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: DEFAULT, marginBottom: 6 }}>No bookmarks yet</div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>Add a bookmark to get started</div>
            <button onClick={() => setFlyout(null)} style={{ padding: '8px 16px', borderRadius: 8, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: FONT }}>
              + Bookmark current page
            </button>
          </div>
        </FlyoutPanel>
      )}

      {!mobile && flyout === 'feed' && (
        <FlyoutPanel title="Feed" onClose={() => setFlyout(null)}>
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <AsteriskIcon size={32} color="#CBD5E1" />
            <div style={{ fontSize: 14, fontWeight: 600, color: DEFAULT, marginBottom: 6, marginTop: 12 }}>Your activity feed</div>
            <div style={{ fontSize: 12, color: MUTED }}>Recent transactions and updates will appear here.</div>
          </div>
        </FlyoutPanel>
      )}

      {!mobile && flyout === 'reports' && (
        <FlyoutPanel title="Reports and Analytics" onClose={() => setFlyout(null)}>
          <div style={{ padding: '8px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '10px 8px 8px' }}>
              REPORTS AND ANALYTICS
            </div>
            {[
              { label: 'Financial Reports', path: '/reports',        active: true  },
              { label: 'Variance Reports',  path: '/variance',       active: false },
              { label: 'Ledger View',       path: '/ledger',         active: false },
              { label: 'Reconciliation',    path: '/reconciliation', active: false },
              { label: 'Smart Search',      path: '/search',         active: false },
            ].map(item => (
              <div
                key={item.label}
                onClick={() => goTo(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, background: item.active ? 'rgba(10,185,138,0.06)' : 'transparent', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                onMouseLeave={e => { e.currentTarget.style.background = item.active ? 'rgba(10,185,138,0.06)' : 'transparent'; }}
              >
                <span style={{ fontSize: 13, color: item.active ? ACCENT : DEFAULT, fontWeight: item.active ? 600 : 400, flex: 1 }}>{item.label}</span>
                <ChevronRight size={13} color="#CBD5E1" />
              </div>
            ))}
          </div>
        </FlyoutPanel>
      )}

      {!mobile && flyout === 'apps' && (
        <AllAppsFlyout
          onClose={() => { setFlyout(null); setFlyoutExpanded(null); }}
          onNavigate={goTo}
          expandedId={flyoutExpanded}
          location={location}
        />
      )}

      {!mobile && flyout === 'more' && (
        <FlyoutPanel title="More" onClose={() => setFlyout(null)}>
          <div style={{ padding: '8px 12px' }}>
            {MORE_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  onClick={() => { if (item.path) goTo(item.path); else setFlyout(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={DEFAULT} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: 13, color: DEFAULT, fontWeight: 400, flex: 1 }}>{item.label}</span>
                  <ChevronRight size={12} color="#CBD5E1" />
                </div>
              );
            })}
          </div>
        </FlyoutPanel>
      )}

      {!mobile && flyout === 'customize' && (
        <FlyoutPanel title="Customize Sidebar" onClose={() => setFlyout(null)}>
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>
              Pin your most-used pages to the sidebar for quick access.
            </div>
            {APP_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  {group.label}
                </div>
                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 2 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: group.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={13} color={group.color} strokeWidth={2} />
                      </div>
                      <span style={{ fontSize: 13, color: DEFAULT, flex: 1 }}>{item.label}</span>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #E8EDF3', cursor: 'pointer', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            ))}
            <button
              onClick={() => setFlyout(null)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: FONT, marginTop: 12 }}
            >
              Save
            </button>
          </div>
        </FlyoutPanel>
      )}
    </div>
  );
}