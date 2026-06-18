import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, TrendingUp, Wallet, Timer, Trophy, Building2, Pencil, Tag, ArrowRight, Lock, CreditCard, Shield, RotateCcw, Percent, Users } from "lucide-react";
import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";

const TEAL = "#0F9599";
const INK = "#111827";
const SUB = "#6B7280";
const HINT = "#9CA3AF";
const BORDER = "#E5E7EB";
const GREEN_TX = "#3B6D11";
const GREEN_BG = "#EAF3DE";
const AMBER_BG = "#FAEEDA";
const AMBER_TX = "#633806";

const PLANS = {
  essentials: {
    name: "Essentials plan",
    tagline: "For solo founders just starting out.",
    icon: Wallet,
    monthly: { current: 19 },
    annual: { current: 19 },
    topFeatures: [
      "Nexa AI receipt scanner",
      "Smart bookkeeping",
      "Send invoices",
      "Up to 100 transactions/mo"
    ]
  },
  premium: {
    name: "Premium plan",
    tagline: "For small and growing teams.",
    icon: TrendingUp,
    monthly: { current: 49 },
    annual: { current: 49 },
    topFeatures: [
      "Everything in Essentials",
      "Unlimited transactions",
      "Multi-user team access",
      "Up to 5 user seats"
    ]
  },
  scale: {
    name: "Scale plan",
    tagline: "For growing businesses.",
    icon: Building2,
    monthly: { current: 99 },
    annual: { current: 99 },
    topFeatures: [
      "Everything in Premium",
      "Advanced analytics",
      "Dedicated account manager",
      "Up to 25 user seats"
    ]
  }
};

const PAYROLL_TIERS = {
  core: {
    name: "Payroll core",
    tagline: "Pay your team, file taxes.",
    icon: Wallet,
    current: 15, was: 20, perEmp: 3,
    topFeatures: ["Auto-calculated pay", "Direct deposit", "Year-end T4 forms", "Manual timesheets"]
  },
  premium: {
    name: "Payroll premium",
    tagline: "Time tracking and HR added.",
    icon: Timer,
    current: 25, was: 35, perEmp: 4,
    topFeatures: ["Multi-province tax filing", "Mobile clock in / out", "Geofencing", "HR document templates"]
  },
  elite: {
    name: "Payroll elite",
    tagline: "Multi-location and HR support.",
    icon: Trophy,
    current: 40, was: 55, perEmp: 5,
    topFeatures: ["Tax penalty protection", "Personal HR advisor", "Project and job costing", "Multi-location support"]
  }
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function CartV2() {
  const navigate = useNavigate();
  const q = useQuery();
  const planId = q.get("plan") || "growth";
  const billing = q.get("billing") || "monthly";
  const initialPayrollId = q.get("payroll") || "none";

  const plan = PLANS[planId] || PLANS.growth;
  const [payrollId, setPayrollId] = useState(initialPayrollId);
  const [employeeCount, setEmployeeCount] = useState(5);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const payroll = payrollId !== "none" && PAYROLL_TIERS[payrollId] ? PAYROLL_TIERS[payrollId] : null;
  const planTier = plan[billing] || plan.monthly;
  const planPrice = planTier.current;
  const planWas = planTier.was;
  const payrollBase = payroll ? payroll.current : 0;
  const employeeCharge = payroll ? payroll.perEmp * employeeCount : 0;
  const subtotal = planPrice + payrollBase + employeeCharge;
  const savings = (planWas - planPrice) + (payroll ? payroll.was - payroll.current : 0);

  const goCheckout = () => {
    const params = new URLSearchParams({ plan: planId, billing: billing, payroll: payrollId, employees: String(employeeCount) });
    navigate("/checkout?" + params.toString());
  };
  const goChangePlan = () => navigate("/pricing-v2");
  const goChangePayroll = () => navigate("/add-payroll-v2?plan=" + planId + "&billing=" + billing);
  const goAddPayroll = () => navigate("/add-payroll-v2?plan=" + planId + "&billing=" + billing);
  const removePayroll = () => setPayrollId("none");

  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: INK }}>
      <MarketingHeader />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 24px" }}>
        <Stepper planName={plan.name} payrollName={payroll ? payroll.name : "No payroll"} onChangePlan={goChangePlan} onChangePayroll={goChangePayroll} />

        <div style={{ marginTop: 32, marginBottom: 14 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 700, lineHeight: 1.15 }}>Review your order</h1>
          <p style={{ margin: 0, fontSize: 15, color: SUB, lineHeight: 1.5 }}>Make sure everything looks right before you check out.</p>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: AMBER_BG, color: AMBER_TX, fontSize: 12, fontWeight: 600, marginBottom: 20 }}>
          <Tag size={12} /> Launch promo: starts soon
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 16 }}>
          <div>
            <LineItem
              Icon={plan.icon}
              name={plan.name}
              tagline={plan.tagline + " Billed " + billing + "."}
              currentPrice={planPrice}
              wasPrice={planWas}
              features={plan.topFeatures}
              actions={[{ label: "Change plan", onClick: goChangePlan }]}
            />
            {payroll ? (
              <LineItem
                Icon={payroll.icon}
                name={payroll.name}
                tagline={payroll.tagline}
                currentPrice={payroll.current}
                wasPrice={payroll.was}
                perEmp={payroll.perEmp}
                features={payroll.topFeatures}
                actions={[
                  { label: "Change tier", onClick: goChangePayroll },
                  { label: "Remove", onClick: removePayroll, muted: true }
                ]}
              />
            ) : (
              <AddPayrollCard onAdd={goAddPayroll} />
            )}
            <PromoCodeField value={promoCode} onChange={setPromoCode} onApply={() => setPromoApplied(true)} applied={promoApplied} />
            {payroll && <EmployeeCountField value={employeeCount} onChange={setEmployeeCount} />}
          </div>
          <Summary plan={plan} planPrice={planPrice} payroll={payroll} payrollBase={payrollBase} employeeCharge={employeeCharge} employeeCount={employeeCount} subtotal={subtotal} savings={savings} onCheckout={goCheckout} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, padding: "20px 0 40px", borderTop: "1px solid " + BORDER, fontSize: 13, color: SUB, flexWrap: "wrap", marginTop: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CreditCard size={14} /> No charge until trial ends</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><RotateCcw size={14} /> Change or cancel any time</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Shield size={14} /> Bank-grade security</span>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}

