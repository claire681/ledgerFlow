import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus, Bookmark, Home, Zap, BarChart2, Grid, Layers, MoreHorizontal,
  Sliders, LogOut, Search, Bell, Settings, HelpCircle, Users, Map,
  MessageCircle, X, Shield, Filter, Download, MoreVertical, ChevronDown,
  Check, FileText, Clock, CreditCard, Receipt, ArrowUp, ArrowDown, EyeOff,
  AlertTriangle, ArrowRight, Activity
} from "lucide-react";

/*
  RunPayroll.js
  Live Run payroll screen for Novala. Rebuilt to match the mockup
  (novala-run-payroll.html). Visual fidelity first: fetch + local edits are
  wired; deep actions (Edit paycheque, Preview pay stub, real Customize picker)
  are stubbed and clearly labelled for a second commit. Skip is client-side
  only until Preview. AI assistant is Nexa AI. No em dashes.
*/

const API = "https://api.getnovala.com";

// ----- tokens -----
const C = {
  brand: "#0F9599", brandDark: "#0B7377", brandDeep: "#0E4B4D", mint: "#2FE3BE",
  night: "#0E3B3A", ink: "#0C2724", text: "#2C3E3C", muted: "#5C706E",
  faint: "#8AA0A0", page: "#F4F8F8", line: "#E3ECEC", lineSoft: "#EEF4F4",
  amber: "#B7791F", amberBg: "#FBEAD2", danger: "#C0392B", tint: "#E6F5F5",
};
const FONT = "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif";
const PAY_METHODS = ["Direct deposit", "Paper cheque"];

