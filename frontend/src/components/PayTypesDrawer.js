import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit2 } from "lucide-react";
import DatePicker from "./DatePicker";

const BRAND = "#15A08C";
const BRAND_DARK = "#0F8474";
const TEXT_INK = "#0E1A1A";
const TEXT_PRIMARY = "#12262B";
const TEXT_SECONDARY = "#66748B";
const BORDER = "#E7EAF0";
const BG_PAGE = "#F4F6F8";
const RED = "#DC2626";

const API_URL = process.env.REACT_APP_API_URL || "";

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("token") || "";
}

// Config map: which fields to show per pay type calc_method
function getConfigFields(payType) {
  if (!payType) return { showRate: false, showAmount: false, rateLabel: "", rateUnit: "", helper: "" };
  const method = payType.calc_method;
  const name = (payType.name || "").toLowerCase();

  if (method === "rate_hours") {
    if (name.includes("overtime") || name.includes("double")) {
      return { showRate: true, rateLabel: "Rate multiplier", rateUnit: "x", helper: "Alberta default 1.5x. Hours entered per pay period." };
    }
    return { showRate: true, rateLabel: "Hourly rate", rateUnit: "/hr", ratePrefix: "$", helper: "Rate per hour worked." };
  }
  if (method === "percent_gross") {
    return { showRate: true, rateLabel: "Percentage rate", rateUnit: "%", helper: "Enter the percentage." };
  }
  if (method === "rate_units") {
    return { showRate: true, rateLabel: "Rate per unit", rateUnit: payType.unit_label || "unit", ratePrefix: "$", helper: "Rate charged per unit." };
  }
  if (method === "fixed") {
    return { showAmount: true, helper: "Amount entered per pay period during Run Payroll." };
  }
  if (method === "adw") {
    return { helper: "Uses average daily wage from last 4 weeks. No config needed." };
  }
  return { helper: "" };
}

