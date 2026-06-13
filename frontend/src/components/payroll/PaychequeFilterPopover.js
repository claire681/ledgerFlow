import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, ChevronUp, Check, Calendar } from "lucide-react";

const BRAND = "#0F9599";
const BRAND_SOFT = "#E1F5EE";
const BRAND_DARK = "#0F6E56";
const BORDER = "#E5E7EB";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";

const DATE_PRESETS = [
  { id: "last_pay", label: "Last pay date" },
  { id: "today", label: "Today" },
  { id: "this_week", label: "This week" },
  { id: "last_week", label: "Last week" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "this_quarter", label: "This quarter" },
  { id: "this_year", label: "This year" },
  { id: "last_year", label: "Last year" },
  { id: "custom", label: "Custom" },
];

const EMPLOYEE_GROUPS = [
  { id: "active", label: "Active employees" },
  { id: "inactive", label: "Inactive employees" },
  { id: "all", label: "All employees" },
];

const computePreset = (presetId) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const fmt = (d) => d.toISOString().slice(0, 10);
  switch (presetId) {
    case "today":
      return { from: fmt(today), to: fmt(today) };
    case "this_week": {
      const d = new Date(today); d.setDate(d.getDate() - d.getDay());
      const e = new Date(d); e.setDate(e.getDate() + 6);
      return { from: fmt(d), to: fmt(e) };
    }
    case "last_week": {
      const d = new Date(today); d.setDate(d.getDate() - d.getDay() - 7);
      const e = new Date(d); e.setDate(e.getDate() + 6);
      return { from: fmt(d), to: fmt(e) };
    }
    case "this_month":
      return { from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), to: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)) };
    case "last_month":
      return { from: fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)), to: fmt(new Date(today.getFullYear(), today.getMonth(), 0)) };
    case "this_quarter": {
      const q = Math.floor(today.getMonth() / 3);
      return { from: fmt(new Date(today.getFullYear(), q * 3, 1)), to: fmt(new Date(today.getFullYear(), q * 3 + 3, 0)) };
    }
    case "this_year":
      return { from: fmt(new Date(today.getFullYear(), 0, 1)), to: fmt(new Date(today.getFullYear(), 11, 31)) };
    case "last_year":
      return { from: fmt(new Date(today.getFullYear() - 1, 0, 1)), to: fmt(new Date(today.getFullYear() - 1, 11, 31)) };
    case "last_pay":
    default:
      return { from: fmt(today), to: fmt(today) };
  }
};

function CustomSelect({ value, label, open, onToggle, children }) {
  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "7px 9px", borderRadius: 5,
          border: "0.5px solid " + (open ? BRAND : BORDER),
          cursor: "pointer", background: "white",
        }}
      >
        <span style={{ fontSize: 12, color: TEXT_PRIMARY }}>{label}</span>
        {open ? <ChevronUp size={12} style={{ color: TEXT_SECONDARY }} /> : <ChevronDown size={12} style={{ color: TEXT_SECONDARY }} />}
      </div>
      {open && children}
    </div>
  );
}

