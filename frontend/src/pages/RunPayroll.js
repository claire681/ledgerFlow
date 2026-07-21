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
  cream: "#F1EFE8",
  creamBorder: "#D3D1C7",
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
  const [openPayMethodId, setOpenPayMethodId] = useState(null);

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
          const hoursRegularVal = line.hours_regular;
          const hoursStatVal = line.hours_stat_holiday;
          const statAvgDaily = e.stat_pay_avg_daily || (rate ? Number(rate) * 8 : 0);
          const setupComplete = e.setup_complete !== false;
          const payMethodRaw = (e.default_pay_method || e.pay_method || "direct_deposit").toString().toLowerCase();
          const payMethod = payMethodRaw.includes("cheque") || payMethodRaw.includes("check") ? "Cheque" : "Direct deposit";

          return {
            id: eid,
            name: name,
            position: e.position_title || "",
            hourlyRate: rate ? Number(rate) : 0,
            regular: hoursRegularVal != null && hoursRegularVal > 0 ? String(hoursRegularVal) : "",
            statHoliday: hoursStatVal != null && hoursStatVal > 0 ? String(hoursStatVal) : "",
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

  const gridCols = "30px 2fr 1.2fr 1.3fr 1.1fr 0.9fr 1.1fr 70px 1.3fr 40px";

  return (
    <div style={{ maxWidth: "100%", margin: 0, padding: "28px 32px 110px", fontFamily: FONT }}>

      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.brand, letterSpacing: "0.5px", marginBottom: 5 }}>PAYROLL</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Run payroll</div>
        <div style={{ fontSize: 14, color: C.muted }}>Review hours, then submit to finalize the run</div>
      </div>

      {needsHoursRows.length > 0 && (
        <div style={{ border: "1px solid " + C.line, borderRadius: 14, padding: "16px 22px", marginBottom: 18, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>&#128737;</span>
            <b style={{ fontSize: 16, color: C.ink, fontWeight: 700 }}>Payroll readiness</b>
            <div style={{ marginLeft: "auto" }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 11px", borderRadius: 20, background: C.amberBg, color: C.amber }}>{needsHoursRows.length} needs hours</span>
            </div>
          </div>
          {needsHoursRows.slice(0, 3).map(function(r) {
            return (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.muted, padding: "5px 0" }}>
                <span>{r.name} has no hours entered for this period.</span>
                <a onClick={function() { const el = document.getElementById("row-" + r.id); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }} style={{ color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>Add hours</a>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 18 }}>
        <div style={{ border: "1px solid " + C.line, borderRadius: 14, padding: "18px 20px", background: "#fff" }}>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 8 }}>Employees in this run</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.ink }}>{includedRows.length} of {readyRows.length}</div>
        </div>
        <div style={{ border: "1px solid " + C.line, borderRadius: 14, padding: "18px 20px", background: "#fff" }}>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 8 }}>Total hours</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{totalHours.toFixed(2)}</div>
        </div>
        <div style={{ border: "1px solid " + C.line, borderRadius: 14, padding: "18px 20px", background: "#fff" }}>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 8 }}>Total gross pay</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(totalGross)}</div>
        </div>
      </div>

      {schedule && (
        <div style={{ border: "2px solid " + C.brand, borderRadius: 10, padding: "10px 16px", marginBottom: 14, background: "#fff", display: "inline-flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, background: schedule.color || C.brand, borderRadius: "50%" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{schedule.name}</span>
          <span style={{ fontSize: 12, color: C.brandDark }}>&middot; {schedule.periods_per_year} pay periods per year</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-start", gap: 14, marginBottom: 22 }}>
        <div style={{ border: "2px solid " + C.brand, borderRadius: 10, padding: "10px 16px", background: "#fff", width: 320 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Pay period</div>
          <div style={{ border: "1px solid " + C.creamBorder, borderRadius: 6, background: C.cream, padding: "8px 14px" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{fmtDateShort(payRun.pay_period_start)} to {fmtDateShort(payRun.pay_period_end)}</div>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>Auto-filled from schedule</div>
        </div>
        <div style={{ border: "2px solid " + C.brand, borderRadius: 10, padding: "10px 16px", background: "#fff", width: 320 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Next pay date</div>
          <div style={{ border: "1px solid " + C.creamBorder, borderRadius: 6, background: C.cream, padding: "8px 14px" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{fmtDateWithWeekday(payRun.pay_date)}</div>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>Auto-filled from schedule</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <button style={{ padding: "8px 14px", background: "#fff", border: "1px solid " + C.line, borderRadius: 8, fontSize: 13, color: C.ink, fontWeight: 600, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6 }}>Filters &#9662;</button>
        <input type="text" placeholder="Search employees" value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value); }} style={{ flex: 1, padding: "9px 14px", border: "1px solid " + C.line, borderRadius: 8, fontSize: 13, color: C.muted, fontFamily: FONT }} />
        <button style={{ padding: "8px 14px", background: "#fff", border: "1px solid " + C.line, borderRadius: 8, fontSize: 13, color: C.ink, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Export</button>
      </div>

      <div style={{ border: "1px solid " + C.line, borderRadius: 12, background: "#fff", overflow: "visible" }}>
        <div style={{ padding: "14px 20px", background: C.page, borderBottom: "1px solid " + C.line, display: "grid", gridTemplateColumns: gridCols, gap: 18, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.4 }}>
          <div></div>
          <div>EMPLOYEE &middot; {includedRows.length} OF {readyRows.length}</div>
          <div style={{ textAlign: "right", cursor: "pointer" }}>REGULAR HOURS &#9662;</div>
          <div style={{ textAlign: "right", cursor: "pointer" }}>STAT HOLIDAY HOURS &#9662;</div>
          <div style={{ textAlign: "right", cursor: "pointer" }}>STAT PAY (AVG) &#9662;</div>
          <div style={{ textAlign: "right", cursor: "pointer" }}>TOTAL HOURS &#9662;</div>
          <div style={{ textAlign: "right", cursor: "pointer" }}>GROSS PAY &#9662;</div>
          <div style={{ textAlign: "center" }}>MEMO</div>
          <div style={{ cursor: "pointer" }}>PAY METHOD &#9662;</div>
          <div></div>
        </div>

        {filteredRows.length === 0 && (
          <div style={{ padding: 30, textAlign: "center", color: C.muted, fontSize: 14 }}>No employees found.</div>
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
            <div key={r.id} id={"row-" + r.id} style={{ padding: "16px 20px", borderBottom: isLast ? "none" : "1px solid " + C.line, display: "grid", gridTemplateColumns: gridCols, gap: 18, alignItems: "center", opacity: r.ready ? 1 : 0.5, position: "relative" }}>
              <div>
                <input type="checkbox" checked={r.included} disabled={!r.ready} onChange={function() { toggleIncluded(r.id); }} style={{ width: 16, height: 16, accentColor: C.brand, cursor: r.ready ? "pointer" : "not-allowed" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{r.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>${r.hourlyRate.toFixed(2)}/hr {r.position ? "\u00b7 " + r.position : ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <input type="text" inputMode="decimal" value={r.regular} onChange={function(e) { updateRow(r.id, "regular", e.target.value); }} disabled={!r.ready} placeholder="0h" style={{ width: 60, padding: "6px 10px", border: "1px solid " + C.line, borderRadius: 6, fontSize: 13, textAlign: "right", color: C.ink, fontFamily: FONT }} />
              </div>
              <div style={{ textAlign: "right" }}>
                <input type="text" inputMode="decimal" value={r.statHoliday} onChange={function(e) { updateRow(r.id, "statHoliday", e.target.value); }} disabled={!r.ready} placeholder="0h" style={{ width: 60, padding: "6px 10px", border: "1px solid " + C.line, borderRadius: 6, fontSize: 13, textAlign: "right", color: C.ink, fontFamily: FONT }} />
              </div>
              <div style={{ textAlign: "right", fontSize: 13, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(Number(r.statAvgDaily))}</div>
              <div style={{ textAlign: "right", fontSize: 14, fontWeight: 600, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{total.toFixed(2)}</div>
              <div style={{ textAlign: "right", fontSize: 14, fontWeight: 600, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(gross)}</div>
              <div style={{ textAlign: "center" }}>
                <span title={r.memo || "Add memo"} style={{ fontSize: 16, color: r.memo ? C.brand : C.muted, cursor: "pointer" }}>&#128172;</span>
              </div>
              <div style={{ position: "relative" }}>
                <span onClick={function() { setOpenPayMethodId(openPayMethodId === r.id ? null : r.id); }} style={{ background: r.payMethod === "Cheque" ? C.amberBg : C.brandBg, color: r.payMethod === "Cheque" ? C.amberText : C.brandDarkText, fontSize: 12, padding: "5px 12px", borderRadius: 6, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>{r.payMethod} &#9662;</span>
                {openPayMethodId === r.id && (
                  <div style={{ position: "absolute", top: 28, left: 0, background: "#fff", border: "1px solid " + C.line, borderRadius: 6, boxShadow: "0 6px 18px rgba(0,0,0,0.08)", width: 150, zIndex: 10, overflow: "hidden" }}>
                    <div onClick={function() { updateRow(r.id, "payMethod", "Direct deposit"); setOpenPayMethodId(null); }} style={{ padding: "8px 12px", fontSize: 13, color: C.ink, cursor: "pointer" }}>Direct deposit</div>
                    <div onClick={function() { updateRow(r.id, "payMethod", "Cheque"); setOpenPayMethodId(null); }} style={{ padding: "8px 12px", fontSize: 13, color: C.ink, cursor: "pointer", borderTop: "1px solid " + C.line }}>Cheque</div>
                  </div>
                )}
              </div>
              <div style={{ textAlign: "center", position: "relative" }}>
                <button onClick={function() { setOpenMenuId(openMenuId === r.id ? null : r.id); }} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: 4 }}>&#8942;</button>
                {openMenuId === r.id && (
                  <div style={{ position: "absolute", top: 30, right: 0, background: "#fff", border: "1px solid " + C.line, borderRadius: 8, boxShadow: "0 6px 18px rgba(0,0,0,0.08)", width: 180, overflow: "hidden", zIndex: 10, textAlign: "left" }}>
                    <div style={{ padding: "10px 14px", fontSize: 13, color: C.ink, cursor: "pointer" }} onClick={function() { setOpenMenuId(null); }}>Edit hours</div>
                    <div style={{ padding: "10px 14px", fontSize: 13, color: C.ink, cursor: "pointer", borderTop: "1px solid " + C.line }} onClick={function() { setOpenMenuId(null); }}>Add memo</div>
                    <div style={{ padding: "10px 14px", fontSize: 13, color: C.ink, cursor: "pointer", borderTop: "1px solid " + C.line }} onClick={function() { navigate("/payroll/employees/" + r.id); }}>View profile</div>
                    <div style={{ padding: "10px 14px", fontSize: 13, color: C.danger, cursor: "pointer", borderTop: "1px solid " + C.line }} onClick={function() { toggleIncluded(r.id); setOpenMenuId(null); }}>Skip this employee</div>
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

      <div style={{ position: "fixed", bottom: 0, left: 240, right: 0, background: "#fff", borderTop: "1px solid " + C.line, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 -2px 12px rgba(0,0,0,0.06)", zIndex: 20 }}>
        <button onClick={handleCancel} style={{ background: "transparent", border: "1px solid " + C.line, color: C.ink, fontSize: 14, fontWeight: 600, padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleSaveForLater} style={{ background: "transparent", border: "1px solid " + C.line, color: C.ink, fontSize: 14, fontWeight: 600, padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontFamily: FONT }}>Save for later</button>
          <button onClick={handleReview} disabled={saving || includedRows.length === 0} style={{ background: C.ink, color: "white", fontSize: 14, fontWeight: 600, padding: "10px 22px", borderRadius: 10, border: "none", cursor: (saving || includedRows.length === 0) ? "not-allowed" : "pointer", opacity: (saving || includedRows.length === 0) ? 0.5 : 1, fontFamily: FONT, display: "flex", alignItems: "center", gap: 6 }}>
            {saving ? "Calculating..." : ("Review payroll for " + includedRows.length + " employee" + (includedRows.length === 1 ? "" : "s"))}
            <span>&rarr;</span>
          </button>
        </div>
      </div>

    </div>
  );
}