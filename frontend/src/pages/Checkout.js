import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ChevronDown, Search, Check, Sparkles } from "lucide-react";
import countries from "../data/countries.json";

const TEAL = "#0F9599";
const TEAL_DARK = "#0C7A7E";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const BORDER = "#DDE5E5";
const BG = "#F5F7F7";
const SUCCESS_BG = "#E6F7EE";
const SUCCESS_TEXT = "#0E8A4E";
const CONTENT_MAX = 1200;

// Keep in sync with Pricing.js until plans live in a shared data file
const PLANS = [
  { id: "starter", name: "Starter", regularPrice: 30, promoPrice: 9 },
  { id: "growth",  name: "Growth",  regularPrice: 60, promoPrice: 29 },
  { id: "scale",   name: "Scale",   regularPrice: 200, promoPrice: 99 },
];

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  fontSize: 15,
  fontFamily: "inherit",
  color: INK,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planId = params.get("plan") || "growth";
  const billing = params.get("billing") || "promo";
  const plan = PLANS.find(p => p.id === planId) || PLANS[1];
  const isTrial = billing === "trial";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(true);

  const [countryIso, setCountryIso] = useState("CA");
  const [showCountry, setShowCountry] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryRef = useRef(null);

  const currentCountry = countries.find(c => c.iso2 === countryIso) || countries.find(c => c.iso2 === "CA");

  useEffect(() => {
    const h = (e) => { if (countryRef.current && !countryRef.current.contains(e.target)) setShowCountry(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filteredCountries = countrySearch
    ? countries.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dialCode.includes(countrySearch))
    : countries;

  const totalToday = isTrial ? 0 : plan.promoPrice;
  const savings = plan.regularPrice - plan.promoPrice;

  const handleSubmit = () => {
    if (!email || !password) { alert("Please enter your email and password."); return; }
    alert(`Account creation continues here. Email: ${email}, Plan: ${plan.name}, Billing: ${billing}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, -apple-system, sans-serif", color: INK }}>
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "16px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span onClick={() => navigate("/pricing")} style={{ color: TEAL, fontWeight: 800, fontSize: 24, letterSpacing: "-0.015em", cursor: "pointer" }}>Novala</span>
          <span onClick={() => navigate("/pricing")} style={{ color: SUB, fontSize: 14, cursor: "pointer" }}>← Back to plans</span>
        </div>
      </div>

      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "48px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 40, alignItems: "start" }}>

        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 32 }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: 28, fontWeight: 700, letterSpacing: "-0.015em" }}>Create your Novala account</h1>
          <p style={{ margin: "0 0 28px 0", color: SUB, fontSize: 15 }}>You're getting started on the {plan.name} plan.</p>

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Email address</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" style={inputStyle} />

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginTop: 18, marginBottom: 8 }}>Password</label>
          <div style={{ position: "relative" }}>
            <Lock size={18} color={SUB} style={{ position: "absolute", left: 14, top: 14, pointerEvents: "none" }} />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPass ? "text" : "password"} placeholder="At least 8 characters" style={{ ...inputStyle, paddingLeft: 42, paddingRight: 44 }} />
            <button onClick={() => setShowPass(s => !s)} type="button" aria-label={showPass ? "Hide password" : "Show password"} style={{ position: "absolute", right: 10, top: 10, background: "transparent", border: "none", cursor: "pointer", padding: 6, display: "flex", borderRadius: 4 }}>
              {showPass ? <EyeOff size={18} color={SUB} /> : <Eye size={18} color={SUB} />}
            </button>
          </div>

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginTop: 18, marginBottom: 8 }}>Phone number</label>
          <div style={{ display: "flex", gap: 8 }}>
            <div ref={countryRef} style={{ position: "relative" }}>
              <button onClick={() => setShowCountry(s => !s)} type="button" style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "0 12px", minHeight: 46, cursor: "pointer", fontFamily: "inherit", fontSize: 14, color: INK, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{currentCountry.flag}</span>
                <span style={{ color: SUB }}>{currentCountry.dialCode}</span>
                <ChevronDown size={14} color={SUB} />
              </button>
              {showCountry && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, width: 340, maxHeight: 360, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)", zIndex: 50, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ padding: 12, borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ position: "relative" }}>
                      <Search size={16} color={SUB} style={{ position: "absolute", left: 10, top: 11, pointerEvents: "none" }} />
                      <input autoFocus value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} placeholder="Search country or code" style={{ width: "100%", padding: "8px 8px 8px 32px", border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  </div>
                  <div style={{ overflow: "auto", flex: 1 }}>
                    {filteredCountries.length === 0
                      ? <div style={{ padding: 20, textAlign: "center", color: SUB, fontSize: 14 }}>No countries match "{countrySearch}"</div>
                      : filteredCountries.map(c => (
                        <button key={c.iso2} type="button" onClick={() => { setCountryIso(c.iso2); setShowCountry(false); setCountrySearch(""); }} onMouseEnter={(e) => { if (c.iso2 !== countryIso) e.currentTarget.style.background = "#F1F5F5"; }} onMouseLeave={(e) => { if (c.iso2 !== countryIso) e.currentTarget.style.background = "#fff"; }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 14px", background: c.iso2 === countryIso ? "#E6F4F4" : "#fff", border: "none", cursor: "pointer", fontSize: 14, color: INK, fontFamily: "inherit", textAlign: "left" }}>
                          <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>
                          <span style={{ flex: 1 }}>{c.name}</span>
                          <span style={{ color: SUB, fontSize: 13 }}>{c.dialCode}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Phone number" style={{ ...inputStyle, flex: 1 }} />
          </div>
          <p style={{ margin: "8px 0 0 0", fontSize: 13, color: SUB, lineHeight: 1.5 }}>To protect your account, we'll send a code to verify it's you. Standard call or SMS rates may apply.</p>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 24, cursor: "pointer" }}>
            <span onClick={() => setOptIn(o => !o)} style={{ width: 20, height: 20, marginTop: 1, border: `1.5px solid ${optIn ? TEAL : "#A8B5B5"}`, borderRadius: 4, background: optIn ? TEAL : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
              {optIn && <Check size={14} color="#fff" strokeWidth={3} />}
            </span>
            <span style={{ fontSize: 13, color: SUB, lineHeight: 1.5 }}>Yes, keep me in the loop with product updates, tips, and promotions from Novala. I can unsubscribe anytime.</span>
          </label>

          <button onClick={handleSubmit} type="button" onMouseEnter={(e) => e.currentTarget.style.background = TEAL_DARK} onMouseLeave={(e) => e.currentTarget.style.background = TEAL} style={{ marginTop: 24, width: "100%", background: TEAL, color: "#fff", border: "none", borderRadius: 8, padding: "14px 16px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "background 0.15s" }}>
            <Lock size={16} strokeWidth={2.5} />
            Create your Novala account
          </button>

          <p style={{ margin: "20px 0 0 0", fontSize: 13, color: SUB, lineHeight: 1.6 }}>
            By creating an account, you agree to Novala's <a href="#" style={{ color: TEAL, textDecoration: "none" }}>Terms</a> and <a href="#" style={{ color: TEAL, textDecoration: "none" }}>Privacy Policy</a>.
          </p>
          <p style={{ margin: "16px 0 0 0", fontSize: 14, color: SUB }}>
            Already have an account? <span onClick={() => navigate("/login")} style={{ color: TEAL, fontWeight: 600, cursor: "pointer" }}>Sign in</span>
          </p>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 28, position: "sticky", top: 24 }}>
          <h2 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 700 }}>Order summary</h2>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 0", borderBottom: `1px solid ${BORDER}` }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{plan.name} plan</div>
              <div style={{ fontSize: 13, color: SUB, marginTop: 4 }}>{isTrial ? "30 day free trial" : "Monthly billing"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              {!isTrial && <div style={{ color: SUB, textDecoration: "line-through", fontSize: 14 }}>${plan.regularPrice}/mo</div>}
              <div style={{ color: INK, fontWeight: 700, fontSize: 18 }}>${isTrial ? plan.regularPrice : plan.promoPrice}<span style={{ color: SUB, fontSize: 13, fontWeight: 400 }}>/mo</span></div>
            </div>
          </div>

          <div style={{ padding: "20px 0", borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Total due today</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>${totalToday}</div>
            </div>
            <div style={{ fontSize: 13, color: SUB, marginTop: 6 }}>Taxes not included.</div>
          </div>

          {!isTrial && savings > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, padding: "12px 14px", background: SUCCESS_BG, borderRadius: 8, color: SUCCESS_TEXT, fontSize: 14, fontWeight: 600 }}>
              <Sparkles size={18} />
              <span>You're saving ${savings}/mo for the first 3 months.</span>
            </div>
          )}
          {isTrial && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, padding: "12px 14px", background: "#E6F4F4", borderRadius: 8, color: TEAL, fontSize: 14, fontWeight: 600 }}>
              <Sparkles size={18} />
              <span>30 day free trial. No charge today.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
