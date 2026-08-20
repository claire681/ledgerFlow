import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Plus, Edit2, MoreVertical, AlertTriangle, CheckCircle } from "lucide-react";
import DatePicker from "./DatePicker";
import apiFetch from "../utils/apiFetch";

const BRAND = "#15A08C";
const BRAND_DARK = "#0F8474";
const TEXT_INK = "#0E1A1A";
const TEXT_PRIMARY = "#12262B";
const TEXT_SECONDARY = "#66748B";
const BORDER = "#E7EAF0";
const BG_PAGE = "#F4F6F8";
const RED = "#DC2626";
const ERROR_BG = "#FEF5F5";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("token") || "";
}
function authHeaders() {
  return { Authorization: "Bearer " + getToken() };
}

// Category options for the CREATE flow (spec Section 3)
const TYPE_CATEGORIES = [
  { value: "Hourly",                     calc_method: "rate_hours",    unit_label: "per hour",   amountLabel: "Rate per hour",                        amountPrefix: "$", amountSuffix: "/hr",   showAmount: true,  taxDefaults: { federal_taxable: true,  cpp_contributable: true,  ei_insurable: true,  vacationable: true,  wcb_reportable: true,  t4_box: "14" } },
  { value: "Commission",                 calc_method: "percent_gross", unit_label: "% of sales", amountLabel: null,                                    amountPrefix: null, amountSuffix: null,    showAmount: false, taxDefaults: { federal_taxable: true,  cpp_contributable: true,  ei_insurable: true,  vacationable: true,  wcb_reportable: true,  t4_box: "14" } },
  { value: "Allowance",                  calc_method: "fixed",         unit_label: null,         amountLabel: "Recurring amount per pay period",      amountPrefix: "$", amountSuffix: null,    showAmount: true,  taxDefaults: { federal_taxable: true,  cpp_contributable: true,  ei_insurable: true,  vacationable: false, wcb_reportable: false, t4_box: "40" } },
  { value: "Reimbursement",              calc_method: "fixed",         unit_label: null,         amountLabel: "Recurring amount per pay period",      amountPrefix: "$", amountSuffix: null,    showAmount: true,  taxDefaults: { federal_taxable: false, cpp_contributable: false, ei_insurable: false, vacationable: false, wcb_reportable: false, t4_box: null } },
  { value: "Taxable Benefits In Cash",   calc_method: "fixed",         unit_label: null,         amountLabel: "Recurring amount per pay period",      amountPrefix: "$", amountSuffix: null,    showAmount: true,  taxDefaults: { federal_taxable: true,  cpp_contributable: true,  ei_insurable: true,  vacationable: false, wcb_reportable: true,  t4_box: "40" } },
  { value: "Other Earnings",             calc_method: "fixed",         unit_label: null,         amountLabel: "Recurring amount per pay period",      amountPrefix: "$", amountSuffix: null,    showAmount: true,  taxDefaults: { federal_taxable: true,  cpp_contributable: true,  ei_insurable: true,  vacationable: true,  wcb_reportable: true,  t4_box: "14" } },
];

// For existing pay types, config for the ASSIGN form
function getAssignConfig(payType) {
  if (!payType) return { showRate: false, showAmount: false };
  const method = payType.calc_method;
  const name = (payType.name || "").toLowerCase();
  if (method === "rate_hours") {
    if (name.includes("overtime") || name.includes("double")) {
      return { showRate: true, rateLabel: "Rate multiplier", rateSuffix: "x", ratePrefix: null, helper: "Alberta default 1.5x. Hours entered per pay period." };
    }
    return { showRate: true, rateLabel: "Hourly rate", ratePrefix: "$", rateSuffix: "/hr", helper: "Rate per hour worked." };
  }
  if (method === "percent_gross") return { showRate: true, rateLabel: "Percentage rate", rateSuffix: "%", ratePrefix: null, helper: "Enter the percentage." };
  if (method === "rate_units")   return { showRate: true, rateLabel: "Rate per unit", ratePrefix: "$", rateSuffix: payType.unit_label || "unit", helper: "Rate charged per unit." };
  if (method === "fixed")        return { showAmount: true, amountLabel: "Recurring amount per pay period", helper: "Leave blank to enter per pay run." };
  if (method === "adw")          return { helper: "Uses average daily wage from last 4 weeks. No config needed." };
  return { helper: "" };
}

