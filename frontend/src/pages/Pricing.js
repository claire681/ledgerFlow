import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, Sparkles, Star, ShieldCheck, MessageSquare, Smartphone, Plug } from "lucide-react";

const TEAL = "#0F9599";
const TEAL_DARK = "#0B7377";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const BORDER = "#DDE5E5";
const BG = "#F9FAFB";
const FOOTER_DARK = "#0B3D3D";
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
  { q: "Can I cancel anytime?", a: "Yes. Novala is month-to-month and you can cancel from your Billing settings — no contracts or termination fees." },
  { q: "What happens after the promo period?", a: "Your plan continues at the regular monthly price. We'll email you before the price changes so there are no surprises." },
  { q: "Can I switch plans later?", a: "Anytime. Upgrades take effect immediately and we prorate the difference. Downgrades take effect at the end of your current billing cycle." },
  { q: "Do you offer a free trial?", a: "Yes. Switch the billing toggle to \"Free trial for 30 days\" to get full access to your chosen plan with no credit card required up front." },
  { q: "Is my data secure?", a: "Novala uses bank-level encryption in transit and at rest, with continuous monitoring and audited backups. Your data is yours — export any time." },
  { q: "Can my accountant access Novala?", a: "Yes. On Growth and Scale you can invite your accountant or bookkeeper as a user at no extra seat cost." },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [billingMode, setBillingMode] = useState("promo");
  const [openCategories, setOpenCategories] = useState(() => Object.fromEntries(COMPARISON.map(c => [c.category, true])));
  const [openFaqs, setOpenFaqs] = useState({});
  const [faqShowAll, setFaqShowAll] = useState(false);

  const toggleCategory = (name) => setOpenCategories(s => ({ ...s, [name]: !s[name] }));
  const toggleFaq = (i) => setOpenFaqs(s => ({ ...s, [i]: !s[i] }));

  const choosePlan = (planId) => {
    // TODO: wire to the real next-step route once Claire answers spec §9 Q2/Q3 (add-ons step vs straight to checkout)
    navigate(`/signup?plan=${planId}`);
  };

  const scrollToCompare = () => {
    const el = document.getElementById("compare-all");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const visibleFaqs = faqShowAll ? FAQS : FAQS.slice(0, 4);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: INK }}>

      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: `1px solid ${BORDER}`, height: NAV_H }}>
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
          {["AI-powered bookkeeping", "Free email + chat support", "No contracts — cancel anytime"].map((t, i) => (
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
        <div style={{ display: "inline-flex", background: "#F1F5F5", borderRadius: 999, padding: 4 }}>
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
                <div key={p.id} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", border: p.featured ? `2px solid ${TEAL}` : `1px solid ${BORDER}`, textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: INK }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: SUB, marginTop: 2 }}>${p.promoPrice}/mo</div>
                  <button onClick={() => choosePlan(p.id)} style={{ marginTop: 8, width: "100%", padding: "8px 0", borderRadius: 6, background: TEAL, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Choose plan</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: `1px solid ${BORDER}` }}>
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
            { Icon: Smartphone, title: "Free mobile apps", body: "Manage your business on the go — iOS and Android. Same features, same data, anywhere." },
            { Icon: MessageSquare, title: "Live support", body: "Real humans, real fast — email and live chat are included on every plan." },
            { Icon: Plug, title: "App integrations", body: "Connect 200+ tools you already use, from Stripe to Shopify to your favorite CRM." },
          ].map((f, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E6F6F6", border: "1px solid rgba(15,149,153,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
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
            <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", background: "#fff" }}>
              <button onClick={() => toggleFaq(i)} style={{ width: "100%", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                <span style={{ fontWeight: 600, fontSize: 16, color: INK }}>{f.q}</span>
                {openFaqs[i] ? <ChevronUp size={20} color={SUB} /> : <ChevronDown size={20} color={SUB} />}
              </button>
              {openFaqs[i] && <div style={{ padding: "0 20px 18px 20px", color: SUB, fontSize: 15, lineHeight: 1.6 }}>{f.a}</div>}
            </div>
          ))}
        </div>
        {!faqShowAll && FAQS.length > 4 && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <button onClick={() => setFaqShowAll(true)} style={{ background: "none", border: "none", color: TEAL, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>Load more questions</button>
          </div>
        )}
      </section>

      <footer style={{ background: FOOTER_DARK, color: "#fff", padding: "48px 32px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 40, marginBottom: 32 }}>
            {[
              { title: "Product", items: ["Features", "Pricing", "Security", "Integrations"] },
              { title: "Company", items: ["About", "Blog", "Careers", "Contact"] },
              { title: "Resources", items: ["Help Center", "Community", "Training", "Status"] },
              { title: "Legal", items: ["Privacy", "Terms", "Cookies"] },
            ].map((col, i) => (
              <div key={i}>
                <h4 style={{ margin: "0 0 14px 0", fontSize: 14, fontWeight: 700, color: "#fff" }}>{col.title}</h4>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.items.map((it, j) => <li key={j}><a href="#" style={{ color: "rgba(255,255,255,0.78)", textDecoration: "none", fontSize: 14 }}>{it}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 24, fontSize: 13, color: "rgba(255,255,255,0.78)" }}>© 2026 Novala · BrightCare Home Healthcare Services Inc.</div>
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
    <div style={{ position: "relative", background: "#fff", border: plan.featured ? `2px solid ${TEAL}` : `1px solid ${BORDER}`, borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", boxShadow: plan.featured ? "0 24px 48px -24px rgba(15,149,153,0.35)" : "0 6px 18px -10px rgba(0,0,0,0.08)" }}>
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
        <button onClick={onChoose} style={{ width: "100%", marginTop: 20, padding: "13px 20px", borderRadius: 10, background: TEAL, color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 14px -6px rgba(15,149,153,0.5)" }}>Choose plan</button>
        <div style={{ fontSize: 13, color: SUB, marginTop: 14, textAlign: "center" }}>Up to <strong>{plan.seats}</strong> {plan.seats === 1 ? "user" : "users"}</div>
      </div>

      <div style={{ marginTop: 24, padding: 16, background: "#F1F5F5", borderRadius: 10 }}>
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
