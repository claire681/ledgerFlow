// Novala pricing page v2. AI name: Nexa AI (confirmed). Mounted at /pricing-v2.
// Phase A: Hero with H1, trust points, wizard steps, plan selector, billing toggle, three plan cards.
// Phase B will add the compare-all-features table. Phase C will add all-plans-include, trust band,
// FAQ, and wire the FeaturesModal to the "See all features" links under each plan card.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";

import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";

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
    id: "starter",
    name: "Starter",
    ribbon: { text: "Best to start", dark: true },
    tagline: "Perfect for solos and side hustles",
    monthly: { old: 19, current: 9, savingsAmount: 10, savingsLabel: "Save 52% for 6 months" },
    annual: { current: 8, savingsLabel: "2 months free with annual billing" },
    users: "Up to 1 user",
    ai: ["Smart transaction auto-categorization", "AI receipt scanner"],
    features: [
      "Track income and expenses",
      "Send invoices and accept payments",
      "Connect 1 bank or credit card",
      "Run basic reports",
      "Mobile receipt capture",
    ],
    recommendedFor: "solo",
  },
  {
    id: "growth",
    name: "Growth",
    ribbon: { text: "Most popular", dark: false },
    tagline: "Built for small and growing teams",
    monthly: { old: 59, current: 29, savingsAmount: 30, savingsLabel: "Save 51% for 6 months" },
    annual: { current: 24, savingsLabel: "2 months free with annual billing" },
    users: "Up to 5 users",
    ai: [
      "Everything in Starter plus AI bookkeeping insights",
      "Document AI for vendor bills",
      "Auto-match receipts to transactions",
    ],
    features: [
      "Up to 5 users",
      "Recurring invoices and subscriptions",
      "Bill pay and vendor management",
      "Multi-currency support",
      "Enhanced reports and custom dashboards",
      "Sales tax automation",
      "Project tracking",
    ],
    recommendedFor: "small-team",
    glow: true,
  },
  {
    id: "scale",
    name: "Scale",
    ribbon: { text: "Built for scale", dark: true },
    tagline: "For growing operations and bigger teams",
    monthly: { old: 199, current: 99, savingsAmount: 100, savingsLabel: "Save 50% for 6 months" },
    annual: { current: 83, savingsLabel: "2 months free with annual billing" },
    users: "Up to 25 users",
    ai: [
      "Everything in Growth plus AI-drafted month-end close",
      "Anomaly detection on transactions",
      "Custom workflow automations",
    ],
    features: [
      "Up to 25 users",
      "Workflow automation engine",
      "Custom roles and permissions",
      "Inventory and order management",
      "Comprehensive business intelligence",
      "Priority support",
      "Dedicated account manager",
    ],
    recommendedFor: "growing",
  },
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
  const isGrowth = plan.id === "growth";

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
        boxShadow: isGrowth
          ? (hovered ? "0 28px 64px rgba(15, 149, 153, 0.28)" : "0 14px 36px rgba(15, 149, 153, 0.18)")
          : (hovered ? "0 22px 48px rgba(8,32,31,0.14)" : "0 1px 2px rgba(8,32,31,0.04)"),
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.28s ease, box-shadow 0.28s ease, opacity 0.28s ease, border 0.28s ease",
        opacity: dimmed ? 0.55 : 1,
        outline: isGrowth ? "1.5px solid " + MINT : "none",
        outlineOffset: isGrowth ? -1 : 0,
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
          onClick={() => navigate("/register?plan=" + plan.id)}
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

export default function PricingV2() {
  const [billing, setBilling] = useState("monthly");
  const [whoAmI, setWhoAmI] = useState(null);
  const handleViewAll = () => {
    // Phase C will open FeaturesModal here.
    alert("Features modal wiring coming in Phase C.");
  };
  return (
    <div style={{ fontFamily: FONT_STACK, color: TEXT_INK, background: BG_PAGE, minHeight: "100vh" }}>
      <MarketingHeader />
      <Hero billing={billing} setBilling={setBilling} whoAmI={whoAmI} setWhoAmI={setWhoAmI} />
      <PlanCards billing={billing} whoAmI={whoAmI} onViewAll={handleViewAll} />
      {/* TODO Phase B: Compare all features table */}
      {/* TODO Phase C: All plans include, Trust band (with Coming soon pills), FAQ, FeaturesModal mount */}
      <MarketingFooter />
    </div>
  );
}
