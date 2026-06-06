import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, ArrowRight, Eye, EyeOff, Lock, Mail, User, ArrowLeft } from "lucide-react";
import MarketingHeader from "../components/MarketingHeader";
import CountrySelect from "../components/CountrySelect";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { findByIso } from "../data/countries";
import { getPlan, getPayroll } from "../data/plans";
import { register } from "../services/api";

const TEAL = "#0F9599";
const TEAL_DARK = "#0B7377";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const MUTED = "#9AA8A8";
const BORDER = "#E2E8E8";
const BG = "#FFFFFF";
const BG_TINT = "#F9FAFA";
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

function Stepper({ active }) {
  const steps = ["Select plan", "Add payroll", "Create account"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 40, flexWrap: "wrap" }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const isActive = n === active;
        const isDone = n < active;
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: isActive || isDone ? TEAL : BG, border: isActive || isDone ? `2px solid ${TEAL}` : `2px solid ${BORDER}`, color: isActive || isDone ? "#fff" : MUTED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                {isDone ? <Check size={16} strokeWidth={3} /> : n}
              </div>
              <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? INK : SUB }}>{label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width: 40, height: 2, background: BORDER, borderRadius: 1 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: INK, marginBottom: 6 }}>{label}</label>
      {children}
      {error && <div style={{ fontSize: 12, color: "#D9453C", marginTop: 4 }}>{error}</div>}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "13px 14px", border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", color: INK, background: BG, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s, box-shadow 0.15s",
};

