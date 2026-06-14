import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  X, ChevronDown, ChevronUp, Sparkles, ArrowRight, Plus, Calendar,
  Filter, Search, Download, Settings, TrendingUp, MessageCircle,
  HelpCircle, Map, MoreVertical, AlertTriangle, Info, Check,
  Building, Receipt, UserMinus, ExternalLink, ShieldCheck, UserCog,
} from "lucide-react";

import {
  totalHours, flagsFor, isSetupComplete, getReadinessCounts,
  getIssues, generateNarrative, employeeName,
} from "../utils/runPayrollReadiness";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

// Tokens (mirror light.js defaults, inline per spec)
const BRAND = "#0F9599";
const BRAND_DARK = "#0F6E56";
const BRAND_SOFT = "#E1F5EE";
const BRAND_SOFT_2 = "#F0FAFA";
const BRAND_SOFT_BORDER = "#B8E2D2";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const TEXT_TERTIARY = "#9CA3AF";
const BG_CARD = "#FFFFFF";
const BG_PAGE = "#F9FAFB";
const BG_HOVER = "#FAFBFC";
const BORDER = "#E5E7EB";
const BORDER_LIGHT = "#F3F4F6";
const WARN_TEXT = "#92400E";
const WARN_SOFT = "#FEF3C7";
const WARN_BG = "#FFFBEB";
const INFO_TEXT = "#1E40AF";
const INFO_SOFT = "#DBEAFE";
const SUCCESS_TEXT = "#166534";
const SUCCESS_SOFT = "#DCFCE7";
const DANGER = "#DC2626";

const GRID = "30px 1fr 88px 80px 110px 80px 100px 56px 130px 36px";

const PAY_SCHEDULE_LABELS = {
  weekly: "Weekly",
  bi_weekly: "Bi-weekly",
  semi_monthly: "Semi-monthly",
  monthly: "Monthly",
};
const SCHEDULE_DETAIL = {
  weekly: "Every Friday",
  bi_weekly: "Every other Friday",
  semi_monthly: "15th & end of month",
  monthly: "End of month",
};

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  Authorization: "Bearer " + getToken(),
  "Content-Type": "application/json",
});

const formatCurrency = (value, currency) => {
  const n = parseFloat(value) || 0;
  return n.toLocaleString("en-CA", { style: "currency", currency: currency || "CAD", minimumFractionDigits: 2 });
};

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
};

const formatPeriod = (start, end) => {
  if (!start || !end) return "";
  return formatDate(start) + " to " + formatDate(end);
};

const emptyHours = () => ({ regular: 0, overtime: 0, vacation: 0, sick: 0, bonus: 0 });

