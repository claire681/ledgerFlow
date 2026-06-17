import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import InvoiceEditor from "./pages/InvoiceEditor";
import InvoiceReviewSend from "./pages/InvoiceReviewSend";
import PayRuns from "./pages/PayRuns";
import PayrollLauncher from "./utils/payrollLauncher";
import PayRunDetail from "./pages/PayRunDetail";
import PayStubDetail from "./pages/PayStubDetail";
import EmployeesList from "./pages/EmployeesList";
import PayrollItems from "./pages/PayrollItems";
import PaySchedule from "./pages/PaySchedule";
import WorkLocation from "./pages/WorkLocation";
import EmployeeProfile from "./pages/EmployeeProfile";
import AddEmployee from "./pages/AddEmployee";
import PayrollOverview from "./pages/PayrollOverview";
import PaychequeList from "./pages/PaychequeList";
import PaychequeDetail from "./pages/PaychequeDetail";
import RunPayroll from "./pages/RunPayroll";
import PayrollPreview from "./pages/PayrollPreview";
import EmployeePortal from "./pages/EmployeePortal";
import { AIProvider }      from './context/AIContext';
import useAI from './hooks/useAI';
import Sidebar             from './components/Sidebar';
import TopBar              from './components/TopBar';
import AIAssistant         from './components/AIAssistant';

import LoginPage           from './pages/Login';
import Dashboard           from './pages/Dashboard';
import Documents           from './pages/Documents';
import Transactions        from './pages/Transactions';
import Budgets             from './pages/Budgets';
import Invoices            from './pages/Invoices';
import InvoicesAll from './pages/InvoicesAll';
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
import LandingV2         from './pages/LandingV2';
import PricingV2         from './pages/PricingV2';
import Customers           from './pages/Customers';
import Inventory           from './pages/Inventory';
import APIAccess           from './pages/APIAccess';
import Businesses          from './pages/Businesses';
import ResetPassword from './pages/ResetPassword';
import AcceptInvite from './pages/AcceptInvite';
import HelpAutoPayroll from "./pages/HelpAutoPayroll";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";

import AddPayroll from "./pages/AddPayroll";
import AddPayrollV2      from './pages/AddPayrollV2';
import CartV2            from './pages/CartV2';
import Cart from "./pages/Cart";
import Verify from "./pages/Verify";
import VerificationGuard from "./components/VerificationGuard";
const ACCENT = '#0AB98A';

