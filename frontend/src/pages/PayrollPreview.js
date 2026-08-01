import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import EditPaychequeDrawer from "../components/EditPaychequeDrawer";
import { AlertTriangle, ArrowUp, ArrowDown, Check, Search } from "lucide-react";

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

  useEffect(function() {
    let cancelled = false;
    async function fetchAll() {
      const token = getToken();
      const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" };
      try {
        const [runRes, stubsRes, settingsRes, runsRes] = await Promise.all([
          fetch(API + "/api/v1/payroll/runs/" + payRunId, { headers }).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
          fetch(API + "/api/v1/payroll/runs/" + payRunId + "/stubs", { headers }).then(function(r) { return r.ok ? r.json() : []; }).catch(function() { return []; }),
          fetch(API + "/api/v1/payroll/settings", { headers }).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
          fetch(API + "/api/v1/payroll/runs", { headers }).then(function(r) { return r.ok ? r.json() : []; }).catch(function() { return []; }),
        ]);
        if (cancelled) return;

        if (!runRes) {
          setError("Could not load pay run.");
          setLoading(false);
          return;
        }

        setRun(runRes);
        setPayrollSettings(settingsRes);

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
  const scheduleFreq = run && run.schedule ? scheduleFrequencyLabel(run.schedule.frequency) : "";
  const scheduleName = run && run.schedule ? (run.schedule.name || scheduleFreq) : "";

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

          {/* Where cash goes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, paddingTop: 24, borderTop: "1px solid " + C.line }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.ink, fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, background: C.brand, borderRadius: 3 }} />
                  To employees
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.ink, ...tabular }}>{fmtMoney(totals.net)}</span>
              </div>
              <div style={{ fontSize: 12, color: C.ink, fontWeight: 500, marginLeft: 20 }}>Net pay after deductions {totals.take_home_pct > 0 && "· " + totals.take_home_pct + "%"}</div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.ink, fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, background: C.ink, borderRadius: 3 }} />
                  To CRA
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.ink, ...tabular }}>{fmtMoney(totals.cra_remittance)}</span>
              </div>
              <div style={{ fontSize: 12, color: C.ink, fontWeight: 500, marginLeft: 20 }}>Employee {fmtMoney(totals.employee_taxes)} + Employer {fmtMoney(totals.employer_taxes)}{totals.remit_pct > 0 && " · " + totals.remit_pct + "%"}</div>
            </div>
          </div>

          {/* Split bar */}
          <div style={{ height: 6, borderRadius: 4, overflow: "hidden", display: "flex", background: C.page, marginTop: 20 }}>
            <div style={{ background: C.brand, width: totals.take_home_pct + "%" }} />
            <div style={{ background: C.ink, width: totals.remit_pct + "%" }} />
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
              <div style={{ padding: "12px 0", display: "grid", gridTemplateColumns: "1fr 90px 130px 140px 140px 140px 90px 110px", gap: 12, fontSize: 10, fontWeight: 700, color: C.ink, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid " + C.line }}>
                <div>EMPLOYEE</div>
                <div style={{ textAlign: "right" }}>HOURS</div>
                <div style={{ textAlign: "right" }}>GROSS PAY</div>
                <div style={{ textAlign: "right" }}>EMPLOYEE TAXES</div>
                <div style={{ textAlign: "right" }}>NET PAY</div>
                <div style={{ textAlign: "right" }}>EMPLOYER TAXES</div>
                <div style={{ textAlign: "right" }}>CHANGE</div>
                <div style={{ textAlign: "right" }}>METHOD</div>
              </div>

              {/* Employee rows */}
              {lines.map(function(l) {
                return (
                  <div key={l.employee_id} style={{ padding: "16px 0", display: "grid", gridTemplateColumns: "1fr 90px 130px 140px 140px 140px 90px 110px", gap: 12, alignItems: "center", borderBottom: "1px solid " + C.line, fontSize: 13.5, color: C.ink, ...tabular }}>
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
                    <div style={{ textAlign: "right", fontSize: 12, fontWeight: 700, color: C.ink }}>
                      {l.change_in_gross_pct != null ? (
                        <>
                          {l.change_in_gross_pct >= 0 ? "↑" : "↓"} {Math.abs(Math.round(l.change_in_gross_pct))}%
                        </>
                      ) : (
                        <span style={{ opacity: 0.5, fontWeight: 500 }}>—</span>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 10.5, color: C.ink, fontWeight: 700, padding: "3px 7px", background: C.page, borderRadius: 5, textTransform: "uppercase" }}>{l.payment_method}</span>
                    </div>
                  </div>
                );
              })}

              {/* Total row */}
              <div style={{ padding: "16px 0", display: "grid", gridTemplateColumns: "1fr 90px 130px 140px 140px 140px 90px 110px", gap: 12, alignItems: "center", fontSize: 13.5, color: C.ink, fontWeight: 700, ...tabular, borderTop: "1.5px solid " + C.ink }}>
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

        {/* Footer buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
