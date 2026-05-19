import React, { useState, useEffect } from "react";
import { X, Upload, Trash2, ChevronDown } from "lucide-react";

const COMPANY_KEY = "novala_company_profile_v1";

export const getStoredProfile = () => {
  try { return JSON.parse(localStorage.getItem(COMPANY_KEY) || "{}"); }
  catch { return {}; }
};

export const setStoredProfile = (d) => {
  try { localStorage.setItem(COMPANY_KEY, JSON.stringify(d)); } catch {}
};

const BRAND = "#0F5959";
const GREEN = "#047857";
const BORDER = "#cbd5e1";
const TEXT = "#0F172A";
const SUBTLE = "#475569";

const labelStyle = { display: "block", fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 8 };
const inputStyle = { width: "100%", padding: "12px 14px", border: "1px solid " + BORDER, borderRadius: 8, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff", color: TEXT };
const sectionStyle = { fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 14, marginTop: 28 };
const onFocus = (e) => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = "0 0 0 3px rgba(15,89,89,0.15)"; };
const onBlur = (e) => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = "none"; };

const COUNTRIES = [
  { code: "CA", flag: "\uD83C\uDDE8\uD83C\uDDE6", dial: "+1" },
  { code: "US", flag: "\uD83C\uDDFA\uD83C\uDDF8", dial: "+1" },
  { code: "GB", flag: "\uD83C\uDDEC\uD83C\uDDE7", dial: "+44" },
  { code: "AU", flag: "\uD83C\uDDE6\uD83C\uDDFA", dial: "+61" },
  { code: "NG", flag: "\uD83C\uDDF3\uD83C\uDDEC", dial: "+234" },
  { code: "KE", flag: "\uD83C\uDDF0\uD83C\uDDEA", dial: "+254" },
  { code: "IN", flag: "\uD83C\uDDEE\uD83C\uDDF3", dial: "+91" },
  { code: "FR", flag: "\uD83C\uDDEB\uD83C\uDDF7", dial: "+33" },
  { code: "DE", flag: "\uD83C\uDDE9\uD83C\uDDEA", dial: "+49" },
  { code: "ZA", flag: "\uD83C\uDDFF\uD83C\uDDE6", dial: "+27" }
];

