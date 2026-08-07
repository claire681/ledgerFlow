import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarCheck, Check, X, AlertTriangle } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  ink: "#0E1A1A",
  muted: "#12262B",
  line: "#E7EAF0",
  page: "#F4F6F8",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  amberBg: "#FEF6E7",
  amberBorder: "#F4E0B0",
  danger: "#A32D2D",
  dangerBg: "#FBEAEA",
  dangerBorder: "#F5C4C4",
};

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

function initials(first, last) {
  var f = (first || "").trim().charAt(0).toUpperCase();
  var l = (last || "").trim().charAt(0).toUpperCase();
  return (f + l) || "?";
}

function money(n) {
  if (n == null || isNaN(n)) return "$0.00";
  var parts = Number(n).toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "$" + parts.join(".");
}

/**
 * Main eligibility popup shown when Run Payroll opens and there's a stat holiday.
 *
 * Props:
 *   periodStart, periodEnd - ISO date strings
 *   subnational - "AB" for now
 *   onCancel - called when user clicks "Cancel pay run"
 *   onContinue - called with the overrides object when user clicks "I understand, continue"
 *              overrides is { [employeeId]: { stat_pay_amount, eligible, reason } }
 *   onOpenAdjust(employee, holiday) - opens Adjust amount sub-modal
 *   onOpenMarkNotEligible(employee, holiday) - opens Mark-not-eligible sub-modal
 *   onOpenOverrideEligible(employee, holiday) - opens Override sub-modal
 */
