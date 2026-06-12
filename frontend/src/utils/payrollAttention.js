// Composes the unified "Needs your attention" feed for Payroll Overview.
// Sorts items by urgency:
//   1. Overdue or due-soon tax obligations
//   2. Employees who are not ready for the next pay run
//   3. General setup tasks
//   4. Tax obligations due more than 7 days out
import { getReadiness } from "./payrollReadiness";

export const SEVERITY = {
  OVERDUE: "overdue",
  SOON: "soon",
  GENERAL: "general",
};

const daysBetween = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
};

const formatDueMeta = (dueDate) => {
  const d = daysBetween(dueDate);
  if (d === null) return "";
  const dateObj = new Date(dueDate);
  const dateLabel = dateObj.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  if (d < 0) return Math.abs(d) + " day" + (Math.abs(d) === 1 ? "" : "s") + " overdue, " + dateLabel;
  if (d === 0) return "Due today, " + dateLabel;
  if (d === 1) return "Due tomorrow, " + dateLabel;
  return "Due in " + d + " days, " + dateLabel;
};

const dueSeverity = (dueDate) => {
  const d = daysBetween(dueDate);
  if (d === null) return SEVERITY.GENERAL;
  if (d <= 7) return SEVERITY.OVERDUE;
  return SEVERITY.SOON;
};

export const buildAttentionFeed = ({ taxDues = [], employees = [], setupTasks = [], completedTaskIds = new Set() }) => {
  const items = [];

  taxDues.forEach((t) => {
    const sev = dueSeverity(t.due);
    items.push({
      id: t.id,
      type: "tax_due",
      severity: sev,
      icon: "alert-circle",
      title: t.label,
      meta: formatDueMeta(t.due),
      action: { label: t.action_label || "Pay", id: "pay_tax", primary: sev === SEVERITY.OVERDUE },
      _sortKey: sev === SEVERITY.OVERDUE ? 1 : 4,
      _sortDate: new Date(t.due).getTime() || 0,
    });
  });

  employees.forEach((emp) => {
    const readiness = emp._readiness || getReadiness(emp);
    if (readiness.ready) return;
    if ((emp.status || "active") !== "active") return;
    const missingLabels = readiness.missing.map((m) => m.label).join(", ");
    const first = readiness.missing[0];
    const displayName = [emp.last_name, emp.first_name].filter(Boolean).join(", ") || emp.email || "Unnamed";
    items.push({
      id: "emp_" + emp.id,
      type: "employee_setup",
      severity: SEVERITY.SOON,
      icon: "user",
      title: displayName + " needs setup",
      meta: "Missing " + missingLabels + ", before next run",
      action: { label: "Fix", id: "fix_employee", primary: false, employeeId: emp.id, section: first ? first.section : "personal" },
      _sortKey: 2,
      _sortDate: -readiness.missing.length,
    });
  });

  setupTasks.forEach((t, i) => {
    if (completedTaskIds.has(t.id)) return;
    items.push({
      id: t.id,
      type: "setup_task",
      severity: SEVERITY.GENERAL,
      icon: t.icon || "file-text",
      title: t.label,
      meta: t.description || "",
      action: { label: t.action_label || "Mark done", id: "complete_task", primary: false, taskId: t.id },
      _sortKey: 3,
      _sortDate: i,
    });
  });

  items.sort((a, b) => {
    if (a._sortKey !== b._sortKey) return a._sortKey - b._sortKey;
    return (a._sortDate || 0) - (b._sortDate || 0);
  });

  return items.map((it) => {
    const copy = { ...it };
    delete copy._sortKey;
    delete copy._sortDate;
    return copy;
  });
};

// MVP stubs. Replace when backend endpoints exist.
export const STUB_TAX_DUES = [
  { id: "fed_tax_jun15", label: "Pay federal taxes", due: "2026-06-15", action_label: "Pay" },
];

export const STUB_SETUP_TASKS = [
  { id: "verify_deposit", label: "Watch your bank account for a small deposit", description: "Direct deposit verification", icon: "building-bank", action_label: "Mark done" },
  { id: "sign_tax_forms", label: "Sign some tax forms", description: "CRA registration", icon: "file-text", action_label: "Sign" },
];