// ----- money helpers -----
function formatMoneyLive(value) {
  const raw = String(value).replace(/[^0-9.]/g, "");
  const parts = raw.split(".");
  let intp = parts[0].replace(/^0+(?=\d)/, "");
  intp = intp.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  let out = intp;
  if (parts.length > 1) out += "." + parts[1].slice(0, 2);
  return out;
}
function formatMoneyBlur(value) {
  const raw = String(value).replace(/[^0-9.]/g, "");
  if (raw === "") return "0.00";
  const num = parseFloat(raw);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function money(n) {
  const num = typeof n === "number" ? n : parseFloat(String(n || 0).replace(/[^0-9.]/g, ""));
  return "$" + (isNaN(num) ? 0 : num).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function hrs(n) {
  const num = typeof n === "number" ? n : parseFloat(String(n || 0).replace(/[^0-9.]/g, ""));
  return (isNaN(num) ? 0 : num) + "h";
}

// ----- columns -----
const COLUMNS = [
  { key: "employees", label: "Employees", align: "left" },
  { key: "regular", label: "Regular pay", align: "center" },
  { key: "statHoliday", label: "Stat holiday pay", align: "center" },
  { key: "statPay", label: "Stat pay (avg)", align: "center" },
  { key: "totalHrs", label: "Total hrs", align: "center" },
  { key: "gross", label: "Gross pay", align: "center" },
  { key: "memo", label: "Memo", align: "center", menuRight: true },
  { key: "payMethod", label: "Pay method", align: "center", menuRight: true },
];

// ========================================================================
//  Editable cell
// ========================================================================
function EditableCell({ value, onChange, money: isMoney = false, suffix = "", rateHint = "" }) {
  const [focused, setFocused] = useState(false);
  const [hover, setHover] = useState(false);
  const inputRef = useRef(null);
  const showBox = focused || hover;

  const boxStyle = {
    display: "inline-flex", alignItems: "center", gap: 4,
    border: "1px solid " + (focused ? C.brand : showBox ? C.line : "transparent"),
    borderRadius: 9, padding: "10px 14px", minWidth: 118, justifyContent: "center",
    background: showBox ? "#fff" : "transparent", cursor: "text",
    boxShadow: focused ? "0 0 0 3px rgba(15,149,153,.12)" : "none",
    transition: "border-color .15s, box-shadow .15s, background .15s",
  };
  const inputStyle = {
    border: "none", outline: "none", font: "inherit", fontSize: 14, color: C.ink,
    width: isMoney ? 86 : 80, textAlign: isMoney ? "left" : "center",
    background: "transparent", MozAppearance: "textfield",
  };

  const handleChange = (e) => onChange(isMoney ? formatMoneyLive(e.target.value) : e.target.value);
  const handleBlur = () => { setFocused(false); if (isMoney) onChange(formatMoneyBlur(value)); };

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", height: "100%" }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span style={boxStyle} onClick={() => inputRef.current && inputRef.current.focus()}>
        {isMoney && <span style={{ color: C.muted, fontSize: 14 }}>$</span>}
        <input ref={inputRef} value={value} inputMode={isMoney ? "decimal" : "numeric"}
          onChange={handleChange} onFocus={() => setFocused(true)} onBlur={handleBlur}
          style={inputStyle} className="np-no-spin" />
        {suffix && <span style={{ fontSize: 14, color: C.ink }}>{suffix}</span>}
      </span>
      {rateHint && (
        <span style={{ position: "absolute", left: 0, right: 0, bottom: 8, textAlign: "center",
          fontSize: 11, color: C.faint }}>{rateHint}</span>
      )}
    </div>
  );
}

// ========================================================================
//  Memo popover
// ========================================================================
function MemoPopover({ anchorRect, name, initial, onSave, onClose }) {
  const [text, setText] = useState(initial || "");
  const [applyAll, setApplyAll] = useState(false);
  const popRef = useRef(null);
  const [pos, setPos] = useState({ left: -9999, top: -9999, arrowTop: 24 });

  useEffect(() => {
    if (!anchorRect || !popRef.current) return;
    const pw = 300;
    const ph = popRef.current.offsetHeight;
    let left = anchorRect.right + 10;
    if (left + pw > window.innerWidth - 12) left = anchorRect.left - pw - 10;
    let top = anchorRect.top + window.scrollY - ph / 2 + anchorRect.height / 2;
    if (top < window.scrollY + 12) top = window.scrollY + 12;
    if (top + ph > window.scrollY + window.innerHeight - 12) top = window.scrollY + window.innerHeight - ph - 12;
    const arrowTop = Math.min(Math.max(anchorRect.top + window.scrollY - top + anchorRect.height / 2 - 7, 16), ph - 24);
    setPos({ left: Math.max(12, left), top: Math.max(12, top), arrowTop });
  }, [anchorRect]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const onDown = (e) => { if (popRef.current && !popRef.current.contains(e.target)) onClose(); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [onClose]);

  return (
    <div ref={popRef} style={{ position: "absolute", left: pos.left, top: pos.top, width: 300, zIndex: 80,
      background: "#fff", border: "1px solid " + C.line, borderRadius: 14,
      boxShadow: "0 20px 50px rgba(8,32,31,.22)", padding: 18 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Memo</div>
      <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.4, marginBottom: 12 }}>
        {name} will see this on their pay stub.
      </div>
      <textarea autoFocus value={text} maxLength={250} onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", minHeight: 84, border: "1.5px solid " + C.brand, borderRadius: 10,
          padding: 10, font: "inherit", fontSize: 13.5, color: C.ink, resize: "vertical",
          outline: "none", boxSizing: "border-box" }} />
      <div style={{ fontSize: 12, color: C.muted, margin: "8px 0 12px" }}>{250 - text.length} characters left</div>
      <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: C.text,
        marginBottom: 16, cursor: "pointer" }}>
        <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)}
          style={{ width: 17, height: 17, accentColor: C.brand }} />
        Apply to all employees
      </label>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", font: "inherit",
          fontSize: 14, fontWeight: 700, color: C.ink, cursor: "pointer" }}>Cancel</button>
        <button onClick={() => onSave(text, applyAll)} style={{ background: C.night, color: "#fff",
          border: "none", borderRadius: 9, padding: "9px 22px", font: "inherit", fontSize: 14,
          fontWeight: 700, cursor: "pointer" }}>Save</button>
      </div>
      <div style={{ position: "absolute", width: 14, height: 14, background: "#fff",
        border: "1px solid " + C.line, borderRight: "none", borderTop: "none",
        transform: "rotate(45deg)", left: -7, top: pos.arrowTop }} />
    </div>
  );
}

