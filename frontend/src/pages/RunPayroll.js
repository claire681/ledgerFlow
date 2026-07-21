import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, sans-serif";

const C = {
  ink: "#0E1A1A",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  brandDarkText: "#04342C",
  muted: "#1A2332",
  line: "#E5E7EB",
  page: "#F8F9FA",
  danger: "#A32D2D",
  amber: "#854F0B",
  amberBg: "#FAEEDA",
  amberText: "#633806",
};

function authHeaders() {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  return { "Authorization": "Bearer " + token, "Content-Type": "application/json" };
}

function fmtMoney(n) {
  if (n == null || isNaN(n)) return "$0.00";
  return "$" + Number(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateShort(iso) {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-CA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateWithWeekday(iso) {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-CA", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysBetween(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const s = new Date(startIso + "T00:00:00");
  const e = new Date(endIso + "T00:00:00");
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

function daysUntil(iso) {
  if (!iso) return null;
  const target = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export default function RunPayroll() {
  const { payRunId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [payRun, setPayRun] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError("");
      try {
        const runResp = await fetch(API + "/api/v1/payroll/runs/" + payRunId, { headers: authHeaders() });
        if (!runResp.ok) throw new Error("Could not load pay run (HTTP " + runResp.status + ")");
        const runData = await runResp.json();
        setPayRun(runData);

        if (runData.pay_schedule_id) {
          const schedResp = await fetch(API + "/api/v1/payroll/schedules/" + runData.pay_schedule_id, { headers: authHeaders() });
          if (schedResp.ok) {
            const schedData = await schedResp.json();
            setSchedule(schedData);
          }
        }

        const empResp = await fetch(API + "/api/v1/payroll/employees", { headers: authHeaders() });
        if (!empResp.ok) throw new Error("Could not load employees");
        const empData = await empResp.json();
        const empArr = Array.isArray(empData) ? empData : (empData.employees || []);

        const linesResp = await fetch(API + "/api/v1/payroll/runs/" + payRunId + "/lines", { headers: authHeaders() });
        let lines = [];
        if (linesResp.ok) {
          const linesData = await linesResp.json();
          lines = Array.isArray(linesData) ? linesData : (linesData.lines || []);
        }
        const linesByEmp = {};
        lines.forEach(function(l) { linesByEmp[l.employee_id] = l; });

        const mapped = empArr.map(function(e) {
          const eid = e.id || e.employee_id;
          const line = linesByEmp[eid] || {};
          const first = e.preferred_name || e.first_name || "";
          const last = e.last_name || "";
          const name = (last && first) ? (last + ", " + first) : (first || last || "Unnamed");
          const rate = e.hourly_rate || e.pay_rate || e.rate;
          const hoursRegular = line.hours_regular != null ? String(line.hours_regular) : "0";
          const hoursStat = line.hours_stat_holiday != null ? String(line.hours_stat_holiday) : "0";
          const statAvgDaily = e.stat_pay_avg_daily || (rate ? Number(rate) * 8 : 0);
          const setupComplete = e.setup_complete !== false;
          const payMethodRaw = (e.default_pay_method || e.pay_method || "direct_deposit").toString().toLowerCase();
          const payMethod = payMethodRaw.includes("cheque") || payMethodRaw.includes("check") ? "Cheque" : "Direct deposit";

          return {
            id: eid,
            name: name,
            position: e.position_title || "",
            hourlyRate: rate ? Number(rate) : 0,
            regular: hoursRegular,
            statHoliday: hoursStat,
            statAvgDaily: statAvgDaily,
            payMethod: payMethod,
            ready: setupComplete,
            included: setupComplete,
            memo: line.memo || "",
          };
        });
        setRows(mapped);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    loadAll();
  }, [payRunId]);

  function updateRow(id, field, value) {
    setRows(function(rs) {
      return rs.map(function(r) {
        return r.id === id ? Object.assign({}, r, { [field]: value }) : r;
      });
    });
  }

  function toggleIncluded(id) {
    setRows(function(rs) {
      return rs.map(function(r) {
        return r.id === id ? Object.assign({}, r, { included: !r.included }) : r;
      });
    });
  }

  const filteredRows = useMemo(function() {
    if (!searchQuery) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(function(r) { return r.name.toLowerCase().includes(q); });
  }, [rows, searchQuery]);

  const readyRows = rows.filter(function(r) { return r.ready; });
  const includedRows = rows.filter(function(r) { return r.included && r.ready; });
  const needsHoursRows = readyRows.filter(function(r) {
    return (parseFloat(r.regular) || 0) === 0 && (parseFloat(r.statHoliday) || 0) === 0;
  });

  const totalHours = includedRows.reduce(function(s, r) {
    return s + (parseFloat(r.regular) || 0) + (parseFloat(r.statHoliday) || 0);
  }, 0);
  const totalGross = includedRows.reduce(function(s, r) {
    const regular = parseFloat(r.regular) || 0;
    const stat = parseFloat(r.statHoliday) || 0;
    const statPay = stat * (Number(r.statAvgDaily) / 8 || 0);
    return s + (regular * r.hourlyRate) + statPay;
  }, 0);

  async function handleReview() {
    if (saving) return;
    if (includedRows.length === 0) {
      window.alert("No employees ready to pay. Add hours and mark employees as included.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const employeeInputs = includedRows.map(function(r) {
        return {
          employee_id: r.id,
          hours: {
            regular: parseFloat(r.regular) || 0,
            stat_holiday: parseFloat(r.statHoliday) || 0,
          },
          bonus: 0,
          commission: 0,
          reimbursement: 0,
        };
      });

      const resp = await fetch(API + "/api/v1/payroll/runs/" + payRunId + "/calculate", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          employee_inputs: employeeInputs,
          pay_periods_per_year: schedule ? schedule.periods_per_year : 26,
          subnational: "AB",
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error("Calculation failed: " + errText);
      }

      const runData = await resp.json();
      navigate("/payroll/run/" + payRunId + "/preview", {
        state: {
          calculation: {
            employee_count: runData.employee_count,
            total_gross: runData.total_gross,
            total_deductions: runData.total_deductions,
            total_net: runData.total_net,
            stubs: runData.stubs || [],
            source: "backend",
          },
        },
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  function handleCancel() {
    if (window.confirm("Cancel this pay run? Any unsaved changes will be lost.")) {
      navigate("/payroll/overview");
    }
  }

  function handleSaveForLater() {
    navigate("/payroll/overview");
  }

  if (loading) {
    return (
      <div style={{ maxWidth: "100%", margin: 0, padding: "28px 32px 90px", fontFamily: FONT }}>
        <div style={{ padding: 40, color: C.muted }}>Loading payroll run...</div>
      </div>
    );
  }

  if (error && !payRun) {
    return (
      <div style={{ maxWidth: "100%", margin: 0, padding: "28px 32px 90px", fontFamily: FONT }}>
        <div style={{ padding: 16, background: "#FCEBEB", borderRadius: 10, color: "#791F1F" }}>{error}</div>
      </div>
    );
  }

  const daysCount = payRun ? daysBetween(payRun.pay_period_start, payRun.pay_period_end) : 0;
  const daysToPay = payRun ? daysUntil(payRun.pay_date) : null;
  const daysLabel = daysToPay == null ? "" : (daysToPay === 0 ? "Today" : (daysToPay > 0 ? "In " + daysToPay + " days" : Math.abs(daysToPay) + " days ago"));

  return (
    <div style={{ maxWidth: "100%", margin: 0, padding: "28px 32px 100px", fontFamily: FONT, minHeight: "100vh" }}>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.brand, letterSpacing: "0.5px", marginBottom: 4 }}>PAYROLL</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#000000", marginBottom: 2 }}>Run payroll</div>
        <div style={{ fontSize: 13, color: C.muted }}>Review hours, then submit to finalize the run</div>
      </div>

      {needsHoursRows.length > 0 && (
        <div style={{ background: "#FFFFFF", border: "1px solid " + C.line, borderRadius: 12, padding: "12px 18px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>&#128737;&#65039;</span>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#000000" }}>Payroll readiness</div>
            <div style={{ marginLeft: "auto" }}>
              <span style={{ background: C.amberBg, color: C.amber, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 12 }}>{needsHoursRows.length} needs hours</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            {needsHoursRows.length === 1
              ? needsHoursRows[0].name + " has no hours entered."
              : needsHoursRows.length + " employees have no hours entered."}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
        <div style={{ border: "1px solid " + C.line, borderRadius: 12, padding: "14px 18px", background: "#fff" }}>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: 6 }}>Employees in this run</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#000000" }}>{includedRows.length} of {readyRows.length}</div>
        </div>
        <div style={{ border: "1px solid " + C.line, borderRadius: 12, padding: "14px 18px", background: "#fff" }}>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: 6 }}>Total hours</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#000000", fontVariantNumeric: "tabular-nums" }}>{totalHours.toFixed(2)}</div>
        </div>
        <div style={{ border: "1px solid " + C.line, borderRadius: 12, padding: "14px 18px", background: "#fff" }}>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: 6 }}>Total gross pay</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#000000", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(totalGross)}</div>
        </div>
      </div>

      {schedule && (
        <div style={{ border: "2px solid " + C.brand, borderRadius: 12, padding: "10px 14px", marginBottom: 10, background: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, background: schedule.color || C.brand, borderRadius: "50%" }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#000000" }}>Pay schedule:</span>
            <span style={{ fontSize: 13, color: "#000000", marginLeft: 6 }}>{schedule.name}</span>
            <span style={{ fontSize: 11, color: C.brandDark, marginLeft: 8 }}>&middot; {schedule.periods_per_year} pay periods per year</span>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={{ border: "2px solid " + C.brand, borderRadius: 12, padding: "12px 16px", background: "#fff" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#000000", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>Pay period</div>
          <div style={{ padding: "8px 12px", border: "1px solid " + C.line, borderRadius: 8, background: C.page, fontSize: 14, fontWeight: 500, color: "#000000" }}>{fmtDateShort(payRun.pay_period_start)} to {fmtDateShort(payRun.pay_period_end)}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{daysCount} days</div>
        </div>
        <div style={{ border: "2px solid " + C.brand, borderRadius: 12, padding: "12px 16px", background: "#fff" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#000000", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>Next pay date</div>
          <div style={{ padding: "8px 12px", border: "1px solid " + C.line, borderRadius: 8, background: C.page, fontSize: 14, fontWeight: 500, color: "#000000" }}>{fmtDateWithWeekday(payRun.pay_date)}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{daysLabel}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button style={{ padding: "7px 12px", background: "#fff", border: "1px solid " + C.line, borderRadius: 8, fontSize: 12, color: "#000000", fontWeight: 500, cursor: "pointer", fontFamily: FONT }}>Filters</button>
        <input type="text" placeholder="Search employees" value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value); }} style={{ flex: 1, padding: "7px 12px", border: "1px solid " + C.line, borderRadius: 8, fontSize: 12, color: C.muted, fontFamily: FONT }} />
        <button style={{ padding: "7px 12px", background: "#fff", border: "1px solid " + C.line, borderRadius: 8, fontSize: 12, color: "#000000", fontWeight: 500, cursor: "pointer", fontFamily: FONT }}>Export</button>
      </div>

      <div style={{ border: "1px solid " + C.line, borderRadius: 12, background: "#fff", overflow: "visible" }}>
        <div style={{ padding: "10px 16px", background: C.page, borderBottom: "1px solid " + C.line, display: "grid", gridTemplateColumns: "24px 1.7fr 1.1fr 1.1fr 0.7fr 0.9fr 24px 1fr 36px", gap: 8, fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: 0.4 }}>
          <div></div>
          <div>EMPLOYEE &middot; {includedRows.length} OF {readyRows.length}</div>
          <div style={{ textAlign: "right" }}>REG HOURS / PAY</div>
          <div style={{ textAlign: "right" }}>STAT HOURS / AVG</div>
          <div style={{ textAlign: "right" }}>TOTAL HRS</div>
          <div style={{ textAlign: "right" }}>GROSS PAY</div>
          <div></div>
          <div>PAY METHOD</div>
          <div></div>
        </div>

        {filteredRows.length === 0 && (
          <div style={{ padding: 30, textAlign: "center", color: C.muted, fontSize: 13 }}>No employees found.</div>
        )}

        {filteredRows.map(function(r, idx) {
          const regular = parseFloat(r.regular) || 0;
          const stat = parseFloat(r.statHoliday) || 0;
          const total = regular + stat;
          const regPay = regular * r.hourlyRate;
          const statPay = stat * (Number(r.statAvgDaily) / 8 || 0);
          const gross = regPay + statPay;
          const isLast = idx === filteredRows.length - 1;
          return (
            <div key={r.id} style={{ padding: "12px 16px", borderBottom: isLast ? "none" : "1px solid " + C.line, display: "grid", gridTemplateColumns: "24px 1.7fr 1.1fr 1.1fr 0.7fr 0.9fr 24px 1fr 36px", gap: 8, alignItems: "center", opacity: r.ready ? 1 : 0.5, position: "relative" }}>
              <div>
                <input type="checkbox" checked={r.included} disabled={!r.ready} onChange={function() { toggleIncluded(r.id); }} style={{ width: 14, height: 14, accentColor: C.brand, cursor: r.ready ? "pointer" : "not-allowed" }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#000000" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>${r.hourlyRate.toFixed(2)}/hr {r.position ? "\u00b7 " + r.position : ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <input type="text" inputMode="decimal" value={r.regular} onChange={function(e) { updateRow(r.id, "regular", e.target.value); }} disabled={!r.ready} placeholder="0" style={{ width: 50, padding: "4px 8px", border: "1px solid " + C.line, borderRadius: 5, fontSize: 12, textAlign: "right", color: "#000000", fontFamily: FONT }} />
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(regPay)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <input type="text" inputMode="decimal" value={r.statHoliday} onChange={function(e) { updateRow(r.id, "statHoliday", e.target.value); }} disabled={!r.ready} placeholder="0" style={{ width: 50, padding: "4px 8px", border: "1px solid " + C.line, borderRadius: 5, fontSize: 12, textAlign: "right", color: "#000000", fontFamily: FONT }} />
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(Number(r.statAvgDaily))}/d</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: 500, color: "#000000", fontVariantNumeric: "tabular-nums" }}>{total.toFixed(2)}</div>
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: 500, color: "#000000", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(gross)}</div>
              <div style={{ textAlign: "center" }}>
                <span title={r.memo || "Add memo"} style={{ fontSize: 14, color: r.memo ? C.brand : C.muted, cursor: "pointer" }}>&#128172;</span>
              </div>
              <div>
                <span style={{ background: r.payMethod === "Cheque" ? C.amberBg : C.brandBg, color: r.payMethod === "Cheque" ? C.amberText : C.brandDarkText, fontSize: 11, padding: "3px 8px", borderRadius: 5, fontWeight: 500 }}>{r.payMethod}</span>
              </div>
              <div style={{ textAlign: "center", position: "relative" }}>
                <button onClick={function() { setOpenMenuId(openMenuId === r.id ? null : r.id); }} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, color: C.muted, padding: 4 }}>&#8942;</button>
                {openMenuId === r.id && (
                  <div style={{ position: "absolute", top: 28, right: 0, background: "#fff", border: "1px solid " + C.line, borderRadius: 8, boxShadow: "0 6px 18px rgba(0,0,0,0.08)", width: 180, overflow: "hidden", zIndex: 10, textAlign: "left" }}>
                    <div style={{ padding: "8px 12px", fontSize: 12, color: "#000000", cursor: "pointer" }} onClick={function() { setOpenMenuId(null); }}>Edit hours</div>
                    <div style={{ padding: "8px 12px", fontSize: 12, color: "#000000", cursor: "pointer", borderTop: "1px solid " + C.line }} onClick={function() { setOpenMenuId(null); }}>Add memo</div>
                    <div style={{ padding: "8px 12px", fontSize: 12, color: "#000000", cursor: "pointer", borderTop: "1px solid " + C.line }} onClick={function() { navigate("/payroll/employees/" + r.id); }}>View profile</div>
                    <div style={{ padding: "8px 12px", fontSize: 12, color: C.danger, cursor: "pointer", borderTop: "1px solid " + C.line }} onClick={function() { toggleIncluded(r.id); setOpenMenuId(null); }}>Skip this employee</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: 12, background: "#FCEBEB", borderRadius: 8, color: "#791F1F", fontSize: 13, marginTop: 14 }}>{error}</div>
      )}

      <div style={{ position: "fixed", bottom: 0, left: 240, right: 0, background: "#fff", borderTop: "1px solid " + C.line, padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 -2px 10px rgba(0,0,0,0.04)", zIndex: 20 }}>
        <button onClick={handleCancel} style={{ background: "transparent", border: "1px solid " + C.line, color: "#000000", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSaveForLater} style={{ background: "transparent", border: "1px solid " + C.line, color: "#000000", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: FONT }}>Save for later</button>
          <button onClick={handleReview} disabled={saving || includedRows.length === 0} style={{ background: C.ink, color: "white", fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 8, border: "none", cursor: (saving || includedRows.length === 0) ? "not-allowed" : "pointer", opacity: (saving || includedRows.length === 0) ? 0.5 : 1, fontFamily: FONT, display: "flex", alignItems: "center", gap: 6 }}>
            {saving ? "Calculating..." : ("Review payroll for " + includedRows.length + " employee" + (includedRows.length === 1 ? "" : "s"))}
            <span>&rarr;</span>
          </button>
        </div>
      </div>

    </div>
  );
}