import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, ChevronDown, X, Upload } from "lucide-react";
import CustomerCombobox from "./customers/CustomerCombobox";
import { LogoUploadModal } from "./LogoUploadModal";
import { ProductServiceCombobox } from "./products/ProductServiceCombobox";

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

const inputBase = (s) => ({ ...s, background: "#fff", border: "1px solid #e2e8f0", padding: "8px 12px", fontFamily: "inherit", outline: "none", borderRadius: 6, width: "100%", boxSizing: "border-box" });
const onFocusBg = (e) => { e.target.style.borderColor = "#0F5959"; e.target.style.boxShadow = "0 0 0 3px rgba(15,89,89,0.12)"; };
const onBlurBg = (e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; };

const formatDate = (iso) => {
  if (!iso) return "";
  const s = String(iso).slice(0, 10);
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  return parts[2] + "/" + parts[1] + "/" + parts[0];
};

const EditableText = ({ value, field, onFieldChange, style, placeholder, fallback }) => {
  if (!onFieldChange) return <div style={style}>{value || (fallback !== undefined ? fallback : "-")}</div>;
  return <input type="text" value={value || ""} onChange={e => onFieldChange(field, e.target.value)} placeholder={placeholder} style={inputBase(style)} onFocus={onFocusBg} onBlur={onBlurBg} />;
};

