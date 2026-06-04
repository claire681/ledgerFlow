import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Receipt, FileText, BarChart3, Brain, Sparkles, Zap,
  Shield, Lock, CheckCircle, Check, ChevronDown,
  ArrowRight, Users, Building2, Smartphone, Globe, Star,
  Clock, Plug, MessageSquare, Phone, Mail, Banknote,
  ScanLine, PieChart, RefreshCw, FolderOpen, TrendingUp,
  Layers, Wallet, HelpCircle, X, BookOpen, Upload,
  CreditCard, Bell, Calendar, Percent, Download, Search,
} from "lucide-react";

import MarketingHeader from "../components/MarketingHeader";
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
const NAV_H       = 72;
const FONT        = "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// === Novala logo (uses real /public/logo512.png) ===
function NovalaLogo({ size = 32, color = INK, showWordmark = true }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <img
        src="/logo512.png"
        alt="Novala"
        style={{ width: size, height: size, objectFit: "contain", display: "block" }}
      />
      {showWordmark && (
        <span style={{ color: color, fontWeight: 800, fontSize: Math.round(size * 0.75), letterSpacing: "-0.02em" }}>Novala</span>
      )}
    </span>
  );
}

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
  { title: "Product",   items: ["Receipt scanner", "Bookkeeping", "Invoicing", "Payments", "Payroll", "Reports & dashboards", "Tax", "Nova assistant", "Pricing & plans", "See all features"] },
  { title: "Features",  items: ["Auto receipt capture", "Expense tracking", "Bank feed", "Reports", "Document storage", "Sales tax tracking", "Team access"] },
  { title: "Resources", items: ["Help centre", "Getting started guide", "Invoice templates", "Blog", "Status page", "Contact support"] },
  { title: "Company",   items: ["About Novala", "Support", "Tutorials", "Product updates", "Careers", "Contact"] },
];