export default function EditCompanyDrawer({ open, onClose, initialData, onSave }) {
  const [data, setData] = useState({ name: "", business_number: "", email: "", phone: "", website: "", address_street: "", address_city: "", address_province: "", address_postal_code: "", cf_same: true, cf_street: "", cf_city: "", cf_province: "", cf_postal_code: "", logo: null });
  const [phoneCountry, setPhoneCountry] = useState("CA");
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!phoneDropdownOpen) return;
    const handler = (e) => { if (!e.target.closest("[data-phone-dropdown]")) setPhoneDropdownOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [phoneDropdownOpen]);

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
      phone: src.from_phone ? src.from_phone.replace(/^\+\d+\s*/, "") : "",
      website: src.from_website || "",
      address_street: lines[0] || "",
      address_city: lines[1] || "",
      address_province: lines[2] || "",
      address_postal_code: lines[3] || "",
      cf_same: stored.cf_same !== false,
      cf_street: stored.cf_street || "",
      cf_city: stored.cf_city || "",
      cf_province: stored.cf_province || "",
      cf_postal_code: stored.cf_postal_code || "",
      logo: stored.logo || initialData?.logo_url || null
    });
    setPhoneCountry(stored.phoneCountry || "CA");
    setError(null);
  }, [open, initialData]);

  if (!open) return null;

  const setField = (k, v) => setData(prev => ({ ...prev, [k]: v }));

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Logo too large (max 2 MB)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setField("logo", ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!data.name.trim()) { setError("Company name is required"); return; }
    setSaving(true); setError(null);
    const country = COUNTRIES.find(c => c.code === phoneCountry) || COUNTRIES[0];
    const fullPhone = data.phone ? (country.dial + " " + data.phone) : "";
    const addrParts = [data.address_street, data.address_city, data.address_province, data.address_postal_code].filter(Boolean);
    const fullAddr = addrParts.join("\n");

    setStoredProfile({ name: data.name.trim(), business_number: data.business_number, email: data.email, phone: fullPhone, phoneCountry, website: data.website, address: fullAddr, cf_same: data.cf_same, cf_street: data.cf_street, cf_city: data.cf_city, cf_province: data.cf_province, cf_postal_code: data.cf_postal_code, logo: data.logo });

    const payload = { from_name: data.name.trim(), from_bn: data.business_number, from_email: data.email, from_phone: fullPhone, from_website: data.website, from_address: fullAddr, logo_url: data.logo };

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

  const canSave = data.name.trim().length > 0 && !saving;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: isMobile ? "100%" : 520, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", zIndex: 101, display: "flex", flexDirection: "column", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid " + BORDER, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>My company</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}><X size={20} color={SUBTLE} /></button>
          </div>
          <p style={{ fontSize: 13, color: SUBTLE, marginTop: 6, marginBottom: 0 }}>Changes made here will update your company information everywhere.</p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Company name (required)</label><input type="text" value={data.name} onChange={e => setField("name", e.target.value)} style={inputStyle} placeholder="Acme Inc." onFocus={onFocus} onBlur={onBlur} /></div>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Business number (BN)</label><input type="text" value={data.business_number} onChange={e => setField("business_number", e.target.value)} style={inputStyle} placeholder="123456789RT0001" onFocus={onFocus} onBlur={onBlur} /></div>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Email</label><input type="email" value={data.email} onChange={e => setField("email", e.target.value)} style={inputStyle} placeholder="contact@yourcompany.com" onFocus={onFocus} onBlur={onBlur} /></div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Phone number</label>
            <div style={{ display: "flex", gap: 8, position: "relative" }} data-phone-dropdown>
              <button type="button" onClick={() => setPhoneDropdownOpen(!phoneDropdownOpen)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px", border: "1px solid " + BORDER, borderRadius: 8, background: "#fff", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{flagOf(phoneCountry)}</span>
                <ChevronDown size={14} color={SUBTLE} />
              </button>
              <input type="tel" value={data.phone} onChange={e => setField("phone", e.target.value)} style={inputStyle} placeholder="(780) 555-1234" onFocus={onFocus} onBlur={onBlur} />
              {phoneDropdownOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, maxHeight: 320, overflowY: "auto", background: "#fff", border: "1px solid " + BORDER, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 50 }}>
                  {COUNTRIES.map(c => (
                    <button key={c.code} type="button" onClick={() => { setPhoneCountry(c.code); setPhoneDropdownOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", width: "100%", border: "none", borderBottom: "1px solid #f1f5f9", background: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontSize: 14, color: TEXT, boxSizing: "border-box" }} onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{flagOf(c.code)}</span>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                      <span style={{ color: SUBTLE, fontSize: 13, flexShrink: 0 }}>{c.dial}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Website</label><input type="url" value={data.website} onChange={e => setField("website", e.target.value)} style={inputStyle} placeholder="https://yourcompany.com" onFocus={onFocus} onBlur={onBlur} /></div>

          <div style={sectionStyle}>Company address</div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>Street</label><input type="text" value={data.address_street} onChange={e => setField("address_street", e.target.value)} style={inputStyle} placeholder="123 Main St" onFocus={onFocus} onBlur={onBlur} /></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>City</label><input type="text" value={data.address_city} onChange={e => setField("address_city", e.target.value)} style={inputStyle} placeholder="Edmonton" onFocus={onFocus} onBlur={onBlur} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Province</label><input type="text" value={data.address_province} onChange={e => setField("address_province", e.target.value)} style={inputStyle} placeholder="AB" onFocus={onFocus} onBlur={onBlur} /></div>
            <div><label style={labelStyle}>Postal code</label><input type="text" value={data.address_postal_code} onChange={e => setField("address_postal_code", e.target.value)} style={inputStyle} placeholder="T5H 0S4" onFocus={onFocus} onBlur={onBlur} /></div>
          </div>

          <div style={sectionStyle}>Customer-facing address</div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, cursor: "pointer", fontSize: 14, color: TEXT }}>
            <input type="checkbox" checked={data.cf_same} onChange={e => setField("cf_same", e.target.checked)} style={{ accentColor: GREEN, width: 18, height: 18 }} />
            <span>Same as company address</span>
          </label>
          {!data.cf_same && (
            <>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>Street</label><input type="text" value={data.cf_street} onChange={e => setField("cf_street", e.target.value)} style={inputStyle} placeholder="PO Box 123" onFocus={onFocus} onBlur={onBlur} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>City</label><input type="text" value={data.cf_city} onChange={e => setField("cf_city", e.target.value)} style={inputStyle} onFocus={onFocus} onBlur={onBlur} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>Province</label><input type="text" value={data.cf_province} onChange={e => setField("cf_province", e.target.value)} style={inputStyle} onFocus={onFocus} onBlur={onBlur} /></div>
                <div><label style={labelStyle}>Postal code</label><input type="text" value={data.cf_postal_code} onChange={e => setField("cf_postal_code", e.target.value)} style={inputStyle} onFocus={onFocus} onBlur={onBlur} /></div>
              </div>
            </>
          )}

          {error && (<div style={{ padding: "10px 12px", background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 6, color: "#854d0e", fontSize: 13, marginTop: 12 }}>{error}</div>)}
        </div>

        <div style={{ width: "100%", background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "16px 24px", boxSizing: "border-box", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={handleSave} disabled={!canSave} style={{ background: canSave ? GREEN : "#cbd5e1", color: "#fff", border: "none", borderRadius: 8, padding: "0 24px", height: 40, fontSize: 14, fontWeight: 500, cursor: canSave ? "pointer" : "not-allowed", opacity: 1, fontFamily: "inherit" }}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </>
  );
}
