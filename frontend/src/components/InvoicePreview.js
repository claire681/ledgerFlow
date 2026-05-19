import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import CustomerCombobox from "./customers/CustomerCombobox";
import { LogoUploadModal } from "./LogoUploadModal";

const useIsMobile = () => {
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [localLogoOverride, setLocalLogoOverride] = useState(null);
  const handleLogoUpload = (base64) => {
    setLocalLogoOverride(base64);
    try {
      const profile = JSON.parse(localStorage.getItem("novala_company_profile_v1") || "{}");
      profile.logo = base64;
      localStorage.setItem("novala_company_profile_v1", JSON.stringify(profile));
    } catch (e) {}
    if (typeof inv === "object" && inv) inv.logo_url = base64;
  };
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

const inputBase = (s) => ({ ...s, background: "#fff", border: "1px solid #e2e8f0", padding: "8px 12px", fontFamily: "inherit", outline: "none", borderRadius: 6, width: "100%", boxSizing: "border-box" });
const onFocusBg = (e) => { e.target.style.borderColor = "#0F5959"; e.target.style.boxShadow = "0 0 0 3px rgba(15,89,89,0.12)"; };
const onBlurBg = (e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; };

const EditableText = ({ value, field, onFieldChange, style, placeholder, fallback }) => {
  if (!onFieldChange) return <div style={style}>{value || (fallback !== undefined ? fallback : "-")}</div>;
  return <input type="text" value={value || ""} onChange={e => onFieldChange(field, e.target.value)} placeholder={placeholder} style={inputBase(style)} onFocus={onFocusBg} onBlur={onBlurBg} />;
};

const EditableDate = ({ value, field, onFieldChange, style }) => {
  const d = value ? String(value).slice(0, 10) : "";
  if (!onFieldChange) return <span style={style}>{d || "-"}</span>;
  return <input type="date" value={d} onChange={e => onFieldChange(field, e.target.value)} style={inputBase(style)} onFocus={onFocusBg} onBlur={onBlurBg} />;
};

const FormRow = ({ label, isMobile, children }) => (
  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 4 : 12, alignItems: isMobile ? "stretch" : "center", marginBottom: 12 }}>
    <div style={{ width: isMobile ? "100%" : 110, fontSize: 13, fontWeight: 500, color: "#475569", flexShrink: 0 }}>{label}</div>
    <div style={{ flex: 1, minWidth: 0, maxWidth: isMobile ? "100%" : 220 }}>{children}</div>
  </div>
);

const SkeletonBar = ({ width }) => <div style={{ width, height: 12, background: "#e2e8f0", borderRadius: 4, marginBottom: 8 }} />;

const TableInput = ({ value, onChange, type, placeholder, align }) => (
  <input type={type || "text"} value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", border: "1px solid transparent", borderRadius: 4, padding: "6px 8px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "transparent", textAlign: align || "left", boxSizing: "border-box", fontVariantNumeric: type === "number" ? "lining-nums tabular-nums" : "normal" }} onFocus={e => { e.target.style.borderColor = "#0F5959"; e.target.style.background = "#fff"; }} onBlur={e => { e.target.style.borderColor = "transparent"; e.target.style.background = "transparent"; }} />
);

