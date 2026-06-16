import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  X, Search, Filter, Download, Settings, Plus, Calendar,
  MoreVertical, HelpCircle, MessageCircle, Map, ArrowRight,
  Receipt, ChevronDown
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

const PAY_SCHEDULE_LABELS = {
  weekly: "Weekly", bi_weekly: "Bi-weekly",
  semi_monthly: "Semi-monthly", monthly: "Monthly"
};
const SCHEDULE_DETAIL = {
  weekly: "Every Friday", bi_weekly: "Every other Friday",
  semi_monthly: "15th and end of month", monthly: "End of month"
};

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  Authorization: "Bearer " + getToken(),
  "Content-Type": "application/json"
});

const fmtMoney = (n) => {
  const num = typeof n === "number" ? n : parseFloat(n || 0);
  return num.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtHours = (n) => {
  const num = typeof n === "number" ? n : parseFloat(n || 0);
  return num.toLocaleString("en-CA", { maximumFractionDigits: 2 });
};
const fmtDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
};

const empName = (e) => {
  if (!e) return "Employee";
  if (e.displayName) return e.displayName;
  const f = e.first_name || "";
  const l = e.last_name || "";
  if (l && f) return l + ", " + f;
  if (f) return f;
  if (l) return l;
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
  if (l.grossPay != null && l.grossPay !== 0) return parseFloat(l.grossPay);
  const r = parseFloat(l.rate || 0);
  return parseFloat(l.regularHours || 0) * r + parseFloat(l.statHolidayHours || 0) * r + parseFloat(l.statAvgPay || 0);
};

export default function RunPayroll() {
  const navigate = useNavigate();
  const { payRunId } = useParams();
  const [run, setRun] = useState(null);
  const [lines, setLines] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const runRes = await fetch(API_URL + "/api/v1/payroll/runs/" + payRunId, { headers: authHeaders() });
        if (!runRes.ok) throw new Error("Could not load pay run (" + runRes.status + ")");
        const runData = await runRes.json();
        const empsRes = await fetch(API_URL + "/api/v1/payroll/employees", { headers: authHeaders() });
        if (!empsRes.ok) throw new Error("Could not load employees (" + empsRes.status + ")");
        const empsData = await empsRes.json();
        const employees = Array.isArray(empsData) ? empsData : (empsData.items || empsData.employees || []);
        const initial = employees.map((e) => ({
          employeeId: e.id,
          employee: e,
          displayName: empName(e),
          payTypeLabel: e.pay_type_label || "Hourly",
          rate: parseFloat(e.rate || e.hourly_rate || 0),
          regularHours: 0, statHolidayHours: 0, statAvgPay: 0, grossPay: 0,
          inRun: true,
          setupComplete: isLineSetupComplete(e),
          setupMissing: lineSetupMissing(e),
          payMethod: e.payment_method || e.payMethod || "direct_deposit",
          memo: "",
          hoursSource: { type: "manual" }
        }));
        if (!mounted) return;
        setRun(runData);
        setLines(initial);
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

  const handleCancel = () => navigate("/payroll/overview");
  const handleSaveLater = () => alert("Save for later coming next.");
  const handlePreview = () => navigate("/payroll/run/" + payRunId + "/preview");

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
        <SummaryCards activeCount={active.length} total={lines.length} totalHrs={totalHrs} totalGross={totalGross} />
        <Toolbar />
        <Table lines={lines} selected={selected} allChecked={allChecked} someChecked={someChecked} onToggleAll={toggleAll} onToggleOne={toggleOne} active={active} />
      </div>
      <Footer selectedCount={active.length} totalCount={lines.length} onCancel={handleCancel} onSaveLater={handleSaveLater} onPreview={handlePreview} />
    </div>
  );
}

function CenterMsg({ children }) {
  return (
    <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: TEXT_SECONDARY, fontSize: 14, fontFamily: "inherit", textAlign: "center", padding: 24 }}>
      {children}
    </div>
  );
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

function Table({ lines, selected, allChecked, someChecked, onToggleAll, onToggleOne, active }) {
  if (lines.length === 0) {
    return (
      <div style={{ background: BG_CARD, border: "1px solid " + BORDER, borderRadius: 12, padding: 40, textAlign: "center", color: TEXT_SECONDARY, fontSize: 14 }}>
        No employees yet. Add an employee to start running payroll.
      </div>
    );
  }
  const totals = {
    regular: active.reduce((a, l) => a + parseFloat(l.regularHours || 0), 0),
    stat: active.reduce((a, l) => a + parseFloat(l.statHolidayHours || 0), 0),
    statAvg: active.reduce((a, l) => a + parseFloat(l.statAvgPay || 0), 0),
    hours: active.reduce((a, l) => a + totalHours(l), 0),
    gross: active.reduce((a, l) => a + grossPay(l), 0)
  };
  return (
    <div style={{ background: BG_CARD, border: "1px solid " + BORDER, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
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
              <Row key={line.employeeId} line={line} checked={!!selected[line.employeeId]} onToggle={() => onToggleOne(line.employeeId)} />
            ))}
            <TotalRow totals={totals} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, right, center, width }) {
  return (
    <th style={{ padding: "10px 12px", textAlign: right ? "right" : (center ? "center" : "left"), fontSize: 11, fontWeight: 600, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4, width: width || "auto", whiteSpace: "nowrap" }}>{children}</th>
  );
}
function Td({ children, right, center, muted, width, colSpan }) {
  return (
    <td colSpan={colSpan} style={{ padding: "12px", textAlign: right ? "right" : (center ? "center" : "left"), fontSize: 13, color: muted ? TEXT_MUTED : TEXT_PRIMARY, width: width || "auto", verticalAlign: "middle", borderBottom: "1px solid " + BORDER_LIGHT, fontVariantNumeric: right ? "tabular-nums" : "normal" }}>{children}</td>
  );
}

