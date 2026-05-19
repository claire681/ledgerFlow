import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CompanyPhoneField } from "../CompanyPhoneField";

const GREEN = "#047857";
const TEXT = "#0F172A";
const SUBTLE = "#64748b";
const BORDER = "#e2e8f0";

const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
};

const labelStyle = { display: "block", fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 8 };
const inputStyle = {
  width: "100%", padding: "12px 14px", fontSize: 15,
  border: "1px solid " + BORDER, borderRadius: 8,
  fontFamily: "inherit", color: TEXT, boxSizing: "border-box",
  outline: "none", transition: "border-color 0.15s, box-shadow 0.15s"
};
const onFocus = (e) => {
  e.target.style.borderColor = GREEN;
  e.target.style.boxShadow = "0 0 0 3px rgba(4, 120, 87, 0.1)";
};
const onBlur = (e) => {
  e.target.style.borderColor = BORDER;
  e.target.style.boxShadow = "none";
};

export function NewCustomerDrawer({ isOpen, onClose, onSave }) {
  const isMobile = useIsMobile();
  const [data, setData] = useState({
    display_name: "", email: "", phone: "",
    address_street: "", address_city: "",
    address_province: "", address_postal_code: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const setField = (field, value) => setData(d => ({ ...d, [field]: value }));
  const canSave = data.display_name.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const payload = {
      display_name: data.display_name.trim(),
      email: data.email.trim(),
      phone: data.phone,
      address_street: data.address_street.trim(),
      address_city: data.address_city.trim(),
      address_province: data.address_province.trim(),
      address_postal_code: data.address_postal_code.trim()
    };
    try {
      if (typeof onSave === "function") await onSave(payload);
      onClose();
    } catch (e) {
      setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)", zIndex: 1000
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: isMobile ? "100%" : 520,
        background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
        zIndex: 1001, display: "flex", flexDirection: "column",
        fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif"
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid " + BORDER, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>New customer</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
              <X size={20} color={SUBTLE} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: SUBTLE, marginTop: 6, marginBottom: 0 }}>
            Add a customer for this and future invoices.
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Customer display name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input type="text" value={data.display_name}
              onChange={e => setField("display_name", e.target.value)}
              style={inputStyle} placeholder="ACME Corp or John Smith"
              onFocus={onFocus} onBlur={onBlur} autoFocus />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={data.email}
              onChange={e => setField("email", e.target.value)}
              style={inputStyle} placeholder="customer@example.com"
              onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <CompanyPhoneField value={data.phone} onChange={v => setField("phone", v || "")} />
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginTop: 24, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid " + BORDER }}>
            Billing address
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Street</label>
            <input type="text" value={data.address_street}
              onChange={e => setField("address_street", e.target.value)}
              style={inputStyle} placeholder="123 Main St"
              onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>City</label>
            <input type="text" value={data.address_city}
              onChange={e => setField("address_city", e.target.value)}
              style={inputStyle} placeholder="Edmonton"
              onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Province</label>
              <input type="text" value={data.address_province}
                onChange={e => setField("address_province", e.target.value)}
                style={inputStyle} placeholder="AB"
                onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={labelStyle}>Postal code</label>
              <input type="text" value={data.address_postal_code}
                onChange={e => setField("address_postal_code", e.target.value)}
                style={inputStyle} placeholder="T5H 0S4"
                onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 12px", background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 6, color: "#854d0e", fontSize: 13, marginTop: 12 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{
          position: "sticky", bottom: 0, width: "100%",
          background: "#fff", borderTop: "1px solid " + BORDER,
          padding: "16px 24px", boxSizing: "border-box",
          display: "flex", justifyContent: "flex-end", flexShrink: 0,
          boxShadow: "0 -8px 20px rgba(0,0,0,0.06)", zIndex: 10
        }}>
          <button onClick={handleSave} disabled={!canSave} style={{
            background: canSave ? GREEN : "#94a3b8", color: "#fff",
            border: "none", borderRadius: 8, padding: "0 32px",
            height: 48, fontSize: 16, fontWeight: 600,
            cursor: canSave ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            boxShadow: canSave ? "0 4px 12px rgba(4, 120, 87, 0.3)" : "none",
            transition: "all 0.15s ease", minWidth: 160
          }}>
            {saving ? "Saving..." : "Save customer"}
          </button>
        </div>
      </div>
    </>
  );
}
