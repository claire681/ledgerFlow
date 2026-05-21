import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, ChevronDown, X, Upload } from "lucide-react";
import CustomerCombobox from "./customers/CustomerCombobox";
import { LogoUploadModal } from "./LogoUploadModal";
import { ProductServiceCombobox } from "./products/ProductServiceCombobox";
import { AddNewServiceModal } from "./products/AddNewServiceModal";

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
  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 4 : 8, alignItems: isMobile ? "stretch" : "center", marginBottom: 4 }}>
    <div style={{ width: isMobile ? "100%" : 90, fontSize: 13, fontWeight: 500, color: "#475569", flexShrink: 0 }}>{label}</div>
    <div style={{ flex: 1, minWidth: 0, maxWidth: isMobile ? "100%" : 120 }}>{children}</div>
  </div>
);

const SkeletonBar = ({ width }) => <div style={{ width, height: 12, background: "#e2e8f0", borderRadius: 4, marginBottom: 8 }} />;

const TableInput = ({ value, onChange, type, placeholder, align }) => (
  <input type={type || "text"} value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", border: "1px solid transparent", borderRadius: 4, padding: "6px 8px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "transparent", textAlign: align || "left", boxSizing: "border-box", fontVariantNumeric: type === "number" ? "lining-nums tabular-nums" : "normal" }} onFocus={e => { e.target.style.borderColor = "#0F5959"; e.target.style.background = "#fff"; }} onBlur={e => { e.target.style.borderColor = "transparent"; e.target.style.background = "transparent"; }} />
);

