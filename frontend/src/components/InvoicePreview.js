import React, { useState, useEffect } from "react";

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

const editableBase = (s) => ({ ...s, background: "transparent", border: "none", padding: "2px 6px", margin: "-2px -6px", fontFamily: "inherit", outline: "none", width: "100%", cursor: "text", boxSizing: "border-box" });
const onFocusBg = (e) => { e.target.style.background = "rgba(15,89,89,0.08)"; e.target.style.borderRadius = "4px"; };
const onBlurBg = (e) => { e.target.style.background = "transparent"; };

const EditableText = ({ value, field, onFieldChange, style, placeholder, fallback }) => {
  if (!onFieldChange) return <div style={style}>{value || (fallback !== undefined ? fallback : "-")}</div>;
  return <input type="text" value={value || ""} onChange={e => onFieldChange(field, e.target.value)} placeholder={placeholder} style={editableBase(style)} onFocus={onFocusBg} onBlur={onBlurBg} />;
};

const EditableArea = ({ value, field, onFieldChange, style, placeholder, fallback }) => {
  if (!onFieldChange) return <div style={{ ...style, whiteSpace: "pre-line" }}>{value || (fallback !== undefined ? fallback : "-")}</div>;
  return <textarea value={value || ""} onChange={e => onFieldChange(field, e.target.value)} placeholder={placeholder} rows={2} style={{ ...editableBase(style), resize: "vertical", minHeight: 36 }} onFocus={onFocusBg} onBlur={onBlurBg} />;
};

const EditableDate = ({ value, field, onFieldChange, style }) => {
  const d = value ? String(value).slice(0, 10) : "";
  if (!onFieldChange) return <span style={style}>{d || "-"}</span>;
  return <input type="date" value={d} onChange={e => onFieldChange(field, e.target.value)} style={{ ...editableBase(style), padding: "2px 4px", margin: "-2px -4px", width: "auto" }} onFocus={onFocusBg} onBlur={onBlurBg} />;
};

