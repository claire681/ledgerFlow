import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EditPaychequeDrawer from "../components/EditPaychequeDrawer";
import { useNavigate, useParams } from "react-router-dom";
import StatHolidayEligibilityPopup from "../components/payroll/StatHolidayEligibilityPopup";
import { AdjustStatPayModal, MarkNotEligibleModal, OverrideEligibleModal } from "../components/payroll/StatHolidaySubModals";
import ChangePeriodModal from "../components/payroll/ChangePeriodModal";
console.log("NOVALA_BUILD_TEST_" + Date.now());

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, sans-serif";

const C = {
  ink: "#0E1A1A",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  brandDarkText: "#04342C",
  muted: "#1A2332",
  faint: "#6B7280",
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

const STATUS_OPTIONS = [
  { key: "in_crew", label: "In crew" },
  { key: "desks", label: "Desks" },
  { key: "skipped", label: "Skipped" },
  { key: "not_ready", label: "Not ready" },
];

// Single source of truth for every money and hours figure on a row.
// Used by the row itself, the summary cards, and the readiness banner
// so the numbers can never drift apart.
function rowAmounts(r) {
  const regular = parseFloat(r.regular) || 0;
  const overtime = parseFloat(r.overtime) || 0;
  const vacation = parseFloat(r.vacation) || 0;
  const sick = parseFloat(r.sick) || 0;
  const stat = parseFloat(r.statHoliday) || 0;
  const rate = Number(r.hourlyRate) || 0;
  const statDaily = Number(r.statAvgDaily) || 0;
  const regPay = regular * rate;
  const otPay = overtime * rate * 1.5;
  const vacPay = vacation * rate;
  const sickPay = sick * rate;
  const statPay = stat * (statDaily / 8);
  return {
    regular: regular,
    overtime: overtime,
    vacation: vacation,
    sick: sick,
    stat: stat,
    rate: rate,
    regPay: regPay,
    otPay: otPay,
    vacPay: vacPay,
    sickPay: sickPay,
    statPay: statPay,
    extraHours: overtime + vacation + sick,
    totalHours: regular + overtime + vacation + sick + stat,
    gross: regPay + otPay + vacPay + sickPay + statPay,
  };
}

function ColumnHeader(props) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef(null);
  useEffect(function() {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return function() { document.removeEventListener("mousedown", onDoc); };
  }, []);
  const showArrow = hover || open;

  return (
    <div ref={ref} onMouseEnter={function() { setHover(true); }} onMouseLeave={function() { setHover(false); }} style={{ textAlign: props.align || "right", cursor: "pointer", position: "relative", userSelect: "none" }} onClick={function() { setOpen(function(o) { return !o; }); }}>
      <span>{props.label}</span>
      <span style={{ marginLeft: 5, fontSize: 12, color: showArrow ? C.brand : C.faint, transition: "color 0.15s" }}>&#9660;</span>
      {open && (
        <div style={{ position: "absolute", top: 24, right: 0, background: "#fff", border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", width: 200, zIndex: 25, overflow: "hidden", textAlign: "left", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 13, color: C.ink }}>
          <div style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }} onClick={function() { setOpen(false); }}>
            <span style={{ color: C.brand, fontSize: 14 }}>&uarr;</span>
            <span>Sort ascending</span>
          </div>
          <div style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid " + C.line }} onClick={function() { setOpen(false); }}>
            <span style={{ color: C.brand, fontSize: 14 }}>&darr;</span>
            <span>Sort descending</span>
          </div>
          <div style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid " + C.line }} onClick={function() { setOpen(false); }}>
            <span style={{ color: C.muted, fontSize: 14 }}>&times;</span>
            <span>Hide column</span>
          </div>
          <div style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid " + C.line }} onClick={function() { setOpen(false); }}>
            <span style={{ color: C.muted, fontSize: 14 }}>&#9881;</span>
            <span>Customize</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared hours input. Keeps the "40h" suffix and the caret-before-suffix
// behaviour that the Regular and Stat holiday cells already use.
function HourInput(props) {
  const raw = props.value == null ? "" : String(props.value);
  const suffixLen = raw ? 1 : 0;
  function caretBeforeSuffix(inp) {
    const pos = inp.value.length - suffixLen;
    try { inp.setSelectionRange(pos, pos); } catch (err) {}
  }
  return (
    <input
      type="text"
      inputMode="decimal"
      value={raw ? raw + "h" : ""}
      onChange={function(e) { props.onChange(e.target.value.replace(/[^0-9.]/g, "")); }}
      onKeyDown={function(e) {
        if (e.key === "ArrowRight" || e.key === "End") {
          const inp = e.target;
          setTimeout(function() { caretBeforeSuffix(inp); }, 0);
        }
      }}
      onClick={function(e) { e.stopPropagation(); caretBeforeSuffix(e.target); }}
      disabled={props.disabled}
      placeholder="0h"
      style={props.style}
     onFocus={function(e) { const inp = e.target; const v = raw ? raw + "h" : "" || ""; const pos = v.length - (v.endsWith("h") ? 1 : 0); setTimeout(function() { try { inp.setSelectionRange(pos, pos); } catch(err) {} }, 0); }} onClick={function(e) { const inp = e.target; const v = raw ? raw + "h" : "" || ""; const pos = v.length - (v.endsWith("h") ? 1 : 0); try { inp.setSelectionRange(pos, pos); } catch(err) {} }}/>
  );
}

function FilterPopover(props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(props.value || []);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  useEffect(function() {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return function() { document.removeEventListener("mousedown", onDoc); };
  }, []);
  function toggle(key) { setSelected(function(s) { return s.includes(key) ? s.filter(function(k) { return k !== key; }) : s.concat([key]); }); }
  function remove(key) { setSelected(function(s) { return s.filter(function(k) { return k !== key; }); }); }
  function clear() { setSelected([]); }
  function apply() { if (props.onApply) props.onApply(selected); setOpen(false); }
  const filtered = STATUS_OPTIONS.filter(function(o) { return o.label.toLowerCase().includes(search.toLowerCase()); });
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={function() { setOpen(function(o) { return !o; }); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: selected.length > 0 ? C.brandBg : "#fff", border: "1px solid " + (selected.length > 0 ? C.brand : C.line), borderRadius: 8, fontSize: 13, color: selected.length > 0 ? C.brandDark : C.ink, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>Filters{selected.length > 0 ? " (" + selected.length + ")" : ""} &#9662;
      </button>
      {open && (
        <div style={{ position: "absolute", top: 42, left: 0, background: "#fff", border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", width: 300, zIndex: 30 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid " + C.line }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Filter by</div>
          </div>
          <div style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Status</div>
            <div style={{ border: "1px solid " + C.line, borderRadius: 8, padding: "8px 10px", marginBottom: 10, minHeight: 38, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              {selected.map(function(k) {
                const opt = STATUS_OPTIONS.find(function(o) { return o.key === k; });
                if (!opt) return null;
                return (
                  <span key={k} style={{ background: C.brandBg, color: C.brandDarkText, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    {opt.label}
                    <span onClick={function() { remove(k); }} style={{ cursor: "pointer", opacity: 0.6 }}>&times;</span>
                  </span>
                );
              })}
              <input type="text" placeholder={selected.length === 0 ? "Search status..." : ""} value={search} onChange={function(e) { setSearch(e.target.value); }} style={{ border: "none", outline: "none", fontSize: 12, color: C.muted, flex: 1, minWidth: 80, padding: "2px 4px", fontFamily: FONT }} />
            </div>
            <div style={{ border: "1px solid " + C.line, borderRadius: 8, overflow: "hidden" }}>
              {filtered.map(function(o, idx) {
                const isSel = selected.includes(o.key);
                return (
                  <div key={o.key} onClick={function() { toggle(o.key); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", fontSize: 13, color: C.ink, cursor: "pointer", borderTop: idx === 0 ? "none" : "1px solid " + C.line, background: isSel ? C.page : "#fff" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: isSel ? C.brand : "transparent", fontWeight: 700 }}>&#10003;</span>
                      <span>{o.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding: "12px 18px", borderTop: "1px solid " + C.line, display: "flex", justifyContent: "space-between", gap: 10 }}>
            <button onClick={clear} style={{ flex: 1, background: "transparent", border: "1px solid " + C.line, color: C.ink, fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: FONT }}>Clear all</button>
            <button onClick={apply} style={{ flex: 1, background: C.brand, color: "white", fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: FONT }}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MemoPopover(props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(props.value || "");
  const [applyAll, setApplyAll] = useState(false);
  const ref = useRef(null);
  useEffect(function() {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return function() { document.removeEventListener("mousedown", onDoc); };
  }, []);
  function save() { if (props.onSave) props.onSave(text, applyAll); setOpen(false); }
  function clear() { setText(""); }
  const hasMemo = !!props.value;
  const remaining = 250 - text.length;
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <div onClick={function() { setOpen(function(o) { return !o; }); setText(props.value || ""); }} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, border: "1.5px solid " + (hasMemo ? C.brand : C.line), borderRadius: 6, background: hasMemo ? C.brandBg : "#fff", cursor: "pointer", color: hasMemo ? C.brandDark : C.muted, fontSize: 16, fontWeight: hasMemo ? 700 : 400 }}>+</div>
      {open && (
        <div style={{ position: "absolute", top: 32, right: 0, background: "#fff", border: "1px solid " + C.line, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", width: 320, zIndex: 30, padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Memo</div>
            <a onClick={clear} style={{ fontSize: 12, color: C.brandDark, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>Clear</a>
          </div>
          <textarea value={text} onChange={function(e) { setText(e.target.value.slice(0, 250)); }} placeholder="Write a memo for this employee..." maxLength={250} style={{ width: "100%", boxSizing: "border-box", minHeight: 80, padding: "10px 12px", border: "1px solid " + C.line, borderRadius: 8, fontSize: 13, color: C.ink, fontFamily: FONT, resize: "vertical" }} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4, fontSize: 11, color: C.muted }}>{remaining} characters left</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={applyAll} onChange={function(e) { setApplyAll(e.target.checked); }} style={{ width: 16, height: 16, accentColor: C.brand }} />
            <span style={{ fontSize: 13, color: C.ink }}>Apply to all employees</span>
          </label>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={function() { setOpen(false); }} style={{ flex: 1, background: "transparent", border: "1px solid " + C.line, color: C.ink, fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
            <button onClick={save} style={{ flex: 1, background: C.brand, color: "white", fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: FONT }}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RunPayroll() {
  const { payRunId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [payRun, setPayRun] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [rows, setRows] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  // hint always shows on Run Payroll

  const [statHolidayPopupOpen, setStatHolidayPopupOpen] = useState(false);
  const [statHolidayApplied, setStatHolidayApplied] = useState(null);
  const [statHolidayOverrides, setStatHolidayOverrides] = useState({});
  const [statSubModal, setStatSubModal] = useState(null);
  const [changePeriodOpen, setChangePeriodOpen] = useState(false);

  function toggleExpanded(id) {
    setExpandedRows(function(prev) {
      const next = Object.assign({}, prev);
      if (next[id]) { delete next[id]; } else { next[id] = true; }
      return next;
    });
  }

  function applyStatHolidayToRows(overrides) {
    setRows(function(prevRows) {
      var next = prevRows.map(function(r) {
        var o = overrides[r.id];
        if (!o) return r;
        if (o.eligible && o.stat_pay_amount != null) {
          return Object.assign({}, r, {
            statAvgDaily: Number(o.stat_pay_amount).toFixed(2),
            statHoliday: r.statHoliday || "0",
          });
        }
        return r;
      });
      // Trigger autosave so stat_pay_amount persists to DB
      scheduleAutosave(payRunId, next);
      return next;
    });
    setStatHolidayApplied(true);
  }
  function stripHourZeros(val) {
    if (val == null || val === "") return "";
    var s = String(val);
    if (s.indexOf(".") === -1) return s;
    // Remove trailing zeros and trailing dot: "40.00" -> "40", "40.50" -> "40.5"
    s = s.replace(/\.?0+$/, "");
    return s === "" ? "0" : s;
  }
  const saveTimerRef = useRef(null);
  const latestRowsRef = useRef([]);

  function saveHoursDraft(runId, rowsToSave) {
    if (!runId) return;
    const entries = (rowsToSave || []).map(function(r) {
      return {
        employee_id: r.id,
        hours_regular: parseFloat(r.regular) || 0,
        hours_overtime: parseFloat(r.overtime) || 0,
        hours_stat_holiday: parseFloat(r.statHoliday) || 0,
        hours_vacation: parseFloat(r.vacation) || 0,
        hours_sick: parseFloat(r.sick) || 0,
        stat_pay_amount: parseFloat(r.statAvgDaily) || 0,
        memo: r.memo || null,
      };
    });
    fetch(API + "/api/v1/payroll/runs/" + runId + "/hours", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ entries: entries })
    }).catch(function(e) { console.error("Autosave failed", e); });
  }

  function scheduleAutosave(runId, currentRows) {
    latestRowsRef.current = currentRows;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(function() {
      saveHoursDraft(runId, latestRowsRef.current);
    }, 1000);
  }

  useEffect(function() {
    return function() {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveHoursDraft(payRunId, latestRowsRef.current);
      }
    };
  }, [payRunId]);

  // Reset stat holiday applied flag AND clear stat pay values on all rows
  // when pay period changes so popup can re-evaluate.
  useEffect(function() {
    setStatHolidayApplied(null);
    setRows(function(prevRows) {
      return prevRows.map(function(r) {
        return Object.assign({}, r, { statAvgDaily: "", statHoliday: "" });
      });
    });
  }, [payRun && payRun.pay_period_start, payRun && payRun.pay_period_end]);

  // Open stat holiday eligibility popup once when pay run loads
  useEffect(function() {
    if (payRun && payRun.pay_period_start && payRun.pay_period_end && !statHolidayApplied) {
      setStatHolidayPopupOpen(true);
    }
  }, [payRun, statHolidayApplied]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [editDrawerEmployeeId, setEditDrawerEmployeeId] = useState(null);
  const [openPayMethodId, setOpenPayMethodId] = useState(null);
  const [statusFilter, setStatusFilter] = useState([]);
  const [focusedField, setFocusedField] = useState(null);

  const { data: loadedData, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ["pay-run-full", payRunId],
    queryFn: async function() {
      const runResp = await fetch(API + "/api/v1/payroll/runs/" + payRunId, { headers: authHeaders() });
      if (!runResp.ok) throw new Error("Could not load pay run (HTTP " + runResp.status + ")");
      const runData = await runResp.json();

      let schedData = null;
      if (runData.pay_schedule_id) {
        const schedResp = await fetch(API + "/api/v1/payroll/schedules/" + runData.pay_schedule_id, { headers: authHeaders() });
        if (schedResp.ok) schedData = await schedResp.json();
      }

      const empResp = await fetch(API + "/api/v1/payroll/employees", { headers: authHeaders() });
      if (!empResp.ok) throw new Error("Could not load employees");
      const empData = await empResp.json();
      const empArr = Array.isArray(empData) ? empData : (empData.employees || []);

      const linesResp = await fetch(API + "/api/v1/payroll/runs/" + payRunId + "/stubs", { headers: authHeaders() });
      let lines = [];
      if (linesResp.ok) {
        const linesData = await linesResp.json();
        lines = Array.isArray(linesData) ? linesData : (linesData.lines || []);
      }

      return { runData, schedData, empArr, lines };
    },
    enabled: !!payRunId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(function() {
    setLoading(queryLoading);
    if (queryError) setError(queryError.message);
  }, [queryLoading, queryError]);

  useEffect(function() {
    if (!loadedData) return;
    const { runData, schedData, empArr, lines } = loadedData;
    setPayRun(runData);
    if (schedData) setSchedule(schedData);

    const linesByEmp = {};
    lines.forEach(function(l) { linesByEmp[l.employee_id] = l; });

    const mapped = empArr.map(function(e) {
      const eid = e.id || e.employee_id;
      const line = linesByEmp[eid] || {};
      const first = e.preferred_name || e.first_name || "";
      const last = e.last_name || "";
      const name = (last && first) ? (last + ", " + first) : (first || last || "Unnamed");
      const rate = e.hourly_rate || e.pay_rate || e.rate;
      const hoursRegularVal = stripHourZeros(line.hours_regular);
      const hoursOvertimeVal = stripHourZeros(line.hours_overtime);
      const hoursStatVal = stripHourZeros(line.hours_stat_holiday);
      const hoursVacationVal = stripHourZeros(line.hours_vacation);
      const hoursSickVal = stripHourZeros(line.hours_sick);
      const setupComplete = e.setup_complete !== false;
      const empStatus = e.employment_status || "active";
      const isInactive = empStatus === "terminated" || empStatus === "deceased" || empStatus === "not_on_payroll" || empStatus === "unpaid_leave";
      const canBePaid = setupComplete && !isInactive;
      const payMethodRaw = (e.default_pay_method || e.pay_method || "direct_deposit").toString().toLowerCase();
      const payMethod = payMethodRaw.includes("cheque") || payMethodRaw.includes("check") ? "Cheque" : "Direct deposit";
      return {
        id: eid, name: name, position: e.position_title || "",
        hourlyRate: rate ? Number(rate) : 0,
        regular: hoursRegularVal != null && hoursRegularVal > 0 ? String(hoursRegularVal) : "",
        overtime: hoursOvertimeVal != null && hoursOvertimeVal > 0 ? String(hoursOvertimeVal) : "",
        statHoliday: hoursStatVal != null && hoursStatVal > 0 ? String(hoursStatVal) : "",
        vacation: hoursVacationVal != null && hoursVacationVal > 0 ? String(hoursVacationVal) : "",
        sick: hoursSickVal != null && hoursSickVal > 0 ? String(hoursSickVal) : "",
        statAvgDaily: line.stat_pay_avg != null ? line.stat_pay_avg : "", payMethod: payMethod,
        ready: canBePaid, included: canBePaid, skipped: false, employment_status: empStatus,
        memo: line.memo || "",
      };
    });
    setRows(mapped);

    const autoExpand = {};
    mapped.forEach(function(m) {
      if ((parseFloat(m.overtime) || 0) > 0 || (parseFloat(m.vacation) || 0) > 0 || (parseFloat(m.sick) || 0) > 0) {
        autoExpand[m.id] = true;
      }
    });
    setExpandedRows(autoExpand);
  }, [loadedData]);

  function updateRow(id, field, value) {
    setRows(function(rs) {
      const next = rs.map(function(r) { return r.id === id ? Object.assign({}, r, { [field]: value }) : r; });
      scheduleAutosave(payRunId, next);
      return next;
    });
  }
  function toggleIncluded(id) {
    setRows(function(rs) { return rs.map(function(r) { return r.id === id ? Object.assign({}, r, { included: !r.included }) : r; }); });
  }
  function skipFromRun(id) {
    setRows(function(rs) { return rs.map(function(r) { return r.id === id ? Object.assign({}, r, { included: false, skipped: true }) : r; }); });
  }
  function saveMemo(id, text, applyAll) {
    setRows(function(rs) { return rs.map(function(r) {
      if (applyAll) return Object.assign({}, r, { memo: text });
      return r.id === id ? Object.assign({}, r, { memo: text }) : r;
    }); });
  }

  const filteredRows = useMemo(function() {
    // Exclude terminated/inactive employees from RunPayroll display
    let list = rows.filter(function(r) {
      const status = r.employment_status || "active";
      return status !== "terminated" && status !== "deceased" && status !== "not_on_payroll";
    });
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(function(r) { return r.name.toLowerCase().includes(q); });
    }
    if (statusFilter.length > 0) {
      list = list.filter(function(r) {
        if (statusFilter.includes("in_crew") && r.included && r.ready) return true;
        if (statusFilter.includes("skipped") && r.skipped) return true;
        if (statusFilter.includes("not_ready") && !r.ready) return true;
        if (statusFilter.includes("desks") && !r.included && r.ready) return true;
        return false;
      });
    }
    return list;
  }, [rows, searchQuery, statusFilter]);

  const readyRows = rows.filter(function(r) { return r.ready; });
  const includedRows = rows.filter(function(r) { return r.included && r.ready; });
  const hasAnyHours = includedRows.some(function(r) {
    const a = rowAmounts(r);
    return a.totalHours > 0 || (parseFloat(r.statAvgDaily) || 0) > 0;
  });
  const needsHoursRows = readyRows.filter(function(r) { return rowAmounts(r).totalHours === 0; });
  const totalHours = includedRows.reduce(function(s, r) { return s + rowAmounts(r).totalHours; }, 0);
  const totalGross = includedRows.reduce(function(s, r) { return s + rowAmounts(r).gross; }, 0);

  async function handleReview() {
    if (saving) return;
    if (includedRows.length === 0) { window.alert("No employees selected. Check at least one employee to include in this pay run."); return; }
    // Validate every included employee has hours
    const includedWithoutHours = includedRows.filter(function(r) {
      const a = rowAmounts(r);
      return a.totalHours === 0 && (parseFloat(r.statAvgDaily) || 0) === 0;
    });
    if (includedWithoutHours.length > 0) {
      const names = includedWithoutHours.map(function(r) { return r.name; }).join(", ");
      window.alert("These employees have no hours entered:\n\n" + names + "\n\nAdd hours or uncheck them to continue.");
      return;
    }
    setSaving(true); setError("");
    try {
      const employeeInputs = includedRows.map(function(r) {
        const a = rowAmounts(r);
        return {
          employee_id: r.id,
          hours: {
            regular: a.regular,
            overtime: a.overtime,
            stat_holiday: a.stat,
            vacation: a.vacation,
            sick: a.sick,
          },
          bonus: 0,
          commission: 0,
          reimbursement: 0,
          stat_pay_amount: parseFloat(r.statAvgDaily) || 0,
        };
      });
      const resp = await fetch(API + "/api/v1/payroll/runs/" + payRunId + "/calculate", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ employee_inputs: employeeInputs, pay_periods_per_year: schedule ? schedule.periods_per_year : 26, subnational: "AB" }),
      });
      if (!resp.ok) throw new Error("Calculation failed: " + (await resp.text()));
      const runData = await resp.json();
      navigate("/payroll/run/" + payRunId + "/preview", {
        state: { calculation: { employee_count: runData.employee_count, total_gross: runData.total_gross, total_deductions: runData.total_deductions, total_net: runData.total_net, stubs: runData.stubs || [], source: "backend" } },
      });
    } catch (err) { setError(err.message); setSaving(false); }
  }

  function handleCancel() { setShowCancelModal(true); }
  function confirmCancelPayRun() { setShowCancelModal(false); navigate("/payroll/overview"); }
  function dismissCancelModal() { setShowCancelModal(false); }
  function handleSaveForLater() {
    // Cancel any pending debounced autosave to avoid a double request
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    // Force a final save of the current rows to the draft
    if (payRunId) {
      saveHoursDraft(payRunId, rows);
    }
    navigate("/payroll/overview");
  }
  function handleAddEmployee() { navigate("/payroll/employees"); }

  if (loading) return <div style={{ padding: "28px 32px", fontFamily: FONT }}><div style={{ padding: 40, color: C.muted }}>Loading...</div></div>;
  if (error && !payRun) return <div style={{ padding: "28px 32px", fontFamily: FONT }}><div style={{ padding: 16, background: "#FCEBEB", borderRadius: 10, color: "#791F1F" }}>{error}</div></div>;

  const gridCols = "30px 26px 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 40px";
  const displayBox = { display: "inline-block", boxSizing: "border-box", padding: "6px 10px", border: "1px solid " + C.line, borderRadius: 6, fontSize: 13, textAlign: "right", color: C.faint, background: C.page, fontFamily: FONT, fontVariantNumeric: "tabular-nums" };
  const inputBox = { boxSizing: "border-box", padding: "6px 10px", border: "1px solid " + C.line, borderRadius: 6, fontSize: 13, textAlign: "right", color: C.ink, fontFamily: FONT };
  // Left offset that lines the sub-panel up under the employee name column:
  // 20 (row padding) + 30 (checkbox) + 16 (gap) + 26 (chevron) + 16 (gap)
  const subPanelIndent = 108;

  return (
    <>
    <style>{`
      .novala-page-scroll::-webkit-scrollbar { display: none; }
      .novala-page-scroll { scrollbar-width: none; -ms-overflow-style: none; }
    `}</style>
    <div className="novala-page-scroll" style={{ maxWidth: "100%", margin: 0, padding: "28px 32px 110px", fontFamily: FONT, overflowY: "auto", height: "100vh" }}>

      <div style={{ marginBottom: 22 }}>
        {/* Breadcrumb - QuickBooks/Xero pattern */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.ink, fontWeight: 500, marginBottom: 14 }}>
          <a onClick={function() { navigate("/payroll/overview"); }} style={{ color: C.ink, fontWeight: 600, textDecoration: "none", cursor: "pointer", opacity: 0.7 }} onMouseEnter={function(e) { e.currentTarget.style.opacity = 1; e.currentTarget.style.textDecoration = "underline"; }} onMouseLeave={function(e) { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.textDecoration = "none"; }}>Payroll</a>
          <span style={{ color: C.ink, opacity: 0.4 }}>/</span>
          <a onClick={function() { navigate("/payroll/drafts"); }} style={{ color: C.ink, fontWeight: 600, textDecoration: "none", cursor: "pointer", opacity: 0.7 }} onMouseEnter={function(e) { e.currentTarget.style.opacity = 1; e.currentTarget.style.textDecoration = "underline"; }} onMouseLeave={function(e) { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.textDecoration = "none"; }}>Pay runs</a>
          <span style={{ color: C.ink, opacity: 0.4 }}>/</span>
          <span style={{ color: C.ink, fontWeight: 700 }}>Run payroll</span>
        </div>
        {/* Page title */}
        <div style={{ fontSize: 34, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 8 }}>Run payroll</div>
        <div style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>Review hours, then submit to finalize the run</div>
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
        <div style={{ border: "2px solid " + C.ink, borderRadius: 10, padding: "10px 16px", marginBottom: 14, background: "#fff", display: "inline-flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, background: schedule.color || C.brand, borderRadius: "50%" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{schedule.name}</span>
          <span style={{ fontSize: 12, color: C.brandDark }}>&middot; {schedule.periods_per_year} pay periods per year</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ border: "2px solid " + C.ink, borderRadius: 10, padding: "10px 16px", background: "#fff", width: 320 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Pay period</div>
            <div style={{ border: "1.5px solid " + C.ink, borderRadius: 6, background: "#F4F6F8", padding: "8px 14px" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{fmtDateShort(payRun.pay_period_start)} to {fmtDateShort(payRun.pay_period_end)}</div>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, display: "flex", gap: 10, alignItems: "center" }}><span style={{ color: C.ink, fontWeight: 600 }}>Auto-filled from schedule</span><span style={{ color: C.ink }}>|</span><a onClick={function() { setChangePeriodOpen(true); }} style={{ color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>Change period</a></div>
          </div>
          <div style={{ border: "2px solid " + C.ink, borderRadius: 10, padding: "10px 16px", background: "#fff", width: 320 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Next pay date</div>
            <div style={{ border: "1.5px solid " + C.ink, borderRadius: 6, background: "#F4F6F8", padding: "8px 14px" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{fmtDateWithWeekday(payRun.pay_date)}</div>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: C.ink, fontWeight: 600 }}>Auto-filled from schedule</div>
          </div>
        </div>
        <button onClick={handleAddEmployee} style={{ background: "#FFFFFF", color: C.brandDark, border: "1.5px solid " + C.brand, padding: "10.5px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          Add employee
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <FilterPopover value={statusFilter} onApply={function(v) { setStatusFilter(v); }} />
        {!searchExpanded && !searchQuery ? (
          <div onClick={function() { setSearchExpanded(true); setTimeout(function() { if (searchInputRef.current) searchInputRef.current.focus(); }, 0); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", border: "1px solid " + C.line, borderRadius: 999, background: C.page, cursor: "pointer", fontFamily: FONT }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span style={{ fontSize: 12, color: C.ink, fontWeight: 600 }}>Search</span>
          </div>
        ) : (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", border: "1px solid " + C.ink, borderRadius: 999, background: "#fff", width: 240, fontFamily: FONT }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input ref={searchInputRef} type="text" placeholder="Search employees..." value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value); }} onBlur={function() { if (!searchQuery) setSearchExpanded(false); }} style={{ border: "none", outline: "none", fontSize: 12, color: C.ink, flex: 1, background: "transparent", fontFamily: FONT }} />
          </div>
        )}
        <button onClick={async function() {
          if (!payRunId) return;
          try {
            const res = await fetch(API + "/api/v1/payroll/runs/" + payRunId + "/export", {
              headers: authHeaders(),
            });
            if (!res.ok) { alert("Could not export"); return; }
            const disp = res.headers.get("content-disposition") || "";
            let filename = "payroll_export.csv";
            const m = disp.match(/filename="?([^";]+)"?/);
            if (m) filename = m[1];
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
          } catch (e) {
            console.error("Export failed", e);
            alert("Export failed: " + e.message);
          }
        }} style={{ padding: "5px 12px", background: "#fff", border: "1.5px solid " + C.ink, borderRadius: 8, fontSize: 12, color: C.ink, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export
        </button>
      </div>

      <div style={{ background: "#E1F5EE", borderLeft: "3px solid " + C.brand, borderRadius: "0 8px 8px 0", padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.ink }}>
          <span style={{ fontSize: 15 }}>&#128161;</span>
          <span style={{ flex: 1, fontWeight: 500 }}>Click the arrow next to any employee to add overtime, vacation, or sick hours.</span>
        </div>
        <div style={{ border: "1px solid " + C.line, borderRadius: 12, background: "#fff", overflow: "visible" }}>
        <div style={{ padding: "14px 20px", background: C.page, borderBottom: "1px solid " + C.line, display: "grid", gridTemplateColumns: gridCols, gap: 16, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.4, position: "relative" }}>
          <div></div>
          <div></div>
          <div>EMPLOYEE &middot; {includedRows.length} OF {readyRows.length}</div>
          <ColumnHeader label="REGULAR HOURS" />
          <ColumnHeader label="STAT HOLIDAY HOURS" />
          <ColumnHeader label="STAT PAY (AVG)" />
          <ColumnHeader label="TOTAL HOURS" />
          <ColumnHeader label="GROSS PAY" />
          <div style={{ textAlign: "center" }}>MEMO</div>
          <ColumnHeader label="PAY METHOD" align="left" />
          <div></div>
        </div>

        {filteredRows.length === 0 && <div style={{ padding: 30, textAlign: "center", color: C.muted, fontSize: 14 }}>No employees found.</div>}

        {filteredRows.map(function(r, idx) {
          const a = rowAmounts(r);
          const isLast = idx === filteredRows.length - 1;
          const isExpanded = !!expandedRows[r.id];
          const isSelected = selectedRowId === r.id;
          const rowBg = r.skipped ? "#FAFBFC" : (isSelected ? C.brandBg : "transparent");

          return (
            <React.Fragment key={r.id}>
              <div id={"row-" + r.id} onClick={function() { setSelectedRowId(isSelected ? null : r.id); }} style={{ padding: "16px 20px", borderBottom: (isLast && !isExpanded) || isExpanded ? "none" : "1px solid " + C.line, display: "grid", gridTemplateColumns: gridCols, gap: 16, alignItems: "center", opacity: r.ready ? 1 : 0.5, position: "relative", background: rowBg, borderLeft: isSelected ? "3px solid " + C.brand : "3px solid transparent", cursor: "pointer" }}>
                <div>
                  <input type="checkbox" checked={r.included} disabled={!r.ready || r.skipped} onChange={function() { toggleIncluded(r.id); }} onClick={function(e) { e.stopPropagation(); }} style={{ width: 16, height: 16, accentColor: C.brand, cursor: r.ready ? "pointer" : "not-allowed" }} />
                </div>
                <div>
                  <button
                    type="button"
                    title={isExpanded ? "Hide additional hours" : "Add overtime, vacation, or sick hours"}
                    aria-expanded={isExpanded}
                    onClick={function(e) { e.stopPropagation(); toggleExpanded(r.id); }}
                    style={{ background: "transparent", border: "none", padding: 0, width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", color: isExpanded ? C.brandDark : C.muted }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}>
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    {!isExpanded && a.extraHours > 0 && (
                      <span style={{ position: "absolute", top: 1, right: 0, width: 6, height: 6, borderRadius: "50%", background: C.brand }} />
                    )}
                  </button>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div onClick={function(e) { e.stopPropagation(); setEditDrawerEmployeeId(r.id); }} style={{ fontSize: 14, fontWeight: 600, color: r.skipped ? "#4B5563" : C.ink, cursor: "pointer", textDecoration: "none", display: "inline-block" }} onMouseEnter={function(e) { e.currentTarget.style.textDecoration = "underline"; }} onMouseLeave={function(e) { e.currentTarget.style.textDecoration = "none"; }}>{r.name}</div>
              {r.skipped && <span style={{ padding: "2px 8px", background: "#E5E7EB", color: "#4B5563", borderRadius: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Skipped</span>}
            </div>
                  <div style={{ fontSize: 12, color: C.muted }}>${r.hourlyRate.toFixed(2)}/hr {r.position ? "\u00b7 " + r.position : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <HourInput value={r.regular} onChange={function(v) { updateRow(r.id, "regular", v); }} disabled={!r.ready || r.skipped} style={Object.assign({}, inputBox, { width: 90 })} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <HourInput value={r.statHoliday} onChange={function(v) { updateRow(r.id, "statHoliday", v); }} disabled={!r.ready || r.skipped} style={Object.assign({}, inputBox, { width: 90 })} />
                </div>
                <div style={{ textAlign: "right", position: "relative" }}>
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: r.statAvgDaily === "" || r.statAvgDaily == null ? C.faint : C.ink, pointerEvents: "none", fontFamily: FONT }}>$</span>
                    <input type="text" inputMode="decimal" value={r.statAvgDaily === "" || r.statAvgDaily == null ? "" : String(r.statAvgDaily)} onChange={function(e) { const v = e.target.value; updateRow(r.id, "statAvgDaily", v === "" ? "" : (parseFloat(v) || 0)); }} onClick={function(e) { e.stopPropagation(); }} disabled={!r.ready || r.skipped} placeholder="0.00" style={Object.assign({}, inputBox, { width: 90, paddingLeft: 20 })} />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={Object.assign({}, displayBox, { width: 90 })}>{a.totalHours > 0 ? (a.totalHours % 1 === 0 ? String(a.totalHours) : a.totalHours.toFixed(2)) + "h" : "0h"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={Object.assign({}, displayBox, { width: 90 })}>{fmtMoney(a.gross)}</div>
                </div>
                <div style={{ textAlign: "center" }} onClick={function(e) { e.stopPropagation(); }}>
                  <MemoPopover value={r.memo} onSave={function(text, applyAll) { saveMemo(r.id, text, applyAll); }} />
                </div>
                <div style={{ position: "relative" }} onClick={function(e) { e.stopPropagation(); }}>
                  <span onClick={function() { setOpenPayMethodId(openPayMethodId === r.id ? null : r.id); }} style={{ background: r.payMethod === "Cheque" ? C.amberBg : C.brandBg, color: r.payMethod === "Cheque" ? C.amberText : C.brandDarkText, fontSize: 12, padding: "5px 12px", borderRadius: 6, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>{r.payMethod} &#9662;</span>
                  {openPayMethodId === r.id && (
                    <div style={{ position: "absolute", top: 28, left: 0, background: "#fff", border: "1px solid " + C.line, borderRadius: 6, boxShadow: "0 6px 18px rgba(0,0,0,0.08)", width: 150, zIndex: 10, overflow: "hidden" }}>
                      <div onClick={function() { updateRow(r.id, "payMethod", "Direct deposit"); setOpenPayMethodId(null); }} style={{ padding: "8px 12px", fontSize: 13, color: C.ink, cursor: "pointer" }}>Direct deposit</div>
                      <div onClick={function() { updateRow(r.id, "payMethod", "Cheque"); setOpenPayMethodId(null); }} style={{ padding: "8px 12px", fontSize: 13, color: C.ink, cursor: "pointer", borderTop: "1px solid " + C.line }}>Cheque</div>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "center", position: "relative" }} onClick={function(e) { e.stopPropagation(); }}>
                  <button onClick={function() { setOpenMenuId(openMenuId === r.id ? null : r.id); }} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: 4 }}>&#8942;</button>
                  {openMenuId === r.id && (
                    <div style={{ position: "absolute", top: 30, right: 0, background: "#fff", border: "1px solid " + C.line, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", width: 200, overflow: "hidden", zIndex: 20, textAlign: "left" }}>
                      <div style={{ padding: "10px 14px", fontSize: 13, color: C.ink, cursor: "pointer" }} onClick={function() { setEditDrawerEmployeeId(r.id); setOpenMenuId(null); }}>Edit paycheque</div>
                      <div style={{ padding: "10px 14px", fontSize: 13, color: C.ink, cursor: "pointer", borderTop: "1px solid " + C.line }} onClick={function() { navigate("/payroll/employees/" + r.id); }}>View profile</div>
                      {r.skipped
              ? <div style={{ padding: "10px 14px", fontSize: 13, color: C.brand, cursor: "pointer", borderTop: "1px solid " + C.line, fontWeight: 600 }} onClick={function() { setRows(function(rs) { return rs.map(function(x) { return x.id === r.id ? Object.assign({}, x, { included: true, skipped: false }) : x; }); }); setOpenMenuId(null); }}>Add back to payroll</div>
              : <div style={{ padding: "10px 14px", fontSize: 13, color: C.danger, cursor: "pointer", borderTop: "1px solid " + C.line }} onClick={function() { skipFromRun(r.id); setOpenMenuId(null); }}>Skip from payroll run</div>
            }
                    </div>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div
                  onClick={function(e) { e.stopPropagation(); }}
                  style={{ padding: "4px 20px 18px " + subPanelIndent + "px", borderBottom: isLast ? "none" : "1px solid " + C.line, background: isSelected ? C.brandBg : C.page, borderLeft: isSelected ? "3px solid " + C.brand : "3px solid transparent", opacity: r.ready ? 1 : 0.5 }}
                >
                  <div style={{ border: "1px solid " + C.line, borderRadius: 10, background: "#fff", padding: "14px 18px", display: "inline-block" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>Additional hours</div>
                    <div style={{ display: "flex", gap: 26, alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6 }}>Overtime <span style={{ color: C.faint, fontWeight: 500 }}>(1.5x)</span></div>
                        <HourInput value={r.overtime} onChange={function(v) { updateRow(r.id, "overtime", v); }} disabled={!r.ready || r.skipped} style={Object.assign({}, inputBox, { width: 100 })} />
                        <div style={{ fontSize: 12, color: C.faint, marginTop: 6, textAlign: "right", width: 100, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(a.otPay)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6 }}>Vacation</div>
                        <HourInput value={r.vacation} onChange={function(v) { updateRow(r.id, "vacation", v); }} disabled={!r.ready || r.skipped} style={Object.assign({}, inputBox, { width: 100 })} />
                        <div style={{ fontSize: 12, color: C.faint, marginTop: 6, textAlign: "right", width: 100, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(a.vacPay)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6 }}>Sick</div>
                        <HourInput value={r.sick} onChange={function(v) { updateRow(r.id, "sick", v); }} disabled={!r.ready || r.skipped} style={Object.assign({}, inputBox, { width: 100 })} />
                        <div style={{ fontSize: 12, color: C.faint, marginTop: 6, textAlign: "right", width: 100, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(a.sickPay)}</div>
                      </div>
                      <div style={{ borderLeft: "1px solid " + C.line, paddingLeft: 26, alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Additional pay</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(a.otPay + a.vacPay + a.sickPay)}</div>
                        <div style={{ fontSize: 12, color: C.faint, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{a.extraHours % 1 === 0 ? String(a.extraHours) : a.extraHours.toFixed(2)}h at ${r.hourlyRate.toFixed(2)}/hr base</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {error && <div style={{ padding: 12, background: "#FCEBEB", borderRadius: 8, color: "#791F1F", fontSize: 13, marginTop: 14 }}>{error}</div>}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid " + C.line, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 -2px 12px rgba(0,0,0,0.06)", zIndex: 20 }}>
        <button onClick={handleCancel} style={{ background: "transparent", border: "1px solid " + C.line, color: C.ink, fontSize: 14, fontWeight: 600, padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleSaveForLater} style={{ background: "transparent", border: "1px solid " + C.line, color: C.ink, fontSize: 14, fontWeight: 600, padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontFamily: FONT }}>Save for later</button>
          <button onClick={handleReview} disabled={saving || includedRows.length === 0 || !hasAnyHours} style={{ background: C.brand, color: "white", fontSize: 14, fontWeight: 600, padding: "10px 22px", borderRadius: 10, border: "none", cursor: (saving || includedRows.length === 0 || !hasAnyHours) ? "not-allowed" : "pointer", opacity: (saving || includedRows.length === 0 || !hasAnyHours) ? 0.5 : 1, fontFamily: FONT, display: "flex", alignItems: "center", gap: 6 }}>
            {saving ? "Calculating..." : ("Review payroll for " + includedRows.length + " employee" + (includedRows.length === 1 ? "" : "s"))}
            <span>&rarr;</span>
          </button>
        </div>
      </div>

    
      {changePeriodOpen && payRun && (
        <ChangePeriodModal
          isOpen={true}
          payRun={payRun}
          onCancel={function() { setChangePeriodOpen(false); }}
          onSaved={function(updated) {
            setChangePeriodOpen(false);
            setPayRun(function(prev) { return Object.assign({}, prev, updated); });
            // Reset so stat holiday popup can re-check the new period
            setStatHolidayApplied(null);
            setStatHolidayOverrides({});
          }}
        />
      )}
      {statHolidayPopupOpen && payRun && (
        <StatHolidayEligibilityPopup
          periodStart={payRun.pay_period_start}
          periodEnd={payRun.pay_period_end}
          subnational="AB"
          overrides={statHolidayOverrides}
          onCancel={function() { setStatHolidayPopupOpen(false); navigate("/payroll/overview"); }}
          onContinue={function(overrides) {
            setStatHolidayPopupOpen(false);
            setStatHolidayOverrides(overrides || {});
            // Apply computed stat_pay_amount to each row
            applyStatHolidayToRows(overrides || {});
          }}
          onOpenAdjust={function(emp, hol) { setStatSubModal({ type: "adjust", emp: emp, hol: hol }); }}
          onOpenMarkNotEligible={function(emp, hol) { setStatSubModal({ type: "not_eligible", emp: emp, hol: hol }); }}
          onOpenOverrideEligible={function(emp, hol) { setStatSubModal({ type: "override_eligible", emp: emp, hol: hol }); }}
        />
      )}
      {statSubModal && statSubModal.type === "adjust" && (
        <AdjustStatPayModal
          isOpen={true}
          emp={statSubModal.emp}
          holiday={statSubModal.hol}
          onCancel={function() { setStatSubModal(null); }}
          onSave={function(patch) {
            var next = Object.assign({}, statHolidayOverrides);
            next[statSubModal.emp.employee_id] = Object.assign({}, statSubModal.emp, patch);
            setStatHolidayOverrides(next);
            setStatSubModal(null);
          }}
        />
      )}
      {statSubModal && statSubModal.type === "not_eligible" && (
        <MarkNotEligibleModal
          isOpen={true}
          emp={statSubModal.emp}
          holiday={statSubModal.hol}
          onCancel={function() { setStatSubModal(null); }}
          onConfirm={function(patch) {
            var next = Object.assign({}, statHolidayOverrides);
            next[statSubModal.emp.employee_id] = Object.assign({}, statSubModal.emp, patch);
            setStatHolidayOverrides(next);
            setStatSubModal(null);
          }}
        />
      )}
      {statSubModal && statSubModal.type === "override_eligible" && (
        <OverrideEligibleModal
          isOpen={true}
          emp={statSubModal.emp}
          holiday={statSubModal.hol}
          onCancel={function() { setStatSubModal(null); }}
          onConfirm={function(patch) {
            var next = Object.assign({}, statHolidayOverrides);
            next[statSubModal.emp.employee_id] = Object.assign({}, statSubModal.emp, patch);
            setStatHolidayOverrides(next);
            setStatSubModal(null);
          }}
        />
      )}
        {editDrawerEmployeeId && (
          <EditPaychequeDrawer
            runId={payRunId}
            employeeId={editDrawerEmployeeId}
            onClose={function() { setEditDrawerEmployeeId(null); }}
            onSaved={function() {
              const empId = editDrawerEmployeeId;
              if (!empId || !payRunId) return;
              fetch(API + "/api/v1/payroll/pay-runs/" + payRunId + "/paycheques/" + empId, {
                headers: authHeaders(),
              })
                .then(function(r) { return r.ok ? r.json() : null; })
                .then(function(d) {
                  if (!d) return;
                  const regular = (d.earnings || []).find(function(e) { return e.type === "Regular Pay"; });
                  const stat = (d.earnings || []).find(function(e) { return e.type === "Stat Holiday Pay"; });
                  const statAdw = (d.earnings || []).find(function(e) { return e.type === "Stat pay - average daily wage"; });
                  setRows(function(prev) {
                    return prev.map(function(row) {
                      if (row.id !== empId) return row;
                      return Object.assign({}, row, {
                        regular: regular ? String(regular.hours || 0) : row.regular,
                        statHoliday: stat ? String(stat.hours || 0) : row.statHoliday,
                        statAvgDaily: statAdw ? Number(statAdw.current || 0) : row.statAvgDaily,
                        memo: d.memo || "",
                      });
                    });
                  });
                })
                .catch(function(e) { console.error("Refresh row failed:", e); });
            }}
          />
        )}
</div>
    
      {showCancelModal && (
        <div onClick={dismissCancelModal} style={{ position: "fixed", inset: 0, background: "rgba(10,26,30,0.42)", zIndex: 3000, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: 100, fontFamily: FONT }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ width: 440, background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(10,26,30,0.28)", overflow: "hidden" }}>
            <div style={{ padding: "28px 28px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FEF6E7", color: "#A67312", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 20, fontWeight: 700 }}>!</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#12262B", marginBottom: 4, letterSpacing: "-0.01em" }}>Cancel this pay run?</div>
                  <div style={{ fontSize: 13.5, color: "#12262B", lineHeight: 1.55, fontWeight: 500 }}>Any unsaved changes will be lost. You can start a new pay run any time.</div>
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 28px", background: "#F4F6F8", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={dismissCancelModal} style={{ padding: "10px 18px", background: "#fff", color: "#12262B", border: "1.5px solid #12262B", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Keep working</button>
              <button onClick={confirmCancelPayRun} style={{ padding: "10px 18px", background: "#DC2626", color: "#fff", border: 0, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel pay run</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}