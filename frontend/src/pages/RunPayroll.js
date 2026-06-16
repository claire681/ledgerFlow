import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  X, Search, Filter, Download, Settings, Plus, Calendar,
  MoreVertical, HelpCircle, MessageCircle, Map, ArrowRight,
  ChevronDown, Check, MessageSquare, Edit3, UserMinus, UserPlus, FilePen,
  ShieldCheck, AlertTriangle, TrendingUp
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const BRAND = "#0F9599";
const BRAND_DARK = "#0F6E56";
const BRAND_SOFT = "#E1F5EE";
const BRAND_SOFT_BORDER = "#B8E2D2";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const TEXT_MUTED = "#9CA3AF";
const BG_CARD = "#FFFFFF";
const BG_PAGE = "#F9FAFB";
const BG_HOVER = "#FAFBFC";
const BORDER = "#E5E7EB";
const BORDER_LIGHT = "#F3F4F6";
const DANGER = "#DC2626";
const WARN_BG = "#FEF3C7";
const WARN_TX = "#92400E";
const WARN_BORDER = "#FCD34D";
const INFO_BG = "#DBEAFE";
const INFO_TX = "#1E40AF";
const INFO_BORDER = "#93C5FD";

const NOTE_PCT = 25;
const REVIEW_PCT = 60;
const MIN_ABS_HOURS = 6;

const PAY_SCHEDULE_LABELS = { weekly: "Weekly", bi_weekly: "Bi-weekly", semi_monthly: "Semi-monthly", monthly: "Monthly" };
const SCHEDULE_DETAIL = { weekly: "Every Friday", bi_weekly: "Every other Friday", semi_monthly: "15th and end of month", monthly: "End of month" };

const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("token") || "";
const authHeaders = () => ({ Authorization: "Bearer " + getToken(), "Content-Type": "application/json" });

const fmtMoney = (n) => { const num = typeof n === "number" ? n : parseFloat(n || 0); return num.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
const fmtHours = (n) => { const num = typeof n === "number" ? n : parseFloat(n || 0); return num.toLocaleString("en-CA", { maximumFractionDigits: 2 }); };
const fmtDate = (d) => { if (!d) return ""; const date = new Date(d); if (isNaN(date.getTime())) return d; return date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }); };

