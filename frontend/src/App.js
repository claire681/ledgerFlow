import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes, Route, Navigate,
} from 'react-router-dom';
import { AIProvider }      from './context/AIContext';
import Sidebar             from './components/Sidebar';
import AIAssistant         from './components/AIAssistant';

// Pages
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
import SmartSearch from './pages/SmartSearch';
import { Menu, X }         from 'lucide-react';

const ACCENT = '#0AB98A';
const BG     = '#0F172A';

function AppLayout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigate = () => {
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#F8FAFC', fontFamily:"'Inter', -apple-system, sans-serif", position:'relative' }}>

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:40 }}/>
      )}

      <div style={{ position:isMobile?'fixed':'relative', top:0, left:0, height:'100vh', zIndex:50, transform:isMobile?(sidebarOpen?'translateX(0)':'translateX(-100%)'):'translateX(0)', transition:'transform 0.25s ease' }}>
        <Sidebar onLogout={onLogout} onNavigate={handleNavigate}/>
      </div>

      <main style={{ flex:1, overflowY:'auto', position:'relative', width:isMobile?'100%':undefined }}>

        {isMobile && (
          <div style={{ position:'sticky', top:0, zIndex:30, background:BG, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #1E293B' }}>
            <button onClick={() => setSidebarOpen(o => !o)} style={{ background:'none', border:'none', cursor:'pointer', color:'#F1F5F9', display:'flex', alignItems:'center', padding:4 }}>
              {sidebarOpen ? <X size={22}/> : <Menu size={22}/>}
            </button>
            <div style={{ fontSize:16, fontWeight:700, color:'#F1F5F9', letterSpacing:'-0.01em' }}>
              No<span style={{ color:ACCENT }}>vala</span>
            </div>
            <div style={{ width:30 }}/>
          </div>
        )}

        <Routes>
          <Route path="/"               element={<Dashboard/>}        />
          <Route path="/documents"      element={<Documents/>}        />
          <Route path="/transactions"   element={<Transactions/>}     />
          <Route path="/budgets"        element={<Budgets/>}          />
          <Route path="/invoices"       element={<Invoices/>}         />
          <Route path="/tax"            element={<TaxCalculator/>}    />
          <Route path="/vendors"        element={<VendorAnalytics/>}  />
          <Route path="/currency"       element={<Currency/>}         />
          <Route path="/receipts"       element={<ReceiptScanner/>}   />
          <Route path="/agents"         element={<Agents/>}           />
          <Route path="/team"           element={<Team/>}             />
          <Route path="/integrations"   element={<Integrations/>}     />
          <Route path="/reports"        element={<FinancialReports/>} />
          <Route path="/reconciliation" element={<Reconciliation/>}   />
          <Route path="/billpay"        element={<BillPay/>}          />
          <Route path="/variance"       element={<VarianceReports/>}  />
          <Route path="/ledger"         element={<LedgerView/>}       />
          <Route path="/comparison"     element={<DocumentComparison/>}/>
          <Route path="/billing"        element={<Billing/>}          />
          <Route path="/help"           element={<Help/>}             />
          <Route path="/settings"       element={<Settings/>}         />
          <Route path="/search" element={<SmartSearch/>}/>
          <Route path="*"               element={<Navigate to="/"/>}  />
        </Routes>
      </main>

      <AIAssistant/>
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

    // Check localStorage first — fast path
    const cached = localStorage.getItem('onboarding_completed');
    if (cached === 'true') {
      setOnboardingDone(true);
      setCheckingOnboarding(false);
      return;
    }

    setCheckingOnboarding(true);

    // Timeout after 3 seconds — assume done if API is slow
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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#F8FAFC', fontFamily:"'Inter', sans-serif" }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:24, fontWeight:800, color:'#0F172A', marginBottom:8 }}>
            No<span style={{ color:ACCENT }}>vala</span>
          </div>
          <div style={{ fontSize:13, color:'#94A3B8' }}>Loading your account...</div>
        </div>
      </div>
    );
  }

  return (
    <AIProvider>
      <Router>
        {!token ? (
          <Routes>
            <Route path="/login"    element={<Login onLogin={handleLogin}/>}/>
            <Route path="/register" element={<Login onLogin={handleLogin}/>}/>
            <Route path="*"         element={<Navigate to="/login"/>}/>
          </Routes>
        ) : !onboardingDone ? (
          <Onboarding onComplete={handleOnboardingComplete}/>
        ) : (
          <AppLayout onLogout={handleLogout}/>
        )}
      </Router>
    </AIProvider>
  );
}