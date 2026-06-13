// Pure logic for Run Payroll screen readiness, flags, and the AI narrative.
// No side effects. Falls back gracefully when backend fields are missing
// (priorPeriodHours, hoursSource, payMethodReady arrive in Hours-to-Payroll).

export const NOTE_THRESHOLD_PCT = 25;
export const REVIEW_THRESHOLD_PCT = 60;
export const MIN_ABS_HOURS = 6;

export function employeeName(emp) {
  if (!emp) return "Unknown";
  const last = (emp.last_name || "").trim();
  const first = (emp.first_name || "").trim();
  if (last && first) return last + ", " + first;
  if (emp.full_name) return emp.full_name;
  if (emp.name) return emp.name;
  return emp.email || "Unnamed";
}

export function isSetupComplete(emp) {
  if (!emp) return false;
  if (!emp.pay_type) return false;
  if (emp.pay_type === "hourly" && !parseFloat(emp.hourly_rate)) return false;
  if (emp.pay_type === "salary" && !parseFloat(emp.salary_amount)) return false;
  if (!emp.payment_method) return false;
  return true;
}

export function setupMissing(emp) {
  const missing = [];
  if (!emp) return ["personal info", "pay types", "a payment method"];
  if (!emp.first_name || !emp.last_name) missing.push("personal info");
  if (!emp.pay_type) missing.push("pay types");
  else if (emp.pay_type === "hourly" && !parseFloat(emp.hourly_rate)) missing.push("pay types");
  else if (emp.pay_type === "salary" && !parseFloat(emp.salary_amount)) missing.push("pay types");
  if (!emp.payment_method) missing.push("a payment method");
  return missing;
}

export function totalHours(line) {
  if (!line || !line.hours) return 0;
  const reg = parseFloat(line.hours.regular) || 0;
  const stat = parseFloat(line.hours.vacation) || 0;
  return reg + stat;
}

export function flagsFor(line, emp) {
  if (!line || !line.inRun) return [];
  if (!isSetupComplete(emp)) return [];

  const flags = [];
  const total = totalHours(line);
  const bonusAmt = parseFloat(line.hours && line.hours.bonus) || 0;

  if (total === 0 && bonusAmt === 0) {
    flags.push({ level: "warn", code: "no_hours", text: "No hours entered for this period" });
    return flags;
  }

  if (line.payMethod === "direct_deposit" && line.payMethodReady === false) {
    flags.push({ level: "warn", code: "dd_not_ready", text: "Direct deposit not set up, will not pay" });
  }

  const prior = parseFloat(line.priorPeriodHours);
  if (prior > 0 && total > 0) {
    const delta = total - prior;
    const pct = Math.round((delta / prior) * 100);
    const dir = pct > 0 ? "up" : "down";
    if (Math.abs(delta) >= MIN_ABS_HOURS && Math.abs(pct) >= REVIEW_THRESHOLD_PCT) {
      flags.push({
        level: "warn",
        code: "hours_variance",
        text: "Hours " + dir + " " + Math.abs(pct) + "% vs last run (" + prior + "h)",
      });
    } else if (Math.abs(delta) >= MIN_ABS_HOURS && Math.abs(pct) >= NOTE_THRESHOLD_PCT) {
      flags.push({
        level: "info",
        code: "hours_variance",
        text: "Hours " + dir + " " + Math.abs(pct) + "% vs last run (" + prior + "h)",
      });
    }
  }

  return flags;
}

export function getReadinessCounts(lines, employees) {
  const empById = {};
  for (const e of employees) empById[e.id] = e;

  let ready = 0, toReview = 0, notes = 0, needsSetup = 0;

  for (const line of lines) {
    const emp = empById[line.employee_id];
    if (!emp) continue;
    if (!isSetupComplete(emp)) {
      needsSetup++;
      continue;
    }
    if (!line.inRun) continue;
    const flags = flagsFor(line, emp);
    if (flags.some(f => f.level === "warn")) {
      toReview++;
    } else {
      ready++;
      if (flags.some(f => f.level === "info")) notes++;
    }
  }

  return { ready, toReview, notes, needsSetup };
}

export function getIssues(lines, employees) {
  const empById = {};
  for (const e of employees) empById[e.id] = e;
  const out = [];

  for (const line of lines) {
    const emp = empById[line.employee_id];
    if (!emp) continue;

    if (!isSetupComplete(emp)) {
      const missing = setupMissing(emp);
      const name = employeeName(emp);
      const first = (emp.first_name || "").trim() || name;
      out.push({
        type: "needs_setup",
        level: "warn",
        employee_id: emp.id,
        text: "Add " + missing.join(", ") + " to pay " + first + ".",
        nameLabel: name,
        linkLabel: "Finish setup",
        linkSection: missing[0] || "pay_types",
      });
      continue;
    }

    if (!line.inRun) continue;

    const flags = flagsFor(line, emp);
    for (const flag of flags) {
      if (flag.code === "no_hours") {
        out.push({
          type: "no_hours",
          level: "warn",
          employee_id: emp.id,
          text: "has no hours entered for this period.",
          nameLabel: employeeName(emp),
          linkLabel: "Add hours",
        });
      } else if (flag.code === "hours_variance") {
        out.push({
          type: flag.level === "warn" ? "variance_review" : "variance_note",
          level: flag.level,
          employee_id: emp.id,
          text: flag.text + ".",
          nameLabel: employeeName(emp),
          linkLabel: flag.level === "warn" ? "Reviewed" : "Looks right",
          sep: true,
        });
      } else if (flag.code === "dd_not_ready") {
        out.push({
          type: "dd_not_ready",
          level: "warn",
          employee_id: emp.id,
          text: flag.text + ".",
          nameLabel: employeeName(emp),
          linkLabel: "Set up direct deposit",
          sep: true,
        });
      }
    }
  }

  return out;
}

export function generateNarrative(counts, activeCount, payableCount) {
  const { toReview, needsSetup, notes } = counts;
  const parts = [];

  if (activeCount === 0 && payableCount > 0) {
    return "No employees included in this run yet. Select employees from the table below.";
  }
  if (activeCount === 0 && payableCount === 0) {
    return "No employees available to pay. Add or finish setting up your employees to run payroll.";
  }

  parts.push("This run includes " + activeCount + " employee" + (activeCount === 1 ? "" : "s") + ".");

  const issueParts = [];
  if (toReview > 0) issueParts.push(toReview + " need" + (toReview === 1 ? "s" : "") + " attention before preview");
  if (needsSetup > 0) issueParts.push(needsSetup + " can't be paid yet without setup");

  if (issueParts.length === 0 && notes === 0) {
    parts.push("Everything looks ready to preview.");
  } else if (issueParts.length > 0) {
    parts.push(issueParts.join(", and ") + ".");
  } else if (notes > 0) {
    parts.push("All payable, with " + notes + " note" + (notes === 1 ? "" : "s") + " to review.");
  }

  return parts.join(" ");
}
