// Novala pricing page v2. AI name: Nexa AI (confirmed). Mounted at /pricing-v2.
// Phase A: Hero with H1, trust points, wizard steps, plan selector, billing toggle, three plan cards.
// Phase B will add the compare-all-features table. Phase C will add all-plans-include, trust band,
// FAQ, and wire the FeaturesModal to the "See all features" links under each plan card.

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles, ChevronDown, Smartphone, MessageCircle, Zap, Star, Shield } from "lucide-react";

import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";
import FeaturesModal from "../components/FeaturesModal";

const BRAND = "#0F9599";
const BRAND_DEEP = "#0E4B4D";
const BRAND_TINT = "rgba(15, 149, 153, 0.10)";
const MINT = "#2FE3BE";
const NIGHT = "#0E3B3A";
const NIGHT_2 = "#124A47";
const TEXT_INK = "#0E2A2A";
const TEXT_DARK = "#5A6970";
const TEXT_MUTED = "#9CA3AF";
const BG_PAGE = "#F4F8F8";
const BG_SOFT = "#F7F9F9";
const BORDER = "#EAF0F0";
const GREEN = "#1FA66A";
const GREEN_TINT = "rgba(31, 166, 106, 0.12)";
const FONT_STACK = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

const CONTAINER = { maxWidth: 1240, margin: "0 auto", padding: "0 28px" };

const PLANS = [
  {
    id: "essentials",
    name: "Essentials",
    ribbon: { text: "Best to start", dark: true },
    tagline: "Solo founders and side hustles.",
    monthly: { current: 19 },
    annual: { current: 19 },
    users: "Up to 1 user",
    ai: [
      "Smart transaction auto-categorization",
      "Nexa AI receipt scanner"
    ],
    features: [
      "Track income and expenses",
      "Send invoices and accept payments",
      "Connect 1 bank or credit card",
      "Run basic reports",
      "Mobile receipt capture"
    ],
    recommendedFor: "solo"
  },
  {
    id: "premium",
    name: "Premium",
    ribbon: { text: "Most popular", dark: false },
    tagline: "Built for small and growing teams.",
    monthly: { current: 49 },
    annual: { current: 49 },
    users: "Up to 5 users",
    ai: [
      "Everything in Essentials plus AI bookkeeping insights",
      "Document AI for vendor bills",
      "Auto-match receipts to transactions"
    ],
    features: [
      "Up to 5 users",
      "Recurring invoices and subscriptions",
      "Bill pay and vendor management",
      "Multi-currency support",
      "Enhanced reports and custom dashboards",
      "Sales tax automation",
      "Project tracking"
    ],
    recommendedFor: "small-team",
    glow: true
  },
  {
    id: "scale",
    name: "Scale",
    ribbon: { text: "Built for scale", dark: true },
    tagline: "For growing operations and bigger teams.",
    monthly: { current: 99 },
    annual: { current: 99 },
    users: "Up to 25 users",
    ai: [
      "Everything in Premium plus AI-drafted month-end close",
      "Anomaly detection on transactions",
      "Custom workflow automations"
    ],
    features: [
      "Up to 25 users",
      "Workflow automation engine",
      "Custom roles and permissions",
      "Inventory and order management",
      "Comprehensive business intelligence",
      "Priority support",
      "Dedicated account manager"
    ],
    recommendedFor: "growing"
  }
];