export default function InvoicePreview({ inv, customization, accentColor, template, onFieldChange }) {
  const isMobile = useIsMobile();
  const c = { ...DEFAULTS, ...(customization || {}) };
  const lineItems = inv.line_items || inv.items || [];
  const subtotal = Number(inv.subtotal || lineItems.reduce((s, it) => s + (Number(it.quantity ?? it.qty ?? 1)) * (Number(it.price ?? it.rate ?? 0)), 0));
  const taxAmt = Number(inv.tax_amount || 0);
  const totalAmt = Number(inv.total || subtotal + taxAmt);
  const paid = inv.status === "paid";

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fff", color: "#1a1a2e", lineHeight: 1.6, padding: isMobile ? "24px 16px" : "48px 52px" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isMobile ? 20 : 40 }}>
        <div>
          <div style={{ fontSize: isMobile ? (template === "standard" ? 24 : 28) : (template === "standard" ? 32 : 38), fontWeight: 700, color: template === "standard" ? "#1a1a2e" : (accentColor || "#52b788"), letterSpacing: "0.02em", marginBottom: 12 }}>INVOICE</div>
          {inv.from_name && <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>{inv.from_name}</div>}
          {inv.from_bn && <div style={{ fontSize: 14, color: "#444", marginBottom: 2 }}>BN {inv.from_bn}</div>}
          {inv.from_address && <div style={{ fontSize: 14, color: "#444", whiteSpace: "pre-line", marginBottom: 2 }}>{inv.from_address}</div>}
          {inv.from_email && <div style={{ fontSize: 14, color: "#444", marginBottom: 2 }}>{inv.from_email}</div>}
          {inv.from_phone && <div style={{ fontSize: 14, color: "#444" }}>{inv.from_phone}</div>}
        </div>
      </div>

      <div style={{ background: template === "standard" ? "#f1f5f9" : ((accentColor || "#52b788") + "26"), border: template === "standard" ? "1px solid #e5e7eb" : "none", padding: isMobile ? "16px" : "24px 28px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 16 : 40 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>Bill to</div>
          <EditableText value={inv.to_name} field="to_name" onFieldChange={onFieldChange} style={{ fontSize: 15, color: "#1a1a2e" }} placeholder="Customer name" />
          {c.showCustomerEmail && <EditableText value={inv.to_email} field="to_email" onFieldChange={onFieldChange} style={{ fontSize: 14, color: "#444", marginTop: 4 }} placeholder="Customer email" fallback="" />}
          {c.showCustomerAddress && <EditableArea value={inv.to_address} field="to_address" onFieldChange={onFieldChange} style={{ fontSize: 14, color: "#444", marginTop: 4 }} placeholder="Customer address" fallback="" />}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>Invoice details</div>
          {c.showInvoiceNo && (
            <div style={{ display: "flex", gap: 8, fontSize: 14, color: "#1a1a2e", marginBottom: 3, alignItems: "center" }}>
              <span style={{ minWidth: isMobile ? 90 : 100, fontWeight: 600 }}>Invoice no.:</span>
              <EditableText value={inv.invoice_number} field="invoice_number" onFieldChange={onFieldChange} style={{ fontSize: 14, color: "#1a1a2e", flex: 1 }} placeholder="INV-0001" />
            </div>
          )}
          {c.showTerms && (
            <div style={{ display: "flex", gap: 8, fontSize: 14, color: "#1a1a2e", marginBottom: 3, alignItems: "center" }}>
              <span style={{ minWidth: isMobile ? 90 : 100, fontWeight: 600 }}>Terms:</span>
              <EditableText value={inv.terms} field="terms" onFieldChange={onFieldChange} style={{ fontSize: 14, color: "#1a1a2e", flex: 1 }} placeholder="Net 30" fallback="Net 30" />
            </div>
          )}
          {c.showInvoiceDate && (
            <div style={{ display: "flex", gap: 8, fontSize: 14, color: "#1a1a2e", marginBottom: 3, alignItems: "center" }}>
              <span style={{ minWidth: isMobile ? 90 : 100, fontWeight: 600 }}>Invoice date:</span>
              <EditableDate value={inv.date} field="date" onFieldChange={onFieldChange} style={{ fontSize: 14, color: "#1a1a2e" }} />
            </div>
          )}
          {c.showDueDate && (
            <div style={{ display: "flex", gap: 8, fontSize: 14, color: "#1a1a2e", marginBottom: 3, alignItems: "center" }}>
              <span style={{ minWidth: isMobile ? 90 : 100, fontWeight: 600 }}>Due date:</span>
              <EditableDate value={inv.due_date} field="due_date" onFieldChange={onFieldChange} style={{ fontSize: 14, color: "#1a1a2e" }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ overflowX: isMobile ? "auto" : "visible", marginTop: 24 }}>
        <table style={{ width: "100%", minWidth: isMobile ? 480 : "auto", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ borderBottom: "2px solid #1a1a2e" }}>
            <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, color: "#1a1a2e" }}>#</th>
            <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, color: "#1a1a2e" }}>Description</th>
            <th style={{ textAlign: "right", padding: "12px 8px", fontSize: 13, color: "#1a1a2e" }}>Qty</th>
            <th style={{ textAlign: "right", padding: "12px 8px", fontSize: 13, color: "#1a1a2e" }}>Rate</th>
            <th style={{ textAlign: "right", padding: "12px 8px", fontSize: 13, color: "#1a1a2e" }}>Amount</th>
          </tr></thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 13 }}>No line items</td></tr>
            ) : lineItems.map((item, i) => {
              const qty = Number(item.quantity ?? item.qty ?? 1);
              const price = Number(item.price ?? item.rate ?? 0);
              return (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px 8px", fontSize: 13, color: "#1a1a2e" }}>{i + 1}.</td>
                  <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{item.description || item.service || "-"}</td>
                  <td style={{ padding: "12px 8px", fontSize: 13, color: "#1a1a2e", textAlign: "right" }}>{qty}</td>
                  <td style={{ padding: "12px 8px", fontSize: 13, color: "#1a1a2e", textAlign: "right" }}>${price.toFixed(2)}</td>
                  <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600, color: "#1a1a2e", textAlign: "right" }}>${(qty * price).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <div style={{ width: isMobile ? "100%" : 280 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #ddd" }}>
            <span style={{ fontSize: 14, color: "#444" }}>Total</span>
            <span style={{ fontSize: 14, color: "#1a1a2e", fontWeight: 600 }}>${totalAmt.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
            <span style={{ fontSize: 14, color: "#1a1a2e", fontWeight: 700 }}>Balance due</span>
            <span style={{ fontSize: 14, color: paid ? (accentColor || "#52b788") : "#1a1a2e", fontWeight: 700 }}>{paid ? "$0.00" : "$" + totalAmt.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