const moneyOnly = (s) => String(s == null ? "" : s).replace(/[^0-9.]/g, "");
const formatMoneyLive = (raw) => {
  let s = moneyOnly(raw);
  const parts = s.split(".");
  if (parts.length > 2) s = parts[0] + "." + parts.slice(1).join("");
  const [intP, decP] = s.split(".");
  const intStr = intP ? parseInt(intP, 10).toLocaleString("en-US") : "";
  if (decP != null) return intStr + "." + decP.slice(0, 2);
  return intStr;
};
const formatMoneyBlur = (raw) => {
  const num = parseFloat(moneyOnly(raw) || 0);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const parseMoneyToNumber = (raw) => {
  const num = parseFloat(moneyOnly(raw) || 0);
  return isNaN(num) ? 0 : num;
};

const empName = (e) => {
  if (!e) return "Employee";
  if (e.displayName) return e.displayName;
  const f = e.first_name || ""; const l = e.last_name || "";
  if (l && f) return l + ", " + f;
  if (f) return f; if (l) return l;
  return e.email || "Employee";
};
const empFirst = (e) => {
  if (!e) return "Employee";
  if (e.first_name) return e.first_name;
  if (e.displayName) return e.displayName.split(",").slice(-1)[0].trim();
  return "Employee";
};

const isLineSetupComplete = (e) => {
  if (!e) return false;
  if (e.setupComplete === false) return false;
  if (e.setupComplete === true) return true;
  const hasName = !!(e.first_name || e.last_name || e.displayName);
  const hasRate = !!(e.rate || e.hourly_rate || e.pay_types);
  return hasName && hasRate;
};
const lineSetupMissing = (e) => {
  if (!e) return [];
  if (Array.isArray(e.setupMissing)) return e.setupMissing;
  const m = [];
  if (!(e.first_name || e.last_name)) m.push("personal info");
  if (!(e.rate || e.hourly_rate || e.pay_types)) m.push("pay types");
  if (!(e.payment_method || e.payMethod)) m.push("a payment method");
  return m;
};
const totalHours = (l) => parseFloat(l.regularHours || 0) + parseFloat(l.statHolidayHours || 0);
const grossPay = (l) => {
  const r = parseFloat(l.rate || 0);
  return parseFloat(l.regularHours || 0) * r + parseFloat(l.statHolidayHours || 0) * r + parseFloat(l.statAvgPay || 0);
};

function flagsFor(line, isActive, dismissedForLine) {
  if (!isActive || !line.setupComplete) return [];
  const dis = dismissedForLine || {};
  const out = [];
  const tHrs = totalHours(line);
  if (tHrs === 0 && parseFloat(line.statAvgPay || 0) === 0) {
    out.push({ level: "warn", code: "no_hours", text: "No hours entered for this period" });
  }
  if (line.payMethod === "direct_deposit" && line.payMethodReady === false) {
    out.push({ level: "warn", code: "dd_not_ready", text: "Direct deposit not set up, will not pay" });
  }
  if (line.priorPeriodHours > 0 && tHrs > 0) {
    const delta = tHrs - line.priorPeriodHours;
    const pct = Math.round((delta / line.priorPeriodHours) * 100);
    const direction = pct > 0 ? "up" : "down";
    const text = "Hours " + direction + " " + Math.abs(pct) + "% vs last run (" + fmtHours(line.priorPeriodHours) + "h)";
    if (Math.abs(delta) >= MIN_ABS_HOURS && Math.abs(pct) >= REVIEW_PCT) {
      out.push({ level: "warn", code: "hours_variance", text });
    } else if (Math.abs(delta) >= MIN_ABS_HOURS && Math.abs(pct) >= NOTE_PCT) {
      out.push({ level: "info", code: "hours_variance", text });
    }
  }
  return out.reduce((acc, f) => {
    const d = dis[f.code];
    if (d === "dismissed") return acc;
    if (d === "demoted" && f.level === "warn") { acc.push({ ...f, level: "info" }); return acc; }
    acc.push(f); return acc;
  }, []);
}

function readinessCounts(lines, selected, dismissed) {
  const needsSetup = lines.filter((l) => !l.setupComplete).length;
  const active = lines.filter((l) => selected[l.employeeId] && l.setupComplete);
  let ready = 0, toReview = 0, notes = 0;
  active.forEach((l) => {
    const fs = flagsFor(l, true, dismissed[l.employeeId]);
    const hasWarn = fs.some((f) => f.level === "warn");
    const hasInfo = fs.some((f) => f.level === "info");
    if (hasWarn) toReview++;
    else if (hasInfo) notes++;
    else ready++;
  });
  return { needsSetup, toReview, notes, ready, total: active.length };
}

function getIssues(lines, selected, dismissed) {
  const issues = [];
  lines.forEach((l) => {
    if (!l.setupComplete) {
      const missing = l.setupMissing.length > 0 ? l.setupMissing.join(", ") : "personal info, pay types and a payment method";
      issues.push({
        key: l.employeeId + ":needs_setup",
        lineId: l.employeeId, code: "needs_setup",
        text: l.displayName + " needs " + missing + ".",
        actionLabel: "Finish setup", action: "finish_setup", line: l
      });
      return;
    }
    if (!selected[l.employeeId]) return;
    const fs = flagsFor(l, true, dismissed[l.employeeId]);
    fs.forEach((f) => {
      if (f.code === "no_hours") {
        issues.push({
          key: l.employeeId + ":no_hours",
          lineId: l.employeeId, code: "no_hours",
          text: l.displayName + " has no hours entered for this period.",
          actionLabel: "Add hours", action: "add_hours", line: l, flag: f
        });
      } else if (f.code === "hours_variance" && f.level === "warn") {
        issues.push({
          key: l.employeeId + ":variance_review",
          lineId: l.employeeId, code: "variance_review",
          text: l.displayName + ": " + f.text + ".",
          actionLabel: "Reviewed", action: "demote_variance", line: l, flag: f
        });
      } else if (f.code === "hours_variance" && f.level === "info") {
        issues.push({
          key: l.employeeId + ":variance_note",
          lineId: l.employeeId, code: "variance_note",
          text: l.displayName + ": " + f.text + ".",
          actionLabel: "Looks right", action: "dismiss_variance", line: l, flag: f
        });
      } else if (f.code === "dd_not_ready") {
        issues.push({
          key: l.employeeId + ":dd_not_ready",
          lineId: l.employeeId, code: "dd_not_ready",
          text: l.displayName + ": " + f.text + ".",
          actionLabel: "Set up", action: "setup_dd", line: l, flag: f
        });
      }
    });
  });
  return issues;
}

export default function RunPayroll() {
  const navigate = useNavigate();
  const { payRunId } = useParams();
  const [run, setRun] = useState(null);
  const [lines, setLines] = useState([]);
  const [selected, setSelected] = useState({});
  const [dismissed, setDismissed] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true); setError(null);
        const runRes = await fetch(API_URL + "/api/v1/payroll/runs/" + payRunId, { headers: authHeaders() });
        if (!runRes.ok) throw new Error("Could not load pay run (" + runRes.status + ")");
        const runData = await runRes.json();
        const empsRes = await fetch(API_URL + "/api/v1/payroll/employees", { headers: authHeaders() });
        if (!empsRes.ok) throw new Error("Could not load employees (" + empsRes.status + ")");
        const empsData = await empsRes.json();
        const employees = Array.isArray(empsData) ? empsData : (empsData.items || empsData.employees || []);
        const initial = employees.map((e) => ({
          employeeId: e.id, employee: e,
          displayName: empName(e), payTypeLabel: e.pay_type_label || "Hourly",
          rate: parseFloat(e.rate || e.hourly_rate || 0),
          regularHours: 0, statHolidayHours: 0, statAvgPay: 0,
          inRun: true, setupComplete: isLineSetupComplete(e), setupMissing: lineSetupMissing(e),
          payMethod: e.payment_method || e.payMethod || "direct_deposit",
          payMethodReady: e.payMethodReady !== false,
          priorPeriodHours: parseFloat(e.priorPeriodHours || 0),
          memo: "", hoursSource: e.hoursSource || e.hours_source || { type: "manual" }
        }));
        if (!mounted) return;
        setRun(runData); setLines(initial);
        const sel = {};
        initial.forEach((l) => { sel[l.employeeId] = l.inRun && l.setupComplete; });
        setSelected(sel);
        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || "Could not load this pay run.");
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [payRunId]);

  const updateLine = (id, patch) => setLines((ls) => ls.map((l) => l.employeeId === id ? { ...l, ...patch } : l));
  const applyMemoToAll = (memo) => setLines((ls) => ls.map((l) => selected[l.employeeId] && l.setupComplete ? { ...l, memo } : l));
  const skipLine = (id) => setSelected((s) => ({ ...s, [id]: false }));
  const addLine = (id) => setSelected((s) => ({ ...s, [id]: true }));
  const setLineDismissal = (lineId, code, value) => setDismissed((d) => ({ ...d, [lineId]: { ...(d[lineId] || {}), [code]: value } }));

  const handleCancel = () => navigate("/payroll/overview");
  const handleSaveLater = () => alert("Save for later coming next.");
  const handlePreview = () => navigate("/payroll/run/" + payRunId + "/preview");

  const onIssueAction = (issue) => {
    if (issue.action === "finish_setup") {
      navigate("/payroll/employees/" + issue.line.employeeId);
    } else if (issue.action === "add_hours") {
      const el = document.getElementById("cell-" + issue.line.employeeId + "-regular");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => { el.click(); }, 350);
      }
    } else if (issue.action === "demote_variance") {
      setLineDismissal(issue.line.employeeId, "hours_variance", "demoted");
    } else if (issue.action === "dismiss_variance") {
      setLineDismissal(issue.line.employeeId, "hours_variance", "dismissed");
    } else if (issue.action === "setup_dd") {
      navigate("/payroll/employees/" + issue.line.employeeId + "?section=payment_method");
    }
  };

  if (loading) return <CenterMsg>Loading pay run...</CenterMsg>;
  if (error) return (
    <CenterMsg>
      <div style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Could not load this pay run</div>
      <div style={{ color: TEXT_SECONDARY, fontSize: 13, marginBottom: 14 }}>{error}</div>
      <button onClick={handleCancel} style={primaryBtn}>Back to overview</button>
    </CenterMsg>
  );

  const payable = lines.filter((l) => l.setupComplete);
  const active = lines.filter((l) => selected[l.employeeId] && l.setupComplete);
  const allChecked = payable.length > 0 && payable.every((l) => selected[l.employeeId]);
  const someChecked = payable.some((l) => selected[l.employeeId]) && !allChecked;
  const totalHrs = active.reduce((a, l) => a + totalHours(l), 0);
  const totalGross = active.reduce((a, l) => a + grossPay(l), 0);
  const counts = readinessCounts(lines, selected, dismissed);
  const issues = getIssues(lines, selected, dismissed);

  const toggleAll = () => {
    const next = { ...selected };
    payable.forEach((l) => { next[l.employeeId] = !allChecked; });
    setSelected(next);
  };
  const toggleOne = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div style={{ background: BG_PAGE, minHeight: "100vh", paddingBottom: 100, fontFamily: "inherit", color: TEXT_PRIMARY }}>
      <Header run={run} onClose={handleCancel} />
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 24px 0" }}>
        <PeriodControls run={run} />
        {lines.length > 0 && <ReadinessBar counts={counts} issues={issues} onIssueAction={onIssueAction} />}
        <SummaryCards activeCount={active.length} total={lines.length} totalHrs={totalHrs} totalGross={totalGross} />
        <Toolbar />
        <Table
          lines={lines} selected={selected} dismissed={dismissed}
          allChecked={allChecked} someChecked={someChecked}
          onToggleAll={toggleAll} onToggleOne={toggleOne}
          active={active}
          onUpdateLine={updateLine} onApplyMemoAll={applyMemoToAll}
          onSkip={skipLine} onAdd={addLine}
        />
      </div>
      <Footer
        selectedCount={active.length} totalCount={lines.length}
        onCancel={handleCancel} onSaveLater={handleSaveLater} onPreview={handlePreview}
      />
    </div>
  );
}