export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planId = params.get("plan") || "growth";
  const billing = params.get("billing") || "monthly";
  const payrollId = params.get("payroll") || null;
  const plan = getPlan(planId);
  const payroll = getPayroll(payrollId);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [iso, setIso] = useState("CA");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [marketing, setMarketing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById("novala-fonts")) return;
    const l = document.createElement("link");
    l.id = "novala-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(l);
  }, []);

  const total = plan.monthlyPrice + (payroll ? payroll.monthlyPrice : 0);
  const totalOriginal = plan.originalPrice + (payroll ? payroll.originalPrice : 0);
  const savings = totalOriginal - total;

  const submit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("Please enter your full name."); return; }
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    if (!phone.trim()) { setError("Please enter your phone number."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setSubmitting(true);
    try {
      const country = findByIso(iso);
      const parsed = parsePhoneNumberFromString(phone.trim(), iso);
      if (!parsed || !parsed.isValid()) {
        setError("That number does not look valid for " + country.name + ". Check the country or fix the number.");
        setSubmitting(false);
        return;
      }
      const fullPhone = parsed.format("E.164");
      const res = await register(email.trim(), password, fullName.trim(), "");
      const token = res.data.access_token;
      localStorage.setItem("token", token);
      localStorage.setItem("user_email", email.trim());
      localStorage.setItem("user_name", fullName.trim());
      const first = fullName.trim().split(/\s+/)[0] || "";
      if (first) {
        const firstName = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
        localStorage.setItem("first_name", firstName);
        localStorage.setItem("full_name", fullName.trim());
      }
      localStorage.setItem("saved_account_email", email.trim());
      localStorage.setItem("signup_phone", fullPhone);
      localStorage.setItem("signup_country_iso", iso);
      localStorage.setItem("signup_marketing_opt_in", marketing ? "1" : "0");
      const qs = new URLSearchParams({ fromCheckout: "true", plan: planId, billing });
      if (payrollId) qs.set("payroll", payrollId);
      navigate("/verify-code?" + qs.toString());
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        if (detail.toLowerCase().includes("exist") || detail.toLowerCase().includes("already")) {
          setError("An account with this email already exists. Sign in instead.");
        } else { setError(detail); }
      } else { setError("Could not create your account. Please try again."); }
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: BG_TINT, fontFamily: FONT, color: INK }}>
      <MarketingHeader />
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px 96px" }}>
        <button onClick={() => navigate(`/cart?plan=${planId}&billing=${billing}` + (payrollId ? `&payroll=${payrollId}` : ""))}
          style={{ background: "transparent", color: SUB, border: "none", cursor: "pointer", fontSize: 14, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, padding: "8px 0" }}>
          <ArrowLeft size={14} /> Back to cart
        </button>

        <Stepper active={3} />

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 800, color: INK, letterSpacing: "-0.025em" }}>Create your Novala account</h1>
          <p style={{ margin: "8px 0 0", color: SUB, fontSize: 15 }}>Account first, then we ask a couple things about your business.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, alignItems: "start" }}>

          <form onSubmit={submit} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 32 }}>

            {error && (
              <div style={{ background: "rgba(217,69,60,0.08)", border: "1px solid rgba(217,69,60,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 13.5, color: "#D9453C" }}>
                {error}
              </div>
            )}

            <Field label="Full name">
              <div style={{ position: "relative" }}>
                <User size={16} color={MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith"
                  style={{ ...inputStyle, paddingLeft: 38 }}
                  onFocus={e => { e.target.style.borderColor = TEAL; e.target.style.boxShadow = "0 0 0 3px rgba(15,149,153,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = "none"; }} />
              </div>
            </Field>

            <Field label="Email">
              <div style={{ position: "relative" }}>
                <Mail size={16} color={MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@yourcompany.com"
                  style={{ ...inputStyle, paddingLeft: 38 }}
                  onFocus={e => { e.target.style.borderColor = TEAL; e.target.style.boxShadow = "0 0 0 3px rgba(15,149,153,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = "none"; }} />
              </div>
            </Field>

            <Field label="Phone number">
              <div style={{ display: "flex", gap: 8 }}>
                <CountrySelect mode="phone" value={iso} onChange={(c) => setIso(c.code)} defaultCode="CA" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d\s\-]/g, ""))} placeholder="555 123 4567"
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => { e.target.style.borderColor = TEAL; e.target.style.boxShadow = "0 0 0 3px rgba(15,149,153,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = "none"; }} />
              </div>
            </Field>

            <Field label="Password">
              <div style={{ position: "relative" }}>
                <Lock size={16} color={MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"
                  style={{ ...inputStyle, paddingLeft: 38, paddingRight: 42 }}
                  onFocus={e => { e.target.style.borderColor = TEAL; e.target.style.boxShadow = "0 0 0 3px rgba(15,149,153,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = "none"; }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", padding: 8, cursor: "pointer", color: MUTED }} aria-label="Toggle password">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="Confirm password">
              <div style={{ position: "relative" }}>
                <Lock size={16} color={MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type={showCfm ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter your password"
                  style={{ ...inputStyle, paddingLeft: 38, paddingRight: 42 }}
                  onFocus={e => { e.target.style.borderColor = TEAL; e.target.style.boxShadow = "0 0 0 3px rgba(15,149,153,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = "none"; }} />
                <button type="button" onClick={() => setShowCfm(!showCfm)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", padding: 8, cursor: "pointer", color: MUTED }} aria-label="Toggle confirm">
                  {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 8, marginBottom: 24, cursor: "pointer" }}>
              <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 2, accentColor: TEAL, cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: SUB, lineHeight: 1.5 }}>
                Email me product updates, tips, and the occasional Nova feature announcement. You can unsubscribe anytime.
              </span>
            </label>

            <button type="submit" disabled={submitting}
              onMouseEnter={e => { if (!submitting) { e.currentTarget.style.background = TEAL_DARK; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { if (!submitting) { e.currentTarget.style.background = TEAL; e.currentTarget.style.transform = "none"; } }}
              style={{ width: "100%", background: submitting ? MUTED : TEAL, color: "#fff", border: "none", borderRadius: 12, padding: "14px 20px", fontSize: 15, fontWeight: 700, cursor: submitting ? "wait" : "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 8px 20px -8px rgba(15,149,153,0.6)", transition: "all 0.15s" }}>
              {submitting ? "Creating account..." : <>Create account and continue <ArrowRight size={16} strokeWidth={2.4} /></>}
            </button>

            <p style={{ marginTop: 16, fontSize: 12, color: MUTED, textAlign: "center", lineHeight: 1.6 }}>
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </p>

            <p style={{ marginTop: 12, fontSize: 13.5, color: SUB, textAlign: "center" }}>
              Already have a Novala account? <button type="button" onClick={() => navigate("/login")} style={{ background: "transparent", border: "none", color: TEAL, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0, fontSize: 13.5 }}>Sign in</button>
            </p>
          </form>

          {/* Order summary */}
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
              <div style={{ fontSize: 24, fontWeight: 800, color: INK }}>${total}</div>
            </div>

            {savings > 0 && (
              <div style={{ fontSize: 13.5, color: TEAL, fontWeight: 700, padding: "4px 0 12px" }}>You're saving ${savings}/mo 🎉</div>
            )}
            <div style={{ fontSize: 12, color: MUTED, paddingBottom: 12 }}>Taxes not included</div>
            <div style={{ fontSize: 12, color: SUB, lineHeight: 1.5, paddingTop: 12, borderTop: `1px dashed ${BORDER}` }}>
              We won't charge anything until you finish setting up your business in the next step. Cancel anytime.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
