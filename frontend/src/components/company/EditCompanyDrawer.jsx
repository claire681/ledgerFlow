import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const COMPANY_KEY = "novala_company_profile_v1";

export const getStoredProfile = () => {
  try { return JSON.parse(localStorage.getItem(COMPANY_KEY) || "{}"); }
  catch { return {}; }
};

export const setStoredProfile = (d) => {
  try { localStorage.setItem(COMPANY_KEY, JSON.stringify(d)); } catch {}
};

const BRAND = "#0F5959";
const BORDER = "#e2e8f0";
const TEXT = "#0F172A";
const SUBTLE = "#64748B";

const labelStyle = { display: "block", fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 8 };
const inputStyle = { width: "100%", padding: "12px 14px", border: "1px solid " + BORDER, borderRadius: 8, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff", color: "#0F172A" };
const sectionStyle = { fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 12, marginTop: 24 };
const onFocus = (e) => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = "0 0 0 3px rgba(15,89,89,0.12)"; };
const onBlur = (e) => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = "none"; };

export default function EditCompanyDrawer({ open, onClose, initialData, onSave }) {
  const [data, setData] = useState({ name: "", business_number: "", email: "", phone: "", website: "", address_street: "", address_city: "", address_province: "", address_postal_code: "" });
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!open) return;
    const stored = getStoredProfile();
    const src = (initialData && initialData.from_name) ? initialData : { from_name: stored.name, from_bn: stored.business_number, from_email: stored.email, from_phone: stored.phone, from_website: stored.website, from_address: stored.address };
    const addr = src.from_address || "";
    const lines = String(addr).split(/[,\n]/).map(x => x.trim()).filter(Boolean);
    setData({
      name: src.from_name || "",
      business_number: src.from_bn || "",
      email: src.from_email || "",
      phone: src.from_phone || "",
      website: src.from_website || "",
      address_street: lines[0] || "",
      address_city: lines[1] || "",
      address_province: lines[2] || "",
      address_postal_code: lines[3] || ""
    });
    setError(null);
  }, [open, initialData]);

  if (!open) return null;

  const setField = (k, v) => setData(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!data.name.trim()) { setError("Company name is required"); return; }
    setSaving(true); setError(null);
    const addrParts = [data.address_street, data.address_city, data.address_province, data.address_postal_code].filter(Boolean);
    const fullAddr = addrParts.join("\n");

    setStoredProfile({ name: data.name.trim(), business_number: data.business_number, email: data.email, phone: data.phone, website: data.website, address: fullAddr });

    const payload = { from_name: data.name.trim(), from_bn: data.business_number, from_email: data.email, from_phone: data.phone, from_website: data.website, from_address: fullAddr };

    try {
      if (onSave) await onSave(payload);
      onClose();
    } catch (e) {
      setError("Saved on this device. Backend sync deferred.");
      setTimeout(() => onClose(), 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: isMobile ? "100%" : 520, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", zIndex: 101, display: "flex", flexDirection: "column", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid " + BORDER }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: TEXT, margin: 0 }}>My company</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}><X size={20} color={SUBTLE} /></button>
          </div>
          <p style={{ fontSize: 13, color: SUBTLE, marginTop: 6, marginBottom: 0 }}>Changes made here will update your company information everywhere.</p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Company name (required)</label><input type="text" value={data.name} onChange={e => setField("name", e.target.value)} style={inputStyle} placeholder="Acme Inc." onFocus={onFocus} onBlur={onBlur} /></div>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Business number (BN)</label><input type="text" value={data.business_number} onChange={e => setField("business_number", e.target.value)} style={inputStyle} placeholder="123456789RT0001" onFocus={onFocus} onBlur={onBlur} /></div>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Email</label><input type="email" value={data.email} onChange={e => setField("email", e.target.value)} style={inputStyle} placeholder="contact@yourcompany.com" onFocus={onFocus} onBlur={onBlur} /></div>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Phone number</label><input type="tel" value={data.phone} onChange={e => setField("phone", e.target.value)} style={inputStyle} placeholder="+1 (780) 555-1234" onFocus={onFocus} onBlur={onBlur} /></div>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Website</label><input type="url" value={data.website} onChange={e => setField("website", e.target.value)} style={inputStyle} placeholder="https://yourcompany.com" onFocus={onFocus} onBlur={onBlur} /></div>

          <div style={sectionStyle}>Company address</div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>Street</label><input type="text" value={data.address_street} onChange={e => setField("address_street", e.target.value)} style={inputStyle} placeholder="123 Main St" onFocus={onFocus} onBlur={onBlur} /></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>City</label><input type="text" value={data.address_city} onChange={e => setField("address_city", e.target.value)} style={inputStyle} placeholder="Edmonton" onFocus={onFocus} onBlur={onBlur} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Province</label><input type="text" value={data.address_province} onChange={e => setField("address_province", e.target.value)} style={inputStyle} placeholder="AB" onFocus={onFocus} onBlur={onBlur} /></div>
            <div><label style={labelStyle}>Postal code</label><input type="text" value={data.address_postal_code} onChange={e => setField("address_postal_code", e.target.value)} style={inputStyle} placeholder="T5H 0S4" onFocus={onFocus} onBlur={onBlur} /></div>
          </div>

          <div style={sectionStyle}>Customer-facing address</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer", fontSize: 13, color: TEXT }}>
            <input type="checkbox" defaultChecked style={{ accentColor: BRAND, width: 16, height: 16 }} />
            <span>Same as company address</span>
          </label>

          {error && (<div style={{ padding: "10px 12px", background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 6, color: "#854d0e", fontSize: 13, marginTop: 12 }}>{error}</div>)}
        </div>

        <div style={{ padding: "20px 24px", borderTop: "1px solid " + BORDER, display: "flex", justifyContent: "flex-end", background: "#f8fafc" }}>
          <button onClick={handleSave} disabled={saving || !data.name.trim()} style={{ padding: "14px 36px", background: BRAND, color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 700, boxShadow: "0 4px 12px rgba(15,89,89,0.35)", letterSpacing: "0.02em", cursor: saving ? "wait" : "pointer", opacity: (saving || !data.name.trim()) ? 0.6 : 1, fontFamily: "inherit" }}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </>
  );
}
