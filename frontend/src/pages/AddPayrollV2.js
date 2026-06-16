import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, Wallet, Timer, Trophy, Pencil, Tag, ArrowRight, Lock, CreditCard, Shield } from "lucide-react";
import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";

const TEAL = "#0F9599";
const INK = "#111827";
const SUB = "#6B7280";
const HINT = "#9CA3AF";
const BORDER = "#E5E7EB";
const GREEN_CHIP_BG = "#EAF3DE";
const GREEN_CHIP_TX = "#3B6D11";
const AMBER_CHIP_BG = "#FAEEDA";
const AMBER_CHIP_TX = "#633806";

const PLAN_NAMES = {
  starter: "Starter plan",
  growth: "Growth plan",
  scale: "Scale plan"
};

const TIERS = [
  {
    id: "core",
    name: "Payroll core",
    tagline: "Pay your team, file taxes.",
    icon: Wallet,
    oldPrice: 20,
    price: 15,
    perEmp: 3,
    saveText: "Save 25% for 6 months",
    payroll: ["Auto-calculated pay", "Direct deposit", "Year-end T4 forms"],
    hours: ["Manual timesheets", "Approve and submit"],
    featured: false
  },
  {
    id: "premium",
    name: "Payroll premium",
    tagline: "Time tracking and HR added.",
    icon: Timer,
    oldPrice: 35,
    price: 25,
    perEmp: 4,
    saveText: "Save 29% for 6 months",
    payroll: ["Everything in Core", "Multi-province tax filing", "HR document templates"],
    hours: ["Mobile clock in / out", "Geofencing", "Shift scheduling"],
    featured: true,
    badge: "Most popular"
  },
  {
    id: "elite",
    name: "Payroll elite",
    tagline: "Multi-location and HR support.",
    icon: Trophy,
    oldPrice: 55,
    price: 40,
    perEmp: 5,
    saveText: "Save 27% for 6 months",
    payroll: ["Everything in Premium", "Tax penalty protection", "Personal HR advisor"],
    hours: ["Project and job costing", "Multi-location support", "Custom permissions"],
    featured: false
  }
];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function AddPayrollV2() {
  const navigate = useNavigate();
  const q = useQuery();
  const planId = q.get("plan") || "growth";
  const billing = q.get("billing") || "monthly";
  const planName = PLAN_NAMES[planId] || "Selected plan";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const goCart = (payrollId) => {
    const params = new URLSearchParams({ plan: planId, billing: billing, payroll: payrollId });
    navigate("/cart?" + params.toString());
  };

  const goBack = () => {
    navigate("/pricing-v2");
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: INK }}>
      <MarketingHeader />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 24px" }}>
        <Stepper planName={planName} onEdit={goBack} />

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, margin: "32px 0 12px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 700, lineHeight: 1.15, color: INK }}>
              Add payroll to your plan
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: SUB, lineHeight: 1.5, maxWidth: 560 }}>
              Pick a payroll tier, or continue without payroll. You can add it later from settings.
            </p>
          </div>
          <button
            onClick={() => goCart("none")}
            style={{
              whiteSpace: "nowrap",
              padding: "10px 16px",
              fontSize: 14,
              borderRadius: 8,
              border: "1px solid " + TEAL,
              background: "transparent",
              color: TEAL,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            Continue without payroll <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: AMBER_CHIP_BG, color: AMBER_CHIP_TX, fontSize: 12, fontWeight: 600, marginTop: 12, marginBottom: 12 }}>
          <Tag size={12} />
          Launch promo: starts soon
        </div>

        <p style={{ margin: "0 0 24px", fontSize: 12, color: HINT, fontStyle: "italic", lineHeight: 1.5 }}>
          Promotional pricing below launches with our first wave of customers.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 20, marginBottom: 32 }}>
          {TIERS.map((t) => (
            <TierCard key={t.id} tier={t} onAdd={() => goCart(t.id)} />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, padding: "20px 0 40px", borderTop: "1px solid " + BORDER, fontSize: 13, color: SUB, flexWrap: "wrap", marginTop: 16 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Lock size={14} /> Cancel or change any time</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CreditCard size={14} /> No charge until after free trial</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Shield size={14} /> Bank-grade security</span>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}

function Stepper({ planName, onEdit }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
      <StepItem state="done" stepLabel="Step 1" title={planName} onEdit={onEdit} />
      <StepLine />
      <StepItem state="active" stepLabel="Step 2" title="Add payroll" number={2} />
      <StepLine />
      <StepItem state="future" stepLabel="Step 3" title="Checkout" number={3} />
    </div>
  );
}

function StepItem({ state, stepLabel, title, number, onEdit }) {
  const isDone = state === "done";
  const isFuture = state === "future";
  const circleStyle = {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    background: isFuture ? "transparent" : TEAL,
    color: isFuture ? HINT : "#fff",
    border: isFuture ? "1px solid " + BORDER : "none"
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={circleStyle}>
        {isDone ? <Check size={16} /> : number}
      </div>
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontSize: 11, color: isFuture ? HINT : SUB, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>{stepLabel}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: isFuture ? HINT : INK, display: "inline-flex", alignItems: "center", gap: 4 }}>
          {title}
          {isDone && onEdit && (
            <button
              onClick={onEdit}
              aria-label="Change plan"
              style={{ background: "transparent", border: "none", color: HINT, cursor: "pointer", padding: 2, display: "inline-flex", alignItems: "center", fontFamily: "inherit" }}
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepLine() {
  return <div style={{ width: 32, height: 1, background: BORDER, flexShrink: 0 }} />;
}

function TierCard({ tier, onAdd }) {
  const [hover, setHover] = useState(false);
  const Icon = tier.icon;
  const baseShadow = "0 1px 3px rgba(16, 24, 40, 0.05), 0 1px 2px rgba(16, 24, 40, 0.04)";
  const hoverShadow = "0 12px 28px -8px rgba(15, 149, 153, 0.18), 0 6px 12px -6px rgba(16, 24, 40, 0.08)";
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#fff",
        border: tier.featured ? "2px solid " + TEAL : "1px solid " + BORDER,
        borderRadius: 14,
        padding: 20,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxShadow: hover ? hoverShadow : baseShadow,
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 0.22s ease, box-shadow 0.22s ease"
      }}
    >
      {tier.badge && (
        <div style={{
          position: "absolute",
          top: -12,
          left: "50%",
          transform: "translateX(-50%)",
          background: TEAL,
          color: "#fff",
          padding: "4px 12px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
          letterSpacing: 0.3
        }}>
          {tier.badge}
        </div>
      )}

      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: TEAL,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14
      }}>
        <Icon size={22} />
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: INK }}>{tier.name}</div>
      <div style={{ fontSize: 13, color: SUB, margin: "4px 0 14px", lineHeight: 1.4 }}>{tier.tagline}</div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ textDecoration: "line-through", color: HINT, fontSize: 14 }}>${tier.oldPrice}</span>
        <span style={{ fontSize: 28, fontWeight: 800, color: INK, lineHeight: 1 }}>${tier.price}</span>
        <span style={{ fontSize: 13, color: SUB }}>/mo</span>
      </div>
      <div style={{ fontSize: 12, color: SUB, marginTop: 4, marginBottom: 10 }}>+ ${tier.perEmp} per employee/mo</div>
      <div style={{
        fontSize: 11,
        color: GREEN_CHIP_TX,
        background: GREEN_CHIP_BG,
        padding: "3px 10px",
        borderRadius: 8,
        display: "inline-block",
        alignSelf: "flex-start",
        marginBottom: 16,
        fontWeight: 600
      }}>
        {tier.saveText}
      </div>

      <FeatureGroup label="Take care of payroll" items={tier.payroll} />
      <FeatureGroup label="Track hours worked" items={tier.hours} />

      <button
        onClick={onAdd}
        style={{
          marginTop: "auto",
          width: "100%",
          padding: "12px 0",
          background: TEAL,
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 6px 14px -6px rgba(15,149,153,0.5)"
        }}
      >
        Add to plan
      </button>
    </div>
  );
}

function FeatureGroup({ label, items }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: SUB, marginBottom: 6, letterSpacing: 0.3, textTransform: "uppercase" }}>
        {label}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 8, padding: "3px 0", fontSize: 13, color: "#374151", lineHeight: 1.45 }}>
            <Check size={15} color={TEAL} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
