import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Lock, RefreshCw, Plus, AlertTriangle, Check, ChevronDown,
  ShieldCheck, MessageCircle, Sliders, ArrowUp, ArrowDown, Clock,
  Settings as SettingsIcon,
} from "lucide-react";

import { getReadiness } from "../utils/payrollReadiness";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const BRAND = "#0F9599";
const BRAND_DARK = "#0F6E56";
const BRAND_SOFT = "#E1F5EE";
const BRAND_SOFT_BORDER = "#B8E2D2";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const TEXT_TERTIARY = "#9CA3AF";
const BG_CARD = "#FFFFFF";
const BG_PAGE = "#F9FAFB";
const BG_HOVER = "#F9FAFB";
const BORDER = "#E5E7EB";
const WARNING = "#D97706";
const WARNING_DARK = "#92400E";
const WARNING_SOFT = "#FEF3C7";
const READY = "#10B981";
const NEEDS = "#F59E0B";

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

const formatCurrency = (value, currency) => {
  if (value === null || value === undefined) return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: currency || "CAD",
      maximumFractionDigits: 2,
    }).format(num);
  } catch (e) {
    return num.toFixed(2);
  }
};

const getDisplayName = (emp) => {
  const last = (emp.last_name || "").trim();
  const first = (emp.first_name || "").trim();
  if (last && first) return last + ", " + first;
  return emp.name || emp.full_name || first || last || emp.email || "Unnamed";
};

const getInitials = (emp) => {
  const f = (emp.first_name || "").trim();
  const l = (emp.last_name || "").trim();
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (f) return f.slice(0, 2).toUpperCase();
  if (l) return l.slice(0, 2).toUpperCase();
  if (emp.email) return emp.email.slice(0, 2).toUpperCase();
  return "??";
};

const getPayDescription = (emp) => {
  const hourly = parseFloat(emp.hourly_rate || 0);
  const salary = parseFloat(emp.salary_amount || 0);
  if (salary > 0) return formatCurrency(salary, emp.currency) + " / yr";
  if (hourly > 0) return formatCurrency(hourly, emp.currency) + " / hr";
  return null;
};

const getPayMethodLabel = (method) => {
  if (method === "direct_deposit") return "Direct dep.";
  if (method === "paper_cheque" || method === "check") return "Paper cheque";
  return null;
};

const getVacationDisplay = (emp) => {
  if (typeof emp.vacation_balance === "number") return emp.vacation_balance + " hrs";
  if (emp.vacation_policy) return emp.vacation_policy;
  return null;
};

const getPhone = (emp) => emp.phone || emp.mobile_phone || emp.home_phone || null;

const AVATAR_COLORS = ["#0F9599", "#6366F1", "#DC2626", "#B45309", "#7C3AED", "#0891B2", "#DB2777", "#65A30D"];
const getAvatarColor = (emp) => {
  const seed = String(emp.id || emp.email || emp.first_name || "x");
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash * 31) + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const STATUS_LABELS = {
  active: "Active",
  draft: "Draft",
  inactive: "Inactive",
  paid_leave: "On leave",
  unpaid_leave: "On leave",
  on_leave: "On leave",
  terminated: "Terminated",
  not_on_payroll: "Not on payroll",
  deceased: "Deceased",
};

const getStatusPillColors = (status) => {
  if (status === "active") return { bg: BRAND_SOFT, fg: BRAND_DARK };
  if (status === "draft") return { bg: WARNING_SOFT, fg: WARNING_DARK };
  return { bg: "#F3F4F6", fg: TEXT_SECONDARY };
};

const GRID = "44px 1fr 110px 90px 90px 120px 80px";

