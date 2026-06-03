import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, Sparkles, Star, ShieldCheck, MessageSquare, Smartphone, Plug, Globe } from "lucide-react";

const TEAL = "#00D4A4";
const TEAL_DARK = "#00B388";
const INK = "#F1F5F9";
const SUB = "#64748B";
const BORDER = "#1E2D4A";
const BG = "#0F1729";
const FOOTER_DARK = "#1A2540";
const CONTENT_MAX = 1280;
const NAV_H = 64;

// TODO: replace placeholder plan data with real Novala plans/prices (spec §9 Q1)
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For solopreneurs and side hustles",
    ribbon: null,
    featured: false,
    regularPrice: 19,
    promoPrice: 9,
    promoNote: "Save 52% for 6 months",
    seats: 1,
    highlightGroup: {
      title: "Novala Intelligence",
      items: ["Smart transaction auto-categorization", "AI receipt scanner"],
    },
    checklist: [
      "Track income and expenses",
      "Send invoices and accept payments",
      "Connect 1 bank or credit card",
      "Run basic reports",
      "Mobile receipt capture",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "For growing small businesses",
    ribbon: "MOST POPULAR",
    featured: true,
    regularPrice: 59,
    promoPrice: 29,
    promoNote: "Save 51% for 6 months",
    seats: 5,
    highlightGroup: {
      title: "Novala Intelligence",
      items: [
        "Everything in Starter, plus:",
        "AI bookkeeping insights",
        "Document AI for vendor bills",
        "Auto-match receipts to transactions",
      ],
    },
    checklist: [
      "Up to 5 users",
      "Recurring invoices and subscriptions",
      "Bill pay and vendor management",
      "Multi-currency support",
      "Enhanced reports + custom dashboards",
      "Sales tax automation",
      "Project tracking",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "For established teams and operators",
    ribbon: "BUILT FOR SCALE",
    featured: false,
    regularPrice: 199,
    promoPrice: 99,
    promoNote: "Save 50% for 6 months",
    seats: 25,
    highlightGroup: {
      title: "Novala Intelligence",
      items: [
        "Everything in Growth, plus:",
        "AI-drafted month-end close",
        "Anomaly detection on transactions",
        "Custom workflow automations",
      ],
    },
    checklist: [
      "Up to 25 users",
      "Workflow automation engine",
      "Custom roles and permissions",
      "Inventory and order management",
      "Comprehensive business intelligence",
      "Priority support",
      "Dedicated account manager",
    ],
  },
];

// TODO: replace placeholder comparison matrix with real Novala feature data (spec §9 Q1)
const COMPARISON = [
  {
    category: "Novala Intelligence",
    rows: [
      { label: "Auto-categorize transactions", values: [true, true, true] },
      { label: "AI receipt scanner", values: [true, true, true] },
      { label: "Document AI for vendor bills", values: [false, true, true] },
      { label: "AI bookkeeping insights", beta: true, values: [false, true, true] },
      { label: "Anomaly detection", values: [false, false, true] },
      { label: "AI-drafted month-end close", beta: true, values: [false, false, true] },
    ],
  },
  {
    category: "Accounting",
    rows: [
      { label: "Track income and expenses", values: [true, true, true] },
      { label: "Bank reconciliation", values: [true, true, true] },
      { label: "Multi-currency", values: [false, true, true] },
      { label: "Custom fields", values: [false, "8", "25"] },
      { label: "Users", values: ["1", "5", "25"] },
    ],
  },
  {
    category: "Sales & Get Paid",
    rows: [
      { label: "Send invoices", values: [true, true, true] },
      { label: "Accept online payments", values: [true, true, true] },
      { label: "Recurring invoices", values: [false, true, true] },
      { label: "Custom invoice branding", values: ["Basic", "Full", "Full"] },
      { label: "Payment plans", values: [false, false, true] },
    ],
  },
  {
    category: "Expenses",
    rows: [
      { label: "Receipt capture", values: [true, true, true] },
      { label: "Mileage tracking", values: [false, true, true] },
      { label: "Bill pay", values: [false, true, true] },
      { label: "Approval workflows", values: [false, false, true] },
    ],
  },
  {
    category: "Reports",
    rows: [
      { label: "Report depth", values: ["Standard", "Enhanced", "Comprehensive"] },
      { label: "Custom report builder", values: [false, false, true] },
      { label: "Cash flow forecast", values: [false, true, true] },
    ],
  },
];