export default function RunPayroll() {
  const navigate = useNavigate();
  const { payRunId } = useParams();

  const [run, setRun] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [lines, setLines] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [editing, setEditing] = useState({});

  useEffect(() => { loadAll(); }, [payRunId]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = authHeaders();
      const [runRes, empRes] = await Promise.all([
        fetch(API_URL + "/api/v1/payroll/runs/" + payRunId, { headers }),
        fetch(API_URL + "/api/v1/payroll/employees", { headers }),
      ]);

      if (!runRes.ok) {
        if (runRes.status === 401) throw new Error("Invalid or expired token. Please log in again.");
        if (runRes.status === 404) throw new Error("Pay run not found.");
        throw new Error("Could not load pay run.");
      }
      const runData = await runRes.json();
      setRun(runData);

      if (empRes.ok) {
        const empData = await empRes.json();
        const empList = Array.isArray(empData) ? empData : (empData.items || empData.employees || []);
        setEmployees(empList);

        const initialLines = {};
        for (const emp of empList) {
          if (emp.status === "terminated" || emp.status === "inactive") continue;
          initialLines[emp.id] = {
            employee_id: emp.id,
            hours: emptyHours(),
            inRun: isSetupComplete(emp),
            memo: "",
            payMethod: emp.payment_method || "direct_deposit",
          };
        }
        setLines(initialLines);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const activeEmployees = useMemo(() => {
    return employees.filter(e => e.status !== "terminated" && e.status !== "inactive");
  }, [employees]);

  const linesArray = useMemo(() => {
    return activeEmployees.map(emp => lines[emp.id]).filter(Boolean);
  }, [activeEmployees, lines]);

  const empById = useMemo(() => {
    const m = {};
    for (const e of employees) m[e.id] = e;
    return m;
  }, [employees]);

  const payableLines = linesArray.filter(l => isSetupComplete(empById[l.employee_id]));
  const activeLines = linesArray.filter(l => l.inRun && isSetupComplete(empById[l.employee_id]));
  const counts = useMemo(() => getReadinessCounts(linesArray, employees), [linesArray, employees]);
  const issues = useMemo(() => getIssues(linesArray, employees), [linesArray, employees]);
  const narrative = useMemo(() => generateNarrative(counts, activeLines.length, payableLines.length), [counts, activeLines.length, payableLines.length]);

  const totals = useMemo(() => {
    let totalHrs = 0, totalGross = 0;
    for (const line of activeLines) {
      const emp = empById[line.employee_id];
      const rate = parseFloat((emp || {}).hourly_rate) || 0;
      const reg = parseFloat(line.hours.regular) || 0;
      const stat = parseFloat(line.hours.vacation) || 0;
      const avg = parseFloat(line.hours.bonus) || 0;
      totalHrs += reg + stat;
      totalGross += reg * rate + stat * rate * 1.5 + avg;
    }
    return { totalHrs, totalGross };
  }, [activeLines, empById]);

  const employerTax = totals.totalGross * 0.086;
  const totalCost = totals.totalGross + employerTax;

  const startEdit = (id, val) => setEditing(prev => ({ ...prev, [id]: String(val) }));
  const cancelEdit = (id) => setEditing(prev => { const next = { ...prev }; delete next[id]; return next; });
  const commitEdit = (id, rawValue) => {
    const raw = rawValue !== undefined ? rawValue : editing[id];
    if (raw == null) return;
    const v = parseFloat(raw);
    setLines(prev => ({
      ...prev,
      [id]: { ...prev[id], hours: { ...prev[id].hours, regular: isNaN(v) ? 0 : v } }
    }));
    cancelEdit(id);
  };

  const handlePreview = () => {
    if (activeLines.length === 0) return;
    alert("Preview flow coming in next push. Active: " + activeLines.length + " employees, $" + totals.totalGross.toFixed(2) + " gross.");
  };
  const handleSaveLater = () => alert("Save for later coming next.");
  const handleCancel = () => navigate("/payroll/overview");

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: TEXT_SECONDARY, fontFamily: "inherit" }}>Loading pay run...</div>;
  }
  if (error || !run) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "inherit" }}>
        <div style={{ fontSize: 14, color: "#991B1B", marginBottom: 12 }}>{error || "Pay run not available."}</div>
        <button onClick={handleCancel} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 5, background: BRAND, color: "white", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Back to Overview</button>
      </div>
    );
  }

  const scheduleLabel = PAY_SCHEDULE_LABELS[run.pay_schedule] || PAY_SCHEDULE_LABELS.semi_monthly;
  const scheduleDetail = SCHEDULE_DETAIL[run.pay_schedule] || "";
  const currency = run.currency || "CAD";

  const colHdrStyle = { fontSize: 10, fontWeight: 500, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4 };

  return (
    <div style={{ background: BG_CARD, minHeight: "100vh", fontFamily: "inherit", width: "100%" }}>
      <div style={{ width: "100%" }}>

        <div style={{ padding: "14px 22px", borderBottom: "0.5px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: BG_CARD, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>Run payroll</h2>
            <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", background: BRAND_SOFT, color: BRAND_DARK, borderRadius: 12, fontSize: 11, fontWeight: 500 }}>{scheduleLabel}</span>
            {scheduleDetail && <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>{scheduleDetail}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <a onClick={() => alert("Tour coming soon")} style={{ fontSize: 12, color: BRAND, cursor: "pointer" }}>Take a tour</a>
            <a onClick={() => alert("Feedback coming soon")} style={{ fontSize: 12, color: TEXT_SECONDARY, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}><MessageCircle size={13} />Feedback</a>
            <HelpCircle size={15} style={{ color: TEXT_SECONDARY, cursor: "pointer" }} onClick={() => alert("Help coming soon")} />
            <X size={16} style={{ color: TEXT_SECONDARY, cursor: "pointer" }} onClick={handleCancel} />
          </div>
        </div>

        {linesArray.length > 0 && (
          <div style={{ padding: "14px 22px", borderBottom: "0.5px solid " + BORDER, background: BG_CARD }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>
                <ShieldCheck size={16} style={{ color: BRAND }} />
                Payroll readiness
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 11px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: counts.ready > 0 ? SUCCESS_SOFT : BORDER_LIGHT, color: counts.ready > 0 ? SUCCESS_TEXT : TEXT_TERTIARY }}>
                  <Check size={11} />{counts.ready} ready to pay
                </span>
                {counts.needsSetup > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 11px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: WARN_SOFT, color: WARN_TEXT }}>
                    <UserCog size={11} />{counts.needsSetup} needs setup
                  </span>
                )}
                {counts.toReview > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 11px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: WARN_SOFT, color: WARN_TEXT }}>
                    <AlertTriangle size={11} />{counts.toReview} to review
                  </span>
                )}
                {counts.notes > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 11px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: INFO_SOFT, color: INFO_TEXT }}>
                    <Info size={11} />{counts.notes} note{counts.notes === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
            {issues.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + BORDER_LIGHT, display: "flex", flexDirection: "column", gap: 2 }}>
                {issues.map((iss, i) => {
                  const iconColor = iss.level === "info" ? INFO_TEXT : WARN_TEXT;
                  const Icon = iss.type === "no_hours" || iss.type === "variance_review" || iss.type === "dd_not_ready" ? AlertTriangle : iss.type === "variance_note" ? TrendingUp : iss.type === "needs_setup" ? UserCog : Info;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 4px", fontSize: 13 }}>
                      <Icon size={14} style={{ color: iconColor, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 500, color: TEXT_PRIMARY }}>{iss.nameLabel}</span>
                        {iss.sep && <span style={{ color: TEXT_TERTIARY, margin: "0 4px" }}>{"\u00b7"}</span>}
                        {!iss.sep && " "}
                        <span style={{ color: TEXT_SECONDARY }}>{iss.text}</span>
                      </div>
                      <a style={{ color: BRAND, fontWeight: 500, cursor: "pointer", flexShrink: 0 }}>{iss.linkLabel}</a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 16, borderBottom: "0.5px solid " + BORDER_LIGHT }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ ...colHdrStyle }}>Pay period</span>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", border: "0.5px solid " + BORDER, borderRadius: 5, cursor: "pointer", background: BG_CARD, fontSize: 12, color: TEXT_PRIMARY }}>
              {formatPeriod(run.pay_period_start, run.pay_period_end)} <ChevronDown size={11} style={{ color: TEXT_SECONDARY }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ ...colHdrStyle }}>Pay date</span>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", border: "0.5px solid " + BORDER, borderRadius: 5, cursor: "pointer", background: BG_CARD, fontSize: 12, color: TEXT_PRIMARY }}>
              {formatDate(run.pay_date)} <Calendar size={12} style={{ color: TEXT_SECONDARY }} />
            </div>
          </div>
          <div style={{ flex: 1 }}></div>
          <a onClick={() => navigate("/payroll/employees/new")} style={{ fontSize: 12, color: BRAND, cursor: "pointer", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Plus size={12} />Add an employee
          </a>
        </div>

        <div style={{ padding: "16px 22px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, background: BG_PAGE, borderBottom: "0.5px solid " + BORDER_LIGHT }}>
          <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ ...colHdrStyle, marginBottom: 4 }}>Employees in this run</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: TEXT_PRIMARY }}>{activeLines.length} <span style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 400 }}>of {linesArray.length}</span></div>
          </div>
          <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ ...colHdrStyle, marginBottom: 4 }}>Total hours</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: TEXT_PRIMARY }}>{totals.totalHrs.toFixed(2)} <span style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 400 }}>hrs</span></div>
          </div>
          <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ ...colHdrStyle, marginBottom: 4 }}>Total gross pay</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: TEXT_PRIMARY }}>{formatCurrency(totals.totalGross, currency)}</div>
          </div>
        </div>

        <div style={{ padding: "12px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderBottom: "0.5px solid " + BORDER }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => alert("Filters coming next")} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 5, background: BG_CARD, border: "0.5px solid " + BORDER, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, color: TEXT_PRIMARY, fontFamily: "inherit", fontWeight: 500 }}>
              <Filter size={12} />Filters
            </button>
            <div style={{ position: "relative" }}>
              <Search size={12} style={{ color: TEXT_SECONDARY, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input placeholder="Search employees" style={{ width: 200, padding: "6px 10px 6px 30px", fontSize: 12, borderRadius: 5, border: "0.5px solid " + BORDER, fontFamily: "inherit", boxSizing: "border-box", color: TEXT_PRIMARY }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => alert("Export coming next")} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 5, background: BG_CARD, border: "0.5px solid " + BORDER, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, color: TEXT_PRIMARY, fontFamily: "inherit", fontWeight: 500 }}>
              <Download size={12} />Export
            </button>
            <button onClick={() => alert("Customize coming next")} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 5, background: BG_CARD, border: "0.5px solid " + BORDER, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, color: TEXT_PRIMARY, fontFamily: "inherit", fontWeight: 500 }}>
              <Settings size={12} />Customize
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: GRID, columnGap: 10, alignItems: "center", padding: "10px 22px", background: BG_PAGE, borderBottom: "0.5px solid " + BORDER, ...colHdrStyle }}>
          <input type="checkbox" disabled style={{ margin: 0, width: 13, height: 13 }} />
          <div>Employees <span style={{ color: TEXT_TERTIARY }}>{"\u00b7"} {activeLines.length} of {linesArray.length}</span></div>
          <div style={{ textAlign: "right" }}>Regular pay</div>
          <div style={{ textAlign: "right" }}>Stat holiday</div>
          <div style={{ textAlign: "right", display: "inline-flex", alignItems: "flex-start", gap: 3, justifyContent: "flex-end", lineHeight: 1.3 }}>Stat pay (avg daily wage) <HelpCircle size={11} style={{ color: TEXT_TERTIARY, cursor: "help" }} /></div>
          <div style={{ textAlign: "right" }}>Total hrs</div>
          <div style={{ textAlign: "right" }}>Gross pay</div>
          <div style={{ textAlign: "center" }}>Memo</div>
          <div>Pay method</div>
          <div></div>
        </div>

        {linesArray.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: TEXT_SECONDARY, fontSize: 13 }}>
            No employees available. <a onClick={() => navigate("/payroll/employees/new")} style={{ color: BRAND, cursor: "pointer", fontWeight: 500 }}>Add an employee</a> to start.
          </div>
        ) : linesArray.map(line => {
          const emp = empById[line.employee_id];
          if (!emp) return null;
          const setup = isSetupComplete(emp);
          const name = employeeName(emp);
          const first = (emp.first_name || "").trim() || name;
          const rate = parseFloat(emp.hourly_rate) || 0;
          const reg = parseFloat(line.hours.regular) || 0;
          const stat = parseFloat(line.hours.vacation) || 0;
          const avg = parseFloat(line.hours.bonus) || 0;
          const total = reg + stat;
          const gross = reg * rate + stat * rate * 1.5 + avg;
          const flags = flagsFor(line, emp);
          const isSkipped = setup && !line.inRun;
          const isNeedsSetup = !setup;
          const rowBg = isNeedsSetup ? WARN_BG : isSkipped ? BG_HOVER : BG_CARD;
          const showFullRow = setup && line.inRun;

          if (isNeedsSetup) {
            return (
              <div key={emp.id} style={{ display: "grid", gridTemplateColumns: GRID, columnGap: 10, alignItems: "center", padding: "12px 22px", borderBottom: "0.5px solid " + BORDER_LIGHT, fontSize: 12, background: rowBg }}>
                <input type="checkbox" disabled style={{ margin: 0, width: 13, height: 13 }} />
                <div>
                  <div style={{ fontWeight: 500, color: TEXT_SECONDARY }}>{name}</div>
                  <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginTop: 1 }}>{emp.pay_type === "salary" ? "Salary" : "Hourly"}</div>
                </div>
                <div style={{ gridColumn: "3 / span 5", fontSize: 12, color: WARN_TEXT }}>
                  Add personal info, pay types and a payment method to pay {first}. <a style={{ color: BRAND, cursor: "pointer", fontWeight: 500 }} onClick={() => navigate("/payroll/employees/" + emp.id)}>Finish setup</a>
                </div>
                <div></div><div></div>
                <MoreVertical size={14} style={{ color: TEXT_SECONDARY, cursor: "pointer", textAlign: "center" }} />
              </div>
            );
          }

          if (isSkipped) {
            return (
              <div key={emp.id} style={{ display: "grid", gridTemplateColumns: GRID, columnGap: 10, alignItems: "center", padding: "12px 22px", borderBottom: "0.5px solid " + BORDER_LIGHT, fontSize: 12, color: TEXT_SECONDARY, background: rowBg }}>
                <input type="checkbox" style={{ margin: 0, width: 13, height: 13 }} />
                <div>
                  <div style={{ fontWeight: 500, color: TEXT_SECONDARY }}>{name}</div>
                  <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginTop: 1 }}>{emp.pay_type === "salary" ? "Salary" : "Hourly"}</div>
                </div>
                <div style={{ gridColumn: "3 / span 5", fontSize: 12, color: TEXT_SECONDARY }}>
                  {first} is skipped from this payroll run. <a style={{ color: BRAND, cursor: "pointer", fontWeight: 500 }}>Add to payroll run</a>
                </div>
                <div></div><div></div>
                <MoreVertical size={14} style={{ color: TEXT_SECONDARY, cursor: "pointer", textAlign: "center" }} />
              </div>
            );
          }

          return (
            <div key={emp.id} style={{ display: "grid", gridTemplateColumns: GRID, columnGap: 10, alignItems: "center", padding: "12px 22px", borderBottom: "0.5px solid " + BORDER_LIGHT, fontSize: 12, color: TEXT_PRIMARY }}>
              <input type="checkbox" checked={line.inRun} readOnly style={{ margin: 0, width: 13, height: 13, accentColor: BRAND }} />
              <div>
                <div style={{ fontWeight: 500 }}><a style={{ color: BRAND, cursor: "pointer" }} onClick={() => navigate("/payroll/employees/" + emp.id)}>{name}</a></div>
                <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 1 }}>{emp.pay_type === "salary" ? "Salary" : "Hourly"}</div>
                {flags.length > 0 && (
                  <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {flags.map((f, i) => (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", background: f.level === "info" ? INFO_SOFT : WARN_SOFT, color: f.level === "info" ? INFO_TEXT : WARN_TEXT, borderRadius: 8, fontSize: 10, fontWeight: 500 }}>
                        {f.level === "info" ? <TrendingUp size={10} /> : <AlertTriangle size={10} />}
                        {f.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {editing[line.employee_id] != null ? (
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={editing[line.employee_id]}
                onChange={(e) => setEditing(prev => ({ ...prev, [line.employee_id]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") commitEdit(line.employee_id, e.target.value); else if (e.key === "Escape") cancelEdit(line.employee_id); }}
                onBlur={(e) => commitEdit(line.employee_id, e.target.value)}
                style={{ width: 64, padding: "4px 6px", border: "1px solid #0F9599", borderRadius: 4, fontSize: 13, textAlign: "right", outline: "none", fontFamily: "inherit", fontVariantNumeric: "tabular-nums" }}
              />
            ) : (
              <span onClick={() => startEdit(line.employee_id, reg)} style={{ cursor: "pointer", display: "inline-block", padding: "2px 4px", borderRadius: 3, minWidth: 40 }}>{reg.toFixed(2)}</span>
            )}
                {reg > 0 && <div style={{ fontSize: 10, color: TEXT_TERTIARY, marginTop: 1 }}>{formatCurrency(rate, currency)}/hr</div>}
              </div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: stat > 0 ? TEXT_PRIMARY : TEXT_TERTIARY }}>{stat.toFixed(2)}</div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: avg > 0 ? TEXT_PRIMARY : TEXT_TERTIARY }}>{formatCurrency(avg, currency)}</div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                <div style={{ color: total > 0 ? TEXT_PRIMARY : TEXT_TERTIARY }}>{total.toFixed(2)}</div>
                <div style={{ fontSize: 10, color: TEXT_TERTIARY, marginTop: 1 }}>manual entry</div>
              </div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500, color: gross > 0 ? TEXT_PRIMARY : TEXT_TERTIARY }}>{formatCurrency(gross, currency)}</div>
              <div style={{ textAlign: "center" }}>
                <button style={{ width: 22, height: 22, border: "0.5px dashed " + BORDER, borderRadius: 5, background: BG_CARD, cursor: "pointer", color: TEXT_TERTIARY, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus size={12} />
                </button>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 5, cursor: "pointer", fontSize: 11, color: TEXT_PRIMARY }}>
                {line.payMethod === "cheque" || line.payMethod === "paper_cheque" ? <Receipt size={12} /> : <Building size={12} />}
                {line.payMethod === "cheque" || line.payMethod === "paper_cheque" ? "Paper cheque" : "Direct deposit"}
                <ChevronDown size={10} style={{ color: TEXT_SECONDARY, marginLeft: "auto" }} />
              </div>
              <MoreVertical size={14} style={{ color: TEXT_SECONDARY, cursor: "pointer", textAlign: "center" }} />
            </div>
          );
        })}

        {linesArray.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: GRID, columnGap: 10, alignItems: "center", padding: "12px 22px", background: BG_PAGE, fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500 }}>
            <div></div>
            <div>Total</div>
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{activeLines.reduce((s, l) => s + (parseFloat(l.hours.regular) || 0), 0).toFixed(2)}</div>
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{activeLines.reduce((s, l) => s + (parseFloat(l.hours.vacation) || 0), 0).toFixed(2)}</div>
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(activeLines.reduce((s, l) => s + (parseFloat(l.hours.bonus) || 0), 0), currency)}</div>
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{totals.totalHrs.toFixed(2)}</div>
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(totals.totalGross, currency)}</div>
            <div></div><div></div><div></div>
          </div>
        )}

        {totals.totalGross > 0 && (
          <div style={{ padding: "12px 22px", background: BRAND_SOFT_2, borderTop: "0.5px solid " + BRAND_SOFT_BORDER, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Info size={13} style={{ color: BRAND_DARK }} />
              <span style={{ fontSize: 11, color: BRAND_DARK, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.4 }}>Estimated total cost</span>
            </div>
            <div style={{ display: "flex", gap: 24, fontSize: 12, color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums", flexWrap: "wrap" }}>
              <span><span style={{ color: TEXT_SECONDARY }}>Gross pay:</span> <strong style={{ fontWeight: 500 }}>{formatCurrency(totals.totalGross, currency)}</strong></span>
              <span><span style={{ color: TEXT_SECONDARY }}>Employer CPP/EI:</span> <strong style={{ fontWeight: 500 }}>{formatCurrency(employerTax, currency)}</strong></span>
              <span><span style={{ color: TEXT_SECONDARY }}>Total cost:</span> <strong style={{ fontWeight: 500, color: BRAND_DARK }}>{formatCurrency(totalCost, currency)}</strong></span>
            </div>
          </div>
        )}

        <div style={{ padding: "14px 22px", borderTop: "0.5px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: BG_CARD, position: "sticky", bottom: 0, zIndex: 10 }}>
          <button onClick={handleCancel} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 5, background: BG_CARD, color: TEXT_SECONDARY, border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Cancel</button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>{activeLines.length} of {linesArray.length} employee{linesArray.length === 1 ? "" : "s"} selected</span>
            <button onClick={handleSaveLater} style={{ fontSize: 12, padding: "8px 14px", borderRadius: 5, background: BG_CARD, color: BRAND, border: "0.5px solid " + BRAND, cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Save for later</button>
            <button onClick={handlePreview} disabled={activeLines.length === 0} style={{ fontSize: 13, padding: "8px 18px", borderRadius: 5, background: activeLines.length === 0 ? "#9CA3AF" : BRAND, color: "white", border: "none", cursor: activeLines.length === 0 ? "not-allowed" : "pointer", fontWeight: 500, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
              Preview for {activeLines.length} employee{activeLines.length === 1 ? "" : "s"} <ArrowRight size={13} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
