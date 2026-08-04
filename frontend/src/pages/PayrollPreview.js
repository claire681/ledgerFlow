import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import EditPaychequeDrawer from "../components/EditPaychequeDrawer";
import { AlertTriangle, ArrowUp, ArrowDown, Check, Search, FileSearch, Minus, X } from "lucide-react";

const C = {
  ink: "#12262B",
  inkDark: "#0E1A1A",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  page: "#F4F6F8",
  card: "#FFFFFF",
  line: "#E7EAF0",
  amberBg: "#FEF6E7",
  amberInk: "#A67312",
};

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const tabular = { fontVariantNumeric: "tabular-nums" };
const API = "https://api.getnovala.com";

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("token") || "";
}

function fmtMoney(n) {
  const v = Number(n) || 0;
  return "$" + v.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-");
  return d + "/" + m + "/" + y;
}

function fmtDateFull(iso) {
  if (!iso) return "";
  const dt = new Date(iso + "T00:00:00");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[dt.getDay()] + ", " + fmtDate(iso);
}

function scheduleFrequencyLabel(freq) {
  if (!freq) return "";
  const map = {
    weekly: "Weekly",
    biweekly: "Biweekly",
    semimonthly: "Semi-monthly",
    monthly: "Monthly",
  };
  return map[freq] || freq;
}

