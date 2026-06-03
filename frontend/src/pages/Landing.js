import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Receipt, FileText, BarChart3, Brain, Sparkles, Zap,
  Shield, Lock, CheckCircle, Check, ChevronDown,
  ArrowRight, ArrowUpRight, Users, Building2,
  Smartphone, Globe, Star, Clock, Plug, MessageSquare,
  Phone, Mail, Banknote, ScanLine, PieChart,
  RefreshCw, FolderOpen, TrendingUp,
} from "lucide-react";

// === Design tokens ===
const TEAL        = "#0F9599";
const TEAL_DARK   = "#0B7377";
const TEAL_TINT   = "#E6F4F4";
const TEAL_TINT_2 = "#F1F8F8";
const INK         = "#0E1A1A";
const SUB         = "#5B6B6B";
const MUTED       = "#9AA8A8";
const BORDER      = "#E2E8E8";
const BORDER_SOFT = "#EDF1F1";
const BG          = "#FFFFFF";
const BG_TINT     = "#F9FAFA";
const FOOTER_DARK = "#0B3D3D";
const SHADOW_SM   = "0 1px 2px rgba(14,26,26,0.04)";
const SHADOW_MD   = "0 10px 30px -12px rgba(14,26,26,0.12)";
const SHADOW_LG   = "0 24px 56px -20px rgba(15,149,153,0.25)";
const CONTENT_MAX = 1240;
const NAV_H       = 68;
const FONT        = "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// === Footer data ===
const FOOTER_LOCALES = [
  { code: "en-AU", flagSrc: "https://flagcdn.com/w80/au.png", label: "Australia" },
  { code: "pt-BR", flagSrc: "https://flagcdn.com/w80/br.png", label: "Brazil" },
  { code: "en-CA", flagSrc: "https://flagcdn.com/w80/ca.png", label: "Canada (English)" },
  { code: "fr-CA", flagSrc: "https://flagcdn.com/w80/ca.png", label: "Canada (French)" },
  { code: "fr-FR", flagSrc: "https://flagcdn.com/w80/fr.png", label: "France" },
  { code: "en-IN", flagSrc: "https://flagcdn.com/w80/in.png", label: "India" },
  { code: "en-GB", flagSrc: "https://flagcdn.com/w80/gb.png", label: "United Kingdom" },
  { code: "es-MX", flagSrc: "https://flagcdn.com/w80/mx.png", label: "Mexico" },
  { code: "other", flagSrc: null, label: "Other Countries" },
];

const FOOTER_COLUMNS = [
  { title: "Product",   items: ["Receipt scanner (Nova AI)", "AI bookkeeping", "Invoicing", "Transactions", "Documents", "Dashboard", "Tax", "Nova AI assistant", "Pricing & plans", "See all features"] },
  { title: "Features",  items: ["Auto receipt capture & scan", "Expense tracking", "Bank feed / transactions", "Reports", "Document storage", "Sales tax tracking", "Team / multi-user access"] },
  { title: "Resources", items: ["Help centre", "Getting started guide", "Invoice templates", "Blog / updates", "Status page", "Contact support"] },
  { title: "Company",   items: ["About Novala", "Support", "Tutorials", "Product updates", "Careers", "Contact"] },
];

const SOCIAL_ICONS = [
  { label: "LinkedIn",  path: "M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" },
  { label: "X",         path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { label: "Facebook",  path: "M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" },
  { label: "YouTube",   path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
  { label: "Instagram", path: "M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" },
];

// === Scroll-reveal hook ===
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function Reveal({ children, delay = 0, dy = 24 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : `translateY(${dy}px)`,
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function Counter({ end, suffix = "", duration = 1400 }) {
  const [val, setVal] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(end * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(end);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// === Feature card (used in 6-up grid) ===
function FeatureCard({ Icon, title, desc, delay = 0 }) {
  const [hov, setHov] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: BG,
          border: `1px solid ${hov ? "rgba(15,149,153,0.35)" : BORDER}`,
          borderRadius: 18,
          padding: "30px 26px",
          height: "100%",
          boxShadow: hov ? SHADOW_LG : SHADOW_SM,
          transform: hov ? "translateY(-4px)" : "none",
          transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: `radial-gradient(120% 120% at 30% 20%, ${TEAL_TINT} 0%, #D2EEEE 100%)`,
          border: "1px solid rgba(15,149,153,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: hov ? "inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 18px -10px rgba(15,149,153,0.5)" : "inset 0 1px 0 rgba(255,255,255,0.7)",
          transition: "transform 0.35s ease, box-shadow 0.35s ease",
          transform: hov ? "scale(1.05)" : "none",
        }}>
          <Icon size={24} strokeWidth={1.9} color={TEAL} />
        </div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: INK, letterSpacing: "-0.015em", lineHeight: 1.3 }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 14.5, color: SUB, lineHeight: 1.65 }}>{desc}</p>
      </div>
    </Reveal>
  );
}