const EditableDate = ({ value, field, onFieldChange, style }) => {
  const d = value ? String(value).slice(0, 10) : "";
  if (!onFieldChange) return <span style={style}>{formatDate(d) || "-"}</span>;
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

export default function InvoicePreview({ inv, customization, accentColor, template, onFieldChange, onCustomerSelect, onItemChange, onAddItem, onDeleteItem, onClearItems, onEditCompany , onEditCustomer }) {
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [localLogoOverride, setLocalLogoOverride] = useState(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [discount, setDiscount] = useState({ value: 0, type: "percent" });
  const [deposit, setDeposit] = useState(0);
  const [attachments, setAttachments] = useState([]);
  const displayedLogoUrl = logoRemoved ? null : (localLogoOverride || inv.logo_url);
  const handleLogoUpload = (base64) => {
    setLocalLogoOverride(base64);
    setLogoRemoved(false);
    if (typeof onFieldChange === "function") onFieldChange("logo_url", base64);
    try {
      const profile = JSON.parse(localStorage.getItem("novala_company_profile_v1") || "{}");
      profile.logo = base64;
      localStorage.setItem("novala_company_profile_v1", JSON.stringify(profile));
    } catch (e) {}
  };
  const handleLogoRemove = () => {
    setLocalLogoOverride(null);
    setLogoRemoved(true);
    if (typeof onFieldChange === "function") {
      onFieldChange("logo_url", null);
    }
    try {
      const profile = JSON.parse(
        localStorage.getItem("novala_company_profile_v1") || "{}"
      );
      profile.logo = null;
      localStorage.setItem(
        "novala_company_profile_v1",
        JSON.stringify(profile)
      );
    } catch (e) {}
  };
  useEffect(() => {
    if (!inv || inv.logo_url) return;
    try {
      const profile = JSON.parse(
        localStorage.getItem("novala_company_profile_v1") || "{}"
      );
      if (profile.logo) {
        setLocalLogoOverride(profile.logo);
      }
    } catch (e) {}
  }, []);

  const isMobile = useIsMobile();
  const c = { ...DEFAULTS, ...(customization || {}) };
  const items = inv.line_items || inv.items || [];
  const subtotal = items.reduce((s, it) => s + (Number(it.qty ?? it.quantity ?? 1) * Number(it.rate ?? it.price ?? 0)), 0);
  const totalAmt = subtotal + Number(inv.tax_amount || 0);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const hasCustomer = !!(inv.to_name || inv.to_email);
  const numStyle = { fontVariantNumeric: "lining-nums tabular-nums" };
  const editable = !!onItemChange;

  return (
    <div id="novala-invoice-canvas" style={{ background: "#fff", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif" }}>
      <style>{"@media print { body * { visibility: hidden; } #novala-invoice-canvas, #novala-invoice-canvas * { visibility: visible; } #novala-invoice-canvas { position: absolute; left: 0; top: 0; width: 100%; background: white !important; box-shadow: none !important; } button { display: none !important; } input, select, textarea { border: none !important; box-shadow: none !important; background: transparent !important; padding: 0 !important; -webkit-appearance: none !important; appearance: none !important; color: black !important; } @page { margin: 0.5in; } }"}</style>

      <div style={{ padding: isMobile ? "24px 16px" : "40px 32px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: isMobile ? 20 : 32 }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 26 : 32, fontWeight: 600, color: "#0F172A", margin: 0, marginBottom: 24, letterSpacing: "0.01em" }}>INVOICE</h1>
          {inv.from_name && <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{inv.from_name}</div>}
        {inv.from_bn && <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>BN: {inv.from_bn}</div>}
        {inv.from_address && <div style={{ fontSize: 13, color: "#475569", whiteSpace: "pre-line", lineHeight: 1.5 }}>{inv.from_address}</div>}
          <a href="#" onClick={(e) => { e.preventDefault(); onEditCompany && onEditCompany(); }} style={{ fontSize: 15, color: "#2563eb", textDecoration: "none", marginTop: 10, display: "inline-block", cursor: "pointer", fontWeight: 500 }}>Edit company</a>
        </div>
        <div style={{ paddingTop: isMobile ? 0 : 56 }}>
          {inv.from_email && <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>{inv.from_email}</div>}
          {inv.from_phone && <div style={{ fontSize: 13, color: "#475569" }}>{inv.from_phone}</div>}
        </div>
        <div style={{ textAlign: isMobile ? "left" : "right" }}>
          <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12, ...numStyle }}>Balance due (hidden): <span style={{ color: accentColor || "#0F172A", fontWeight: 600 }}>${totalAmt.toFixed(2)}</span></div>
          {displayedLogoUrl ? (
            <img src={displayedLogoUrl} alt="Logo" style={{ maxHeight: 80, width: "auto", display: "inline-block" }} onError={e => { e.target.style.display = "none"; }} />
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
        currentLogo={displayedLogoUrl}
        onRemove={handleLogoRemove}
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
                {c.showCustomerEmail && (editable ? <input type="email" value={inv.to_email || ""} onChange={(e) => onFieldChange && onFieldChange("to_email", e.target.value)} placeholder="Enter Customer email" style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, color: "#0F172A", marginBottom: 12, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} onFocus={onFocusBg} onBlur={onBlurBg} /> : (inv.to_email && <div style={{ fontSize: 13, color: "#0F172A", marginBottom: 12, padding: "8px 12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6 }}>{inv.to_email}</div>))}
                {editable && (
                  <div style={{ position: "relative", marginBottom: 12 }}>
                    <button type="button" onClick={() => setShowCcBcc(true)} style={{ background: "none", border: "none", padding: 0, color: "#2563eb", fontSize: 13, cursor: "pointer", textDecoration: "none", fontWeight: 500 }}>Cc/Bcc</button>
                    {showCcBcc && (
                      <div style={{ position: "absolute", top: 28, left: 0, width: 320, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 20, zIndex: 50 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0F172A" }}>Add Cc/Bcc</h3>
                          <button type="button" onClick={() => setShowCcBcc(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={18} color="#64748B" /></button>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: "block", fontSize: 13, color: "#0F172A", marginBottom: 4 }}>Cc</label>
                          <input type="text" value={inv.to_cc || ""} onChange={(e) => onFieldChange && onFieldChange("to_cc", e.target.value)} placeholder="Separate emails with commas" style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, boxSizing: "border-box", fontFamily: "inherit", outline: "none" }} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ display: "block", fontSize: 13, color: "#0F172A", marginBottom: 4 }}>Bcc</label>
                          <input type="text" value={inv.to_bcc || ""} onChange={(e) => onFieldChange && onFieldChange("to_bcc", e.target.value)} placeholder="Separate emails with commas" style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, boxSizing: "border-box", fontFamily: "inherit", outline: "none" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button type="button" onClick={() => setShowCcBcc(false)} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#0F172A", cursor: "pointer" }}>Cancel</button>
                          <button type="button" onClick={() => setShowCcBcc(false)} style={{ padding: "8px 16px", background: "#22c55e", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Save</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, background: "#fff", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em", marginBottom: 8 }}>Bill to</div>
                  {inv.to_name && <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{inv.to_name}</div>}
                  {c.showCustomerAddress && inv.to_address && <div style={{ fontSize: 13, color: "#475569", whiteSpace: "pre-line", lineHeight: 1.5 }}>{inv.to_address}</div>}
                </div>
                {editable && (<a href="#" onClick={(e) => { e.preventDefault(); onEditCustomer && onEditCustomer(); }} style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Edit Customer</a>)}
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
              {editable && <th style={{ width: 28, padding: "10px 4px" }}></th>}
            <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em", width: 32 }}>#</th>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em" }}>Product/service</th>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em" }}>Description</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em", width: 80 }}>Qty</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em", width: 100 }}>Rate</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em", width: 100 }}>Amount</th>
              {editable && <th style={{ width: 40 }}></th>}
            </tr></thead>
            <tbody>
              {items.length === 0 ? (
                null
              ) : items.map((item, i) => {
                const qty = Number(item.qty ?? item.quantity ?? 1);
                const rate = Number(item.rate ?? item.price ?? 0);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: "#0F172A", verticalAlign: "middle", ...numStyle }}>{i + 1}</td>
                    <td style={{ padding: 4, verticalAlign: "middle" }}>{editable ? <ProductServiceCombobox value={item.name || ""} onChange={e => onItemChange(i, "name", e.target.value)} onSelect={(p) => { onItemChange(i, "name", p.name); if (p.description) onItemChange(i, "description", p.description); if (p.price_rate !== undefined && p.price_rate !== "") onItemChange(i, "rate", p.price_rate); }} onAddNew={() => alert("Full Add New Service modal coming in next patch. For now, type the name and rate directly in the row.")} /> : <span style={{ padding: "6px 8px", fontSize: 13 }}>{item.name || "-"}</span>}</td>
                    <td style={{ padding: 4, verticalAlign: "middle" }}>{editable ? <TableInput value={item.description || ""} onChange={e => onItemChange(i, "description", e.target.value)} placeholder="" /> : <span style={{ padding: "6px 8px", fontSize: 13 }}>{item.description || "-"}</span>}</td>
                    <td style={{ padding: 4, verticalAlign: "middle" }}>{editable ? <TableInput type="number" value={item.qty ?? ""} onChange={e => onItemChange(i, "qty", e.target.value)} align="right" /> : <span style={{ padding: "6px 8px", fontSize: 13, ...numStyle }}>{qty > 0 ? qty : ""}</span>}</td>
                    <td style={{ padding: 4, verticalAlign: "middle" }}>{editable ? <TableInput type="number" value={item.rate ?? ""} onChange={e => onItemChange(i, "rate", e.target.value)} align="right" /> : <span style={{ padding: "6px 8px", fontSize: 13, ...numStyle }}>{rate > 0 ? "$" + rate.toFixed(2) : ""}</span>}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#0F172A", textAlign: "right", verticalAlign: "middle", ...numStyle }}>{(qty * rate) > 0 ? "$" + (qty * rate).toFixed(2) : ""}</td>
                    {editable && <td style={{ padding: "8px 4px", textAlign: "center", verticalAlign: "middle" }}><button onClick={() => onDeleteItem(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", borderRadius: 4 }}><Trash2 size={14} color="#94a3b8" /></button></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {editable && (
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => setAddDropdownOpen(!addDropdownOpen)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, color: "#0F172A", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            Add product or service
            <span style={{ fontSize: 10, color: "#64748B" }}>v</span>
          </button>
          {addDropdownOpen && (<>
            <div onClick={() => setAddDropdownOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 20, minWidth: 220, overflow: "hidden" }}>
              <button onClick={() => { onAddItem(); setAddDropdownOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "#fff", border: "none", fontSize: 14, color: "#0F172A", cursor: "pointer", fontFamily: "inherit" }}>Add product or service</button>
              <button onClick={() => { alert("Add subtotal: coming soon"); setAddDropdownOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "#fff", border: "none", fontSize: 14, color: "#0F172A", cursor: "pointer", fontFamily: "inherit" }}>Add subtotal</button>
              <button onClick={() => { alert("Add text: coming soon"); setAddDropdownOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "#fff", border: "none", fontSize: 14, color: "#0F172A", cursor: "pointer", fontFamily: "inherit" }}>Add text</button>
            </div>
          </>)}
        </div>
        {items.length > 0 && (
          <button onClick={() => { if (window.confirm("Clear all line items? This cannot be undone.")) onClearItems(); }} style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, color: "#0F172A", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Clear all lines</button>
        )}
      </div>
    )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <div style={{ width: isMobile ? "100%" : 280 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 13, color: "#64748B" }}>Subtotal</span>
              <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 500, ...numStyle }}>${subtotal.toFixed(2)}</span>
            </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 13, color: "#64748B" }}>Discount</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" value={discount.value} onChange={e => setDiscount({ ...discount, value: e.target.value })} style={{ width: 56, padding: "4px 6px", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 13, textAlign: "right", fontFamily: "inherit", outline: "none" }} />
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 2 }}>
              <button onClick={() => setDiscount({ ...discount, type: "percent" })} style={{ padding: "2px 8px", borderRadius: 10, border: "none", background: discount.type === "percent" ? "#fff" : "transparent", fontSize: 11, fontWeight: 600, color: discount.type === "percent" ? "#0F172A" : "#64748B", cursor: "pointer", fontFamily: "inherit", boxShadow: discount.type === "percent" ? "0 1px 2px rgba(0,0,0,0.08)" : "none" }}>%</button>
              <button onClick={() => setDiscount({ ...discount, type: "amount" })} style={{ padding: "2px 8px", borderRadius: 10, border: "none", background: discount.type === "amount" ? "#fff" : "transparent", fontSize: 11, fontWeight: 600, color: discount.type === "amount" ? "#0F172A" : "#64748B", cursor: "pointer", fontFamily: "inherit", boxShadow: discount.type === "amount" ? "0 1px 2px rgba(0,0,0,0.08)" : "none" }}>$</button>
            </div>
            <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 500, minWidth: 60, textAlign: "right", ...numStyle }}>${(discount.type === "percent" ? subtotal * (Number(discount.value) || 0) / 100 : Number(discount.value) || 0).toFixed(2)}</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "2px solid #0F172A", borderBottom: "1px solid #e2e8f0", marginTop: 4 }}>
          <span style={{ fontSize: 14, color: "#0F172A", fontWeight: 700 }}>Invoice total</span>
          <span style={{ fontSize: 14, color: "#0F172A", fontWeight: 700, ...numStyle }}>${(subtotal - (discount.type === "percent" ? subtotal * (Number(discount.value) || 0) / 100 : Number(discount.value) || 0)).toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 13, color: "#64748B" }}>Deposit</span>
          <input type="number" value={deposit} onChange={e => setDeposit(e.target.value)} style={{ width: 100, padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 13, textAlign: "right", fontFamily: "inherit", outline: "none" }} />
        </div>
        <div style={{ textAlign: "right", marginTop: 8 }}>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13, color: "#22c55e", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Edit totals</a>
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
            <textarea value={inv.memo || ""} onChange={e => onFieldChange("memo", e.target.value)} rows={2} placeholder="This memo will not show up on your invoice, but will appear on the statement." style={{ width: "100%", maxWidth: 600, padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} onFocus={onFocusBg} onBlur={onBlurBg} />
          ) : (<div style={{ fontSize: 13, color: "#475569" }}>{inv.memo || ""}</div>)}

      <div style={{ marginTop: 24 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>Attachments</label>
        <div style={{ border: "2px dashed #cbd5e1", borderRadius: 8, padding: "24px 16px", textAlign: "center", cursor: "pointer", maxWidth: 600, transition: "background 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }} onClick={() => document.getElementById("novala-attachment-input").click()}>
          <Upload size={24} color="#22c55e" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "#22c55e", marginBottom: 4 }}>Add attachment</div>
          <div style={{ fontSize: 12, color: "#64748B" }}>Max file size: 20 MB</div>
          <input id="novala-attachment-input" type="file" multiple style={{ display: "none" }} onChange={(e) => {
            const files = Array.from(e.target.files || []).filter(f => f.size <= 20 * 1024 * 1024);
            setAttachments([...attachments, ...files]);
            e.target.value = "";
          }} />
        </div>
        {attachments.length > 0 && (
          <div style={{ marginTop: 12, maxWidth: 600 }}>
            {attachments.map((f, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 6, marginBottom: 6, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 13, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", borderRadius: 4 }}>
                  <X size={14} color="#94a3b8" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>

        <div style={{ marginTop: 32, borderTop: "1px solid #e2e8f0", paddingTop: 18, textAlign: "center" }}>
          <button onClick={() => window.print()} style={{ background: "none", border: "none", color: "#475569", fontSize: 14, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>Print or download</button>
        </div>
      </div>
    </div>
  );
}