function CenterMsg({ children }) {
  return <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: TEXT_SECONDARY, fontSize: 14, fontFamily: "inherit", textAlign: "center", padding: 24 }}>{children}</div>;
}

const primaryBtn = { background: BRAND, color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
const ghostBtn = { background: "transparent", border: "1px solid " + BORDER, color: TEXT_PRIMARY, padding: "9px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const hbtn = { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: TEXT_SECONDARY, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", padding: 4 };

function Header({ run, onClose }) {
  const freqLabel = run && run.pay_schedule ? (PAY_SCHEDULE_LABELS[run.pay_schedule] || run.pay_schedule) : "Semi-monthly";
  const scheduleDetail = run && run.pay_schedule ? (SCHEDULE_DETAIL[run.pay_schedule] || "") : "15th and end of month";
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, background: BG_CARD, borderBottom: "1px solid " + BORDER, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY }}>Run payroll</h1>
        <div style={{ background: BRAND_SOFT, color: BRAND_DARK, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, border: "1px solid " + BRAND_SOFT_BORDER }}>{freqLabel}</div>
        <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{scheduleDetail}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button style={hbtn}><Map size={14} /> Take a tour</button>
        <button style={hbtn}><MessageCircle size={14} /> Give feedback</button>
        <button style={hbtn}><HelpCircle size={14} /> Help</button>
        <button onClick={onClose} aria-label="Close" style={{ ...hbtn, padding: 6 }}><X size={18} /></button>
      </div>
    </div>
  );
}