export default function EmployeesList() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [privacy, setPrivacy] = useState(localStorage.getItem("novala_privacy") === "on");
  const [needsSetupOnly, setNeedsSetupOnly] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL + "/api/v1/payroll/employees", { headers: authHeaders() });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid or expired token. Please log in again.");
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not load employees");
      }
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : (data.items || data.employees || []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePrivacy = () => {
    const next = !privacy;
    setPrivacy(next);
    localStorage.setItem("novala_privacy", next ? "on" : "off");
  };

  const goToEmployee = (id, section) => {
    navigate("/payroll/employees/" + id + (section ? "?section=" + section : ""));
  };

  const setSort = (field) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const employeesWithReadiness = useMemo(
    () => employees.map((e) => ({ ...e, _readiness: getReadiness(e) })),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    let list = employeesWithReadiness;
    if (statusFilter === "active") {
      list = list.filter((e) => {
        const s = e.status || "active";
        return s === "active" || s === "draft";
      });
    } else if (statusFilter === "inactive") {
      list = list.filter((e) => ["inactive", "terminated", "not_on_payroll", "deceased"].includes(e.status));
    }
    if (needsSetupOnly) list = list.filter((e) => !e._readiness.ready);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((e) =>
        getDisplayName(e).toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q) ||
        (e.job_title || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [employeesWithReadiness, statusFilter, needsSetupOnly, search]);

  const sortedEmployees = useMemo(() => {
    const sorted = [...filteredEmployees];
    sorted.sort((a, b) => {
      let av, bv;
      if (sortField === "name") { av = getDisplayName(a).toLowerCase(); bv = getDisplayName(b).toLowerCase(); }
      else if (sortField === "pay_rate") {
        av = parseFloat(a.salary_amount) > 0 ? parseFloat(a.salary_amount) : parseFloat(a.hourly_rate || 0);
        bv = parseFloat(b.salary_amount) > 0 ? parseFloat(b.salary_amount) : parseFloat(b.hourly_rate || 0);
      } else if (sortField === "vacation") {
        av = parseFloat(a.vacation_balance || 0);
        bv = parseFloat(b.vacation_balance || 0);
      } else if (sortField === "status") { av = a.status || "active"; bv = b.status || "active"; }
      else { av = ""; bv = ""; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredEmployees, sortField, sortDir]);

  const readinessStats = useMemo(() => {
    const active = employeesWithReadiness.filter((e) => (e.status || "active") === "active");
    const ready = active.filter((e) => e._readiness.ready);
    return { ready: ready.length, total: active.length, needsSetup: active.length - ready.length };
  }, [employeesWithReadiness]);

  const colHdrStyle = { fontSize: 11, fontWeight: 500, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, userSelect: "none" };
  const sortIcon = (field) => sortField === field ? (sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : null;
  const missingLink = { color: WARNING, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 };
  const mask = { fontFamily: "monospace", color: TEXT_TERTIARY, fontSize: 13, letterSpacing: 1 };

  return (
    <div style={{ position: "relative", padding: 24, paddingRight: 40, background: BG_PAGE, minHeight: "100vh" }}>

      <div onClick={() => alert("Feedback widget coming soon")} title="Send feedback" style={{ position: "fixed", right: 0, top: 300, background: BRAND, color: "white", padding: "14px 6px", borderRadius: "4px 0 0 4px", writingMode: "vertical-rl", textOrientation: "mixed", fontSize: 11, fontWeight: 500, letterSpacing: 0.4, cursor: "pointer", zIndex: 10, display: "flex", alignItems: "center", gap: 5 }}>
        <MessageCircle size={13} />
        Feedback
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.2, margin: 0 }}>Employees</h1>
          <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, marginBottom: 0 }}>
            Manage your team's profiles, pay, tax info, and direct deposit.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span onClick={() => navigate("/payroll/runs")} style={{ fontSize: 13, color: BRAND, cursor: "pointer", fontWeight: 500 }}>Paycheque list</span>
            <button onClick={() => alert("Payroll settings coming soon")} title="Settings" style={{ width: 32, height: 32, borderRadius: 6, background: "transparent", border: "none", color: TEXT_SECONDARY, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <SettingsIcon size={16} />
            </button>
          </div>
          <div style={{ display: "inline-flex", alignItems: "stretch", borderRadius: 6, overflow: "hidden" }}>
            <button onClick={() => navigate("/payroll/runs/new")} style={{ background: BRAND, color: "white", border: "none", padding: "9px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Run payroll</button>
            <button title="More payroll options" style={{ background: BRAND, color: "white", border: "none", borderLeft: "1px solid rgba(255,255,255,0.25)", padding: "0 10px", cursor: "pointer" }}>
              <ChevronDown size={14} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: TEXT_SECONDARY, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} style={{ color: WARNING }} />
            Next payroll due today
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "0.5px solid " + BORDER, marginBottom: 14 }}>
        <div style={{ padding: "8px 14px", fontSize: 13, color: BRAND, borderBottom: "2px solid " + BRAND, fontWeight: 500, cursor: "pointer" }}>List</div>
        <div onClick={() => alert("Directory view coming soon")} style={{ padding: "8px 14px", fontSize: 13, color: TEXT_SECONDARY, borderBottom: "2px solid transparent", cursor: "pointer" }}>Directory</div>
      </div>

      {readinessStats.total > 0 && (
        <div style={{ background: BRAND_SOFT, border: "0.5px solid " + BRAND_SOFT_BORDER, borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: TEXT_PRIMARY }}>
            <ShieldCheck size={18} style={{ color: BRAND_DARK }} />
            <div>
              <span style={{ fontWeight: 600 }}>{readinessStats.ready} of {readinessStats.total}</span> active employees ready for payroll
              {readinessStats.needsSetup > 0 && (
                <span>
                  <span style={{ color: TEXT_SECONDARY }}> &middot; </span>
                  <span style={{ fontWeight: 500, color: WARNING_DARK }}>{readinessStats.needsSetup} need setup</span>
                </span>
              )}
            </div>
          </div>
          {readinessStats.needsSetup > 0 && (
            <button onClick={() => setNeedsSetupOnly(!needsSetupOnly)} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid " + (needsSetupOnly ? BRAND : BORDER), background: needsSetupOnly ? BRAND_SOFT : "transparent", color: needsSetupOnly ? BRAND_DARK : TEXT_PRIMARY, cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>
              {needsSetupOnly ? "Showing setup needed" : "Show only needs setup"}
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: TEXT_SECONDARY }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find an employee" style={{ width: "100%", padding: "9px 10px 9px 32px", borderRadius: 6, border: "1px solid " + BORDER, fontSize: 13, fontFamily: "inherit", background: BG_CARD, color: TEXT_PRIMARY }} />
        </div>
        <div style={{ position: "relative" }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "9px 28px 9px 12px", borderRadius: 6, border: "1px solid " + BORDER, fontSize: 13, fontFamily: "inherit", background: BG_CARD, color: TEXT_PRIMARY, cursor: "pointer", appearance: "none" }}>
            <option value="active">Active employees</option>
            <option value="inactive">Inactive employees</option>
            <option value="all">All employees</option>
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: TEXT_SECONDARY, pointerEvents: "none" }} />
        </div>
        <div onClick={togglePrivacy} title="Mask pay amounts and vacation balances" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, cursor: "pointer", userSelect: "none" }}>
          <div style={{ width: 32, height: 18, borderRadius: 9, background: privacy ? BRAND : "#D1D5DB", position: "relative", transition: "background 0.15s" }}>
            <div style={{ position: "absolute", top: 2, left: privacy ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "white", transition: "left 0.15s" }} />
          </div>
          <span style={{ fontSize: 13, color: TEXT_PRIMARY, display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
            <Lock size={13} />
            Privacy
          </span>
        </div>
        <button onClick={() => alert("Edit payroll items coming soon")} style={{ fontSize: 13, padding: "8px 14px", borderRadius: 6, border: "1px solid " + BORDER, background: "transparent", cursor: "pointer", color: TEXT_PRIMARY, display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500, fontFamily: "inherit" }}>
          <Sliders size={14} />
          Edit payroll items
        </button>
        <button onClick={() => navigate("/payroll/employees/new")} style={{ fontSize: 13, padding: "8px 14px", borderRadius: 6, border: "none", background: BRAND, color: "white", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500, fontFamily: "inherit" }}>
          <Plus size={14} />
          Add employee
        </button>
        <button onClick={loadEmployees} title="Refresh" disabled={loading} style={{ width: 36, height: 36, borderRadius: 6, background: "transparent", border: "1px solid " + BORDER, color: TEXT_SECONDARY, cursor: loading ? "wait" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <RefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#FEE2E2", border: "0.5px solid #F87171", borderRadius: 8, color: "#991B1B", fontSize: 13, marginBottom: 14 }}>
          <strong>Could not load employees:</strong> {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: GRID, columnGap: 10, alignItems: "center", padding: "0 14px 6px" }}>
        <div></div>
        <div onClick={() => setSort("name")} style={colHdrStyle}>Name {sortIcon("name")}</div>
        <div onClick={() => setSort("pay_rate")} style={colHdrStyle}>Pay rate {sortIcon("pay_rate")}</div>
        <div style={{ ...colHdrStyle, cursor: "default" }}>Method</div>
        <div onClick={() => setSort("vacation")} style={colHdrStyle}>Vacation {sortIcon("vacation")}</div>
        <div style={{ ...colHdrStyle, cursor: "default" }}>Phone</div>
        <div onClick={() => setSort("status")} style={colHdrStyle}>Status {sortIcon("status")}</div>
      </div>

      {loading && employees.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", color: TEXT_SECONDARY, fontSize: 13 }}>Loading...</div>
      ) : sortedEmployees.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: TEXT_SECONDARY, fontSize: 13, background: BG_CARD, border: "0.5px dashed " + BORDER, borderRadius: 8 }}>
          {employees.length === 0 ? "No employees yet. Click Add employee to start." : "No employees match your filters."}
        </div>
      ) : (
        sortedEmployees.map((emp) => {
          const status = emp.status || "active";
          const isInactive = !["active", "draft"].includes(status);
          const pillColors = getStatusPillColors(status);
          const pay = getPayDescription(emp);
          const method = getPayMethodLabel(emp.payment_method);
          const vacation = getVacationDisplay(emp);
          const phone = getPhone(emp);
          const showReadinessDot = !isInactive;
          const titleHint = emp._readiness.missing.length > 0
            ? "Needs setup: " + emp._readiness.missing.map((m) => m.label).join(", ")
            : "Ready for payroll";

          return (
            <div
              key={emp.id}
              onClick={() => goToEmployee(emp.id)}
              title={titleHint}
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                columnGap: 10,
                alignItems: "center",
                background: BG_CARD,
                border: "0.5px solid " + BORDER,
                borderRadius: 8,
                marginBottom: 6,
                padding: "10px 14px",
                cursor: "pointer",
                opacity: isInactive ? 0.6 : 1,
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.background = BG_HOVER; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = BG_CARD; }}
            >
              <div style={{ position: "relative", width: 36, height: 36 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: getAvatarColor(emp), color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500 }}>
                  {getInitials(emp)}
                </div>
                {showReadinessDot && (
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: "50%", border: "2px solid " + BG_CARD, display: "flex", alignItems: "center", justifyContent: "center", background: emp._readiness.ready ? READY : NEEDS }}>
                    {emp._readiness.ready ? <Check size={10} color="white" /> : <AlertTriangle size={10} color="white" />}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>{getDisplayName(emp)}</div>
                {emp.job_title && <div style={{ fontSize: 11, color: TEXT_SECONDARY }}>{emp.job_title}</div>}
              </div>

              <div>
                {pay ? (
                  privacy ? <span style={mask}>{"\u2022\u2022\u2022\u2022\u2022\u2022"}</span>
                  : <span style={{ fontSize: 13, color: TEXT_PRIMARY }}>{pay}</span>
                ) : (
                  <span onClick={(e) => { e.stopPropagation(); goToEmployee(emp.id, "base_pay"); }} style={missingLink}>
                    <AlertTriangle size={13} />Missing
                  </span>
                )}
              </div>

              <div>
                {method ? <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{method}</span> : (
                  <span onClick={(e) => { e.stopPropagation(); goToEmployee(emp.id, "payment_method"); }} style={missingLink}>
                    <AlertTriangle size={13} />Missing
                  </span>
                )}
              </div>

              <div>
                {vacation ? (
                  privacy ? <span style={mask}>{"\u2022\u2022\u2022\u2022"}</span>
                  : <span style={{ fontSize: 13, color: TEXT_PRIMARY }}>{vacation}</span>
                ) : (
                  <span onClick={(e) => { e.stopPropagation(); goToEmployee(emp.id, "time_off"); }} style={missingLink}>
                    <AlertTriangle size={13} />Not set
                  </span>
                )}
              </div>

              <div>
                {phone ? <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{phone}</span> : (
                  <span onClick={(e) => { e.stopPropagation(); goToEmployee(emp.id, "personal"); }} style={missingLink}>
                    <AlertTriangle size={13} />Missing
                  </span>
                )}
              </div>

              <div>
                <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 500, background: pillColors.bg, color: pillColors.fg }}>
                  {STATUS_LABELS[status] || status}
                </span>
              </div>
            </div>
          );
        })
      )}

      <div style={{ fontSize: 12, color: TEXT_TERTIARY, padding: "10px 0 0" }}>
        Showing {sortedEmployees.length} of {employees.length} employees
      </div>

      <style>{"@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}
