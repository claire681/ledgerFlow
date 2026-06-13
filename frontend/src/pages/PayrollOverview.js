import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Maximize2, Play, ChevronRight, ArrowRight, ShieldCheck, ChevronDown,
  AlertCircle, AlertTriangle, User, Landmark, FileText,
  Book, ListChecks, CreditCard, Calendar,
} from "lucide-react";

import { getReadiness } from "../utils/payrollReadiness";
import { buildAttentionFeed, STUB_TAX_DUES, STUB_SETUP_TASKS } from "../utils/payrollAttention";
import CreateActionsDrawer, { ACTION_CATALOG } from "../components/payroll/CreateActionsDrawer";
import RunPayrollGuardModal from "../components/payroll/RunPayrollGuardModal";

let _generatePayPeriods = null;
try {
  _generatePayPeriods = require("../utils/payScheduling").generatePayPeriods;
} catch (e) {
  _generatePayPeriods = null;
}

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
const BORDER = "#E5E7EB";
const WARNING = "#D97706";
const WARNING_DARK = "#92400E";
const WARNING_SOFT = "#FEF3C7";
const RED_SOFT = "#FEE2E2";
const RED_DARK = "#991B1B";

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  Authorization: "Bearer " + getToken(),
  "Content-Type": "application/json",
});

const FAV_STORAGE_KEY = "novala_create_action_favourites";
const TASKS_STORAGE_KEY = "novala_setup_tasks";
const DEFAULT_FAVOURITES = ["add_workers_comp", "run_payroll", "add_employee", "update_payroll_settings"];

const loadFavourites = () => {
  try {
    const raw = localStorage.getItem(FAV_STORAGE_KEY);
    if (!raw) return DEFAULT_FAVOURITES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_FAVOURITES;
    return parsed.slice(0, 10);
  } catch (e) {
    return DEFAULT_FAVOURITES;
  }
};

const loadCompletedTasks = () => {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return new Set();
    return new Set(Object.keys(parsed));
  } catch (e) {
    return new Set();
  }
};

const markTaskComplete = (taskId) => {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[taskId] = new Date().toISOString();
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {}
};

const SCHEDULE_LABELS = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  bi_weekly: "Bi-weekly",
  semimonthly: "Semi-monthly",
  semi_monthly: "Semi-monthly",
  monthly: "Monthly",
};

