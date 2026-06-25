import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, UserPlus, SlidersHorizontal, MoreVertical,
  ShieldCheck, Check, AlertTriangle, ChevronDown, Clock,
  User, UserCog, UserX, Play, Zap, CalendarClock,
} from "lucide-react";
import { getReadiness } from "../utils/payrollReadiness";
import { startNewPayroll } from "../utils/payrollLauncher";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const BRAND = "#0F9599";
const BRAND_DARK = "#0F6E56";
const BRAND_SOFT = "#E1F5EE";
const TEXT_PRIMARY = "#111827";
const TEXT_INK = "#1A2B2B";
const TEXT_SECONDARY = "#6B7280";
const TEXT_TERTIARY = "#9CA3AF";
const BG_CARD = "#FFFFFF";
const BG_PAGE = "#F7F9F9";
const BORDER = "#E5E7EB";
const BORDER_LIGHT = "#F0F4F4";
const WARN_TEXT = "#92400E";
const WARN_SOFT = "#FEF3C7";
const WARN_DOT = "#E8941A";
const SUCCESS_TEXT = "#166534";
const SUCCESS_SOFT = "#DCFCE7";

const PRIVACY_KEY = "novala_privacy";
const PRIVATE_MASK = (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#9CA3AF", fontSize: 13 }}>
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
    Hidden
  </span>
);

const AVATAR_COLORS = ["#0F9599", "#0B7377", "#185FA5", "#7C3AED", "#DB2777", "#0891B2", "#65A30D", "#B45309"];

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";
const authHeaders = () => ({ Authorization: "Bearer " + getToken(), "Content-Type": "application/json" });

const employeeName = (emp) => {
  if (!emp) return "Unknown";
  const last = (emp.last_name || "").trim();
  const first = (emp.first_name || "").trim();
  if (last && first) return last + ", " + first;
  if (emp.full_name) return emp.full_name;
  if (emp.name) return emp.name;
  return emp.email || "Unnamed";
};

const employeeInitials = (emp) => {
  if (!emp) return "?";
  const f = (emp.first_name || "").trim();
  const l = (emp.last_name || "").trim();
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (emp.full_name) {
    const parts = emp.full_name.split(/\s+/);
    return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
  }
  if (emp.email) return emp.email.slice(0, 2).toUpperCase();
  return "?";
};

const avatarColor = (emp) => {
  const seed = (emp.id || emp.email || "").toString();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const formatCurrency = (value, currency) => {
  const n = parseFloat(value) || 0;
  return n.toLocaleString("en-CA", { style: "currency", currency: currency || "CAD", minimumFractionDigits: 2 });
};

const formatPhone = (p) => {
  if (!p) return null;
  const digits = p.replace(/\D/g, "");
  if (digits.length === 10) return digits.slice(0, 3) + "-" + digits.slice(3, 6) + "-" + digits.slice(6);
  if (digits.length === 11 && digits[0] === "1") return digits.slice(1, 4) + "-" + digits.slice(4, 7) + "-" + digits.slice(7);
  return p;
};

const formatPayRate = (emp) => {
  if (emp.pay_type === "hourly" && parseFloat(emp.hourly_rate)) return formatCurrency(emp.hourly_rate, emp.currency) + "/hour";
  if (emp.pay_type === "salary" && parseFloat(emp.salary_amount)) return formatCurrency(emp.salary_amount, emp.currency) + "/year";
  return null;
};
const getPayMethod = (emp) => {
  if (emp.payment_method === "direct_deposit") return "Direct deposit";
  if (emp.payment_method === "cheque" || emp.payment_method === "paper_cheque" || emp.payment_method === "check") return "Paper cheque";
  return null;
};
const getPhone = (emp) => emp.phone || emp.mobile_phone || emp.home_phone || null;
const getRole = (emp) => emp.job_title || emp.position_title || null;
const getVacation = (emp) => (emp.vacation_balance != null && emp.vacation_balance !== "" ? (parseFloat(emp.vacation_balance) || 0).toFixed(1) + " hrs" : null);

const computeNextPayrollDue = () => {
  const today = new Date();
  const next = new Date(today);
  if (today.getDate() < 15) next.setDate(15);
  else { next.setMonth(next.getMonth() + 1); next.setDate(0); }
  return next;
};
const formatDueDate = (date) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(date); due.setHours(0, 0, 0, 0);
  if (due.getTime() === today.getTime()) return "Next payroll due today";
  const wd = due.toLocaleDateString("en-CA", { weekday: "long" });
  const ds = due.toLocaleDateString("en-CA", { day: "2-digit", month: "2-digit", year: "numeric" });
  return "Next payroll due " + wd + ", " + ds;
};