function PromoBanner() {
  const { askAndOpen } = useAI();
  const [show, setShow] = React.useState(
    () => localStorage.getItem('nova_banner_dismissed') !== 'true'
  );
  const { askAndopen } = useAI();
  if (!show) return null;
  return (
    <div style={{ width:'100%', height:40, background:'#0F5959', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', flexShrink:0, zIndex:101 }}>
      <div style={{ fontSize:13, color:'#fff', display:'flex', alignItems:'center', gap:6 }}>
        Meet Nova — Instant, smart answers inside Novala.
        <span
          style={{ color:'#fff', fontWeight:700, textDecoration:'underline', cursor:'pointer' }}
          onClick={() => askAndOpen("Hi! What can you help me with today?", { forceMode: 'dashboard' })}
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
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile,       setIsMobile]       = useState(window.innerWidth < 768);
  const [isTablet,       setIsTablet]       = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  

  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1024);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  
  

  

  const isDesktop = !isMobile && !isTablet;

  return (
    <div style={{
      display:'flex', flexDirection:'column', height:'100vh',
      overflow:'hidden', background:'#F8FAFC',
      fontFamily:"'Inter', -apple-system, sans-serif",
    }}>
      {/* Promo banner */}
      <PromoBanner/>

      {/* Main header */}
      {(
          <TopBar
        onLogout={onLogout}
        onMobileMenu={() => setMobileMenuOpen(o => !o)}
        isMobile={isMobile}
      />
        )}

    

      <div style={{ display:'flex', flex:1, overflow:'hidden', position:'relative' }}>

        {!(location.pathname.startsWith("/invoices/new") || location.pathname.match(/^\/invoices\/[^/]+\/(edit|send)$/)) && (
            <Sidebar
          onLogout={onLogout}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          isMobile={isMobile}
          isTablet={isTablet}
          isDesktop={isDesktop}
        />
          )}

        {mobileMenuOpen && isMobile && (
          <div onClick={() => setMobileMenuOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:39, backdropFilter:'blur(2px)' }}/>
        )}

        <main  style={{ flex:1, overflowY:'auto', position:'relative', minWidth:0, marginLeft: 0 }}>
          <Routes>
          <Route path="/payroll/employees" element={<EmployeesList />} />
          <Route path="/payroll/employees/add" element={<AddEmployee />} />
          <Route path="/payroll/employees/:id" element={<EmployeeProfile />} />
          <Route path="/payroll/run" element={<PayrollLauncher />} />
          <Route path="/payroll/run/:payRunId" element={<RunPayroll />} />
          <Route path="/payroll/run/:payRunId/preview" element={<PayrollPreview />} />
          <Route path="/payroll/runs/new" element={<PayrollLauncher />} />
          <Route path="/payroll/runs/:runId/stubs/:stubId" element={<PayStubDetail />} />
          <Route path="/payroll/runs/:id" element={<PayRunDetail />} />
          <Route path="/payroll/runs" element={<PayRuns />} />
          <Route path="/payroll/overview" element={<PayrollOverview />} />
          <Route path="/payroll/paycheques" element={<PaychequeList />} />
          <Route path="/payroll/paycheques/:id" element={<PaychequeDetail />} />
          <Route path="/payroll/items" element={<PayrollItems />} />
          <Route path="/payroll/items/schedules/:id" element={<PaySchedule />} />
          <Route path="/payroll/items/locations/:id" element={<WorkLocation />} />
          <Route path="/payroll/*" element={<Navigate to="/payroll/employees" replace />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/invoices/all" element={<InvoicesAll />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<Invoices />} />
          <Route path="/invoices/:id/edit" element={<Invoices />} />
          <Route path="/invoices/:id/qb-edit" element={<InvoiceEditor />} />
          <Route path="/invoices/new-qb" element={<InvoiceEditor />} />
          <Route path="/invoices/:id/send" element={<InvoiceReviewSend />} />
          <Route path="/tax" element={<TaxCalculator />} />
          <Route path="/vendors" element={<VendorAnalytics />} />
          <Route path="/currency" element={<Currency />} />
          <Route path="/receipts" element={<ReceiptScanner />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/team" element={<Team />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/reports" element={<FinancialReports />} />
          <Route path="/reconciliation" element={<Reconciliation />} />
          <Route path="/billpay" element={<BillPay />} />
          <Route path="/variance" element={<VarianceReports />} />
          <Route path="/ledger" element={<LedgerView />} />
          <Route path="/comparison" element={<DocumentComparison />} />
          <Route path="/help" element={<Help />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/api-access" element={<APIAccess />} />
          <Route path="/businesses" element={<Businesses />} />
          <Route path="/search" element={<SmartSearch />} />
          <Route path="*" element={<Navigate to="/" />} />
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
 

  useEffect(() => {
    const stored = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (stored) setToken(stored);
    setLoading(false);
  }, []);

const handleLogin = (t, email) => {
    setToken(t);
    localStorage.setItem('token', t);
    if (email) localStorage.setItem('user_email', email);
  };
 const handleLogout = () => {
    localStorage.clear();
    setToken(null);
  };
const handleOnboardingComplete = () => {
    const token = localStorage.getItem('token');
    if (token) setToken(token);
    else window.location.href = '/';
  };
  if (loading) {
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
        <VerificationGuard />
            <Routes>
          <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/register" element={<Onboarding onComplete={() => window.location.replace("/")} />} />
          <Route path="/verify-code" element={<Verify />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/employee-portal" element={<EmployeePortal />} />
        <Route path="/landing-v2" element={<LandingV2 />} />
        <Route path="/pricing-v2" element={<PricingV2 />} />
          <Route path="/add-payroll" element={<AddPayroll />} />
          <Route path="/add-payroll-v2" element={<AddPayrollV2 />} />
          <Route path="/cart-v2" element={<CartV2 />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/help/auto-payroll" element={<HelpAutoPayroll />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />
          <Route path="/" element={token ? <AppLayout onLogout={handleLogout} /> : <LandingV2 />} />
          <Route path="*" element={token ? <AppLayout onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        </Routes>
      </AIProvider>
    </Router>
  );
}