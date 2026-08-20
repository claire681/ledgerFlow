import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, AlertCircle } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const authHeaders = () => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? "Bearer " + token : "",
  };
};

// Design tokens - matches approved v3 preview
const TEAL = "#15A08C";
const TEAL_HOVER = "#0B7377";
const TEAL_SOFT = "#E1F5EE";
const INK = "#0A1520";
const TEXT = "#1A2332";
const MUTED = "#2C3644";
const FAINT = "#4B5563";
const LINE = "#DDE2E9";
const LINE_SOFT = "#EEF1F5";
const SURFACE = "#F6F8FA";
const PAPER = "#FFFFFF";
const DANGER = "#B91C1C";
const DANGER_SOFT = "#FEE2E2";

const CANADIAN_PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "YT", name: "Yukon" },
];

// Validation functions
const validateBN = (bn) => {
  if (!bn) return null;
  const cleaned = bn.replace(/\s/g, "");
  if (!/^\d{9}$/.test(cleaned)) {
    return "Business Number must be exactly 9 digits";
  }
  return null;
};

const validateRP = (rp) => {
  if (!rp) return null;
  const cleaned = rp.replace(/\s/g, "").toUpperCase();
  if (!/^RP\d{4}$/.test(cleaned)) {
    return "Payroll account must be RP followed by 4 digits (e.g. RP0001)";
  }
  return null;
};

const validatePostalCode = (pc) => {
  if (!pc) return null;
  const cleaned = pc.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned)) {
    return "Postal code format: A1A 1A1";
  }
  return null;
};

const EMPTY_FORM = {
  company_name: "",
  business_number: "",
  payroll_rp_account: "",
  address_street: "",
  address_city: "",
  province_state: "",
  address_postal_code: "",
  contact_email: "",
  phone: "",
  website: "",
  logo_url: "",
  country: "CA",
};

