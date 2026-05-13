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

const ACCENT = '#0AB98A';

function AppLayout({ onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div style={{
      display:    'flex',
      flexDirection: 'column',
      height:     '100vh',
      overflow:   'hidden',
      background: '#F8FAFC',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* Top header bar */}
      <TopBar
        onLogout={onLogout}
        onMobileMenu={() => setMobileMenuOpen(o => !o)}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
       <Sidebar
          onLogout={onLogout}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Mobile overlay */}
        {mobileMenuOpen && isMobile && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position:   'fixed',
              inset:      0,
              background: 'rgba(0,0,0,0.4)',
              zIndex:     39,
              backdropFilter: 'blur(2px)',
            }}
          />
        )}

        {/* Page content — marginLeft only on desktop */}
        <main style={{
          flex:       1,
          overflowY:  'auto',
          position:   'relative',
          marginLeft: isMobile ? 0 : 72,
          minWidth:   0,
        }}>
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
            <Route path="/register" element={<Login onLogin={handleLogin} />} />
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