export default function PayTypesDrawer({ open, onClose, employeeId }) {
  const [availableTypes, setAvailableTypes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formMode, setFormMode] = useState(null); // null | "new" | "edit"
  const [editingItem, setEditingItem] = useState(null);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load data when drawer opens
  useEffect(() => {
    if (!open || !employeeId) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employeeId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: "Bearer " + getToken() };
      const [tRes, aRes] = await Promise.all([
        fetch(API_URL + "/api/v1/pay-types", { headers }),
        fetch(API_URL + "/api/v1/employee-pay-items/employee/" + employeeId, { headers }),
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
    setRate("");
    setAmount("");
    setEffectiveDate("");
    setEndDate("");
    setDropdownOpen(false);
  }

  function openNewForm() {
    resetForm();
    setFormMode("new");
    // Default effective date to today
    const today = new Date().toISOString().slice(0, 10);
    setEffectiveDate(today);
  }

  function openEditForm(item) {
    setFormMode("edit");
    setEditingItem(item);
    setSelectedTypeId(item.pay_type_id);
    setRate(item.rate_override != null ? String(item.rate_override) : "");
    setAmount("");
    setEffectiveDate(item.effective_date || "");
    setEndDate(item.end_date || "");
  }

  async function handleSave() {
    if (!selectedTypeId) { setError("Please pick a pay type"); return; }
    if (!effectiveDate) { setError("Please pick an effective date"); return; }
    setSaving(true); setError(null);
    try {
      const payType = availableTypes.find(t => t.id === selectedTypeId);
      const cfg = getConfigFields(payType);
      const body = {
        pay_type_id: selectedTypeId,
        employee_id: employeeId,
        effective_date: effectiveDate,
        end_date: endDate || null,
      };
      if (cfg.showRate && rate) body.rate_override = parseFloat(rate);
      const headers = { "Content-Type": "application/json", Authorization: "Bearer " + getToken() };

      let res;
      if (formMode === "edit" && editingItem) {
        res = await fetch(API_URL + "/api/v1/employee-pay-items/" + editingItem.id, { method: "PATCH", headers, body: JSON.stringify(body) });
      } else {
        res = await fetch(API_URL + "/api/v1/employee-pay-items", { method: "POST", headers, body: JSON.stringify(body) });
      }
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || "Save failed"); }
      resetForm();
      await loadData();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(item) {
    if (!window.confirm("Remove " + getTypeName(item.pay_type_id) + "?")) return;
    try {
      const headers = { Authorization: "Bearer " + getToken() };
      const res = await fetch(API_URL + "/api/v1/employee-pay-items/" + item.id, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Delete failed");
      await loadData();
    } catch (e) { setError(e.message); }
  }

  function getTypeName(id) {
    const t = availableTypes.find(x => x.id === id);
    return t ? t.name : "";
  }

  function getRateDisplay(item) {
    const t = availableTypes.find(x => x.id === item.pay_type_id);
    if (!t) return "";
    const cfg = getConfigFields(t);
    if (item.rate_override == null) return t.default_rate != null ? String(t.default_rate) + " " + (cfg.rateUnit || "") : "";
    return (cfg.ratePrefix || "") + String(item.rate_override) + " " + (cfg.rateUnit || "");
  }

  if (!open) return null;

  const selectedType = availableTypes.find(t => t.id === selectedTypeId);
  const cfg = getConfigFields(selectedType);

  // Types not yet assigned
  const assignedIds = new Set(assignments.map(a => a.pay_type_id));
  const availableForForm = formMode === "edit"
    ? availableTypes
    : availableTypes.filter(t => !assignedIds.has(t.id));

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000 }} />
      <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: 520, background: "#fff", zIndex: 1001, boxShadow: "-4px 0 24px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", fontFamily: "Inter, system-ui, sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid " + BORDER }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_INK }}>Additional pay types</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 }}>Configure extra pay this employee will receive.</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: 0, cursor: "pointer", color: TEXT_SECONDARY, padding: 6 }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {error && (
            <div style={{ padding: 10, background: "#FEE2E2", border: "1px solid #F87171", borderRadius: 8, color: "#991B1B", fontSize: 13, marginBottom: 14 }}>{error}</div>
          )}

          {formMode === null && (
            <>
              {loading && <div style={{ color: TEXT_SECONDARY, fontSize: 13 }}>Loading...</div>}
              {!loading && assignments.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: TEXT_SECONDARY, fontSize: 14 }}>No additional pay types yet.</div>
              )}
              {assignments.map(item => (
                <div key={item.id} style={{ border: "1px solid " + BORDER, borderRadius: 10, padding: "14px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: TEXT_INK, fontSize: 14 }}>{getTypeName(item.pay_type_id)}{getRateDisplay(item) ? " - " + getRateDisplay(item) : ""}</div>
                    <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 4 }}>
                      Effective: {item.effective_date || "-"} {item.end_date ? " / End: " + item.end_date : " / No end date"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEditForm(item)} style={{ background: "none", border: 0, cursor: "pointer", color: BRAND_DARK, padding: 6, display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600 }}><Edit2 size={14} />Edit</button>
                    <button onClick={() => handleDelete(item)} style={{ background: "none", border: 0, cursor: "pointer", color: RED, padding: 6, display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600 }}><Trash2 size={14} />Delete</button>
                  </div>
                </div>
              ))}
              <button onClick={openNewForm} disabled={availableForForm.length === 0} style={{ width: "100%", padding: 14, border: "1.5px dashed " + BRAND_DARK, background: "transparent", color: BRAND_DARK, fontWeight: 600, borderRadius: 10, cursor: availableForForm.length === 0 ? "not-allowed" : "pointer", fontSize: 14, opacity: availableForForm.length === 0 ? 0.5 : 1, marginTop: 10, fontFamily: "inherit" }}><Plus size={16} style={{ verticalAlign: "text-bottom", marginRight: 4 }} />New pay type</button>
              {availableForForm.length === 0 && assignments.length > 0 && (
                <div style={{ fontSize: 12, color: TEXT_SECONDARY, textAlign: "center", marginTop: 8 }}>All available pay types have been assigned.</div>
              )}
            </>
          )}

          {formMode !== null && (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{formMode === "edit" ? "Edit pay type" : "Add pay type"}</div>

              {/* Type dropdown */}
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>Pay type <span style={{ color: RED }}>*</span></label>
              <div style={{ position: "relative", marginBottom: 20 }}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} disabled={formMode === "edit"} style={{ width: "100%", height: 44, padding: "0 14px", border: "1px solid " + BORDER, borderRadius: 10, background: formMode === "edit" ? "#F8F9FA" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: formMode === "edit" ? "default" : "pointer", fontSize: 14, fontWeight: 500, color: selectedType ? TEXT_INK : "#9CA3AF", fontFamily: "inherit", textAlign: "left" }}>
                  <span>{selectedType ? selectedType.name : "Select pay type..."}</span>
                  <span>▾</span>
                </button>
                {dropdownOpen && formMode !== "edit" && (
                  <div style={{ position: "absolute", top: 46, left: 0, right: 0, background: "#fff", border: "1px solid " + BORDER, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", maxHeight: 280, overflowY: "auto", zIndex: 10 }}>
                    {availableForForm.map(t => (
                      <div key={t.id} onClick={() => { setSelectedTypeId(t.id); setDropdownOpen(false); }} style={{ padding: "12px 16px", cursor: "pointer", fontSize: 14, borderBottom: "1px solid #F3F4F6" }} onMouseEnter={e => e.currentTarget.style.background = "#F8F9FA"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{t.name}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conditional rate field */}
              {cfg.showRate && (
                <>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>{cfg.rateLabel} <span style={{ color: RED }}>*</span></label>
                  <div style={{ display: "flex", alignItems: "center", height: 44, padding: "0 14px", border: "1px solid " + BORDER, borderRadius: 10, background: "#fff", marginBottom: 8, maxWidth: 240 }}>
                    {cfg.ratePrefix && <span style={{ color: TEXT_SECONDARY, marginRight: 6 }}>{cfg.ratePrefix}</span>}
                    <input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder="0.00" style={{ flex: 1, border: 0, outline: "none", fontSize: 14, fontFamily: "inherit" }} />
                    <span style={{ color: TEXT_SECONDARY, fontSize: 12, marginLeft: 6 }}>{cfg.rateUnit}</span>
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginBottom: 20 }}>{cfg.helper}</div>
                </>
              )}

              {/* Info-only pay type */}
              {selectedType && !cfg.showRate && (
                <div style={{ padding: 12, background: "#F8F9FA", borderRadius: 8, fontSize: 12, color: TEXT_PRIMARY, marginBottom: 20 }}>{cfg.helper}</div>
              )}

              {/* Effective date */}
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>Effective date <span style={{ color: RED }}>*</span></label>
              <div style={{ marginBottom: 20 }}>
                <DatePicker value={effectiveDate} onChange={setEffectiveDate} />
              </div>

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
              <button onClick={resetForm} disabled={saving} style={{ padding: "10px 20px", background: "#fff", color: TEXT_INK, border: "1px solid " + BORDER, borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "10px 20px", background: TEXT_INK, color: "#fff", border: 0, borderRadius: 10, fontWeight: 600, cursor: saving ? "wait" : "pointer", fontFamily: "inherit" }}>{saving ? "Saving..." : (formMode === "edit" ? "Save changes" : "Save pay type")}</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
