import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ShoppingCart, Info } from "lucide-react";
import { getSubdivisions } from "../data/subdivisions";
import AddressAutocomplete from "../components/AddressAutocomplete";

const TEAL = "#0F9599";
const TEAL_DARK = "#0B7377";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const MUTED = "#9AA8A8";
const BORDER = "#DDE5E5";
const BG_TINT = "#F9FAFA";
const ORDER_BG = "#F3F5F5";
const RED = "#D9453C";
const AMBER_BG = "#FFF8E1";
const AMBER_BORDER = "#F4D58D";
const AMBER_INK = "#8A6D1A";
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

const PROVINCES = ["AB","BC","MB","NB","NL","NT","NS","NU","ON","PE","QC","SK","YT"];
const MONTHS = ["01","02","03","04","05","06","07","08","09","10","11","12"];

function getYears() {
  const y = new Date().getFullYear();
  const out = [];
  for (let i = 0; i < 15; i++) out.push(String(y + i));
  return out;
}

function formatDateDDMMYYYY(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return dd + "/" + mm + "/" + date.getFullYear();
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(" ") : "";
}

const PLANS = {
  starter: { name: "Starter", priceMonthly: 25, originalPrice: 50 },
  growth:  { name: "Growth",  priceMonthly: 49, originalPrice: 98 },
  scale:   { name: "Scale",   priceMonthly: 99, originalPrice: 198 }
};
const PAYROLL = {
  core:    { name: "Payroll Core",    priceMonthly: 25, originalPrice: 50,  perEmployee: 4 },
  premium: { name: "Payroll Premium", priceMonthly: 40, originalPrice: 80,  perEmployee: 6 },
  elite:   { name: "Payroll Elite",   priceMonthly: 80, originalPrice: 160, perEmployee: 9 }
};

function VisaLogo() {
  return (
    <svg width="38" height="24" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="4" fill="#1A1F71" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" fontFamily="Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="11">VISA</text>
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg width="38" height="24" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="4" fill="#FFFFFF" stroke="#E5E5E5" strokeWidth="1" />
      <circle cx="16" cy="12" r="7" fill="#EB001B" />
      <circle cx="23" cy="12" r="7" fill="#F79E1B" fillOpacity="0.92" />
    </svg>
  );
}

function AmexLogo() {
  return (
    <svg width="38" height="24" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="4" fill="#2E77BB" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="7.5" letterSpacing="0.4">AMEX</text>
    </svg>
  );
}

function CvvCardIcon() {
  return (
    <svg width="32" height="22" viewBox="0 0 32 22" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="2" width="30" height="18" rx="2.5" fill="#FFFFFF" stroke="#9AA8A8" strokeWidth="1.4" />
      <rect x="1" y="5" width="30" height="3" fill="#9AA8A8" />
      <rect x="19" y="12" width="10" height="4.5" rx="1" fill="#E8EDED" stroke="#9AA8A8" strokeWidth="0.8" />
      <text x="24" y="15.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="3.4" fill="#5B6B6B" fontWeight="700">123</text>
    </svg>
  );
}