function formatDDMMYYYY(iso) {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return parts[2] + "/" + parts[1] + "/" + parts[0];
}

function rateAmountDisplay(item, payType) {
  if (!payType) return "";
  const method = payType.calc_method;
  const val = item.rate_override;
  if (method === "rate_hours") {
    const name = (payType.name || "").toLowerCase();
    if (name.includes("overtime") || name.includes("double")) {
      return val != null ? val + "x base pay" : "";
    }
    return val != null ? "$" + Number(val).toFixed(2) + "/hour" : "";
  }
  if (method === "percent_gross") return val != null ? val + "%" : "";
  if (method === "rate_units")   return val != null ? "$" + Number(val).toFixed(2) + "/" + (payType.unit_label || "unit") : "";
  if (method === "fixed")        return val != null ? "$" + Number(val).toFixed(2) + "/pay period" : "";
  if (method === "adw")          return "";
  return val != null ? String(val) : "";
}

// ===== Toast component =====
function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000, display: "flex", flexDirection: "column", gap: 10, maxWidth: 380 }} role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} style={{ background: "#fff", border: "1px solid " + BORDER, borderLeft: "3px solid " + BRAND, borderRadius: 10, padding: "14px 16px", boxShadow: "0 6px 24px rgba(18,38,43,0.12)", display: "flex", alignItems: "flex-start", gap: 12, fontFamily: "Inter, system-ui, sans-serif" }}>
          <CheckCircle size={18} style={{ color: BRAND, flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{t.title}</div>
            {t.detail && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{t.detail}</div>}
          </div>
          <button onClick={() => onDismiss(t.id)} aria-label="Dismiss notification" style={{ background: "none", border: 0, cursor: "pointer", color: TEXT_SECONDARY, padding: 2, flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ===== Main component =====
export default function PayTypesDrawer({ open, onClose, employeeId }) {
  const queryClient = useQueryClient();
  const [availableTypes, setAvailableTypes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Form state
  const [formMode, setFormMode] = useState(null); // null | "assign" | "create" | "edit"
  const [editingItem, setEditingItem] = useState(null);
  const [selectedTypeId, setSelectedTypeId] = useState(""); // for assign mode
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Create-mode fields
  const [newName, setNewName] = useState("");
  const [newCategoryValue, setNewCategoryValue] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Validation
  const [errorFields, setErrorFields] = useState({}); // { name: true, category: true }

  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef(null);
  const catDropdownRef = useRef(null);

  useEffect(() => {
    if (!open || !employeeId) return;
    // Open directly to Add form per spec (no list view inside drawer)
    setFormMode("assign");
    const today = new Date().toISOString().slice(0, 10);
    setEffectiveDate(today);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employeeId]);

  // When drawer closes, reset
  useEffect(() => {
    if (!open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function onClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) setCategoryDropdownOpen(false);
    }
    if (dropdownOpen || categoryDropdownOpen) {
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }
  }, [dropdownOpen, categoryDropdownOpen]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [tRes, aRes] = await Promise.all([
        apiFetch("/api/v1/pay-types", { headers: authHeaders() }),
        apiFetch("/api/v1/employee-pay-items/employee/" + employeeId, { headers: authHeaders() }),
      ]);
      if (!tRes.ok) throw new Error("Could not load pay types");
      if (!aRes.ok) throw new Error("Could not load assignments");
      const types = await tRes.json();
      const assigns = await aRes.json();
      setAvailableTypes(types.filter(t => t.is_active && !t.deleted_at));
      setAssignments(assigns);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormMode(null);
    setEditingItem(null);
    setSelectedTypeId("");
    setRate(""); setAmount("");
    setEffectiveDate(""); setEndDate("");
    setDropdownOpen(false); setCategoryDropdownOpen(false);
    setNewName(""); setNewCategoryValue("");
    setErrorFields({}); setError(null);
  }

  function startAssignForm(payTypeId) {
    resetForm();
    setFormMode("assign");
    setSelectedTypeId(payTypeId);
    const today = new Date().toISOString().slice(0, 10);
    setEffectiveDate(today);
  }

  function startCreateForm() {
    resetForm();
    setFormMode("create");
    const today = new Date().toISOString().slice(0, 10);
    setEffectiveDate(today);
  }

  function startEditForm(item) {
    resetForm();
    setFormMode("edit");
    setEditingItem(item);
    setSelectedTypeId(item.pay_type_id);
    setRate(item.rate_override != null ? String(item.rate_override) : "");
    setEffectiveDate(item.effective_date || "");
    setEndDate(item.end_date || "");
  }

  function addToast(title, detail) {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, detail }].slice(-3));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }

  function dismissToast(id) { setToasts(prev => prev.filter(t => t.id !== id)); }

  async function handleSave() {
    setError(null); setErrorFields({});

    if (formMode === "create") {
      const errs = {};
      if (!newName.trim()) errs.name = true;
      if (!newCategoryValue) errs.category = true;
      if (!effectiveDate) errs.effectiveDate = true;
      if (Object.keys(errs).length > 0) { setErrorFields(errs); setError("Please fill required fields"); return; }

      const category = TYPE_CATEGORIES.find(c => c.value === newCategoryValue);
      setSaving(true);
      try {
        // Step 1: POST /pay-types (create catalog row)
        const ptBody = {
          name: newName.trim(),
          calc_method: category.calc_method,
          unit_label: category.unit_label,
          default_rate: category.showAmount && amount ? parseFloat(amount) : null,
          is_default: false,
          country: "CA",
          ...category.taxDefaults,
        };
        const ptRes = await apiFetch("/api/v1/pay-types", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(ptBody),
        });
        if (!ptRes.ok) {
          const err = await ptRes.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to create pay type");
        }
        const newPayType = await ptRes.json();

        // Step 2: POST /employee-pay-items (assign)
        const epiBody = {
          employee_id: employeeId,
          pay_type_id: newPayType.id,
          rate_override: category.showAmount && amount ? parseFloat(amount) : null,
          effective_date: effectiveDate,
          end_date: endDate || null,
        };
        const epiRes = await apiFetch("/api/v1/employee-pay-items", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(epiBody),
        });
        if (!epiRes.ok) {
          const err = await epiRes.json().catch(() => ({}));
          throw new Error(err.detail || "Pay type created but assignment failed");
        }

        // Success
        const detail = category.showAmount && amount
          ? category.value + ", $" + parseFloat(amount).toFixed(2) + " per pay period, effective " + formatDDMMYYYY(effectiveDate)
          : category.value + ", effective " + formatDDMMYYYY(effectiveDate);
        addToast(newName.trim() + " added", detail);
        await loadData();
        queryClient.invalidateQueries({ queryKey: ["pay-items"] });
        onClose();
      } catch (e) { setError(e.message); }
      finally { setSaving(false); }
      return;
    }

    // Assign or Edit mode
    if (!selectedTypeId) { setErrorFields({ type: true }); setError("Please pick a pay type"); return; }
    if (!effectiveDate) { setErrorFields({ effectiveDate: true }); setError("Please pick an effective date"); return; }

    setSaving(true);
    try {
      const payType = availableTypes.find(t => t.id === selectedTypeId);
      const cfg = getAssignConfig(payType);
      const body = {
        employee_id: employeeId,
        pay_type_id: selectedTypeId,
        rate_override: (cfg.showRate || cfg.showAmount) && rate ? parseFloat(rate) : null,
        effective_date: effectiveDate,
        end_date: endDate || null,
      };
      let res;
      if (formMode === "edit" && editingItem) {
        res = await apiFetch("/api/v1/employee-pay-items/" + editingItem.id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(body),
        });
      } else {
        res = await apiFetch("/api/v1/employee-pay-items", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Save failed");
      }

      const ptName = payType.name;
      const detail = rate
        ? payType.name + ", $" + parseFloat(rate).toFixed(2) + ", effective " + formatDDMMYYYY(effectiveDate)
        : payType.name + ", effective " + formatDDMMYYYY(effectiveDate);
      addToast(ptName + (formMode === "edit" ? " updated" : " added"), detail);
      await loadData();
      queryClient.invalidateQueries({ queryKey: ["pay-items"] });
      onClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(item) {
    const payType = availableTypes.find(t => t.id === item.pay_type_id);
    const name = payType ? payType.name : "Pay type";
    if (!window.confirm("Remove " + name + "?")) return;
    try {
      const res = await apiFetch("/api/v1/employee-pay-items/" + item.id, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("Delete failed");
      addToast(name + " removed", null);
      await loadData();
      queryClient.invalidateQueries({ queryKey: ["pay-items"] });
    } catch (e) { setError(e.message); }
  }

  if (!open) return null;

  const selectedType = availableTypes.find(t => t.id === selectedTypeId);
  const assignCfg = getAssignConfig(selectedType);
  const assignedIds = new Set(assignments.map(a => a.pay_type_id));
  const availableForDropdown = formMode === "edit" ? availableTypes : availableTypes.filter(t => !assignedIds.has(t.id));
  const selectedCategory = TYPE_CATEGORIES.find(c => c.value === newCategoryValue);

  const inputBaseStyle = (hasError) => ({
    width: "100%", height: 44, padding: "0 14px",
    border: "1px solid " + (hasError ? RED : BORDER),
    borderRadius: 10,
    background: hasError ? ERROR_BG : "#fff",
    fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000 }} />
      <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: 520, background: "#fff", zIndex: 1001, boxShadow: "-4px 0 24px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", fontFamily: "Inter, system-ui, sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid " + BORDER }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_INK }}>{formMode ? (formMode === "edit" ? "Edit pay type" : "Add pay type") : "Additional pay types"}</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 }}>{formMode ? "Configure and assign the pay type." : "Extra pay this employee will receive."}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: 0, cursor: "pointer", color: TEXT_SECONDARY, padding: 6 }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {error && (
            <div style={{ padding: 10, background: "#FEE2E2", border: "1px solid #F87171", borderRadius: 8, color: "#991B1B", fontSize: 13, marginBottom: 14 }}>{error}</div>
          )}

          {/* LIST VIEW */}
          {formMode === null && (
            <>
              {loading && <div style={{ color: TEXT_SECONDARY, fontSize: 13 }}>Loading...</div>}
              {!loading && assignments.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: TEXT_SECONDARY, fontSize: 14 }}>No additional pay types yet.</div>
              )}
              {assignments.map(item => {
                const payType = availableTypes.find(t => t.id === item.pay_type_id);
                return (
                  <div key={item.id} style={{ border: "1px solid " + BORDER, borderRadius: 10, padding: "14px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: TEXT_INK, fontSize: 14 }}>{payType ? payType.name : "Unknown"}</div>
                      <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                        {rateAmountDisplay(item, payType)}{rateAmountDisplay(item, payType) ? " / " : ""}Effective {item.effective_date ? formatDDMMYYYY(item.effective_date) : "-"}{item.end_date ? " / End " + formatDDMMYYYY(item.end_date) : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                      <button onClick={() => startEditForm(item)} style={{ background: "none", border: 0, cursor: "pointer", color: BRAND_DARK, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600 }}><Edit2 size={13} />Edit</button>
                      <button onClick={() => handleDelete(item)} style={{ background: "none", border: 0, cursor: "pointer", color: TEXT_SECONDARY, padding: "4px 6px" }} title="Remove"><MoreVertical size={16} /></button>
                    </div>
                  </div>
                );
              })}

            </>
          )}

          {/* ASSIGN / CREATE / EDIT FORMS */}
          {formMode !== null && (
            <>
              {/* Pay type combobox */}
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>Pay type <span style={{ color: RED }}>*</span></label>
              <div style={{ position: "relative", marginBottom: 20 }} ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} disabled={formMode === "edit"} style={{ ...inputBaseStyle(false), display: "flex", justifyContent: "space-between", alignItems: "center", cursor: formMode === "edit" ? "default" : "pointer", background: formMode === "edit" ? "#F8F9FA" : "#fff", fontWeight: 500, color: (formMode === "create") ? BRAND_DARK : (selectedType ? TEXT_INK : "#9CA3AF"), textAlign: "left" }}>
                  <span>{formMode === "create" ? "+ New pay type" : (selectedType ? selectedType.name : "Select or type to search...")}</span>
                  <span style={{ color: TEXT_SECONDARY }}>▾</span>
                </button>
                {dropdownOpen && formMode !== "edit" && (
                  <div style={{ position: "absolute", top: 46, left: 0, right: 0, background: "#fff", border: "1px solid " + BORDER, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", maxHeight: 320, overflowY: "auto", zIndex: 10 }}>
                    <div onClick={() => { startCreateForm(); setDropdownOpen(false); }} style={{ padding: "12px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#2563EB", borderBottom: "1px solid " + BORDER, background: "#F8F9FA" }} onMouseEnter={e => e.currentTarget.style.background = "#EFF6FF"} onMouseLeave={e => e.currentTarget.style.background = "#F8F9FA"}>+ New pay type</div>
                    {availableForDropdown.map(t => (
                      <div key={t.id} onClick={() => { startAssignForm(t.id); setDropdownOpen(false); }} style={{ padding: "12px 16px", cursor: "pointer", fontSize: 14, borderBottom: "1px solid #F3F4F6" }} onMouseEnter={e => e.currentTarget.style.background = "#F8F9FA"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{t.name}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* CREATE MODE - name and type */}
              {formMode === "create" && (
                <>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>Name (as shown on paycheque) <span style={{ color: RED }}>*</span></label>
                  <input value={newName} onChange={e => { setNewName(e.target.value); if (errorFields.name && e.target.value.trim()) setErrorFields(f => ({ ...f, name: false })); }} placeholder="e.g. Sales bonus, Gas allowance" style={{ ...inputBaseStyle(errorFields.name), marginBottom: errorFields.name ? 4 : 20 }} />
                  {errorFields.name && <div style={{ display: "flex", alignItems: "center", gap: 6, color: RED, fontSize: 12, marginBottom: 16 }}><AlertTriangle size={14} />Enter a name.</div>}

                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>Type <span style={{ color: RED }}>*</span></label>
                  <div style={{ position: "relative", marginBottom: errorFields.category ? 4 : 20 }} ref={catDropdownRef}>
                    <button onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)} style={{ ...inputBaseStyle(errorFields.category), display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: 500, color: newCategoryValue ? TEXT_INK : "#9CA3AF", textAlign: "left" }}>
                      <span>{newCategoryValue || "Select one..."}</span>
                      <span style={{ color: TEXT_SECONDARY }}>▾</span>
                    </button>
                    {categoryDropdownOpen && (
                      <div style={{ position: "absolute", top: 46, left: 0, right: 0, background: "#fff", border: "1px solid " + BORDER, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", maxHeight: 280, overflowY: "auto", zIndex: 10 }}>
                        {TYPE_CATEGORIES.map(c => (
                          <div key={c.value} onClick={() => { setNewCategoryValue(c.value); setCategoryDropdownOpen(false); if (errorFields.category) setErrorFields(f => ({ ...f, category: false })); }} style={{ padding: "12px 16px", cursor: "pointer", fontSize: 14, borderBottom: "1px solid #F3F4F6" }} onMouseEnter={e => e.currentTarget.style.background = "#F8F9FA"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{c.value}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errorFields.category && <div style={{ display: "flex", alignItems: "center", gap: 6, color: RED, fontSize: 12, marginBottom: 16 }}><AlertTriangle size={14} />Select a type.</div>}

                  {/* Amount for create */}
                  {selectedCategory && selectedCategory.showAmount && (
                    <>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>{selectedCategory.amountLabel}</label>
                      <div style={{ display: "flex", alignItems: "center", height: 44, padding: "0 14px", border: "1px solid " + BORDER, borderRadius: 10, background: "#fff", marginBottom: 8, maxWidth: 240 }}>
                        {selectedCategory.amountPrefix && <span style={{ color: TEXT_SECONDARY, marginRight: 6 }}>{selectedCategory.amountPrefix}</span>}
                        <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{ flex: 1, border: 0, outline: "none", fontSize: 14, fontFamily: "inherit" }} />
                        {selectedCategory.amountSuffix && <span style={{ color: TEXT_SECONDARY, fontSize: 12, marginLeft: 6 }}>{selectedCategory.amountSuffix}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginBottom: 20 }}>This amount will be automatically included every pay period.</div>
                    </>
                  )}
                </>
              )}

              {/* ASSIGN / EDIT MODE - rate/amount input */}
              {(formMode === "assign" || formMode === "edit") && selectedType && (assignCfg.showRate || assignCfg.showAmount) && (
                <>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>{assignCfg.rateLabel || assignCfg.amountLabel} {assignCfg.showRate && <span style={{ color: RED }}>*</span>}</label>
                  <div style={{ display: "flex", alignItems: "center", height: 44, padding: "0 14px", border: "1px solid " + BORDER, borderRadius: 10, background: "#fff", marginBottom: 8, maxWidth: 240 }}>
                    {assignCfg.ratePrefix && <span style={{ color: TEXT_SECONDARY, marginRight: 6 }}>{assignCfg.ratePrefix}</span>}
                    <input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder="0.00" style={{ flex: 1, border: 0, outline: "none", fontSize: 14, fontFamily: "inherit" }} />
                    {assignCfg.rateSuffix && <span style={{ color: TEXT_SECONDARY, fontSize: 12, marginLeft: 6 }}>{assignCfg.rateSuffix}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginBottom: 20 }}>{assignCfg.helper}</div>
                </>
              )}

              {/* Info-only pay types */}
              {(formMode === "assign" || formMode === "edit") && selectedType && !assignCfg.showRate && !assignCfg.showAmount && (
                <div style={{ padding: 12, background: "#F8F9FA", borderRadius: 8, fontSize: 12, color: TEXT_PRIMARY, marginBottom: 20 }}>{assignCfg.helper}</div>
              )}

              {/* Effective date */}
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>Effective date <span style={{ color: RED }}>*</span></label>
              <div style={{ marginBottom: errorFields.effectiveDate ? 4 : 20 }}>
                <DatePicker value={effectiveDate} onChange={setEffectiveDate} />
              </div>
              {errorFields.effectiveDate && <div style={{ display: "flex", alignItems: "center", gap: 6, color: RED, fontSize: 12, marginBottom: 16 }}><AlertTriangle size={14} />Select a date.</div>}

              {/* End date */}
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>End date <span style={{ color: TEXT_SECONDARY, fontWeight: 500 }}>(optional)</span></label>
              <div style={{ marginBottom: 20 }}>
                <DatePicker value={endDate} onChange={setEndDate} placeholder="No end date" />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid " + BORDER, display: "flex", justifyContent: "flex-end", gap: 10, background: BG_PAGE }}>
          {formMode === null ? (
            <button onClick={onClose} style={{ padding: "10px 20px", background: TEXT_INK, color: "#fff", border: 0, borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Done</button>
          ) : (
            <>
              <button onClick={onClose} disabled={saving} style={{ padding: "10px 20px", background: "#fff", color: TEXT_INK, border: "1px solid " + BORDER, borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "10px 20px", background: TEXT_INK, color: "#fff", border: 0, borderRadius: 10, fontWeight: 600, cursor: saving ? "wait" : "pointer", fontFamily: "inherit" }}>{saving ? "Saving..." : (formMode === "edit" ? "Save changes" : "Save pay type")}</button>
            </>
          )}
        </div>
      </div>
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}