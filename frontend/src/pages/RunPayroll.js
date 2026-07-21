import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, sans-serif";

const C = {
  ink: "#0E1A1A",
  night: "#0E1A1A",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  muted: "#1A2332",
  line: "#E5E7EB",
  page: "#F8F9FA",
  tint: "#E1F5EE",
  danger: "#A32D2D",
  amber: "#854F0B",
  amberBg: "#FAEEDA",
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
          const hoursRegular = line.hours_regular != null ? String(line.hours_regular) : "";
          const hoursStat = line.hours_stat_holiday != null ? String(line.hours_stat_holiday) : "0";
          const setupComplete = e.setup_complete !== false;

          return {
            id: eid,
            name: name,
            position: e.position_title || "",
            hourlyRate: rate ? Number(rate) : 0,
            regular: hoursRegular,
            statHoliday: hoursStat,
            ready: setupComplete,
            included: setupComplete,
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

  const includedRows = rows.filter(function(r) { return r.included && r.ready; });
  const totalHours = includedRows.reduce(function(s, r) { return s + (parseFloat(r.regular) || 0) + (parseFloat(r.statHoliday) || 0); }, 0);
  const totalGross = includedRows.reduce(function(s, r) {
    const regular = parseFloat(r.regular) || 0;
    const stat = parseFloat(r.statHoliday) || 0;
    return s + ((regular + stat) * r.hourlyRate);
  }, 0);

  async function handlePreview() {
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

  return (
    <div style={{ maxWidth: "100%", margin: 0, padding: "28px 32px 90px", fontFamily: FONT }}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.brand, letterSpacing: "0.5px", marginBottom: 6 }}>PAYROLL</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: "#000000", marginBottom: 4 }}>Run payroll</div>
          <div style={{ fontSize: 14, color: C.muted }}>Review hours, then preview to see final numbers</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <div style={{ border: "1px solid " + C.line, borderRadius: 14, padding: "18px 20px", background: "#fff" }}>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 8 }}>Employees in this run</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: "#000000" }}>{includedRows.length} of {rows.filter(function(r) { return r.ready; }).length}</div>
        </div>
        <div style={{ border: "1px solid " + C.line, borderRadius: 14, padding: "18px 20px", background: "#fff" }}>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 8 }}>Total hours</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: "#000000", fontVariantNumeric: "tabular-nums" }}>{totalHours.toFixed(2)}</div>
        </div>
        <div style={{ border: "1px solid " + C.line, borderRadius: 14, padding: "18px 20px", background: "#fff" }}>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 8 }}>Total gross pay</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: "#000000", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(totalGross)}</div>
        </div>
      </div>

      {schedule && (
        <div style={{ border: "2px solid " + C.brand, borderRadius: 12, padding: "14px 18px", marginBottom: 20, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 12, height: 12, background: schedule.color || C.brand, borderRadius: "50%" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#000000" }}>{schedule.name}</div>
                <div style={{ fontSize: 11.5, color: C.brandDark, marginTop: 2 }}>{schedule.periods_per_year} pay periods per year, auto-detected from schedule</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: C.page, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Pay period</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#000000" }}>{fmtDateShort(payRun.pay_period_start)} to {fmtDateShort(payRun.pay_period_end)}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{daysCount} days</div>
            </div>
            <div style={{ background: C.page, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Next pay date</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#000000" }}>{fmtDateWithWeekday(payRun.pay_date)}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{daysToPay != null ? (daysToPay === 0 ? "Today" : (daysToPay > 0 ? "In " + daysToPay + " days" : Math.abs(daysToPay) + " days ago")) : ""}</div>
            </div>
          </div>
        </div>
      )}

      {!schedule && payRun && (
        <div style={{ background: C.amberBg, borderRadius: 8, padding: "12px 16px", marginBottom: 20, borderLeft: "3px solid " + C.amber }}>
          <div style={{ fontSize: 12.5, color: "#633806", fontWeight: 500 }}>No pay schedule assigned to this pay run. Dates: {fmtDateShort(payRun.pay_period_start)} to {fmtDateShort(payRun.pay_period_end)}</div>
        </div>
      )}

      <div style={{ border: "1px solid " + C.line, borderRadius: 12, background: "#fff", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "12px 20px", background: C.page, borderBottom: "1px solid " + C.line, display: "grid", gridTemplateColumns: "40px 2fr 1fr 1fr 1fr", gap: 12, fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: 0.5 }}>
          <div></div>
          <div>EMPLOYEE</div>
          <div style={{ textAlign: "right" }}>REGULAR HOURS</div>
          <div style={{ textAlign: "right" }}>STAT HOURS</div>
          <div style={{ textAlign: "right" }}>GROSS</div>
        </div>
        {rows.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: C.muted }}>No employees loaded.</div>
        )}
        {rows.map(function(r) {
          const regular = parseFloat(r.regular) || 0;
          const stat = parseFloat(r.statHoliday) || 0;
          const gross = (regular + stat) * r.hourlyRate;
          return (
            <div key={r.id} style={{ padding: "14px 20px", borderBottom: "1px solid " + C.line, display: "grid", gridTemplateColumns: "40px 2fr 1fr 1fr 1fr", gap: 12, alignItems: "center", opacity: r.ready ? 1 : 0.5 }}>
              <div>
                <input type="checkbox" checked={r.included} disabled={!r.ready} onChange={function() { toggleIncluded(r.id); }} style={{ width: 16, height: 16, accentColor: C.brand, cursor: r.ready ? "pointer" : "not-allowed" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#000000" }}>{r.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>${r.hourlyRate.toFixed(2)}/hr {r.position ? ("· " + r.position) : ""}</div>
                {!r.ready && <div style={{ fontSize: 11, color: C.amber, marginTop: 3 }}>Setup incomplete</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <input type="text" inputMode="decimal" value={r.regular} onChange={function(e) { updateRow(r.id, "regular", e.target.value); }} disabled={!r.ready} placeholder="0" style={{ width: 80, padding: "6px 10px", border: "1px solid " + C.line, borderRadius: 6, fontSize: 14, textAlign: "right", color: "#000000", fontFamily: FONT }} />
              </div>
              <div style={{ textAlign: "right" }}>
                <input type="text" inputMode="decimal" value={r.statHoliday} onChange={function(e) { updateRow(r.id, "statHoliday", e.target.value); }} disabled={!r.ready} placeholder="0" style={{ width: 80, padding: "6px 10px", border: "1px solid " + C.line, borderRadius: 6, fontSize: 14, textAlign: "right", color: "#000000", fontFamily: FONT }} />
              </div>
              <div style={{ textAlign: "right", fontSize: 14, fontWeight: 500, color: "#000000", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(gross)}</div>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: 12, background: "#FCEBEB", borderRadius: 8, color: "#791F1F", fontSize: 13, marginBottom: 16 }}>{error}</div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#fff", border: "1px solid " + C.line, borderRadius: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 0.5, fontWeight: 600, marginBottom: 2 }}>TOTAL GROSS</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#000000", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(totalGross)}</div>
        </div>
        <button onClick={handlePreview} disabled={saving || includedRows.length === 0} style={{ background: C.ink, color: "white", fontSize: 14, fontWeight: 600, padding: "12px 24px", borderRadius: 10, border: "none", cursor: (saving || includedRows.length === 0) ? "not-allowed" : "pointer", opacity: (saving || includedRows.length === 0) ? 0.5 : 1, fontFamily: FONT }}>
          {saving ? "Calculating..." : "Preview and calculate"}
        </button>
      </div>

    </div>
  );
}