import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Play, UserPlus, Settings, ChevronRight, ChevronDown, Calendar,
  AlertTriangle, AlertCircle, FileText, User, CheckCircle,
  Book, ListChecks, Activity, CreditCard,
} from "lucide-react";
import { generatePayPeriods } from "../utils/payScheduling";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("token") || "";
const authHeaders = () => ({ Authorization: "Bearer " + getToken(), "Content-Type": "application/json" });

// Design tokens (matches spec)
const C = {
  ink: "#12262B", text: "#1B2533", muted: "#66748B", faint: "#94A0B2",
  teal: "#15A08C", tealD: "#0F8474", tealInk: "#0E8A78", tealSoft: "#E3F4F0",
  line: "#E7EAF0", lineSoft: "#F1F3F7", surface: "#F4F6F8",
  amber: "#B7791F", amberSoft: "#FBF1DD",
  green: "#1F9D6B", greenSoft: "#E4F5EC",
  red: "#C5483B", redSoft: "#FBE9E7",
  blue: "#3B6CB3", blueSoft: "#E7F0FB",
};
const FONT = "Inter, system-ui, sans-serif";

// Format Tuesday, 30 June 2026
const formatPayDate = (date) => {
  if (!(date instanceof Date)) return "";
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};
// Format "16 Jun"
const formatShortDate = (date) => {
  if (!(date instanceof Date)) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};
const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Schedule frequency labels
const SCHEDULE_LABELS = {
  weekly: "Weekly", bi_weekly: "Bi-weekly", biweekly: "Bi-weekly",
  semi_monthly: "Semi-monthly", monthly: "Monthly",
};

