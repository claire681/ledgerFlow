import React, { useState, useEffect } from "react";
import { Edit2 } from "lucide-react";
import CustomerCombobox from "./customers/CustomerCombobox";

const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
};

const DEFAULTS = {
  showInvoiceNo: true, showInvoiceDate: true, showDueDate: true,
  showTerms: true, showCustomerEmail: true, showCustomerAddress: true
};

const editableBase = (s) => ({ ...s, background: "transparent", border: "1px solid #e2e8f0", padding: "8px 12px", fontFamily: "inherit", outline: "none", borderRadius: 6, width: "100%", boxSizing: "border-box" });
const onFocusBg = (e) => { e.target.style.borderColor = "#0F5959"; e.target.style.boxShadow = "0 0 0 3px rgba(15,89,89,0.12)"; };
const onBlurBg = (e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; };

const EditableText = ({ value, field, onFieldChange, style, placeholder, fallback }) => {
  if (!onFieldChange) return <div style={style}>{value || (fallback !== undefined ? fallback : "-")}</div>;
  return <input type="text" value={value || ""} onChange={e => onFieldChange(field, e.target.value)} placeholder={placeholder} style={editableBase(style)} onFocus={onFocusBg} onBlur={onBlurBg} />;
};

const EditableDate = ({ value, field, onFieldChange, style }) => {
  const d = value ? String(value).slice(0, 10) : "";
  if (!onFieldChange) return <span style={style}>{d || "-"}</span>;
  return <input type="date" value={d} onChange={e => onFieldChange(field, e.target.value)} style={editableBase(style)} onFocus={onFocusBg} onBlur={onBlurBg} />;
};

const FormRow = ({ label, isMobile, children }) => (
  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 4 : 12, alignItems: isMobile ? "stretch" : "center", marginBottom: 12 }}>
    <div style={{ width: isMobile ? "100%" : 110, fontSize: 13, fontWeight: 500, color: "#475569", flexShrink: 0 }}>{label}</div>
    <div style={{ flex: 1, minWidth: 0, maxWidth: isMobile ? "100%" : 220 }}>{children}</div>
  </div>
);

const SkeletonBar = ({ width }) => <div style={{ width, height: 12, background: "#e2e8f0", borderRadius: 4, marginBottom: 8 }} />;