export default function SettingsCompany() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [original, setOriginal] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(API_URL + "/api/v1/company/profile", { headers: authHeaders() });
        if (!res.ok) throw new Error("Could not load profile");
        const data = await res.json();
        const loaded = {
          company_name: data.company_name || "",
          business_number: data.business_number || "",
          payroll_rp_account: data.payroll_rp_account || "",
          address_street: data.address_street || "",
          address_city: data.address_city || "",
          province_state: data.province_state || "",
          address_postal_code: data.address_postal_code || "",
          contact_email: data.contact_email || "",
          phone: data.phone || "",
          website: data.website || "",
          logo_url: data.logo_url || "",
          country: data.country || "CA",
        };
        setForm(loaded);
        setOriginal(loaded);
      } catch (e) {
        setSaveError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isDirty = JSON.stringify(form) !== JSON.stringify(original);

  const setField = (key, value) => {
    setForm({ ...form, [key]: value });
    // Live-validate specific fields
    const newErrors = { ...errors };
    if (key === "business_number") {
      const err = validateBN(value);
      if (err) newErrors.business_number = err;
      else delete newErrors.business_number;
    }
    if (key === "payroll_rp_account") {
      const err = validateRP(value);
      if (err) newErrors.payroll_rp_account = err;
      else delete newErrors.payroll_rp_account;
    }
    if (key === "address_postal_code") {
      const err = validatePostalCode(value);
      if (err) newErrors.address_postal_code = err;
      else delete newErrors.address_postal_code;
    }
    setErrors(newErrors);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    // Run all validations
    const finalErrors = {};
    const bnErr = validateBN(form.business_number);
    if (bnErr) finalErrors.business_number = bnErr;
    const rpErr = validateRP(form.payroll_rp_account);
    if (rpErr) finalErrors.payroll_rp_account = rpErr;
    const pcErr = validatePostalCode(form.address_postal_code);
    if (pcErr) finalErrors.address_postal_code = pcErr;

    // Required-field checks (Canada)
    if (!form.company_name.trim()) finalErrors.company_name = "Legal business name is required";
    if (!form.address_street.trim()) finalErrors.address_street = "Street address is required";
    if (!form.address_city.trim()) finalErrors.address_city = "City is required";
    if (!form.province_state) finalErrors.province_state = "Province is required";
    if (!form.address_postal_code.trim()) finalErrors.address_postal_code = "Postal code is required";

    setErrors(finalErrors);
    if (Object.keys(finalErrors).length > 0) {
      setSaveError("Please fix the errors above before saving.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(API_URL + "/api/v1/company/profile", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not save profile");
      }
      const saved = await res.json();
      const savedForm = { ...form, logo_url: saved.logo_url || form.logo_url };
      setForm(savedForm);
      setOriginal(savedForm);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setForm(original);
    setErrors({});
    setSaveError(null);
    setSaveSuccess(false);
  };

  const inputStyle = (hasError) => ({
    width: "100%",
    padding: "11px 13px",
    border: "1px solid " + (hasError ? DANGER : LINE),
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    color: TEXT,
    background: hasError ? "#FFF9F9" : PAPER,
    outline: "none",
    boxSizing: "border-box",
  });

  const labelStyle = { display: "block", fontSize: 12.5, fontWeight: 600, color: INK, marginBottom: 6 };
  const helperStyle = { fontSize: 12, color: MUTED, marginTop: 6, lineHeight: 1.5 };
  const errorTextStyle = { fontSize: 12, color: DANGER, marginTop: 6, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 };
  const cardStyle = { background: PAPER, border: "1px solid " + LINE, borderRadius: 12, padding: "30px 32px", marginBottom: 20 };
  const cardHeaderStyle = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid " + LINE_SOFT };
  const badgeRequired = { display: "inline-block", padding: "3px 9px", background: DANGER_SOFT, color: DANGER, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", borderRadius: 4, flexShrink: 0 };
  const badgeOptional = { display: "inline-block", padding: "3px 9px", background: LINE_SOFT, color: FAINT, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", borderRadius: 4, flexShrink: 0 };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: MUTED, fontFamily: "Inter, sans-serif" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: "30px 44px", maxWidth: 1200, margin: "0 auto", fontFamily: "Inter, 'Plus Jakarta Sans', sans-serif", color: TEXT, fontSize: 14, lineHeight: 1.5 }}>
      <button
        onClick={() => navigate("/settings")}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px 6px 8px", background: PAPER, border: "1px solid " + LINE, borderRadius: 8, color: MUTED, fontSize: 12.5, fontWeight: 500, cursor: "pointer", marginBottom: 20, fontFamily: "inherit" }}
      >
        <ChevronLeft size={14} />
        Settings
      </button>

      <h1 style={{ fontSize: 26, fontWeight: 600, color: INK, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Company profile</h1>
      <p style={{ color: MUTED, fontSize: 14, marginBottom: 32, maxWidth: 620 }}>
        Your business identity. This information appears on every invoice you send, every pay stub you generate, and every CRA remittance. Keep it accurate.
      </p>

      {/* Card 2: Legal identity */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 4, letterSpacing: "-0.01em" }}>Legal business identity</div>
            <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.55 }}>Your registered business name and CRA identifiers. These appear on every legal document.</div>
          </div>
          <span style={badgeRequired}>Required</span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Legal business name <span style={{ color: DANGER, fontWeight: 700 }}>*</span></label>
          <input type="text" value={form.company_name} onChange={(e) => setField("company_name", e.target.value)} placeholder="BrightCare Home Healthcare Inc." style={inputStyle(errors.company_name)} />
          {errors.company_name ? (
            <div style={errorTextStyle}><AlertCircle size={13} /> {errors.company_name}</div>
          ) : (
            <div style={helperStyle}>The name registered with your provincial or federal corporate registry.</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>CRA Business Number (BN) <span style={{ color: DANGER, fontWeight: 700 }}>*</span></label>
            <input type="text" value={form.business_number} onChange={(e) => setField("business_number", e.target.value)} placeholder="123456789" style={inputStyle(errors.business_number)} />
            {errors.business_number ? (
              <div style={errorTextStyle}><AlertCircle size={13} /> {errors.business_number}</div>
            ) : (
              <div style={helperStyle}>Your 9-digit CRA business number.</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Payroll Program Account (RP) <span style={{ color: DANGER, fontWeight: 700 }}>*</span></label>
            <input type="text" value={form.payroll_rp_account} onChange={(e) => setField("payroll_rp_account", e.target.value)} placeholder="RP0001" style={inputStyle(errors.payroll_rp_account)} />
            {errors.payroll_rp_account ? (
              <div style={errorTextStyle}><AlertCircle size={13} /> {errors.payroll_rp_account}</div>
            ) : (
              <div style={helperStyle}>Assigned by CRA when you register for payroll. Format: RP + 4 digits.</div>
            )}
          </div>
        </div>
      </div>

      {/* Card 3: Business address */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 4, letterSpacing: "-0.01em" }}>Business address</div>
            <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.55 }}>Where your business is registered. Appears on invoices, pay stubs, and T4 slips.</div>
          </div>
          <span style={badgeRequired}>Required</span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Street address <span style={{ color: DANGER, fontWeight: 700 }}>*</span></label>
          <input type="text" value={form.address_street} onChange={(e) => setField("address_street", e.target.value)} placeholder="49516 Range Road 174" style={inputStyle(errors.address_street)} />
          {errors.address_street && <div style={errorTextStyle}><AlertCircle size={13} /> {errors.address_street}</div>}
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>City <span style={{ color: DANGER, fontWeight: 700 }}>*</span></label>
            <input type="text" value={form.address_city} onChange={(e) => setField("address_city", e.target.value)} placeholder="Edmonton" style={inputStyle(errors.address_city)} />
            {errors.address_city && <div style={errorTextStyle}><AlertCircle size={13} /> {errors.address_city}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Province <span style={{ color: DANGER, fontWeight: 700 }}>*</span></label>
            <select value={form.province_state} onChange={(e) => setField("province_state", e.target.value)} style={inputStyle(errors.province_state)}>
              <option value="">Select province</option>
              {CANADIAN_PROVINCES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
            {errors.province_state && <div style={errorTextStyle}><AlertCircle size={13} /> {errors.province_state}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Postal code <span style={{ color: DANGER, fontWeight: 700 }}>*</span></label>
            <input type="text" value={form.address_postal_code} onChange={(e) => setField("address_postal_code", e.target.value.toUpperCase())} placeholder="T5H 0S4" style={inputStyle(errors.address_postal_code)} />
            {errors.address_postal_code && <div style={errorTextStyle}><AlertCircle size={13} /> {errors.address_postal_code}</div>}
          </div>
        </div>
      </div>

      {/* Card 4: Contact info */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 4, letterSpacing: "-0.01em" }}>Contact information</div>
            <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.55 }}>Optional. Shown on customer-facing documents like invoices.</div>
          </div>
          <span style={badgeOptional}>Optional</span>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Business email</label>
            <input type="email" value={form.contact_email} onChange={(e) => setField("contact_email", e.target.value)} placeholder="hello@brightcare.ca" style={inputStyle(false)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Business phone</label>
            <input type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+1 (780) 555 0100" style={inputStyle(false)} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Website</label>
          <input type="text" value={form.website} onChange={(e) => setField("website", e.target.value)} placeholder="www.brightcare.ca" style={inputStyle(false)} />
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{ position: "sticky", bottom: 24, background: PAPER, border: "1px solid " + LINE, borderRadius: 12, padding: "14px 22px", marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 16px rgba(0, 20, 40, 0.06)" }}>
        <div style={{ fontSize: 13, color: isDirty ? TEAL_HOVER : FAINT, fontWeight: isDirty ? 600 : 400, display: "flex", alignItems: "center", gap: 6 }}>
          {isDirty && <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL, display: "inline-block" }} />}
          {saveSuccess ? "Saved successfully" : (isDirty ? "Unsaved changes" : "All changes saved")}
        </div>
        <div>
          <button onClick={handleDiscard} disabled={!isDirty || saving} style={{ background: PAPER, color: INK, border: "1px solid " + LINE, padding: "10px 20px", borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: (!isDirty || saving) ? "not-allowed" : "pointer", fontFamily: "inherit", marginRight: 10, opacity: (!isDirty || saving) ? 0.5 : 1 }}>
            Discard
          </button>
          <button onClick={handleSave} disabled={!isDirty || saving} style={{ background: (!isDirty || saving) ? "#D6D3D1" : TEAL, color: "white", border: "none", padding: "10px 22px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: (!isDirty || saving) ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div style={{
          position: "fixed",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#059669",
          color: "white",
          padding: "12px 24px",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0, 100, 60, 0.25)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
        }}>
          <span>✓</span>
          Company profile saved
        </div>
      )}

      {saveError && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: DANGER_SOFT, color: DANGER, borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} />
          {saveError}
        </div>
      )}
    </div>
  );
}