export default function PaychequeFilterPopover({
  open, onClose, anchor,
  initial, employees = [], paySchedules = [], onApply,
}) {
  const [draft, setDraft] = useState(initial || { employee: "all", paySchedule: "all", datePreset: "last_pay", from: "", to: "" });
  const [openSelect, setOpenSelect] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (open) {
      const base = initial || { employee: "all", paySchedule: "all", datePreset: "last_pay", from: "", to: "" };
      if (!base.from || !base.to) {
        const computed = computePreset(base.datePreset || "last_pay");
        setDraft({ ...base, from: computed.from, to: computed.to });
      } else {
        setDraft(base);
      }
      setOpenSelect(null);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const employeeLabel = (() => {
    if (draft.employee === "all") return "All employees";
    const g = EMPLOYEE_GROUPS.find((x) => x.id === draft.employee);
    if (g) return g.label;
    const emp = employees.find((e) => e.id === draft.employee);
    if (emp) {
      const last = (emp.last_name || "").trim();
      const first = (emp.first_name || "").trim();
      return last && first ? last + ", " + first : (emp.name || emp.email || "Unnamed");
    }
    return "All employees";
  })();

  const scheduleLabel = (() => {
    if (draft.paySchedule === "all") return "All pay schedules";
    const sch = paySchedules.find((s) => s.id === draft.paySchedule);
    return sch ? sch.name : "All pay schedules";
  })();

  const presetLabel = (DATE_PRESETS.find((p) => p.id === draft.datePreset) || DATE_PRESETS[0]).label;

  const setEmployee = (id) => { setDraft({ ...draft, employee: id }); setOpenSelect(null); };
  const setSchedule = (id) => { setDraft({ ...draft, paySchedule: id }); setOpenSelect(null); };
  const setPreset = (id) => {
    if (id === "custom") {
      setDraft({ ...draft, datePreset: "custom" });
    } else {
      const c = computePreset(id);
      setDraft({ ...draft, datePreset: id, from: c.from, to: c.to });
    }
    setOpenSelect(null);
  };

  const apply = () => { onApply(draft); onClose(); };

  const anchorPos = anchor || { top: 56, left: 16 };
  const inputStyle = { width: "100%", padding: "7px 9px", paddingRight: 26, fontSize: 12, borderRadius: 5, border: "0.5px solid " + BORDER, fontFamily: "inherit", boxSizing: "border-box", color: TEXT_PRIMARY };
  const labelStyle = { fontSize: 10, color: TEXT_SECONDARY, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 };

  const isCustom = draft.datePreset === "custom";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "transparent", zIndex: 60 }} />
      <div
        ref={ref}
        style={{
          position: "absolute",
          top: anchorPos.top, left: anchorPos.left,
          width: 360,
          background: "white",
          border: "0.5px solid " + BORDER,
          borderRadius: 10,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          zIndex: 70,
          fontFamily: "inherit",
        }}
      >
        <div style={{ padding: "12px 14px 10px", borderBottom: "0.5px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>Filters</h3>
          <X size={14} style={{ color: TEXT_SECONDARY, cursor: "pointer" }} onClick={onClose} />
        </div>

        <div style={{ padding: "12px 14px" }}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Employee</label>
            <CustomSelect open={openSelect === "emp"} onToggle={() => setOpenSelect(openSelect === "emp" ? null : "emp")} label={employeeLabel}>
              <div style={{ position: "absolute", top: 38, left: 0, right: 0, background: "white", border: "0.5px solid " + BORDER, borderRadius: 6, padding: 4, zIndex: 5, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: 240, overflowY: "auto" }}>
                {EMPLOYEE_GROUPS.map((g) => (
                  <div key={g.id} onClick={() => setEmployee(g.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12, background: draft.employee === g.id ? BRAND_SOFT : "transparent" }}>
                    <Check size={11} style={{ color: draft.employee === g.id ? BRAND_DARK : "transparent" }} />
                    <span style={{ color: draft.employee === g.id ? BRAND_DARK : TEXT_PRIMARY, fontWeight: draft.employee === g.id ? 500 : 400 }}>{g.label}</span>
                  </div>
                ))}
                <div style={{ height: "0.5px", background: BORDER, margin: "4px 6px" }} />
                <div onClick={() => setEmployee("all")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                  <X size={11} style={{ color: TEXT_SECONDARY }} />
                  <span style={{ color: TEXT_SECONDARY }}>Clear selected</span>
                </div>
                <div style={{ height: "0.5px", background: BORDER, margin: "4px 6px" }} />
                {employees.map((e) => {
                  const last = (e.last_name || "").trim();
                  const first = (e.first_name || "").trim();
                  const label = last && first ? last + ", " + first : (e.name || e.email || "Unnamed");
                  const selected = draft.employee === e.id;
                  return (
                    <div key={e.id} onClick={() => setEmployee(e.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12, background: selected ? BRAND_SOFT : "transparent" }}>
                      <Check size={11} style={{ color: selected ? BRAND_DARK : "transparent" }} />
                      <span style={{ color: selected ? BRAND_DARK : TEXT_PRIMARY, fontWeight: selected ? 500 : 400 }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </CustomSelect>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Pay schedule</label>
            <CustomSelect open={openSelect === "sched"} onToggle={() => setOpenSelect(openSelect === "sched" ? null : "sched")} label={scheduleLabel}>
              <div style={{ position: "absolute", top: 38, left: 0, right: 0, background: "white", border: "0.5px solid " + BORDER, borderRadius: 6, padding: 4, zIndex: 5, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: 240, overflowY: "auto" }}>
                <div onClick={() => setSchedule("all")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12, background: draft.paySchedule === "all" ? BRAND_SOFT : "transparent" }}>
                  <Check size={11} style={{ color: draft.paySchedule === "all" ? BRAND_DARK : "transparent" }} />
                  <span style={{ color: draft.paySchedule === "all" ? BRAND_DARK : TEXT_PRIMARY, fontWeight: draft.paySchedule === "all" ? 500 : 400 }}>All pay schedules</span>
                </div>
                <div style={{ height: "0.5px", background: BORDER, margin: "4px 6px" }} />
                <div onClick={() => setSchedule("all")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                  <X size={11} style={{ color: TEXT_SECONDARY }} />
                  <span style={{ color: TEXT_SECONDARY }}>Clear selected</span>
                </div>
                <div style={{ height: "0.5px", background: BORDER, margin: "4px 6px" }} />
                {paySchedules.map((s) => {
                  const selected = draft.paySchedule === s.id;
                  return (
                    <div key={s.id} onClick={() => setSchedule(s.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12, background: selected ? BRAND_SOFT : "transparent" }}>
                      <Check size={11} style={{ color: selected ? BRAND_DARK : "transparent" }} />
                      <span style={{ color: selected ? BRAND_DARK : TEXT_PRIMARY, fontWeight: selected ? 500 : 400 }}>{s.name}</span>
                    </div>
                  );
                })}
              </div>
            </CustomSelect>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Date range</label>
            <CustomSelect open={openSelect === "preset"} onToggle={() => setOpenSelect(openSelect === "preset" ? null : "preset")} label={presetLabel}>
              <div style={{ position: "absolute", top: 38, left: 0, right: 0, background: "white", border: "0.5px solid " + BORDER, borderRadius: 6, padding: 4, zIndex: 5, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: 240, overflowY: "auto" }}>
                {DATE_PRESETS.map((p) => {
                  const selected = draft.datePreset === p.id;
                  return (
                    <div key={p.id} onClick={() => setPreset(p.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12, background: selected ? BRAND_SOFT : "transparent" }}>
                      <Check size={11} style={{ color: selected ? BRAND_DARK : "transparent" }} />
                      <span style={{ color: selected ? BRAND_DARK : TEXT_PRIMARY, fontWeight: selected ? 500 : 400 }}>{p.label}</span>
                    </div>
                  );
                })}
              </div>
            </CustomSelect>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={labelStyle}>From</label>
              <div style={{ position: "relative" }}>
                <input type="date" value={draft.from} disabled={!isCustom} onChange={(e) => setDraft({ ...draft, from: e.target.value })} style={{ ...inputStyle, background: isCustom ? "white" : "#F9FAFB", color: isCustom ? TEXT_PRIMARY : TEXT_SECONDARY }} />
                <Calendar size={12} style={{ color: "#9CA3AF", position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>To</label>
              <div style={{ position: "relative" }}>
                <input type="date" value={draft.to} disabled={!isCustom} onChange={(e) => setDraft({ ...draft, to: e.target.value })} style={{ ...inputStyle, background: isCustom ? "white" : "#F9FAFB", color: isCustom ? TEXT_PRIMARY : TEXT_SECONDARY }} />
                <Calendar size={12} style={{ color: "#9CA3AF", position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "10px 14px", borderTop: "0.5px solid #F3F4F6", display: "flex", justifyContent: "flex-end", gap: 6 }}>
          <button onClick={onClose} style={{ fontSize: 12, padding: "7px 14px", borderRadius: 5, background: "white", color: TEXT_PRIMARY, border: "0.5px solid " + BORDER, cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Cancel</button>
          <button onClick={apply} style={{ fontSize: 12, padding: "7px 14px", borderRadius: 5, background: BRAND, color: "white", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Apply</button>
        </div>
      </div>
    </>
  );
}