const computeNextPayday = (employees) => {
  if (!_generatePayPeriods) return { date: null, daysUntil: null, schedule: null };
  const active = employees.filter((e) => (e.status || "active") === "active");
  const counts = {};
  active.forEach((e) => {
    if (e.pay_schedule) counts[e.pay_schedule] = (counts[e.pay_schedule] || 0) + 1;
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return { date: null, daysUntil: null, schedule: null };
  const schedule = top[0];

  try {
    const periods = _generatePayPeriods(schedule, 3, new Date());
    if (!periods || !periods.length) return { date: null, daysUntil: null, schedule };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const next = periods.find((p) => {
      const d = new Date(p.payDate || p.pay_date || p.date);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    }) || periods[0];
    const payDate = new Date(next.payDate || next.pay_date || next.date);
    if (isNaN(payDate.getTime())) return { date: null, daysUntil: null, schedule };
    payDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.round((payDate - today) / (1000 * 60 * 60 * 24));
    return { date: payDate, daysUntil, schedule };
  } catch (e) {
    return { date: null, daysUntil: null, schedule };
  }
};

const formatPayDateLabel = (d) => {
  if (!d) return "";
  return d.toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric" });
};

const ATTENTION_ICONS = {
  "alert-circle": AlertCircle,
  "user": User,
  "building-bank": Landmark,
  "file-text": FileText,
};

const SEVERITY_STYLES = {
  overdue: { bg: RED_SOFT, fg: RED_DARK, meta: RED_DARK },
  soon: { bg: WARNING_SOFT, fg: WARNING_DARK, meta: TEXT_SECONDARY },
  general: { bg: BRAND_SOFT, fg: BRAND_DARK, meta: TEXT_SECONDARY },
};

export default function PayrollOverview() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [favourites, setFavourites] = useState(loadFavourites());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [completedTasks, setCompletedTasks] = useState(loadCompletedTasks());
  const [guardOpen, setGuardOpen] = useState(false);

  useEffect(() => {
    (async () => {
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
      }
    })();
  }, []);

  const employeesWithReadiness = useMemo(
    () => employees.map((e) => ({ ...e, _readiness: getReadiness(e) })),
    [employees]
  );

  const activeEmployees = useMemo(
    () => employeesWithReadiness.filter((e) => (e.status || "active") === "active"),
    [employeesWithReadiness]
  );

  const readyOnNextRun = useMemo(() => {
    const ready = activeEmployees.filter((e) => e._readiness.ready);
    const notReady = activeEmployees.filter((e) => !e._readiness.ready);
    return { total: activeEmployees.length, ready: ready.length, notReady };
  }, [activeEmployees]);

  const nextPayday = useMemo(() => computeNextPayday(employeesWithReadiness), [employeesWithReadiness]);

  const attentionItems = useMemo(
    () => buildAttentionFeed({
      taxDues: STUB_TAX_DUES,
      employees: activeEmployees,
      setupTasks: STUB_SETUP_TASKS,
      completedTaskIds: completedTasks,
    }),
    [activeEmployees, completedTasks]
  );

  const handleActionClick = (actionId) => {
    switch (actionId) {
      case "run_payroll": return handleRunPayroll();
      case "add_employee": return navigate("/payroll/employees/new");
      case "view_paycheque_list": return navigate("/payroll/paycheques");
      case "update_payroll_settings": return alert("Payroll settings coming soon");
      case "edit_payroll_items": return alert("Edit payroll items coming soon");
      case "update_work_location": return alert("Work location editor coming soon");
      case "update_accounting_preferences": return alert("Accounting preferences coming soon");
      case "add_workers_comp": return alert("Workers comp coming soon");
      default: return alert(actionId + " coming soon");
    }
  };

  const handleRunPayroll = () => {
    if (readyOnNextRun.notReady.length > 0) setGuardOpen(true);
    else navigate("/payroll/runs/new");
  };

  const handleAttentionAction = (item) => {
    if (item.action.id === "fix_employee") {
      navigate("/payroll/employees/" + item.action.employeeId + "?section=" + item.action.section);
    } else if (item.action.id === "complete_task") {
      markTaskComplete(item.action.taskId);
      setCompletedTasks(new Set([...completedTasks, item.action.taskId]));
    } else if (item.action.id === "pay_tax") {
      alert("Tax payment flow coming soon");
    }
  };

  const fixFirstUnready = () => {
    const first = readyOnNextRun.notReady[0];
    if (!first) return;
    const section = (first._readiness.missing[0] && first._readiness.missing[0].section) || "personal";
    navigate("/payroll/employees/" + first.id + "?section=" + section);
  };

  const handleSaveFavourites = (next) => {
    setFavourites(next);
    localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(next));
    setDrawerOpen(false);
  };

  const favouriteActionDefs = favourites.map((id) => ACTION_CATALOG.find((a) => a.id === id)).filter(Boolean);
  const scheduleLabel = nextPayday.schedule ? (SCHEDULE_LABELS[nextPayday.schedule] || nextPayday.schedule) : null;
  const payDateLabel = formatPayDateLabel(nextPayday.date);

  let headline;
  if (nextPayday.daysUntil === null) headline = "Set up a pay schedule to see your next payday";
  else if (nextPayday.daysUntil < 0) headline = "Payday was " + Math.abs(nextPayday.daysUntil) + " day" + (Math.abs(nextPayday.daysUntil) === 1 ? "" : "s") + " ago";
  else if (nextPayday.daysUntil === 0) headline = "Payday is today";
  else headline = nextPayday.daysUntil + " day" + (nextPayday.daysUntil === 1 ? "" : "s") + " until payday";

  return (
    <div style={{ position: "relative", padding: 24, paddingRight: 40, background: BG_PAGE, minHeight: "100vh", fontFamily: "inherit" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.2, margin: 0 }}>Payroll overview</h1>
        <Maximize2 size={16} style={{ color: TEXT_SECONDARY, cursor: "pointer" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_SECONDARY, marginRight: 4 }}>Create actions</span>
        {favouriteActionDefs.map((action) => {
          const Icon = action.icon;
          return (
            <span
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 16, background: BG_CARD, border: "0.5px solid " + BORDER, fontSize: 12, color: TEXT_PRIMARY, cursor: "pointer" }}
            >
              <Icon size={13} />
              {action.label}
            </span>
          );
        })}
        <span
          onClick={() => setDrawerOpen(true)}
          style={{ marginLeft: "auto", color: BRAND, fontSize: 13, cursor: "pointer", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}
        >
          Show all <ChevronRight size={12} />
        </span>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#FEE2E2", border: "0.5px solid #F87171", borderRadius: 8, color: "#991B1B", fontSize: 13, marginBottom: 14 }}>
          <strong>Could not load:</strong> {error}
        </div>
      )}

      <div style={{ background: BRAND_SOFT, border: "0.5px solid " + BRAND_SOFT_BORDER, borderRadius: 10, padding: "18px 22px", marginBottom: 12, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 10, color: BRAND_DARK, fontWeight: 500, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {payDateLabel ? "Next payday: " + payDateLabel : "Pay schedule"}
          </div>
          <div style={{ fontSize: 26, fontWeight: 500, color: BRAND_DARK, margin: "6px 0 14px" }}>{headline}</div>

          {readyOnNextRun.total > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.75)", borderRadius: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: readyOnNextRun.notReady.length === 0 ? "#10B981" : "#F59E0B", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {readyOnNextRun.notReady.length === 0 ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500 }}>
                  {readyOnNextRun.ready} of {readyOnNextRun.total} employees ready for this run
                </div>
                {readyOnNextRun.notReady.length > 0 && (
                  <div style={{ fontSize: 12, color: WARNING_DARK, marginTop: 1 }}>
                    {readyOnNextRun.notReady.length} need{readyOnNextRun.notReady.length === 1 ? "s" : ""} setup before payday
                  </div>
                )}
              </div>
              {readyOnNextRun.notReady.length > 0 && (
                <span
                  onClick={fixFirstUnready}
                  style={{ fontSize: 12, color: WARNING, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", flexShrink: 0 }}
                >
                  {readyOnNextRun.notReady.length === 1
                    ? "Fix " + (readyOnNextRun.notReady[0].first_name || readyOnNextRun.notReady[0].last_name || "employee")
                    : "Fix " + readyOnNextRun.notReady.length + " employees"}
                </span>
              )}
            </div>
          ) : (
            <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.75)", borderRadius: 8, marginBottom: 12, fontSize: 13, color: TEXT_SECONDARY }}>
              No active employees on payroll yet. <span onClick={() => navigate("/payroll/employees/new")} style={{ color: BRAND, cursor: "pointer", fontWeight: 500 }}>Add your first employee</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span onClick={() => navigate("/payroll/paycheques")} style={{ color: BRAND, fontSize: 13, cursor: "pointer", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                Paycheque list <ArrowRight size={12} />
              </span>
              {scheduleLabel && <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>{scheduleLabel} schedule</span>}
            </div>
            {readyOnNextRun.total > 0 && (
              <button
                onClick={handleRunPayroll}
                style={{ fontSize: 13, padding: "8px 16px", borderRadius: 6, background: BRAND, color: "white", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <ShieldCheck size={14} />
                Run payroll
              </button>
            )}
          </div>
        </div>

        <div style={{ position: "absolute", right: -10, top: -10, opacity: 0.12, pointerEvents: "none" }}>
          <Calendar size={140} color={BRAND} />
        </div>
      </div>

      {attentionItems.length > 0 && (
        <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 10, padding: "14px 18px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>Needs your attention</h3>
              <span style={{ padding: "1px 8px", background: WARNING_SOFT, color: WARNING_DARK, fontSize: 11, fontWeight: 500, borderRadius: 8 }}>
                {attentionItems.length} item{attentionItems.length === 1 ? "" : "s"}
              </span>
            </div>
            <ChevronDown size={15} style={{ color: TEXT_SECONDARY, cursor: "pointer" }} />
          </div>

          {attentionItems.map((item, idx) => {
            const Icon = ATTENTION_ICONS[item.icon] || FileText;
            const sev = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.general;
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: idx === 0 ? "none" : "0.5px solid #F3F4F6" }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: sev.bg, color: sev.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={17} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500 }}>{item.title}</div>
                  {item.meta && <div style={{ fontSize: 12, color: sev.meta }}>{item.meta}</div>}
                </div>
                <button
                  onClick={() => handleAttentionAction(item)}
                  style={{
                    fontSize: 12,
                    padding: "6px 14px",
                    borderRadius: 6,
                    background: item.action.primary ? BRAND : "white",
                    color: item.action.primary ? "white" : TEXT_PRIMARY,
                    border: item.action.primary ? "none" : "0.5px solid " + BORDER,
                    cursor: "pointer",
                    fontWeight: 500,
                    fontFamily: "inherit",
                    flexShrink: 0,
                  }}
                >
                  {item.action.label}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>Auto Payroll</h3>
            <span style={{ padding: "1px 10px", background: "#F3F4F6", color: TEXT_SECONDARY, fontSize: 11, fontWeight: 500, borderRadius: 8 }}>Off</span>
          </div>
          <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.5, marginBottom: 10 }}>
            Run your {scheduleLabel ? scheduleLabel.toLowerCase() : "scheduled"} payroll automatically when everyone is ready.
          </div>
          <span onClick={() => alert("Auto Payroll info coming soon")} style={{ color: BRAND, fontSize: 13, cursor: "pointer", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
            Learn more <ArrowRight size={12} />
          </span>
        </div>

        <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 10, padding: "14px 18px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, margin: "0 0 10px" }}>Setup resources</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: TEXT_PRIMARY, cursor: "pointer" }}>
              <Book size={14} style={{ color: BRAND }} />
              View setup guide
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: TEXT_PRIMARY, cursor: "pointer" }}>
              <ListChecks size={14} style={{ color: BRAND }} />
              Things you'll need
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: TEXT_PRIMARY, cursor: "pointer" }}>
              <Play size={14} style={{ color: BRAND }} />
              Setting up payroll <span style={{ color: TEXT_TERTIARY, fontSize: 11 }}>2 min</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: TEXT_PRIMARY, cursor: "pointer" }}>
              <Play size={14} style={{ color: BRAND }} />
              Running your first payroll <span style={{ color: TEXT_TERTIARY, fontSize: 11 }}>3 min</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: TEXT_PRIMARY, cursor: "pointer" }}>
              <CreditCard size={14} style={{ color: BRAND }} />
              Set up direct deposit
            </span>
          </div>
        </div>
      </div>

      <CreateActionsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        favourites={favourites}
        onSave={handleSaveFavourites}
      />

      <RunPayrollGuardModal
        open={guardOpen}
        onClose={() => setGuardOpen(false)}
        blockingEmployees={readyOnNextRun.notReady}
        readyCount={readyOnNextRun.ready}
        totalCount={readyOnNextRun.total}
      />
    </div>
  );
}
