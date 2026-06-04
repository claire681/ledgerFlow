import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, ArrowLeft, ArrowRight, ShoppingCart } from "lucide-react";
import ChangePlanModal from "../components/ChangePlanModal";
import { getPlan, getPayroll } from "../data/plans";

const TEAL = "#0F9599";
const TEAL_DARK = "#0B7377";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const MUTED = "#9AA8A8";
const BORDER = "#E2E8E8";
const BG = "#FFFFFF";
const BG_TINT = "#F9FAFA";
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

function NovalaLogo({ size = 32, showWordmark = true }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <img src="/logo512.png" alt="Novala" style={{ width: size, height: size, objectFit: "contain", display: "block" }} />
      {showWordmark && <span style={{ color: INK, fontWeight: 800, fontSize: Math.round(size * 0.75), letterSpacing: "-0.02em" }}>Novala</span>}
    </span>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const planId = params.get("plan") || "growth";
  const billing = params.get("billing") || "monthly";
  const [payrollId, setPayrollId] = useState(params.get("payroll") || null);
  const [showChangePlan, setShowChangePlan] = useState(false);

  const plan = getPlan(planId);
  const payroll = getPayroll(payrollId);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("novala-fonts")) return;
    const l = document.createElement("link");
    l.id = "novala-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(l);
  }, []);

  const updatePayrollInUrl = (newPayrollId) => {
    const p = new URLSearchParams(params);
    if (newPayrollId) p.set("payroll", newPayrollId); else p.delete("payroll");
    setParams(p, { replace: true });
    setPayrollId(newPayrollId);
  };

  const totalDueToday = plan.monthlyPrice + (payroll ? payroll.monthlyPrice : 0);
  const totalOriginal = plan.originalPrice + (payroll ? payroll.originalPrice : 0);
  const savings = totalOriginal - totalDueToday;

  const proceedToCheckout = () => {
    const url = `/checkout?plan=${planId}&billing=${billing}` + (payrollId ? `&payroll=${payrollId}` : "");
    navigate(url);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG_TINT, fontFamily: FONT, color: INK }}>
      <header style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: "16px 32px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}><NovalaLogo size={32} /></span>
          <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 13.5, color: SUB }}>
            <span>Need help? Call 1-800-NOVALA</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: INK, fontWeight: 600 }}>
              <ShoppingCart size={16} strokeWidth={2.2} />
              <span style={{ background: TEAL, color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{payroll ? 2 : 1}</span>
            </span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px 96px" }}>
        <button onClick={() => navigate(`/add-payroll?plan=${planId}&billing=${billing}`)} style={{ background: "transparent", color: SUB, border: "none", cursor: "pointer", fontSize: 14, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, padding: "8px 0" }}>
          <ArrowLeft size={14} /> Back
        </button>

        <h1 style={{ margin: 0, fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 800, color: INK, letterSpacing: "-0.025em", marginBottom: 32 }}>Your cart</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 32, alignItems: "start" }}>

          <div>
            <div style={{ background: BG, border: `2px solid ${TEAL}`, borderRadius: 18, padding: 28, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 20, marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: INK }}>{plan.name}</h3>
                  <div style={{ fontSize: 13, color: TEAL, fontWeight: 600, marginTop: 4 }}>{plan.savings}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: MUTED, textDecoration: "line-through" }}>${plan.originalPrice}/mo</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: INK }}>${plan.monthlyPrice}</span>
                    <span style={{ fontSize: 14, color: SUB }}>/mo</span>
                  </div>
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: `1px solid ${BG_TINT}` }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: SUB, letterSpacing: "0.08em", textTransform: "uppercase" }}>Top features</h4>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {plan.topFeatures.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 13.5, color: INK }}>
                      <Check size={14} strokeWidth={2.5} color={TEAL} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BG_TINT}` }}>
                <button onClick={() => navigate("/pricing")} style={{ background: "transparent", color: TEAL, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", padding: 0 }}>Change plan</button>
              </div>
            </div>

            {payroll ? (
              <>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: SUB, letterSpacing: "0.08em", textTransform: "uppercase" }}>Complete your bundle</h3>
                <div style={{ background: BG, border: `2px solid ${TEAL}`, borderRadius: 18, padding: 28 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 20, marginBottom: 16 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: INK }}>{payroll.name}</h3>
                      <div style={{ fontSize: 13, color: TEAL, fontWeight: 600, marginTop: 4 }}>{payroll.savings}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, color: MUTED, textDecoration: "line-through" }}>${payroll.originalPrice}/mo</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 3, justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: INK }}>${payroll.monthlyPrice}</span>
                        <span style={{ fontSize: 14, color: SUB }}>/mo</span>
                      </div>
                      <div style={{ fontSize: 13, color: SUB }}>+ ${payroll.perEmployee}/employee/mo</div>
                    </div>
                  </div>
                  <div style={{ paddingTop: 16, borderTop: `1px solid ${BG_TINT}` }}>
                    <h4 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: SUB, letterSpacing: "0.08em", textTransform: "uppercase" }}>Top features</h4>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {payroll.topFeatures.map((f, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 13.5, color: INK }}>
                          <Check size={14} strokeWidth={2.5} color={TEAL} /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BG_TINT}`, display: "flex", gap: 16 }}>
                    <button onClick={() => updatePayrollInUrl(null)} style={{ background: "transparent", color: SUB, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", padding: 0 }}>Remove</button>
                    <button onClick={() => setShowChangePlan(true)} style={{ background: "transparent", color: TEAL, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", padding: 0 }}>Change plan</button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ background: BG, border: `1px dashed ${BORDER}`, borderRadius: 18, padding: 24, textAlign: "center" }}>
                <p style={{ margin: "0 0 12px", color: SUB, fontSize: 14 }}>No payroll add-on selected.</p>
                <button onClick={() => navigate(`/add-payroll?plan=${planId}&billing=${billing}`)}
                  onMouseEnter={(e) => e.currentTarget.style.background = TEAL_DARK}
                  onMouseLeave={(e) => e.currentTarget.style.background = TEAL}
                  style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}>
                  Add payroll
                </button>
              </div>
            )}
          </div>

          <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 28, position: "sticky", top: 24 }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: INK }}>Order summary</h3>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", fontSize: 14 }}>
              <div>
                <div style={{ color: INK, fontWeight: 600 }}>{plan.name}</div>
                <div style={{ color: MUTED, fontSize: 12, textDecoration: "line-through" }}>${plan.originalPrice}/mo</div>
              </div>
              <div style={{ color: INK, fontWeight: 700 }}>${plan.monthlyPrice}/mo</div>
            </div>

            {payroll && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", fontSize: 14, borderTop: `1px solid ${BG_TINT}` }}>
                <div>
                  <div style={{ color: INK, fontWeight: 600 }}>{payroll.name}</div>
                  <div style={{ color: MUTED, fontSize: 12, textDecoration: "line-through" }}>${payroll.originalPrice}/mo</div>
                  <div style={{ color: SUB, fontSize: 12 }}>+ ${payroll.perEmployee}/employee/mo</div>
                </div>
                <div style={{ color: INK, fontWeight: 700 }}>${payroll.monthlyPrice}/mo</div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "20px 0 12px", borderTop: `1px solid ${BORDER}`, marginTop: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>Total due today</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: INK }}>${totalDueToday}</div>
            </div>

            {savings > 0 && (
              <div style={{ fontSize: 13.5, color: TEAL, fontWeight: 700, padding: "4px 0 12px" }}>You're saving ${savings}/mo 🎉</div>
            )}
            <div style={{ fontSize: 12, color: MUTED, paddingBottom: 20 }}>Taxes not included</div>

            <button onClick={proceedToCheckout}
              onMouseEnter={(e) => { e.currentTarget.style.background = TEAL_DARK; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = TEAL; e.currentTarget.style.transform = "none"; }}
              style={{ width: "100%", background: TEAL, color: "#fff", border: "none", borderRadius: 12, padding: "14px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 8px 20px -8px rgba(15,149,153,0.6)", transition: "all 0.15s" }}>
              Continue to checkout <ArrowRight size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>

      <ChangePlanModal
        open={showChangePlan}
        currentPayrollId={payrollId}
        onChangePlan={(newId) => { updatePayrollInUrl(newId); setShowChangePlan(false); }}
        onContinueWithout={() => { updatePayrollInUrl(null); setShowChangePlan(false); }}
        onClose={() => setShowChangePlan(false)}
      />
    </div>
  );
}
