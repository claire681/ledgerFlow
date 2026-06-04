import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, ArrowRight, Edit3, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";
import MarketingHeader from "../components/MarketingHeader";
import { PAYROLL_TIERS, getPlan } from "../data/plans";

const TEAL = "#0F9599";
const TEAL_DARK = "#0B7377";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const MUTED = "#9AA8A8";
const BORDER = "#E2E8E8";
const BG = "#FFFFFF";
const BG_TINT = "#F9FAFA";
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

function Stepper({ active, planName, onEditPlan }) {
  const steps = ["Select plan", "Add payroll (optional)", "Checkout"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 48, flexWrap: "wrap" }}>
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === active;
        const isCompleted = stepNum < active;
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: isActive || isCompleted ? TEAL : BG, border: isActive || isCompleted ? `2px solid ${TEAL}` : `2px solid ${BORDER}`, color: isActive || isCompleted ? "#fff" : MUTED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, transition: "all 0.2s" }}>
                {isCompleted ? <Check size={16} strokeWidth={3} /> : stepNum}
              </div>
              <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? INK : SUB }}>
                {label}
                {i === 0 && planName && (
                  <span style={{ marginLeft: 6, fontSize: 13, color: SUB, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    : <strong style={{ color: INK }}>{planName}</strong>
                    <button onClick={onEditPlan} aria-label="Change plan" style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: TEAL }}>
                      <Edit3 size={13} strokeWidth={2.2} />
                    </button>
                  </span>
                )}
              </span>
            </div>
            {i < steps.length - 1 && <div style={{ width: 40, height: 2, background: BORDER, borderRadius: 1 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function AddPayroll() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planId = params.get("plan") || "growth";
  const billing = params.get("billing") || "monthly";
  const plan = getPlan(planId);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("novala-fonts")) return;
    const l = document.createElement("link");
    l.id = "novala-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(l);
  }, []);

  const goToCart = (payrollId) => {
    const url = `/cart?plan=${planId}&billing=${billing}` + (payrollId ? `&payroll=${payrollId}` : "");
    navigate(url);
  };

  const tiers = Object.values(PAYROLL_TIERS);

  return (
    <div style={{ minHeight: "100vh", background: BG_TINT, fontFamily: FONT, color: INK }}>
      <MarketingHeader />
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 32px 96px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: INK, letterSpacing: "-0.025em", lineHeight: 1.15 }}>Find the plan that's right for you</h1>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", fontSize: 14, color: SUB }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Sparkles size={14} color={TEAL} /> Powered by Nova</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} color={TEAL} /> Free unlimited support</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} color={TEAL} /> No contract, cancel anytime</span>
          </div>
        </div>

        <Stepper active={2} planName={plan.name} onEditPlan={() => navigate("/pricing")} />

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <button onClick={() => goToCart(null)}
            onMouseEnter={(e) => { e.currentTarget.style.background = TEAL; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEAL; }}
            style={{ background: "transparent", color: TEAL, border: `1.5px solid ${TEAL}`, borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 8 }}>
            Continue without payroll <ArrowRight size={15} strokeWidth={2.4} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {tiers.map((tier) => (
            <div key={tier.id} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 28, boxShadow: "0 1px 2px rgba(14,26,26,0.04)", display: "flex", flexDirection: "column" }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: INK, letterSpacing: "-0.015em" }}>{tier.name}</h3>
                <div style={{ marginTop: 12, fontSize: 14, color: MUTED, textDecoration: "line-through" }}>${tier.originalPrice}/mo</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: INK, letterSpacing: "-0.025em" }}>${tier.monthlyPrice}</span>
                  <span style={{ fontSize: 16, color: SUB }}>/mo</span>
                </div>
                <div style={{ fontSize: 13, color: TEAL, fontWeight: 600, marginTop: 4 }}>{tier.savings}</div>
                <div style={{ fontSize: 14, color: SUB, marginTop: 8 }}>+ ${tier.perEmployee}/employee/mo</div>
              </div>
              <button onClick={() => goToCart(tier.id)}
                onMouseEnter={(e) => e.currentTarget.style.background = TEAL_DARK}
                onMouseLeave={(e) => e.currentTarget.style.background = TEAL}
                style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 24, transition: "background 0.15s" }}>
                Add to plan
              </button>
              {Object.entries(tier.sections).map(([section, items]) => (
                <div key={section} style={{ marginBottom: 18 }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: INK, letterSpacing: "0.05em", textTransform: "uppercase" }}>{section}</h4>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {items.map(([label, included], i) => (
                      <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 13.5, color: included ? INK : MUTED }}>
                        {included ? <Check size={14} strokeWidth={2.5} color={TEAL} /> : <span style={{ width: 14, color: MUTED, display: "inline-flex", justifyContent: "center", fontSize: 12 }}>-</span>}
                        <span>{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 56, paddingTop: 32, borderTop: `1px solid ${BORDER}` }}>
          <button onClick={() => navigate("/pricing")} style={{ background: "transparent", color: SUB, border: "none", cursor: "pointer", fontSize: 14, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={14} /> Back to plans
          </button>
        </div>
      </div>
    </div>
  );
}