function CompareModal(props) {
  var stubId = props.employee && props.employee.stub_id;
  var comparison = props.comparison;
  var onClose = props.onClose;

  useEffect(function() {
    var h = function(ev) { if (ev.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return function() { window.removeEventListener("keydown", h); };
  }, [onClose]);

  if (!stubId || !comparison || !comparison.employees) return null;
  var data = comparison.employees[stubId];
  if (!data || !data.has_comparison) return null;

  var employeeName = data.employee_name || "Employee";
  var priorDate = comparison.prior_pay_date;
  var currentDate = comparison.current_pay_date;

  function fmtDateLocal(iso) {
    if (!iso) return "";
    var parts = String(iso).split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }
  function fmtM(s) {
    if (s === null || s === undefined) return null;
    var n = Number(s);
    if (isNaN(n)) return null;
    return "$" + n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtH(h) {
    if (h === null || h === undefined) return null;
    var n = Number(h);
    if (isNaN(n)) return null;
    // Trim trailing zeros
    var s = n.toFixed(2);
    s = s.replace(/\.?0+$/, "");
    return s;
  }
  function cell(v) {
    return v == null ? <span style={{ color: "#66748B" }}>-</span> : v;
  }

  var tokens = {
    ink: "#12262B", card: "#FFFFFF", page: "#F4F6F8", line: "#E7EAF0", muted: "#66748B",
  };

  var thStyle = { padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 600, color: tokens.ink, borderBottom: "1.5px solid " + tokens.ink, verticalAlign: "top" };
  var thLStyle = { padding: "12px 14px", textAlign: "left", fontSize: 13, fontWeight: 600, color: tokens.ink, borderBottom: "1.5px solid " + tokens.ink };
  var tdMoney = { padding: "8px 14px", textAlign: "right", fontSize: 13, color: tokens.ink, fontVariantNumeric: "tabular-nums", borderBottom: "1px solid " + tokens.line };
  var tdLabel = { padding: "8px 14px", textAlign: "left", fontSize: 13, color: tokens.ink, borderBottom: "1px solid " + tokens.line };
  var sectionRow = { background: tokens.page };
  var sectionCell = { padding: "10px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: tokens.ink, borderBottom: "1px solid " + tokens.line };
  var summaryLabel = Object.assign({}, tdLabel, { fontWeight: 700, paddingLeft: 30 });
  var summaryVal = Object.assign({}, tdMoney, { fontWeight: 700 });

  // Build comp lines - union of both sides
  var priorLines = (data.prior && data.prior.compensation_lines) || [];
  var currentLines = (data.current && data.current.compensation_lines) || [];
  var lineLabels = [];
  priorLines.forEach(function(l) { if (lineLabels.indexOf(l.label) < 0) lineLabels.push(l.label); });
  currentLines.forEach(function(l) { if (lineLabels.indexOf(l.label) < 0) lineLabels.push(l.label); });

  function findLine(lines, label) {
    for (var i = 0; i < lines.length; i++) if (lines[i].label === label) return lines[i];
    return null;
  }

  var priorNet = data.prior && data.prior.net_pay ? data.prior.net_pay : null;
  var currentNet = data.current && data.current.net_pay ? data.current.net_pay : null;
  var priorTaxes = data.prior && data.prior.taxes_and_deductions ? data.prior.taxes_and_deductions : null;
  var currentTaxes = data.current && data.current.taxes_and_deductions ? data.current.taxes_and_deductions : null;
  var priorTotal = data.prior && data.prior.total_pay ? data.prior.total_pay : null;
  var currentTotal = data.current && data.current.total_pay ? data.current.total_pay : null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(14, 26, 26, 0.45)", zIndex: 1300 }} />
      <div role="dialog" aria-label="Compare to last regular payday" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: tokens.card, borderRadius: 14, maxWidth: 720, width: "calc(100% - 48px)", maxHeight: "calc(100vh - 96px)", overflowY: "auto", padding: 32, zIndex: 1301, boxShadow: "0 12px 40px rgba(18, 38, 43, 0.18)", fontFamily: "Inter, sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: tokens.ink }}>Compare to last regular payday</div>
          <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "none", cursor: "pointer", color: tokens.muted, padding: 4, borderRadius: 6, display: "inline-flex" }}>
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid " + tokens.line }}>
          <thead>
            <tr>
              <th style={thLStyle}>Employee: {employeeName}</th>
              <th style={thStyle}>
                <div>Last Payday</div>
                <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 500, marginTop: 2 }}>({fmtDateLocal(priorDate)})</div>
              </th>
              <th style={thStyle}>
                <div>Current Payday</div>
                <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 500, marginTop: 2 }}>({fmtDateLocal(currentDate)})</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* COMPENSATION section */}
            <tr style={sectionRow}>
              <td colSpan={3} style={sectionCell}>COMPENSATION</td>
            </tr>
            {lineLabels.map(function(label) {
              var pl = findLine(priorLines, label);
              var cl = findLine(currentLines, label);
              var priorAmt = pl ? fmtM(pl.amount) : null;
              var curAmt = cl ? fmtM(cl.amount) : null;
              var priorRate = pl ? (pl.rate ? fmtM(pl.rate) : null) : null;
              var curRate = cl ? (cl.rate ? fmtM(cl.rate) : null) : null;
              var priorHours = pl ? (pl.hours ? fmtH(pl.hours) : null) : null;
              var curHours = cl ? (cl.hours ? fmtH(cl.hours) : null) : null;
              var showSubRows = priorRate || curRate || priorHours || curHours;
              return (
                <React.Fragment key={label}>
                  <tr>
                    <td style={Object.assign({}, tdLabel, { paddingLeft: 30 })}>{label}</td>
                    <td style={tdMoney}>{cell(priorAmt)}</td>
                    <td style={tdMoney}>{cell(curAmt)}</td>
                  </tr>
                  {showSubRows && (
                    <>
                      <tr>
                        <td style={Object.assign({}, tdLabel, { paddingLeft: 46, color: tokens.muted, fontSize: 12 })}>Rate</td>
                        <td style={Object.assign({}, tdMoney, { color: tokens.muted, fontSize: 12 })}>{cell(priorRate ? priorRate + "/hour" : null)}</td>
                        <td style={Object.assign({}, tdMoney, { color: tokens.muted, fontSize: 12 })}>{cell(curRate ? curRate + "/hour" : null)}</td>
                      </tr>
                      <tr>
                        <td style={Object.assign({}, tdLabel, { paddingLeft: 46, color: tokens.muted, fontSize: 12 })}>Hours</td>
                        <td style={Object.assign({}, tdMoney, { color: tokens.muted, fontSize: 12 })}>{cell(priorHours)}</td>
                        <td style={Object.assign({}, tdMoney, { color: tokens.muted, fontSize: 12 })}>{cell(curHours)}</td>
                      </tr>
                    </>
                  )}
                </React.Fragment>
              );
            })}

            {/* TAXES section */}
            <tr style={sectionRow}>
              <td colSpan={3} style={sectionCell}>TAXES</td>
            </tr>
            <tr>
              <td style={Object.assign({}, tdLabel, { paddingLeft: 30 })}>Income Tax</td>
              <td style={tdMoney}>{cell(data.prior ? fmtM(data.prior.income_tax) : null)}</td>
              <td style={tdMoney}>{cell(data.current ? fmtM(data.current.income_tax) : null)}</td>
            </tr>
            <tr>
              <td style={Object.assign({}, tdLabel, { paddingLeft: 30 })}>Employment Insurance</td>
              <td style={tdMoney}>{cell(data.prior ? fmtM(data.prior.ei) : null)}</td>
              <td style={tdMoney}>{cell(data.current ? fmtM(data.current.ei) : null)}</td>
            </tr>
            <tr>
              <td style={Object.assign({}, tdLabel, { paddingLeft: 30 })}>Canada Pension Plan</td>
              <td style={tdMoney}>{cell(data.prior ? fmtM(data.prior.cpp) : null)}</td>
              <td style={tdMoney}>{cell(data.current ? fmtM(data.current.cpp) : null)}</td>
            </tr>
            <tr>
              <td style={Object.assign({}, tdLabel, { paddingLeft: 30 })}>Second Canada Pension Plan</td>
              <td style={tdMoney}>{cell(data.prior ? fmtM(data.prior.cpp2) : null)}</td>
              <td style={tdMoney}>{cell(data.current ? fmtM(data.current.cpp2) : null)}</td>
            </tr>

            {/* Summary rows */}
            <tr>
              <td style={summaryLabel}>Total pay</td>
              <td style={summaryVal}>{cell(fmtM(priorTotal))}</td>
              <td style={summaryVal}>{cell(fmtM(currentTotal))}</td>
            </tr>
            <tr>
              <td style={summaryLabel}>Taxes and deductions</td>
              <td style={summaryVal}>{cell(fmtM(priorTaxes))}</td>
              <td style={summaryVal}>{cell(fmtM(currentTaxes))}</td>
            </tr>
            <tr>
              <td style={summaryLabel}>Net pay</td>
              <td style={summaryVal}>{cell(fmtM(priorNet))}</td>
              <td style={summaryVal}>{cell(fmtM(currentNet))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function PayrollPreview() {
  const { payRunId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [run, setRun] = useState(null);
  const [lines, setLines] = useState([]);
  const [payrollSettings, setPayrollSettings] = useState(null);
  const [priorRuns, setPriorRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finalizing, setFinalizing] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [compareFor, setCompareFor] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [schedule, setSchedule] = useState(null);

  useEffect(function() {
    let cancelled = false;
    async function fetchAll() {
      const token = getToken();
      const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" };
      try {
        const [runRes, stubsRes, settingsRes, runsRes, comparisonRes] = await Promise.all([
          fetch(API + "/api/v1/payroll/runs/" + payRunId, { headers }).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
          fetch(API + "/api/v1/payroll/runs/" + payRunId + "/stubs", { headers }).then(function(r) { return r.ok ? r.json() : []; }).catch(function() { return []; }),
          fetch(API + "/api/v1/payroll/settings", { headers }).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
          fetch(API + "/api/v1/payroll/runs", { headers }).then(function(r) { return r.ok ? r.json() : []; }).catch(function() { return []; }),
          fetch(API + "/api/v1/payroll/runs/" + payRunId + "/comparison", { headers }).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
        ]);
        if (comparisonRes) setComparison(comparisonRes);
        if (cancelled) return;

        if (!runRes) {
          setError("Could not load pay run.");
          setLoading(false);
          return;
        }

        setRun(runRes);
        setPayrollSettings(settingsRes);

        // Fetch schedule if run has a schedule_id
        if (runRes.pay_schedule_id) {
          fetch(API + "/api/v1/payroll/schedules/" + runRes.pay_schedule_id, { headers })
            .then(function(r) { return r.ok ? r.json() : null; })
            .then(function(sched) { if (sched) setSchedule(sched); })
            .catch(function() {});
        }

        // Redirect if already finalized/voided
        if (runRes.status === "finalized" || runRes.status === "voided") {
          navigate("/payroll/run/" + payRunId + "/done", { replace: true });
          return;
        }

        // Prior runs for trend calculation
        const priorRunsData = Array.isArray(runsRes) ? runsRes.filter(function(r) { return r.status === "finalized" && r.id !== payRunId; }) : [];
        setPriorRuns(priorRunsData);

        // Extract employee stubs from /runs/{id}/stubs endpoint
        const stubs = Array.isArray(stubsRes) ? stubsRes : [];
        const mapped = stubs.map(function(l) {
          const hours = (Number(l.hours_regular || 0) + Number(l.hours_overtime || 0) + Number(l.hours_stat_holiday || 0) + Number(l.hours_vacation || 0) + Number(l.hours_sick || 0));
          const gross = Number(l.gross_pay || 0);
          const rate = hours > 0 && gross > 0 ? Number((gross / hours).toFixed(2)) : 0;
          return {
            employee_id: l.employee_id,
            stub_id: l.id,
            name: l.employee_name || "",
            classification: l.classification || "Hourly",
            hourly_rate: rate,
            payment_method: l.payment_method || "cheque",
            total_hours: hours,
            gross_pay: gross,
            employee_taxes: Number(l.total_employee_deductions || 0),
            net_pay: Number(l.net_pay || 0),
            employer_taxes: Number(l.total_employer_contributions || 0),
            change_in_gross_pct: l.change_in_gross_pct != null ? Number(l.change_in_gross_pct) : null,
            includes_stat: Number(l.hours_stat_holiday || 0) > 0,
          };
        });

        setLines(mapped);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(String((e && e.message) || e));
          setLoading(false);
        }
      }
    }
    fetchAll();
    return function() { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payRunId]);

  const totals = useMemo(function() {
    const gross = lines.reduce(function(s, l) { return s + l.gross_pay; }, 0);
    const employee_taxes = lines.reduce(function(s, l) { return s + l.employee_taxes; }, 0);
    const net = lines.reduce(function(s, l) { return s + l.net_pay; }, 0);
    const employer_taxes = lines.reduce(function(s, l) { return s + l.employer_taxes; }, 0);
    const total_hours = lines.reduce(function(s, l) { return s + l.total_hours; }, 0);
    const cra_remittance = employee_taxes + employer_taxes;
    const total_cost = net + cra_remittance;
    const take_home_pct = total_cost > 0 ? Math.round((net / total_cost) * 1000) / 10 : 0;
    const remit_pct = total_cost > 0 ? Math.round((cra_remittance / total_cost) * 1000) / 10 : 0;
    return { gross: gross, employee_taxes: employee_taxes, net: net, employer_taxes: employer_taxes, total_hours: total_hours, cra_remittance: cra_remittance, total_cost: total_cost, take_home_pct: take_home_pct, remit_pct: remit_pct };
  }, [lines]);

  const trend = useMemo(function() {
    if (priorRuns.length === 0) return null;
    const lastRun = priorRuns.sort(function(a, b) { return new Date(b.pay_date) - new Date(a.pay_date); })[0];
    const lastTotal = Number(lastRun.total_payroll_cost || lastRun.total_cost || 0);
    if (lastTotal === 0) return null;
    const pct = ((totals.total_cost - lastTotal) / lastTotal) * 100;
    return { pct: pct, dir: pct >= 0 ? "up" : "down", abs: Math.abs(Math.round(pct)) };
  }, [priorRuns, totals.total_cost]);

  const fundingConnected = payrollSettings && payrollSettings.funding_account_id;
  const anyDirectDeposit = lines.some(function(l) { return String(l.payment_method || "").toLowerCase().indexOf("direct") >= 0; });
  const submitBlocked = anyDirectDeposit && !fundingConnected;
  const showFundingWarning = !fundingConnected;

  async function handleSubmit() {
    if (finalizing || submitBlocked || lines.length === 0) return;
    setFinalizing(true);
    const token = getToken();
    try {
      const resp = await fetch(API + "/api/v1/payroll/runs/" + payRunId + "/finalize", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      });
      if (!resp.ok) {
        const errText = await resp.text();
        alert("Failed to submit payroll: " + errText);
        setFinalizing(false);
        return;
      }
      const finalizedRun = await resp.json();
      navigate("/payroll/run/" + payRunId + "/done", {
        state: { runData: finalizedRun, stubs: lines },
      });
    } catch (e) {
      alert("Network error while submitting payroll. Please try again.");
      setFinalizing(false);
    }
  }

  const postingAccount = (payrollSettings && payrollSettings.company_bank_name) || "Not set";
  const scheduleFreq = schedule ? scheduleFrequencyLabel(schedule.frequency) : "";
  const scheduleName = schedule ? (schedule.name || scheduleFreq) : "";

  if (loading) {
    return (
      <div style={{ padding: "40px 32px", background: C.page, minHeight: "100vh", fontFamily: FONT }}>
        <div style={{ fontSize: 15, color: C.ink, fontWeight: 500 }}>Loading pay run...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px 32px", background: C.page, minHeight: "100vh", fontFamily: FONT }}>
        <div style={{ fontSize: 18, color: C.ink, fontWeight: 700, marginBottom: 8 }}>Could not load this pay run.</div>
        <div style={{ fontSize: 14, color: C.ink, fontWeight: 500, marginBottom: 20 }}>{error}</div>
        <button onClick={function() { navigate("/payroll/overview"); }} style={{ padding: "10px 16px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Back to Payroll</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "100%", margin: 0, padding: "28px 32px 110px", fontFamily: FONT, background: C.page, minHeight: "100vh" }}>
      <div style={{ background: C.card, borderRadius: 12, padding: "40px 48px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.ink, marginBottom: 14 }}>
          <a onClick={function() { navigate("/payroll/overview"); }} style={{ color: C.ink, fontWeight: 600, textDecoration: "none", opacity: 0.7, cursor: "pointer" }}>Payroll</a>
          <span style={{ color: C.ink, opacity: 0.4 }}>/</span>
          <a onClick={function() { navigate("/payroll/run/" + payRunId); }} style={{ color: C.ink, fontWeight: 600, textDecoration: "none", opacity: 0.7, cursor: "pointer" }}>Run payroll</a>
          <span style={{ color: C.ink, opacity: 0.4 }}>/</span>
          <span style={{ color: C.ink, fontWeight: 700 }}>Review and submit</span>
        </div>

        {/* Title + status badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 6 }}>Review and submit</div>
            <div style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>Confirm the details before finalizing this pay run.</div>
          </div>
          {!submitBlocked && lines.length > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: C.brandBg, borderRadius: 6, fontSize: 12, color: C.brandDark, fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, background: C.brand, borderRadius: "50%" }} />
              READY TO SUBMIT
            </div>
          )}
        </div>

        {/* Warning banner if funding not connected */}
        {showFundingWarning && (
          <div style={{ padding: "14px 18px", background: C.amberBg, borderRadius: 10, marginBottom: 40, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: C.amberInk, color: C.card, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, fontSize: 12, fontWeight: 700 }}>!</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Funding account not connected</div>
              <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 500 }}>All employees will be paid by cheque until you connect a bank account.</div>
            </div>
            <button onClick={function() { navigate("/settings/payroll"); }} style={{ padding: "8px 14px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 8, color: C.ink, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Connect account</button>
          </div>
        )}

        {/* Meta info row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, paddingBottom: 32, borderBottom: "1px solid " + C.line, marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>PAY SCHEDULE</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{scheduleName || "Not set"}</div>
            {scheduleFreq && scheduleName !== scheduleFreq && (
              <div style={{ fontSize: 12, color: C.ink, fontWeight: 500, marginTop: 2 }}>{scheduleFreq}</div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>PAY PERIOD</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, ...tabular }}>{fmtDate(run.pay_period_start)} to {fmtDate(run.pay_period_end)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>PAY DATE</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, ...tabular }}>{fmtDateFull(run.pay_date)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>POSTING ACCOUNT</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{postingAccount}</div>
          </div>
        </div>

        {/* Total cost */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>TOTAL PAYROLL COST</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 56, fontWeight: 700, color: C.ink, letterSpacing: "-0.03em", lineHeight: 1, ...tabular }}>{fmtMoney(totals.total_cost)}</div>
            {trend && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: C.page, borderRadius: 999, fontSize: 12.5, color: C.ink, fontWeight: 700 }}>
                {trend.dir === "up" ? <ArrowUp size={13} strokeWidth={2.5} /> : <ArrowDown size={13} strokeWidth={2.5} />}
                {trend.dir === "up" ? "Up" : "Down"} {trend.abs}% vs last run
              </div>
            )}
          </div>

          {/* Where cash goes - Option D minimal split */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 40, paddingTop: 28, borderTop: "1px solid " + C.line, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: C.ink, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.7, marginBottom: 8 }}>TO EMPLOYEES</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1, ...tabular, marginBottom: 6 }}>{fmtMoney(totals.net)}</div>
              <div style={{ fontSize: 12, color: C.ink, fontWeight: 500 }}>Net pay after deductions{totals.take_home_pct > 0 && " · " + totals.take_home_pct + "%"}</div>
            </div>
            <div style={{ width: 1, height: 90, background: C.line }} />
            <div>
              <div style={{ fontSize: 11, color: C.ink, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.7, marginBottom: 8 }}>TO CRA</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1, ...tabular, marginBottom: 6 }}>{fmtMoney(totals.cra_remittance)}</div>
              <div style={{ fontSize: 12, color: C.ink, fontWeight: 500 }}>Employee {fmtMoney(totals.employee_taxes)} + Employer {fmtMoney(totals.employer_taxes)}</div>
            </div>
          </div>
        </div>

        {/* Employees section */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 20, paddingBottom: 12, borderBottom: "1.5px solid " + C.ink }}>Employees ({lines.length})</div>

          {lines.length === 0 ? (
            <div style={{ padding: "24px 0", fontSize: 14, color: C.ink, fontWeight: 500 }}>No employees included in this pay run.</div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: "12px 0", display: "grid", gridTemplateColumns: "0.9fr 100px 120px 200px 130px 220px 160px 90px", gap: 12, fontSize: 10, fontWeight: 700, color: C.ink, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid " + C.line }}>
                <div>EMPLOYEE</div>
                <div style={{ textAlign: "right" }}>TOTAL HOURS</div>
                <div style={{ textAlign: "right" }}>GROSS PAY</div>
                <div style={{ textAlign: "right" }}>EMPLOYEE TAXES & DEDUCTIONS</div>
                <div style={{ textAlign: "right" }}>NET PAY</div>
                <div style={{ textAlign: "right" }}>EMPLOYER TAXES & CONTRIBUTIONS</div>
                <div style={{ textAlign: "right" }}>CHANGE IN GROSS PAY</div>
                <div style={{ textAlign: "right" }}>METHOD</div>
              </div>

              {/* Employee rows */}
              {lines.map(function(l) {
                return (
                  <div key={l.employee_id} style={{ padding: "16px 0", display: "grid", gridTemplateColumns: "0.9fr 100px 120px 200px 130px 220px 160px 90px", gap: 12, alignItems: "center", borderBottom: "1px solid " + C.line, fontSize: 13.5, color: C.ink, ...tabular }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{l.name}</div>
                      <div style={{ fontSize: 11.5, color: C.ink, marginTop: 2, fontWeight: 500 }}>
                        {l.classification} · {fmtMoney(l.hourly_rate)}/hr
                        {l.includes_stat && " · includes stat"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 500 }}>{l.total_hours}h</div>
                    <div style={{ textAlign: "right", fontWeight: 500 }}>{fmtMoney(l.gross_pay)}</div>
                    <div style={{ textAlign: "right", fontWeight: 500 }}>{fmtMoney(l.employee_taxes)}</div>
                    <div style={{ textAlign: "right", fontWeight: 700, fontSize: 14, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                      {fmtMoney(l.net_pay)}
                      <button
                        onClick={function() { setEditingEmployeeId(l.employee_id); }}
                        title="View or edit paycheque"
                        aria-label="View or edit paycheque"
                        style={{ background: C.card, border: "1px solid " + C.line, borderRadius: 6, padding: "3px 5px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: C.ink }}
                      >
                        <Search size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 500 }}>{fmtMoney(l.employer_taxes)}</div>
                    <div style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                      {(function() {
                        var compData = comparison && comparison.employees && comparison.employees[l.stub_id];
                        if (!compData || !compData.has_comparison) return null;
                        var isDown = compData.direction === "down";
                        var isFlat = compData.direction === "flat";
                        var Icon = isFlat ? Minus : (isDown ? ArrowDown : ArrowUp);
                        var label = isFlat ? "No change" : ((isDown ? "Down " : "Up ") + compData.percent + "%");
                        return (
                          <>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 500, color: C.ink }}>
                              <Icon size={16} strokeWidth={2} />
                              {label}
                            </span>
                            <button
                              onClick={function() { setCompareFor(l); }}
                              title={"Compare " + (l.name || "employee") + " to last payday"}
                              aria-label={"Compare " + (l.name || "employee") + " to last payday"}
                              style={{ background: "transparent", border: "none", padding: 4, borderRadius: 6, cursor: "pointer", color: "#66748B", display: "inline-flex", alignItems: "center" }}
                              onMouseEnter={function(e) { e.currentTarget.style.background = C.brandBg; e.currentTarget.style.color = C.brandDark; }}
                              onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#66748B"; }}
                            >
                              <FileSearch size={16} strokeWidth={2} />
                            </button>
                          </>
                        );
                      })()}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 10.5, color: C.ink, fontWeight: 700, padding: "3px 7px", background: C.page, borderRadius: 5, textTransform: "uppercase" }}>{l.payment_method}</span>
                    </div>
                  </div>
                );
              })}

              {/* Total row */}
              <div style={{ padding: "16px 0", display: "grid", gridTemplateColumns: "0.9fr 100px 120px 200px 130px 220px 160px 90px", gap: 12, alignItems: "center", fontSize: 13.5, color: C.ink, fontWeight: 700, ...tabular, borderTop: "1.5px solid " + C.ink }}>
                <div>Total</div>
                <div style={{ textAlign: "right" }}>{totals.total_hours}h</div>
                <div style={{ textAlign: "right" }}>{fmtMoney(totals.gross)}</div>
                <div style={{ textAlign: "right" }}>{fmtMoney(totals.employee_taxes)}</div>
                <div style={{ textAlign: "right", fontSize: 15 }}>{fmtMoney(totals.net)}</div>
                <div style={{ textAlign: "right" }}>{fmtMoney(totals.employer_taxes)}</div>
                <div />
                <div />
              </div>
            </>
          )}
        </div>

        {/* What happens next */}
        <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: "1px solid " + C.line }}>
          <div style={{ fontSize: 11, color: C.ink, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>WHAT HAPPENS WHEN YOU SUBMIT</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.ink, color: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>1</div>
              <div style={{ fontSize: 13, color: C.ink, fontWeight: 600, lineHeight: 1.5 }}>Pay stubs generated for each employee</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.ink, color: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>2</div>
              <div style={{ fontSize: 13, color: C.ink, fontWeight: 600, lineHeight: 1.5 }}>YTD balances updated and locked</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.ink, color: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>3</div>
              <div style={{ fontSize: 13, color: C.ink, fontWeight: 600, lineHeight: 1.5 }}>Next pay run auto-created on schedule</div>
            </div>
          </div>
        </div>

        {/* Submit blocked warning */}
        {submitBlocked && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "#FDECED", border: "1px solid #B4232A", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#B4232A" }}>
            Submit is disabled: direct deposit is selected for some employees but no funding account is connected.
          </div>
        )}

        {/* Footer buttons - fixed */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "fixed", bottom: 0, left: 0, right: 0, background: C.card, padding: "16px 32px", borderTop: "1px solid " + C.line, boxShadow: "0 -4px 12px rgba(0,0,0,0.06)", zIndex: 100 }}>
          <button onClick={function() { navigate("/payroll/run/" + payRunId); }} style={{ padding: "12px 18px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
            {"\u2190"} Back to hours
          </button>
          <button
            onClick={handleSubmit}
            disabled={finalizing || submitBlocked || lines.length === 0}
            style={{
              padding: "14px 28px",
              background: C.inkDark,
              border: "none",
              borderRadius: 10,
              color: C.card,
              fontSize: 15,
              fontWeight: 700,
              cursor: (finalizing || submitBlocked || lines.length === 0) ? "not-allowed" : "pointer",
              fontFamily: FONT,
              opacity: (finalizing || submitBlocked || lines.length === 0) ? 0.45 : 1,
              boxShadow: "0 1px 2px rgba(18,38,43,0.12)",
            }}
          >
            {finalizing ? "Submitting..." : "Submit payroll"}
          </button>
        </div>

        {/* Edit paycheque drawer */}
        {compareFor && (
          <CompareModal employee={compareFor} comparison={comparison} onClose={function() { setCompareFor(null); }} />
        )}

        {editingEmployeeId && (
          <EditPaychequeDrawer
            runId={payRunId}
            employeeId={editingEmployeeId}
            onClose={function() { setEditingEmployeeId(null); }}
            onSaved={function() {
              // Refetch stubs to update the row
              const token = getToken();
              fetch(API + "/api/v1/payroll/runs/" + payRunId + "/stubs", {
                headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
              })
                .then(function(r) { return r.ok ? r.json() : []; })
                .then(function(stubs) {
                  if (!Array.isArray(stubs)) return;
                  const remapped = stubs.map(function(l) {
                    const hours = (Number(l.hours_regular || 0) + Number(l.hours_overtime || 0) + Number(l.hours_stat_holiday || 0) + Number(l.hours_vacation || 0) + Number(l.hours_sick || 0));
                    const gross = Number(l.gross_pay || 0);
                    const rate = hours > 0 && gross > 0 ? Number((gross / hours).toFixed(2)) : 0;
                    return {
                      employee_id: l.employee_id,
                      stub_id: l.id,
                      name: l.employee_name || "",
                      classification: l.classification || "Hourly",
                      hourly_rate: rate,
                      payment_method: l.payment_method || "cheque",
                      total_hours: hours,
                      gross_pay: gross,
                      employee_taxes: Number(l.total_employee_deductions || 0),
                      net_pay: Number(l.net_pay || 0),
                      employer_taxes: Number(l.total_employer_contributions || 0),
                      change_in_gross_pct: l.change_in_gross_pct != null ? Number(l.change_in_gross_pct) : null,
                      includes_stat: Number(l.hours_stat_holiday || 0) > 0,
                    };
                  });
                  setLines(remapped);
                })
                .catch(function() {});
            }}
          />
        )}

      </div>
    </div>
  );
}