export default function Billing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const planSlug = (searchParams.get("plan") || "growth").toLowerCase();
  const billingPeriod = searchParams.get("billing") || "monthly";
  const payrollSlug = (searchParams.get("payroll") || "").toLowerCase();

  const plan = PLANS[planSlug] || PLANS.growth;
  const payroll = payrollSlug ? (PAYROLL[payrollSlug] || null) : null;

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardNickname, setCardNickname] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const billingCountry = ((typeof window !== "undefined" && (localStorage.getItem("business_country") || localStorage.getItem("signup_country_iso"))) || "CA").toUpperCase();
  const subdivision = getSubdivisions(billingCountry);
  const [province, setProvince] = useState(subdivision ? subdivision.options[0].value : "");
  const [useAsBusinessAddress, setUseAsBusinessAddress] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const planMonthly = plan.priceMonthly;
  const planOriginal = plan.originalPrice;
  const payrollMonthly = payroll ? payroll.priceMonthly : 0;
  const payrollOriginal = payroll ? payroll.originalPrice : 0;
  const perEmployee = payroll ? payroll.perEmployee : 0;
  const totalDueToday = planMonthly + payrollMonthly;
  const savings = (planOriginal - planMonthly) + (payrollOriginal - payrollMonthly);
  const chargeDateStr = formatDateDDMMYYYY(new Date());

  const cardDigits = cardNumber.replace(/\s/g, "");
  const cardOk = paymentMethod === "paypal" || (
    cardDigits.length >= 13 && cardDigits.length <= 19 &&
    expMonth && expYear && cvv.length >= 3 && nameOnCard.trim().length > 0
  );
  const addressOk = address.trim().length > 0 && postalCode.trim().length > 0 && city.trim().length > 0 && province;
  const canSubmit = cardOk && addressOk && acceptedTerms && !submitting;

  const handleSubscribe = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const params = new URLSearchParams();
      params.set("fromCheckout", "true");
      if (planSlug) params.set("plan", planSlug);
      if (billingPeriod) params.set("billing", billingPeriod);
      if (payrollSlug) params.set("payroll", payrollSlug);
      navigate("/register?" + params.toString());
    } catch (e) {
      setError("Could not process subscription. Please try again.");
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", fontSize: 14,
    border: "1.6px solid " + BORDER, borderRadius: 10, background: "#fff",
    outline: "none", fontFamily: FONT, color: INK, boxSizing: "border-box"
  };
  const labelStyle = {
    display: "block", fontSize: 13, fontWeight: 600, color: SUB,
    marginBottom: 6, fontFamily: FONT
  };
  const radioRow = {
    display: "flex", gap: 12, alignItems: "center", padding: 14,
    border: "1.5px solid " + BORDER, borderRadius: 12, cursor: "pointer",
    background: "#fff", transition: "border-color 0.18s, background 0.18s"
  };
  const radioRowActive = { ...radioRow, borderColor: TEAL, background: "#F3FAFA" };

  return (
    <div style={{ minHeight: "100vh", background: BG_TINT, fontFamily: FONT, color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .nv-billing-input:focus { border-color: ${TEAL} !important; box-shadow: 0 0 0 4px rgba(15,149,153,0.14) !important; }
        .nv-billing-link { color: ${TEAL}; text-decoration: none; font-weight: 600; }
        .nv-billing-link:hover { color: ${TEAL_DARK}; text-decoration: underline; }
        .nv-subscribe-on:hover { background: ${TEAL_DARK} !important; transform: translateY(-1px); }
      `}</style>

      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px", background: "#fff", borderBottom: "1px solid " + BORDER
      }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: TEAL, letterSpacing: "0.02em" }}>
          Novala
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontSize: 13, color: SUB }}>
            Need help? <a href="mailto:novala.support@gmail.com" className="nv-billing-link">novala.support@gmail.com</a>
          </span>
          <ShoppingCart size={20} color={SUB} />
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 32px 0" }}>
        <Link to="/cart" className="nv-billing-link" style={{ fontSize: 14 }}>
          {"\u2039 Back to cart"}
        </Link>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 32px 0" }}>
        <div style={{
          background: AMBER_BG, border: "1px solid " + AMBER_BORDER, borderRadius: 12,
          padding: 14, display: "flex", alignItems: "flex-start", gap: 12, fontSize: 13.5,
          color: AMBER_INK, lineHeight: 1.55
        }}>
          <Info size={18} color={AMBER_INK} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Test mode.</strong> Payment processing is not wired yet, so no card will be charged. Subscribe will validate the form and forward you to the business setup wizard. Real Stripe billing is the next backend task.
          </span>
        </div>
      </div>

      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "24px 32px 48px",
        display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start"
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, border: "1px solid " + BORDER,
          padding: 32, boxShadow: "0 1px 3px rgba(16,24,40,0.05)"
        }}>
          <h2 style={{
            margin: "0 0 24px", fontSize: 24, fontWeight: 700, color: INK,
            letterSpacing: "-0.01em"
          }}>
            Now let's get your billing info
          </h2>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 12 }}>
              New payment method
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={paymentMethod === "card" ? radioRowActive : radioRow}>
                <input type="radio" name="payMethod" checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  style={{ accentColor: TEAL, width: 16, height: 16 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>Credit/Debit Card</span>
              </label>
              <label style={paymentMethod === "paypal" ? radioRowActive : radioRow}>
                <input type="radio" name="payMethod" checked={paymentMethod === "paypal"}
                  onChange={() => setPaymentMethod("paypal")}
                  style={{ accentColor: TEAL, width: 16, height: 16 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>PayPal</span>
              </label>
            </div>
          </div>

          {paymentMethod === "card" && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Credit or debit card number</label>
                <div style={{ position: "relative" }}>
                  <input type="text" inputMode="numeric" autoComplete="cc-number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    className="nv-billing-input"
                    style={{ ...inputStyle, paddingRight: 110 }} />
                  <div style={{
                    position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)",
                    display: "flex", gap: 5, alignItems: "center", pointerEvents: "none"
                  }}>
                    <VisaLogo /><MastercardLogo /><AmexLogo />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Card nickname (optional)</label>
                <input type="text" value={cardNickname} onChange={(e) => setCardNickname(e.target.value)}
                  placeholder="Card nickname" className="nv-billing-input" style={inputStyle} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Month</label>
                  <select value={expMonth} onChange={(e) => setExpMonth(e.target.value)}
                    className="nv-billing-input" style={inputStyle}>
                    <option value="">MM</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Year</label>
                  <select value={expYear} onChange={(e) => setExpYear(e.target.value)}
                    className="nv-billing-input" style={inputStyle}>
                    <option value="">YYYY</option>
                    {getYears().map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>CVV</label>
                  <div style={{ position: "relative" }}>
                    <input type="text" inputMode="numeric" autoComplete="cc-csc"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="3 digits"
                      className="nv-billing-input"
                      style={{ ...inputStyle, paddingRight: 44 }} />
                    <div style={{
                      position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)",
                      pointerEvents: "none"
                    }}>
                      <CvvCardIcon />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Name on card</label>
                <input type="text" autoComplete="cc-name"
                  value={nameOnCard} onChange={(e) => setNameOnCard(e.target.value)}
                  placeholder="Full name as it appears on card"
                  className="nv-billing-input" style={inputStyle} />
              </div>
            </>
          )}

          {paymentMethod === "paypal" && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 18, marginTop: 16, marginBottom: 16
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>Sign in to PayPal.com</div>
              <button
                type="button"
                onClick={() => alert("PayPal flow is not yet wired. Real Stripe + PayPal integration is the next backend task.")}
                style={{
                  background: "#FFC439", border: "none", borderRadius: 24,
                  padding: "14px 44px", fontSize: 20, fontWeight: 800, fontStyle: "italic",
                  fontFamily: "Helvetica, Arial, sans-serif", cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)", letterSpacing: "-0.6px"
                }}
              >
                <span style={{ color: "#003087" }}>Pay</span><span style={{ color: "#009CDE" }}>Pal</span>
              </button>
              <div style={{ fontSize: 12, color: MUTED, textAlign: "center", maxWidth: 280, lineHeight: 1.55 }}>
                You'll be redirected to PayPal to sign in and authorize the subscription.
              </div>
            </div>
          )}

          {paymentMethod === "card" && (
          <>
          <div style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 12 }}>
            Billing Address
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Address</label>
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onAddressSelect={(fields) => {
                if (fields.street) setAddress(fields.street);
                if (fields.city) setCity(fields.city);
                if (fields.postalCode) setPostalCode(fields.postalCode);
                if (fields.provinceCode) setProvince(fields.provinceCode);
              }}
              country={typeof billingCountry === "string" ? billingCountry : (billingCountry && billingCountry.code) || "CA"}
              placeholder="Street address"
              className="nv-billing-input"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Postal code</label>
              <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                placeholder="T5H 0S3" className="nv-billing-input" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Edmonton" className="nv-billing-input" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{subdivision ? subdivision.label : "Region"}</label>
            {subdivision ? (
              <select value={province} onChange={(e) => setProvince(e.target.value)} className="nv-billing-input" style={inputStyle}>
                {subdivision.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Enter your region" className="nv-billing-input" style={inputStyle} />
            )}
          </div>

          <label style={{
            display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16, cursor: "pointer"
          }}>
            <input type="checkbox" checked={useAsBusinessAddress}
              onChange={(e) => setUseAsBusinessAddress(e.target.checked)}
              style={{ accentColor: TEAL, width: 16, height: 16, marginTop: 2 }} />
            <span style={{ fontSize: 14, color: INK }}>
              Use this as my legal business address.
            </span>
          </label>

          <label style={{
            display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 24, cursor: "pointer"
          }}>
            <input type="checkbox" checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              style={{ accentColor: TEAL, width: 16, height: 16, marginTop: 2 }} />
            <span style={{ fontSize: 13, color: SUB, lineHeight: 1.55 }}>
              By selecting Subscribe, I agree to the <Link to="/legal/terms" className="nv-billing-link">Terms of Service</Link> and authorize Novala to charge my card on {chargeDateStr} and monthly thereafter at the then-current price, plus tax, unless I cancel. I can cancel anytime by going to the billing and subscriptions page. Novala's <Link to="/legal/privacy" className="nv-billing-link">Privacy Statement</Link> will apply to any personal information you provide us.
            </span>
          </label>

          {error && (
            <div style={{
              padding: 12, background: "#FDECEB", border: "1px solid #F5C2BD",
              borderRadius: 10, color: RED, fontSize: 13, fontWeight: 600, marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <button type="button" disabled={!canSubmit} onClick={handleSubscribe}
            className={canSubmit ? "nv-subscribe-on" : ""}
            style={{
              width: "100%", padding: "14px", fontSize: 15.5, fontWeight: 700,
              border: "none", borderRadius: 13,
              background: canSubmit ? TEAL : "#E7ECEC",
              color: canSubmit ? "#fff" : MUTED,
              cursor: canSubmit ? "pointer" : "not-allowed",
              boxShadow: canSubmit ? "0 8px 20px -8px rgba(15,149,153,0.6)" : "none",
              transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
              fontFamily: FONT
            }}>
            {submitting ? "Processing..." : "Subscribe"}
          </button>
          </>
          )}
        </div>

        <aside style={{
          background: ORDER_BG, borderRadius: 20, padding: 28,
          position: "sticky", top: 24
        }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: INK }}>
            Order summary
          </h3>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
            <span style={{ color: INK, fontWeight: 600 }}>{plan.name}</span>
            <span>
              <span style={{ color: MUTED, textDecoration: "line-through", marginRight: 6 }}>${planOriginal}/mo</span>
              <span style={{ color: INK, fontWeight: 700 }}>${planMonthly}/mo</span>
            </span>
          </div>

          {payroll && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: INK, fontWeight: 600 }}>{payroll.name}</span>
                <span>
                  <span style={{ color: MUTED, textDecoration: "line-through", marginRight: 6 }}>${payrollOriginal}/mo</span>
                  <span style={{ color: INK, fontWeight: 700 }}>${payrollMonthly}/mo</span>
                </span>
              </div>
              <div style={{ fontSize: 12, color: SUB, marginTop: 4 }}>
                +${perEmployee}/employee/mo
              </div>
            </div>
          )}

          <div style={{ height: 1, background: BORDER, margin: "16px 0" }} />

          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 16, fontWeight: 700, color: INK, marginBottom: 6
          }}>
            <span>Total due today</span>
            <span>${totalDueToday}</span>
          </div>

          {savings > 0 && (
            <div style={{ color: TEAL, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
              You're saving ${savings} {String.fromCodePoint(0x1F389)}
            </div>
          )}

          <div style={{ color: MUTED, fontSize: 12 }}>
            Taxes not included.
          </div>
        </aside>
      </div>

      <footer style={{ textAlign: "center", padding: "16px 32px 32px", fontSize: 13, color: SUB }}>
        <a href="#" className="nv-billing-link" onClick={(e) => e.preventDefault()}>
          Important pricing details and product information
        </a>
      </footer>
    </div>
  );
}