function PeriodControls({ run }) {
  const start = run && (run.pay_period_start || run.payPeriodStart);
  const end = run && (run.pay_period_end || run.payPeriodEnd);
  const payDate = run && (run.pay_date || run.payDate);
  const periodText = start && end ? fmtDate(start) + " to " + fmtDate(end) : "Pay period";
  const payDateText = payDate ? fmtDate(payDate) : "Pay date";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <Field label="Pay period" value={periodText} icon={Calendar} />
      <Field label="Pay date" value={payDateText} icon={Calendar} />
      <div style={{ flex: 1 }} />
      <button style={{ ...hbtn, color: BRAND, fontWeight: 600 }}><Plus size={14} /> Add an employee</button>
    </div>
  );
}
function Field({ label, value, icon: Icon }) {
  return (
    <div style={{ background: BG_CARD, border: "1px solid " + BORDER, borderRadius: 10, padding: "10px 14px", minWidth: 220 }}>
      <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: TEXT_PRIMARY, fontSize: 14, fontWeight: 600 }}>
        {Icon && <Icon size={15} color={TEXT_SECONDARY} />}{value}
      </div>
    </div>
  );
}

function ReadinessBar({ counts, issues, onIssueAction }) {
  return (
    <div style={{ background: BG_CARD, border: "1px solid " + BORDER, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={18} color={BRAND} />
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Payroll readiness</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {counts.ready > 0 && <Pill label={counts.ready + " ready to pay"} tone="ok" />}
          {counts.needsSetup > 0 && <Pill label={counts.needsSetup + " needs setup"} tone="warn" />}
          {counts.toReview > 0 && <Pill label={counts.toReview + " to review"} tone="warn" />}
          {counts.notes > 0 && <Pill label={counts.notes + " " + (counts.notes === 1 ? "note" : "notes")} tone="info" />}
          {counts.ready === 0 && counts.needsSetup === 0 && counts.toReview === 0 && counts.notes === 0 && (
            <Pill label="No employees in this run" tone="muted" />
          )}
        </div>
      </div>
      {issues.length > 0 && (
        <div style={{ marginTop: 12, borderTop: "1px solid " + BORDER_LIGHT, paddingTop: 8 }}>
          {issues.map((issue) => (
            <div key={issue.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", gap: 12 }}>
              <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.4 }}>{issue.text}</div>
              <button onClick={() => onIssueAction(issue)} style={{ background: "transparent", border: "none", color: BRAND, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", whiteSpace: "nowrap", padding: 0 }}>{issue.actionLabel}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Pill({ label, tone }) {
  const palette = tone === "ok" ? { bg: BRAND_SOFT, c: BRAND_DARK, b: BRAND_SOFT_BORDER }
    : tone === "warn" ? { bg: WARN_BG, c: WARN_TX, b: WARN_BORDER }
    : tone === "info" ? { bg: INFO_BG, c: INFO_TX, b: INFO_BORDER }
    : { bg: BG_HOVER, c: TEXT_SECONDARY, b: BORDER };
  return <div style={{ background: palette.bg, color: palette.c, border: "1px solid " + palette.b, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{label}</div>;
}
function VisitSourceCaption({ hoursSource, totalHours }) {
  if (hoursSource && hoursSource.type === "visits" && hoursSource.visitCount > 0) {
    const onClick = () => {
      // Visit list drawer for this employee and period lands in a later step.
    };
    const word = hoursSource.visitCount === 1 ? "visit" : "visits";
    return (
      <button onClick={onClick} title="View visits" style={{ background: "transparent", border: "none", padding: 0, marginTop: 2, color: BRAND, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", lineHeight: 1.2, whiteSpace: "nowrap" }}>
        from {hoursSource.visitCount} {word}
      </button>
    );
  }
  if (!totalHours) {
    return <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2, whiteSpace: "nowrap" }}>no time imported</div>;
  }
  return <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2, whiteSpace: "nowrap" }}>manual entry</div>;
}

function FlagChip({ flag }) {
  const isWarn = flag.level === "warn";
  const palette = isWarn ? { bg: WARN_BG, c: WARN_TX } : { bg: INFO_BG, c: INFO_TX };
  const Icon = isWarn ? AlertTriangle : TrendingUp;
  return (
    <div style={{ background: palette.bg, color: palette.c, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Icon size={11} /><span>{flag.text}</span>
    </div>
  );
}

function SummaryCards({ activeCount, total, totalHrs, totalGross }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
      <Card label="Employees in this run" value={activeCount + " of " + total} />
      <Card label="Total hours" value={fmtHours(totalHrs)} />
      <Card label="Total gross pay" value={"$" + fmtMoney(totalGross)} />
    </div>
  );
}
function Card({ label, value }) {
  return (
    <div style={{ background: BG_CARD, border: "1px solid " + BORDER, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY }}>{value}</div>
    </div>
  );
}
function Toolbar() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={ghostBtn}><Filter size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} /> Filters</button>
        <div style={{ position: "relative" }}>
          <Search size={14} color={TEXT_MUTED} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input placeholder="Search employees" style={{ padding: "9px 12px 9px 32px", border: "1px solid " + BORDER, borderRadius: 8, fontSize: 13, fontFamily: "inherit", width: 240, background: BG_CARD, color: TEXT_PRIMARY }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={ghostBtn}><Download size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} /> Export</button>
        <button style={ghostBtn}><Settings size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} /> Customize</button>
      </div>
    </div>
  );
}

function Table({ lines, selected, dismissed, allChecked, someChecked, onToggleAll, onToggleOne, active, onUpdateLine, onApplyMemoAll, onSkip, onAdd }) {
  if (lines.length === 0) {
    return <div style={{ background: BG_CARD, border: "1px solid " + BORDER, borderRadius: 12, padding: 40, textAlign: "center", color: TEXT_SECONDARY, fontSize: 14 }}>No employees yet. Add an employee to start running payroll.</div>;
  }
  const totals = {
    regular: active.reduce((a, l) => a + parseFloat(l.regularHours || 0), 0),
    stat: active.reduce((a, l) => a + parseFloat(l.statHolidayHours || 0), 0),
    statAvg: active.reduce((a, l) => a + parseFloat(l.statAvgPay || 0), 0),
    hours: active.reduce((a, l) => a + totalHours(l), 0),
    gross: active.reduce((a, l) => a + grossPay(l), 0)
  };
  return (
    <div style={{ background: BG_CARD, border: "1px solid " + BORDER, borderRadius: 12, overflow: "visible" }}>
      <div style={{ overflowX: "auto", overflowY: "visible" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 1100 }}>
          <thead>
            <tr style={{ background: BG_HOVER, borderBottom: "1px solid " + BORDER }}>
              <Th width={42} center>
                <input type="checkbox" checked={allChecked} ref={(el) => { if (el) el.indeterminate = someChecked; }} onChange={onToggleAll} style={{ cursor: "pointer" }} />
              </Th>
              <Th>Employees <span style={{ color: TEXT_MUTED, fontWeight: 500 }}>{"\u00b7"} {active.length} of {lines.length}</span></Th>
              <Th right>Regular pay</Th>
              <Th right>Stat holiday pay</Th>
              <Th right>Stat pay (avg)</Th>
              <Th right>Total hrs</Th>
              <Th right>Gross pay</Th>
              <Th center>Memo</Th>
              <Th>Pay method</Th>
              <Th width={42}></Th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <Row
                key={line.employeeId} line={line}
                checked={!!selected[line.employeeId]}
                dismissedForLine={dismissed[line.employeeId] || {}}
                onToggle={() => onToggleOne(line.employeeId)}
                onUpdate={(patch) => onUpdateLine(line.employeeId, patch)}
                onApplyMemoAll={onApplyMemoAll}
                onSkip={() => onSkip(line.employeeId)}
                onAdd={() => onAdd(line.employeeId)}
              />
            ))}
            <TotalRow totals={totals} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Th({ children, right, center, width }) {
  return <th style={{ padding: "10px 12px", textAlign: right ? "right" : (center ? "center" : "left"), fontSize: 11, fontWeight: 600, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4, width: width || "auto", whiteSpace: "nowrap" }}>{children}</th>;
}
function Td({ children, right, center, muted, width, colSpan, style }) {
  return <td colSpan={colSpan} style={{ padding: "14px 12px 26px 12px", textAlign: right ? "right" : (center ? "center" : "left"), fontSize: 13, color: muted ? TEXT_MUTED : TEXT_PRIMARY, width: width || "auto", verticalAlign: "middle", borderBottom: "1px solid " + BORDER_LIGHT, fontVariantNumeric: right ? "tabular-nums" : "normal", ...(style || {}) }}>{children}</td>;
}

function Row({ line, checked, dismissedForLine, onToggle, onUpdate, onApplyMemoAll, onSkip, onAdd }) {
  const first = empFirst(line.employee || line);
  if (!line.setupComplete) {
    const missing = line.setupMissing.length > 0 ? line.setupMissing.join(", ") : "personal info, pay types and a payment method";
    return (
      <tr id={"row-" + line.employeeId} style={{ background: BG_CARD }}>
        <Td center><input type="checkbox" disabled style={{ cursor: "not-allowed" }} /></Td>
        <Td muted>{line.displayName}<div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{line.payTypeLabel}</div></Td>
        <Td colSpan={6}>
          <span style={{ color: TEXT_SECONDARY }}>Add {missing} to pay {first}. </span>
          <span style={{ color: BRAND, fontWeight: 600, cursor: "pointer" }}>Finish setup</span>
        </Td>
        <Td></Td>
        <Td center><RowActions variant="needs_setup" /></Td>
      </tr>
    );
  }
  if (!checked) {
    return (
      <tr id={"row-" + line.employeeId} style={{ background: BG_CARD, opacity: 0.7 }}>
        <Td center><input type="checkbox" checked={false} onChange={onToggle} style={{ cursor: "pointer" }} /></Td>
        <Td>{line.displayName}<div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{line.payTypeLabel}</div></Td>
        <Td colSpan={6}>
          <span style={{ color: TEXT_SECONDARY }}>{first} is skipped from this payroll run. </span>
          <button onClick={onAdd} style={{ background: "transparent", border: "none", color: BRAND, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0, fontSize: 13 }}>Add to payroll run</button>
        </Td>
        <Td></Td>
        <Td center><RowActions variant="skipped" onAdd={onAdd} /></Td>
      </tr>
    );
  }
  const tHrs = totalHours(line);
  const gross = grossPay(line);
  const flags = flagsFor(line, true, dismissedForLine);
  return (
    <tr id={"row-" + line.employeeId} style={{ background: BG_CARD }}>
      <Td center><input type="checkbox" checked onChange={onToggle} style={{ cursor: "pointer" }} /></Td>
      <Td>
        <div style={{ color: BRAND, fontWeight: 600 }}>{line.displayName}</div>
        <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{line.payTypeLabel}</div>
        {flags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {flags.map((f, i) => <FlagChip key={i} flag={f} />)}
          </div>
        )}
      </Td>
      <Td right><EditableCell id={"cell-" + line.employeeId + "-regular"} value={line.regularHours} type="hours" rate={line.rate} onCommit={(v) => onUpdate({ regularHours: v, hoursSource: { type: "manual" }})} /></Td>
      <Td right><EditableCell id={"cell-" + line.employeeId + "-stat"} value={line.statHolidayHours} type="hours" onCommit={(v) => onUpdate({ statHolidayHours: v, hoursSource: { type: "manual" }})} /></Td>
      <Td right><EditableCell id={"cell-" + line.employeeId + "-statavg"} value={line.statAvgPay} type="dollar" onCommit={(v) => onUpdate({ statAvgPay: v })} /></Td>
      <Td right>
        <div style={{ fontWeight: 600 }}>{fmtHours(tHrs)}</div>
        <VisitSourceCaption hoursSource={line.hoursSource} totalHours={tHrs} />
      </Td>
      <Td right>${fmtMoney(gross)}</Td>
      <Td center><MemoCell line={line} onUpdate={onUpdate} onApplyAll={onApplyMemoAll} /></Td>
      <Td><PayMethodCell line={line} onUpdate={onUpdate} /></Td>
      <Td center><RowActions variant="active" onSkip={onSkip} /></Td>
    </tr>
  );
}

function EditableCell({ id, value, onCommit, type, rate }) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  const start = () => {
    if (type === "dollar") setDraft(formatMoneyBlur(value));
    else { const n = parseFloat(value || 0); setDraft(n === 0 ? "" : String(n)); }
    setEditing(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      try { inputRef.current.select(); } catch (e) {}
    }
  }, [editing]);

  const commit = () => {
    let final;
    if (type === "dollar") final = parseMoneyToNumber(draft);
    else { final = parseFloat(draft); if (isNaN(final) || final < 0) final = 0; }
    if (final !== parseFloat(value || 0)) onCommit(final);
    setEditing(false);
  };
  const cancel = () => { setDraft(""); setEditing(false); };

  const handleChange = (e) => {
    if (type === "dollar") setDraft(formatMoneyLive(e.target.value));
    else {
      const cleaned = e.target.value.replace(/[^0-9.]/g, "");
      const parts = cleaned.split(".");
      const trimmed = parts.length > 1 ? parts[0] + "." + parts.slice(1).join("").slice(0, 2) : cleaned;
      setDraft(trimmed);
    }
  };

  const showBox = editing || hovered;
  const boxStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: type === "dollar" ? "space-between" : "flex-end",
    minWidth: 118,
    height: 40,
    padding: "0 12px",
    borderRadius: 9,
    border: editing ? "1px solid " + BRAND : (showBox ? "1px solid " + BORDER : "1px solid transparent"),
    background: showBox ? "#fff" : "transparent",
    boxShadow: editing ? "0 0 0 3px rgba(15,149,153,0.12)" : "none",
    cursor: "text",
    transition: "border 0.12s, box-shadow 0.12s, background 0.12s",
    boxSizing: "border-box",
    gap: 6
  };

  const onBoxClick = () => {
    if (!editing) start();
    else if (inputRef.current) inputRef.current.focus();
  };

  const isZero = !value || parseFloat(value) === 0;
  const dollarText = fmtMoney(value || 0);
  const hoursText = parseFloat(value || 0) === 0 ? "0" : fmtHours(value || 0);

  const showRateHint = type === "hours" && rate > 0 && (editing || parseFloat(value || 0) > 0);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div id={id} onClick={onBoxClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={boxStyle}>
        {type === "dollar" && (
          <span style={{ color: TEXT_SECONDARY, fontWeight: 500, fontSize: 14, flexShrink: 0 }}>$</span>
        )}
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={draft}
            onChange={handleChange}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } if (e.key === "Escape") { e.preventDefault(); cancel(); } }}
            placeholder={type === "dollar" ? "0.00" : "0"}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, fontFamily: "inherit", color: TEXT_PRIMARY, textAlign: "right", width: type === "dollar" ? "100%" : "auto", minWidth: 40, padding: 0, MozAppearance: "textfield" }}
          />
        ) : (
          <span style={{ color: isZero ? TEXT_MUTED : TEXT_PRIMARY, fontSize: 14 }}>
            {type === "dollar" ? dollarText : hoursText}
          </span>
        )}
        {type === "hours" && (
          <span style={{ color: TEXT_SECONDARY, fontWeight: 500, fontSize: 14, flexShrink: 0 }}>h</span>
        )}
      </div>
      {showRateHint && (
        <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, fontSize: 11, color: TEXT_MUTED, whiteSpace: "nowrap", pointerEvents: "none" }}>
          ${fmtMoney(rate)}/hr
        </div>
      )}
    </div>
  );
}

