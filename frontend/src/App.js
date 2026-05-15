import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes, Route, Navigate,
} from 'react-router-dom';
import { AIProvider }      from './context/AIContext';
import Sidebar             from './components/Sidebar';
import TopBar              from './components/TopBar';
import AIAssistant         from './components/AIAssistant';

import Login               from './pages/Login';
import Dashboard           from './pages/Dashboard';
import Documents           from './pages/Documents';
import Transactions        from './pages/Transactions';
import Budgets             from './pages/Budgets';
import Invoices            from './pages/Invoices';
import TaxCalculator       from './pages/TaxCalculator';
import VendorAnalytics     from './pages/VendorAnalytics';
import Currency            from './pages/Currency';
import ReceiptScanner      from './pages/ReceiptScanner';
import Agents              from './pages/Agents';
import Team                from './pages/Team';
import Integrations        from './pages/Integrations';
import Onboarding          from './pages/Onboarding';
import FinancialReports    from './pages/FinancialReports';
import Reconciliation      from './pages/Reconciliation';
import BillPay             from './pages/BillPay';
import VarianceReports     from './pages/VarianceReports';
import LedgerView          from './pages/LedgerView';
import DocumentComparison  from './pages/DocumentComparison';
import Billing             from './pages/Billing';
import Settings            from './pages/Settings';
import Help                from './pages/Help';
import SmartSearch         from './pages/SmartSearch';
import Landing             from './pages/Landing';
import Customers           from './pages/Customers';
import Inventory           from './pages/Inventory';
import APIAccess           from './pages/APIAccess';
import Businesses          from './pages/Businesses';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { BookOpen, Receipt, TrendingUp, UserCheck, Wallet, Users, Percent, Megaphone } from 'lucide-react';

const NAV_CATS = [
  { label: 'Accounting',          icon: BookOpen,   color: '#0AB98A', bg: '#E6F7F2', path: '/reconciliation' },
  { label: 'Expenses & Pay Bills',icon: Receipt,    color: '#EF4444', bg: '#FEE2E2', path: '/transactions'   },
  { label: 'Sales & Get Paid',    icon: TrendingUp, color: '#3B82F6', bg: '#DBEAFE', path: '/invoices'       },
  { label: 'Customer Hub',        icon: UserCheck,  color: '#0AB98A', bg: '#E6F7F2', path: '/customers'      },
  { label: 'Payroll',             icon: Wallet,     color: '#8B5CF6', bg: '#EDE9FE', path: '/team'           },
  { label: 'Team',                icon: Users,      color: '#6366F1', bg: '#E0E7FF', path: '/team'           },
  { label: 'Sales Tax',           icon: Percent,    color: '#F59E0B', bg: '#FEF3C7', path: '/tax'            },
  { label: 'Marketing',           icon: Megaphone,  color: '#F97316', bg: '#FFF7ED', path: '/marketing'      },
];

const ACCENT = '#0AB98A';

