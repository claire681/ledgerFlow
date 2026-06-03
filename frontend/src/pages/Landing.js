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
  LayoutGrid, Info, Tag,
} from "lucide-react";

const C = {
  bg:         "#FFFFFF",
  bgCard:     "#F5F7F7",
  bgCardHov:  "#EDF1F1",
  border:     "rgba(14,26,26,0.08)",
  borderHov:  "rgba(15,149,153,0.35)",
  accent:     "#0F9599",
  accentDim:  "#0B7377",
  accentGlow: "rgba(15,149,153,0.18)",
  cyan:       "#22D3EE",
  cyanGlow:   "rgba(34,211,238,0.15)",
  text:       "#F0F4F8",
  textSub:    "#94A3B8",
  textMuted:  "#475569",
  navy:       "#0E1A1A",
};

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

function FloatingMarquee() {
  const items = [
    { icon: <FileText size={14} color={C.accent}/>,   label: "Invoice processed",    val: "$8,750",  color: C.accent },
    { icon: <Shield size={14} color={C.cyan}/>,       label: "Bank-grade security",  val: "AES-256", color: C.cyan  },
    { icon: <TrendingUp size={14} color="#8b5cf6"/>,  label: "Revenue this month",   val: "$124K",   color: "#8b5cf6" },
    { icon: <CheckCircle size={14} color={C.accent}/>,label: "Duplicate detected",   val: "Flagged", color: C.accent },
    { icon: <Zap size={14} color="#f59e0b"/>,         label: "Auto-categorized",     val: "47 txns", color: "#f59e0b" },
    { icon: <Bell size={14} color={C.cyan}/>,         label: "Follow-up sent",       val: "Inv#1042",color: C.cyan  },
    { icon: <BarChart3 size={14} color="#8b5cf6"/>,   label: "Cash flow forecast",   val: "+18.4%",  color: "#8b5cf6"},
    { icon: <RefreshCw size={14} color={C.accent}/>,  label: "Reconciled",           val: "247 docs",color: C.accent },
  ];
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: "hidden", position: "relative", padding: "16px 0", maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)" }}>
      <div style={{ display: "flex", gap: 12, animation: "marquee 28s linear infinite", width: "max-content" }}>
        {doubled.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 12, background: C.bgCard, border: `1px solid ${item.color}25`, backdropFilter: "blur(12px)", flexShrink: 0, minWidth: 180 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.textSub, fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: item.color, fontWeight: 700 }}>{item.val}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FAQ({ q, a, icon }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{
      borderRadius: 14,
      border: `1px solid ${open ? "rgba(15,149,153,0.25)" : C.border}`,
      background: open ? "rgba(15,149,153,0.04)" : C.bgCard,
      marginBottom: 10, cursor: "pointer", transition: "all 0.3s ease", overflow: "hidden",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          {icon && (
            <div style={{ width: 32, height: 32, borderRadius: 9, background: open ? "rgba(15,149,153,0.12)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s ease" }}>
              {icon}
            </div>
          )}
          <span style={{ fontWeight: 600, fontSize: 14, color: C.text, lineHeight: 1.4 }}>{q}</span>
        </div>
        <ChevronDown size={17} color={C.accent} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.3s ease" }}/>
      </div>
      <div style={{ maxHeight: open ? 300 : 0, overflow: "hidden", transition: "max-height 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ padding: "0 22px 18px 66px", fontSize: 13.5, color: C.textSub, lineHeight: 1.75 }}>{a}</div>
      </div>
    </div>
  );
}
function FeatureCard({ icon, title, desc, bullets, accent = C.accent, delay = 0, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <Reveal delay={delay} pop={true}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          borderRadius: 20, padding: "28px 26px",
          background: hov ? C.bgCardHov : C.bgCard,
          border: `1px solid ${hov ? `${accent}40` : C.border}`,
          boxShadow: hov ? `0 20px 60px ${accent}18, 0 0 0 1px ${accent}20` : "none",
          transform: hov ? "translateY(-6px)" : "none",
          transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
          height: "100%", display: "flex", flexDirection: "column", position: "relative",
          backdropFilter: "blur(12px)",
        }}
      >
        {badge && (
          <div style={{ position: "absolute", top: 16, right: 16, fontSize: 9, fontWeight: 700, color: C.accent, background: "rgba(15,149,153,0.1)", border: "1px solid rgba(15,149,153,0.3)", padding: "3px 10px", borderRadius: 20, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {badge}
          </div>
        )}
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${accent}15`, border: `1px solid ${accent}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, flexShrink: 0, transition: "all 0.35s ease", transform: hov ? "scale(1.1) rotate(-4deg)" : "none", boxShadow: hov ? `0 0 20px ${accent}40` : "none" }}>
          {icon}
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 10, letterSpacing: "-0.02em", lineHeight: 1.3 }}>{title}</h3>
        <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.7, marginBottom: bullets ? 16 : 0, flex: 1 }}>{desc}</p>
        {bullets && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {bullets.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={9} color={accent} strokeWidth={3}/>
                </div>
                <span style={{ fontSize: 12, color: C.textSub, fontWeight: 500 }}>{b}</span>
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
        border: popular ? `1px solid ${C.accent}50` : `1px solid ${C.border}`,
        background: popular ? `linear-gradient(135deg, rgba(15,149,153,0.08), rgba(34,211,238,0.05))` : C.bgCard,
        position: "relative",
        transform: hov ? "translateY(-10px)" : popular ? "translateY(-6px)" : "none",
        boxShadow: popular ? `0 24px 70px rgba(15,149,153,0.12), 0 0 0 1px rgba(15,149,153,0.2)` : hov ? `0 20px 60px rgba(0,0,0,0.4)` : "none",
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
        backdropFilter: "blur(20px)",
      }}
    >
      {popular && (
        <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: C.accent, color: C.navy, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", padding: "4px 18px", borderRadius: 20, textTransform: "uppercase", whiteSpace: "nowrap", boxShadow: `0 4px 20px ${C.accentGlow}` }}>Most Popular</div>
      )}
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: `0 0 20px ${color}20` }}>
        {icon}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: popular ? C.accent : C.textSub, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{plan}</div>
      <div style={{ fontSize: 40, fontWeight: 800, color: C.text, marginBottom: 6, letterSpacing: "-0.04em" }}>
        {price === "Custom" ? "Custom" : <>${price}<span style={{ fontSize: 14, fontWeight: 500, opacity: 0.5 }}>/mo</span></>}
      </div>
      <div style={{ fontSize: 13, color: C.textSub, marginBottom: 26, lineHeight: 1.5 }}>{desc}</div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 24 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 11 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(15,149,153,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <Check size={10} color={C.accent} strokeWidth={3}/>
            </div>
            <span style={{ fontSize: 13, color: C.textSub, lineHeight: 1.4 }}>{f}</span>
          </div>
        ))}
      </div>
      <button onClick={onSignUp}
        style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: popular ? C.accent : "rgba(14,26,26,0.08)", color: popular ? C.navy : C.text, border: popular ? "none" : `1px solid ${C.border}`, cursor: "pointer", fontSize: 14, fontWeight: 700, transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)", boxShadow: popular ? `0 4px 20px ${C.accentGlow}` : "none", fontFamily: "inherit" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = popular ? `0 8px 32px ${C.accentGlow}` : "none"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = popular ? `0 4px 20px ${C.accentGlow}` : "none"; }}>
        {cta}
      </button>
    </div>
  );
}