function MemoCell({ line, onUpdate, onApplyAll }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(line.memo || "");
  const [applyAll, setApplyAll] = useState(false);
  const [position, setPosition] = useState({ horizontal: "right", vertical: "top" });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => { setDraft(line.memo || ""); }, [line.memo]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleOpen = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const PW = 340;
    const PH = 320;
    const GAP = 16;
    const spaceRight = window.innerWidth - rect.right - GAP;
    const spaceLeft = rect.left - GAP;
    const horizontal = spaceRight >= PW ? "right" : (spaceLeft >= PW ? "left" : "right");
    const spaceBelow = window.innerHeight - rect.top - GAP;
    const spaceAbove = rect.bottom - GAP;
    const vertical = spaceBelow >= PH ? "top" : (spaceAbove >= PH ? "bottom" : "top");
    setPosition({ horizontal, vertical });
    setOpen(true);
  };

  const handleSave = () => {
    if (applyAll) onApplyAll(draft); else onUpdate({ memo: draft });
    setOpen(false); setApplyAll(false);
  };

  const remaining = 250 - draft.length;
  const hasMemo = (line.memo || "").length > 0;

  const popoverStyle = {
    position: "absolute",
    width: 320,
    zIndex: 60,
    background: BG_CARD,
    border: "1px solid " + BORDER,
    borderRadius: 10,
    boxShadow: "0 16px 36px rgba(15,23,42,0.15)",
    padding: 16,
    textAlign: "left",
    boxSizing: "border-box"
  };
  if (position.horizontal === "right") popoverStyle.left = "calc(100% + 12px)";
  else popoverStyle.right = "calc(100% + 12px)";
  if (position.vertical === "top") popoverStyle.top = 0;
  else popoverStyle.bottom = 0;

  const arrowStyle = {
    position: "absolute",
    width: 10,
    height: 10,
    background: BG_CARD,
    transform: "rotate(45deg)"
  };
  if (position.horizontal === "right") {
    arrowStyle.left = -5;
    arrowStyle.borderTop = "1px solid " + BORDER;
    arrowStyle.borderLeft = "1px solid " + BORDER;
  } else {
    arrowStyle.right = -5;
    arrowStyle.borderTop = "1px solid " + BORDER;
    arrowStyle.borderRight = "1px solid " + BORDER;
  }
  if (position.vertical === "top") arrowStyle.top = 14;
  else arrowStyle.bottom = 14;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={triggerRef}
        onClick={handleOpen}
        title={hasMemo ? line.memo : ""}
        style={hasMemo ? {
          background: BRAND_SOFT, border: "1px solid " + BRAND_SOFT_BORDER,
          color: BRAND_DARK, width: 30, height: 28, borderRadius: 6, cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center"
        } : {
          background: "transparent", border: "1px dashed " + BORDER,
          color: TEXT_MUTED, width: 30, height: 28, borderRadius: 6, cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center"
        }}
      >
        {hasMemo ? <MessageSquare size={14} /> : <Plus size={14} />}
      </button>
      {open && (
        <div ref={popoverRef} style={popoverStyle}>
          <div style={arrowStyle} />
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>Memo</div>
          <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 12, lineHeight: 1.4 }}>
            {line.displayName} will see this on their pay stub.
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 250))}
            onKeyDown={(e) => {
              if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave(); }
            }}
            placeholder="Add a note for this pay stub"
            rows={4}
            autoFocus
            style={{
              width: "100%", padding: 10, fontSize: 13, fontFamily: "inherit",
              border: "1px solid " + BORDER, borderRadius: 8, resize: "vertical",
              color: TEXT_PRIMARY, outline: "none", boxSizing: "border-box",
              minHeight: 84
            }}
          />
          <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4, textAlign: "right" }}>
            {remaining} characters left
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: TEXT_SECONDARY, marginTop: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} style={{ cursor: "pointer" }} />
            Apply to all employees
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "1px solid " + BORDER_LIGHT }}>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "transparent", border: "none", color: TEXT_SECONDARY, padding: "8px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{ background: "#0E3B3A", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PayMethodCell({ line, onUpdate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const label = line.payMethod === "direct_deposit" ? "Direct deposit" : "Paper cheque";
  const choose = (val) => { onUpdate({ payMethod: val }); setOpen(false); };
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen((v) => !v)} style={{ background: "transparent", border: "1px solid " + BORDER, color: TEXT_PRIMARY, padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
        {label} <ChevronDown size={13} color={TEXT_MUTED} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50, background: BG_CARD, border: "1px solid " + BORDER, borderRadius: 8, boxShadow: "0 12px 24px rgba(15,23,42,0.12)", minWidth: 180, padding: 4 }}>
          <Option label="Direct deposit" selected={line.payMethod === "direct_deposit"} onClick={() => choose("direct_deposit")} />
          <Option label="Paper cheque" selected={line.payMethod === "paper_cheque"} onClick={() => choose("paper_cheque")} />
        </div>
      )}
    </div>
  );
}
function Option({ label, selected, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "transparent", color: TEXT_PRIMARY, fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "inherit" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = BG_HOVER; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
      <span>{label}</span>{selected && <Check size={14} color={BRAND} />}
    </button>
  );
}