function PromoBanner() {
  const [show, setShow] = React.useState(
    () => localStorage.getItem('nova_banner_dismissed') !== 'true'
  );
  if (!show) return null;
  return (
    <div style={{ width:'100%', height:40, background:'#0F5959', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', flexShrink:0, zIndex:101 }}>
      <div style={{ fontSize:13, color:'#fff', display:'flex', alignItems:'center', gap:6 }}>
        Meet Nova — Instant, smart answers inside Novala.
        <span
          style={{ color:'#fff', fontWeight:700, textDecoration:'underline', cursor:'pointer' }}
          onClick={() => {}}
        >
          Try Nova
        </span>
      </div>
      <button
        onClick={() => { localStorage.setItem('nova_banner_dismissed','true'); setShow(false); }}
        style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', padding:4 }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

function AppLayout({ onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile,       setIsMobile]       = useState(window.innerWidth < 768);
  const [isTablet,       setIsTablet]       = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const navigate     = useNavigate();
  const location     = useLocation();
  const navScrollRef = useRef(null);
  const [showLeft,   setShowLeft]  = useState(false);
  const [showRight,  setShowRight] = useState(true);

  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1024);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const updateChevrons = () => {
    const el = navScrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;
    updateChevrons();
    el.addEventListener('scroll', updateChevrons, { passive: true });
    window.addEventListener('resize', updateChevrons);
    return () => {
      el.removeEventListener('scroll', updateChevrons);
      window.removeEventListener('resize', updateChevrons);
    };
  }, []);

  const isDesktop = !isMobile && !isTablet;

  const isDashboard = location.pathname === '/';

  const chevronBtn = (onClick, icon, side) => (
    <div onClick={onClick} style={{
      position:'absolute', [side]:0, top:'50%', transform:'translateY(-50%)',
      zIndex:10, display:'flex', alignItems:'center', justifyContent:'center',
      width:32, height:32, background:'#fff', border:'1px solid #E5E7EB',
      borderRadius:'50%', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.10)',
      transition:'all 0.15s', flexShrink:0,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#0AB98A'; e.currentTarget.style.boxShadow='0 2px 12px rgba(10,185,138,0.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.10)'; }}
    >
      {icon}
    </div>
  );

  return (
    <div style={{
      display:'flex', flexDirection:'column', height:'100vh',
      overflow:'hidden', background:'#F8FAFC',
      fontFamily:"'Inter', -apple-system, sans-serif",
    }}>
      {/* Promo banner */}
      <PromoBanner/>

      {/* Main header */}
      <TopBar
        onLogout={onLogout}
        onMobileMenu={() => setMobileMenuOpen(o => !o)}
        isMobile={isMobile}
      />

      {/* Pills row — only on dashboard, always pinned below header */}
      {isDashboard && (
        <div style={{
          background:'#fff',
          borderBottom:'1px solid #E5E7EB',
          boxShadow:'0 2px 8px rgba(0,0,0,0.05)',
          flexShrink:0,
          zIndex:40,
          paddingTop:10,
          paddingBottom:10,
          paddingLeft: isMobile ? 16 : 32,
          paddingRight: isMobile ? 16 : 32,
        }}>
          <div style={{ position:'relative', display:'flex', alignItems:'center', maxWidth:1200, margin:'0 auto' }}>

            {showLeft && (
              <>
                <div style={{ position:'absolute', left:32, top:0, bottom:0, width:48, background:'linear-gradient(to right,#fff,transparent)', zIndex:9, pointerEvents:'none' }}/>
                {chevronBtn(
                  () => navScrollRef.current?.scrollBy({ left:-240, behavior:'smooth' }),
                  <ChevronLeft size={15} color="#374151"/>,
                  'left'
                )}
              </>
            )}

            {showRight && (
              <>
                <div style={{ position:'absolute', right:32, top:0, bottom:0, width:48, background:'linear-gradient(to left,#fff,transparent)', zIndex:9, pointerEvents:'none' }}/>
                {chevronBtn(
                  () => navScrollRef.current?.scrollBy({ left:240, behavior:'smooth' }),
                  <ChevronRight size={15} color="#374151"/>,
                  'right'
                )}
              </>
            )}

            <div
              ref={navScrollRef}
              onScroll={updateChevrons}
              style={{
                display:'flex', gap:10, overflowX:'auto',
                scrollbarWidth:'none', msOverflowStyle:'none',
                WebkitOverflowScrolling:'touch',
                padding:'4px 2px', alignItems:'center',
                flexWrap:'nowrap', width:'100%',
              }}
            >
              {NAV_CATS.map(cat => {
                const Icon     = cat.icon;
                const isActive = location.pathname === cat.path;
                return (
                  <div
                    key={cat.label}
                    onClick={() => navigate(cat.path)}
                    style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 18px', background:isActive?cat.bg:'#F8FAFC', border:'1px solid '+(isActive?cat.color+'40':'#E5E7EB'), borderRadius:999, cursor:'pointer', flexShrink:0, transition:'all 0.18s ease', whiteSpace:'nowrap', boxShadow:isActive?'0 2px 10px '+cat.color+'20':'0 1px 4px rgba(0,0,0,0.06)' }}
                    onMouseEnter={e => { e.currentTarget.style.background=cat.bg; e.currentTarget.style.borderColor=cat.color+'40'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 14px '+cat.color+'25'; }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'; } e.currentTarget.style.transform='none'; }}
                  >
                    <div style={{ width:30, height:30, borderRadius:'50%', background:cat.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={15} color={cat.color} strokeWidth={2.2}/>
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:isActive?cat.color:'#374151' }}>{cat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flex:1, overflow:'hidden', position:'relative' }}>

        <Sidebar
          onLogout={onLogout}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          isMobile={isMobile}
          isTablet={isTablet}
          isDesktop={isDesktop}
        />

        {mobileMenuOpen && isMobile && (
          <div onClick={() => setMobileMenuOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:39, backdropFilter:'blur(2px)' }}/>
        )}

        <main style={{ flex:1, overflowY:'auto', position:'relative', minWidth:0, marginLeft: isMobile ? 0 : 80 }}>
          <Routes>
            <Route path="/"               element={<Dashboard />}          />
            <Route path="/documents"      element={<Documents />}          />
            <Route path="/transactions"   element={<Transactions />}       />
            <Route path="/budgets"        element={<Budgets />}            />
            <Route path="/invoices"       element={<Invoices />}           />
            <Route path="/tax"            element={<TaxCalculator />}      />
            <Route path="/vendors"        element={<VendorAnalytics />}    />
            <Route path="/currency"       element={<Currency />}           />
            <Route path="/receipts"       element={<ReceiptScanner />}     />
            <Route path="/agents"         element={<Agents />}             />
            <Route path="/team"           element={<Team />}               />
            <Route path="/integrations"   element={<Integrations />}       />
            <Route path="/reports"        element={<FinancialReports />}   />
            <Route path="/reconciliation" element={<Reconciliation />}     />
            <Route path="/billpay"        element={<BillPay />}            />
            <Route path="/variance"       element={<VarianceReports />}    />
            <Route path="/ledger"         element={<LedgerView />}         />
            <Route path="/comparison"     element={<DocumentComparison />} />
            <Route path="/billing"        element={<Billing />}            />
            <Route path="/help"           element={<Help />}               />
            <Route path="/settings"       element={<Settings />}           />
            <Route path="/landing"        element={<Landing />}            />
            <Route path="/customers"      element={<Customers />}          />
            <Route path="/inventory"      element={<Inventory />}          />
            <Route path="/api-access"     element={<APIAccess />}          />
            <Route path="/businesses"     element={<Businesses />}         />
            <Route path="/search"         element={<SmartSearch />}        />
            <Route path="*"               element={<Navigate to="/" />}    />
          </Routes>
        </main>
      </div>

      <AIAssistant />
    </div>
  );
}
export default function App() {
  const [token,              setToken]              = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [onboardingDone,     setOnboardingDone]     = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) setToken(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!token) {
      setCheckingOnboarding(false);
      setOnboardingDone(false);
      return;
    }
    const cached = localStorage.getItem('onboarding_completed');
    if (cached === 'true') {
      setOnboardingDone(true);
      setCheckingOnboarding(false);
      return;
    }
    setCheckingOnboarding(true);
    const timeout = setTimeout(() => {
      setOnboardingDone(true);
      setCheckingOnboarding(false);
    }, 3000);
    fetch('https://api.getnovala.com/api/v1/onboarding/status', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const done = d.onboarding_completed || false;
        setOnboardingDone(done);
        if (done) localStorage.setItem('onboarding_completed', 'true');
      })
      .catch(() => {
        setOnboardingDone(true);
        localStorage.setItem('onboarding_completed', 'true');
      })
      .finally(() => {
        clearTimeout(timeout);
        setCheckingOnboarding(false);
      });
  }, [token]);

  const handleLogin = (t, email) => {
    setToken(t);
    localStorage.setItem('token', t);
    if (email) localStorage.setItem('user_email', email);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setOnboardingDone(false);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('novala_just_onboarded', 'true');
    localStorage.setItem('onboarding_completed', 'true');
    setOnboardingDone(true);
  };

  if (loading || (token && checkingOnboarding)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
            No<span style={{ color: ACCENT }}>vala</span>
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>Loading your account...</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AIProvider>
        {!token ? (
          <Routes>
            <Route path="/"         element={<Landing />}                     />
            <Route path="/login"    element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Login onLogin={handleLogin} defaultRegister={true} />} />
            <Route path="*"         element={<Navigate to="/" />}             />
          </Routes>
        ) : !onboardingDone ? (
          <Onboarding onComplete={handleOnboardingComplete} />
        ) : (
          <AppLayout onLogout={handleLogout} />
        )}
      </AIProvider>
    </Router>
  );
}