import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes, Route, Navigate,
} from 'react-router-dom';
import { AIProvider }  from './context/AIContext';
import Sidebar         from './components/Sidebar';
import AIAssistant     from './components/AIAssistant';

// Pages
import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import Documents       from './pages/Documents';
import Transactions    from './pages/Transactions';
import Budgets         from './pages/Budgets';
import Invoices        from './pages/Invoices';
import TaxCalculator   from './pages/TaxCalculator';
import VendorAnalytics from './pages/VendorAnalytics';
import Currency        from './pages/Currency';
import ReceiptScanner  from './pages/ReceiptScanner';
import Agents          from './pages/Agents';
import Team            from './pages/Team';
import Integrations    from './pages/Integrations';

// ── Authenticated layout ───────────────────────────────────────────────────
function AppLayout({ onLogout }) {
  return (
    <div style={{
      display:    'flex',
      height:     '100vh',
      overflow:   'hidden',
      background: '#F8FAFC',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Dark sidebar */}
      <Sidebar onLogout={onLogout}/>

      {/* Main content */}
      <main style={{ flex:1, overflowY:'auto', position:'relative' }}>
        <Routes>
          <Route path="/"             element={<Dashboard/>}      />
          <Route path="/documents"    element={<Documents/>}      />
          <Route path="/transactions" element={<Transactions/>}   />
          <Route path="/budgets"      element={<Budgets/>}        />
          <Route path="/invoices"     element={<Invoices/>}       />
          <Route path="/tax"          element={<TaxCalculator/>}  />
          <Route path="/vendors"      element={<VendorAnalytics/>}/>
          <Route path="/currency"     element={<Currency/>}       />
          <Route path="/receipts"     element={<ReceiptScanner/>} />
          <Route path="/agents"       element={<Agents/>}         />
          <Route path="/team"         element={<Team/>}           />
          <Route path="/integrations" element={<Integrations/>}   />
          <Route path="*"             element={<Navigate to="/"/>}/>
        </Routes>
      </main>

      {/* Floating AI Assistant — available on every page */}
      <AIAssistant/>
    </div>
  );
}

// ── Root app ───────────────────────────────────────────────────────────────
export default function App() {
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('token');
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

  if (loading) {
    return (
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        height:         '100vh',
        background:     '#F8FAFC',
        fontSize:       14,
        color:          '#64748B',
        fontFamily:     "'Inter', sans-serif",
      }}>
        Loading LedgerFlow...
      </div>
    );
  }

  return (
    <AIProvider>
      <Router>
        {token ? (
          <AppLayout onLogout={handleLogout}/>
        ) : (
          <Routes>
            <Route
              path="/login"
              element={<Login onLogin={handleLogin}/>}
            />
            <Route
              path="/register"
              element={<Login onLogin={handleLogin}/>}
            />
            <Route
              path="*"
              element={<Navigate to="/login"/>}
            />
          </Routes>
        )}
      </Router>
    </AIProvider>
  );
}