// === FAQ item ===
function FAQItem({ q, a, isOpen, onToggle, isHover, onHover, onLeave }) {
  const active = isOpen || isHover;
  return (
    <div style={{
      border: `1px solid ${active ? "rgba(15,149,153,0.35)" : BORDER}`,
      borderRadius: 14,
      background: BG,
      marginBottom: 10,
      overflow: "hidden",
      transition: "border-color 0.2s, box-shadow 0.2s",
      boxShadow: active ? "0 6px 18px -10px rgba(15,149,153,0.25)" : "none",
    }}>
      <button
        onClick={onToggle}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        style={{
          width: "100%", padding: "20px 22px", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "inherit", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 15.5, fontWeight: 600, color: active ? TEAL : INK, transition: "color 0.15s", lineHeight: 1.4 }}>{q}</span>
        <ChevronDown size={20} color={active ? TEAL : SUB} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.25s, color 0.15s", flexShrink: 0 }} />
      </button>
      <div style={{ maxHeight: isOpen ? 360 : 0, overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ padding: "0 22px 20px 22px", color: SUB, fontSize: 14.5, lineHeight: 1.7 }}>{a}</div>
      </div>
    </div>
  );
}

// === Stat tile ===
function StatTile({ value, label, suffix = "" }) {
  return (
    <Reveal>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 44, fontWeight: 800, color: INK, letterSpacing: "-0.03em", lineHeight: 1 }}>
          <Counter end={value} suffix={suffix} />
        </div>
        <div style={{ marginTop: 8, fontSize: 14, color: SUB, fontWeight: 500 }}>{label}</div>
      </div>
    </Reveal>
  );
}

