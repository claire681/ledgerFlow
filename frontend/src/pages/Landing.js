import { useState, useEffect, useRef } from "react";
import {
  BarChart3, Bell, Search, Shield, FileText,
  Upload, TrendingUp, Rocket, Menu, X, Check,
  Lock, Cloud, ChevronDown, Zap, Users, Globe,
  CreditCard, Calculator, Building2, Smartphone,
  ArrowRight, Star, Database, RefreshCw, Eye,
  BookOpen, Receipt, Brain, Repeat, ScanLine,
  MessageSquare, Folder, GitMerge, Package,
  HelpCircle, CheckCircle, Layers, Sparkles,
  DollarSign, PieChart, ArrowUpCircle, Briefcase,
} from "lucide-react";

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function Counter({ end, suffix = "" }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function Reveal({ children, delay = 0, direction = "up", pop = false }) {
  const [ref, inView] = useInView();
  const transforms = {
    up:    "translateY(36px) scale(0.97)",
    left:  "translateX(-36px)",
    right: "translateX(36px)",
    none:  "none",
  };
  return (
    <div ref={ref} style={{
      opacity:    inView ? 1 : 0,
      transform:  inView ? "none" : transforms[direction],
      transition: pop
        ? `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.55s cubic-bezier(0.34,1.45,0.64,1) ${delay}s`
        : `opacity 0.6s ease ${delay}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

// ── Enhanced FAQ with icon ────────────────────────────────────
function FAQ({ q, a, icon }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{
      borderRadius: 14,
      border: `1px solid ${open ? "rgba(0,212,164,0.3)" : "rgba(0,212,164,0.12)"}`,
      background: open ? "rgba(0,212,164,0.03)" : "#fff",
      marginBottom: 10, cursor: "pointer", transition: "all 0.3s ease", overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          {icon && (
            <div style={{ width: 32, height: 32, borderRadius: 9, background: open ? "rgba(0,212,164,0.12)" : "#E8F4F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s ease" }}>
              {icon}
            </div>
          )}
          <span style={{ fontWeight: 600, fontSize: 14, color: "#0A2540", lineHeight: 1.4 }}>{q}</span>
        </div>
        <ChevronDown size={17} color="#00D4A4" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.3s ease" }}/>
      </div>
      <div style={{ maxHeight: open ? 300 : 0, overflow: "hidden", transition: "max-height 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ padding: "0 22px 18px 66px", fontSize: 13.5, color: "#475569", lineHeight: 1.75 }}>{a}</div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, bullets, accent = "#00D4A4", delay = 0, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <Reveal delay={delay} pop={true}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          borderRadius: 20, padding: "28px 26px",
          background: "#fff",
          border: `1px solid ${hov ? `${accent}40` : "rgba(226,232,240,0.8)"}`,
          boxShadow: hov ? `0 20px 60px rgba(0,212,164,0.12), 0 4px 16px rgba(0,0,0,0.06)` : "0 2px 12px rgba(0,0,0,0.04)",
          transform: hov ? "translateY(-6px)" : "none",
          transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
          height: "100%", display: "flex", flexDirection: "column", position: "relative",
        }}
      >
        {badge && (
          <div style={{ position: "absolute", top: 16, right: 16, fontSize: 9, fontWeight: 700, color: "#00D4A4", background: "rgba(0,212,164,0.1)", border: "1px solid rgba(0,212,164,0.3)", padding: "3px 10px", borderRadius: 20, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {badge}
          </div>
        )}
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${accent}15`, border: `1px solid ${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, flexShrink: 0, transition: "all 0.35s ease", transform: hov ? "scale(1.1) rotate(-4deg)" : "none" }}>
          {icon}
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A2540", marginBottom: 10, letterSpacing: "-0.02em", lineHeight: 1.3 }}>{title}</h3>
        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, marginBottom: bullets ? 16 : 0, flex: 1 }}>{desc}</p>
        {bullets && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {bullets.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={9} color={accent} strokeWidth={3}/>
                </div>
                <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{b}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}

function PricingCard({ plan, price, desc, features, cta, popular, onSignUp, icon, color }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 24, padding: "34px 30px", width: "100%", maxWidth: 340,
        border: popular ? "2px solid #0A2540" : "1px solid #E5E7EB",
        background: popular ? "#0A2540" : "#fff",
        position: "relative",
        transform: hov ? "translateY(-10px)" : popular ? "translateY(-6px)" : "none",
        boxShadow: popular ? "0 24px 70px rgba(10,37,64,0.28)" : hov ? "0 20px 60px rgba(0,0,0,0.1)" : "0 4px 20px rgba(0,0,0,0.05)",
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {popular && (
        <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#0A2540", color: "#00D4A4", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", padding: "4px 18px", borderRadius: 20, textTransform: "uppercase", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(10,37,64,0.3)", border: "1px solid #00D4A4" }}>Most Popular</div>
      )}
      {/* Plan icon */}
      <div style={{ width: 44, height: 44, borderRadius: 12, background: popular ? "rgba(0,212,164,0.15)" : `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        {icon}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: popular ? "rgba(255,255,255,0.6)" : "#0A2540", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{plan}</div>
      <div style={{ fontSize: 40, fontWeight: 800, color: popular ? "#fff" : "#0A2540", marginBottom: 6, letterSpacing: "-0.04em" }}>
        {price === "Custom" ? "Custom" : <>${price}<span style={{ fontSize: 14, fontWeight: 500, opacity: 0.7 }}>/mo</span></>}
      </div>
      <div style={{ fontSize: 13, color: popular ? "rgba(255,255,255,0.6)" : "#6B7280", marginBottom: 26, lineHeight: 1.5 }}>{desc}</div>
      <div style={{ borderTop: `1px solid ${popular ? "rgba(255,255,255,0.12)" : "#E5E7EB"}`, paddingTop: 20, marginBottom: 24 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 11 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: popular ? "rgba(0,212,164,0.15)" : "#E8F4F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <Check size={10} color="#00D4A4" strokeWidth={3}/>
            </div>
            <span style={{ fontSize: 13, color: popular ? "rgba(255,255,255,0.85)" : "#475569", lineHeight: 1.4 }}>{f}</span>
          </div>
        ))}
      </div>
      <button onClick={onSignUp}
        style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: popular ? "#00D4A4" : "#0A2540", color: popular ? "#0A2540" : "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)", boxShadow: popular ? "0 4px 16px rgba(0,212,164,0.3)" : "0 4px 16px rgba(10,37,64,0.25)", fontFamily: "inherit" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>
        {cta}
      </button>
    </div>
  );
}

// ── Premium Orbital Animation ─────────────────────────────────
function OrbitalAnimation() {
  const ORBIT_ICONS = [
    { Icon: FileText,   color: "#0ea5e9", label: "Invoice"   },
    { Icon: Receipt,    color: "#00D4A4", label: "Receipt"   },
    { Icon: BarChart3,  color: "#8b5cf6", label: "Reports"   },
    { Icon: GitMerge,   color: "#f59e0b", label: "Reconcile" },
    { Icon: CreditCard, color: "#ef4444", label: "Bill Pay"  },
    { Icon: Calculator, color: "#06b6d4", label: "Tax"       },
    { Icon: ScanLine,   color: "#00D4A4", label: "Scanner"   },
    { Icon: Repeat,     color: "#8b5cf6", label: "Recurring" },
  ];

  const [angle, setAngle] = useState(0);
  useEffect(() => {
    let frame;
    const animate = () => {
      setAngle(a => (a + 0.18) % 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const R1 = 130;
  const R2 = 210;
  const size = 500;
  const cx = size / 2;

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <style>{`
        @keyframes center-pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(0,212,164,0.25), 0 8px 32px rgba(10,37,64,0.3); }
          50%       { box-shadow: 0 0 70px rgba(0,212,164,0.45), 0 8px 40px rgba(10,37,64,0.4); }
        }
        @keyframes icon-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>

      <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,164,0.06) 0%, transparent 70%)", pointerEvents: "none" }}/>
      <div style={{ position: "absolute", top: cx - R2, left: cx - R2, width: R2 * 2, height: R2 * 2, borderRadius: "50%", border: "1px solid rgba(0,212,164,0.12)" }}/>
      <div style={{ position: "absolute", top: cx - R1, left: cx - R1, width: R1 * 2, height: R1 * 2, borderRadius: "50%", border: "1px solid rgba(0,212,164,0.18)" }}/>

      {ORBIT_ICONS.slice(0, 4).map((item, i) => {
        const deg = angle + (i * 360) / 4;
        const rad = (deg * Math.PI) / 180;
        const x = cx + R1 * Math.cos(rad) - 22;
        const y = cx + R1 * Math.sin(rad) - 22;
        const Icon = item.Icon;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 44, height: 44, borderRadius: 12, background: "#fff", border: `1px solid ${item.color}30`, boxShadow: `0 4px 16px rgba(0,0,0,0.1), 0 0 12px ${item.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2, animation: `icon-float ${3 + i * 0.5}s ease-in-out infinite` }}>
            <Icon size={18} color={item.color} strokeWidth={2}/>
            <span style={{ fontSize: 7, fontWeight: 700, color: item.color }}>{item.label.toUpperCase()}</span>
          </div>
        );
      })}

      {ORBIT_ICONS.slice(4).map((item, i) => {
        const deg = -angle * 0.6 + (i * 360) / 4 + 45;
        const rad = (deg * Math.PI) / 180;
        const x = cx + R2 * Math.cos(rad) - 26;
        const y = cx + R2 * Math.sin(rad) - 26;
        const Icon = item.Icon;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 52, height: 52, borderRadius: 14, background: "#fff", border: `1px solid ${item.color}25`, boxShadow: `0 6px 20px rgba(0,0,0,0.08), 0 0 16px ${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2, animation: `icon-float ${4 + i * 0.7}s ease-in-out infinite` }}>
            <Icon size={22} color={item.color} strokeWidth={2}/>
            <span style={{ fontSize: 7, fontWeight: 700, color: item.color }}>{item.label.toUpperCase()}</span>
          </div>
        );
      })}

      <div style={{ position: "absolute", left: cx - 52, top: cx - 52, width: 104, height: 104, borderRadius: 28, background: "linear-gradient(135deg, #0A2540 0%, #0d3060 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "center-pulse 3s ease-in-out infinite", zIndex: 10 }}>
        <svg width="32" height="32" viewBox="0 0 22 22" fill="none" style={{ marginBottom: 4 }}>
          <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#00D4A4" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="19" cy="9" r="2" fill="#00D4A4"/>
        </svg>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>No<span style={{ color: "#00D4A4" }}>vala</span></span>
      </div>
    </div>
  );
}

export default function NovalaLanding() {
  const [scrollY,         setScrollY]         = useState(0);
  const [menuOpen,        setMenuOpen]        = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || showAllFeatures ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen, showAllFeatures]);

  const goToApp    = () => { window.location.href = "https://www.getnovala.com/login";    };
  const goToSignUp = () => { window.location.href = "https://www.getnovala.com/register"; };

  const navLinks = ["Features", "How It Works", "Pricing", "FAQ"];
  const px = "clamp(16px, 5vw, 80px)";

  const allFeatures = [
    { icon: <Brain size={22} color="#00D4A4"/>,      title: "Smart Financial Intelligence",    desc: "Upload any document — automatically reads, understands, and records every financial detail instantly.", bullets: ["Auto-extract vendor, amount, date", "High-accuracy classification", "Works with PDFs, images, CSVs"], accent: "#00D4A4" },
    { icon: <FileText size={22} color="#0ea5e9"/>,   title: "Professional Invoicing",          desc: "Create stunning branded invoices in seconds. Track, send, and get paid faster.", bullets: ["Custom logo & branding", "PDF generation & download", "Payment status tracking"], accent: "#0ea5e9" },
    { icon: <BarChart3 size={22} color="#8b5cf6"/>,  title: "Live Financial Dashboard",        desc: "Real-time revenue, expenses, and cash flow — always beautifully visualized.", bullets: ["Live revenue tracking", "Expense trend analysis", "Cash flow forecasting"], accent: "#8b5cf6" },
    { icon: <Bell size={22} color="#f59e0b"/>,       title: "Smart Invoice Follow-Up",         desc: "Automatically schedules and sends professional follow-up emails with invoice PDFs attached.", bullets: ["Customizable message editor", "Scheduled email delivery", "PDF invoice attachment"], accent: "#f59e0b" },
    { icon: <Search size={22} color="#0ea5e9"/>,     title: "Semantic Document Search",        desc: "Search your financial history in plain English — Novala understands context and intent.", bullets: ["Natural language queries", "3-layer search engine", "Instant document retrieval"], accent: "#0ea5e9" },
    { icon: <RefreshCw size={22} color="#00D4A4"/>,  title: "Automated Bookkeeping",           desc: "Bank-grade reconciliation, duplicate detection, and auto-categorization — all automatic.", bullets: ["Smart reconciliation", "Duplicate detection", "Auto-categorization"], accent: "#00D4A4" },
    { icon: <Repeat size={22} color="#8b5cf6"/>,     title: "Recurring Revenue on Autopilot", desc: "Set up automatic billing for your clients. Invoices go out, payments come in, books update — all without lifting a finger.", bullets: ["Auto-send invoices on schedule", "Auto-record payments", "Never chase a client again"], accent: "#8b5cf6", badge: "Coming Soon" },
    { icon: <CreditCard size={22} color="#8b5cf6"/>, title: "Banking Integration",             desc: "Connect your bank accounts and sync transactions in real time via Plaid.", bullets: ["Plaid bank connection", "Auto transaction sync", "Multi-bank support"], accent: "#8b5cf6" },
    { icon: <Calculator size={22} color="#ef4444"/>, title: "Tax Management",                  desc: "Track deductible expenses, calculate tax obligations, and prepare for filing effortlessly.", bullets: ["GST/HST calculation", "Deduction tracking", "Tax report export"], accent: "#ef4444" },
    { icon: <Users size={22} color="#0ea5e9"/>,      title: "Customer Management",             desc: "Manage clients, track outstanding balances, and maintain full relationship history.", bullets: ["Client profiles", "Outstanding balance tracking", "Invoice history"], accent: "#0ea5e9" },
    { icon: <TrendingUp size={22} color="#f59e0b"/>, title: "Dashboard Analytics",             desc: "Deep financial analytics with variance reports, budget tracking, and trend forecasting.", bullets: ["Variance reports", "Budget vs actual", "Trend forecasting"], accent: "#f59e0b" },
    { icon: <Building2 size={22} color="#8b5cf6"/>,  title: "Multi-Business Support",          desc: "Manage multiple companies or client accounts from a single Novala workspace.", bullets: ["Multiple entities", "Role-based access", "Consolidated reporting"], accent: "#8b5cf6" },
  ];

  const faqs = [
    { icon: <Brain size={14} color="#00D4A4"/>,      q: "How does Novala extract data from documents?",            a: "Novala uses advanced large language models combined with computer vision to read and understand financial documents. It extracts vendor names, amounts, dates, line items, and payment status with high accuracy." },
    { icon: <Shield size={14} color="#0ea5e9"/>,     q: "Is my financial data secure?",                            a: "Absolutely. Novala uses bank-grade AES-256 encryption, AWS infrastructure, and never shares your data with third parties. Your documents are stored in encrypted S3 buckets with strict access controls." },
    { icon: <RefreshCw size={14} color="#8b5cf6"/>,  q: "Can I import data from my existing accounting software?", a: "Yes. Novala integrates with QuickBooks, Xero, FreshBooks, and major banks. You can also import CSV files, PDFs, and connect directly via API." },
    { icon: <Bell size={14} color="#f59e0b"/>,       q: "How does the automated invoice follow-up work?",          a: "Novala detects overdue invoices and suggests follow-up emails. You review, edit the message, pick a date and time, and Novala sends a professional email with the invoice PDF attached automatically." },
    { icon: <CheckCircle size={14} color="#00D4A4"/>,q: "Is there a free trial?",                                  a: "Yes — all plans come with a 14-day free trial with full access to all features. No credit card required for the Essentials plan." },
    { icon: <Users size={14} color="#0ea5e9"/>,      q: "Can I use Novala for my team?",                           a: "Absolutely. Novala supports multi-user teams with role-based permissions, shared dashboards, and collaborative workflows. Enterprise plans include white-label options and dedicated support." },
  ];

  const steps = [
    { icon: <Upload size={26} color="#00D4A4"/>,     color: "#00D4A4", num: "01", title: "Upload Your Documents",      desc: "Drag and drop invoices, receipts, bank statements. Novala processes everything in seconds." },
    { icon: <Zap size={26} color="#0ea5e9"/>,        color: "#0ea5e9", num: "02", title: "Auto-Extracted & Organized", desc: "Novala reads, categorizes, and records all financial data automatically." },
    { icon: <TrendingUp size={26} color="#8b5cf6"/>, color: "#8b5cf6", num: "03", title: "Get Financial Insights",     desc: "Real-time dashboards, reports, and smart recommendations surface instantly." },
    { icon: <Rocket size={26} color="#f59e0b"/>,     color: "#f59e0b", num: "04", title: "Automate & Scale",           desc: "Set up automated follow-ups, recurring reports, and smart alerts — then grow." },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Inter',system-ui,sans-serif", background: "#E8F4F0", color: "#1A1A1A", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#00D4A4; border-radius:99px; }
        @keyframes float      { 0%,100%{transform:translateY(0)}           50%{transform:translateY(-12px)} }
        @keyframes floatSlow  { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-8px) rotate(1.5deg)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 30px rgba(0,212,164,0.2)} 50%{box-shadow:0 0 70px rgba(0,212,164,0.55)} }
        @keyframes ping       { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2.2);opacity:0} }
        @keyframes wave       { 0%,100%{transform:scaleY(0.5)} 50%{transform:scaleY(1.5)} }
        @keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
        .cta-primary {
          background:#00D4A4; color:#0A2540; border:none;
          padding:14px 30px; border-radius:13px; font-size:15px; font-weight:700;
          cursor:pointer; box-shadow:0 6px 24px rgba(0,212,164,0.35);
          transition:all 0.25s cubic-bezier(0.16,1,0.3,1); font-family:inherit; white-space:nowrap;
        }
        .cta-primary:hover  { transform:translateY(-2px) scale(1.02); box-shadow:0 12px 36px rgba(0,212,164,0.45); background:#00B88F; }
        .cta-primary:active { transform:scale(0.97); }
        .cta-secondary {
          background:#fff; color:#0A2540;
          border:1.5px solid #0A2540; padding:14px 30px;
          border-radius:13px; font-size:15px; font-weight:600; cursor:pointer;
          transition:all 0.25s cubic-bezier(0.16,1,0.3,1); font-family:inherit; white-space:nowrap;
        }
        .cta-secondary:hover { transform:translateY(-2px); background:#E8F4F0; box-shadow:0 8px 28px rgba(10,37,64,0.12); }
        .step-card { transition:all 0.4s cubic-bezier(0.16,1,0.3,1); cursor:default; }
        .step-card:hover { transform:translateY(-8px) !important; box-shadow:0 20px 50px rgba(0,212,164,0.12); }
        .step-card:hover .step-icon { transform:scale(1.15) rotate(5deg); }
        .step-icon { transition:all 0.35s cubic-bezier(0.16,1,0.3,1); }
        .stat-item { transition:all 0.3s cubic-bezier(0.16,1,0.3,1); padding:20px 16px; border-radius:18px; cursor:default; }
        .stat-item:hover { transform:translateY(-5px) scale(1.04); background:#E8F4F0; }
        .nav-pill { position:relative; }
        .nav-pill::after { content:''; position:absolute; bottom:-3px; left:0; right:0; height:2px; background:#00D4A4; transform:scaleX(0); transition:transform 0.25s ease; border-radius:99px; }
        .nav-pill:hover::after { transform:scaleX(1); }
        .desktop-only { display:flex !important; }
        .mobile-only  { display:none  !important; }
        .float-badge  { display:block !important; }
        @media (max-width:768px) {
          .desktop-only { display:none !important; }
          .mobile-only  { display:flex !important; }
          .float-badge  { display:none !important; }
        }
      `}</style>

      {/* ALL FEATURES MODAL */}
      {showAllFeatures && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(10,37,64,0.7)", backdropFilter:"blur(8px)", animation:"fadeIn 0.2s ease", display:"flex", alignItems:"flex-start", justifyContent:"center", overflowY:"auto", padding:"clamp(16px,3vw,40px)" }}>
          <div style={{ background:"#fff", borderRadius:28, width:"100%", maxWidth:1100, boxShadow:"0 40px 100px rgba(0,0,0,0.25)", animation:"slideInRight 0.4s cubic-bezier(0.16,1,0.3,1)", position:"relative" }}>
            <div style={{ padding:"28px 32px", borderBottom:"1px solid #E5E7EB", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#fff", borderRadius:"28px 28px 0 0", position:"sticky", top:0, zIndex:10 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#00D4A4", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Complete Feature Set</div>
                <h2 style={{ fontSize:"clamp(20px,3vw,28px)", fontWeight:800, color:"#0A2540", letterSpacing:"-0.03em" }}>Everything Novala can do</h2>
              </div>
              <button onClick={() => setShowAllFeatures(false)} style={{ width:40, height:40, borderRadius:12, background:"#E8F4F0", border:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#0A2540", transition:"all 0.2s ease" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(239,68,68,0.08)"; e.currentTarget.style.color="#ef4444"; }}
                onMouseLeave={e => { e.currentTarget.style.background="#E8F4F0"; e.currentTarget.style.color="#0A2540"; }}>
                <X size={18}/>
              </button>
            </div>
            <div style={{ padding:"clamp(20px,3vw,40px)" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:40 }}>
                {allFeatures.map((f,i) => (
                  <FeatureCard key={i} {...f} delay={i*0.04}/>
                ))}
              </div>
              <div style={{ background:"#0A2540", borderRadius:20, padding:"clamp(24px,4vw,40px)", textAlign:"center" }}>
                <h3 style={{ fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:"#fff", marginBottom:12, letterSpacing:"-0.03em" }}>Ready to get started?</h3>
                <p style={{ fontSize:15, color:"#94a3b8", marginBottom:28 }}>Join hundreds of businesses already using Novala.</p>
                <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
                  <button className="cta-primary" onClick={goToSignUp} style={{ fontSize:15, padding:"16px 36px" }}>Create Free Account →</button>
                  <button onClick={() => setShowAllFeatures(false)} style={{ fontSize:15, padding:"16px 28px", borderRadius:13, background:"rgba(255,255,255,0.08)", color:"#fff", border:"1px solid rgba(255,255,255,0.15)", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Back to Home</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background: scrollY>40 ? "rgba(255,255,255,0.97)" : "transparent", backdropFilter: scrollY>40 ? "blur(24px)" : "none", borderBottom: scrollY>40 ? "1px solid #E5E7EB" : "none", transition:"all 0.3s ease", padding:`0 ${px}` }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:66 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, flexShrink:0 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#0A2540", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(10,37,64,0.3)", flexShrink:0 }}>
              <svg width="17" height="17" viewBox="0 0 22 22" fill="none">
                <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#00D4A4" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="19" cy="9" r="2" fill="#00D4A4"/>
              </svg>
            </div>
            <span style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.03em", color:"#0A2540" }}>No<span style={{ color:"#00D4A4" }}>vala</span></span>
          </div>
          <div className="desktop-only" style={{ alignItems:"center", gap:30 }}>
            {navLinks.map(l => (
              <button key={l} className="nav-pill"
                onClick={() => { const el = document.getElementById(l.toLowerCase().replace(/ /g,"-")); if(el) el.scrollIntoView({behavior:"smooth"}); }}
                style={{ color:"#6B7280", fontSize:13.5, fontWeight:500, cursor:"pointer", transition:"color 0.2s", background:"none", border:"none", fontFamily:"inherit", position:"relative" }}
                onMouseEnter={e => e.target.style.color="#0A2540"}
                onMouseLeave={e => e.target.style.color="#6B7280"}>
                {l}
              </button>
            ))}
          </div>
          <div className="desktop-only" style={{ gap:9 }}>
            <button className="cta-secondary" style={{ padding:"10px 20px", fontSize:13.5 }} onClick={goToApp}>Sign In</button>
            <button className="cta-primary" style={{ padding:"10px 22px", fontSize:13.5 }} onClick={goToSignUp}>Register Free →</button>
          </div>
          <button className="mobile-only" onClick={() => setMenuOpen(o => !o)}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#0A2540", alignItems:"center", justifyContent:"center", padding:8, borderRadius:10, transition:"background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background="#E8F4F0"}
            onMouseLeave={e => e.currentTarget.style.background="none"}>
            {menuOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
        {/* Mobile Menu */}
        <div style={{ position:"fixed", top:66, left:0, right:0, background:"rgba(255,255,255,0.99)", backdropFilter:"blur(28px)", borderBottom: menuOpen ? "1px solid #E5E7EB" : "none", padding: menuOpen ? "20px 24px 32px" : "0 24px", maxHeight: menuOpen ? "100vh" : 0, overflow:"hidden", transition:"max-height 0.45s cubic-bezier(0.16,1,0.3,1), padding 0.3s ease", zIndex:99, display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {[...navLinks, "Security"].map((l,i) => (
              <button key={l}
                onClick={() => { setMenuOpen(false); setTimeout(() => { const el = document.getElementById(l.toLowerCase().replace(/ /g,"-")); if(el) el.scrollIntoView({behavior:"smooth"}); }, 350); }}
                style={{ textAlign:"left", padding:"15px 0", fontSize:17, fontWeight:600, color:"#0A2540", background:"none", border:"none", borderBottom: i < navLinks.length ? "1px solid #E5E7EB" : "none", cursor:"pointer", fontFamily:"inherit", opacity: menuOpen ? 1 : 0, transform: menuOpen ? "none" : "translateX(-12px)", transition:`opacity 0.3s ease ${i*0.04}s, transform 0.3s ease ${i*0.04}s, color 0.2s` }}
                onMouseEnter={e => e.currentTarget.style.color="#00D4A4"}
                onMouseLeave={e => e.currentTarget.style.color="#0A2540"}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:24 }}>
            <button className="cta-primary" style={{ padding:"16px", fontSize:15, width:"100%", textAlign:"center", borderRadius:13 }} onClick={() => { setMenuOpen(false); goToSignUp(); }}>Register Free — No Card Needed →</button>
            <button className="cta-secondary" style={{ padding:"16px", fontSize:15, width:"100%", textAlign:"center", borderRadius:13 }} onClick={() => { setMenuOpen(false); goToApp(); }}>Sign In to Dashboard</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:`100px ${px} 60px`, background:"radial-gradient(ellipse 80% 60% at 50% -10%,rgba(0,212,164,0.11) 0%,transparent 70%),linear-gradient(180deg,#E8F4F0 0%,#fff 100%)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", width:"100%" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:60, alignItems:"center" }}>

            {/* Left — Text */}
            <div style={{ textAlign:"left" }}>
              <Reveal delay={0}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#E8F4F0", border:"1px solid rgba(0,212,164,0.3)", borderRadius:99, padding:"6px 18px", marginBottom:30 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:"#00D4A4", animation:"pulse-glow 2s infinite" }}/>
                  <span style={{ fontSize:11, fontWeight:700, color:"#0A2540", letterSpacing:"0.1em", textTransform:"uppercase" }}>Effortless Financial Clarity</span>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <h1 style={{ fontSize:"clamp(38px,5.5vw,72px)", fontWeight:800, lineHeight:1.06, letterSpacing:"-0.045em", color:"#0A2540", marginBottom:22 }}>
                  Effortless <span style={{ color:"#00D4A4" }}>financial clarity.</span>
                </h1>
              </Reveal>

              <Reveal delay={0.18}>
                <p style={{ fontSize:"clamp(15px,2.2vw,19px)", color:"#6B7280", lineHeight:1.7, maxWidth:520, marginBottom:38, fontWeight:400 }}>
                  Novala automates your bookkeeping, invoicing, and reporting — so you can focus on growing your business.
                </p>
              </Reveal>

              <Reveal delay={0.26}>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:28 }}>
                  <button className="cta-primary" onClick={goToSignUp} style={{ fontSize:15, padding:"16px 38px" }}>Create Free Account →</button>
                  <button className="cta-secondary" onClick={goToApp} style={{ fontSize:15, padding:"16px 38px" }}>Sign In to Dashboard</button>
                </div>
              </Reveal>

              <Reveal delay={0.32}>
                <div style={{ display:"flex", alignItems:"center", gap:"clamp(10px,3vw,24px)", flexWrap:"wrap" }}>
                  {["✓ 14-day free trial","✓ No credit card required","✓ Cancel anytime","✓ Bank-grade security"].map(t => (
                    <span key={t} style={{ fontSize:12.5, color:"#6B7280", fontWeight:500 }}>{t}</span>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right — Orbital Animation */}
            <Reveal delay={0.4} direction="right">
              <OrbitalAnimation/>
            </Reveal>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding:`52px ${px}`, background:"#fff", borderTop:"1px solid #E5E7EB", borderBottom:"1px solid #E5E7EB" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"clamp(16px,4vw,40px)" }}>
            {[
              { value:98,    suffix:"%",   label:"Accuracy Rate",         icon:<Brain size={20} color="#00D4A4"/>       },
              { value:10000, suffix:"+",   label:"Documents Processed",   icon:<FileText size={20} color="#0ea5e9"/>    },
              { value:500,   suffix:"+",   label:"Businesses Served",     icon:<Building2 size={20} color="#8b5cf6"/>   },
              { value:40,    suffix:"hrs", label:"Saved Per Month",        icon:<Zap size={20} color="#f59e0b"/>         },
            ].map((s,i) => (
              <Reveal key={i} delay={i*0.1} pop={true}>
                <div className="stat-item" style={{ textAlign:"center" }}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>{s.icon}</div>
                  <div style={{ fontSize:"clamp(30px,5vw,50px)", fontWeight:800, letterSpacing:"-0.04em", color:"#0A2540", marginBottom:6 }}>
                    <Counter end={s.value} suffix={s.suffix}/>
                  </div>
                  <div style={{ fontSize:13, color:"#6B7280", fontWeight:500 }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding:`88px ${px}`, background:"linear-gradient(180deg,#fff,#E8F4F0)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:11, fontWeight:700, color:"#0A2540", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, background:"#E8F4F0", padding:"6px 16px", borderRadius:99 }}>
                <Layers size={13} color="#00D4A4"/> Everything You Need
              </div>
              <h2 style={{ fontSize:"clamp(28px,5vw,52px)", fontWeight:800, letterSpacing:"-0.035em", color:"#0A2540", marginBottom:14, lineHeight:1.08 }}>
                Software that actually understands<br/>your finances
              </h2>
              <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"#6B7280", maxWidth:500, margin:"0 auto", lineHeight:1.65 }}>
                Every feature is designed to save time and give you clarity — not add complexity.
              </p>
            </div>
          </Reveal>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:36 }}>
            {allFeatures.slice(0,6).map((f,i) => (
              <FeatureCard key={i} {...f} delay={i*0.07}/>
            ))}
          </div>

          {/* Recurring Revenue highlight card */}
          <Reveal delay={0.1}>
            <div style={{ background:"linear-gradient(135deg,#0A2540,#0d3060)", borderRadius:24, padding:"clamp(28px,4vw,48px)", marginBottom:36, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:32, alignItems:"center" }}>
              <div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(0,212,164,0.15)", border:"1px solid rgba(0,212,164,0.3)", borderRadius:99, padding:"4px 14px", marginBottom:16 }}>
                  <Repeat size={11} color="#00D4A4"/>
                  <span style={{ fontSize:10, fontWeight:700, color:"#00D4A4", letterSpacing:"0.1em", textTransform:"uppercase" }}>Coming Soon</span>
                </div>
                <h3 style={{ fontSize:"clamp(22px,3vw,34px)", fontWeight:800, color:"#fff", marginBottom:14, letterSpacing:"-0.03em", lineHeight:1.15 }}>
                  Recurring Revenue<br/><span style={{ color:"#00D4A4" }}>on Autopilot</span>
                </h3>
                <p style={{ fontSize:15, color:"#94a3b8", lineHeight:1.7, marginBottom:24, maxWidth:440 }}>
                  Set up automatic billing for your clients. Invoices go out, payments come in, books update — all without lifting a finger. Predictable income, zero manual work.
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    { icon:<ArrowUpCircle size={14} color="#00D4A4"/>, text:"Auto-send invoices on your schedule" },
                    { icon:<DollarSign size={14} color="#00D4A4"/>,    text:"Auto-record payments when received"  },
                    { icon:<RefreshCw size={14} color="#00D4A4"/>,     text:"Never chase a client payment again"  },
                    { icon:<PieChart size={14} color="#00D4A4"/>,      text:"Predictable monthly revenue reports"  },
                  ].map((item,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:"rgba(0,212,164,0.1)", border:"1px solid rgba(0,212,164,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{item.icon}</div>
                      <span style={{ fontSize:13.5, color:"#cbd5e1", fontWeight:500 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(0,212,164,0.2)", borderRadius:20, padding:28, backdropFilter:"blur(20px)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#00D4A4", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:"#00D4A4", animation:"pulse-glow 2s infinite" }}/>
                  Recurring Billing Preview
                </div>
                {[
                  { client:"Brightcare Health",  amount:"$2,400", status:"Sent",      color:"#00D4A4", day:"1st" },
                  { client:"Acme Corp",          amount:"$1,800", status:"Paid",      color:"#0ea5e9", day:"15th"},
                  { client:"River Design Co.",   amount:"$950",   status:"Scheduled", color:"#f59e0b", day:"28th"},
                  { client:"Summit Consulting",  amount:"$3,200", status:"Paid",      color:"#00D4A4", day:"1st" },
                ].map((item,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    <div>
                      <div style={{ fontSize:12.5, color:"#e2e8f0", fontWeight:600 }}>{item.client}</div>
                      <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>Every month · {item.day}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{item.amount}</div>
                      <div style={{ fontSize:10, fontWeight:600, color:item.color, marginTop:2 }}>{item.status}</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:16, padding:"10px 14px", borderRadius:10, background:"rgba(0,212,164,0.1)", border:"1px solid rgba(0,212,164,0.2)", display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:"#00D4A4", fontWeight:700 }}>Monthly Recurring</span>
                  <span style={{ fontSize:13, color:"#00D4A4", fontWeight:800 }}>$8,350</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div style={{ textAlign:"center" }}>
              <button
                onClick={() => setShowAllFeatures(true)}
                style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 32px", borderRadius:13, background:"transparent", border:"1.5px solid #0A2540", color:"#0A2540", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.25s ease" }}
                onMouseEnter={e => { e.currentTarget.style.background="#E8F4F0"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.transform="none"; }}>
                View All 12 Features <ArrowRight size={16}/>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding:`88px ${px}`, background:"#fff" }}>
        <div style={{ maxWidth:980, margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:11, fontWeight:700, color:"#0A2540", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, background:"#E8F4F0", padding:"6px 16px", borderRadius:99 }}>
                <Zap size={13} color="#00D4A4"/> Simple Process
              </div>
              <h2 style={{ fontSize:"clamp(28px,5vw,50px)", fontWeight:800, letterSpacing:"-0.035em", color:"#0A2540", lineHeight:1.08 }}>
                From upload to insight<br/>in seconds
              </h2>
            </div>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:18 }}>
            {steps.map((s,i) => (
              <Reveal key={i} delay={i*0.1} pop={true}>
                <div className="step-card" style={{ textAlign:"center", padding:"28px 18px", borderRadius:20, border:`1px solid ${s.color}20`, background:"#fff" }}>
                  <div className="step-icon" style={{ width:62, height:62, borderRadius:17, margin:"0 auto 18px", background:`${s.color}12`, border:`1px solid ${s.color}25`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize:10, fontWeight:800, color:s.color, letterSpacing:"0.12em", marginBottom:9 }}>{s.num}</div>
                  <h3 style={{ fontSize:15.5, fontWeight:700, color:"#0A2540", marginBottom:9, letterSpacing:"-0.02em" }}>{s.title}</h3>
                  <p style={{ fontSize:13, color:"#6B7280", lineHeight:1.65 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS ENGINE SECTION */}
      <section id="how-it-works-engine" style={{ padding:`88px ${px}`, background:"linear-gradient(140deg,#0A2540 0%,#0c2418 60%,#0A2540 100%)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"15%", left:"8%", width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,212,164,0.09),transparent)", filter:"blur(60px)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:"15%", right:"8%", width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,212,164,0.06),transparent)", filter:"blur(50px)", pointerEvents:"none" }}/>
        <div style={{ maxWidth:1100, margin:"0 auto", position:"relative" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:"clamp(32px,6vw,72px)", alignItems:"center" }}>
            <Reveal direction="left">
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#00D4A4", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:18 }}>How It Works</div>
                <h2 style={{ fontSize:"clamp(26px,4vw,48px)", fontWeight:800, color:"#fff", marginBottom:18, lineHeight:1.12, letterSpacing:"-0.035em" }}>
                  A smart co-pilot for your entire financial operation
                </h2>
                <p style={{ fontSize:"clamp(13px,1.8vw,16px)", color:"#94a3b8", lineHeight:1.75, marginBottom:30 }}>
                  Novala doesn't just extract data — it understands context, detects anomalies, predicts cash flow, and proactively flags issues before they become problems.
                </p>
                {[
                  { icon:<Brain size={14} color="#00D4A4"/>,      text:"Semantic document understanding"    },
                  { icon:<Shield size={14} color="#00D4A4"/>,     text:"Anomaly & duplicate detection"      },
                  { icon:<Search size={14} color="#00D4A4"/>,     text:"Natural language financial queries" },
                  { icon:<Bell size={14} color="#00D4A4"/>,       text:"Automated follow-up scheduling"     },
                  { icon:<TrendingUp size={14} color="#00D4A4"/>, text:"Predictive cash flow insights"      },
                ].map((f,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:13, transition:"transform 0.2s ease" }}
                    onMouseEnter={e => e.currentTarget.style.transform="translateX(6px)"}
                    onMouseLeave={e => e.currentTarget.style.transform="none"}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(0,212,164,0.1)", border:"1px solid rgba(0,212,164,0.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{f.icon}</div>
                    <span style={{ fontSize:13.5, color:"#cbd5e1", fontWeight:500 }}>{f.text}</span>
                  </div>
                ))}
                <button className="cta-primary" onClick={goToSignUp} style={{ marginTop:28, padding:"14px 30px", fontSize:14 }}>
                  Start Free Today →
                </button>
              </div>
            </Reveal>
            <Reveal direction="right">
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(0,212,164,0.18)", borderRadius:20, padding:"clamp(18px,3vw,26px)", backdropFilter:"blur(20px)", animation:"float 5s ease-in-out infinite" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#00D4A4", marginBottom:18, display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:"#00D4A4", animation:"pulse-glow 2s infinite" }}/>
                    Processing Engine
                  </div>
                  {[
                    { label:"Document Reading",  pct:100, color:"#00D4A4" },
                    { label:"Data Extraction",   pct:97,  color:"#0ea5e9" },
                    { label:"Categorization",    pct:94,  color:"#8b5cf6" },
                    { label:"Anomaly Detection", pct:99,  color:"#f59e0b" },
                  ].map((item,i) => (
                    <div key={i} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:12, color:"#94a3b8", fontWeight:500 }}>{item.label}</span>
                        <span style={{ fontSize:12, color:item.color, fontWeight:700 }}>{item.pct}%</span>
                      </div>
                      <div style={{ height:5, background:"rgba(255,255,255,0.07)", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${item.pct}%`, background:item.color, borderRadius:99, boxShadow:`0 0 8px ${item.color}` }}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(0,212,164,0.18)", borderRadius:16, padding:"18px 20px", backdropFilter:"blur(20px)" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#64748b", marginBottom:12, textTransform:"uppercase", letterSpacing:"0.06em" }}>Live Activity</div>
                  {[
                    { text:"✓ Invoice #1042 processed — $8,750", time:"2s ago",   color:"#00D4A4" },
                    { text:"✓ 3 duplicates detected & flagged",  time:"14s ago",  color:"#f59e0b" },
                    { text:"✓ Follow-up sent to Brenda R.",      time:"2min ago", color:"#0ea5e9" },
                  ].map((a,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom: i<2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <span style={{ fontSize:12, color:"#e2e8f0", fontWeight:500 }}>{a.text}</span>
                      <span style={{ fontSize:10, color:a.color, fontWeight:600, flexShrink:0, marginLeft:8 }}>{a.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding:`88px ${px}`, background:"linear-gradient(180deg,#E8F4F0,#fff)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:11, fontWeight:700, color:"#0A2540", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, background:"#E8F4F0", padding:"6px 16px", borderRadius:99 }}>
                <CreditCard size={13} color="#00D4A4"/> Simple Pricing
              </div>
              <h2 style={{ fontSize:"clamp(28px,5vw,52px)", fontWeight:800, letterSpacing:"-0.035em", color:"#0A2540", lineHeight:1.08, marginBottom:14 }}>
                Start free. Scale with confidence.
              </h2>
              <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"#6B7280", maxWidth:420, margin:"0 auto" }}>14-day free trial on all plans. No credit card required to start.</p>
            </div>
          </Reveal>
          <div style={{ display:"flex", gap:18, justifyContent:"center", flexWrap:"wrap", alignItems:"flex-start" }}>
            {[
              { plan:"Essentials", price:"20",     color:"#00D4A4", icon:<Zap size={20} color="#00D4A4"/>,         desc:"Perfect for freelancers and solo businesses.",      features:["Up to 100 documents/month","Automatic data extraction","Basic invoicing","Financial dashboard","Email support","14-day free trial"],                                                            cta:"Start Free Trial", popular:false },
              { plan:"Premium",    price:"30",     color:"#0ea5e9", icon:<Sparkles size={20} color="#0ea5e9"/>,    desc:"For growing businesses that need full automation.", features:["Unlimited documents","Automated follow-up emails","Smart Search (RAG)","Advanced reports","Bill pay & reconciliation","Tax tools","Priority support"],                                          cta:"Start Free Trial", popular:true  },
              { plan:"Enterprise", price:"Custom", color:"#8b5cf6", icon:<Briefcase size={20} color="#8b5cf6"/>,  desc:"For teams needing scale, compliance, and control.", features:["Everything in Premium","Multi-user & roles","White-label option","API access","Custom integrations","Accountant portal","Dedicated success manager"],                                          cta:"Contact Sales",    popular:false },
            ].map((p,i) => (
              <Reveal key={i} delay={i*0.1} pop={true}>
                <PricingCard {...p} onSignUp={p.price==="Custom" ? () => window.location.href="mailto:support@getnovala.com" : goToSignUp}/>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding:`88px ${px}`, background:"#fff" }}>
        <div style={{ maxWidth:700, margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:11, fontWeight:700, color:"#0A2540", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, background:"#E8F4F0", padding:"6px 16px", borderRadius:99 }}>
                <HelpCircle size={13} color="#00D4A4"/> FAQ
              </div>
              <h2 style={{ fontSize:"clamp(26px,5vw,44px)", fontWeight:800, letterSpacing:"-0.035em", color:"#0A2540", lineHeight:1.12 }}>Common questions</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            {faqs.map((f,i) => <FAQ key={i} q={f.q} a={f.a} icon={f.icon}/>)}
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding:`88px ${px}`, background:"#0A2540", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 60% at 50% 50%,rgba(0,212,164,0.08),transparent)", pointerEvents:"none" }}/>
        <div style={{ maxWidth:660, margin:"0 auto", textAlign:"center", position:"relative" }}>
          <Reveal>
            <div style={{ width:66, height:66, borderRadius:19, background:"#00D4A4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 26px", boxShadow:"0 0 50px rgba(0,212,164,0.42)", animation:"pulse-glow 3s infinite" }}>
              <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
                <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#0A2540" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="19" cy="9" r="2" fill="#0A2540"/>
              </svg>
            </div>
            <h2 style={{ fontSize:"clamp(28px,5.5vw,54px)", fontWeight:800, color:"#fff", marginBottom:18, lineHeight:1.08, letterSpacing:"-0.04em" }}>
              Ready to transform how you<br/><span style={{ color:"#00D4A4" }}>manage your finances?</span>
            </h2>
            <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"#94a3b8", marginBottom:38, lineHeight:1.65 }}>
              Join hundreds of businesses already saving hours every week with Novala's effortless financial intelligence platform.
            </p>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:24 }}>
              <button className="cta-primary" onClick={goToSignUp} style={{ fontSize:15, padding:"16px 38px" }}>Create Free Account →</button>
              <button onClick={goToApp} style={{ fontSize:15, padding:"16px 32px", borderRadius:13, background:"rgba(255,255,255,0.07)", color:"#fff", border:"1px solid rgba(255,255,255,0.14)", cursor:"pointer", fontFamily:"inherit", fontWeight:600, transition:"all 0.25s ease" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.12)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.07)"; e.currentTarget.style.transform="none"; }}>
                Sign In
              </button>
            </div>
            <p style={{ fontSize:12.5, color:"#475569" }}>14-day free trial · No credit card required · Cancel anytime</p>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:`48px ${px} 32px`, background:"#080f1a", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", marginBottom:48, paddingBottom:36, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            {[
              { icon:<Lock size={13}/>,     label:"Bank-grade Security",      sub:"AES-256 Encrypted"    },
              { icon:<Cloud size={13}/>,    label:"AWS Hosted",               sub:"us-east-2 Region"     },
              { icon:<Shield size={13}/>,   label:"SOC 2 Ready",              sub:"Enterprise Compliant" },
              { icon:<Database size={13}/>, label:"Encrypted Infrastructure", sub:"Zero Data Sharing"    },
              { icon:<Star size={13}/>,     label:"99.9% Uptime",             sub:"SLA Guaranteed"       },
            ].map(b => (
              <div key={b.label} style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"10px 16px", transition:"all 0.2s ease" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(0,212,164,0.2)"; e.currentTarget.style.background="rgba(0,212,164,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"; e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}>
                <div style={{ color:"#00D4A4" }}>{b.icon}</div>
                <div>
                  <div style={{ fontSize:11.5, fontWeight:700, color:"#e2e8f0" }}>{b.label}</div>
                  <div style={{ fontSize:10, color:"#475569" }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"clamp(24px,4vw,44px)", marginBottom:44 }}>
            <div style={{ gridColumn:"span 1" }}>
              <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:"#0A2540", border:"1px solid rgba(0,212,164,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="15" height="15" viewBox="0 0 22 22" fill="none">
                    <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#00D4A4" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize:18, fontWeight:800, color:"#fff", letterSpacing:"-0.03em" }}>No<span style={{ color:"#00D4A4" }}>vala</span></span>
              </div>
              <p style={{ fontSize:12.5, color:"#475569", lineHeight:1.7, maxWidth:230 }}>Effortless financial intelligence for modern businesses and teams.</p>
              <div style={{ display:"flex", gap:8, marginTop:18 }}>
                {["𝕏","in","gh"].map(s => (
                  <div key={s} style={{ width:32, height:32, borderRadius:9, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:12, color:"#64748b", fontWeight:700, transition:"all 0.2s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(0,212,164,0.25)"; e.currentTarget.style.color="#00D4A4"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"; e.currentTarget.style.color="#64748b"; }}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
            {[
              { title:"Product",   links:["Features","Pricing","How It Works","Integrations","API"] },
              { title:"Company",   links:["About","Blog","Careers","Press","Contact"]               },
              { title:"Resources", links:["Documentation","Help Center","Status","Changelog"]       },
              { title:"Legal",     links:["Privacy Policy","Terms of Service","Cookie Policy","Security"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize:10.5, fontWeight:700, color:"#94a3b8", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:16 }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize:13, color:"#475569", marginBottom:10, cursor:"pointer", transition:"color 0.2s, transform 0.2s", display:"flex", alignItems:"center", gap:4 }}
                    onMouseEnter={e => { e.currentTarget.style.color="#00D4A4"; e.currentTarget.style.transform="translateX(4px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color="#475569"; e.currentTarget.style.transform="none"; }}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:22, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <span style={{ fontSize:12.5, color:"#334155" }}>2026 Novala Technologies Inc. All rights reserved.</span>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
              {[
                { icon:<Lock size={11}/>,   text:"Encrypted" },
                { icon:<Cloud size={11}/>,  text:"AWS"       },
                { icon:<Shield size={11}/>, text:"SOC 2"     },
              ].map(b => (
                <span key={b.text} style={{ fontSize:11, color:"#334155", fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ color:"#00D4A4" }}>{b.icon}</span>{b.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}