function Stepper({ planName, payrollName, onChangePlan, onChangePayroll }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
      <StepItem state="done" stepLabel="Step 1" title={planName} onEdit={onChangePlan} />
      <StepLine />
      <StepItem state="done" stepLabel="Step 2" title={payrollName} onEdit={onChangePayroll} />
      <StepLine />
      <StepItem state="active" stepLabel="Step 3" title="Review and pay" number={3} />
    </div>
  );
}

function StepItem({ state, stepLabel, title, number, onEdit }) {
  const isDone = state === "done";
  const isFuture = state === "future";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, background: isFuture ? "transparent" : TEAL, color: isFuture ? HINT : "#fff", border: isFuture ? "1px solid " + BORDER : "none" }}>
        {isDone ? <Check size={16} /> : number}
      </div>
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontSize: 11, color: isFuture ? HINT : SUB, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>{stepLabel}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: isFuture ? HINT : INK, display: "inline-flex", alignItems: "center", gap: 4 }}>
          {title}
          {isDone && onEdit && (
            <button onClick={onEdit} aria-label="Change" style={{ background: "transparent", border: "none", color: HINT, cursor: "pointer", padding: 2, display: "inline-flex", alignItems: "center", fontFamily: "inherit" }}>
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

function LineItem({ Icon, name, tagline, currentPrice, wasPrice, perEmp, features, actions }) {
  return (
    <div style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 14, padding: 18, display: "flex", gap: 14, marginBottom: 12, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: TEAL, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={22} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{name}</div>
            <div style={{ fontSize: 13, color: SUB, marginTop: 2, lineHeight: 1.4 }}>{tagline}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: HINT, textDecoration: "line-through", lineHeight: 1 }}>${wasPrice}</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>${currentPrice}<span style={{ fontSize: 12, color: SUB, fontWeight: 400 }}>/mo</span></div>
            {perEmp != null && (
              <div style={{ fontSize: 11, color: SUB, marginTop: 2 }}>+ ${perEmp} per employee/mo</div>
            )}
          </div>
        </div>
        <div style={{ fontSize: 11, color: SUB, fontWeight: 700, marginTop: 12, marginBottom: 6, letterSpacing: 0.3, textTransform: "uppercase" }}>What's included</div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {features.map((f, i) => (
            <li key={i} style={{ display: "flex", gap: 8, padding: "2px 0", fontSize: 13, color: "#374151", lineHeight: 1.4 }}>
              <Check size={14} color={TEAL} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          {actions.map((a, i) => (
            <button key={i} onClick={a.onClick} style={{ background: "transparent", border: "none", color: a.muted ? SUB : TEAL, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline", fontFamily: "inherit" }}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddPayrollCard({ onAdd }) {
  return (
    <div style={{ background: "#fff", border: "1px dashed " + TEAL, borderRadius: 14, padding: 18, display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(15,149,153,0.1)", color: TEAL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Timer size={22} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Want to add payroll?</div>
        <div style={{ fontSize: 13, color: SUB, marginTop: 2, lineHeight: 1.4 }}>Pay your team and file taxes from inside Novala. Starts at $15/mo.</div>
      </div>
      <button onClick={onAdd} style={{ background: TEAL, color: "#fff", border: "none", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Add payroll</button>
    </div>
  );
}

function PromoCodeField({ value, onChange, onApply, applied }) {
  const canApply = value && !applied;
  return (
    <div style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
      <Percent size={18} color={TEAL} />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Have a promo code?" disabled={applied} style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: INK, fontFamily: "inherit", minWidth: 0 }} />
      <button onClick={onApply} disabled={!canApply} style={{ background: "transparent", border: "1px solid " + TEAL, color: TEAL, padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: canApply ? "pointer" : "not-allowed", fontFamily: "inherit", opacity: canApply ? 1 : 0.5, flexShrink: 0 }}>
        {applied ? "Applied" : "Apply"}
      </button>
    </div>
  );
}

function EmployeeCountField({ value, onChange }) {
  return (
    <div style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
      <Users size={18} color={TEAL} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Estimated employees</div>
        <div style={{ fontSize: 12, color: SUB, lineHeight: 1.4, marginTop: 2 }}>Adjust to see how per-employee charges add up. You will not be billed for empty seats.</div>
      </div>
      <input type="number" min={1} value={value} onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 60, textAlign: "center", fontSize: 14, padding: "8px 6px", border: "1px solid " + BORDER, borderRadius: 8, fontFamily: "inherit", flexShrink: 0 }} />
    </div>
  );
}

function Summary({ plan, planPrice, payroll, payrollBase, employeeCharge, employeeCount, subtotal, savings, onCheckout }) {
  return (
    <div style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 14, padding: 20, position: "sticky", top: 24, boxShadow: "0 1px 3px rgba(16,24,40,0.04)", alignSelf: "start" }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Order summary</div>
      <Row label={plan.name} value={"$" + planPrice} />
      {payroll && <Row label={payroll.name} value={"$" + payrollBase} />}
      {payroll && employeeCharge > 0 && (
        <Row label={"Per employee x " + employeeCount} value={"$" + employeeCharge} muted />
      )}
      <Divider />
      <Row label="Subtotal" value={"$" + subtotal} mutedLabel />
      <Row label="Tax" value="Calculated next step" muted />
      <Divider />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0" }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Total today</span>
        <span style={{ fontSize: 22, fontWeight: 800 }}>${subtotal}<span style={{ fontSize: 12, color: SUB, fontWeight: 400 }}>/mo</span></span>
      </div>
      {savings > 0 && (
        <div style={{ fontSize: 12, color: GREEN_TX, background: GREEN_BG, padding: "6px 10px", borderRadius: 6, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <Tag size={12} /> You are saving ${savings}/mo with launch pricing
        </div>
      )}
      <button onClick={onCheckout} style={{ marginTop: 16, width: "100%", padding: "13px 0", background: TEAL, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 6px 14px -6px rgba(15,149,153,0.5)" }}>
        Proceed to checkout <ArrowRight size={16} />
      </button>
      <div style={{ marginTop: 10, fontSize: 12, color: SUB, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <Lock size={12} /> Secure checkout. Cancel any time.
      </div>
    </div>
  );
}

function Row({ label, value, muted, mutedLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 0", fontSize: muted ? 12 : 13 }}>
      <span style={{ color: muted || mutedLabel ? SUB : INK }}>{label}</span>
      <span style={{ color: muted ? SUB : INK, fontWeight: muted ? 400 : 600 }}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: BORDER, margin: "8px 0" }} />;
}