// ========================================================================
//  Pay method select
// ========================================================================
function PayMethodSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const ref = useRef(null);
  const toggle = () => {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setUp(window.innerHeight - r.bottom < 110);
    }
    setOpen((o) => !o);
  };
  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);
  const menuPos = up ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block", width: 190 }}>
      <div onClick={toggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8, border: "1px solid " + (open ? C.brand : C.line), borderRadius: 9, padding: "11px 14px",
        fontSize: 13.5, color: C.ink, background: "#fff", cursor: "pointer",
        boxShadow: open ? "0 0 0 3px rgba(15,149,153,.12)" : "none" }}>
        {value}
        <ChevronDown size={15} color={C.muted}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
      </div>
      {open && (
        <div style={{ position: "absolute", left: 0, right: 0, background: "#fff",
          border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 16px 40px rgba(8,32,31,.18)",
          padding: 6, zIndex: 70, ...menuPos }}>
          {PAY_METHODS.map((m) => (
            <button key={m} onClick={() => { onChange(m); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                border: "none", background: "none", font: "inherit", fontSize: 13.5, color: C.ink,
                padding: "9px 10px", borderRadius: 7, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.page)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
              {m}
              <Check size={15} color={C.brand} style={{ visibility: value === m ? "visible" : "hidden" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ========================================================================
//  Row kebab menu
// ========================================================================
function RowMenu({ onAction }) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const ref = useRef(null);
  const toggle = () => {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setUp(window.innerHeight - r.bottom < 280);
    }
    setOpen((o) => !o);
  };
  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);
  const item = (Icon, label, danger) => (
    <button onClick={() => { onAction(label); setOpen(false); }}
      style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", border: "none",
        background: "none", font: "inherit", fontSize: 13.5, color: danger ? C.danger : C.ink,
        padding: "10px 11px", borderRadius: 8, cursor: "pointer", textAlign: "left" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.page)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
      <Icon size={16} color={danger ? C.danger : C.muted} />{label}
    </button>
  );
  return (
    <div ref={ref} style={{ position: "relative", width: 30, height: 30, borderRadius: 7,
      display: "grid", placeItems: "center", color: C.muted, cursor: "pointer", margin: "0 auto" }}>
      <div onClick={toggle} style={{ display: "grid", placeItems: "center" }}><MoreVertical size={17} /></div>
      {open && (
        <div style={{ position: "absolute", width: 230, background: "#fff", border: "1px solid " + C.line,
          borderRadius: 12, boxShadow: "0 18px 44px rgba(8,32,31,.20)", padding: 6, zIndex: 90, right: 6,
          ...(up ? { bottom: 36 } : { top: 36 }) }}>
          {item(FileText, "Edit paycheque")}
          {item(Clock, "Enter or edit hours")}
          {item(Plus, "Add memo")}
          {item(CreditCard, "Change pay method")}
          {item(Receipt, "Preview pay stub")}
          <div style={{ height: 1, background: C.lineSoft, margin: "6px 4px" }} />
          {item(X, "Skip from this payroll run", true)}
        </div>
      )}
    </div>
  );
}

// ========================================================================
//  Column header menu
// ========================================================================
function ColumnHeader({ col, onAction }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);
  const item = (Icon, label) => (
    <button onClick={() => { onAction(col.key, label); setOpen(false); }}
      style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", border: "none",
        background: "none", font: "inherit", fontSize: 13, fontWeight: 600, color: C.ink,
        padding: "9px 10px", borderRadius: 8, cursor: "pointer", textAlign: "left" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.page)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
      <Icon size={15} color={C.muted} />{label}
    </button>
  );
  return (
    <div ref={ref} style={{ position: "relative", textAlign: col.align, display: "flex",
      justifyContent: col.align === "left" ? "flex-start" : "center" }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span onClick={() => setOpen((o) => !o)} style={{ display: "inline-flex", alignItems: "center",
        gap: 6, cursor: "pointer", userSelect: "none" }}>
        {col.label}
        <ChevronDown size={14} style={{ opacity: hover || open ? 1 : 0,
          color: open ? C.brandDark : C.muted, transition: "opacity .15s" }} />
      </span>
      {open && (
        <div style={{ position: "absolute", top: 30, width: 200, background: "#fff",
          border: "1px solid " + C.line, borderRadius: 11, boxShadow: "0 18px 44px rgba(8,32,31,.20)",
          padding: 6, zIndex: 95, textTransform: "none", letterSpacing: "normal",
          ...(col.menuRight ? { right: 8 } : { left: 8 }) }}>
          {item(ArrowUp, "Sort ascending")}
          {item(ArrowDown, "Sort descending")}
          <div style={{ height: 1, background: C.lineSoft, margin: "5px 4px" }} />
          {item(EyeOff, "Hide column")}
          {item(Sliders, "Customize")}
        </div>
      )}
    </div>
  );
}

// ========================================================================
//  Sidebar
// ========================================================================
function Sidebar() {
  const items = [
    [Plus, "Create"], [Bookmark, "Bookmarks"], [Home, "Home", true],
    [Zap, "Feed"], [BarChart2, "Reports"], [Grid, "All Apps"],
  ];
  const pinned = [[Layers, "Accounting"], [MoreHorizontal, "More"], [Sliders, "Customize"]];
  const link = (Icon, label, active) => (
    <a key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      width: 68, padding: "9px 0", borderRadius: 11, color: active ? C.brandDark : C.muted,
      fontSize: 10.5, fontWeight: 600, cursor: "pointer", background: active ? C.tint : "transparent" }}>
      <Icon size={20} />{label}
    </a>
  );
  return (
    <aside style={{ background: "#fff", borderRight: "1px solid " + C.line, display: "flex",
      flexDirection: "column", alignItems: "center", padding: "14px 0", gap: 2, overflowY: "auto" }}>
      <div style={{ width: 40, height: 40, borderRadius: 11,
        background: "linear-gradient(140deg, " + C.brand + ", " + C.brandDeep + ")", display: "grid",
        placeItems: "center", marginBottom: 14 }}>
        <Activity size={22} color="#fff" />
      </div>
      {items.map(([I, l, a]) => link(I, l, a))}
      <div style={{ fontSize: 9, letterSpacing: ".08em", color: C.faint, margin: "10px 0 2px", fontWeight: 800 }}>PINNED</div>
      {pinned.map(([I, l]) => link(I, l))}
      <div style={{ flex: 1 }} />
      {link(LogOut, "Sign Out")}
    </aside>
  );
}

// ========================================================================
//  Main
// ========================================================================
export default function RunPayroll() {
  const { payRunId } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [memo, setMemo] = useState(null);
  const [hidden, setHidden] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    fetch(API + "/api/v1/payroll/runs/" + payRunId, { headers: { Authorization: "Bearer " + token } })
      .then((r) => { if (!r.ok) throw new Error("Could not load this payroll run."); return r.json(); })
      .then((data) => {
        setRun(data);
        setRows((data.lines || []).map((l) => ({
          id: l.employeeId,
          name: l.displayName,
          type: l.payTypeLabel || "Hourly",
          ready: l.setupComplete !== false,
          setupMissing: l.setupMissing || [],
          regular: String(l.regularHours != null ? l.regularHours : 0),
          statHoliday: String(l.statHolidayHours != null ? l.statHolidayHours : 0),
          statPay: formatMoneyBlur(l.statAvgPay != null ? l.statAvgPay : 0),
          rateHint: l.rate != null ? money(l.rate) + "/hr" : "",
          payMethod: l.payMethod || "Direct deposit",
          memo: l.memo || "",
          hoursSource: l.hoursSource || null,
          skipped: false,
        })));
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [payRunId]);

  const update = (id, field, value) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const activeRows = rows.filter((r) => r.ready && !r.skipped);
  const totalHours = activeRows.reduce((s, r) => s + (parseFloat(r.regular) || 0) + (parseFloat(r.statHoliday) || 0), 0);
  const totalStatHoliday = activeRows.reduce((s, r) => s + (parseFloat(r.statHoliday) || 0), 0);
  const totalRegular = activeRows.reduce((s, r) => s + (parseFloat(r.regular) || 0), 0);
  const grossOf = (r) => (parseFloat(r.regular) || 0) * (parseFloat(String(r.rateHint).replace(/[^0-9.]/g, "")) || 0)
    + (parseFloat(String(r.statPay).replace(/[^0-9.]/g, "")) || 0);
  const totalGross = activeRows.reduce((s, r) => s + grossOf(r), 0);
  const selectedCount = activeRows.length;

  const visibleCols = COLUMNS.filter((c) => !hidden[c.key]);
  const widthFor = (k) => k === "employees" ? "2.2fr" : k === "memo" ? "70px" : k === "payMethod" ? "1.7fr"
    : (k === "statHoliday" || k === "totalHrs") ? "1fr" : "1.2fr";
  const gridCols = visibleCols.map((c) => widthFor(c.key)).join(" ") + " 44px";

  const sortRows = (key, dir) => setRows((rs) => [...rs].sort((a, b) => {
    const get = (r) => key === "employees" ? r.name : key === "gross" ? grossOf(r)
      : key === "totalHrs" ? (parseFloat(r.regular) || 0) + (parseFloat(r.statHoliday) || 0)
      : r[key === "regular" ? "regular" : key === "statHoliday" ? "statHoliday" : "statPay"];
    const av = get(a), bv = get(b);
    const an = parseFloat(String(av).replace(/[^0-9.]/g, "")), bn = parseFloat(String(bv).replace(/[^0-9.]/g, ""));
    if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  }));
  const handleColAction = (key, action) => {
    if (action === "Sort ascending") sortRows(key, 1);
    else if (action === "Sort descending") sortRows(key, -1);
    else if (action === "Hide column") setHidden((h) => ({ ...h, [key]: true }));
    else if (action === "Customize") window.alert("Column picker is coming in the next update.");
  };
  const handleRowAction = (rowId, name, action) => {
    if (action === "Skip from this payroll run") { update(rowId, "skipped", true); return; }
    if (action === "Add memo") { const r = rows.find((x) => x.id === rowId); setMemo({ id: rowId, name, initial: r ? r.memo : "", rect: { right: window.innerWidth - 360, left: window.innerWidth - 390, top: 200, height: 30 } }); return; }
    window.alert("\"" + action + "\" is coming in the next update.");
  };
  const saveMemo = (text, applyAll) => {
    if (applyAll) setRows((rs) => rs.map((r) => ({ ...r, memo: text })));
    else update(memo.id, "memo", text);
    setMemo(null);
  };

  const ghostBtn = { border: "1px solid " + C.line, background: "#fff", borderRadius: 10,
    padding: "11px 20px", font: FONT, fontWeight: 700, fontSize: 14, color: C.ink, cursor: "pointer" };
  const cell = { padding: 14, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" };
  const numCell = { ...cell, textAlign: "center", alignItems: "center", justifyContent: "center" };
  const toolBtn = { display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid " + C.line,
    background: "#fff", borderRadius: 10, padding: "9px 14px", font: FONT, fontSize: 13.5,
    fontWeight: 700, color: C.ink, cursor: "pointer" };

  const needsSetupCount = rows.filter((r) => !r.ready).length;
  const reviewCount = rows.filter((r) => r.ready && (parseFloat(r.regular) || 0) === 0 && (parseFloat(r.statHoliday) || 0) === 0).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", font: FONT,
      color: C.text, background: "#fff" }}>
      <style>{".np-no-spin::-webkit-inner-spin-button,.np-no-spin::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}"}</style>
        {/* run header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 26px", borderBottom: "1px solid " + C.lineSoft }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: C.ink }}>Run payroll</h1>
          <span style={{ background: C.tint, color: C.brandDark, fontSize: 12.5, fontWeight: 700,
            padding: "5px 12px", borderRadius: 20 }}>{run ? run.frequency || "Semi-monthly" : "Semi-monthly"}</span>
          <span style={{ fontSize: 13.5, color: C.muted }}>{run ? run.scheduleDetail || "15th and end of month" : "15th and end of month"}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 20, color: C.muted, fontSize: 13.5, fontWeight: 600, alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><Map size={16} />Take a tour</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><MessageCircle size={16} />Give feedback</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><HelpCircle size={16} />Help</span>
            <span style={{ cursor: "pointer" }} onClick={() => navigate(-1)}><X size={16} /></span>
          </div>
        </div>

        {/* scroll */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 26px 90px" }}>
          {loading && <div style={{ padding: 40, color: C.muted }}>Loading payroll run...</div>}
          {error && <div style={{ padding: 40, color: C.danger }}>{error}</div>}

          {!loading && !error && (
            <>
              {/* readiness */}
              <div style={{ border: "1px solid " + C.line, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Shield size={20} color={C.brand} />
                  <b style={{ fontSize: 16, color: C.ink, fontWeight: 800 }}>Payroll readiness</b>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    {needsSetupCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 11px", borderRadius: 20, background: C.amberBg, color: C.amber }}>{needsSetupCount} needs setup</span>}
                    {reviewCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 11px", borderRadius: 20, background: C.amberBg, color: C.amber }}>{reviewCount} to review</span>}
                  </div>
                </div>
                {rows.filter((r) => !r.ready).map((r) => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: C.muted, padding: "5px 0" }}>
                    <span>{r.name} needs {(r.setupMissing && r.setupMissing.length ? r.setupMissing.join(", ") : "pay types, a payment method")}.</span>
                    <a style={{ color: C.brandDark, fontWeight: 700, cursor: "pointer" }}>Finish setup</a>
                  </div>
                ))}
                {rows.filter((r) => r.ready && (parseFloat(r.regular) || 0) === 0 && (parseFloat(r.statHoliday) || 0) === 0).map((r) => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: C.muted, padding: "5px 0" }}>
                    <span>{r.name} has no hours entered for this period.</span>
                    <a style={{ color: C.brandDark, fontWeight: 700, cursor: "pointer" }}>Add hours</a>
                  </div>
                ))}
              </div>

              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 22 }}>
                {[["Employees in this run", selectedCount + " of " + rows.length],
                  ["Total hours", String(Math.round(totalHours * 100) / 100)],
                  ["Total gross pay", money(totalGross)]].map(([l, v]) => (
                  <div key={l} style={{ border: "1px solid " + C.line, borderRadius: 14, padding: "18px 20px" }}>
                    <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 8 }}>{l}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: C.ink }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* toolbar */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <button style={toolBtn}><Filter size={15} />Filters</button>
                <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid " + C.line,
                  borderRadius: 10, padding: "9px 14px", color: C.muted, fontSize: 13.5, minWidth: 240 }}>
                  <Search size={15} />Search employees
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
                  <button style={toolBtn}><Download size={15} />Export</button>
                  <button style={toolBtn}><Settings size={15} />Customize</button>
                </div>
              </div>

              {/* hidden columns note */}
              {Object.keys(hidden).some((k) => hidden[k]) && (
                <div style={{ marginBottom: 12, fontSize: 13, color: C.muted }}>
                  {Object.keys(hidden).filter((k) => hidden[k]).length} columns hidden.{" "}
                  <a style={{ color: C.brandDark, fontWeight: 700, cursor: "pointer" }} onClick={() => setHidden({})}>Show all</a>
                </div>
              )}

              {/* table */}
              <div style={{ border: "1px solid " + C.line, borderRadius: 14, overflow: "visible" }}>
                <div style={{ display: "grid", gridTemplateColumns: gridCols, alignItems: "center",
                  background: C.page, borderBottom: "1px solid " + C.line, fontSize: 11.5, fontWeight: 800,
                  letterSpacing: ".04em", color: C.muted, textTransform: "uppercase" }}>
                  {visibleCols.map((col) => (
                    <div key={col.key} style={{ padding: "14px 14px" }}>
                      <ColumnHeader col={{ ...col, label: col.key === "employees" ? "Employees \u00b7 " + selectedCount + " of " + rows.length : col.label }} onAction={handleColAction} />
                    </div>
                  ))}
                  <div />
                </div>

                {rows.map((r) => (
                  <div key={r.id} style={{ display: "grid", gridTemplateColumns: gridCols, alignItems: "stretch",
                    borderBottom: "1px solid " + C.lineSoft, position: "relative", minHeight: 84,
                    opacity: r.skipped ? 0.5 : 1 }}>
                    <div style={cell}>
                      <span style={{ fontWeight: 700, color: C.brandDark, fontSize: 14.5, cursor: "pointer" }}>{r.name}</span>
                      <span style={{ fontSize: 12.5, color: C.muted }}>{r.type}</span>
                      {!r.ready && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.amberBg,
                          color: C.amber, fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 8,
                          marginTop: 4, width: "fit-content" }}>
                          <AlertTriangle size={13} />Needs setup
                        </span>
                      )}
                    </div>

                    {!r.ready ? (
                      <div style={{ ...cell, gridColumn: "2 / " + (visibleCols.length + 1), justifyContent: "center" }}>
                        <span style={{ fontSize: 13.5, color: C.muted }}>
                          To pay {r.name.split(",")[0]}, you need to enter Personal info, Pay types and Payment method.{" "}
                          <a style={{ color: C.brandDark, fontWeight: 700, cursor: "pointer" }}>Finish setup</a>
                        </span>
                      </div>
                    ) : (
                      <>
                        {!hidden.regular && (
                          <div style={numCell}>
                            <EditableCell value={r.regular} suffix="h" rateHint={r.rateHint}
                              onChange={(v) => update(r.id, "regular", v)} />
                          </div>
                        )}
                        {!hidden.statHoliday && (
                          <div style={numCell}>
                            <EditableCell value={r.statHoliday} suffix="h"
                              onChange={(v) => update(r.id, "statHoliday", v)} />
                          </div>
                        )}
                        {!hidden.statPay && (
                          <div style={numCell}>
                            <EditableCell value={r.statPay} money
                              onChange={(v) => update(r.id, "statPay", v)} />
                          </div>
                        )}
                        {!hidden.totalHrs && (
                          <div style={{ ...numCell, fontSize: 14, color: C.text }}>
                            {hrs((parseFloat(r.regular) || 0) + (parseFloat(r.statHoliday) || 0))}
                            {r.hoursSource && r.hoursSource.type === "visits" && (
                              <span style={{ display: "block", fontSize: 11, color: C.brandDark, marginTop: 2, cursor: "pointer" }}>
                                from {r.hoursSource.visitCount} visits
                              </span>
                            )}
                          </div>
                        )}
                        {!hidden.gross && <div style={{ ...numCell, fontSize: 14, color: C.text }}>{money(grossOf(r))}</div>}
                        {!hidden.memo && (
                          <div style={cell}>
                            {r.memo ? (
                              <span style={{ fontSize: 12.5, color: C.text, maxWidth: 130 }}>{r.memo}</span>
                            ) : (
                              <button onClick={(e) => setMemo({ id: r.id, name: r.name, initial: r.memo,
                                rect: e.currentTarget.getBoundingClientRect() })}
                                style={{ width: 30, height: 30, borderRadius: 8, border: "1px dashed " + C.line,
                                  background: "#fff", display: "grid", placeItems: "center", cursor: "pointer",
                                  color: C.muted, margin: "0 auto" }}>
                                <Plus size={15} />
                              </button>
                            )}
                          </div>
                        )}
                        {!hidden.payMethod && (
                          <div style={cell}>
                            <PayMethodSelect value={r.payMethod} onChange={(v) => update(r.id, "payMethod", v)} />
                          </div>
                        )}
                      </>
                    )}

                    <div style={cell}>
                      <RowMenu onAction={(action) => handleRowAction(r.id, r.name, action)} />
                    </div>
                  </div>
                ))}

                {/* total */}
                <div style={{ display: "grid", gridTemplateColumns: gridCols, alignItems: "center",
                  background: C.page, fontWeight: 800, color: C.ink }}>
                  <div style={{ padding: "16px 14px" }}>Total</div>
                  {!hidden.regular && <div style={{ padding: "16px 14px", textAlign: "center" }}>{hrs(totalRegular)}</div>}
                  {!hidden.statHoliday && <div style={{ padding: "16px 14px", textAlign: "center" }}>{hrs(totalStatHoliday)}</div>}
                  {!hidden.statPay && <div style={{ padding: "16px 14px", textAlign: "center" }}>{money(activeRows.reduce((s, r) => s + (parseFloat(String(r.statPay).replace(/[^0-9.]/g, "")) || 0), 0))}</div>}
                  {!hidden.totalHrs && <div style={{ padding: "16px 14px", textAlign: "center" }}>{hrs(totalHours)}</div>}
                  {!hidden.gross && <div style={{ padding: "16px 14px", textAlign: "center" }}>{money(totalGross)}</div>}
                  {!hidden.memo && <div />}
                  {!hidden.payMethod && <div />}
                  <div />
                </div>
              </div>
            </>
          )}
        </div>

        {/* footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 26px",
          borderTop: "1px solid " + C.line, background: "#fff" }}>
          <button style={ghostBtn} onClick={() => navigate(-1)}>Cancel</button>
          <span style={{ marginLeft: "auto", fontSize: 13.5, color: C.muted }}>{selectedCount} of {rows.length} employees selected</span>
          <button style={ghostBtn}>Save for later</button>
          <button style={{ background: C.brand, color: "#fff", border: "none", borderRadius: 10,
            padding: "11px 24px", font: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 8 }}>
            Preview for {selectedCount} employees <ArrowRight size={16} />
          </button>
        </div>

      {memo && (
        <MemoPopover anchorRect={memo.rect} name={memo.name} initial={memo.initial}
          onSave={saveMemo} onClose={() => setMemo(null)} />
      )}
    </div>
  );
}
