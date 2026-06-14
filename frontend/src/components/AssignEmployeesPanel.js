import React, { useState, useEffect, useRef } from "react";
import { X, Search, Check } from "lucide-react";

const BRAND = "#0F9599";
const TEXT_PRIMARY = "#111827";
const TEXT_INK = "#1A2B2B";
const TEXT_SECONDARY = "#6B7280";
const TEXT_TERTIARY = "#9CA3AF";
const BG_CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const BORDER_LIGHT = "#F0F4F4";
const SUCCESS_TEXT = "#166534";

const employeeName = (e) => {
  if (!e) return "";
  const f = (e.first_name || "").trim();
  const l = (e.last_name || "").trim();
  if (l && f) return l + ", " + f;
  return e.full_name || e.name || e.email || "Unnamed";
};

function Checkbox({ checked, indeterminate, onClick }) {
  const on = checked || indeterminate;
  return (
    <span onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined} style={{ width: 18, height: 18, border: "1.6px solid " + (on ? BRAND : TEXT_TERTIARY), borderRadius: 5, background: on ? BRAND : "white", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: onClick ? "pointer" : "default", flex: "none" }}>
      {checked && <Check size={12} style={{ color: "white" }} />}
      {indeterminate && !checked && <span style={{ width: 9, height: 2, background: "white" }} />}
    </span>
  );
}

export default function AssignEmployeesPanel({
  open,
  onClose,
  eligible = [],
  subLineFn,
  onSave,
}) {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Active");
  const [locationFilter, setLocationFilter] = useState("All");
  const [selected, setSelected] = useState({});
  const filterRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelected({});
      setFilterOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!filterOpen) return;
    const onClick = (e) => {
      if (!filterRef.current || !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [filterOpen]);

  if (!open) return null;

  const filtered = eligible.filter(e => {
    if (!search) return true;
    return employeeName(e).toLowerCase().includes(search.toLowerCase());
  });

  const selCount = Object.values(selected).filter(Boolean).length;
  const allSelected = filtered.length > 0 && filtered.every(e => selected[e.id]);
  const someSelected = !allSelected && filtered.some(e => selected[e.id]);

  const toggle = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleAll = () => {
    if (allSelected) {
      const next = { ...selected };
      filtered.forEach(e => delete next[e.id]);
      setSelected(next);
    } else {
      const next = { ...selected };
      filtered.forEach(e => { next[e.id] = true; });
      setSelected(next);
    }
  };

  const handleSave = () => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (onSave) onSave(ids);
    onClose();
  };

  const subLine = (emp) => subLineFn ? subLineFn(emp) : "Semi-monthly, 15th and End of Month";

  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,40,0.28)", zIndex: 70 }} />
      <div style={{ position: "fixed", top: 0, right: 0, width: 480, maxWidth: "92vw", height: "100vh", background: BG_CARD, zIndex: 80, boxShadow: "-10px 0 40px rgba(20,40,40,0.16)", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "0.5px solid " + BORDER }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: TEXT_INK }}>Assign employee(s)</h3>
          <span onClick={onClose} style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 7, color: TEXT_SECONDARY, cursor: "pointer" }}>
            <X size={18} />
          </span>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, position: "relative" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, border: "0.5px solid " + BORDER, borderRadius: 9, padding: "9px 13px", fontSize: 14 }}>
              <Search size={16} style={{ color: TEXT_TERTIARY }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee" style={{ flex: 1, border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, color: TEXT_PRIMARY, background: "transparent" }} />
            </div>
            <div ref={filterRef} style={{ position: "relative" }}>
              <button onClick={() => setFilterOpen(!filterOpen)} style={{ background: BG_CARD, color: TEXT_PRIMARY, fontSize: 13.5, fontWeight: 600, padding: "9px 14px", border: "0.5px solid " + BORDER, borderRadius: 9, cursor: "pointer", fontFamily: "inherit" }}>
                Filters
              </button>
              {filterOpen && (
                <div style={{ position: "absolute", right: 0, top: 44, background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 10, boxShadow: "0 10px 30px rgba(20,40,40,0.16)", padding: 16, width: 260, zIndex: 90 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong style={{ fontSize: 15, color: TEXT_INK }}>Filters</strong>
                    <span onClick={() => setFilterOpen(false)} style={{ cursor: "pointer", color: TEXT_SECONDARY, display: "grid", placeItems: "center" }}><X size={16} /></span>
                  </div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY, margin: "10px 0 5px" }}>Employee status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "100%", border: "0.5px solid " + BORDER, borderRadius: 8, padding: "9px 10px", fontFamily: "inherit", fontSize: 13.5, color: TEXT_INK }}>
                    <option>All</option>
                    <option>Active</option>
                    <option>Paid leave of absence</option>
                    <option>Unpaid leave of absence</option>
                    <option>Terminated</option>
                    <option>Not on payroll</option>
                    <option>Deceased</option>
                  </select>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY, margin: "10px 0 5px" }}>Work location</label>
                  <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ width: "100%", border: "0.5px solid " + BORDER, borderRadius: 8, padding: "9px 10px", fontFamily: "inherit", fontSize: 13.5, color: TEXT_INK }}>
                    <option>All</option>
                    <option>49516 Range Road 174 (AB)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {eligible.length === 0 ? (
            <React.Fragment>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 2px", borderBottom: "0.5px solid " + BORDER }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: TEXT_SECONDARY }}>NAME</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: TEXT_SECONDARY }}>STATUS</span>
              </div>
              <div style={{ padding: "18px 2px" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: TEXT_INK }}>Your team is taken care of</h4>
                <p style={{ margin: 0, fontSize: 13.5, color: TEXT_SECONDARY }}>There aren't any employees eligible for this payroll item type.</p>
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 2px", borderBottom: "0.5px solid " + BORDER }}>
                <Checkbox checked={allSelected} indeterminate={someSelected} onClick={toggleAll} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: TEXT_SECONDARY }}>NAME</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: TEXT_SECONDARY }}>STATUS</span>
              </div>
              {filtered.map(emp => (
                <div key={emp.id} onClick={() => toggle(emp.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 2px", borderBottom: "0.5px solid " + BORDER_LIGHT, cursor: "pointer" }}>
                  <Checkbox checked={!!selected[emp.id]} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_INK }}>{employeeName(emp)}</div>
                    <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginTop: 2 }}>{subLine(emp)}</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 13, color: SUCCESS_TEXT, fontWeight: 600 }}>Active</span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: "18px 2px", color: TEXT_SECONDARY, fontSize: 13 }}>No employees match your search.</div>
              )}
            </React.Fragment>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, padding: "16px 22px", borderTop: "0.5px solid " + BORDER }}>
          <button onClick={onClose} style={{ background: "transparent", color: TEXT_SECONDARY, fontSize: 13.5, fontWeight: 600, padding: "9px 14px", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleSave} disabled={selCount === 0} style={{ background: BRAND, opacity: selCount > 0 ? 1 : 0.5, color: "white", fontSize: 14, fontWeight: 600, padding: "10px 18px", border: "none", borderRadius: 9, cursor: selCount > 0 ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            Save{selCount > 0 ? " (" + selCount + ")" : ""}
          </button>
        </div>

      </div>
    </React.Fragment>
  );
}