export default function StatHolidayEligibilityPopup(props) {
  const {
    periodStart,
    periodEnd,
    subnational,
    onCancel,
    onContinue,
    onOpenAdjust,
    onOpenMarkNotEligible,
    onOpenOverrideEligible,
    overrides,
  } = props;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(function() {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        var r = await fetch(API + "/api/v1/payroll/stat-holidays/preview", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            period_start: periodStart,
            period_end: periodEnd,
            subnational: subnational || "AB",
          }),
        });
        if (!r.ok) {
          setError("Could not load holiday data. Please try again.");
          setLoading(false);
          return;
        }
        var d = await r.json();
        setData(d);
        setLoading(false);
      } catch (e) {
        setError("Network error. Please try again.");
        setLoading(false);
      }
    }
    if (periodStart && periodEnd) load();
  }, [periodStart, periodEnd, subnational]);

  // If no holidays in period, skip popup entirely.
  useEffect(function() {
    if (!loading && data && (!data.holidays || data.holidays.length === 0)) {
      // No holidays -> continue automatically without showing anything
      onContinue && onContinue({});
    }
  }, [loading, data]);

  if (loading) {
    return renderShell(
      <div style={{ padding: 60, textAlign: "center", color: C.muted, fontSize: 14, fontFamily: FONT }}>
        Checking for statutory holidays in this pay period...
      </div>
    );
  }

  if (error) {
    return renderShell(
      <div style={{ padding: 40, textAlign: "center", fontFamily: FONT }}>
        <div style={{ color: C.danger, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{error}</div>
        <button onClick={onCancel}
          style={{ height: 38, padding: "0 20px", background: C.ink, color: "#FFFFFF", border: 0, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
          Close
        </button>
      </div>
    );
  }

  if (!data || !data.holidays || data.holidays.length === 0) return null;

  // Compute effective (post-override) totals and rendered rows.
  var ov = overrides || {};
  function effectiveEmployee(e) {
    var o = ov[e.employee_id];
    if (!o) return e;
    return Object.assign({}, e, o);
  }

  // Method label
  var methodLabel = data.stat_holiday_method === 2
    ? "Regular pay + Substitute day off"
    : "Time-and-a-half + Average Daily Wage";

  // Compute new totals with overrides applied
  var newTotal = 0;
  for (var i = 0; i < data.holidays.length; i++) {
    var hol = data.holidays[i];
    for (var j = 0; j < hol.employees.length; j++) {
      var em = effectiveEmployee(hol.employees[j]);
      if (em.eligible) newTotal += Number(em.stat_pay_amount || 0);
    }
  }

  return renderShell(
    <div style={{ fontFamily: FONT }}>
      {/* Header (amber wash) */}
      <div style={{ padding: "24px 28px", background: C.amberBg, borderBottom: "1px solid " + C.amberBorder }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#FFFFFF", color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1.5px solid " + C.amberBorder }}>
            <CalendarCheck size={22} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, color: C.ink, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>
              {data.holidays.length === 1 ? "Statutory holiday in this pay period" : "Statutory holidays in this pay period"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, letterSpacing: "-0.01em" }}>
              {data.holidays.map(function(h) { return h.name + " (" + formatDate(h.date) + ")"; }).join(" and ")}
            </div>
            <div style={{ fontSize: 13, color: C.ink, fontWeight: 500, marginTop: 6, lineHeight: 1.5 }}>
              Novala checked each employee against Alberta ESA rules and calculated their stat pay. Please review before continuing.
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Method */}
        <div style={{ fontSize: 11.5, color: C.ink, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>Method applied</div>
        <div style={{ padding: "14px 16px", background: C.page, borderRadius: 10, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Check size={16} strokeWidth={2.5} color={C.brandDark} />
            <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 700 }}>{methodLabel}</span>
            <a href="/payroll/settings/stat_holiday" style={{ marginLeft: "auto", fontSize: 12.5, color: C.brandDark, fontWeight: 700, textDecoration: "underline" }}>
              Change
            </a>
          </div>
        </div>

        {/* Per-employee list per holiday */}
        {data.holidays.map(function(hol) {
          return (
            <div key={hol.date} style={{ marginBottom: 20 }}>
              {data.holidays.length > 1 && (
                <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 700, marginBottom: 10 }}>
                  {hol.name} — {formatDate(hol.date)}
                </div>
              )}
              {data.holidays.length === 1 && (
                <div style={{ fontSize: 11.5, color: C.ink, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>
                  Eligibility check ({hol.employees.length} {hol.employees.length === 1 ? "employee" : "employees"})
                </div>
              )}
              {hol.employees.map(function(rawEmp) {
                var emp = effectiveEmployee(rawEmp);
                return (
                  <EmployeeCard
                    key={emp.employee_id}
                    holiday={hol}
                    emp={emp}
                    overridden={!!ov[emp.employee_id]}
                    onAdjust={function() { onOpenAdjust && onOpenAdjust(emp, hol); }}
                    onMarkNotEligible={function() { onOpenMarkNotEligible && onOpenMarkNotEligible(emp, hol); }}
                    onOverrideEligible={function() { onOpenOverrideEligible && onOpenOverrideEligible(emp, hol); }}
                  />
                );
              })}
            </div>
          );
        })}

        {/* Total */}
        <div style={{ padding: "16px 18px", background: C.page, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: C.ink, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>Total stat pay this run</div>
            <div style={{ fontSize: 11.5, color: C.ink, fontWeight: 500, marginTop: 3 }}>Added to the pay run automatically</div>
          </div>
          <div style={{ fontSize: 22, color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{money(newTotal)}</div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
          <a href="https://www.alberta.ca/general-holidays-pay" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12.5, color: C.ink, fontWeight: 500, textDecoration: "underline" }}>
            Learn about Alberta stat holiday rules
          </a>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onCancel}
              style={{ height: 40, padding: "0 18px", background: "#FFFFFF", color: C.ink, border: "1px solid " + C.line, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
              Cancel pay run
            </button>
            <button onClick={function() {
              var applied = {};
              for (var hi = 0; hi < data.holidays.length; hi++) {
                var hol = data.holidays[hi];
                for (var ei = 0; ei < hol.employees.length; ei++) {
                  var em = effectiveEmployee(hol.employees[ei]);
                  if (em.eligible && em.stat_pay_amount != null && Number(em.stat_pay_amount) > 0) {
                    applied[em.employee_id] = em;
                  }
                }
              }
              onContinue && onContinue(applied);
            }}
              style={{ height: 40, padding: "0 22px", background: C.teal, color: "#FFFFFF", border: 0, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
              I understand, continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- helpers ----

function renderShell(inner) {
  return createPortal(
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(14,26,26,0.55)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}>
      <div style={{ background: "#FFFFFF", border: "1px solid #E7EAF0", borderRadius: 14, maxWidth: 720, width: "100%", boxShadow: "0 20px 40px rgba(14,26,26,0.15)", overflow: "hidden" }}>
        {inner}
      </div>
    </div>,
    document.body
  );
}

function formatDate(iso) {
  try {
    var d = new Date(iso + "T00:00:00");
    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  } catch (e) { return iso; }
}

function EmployeeCard(props) {
  var emp = props.emp;
  var checks = emp.checks || {};
  var isEligible = !!emp.eligible;
  var wasOverridden = !!props.overridden;

  return (
    <div style={{ border: "1px solid " + C.line, borderRadius: 12, padding: "18px 20px", marginBottom: 12 }}>
      {/* header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: C.ink, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
          {initials(emp.first_name, emp.last_name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, color: C.ink, fontWeight: 700 }}>
            {(emp.first_name || "") + " " + (emp.last_name || "")}
          </div>
          <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 500, marginTop: 1 }}>{emp.position_title || "-"}</div>
        </div>
        {isEligible ? (
          <span style={{ padding: "4px 12px", background: C.brandBg, color: C.brandDark, borderRadius: 6, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>
            {wasOverridden ? "Eligible (override)" : "Eligible"}
          </span>
        ) : (
          <span style={{ padding: "4px 12px", background: C.dangerBg, color: C.danger, borderRadius: 6, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>
            {wasOverridden ? "Not eligible (override)" : "Not eligible"}
          </span>
        )}
      </div>

      {/* body indented under avatar */}
      <div style={{ paddingLeft: 54 }}>
        {/* checks list */}
        <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
          {checks.employed_30_days && (
            <CheckRow
              pass={!!checks.employed_30_days.pass}
              label={
                checks.employed_30_days.days_employed != null
                  ? "Employed " + checks.employed_30_days.days_employed + " days (needs 30)"
                  : "Employment start date on file"
              }
            />
          )}
          {isEligible && checks.worked_5_of_9 && (
            <CheckRow
              pass={!!checks.worked_5_of_9.pass}
              label={"Worked 5 of 9 workdays before holiday" + (checks.worked_5_of_9.assumed ? " (assumed)" : "")}
            />
          )}
          {isEligible && checks.worked_before_after && (
            <CheckRow
              pass={!!checks.worked_before_after.pass}
              label={"Worked day before and after holiday" + (checks.worked_before_after.assumed ? " (assumed)" : "")}
            />
          )}
        </div>

        {/* amount block if eligible */}
        {isEligible && (
          <div style={{ padding: "12px 14px", background: C.page, borderRadius: 10 }}>
            {emp.adw != null && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
                <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 500 }}>Average Daily Wage</span>
                <span style={{ fontSize: 13, color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{money(emp.adw)}</span>
              </div>
            )}
            {emp.hours_worked_on_holiday != null && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
                <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 500 }}>Hours worked on holiday</span>
                <span style={{ fontSize: 13, color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{Number(emp.hours_worked_on_holiday || 0).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0 3px", borderTop: "1px solid " + C.line, marginTop: 4 }}>
              <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 700 }}>Total stat pay</span>
              <span style={{ fontSize: 15, color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{money(emp.stat_pay_amount)}</span>
            </div>
          </div>
        )}

        {/* explanation if not eligible */}
        {!isEligible && (
          <div style={{ padding: "12px 14px", background: C.page, borderRadius: 10, fontSize: 12.5, color: C.ink, fontWeight: 500, lineHeight: 1.5 }}>
            {emp.ineligibility_reason || "Not eligible per Alberta ESA. No stat pay will be added."}
          </div>
        )}

        {/* actions */}
        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          {isEligible && (
            <a onClick={props.onAdjust} style={{ fontSize: 12, color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>
              Adjust amount
            </a>
          )}
          {isEligible && (
            <React.Fragment>
              <span style={{ color: C.line }}>|</span>
              <a onClick={props.onMarkNotEligible} style={{ fontSize: 12, color: C.danger, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>
                Mark as not eligible
              </a>
            </React.Fragment>
          )}
          {!isEligible && (
            <a onClick={props.onOverrideEligible} style={{ fontSize: 12, color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>
              Override — mark as eligible
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckRow(props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
      {props.pass ? (
        <Check size={14} strokeWidth={2.5} color={C.brandDark} />
      ) : (
        <X size={14} strokeWidth={2.5} color={C.danger} />
      )}
      <span style={{ color: C.ink, fontWeight: 500 }}>{props.label}</span>
    </div>
  );
}