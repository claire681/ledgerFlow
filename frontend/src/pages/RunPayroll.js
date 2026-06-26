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
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeTab, setCustomizeTab] = useState("sort");
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [density, setDensity] = useState("normal");
  const [stripe, setStripe] = useState(false);
  const [hideSkipped, setHideSkipped] = useState(false);
  const [onlyWithHours, setOnlyWithHours] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [payDate, setPayDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterPayMethod, setFilterPayMethod] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const [filterEmpType, setFilterEmpType] = useState([]);
  const [filterPosition, setFilterPosition] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [frequency, setFrequency] = useState("Semi-monthly");
  const [freqOpen, setFreqOpen] = useState(false);
  const [exportChecked, setExportChecked] = useState(true);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [tourTargetRect, setTourTargetRect] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const TOUR_STEPS = [
    { id: null, title: "Welcome to Run Payroll", body: "This is where you turn employee hours into paycheques. Let's quickly walk through what each part of the page does." },
    { id: "tour-pay-period", title: "Pick your pay period", body: "Click the date to scroll through past and upcoming pay periods. The current one is checkmarked. Next pay date is the day employees see the deposit." },
    { id: "tour-readiness", title: "Setup status", body: "The readiness card tells you who is good to go and who still needs setup. Yellow means setup is incomplete; teal means everyone is ready." },
    { id: "tour-kpis", title: "Run totals", body: "The KPI cards above the table update live as you enter hours so you always know where the run stands." },
    { id: "tour-table", title: "Enter hours", body: "Click any cell in the table to edit. Tick the checkbox to include or skip an employee. Use the row menu for pay method and memo." },
    { id: "tour-toolbar", title: "Find and filter", body: "Search by name or position. Narrow the list with Filters. Hide rows or columns with Customize. Download with Export." },
    { id: "tour-footer", title: "Preview and finalize", body: "When the numbers look right, hit Preview in the sticky footer to review, then Finalize to lock the run." }
  ];

  useEffect(() => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    const auth = { headers: { Authorization: "Bearer " + token } };
    Promise.all([
      fetch(API + "/api/v1/payroll/runs/" + payRunId, auth).then((r) => {
        if (!r.ok) throw new Error("Could not load pay run (HTTP " + r.status + ").");
        return r.json();
      }),
      fetch(API + "/api/v1/payroll/employees", auth).then((r) => {
        if (!r.ok) throw new Error("Could not load employees (HTTP " + r.status + ").");
        return r.json();
      }),
    ])
      .then(([runData, empResp]) => {
        console.log("[RunPayroll] run:", runData);
        console.log("[RunPayroll] employees:", empResp);
        const data = runData && runData.data ? runData.data : runData;
        const empArr = Array.isArray(empResp) ? empResp : (empResp.items || empResp.data || []);
        setRun(data);
        setPeriodStart(data.pay_period_start || "");
        setPeriodEnd(data.pay_period_end || "");
        setPayDate(data.pay_date || "");
        const pick = (o, ...keys) => {
          for (const k of keys) { if (o && o[k] !== undefined && o[k] !== null) return o[k]; }
          return undefined;
        };
        const linesByEmp = {};
        const linesArr = data.lines || data.pay_lines || data.pay_run_lines || data.entries || data.items || [];
        linesArr.forEach((ln) => {
          const eid = pick(ln, "employee_id", "employeeId");
          if (eid) linesByEmp[eid] = ln;
        });
        setRows(empArr.map((e) => {
          const eid = pick(e, "id", "employee_id", "employeeId");
          const line = linesByEmp[eid] || {};
          const first = pick(e, "preferred_name", "first_name", "firstName") || "";
          const last = pick(e, "last_name", "lastName") || "";
          const fullName = (last && first) ? (last + ", " + first) : (first || last || "Unnamed");
          const rate = pick(e, "hourly_rate", "pay_rate", "rate", "hourlyRate", "payRate");
          const empType = pick(e, "employment_type", "pay_type", "payType");
          return {
            id: eid || "",
            name: fullName,
            type: empType === "salaried" ? "Salaried" : "Hourly",
            position: pick(e, "position_title", "position") || "",
            empType: empType || "",
            ready: pick(e, "setup_complete", "setupComplete") !== false,
            setupMissing: pick(e, "setup_missing", "setupMissing") || [],
            regular: String(pick(line, "regular_hours", "regularHours") != null ? pick(line, "regular_hours", "regularHours") : 0),
            statHoliday: String(pick(line, "stat_holiday_hours", "statHolidayHours") != null ? pick(line, "stat_holiday_hours", "statHolidayHours") : 0),
            statPay: formatMoneyBlur(pick(line, "stat_avg_pay", "statAvgPay") != null ? pick(line, "stat_avg_pay", "statAvgPay") : 0),
            rateHint: rate != null ? money(rate) + "/hr" : "",
            payMethod: pick(line, "pay_method", "payMethod") || pick(e, "default_pay_method", "pay_method") || "Direct deposit",
            memo: pick(line, "memo") || "",
            hoursSource: pick(line, "hours_source", "hoursSource") || null,
            skipped: false,
          };
        }));
        setLoading(false);
      })
      .catch((e) => { console.error("[RunPayroll] fetch error:", e); setError(e.message); setLoading(false); });
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
  const readyRows = rows.filter((r) => r.ready);
  const allSelected = readyRows.length > 0 && readyRows.every((r) => !r.skipped);
  const someSelected = readyRows.some((r) => !r.skipped);
  const indeterminate = someSelected && !allSelected;
  const toggleAll = (checked) => setRows((rs) => rs.map((r) => r.ready ? { ...r, skipped: !checked } : r));

  const densityHeight = density === "compact" ? 60 : density === "comfortable" ? 100 : 84;

  const SORT_VAL = {
    employees: (r) => (r.name || "").toLowerCase(),
    regular: (r) => parseFloat(r.regular) || 0,
    statHoliday: (r) => parseFloat(r.statHoliday) || 0,
    statPay: (r) => parseFloat(String(r.statPay).replace(/[^0-9.]/g, "")) || 0,
    totalHrs: (r) => (parseFloat(r.regular) || 0) + (parseFloat(r.statHoliday) || 0),
    gross: (r) => grossOf(r),
    memo: (r) => (r.memo || "").toLowerCase(),
    payMethod: (r) => r.payMethod || ""
  };
  
  // Filter rows by selected pay frequency (uses employee.pay_schedule if present)
  
  function matchesAllFilters(r) {
    if (!matchesFrequency(r)) return false;
    if (filterPayMethod.length > 0 && !filterPayMethod.includes(r.payMethod || "")) return false;
    if (filterStatus.length > 0) {
      const st = r.skipped ? "Skipped" : (r.ready ? "Ready" : "Needs setup");
      if (!filterStatus.includes(st)) return false;
    }
    if (filterEmpType.length > 0 && !filterEmpType.includes(r.employmentType || r.employment_type || "")) return false;
    if (filterPosition && !((r.position || r.title || "").toLowerCase().includes(filterPosition.toLowerCase()))) return false;
    return true;
  }

  function matchesFrequency(r) {
    if (!frequency) return true;
    const p = (r.pay_schedule || r.paySchedule || "").toLowerCase();
    if (!p) return true; // unknown frequency: include everywhere
    const norm = frequency.toLowerCase().replace(/[- ]/g, "_");
    return p === norm || p.replace(/[- ]/g, "_") === norm;
  }
  const sortedRows = sortKey && SORT_VAL[sortKey] ? rows.filter(matchesAllFilters).sort((a, b) => {
    const va = SORT_VAL[sortKey](a), vb = SORT_VAL[sortKey](b);
    const factor = sortDir === "desc" ? -1 : 1;
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * factor;
    if (va < vb) return -1 * factor;
    if (va > vb) return 1 * factor;
    return 0;
  }) : rows.filter(matchesAllFilters);
  const displayRows = sortedRows.filter((r) => {
    if (hideSkipped && r.skipped) return false;
    if (onlyWithHours && (parseFloat(r.regular) || 0) === 0 && (parseFloat(r.statHoliday) || 0) === 0) return false;
    if (filterPayMethod.length > 0 && !filterPayMethod.includes(r.payMethod)) return false;
    if (filterStatus.length > 0) {
      const st = !r.ready ? "needs" : r.skipped ? "skipped" : "ready";
      if (!filterStatus.includes(st)) return false;
    }
    if (filterEmpType.length > 0 && !filterEmpType.includes(r.empType)) return false;
    if (filterPosition && r.position !== filterPosition) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const hay = ((r.name || "") + " " + (r.position || "")).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
  const distinctPositions = Array.from(new Set(rows.map((r) => r.position).filter(Boolean))).sort();
  const payMethodCount = (pm) => rows.filter((r) => r.payMethod === pm).length;
  const statusCount = (st) => rows.filter((r) => st === "needs" ? !r.ready : st === "skipped" ? r.skipped : (r.ready && !r.skipped)).length;
  const empTypeCount = (et) => rows.filter((r) => r.empType === et).length;
  const positionCount = (p) => rows.filter((r) => r.position === p).length;
  const clearFilters = () => { setFilterPayMethod([]); setFilterStatus([]); setFilterEmpType([]); setFilterPosition(""); };
  const filtersApplied = filterPayMethod.length + filterStatus.length + filterEmpType.length + (filterPosition ? 1 : 0);
  const previewRun = async () => {
    if (previewing) return;
    const inputs = rows
      .filter((r) => r.ready && !r.skipped)
      .map((r) => ({
        employee_id: r.id,
        regular_hours: parseFloat(r.regular) || 0,
        stat_holiday_hours: parseFloat(r.statHoliday) || 0,
        stat_pay_amount: parseFloat(String(r.statPay == null ? "" : r.statPay).replace(/[^0-9.]/g, "")) || 0,
        payment_method: r.payMethod,
        memo: r.memo || ""
      }));
    if (inputs.length === 0) {
      window.alert("No employees ready to pay. Tick at least one ready employee in the table first.");
      return;
    }
    setPreviewing(true);
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
      const res = await fetch(API + "/api/v1/payroll/runs/" + payRunId + "/calculate", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ employee_inputs: inputs })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        window.alert("Could not calculate payroll. HTTP " + res.status + (errText ? ": " + errText.slice(0, 300) : ""));
        setPreviewing(false);
        return;
      }
      const calculation = await res.json().catch(() => ({}));
      navigate("/payroll/run/" + payRunId + "/preview", {
        state: {
          calculation: calculation,
          inputs: inputs,
          rows: rows.filter((r) => r.ready && !r.skipped).map((r) => ({
            id: r.id,
            name: r.name,
            regular: parseFloat(r.regular) || 0,
            statHoliday: parseFloat(r.statHoliday) || 0,
            statPay: parseFloat(String(r.statPay == null ? "" : r.statPay).replace(/[^0-9.]/g, "")) || 0,
            payMethod: r.payMethod,
            memo: r.memo || "",
            rate: parseFloat(String(r.rateHint == null ? "" : r.rateHint).replace(/[^0-9.]/g, "")) || 0,
            empType: r.empType,
            position: r.position
          }))
        }
      });
    } catch (e) {
      window.alert("Network error: " + ((e && e.message) ? e.message : String(e)));
      setPreviewing(false);
    }
  };

  const customizeDefaults = () => {
    setSortKey(""); setSortDir("asc"); setDensity("normal"); setStripe(false);
    setHideSkipped(false); setOnlyWithHours(false); setHidden({});
  };

  const formatPeriodLabel = (start, end) => {
    const f = (s) => { if (!s) return ""; const p = s.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };
    return f(start) + " to " + f(end);
  };
  const periodOptions = (() => {
    const list = [];
    const now = new Date();
    for (let off = -6; off <= 2; off++) {
      const m = now.getMonth() + off;
      const year = now.getFullYear() + Math.floor(m / 12);
      const monthInYear = ((m % 12) + 12) % 12;
      const mm = String(monthInYear + 1).padStart(2, "0");
      const lastDay = new Date(year, monthInYear + 1, 0).getDate();
      list.push({ start: year + "-" + mm + "-01", end: year + "-" + mm + "-14" });
      list.push({ start: year + "-" + mm + "-15", end: year + "-" + mm + "-" + String(lastDay).padStart(2, "0") });
    }
    list.sort((a, b) => b.start.localeCompare(a.start));
    return list;
  })();

  const exportCSV = () => {
    const targets = exportChecked ? displayRows.filter((r) => !r.skipped && r.ready) : displayRows;
    const header = ["Employee", "Position", "Pay method", "Regular hours", "Stat holiday hours", "Stat pay (avg)", "Total hours", "Gross pay", "Memo"];
    const esc = (v) => {
      const s = String(v == null ? "" : v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [header.map(esc).join(",")];
    targets.forEach((r) => {
      const total = (parseFloat(r.regular) || 0) + (parseFloat(r.statHoliday) || 0);
      const gross = grossOf(r);
      lines.push([r.name, r.position, r.payMethod, r.regular, r.statHoliday, r.statPay, total, gross.toFixed(2), r.memo].map(esc).join(","));
    });
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payroll-run-" + (payDate || "current") + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };
  const exportXLSX = () => {
    try {
      const rowsToExport = sortedRows.filter(r => !r.skipped || exportChecked === false);
      const data = rowsToExport.map(r => ({
        Employee: r.name || "",
        Position: r.position || r.title || "",
        "Regular hours": parseFloat(r.regular) || 0,
        "Stat holiday hours": parseFloat(r.statHoliday) || 0,
        "Pay method": r.payMethod || "",
        "Pay rate": r.payRate || "",
        Gross: grossOf(r),
        Memo: r.memo || "",
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payroll");
      const fname = "novala-payroll-" + (run?.payDate || new Date().toISOString().slice(0,10)) + ".xlsx";
      XLSX.writeFile(wb, fname);
      setExportOpen(false);
    } catch (err) {
      window.alert("Excel export failed: " + err.message);
    }
  };
  const exportPDF = () => {
    setExportOpen(false);
    setTimeout(() => {
      const printWindow = window.open("", "_blank");
      if (!printWindow) { window.alert("Pop-ups blocked. Allow pop-ups to export PDF."); return; }
      const rowsToExport = sortedRows.filter(r => !r.skipped || exportChecked === false);
      const html = `
        <html><head><title>Payroll Report - ${run?.payDate || ""}</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 30px; color: #1B2533; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .sub { color: #66748B; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
          th { background: #F4F6F8; text-align: left; padding: 9px 11px; border-bottom: 1px solid #E7EAF0; font-weight: 600; }
          td { padding: 8px 11px; border-bottom: 1px solid #F1F3F7; }
          .num { text-align: right; font-variant-numeric: tabular-nums; }
          .footer { margin-top: 22px; color: #94A0B2; font-size: 11.5px; }
        </style></head>
        <body>
          <h1>Payroll Report</h1>
          <div class="sub">Pay date: ${run?.payDate || "Draft"} &nbsp;&nbsp; Frequency: ${frequency || ""}</div>
          <table>
            <thead><tr>
              <th>Employee</th><th>Position</th>
              <th class="num">Regular hrs</th><th class="num">Stat hrs</th>
              <th>Pay method</th><th class="num">Gross</th>
            </tr></thead>
            <tbody>
              ${rowsToExport.map(r => `<tr>
                <td>${r.name || ""}</td>
                <td>${r.position || r.title || ""}</td>
                <td class="num">${parseFloat(r.regular) || 0}</td>
                <td class="num">${parseFloat(r.statHoliday) || 0}</td>
                <td>${r.payMethod || ""}</td>
                <td class="num">$${(grossOf(r) || 0).toFixed(2)}</td>
              </tr>`).join("")}
            </tbody>
          </table>
          <div class="footer">Generated by Novala on ${new Date().toLocaleString()}</div>
        </body></html>`;
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 400);
    }, 100);
  };

  useEffect(() => {
    if (!tourActive) { setTourTargetRect(null); return; }
    const step = TOUR_STEPS[tourStep];
    if (!step || !step.id) { setTourTargetRect(null); return; }
    const updateTourRect = () => {
      const el = document.getElementById(step.id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setTourTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    const el = document.getElementById(step.id);
    if (!el) { setTourTargetRect(null); return; }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(updateTourRect, 400);
    window.addEventListener("resize", updateTourRect);
    window.addEventListener("scroll", updateTourRect, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateTourRect);
      window.removeEventListener("scroll", updateTourRect, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourActive, tourStep]);

  const visibleCols = COLUMNS.filter((c) => !hidden[c.key]);
  const widthFor = (k) => k === "employees" ? "2.2fr" : k === "memo" ? "70px" : k === "payMethod" ? "1.7fr"
    : (k === "statHoliday" || k === "totalHrs") ? "1fr" : "1.2fr";
  const gridCols = "42px " + visibleCols.map((c) => widthFor(c.key)).join(" ") + " 44px";

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
    if (action === "Sort ascending") { setSortKey(key); setSortDir("asc"); }
    else if (action === "Sort descending") { setSortKey(key); setSortDir("desc"); }
    else if (action === "Hide column") setHidden((h) => ({ ...h, [key]: true }));
    else if (action === "Customize") { setCustomizeTab("columns"); setCustomizeOpen(true); }
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
          <div style={{ position: "relative" }}>
            <button onClick={() => setFreqOpen(o => !o)} style={{ background: C.tint, color: C.brandDark, fontSize: 12.5, fontWeight: 700, padding: "5px 12px", borderRadius: 20, border: "1px solid " + C.tint, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 5 }}>
              {frequency} <ChevronDown size={13} />
            </button>
            {freqOpen && (
              <div style={{ position: "absolute", top: 32, left: 0, zIndex: 80, background: "#fff", border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", padding: 4, minWidth: 200 }}>
                {["Weekly","Bi-weekly","Semi-monthly","Monthly"].map(f => (
                  <div key={f} onClick={() => { setFrequency(f); setFreqOpen(false); }} style={{ padding: "8px 12px", borderRadius: 6, fontSize: 13, fontWeight: f === frequency ? 700 : 500, color: f === frequency ? C.brandDark : C.ink, background: f === frequency ? C.tint : "transparent", cursor: "pointer" }}>
                    {f}
                  </div>
                ))}
              </div>
            )}
          </div>
          <span style={{ fontSize: 13.5, color: C.muted }}>{frequency === "Semi-monthly" ? "15th and end of month" : frequency === "Weekly" ? "Every Friday" : frequency === "Bi-weekly" ? "Every other Friday" : "End of month"}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 20, color: C.muted, fontSize: 13.5, fontWeight: 600, alignItems: "center" }}>
            <span onClick={() => { setTourStep(0); setTourActive(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><Map size={16} />Take a tour</span>
              {tourActive && (() => {
                const step = TOUR_STEPS[tourStep] || {};
                const vh = typeof window !== "undefined" ? window.innerHeight : 800;
                const tooltipPos = !tourTargetRect
                  ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
                  : tourTargetRect.top > vh / 2
                    ? { top: 40, left: "50%", transform: "translateX(-50%)" }
                    : { bottom: 40, left: "50%", transform: "translateX(-50%)" };
                return (
                  <>
                    <svg style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 200, pointerEvents: "none" }}>
                      <defs>
                        <mask id="tour-spotlight-mask">
                          <rect width="100%" height="100%" fill="white" />
                          {tourTargetRect && (<rect x={tourTargetRect.left - 6} y={tourTargetRect.top - 6} width={tourTargetRect.width + 12} height={tourTargetRect.height + 12} rx="10" fill="black" />)}
                        </mask>
                      </defs>
                      <rect width="100%" height="100%" fill="rgba(8,32,31,0.55)" mask="url(#tour-spotlight-mask)" />
                      {tourTargetRect && (<rect x={tourTargetRect.left - 6} y={tourTargetRect.top - 6} width={tourTargetRect.width + 12} height={tourTargetRect.height + 12} rx="10" fill="none" stroke="#fff" strokeWidth="2" />)}
                    </svg>
                    <div style={{ position: "fixed", ...tooltipPos, width: 340, background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 20px 48px rgba(8,32,31,0.24)", zIndex: 201, fontFamily: FONT }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.brand, textTransform: "uppercase", letterSpacing: 0.06 }}>Step {tourStep + 1} of {TOUR_STEPS.length}</span>
                        <button onClick={() => setTourActive(false)} aria-label="Close tour" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: C.muted }}><X size={16} /></button>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{step.title}</div>
                      <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.55, marginBottom: 16 }}>{step.body}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button onClick={() => setTourActive(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13, color: C.faint, fontFamily: FONT }}>Skip tour</button>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setTourStep((s) => Math.max(0, s - 1))} disabled={tourStep === 0} style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, color: tourStep === 0 ? C.faint : C.ink, cursor: tourStep === 0 ? "default" : "pointer", fontFamily: FONT, opacity: tourStep === 0 ? 0.5 : 1 }}>Back</button>
                          {tourStep < TOUR_STEPS.length - 1 ? (
                            <button onClick={() => setTourStep((s) => s + 1)} style={{ background: C.brand, border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: FONT }}>Next</button>
                          ) : (
                            <button onClick={() => setTourActive(false)} style={{ background: C.brand, border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: FONT }}>Done</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            <span onClick={() => setFeedbackOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><MessageCircle size={16} />Give feedback</span>
            <span onClick={() => setHelpOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><HelpCircle size={16} />Help</span>
            <span onClick={() => setToolbarOpen(false)} title="Hide toolbar" style={{ cursor: "pointer" }}><X size={16}/></span>
          </div>
        </div>

        {/* scroll */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 26px 90px" }}>
          {loading && <div style={{ padding: 40, color: C.muted }}>Loading payroll run...</div>}
          {error && <div style={{ padding: 40, color: C.danger }}>{error}</div>}

          {!loading && !error && (
            <>
              {/* readiness */}
              <div id="tour-readiness" style={{ border: "1px solid " + C.line, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
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
                    <a onClick={() => navigate("/payroll/employees/" + r.id)} style={{ color: C.brandDark, fontWeight: 700, cursor: "pointer" }}>Finish setup</a>
                  </div>
                ))}
                {rows.filter((r) => r.ready && (parseFloat(r.regular) || 0) === 0 && (parseFloat(r.statHoliday) || 0) === 0).map((r) => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: C.muted, padding: "5px 0" }}>
                    <span>{r.name} has no hours entered for this period.</span>
                    <a onClick={() => { const row = document.getElementById("row-" + r.id); if (row) { row.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => { const input = row.querySelector("input:not([type='checkbox'])"); if (input) input.focus(); }, 300); } }} style={{ color: C.brandDark, fontWeight: 700, cursor: "pointer" }}>Add hours</a>
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

              {/* pay period + next pay date */}
              <div id="tour-pay-period" style={{ display: "flex", gap: 12, alignItems: "stretch", marginBottom: 14 }}>
                <div style={{ position: "relative", width: 300, border: "1.5px solid " + C.night, borderRadius: 12, background: "#fff", padding: "14px 16px" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: C.ink, textTransform: "uppercase", letterSpacing: 0.08, marginBottom: 9 }}>Pay period</div>
                  <button type="button" onClick={() => setPeriodOpen((o) => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 12px", border: "1px solid " + C.ink, borderRadius: 8, background: "#fff", fontSize: 15, fontWeight: 500, color: C.ink, cursor: "pointer", fontFamily: FONT, textAlign: "left" }}>
                    <span>{periodStart && periodEnd ? formatPeriodLabel(periodStart, periodEnd) : "Select period"}</span>
                    <ChevronDown size={17} color={C.ink} style={{ transform: periodOpen ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
                  </button>
                  {periodOpen && (
                    <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 76, left: 16, right: 16, background: "#fff", border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 20px 48px rgba(8,32,31,0.14)", maxHeight: 248, overflowY: "auto", zIndex: 30, padding: 4 }}>
                      {periodOptions.map((p, idx) => {
                        const isSel = p.start === periodStart && p.end === periodEnd;
                        return (
                          <button key={idx} type="button" onClick={() => { setPeriodStart(p.start); setPeriodEnd(p.end); setPeriodOpen(false); }}
                            onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = C.page; }}
                            onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", background: isSel ? C.tint : "transparent", border: "none", borderRadius: 6, fontSize: 13.5, color: C.ink, cursor: "pointer", textAlign: "left", fontFamily: FONT }}>
                            <span style={{ display: "inline-flex", width: 16, color: C.brand }}>{isSel ? <Check size={15} /> : null}</span>
                            <span>{formatPeriodLabel(p.start, p.end)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div style={{ flex: "0 0 220px", border: "1.5px solid " + C.night, borderRadius: 12, background: "#fff", padding: "14px 16px" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: C.ink, textTransform: "uppercase", letterSpacing: 0.08, marginBottom: 9 }}>Next pay date</div>
                  <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid " + C.ink, borderRadius: 8, background: "#fff", fontSize: 15, fontWeight: 500, color: C.ink, fontFamily: FONT, outline: "none" }} />
                </div>
              </div>

              {/* toolbar */}
              <div id="tour-toolbar" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ position: "relative" }}>
                  <button style={{ ...toolBtn, background: filtersApplied > 0 ? C.tint : "#fff", color: filtersApplied > 0 ? C.brandDark : C.ink, borderColor: filtersApplied > 0 ? C.brand : C.line }} onClick={() => setFiltersOpen((o) => !o)}>
                    <Filter size={15} />Filters{filtersApplied > 0 ? " (" + filtersApplied + ")" : ""}
                  </button>
                  {filtersOpen && (
                    <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: 340, background: "#fff", border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 20px 48px rgba(8,32,31,0.14)", zIndex: 50, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid " + C.line }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Filters</div>
                        <button onClick={clearFilters} style={{ background: "none", border: "none", fontSize: 12.5, fontWeight: 600, color: C.muted, cursor: "pointer", padding: "2px 4px", fontFamily: FONT }}>Clear all</button>
                      </div>
                      <div style={{ maxHeight: 380, overflowY: "auto" }}>
                        <div style={{ padding: "12px 18px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.04, marginBottom: 10 }}>Pay method</div>
                          {["Direct deposit", "Paper cheque"].map((pm) => (
                            <label key={pm} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", fontSize: 13.5, cursor: "pointer", color: C.ink }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <input type="checkbox" checked={filterPayMethod.includes(pm)} onChange={(e) => setFilterPayMethod((s) => e.target.checked ? [...s, pm] : s.filter((x) => x !== pm))} style={{ width: 16, height: 16, accentColor: C.brand }} />
                                {pm}
                              </span>
                              <span style={{ fontSize: 12, color: C.faint }}>{payMethodCount(pm)}</span>
                            </label>
                          ))}
                        </div>
                        <div style={{ height: 1, background: C.line, margin: "0 18px" }} />
                        <div style={{ padding: "12px 18px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.04, marginBottom: 10 }}>Status</div>
                          {[{ k: "ready", l: "Ready to pay" }, { k: "needs", l: "Needs setup" }, { k: "skipped", l: "Skipped from run" }].map((s) => (
                            <label key={s.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", fontSize: 13.5, cursor: "pointer", color: C.ink }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <input type="checkbox" checked={filterStatus.includes(s.k)} onChange={(e) => setFilterStatus((x) => e.target.checked ? [...x, s.k] : x.filter((y) => y !== s.k))} style={{ width: 16, height: 16, accentColor: C.brand }} />
                                {s.l}
                              </span>
                              <span style={{ fontSize: 12, color: C.faint }}>{statusCount(s.k)}</span>
                            </label>
                          ))}
                        </div>
                        <div style={{ height: 1, background: C.line, margin: "0 18px" }} />
                        <div style={{ padding: "12px 18px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.04, marginBottom: 10 }}>Employment type</div>
                          {[{ k: "full_time", l: "Full-time" }, { k: "part_time", l: "Part-time" }, { k: "contractor", l: "Contractor" }].map((et) => (
                            <label key={et.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", fontSize: 13.5, cursor: "pointer", color: C.ink }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <input type="checkbox" checked={filterEmpType.includes(et.k)} onChange={(e) => setFilterEmpType((x) => e.target.checked ? [...x, et.k] : x.filter((y) => y !== et.k))} style={{ width: 16, height: 16, accentColor: C.brand }} />
                                {et.l}
                              </span>
                              <span style={{ fontSize: 12, color: C.faint }}>{empTypeCount(et.k)}</span>
                            </label>
                          ))}
                        </div>
                        {distinctPositions.length > 0 && (
                          <>
                            <div style={{ height: 1, background: C.line, margin: "0 18px" }} />
                            <div style={{ padding: "12px 18px 16px" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.04, marginBottom: 10 }}>Position</div>
                              <select value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid " + C.line, borderRadius: 7, fontSize: 13, background: "#fff", cursor: "pointer", color: C.ink, fontFamily: FONT }}>
                                <option value="">Any position</option>
                                {distinctPositions.map((p) => (
                                  <option key={p} value={p}>{p} ({positionCount(p)})</option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderTop: "1px solid " + C.line, background: C.page }}>
                        <div style={{ fontSize: 12.5, color: C.muted }}>{displayRows.length} of {rows.length} match</div>
                        <button onClick={() => setFiltersOpen(false)} style={{ background: C.brand, border: "none", borderRadius: 7, padding: "7px 16px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: FONT }}>Done</button>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ position: "relative", minWidth: 280, flex: "0 1 320px" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none", display: "inline-flex" }}><Search size={15} /></span>
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or position" style={{ width: "100%", boxSizing: "border-box", border: "1px solid " + C.line, borderRadius: 10, padding: "9px 36px", fontSize: 13.5, color: C.ink, background: "#fff", fontFamily: FONT, outline: "none" }} />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} aria-label="Clear search" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: C.muted }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
                  <button onClick={() => navigate("/payroll/employees/add")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", border: "none", borderRadius: 10, background: C.brand, color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                    <Plus size={15} />Add employee
                  </button>
                  <div style={{ position: "relative" }}>
                    <button style={toolBtn} onClick={() => setExportOpen((o) => !o)}><Download size={15} />Export<ChevronDown size={13} style={{ marginLeft: -2 }} /></button>
                    {exportOpen && (
                      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 280, background: "#fff", border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 20px 48px rgba(8,32,31,0.14)", padding: 4, zIndex: 50 }}>
                        <div style={{ padding: "10px 14px 4px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.04 }}>Export format</div>
                        <button onClick={exportCSV} onMouseEnter={(e) => e.currentTarget.style.background = C.page} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "9px 12px", background: "transparent", border: "none", borderRadius: 7, fontSize: 13.5, color: C.ink, cursor: "pointer", textAlign: "left", fontFamily: FONT }}>
                          <FileText size={16} color={C.muted} />
                          <span>CSV<div style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>For Excel, Sheets, any tool</div></span>
                        </button>
                        <button onClick={exportXLSX} onMouseEnter={(e) => e.currentTarget.style.background = C.page} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "9px 12px", background: "transparent", border: "none", borderRadius: 7, fontSize: 13.5, color: C.ink, cursor: "pointer", textAlign: "left", fontFamily: FONT }}>
                          <FileText size={16} color={C.muted} />
                          <span>Excel (.xlsx)<div style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>Coming next</div></span>
                        </button>
                        <button onClick={exportPDF} onMouseEnter={(e) => e.currentTarget.style.background = C.page} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "9px 12px", background: "transparent", border: "none", borderRadius: 7, fontSize: 13.5, color: C.ink, cursor: "pointer", textAlign: "left", fontFamily: FONT }}>
                          <Receipt size={16} color={C.muted} />
                          <span>PDF report<div style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>Coming next</div></span>
                        </button>
                        <div style={{ height: 1, background: C.line, margin: "4px 8px" }} />
                        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 12.5, color: C.muted, cursor: "pointer" }}>
                          <input type="checkbox" checked={exportChecked} onChange={(e) => setExportChecked(e.target.checked)} style={{ width: 14, height: 14, accentColor: C.brand }} />
                          Only checked employees
                        </label>
                      </div>
                    )}
                  </div>
                  <button style={toolBtn} onClick={() => { setCustomizeTab("sort"); setCustomizeOpen(true); }}><Settings size={15} />Customize</button>
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
              <div id="tour-table" style={{ border: "1px solid " + C.line, borderRadius: 14, overflow: "visible" }}>
                <div style={{ display: "grid", gridTemplateColumns: gridCols, alignItems: "center",
                  background: C.page, borderBottom: "1px solid " + C.line, fontSize: 11.5, fontWeight: 800,
                  letterSpacing: ".04em", color: C.muted, textTransform: "uppercase" }}>
                  <div style={{ padding: 12, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = indeterminate; }} onChange={(e) => toggleAll(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: C.brand }} aria-label="Select all employees" />
                  </div>
                  {visibleCols.map((col) => (
                    <div key={col.key} style={{ padding: "14px 14px" }}>
                      <ColumnHeader col={{ ...col, label: col.key === "employees" ? "Employees \u00b7 " + selectedCount + " of " + rows.length : col.label }} onAction={handleColAction} />
                    </div>
                  ))}
                  <div />
                </div>

                {displayRows.map((r, idx) => (
                  <div key={r.id} id={"row-" + r.id} style={{ display: "grid", gridTemplateColumns: gridCols, alignItems: "stretch",
                    borderBottom: "1px solid " + C.lineSoft, position: "relative", minHeight: densityHeight,
                    background: stripe && idx % 2 === 1 ? "#F9FBFB" : "transparent",
                    opacity: r.skipped ? 0.5 : 1 }}>
                    <div style={{ padding: 12, display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <input type="checkbox" checked={r.ready && !r.skipped} disabled={!r.ready} onChange={(e) => update(r.id, "skipped", !e.target.checked)} style={{ width: 16, height: 16, cursor: r.ready ? "pointer" : "not-allowed", accentColor: C.brand }} aria-label={"Include " + r.name} />
                    </div>
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
                      <div style={{ ...cell, gridColumn: "3 / " + (visibleCols.length + 2), justifyContent: "center" }}>
                        <span style={{ fontSize: 13.5, color: C.muted }}>
                          To pay {r.name.split(",")[0]}, you need to enter Personal info, Pay types and Payment method.{" "}
                          <a onClick={() => navigate("/payroll/employees/" + r.id)} style={{ color: C.brandDark, fontWeight: 700, cursor: "pointer" }}>Finish setup</a>
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
                  <div></div>
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
        <div id="tour-footer" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, boxShadow: "0 -4px 12px rgba(15,23,42,0.06)", display: "flex", alignItems: "center", gap: 16, padding: "14px 26px",
          borderTop: "1px solid " + C.line, background: "#fff" }}>
          <button style={ghostBtn} onClick={() => navigate(-1)}>Cancel</button>
          <span style={{ marginLeft: "auto", fontSize: 13.5, color: C.muted }}>{selectedCount} of {rows.length} employees selected</span>
          <button style={ghostBtn}>Save for later</button>
          <button onClick={previewRun} style={{ background: C.brand, color: "#fff", border: "none", borderRadius: 10,
            padding: "11px 24px", font: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 8 }}>
            Preview for {selectedCount} employees <ArrowRight size={16} />
          </button>
        </div>

      {!toolbarOpen && (
        <button onClick={() => setToolbarOpen(true)} style={{ position: "fixed", top: 14, right: 26, zIndex: 90, background: "#fff", border: "1px solid " + C.line, borderRadius: 8, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, color: C.muted, cursor: "pointer", fontFamily: FONT, boxShadow: "0 2px 8px rgba(15,23,42,0.08)" }}>Show toolbar</button>
      )}
      {feedbackOpen && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setFeedbackOpen(false); setFeedbackError(null); }}} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: 480, background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid " + C.line }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>Give feedback</div>
              <span onClick={() => { setFeedbackOpen(false); setFeedbackError(null); }} style={{ cursor: "pointer", color: C.muted }}><X size={18} /></span>
            </div>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 13.5, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>Tell us what is working, what is not, or what you wish Novala did. The Novala team reads every message.</div>
              <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Your feedback..." rows={6} style={{ width: "100%", border: "1px solid " + C.line, borderRadius: 10, padding: "10px 12px", fontFamily: FONT, fontSize: 14, color: C.ink, background: "#fff", resize: "vertical" }} />
              {feedbackError && <div style={{ marginTop: 10, fontSize: 12.5, color: C.danger || "#DC2626" }}>{feedbackError}</div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button onClick={() => { setFeedbackOpen(false); setFeedbackError(null); setFeedbackText(""); }} disabled={feedbackSending} style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 10, padding: "9px 18px", fontFamily: FONT, fontWeight: 600, fontSize: 14, color: C.ink, cursor: feedbackSending ? "not-allowed" : "pointer" }}>Cancel</button>
                <button onClick={async () => {
                  if (!feedbackText.trim()) { setFeedbackError("Please write your feedback before sending."); return; }
                  setFeedbackSending(true); setFeedbackError(null);
                  try {
                    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
                    const apiUrl = (process.env.REACT_APP_API_URL || "https://api.getnovala.com") + "/api/v1/feedback";
                    const res = await fetch(apiUrl, {
                      method: "POST",
                      headers: Object.assign({ "Content-Type": "application/json" }, token ? { Authorization: "Bearer " + token } : {}),
                      body: JSON.stringify({ message: feedbackText, page_context: "Run Payroll page" }),
                    });
                    if (!res.ok) { const t = await res.text(); throw new Error("Send failed: " + t.slice(0, 200)); }
                    setFeedbackOpen(false); setFeedbackText("");
                  } catch (err) { setFeedbackError(err.message); } finally { setFeedbackSending(false); }
                }} disabled={feedbackSending || !feedbackText.trim()} style={{ background: (feedbackSending || !feedbackText.trim()) ? "#C3CBD6" : C.brand, color: "#fff", border: "1px solid transparent", borderRadius: 10, padding: "9px 18px", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: (feedbackSending || !feedbackText.trim()) ? "not-allowed" : "pointer" }}>
                  {feedbackSending ? "Sending..." : "Send feedback"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {helpOpen && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setHelpOpen(false); }} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: 460, background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid " + C.line }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>Help & support</div>
              <span onClick={() => setHelpOpen(false)} style={{ cursor: "pointer", color: C.muted }}><X size={18} /></span>
            </div>
            <div style={{ padding: "18px 20px", fontSize: 14, color: C.text, lineHeight: 1.6 }}>
              <div style={{ marginBottom: 14 }}>Need a hand with payroll? Here is how to reach us:</div>
              <div style={{ marginBottom: 10 }}><b style={{ color: C.ink }}>Email:</b> <a href="mailto:support@getnovala.com" style={{ color: C.brand, textDecoration: "none" }}>support@getnovala.com</a></div>
              <div style={{ marginBottom: 10 }}><b style={{ color: C.ink }}>Take the tour:</b> <span onClick={() => { setHelpOpen(false); setTourStep(0); setTourActive(true); }} style={{ color: C.brand, cursor: "pointer", fontWeight: 600 }}>Restart the guided tour</span></div>
              <div><b style={{ color: C.ink }}>Give feedback:</b> <span onClick={() => { setHelpOpen(false); setFeedbackOpen(true); }} style={{ color: C.brand, cursor: "pointer", fontWeight: 600 }}>Open the feedback form</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 20px", borderTop: "1px solid " + C.line }}>
              <button onClick={() => setHelpOpen(false)} style={{ background: C.brand, color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}
      {customizeOpen && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setCustomizeOpen(false); }} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: 560, background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid " + C.line }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>Customize</div>
              <button onClick={() => setCustomizeOpen(false)} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.muted }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", minHeight: 360 }}>
              <nav style={{ borderRight: "1px solid " + C.line, padding: "8px 0", background: C.page }}>
                {[{ k: "sort", l: "Sort" }, { k: "rows", l: "Rows" }, { k: "columns", l: "Columns" }].map((tab) => (
                  <button key={tab.k} onClick={() => setCustomizeTab(tab.k)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "11px 16px", background: customizeTab === tab.k ? "#fff" : "transparent", border: "none", borderLeft: "3px solid " + (customizeTab === tab.k ? C.brand : "transparent"), fontSize: 13.5, fontWeight: 600, color: C.ink, cursor: "pointer", fontFamily: FONT }}>{tab.l}</button>
                ))}
              </nav>
              <div style={{ padding: "20px 24px" }}>
                {customizeTab === "sort" && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.04, marginBottom: 8 }}>Sort by</div>
                    <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1px solid " + C.line, borderRadius: 9, fontSize: 13.5, background: "#fff", cursor: "pointer", marginBottom: 18, fontFamily: FONT, color: C.ink }}>
                      <option value="">No sort</option>
                      <option value="employees">Employees</option>
                      <option value="regular">Regular pay</option>
                      <option value="statHoliday">Stat holiday pay</option>
                      <option value="statPay">Stat pay (avg)</option>
                      <option value="totalHrs">Total hrs</option>
                      <option value="gross">Gross pay</option>
                      <option value="memo">Memo</option>
                      <option value="payMethod">Pay method</option>
                    </select>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.04, marginBottom: 8 }}>Direction</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[{ d: "asc", l: "Ascending", I: ArrowUp }, { d: "desc", l: "Descending", I: ArrowDown }].map((opt) => (
                        <button key={opt.d} onClick={() => setSortDir(opt.d)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 9, border: "1px solid " + (sortDir === opt.d ? C.brand : C.line), borderRadius: 9, background: sortDir === opt.d ? C.tint : "#fff", color: sortDir === opt.d ? C.brandDark : C.ink, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                          <opt.I size={14} />{opt.l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {customizeTab === "rows" && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.04, marginBottom: 8 }}>Row density</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
                      {[{ k: "compact", l: "Compact" }, { k: "normal", l: "Normal" }, { k: "comfortable", l: "Comfortable" }].map((opt) => (
                        <button key={opt.k} onClick={() => setDensity(opt.k)} style={{ padding: "10px 8px", border: "1px solid " + (density === opt.k ? C.brand : C.line), borderRadius: 9, background: density === opt.k ? C.tint : "#fff", color: density === opt.k ? C.brandDark : C.ink, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>{opt.l}</button>
                      ))}
                    </div>
                    {[
                      { k: "stripe", l: "Stripe alternating rows", v: stripe, s: setStripe },
                      { k: "hideSkipped", l: "Hide skipped employees", v: hideSkipped, s: setHideSkipped },
                      { k: "onlyWithHours", l: "Show only employees with hours", v: onlyWithHours, s: setOnlyWithHours }
                    ].map((opt) => (
                      <label key={opt.k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 13.5, cursor: "pointer", color: C.ink }}>
                        <input type="checkbox" checked={opt.v} onChange={(e) => opt.s(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.brand, cursor: "pointer" }} />
                        {opt.l}
                      </label>
                    ))}
                  </div>
                )}
                {customizeTab === "columns" && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.04, marginBottom: 8 }}>Show columns</div>
                    {[
                      { k: "regular", l: "Regular pay" },
                      { k: "statHoliday", l: "Stat holiday pay" },
                      { k: "statPay", l: "Stat pay (avg)" },
                      { k: "totalHrs", l: "Total hrs" },
                      { k: "gross", l: "Gross pay" },
                      { k: "memo", l: "Memo" },
                      { k: "payMethod", l: "Pay method" }
                    ].map((col) => (
                      <label key={col.k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 13.5, cursor: "pointer", color: C.ink }}>
                        <input type="checkbox" checked={!hidden[col.k]} onChange={(e) => setHidden((h) => ({ ...h, [col.k]: !e.target.checked }))} style={{ width: 16, height: 16, accentColor: C.brand, cursor: "pointer" }} />
                        {col.l}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid " + C.line }}>
              <button onClick={customizeDefaults} style={{ background: "transparent", border: "none", padding: "8px 4px", fontSize: 13, fontWeight: 600, color: C.muted, cursor: "pointer", fontFamily: FONT }}>Reset to defaults</button>
              <button onClick={() => setCustomizeOpen(false)} style={{ background: C.brand, border: "none", borderRadius: 10, padding: "9px 22px", fontSize: 13.5, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: FONT }}>Done</button>
            </div>
          </div>
        </div>
      )}
            {memo && (
        <MemoPopover anchorRect={memo.rect} name={memo.name} initial={memo.initial}
          onSave={saveMemo} onClose={() => setMemo(null)} />
      )}
    </div>
  );
}