function RowActions({ variant, onSkip, onAdd }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen((v) => !v)} aria-label="Row actions" style={{ background: "transparent", border: "none", cursor: "pointer", color: TEXT_MUTED, padding: 4, borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50, background: BG_CARD, border: "1px solid " + BORDER, borderRadius: 8, boxShadow: "0 12px 24px rgba(15,23,42,0.12)", minWidth: 200, padding: 4 }}>
          {variant === "active" && (<>
            <ActionItem icon={FilePen} label="Edit paycheque" onClick={() => setOpen(false)} />
            <ActionItem icon={UserMinus} label="Skip from payroll run" danger onClick={() => { onSkip && onSkip(); setOpen(false); }} />
          </>)}
          {variant === "skipped" && (<>
            <ActionItem icon={FilePen} label="Edit paycheque" onClick={() => setOpen(false)} />
            <ActionItem icon={UserPlus} label="Add to payroll run" onClick={() => { onAdd && onAdd(); setOpen(false); }} />
          </>)}
          {variant === "needs_setup" && (<ActionItem icon={Edit3} label="Finish setup" onClick={() => setOpen(false)} />)}
        </div>
      )}
    </div>
  );
}
function ActionItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "transparent", color: danger ? DANGER : TEXT_PRIMARY, fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 4, display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = BG_HOVER; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
      <Icon size={14} /><span>{label}</span>
    </button>
  );
}