function Row({ line, checked, onToggle }) {
  const first = empFirst(line.employee || line);
  if (!line.setupComplete) {
    const missing = line.setupMissing.length > 0 ? line.setupMissing.join(", ") : "personal info, pay types and a payment method";
    return (
      <tr style={{ background: BG_CARD }}>
        <Td center><input type="checkbox" disabled style={{ cursor: "not-allowed" }} /></Td>
        <Td muted>{line.displayName}<div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{line.payTypeLabel}</div></Td>
        <Td colSpan={6}>
          <span style={{ color: TEXT_SECONDARY }}>Add {missing} to pay {first}. </span>
          <a href="#finish" style={{ color: BRAND, fontWeight: 600, textDecoration: "none" }}>Finish setup</a>
        </Td>
        <Td></Td>
        <Td center><button style={{ background: "transparent", border: "none", cursor: "pointer", color: TEXT_MUTED, padding: 4 }}><MoreVertical size={16} /></button></Td>
      </tr>
    );
  }
  if (!checked) {
    return (
      <tr style={{ background: BG_CARD, opacity: 0.7 }}>
        <Td center><input type="checkbox" checked={false} onChange={onToggle} style={{ cursor: "pointer" }} /></Td>
        <Td>{line.displayName}<div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{line.payTypeLabel}</div></Td>
        <Td colSpan={6}>
          <span style={{ color: TEXT_SECONDARY }}>{first} is skipped from this payroll run. </span>
          <a href="#add" onClick={(e) => { e.preventDefault(); onToggle(); }} style={{ color: BRAND, fontWeight: 600, textDecoration: "none" }}>Add to payroll run</a>
        </Td>
        <Td></Td>
        <Td center><button style={{ background: "transparent", border: "none", cursor: "pointer", color: TEXT_MUTED, padding: 4 }}><MoreVertical size={16} /></button></Td>
      </tr>
    );
  }
  const tHrs = totalHours(line);
  const gross = grossPay(line);
  const visitCaption = line.hoursSource && line.hoursSource.type === "visits" && line.hoursSource.visitCount
    ? "from " + line.hoursSource.visitCount + " visits"
    : (tHrs === 0 ? "no time imported" : "manual entry");
  return (
    <tr style={{ background: BG_CARD }}>
      <Td center><input type="checkbox" checked onChange={onToggle} style={{ cursor: "pointer" }} /></Td>
      <Td>
        <div style={{ color: BRAND, fontWeight: 600 }}>{line.displayName}</div>
        <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{line.payTypeLabel}</div>
      </Td>
      <Td right>{tHrs > 0 ? fmtHours(line.regularHours) : <span style={{ color: TEXT_MUTED }}>0</span>}</Td>
      <Td right>{line.statHolidayHours > 0 ? fmtHours(line.statHolidayHours) : <span style={{ color: TEXT_MUTED }}>0</span>}</Td>
      <Td right>{line.statAvgPay > 0 ? "$" + fmtMoney(line.statAvgPay) : <span style={{ color: TEXT_MUTED }}>$0.00</span>}</Td>
      <Td right>
        <div style={{ fontWeight: 600 }}>{fmtHours(tHrs)}</div>
        <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{visitCaption}</div>
      </Td>
      <Td right>${fmtMoney(gross)}</Td>
      <Td center>
        <button style={{ background: "transparent", border: "1px dashed " + BORDER, color: TEXT_MUTED, padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
          <Plus size={12} style={{ verticalAlign: "-1px", marginRight: 2 }} />
        </button>
      </Td>
      <Td>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: TEXT_PRIMARY, fontSize: 13 }}>
          {line.payMethod === "direct_deposit" ? "Direct deposit" : "Paper cheque"}
          <ChevronDown size={13} color={TEXT_MUTED} />
        </div>
      </Td>
      <Td center><button style={{ background: "transparent", border: "none", cursor: "pointer", color: TEXT_MUTED, padding: 4 }}><MoreVertical size={16} /></button></Td>
    </tr>
  );
}

function TotalRow({ totals }) {
  return (
    <tr style={{ background: BG_PAGE, fontWeight: 700 }}>
      <Td></Td>
      <Td>Total</Td>
      <Td right>{fmtHours(totals.regular)}</Td>
      <Td right>{fmtHours(totals.stat)}</Td>
      <Td right>${fmtMoney(totals.statAvg)}</Td>
      <Td right>{fmtHours(totals.hours)}</Td>
      <Td right>${fmtMoney(totals.gross)}</Td>
      <Td></Td>
      <Td></Td>
      <Td></Td>
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