function OrbitalAnimation() {
  const ORBIT_ICONS = [
    { Icon: FileText,   color: "#22D3EE", label: "Invoice"   },
    { Icon: Receipt,    color: "#0F9599", label: "Receipt"   },
    { Icon: BarChart3,  color: "#8b5cf6", label: "Reports"   },
    { Icon: GitMerge,   color: "#f59e0b", label: "Reconcile" },
    { Icon: CreditCard, color: "#ef4444", label: "Bill Pay"  },
    { Icon: Calculator, color: "#0F9599", label: "Tax"       },
    { Icon: ScanLine,   color: "#22D3EE", label: "Scanner"   },
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
      <div style={{ position: "absolute", inset: -40, borderRadius: "50%", background: "radial-gradient(circle, rgba(15,149,153,0.06) 0%, rgba(34,211,238,0.03) 50%, transparent 70%)", pointerEvents: "none" }}/>
      <div style={{ position: "absolute", top: cx - R2, left: cx - R2, width: R2 * 2, height: R2 * 2, borderRadius: "50%", border: "1px solid rgba(15,149,153,0.12)", boxShadow: "0 0 40px rgba(15,149,153,0.04) inset" }}/>
      <div style={{ position: "absolute", top: cx - R1, left: cx - R1, width: R1 * 2, height: R1 * 2, borderRadius: "50%", border: "1px solid rgba(34,211,238,0.18)", boxShadow: "0 0 30px rgba(34,211,238,0.06) inset" }}/>

      <div style={{
      position:"absolute",
      left:cx - 56,
      top:cx - 56,
      width:112,
      height:112,
      borderRadius:"50%",
      border:`1.5px solid ${C.accent}`,
      boxShadow:`0 0 18px ${C.accent}`,
      pointerEvents:"none",
      willChange:"transform, opacity",
      animation:"core-pulse 3.6s cubic-bezier(0.22,1,0.36,1) infinite"
    }}/>

    {ORBIT_ICONS.slice(0, 4).map((item, i) => {
        const deg = angle + (i * 360) / 4;
        const rad = (deg * Math.PI) / 180;
        const x = cx + R1 * Math.cos(rad) - 22;
        const y = cx + R1 * Math.sin(rad) - 22;
        const Icon = item.Icon;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 44, height: 44, borderRadius: 12, background: "rgba(8,9,13,0.9)", border: `1px solid ${item.color}30`, boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 16px ${item.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2, backdropFilter: "blur(12px)" }}>
            <Icon size={18} color={item.color} strokeWidth={2}/>
            <span style={{ fontSize: 6, fontWeight: 800, color: item.color, letterSpacing: "0.08em" }}>{item.label.toUpperCase()}</span>
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
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 52, height: 52, borderRadius: 14, background: "rgba(8,9,13,0.9)", border: `1px solid ${item.color}25`, boxShadow: `0 6px 24px rgba(0,0,0,0.5), 0 0 20px ${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2, backdropFilter: "blur(12px)" }}>
            <Icon size={22} color={item.color} strokeWidth={2}/>
            <span style={{ fontSize: 6, fontWeight: 800, color: item.color, letterSpacing: "0.08em" }}>{item.label.toUpperCase()}</span>
          </div>
        );
      })}

      <div style={{ position: "absolute", left: cx - 56, top: cx - 56, width: 112, height: 112, borderRadius: 30, background: "linear-gradient(135deg, rgba(15,149,153,0.15) 0%, rgba(8,9,13,0.95) 60%)", border: "1px solid rgba(15,149,153,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 0 60px rgba(15,149,153,0.2), 0 0 120px rgba(15,149,153,0.08), 0 8px 32px rgba(0,0,0,0.6)", zIndex: 10, backdropFilter: "blur(20px)" }}>
        <svg width="34" height="34" viewBox="0 0 22 22" fill="none" style={{ marginBottom: 5 }}>
          <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke={C.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="19" cy="9" r="2" fill={C.accent}/>
        </svg>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>No<span style={{ color: C.accent }}>vala</span></span>
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

  const navLinks = [
    { label: "Features",     icon: <Layers size={13}/>,     id: "features"     },
    { label: "How It Works", icon: <Zap size={13}/>,        id: "how-it-works" },
    { label: "Pricing",      icon: <Tag size={13}/>,        id: "pricing"      },
    { label: "FAQ",          icon: <HelpCircle size={13}/>, id: "faq"          },
  ];

  const px = "clamp(16px, 5vw, 80px)";

  const allFeatures = [
    { icon: <Brain size={22} color={C.accent}/>,      title: "Smart Financial Intelligence",    desc: "Upload any document — automatically reads, understands, and records every financial detail instantly.", bullets: ["Auto-extract vendor, amount, date", "High-accuracy classification", "Works with PDFs, images, CSVs"], accent: C.accent },
    { icon: <FileText size={22} color={C.cyan}/>,     title: "Professional Invoicing",          desc: "Create stunning branded invoices in seconds. Track, send, and get paid faster.", bullets: ["Custom logo & branding", "PDF generation & download", "Payment status tracking"], accent: C.cyan },
    { icon: <BarChart3 size={22} color="#8b5cf6"/>,   title: "Live Financial Dashboard",        desc: "Real-time revenue, expenses, and cash flow — always beautifully visualized.", bullets: ["Live revenue tracking", "Expense trend analysis", "Cash flow forecasting"], accent: "#8b5cf6" },
    { icon: <Bell size={22} color="#f59e0b"/>,        title: "Smart Invoice Follow-Up",         desc: "Automatically schedules and sends professional follow-up emails with invoice PDFs attached.", bullets: ["Customizable message editor", "Scheduled email delivery", "PDF invoice attachment"], accent: "#f59e0b" },
    { icon: <Search size={22} color={C.cyan}/>,       title: "Semantic Document Search",        desc: "Search your financial history in plain English — Novala understands context and intent.", bullets: ["Natural language queries", "3-layer search engine", "Instant document retrieval"], accent: C.cyan },
    { icon: <RefreshCw size={22} color={C.accent}/>,  title: "Automated Bookkeeping",           desc: "Bank-grade reconciliation, duplicate detection, and auto-categorization — all automatic.", bullets: ["Smart reconciliation", "Duplicate detection", "Auto-categorization"], accent: C.accent },
    { icon: <Repeat size={22} color="#8b5cf6"/>,      title: "Recurring Revenue on Autopilot", desc: "Set up automatic billing for your clients. Invoices go out, payments come in, books update — all without lifting a finger.", bullets: ["Auto-send invoices on schedule", "Auto-record payments", "Never chase a client again"], accent: "#8b5cf6", badge: "Coming Soon" },
    { icon: <CreditCard size={22} color="#8b5cf6"/>,  title: "Banking Integration",             desc: "Connect your bank accounts and sync transactions in real time via Plaid.", bullets: ["Plaid bank connection", "Auto transaction sync", "Multi-bank support"], accent: "#8b5cf6" },
    { icon: <Calculator size={22} color="#ef4444"/>,  title: "Tax Management",                  desc: "Track deductible expenses, calculate tax obligations, and prepare for filing effortlessly.", bullets: ["GST/HST calculation", "Deduction tracking", "Tax report export"], accent: "#ef4444" },
    { icon: <Users size={22} color={C.cyan}/>,        title: "Customer Management",             desc: "Manage clients, track outstanding balances, and maintain full relationship history.", bullets: ["Client profiles", "Outstanding balance tracking", "Invoice history"], accent: C.cyan },
    { icon: <TrendingUp size={22} color="#f59e0b"/>,  title: "Dashboard Analytics",             desc: "Deep financial analytics with variance reports, budget tracking, and trend forecasting.", bullets: ["Variance reports", "Budget vs actual", "Trend forecasting"], accent: "#f59e0b" },
    { icon: <Building2 size={22} color="#8b5cf6"/>,   title: "Multi-Business Support",          desc: "Manage multiple companies or client accounts from a single Novala workspace.", bullets: ["Multiple entities", "Role-based access", "Consolidated reporting"], accent: "#8b5cf6" },
  ];

  const faqs = [
    { icon: <Brain size={14} color={C.accent}/>,       q: "How does Novala extract data from documents?",            a: "Novala uses advanced large language models combined with computer vision to read and understand financial documents. It extracts vendor names, amounts, dates, line items, and payment status with high accuracy." },
    { icon: <Shield size={14} color={C.cyan}/>,        q: "Is my financial data secure?",                            a: "Absolutely. Novala uses bank-grade AES-256 encryption, AWS infrastructure, and never shares your data with third parties. Your documents are stored in encrypted S3 buckets with strict access controls." },
    { icon: <RefreshCw size={14} color="#8b5cf6"/>,    q: "Can I import data from my existing accounting software?", a: "Yes. Novala integrates with QuickBooks, Xero, FreshBooks, and major banks. You can also import CSV files, PDFs, and connect directly via API." },
    { icon: <Bell size={14} color="#f59e0b"/>,         q: "How does the automated invoice follow-up work?",          a: "Novala detects overdue invoices and suggests follow-up emails. You review, edit the message, pick a date and time, and Novala sends a professional email with the invoice PDF attached automatically." },
    { icon: <CheckCircle size={14} color={C.accent}/>, q: "Is there a free trial?",                                  a: "Yes — all plans come with a 14-day free trial with full access to all features. No credit card required for the Essentials plan." },
    { icon: <Users size={14} color={C.cyan}/>,         q: "Can I use Novala for my team?",                           a: "Absolutely. Novala supports multi-user teams with role-based permissions, shared dashboards, and collaborative workflows. Enterprise plans include white-label options and dedicated support." },
  ];

  const steps = [
    { icon: <Upload size={26} color={C.accent}/>,     color: C.accent,  num: "01", title: "Upload Your Documents",      desc: "Drag and drop invoices, receipts, bank statements. Novala processes everything in seconds." },
    { icon: <Zap size={26} color={C.cyan}/>,          color: C.cyan,    num: "02", title: "Auto-Extracted & Organized", desc: "Novala reads, categorizes, and records all financial data automatically." },
    { icon: <TrendingUp size={26} color="#8b5cf6"/>,  color: "#8b5cf6", num: "03", title: "Get Financial Insights",     desc: "Real-time dashboards, reports, and smart recommendations surface instantly." },
    { icon: <Rocket size={26} color="#f59e0b"/>,      color: "#f59e0b", num: "04", title: "Automate & Scale",           desc: "Set up automated follow-ups, recurring reports, and smart alerts — then grow." },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Inter',system-ui,sans-serif", background: C.bg, color: C.text, overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#0F9599; border-radius:99px; }
        @keyframes float      { 0%,100%{transform:translateY(0)}           50%{transform:translateY(-12px)} }
        @keyframes floatSlow  { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-8px) rotate(1.5deg)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 30px rgba(15,149,153,0.2)} 50%{box-shadow:0 0 70px rgba(15,149,153,0.55)} }
        @keyframes pulse-cyan { 0%,100%{box-shadow:0 0 20px rgba(34,211,238,0.2)} 50%{box-shadow:0 0 50px rgba(34,211,238,0.5)} }
        @keyframes ping       { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2.2);opacity:0} }

      @keyframes core-pulse {
        0%{transform:scale(1);opacity:0.55}
        100%{transform:scale(3.8);opacity:0}
      }
        @keyframes wave       { 0%,100%{transform:scaleY(0.5)} 50%{transform:scaleY(1.5)} }
        @keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
        @keyframes marquee    { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes float-badge { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-10px) rotate(1deg)} }
        @keyframes glow-line  { 0%,100%{opacity:0.4} 50%{opacity:1} }
        .cta-primary {
          background: linear-gradient(135deg, #0F9599, #0B7377);
          color: #FFFFFF; border:none;
          padding:14px 30px; border-radius:13px; font-size:15px; font-weight:800;
          cursor:pointer; box-shadow:0 6px 30px rgba(15,149,153,0.35), 0 0 0 1px rgba(15,149,153,0.2);
          transition:all 0.25s cubic-bezier(0.16,1,0.3,1); font-family:inherit; white-space:nowrap;
        }
        .cta-primary:hover  { transform:translateY(-2px) scale(1.02); box-shadow:0 12px 40px rgba(15,149,153,0.5), 0 0 0 1px rgba(15,149,153,0.3); }
        .cta-primary:active { transform:scale(0.97); }
        .cta-secondary {
          background: rgba(255,255,255,0.06); color: #F0F4F8;
          border: 1px solid rgba(255,255,255,0.12);
          padding:14px 30px; border-radius:13px; font-size:15px; font-weight:600; cursor:pointer;
          transition:all 0.25s cubic-bezier(0.16,1,0.3,1); font-family:inherit; white-space:nowrap;
          backdrop-filter: blur(12px);
        }
        .cta-secondary:hover { transform:translateY(-2px); background:rgba(255,255,255,0.1); border-color:rgba(15,149,153,0.3); box-shadow:0 8px 28px rgba(0,0,0,0.3); }
        .step-card { transition:all 0.4s cubic-bezier(0.16,1,0.3,1); cursor:default; backdrop-filter:blur(12px); }
        .step-card:hover { transform:translateY(-8px) !important; }
        .step-card:hover .step-icon { transform:scale(1.15) rotate(5deg); }
        .step-icon { transition:all 0.35s cubic-bezier(0.16,1,0.3,1); }
        .stat-item { transition:all 0.3s cubic-bezier(0.16,1,0.3,1); padding:24px 20px; border-radius:18px; cursor:default; }
        .stat-item:hover { transform:translateY(-5px) scale(1.04); background:rgba(15,149,153,0.05); box-shadow:0 0 40px rgba(15,149,153,0.08); }
        .nav-link { position:relative; display:flex; align-items:center; gap:6px; }
        .nav-link::after { content:''; position:absolute; bottom:-4px; left:0; right:0; height:1px; background:linear-gradient(90deg,#0F9599,#22D3EE); transform:scaleX(0); transition:transform 0.25s ease; border-radius:99px; }
        .nav-link:hover::after { transform:scaleX(1); }
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
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(16px)", animation:"fadeIn 0.2s ease", display:"flex", alignItems:"flex-start", justifyContent:"center", overflowY:"auto", padding:"clamp(16px,3vw,40px)" }}>
          <div style={{ background:"rgba(12,14,20,0.98)", border:`1px solid ${C.border}`, borderRadius:28, width:"100%", maxWidth:1100, boxShadow:"0 40px 100px rgba(0,0,0,0.7)", animation:"slideInRight 0.4s cubic-bezier(0.16,1,0.3,1)", position:"relative", backdropFilter:"blur(20px)" }}>
            <div style={{ padding:"28px 32px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", borderRadius:"28px 28px 0 0", position:"sticky", top:0, zIndex:10, background:"rgba(12,14,20,0.98)", backdropFilter:"blur(20px)" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:C.accent, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Complete Feature Set</div>
                <h2 style={{ fontSize:"clamp(20px,3vw,28px)", fontWeight:800, color:C.text, letterSpacing:"-0.03em" }}>Everything Novala can do</h2>
              </div>
              <button onClick={() => setShowAllFeatures(false)} style={{ width:40, height:40, borderRadius:12, background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.text, transition:"all 0.2s ease" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(239,68,68,0.12)"; e.currentTarget.style.color="#ef4444"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.color=C.text; }}>
                <X size={18}/>
              </button>
            </div>
            <div style={{ padding:"clamp(20px,3vw,40px)" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:40 }}>
                {allFeatures.map((f,i) => <FeatureCard key={i} {...f} delay={i*0.04}/>)}
              </div>
              <div style={{ background:"linear-gradient(135deg,rgba(15,149,153,0.08),rgba(34,211,238,0.05))", border:`1px solid rgba(15,149,153,0.2)`, borderRadius:20, padding:"clamp(24px,4vw,40px)", textAlign:"center" }}>
                <h3 style={{ fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:C.text, marginBottom:12, letterSpacing:"-0.03em" }}>Ready to get started?</h3>
                <p style={{ fontSize:15, color:C.textSub, marginBottom:28 }}>Join hundreds of businesses already using Novala.</p>
                <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
                  <button className="cta-primary" onClick={goToSignUp} style={{ fontSize:15, padding:"16px 36px" }}>Create Free Account →</button>
                  <button onClick={() => setShowAllFeatures(false)} style={{ fontSize:15, padding:"16px 28px", borderRadius:13, background:"rgba(255,255,255,0.06)", color:C.text, border:`1px solid ${C.border}`, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Back to Home</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background: scrollY>40 ? "rgba(8,9,13,0.95)" : "transparent", backdropFilter: scrollY>40 ? "blur(24px)" : "none", borderBottom: scrollY>40 ? `1px solid ${C.border}` : "none", transition:"all 0.3s ease", padding:`0 ${px}` }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:66 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, flexShrink:0 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,rgba(15,149,153,0.15),rgba(8,9,13,0.9))", border:`1px solid rgba(15,149,153,0.3)`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 20px rgba(15,149,153,0.2)`, flexShrink:0 }}>
              <svg width="17" height="17" viewBox="0 0 22 22" fill="none">
                <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke={C.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="19" cy="9" r="2" fill={C.accent}/>
              </svg>
            </div>
            <span style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.03em", color:C.text }}>No<span style={{ color:C.accent }}>vala</span></span>
          </div>
          <div className="desktop-only" style={{ alignItems:"center", gap:32 }}>
            {navLinks.map(l => (
              <button key={l.label} className="nav-link"
                onClick={() => { const el = document.getElementById(l.id); if(el) el.scrollIntoView({behavior:"smooth"}); }}
                style={{ color:C.text, fontSize:13.5, fontWeight:600, cursor:"pointer", transition:"all 0.2s", background:"none", border:"none", fontFamily:"inherit", position:"relative", opacity:0.85 }}
                onMouseEnter={e => { e.currentTarget.style.color=C.accent; e.currentTarget.style.opacity="1"; }}
                onMouseLeave={e => { e.currentTarget.style.color=C.text; e.currentTarget.style.opacity="0.85"; }}>
                <span style={{ color:C.accent, opacity:0.7 }}>{l.icon}</span>
                {l.label}
              </button>
            ))}
          </div>
          <div className="desktop-only" style={{ gap:9 }}>
            <button className="cta-secondary" style={{ padding:"10px 20px", fontSize:13.5 }} onClick={goToApp}>Sign In</button>
            <button className="cta-primary" style={{ padding:"10px 22px", fontSize:13.5 }} onClick={goToSignUp}>Register Free →</button>
          </div>
          <button className="mobile-only" onClick={() => setMenuOpen(o => !o)}
            style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, borderRadius:10, cursor:"pointer", color:C.text, alignItems:"center", justifyContent:"center", padding:8, transition:"background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(15,149,153,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.06)"}>
            {menuOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
        <div style={{ position:"fixed", top:66, left:0, right:0, background:"rgba(8,9,13,0.98)", backdropFilter:"blur(28px)", borderBottom: menuOpen ? `1px solid ${C.border}` : "none", padding: menuOpen ? "20px 24px 32px" : "0 24px", maxHeight: menuOpen ? "100vh" : 0, overflow:"hidden", transition:"max-height 0.45s cubic-bezier(0.16,1,0.3,1), padding 0.3s ease", zIndex:99, display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {navLinks.map((l,i) => (
              <button key={l.label}
                onClick={() => { setMenuOpen(false); setTimeout(() => { const el = document.getElementById(l.id); if(el) el.scrollIntoView({behavior:"smooth"}); }, 350); }}
                style={{ textAlign:"left", padding:"15px 0", fontSize:17, fontWeight:600, color:C.text, background:"none", border:"none", borderBottom: i < navLinks.length - 1 ? `1px solid ${C.border}` : "none", cursor:"pointer", fontFamily:"inherit", opacity: menuOpen ? 1 : 0, transform: menuOpen ? "none" : "translateX(-12px)", transition:`opacity 0.3s ease ${i*0.04}s, transform 0.3s ease ${i*0.04}s, color 0.2s`, display:"flex", alignItems:"center", gap:8 }}
                onMouseEnter={e => e.currentTarget.style.color=C.accent}
                onMouseLeave={e => e.currentTarget.style.color=C.text}>
                <span style={{ color:C.accent, opacity:0.7 }}>{l.icon}</span>
                {l.label}
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
      <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:`100px ${px} 60px`, background:`radial-gradient(ellipse 80% 60% at 50% -10%, rgba(15,149,153,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(34,211,238,0.04) 0%, transparent 60%), ${C.bg}`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(15,149,153,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,149,153,0.03) 1px, transparent 1px)`, backgroundSize:"60px 60px", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:"20%", right:"10%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(15,149,153,0.06),transparent)", filter:"blur(60px)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:"20%", left:"5%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(34,211,238,0.05),transparent)", filter:"blur(60px)", pointerEvents:"none" }}/>
        <div style={{ maxWidth:1200, margin:"0 auto", width:"100%", position:"relative" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:60, alignItems:"center" }}>
            <div style={{ textAlign:"left" }}>
              <Reveal delay={0}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(15,149,153,0.08)", border:"1px solid rgba(15,149,153,0.25)", borderRadius:99, padding:"6px 18px", marginBottom:30 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:C.accent, animation:"pulse-glow 2s infinite" }}/>
                  <span style={{ fontSize:11, fontWeight:700, color:C.accent, letterSpacing:"0.1em", textTransform:"uppercase" }}>Financial Intelligence Platform</span>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <h1 style={{ fontSize:"clamp(38px,5.5vw,72px)", fontWeight:800, lineHeight:1.06, letterSpacing:"-0.045em", color:C.text, marginBottom:22 }}>
                  Financial intelligence,<br/><span style={{ background:`linear-gradient(135deg, ${C.accent}, ${C.cyan})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>on autopilot.</span>
                </h1>
              </Reveal>
              <Reveal delay={0.18}>
                <p style={{ fontSize:"clamp(15px,2.2vw,19px)", color:C.textSub, lineHeight:1.7, maxWidth:520, marginBottom:38, fontWeight:400 }}>
                  Bookkeeping, payroll, invoicing, smart reminders, recurring revenue, bill pay, and reporting. All on autopilot.
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
                    <span key={t} style={{ fontSize:12.5, color:C.textSub, fontWeight:500 }}>{t}</span>
                  ))}
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.4} direction="right">
              <OrbitalAnimation/>
            </Reveal>
          </div>
          <div style={{ marginTop:60 }}>
            <FloatingMarquee/>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding:`52px ${px}`, background:`linear-gradient(180deg, rgba(15,149,153,0.03), transparent)`, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"clamp(16px,4vw,40px)" }}>
            {[
              { value:98,    suffix:"%",   label:"Accuracy Rate",       icon:<Brain size={22} color={C.accent}/>    },
              { value:10000, suffix:"+",   label:"Documents Processed", icon:<FileText size={22} color={C.cyan}/>   },
              { value:500,   suffix:"+",   label:"Businesses Served",   icon:<Building2 size={22} color="#8b5cf6"/> },
              { value:40,    suffix:"hrs", label:"Saved Per Month",      icon:<Zap size={22} color="#f59e0b"/>       },
            ].map((s,i) => (
              <Reveal key={i} delay={i*0.1} pop={true}>
                <div className="stat-item" style={{ textAlign:"center", border:`1px solid transparent`, transition:"all 0.3s" }}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:12, filter:`drop-shadow(0 0 8px ${i===0?C.accent:i===1?C.cyan:i===2?"#8b5cf6":"#f59e0b"}40)` }}>{s.icon}</div>
                  <div style={{ fontSize:"clamp(30px,5vw,50px)", fontWeight:800, letterSpacing:"-0.04em", background:`linear-gradient(135deg, ${C.text}, ${C.textSub})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", marginBottom:6 }}>
                    <Counter end={s.value} suffix={s.suffix}/>
                  </div>
                  <div style={{ fontSize:13, color:C.textSub, fontWeight:500 }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding:`88px ${px}`, background:`linear-gradient(180deg, ${C.bg}, rgba(15,149,153,0.02))`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translateX(-50%)", width:800, height:400, background:"radial-gradient(ellipse,rgba(15,149,153,0.04),transparent)", pointerEvents:"none" }}/>
        <div style={{ maxWidth:1200, margin:"0 auto", position:"relative" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:11, fontWeight:700, color:C.accent, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, background:"rgba(15,149,153,0.08)", border:`1px solid rgba(15,149,153,0.2)`, padding:"6px 16px", borderRadius:99 }}>
                <Layers size={13} color={C.accent}/> Everything You Need
              </div>
              <h2 style={{ fontSize:"clamp(28px,5vw,52px)", fontWeight:800, letterSpacing:"-0.035em", color:C.text, marginBottom:14, lineHeight:1.08 }}>
                Software that actually understands<br/>your finances
              </h2>
              <p style={{ fontSize:"clamp(14px,2vw,17px)", color:C.textSub, maxWidth:500, margin:"0 auto", lineHeight:1.65 }}>
                Every feature is designed to save time and give you clarity — not add complexity.
              </p>
            </div>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:36 }}>
            {allFeatures.slice(0,6).map((f,i) => <FeatureCard key={i} {...f} delay={i*0.07}/>)}
          </div>
          <Reveal delay={0.1}>
            <div style={{ background:"linear-gradient(135deg,rgba(15,149,153,0.06),rgba(34,211,238,0.04))", border:`1px solid rgba(15,149,153,0.15)`, borderRadius:24, padding:"clamp(28px,4vw,48px)", marginBottom:36, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:32, alignItems:"center", position:"relative", overflow:"hidden", backdropFilter:"blur(12px)" }}>
              <div style={{ position:"absolute", top:0, right:0, width:400, height:400, background:"radial-gradient(circle,rgba(15,149,153,0.06),transparent)", filter:"blur(60px)", pointerEvents:"none" }}/>
              <div style={{ position:"relative" }}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(15,149,153,0.1)", border:"1px solid rgba(15,149,153,0.3)", borderRadius:99, padding:"4px 14px", marginBottom:16 }}>
                  <Repeat size={11} color={C.accent}/>
                  <span style={{ fontSize:10, fontWeight:700, color:C.accent, letterSpacing:"0.1em", textTransform:"uppercase" }}>Coming Soon</span>
                </div>
                <h3 style={{ fontSize:"clamp(22px,3vw,34px)", fontWeight:800, color:C.text, marginBottom:14, letterSpacing:"-0.03em", lineHeight:1.15 }}>
                  Recurring Revenue<br/><span style={{ background:`linear-gradient(135deg,${C.accent},${C.cyan})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>on Autopilot</span>
                </h3>
                <p style={{ fontSize:15, color:C.textSub, lineHeight:1.7, marginBottom:24, maxWidth:440 }}>
                  Set up automatic billing for your clients. Invoices go out, payments come in, books update — all without lifting a finger.
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    { icon:<ArrowUpCircle size={14} color={C.accent}/>, text:"Auto-send invoices on your schedule" },
                    { icon:<DollarSign size={14} color={C.accent}/>,    text:"Auto-record payments when received"  },
                    { icon:<RefreshCw size={14} color={C.accent}/>,     text:"Never chase a client payment again"  },
                    { icon:<PieChart size={14} color={C.accent}/>,      text:"Predictable monthly revenue reports"  },
                  ].map((item,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:"rgba(15,149,153,0.1)", border:"1px solid rgba(15,149,153,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{item.icon}</div>
                      <span style={{ fontSize:13.5, color:C.textSub, fontWeight:500 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background:"rgba(0,0,0,0.3)", border:`1px solid rgba(15,149,153,0.15)`, borderRadius:20, padding:28, backdropFilter:"blur(20px)", position:"relative" }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.accent, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:C.accent, animation:"pulse-glow 2s infinite" }}/>
                  Recurring Billing Preview
                </div>
                {[
                  { client:"Brightcare Health",  amount:"$2,400", status:"Sent",      color:C.accent, day:"1st"  },
                  { client:"Acme Corp",          amount:"$1,800", status:"Paid",      color:C.cyan,   day:"15th" },
                  { client:"River Design Co.",   amount:"$950",   status:"Scheduled", color:"#f59e0b",day:"28th" },
                  { client:"Summit Consulting",  amount:"$3,200", status:"Paid",      color:C.accent, day:"1st"  },
                ].map((item,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                    <div>
                      <div style={{ fontSize:12.5, color:C.text, fontWeight:600 }}>{item.client}</div>
                      <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>Every month · {item.day}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{item.amount}</div>
                      <div style={{ fontSize:10, fontWeight:600, color:item.color, marginTop:2 }}>{item.status}</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:16, padding:"10px 14px", borderRadius:10, background:"rgba(15,149,153,0.08)", border:"1px solid rgba(15,149,153,0.2)", display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:C.accent, fontWeight:700 }}>Monthly Recurring</span>
                  <span style={{ fontSize:13, color:C.accent, fontWeight:800 }}>$8,350</span>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div style={{ textAlign:"center" }}>
              <button onClick={() => setShowAllFeatures(true)}
                style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 32px", borderRadius:13, background:"rgba(15,149,153,0.06)", border:`1px solid rgba(15,149,153,0.2)`, color:C.accent, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.25s ease" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(15,149,153,0.12)"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 8px 30px rgba(15,149,153,0.15)`; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(15,149,153,0.06)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
                View All 12 Features <ArrowRight size={16}/>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding:`88px ${px}`, background:C.bg, position:"relative" }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:300, background:"radial-gradient(ellipse,rgba(34,211,238,0.04),transparent)", pointerEvents:"none" }}/>
        <div style={{ maxWidth:980, margin:"0 auto", position:"relative" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:11, fontWeight:700, color:C.cyan, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, background:"rgba(34,211,238,0.08)", border:`1px solid rgba(34,211,238,0.2)`, padding:"6px 16px", borderRadius:99 }}>
                <Zap size={13} color={C.cyan}/> Simple Process
              </div>
              <h2 style={{ fontSize:"clamp(28px,5vw,50px)", fontWeight:800, letterSpacing:"-0.035em", color:C.text, lineHeight:1.08 }}>
                From upload to insight<br/>in seconds
              </h2>
            </div>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:18 }}>
            {steps.map((s,i) => (
              <Reveal key={i} delay={i*0.1} pop={true}>
                <div className="step-card" style={{ textAlign:"center", padding:"32px 20px", borderRadius:20, border:`1px solid ${s.color}20`, background:C.bgCard }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 20px 50px rgba(0,0,0,0.4), 0 0 30px ${s.color}15`; e.currentTarget.style.borderColor=`${s.color}40`; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor=`${s.color}20`; }}>
                  <div className="step-icon" style={{ width:64, height:64, borderRadius:18, margin:"0 auto 18px", background:`${s.color}12`, border:`1px solid ${s.color}25`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 20px ${s.color}20` }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize:10, fontWeight:800, color:s.color, letterSpacing:"0.12em", marginBottom:9, textShadow:`0 0 12px ${s.color}60` }}>{s.num}</div>
                  <h3 style={{ fontSize:15.5, fontWeight:700, color:C.text, marginBottom:9, letterSpacing:"-0.02em" }}>{s.title}</h3>
                  <p style={{ fontSize:13, color:C.textSub, lineHeight:1.65 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS ENGINE */}
      <section id="how-it-works-engine" style={{ padding:`88px ${px}`, background:`linear-gradient(140deg,rgba(15,149,153,0.04) 0%,${C.bg} 40%,rgba(34,211,238,0.03) 100%)`, position:"relative", overflow:"hidden", borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ position:"absolute", top:"15%", left:"8%", width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle,rgba(15,149,153,0.07),transparent)", filter:"blur(80px)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:"15%", right:"8%", width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle,rgba(34,211,238,0.06),transparent)", filter:"blur(60px)", pointerEvents:"none" }}/>
        <div style={{ maxWidth:1100, margin:"0 auto", position:"relative" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:"clamp(32px,6vw,72px)", alignItems:"center" }}>
            <Reveal direction="left">
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:C.accent, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:18 }}>How It Works</div>
                <h2 style={{ fontSize:"clamp(26px,4vw,48px)", fontWeight:800, color:C.text, marginBottom:18, lineHeight:1.12, letterSpacing:"-0.035em" }}>
                  A smart co-pilot for your entire financial operation
                </h2>
                <p style={{ fontSize:"clamp(13px,1.8vw,16px)", color:C.textSub, lineHeight:1.75, marginBottom:30 }}>
                  Novala doesn't just extract data — it understands context, detects anomalies, predicts cash flow, and proactively flags issues before they become problems.
                </p>
                {[
                  { icon:<Brain size={14} color={C.accent}/>,    text:"Semantic document understanding"    },
                  { icon:<Shield size={14} color={C.cyan}/>,     text:"Anomaly & duplicate detection"      },
                  { icon:<Search size={14} color={C.accent}/>,   text:"Natural language financial queries" },
                  { icon:<Bell size={14} color="#f59e0b"/>,      text:"Automated follow-up scheduling"     },
                  { icon:<TrendingUp size={14} color={C.cyan}/>, text:"Predictive cash flow insights"      },
                ].map((f,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:13, transition:"transform 0.2s ease" }}
                    onMouseEnter={e => e.currentTarget.style.transform="translateX(6px)"}
                    onMouseLeave={e => e.currentTarget.style.transform="none"}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(15,149,153,0.08)", border:`1px solid rgba(15,149,153,0.15)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{f.icon}</div>
                    <span style={{ fontSize:13.5, color:C.textSub, fontWeight:500 }}>{f.text}</span>
                  </div>
                ))}
                <button className="cta-primary" onClick={goToSignUp} style={{ marginTop:28, padding:"14px 30px", fontSize:14 }}>Start Free Today →</button>
              </div>
            </Reveal>
            <Reveal direction="right">
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ background:"rgba(0,0,0,0.4)", border:`1px solid rgba(15,149,153,0.15)`, borderRadius:20, padding:"clamp(18px,3vw,26px)", backdropFilter:"blur(20px)", animation:"float 5s ease-in-out infinite" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.accent, marginBottom:18, display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:C.accent, animation:"pulse-glow 2s infinite" }}/>
                    Processing Engine
                  </div>
                  {[
                    { label:"Document Reading",  pct:100, color:C.accent },
                    { label:"Data Extraction",   pct:97,  color:C.cyan   },
                    { label:"Categorization",    pct:94,  color:"#8b5cf6"},
                    { label:"Anomaly Detection", pct:99,  color:"#f59e0b"},
                  ].map((item,i) => (
                    <div key={i} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:12, color:C.textSub, fontWeight:500 }}>{item.label}</span>
                        <span style={{ fontSize:12, color:item.color, fontWeight:700 }}>{item.pct}%</span>
                      </div>
                      <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${item.pct}%`, background:item.color, borderRadius:99, boxShadow:`0 0 10px ${item.color}` }}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"rgba(0,0,0,0.4)", border:`1px solid rgba(34,211,238,0.15)`, borderRadius:16, padding:"18px 20px", backdropFilter:"blur(20px)" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.06em" }}>Live Activity</div>
                  {[
                    { text:"✓ Invoice #1042 processed — $8,750", time:"2s ago",   color:C.accent },
                    { text:"✓ 3 duplicates detected & flagged",  time:"14s ago",  color:"#f59e0b"},
                    { text:"✓ Follow-up sent to Brenda R.",      time:"2min ago", color:C.cyan   },
                  ].map((a,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom: i<2 ? `1px solid ${C.border}` : "none" }}>
                      <span style={{ fontSize:12, color:C.text, fontWeight:500 }}>{a.text}</span>
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
      <section id="pricing" style={{ padding:`88px ${px}`, background:`linear-gradient(180deg, rgba(34,211,238,0.02), ${C.bg})` }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:11, fontWeight:700, color:C.cyan, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, background:"rgba(34,211,238,0.08)", border:`1px solid rgba(34,211,238,0.2)`, padding:"6px 16px", borderRadius:99 }}>
                <CreditCard size={13} color={C.cyan}/> Simple Pricing
              </div>
              <h2 style={{ fontSize:"clamp(28px,5vw,52px)", fontWeight:800, letterSpacing:"-0.035em", color:C.text, lineHeight:1.08, marginBottom:14 }}>
                Start free. Scale with confidence.
              </h2>
              <p style={{ fontSize:"clamp(14px,2vw,17px)", color:C.textSub, maxWidth:420, margin:"0 auto" }}>14-day free trial on all plans. No credit card required to start.</p>
            </div>
          </Reveal>
          <div style={{ display:"flex", gap:18, justifyContent:"center", flexWrap:"wrap", alignItems:"flex-start" }}>
            {[
              { plan:"Essentials", price:"20",     color:C.accent,  icon:<Zap size={20} color={C.accent}/>,       desc:"Perfect for freelancers and solo businesses.",      features:["Up to 100 documents/month","Automatic data extraction","Basic invoicing","Financial dashboard","Email support","14-day free trial"],              cta:"Start Free Trial", popular:false },
              { plan:"Premium",    price:"30",     color:C.cyan,    icon:<Sparkles size={20} color={C.cyan}/>,     desc:"For growing businesses that need full automation.", features:["Unlimited documents","Automated follow-up emails","Smart Search (RAG)","Advanced reports","Bill pay & reconciliation","Tax tools","Priority support"], cta:"Start Free Trial", popular:true  },
              { plan:"Enterprise", price:"Custom", color:"#8b5cf6", icon:<Briefcase size={20} color="#8b5cf6"/>,   desc:"For teams needing scale, compliance, and control.", features:["Everything in Premium","Multi-user & roles","White-label option","API access","Custom integrations","Accountant portal","Dedicated success manager"], cta:"Contact Sales",    popular:false },
            ].map((p,i) => (
              <Reveal key={i} delay={i*0.1} pop={true}>
                <PricingCard {...p} onSignUp={p.price==="Custom" ? () => window.location.href="mailto:support@getnovala.com" : goToSignUp}/>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding:`88px ${px}`, background:C.bg, position:"relative" }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:500, height:300, background:"radial-gradient(ellipse,rgba(15,149,153,0.03),transparent)", pointerEvents:"none" }}/>
        <div style={{ maxWidth:700, margin:"0 auto", position:"relative" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:11, fontWeight:700, color:C.accent, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, background:"rgba(15,149,153,0.08)", border:`1px solid rgba(15,149,153,0.2)`, padding:"6px 16px", borderRadius:99 }}>
                <HelpCircle size={13} color={C.accent}/> FAQ
              </div>
              <h2 style={{ fontSize:"clamp(26px,5vw,44px)", fontWeight:800, letterSpacing:"-0.035em", color:C.text, lineHeight:1.12 }}>Common questions</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            {faqs.map((f,i) => <FAQ key={i} q={f.q} a={f.a} icon={f.icon}/>)}
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding:`88px ${px}`, background:`linear-gradient(135deg, rgba(15,149,153,0.06), rgba(34,211,238,0.04), ${C.bg})`, position:"relative", overflow:"hidden", borderTop:`1px solid ${C.border}` }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 60% at 50% 50%,rgba(15,149,153,0.06),transparent)", pointerEvents:"none" }}/>
        <div style={{ maxWidth:660, margin:"0 auto", textAlign:"center", position:"relative" }}>
          <Reveal>
            <div style={{ width:72, height:72, borderRadius:20, background:"linear-gradient(135deg,rgba(15,149,153,0.2),rgba(34,211,238,0.1))", border:`1px solid rgba(15,149,153,0.3)`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 28px", boxShadow:`0 0 60px rgba(15,149,153,0.3), 0 0 120px rgba(15,149,153,0.1)`, animation:"pulse-glow 3s infinite" }}>
              <svg width="32" height="32" viewBox="0 0 22 22" fill="none">
                <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke={C.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="19" cy="9" r="2" fill={C.accent}/>
              </svg>
            </div>
            <h2 style={{ fontSize:"clamp(28px,5.5vw,54px)", fontWeight:800, color:C.text, marginBottom:18, lineHeight:1.08, letterSpacing:"-0.04em" }}>
              Ready to transform how you<br/><span style={{ background:`linear-gradient(135deg,${C.accent},${C.cyan})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>manage your finances?</span>
            </h2>
            <p style={{ fontSize:"clamp(14px,2vw,17px)", color:C.textSub, marginBottom:38, lineHeight:1.65 }}>
              Join hundreds of businesses already saving hours every week with Novala's intelligent financial platform.
            </p>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:24 }}>
              <button className="cta-primary" onClick={goToSignUp} style={{ fontSize:15, padding:"16px 38px" }}>Create Free Account →</button>
              <button onClick={goToApp} style={{ fontSize:15, padding:"16px 32px", borderRadius:13, background:"rgba(255,255,255,0.06)", color:C.text, border:`1px solid ${C.border}`, cursor:"pointer", fontFamily:"inherit", fontWeight:600, transition:"all 0.25s ease", backdropFilter:"blur(12px)" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.1)"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.borderColor="rgba(15,149,153,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.transform="none"; e.currentTarget.style.borderColor=C.border; }}>
                Sign In
              </button>
            </div>
            <p style={{ fontSize:12.5, color:C.textMuted }}>14-day free trial · No credit card required · Cancel anytime</p>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:`48px ${px} 32px`, background:"#04050A", borderTop:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", marginBottom:48, paddingBottom:36, borderBottom:`1px solid ${C.border}` }}>
            {[
              { icon:<Lock size={13}/>,     label:"Bank-grade Security",      sub:"AES-256 Encrypted"    },
              { icon:<Cloud size={13}/>,    label:"AWS Hosted",               sub:"us-east-2 Region"     },
              { icon:<Shield size={13}/>,   label:"SOC 2 Ready",              sub:"Enterprise Compliant" },
              { icon:<Database size={13}/>, label:"Encrypted Infrastructure", sub:"Zero Data Sharing"    },
              { icon:<Star size={13}/>,     label:"99.9% Uptime",             sub:"SLA Guaranteed"       },
            ].map(b => (
              <div key={b.label} style={{ display:"flex", alignItems:"center", gap:10, background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 16px", transition:"all 0.2s ease", backdropFilter:"blur(12px)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(15,149,153,0.25)"; e.currentTarget.style.background="rgba(15,149,153,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.bgCard; }}>
                <div style={{ color:C.accent }}>{b.icon}</div>
                <div>
                  <div style={{ fontSize:11.5, fontWeight:700, color:C.text }}>{b.label}</div>
                  <div style={{ fontSize:10, color:C.textMuted }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"clamp(24px,4vw,44px)", marginBottom:44 }}>
            <div style={{ gridColumn:"span 1" }}>
              <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,rgba(15,149,153,0.15),transparent)", border:`1px solid rgba(15,149,153,0.3)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="15" height="15" viewBox="0 0 22 22" fill="none">
                    <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke={C.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize:18, fontWeight:800, color:C.text, letterSpacing:"-0.03em" }}>No<span style={{ color:C.accent }}>vala</span></span>
              </div>
              <p style={{ fontSize:12.5, color:C.textMuted, lineHeight:1.7, maxWidth:230 }}>Financial intelligence, on autopilot.</p>
              <div style={{ display:"flex", gap:8, marginTop:18 }}>
                {["𝕏","in","gh"].map(s => (
                  <div key={s} style={{ width:32, height:32, borderRadius:9, background:C.bgCard, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:12, color:C.textMuted, fontWeight:700, transition:"all 0.2s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(15,149,153,0.3)"; e.currentTarget.style.color=C.accent; e.currentTarget.style.boxShadow=`0 0 16px rgba(15,149,153,0.15)`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMuted; e.currentTarget.style.boxShadow="none"; }}>
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
                <div style={{ fontSize:10.5, fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:16 }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize:13, color:C.textMuted, marginBottom:10, cursor:"pointer", transition:"color 0.2s, transform 0.2s", display:"flex", alignItems:"center", gap:4 }}
                    onMouseEnter={e => { e.currentTarget.style.color=C.accent; e.currentTarget.style.transform="translateX(4px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color=C.textMuted; e.currentTarget.style.transform="none"; }}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:22, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <span style={{ fontSize:12.5, color:C.textMuted }}>2026 Novala Technologies Inc. All rights reserved.</span>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
              {[
                { icon:<Lock size={11}/>,   text:"Encrypted" },
                { icon:<Cloud size={11}/>,  text:"AWS"       },
                { icon:<Shield size={11}/>, text:"SOC 2"     },
              ].map(b => (
                <span key={b.text} style={{ fontSize:11, color:C.textMuted, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ color:C.accent }}>{b.icon}</span>{b.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}