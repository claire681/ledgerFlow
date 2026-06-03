import React, { useState } from "react";
import ReactDOM from "react-dom";
import { X, HelpCircle } from "lucide-react";

const BRAND = "#0F5959";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const BORDER = "#DDE5E5";

// Frontend-only persistence stub. TODO: wire to a /company-settings backend endpoint
// once the payroll_settings table is extended to hold these fields.
const LS_KEY = "novala_general_tax_info";

const PROVINCES = [
  ["AB", "Alberta"], ["BC", "British Columbia"], ["MB", "Manitoba"],
  ["NB", "New Brunswick"], ["NL", "Newfoundland and Labrador"], ["NS", "Nova Scotia"],
  ["NT", "Northwest Territories"], ["NU", "Nunavut"], ["ON", "Ontario"],
  ["PE", "Prince Edward Island"], ["QC", "Quebec"], ["SK", "Saskatchewan"],
  ["YT", "Yukon"],
];

function loadDefaults() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { legal_name: "", address_line1: "", city: "", province: "", postal_code: "" };
}

const iconBtnStyle = {
  width: 36, height: 36, borderRadius: 999,
  background: "transparent", border: "none", cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  color: SUB, transition: "background 0.15s",
};

export function GeneralTaxInfo({ onClose }) {
  const [f, setF] = useState(loadDefaults);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const save = () => {
    setSaving(true);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(f));
      setTimeout(() => onClose(), 250);
    } catch (e) {
      setSaving(false);
      alert("Failed to save: " + e.message);
    }
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", fontSize: 14.5,
    border: `1.6px solid ${BORDER}`, borderRadius: 10,
    background: "#fff", color: INK, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };
  const labelStyle = {
    display: "block", fontSize: 13, fontWeight: 600,
    color: SUB, marginBottom: 6,
  };

  const node = (
    <div style={{
      position: "fixed", inset: 0, background: "#fff",
      zIndex: 99500, overflow: "auto",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      animation: "gtIn 0.28s cubic-bezier(0.16,1,0.3,1)",
    }}>
      <style>{`@keyframes gtIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, background: "#F7F8F9",
        borderBottom: `1px solid ${BORDER}`, zIndex: 99501,
        padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <h2 style={{margin: 0, fontSize: 17, fontWeight: 700, color: INK}}>General tax info</h2>
        <div style={{display: "flex", gap: 6}}>
          <button aria-label="Help" title="Help" style={iconBtnStyle}>
            <HelpCircle size={20} strokeWidth={1.9} />
          </button>
          <button onClick={onClose} aria-label="Close" style={iconBtnStyle}>
            <X size={20} strokeWidth={2.1} />
          </button>
        </div>
      </div>

      {/* Body (left-aligned per shared edit-overlay shell rules) */}
      <div style={{maxWidth: 1100, margin: 0, padding: "32px 40px 120px"}}>
        <h1 style={{margin: "0 0 12px 0", fontSize: 26, fontWeight: 700, color: INK, letterSpacing: "-0.01em"}}>
          General tax info
        </h1>
        <p style={{fontSize: 14.5, color: SUB, lineHeight: 1.55, margin: "0 0 32px 0", maxWidth: 640}}>
          Tell us about your business so we can report your payroll wages and taxes. This is the info you used when you applied for a business number with the CRA.
        </p>

        <div style={{marginBottom: 24}}>
          <label style={labelStyle}>Company legal name</label>
          <input
            type="text"
            value={f.legal_name}
            onChange={(e) => set("legal_name", e.target.value)}
            placeholder="BrightCare Home Healthcare Services Inc."
            style={{...inputStyle, maxWidth: 640}}
          />
          <div style={{fontSize: 13, color: SUB, marginTop: 6, lineHeight: 1.55}}>
            This may be different than a trade or doing business as (DBA) name.
          </div>
        </div>

        <h3 style={{margin: "32px 0 18px 0", fontSize: 17, fontWeight: 700, color: INK}}>
          Company legal address
        </h3>

        <div style={{marginBottom: 20}}>
          <label style={labelStyle}>Street address</label>
          <input
            type="text"
            value={f.address_line1}
            onChange={(e) => set("address_line1", e.target.value)}
            placeholder="8460-106A Avenue NW"
            style={{...inputStyle, maxWidth: 640}}
          />
        </div>

        <div style={{display: "grid", gridTemplateColumns: "2fr 1.4fr 1.4fr", gap: 16, maxWidth: 700}}>
          <div>
            <label style={labelStyle}>City</label>
            <input
              type="text"
              value={f.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Edmonton"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Province</label>
            <select
              value={f.province}
              onChange={(e) => set("province", e.target.value)}
              style={inputStyle}
            >
              <option value="">Select</option>
              {PROVINCES.map(([code, name]) => (
                <option key={code} value={code}>{`${code} - ${name}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Postal code</label>
            <input
              type="text"
              value={f.postal_code}
              onChange={(e) => set("postal_code", e.target.value)}
              placeholder="T5H0S3"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: `1px solid ${BORDER}`,
        padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center",
        zIndex: 99501,
      }}>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: INK,
          fontWeight: 600, fontSize: 15, cursor: "pointer", padding: "10px 12px",
        }}>
          Cancel
        </button>
        <button onClick={save} disabled={saving} style={{
          padding: "11px 28px", borderRadius: 10, border: "none",
          background: saving ? "#9CA3AF" : BRAND, color: "#fff",
          fontWeight: 700, fontSize: 15, cursor: saving ? "default" : "pointer",
          boxShadow: saving ? "none" : "0 6px 14px -6px rgba(15,89,89,0.5)",
        }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(node, document.body);
}