// === Main Landing ===
export default function Landing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [hoverFaq, setHoverFaq] = useState(null);
  const [showFooterLocale, setShowFooterLocale] = useState(false);
  const [locale, setLocale] = useState("en-CA");
  const footerLocaleRef = useRef(null);
  const currentLocale = FOOTER_LOCALES.find(l => l.code === locale) || FOOTER_LOCALES[2];

  useEffect(() => {
    const h = (e) => {
      if (footerLocaleRef.current && !footerLocaleRef.current.contains(e.target)) setShowFooterLocale(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("novala-fonts")) return;
    const l = document.createElement("link");
    l.id = "novala-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(l);
  }, []);

  const features = [
    { Icon: ScanLine, title: "Receipt scanner",   desc: "Snap a photo, Nova AI extracts merchant, date, tax, and totals in seconds. No more manual entry." },
    { Icon: Brain,    title: "AI bookkeeping",    desc: "Transactions get categorized, matched, and reconciled automatically. Your books stay current without lifting a finger." },
    { Icon: FileText, title: "Smart invoicing",   desc: "Create polished invoices, send reminders, and accept payments. Recurring billing built in." },
    { Icon: BarChart3,title: "Live dashboards",   desc: "Cash flow, revenue, expenses, and trends, refreshed in real time. Know where you stand the moment it changes." },
    { Icon: Receipt,  title: "Expense tracking",  desc: "Categorize spending automatically, flag anomalies, and surface deductions before tax season hits." },
    { Icon: Plug,     title: "200+ integrations", desc: "Connect Stripe, Shopify, your bank, and the tools you already use. Data flows in, insights flow out." },
  ];

  const allFeatures = [
    { Icon: ScanLine,    label: "Receipt scanner" },
    { Icon: Brain,       label: "AI bookkeeping" },
    { Icon: FileText,    label: "Invoicing" },
    { Icon: BarChart3,   label: "Dashboards" },
    { Icon: Receipt,     label: "Expense tracking" },
    { Icon: Banknote,    label: "Bank feeds" },
    { Icon: PieChart,    label: "Reports" },
    { Icon: FolderOpen,  label: "Documents" },
    { Icon: RefreshCw,   label: "Recurring billing" },
    { Icon: Users,       label: "Team access" },
    { Icon: Shield,      label: "Tax tracking" },
    { Icon: Sparkles,    label: "Nova AI assistant" },
  ];

  const faqs = [
    { q: "What is Novala?",
      a: "Novala is an AI-powered accounting platform for small businesses. We replace manual bookkeeping with automated transaction matching, receipt scanning, and intelligent reporting so you spend less time on spreadsheets and more time on growth." },
    { q: "How does the AI receipt scanner work?",
      a: "Take a photo of any receipt with the Novala app or upload a PDF. Nova AI extracts the merchant, date, tax breakdown, and total in seconds, then categorizes the expense and matches it against your bank feed automatically." },
    { q: "Is my financial data secure?",
      a: "Yes. Novala uses bank-grade encryption in transit and at rest, role-based access controls, and continuous backups. Your data is yours, exportable any time, and never shared without your explicit permission." },
    { q: "Can I try Novala before paying?",
      a: "Every plan includes a 30-day free trial. No credit card required to start. You can switch between billing modes (promo pricing or free trial) on the pricing page." },
    { q: "Does Novala work for my industry?",
      a: "Novala fits any small business that tracks income, expenses, and taxes, from freelancers to healthcare practices to retail shops. The AI learns your categories and rules as you use it." },
    { q: "How do I get started?",
      a: "Pick a plan on the pricing page, create your account, connect your bank feed, and start uploading receipts. Most customers are up and running in under 10 minutes." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: FONT, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>

      {/* === Sticky Nav === */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.92)", borderBottom: `1px solid ${BORDER_SOFT}`, backdropFilter: "saturate(180%) blur(12px)" }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "0 32px", height: NAV_H, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span onClick={() => navigate("/")} style={{ color: TEAL, fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em", cursor: "pointer" }}>Novala</span>
          <nav style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <a href="#features" style={{ color: INK, fontSize: 14.5, fontWeight: 500, textDecoration: "none" }}>Features</a>
            <a onClick={() => navigate("/pricing")} style={{ color: INK, fontSize: 14.5, fontWeight: 500, cursor: "pointer" }}>Pricing</a>
            <a href="#faq" style={{ color: INK, fontSize: 14.5, fontWeight: 500, textDecoration: "none" }}>FAQ</a>
            <span onClick={() => navigate("/login")} style={{ color: INK, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>Sign in</span>
            <button
              onClick={() => navigate("/pricing")}
              onMouseEnter={(e) => e.currentTarget.style.background = TEAL_DARK}
              onMouseLeave={(e) => e.currentTarget.style.background = TEAL}
              style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
            >Get started</button>
          </nav>
        </div>
      </header>

      {/* === Hero === */}
      <section style={{ padding: "96px 32px 64px", background: `radial-gradient(60% 60% at 50% 0%, ${TEAL_TINT_2} 0%, ${BG} 60%)` }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: TEAL_TINT, border: "1px solid rgba(15,149,153,0.2)", fontSize: 13, fontWeight: 600, color: TEAL_DARK, marginBottom: 24 }}>
              <Sparkles size={14} />
              <span>AI bookkeeping. Built for small business.</span>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 style={{ margin: 0, fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 800, color: INK, letterSpacing: "-0.035em", lineHeight: 1.05, maxWidth: 900, marginInline: "auto" }}>
              Accounting that <span style={{ color: TEAL }}>runs itself</span>.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ margin: "22px auto 0", fontSize: 18.5, color: SUB, lineHeight: 1.55, maxWidth: 620 }}>
              From receipts to reports, Novala automates the bookkeeping you've been dreading, so you can spend time on the work that actually grows your business.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ marginTop: 36, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/pricing")}
                onMouseEnter={(e) => { e.currentTarget.style.background = TEAL_DARK; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = TEAL; e.currentTarget.style.transform = "none"; }}
                style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 12, padding: "16px 28px", fontSize: 15.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 12px 28px -10px rgba(15,149,153,0.55)", transition: "background 0.15s, transform 0.15s" }}
              >
                Start your free trial
                <ArrowRight size={17} strokeWidth={2.4} />
              </button>
              <button
                onClick={() => navigate("/pricing")}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = TEAL}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = BORDER}
                style={{ background: BG, color: INK, border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: "16px 28px", fontSize: 15.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s" }}
              >
                See pricing
              </button>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div style={{ marginTop: 28, display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", fontSize: 13.5, color: SUB }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} color={TEAL} /> 30-day free trial</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} color={TEAL} /> No credit card</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} color={TEAL} /> Cancel anytime</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* === Trust strip with animated counters === */}
      <section style={{ padding: "48px 32px", background: BG_TINT, borderTop: `1px solid ${BORDER_SOFT}`, borderBottom: `1px solid ${BORDER_SOFT}` }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32 }}>
          <StatTile value={10000} suffix="+" label="Receipts processed daily" />
          <StatTile value={98}    suffix="%"  label="Categorization accuracy" />
          <StatTile value={8}     suffix=" hrs" label="Saved per week, on average" />
          <StatTile value={47}    suffix=" sec" label="Average upload-to-insight" />
        </div>
      </section>

      {/* === From upload to insight in seconds === */}
      <section style={{ padding: "112px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>How it works</div>
              <h2 style={{ margin: 0, fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 800, color: INK, letterSpacing: "-0.025em", lineHeight: 1.15 }}>From upload to insight in <span style={{ color: TEAL }}>seconds</span>.</h2>
              <p style={{ margin: "18px auto 0", fontSize: 17, color: SUB, lineHeight: 1.6 }}>Three steps. No accountant required. No spreadsheets harmed.</p>
            </div>
          </Reveal>

          <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {[
              { num: "01", Icon: ScanLine, title: "Snap or upload",  desc: "Take a photo of a receipt, drag a PDF in, or forward an email. Nova AI handles the rest." },
              { num: "02", Icon: Brain,    title: "Nova reads it",   desc: "Merchant, date, tax, totals, and category are extracted, matched, and reconciled automatically." },
              { num: "03", Icon: BarChart3,title: "See the picture", desc: "Live dashboards update instantly. Cash flow, deductions, and tax obligations always current." },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div style={{ background: BG, border: `1px solid ${BORDER_SOFT}`, borderRadius: 18, padding: "28px 26px", height: "100%", boxShadow: SHADOW_SM, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -10, right: -6, fontSize: 80, fontWeight: 800, color: TEAL_TINT_2, letterSpacing: "-0.04em", lineHeight: 1, pointerEvents: "none" }}>{step.num}</div>
                  <div style={{ position: "relative", width: 52, height: 52, borderRadius: 14, background: TEAL_TINT, border: "1px solid rgba(15,149,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                    <step.Icon size={24} strokeWidth={1.9} color={TEAL} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: INK, letterSpacing: "-0.015em", position: "relative" }}>{step.title}</h3>
                  <p style={{ margin: "10px 0 0", fontSize: 14.5, color: SUB, lineHeight: 1.6, position: "relative" }}>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* === Features grid (6-up) === */}
      <section id="features" style={{ padding: "112px 32px", background: BG_TINT }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 56px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>What's inside</div>
              <h2 style={{ margin: 0, fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 800, color: INK, letterSpacing: "-0.025em", lineHeight: 1.15 }}>Everything your business needs in one place.</h2>
              <p style={{ margin: "18px auto 0", fontSize: 17, color: SUB, lineHeight: 1.6 }}>Receipt scanning, automated bookkeeping, invoicing, and reporting, working together so you don't have to.</p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22 }}>
            {features.map((f, i) => (
              <FeatureCard key={i} Icon={f.Icon} title={f.title} desc={f.desc} delay={i * 0.06} />
            ))}
          </div>
        </div>
      </section>

      {/* === View all 12 features === */}
      <section style={{ padding: "112px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>The complete toolkit</div>
              <h2 style={{ margin: 0, fontSize: "clamp(28px, 3.5vw, 38px)", fontWeight: 800, color: INK, letterSpacing: "-0.022em", lineHeight: 1.2 }}>View all 12 features</h2>
              <p style={{ margin: "16px auto 0", fontSize: 16, color: SUB, lineHeight: 1.6 }}>The full set of Novala capabilities at a glance.</p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            {allFeatures.map((f, i) => (
              <Reveal key={i} delay={i * 0.03}>
                <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 18px", display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s", cursor: "default" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = SHADOW_MD; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: TEAL_TINT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <f.Icon size={18} strokeWidth={1.9} color={TEAL} />
                  </div>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: INK }}>{f.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* === Social proof === */}
      <section style={{ padding: "96px 32px", background: BG_TINT, borderTop: `1px solid ${BORDER_SOFT}`, borderBottom: `1px solid ${BORDER_SOFT}` }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <Reveal>
            <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 24, padding: "48px 40px", boxShadow: SHADOW_MD, textAlign: "center", maxWidth: 880, marginInline: "auto" }}>
              <div style={{ display: "inline-flex", gap: 4, marginBottom: 22 }}>
                {[0,1,2,3,4].map(i => <Star key={i} size={20} fill={TEAL} color={TEAL} strokeWidth={0} />)}
              </div>
              <blockquote style={{ margin: 0, fontSize: "clamp(20px, 2.4vw, 26px)", fontWeight: 600, color: INK, letterSpacing: "-0.015em", lineHeight: 1.4 }}>
                "We replaced two hours of weekly bookkeeping with about ten minutes of glancing at the dashboard. Novala just gets it right."
              </blockquote>
              <div style={{ marginTop: 28, display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>CK</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: INK }}>Claire Kemanzi</div>
                  <div style={{ fontSize: 13, color: SUB }}>Founder, BrightCare Home Healthcare</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* === Pricing teaser === */}
      <section style={{ padding: "112px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <Reveal>
            <div style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`, borderRadius: 28, padding: "64px 48px", color: "#fff", textAlign: "center", boxShadow: "0 30px 60px -24px rgba(15,149,153,0.5)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.15, background: "radial-gradient(60% 100% at 100% 0%, rgba(255,255,255,0.4), transparent)" }} />
              <div style={{ position: "relative" }}>
                <h2 style={{ margin: 0, fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 }}>Find the plan that fits.</h2>
                <p style={{ margin: "18px auto 0", fontSize: 17, lineHeight: 1.6, maxWidth: 540, opacity: 0.92 }}>Compare features side by side and pick the tier that's right for your business. Every plan starts with a 30-day free trial.</p>
                <button
                  onClick={() => navigate("/pricing")}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = TEAL_DARK; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.95)"; e.currentTarget.style.color = TEAL_DARK; }}
                  style={{ marginTop: 32, background: "rgba(255,255,255,0.95)", color: TEAL_DARK, border: "none", borderRadius: 12, padding: "16px 32px", fontSize: 15.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 10, transition: "background 0.15s, color 0.15s" }}
                >
                  See pricing
                  <ArrowRight size={17} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* === FAQ === */}
      <section id="faq" style={{ padding: "96px 32px", background: BG_TINT, borderTop: `1px solid ${BORDER_SOFT}` }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Questions</div>
              <h2 style={{ margin: 0, fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: INK, letterSpacing: "-0.025em", lineHeight: 1.2 }}>Frequently asked</h2>
            </div>
          </Reveal>
          <Reveal>
            <div>
              {faqs.map((f, i) => (
                <FAQItem
                  key={i}
                  q={f.q}
                  a={f.a}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                  isHover={hoverFaq === i}
                  onHover={() => setHoverFaq(i)}
                  onLeave={() => setHoverFaq(null)}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* === Final CTA === */}
      <section style={{ padding: "96px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ margin: 0, fontSize: "clamp(30px, 4vw, 46px)", fontWeight: 800, color: INK, letterSpacing: "-0.03em", lineHeight: 1.15 }}>Ready to put your books on autopilot?</h2>
            <p style={{ margin: "20px auto 32px", fontSize: 17, color: SUB, lineHeight: 1.6, maxWidth: 540 }}>Start your free trial in under a minute. No credit card. Cancel anytime.</p>
            <button
              onClick={() => navigate("/pricing")}
              onMouseEnter={(e) => { e.currentTarget.style.background = TEAL_DARK; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = TEAL; e.currentTarget.style.transform = "none"; }}
              style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 12, padding: "16px 32px", fontSize: 15.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 12px 28px -10px rgba(15,149,153,0.55)", transition: "background 0.15s, transform 0.15s" }}
            >
              Start your free trial
              <ArrowRight size={17} strokeWidth={2.4} />
            </button>
          </Reveal>
        </div>
      </section>

      {/* === Footer (Section 12) === */}
      <footer style={{ background: FOOTER_DARK, color: "#fff", padding: "56px 32px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 40, marginBottom: 40 }}>
            {FOOTER_COLUMNS.map((col, i) => (
              <div key={i}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "0.01em" }}>{col.title}</h4>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.items.map((it, j) => (
                    <li key={j}>
                      <a href="#" onMouseEnter={(e) => { e.currentTarget.style.color = TEAL; }} onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.78)"; }} style={{ color: "rgba(255,255,255,0.78)", textDecoration: "none", fontSize: 14, transition: "color 0.15s" }}>{it}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.15)", borderBottom: "1px solid rgba(255,255,255,0.15)", padding: "20px 0", flexWrap: "wrap", gap: 20 }}>
            <a href="#" onMouseEnter={(e) => { e.currentTarget.style.color = TEAL; }} onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.78)"; }} style={{ color: "rgba(255,255,255,0.78)", textDecoration: "none", fontSize: 13, transition: "color 0.15s" }}>Sitemap</a>

            <div ref={footerLocaleRef} style={{ position: "relative" }}>
              <button onClick={() => setShowFooterLocale(s => !s)} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
                {currentLocale.flagSrc
                  ? <img src={currentLocale.flagSrc} alt={currentLocale.label} style={{ width: 24, height: 16, objectFit: "cover", borderRadius: 2, display: "block", border: "1px solid rgba(255,255,255,0.2)" }} />
                  : <Globe size={16} strokeWidth={1.8} />}
                <span>{currentLocale.label}</span>
                <ChevronDown size={14} strokeWidth={2} />
              </button>
              {showFooterLocale && (
                <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, minWidth: 240, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)", zIndex: 50, overflow: "hidden" }}>
                  {FOOTER_LOCALES.map(l => (
                    <button key={l.code} onClick={() => { setLocale(l.code); setShowFooterLocale(false); }} onMouseEnter={(e) => { if (l.code !== locale) e.currentTarget.style.background = "#F9FAFA"; }} onMouseLeave={(e) => { if (l.code !== locale) e.currentTarget.style.background = "#fff"; }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 14px", minHeight: 42, background: l.code === locale ? "#F1F5F5" : "#fff", border: "none", cursor: "pointer", fontSize: 14, color: INK, fontFamily: "inherit", textAlign: "left" }}>
                      {l.flagSrc
                        ? <img src={l.flagSrc} alt={l.label} style={{ width: 28, height: 20, objectFit: "cover", borderRadius: 2, display: "block", border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                        : <Globe size={22} strokeWidth={1.8} style={{ color: SUB, flexShrink: 0 }} />}
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {SOCIAL_ICONS.map((s, i) => (
                <a key={i} href="#" aria-label={s.label} onMouseEnter={(e) => { e.currentTarget.style.color = TEAL; }} onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.78)"; }} style={{ color: "rgba(255,255,255,0.78)", textDecoration: "none", display: "inline-flex", transition: "color 0.15s" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: "-0.015em" }}>Novala</span>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, maxWidth: 900 }}>
              © {new Date().getFullYear()} Novala. All rights reserved. Novala and the Novala logo are trademarks of BrightCare Home Healthcare Services Inc. By accessing and using this page you agree to the Terms and Conditions.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18, fontSize: 13 }}>
              {["Legal", "Privacy", "Security", "Terms and conditions", "About", "Careers", "Manage Cookies"].map((it, i) => (
                <a key={i} href="#" onMouseEnter={(e) => { e.currentTarget.style.color = TEAL; }} onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.78)"; }} style={{ color: "rgba(255,255,255,0.78)", textDecoration: "none", transition: "color 0.15s" }}>{it}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