const SOCIAL_ICONS = [
  { label: "LinkedIn",  path: "M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" },
  { label: "X",         path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { label: "Facebook",  path: "M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" },
  { label: "YouTube",   path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
  { label: "Instagram", path: "M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" },
];

// === All features (modal data, by category) ===
const ALL_FEATURE_CATEGORIES = [
  { title: "Bookkeeping & accounting", features: [
    { Icon: Brain,        label: "Smart bookkeeping",      desc: "Books that update themselves as you work." },
    { Icon: Banknote,     label: "Bank feed sync",         desc: "Automatic daily sync with every account." },
    { Icon: RefreshCw,    label: "Transaction matching",   desc: "Receipts reconciled against bank lines." },
    { Icon: FolderOpen,   label: "Smart categorization",   desc: "Categories that learn your business." },
    { Icon: BookOpen,     label: "Chart of accounts",      desc: "Full control, ready out of the box." },
    { Icon: FileText,     label: "Journal entries",        desc: "Manual entries when you need them." },
    { Icon: CheckCircle,  label: "Reconciliation",         desc: "Month-end close in minutes, not days." },
  ]},
  { title: "Receipts & expenses", features: [
    { Icon: ScanLine,     label: "Receipt scanner",        desc: "Snap a photo, Nova does the rest." },
    { Icon: Receipt,      label: "Expense tracking",       desc: "Every spend, categorized and searchable." },
    { Icon: FolderOpen,   label: "Document storage",       desc: "Bills and receipts, kept and searchable." },
    { Icon: Building2,    label: "Vendor management",      desc: "Track who you pay and how much." },
    { Icon: Upload,       label: "Bulk uploads",           desc: "Drag a folder of receipts in at once." },
  ]},
  { title: "Invoicing & payments", features: [
    { Icon: FileText,     label: "Branded invoices",       desc: "Custom logo, colors, and templates." },
    { Icon: RefreshCw,    label: "Recurring billing",      desc: "Set it once, invoiced on schedule." },
    { Icon: CreditCard,   label: "Online payments",        desc: "Accept cards directly on invoices." },
    { Icon: Bell,         label: "Payment reminders",      desc: "Automatic nudges for overdue clients." },
    { Icon: Users,        label: "Customer management",    desc: "All your clients in one place." },
  ]},
  { title: "Payroll & team", features: [
    { Icon: Banknote,     label: "Payroll runs",           desc: "Salaried and hourly, fully automated." },
    { Icon: CreditCard,   label: "Direct deposit",         desc: "Pay your team straight to their account." },
    { Icon: Calendar,     label: "Time off tracking",      desc: "Vacation, sick, statutory all tracked." },
    { Icon: FileText,     label: "T4 & T5 generation",     desc: "Year-end forms ready in one click." },
    { Icon: Users,        label: "Multi-user team access", desc: "Bring in your bookkeeper or accountant." },
    { Icon: Shield,       label: "Role-based permissions", desc: "Each person sees only what they need." },
  ]},
  { title: "Tax & compliance", features: [
    { Icon: Percent,      label: "Sales tax tracking",     desc: "GST/HST, PST, automatically calculated." },
    { Icon: Receipt,      label: "Federal & provincial",   desc: "Stay compliant across every jurisdiction." },
    { Icon: FileText,     label: "Year-end reports",       desc: "Everything your accountant needs." },
    { Icon: Search,       label: "Audit trail",            desc: "Every change tracked and recoverable." },
  ]},
  { title: "Reports & intelligence", features: [
    { Icon: BarChart3,    label: "Live dashboards",        desc: "Cash flow, revenue, expenses, in real time." },
    { Icon: TrendingUp,   label: "Profit & loss",          desc: "Always current, drillable by category." },
    { Icon: PieChart,     label: "Balance sheet",          desc: "Your full financial position at a glance." },
    { Icon: TrendingUp,   label: "Cash flow statement",    desc: "Where money came from, where it went." },
    { Icon: FileText,     label: "Custom reports",         desc: "Build the views your business needs." },
    { Icon: Sparkles,     label: "Nova assistant",         desc: "Ask questions in plain English, get answers." },
  ]},
  { title: "Platform", features: [
    { Icon: Smartphone,   label: "Mobile app",             desc: "iOS and Android, fully featured." },
    { Icon: Plug,         label: "200+ integrations",      desc: "Stripe, Shopify, your bank, and more." },
    { Icon: Lock,         label: "Bank-grade security",    desc: "Encryption in transit and at rest." },
    { Icon: Shield,       label: "Continuous backups",     desc: "Your data, protected automatically." },
    { Icon: Download,     label: "Anytime exports",        desc: "PDF, Excel, CSV, whenever you want." },
  ]},
];

// === Hooks & helpers ===
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
        <span style={{ fontSize: 15.5, fontWeight: 600, color: active ? TEAL : INK, transition: "color 0.15s", lineHeight: 1.4, paddingRight: 16 }}>{q}</span>
        <ChevronDown size={20} color={active ? TEAL : SUB} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.25s, color 0.15s", flexShrink: 0 }} />
      </button>
      <div style={{ maxHeight: isOpen ? 400 : 0, overflow: "hidden", transition: "max-height 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ padding: "0 22px 20px 22px", color: SUB, fontSize: 14.5, lineHeight: 1.7 }}>{a}</div>
      </div>
    </div>
  );
}

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

// === All Features Modal ===
function AllFeaturesModal({ open, onClose, onSeePricing }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(14,26,26,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: BG, borderRadius: 20, maxWidth: 1040, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 80px -20px rgba(0,0,0,0.45)", fontFamily: FONT }}
      >
        <MarketingHeader />
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {ALL_FEATURE_CATEGORIES.map((cat, ci) => (
            <section key={cat.title} style={{ marginBottom: ci === ALL_FEATURE_CATEGORIES.length - 1 ? 0 : 36 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", textTransform: "uppercase" }}>{cat.title}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {cat.features.map((f, fi) => (
                  <div key={fi} style={{ display: "flex", gap: 14, padding: "16px 18px", background: BG_TINT, borderRadius: 12, border: `1px solid ${BORDER_SOFT}`, transition: "all 0.15s", cursor: "default" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(15,149,153,0.25)"; e.currentTarget.style.boxShadow = SHADOW_SM; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = BG_TINT; e.currentTarget.style.borderColor = BORDER_SOFT; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, background: TEAL_TINT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <f.Icon size={18} strokeWidth={1.9} color={TEAL} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: INK, letterSpacing: "-0.01em" }}>{f.label}</div>
                      {f.desc && <div style={{ fontSize: 13, color: SUB, marginTop: 3, lineHeight: 1.5 }}>{f.desc}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        <footer style={{ padding: "18px 32px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "flex-end", gap: 12, background: BG_TINT }}>
          <button
            onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.background = "#fff"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            style={{ background: "transparent", color: INK, border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
          >Close</button>
          <button
            onClick={onSeePricing}
            onMouseEnter={(e) => e.currentTarget.style.background = TEAL_DARK}
            onMouseLeave={(e) => e.currentTarget.style.background = TEAL}
            style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, transition: "background 0.15s" }}
          >
            See pricing <ArrowRight size={15} strokeWidth={2.4} />
          </button>
        </footer>
      </div>
    </div>
  );
}

// === Main Landing ===
export default function Landing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [hoverFaq, setHoverFaq] = useState(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
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
    { Icon: ScanLine,  title: "Receipt scanner",       desc: "Snap a photo and Nova extracts merchant, date, tax, and totals in seconds. Manual entry, retired." },
    { Icon: Brain,     title: "Smart bookkeeping",     desc: "Transactions get categorized, matched, and reconciled automatically. Books stay current without you lifting a finger." },
    { Icon: FileText,  title: "Invoicing",             desc: "Branded invoices, recurring billing, and automatic reminders. Get paid faster with less effort." },
    { Icon: CreditCard,title: "Online payments",       desc: "Accept card and bank payments directly on every invoice. Stripe and major processors built in." },
    { Icon: Banknote,  title: "Payroll",               desc: "Salaried and hourly runs, direct deposit, time off, and year-end forms. Pay your team in minutes." },
    { Icon: BarChart3, title: "Reports & dashboards",  desc: "Cash flow, profit and loss, balance sheet, all live. Know exactly where the business stands at any moment." },
  ];

  const faqs = [
    { q: "What is Novala?",
      a: "Novala is a complete platform for running your business finances: accounting, invoicing, payments, and payroll in one place. Nova, the engine behind the platform, handles the day-to-day work so you can focus on growing." },
    { q: "How does the receipt scanner work?",
      a: "Take a photo with the Novala app, drag a PDF in, or forward an email. Nova extracts the merchant, date, tax, totals, and category in seconds, then matches the receipt against your bank feed automatically." },
    { q: "Is my financial data secure?",
      a: "Yes. Novala uses bank-grade encryption in transit and at rest, role-based access controls, and continuous backups. Your data is yours, exportable any time, and never shared without your explicit permission." },
    { q: "Can I try Novala before paying?",
      a: "Every plan includes a 30-day free trial. No credit card required to start. You can switch plans or cancel any time from your account settings." },
    { q: "Does Novala work for my industry?",
      a: "Novala fits any business that tracks income, expenses, payroll, and taxes. From freelancers to healthcare practices to retail shops, Nova learns your categories and rules as you use it." },
    { q: "Can I import my existing books?",
      a: "Yes. Novala imports from QuickBooks, Xero, Wave, FreshBooks, and standard CSV exports. Most businesses are migrated and reconciled within a few hours of signing up." },
    { q: "Does Novala handle payroll?",
      a: "Yes. Payroll, direct deposit, time off tracking, and year-end forms (T4, T5) are all built in. Pay your team in minutes and stay on top of compliance automatically." },
    { q: "What integrations are included?",
      a: "Over 200 integrations including Stripe, Shopify, PayPal, Square, all major Canadian and US banks, and most e-commerce and payment platforms. New integrations are added monthly." },
    { q: "Can multiple team members use Novala?",
      a: "Yes. Add your bookkeeper, accountant, or team members with role-based permissions so each person sees exactly what they need and nothing they shouldn't." },
    { q: "Does Novala help with taxes?",
      a: "Sales tax tracking, federal and provincial reporting, deduction surfacing, and year-end summaries are all built in. Export everything your accountant needs in one click." },
    { q: "Is there a mobile app?",
      a: "Yes. The Novala app for iOS and Android lets you scan receipts, send invoices, check dashboards, and approve payroll from anywhere." },
    { q: "What if I need help getting set up?",
      a: "Every plan includes onboarding support and access to a help centre packed with guides. Higher tiers include a dedicated account manager and priority chat support." },
  ];

  const testimonials = [
    { quote: "Replaced two hours of weekly bookkeeping with about ten minutes of glancing at the dashboard. Novala just gets it right.",
      role: "Owner", company: "Multi-location Healthcare Services" },
    { quote: "Cash flow used to be a guessing game. Now it is a live number on our screen. Invoicing and payroll finally feel handled.",
      role: "Founder", company: "eCommerce Brand" },
    { quote: "We tried three other platforms before this one. Novala is the first one that actually does what it promises.",
      role: "Operations Director", company: "Professional Services Firm" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: FONT, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>

      {/* === Sticky Nav === */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.92)", borderBottom: `1px solid ${BORDER_SOFT}`, backdropFilter: "saturate(180%) blur(12px)" }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "0 32px", height: NAV_H, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <NovalaLogo size={32} color={INK} />
          </span>
          <nav style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <a href="#features" style={{ color: INK, fontSize: 14.5, fontWeight: 500, textDecoration: "none", padding: "8px 14px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 6, transition: "background 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = BG_TINT}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <Layers size={15} strokeWidth={2} color={TEAL} /> Features
            </a>
            <a onClick={() => navigate("/pricing")} style={{ color: INK, fontSize: 14.5, fontWeight: 500, cursor: "pointer", padding: "8px 14px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 6, transition: "background 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = BG_TINT}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <Wallet size={15} strokeWidth={2} color={TEAL} /> Pricing
            </a>
            <a href="#faq" style={{ color: INK, fontSize: 14.5, fontWeight: 500, textDecoration: "none", padding: "8px 14px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 6, transition: "background 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = BG_TINT}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <HelpCircle size={15} strokeWidth={2} color={TEAL} /> FAQ
            </a>
            <span onClick={() => navigate("/login")} style={{ color: INK, fontSize: 14.5, fontWeight: 600, cursor: "pointer", padding: "8px 14px", marginLeft: 12 }}>Sign in</span>
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
      <section style={{ padding: "96px 32px 72px", background: `radial-gradient(60% 60% at 50% 0%, ${TEAL_TINT_2} 0%, ${BG} 60%)` }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: TEAL_TINT, border: "1px solid rgba(15,149,153,0.2)", fontSize: 13, fontWeight: 600, color: TEAL_DARK, marginBottom: 24 }}>
              <Sparkles size={14} />
              <span>One platform. Every part of your business.</span>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 style={{ margin: 0, fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 800, color: INK, letterSpacing: "-0.035em", lineHeight: 1.05, maxWidth: 980, marginInline: "auto" }}>
              Run your <span style={{ color: TEAL }}>whole business</span> from one place.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ margin: "22px auto 0", fontSize: 18.5, color: SUB, lineHeight: 1.55, maxWidth: 660 }}>
              Accounting, invoicing, payments, and payroll. All powered by Nova. So you can stay focused on what actually grows the business.
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

      {/* === Trust strip === */}
      <section style={{ padding: "48px 32px", background: BG_TINT, borderTop: `1px solid ${BORDER_SOFT}`, borderBottom: `1px solid ${BORDER_SOFT}` }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32 }}>
          <StatTile value={10000} suffix="+" label="Receipts handled daily" />
          <StatTile value={98}    suffix="%"  label="Match accuracy" />
          <StatTile value={8}     suffix=" hrs" label="Saved per week, on average" />
          <StatTile value={47}    suffix=" sec" label="Upload to recorded" />
        </div>
      </section>

      {/* === How it works === */}
      <section style={{ padding: "112px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>How it works</div>
              <h2 style={{ margin: 0, fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 800, color: INK, letterSpacing: "-0.025em", lineHeight: 1.15 }}>From upload to recorded in <span style={{ color: TEAL }}>seconds</span>.</h2>
              <p style={{ margin: "18px auto 0", fontSize: 17, color: SUB, lineHeight: 1.6 }}>Three steps. No accountant required. No spreadsheets harmed.</p>
            </div>
          </Reveal>
          <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {[
              { num: "01", Icon: ScanLine, title: "Snap or upload",  desc: "Take a photo of a receipt, drag a PDF in, or forward an email. Nova handles everything from there." },
              { num: "02", Icon: Brain,    title: "Nova reads it",   desc: "Merchant, date, tax, totals, and category are extracted, matched, and reconciled automatically." },
              { num: "03", Icon: BarChart3,title: "See the picture", desc: "Live dashboards update in real time. Cash flow, deductions, and tax obligations always current." },
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

      {/* === Features grid === */}
      <section id="features" style={{ padding: "112px 32px", background: BG_TINT }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 56px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>What is inside</div>
              <h2 style={{ margin: 0, fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 800, color: INK, letterSpacing: "-0.025em", lineHeight: 1.15 }}>Everything your business runs on.</h2>
              <p style={{ margin: "18px auto 0", fontSize: 17, color: SUB, lineHeight: 1.6 }}>Accounting, invoicing, payments, payroll, and reporting, working together so you do not have to.</p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22 }}>
            {features.map((f, i) => (
              <FeatureCard key={i} Icon={f.Icon} title={f.title} desc={f.desc} delay={i * 0.06} />
            ))}
          </div>
          <Reveal delay={0.2}>
            <div style={{ marginTop: 56, textAlign: "center" }}>
              <button
                onClick={() => setShowAllFeatures(true)}
                onMouseEnter={(e) => { e.currentTarget.style.background = TEAL; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = TEAL; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = BG; e.currentTarget.style.color = INK; e.currentTarget.style.borderColor = BORDER; }}
                style={{ background: BG, color: INK, border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: "14px 24px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}
              >
                <Layers size={16} strokeWidth={2} />
                View all features
                <ArrowRight size={16} strokeWidth={2.4} />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* === Social proof (3 anonymous cards) === */}
      <section style={{ padding: "96px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 56px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>What teams say</div>
              <h2 style={{ margin: 0, fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: INK, letterSpacing: "-0.025em", lineHeight: 1.2 }}>Trusted by businesses that ship.</h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22 }}>
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "30px 26px", height: "100%", boxShadow: SHADOW_SM, display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    {[0,1,2,3,4].map(s => <Star key={s} size={16} fill={TEAL} color={TEAL} strokeWidth={0} />)}
                  </div>
                  <blockquote style={{ margin: 0, fontSize: 16, fontWeight: 500, color: INK, lineHeight: 1.55, letterSpacing: "-0.005em", flex: 1 }}>
                    "{t.quote}"
                  </blockquote>
                  <div style={{ paddingTop: 14, borderTop: `1px solid ${BORDER_SOFT}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{t.role}</div>
                    <div style={{ fontSize: 13, color: SUB, marginTop: 2 }}>{t.company}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* === Pricing teaser === */}
      <section style={{ padding: "32px 32px 112px" }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <Reveal>
            <div style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`, borderRadius: 28, padding: "64px 48px", color: "#fff", textAlign: "center", boxShadow: "0 30px 60px -24px rgba(15,149,153,0.5)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.15, background: "radial-gradient(60% 100% at 100% 0%, rgba(255,255,255,0.4), transparent)" }} />
              <div style={{ position: "relative" }}>
                <h2 style={{ margin: 0, fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 }}>Find the plan that fits.</h2>
                <p style={{ margin: "18px auto 0", fontSize: 17, lineHeight: 1.6, maxWidth: 540, opacity: 0.92 }}>Compare features side by side and pick the tier that is right for your business. Every plan starts with a 30-day free trial.</p>
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
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Questions</div>
              <h2 style={{ margin: 0, fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: INK, letterSpacing: "-0.025em", lineHeight: 1.2 }}>Frequently asked</h2>
              <p style={{ margin: "16px auto 0", fontSize: 16, color: SUB, lineHeight: 1.6, maxWidth: 580 }}>Everything you need to know before you sign up.</p>
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
            <h2 style={{ margin: 0, fontSize: "clamp(30px, 4vw, 46px)", fontWeight: 800, color: INK, letterSpacing: "-0.03em", lineHeight: 1.15 }}>Ready to put your business on autopilot?</h2>
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

      {/* === Footer === */}
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
            <span><NovalaLogo size={28} color="#fff" /></span>
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

      {/* === All Features Modal === */}
      <AllFeaturesModal
        open={showAllFeatures}
        onClose={() => setShowAllFeatures(false)}
        onSeePricing={() => { setShowAllFeatures(false); navigate("/pricing"); }}
      />
    </div>
  );
}