const FAQS = [
  {
    q: "Which Novala plan is best for a small business?",
    intro: "Novala's plans scale from solo operators to growing teams. Pick the tier that matches your current stage:",
    bullets: [
      { lead: "Starter", body: "for sole proprietors and freelancers. Core invoicing, expense tracking, and reporting for one user." },
      { lead: "Growth", body: "for small teams (up to 5 users). Adds bill management, time tracking, and multi-currency support." },
      { lead: "Scale", body: "for businesses with employees or inventory. Supports up to 25 users and includes project profitability tracking." },
    ],
  },
  {
    q: "Which Novala plan is right for a growing or mid-sized business?",
    intro: "For businesses that need more than bookkeeping, Scale is Novala's most capable tier, built to grow with your team while keeping your financial data organized and accessible:",
    bullets: [
      { lead: "Expanded access", body: "up to 25 users with customizable permissions." },
      { lead: "Workflow automation", body: "automated triggers for reminders, approvals, and batch transactions." },
      { lead: "Advanced insights", body: "customizable KPI dashboards and deep financial reports." },
      { lead: "Business analytics", body: "cash-flow forecasting and trend analysis." },
      { lead: "Priority support", body: "fast-lane email and live chat from real humans." },
    ],
  },
  {
    q: "How do I access Novala, and does it work on any device?",
    intro: "Novala is fully cloud-based. Sign in from any modern browser on desktop, tablet, or phone.",
    bullets: [
      { lead: "Automatic updates", body: "new features and security patches roll out without you lifting a finger." },
      { lead: "Secure backups", body: "your data is continuously backed up and encrypted in transit and at rest." },
      { lead: "AI-assisted workflows", body: "Novala Intelligence handles categorization, receipt matching, and insights." },
      { lead: "App integrations", body: "connect 200+ tools you already use, from Stripe to Shopify." },
      { lead: "Remote accountant access", body: "invite your bookkeeper to collaborate from anywhere." },
    ],
  },
  {
    q: "Can I import my data from another accounting tool?",
    intro: "Yes. Moving to Novala doesn't mean starting from scratch.",
    bullets: [
      { lead: "CSV import", body: "bring in your existing transactions, customers, vendors, and chart of accounts." },
      { lead: "Bank reconnection", body: "link the same bank accounts you used elsewhere. Novala pulls fresh history automatically." },
      { lead: "Guided setup", body: "our onboarding flow walks you through importing and mapping data step by step." },
    ],
  },
  {
    q: "Can I try Novala before buying?",
    intro: 'Yes. Every plan offers a 30-day free trial. Switch the billing toggle above to "Free trial for 30 days" to get started.',
    bullets: [
      { lead: "Credit card", body: "not required to start your trial." },
      { lead: "Discount trade-off", body: "the free trial and the promotional discount are mutually exclusive, so pick one or the other." },
      { lead: "Onboarding", body: "Scale-plan trials include a complimentary onboarding session with a product specialist." },
    ],
  },
  {
    q: "Is there an annual billing option, and does it save money?",
    intro: "Yes. Annual billing typically saves about 20% compared to paying monthly.",
    bullets: [
      { lead: "Savings vary by plan", body: "compare both options in the pricing cards above." },
      { lead: "Single invoice", body: "one invoice per year simplifies reconciliation and expense tracking." },
      { lead: "Rate lock", body: "your price is fixed for 12 months, which protects you from any mid-year price changes." },
    ],
  },
  {
    q: "Are there any additional costs beyond the subscription price?",
    intro: "Your subscription covers core accounting and bookkeeping. A few optional extras may apply depending on your needs:",
    bullets: [
      { lead: "Payroll", body: "available as a monthly add-on with CRA-compliant tax filings and direct deposit." },
      { lead: "Payment processing", body: "Novala Payments charges a per-transaction fee only when you accept a payment." },
      { lead: "User limits", body: "each plan includes a set number of seats; growing past it requires upgrading to a higher tier." },
      { lead: "Third-party apps", body: "some integrations carry their own separate subscriptions billed by the vendor." },
    ],
  },
  {
    q: "Can I switch plans or cancel at any time?",
    intro: "Yes. Novala is month-to-month with no contracts, no termination fees, and no questions asked.",
    bullets: [
      { lead: "Switching", body: "upgrades take effect immediately; downgrades take effect at the start of the next billing cycle." },
      { lead: "Data retention", body: "after canceling, your account stays read-only for 30 days so you can export anything you need." },
      { lead: "Data ownership", body: "your data is always yours. Export lists and reports any time before that window closes." },
    ],
  },
  {
    q: "Can I upgrade or downgrade my Novala plan?",
    intro: "Yes. Novala scales with your business.",
    bullets: [
      { lead: "Upgrading", body: "move to a higher tier instantly; billing is prorated for the remainder of your current cycle." },
      { lead: "Downgrading", body: "takes effect at the start of the next billing cycle so you keep premium access until then." },
      { lead: "Feature considerations", body: "downgrading may remove access to higher-tier features like inventory tracking, project tools, or extra seats. Export related reports first." },
    ],
  },
  {
    q: "Can I add my accountant or bookkeeper to my account?",
    intro: "Yes. Growth and Scale plans let you invite one accounting professional to collaborate at no extra charge.",
    bullets: [
      { lead: "Dedicated seat", body: "your accountant gets their own secure login that does not count toward your plan's user limit." },
      { lead: "Real-time collaboration", body: "they can review transactions, fix errors, and run reports without exporting files." },
      { lead: "Total control", body: "adjust their permissions or remove access at any time from your team settings." },
    ],
  },
];

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
  { title: "Product",   items: ["Receipt scanner (Nova AI)", "AI bookkeeping", "Invoicing & invoice generator", "Transactions", "Documents", "Dashboard", "Tax", "Nova AI assistant", "Pricing & plans", "See all features"] },
  { title: "Features",  items: ["Auto receipt capture & scan", "Expense tracking", "Bank feed / transactions", "Reports", "Document storage", "Sales tax tracking", "Team / multi-user access", "See all features"] },
  { title: "Resources", items: ["Help centre", "Getting started guide", "Invoice templates", "Blog / updates", "Status page", "Contact support"] },
  { title: "Company",   items: ["About Novala", "Support", "Tutorials", "Product updates", "Careers", "Contact"] },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [billingMode, setBillingMode] = useState("promo");
  const [openCategories, setOpenCategories] = useState(() => Object.fromEntries(COMPARISON.map(c => [c.category, true])));
  const [openFaqs, setOpenFaqs] = useState({});
  const [hoverFaq, setHoverFaq] = useState(null);
  const [locale, setLocale] = useState("en-CA");
  const [showFooterLocale, setShowFooterLocale] = useState(false);
  const footerLocaleRef = useRef(null);

  const currentFooterLocale = FOOTER_LOCALES.find(l => l.code === locale) || FOOTER_LOCALES[2];

  useEffect(() => {
    const handler = (e) => {
      if (footerLocaleRef.current && !footerLocaleRef.current.contains(e.target)) setShowFooterLocale(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const [faqShowAll, setFaqShowAll] = useState(false);

  const toggleCategory = (name) => setOpenCategories(s => ({ ...s, [name]: !s[name] }));
  const toggleFaq = (i) => setOpenFaqs(s => ({ ...s, [i]: !s[i] }));

  const choosePlan = (planId) => {
    // TODO: wire to the real next-step route once Claire answers spec §9 Q2/Q3 (add-ons step vs straight to checkout)
    navigate(`/checkout?plan=${planId}&billing=${billingMode}`);
  };

  const scrollToCompare = () => {
    const el = document.getElementById("compare-all");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const visibleFaqs = faqShowAll ? FAQS : FAQS.slice(0, 4);

  return (
    <div style={{ minHeight: "100vh", background: "#162035", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: INK }}>

      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "#162035", borderBottom: `1px solid ${BORDER}`, height: NAV_H }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "0 32px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ color: TEAL, fontWeight: 800, fontSize: 24, letterSpacing: "-0.015em" }}>Novala</span>
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 14 }}>
            <a href="#" style={{ color: INK, textDecoration: "none", fontWeight: 500 }}>Features</a>
            <a href="/pricing" style={{ color: TEAL, textDecoration: "none", fontWeight: 600 }}>Pricing</a>
            <a href="#" style={{ color: INK, textDecoration: "none", fontWeight: 500 }}>Support</a>
            <a href="/login" style={{ color: INK, textDecoration: "none", fontWeight: 500 }}>Sign in</a>
            <button onClick={() => choosePlan("growth")} style={{ padding: "10px 18px", borderRadius: 8, background: TEAL, color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Get started</button>
          </nav>
        </div>
      </header>

      <section style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "64px 32px 24px", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em", color: INK }}>Find a plan that's right for you</h1>
        <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 36, flexWrap: "wrap" }}>
          {["AI-powered bookkeeping", "Free email + chat support", "No contracts, cancel anytime"].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, color: SUB, fontSize: 15 }}>
              <Check size={18} color={TEAL} strokeWidth={3} />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "16px 32px 0", display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: SUB }}>
          <Step n={1} label="Select plan" active />
          <span style={{ color: BORDER }}>—</span>
          <Step n={2} label="Add-ons (optional)" />
          <span style={{ color: BORDER }}>—</span>
          <Step n={3} label="Checkout" />
        </div>
      </section>

      <section style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "32px 32px 0", display: "flex", justifyContent: "center" }}>
        <div style={{ display: "inline-flex", background: "#1F2A45", borderRadius: 999, padding: 4 }}>
          {[{ id: "promo", label: "Buy now & save" }, { id: "trial", label: "Free trial for 30 days" }].map(t => (
            <button key={t.id} onClick={() => setBillingMode(t.id)} style={{ padding: "10px 20px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", background: billingMode === t.id ? "#fff" : "transparent", color: billingMode === t.id ? INK : SUB, boxShadow: billingMode === t.id ? "0 1px 3px rgba(16,24,40,0.12)" : "none", transition: "all 0.18s" }}>{t.label}</button>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "48px 32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, alignItems: "stretch" }}>
          {PLANS.map(p => (
            <PlanCard key={p.id} plan={p} billingMode={billingMode} onChoose={() => choosePlan(p.id)} onSeeFeatures={scrollToCompare} />
          ))}
        </div>
      </section>

      <section id="compare-all" style={{ background: BG, marginTop: 48 }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "64px 32px 80px" }}>
          <h2 style={{ margin: "0 0 32px 0", fontSize: 32, fontWeight: 700, color: INK, letterSpacing: "-0.015em" }}>Compare all features</h2>

          <div style={{ position: "sticky", top: NAV_H, zIndex: 40, background: BG, paddingTop: 12, paddingBottom: 12, marginBottom: 12, boxShadow: "0 6px 16px -8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(3, 1fr)", gap: 16 }}>
              <div></div>
              {PLANS.map(p => (
                <div key={p.id} style={{ background: "#162035", borderRadius: 10, padding: "12px 14px", border: p.featured ? `2px solid ${TEAL}` : `1px solid ${BORDER}`, textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: INK }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: SUB, marginTop: 2 }}>${p.promoPrice}/mo</div>
                  <button onClick={() => choosePlan(p.id)} style={{ marginTop: 8, width: "100%", padding: "8px 0", borderRadius: 6, background: TEAL, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Choose plan</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#162035", borderRadius: 14, overflow: "hidden", border: `1px solid ${BORDER}` }}>
            {COMPARISON.map((cat, ci) => (
              <CategoryPanel key={cat.category} category={cat} plans={PLANS} isOpen={openCategories[cat.category]} onToggle={() => toggleCategory(cat.category)} isLast={ci === COMPARISON.length - 1} />
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "80px 32px 32px" }}>
        <h2 style={{ margin: "0 0 32px 0", fontSize: 28, fontWeight: 700, color: INK, textAlign: "center", letterSpacing: "-0.01em" }}>All plans include</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {[
            { Icon: Smartphone, title: "Free mobile apps", body: "Manage your business on the go, iOS and Android. Same features, same data, anywhere." },
            { Icon: MessageSquare, title: "Live support", body: "Real humans, real fast, email and live chat are included on every plan." },
            { Icon: Plug, title: "App integrations", body: "Connect 200+ tools you already use, from Stripe to Shopify to your favorite CRM." },
          ].map((f, i) => (
            <div key={i} style={{ background: "#162035", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E6F6F6", border: "1px solid rgba(0,212,164,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <f.Icon size={22} color={TEAL} strokeWidth={1.9} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 17, color: INK, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: SUB, lineHeight: 1.55 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "40px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: INK }}>50,000+</div>
            <div style={{ fontSize: 14, color: SUB, marginTop: 4 }}>businesses trust Novala</div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              {[1, 2, 3, 4, 5].map(s => <Star key={s} size={22} fill="#F5A623" color="#F5A623" />)}
              <span style={{ fontSize: 22, fontWeight: 800, color: INK, marginLeft: 8 }}>4.8</span>
            </div>
            <div style={{ fontSize: 14, color: SUB, marginTop: 4 }}>across 12,000+ reviews</div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <ShieldCheck size={28} color={TEAL} />
              <span style={{ fontSize: 18, fontWeight: 700, color: INK }}>SOC 2 certified</span>
            </div>
            <div style={{ fontSize: 14, color: SUB, marginTop: 4 }}>bank-level security and encryption</div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 880, margin: "0 auto", padding: "64px 32px 80px" }}>
        <h2 style={{ margin: "0 0 32px 0", fontSize: 28, fontWeight: 700, color: INK, textAlign: "center", letterSpacing: "-0.01em" }}>Frequently asked questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visibleFaqs.map((f, i) => (
            <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", background: "#162035" }}>
              <button
                onClick={() => toggleFaq(i)}
                onMouseEnter={() => setHoverFaq(i)}
                onMouseLeave={() => setHoverFaq(null)}
                style={{ width: "100%", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
              >
                <span style={{ fontWeight: 600, fontSize: 16, color: (hoverFaq === i || openFaqs[i]) ? TEAL : INK, transition: "color 0.15s" }}>{f.q}</span>
                {openFaqs[i]
                  ? <ChevronUp size={20} color={(hoverFaq === i || openFaqs[i]) ? TEAL : SUB} />
                  : <ChevronDown size={20} color={(hoverFaq === i || openFaqs[i]) ? TEAL : SUB} />}
              </button>
              {openFaqs[i] && (
                <div style={{ padding: "0 20px 20px 20px", color: SUB, fontSize: 15, lineHeight: 1.65 }}>
                  {f.intro && <p style={{ margin: "0 0 12px 0" }}>{f.intro}</p>}
                  {f.bullets && (
                    <ul style={{ margin: 0, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 8 }}>
                      {f.bullets.map((b, bi) => (
                        <li key={bi}><strong style={{ color: INK }}>{b.lead}</strong>: {b.body}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {!faqShowAll && FAQS.length > 4 && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <button onClick={() => setFaqShowAll(true)} style={{ background: "none", border: "none", color: TEAL, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>Load more questions</button>
          </div>
        )}
      </section>

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
                {currentFooterLocale.flagSrc
                  ? <img src={currentFooterLocale.flagSrc} alt={currentFooterLocale.label} style={{ width: 24, height: 16, objectFit: "cover", borderRadius: 2, display: "block", border: "1px solid rgba(255,255,255,0.2)" }} />
                  : <Globe size={16} strokeWidth={1.8} />}
                <span>{currentFooterLocale.label}</span>
                <ChevronDown size={14} strokeWidth={2} />
              </button>
              {showFooterLocale && (
                <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, background: "#162035", border: `1px solid ${BORDER}`, borderRadius: 10, minWidth: 240, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)", zIndex: 50, overflow: "hidden" }}>
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
              {[
                { label: "LinkedIn", path: "M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" },
                { label: "X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                { label: "Facebook", path: "M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" },
                { label: "YouTube", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
                { label: "Instagram", path: "M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" },
              ].map((s, i) => (
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

function Step({ n, label, active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 24, height: 24, borderRadius: 999, background: active ? TEAL : "transparent", color: active ? "#fff" : SUB, border: active ? "none" : `1.5px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{n}</div>
      <span style={{ fontWeight: active ? 700 : 500, color: active ? INK : SUB }}>{label}</span>
    </div>
  );
}

function PlanCard({ plan, billingMode, onChoose, onSeeFeatures }) {
  const isPromo = billingMode === "promo";
  return (
    <div style={{ position: "relative", background: "#162035", border: plan.featured ? `2px solid ${TEAL}` : `1px solid ${BORDER}`, borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", boxShadow: plan.featured ? "0 24px 48px -24px rgba(0,212,164,0.35)" : "0 6px 18px -10px rgba(0,0,0,0.08)" }}>
      {plan.ribbon && (
        <div style={{ position: "absolute", top: -1, left: -1, right: -1, background: plan.featured ? TEAL : INK, color: "#fff", padding: "8px 16px", borderTopLeftRadius: 14, borderTopRightRadius: 14, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textAlign: "center" }}>{plan.ribbon}</div>
      )}
      <div style={{ marginTop: plan.ribbon ? 28 : 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: INK, marginBottom: 4 }}>{plan.name}</div>
        <div style={{ fontSize: 14, color: SUB, marginBottom: 20 }}>{plan.tagline}</div>
        {isPromo ? (
          <>
            <div style={{ fontSize: 14, color: SUB, textDecoration: "line-through" }}>${plan.regularPrice}/mo</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: 38, fontWeight: 800, color: INK, letterSpacing: "-0.02em" }}>${plan.promoPrice}</span>
              <span style={{ fontSize: 16, color: SUB, fontWeight: 500 }}>/mo</span>
            </div>
            <div style={{ fontSize: 13, color: TEAL, fontWeight: 600, marginTop: 4 }}>{plan.promoNote}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: TEAL, fontWeight: 600, marginBottom: 4 }}>Free for 30 days, then</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 38, fontWeight: 800, color: INK, letterSpacing: "-0.02em" }}>${plan.regularPrice}</span>
              <span style={{ fontSize: 16, color: SUB, fontWeight: 500 }}>/mo</span>
            </div>
          </>
        )}
        <button onClick={onChoose} style={{ width: "100%", marginTop: 20, padding: "13px 20px", borderRadius: 10, background: TEAL, color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 14px -6px rgba(0,212,164,0.5)" }}>Choose plan</button>
        <div style={{ fontSize: 13, color: SUB, marginTop: 14, textAlign: "center" }}>Up to <strong>{plan.seats}</strong> {plan.seats === 1 ? "user" : "users"}</div>
      </div>

      <div style={{ marginTop: 24, padding: 16, background: "#1F2A45", borderRadius: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Sparkles size={16} color={TEAL} strokeWidth={2} />
          <span style={{ fontWeight: 700, fontSize: 13, color: INK }}>{plan.highlightGroup.title}</span>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {plan.highlightGroup.items.map((it, i) => <li key={i} style={{ fontSize: 13, color: SUB, lineHeight: 1.45 }}>{it}</li>)}
        </ul>
      </div>

      <ul style={{ margin: "20px 0 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {plan.checklist.map((it, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: INK }}>
            <Check size={16} color={TEAL} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 3 }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>

      <button onClick={onSeeFeatures} style={{ marginTop: 20, background: "none", border: "none", color: TEAL, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", textAlign: "center", padding: 0 }}>See all features</button>
    </div>
  );
}

function CategoryPanel({ category, plans, isOpen, onToggle, isLast }) {
  return (
    <div style={{ borderBottom: isLast ? "none" : `1px solid ${BORDER}` }}>
      <button onClick={onToggle} style={{ width: "100%", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
        <span style={{ fontWeight: 700, fontSize: 17, color: INK }}>{category.category}</span>
        {isOpen ? <ChevronUp size={20} color={SUB} /> : <ChevronDown size={20} color={SUB} />}
      </button>
      {isOpen && (
        <div style={{ padding: "0 24px 16px" }}>
          {category.rows.map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(3, 1fr)", gap: 16, padding: "12px 0", borderTop: i === 0 ? "none" : `1px solid ${BORDER}`, alignItems: "center" }}>
              <div style={{ fontSize: 14, color: INK, display: "flex", alignItems: "center", gap: 8 }}>
                {row.label}
                {row.beta && <span style={{ background: TEAL, color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, letterSpacing: "0.06em" }}>BETA</span>}
              </div>
              {row.values.map((v, vi) => (
                <div key={vi} style={{ textAlign: "center", fontSize: 14, color: INK }}>
                  {v === true ? <Check size={18} color={TEAL} strokeWidth={2.5} style={{ display: "inline-block" }} /> : v === false ? <span style={{ color: BORDER, fontSize: 18 }}>–</span> : <span style={{ fontWeight: 600 }}>{v}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