export default function InvoicePreview({ inv, customization, accentColor, template, onFieldChange, onCustomerSelect, onItemChange, onAddItem, onDeleteItem, onClearItems, onEditCompany , onEditCustomer , onEditTotals }) {
  const editable = !!onFieldChange;
  const hasRealPaymentNote = !!(inv && inv.paymentNote && String(inv.paymentNote).trim());
  const hasRealNote = !!(inv && inv.note && String(inv.note).trim());
  const hasRealMemo = !!(inv && inv.memo && String(inv.memo).trim());


  // Inject ghost-edit CSS once
  React.useEffect(() => {
    if (document.getElementById("ghost-edit-style")) return;
    const style = document.createElement("style");
    style.id = "ghost-edit-style";
    style.textContent = `
      .ghost-edit-section input,
      .ghost-edit-section select,
      .ghost-edit-section textarea {
        border-color: transparent !important;
        background-color: transparent !important;
        transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
      }
      .ghost-edit-section:hover input,
      .ghost-edit-section:hover select,
      .ghost-edit-section:hover textarea,
      .ghost-edit-active input,
      .ghost-edit-active select,
      .ghost-edit-active textarea,
      .ghost-edit-section input:focus,
      .ghost-edit-section select:focus,
      .ghost-edit-section textarea:focus {
        border-color: #cbd5e1 !important;
        background-color: #fff !important;
      }
      .ghost-edit-section input:focus,
      .ghost-edit-section select:focus,
      .ghost-edit-section textarea:focus {
        border-color: #0F5959 !important;
        box-shadow: 0 0 0 1px #0F5959 !important;
        outline: none !important;
      }
      .ghost-edit-section .qb-combo-btn,
      .ghost-edit-section .qb-combo-chevron {
        border-color: transparent !important;
        background-color: transparent !important;
        transition: border-color 0.15s ease, background-color 0.15s ease, opacity 0.15s ease;
      }
      .ghost-edit-section .qb-combo-chevron {
        opacity: 0;
      }
      .ghost-edit-section:hover .qb-combo-btn,
      .ghost-edit-active .qb-combo-btn,
      .ghost-edit-section .qb-combo-btn:focus {
        border-color: #cbd5e1 !important;
        background-color: #fff !important;
      }
      .ghost-edit-section:hover .qb-combo-chevron,
      .ghost-edit-active .qb-combo-chevron {
        opacity: 1;
      }
      @media print {
        .print-hide { display: none !important; }
        .ghost-edit-section input,
        .ghost-edit-section select,
        .ghost-edit-section textarea {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          padding: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const [detailsEditing, setDetailsEditing] = React.useState(false);
  const detailsRef = React.useRef(null);
  React.useEffect(() => {
    const onDown = (e) => {
      if (detailsRef.current && !detailsRef.current.contains(e.target)) {
        setDetailsEditing(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  React.useEffect(() => {
    if (document.getElementById("spinner-hide-style")) return;
    const style = document.createElement("style");
    style.id = "spinner-hide-style";
    style.textContent = 'input[type="number"]::-webkit-outer-spin-button,input[type="number"]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}input[type="number"]{-moz-appearance:textfield}';
    document.head.appendChild(style);
  }, []);

  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [localLogoOverride, setLocalLogoOverride] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [rowMenuOpen, setRowMenuOpen] = useState(null);
  const addLineOfType = (type) => {
    if (typeof onAddItem === "function") onAddItem();
    setTimeout(() => {
      const newIdx = items.length;
      onItemChange(newIdx, "type", type);
    }, 0);
  };

  const computeRunningSubtotal = (uptoIdx) => {
    let sum = 0;
    for (let k = uptoIdx - 1; k >= 0; k--) {
      const it = items[k] || {};
      if (it.type === "subtotal") break;
      if (it.type === "text") continue;
      const q = Number(it.qty ?? it.quantity ?? 0);
      const r = Number(it.rate ?? it.price ?? 0);
      sum += q * r;
    }
    return sum;
  };

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
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [activeRowIdx, setActiveRowIdx] = useState(null);
  const hasCustomer = !!(inv.to_name || inv.to_email);
  const numStyle = { fontVariantNumeric: "lining-nums tabular-nums" };
  const itemsEditable = !!onItemChange;

  return (
    <div id="novala-invoice-canvas" style={{ background: "#fff", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif" }}>
      <AddNewServiceModal isOpen={showAddProductModal} onClose={() => { setShowAddProductModal(false); setActiveRowIdx(null); }} onSaved={(p, saveAndNew) => { if (activeRowIdx !== null) { onItemChange(activeRowIdx, "name", p.name); if (p.description) onItemChange(activeRowIdx, "description", p.description); if (p.price_rate !== undefined && p.price_rate !== "") onItemChange(activeRowIdx, "rate", p.price_rate); } if (!saveAndNew) setActiveRowIdx(null); }} />
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
          <div className="print-hide" style={{ fontSize: 13, color: "#64748B", marginBottom: 12, ...numStyle }}>Balance due (hidden): <span style={{ color: accentColor || "#0F172A", fontWeight: 600 }}>${totalAmt.toFixed(2)}</span></div>
          {displayedLogoUrl ? (
            <img src={displayedLogoUrl} alt="Logo" style={{ maxHeight: 80, width: "auto", display: "inline-block" }} onError={e => { e.target.style.display = "none"; }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 8, background: "#f1f5f9", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 11 }}>Logo</div>
          )}
          <div style={{ marginTop: 8 }}>
  <button
    type="button"
    className="print-hide"
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

      <div ref={detailsRef} onClick={() => editable && setDetailsEditing(true)} className={"ghost-edit-section " + (detailsEditing ? "ghost-edit-active" : "")} style={{ padding: isMobile ? "20px 16px" : "20px 32px 28px 32px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ marginBottom: 24 }}>
          <CustomerCombobox value={inv.to_name} onSelect={onCustomerSelect} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr", gap: isMobile ? 24 : 48, alignItems: "start" }}>
          <div>
            {hasCustomer ? (
              <>
                {c.showCustomerEmail && (itemsEditable ? <input type="email" value={inv.to_email || ""} onChange={(e) => onFieldChange && onFieldChange("to_email", e.target.value)} placeholder="Enter Customer email" style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, color: "#0F172A", marginBottom: 12, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} onFocus={onFocusBg} onBlur={onBlurBg} /> : (inv.to_email && <div style={{ fontSize: 13, color: "#0F172A", marginBottom: 12, padding: "8px 12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6 }}>{inv.to_email}</div>))}
                {itemsEditable && (
                  <div style={{ position: "relative", marginBottom: 12 }}>
                    <button className="print-hide" type="button" onClick={() => setShowCcBcc(true)} style={{ background: "none", border: "none", padding: 0, color: "#2563eb", fontSize: 13, cursor: "pointer", textDecoration: "none", fontWeight: 500 }}>Cc/Bcc</button>
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
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", background: "#fff", marginBottom: 8, maxWidth: 360 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em", marginBottom: 8 }}>Bill to</div>
                  {inv.to_name && <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{inv.to_name}</div>}
                  {c.showCustomerAddress && inv.to_address && (
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                  {String(inv.to_address).split(/[,\n]/).map((line, i) => {
                    const t = line.trim();
                    return t ? <div key={i}>{t}</div> : null;
                  })}
                </div>
              )}
                </div>
                {itemsEditable && (<a className="print-hide" href="#" onClick={(e) => { e.preventDefault(); onEditCustomer && onEditCustomer(); }} style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Edit Customer</a>)}
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
              {itemsEditable && <th style={{ width: 28, padding: "10px 4px" }}></th>}
 {itemsEditable && <th style={{ width: 20, padding: "10px 2px" }}></th>}
            <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em", width: 32 }}>#</th>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em" }}>Product/service</th>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em" }}>Description</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em", width: 110 }}>Qty</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em", width: 140 }}>Rate</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.02em", width: 160 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>Amount{itemsEditable && <button onClick={() => { if (window.confirm("Clear all amounts?")) { items.forEach((_, idx) => { onItemChange(idx, "qty", ""); onItemChange(idx, "rate", ""); }); } }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "inline-flex" }} title="Clear all amounts"><Trash2 size={13} color="#94a3b8" /></button>}</span></th>
              {itemsEditable && <th style={{ width: 40 }}></th>}
            </tr></thead>
            <tbody>
              {items.length === 0 ? (
                null
              ) : items.map((item, i) => {
    const qty = Number(item.qty ?? item.quantity ?? 1);
    const rate = Number(item.rate ?? item.price ?? 0);
    const hovered = hoveredRow === i;
    const rowType = item.type || "item";

    if (rowType === "subtotal") {
      const stAmount = computeRunningSubtotal(i);
      return (
        <tr key={i} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)} style={{ borderBottom: "1px solid #f1f5f9", position: "relative" }}>
          {itemsEditable && (<td style={{ width: 28, padding: "4px 2px", verticalAlign: "middle" }}></td>)}
          {itemsEditable && (<td style={{ width: 20, padding: "4px 2px", verticalAlign: "middle", textAlign: "center", color: hovered ? "#94a3b8" : "transparent", cursor: "grab", fontSize: 14, lineHeight: 1, userSelect: "none" }}>⠿</td>)}
          <td style={{ padding: "8px 12px", fontSize: 13, color: "#0F172A", verticalAlign: "middle" }}></td>
          <td colSpan={3} style={{ padding: 4, verticalAlign: "middle" }}>
            {itemsEditable ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="text" value={item.name || ""} placeholder="" onChange={e => onItemChange(i, "name", e.target.value)} style={{ flex: 1, padding: "8px 10px", border: "1px solid " + (hovered ? "#cbd5e1" : "#e2e8f0"), borderRadius: 4, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", boxSizing: "border-box" }} />
                <span style={{ fontSize: 13, color: "#64748B", fontStyle: "italic", whiteSpace: "nowrap" }}>Subtotal</span>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px" }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{item.name || ""}</span>
                <span style={{ fontSize: 13, fontStyle: "italic", color: "#64748B" }}>Subtotal</span>
              </div>
            )}
          </td>
          <td style={{ padding: 4, verticalAlign: "middle", textAlign: "right" }}>
            <div style={{ padding: "8px 10px", fontSize: 13, fontWeight: 700, color: "#0F172A", ...numStyle }}>{"$" + stAmount.toFixed(2)}</div>
          </td>
          {itemsEditable && (<td style={{ padding: "8px 4px", textAlign: "center", verticalAlign: "middle" }}><button onClick={() => onDeleteItem(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", borderRadius: 4, opacity: hovered ? 1 : 0, transition: "opacity 0.12s" }}><Trash2 size={14} color="#94a3b8" /></button></td>)}
        </tr>
      );
    }

    if (rowType === "text") {
      return (
        <tr key={i} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)} style={{ borderBottom: "1px solid #f1f5f9", position: "relative" }}>
          {itemsEditable && (<td style={{ width: 28, padding: "4px 2px", verticalAlign: "middle" }}></td>)}
          {itemsEditable && (<td style={{ width: 20, padding: "4px 2px", verticalAlign: "middle", textAlign: "center", color: hovered ? "#94a3b8" : "transparent", cursor: "grab", fontSize: 14, lineHeight: 1, userSelect: "none" }}>⠿</td>)}
          <td style={{ padding: "8px 12px", fontSize: 13, color: "#0F172A", verticalAlign: "middle" }}></td>
          <td colSpan={4} style={{ padding: 4, verticalAlign: "top" }}>
            {itemsEditable ? (
              <textarea value={item.description || ""} onChange={e => onItemChange(i, "description", e.target.value)} rows={1} placeholder="Add a note or instruction..." style={{ width: "100%", border: "1px solid " + (hovered ? "#cbd5e1" : "transparent"), borderRadius: 4, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", background: hovered ? "#fff" : "transparent", boxSizing: "border-box", resize: "none", overflow: "hidden", minHeight: 36, lineHeight: 1.5, fontStyle: "italic", color: "#475569" }} onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} />
            ) : (
              <span style={{ padding: "6px 8px", fontSize: 13, fontStyle: "italic", color: "#475569", whiteSpace: "pre-wrap" }}>{item.description || ""}</span>
            )}
          </td>
          {itemsEditable && (<td style={{ padding: "8px 4px", textAlign: "center", verticalAlign: "middle" }}><button onClick={() => onDeleteItem(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", borderRadius: 4, opacity: hovered ? 1 : 0, transition: "opacity 0.12s" }}><Trash2 size={14} color="#94a3b8" /></button></td>)}
        </tr>
      );
    }

    return (
      <tr key={i} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)} style={{ borderBottom: "1px solid #f1f5f9", position: "relative" }}>
        {itemsEditable && (<td style={{ width: 28, padding: "4px 2px", verticalAlign: "middle", textAlign: "center", position: "relative" }}><button onClick={(e) => { e.stopPropagation(); setRowMenuOpen(rowMenuOpen === i ? null : i); }} title="Add" style={{ background: hovered || rowMenuOpen === i ? "#0F9599" : "transparent", border: "1px solid " + (hovered || rowMenuOpen === i ? "#0F9599" : "transparent"), borderRadius: "50%", width: 22, height: 22, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", color: hovered || rowMenuOpen === i ? "#fff" : "#64748B", transition: "all 0.12s" }}><Plus size={12} /></button>{rowMenuOpen === i && (<><div onClick={() => setRowMenuOpen(null)} style={{ position: "fixed", inset: 0, zIndex: 40 }} /><div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 4px 14px rgba(0,0,0,0.12)", zIndex: 50, minWidth: 200, overflow: "hidden", textAlign: "left" }}><button onClick={() => { onAddItem && onAddItem(); setRowMenuOpen(null); }} style={{ display: "block", width: "100%", padding: "10px 14px", background: "#fff", border: "none", fontSize: 13, color: "#0F172A", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>Add product or service</button><button onClick={() => { addLineOfType("subtotal"); setRowMenuOpen(null); }} style={{ display: "block", width: "100%", padding: "10px 14px", background: "#fff", border: "none", fontSize: 13, color: "#0F172A", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>Add subtotal</button><button onClick={() => { const copy = { ...items[i] }; onAddItem && onAddItem(); setTimeout(() => { onItemChange(items.length, "name", copy.name || ""); onItemChange(items.length, "description", copy.description || ""); onItemChange(items.length, "qty", copy.qty || ""); onItemChange(items.length, "rate", copy.rate || ""); }, 0); setRowMenuOpen(null); }} style={{ display: "block", width: "100%", padding: "10px 14px", background: "#fff", border: "none", fontSize: 13, color: "#0F172A", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>Duplicate</button><button onClick={() => { addLineOfType("text"); setRowMenuOpen(null); }} style={{ display: "block", width: "100%", padding: "10px 14px", background: "#fff", border: "none", fontSize: 13, color: "#0F172A", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>Add text</button></div></>)}</td>)}
        {itemsEditable && (<td style={{ width: 20, padding: "4px 2px", verticalAlign: "middle", textAlign: "center", color: hovered ? "#94a3b8" : "transparent", cursor: "grab", fontSize: 14, lineHeight: 1, userSelect: "none" }}>⠿</td>)}
        <td style={{ padding: "8px 12px", fontSize: 13, color: "#0F172A", verticalAlign: "middle", ...numStyle }}>{i + 1}</td>
                    <td style={{ padding: 4, verticalAlign: "middle" }}>{itemsEditable ? <ProductServiceCombobox value={item.name || ""} onChange={e => onItemChange(i, "name", e.target.value)} onSelect={(p) => { onItemChange(i, "name", p.name); if (p.description) onItemChange(i, "description", p.description); if (p.price_rate !== undefined && p.price_rate !== "") onItemChange(i, "rate", p.price_rate); }} onAddNew={() => { setActiveRowIdx(i); setShowAddProductModal(true); }} /> : <span style={{ padding: "6px 8px", fontSize: 13 }}>{item.name || "-"}</span>}</td>
                    <td style={{ padding: 4, verticalAlign: "top" }}>{itemsEditable ? <textarea value={item.description || ""} onChange={e => onItemChange(i, "description", e.target.value)} rows={1} style={{ width: "100%", border: "1px solid " + (hovered ? "#cbd5e1" : "transparent"), borderRadius: 4, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", background: hovered ? "#fff" : "transparent", boxSizing: "border-box", resize: "none", overflow: "hidden", minHeight: 36, lineHeight: 1.5, transition: "border-color 0.12s, background 0.12s" }} onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} /> : <span style={{ padding: "6px 8px", fontSize: 13, whiteSpace: "pre-wrap" }}>{item.description || "-"}</span>}</td>
                    <td style={{ padding: 4, verticalAlign: "middle" }}>{itemsEditable ? <TableInput type="number" value={item.qty ?? ""} onChange={e => onItemChange(i, "qty", e.target.value)} align="right" revealed={hovered} /> : <span style={{ padding: "6px 8px", fontSize: 13, ...numStyle }}>{qty > 0 ? qty : ""}</span>}</td>
                    <td style={{ padding: 4, verticalAlign: "middle" }}>{itemsEditable ? <TableInput type="number" value={item.rate ?? ""} onChange={e => onItemChange(i, "rate", e.target.value)} align="right" revealed={hovered} /> : <span style={{ padding: "6px 8px", fontSize: 13, ...numStyle }}>{rate > 0 ? "$" + rate.toFixed(2) : ""}</span>}</td>
                    <td style={{ padding: 4, verticalAlign: "middle", textAlign: "right" }}><div style={{ padding: "8px 10px", border: "1px solid " + (hovered ? "#cbd5e1" : "transparent"), borderRadius: 4, fontSize: 13, fontWeight: 600, color: "#0F172A", background: hovered ? "#f8fafc" : "transparent", ...numStyle }}>{(qty * rate) > 0 ? "$" + (qty * rate).toFixed(2) : ""}</div></td>
                    {itemsEditable && <td style={{ padding: "8px 4px", textAlign: "center", verticalAlign: "middle" }}><button onClick={() => onDeleteItem(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", borderRadius: 4, opacity: hovered ? 1 : 0, transition: "opacity 0.12s" }}><Trash2 size={14} color="#94a3b8" /></button></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {itemsEditable && (
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => setAddDropdownOpen(!addDropdownOpen)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, color: "#0F172A", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            Add product or service
           <ChevronDown size={14} color="#64748B" style={{ marginLeft: 6 }} /></button>
          {addDropdownOpen && (<>
            <div onClick={() => setAddDropdownOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 20, minWidth: 220, overflow: "hidden" }}>
              <button onClick={() => { onAddItem(); setAddDropdownOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "#fff", border: "none", fontSize: 14, color: "#0F172A", cursor: "pointer", fontFamily: "inherit" }}>Add product or service</button>
              <button onClick={() => { addLineOfType("subtotal"); setAddDropdownOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "#fff", border: "none", fontSize: 14, color: "#0F172A", cursor: "pointer", fontFamily: "inherit" }}>Add subtotal</button>
              <button onClick={() => { addLineOfType("text"); setAddDropdownOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "#fff", border: "none", fontSize: 14, color: "#0F172A", cursor: "pointer", fontFamily: "inherit" }}>Add text</button>
            </div>
          </>)}
        </div>
        {items.length > 0 && (
          <button onClick={() => { if (window.confirm("Clear all line items? This cannot be undone.")) onClearItems(); }} style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, color: "#0F172A", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Clear all lines</button>
        )}
      </div>
    )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 40, marginTop: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 360px", minWidth: 280, maxWidth: 600 }}>
            {(itemsEditable || hasRealPaymentNote) && (
            <div className="print-hide" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>Customer payment options</span>
              <button type="button" style={{ background: "none", border: "none", color: "#0F9599", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Edit</button>
            </div>
              {itemsEditable && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span title="Apple Pay" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 26, background: "#000", borderRadius: 4 }}>
                <svg width="28" height="12" viewBox="0 0 165 72" xmlns="http://www.w3.org/2000/svg" fill="#fff"><path d="M30.7 9.3c-1.9 2.3-5 4.1-8.1 3.8-.4-3.1 1.1-6.4 2.9-8.4C27.4 2.4 30.8.8 33.5.6c.3 3.2-.9 6.4-2.8 8.7zm2.7 4.4c-4.5-.3-8.3 2.5-10.5 2.5-2.2 0-5.5-2.4-9.1-2.3-4.7.1-9 2.7-11.4 6.9-4.9 8.4-1.3 20.9 3.5 27.7 2.3 3.4 5.1 7.1 8.8 7 3.5-.1 4.8-2.3 9-2.3s5.5 2.3 9.2 2.2c3.8-.1 6.2-3.4 8.5-6.8 2.6-3.9 3.7-7.6 3.7-7.8-.1 0-7.2-2.8-7.3-10.9-.1-6.8 5.5-10 5.8-10.2-3.1-4.6-8-5.1-9.7-5.2"/><path d="M70.2 4.4v53.3h8.3v-18.2h11.4c10.4 0 17.7-7.1 17.7-17.6S100.5 4.4 90.2 4.4H70.2zm8.3 7h9.5c7.2 0 11.3 3.9 11.3 10.6s-4.1 10.6-11.3 10.6h-9.5V11.4zM118.4 58.1c5.2 0 10-2.6 12.2-6.8h.2v6.4h7.7V31.1c0-7.7-6.2-12.7-15.7-12.7-8.8 0-15.4 5-15.6 11.9h7.5c.6-3.3 3.6-5.4 7.9-5.4 5.2 0 8.1 2.4 8.1 6.9v3l-10.4.6c-9.6.6-14.8 4.5-14.8 11.4 0 6.9 5.4 11.3 13 11.3zm2.2-6.3c-4.5 0-7.4-2.2-7.4-5.5 0-3.4 2.8-5.4 8.1-5.7l9.2-.6v3.1c0 5-4.3 8.7-9.9 8.7zM146.9 72c8.1 0 11.9-3.1 15.2-12.4l14.6-41h-8.4l-9.8 31.7h-.2L148.5 18.6h-8.7l14.1 39.1-.8 2.4c-1.3 4-3.3 5.5-7 5.5-.6 0-1.9-.1-2.4-.1v6.4c.5.1 2.5.2 3.2.2z"/></svg>
              </span>
              <span title="Visa" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 26, background: "#1A1F71", borderRadius: 4 }}>
                <svg width="30" height="10" viewBox="0 0 1000 324" xmlns="http://www.w3.org/2000/svg" fill="#fff"><path d="M433 3L325 320h-86L186 100c-3-12-6-17-16-22C153 68 125 60 100 55l2-7h138c18 0 34 12 38 32l28 148L375 3h59zm245 213c1-57-79-60-78-86 0-7 8-15 24-17 8-1 30-2 56 10l10-46c-14-5-31-10-53-10-56 0-95 30-95 72-1 31 28 49 49 59 22 11 29 18 29 28-1 15-18 22-34 22-29 0-46-8-59-14l-10 47c14 6 38 12 64 12 60 0 99-30 99-77zm146 104h53L832 3h-49c-11 0-21 7-25 17L673 320h59l12-33h73l7 33zm-63-79l30-82 17 82h-47zM513 3l-46 317h-56L457 3h56z"/></svg>
              </span>
              <span title="Mastercard" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 26, background: "#fff", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                <svg width="28" height="18" viewBox="0 0 152 108" xmlns="http://www.w3.org/2000/svg"><circle cx="55" cy="54" r="48" fill="#EB001B"/><circle cx="97" cy="54" r="48" fill="#F79E1B"/><path d="M76 88a48 48 0 000-68 48 48 0 000 68z" fill="#FF5F00"/></svg>
              </span>
              <span title="Discover" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 26, background: "#fff", borderRadius: 4, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <svg width="38" height="22" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="60" fill="#fff"/><path d="M100 35c-15 10-50 22-100 22V60h100z" fill="#FF6000"/><text x="50" y="28" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="14" fill="#000">DISC</text><text x="50" y="42" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="9" fill="#FF6000">OVER</text></svg>
              </span>
              <span title="American Express" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 26, background: "#006FCF", borderRadius: 4 }}>
                <svg width="32" height="16" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg"><text x="50" y="13" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="9" fill="#fff">AMERICAN</text><text x="50" y="25" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="9" fill="#fff">EXPRESS</text></svg>
              </span>
              <span title="JCB" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 26, background: "#fff", borderRadius: 4, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <svg width="36" height="22" viewBox="0 0 60 36" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="20" height="36" fill="#0E4C96"/><rect x="20" y="0" width="20" height="36" fill="#BF1A2F"/><rect x="40" y="0" width="20" height="36" fill="#007B3A"/><text x="10" y="22" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="11" fill="#fff">J</text><text x="30" y="22" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="11" fill="#fff">C</text><text x="50" y="22" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="11" fill="#fff">B</text></svg>
              </span>
              <span title="Bank transfer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 26, background: "#475569", borderRadius: 4, gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>
                <span style={{ color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: "0.5px" }}>BANK</span>
              </span>
            </div>
              )}
              {itemsEditable && (
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 12, lineHeight: 1.5 }}>
              Activate online card or bank transfer payments for your customers.&nbsp;
              <button type="button" style={{ background: "none", border: "none", color: "#0F9599", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Activate payments</button>
            </div>
              )}
            {onFieldChange ? (
              <textarea value={inv.paymentNote || ""} onChange={e => onFieldChange("paymentNote", e.target.value)} rows={2} placeholder="Tell your customer how you want to get paid." style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} onFocus={onFocusBg} onBlur={onBlurBg} />
            ) : (
              <div style={{ fontSize: 13, color: "#475569", whiteSpace: "pre-line" }}>{inv.paymentNote || ""}</div>
            )}
          </div>
            )}
            {(itemsEditable || hasRealNote) && (
            <div className={hasRealNote ? "" : "print-hide"} style={{ marginTop: 32 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#475569", marginBottom: 6 }}>Note to customer</label>
          {onFieldChange ? (
            <textarea value={inv.note || ""} onChange={e => onFieldChange("note", e.target.value)} rows={3} placeholder="Thank you for your business." style={{ width: "100%", maxWidth: 600, padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} onFocus={onFocusBg} onBlur={onBlurBg} />
          ) : (<div style={{ fontSize: 13, color: "#475569", whiteSpace: "pre-line" }}>{inv.note || ""}</div>)}
        </div>
            )}
            {itemsEditable && (
            <div className="print-hide" style={{ marginTop: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#475569", marginBottom: 6 }}>Memo on statement (hidden)</label>
          {onFieldChange ? (
            <textarea value={inv.memo || ""} onChange={e => onFieldChange("memo", e.target.value)} rows={2} placeholder="This memo will not show up on your invoice, but will appear on the statement." style={{ width: "100%", maxWidth: 600, padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} onFocus={onFocusBg} onBlur={onBlurBg} />
          ) : (<div style={{ fontSize: 13, color: "#475569" }}>{inv.memo || ""}</div>)}

            {(itemsEditable || attachments.length > 0) && (
      <div className={(attachments && attachments.length > 0) ? "" : "print-hide"} style={{ marginTop: 24 }}>
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
            )}
        </div>
            )}
          </div>
          <div style={{ flex: "0 0 320px", minWidth: 280 }}>
            <div style={{ width: isMobile ? "100%" : 320 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <span style={{ fontSize: 13, color: "#0F172A" }}>Subtotal</span>
                <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 500, ...numStyle }}>${subtotal.toFixed(2)}</span>
              </div>
              <div className={Number(discount.value) > 0 ? "" : "print-hide"} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "#0F172A" }}>Discount {discount.value || 0}%</span>
                  <div className="print-hide" style={{ display: "inline-flex", borderRadius: 999, border: "1px solid #cbd5e1", overflow: "hidden", fontSize: 12 }}>
                    <button type="button" onClick={() => setDiscount({ ...discount, type: "percent" })} style={{ padding: "3px 12px", background: discount.type === "percent" ? "#cbd5e1" : "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#0F172A" }}>%</button>
                    <button type="button" onClick={() => setDiscount({ ...discount, type: "amount" })} style={{ padding: "3px 12px", background: discount.type === "amount" ? "#cbd5e1" : "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#0F172A" }}>$</button>
                  </div>
                </div>
                <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 500, ...numStyle }}>${((discount.type === "percent" ? subtotal * (Number(discount.value) || 0) / 100 : Number(discount.value) || 0)).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid #e2e8f0", marginTop: 4 }}>
                <span style={{ fontSize: 14, color: "#0F172A", fontWeight: 700 }}>Invoice total</span>
                <span style={{ fontSize: 14, color: "#0F172A", fontWeight: 700, ...numStyle }}>${(subtotal - (discount.type === "percent" ? subtotal * (Number(discount.value) || 0) / 100 : Number(discount.value) || 0)).toFixed(2)}</span>
              </div>
              <div className={Number(deposit) > 0 ? "" : "print-hide"} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <span style={{ fontSize: 13, color: "#0F172A" }}>Deposit</span>
                <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 500, ...numStyle }}>${(Number(deposit) || 0).toFixed(2)}</span>
              </div>
              <div className="print-hide" style={{ display: "flex", justifyContent: "flex-end", padding: "4px 0" }}>
                <button type="button" onClick={() => onEditTotals && onEditTotals()} style={{ background: "none", border: "none", color: "#0F5959", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0, textDecoration: "underline" }}>Edit totals</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