function TotalRow({ totals }) {
  return (
    <tr style={{ background: BG_PAGE, fontWeight: 700 }}>
      <Td></Td><Td>Total</Td>
      <Td right>{fmtHours(totals.regular)}</Td>
      <Td right>{fmtHours(totals.stat)}</Td>
      <Td right>${fmtMoney(totals.statAvg)}</Td>
      <Td right>{fmtHours(totals.hours)}</Td>
      <Td right>${fmtMoney(totals.gross)}</Td>
      <Td></Td><Td></Td><Td></Td>
    </tr>
  );
}

function Footer({ selectedCount, totalCount, onCancel, onSaveLater, onPreview }) {
  const label = "Preview for " + selectedCount + " employee" + (selectedCount === 1 ? "" : "s");
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: BG_CARD, borderTop: "1px solid " + BORDER, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 20, flexWrap: "wrap" }}>
      <button onClick={onCancel} style={{ ...hbtn, padding: "8px 12px" }}>Cancel</button>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{selectedCount} of {totalCount} employees selected</div>
        <button onClick={onSaveLater} style={ghostBtn}>Save for later</button>
        <button onClick={onPreview} disabled={selectedCount === 0} style={{ ...primaryBtn, padding: "10px 18px", display: "inline-flex", alignItems: "center", gap: 6, opacity: selectedCount === 0 ? 0.5 : 1, cursor: selectedCount === 0 ? "not-allowed" : "pointer" }}>
          {label} <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
