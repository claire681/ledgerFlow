import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import PayPalSubscribeButton from "../components/PayPalSubscribeButton";
import { getPlan, getPayroll } from "../data/plans";

const TEAL = "#0F9599";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const MUTED = "#9AA8A8";
const BORDER = "#DDE5E5";
const BG_TINT = "#F9FAFA";
const ORDER_BG = "#F3F5F5";
const RED = "#D9453C";
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

export default function Billing() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const planSlug = params.get("plan") || "essentials";
  const billingPeriod = params.get("billing") || "monthly";
  const VALID_PAYROLL = ["core", "premium", "elite"];
  const rawPayroll = params.get("payroll");
  const payrollSlug = VALID_PAYROLL.includes(rawPayroll) ? rawPayroll : null;

  // PayPal subscriptions bill a single fixed amount per plan_id, so combine
  // plan + payroll into one slug matching a pre-created combo plan
  // (essentials_payroll_core = $44 = $19 plan + $25 payroll, etc.).
  // "none", "", null, or any unknown value -> plan-only subscription.
  const combinedSlug = payrollSlug
    ? planSlug + "_payroll_" + payrollSlug
    : planSlug;

  const plan = getPlan(planSlug);
  const payroll = getPayroll(payrollSlug);

  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [error, setError] = useState("");

  const planMonthly = plan.monthlyPrice;
  const payrollMonthly = payroll ? payroll.monthlyPrice : 0;
  const totalDueToday = planMonthly + payrollMonthly;

  const handleSuccess = (sub) => {
    const next = new URLSearchParams();
    next.set("fromCheckout", "true");
    next.set("plan", planSlug);
    if (billingPeriod) next.set("billing", billingPeriod);
    if (payrollSlug) next.set("payroll", payrollSlug);
    navigate("/register?" + next.toString());
  };

  const handleError = (err) => {
    setError("Payment failed: " + ((err && err.message) || err));
  };

  return (
    <div style={{ minHeight: "100vh", background: BG_TINT, fontFamily: FONT, padding: "32px 16px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <Link to="/cart" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: SUB, fontSize: 14, textDecoration: "none", marginBottom: 16 }}>
          <ArrowLeft size={16} /> Back to cart
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "flex-start" }}>
          <div style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 16, padding: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: INK, margin: "0 0 8px" }}>Complete your subscription</h1>
            <p style={{ fontSize: 14, color: SUB, margin: "0 0 32px" }}>
              You won't be charged until you confirm in PayPal. Cancel anytime from Novala settings.
            </p>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 12 }}>Payment method</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <PaymentRadio active={paymentMethod === "paypal"} label="PayPal account" onClick={() => setPaymentMethod("paypal")} />
                <PaymentRadio active={paymentMethod === "card"} label="Credit or debit card" onClick={() => setPaymentMethod("card")} />
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 8, lineHeight: 1.4 }}>
                {paymentMethod === "paypal"
                  ? "You'll be redirected to PayPal to sign in and authorize the subscription."
                  : "Cards are processed by PayPal's PCI-compliant gateway. Your card details never touch Novala servers."}
              </div>
            </div>

            {error && (
              <div style={{ background: "#FCE9E7", border: "1px solid #F2C1BC", color: RED, padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div>
              {paymentMethod === "paypal" && (
                <PayPalSubscribeButton
                  planSlug={combinedSlug}
                  fundingSource="paypal"
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              )}
              {paymentMethod === "card" && (
                <PayPalSubscribeButton
                  planSlug={combinedSlug}
                  fundingSource="card"
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              )}
            </div>

            <div style={{ fontSize: 12, color: MUTED, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
              By subscribing you agree to the{" "}
              <a href="/terms" style={{ color: TEAL }}>Terms of Service</a>{" "}and{" "}
              <a href="/privacy" style={{ color: TEAL }}>Privacy Policy</a>.
            </div>
          </div>

          <div style={{ background: ORDER_BG, borderRadius: 16, padding: 24, position: "sticky", top: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <ShoppingCart size={18} color={INK} />
              <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>Order summary</div>
            </div>

            <div style={{ padding: "12px 0", borderBottom: "1px solid " + BORDER }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{plan.name}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>${planMonthly}/mo</div>
              </div>
              <div style={{ fontSize: 12, color: MUTED }}>Billed monthly</div>
            </div>

            {payroll && (
              <div style={{ padding: "12px 0", borderBottom: "1px solid " + BORDER }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{payroll.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>${payrollMonthly}/mo</div>
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>Flat tier rate</div>
              </div>
            )}

            <div style={{ padding: "16px 0 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>Total due today</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>${totalDueToday}/mo</div>
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Taxes may be added by PayPal at checkout.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentRadio({ active, label, onClick }) {
  return (
    <label
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 14px",
        border: "1.5px solid " + (active ? TEAL : BORDER),
        borderRadius: 10,
        background: active ? "rgba(15,149,153,0.05)" : "#fff",
        cursor: "pointer",
        fontSize: 14,
        color: INK,
        fontWeight: 500
      }}
    >
      <input type="radio" name="payMethod" checked={active} readOnly style={{ accentColor: TEAL }} />
      {label}
    </label>
  );
}