export default function PayrollOverview() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [paySchedule, setPaySchedule] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [autoPayroll, setAutoPayroll] = useState(false);
  const [attentionItems, setAttentionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attentionCollapsed, setAttentionCollapsed] = useState(false);

  // Load data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [empRes, scheduleRes, runsRes] = await Promise.all([
          fetch(API_URL + "/api/v1/payroll/employees", { headers: authHeaders() }),
          fetch(API_URL + "/api/v1/payroll/settings", { headers: authHeaders() }).catch(() => null),
          fetch(API_URL + "/api/v1/payroll/pay-runs", { headers: authHeaders() }).catch(() => null),
        ]);

        if (empRes && empRes.ok) {
          const empData = await empRes.json();
          const empArr = Array.isArray(empData) ? empData : (empData.items || empData.data || []);
          setEmployees(empArr);
        }

        if (scheduleRes && scheduleRes.ok) {
          const settings = await scheduleRes.json();
          // Use the schedule from settings, or default to bi-weekly with anchor today
          const sched = settings.pay_schedule || settings.paySchedule || {
            frequency: "bi_weekly",
            anchorPayDate: new Date().toISOString().slice(0, 10),
            name: "Bi-weekly",
          };
          setPaySchedule(sched);
        } else {
          // Default schedule if none exists
          setPaySchedule({ frequency: "bi_weekly", anchorPayDate: new Date().toISOString().slice(0, 10), name: "Bi-weekly" });
        }

        if (runsRes && runsRes.ok) {
          const runs = await runsRes.json();
          const runArr = Array.isArray(runs) ? runs : (runs.items || runs.data || []);
          const finalized = runArr.filter(r => r.status === "approved" || r.status === "paid");
          if (finalized.length > 0) setLastRun(finalized[0]);
        }

        // Auto Payroll from localStorage (real backend deferred)
        setAutoPayroll(localStorage.getItem("novala_auto_payroll") === "true");

        // Attention items (stub data for now)
        setAttentionItems([
          { id: "fed_tax", icon: "red", title: "Pay federal taxes", desc: "Due 14 Jul 2026", action: "Pay", onClick: () => navigate("/payroll/settings") },
        ]);
      } catch (err) {
        console.error("[PayrollOverview] load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [navigate]);

  // Compute next payday
  const nextPayday = useMemo(() => {
    if (!paySchedule) return { date: null, daysUntil: null, periodStart: null, periodEnd: null };
    const periods = generatePayPeriods(paySchedule, 3);
    if (!periods || periods.length === 0) return { date: null, daysUntil: null, periodStart: null, periodEnd: null };
    const next = periods[0];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysUntil = Math.floor((next.payDate - today) / 86400000);
    return { date: next.payDate, daysUntil, periodStart: next.periodStart, periodEnd: next.periodEnd };
  }, [paySchedule]);

  // Readiness: an employee is ready if their profile_completed flag is true
  const readiness = useMemo(() => {
    const total = employees.length;
    const ready = employees.filter(e => e.profile_completed === true).length;
    const firstUnsetup = employees.find(e => !e.profile_completed);
    return { total, ready, allReady: total > 0 && ready === total, firstUnsetup };
  }, [employees]);

  // Generate attention items: add per-employee setup if any
  const allAttentionItems = useMemo(() => {
    const items = [...attentionItems];
    employees.forEach(e => {
      if (!e.profile_completed) {
        const name = (e.last_name ? e.last_name + ", " : "") + (e.first_name || "Employee");
        items.push({
          id: "setup_" + e.id,
          icon: "amber",
          title: name + " needs setup",
          desc: "Complete profile before next payday",
          action: "Fix",
          onClick: () => navigate("/payroll/employees/" + e.id),
        });
      }
    });
    return items;
  }, [attentionItems, employees, navigate]);

  const markDone = (id) => setAttentionItems(items => items.filter(i => i.id !== id));

  const toggleAutoPayroll = () => {
    const newVal = !autoPayroll;
    setAutoPayroll(newVal);
    localStorage.setItem("novala_auto_payroll", newVal ? "true" : "false");
  };

  // Headline copy
  let headline = "Loading...";
  let isOverdue = false;
  if (!loading) {
    if (nextPayday.daysUntil === null) headline = "Set up a pay schedule to see your next payday";
    else if (nextPayday.daysUntil < 0) { headline = Math.abs(nextPayday.daysUntil) + " day" + (Math.abs(nextPayday.daysUntil) === 1 ? "" : "s") + " overdue"; isOverdue = true; }
    else if (nextPayday.daysUntil === 0) headline = "Payday is today";
    else if (nextPayday.daysUntil === 1) headline = "1 day until payday";
    else headline = nextPayday.daysUntil + " days until payday";
  }
  const scheduleLabel = paySchedule ? (SCHEDULE_LABELS[paySchedule.frequency] || paySchedule.name || "") : "";

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: FONT, color: C.text }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "28px 40px 90px" }}>
        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em" }}>Payroll overview</h1>
        </div>

        {/* Create actions row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: C.muted, marginRight: 4 }}>Create actions</span>
          <ChipButton icon={<Shield size={15} />} label="Add workers comp" onClick={() => navigate("/payroll/settings")} />
          <ChipButton icon={<Play size={15} />} label="Run payroll" onClick={() => navigate("/payroll/run")} />
          <ChipButton icon={<UserPlus size={15} />} label="Add employee" onClick={() => navigate("/payroll/employees/new")} />
          <ChipButton icon={<Settings size={15} />} label="Update payroll settings" onClick={() => navigate("/payroll/settings")} />
          <span onClick={() => navigate("/payroll/settings")} style={{ marginLeft: "auto", fontSize: 13.5, fontWeight: 600, color: C.tealInk, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontFamily: FONT }}>
            Show all <ChevronRight size={14} />
          </span>
        </div>

        {/* Hero card */}
        {nextPayday.daysUntil !== null ? (
          <div style={{ background: "linear-gradient(135deg, #EAF8F4, #F1F8F6)", border: "1px solid #D5EDE6", borderRadius: 18, padding: "28px 30px", marginBottom: 22, position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.tealInk, marginBottom: 8 }}>Next payday</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 34, fontWeight: 600, color: isOverdue ? C.red : C.ink, letterSpacing: "-0.02em", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{headline}</div>
                {nextPayday.date && <div style={{ fontSize: 14, color: C.muted, marginTop: 6 }}><b style={{ color: C.ink, fontWeight: 600 }}>{formatPayDate(nextPayday.date)}</b> &middot; {scheduleLabel} schedule</div>}
                {nextPayday.periodStart && nextPayday.periodEnd && <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Pay period <b style={{ color: C.ink, fontWeight: 600 }}>{formatShortDate(nextPayday.periodStart)}</b> to <b style={{ color: C.ink, fontWeight: 600 }}>{formatShortDate(nextPayday.periodEnd)}</b></div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                <button onClick={() => navigate("/payroll/run")} style={{ background: C.teal, color: "#fff", padding: "12px 22px", border: "none", borderRadius: 11, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 9, fontFamily: FONT, boxShadow: "0 2px 8px rgba(21,160,140,0.28)" }}>
                  <Play size={17} /> Run payroll
                </button>
                <button onClick={() => navigate("/payroll/paycheques")} style={{ background: "none", border: "none", fontSize: 13.5, fontWeight: 600, color: C.tealInk, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT }}>
                  Paycheque list <ChevronRight size={14} />
                </button>
              </div>
            </div>
            {/* Readiness strip */}
            <div style={{ display: "flex", alignItems: "center", gap: 13, background: "#fff", border: "1px solid #D5EDE6", borderRadius: 13, padding: "14px 16px", marginTop: 22 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", flex: "0 0 38px", background: readiness.allReady ? C.greenSoft : C.amberSoft, color: readiness.allReady ? C.green : C.amber }}>
                {readiness.allReady ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{readiness.ready} of {readiness.total} employee{readiness.total === 1 ? "" : "s"} ready for this run</div>
                {!readiness.allReady && readiness.firstUnsetup && (
                  <div style={{ fontSize: 13, color: C.muted }}>{readiness.total - readiness.ready} need{readiness.total - readiness.ready === 1 ? "s" : ""} setup before payday</div>
                )}
              </div>
              {!readiness.allReady && readiness.firstUnsetup && (
                <button onClick={() => navigate("/payroll/employees/" + readiness.firstUnsetup.id)} style={{ background: "none", border: "none", fontSize: 13.5, fontWeight: 600, color: C.tealInk, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT }}>
                  Fix {(readiness.firstUnsetup.first_name || "employee").split(" ")[0]} <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        ) : (
          // No-schedule state
          <div style={{ background: "linear-gradient(135deg, #EAF8F4, #F1F8F6)", border: "1px solid #D5EDE6", borderRadius: 18, padding: "28px 30px", marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.tealInk, marginBottom: 8 }}>Pay schedule</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1.2 }}>Set up a pay schedule to see your next payday</div>
                <div style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>Choose how often you pay, and Novala will count down to each payday.</div>
              </div>
              <button onClick={() => navigate("/payroll/settings")} style={{ background: C.teal, color: "#fff", padding: "12px 22px", border: "none", borderRadius: 11, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: FONT, boxShadow: "0 2px 8px rgba(21,160,140,0.28)" }}>
                Set up pay schedule
              </button>
            </div>
          </div>
        )}

        {/* Two-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 22, alignItems: "start" }}>
          {/* LEFT: Attention */}
          <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 16, boxShadow: "0 1px 2px rgba(16,26,43,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 22px", borderBottom: "1px solid " + C.lineSoft }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>Needs your attention</h2>
              <span style={{ fontSize: 11.5, fontWeight: 700, background: allAttentionItems.length > 0 ? C.amberSoft : C.greenSoft, color: allAttentionItems.length > 0 ? C.amber : C.green, borderRadius: 20, padding: "2px 9px" }}>
                {allAttentionItems.length} {allAttentionItems.length === 1 ? "item" : "items"}
              </span>
              <span onClick={() => setAttentionCollapsed(c => !c)} style={{ marginLeft: "auto", cursor: "pointer", color: C.muted, display: "inline-flex", alignItems: "center", transform: attentionCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.18s" }}>
                <ChevronDown size={18} />
              </span>
            </div>
            {!attentionCollapsed && (allAttentionItems.length === 0 ? (
              <div style={{ padding: "30px 22px", textAlign: "center", color: C.muted, fontSize: 13.5 }}>All clear. Nothing needs your attention right now.</div>
            ) : (
              allAttentionItems.map((item, idx) => (
                <AttentionItem key={item.id} item={item} isLast={idx === allAttentionItems.length - 1} onMarkDone={() => markDone(item.id)} />
              ))
            ))}
          </div>

          {/* RIGHT: sidebar */}
          <div>
            {/* Auto Payroll */}
            <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 16, padding: 20, boxShadow: "0 1px 2px rgba(16,26,43,0.04)", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Auto Payroll</h3>
                <div onClick={toggleAutoPayroll} style={{ width: 42, height: 24, borderRadius: 20, background: autoPayroll ? C.teal : C.line, position: "relative", cursor: "pointer", transition: "0.18s", flex: "0 0 42px" }}>
                  <div style={{ position: "absolute", top: 2, left: autoPayroll ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "0.18s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
                </div>
              </div>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 7 }}>Run your payroll automatically when everyone is ready.</p>
              <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: C.faint }}>{autoPayroll ? "On" : "Off"}</div>
            </div>

            {/* Last pay run */}
            <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 16, padding: 20, boxShadow: "0 1px 2px rgba(16,26,43,0.04)", marginBottom: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Last pay run</h3>
              {lastRun ? (
                <>
                  <div style={{ marginTop: 12 }}>
                    <RunLine k="Pay date" v={formatShortDate(new Date(lastRun.pay_date))} />
                    <RunLine k="Employees paid" v={lastRun.employee_count || 0} />
                    <RunLine k="Total cost" v={money(lastRun.total_gross)} />
                    <RunLine k="Net to employees" v={money(lastRun.total_net)} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button onClick={() => navigate("/payroll/run/" + lastRun.id + "/done")} style={{ background: "none", border: "none", fontSize: 13.5, fontWeight: 600, color: C.tealInk, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT }}>
                      View pay run <ChevronRight size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ marginTop: 12, fontSize: 13, color: C.muted }}>No pay runs yet. Run your first payroll to see it here.</div>
              )}
            </div>

            {/* Setup resources */}
            <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 16, padding: 20, boxShadow: "0 1px 2px rgba(16,26,43,0.04)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Setup resources</h3>
              <div style={{ marginTop: 8 }}>
                <ResourceLink icon={<Book size={20} />} label="View setup guide" onClick={() => navigate("/payroll/settings")} />
                <ResourceLink icon={<ListChecks size={20} />} label="Things you will need" onClick={() => navigate("/payroll/settings")} />
                <ResourceLink icon={<Activity size={20} />} label="Setting up payroll" mins="2 min" onClick={() => navigate("/payroll/settings")} />
                <ResourceLink icon={<Activity size={20} />} label="Running your first payroll" mins="3 min" onClick={() => navigate("/payroll/run")} />
                <ResourceLink icon={<CreditCard size={20} />} label="Set up direct deposit" onClick={() => navigate("/payroll/settings")} isLast />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChipButton({ icon, label, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid " + C.line, borderRadius: 10, padding: "8px 14px", fontSize: 13.5, fontWeight: 500, background: hover ? C.lineSoft : "#fff", cursor: "pointer", color: C.text, fontFamily: FONT }}>
      <span style={{ color: C.tealInk, display: "inline-flex" }}>{icon}</span>{label}
    </button>
  );
}

function AttentionItem({ item, isLast, onMarkDone }) {
  const iconColors = {
    red: { bg: C.redSoft, fg: C.red, Icon: AlertCircle },
    amber: { bg: C.amberSoft, fg: C.amber, Icon: User },
    blue: { bg: C.blueSoft, fg: C.blue, Icon: AlertTriangle },
    green: { bg: C.greenSoft, fg: C.green, Icon: FileText },
  };
  const ic = iconColors[item.icon] || iconColors.amber;
  const Icon = ic.Icon;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 22px", borderBottom: isLast ? "none" : "1px solid " + C.lineSoft }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", flex: "0 0 38px", background: ic.bg, color: ic.fg }}>
        <Icon size={19} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{item.title}</div>
        <div style={{ fontSize: 12.5, color: C.muted }}>{item.desc}</div>
      </div>
      <button onClick={item.onClick || onMarkDone} style={{ background: "#fff", color: C.ink, border: "1px solid " + C.line, borderRadius: 9, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>
        {item.action}
      </button>
    </div>
  );
}

function RunLine({ k, v }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid " + C.lineSoft, fontSize: 13 }}>
      <span style={{ color: C.muted }}>{k}</span>
      <span style={{ color: C.ink, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{v}</span>
    </div>
  );
}

function ResourceLink({ icon, label, mins, onClick, isLast }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", fontSize: 13.5, color: C.tealInk, fontWeight: 500, cursor: "pointer", borderBottom: isLast ? "none" : "1px solid " + C.lineSoft }}>
      <span style={{ color: C.faint, display: "inline-flex" }}>{icon}</span>
      {label}
      {mins && <span style={{ marginLeft: "auto", fontSize: 12, color: C.faint, fontWeight: 500 }}>{mins}</span>}
    </div>
  );
}
