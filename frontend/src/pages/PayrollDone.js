import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, FileSearch, ArrowLeft } from "lucide-react";

const C = {
  ink: "#12262B",
  inkDark: "#0E1A1A",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  page: "#F4F6F8",
  card: "#FFFFFF",
  line: "#E7EAF0",
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
  const parts = String(iso).split("-");
  return parts[2] + "/" + parts[1] + "/" + parts[0];
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

export default function PayrollDone() {
  const { payRunId } = useParams();
  const navigate = useNavigate();

  const [run, setRun] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [totals, setTotals] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [payrollSettings, setPayrollSettings] = useState(null);
  const [chequeNumbers, setChequeNumbers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(function() {
    let cancelled = false;
    async function fetchAll() {
      const token = getToken();
      const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" };
      try {
        const [doneRes, settingsRes] = await Promise.all([
          fetch(API + "/api/v1/payroll/runs/" + payRunId + "/done-view", { headers }).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
          fetch(API + "/api/v1/payroll/settings", { headers }).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
        ]);
        if (cancelled) return;

        if (!doneRes) {
          setError("Could not load payroll run.");
          setLoading(false);
          return;
        }

        setRun(doneRes.run);
        setEmployees(doneRes.employees || []);
        setTotals(doneRes.totals);
        setPayrollSettings(settingsRes);

        if (doneRes.run && doneRes.run.pay_schedule_id) {
          fetch(API + "/api/v1/payroll/schedules/" + doneRes.run.pay_schedule_id, { headers })
            .then(function(r) { return r.ok ? r.json() : null; })
            .then(function(sched) { if (sched) setSchedule(sched); })
            .catch(function() {});
        }

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

  function saveChequeNumber(stubId, num) {
    setChequeNumbers(function(prev) {
      const next = Object.assign({}, prev);
      next[stubId] = num;
      return next;
    });
  }

  if (loading) {
    return (
      <div style={{ padding: "40px 32px", background: C.page, minHeight: "100vh", fontFamily: FONT }}>
        <div style={{ fontSize: 15, color: C.ink, fontWeight: 500 }}>Loading pay run...</div>
      </div>
    );
  }

  if (error || !run || !totals) {
    return (
      <div style={{ padding: "40px 32px", background: C.page, minHeight: "100vh", fontFamily: FONT }}>
        <div style={{ fontSize: 18, color: C.ink, fontWeight: 700, marginBottom: 8 }}>Could not load this pay run.</div>
        <div style={{ fontSize: 14, color: C.ink, fontWeight: 500, marginBottom: 20 }}>{error || "Unknown error"}</div>
        <button onClick={function() { navigate("/payroll/overview"); }} style={{ padding: "10px 16px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Back to Payroll</button>
      </div>
    );
  }

  const chequeCount = totals.cheque_count || 0;
  const empsPaid = totals.employees_paid || 0;
  const empWord = empsPaid === 1 ? "employee" : "employees";
  const chequeWord = chequeCount === 1 ? "cheque" : "cheques";
  const takeHome = Number(totals.employee_take_home || 0);
  const totalCost = Number(totals.total_cost || 0);
  const employeeTax = Number(totals.employee_tax || 0);
  const employerTax = Number(totals.employer_tax || 0);
  const craTotal = employeeTax + employerTax;

  const postingAccount = (payrollSettings && payrollSettings.company_bank_name) || "Not set";
  const scheduleFreq = schedule ? scheduleFrequencyLabel(schedule.frequency) : "";
  const scheduleName = schedule ? (schedule.name || scheduleFreq) : "";

  return (
    <div style={{ maxWidth: "100%", margin: 0, padding: "28px 32px 110px", fontFamily: FONT, background: C.page, minHeight: "100vh" }}>
      <div style={{ background: C.card, borderRadius: 12, padding: "40px 48px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.ink, marginBottom: 14 }}>
          <a onClick={function() { navigate("/payroll/overview"); }} style={{ color: C.ink, fontWeight: 600, textDecoration: "none", opacity: 0.7, cursor: "pointer" }}>Payroll</a>
          <span style={{ color: C.ink, opacity: 0.4 }}>/</span>
          <a onClick={function() { navigate("/payroll/overview"); }} style={{ color: C.ink, fontWeight: 600, textDecoration: "none", opacity: 0.7, cursor: "pointer" }}>Pay runs</a>
          <span style={{ color: C.ink, opacity: 0.4 }}>/</span>
          <span style={{ color: C.ink, fontWeight: 700 }}>Payroll complete</span>
        </div>

        {/* Title with success checkmark + FINALIZED badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.brand, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={22} strokeWidth={3} stroke={C.card} />
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>Payroll complete</div>
            </div>
            <div style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>
              You paid <strong>{empsPaid} {empWord}</strong> for the pay period ending {fmtDate(run.pay_period_end)}.
            </div>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: C.brandBg, borderRadius: 6, fontSize: 12, color: C.brandDark, fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, background: C.brand, borderRadius: "50%" }} />
            FINALIZED
          </div>
        </div>

        {/* Meta info */}
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

        {/* Total cost + Employees Paid side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr auto 1fr", gap: 40, marginBottom: 40, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>TOTAL PAYROLL COST</div>
            <div style={{ fontSize: 56, fontWeight: 700, color: C.ink, letterSpacing: "-0.03em", lineHeight: 1, ...tabular }}>{fmtMoney(totalCost)}</div>
          </div>
          <div style={{ width: 1, height: 96, background: C.line, marginTop: 20 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>EMPLOYEES PAID</div>
            <div style={{ fontSize: 56, fontWeight: 700, color: C.ink, letterSpacing: "-0.03em", lineHeight: 1, ...tabular }}>{empsPaid}</div>
          </div>
        </div>

        {/* Option D split */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 40, paddingTop: 28, paddingBottom: 40, borderTop: "1px solid " + C.line, borderBottom: "1px solid " + C.line, marginBottom: 40, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: C.ink, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.7, marginBottom: 8 }}>PAID TO EMPLOYEES</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1, ...tabular, marginBottom: 6 }}>{fmtMoney(takeHome)}</div>
            <div style={{ fontSize: 12, color: C.ink, fontWeight: 500 }}>Net pay after deductions</div>
          </div>
          <div style={{ width: 1, height: 90, background: C.line }} />
          <div>
            <div style={{ fontSize: 11, color: C.ink, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.7, marginBottom: 8 }}>OWED TO CRA</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1, ...tabular, marginBottom: 6 }}>{fmtMoney(craTotal)}</div>
            <div style={{ fontSize: 12, color: C.ink, fontWeight: 500 }}>Employee {fmtMoney(employeeTax)} + Employer {fmtMoney(employerTax)}</div>
          </div>
        </div>

        {/* What's next */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 20, paddingBottom: 12, borderBottom: "1.5px solid " + C.ink }}>What's next</div>

          {chequeCount > 0 && (
            <div style={{ padding: "20px 0", borderBottom: "1px solid " + C.line, display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.ink, color: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>1</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Write {chequeCount} {chequeWord}</div>
                <div style={{ fontSize: 13, color: C.ink, fontWeight: 500, lineHeight: 1.5 }}>Deliver to your {empWord} by <strong>{fmtDateFull(run.pay_date)}</strong>. Enter the cheque number in the table below.</div>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button onClick={function() {
                    employees.forEach(function(emp, idx) {
                      setTimeout(function() {
                        window.open("/payroll/paycheques/" + emp.stub_id, "_blank");
                      }, idx * 200);
                    });
                  }} style={{ padding: "8px 14px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 8, color: C.ink, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Print pay stubs</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: "20px 0", display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.ink, color: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{chequeCount > 0 ? 2 : 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Remit {fmtMoney(craTotal)} in taxes to CRA</div>
              <div style={{ fontSize: 13, color: C.ink, fontWeight: 500, lineHeight: 1.5 }}>{fmtMoney(employeeTax)} withheld from {empWord} plus {fmtMoney(employerTax)} in employer contributions. Novala tracks this on your payroll liabilities.</div>
              <div style={{ marginTop: 12 }}>
                <button onClick={function() { navigate("/compliance"); }} style={{ padding: "8px 14px", background: "transparent", border: "none", color: C.brandDark, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>View liabilities</button>
              </div>
            </div>
          </div>
        </div>

        {/* Paid this run table */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 20, paddingBottom: 12, borderBottom: "1.5px solid " + C.ink }}>Paid this run ({employees.length})</div>

          {employees.length === 0 ? (
            <div style={{ padding: "24px 0", fontSize: 14, color: C.ink, fontWeight: 500 }}>No employees in this pay run.</div>
          ) : (
            <>
              <div style={{ padding: "12px 0", display: "grid", gridTemplateColumns: "40px 1.4fr 160px 160px 200px", gap: 12, fontSize: 10, fontWeight: 700, color: C.ink, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid " + C.line }}>
                <div></div>
                <div>EMPLOYEE NAME</div>
                <div>PAYMENT METHOD</div>
                <div style={{ textAlign: "right" }}>NET PAY</div>
                <div>CHEQUE NUMBER</div>
              </div>

              {employees.map(function(emp) {
                return (
                  <div key={emp.stub_id} style={{ padding: "16px 0", display: "grid", gridTemplateColumns: "40px 1.4fr 160px 160px 200px", gap: 12, alignItems: "center", borderBottom: "1px solid " + C.line, fontSize: 14, color: C.ink }}>
                    <div>
                      <div style={{ width: 20, height: 20, borderRadius: 5, background: C.brand, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={12} strokeWidth={3.5} stroke={C.card} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{emp.name}</div>
                      {emp.position_title && (
                        <div style={{ fontSize: 12, color: C.ink, fontWeight: 500, marginTop: 2 }}>{emp.position_title}</div>
                      )}
                    </div>
                    <div>
                      <span style={{ fontSize: 10.5, color: C.ink, fontWeight: 700, padding: "3px 8px", background: C.page, borderRadius: 5, textTransform: "uppercase" }}>{emp.payment_method || "Cheque"}</span>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 700, fontSize: 15, ...tabular, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                      {fmtMoney(emp.net_pay)}
                      <button
                        onClick={function() { window.open("/payroll/paycheques/" + emp.stub_id, "_blank"); }}
                        title="View pay stub"
                        aria-label="View pay stub"
                        style={{ background: "transparent", border: "none", padding: 4, borderRadius: 6, cursor: "pointer", color: "#66748B", display: "inline-flex", alignItems: "center" }}
                      >
                        <FileSearch size={16} strokeWidth={2} />
                      </button>
                    </div>
                    <div>
                      {emp.is_cheque && (
                        <input
                          value={chequeNumbers[emp.stub_id] || ""}
                          onChange={function(e) { saveChequeNumber(emp.stub_id, e.target.value); }}
                          placeholder="Enter cheque number"
                          style={{ width: "100%", border: "1.5px solid " + C.ink, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.ink, background: C.card, fontFamily: FONT }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", borderTop: "1px solid " + C.line, position: "sticky", bottom: 0, background: C.card, zIndex: 100, boxShadow: "0 -4px 12px rgba(0,0,0,0.06)", marginLeft: -32, marginRight: -32, marginTop: 32 }}>
          <button onClick={function() { navigate("/payroll/overview"); }} style={{ padding: "12px 18px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={16} strokeWidth={2.5} />
            Back to Payroll
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={function() {
                const token = getToken();
                fetch(API + "/api/v1/payroll/runs/" + payRunId + "/export", {
                  headers: { "Authorization": "Bearer " + token },
                })
                  .then(function(r) { return r.blob(); })
                  .then(function(blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "payroll_" + fmtDate(run.pay_period_start).replace(/\//g, "-") + "_to_" + fmtDate(run.pay_period_end).replace(/\//g, "-") + ".csv";
                    a.click();
                    URL.revokeObjectURL(url);
                  })
                  .catch(function(e) { alert("Export failed: " + e); });
              }}
              style={{ padding: "12px 18px", background: C.card, border: "1.5px solid " + C.ink, borderRadius: 10, color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}
            >Export CSV</button>
            <button onClick={function() {
              // Open each pay stub in a new tab. User can print each with Ctrl+P.
              // Alternatively, could open a combined print view. For now, one tab per stub.
              employees.forEach(function(emp, idx) {
                setTimeout(function() {
                  window.open("/payroll/paycheques/" + emp.stub_id, "_blank");
                }, idx * 200);
              });
            }} style={{ padding: "12px 24px", background: C.inkDark, border: "none", borderRadius: 10, color: C.card, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT, boxShadow: "0 1px 2px rgba(18,38,43,0.12)" }}>Print all pay stubs</button>
          </div>
        </div>

      </div>
    </div>
  );
}