function WizardSteps() {
  const steps = ["Select plan", "Add-ons", "Checkout"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
      {steps.map((label, i) => {
        const active = i === 0;
        return (
          <React.Fragment key={label}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: active ? BRAND : BG_SOFT,
                color: active ? "#FFFFFF" : TEXT_MUTED,
                display: "grid", placeItems: "center",
                fontSize: 13, fontWeight: 700,
                border: active ? "none" : "0.5px solid " + BORDER,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? TEXT_INK : TEXT_MUTED }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 28, height: 1, background: BORDER }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PlanSelector({ whoAmI, setWhoAmI }) {
  const options = [
    { id: "solo", label: "Solo / side hustle" },
    { id: "small-team", label: "Small team" },
    { id: "growing", label: "Growing business" },
  ];
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: 6, background: "#FFFFFF", border: "0.5px solid " + BORDER, borderRadius: 999, boxShadow: "0 4px 12px rgba(8,32,31,0.06)" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_DARK, padding: "0 10px 0 14px" }}>I am a</span>
        {options.map(opt => {
          const selected = whoAmI === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setWhoAmI(selected ? null : opt.id)}
              style={{
                fontSize: 13, fontWeight: 600,
                padding: "8px 16px",
                background: selected ? BRAND : "transparent",
                color: selected ? "#FFFFFF" : TEXT_DARK,
                border: "none", borderRadius: 999,
                cursor: "pointer", fontFamily: FONT_STACK,
                transition: "background 0.18s ease, color 0.18s ease",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BillingToggle({ billing, setBilling }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: 6, background: NIGHT, borderRadius: 999 }}>
        <button
          onClick={() => setBilling("monthly")}
          style={{
            fontSize: 13, fontWeight: 700,
            padding: "9px 22px",
            background: billing === "monthly" ? "#FFFFFF" : "transparent",
            color: billing === "monthly" ? TEXT_INK : "rgba(255,255,255,0.7)",
            border: "none", borderRadius: 999,
            cursor: "pointer", fontFamily: FONT_STACK,
            transition: "background 0.18s ease, color 0.18s ease",
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling("annual")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: 13, fontWeight: 700,
            padding: "9px 22px",
            background: billing === "annual" ? "#FFFFFF" : "transparent",
            color: billing === "annual" ? TEXT_INK : "rgba(255,255,255,0.7)",
            border: "none", borderRadius: 999,
            cursor: "pointer", fontFamily: FONT_STACK,
            transition: "background 0.18s ease, color 0.18s ease",
          }}
        >
          Annual
          <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 7px", background: MINT, color: NIGHT, borderRadius: 6, letterSpacing: "0.02em" }}>
            2 months free
          </span>
        </button>
      </div>
    </div>
  );
}

function Hero({ billing, setBilling, whoAmI, setWhoAmI }) {
  const trustPoints = ["Nexa AI bookkeeping", "Free email and chat support", "No contracts cancel anytime"];
  return (
    <section style={{ position: "relative", background: BG_PAGE, padding: "80px 0 60px", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -240, left: "20%", width: 600, height: 600, background: "radial-gradient(circle, rgba(15, 149, 153, 0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: -200, right: "10%", width: 500, height: 500, background: "radial-gradient(circle, rgba(47, 227, 190, 0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ ...CONTAINER, position: "relative", zIndex: 1, textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.025em", lineHeight: 1.1, margin: "0 0 24px" }}>
          Find a plan that is right for you
        </h1>
        <div style={{ display: "flex", justifyContent: "center", gap: 26, flexWrap: "wrap", marginBottom: 38 }}>
          {trustPoints.map(t => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: TEXT_DARK, fontWeight: 500 }}>
              <Check size={15} color={BRAND} strokeWidth={3} />
              {t}
            </span>
          ))}
        </div>
        <WizardSteps />
        <PlanSelector whoAmI={whoAmI} setWhoAmI={setWhoAmI} />
        <BillingToggle billing={billing} setBilling={setBilling} />
      </div>
    </section>
  );
}

function PlanCard({ plan, billing, highlighted, dimmed, onViewAll }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const isMonthly = billing === "monthly";
  const price = isMonthly ? plan.monthly.current : plan.annual.current;
  const oldPrice = isMonthly ? plan.monthly.old : null;
  const savingsAmount = isMonthly ? plan.monthly.savingsAmount : null;
  const savingsLabel = isMonthly ? plan.monthly.savingsLabel : plan.annual.savingsLabel;
  const ribbonBg = plan.ribbon.dark ? NIGHT : BRAND;
  const isPremium = plan.id === "premium";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: "#FFFFFF",
        border: highlighted ? "1.5px solid " + BRAND : "0.5px solid " + BORDER,
        borderRadius: 22,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        boxShadow: isPremium
          ? (hovered ? "0 28px 64px rgba(15, 149, 153, 0.28)" : "0 14px 36px rgba(15, 149, 153, 0.18)")
          : (hovered ? "0 22px 48px rgba(8,32,31,0.14)" : "0 1px 2px rgba(8,32,31,0.04)"),
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.28s ease, box-shadow 0.28s ease, opacity 0.28s ease, border 0.28s ease",
        opacity: dimmed ? 0.55 : 1,
        outline: isPremium ? "1.5px solid " + MINT : "none",
        outlineOffset: isPremium ? -1 : 0,
      }}
    >
      <div style={{
        position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
        padding: "5px 14px",
        background: ribbonBg,
        color: "#FFFFFF",
        fontSize: 11.5, fontWeight: 700,
        borderRadius: 999,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 12px rgba(8,32,31,0.18)",
      }}>
        {plan.ribbon.text}
      </div>

      <div style={{ padding: "36px 28px 24px", borderBottom: "0.5px solid " + BORDER }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", marginBottom: 6 }}>{plan.name}</div>
        <div style={{ fontSize: 13.5, color: TEXT_DARK, marginBottom: 18, lineHeight: 1.45 }}>{plan.tagline}</div>
        {oldPrice && (
          <div style={{ fontSize: 16, color: TEXT_MUTED, textDecoration: "line-through", marginBottom: 4 }}>
            ${oldPrice}/mo
          </div>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 44, fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.03em", lineHeight: 1 }}>
            ${price}
          </span>
          <span style={{ fontSize: 15, color: TEXT_DARK, fontWeight: 600 }}>/mo</span>
          {savingsAmount && (
            <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11.5, fontWeight: 700, padding: "4px 10px", background: GREEN_TINT, color: GREEN, borderRadius: 999, letterSpacing: "0.01em" }}>
              Save ${savingsAmount}/mo
            </span>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: TEXT_DARK, fontWeight: 500, marginBottom: 4 }}>{savingsLabel}</div>
        <div style={{ fontSize: 12, color: TEXT_MUTED }}>{plan.users}</div>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{
          background: "linear-gradient(135deg, " + NIGHT + " 0%, " + NIGHT_2 + " 100%)",
          borderRadius: 14,
          padding: "16px 18px",
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Sparkles size={13} color={MINT} />
            <span style={{ fontSize: 11.5, fontWeight: 800, color: MINT, letterSpacing: "0.06em", textTransform: "uppercase" }}>Nexa AI</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
            {plan.ai.map(item => (
              <li key={item} style={{ fontSize: 12.5, color: "rgba(255,255,255,0.9)", lineHeight: 1.45, display: "flex", gap: 8 }}>
                <Check size={13} color={MINT} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ padding: "4px 28px 24px", flex: 1 }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
          {plan.features.map(f => (
            <li key={f} style={{ display: "flex", gap: 10, fontSize: 13.5, color: TEXT_INK, lineHeight: 1.45 }}>
              <Check size={15} color={BRAND} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ padding: "0 28px 28px" }}>
        <button
          onClick={() => navigate("/add-payroll-v2?plan=" + plan.id + "&billing=" + billing)}
          style={{
            width: "100%",
            background: BRAND,
            color: "#FFFFFF",
            fontSize: 14.5, fontWeight: 700,
            padding: "13px 18px",
            border: "none", borderRadius: 10,
            cursor: "pointer", fontFamily: FONT_STACK,
            boxShadow: "0 6px 16px rgba(15, 149, 153, 0.28)",
            marginBottom: 12,
          }}
        >
          Choose {plan.name}
        </button>
        <button
          onClick={onViewAll}
          style={{
            width: "100%",
            background: "transparent",
            color: BRAND,
            fontSize: 13, fontWeight: 600,
            padding: "6px 0",
            border: "none",
            cursor: "pointer", fontFamily: FONT_STACK,
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          See all features
        </button>
      </div>
    </div>
  );
}

function PlanCards({ billing, whoAmI, onViewAll }) {
  return (
    <section style={{ background: BG_PAGE, padding: "20px 0 80px" }}>
      <div style={CONTAINER}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 22, alignItems: "stretch", paddingTop: 14 }}>
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              highlighted={whoAmI ? plan.recommendedFor === whoAmI : false}
              dimmed={whoAmI ? plan.recommendedFor !== whoAmI : false}
              onViewAll={onViewAll}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FadeInRow({ children }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.45s ease, transform 0.45s ease",
    }}>
      {children}
    </div>
  );
}

const COMPARE_CATEGORIES = [
  {
    label: "Nexa AI",
    rows: [
      { name: "Auto-categorize transactions", values: [true, true, true] },
      { name: "AI receipt scanner", values: [true, true, true] },
      { name: "Document AI for vendor bills", values: [false, true, true] },
      { name: "AI bookkeeping insights", values: [false, true, true], aiPill: true },
      { name: "Anomaly detection", values: [false, false, true] },
      { name: "AI-drafted month-end close", values: [false, false, true], aiPill: true },
    ],
  },
  {
    label: "Accounting",
    rows: [
      { name: "Track income and expenses", values: [true, true, true] },
      { name: "Bank reconciliation", values: [true, true, true] },
      { name: "Multi-currency", values: [false, true, true] },
      { name: "Custom fields", values: [false, "8", "25"] },
      { name: "Users", values: ["1", "5", "25"] },
    ],
  },
  {
    label: "Sales and get paid",
    rows: [
      { name: "Send invoices", values: [true, true, true] },
      { name: "Accept online payments", values: [true, true, true] },
      { name: "Recurring invoices", values: [false, true, true] },
      { name: "Custom invoice branding", values: ["Basic", "Full", "Full"] },
      { name: "Payment plans", values: [false, false, true] },
    ],
  },
  {
    label: "Expenses",
    rows: [
      { name: "Receipt capture", values: [true, true, true] },
      { name: "Mileage tracking", values: [false, true, true] },
      { name: "Bill pay", values: [false, true, true] },
      { name: "Approval workflows", values: [false, false, true] },
    ],
  },
  {
    label: "Reports",
    rows: [
      { name: "Report depth", values: ["Standard", "Enhanced", "Comprehensive"] },
      { name: "Custom report builder", values: [false, false, true] },
      { name: "Cash flow forecast", values: [false, true, true] },
    ],
  },
];

function CompareTable({ billing }) {
  const navigate = useNavigate();
  const [openCats, setOpenCats] = useState({
    "Nexa AI": true,
    "Accounting": true,
    "Sales and get paid": true,
    "Expenses": true,
    "Reports": true,
  });
  const toggle = (label) => setOpenCats(prev => ({ ...prev, [label]: !prev[label] }));

  const planCols = [
    { name: "Essentials", id: "essentials", monthly: 19, annual: 19 },
    { name: "Premium", id: "premium", monthly: 49, annual: 49, mostPopular: true },
    { name: "Scale", id: "scale", monthly: 99, annual: 99 },
  ];

  const gridCols = "minmax(0, 2fr) repeat(3, minmax(0, 1fr))";

  return (
    <section style={{ background: "#FFFFFF", padding: "80px 0" }}>
      <div style={CONTAINER}>
        <h2 style={{ textAlign: "center", fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", margin: "0 0 44px" }}>
          Compare all features
        </h2>

        <div style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "0.5px solid " + BORDER,
          padding: "26px 0 16px",
          marginBottom: 14,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 16, alignItems: "end" }}>
            <div></div>
            {planCols.map(p => {
              const price = billing === "monthly" ? p.monthly : p.annual;
              return (
                <div key={p.id} style={{ position: "relative", textAlign: "center", padding: "0 4px" }}>
                  {p.mostPopular && (
                    <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", padding: "3px 10px", background: BRAND, color: "#FFFFFF", fontSize: 9.5, fontWeight: 800, borderRadius: 999, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      Most popular
                    </div>
                  )}
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_INK, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", marginBottom: 10, lineHeight: 1 }}>
                    ${price}<span style={{ fontSize: 11, color: TEXT_DARK, fontWeight: 600 }}>/mo</span>
                  </div>
                  <button onClick={() => navigate("/add-payroll-v2?plan=" + p.id + "&billing=" + billing)} style={{
                    background: BRAND, color: "#FFFFFF",
                    fontSize: 12, fontWeight: 700,
                    padding: "8px 12px",
                    border: "none", borderRadius: 7,
                    cursor: "pointer", fontFamily: FONT_STACK,
                    width: "100%",
                  }}>
                    Choose plan
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          {COMPARE_CATEGORIES.map(cat => {
            const isOpen = openCats[cat.label];
            return (
              <div key={cat.label} style={{ marginBottom: 10 }}>
                <button
                  onClick={() => toggle(cat.label)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    background: BG_SOFT,
                    border: "0.5px solid " + BORDER,
                    borderRadius: 12,
                    padding: "16px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    fontSize: 15.5, fontWeight: 700, color: TEXT_INK,
                    cursor: "pointer", fontFamily: FONT_STACK,
                    letterSpacing: "-0.01em",
                  }}
                >
                  <span>{cat.label}</span>
                  <ChevronDown size={18} color={TEXT_DARK} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.25s ease" }} />
                </button>
                {isOpen && (
                  <div style={{ marginTop: 4 }}>
                    {cat.rows.map((row, idx) => (
                      <FadeInRow key={row.name}>
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: gridCols,
                          gap: 16,
                          padding: "14px 20px",
                          borderBottom: "0.5px solid " + BORDER,
                          alignItems: "center",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: TEXT_INK, fontWeight: 500 }}>
                            <span>{row.name}</span>
                            {row.aiPill && (
                              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", background: BRAND_TINT, color: BRAND_DEEP, borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                Nexa AI
                              </span>
                            )}
                          </div>
                          {row.values.map((v, j) => (
                            <div key={j} style={{
                              textAlign: "center",
                              background: j === 1 ? "rgba(15, 149, 153, 0.05)" : "transparent",
                              borderRadius: 6,
                              padding: "6px 4px",
                            }}>
                              {v === true && <Check size={18} color={BRAND} strokeWidth={2.5} style={{ verticalAlign: "middle" }} />}
                              {v === false && <span style={{ color: TEXT_MUTED, fontSize: 16 }}>—</span>}
                              {typeof v === "string" && <span style={{ fontSize: 13, color: TEXT_INK, fontWeight: 600 }}>{v}</span>}
                            </div>
                          ))}
                        </div>
                      </FadeInRow>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PromoNotice() {
  return (
    <div style={{ background: BG_PAGE, padding: "0 0 28px", textAlign: "center" }}>
      <div style={CONTAINER}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px",
          background: "#FBEAD2",
          color: "#9A6212",
          border: "0.5px solid rgba(154, 98, 18, 0.30)",
          borderRadius: 999,
          fontSize: 10.5, fontWeight: 800,
          letterSpacing: "0.06em", textTransform: "uppercase",
          marginBottom: 8,
        }}>
          Launch promo: starts soon
        </span>
        <p style={{ fontSize: 12.5, color: TEXT_DARK, margin: 0, fontStyle: "italic" }}>
          Promotional pricing below launches with our first wave of customers.
        </p>
      </div>
    </div>
  );
}

function PerksCard({ item }) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#FFFFFF",
        border: "0.5px solid " + BORDER,
        borderRadius: 18,
        padding: 26,
        textAlign: "center",
        boxShadow: hovered ? "0 22px 48px rgba(8,32,31,0.14)" : "0 1px 2px rgba(8,32,31,0.04)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.28s ease, box-shadow 0.28s ease",
      }}
    >
      <div style={{
        width: 50, height: 50, borderRadius: 14,
        background: "linear-gradient(135deg, " + BRAND + " 0%, " + BRAND_DEEP + " 100%)",
        boxShadow: "0 10px 22px rgba(15, 149, 153, 0.30)",
        display: "grid", placeItems: "center",
        margin: "0 auto 18px",
      }}>
        <Icon size={22} color="#FFFFFF" strokeWidth={2} />
      </div>
      <div style={{ fontSize: 16.5, fontWeight: 700, color: TEXT_INK, letterSpacing: "-0.01em", lineHeight: 1.3, marginBottom: 8 }}>{item.title}</div>
      <p style={{ fontSize: 13, color: TEXT_DARK, lineHeight: 1.55, margin: 0 }}>{item.note}</p>
    </div>
  );
}

function AllPlansInclude() {
  const items = [
    { icon: Smartphone, title: "Free mobile apps", note: "Run Novala from iOS and Android, anytime." },
    { icon: MessageCircle, title: "Live support", note: "Email and chat support included on every plan." },
    { icon: Zap, title: "App integrations", note: "Connects to the banks, cards, and apps you already use." },
  ];
  return (
    <section style={{ background: BG_PAGE, padding: "80px 0" }}>
      <div style={CONTAINER}>
        <h2 style={{ textAlign: "center", fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", margin: "0 0 44px" }}>
          All plans include
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, maxWidth: 920, margin: "0 auto" }}>
          {items.map(item => <PerksCard key={item.title} item={item} />)}
        </div>
      </div>
    </section>
  );
}

function TrustItem({ icon, stars, title }) {
  const Icon = icon;
  return (
    <div style={{ position: "relative", textAlign: "center", padding: "14px 12px 0" }}>
      <span style={{
        position: "absolute",
        top: -10,
        right: 0,
        padding: "3px 9px",
        background: "#FBEAD2",
        color: "#9A6212",
        border: "0.5px solid rgba(154, 98, 18, 0.30)",
        borderRadius: 999,
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}>
        Coming soon
      </span>
      {Icon && (
        <div style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}>
          <Icon size={28} color={MINT} strokeWidth={2} />
        </div>
      )}
      {stars && (
        <div style={{ marginBottom: 14, display: "flex", justifyContent: "center", gap: 3 }}>
          {Array.from({ length: stars }, (_, i) => (
            <Star key={i} size={18} color="#F5B301" fill="#F5B301" />
          ))}
        </div>
      )}
      <div style={{ fontSize: 15.5, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.005em", lineHeight: 1.4 }}>
        {title}
      </div>
    </div>
  );
}

function TrustBand() {
  return (
    <section style={{ background: "linear-gradient(180deg, " + NIGHT + " 0%, " + NIGHT_2 + " 100%)", padding: "80px 0", color: "#FFFFFF" }}>
      <div style={CONTAINER}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40 }}>
          <TrustItem title="50,000+ businesses trust Novala" />
          <TrustItem stars={5} title="4.8 across 12,000+ reviews" />
          <TrustItem icon={Shield} title="SOC 2 certified, bank-level security and encryption" />
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState(null);
  const items = [
    { q: "What is Novala?", a: "Novala is an all in one platform for small and growing businesses. It combines accounting, payroll, invoicing, and reports with Nexa AI to keep your books accurate and your team paid on time. Everything lives in one login, so the data you enter in one place flows through every report." },
    { q: "Can I change plans later?", a: "Yes. You can upgrade or downgrade at any time from your account settings. Upgrades take effect immediately and are prorated for the rest of your billing cycle. Downgrades take effect at the start of your next cycle, so you keep the features you paid for through the end of the current month." },
    { q: "What payment methods do you accept?", a: "All major credit and debit cards (Visa, Mastercard, American Express) and direct bank transfer (ACH) for annual plans. Payment processing is handled by Stripe with full PCI compliance. We do not store card details ourselves." },
    { q: "Do you offer annual billing discounts?", a: "Yes. Switching to annual billing saves the equivalent of two months compared to paying monthly. [Confirm exact annual prices and discount before publishing.]" },
    { q: "Can I get a refund?", a: "Yes. We offer a 30-day refund window from your first payment, no questions asked. Email support and we will process the refund within 5 business days. After 30 days, you can cancel anytime to stop future charges; past payments are not refunded." },
    { q: "Are there transaction or processing fees?", a: "Novala itself does not charge platform transaction fees. When you accept customer payments through Novala, standard Stripe processing fees apply (2.9% plus 30 cents per card transaction). Bank transfers and ACH have lower fees. All fees are shown clearly before each transaction." },
    { q: "What data can I import?", a: "CSV files of transactions, customers, and vendors from QuickBooks, Xero, Wave, and most accounting tools. Once you connect a bank account, the historical bank feed comes in automatically. Bulk receipt and bill uploads work via drag-and-drop or email forwarding." },
    { q: "How does multi-user access work?", a: "Each plan has a user limit (Essentials 1 user, Premium 5 users, Scale 25 users). Add team members from your settings and assign roles (admin, accountant, viewer, or custom roles on Scale). Each user gets their own login and an audit trail records who changed what." },
    { q: "Do you support multi-currency?", a: "Yes, on Premium and Scale plans. Invoices, expenses, and bank accounts can be set per currency. Daily exchange rates update automatically from a trusted provider. Reports can be viewed in your home currency or per-currency." },
    { q: "What kind of support do you offer?", a: "Every plan includes email and chat support during business hours. Scale customers get priority routing and a dedicated account manager. Most first responses arrive within 4 business hours, and complex tickets get a written summary after resolution so you can refer back to it later." },
  ];
  const visible = showAll ? items : items.slice(0, 4);
  return (
    <section style={{ background: "#FFFFFF", padding: "80px 0 100px" }}>
      <div style={{ ...CONTAINER, maxWidth: 820 }}>
        <h2 style={{ textAlign: "center", fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 800, color: TEXT_INK, letterSpacing: "-0.02em", margin: "0 0 44px" }}>
          Frequently asked questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ background: "#FFFFFF", border: "0.5px solid " + BORDER, borderRadius: 14, overflow: "hidden" }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{ width: "100%", background: "transparent", padding: "20px 24px", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, minHeight: 60, fontSize: 16, fontWeight: 700, color: TEXT_INK, cursor: "pointer", textAlign: "left", fontFamily: FONT_STACK, letterSpacing: "-0.005em" }}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} color={TEXT_DARK} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.25s ease", flexShrink: 0 }} />
                </button>
                {isOpen && (
                  <div style={{ padding: "0 24px 22px", fontSize: 14.5, color: TEXT_DARK, lineHeight: 1.65 }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {!showAll && (
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <button onClick={() => setShowAll(true)} style={{
              background: "transparent", color: BRAND,
              fontSize: 14, fontWeight: 700,
              padding: "12px 24px",
              border: "1.5px solid " + BRAND, borderRadius: 10,
              cursor: "pointer", fontFamily: FONT_STACK,
            }}>
              Load more questions
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function PricingV2() {
  const [billing, setBilling] = useState("monthly");
  const [whoAmI, setWhoAmI] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const handleViewAll = () => setModalOpen(true);
  const handleClose = () => setModalOpen(false);
  const handleSeePricing = () => setModalOpen(false);
  return (
    <div style={{ fontFamily: FONT_STACK, color: TEXT_INK, background: BG_PAGE, minHeight: "100vh" }}>
      <MarketingHeader onFeaturesClick={handleViewAll} />
      <Hero billing={billing} setBilling={setBilling} whoAmI={whoAmI} setWhoAmI={setWhoAmI} />
      <PromoNotice />
      <PlanCards billing={billing} whoAmI={whoAmI} onViewAll={handleViewAll} />
      <CompareTable billing={billing} />
      <AllPlansInclude />
      <TrustBand />
      <FAQ />
      <MarketingFooter />
      <FeaturesModal open={modalOpen} onClose={handleClose} onSeePricing={handleSeePricing} />
    </div>
  );
}