export default function InvoicePreview({ inv, customization, accentColor, template, onFieldChange, onCustomerSelect }) {
  const isMobile = useIsMobile();
  const c = { ...DEFAULTS, ...(customization || {}) };
  const lineItems = inv.line_items || inv.items || [];
  const subtotal = Number(inv.subtotal || lineItems.reduce((s, it) => s + (Number(it.quantity ?? it.qty ?? 1)) * (Number(it.price ?? it.rate ?? 0)), 0));
  const taxAmt = Number(inv.tax_amount || 0);
  const totalAmt = Number(inv.total || subtotal + taxAmt);
  const hasCustomer = !!(inv.to_name || inv.to_email);
  const numStyle = { fontVariantNumeric: "lining-nums tabular-nums" };

  return (
    <div style={{ background: "#fff", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif" }}>

      {/* Zone 1 - Invoice document header */}
      <div style={{ padding: isMobile ? "24px 16px" : "40px 32px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: isMobile ? 20 : 32, background: "#fff" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 26 : 32, fontWeight: 600, color: "#0F172A", margin: 0, marginBottom: 24, letterSpacing: "0.01em" }}>INVOICE</h1>
          {inv.from_name && <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{inv.from_name}</div>}
          {inv.from_address && <div style={{ fontSize: 13, color: "#475569", whiteSpace: "pre-line", lineHeight: 1.5 }}>{inv.from_address}</div>}
          <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", marginTop: 10, display: "inline-block" }}>Edit company</a>
        </div>
        <div style={{ paddingTop: isMobile ? 0 : 56 }}>
          {inv.from_email && <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>{inv.from_email}</div>}
          {inv.from_phone && <div style={{ fontSize: 13, color: "#475569" }}>{inv.from_phone}</div>}
        </div>
        <div style={{ textAlign: isMobile ? "left" : "right" }}>
          <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12, ...numStyle }}>Balance due (hidden): <span style={{ color: accentColor || "#0F172A", fontWeight: 600 }}>${totalAmt.toFixed(2)}</span></div>
          {inv.logo_url ? (
            <img src={inv.logo_url} alt="Logo" style={{ maxHeight: 80, width: "auto", display: "inline-block" }} onError={e => { e.target.style.display = "none"; }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 8, background: "#f1f5f9", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 11 }}>Logo</div>
          )}
          <div style={{ marginTop: 8 }}>
            <button style={{ width: 28, height: 28, borderRadius: "50%", background: "#f1f5f9", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Edit2 size={12} color="#64748B" />
            </button>
          </div>
        </div>
      </div>

      {/* Zone 2 - Customer + invoice meta */}
      <div style={{ padding: isMobile ? "24px 16px" : "32px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ marginBottom: 24 }}>
          <CustomerCombobox value={inv.to_name} onSelect={onCustomerSelect} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 32 }}>
          <div>
            {hasCustomer ? (
              <>
                {inv.to_name && <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{inv.to_name}</div>}
                {c.showCustomerEmail && inv.to_email && <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>{inv.to_email}</div>}
                {c.showCustomerAddress && inv.to_address && <div style={{ fontSize: 13, color: "#475569", whiteSpace: "pre-line" }}>{inv.to_address}</div>}
              </>
            ) : (
              <>
                <SkeletonBar width={192} />
                <SkeletonBar width={160} />
                <SkeletonBar width={128} />
              </>
            )}
          </div>
          <div>
            {c.showInvoiceNo && (
              <FormRow label="Invoice no." isMobile={isMobile}>
                <EditableText value={inv.invoice_number} field="invoice_number" onFieldChange={onFieldChange} style={{ fontSize: 13, color: "#0F172A" }} placeholder="1009" />
              </FormRow>
            )}
            {c.showTerms && (
              <FormRow label="Terms" isMobile={isMobile}>
                <EditableText value={inv.terms} field="terms" onFieldChange={onFieldChange} style={{ fontSize: 13, color: "#0F172A" }} placeholder="Net 30" fallback="Net 30" />
              </FormRow>
            )}
            {c.showInvoiceDate && (
              <FormRow label="Invoice date" isMobile={isMobile}>
                <EditableDate value={inv.date} field="date" onFieldChange={onFieldChange} style={{ fontSize: 13, color: "#0F172A" }} />
              </FormRow>
            )}
            {c.showDueDate && (
              <FormRow label="Due date" isMobile={isMobile}>
                <EditableDate value={inv.due_date} field="due_date" onFieldChange={onFieldChange} style={{ fontSize: 13, color: "#0F172A" }} />
              </FormRow>
            )}
          </div>
        </div>
      </div>

      {/* Zone 3 - Line items */}
      <div style={{ padding: isMobile ? "24px 16px" : "32px", background: "#fff" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", margin: 0, marginBottom: 20 }}>Product or service</h2>
        <div style={{ overflowX: isMobile ? "auto" : "visible" }}>
          <table style={{ width: "100%", minWidth: isMobile ? 480 : "auto", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>#</th>
              <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</th>
              <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Qty</th>
              <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rate</th>
              <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount</th>
            </tr></thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 13 }}>No line items yet</td></tr>
              ) : lineItems.map((item, i) => {
                const qty = Number(item.quantity ?? item.qty ?? 1);
                const price = Number(item.price ?? item.rate ?? 0);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 8px", fontSize: 13, color: "#0F172A", ...numStyle }}>{i + 1}</td>
                    <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{item.description || item.service || "-"}</td>
                    <td style={{ padding: "12px 8px", fontSize: 13, color: "#0F172A", textAlign: "right", ...numStyle }}>{qty}</td>
                    <td style={{ padding: "12px 8px", fontSize: 13, color: "#0F172A", textAlign: "right", ...numStyle }}>${price.toFixed(2)}</td>
                    <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600, color: "#0F172A", textAlign: "right", ...numStyle }}>${(qty * price).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>Print or download</button>
        </div>
      </div>
    </div>
  );
}