export default function InvoicePreview({ inv, customization, accentColor, template, onFieldChange, onCustomerSelect, onItemChange, onAddItem, onDeleteItem, onClearItems, onEditCompany }) {
  const isMobile = useIsMobile();
  const c = { ...DEFAULTS, ...(customization || {}) };
  const items = inv.line_items || inv.items || [];
  const subtotal = items.reduce((s, it) => s + (Number(it.qty ?? it.quantity ?? 1) * Number(it.rate ?? it.price ?? 0)), 0);
  const totalAmt = subtotal + Number(inv.tax_amount || 0);
  const hasCustomer = !!(inv.to_name || inv.to_email);
  const numStyle = { fontVariantNumeric: "lining-nums tabular-nums" };
  const editable = !!onItemChange;

  return (
    <div id="novala-invoice-canvas" style={{ background: "#fff", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif" }}>
      <style>{"@media print { body * { visibility: hidden; } #novala-invoice-canvas, #novala-invoice-canvas * { visibility: visible; } #novala-invoice-canvas { position: absolute; left: 0; top: 0; width: 100%; background: white !important; box-shadow: none !important; } button { display: none !important; } input, select, textarea { border: none !important; box-shadow: none !important; background: transparent !important; padding: 0 !important; -webkit-appearance: none !important; appearance: none !important; color: black !important; } @page { margin: 0.5in; } }"}</style>

      <div style={{ padding: isMobile ? "24px 16px" : "40px 32px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: isMobile ? 20 : 32 }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 26 : 32, fontWeight: 600, color: "#0F172A", margin: 0, marginBottom: 24, letterSpacing: "0.01em" }}>INVOICE</h1>
          {inv.from_name && <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{inv.from_name}</div>}
          {inv.from_address && <div style={{ fontSize: 13, color: "#475569", whiteSpace: "pre-line", lineHeight: 1.5 }}>{inv.from_address}</div>}
          <a href="#" onClick={(e) => { e.preventDefault(); onEditCompany && onEditCompany(); }} style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", marginTop: 10, display: "inline-block", cursor: "pointer" }}>Edit company</a>
        </div>
        <div style={{ paddingTop: isMobile ? 0 : 56 }}>
          {inv.from_email && <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>{inv.from_email}</div>}
          {inv.from_phone && <div style={{ fontSize: 13, color: "#475569" }}>{inv.from_phone}</div>}
        </div>
        <div style={{ textAlign: isMobile ? "left" : "right" }}>
          <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12, ...numStyle }}>Balance due (hidden): <span style={{ color: accentColor || "#0F172A", fontWeight: 600 }}>${totalAmt.toFixed(2)}</span></div>
          {(localLogoOverride || inv.logo_url) ? (
            <img src={localLogoOverride || inv.logo_url} alt="Logo" style={{ maxHeight: 80, width: "auto", display: "inline-block" }} onError={e => { e.target.style.display = "none"; }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 8, background: "#f1f5f9", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 11 }}>Logo</div>
          )}
          <div style={{ marginTop: 8 }}>
  <button
    type="button"
    onClick={() => setLogoModalOpen(true)}
    style={{
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "#f1f5f9",
      border: "none",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background 0.15s ease"
    }}
    onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"}
    onMouseOut={(e) => e.currentTarget.style.background = "#f1f5f9"}
    title="Change logo"
  >
    <Edit2 size={14} color="#64748B" />
  </button>
</div>

<LogoUploadModal
  isOpen={logoModalOpen}
  onClose={() => setLogoModalOpen(false)}
  onUpload={handleLogoUpload}
/>
        </div>
      </div>

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
              <><SkeletonBar width={192} /><SkeletonBar width={160} /><SkeletonBar width={128} /></>
            )}
          </div>
          <div>
            {c.showInvoiceNo && (<FormRow label="Invoice no." isMobile={isMobile}><EditableText value={inv.invoice_number} field="invoice_number" onFieldChange={onFieldChange} style={{ fontSize: 13, color: "#0F172A" }} placeholder="1009" /></FormRow>)}
            {c.showTerms && (<FormRow label="Terms" isMobile={isMobile}><EditableText value={inv.terms} field="terms" onFieldChange={onFieldChange} style={{ fontSize: 13, color: "#0F172A" }} placeholder="Net 30" fallback="Net 30" /></FormRow>)}
            {c.showInvoiceDate && (<FormRow label="Invoice date" isMobile={isMobile}><EditableDate value={inv.date} field="date" onFieldChange={onFieldChange} style={{ fontSize: 13, color: "#0F172A" }} /></FormRow>)}
            {c.showDueDate && (<FormRow label="Due date" isMobile={isMobile}><EditableDate value={inv.due_date} field="due_date" onFieldChange={onFieldChange} style={{ fontSize: 13, color: "#0F172A" }} /></FormRow>)}
          </div>
        </div>
      </div>

      <div style={{ padding: isMobile ? "24px 16px" : "32px", background: "#fff" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", margin: 0, marginBottom: 16 }}>Product or service</h2>
        <div style={{ overflowX: isMobile ? "auto" : "visible", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <table style={{ width: "100%", minWidth: isMobile ? 540 : "auto", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", width: 32 }}>#</th>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product/service</th>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", width: 80 }}>Qty</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", width: 100 }}>Rate</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", width: 100 }}>Amount</th>
              {editable && <th style={{ width: 40 }}></th>}
            </tr></thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={editable ? 7 : 6} style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 13 }}>No line items yet. Click below to add one.</td></tr>
              ) : items.map((item, i) => {
                const qty = Number(item.qty ?? item.quantity ?? 1);
                const rate = Number(item.rate ?? item.price ?? 0);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: "#0F172A", verticalAlign: "middle", ...numStyle }}>{i + 1}</td>
                    <td style={{ padding: 4, verticalAlign: "middle" }}>{editable ? <TableInput value={item.name || ""} onChange={e => onItemChange(i, "name", e.target.value)} placeholder="Pick or type" /> : <span style={{ padding: "6px 8px", fontSize: 13 }}>{item.name || "-"}</span>}</td>
                    <td style={{ padding: 4, verticalAlign: "middle" }}>{editable ? <TableInput value={item.description || ""} onChange={e => onItemChange(i, "description", e.target.value)} placeholder="Enter description" /> : <span style={{ padding: "6px 8px", fontSize: 13 }}>{item.description || "-"}</span>}</td>
                    <td style={{ padding: 4, verticalAlign: "middle" }}>{editable ? <TableInput type="number" value={qty} onChange={e => onItemChange(i, "qty", e.target.value)} align="right" /> : <span style={{ padding: "6px 8px", fontSize: 13, ...numStyle }}>{qty}</span>}</td>
                    <td style={{ padding: 4, verticalAlign: "middle" }}>{editable ? <TableInput type="number" value={rate} onChange={e => onItemChange(i, "rate", e.target.value)} align="right" /> : <span style={{ padding: "6px 8px", fontSize: 13, ...numStyle }}>${rate.toFixed(2)}</span>}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#0F172A", textAlign: "right", verticalAlign: "middle", ...numStyle }}>${(qty * rate).toFixed(2)}</td>
                    {editable && <td style={{ padding: "8px 4px", textAlign: "center", verticalAlign: "middle" }}><button onClick={() => onDeleteItem(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", borderRadius: 4 }}><Trash2 size={14} color="#94a3b8" /></button></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {editable && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={onAddItem} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#047857", border: "1px solid #047857", borderRadius: 6, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}><Plus size={14} /> Add product or service</button>
            {items.length > 0 && (<button onClick={() => { if (window.confirm("Clear all line items? This cannot be undone.")) onClearItems(); }} style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>Clear all lines</button>)}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <div style={{ width: isMobile ? "100%" : 280 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 13, color: "#64748B" }}>Subtotal</span>
              <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 500, ...numStyle }}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
              <span style={{ fontSize: 14, color: "#0F172A", fontWeight: 600 }}>Invoice total</span>
              <span style={{ fontSize: 14, color: "#0F172A", fontWeight: 700, ...numStyle }}>${totalAmt.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#475569", marginBottom: 6 }}>Note to customer</label>
          {onFieldChange ? (
            <textarea value={inv.note || ""} onChange={e => onFieldChange("note", e.target.value)} rows={3} placeholder="Thank you for your business." style={{ width: "100%", maxWidth: 600, padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} onFocus={onFocusBg} onBlur={onBlurBg} />
          ) : (<div style={{ fontSize: 13, color: "#475569", whiteSpace: "pre-line" }}>{inv.note || ""}</div>)}
        </div>

        <div style={{ marginTop: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#475569", marginBottom: 6 }}>Memo on statement (hidden)</label>
          {onFieldChange ? (
            <textarea value={inv.memo || ""} onChange={e => onFieldChange("memo", e.target.value)} rows={2} placeholder="This memo will not show on the invoice, but will appear on the statement." style={{ width: "100%", maxWidth: 600, padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} onFocus={onFocusBg} onBlur={onBlurBg} />
          ) : (<div style={{ fontSize: 13, color: "#475569" }}>{inv.memo || ""}</div>)}
        </div>

        <div style={{ marginTop: 32, borderTop: "1px solid #e2e8f0", paddingTop: 18, textAlign: "center" }}>
          <button onClick={() => window.print()} style={{ background: "none", border: "none", color: "#475569", fontSize: 14, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>Print or download</button>
        </div>
      </div>
    </div>
  );
}