const TH = { background: BG_PAGE, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: TEXT_SECONDARY, textAlign: "left", padding: "12px 16px", borderBottom: "0.5px solid " + BORDER, textTransform: "uppercase", whiteSpace: "nowrap" };
const TD = { padding: "14px 16px", fontSize: 14, color: TEXT_PRIMARY, borderBottom: "0.5px solid " + BORDER_LIGHT, verticalAlign: "middle" };
const MASK = { letterSpacing: 2, color: TEXT_TERTIARY, fontSize: 14 };
const MISS = { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: WARN_TEXT, cursor: "pointer" };

export default function EmployeesList() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [privacy, setPrivacy] = useState(localStorage.getItem(PRIVACY_KEY) === "on");
  const [activeTab, setActiveTab] = useState("list");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [splitMenuOpen, setSplitMenuOpen] = useState(false);
  const splitMenuRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState("Active employees");
  const [activeMenuOpen, setActiveMenuOpen] = useState(false);
  const activeMenuRef = useRef(null);

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(API_URL + "/api/v1/payroll/employees", { headers: authHeaders() });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid or expired token. Please log in again.");
        throw new Error("Could not load employees.");
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.items || data.employees || []);
      setEmployees(list);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!splitMenuOpen && !activeMenuOpen && openMenuId == null) return;
    const onClick = (e) => {
      if (splitMenuOpen && (!splitMenuRef.current || !splitMenuRef.current.contains(e.target))) setSplitMenuOpen(false);
      if (activeMenuOpen && (!activeMenuRef.current || !activeMenuRef.current.contains(e.target))) setActiveMenuOpen(false);
      setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [splitMenuOpen, activeMenuOpen, openMenuId]);

  const togglePrivacy = () => {
    const next = !privacy;
    setPrivacy(next);
    localStorage.setItem(PRIVACY_KEY, next ? "on" : "off");
  };

  const withReadiness = useMemo(() => employees.map(e => {
    const r = getReadiness(e);
    return { ...e, _ready: r && r.ready };
  }), [employees]);

  const visible = useMemo(() => withReadiness.filter(emp => {
    const inactive = emp.status === "inactive" || emp.status === "terminated";
    if (activeFilter === "Active employees" && inactive) return false;
    if (activeFilter === "Inactive employees" && !inactive) return false;
    if (search) {
      const name = employeeName(emp).toLowerCase();
      if (!name.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [withReadiness, search, activeFilter]);

  const total = withReadiness.length;
  const readyCount = withReadiness.filter(e => e._ready).length;
  const nextDue = useMemo(() => computeNextPayrollDue(), []);
  const dueLabel = formatDueDate(nextDue);
  const isDueToday = dueLabel.includes("today");

  const renderAvatar = (emp) => {
    const initials = employeeInitials(emp);
    const color = avatarColor(emp);
    const ready = emp._ready;
    return (
      <div style={{ position: "relative", width: 42, height: 42, flexShrink: 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: color, color: "white", display: "grid", placeItems: "center", fontWeight: 600, fontSize: 14 }}>{initials}</div>
        <div style={{ position: "absolute", right: -2, bottom: -2, width: 18, height: 18, borderRadius: "50%", background: ready ? SUCCESS_TEXT : WARN_DOT, border: "2px solid white", display: "grid", placeItems: "center" }}>
          {ready ? <Check size={10} style={{ color: "white" }} /> : <AlertTriangle size={10} style={{ color: "white" }} />}
        </div>
      </div>
    );
  };

    const renderEmail = (emp) => {
    const email = emp.personal_email || emp.email || "";
    if (!email) return <span style={{ color: TEXT_TERTIARY, fontStyle: "italic", fontSize: 13 }}>Not set</span>;
    return <a href={"mailto:" + email} style={{ color: BRAND_DARK, fontSize: 13.5, textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>{email}</a>;
  };
  const renderJobTitle = (emp) => {
    const t = emp.position_title || emp.job_title || "";
    if (!t) return <span style={{ color: TEXT_TERTIARY, fontStyle: "italic", fontSize: 13 }}>Not set</span>;
    return <span style={{ fontSize: 13.5, color: TEXT_PRIMARY }}>{t}</span>;
  };
  const renderName = (emp) => {
    const role = getRole(emp);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {renderAvatar(emp)}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: TEXT_INK, fontSize: 14, cursor: "pointer" }} onClick={() => navigate("/payroll/employees/" + emp.id)}>{employeeName(emp)}</div>
          <div style={{ fontSize: 12, color: role ? TEXT_TERTIARY : WARN_TEXT, marginTop: 2 }}>{role || "Role not set"}</div>
        </div>
      </div>
    );
  };

  const renderPayRate = (emp) => {
    if (privacy) return PRIVATE_MASK;
    const rate = formatPayRate(emp);
    if (!rate) return <a onClick={() => navigate("/payroll/employees/" + emp.id + "?section=pay_types")} style={MISS}><AlertTriangle size={13} />Add pay rate</a>;
    if (privacy) return <span style={MASK}>{"\u2022\u2022\u2022\u2022\u2022\u2022"}</span>;
    return <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_INK }}>{rate}</span>;
  };

  const renderMethod = (emp) => {
    const at = emp.account_type;
    if (at === "direct_deposit") return <span style={{ fontSize: 13.5, color: TEXT_PRIMARY }}>Direct deposit</span>;
    if (at === "cheque") return <span style={{ fontSize: 13.5, color: TEXT_PRIMARY }}>Cheque</span>;
    return <a onClick={() => navigate("/payroll/employees/" + emp.id + "?section=payment_method")} style={MISS}><AlertTriangle size={13} />Add method</a>;
  };

  const renderVacation = (emp) => {
    if (privacy) return PRIVATE_MASK;
    const v = getVacation(emp);
    if (!v) return <a onClick={() => navigate("/payroll/employees/" + emp.id + "?section=vacation")} style={MISS}><AlertTriangle size={13} />Set up</a>;
    if (privacy) return <span style={MASK}>{"\u2022\u2022\u2022\u2022\u2022\u2022"}</span>;
    return <span style={{ fontSize: 14, color: TEXT_PRIMARY }}>{v}</span>;
  };

  const renderPhone = (emp) => {
    const p = getPhone(emp);
    if (!p) return <a onClick={() => navigate("/payroll/employees/" + emp.id + "?section=personal_info")} style={MISS}><AlertTriangle size={13} />Add phone</a>;
    return <span style={{ fontSize: 14, color: TEXT_PRIMARY }}>{formatPhone(p)}</span>;
  };

  const renderStatus = (emp) => {
    if (emp._ready) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 12, background: SUCCESS_SOFT, color: SUCCESS_TEXT }}>
          <Check size={12} />Ready
        </span>
        <span style={{ fontSize: 12, color: TEXT_TERTIARY }}>Active</span>
      </div>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 12, background: WARN_SOFT, color: WARN_TEXT }}>
          <AlertTriangle size={12} />Needs setup
        </span>
        <a style={{ fontSize: 12, color: BRAND, cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/payroll/employees/" + emp.id)}>Finish setup</a>
      </div>
    );
  };

  const renderActions = (emp) => {
    const open = openMenuId === emp.id;
    const first = (emp.first_name || "").trim() || employeeName(emp).split(",")[0];
    const item = { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12.5, color: TEXT_PRIMARY };
    return (
      <div style={{ position: "relative", textAlign: "center" }}>
        <MoreVertical size={18} style={{ color: TEXT_TERTIARY, cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setOpenMenuId(open ? null : emp.id); }} />
        {open && (
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", right: 0, top: 26, zIndex: 50, background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", padding: 4, minWidth: 200 }}>
            {emp._ready ? (
              <>
                <div style={item} onClick={() => { setOpenMenuId(null); navigate("/payroll/employees/" + emp.id); }}><User size={14} style={{ color: TEXT_SECONDARY }} />View profile</div>
                <div style={item} onClick={() => { setOpenMenuId(null); startNewPayroll(navigate); }}><Play size={14} style={{ color: TEXT_SECONDARY }} />Run payroll for {first}</div>
                <div style={item} onClick={() => { setOpenMenuId(null); alert("Make inactive coming soon"); }}><UserX size={14} style={{ color: TEXT_SECONDARY }} />Make inactive</div>
              </>
            ) : (
              <>
                <div style={item} onClick={() => { setOpenMenuId(null); navigate("/payroll/employees/" + emp.id); }}><UserCog size={14} style={{ color: TEXT_SECONDARY }} />Finish setup</div>
                <div style={item} onClick={() => { setOpenMenuId(null); alert("Make inactive coming soon"); }}><UserX size={14} style={{ color: TEXT_SECONDARY }} />Make inactive</div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div style={{ background: BG_CARD, minHeight: "100vh", padding: 40, textAlign: "center", color: TEXT_SECONDARY, fontFamily: "inherit" }}>Loading employees...</div>;
  }

  return (
    <div style={{ background: BG_CARD, minHeight: "100vh", width: "100%", fontFamily: "inherit" }}>
      <div style={{ padding: "24px 28px 36px", width: "100%" }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: TEXT_INK, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Employees</h1>
            <div style={{ fontSize: 13.5, color: TEXT_SECONDARY }}>Manage your team's profiles, pay, tax info, credentials, and direct deposit.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <a onClick={() => navigate("/payroll/paycheques")} style={{ fontSize: 13, fontWeight: 600, color: BRAND_DARK, cursor: "pointer" }}>Paycheque list</a>
              <a onClick={() => alert("Settings coming next")} style={{ fontSize: 13, fontWeight: 600, color: BRAND_DARK, cursor: "pointer" }}>Settings</a>
            </div>
            <div ref={splitMenuRef} style={{ position: "relative", display: "inline-flex", alignItems: "stretch" }}>
              <button onClick={() => startNewPayroll(navigate)} style={{ background: BRAND, color: "white", fontSize: 14, fontWeight: 600, padding: "11px 18px", border: "none", borderRadius: "9px 0 0 9px", cursor: "pointer", fontFamily: "inherit" }}>Run payroll</button>
              <button onClick={() => setSplitMenuOpen(!splitMenuOpen)} style={{ background: BRAND, color: "white", border: "none", borderLeft: "1px solid rgba(255,255,255,0.25)", borderRadius: "0 9px 9px 0", padding: "0 10px", display: "grid", placeItems: "center", cursor: "pointer" }}><ChevronDown size={16} /></button>
              {splitMenuOpen && (
                <div style={{ position: "absolute", right: 0, top: 46, background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", padding: 4, minWidth: 220, zIndex: 50 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 5, cursor: "pointer", fontSize: 13, color: TEXT_PRIMARY }} onClick={() => { setSplitMenuOpen(false); startNewPayroll(navigate); }}><Play size={14} style={{ color: TEXT_SECONDARY }} />Run scheduled payroll</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 5, cursor: "pointer", fontSize: 13, color: TEXT_PRIMARY }} onClick={() => { setSplitMenuOpen(false); alert("Off-cycle payroll coming soon"); }}><Zap size={14} style={{ color: TEXT_SECONDARY }} />Run off-cycle payroll</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 5, cursor: "pointer", fontSize: 13, color: TEXT_PRIMARY }} onClick={() => { setSplitMenuOpen(false); navigate("/payroll/items?expand=schedules"); }}><CalendarClock size={14} style={{ color: TEXT_SECONDARY }} />Manage pay schedules</div>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12.5, color: isDueToday ? WARN_TEXT : TEXT_SECONDARY, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} />{dueLabel}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid " + BORDER, marginBottom: 18 }}>
          <div onClick={() => setActiveTab("list")} style={{ padding: "9px 14px", fontSize: 14, fontWeight: 600, color: activeTab === "list" ? BRAND_DARK : TEXT_SECONDARY, cursor: "pointer", borderBottom: activeTab === "list" ? "2px solid " + BRAND : "2px solid transparent", marginBottom: -1 }}>List</div>
          <div onClick={() => navigate("/payroll/employees/directory")} style={{ padding: "9px 14px", fontSize: 14, fontWeight: 600, color: activeTab === "directory" ? BRAND_DARK : TEXT_SECONDARY, cursor: "pointer", borderBottom: activeTab === "directory" ? "2px solid " + BRAND : "2px solid transparent", marginBottom: -1 }}>Directory</div>
        </div>

        <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 10, padding: "13px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, fontWeight: 600, color: TEXT_INK }}>
            <ShieldCheck size={18} style={{ color: BRAND }} />
            <span><strong>{readyCount} of {total}</strong> employee{total === 1 ? "" : "s"} ready for payroll</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 9, border: "0.5px solid " + BORDER, borderRadius: 9, padding: "9px 13px", fontSize: 14 }}>
            <Search size={16} style={{ color: TEXT_TERTIARY }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find an employee" style={{ flex: 1, border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, color: TEXT_PRIMARY, background: "transparent" }} />
          </div>
          <div ref={activeMenuRef} style={{ position: "relative" }}>
            <button onClick={() => setActiveMenuOpen(!activeMenuOpen)} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 600, color: TEXT_PRIMARY, padding: "9px 13px", border: "0.5px solid " + BORDER, borderRadius: 9, cursor: "pointer", background: BG_CARD, fontFamily: "inherit", whiteSpace: "nowrap" }}>{activeFilter} <ChevronDown size={14} /></button>
            {activeMenuOpen && (
              <div style={{ position: "absolute", top: 44, left: 0, background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", padding: 4, minWidth: 210, zIndex: 50 }}>
                {["Active employees", "Inactive employees", "All employees"].map(opt => (
                  <div key={opt} onClick={() => { setActiveFilter(opt); setActiveMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 5, cursor: "pointer", fontSize: 13, color: activeFilter === opt ? BRAND_DARK : TEXT_PRIMARY, fontWeight: activeFilter === opt ? 600 : 400 }}>
                    {activeFilter === opt ? <Check size={14} style={{ color: BRAND }} /> : <span style={{ width: 14, display: "inline-block" }} />}
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
          <span onClick={togglePrivacy} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: TEXT_PRIMARY, cursor: "pointer" }}>
            <span style={{ width: 38, height: 22, borderRadius: 20, background: privacy ? BRAND : BORDER, position: "relative", transition: "0.15s" }}>
              <span style={{ position: "absolute", top: 2, left: privacy ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "0.15s" }} />
            </span>
            Privacy
          </span>
          <button onClick={() => navigate("/payroll/items")} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 600, color: TEXT_PRIMARY, padding: "9px 13px", border: "0.5px solid " + BORDER, borderRadius: 9, cursor: "pointer", background: BG_CARD, fontFamily: "inherit", whiteSpace: "nowrap" }}><SlidersHorizontal size={16} />Payroll items</button>
          <button onClick={() => navigate("/payroll/employees/add")} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 600, color: BRAND_DARK, padding: "9px 13px", border: "0.5px solid " + BRAND, borderRadius: 9, cursor: "pointer", background: BG_CARD, fontFamily: "inherit", whiteSpace: "nowrap" }}><UserPlus size={16} />Add employee</button>
        </div>

        {error && (
          <div style={{ padding: 12, background: "#FEE2E2", border: "0.5px solid #F87171", borderRadius: 8, color: "#991B1B", fontSize: 13, marginBottom: 14 }}>
            <strong>Could not load:</strong> {error}
          </div>
        )}

        <div style={{ border: "0.5px solid " + BORDER, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...TH, paddingLeft: 18 }}>Name</th>
                <th style={TH}>Pay rate</th>
                <th style={TH}>Pay method</th>
                <th style={TH}>Email</th>
                <th style={TH}>Job title</th>
                <th style={TH}>Phone number</th>
                <th style={TH}>Status</th>
                <th style={{ ...TH, textAlign: "center", width: 54 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: 40, textAlign: "center", color: TEXT_SECONDARY, fontSize: 13 }}>
                  {total === 0 ? "No employees yet. " : "No employees match your search. "}
                  <a onClick={() => navigate("/payroll/employees/add")} style={{ color: BRAND, cursor: "pointer", fontWeight: 600 }}>Add an employee</a> to start.
                </td></tr>
              ) : visible.map(emp => (
                <tr key={emp.id}>
                  <td style={{ ...TD, paddingLeft: 18 }}>{renderName(emp)}</td>
                  <td style={TD}>{renderPayRate(emp)}</td>
                  <td style={TD}>{renderMethod(emp)}</td>
                  <td style={TD}>{renderEmail(emp)}</td>
                  <td style={TD}>{renderJobTitle(emp)}</td>
                  <td style={TD}>{renderPhone(emp)}</td>
                  <td style={TD}>{renderStatus(emp)}</td>
                  <td style={{ ...TD, textAlign: "center", width: 54 }}>{renderActions(emp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: 12.5, color: TEXT_SECONDARY, marginTop: 12 }}>
          Showing {visible.length} of {total} employee{total === 1 ? "" : "s"}
        </div>

      </div>
    </div>
  );
}
