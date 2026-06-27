import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Shield, Play, UserPlus, Settings, ChevronRight, ChevronDown, Calendar,
  AlertTriangle, AlertCircle, FileText, User, CheckCircle,
  Book, ListChecks, Activity, CreditCard, Star, GripVertical, Search, X, Landmark,
} from "lucide-react";
import { generatePayPeriods } from "../utils/payScheduling";
import PayrollGuide from "./PayrollGuide";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("token") || "";
const authHeaders = () => ({ Authorization: "Bearer " + getToken(), "Content-Type": "application/json" });

const ACTIONS_CATALOG = [
  { id: "workers_comp", label: "Add workers comp", route: "/payroll/settings" },
  { id: "run_payroll", label: "Run payroll", route: "/payroll/run" },
  { id: "add_employee", label: "Add employee", route: "/payroll/employees/add" },
  { id: "update_settings", label: "Update payroll settings", route: "/payroll/settings" },
  { id: "edit_items", label: "Edit payroll items", route: "/payroll/settings" },
  { id: "work_location", label: "Update work location", route: "/payroll/settings" },
  { id: "accounting_prefs", label: "Update accounting preferences", route: "/payroll/settings" },
  { id: "paycheque_list", label: "View paycheque list", route: "/payroll/paycheques" },
  { id: "off_cycle", label: "Run off-cycle payroll", route: "/payroll/run" },
  { id: "direct_deposit", label: "Set up direct deposit", route: "/payroll/settings" },
  { id: "pay_schedule", label: "Manage pay schedule", route: "/payroll/settings" },
];
const DEFAULT_FAVOURITES = ["workers_comp", "run_payroll", "add_employee", "update_settings"];
const MAX_FAVOURITES = 10;
const FAVOURITES_STORAGE = "novala_create_action_favourites";

const loadFavourites = () => {
  try {
    const stored = localStorage.getItem(FAVOURITES_STORAGE);
    if (stored) { const parsed = JSON.parse(stored); if (Array.isArray(parsed) && parsed.length > 0) return parsed; }
  } catch (e) {}
  return DEFAULT_FAVOURITES;
};

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

const ACTION_ICONS = {
  workers_comp: Shield, run_payroll: Play, add_employee: UserPlus, update_settings: Settings,
  edit_items: FileText, work_location: Calendar, accounting_prefs: Activity, paycheque_list: ListChecks,
  off_cycle: Play, direct_deposit: CreditCard, pay_schedule: Calendar,
};

const formatPayDate = (date) => date instanceof Date ? date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";
const formatShortDate = (date) => date instanceof Date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SCHEDULE_LABELS = { weekly: "Weekly", bi_weekly: "Bi-weekly", biweekly: "Bi-weekly", semi_monthly: "Semi-monthly", monthly: "Monthly" };

export default function PayrollOverview() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [paySchedule, setPaySchedule] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [autoPayroll, setAutoPayroll] = useState(false);
  const [attentionItems, setAttentionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attentionCollapsed, setAttentionCollapsed] = useState(false);
  const [favourites, setFavourites] = useState(loadFavourites);
  const [showActions, setShowActions] = useState(false);
  const [bankState] = useState("none");
  const [showBankConnect, setShowBankConnect] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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
          setEmployees(Array.isArray(empData) ? empData : (empData.items || empData.data || []));
        }
        if (scheduleRes && scheduleRes.ok) {
          const settings = await scheduleRes.json();
          setPaySchedule(settings.pay_schedule || settings.paySchedule || { frequency: "bi_weekly", anchorPayDate: new Date().toISOString().slice(0, 10), name: "Bi-weekly" });
        } else {
          setPaySchedule({ frequency: "bi_weekly", anchorPayDate: new Date().toISOString().slice(0, 10), name: "Bi-weekly" });
        }
        if (runsRes && runsRes.ok) {
          const runs = await runsRes.json();
          const runArr = Array.isArray(runs) ? runs : (runs.items || runs.data || []);
          const finalized = runArr.filter(r => r.status === "approved" || r.status === "paid");
          if (finalized.length > 0) setLastRun(finalized[0]);
        }
        setAutoPayroll(localStorage.getItem("novala_auto_payroll") === "true");
        setAttentionItems([{ id: "fed_tax", icon: "red", title: "Pay federal taxes", desc: "Due 14 Jul 2026", action: "Pay", onClick: () => navigate("/payroll/settings") }]);
      } catch (err) { console.error("[PayrollOverview] load error:", err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [navigate]);

  const nextPayday = useMemo(() => {
    if (!paySchedule) return { date: null, daysUntil: null };
    const periods = generatePayPeriods(paySchedule, 3);
    if (!periods || periods.length === 0) return { date: null, daysUntil: null };
    const next = periods[0];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return { date: next.payDate, daysUntil: Math.floor((next.payDate - today) / 86400000), periodStart: next.periodStart, periodEnd: next.periodEnd };
  }, [paySchedule]);

  const readiness = useMemo(() => {
    const total = employees.length;
    const ready = employees.filter(e => e.profile_completed === true).length;
    return { total, ready, allReady: total > 0 && ready === total, firstUnsetup: employees.find(e => !e.profile_completed) };
  }, [employees]);

  const allAttentionItems = useMemo(() => {
    const items = [...attentionItems];
    employees.forEach(e => {
      if (!e.profile_completed) {
        const name = (e.last_name ? e.last_name + ", " : "") + (e.first_name || "Employee");
        items.push({ id: "setup_" + e.id, icon: "amber", title: name + " needs setup", desc: "Complete profile before next payday", action: "Fix", onClick: () => navigate("/payroll/employees/" + e.id) });
      }
    });
    return items;
  }, [attentionItems, employees, navigate]);

  const markDone = (id) => setAttentionItems(items => items.filter(i => i.id !== id));
  const toggleAutoPayroll = () => { const v = !autoPayroll; setAutoPayroll(v); localStorage.setItem("novala_auto_payroll", v ? "true" : "false"); };

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
      <div style={{ maxWidth: "100%", margin: 0, padding: "28px 32px 90px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em" }}>Payroll overview</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: C.muted, marginRight: 4 }}>Create actions</span>
          {favourites.slice(0, 5).map(favId => {
            const action = ACTIONS_CATALOG.find(a => a.id === favId);
            if (!action) return null;
            const Icon = ACTION_ICONS[favId] || Settings;
            return <ChipButton key={favId} icon={<Icon size={15} />} label={action.label} onClick={() => navigate(action.route)} />;
          })}
          <span onClick={() => setShowActions(true)} style={{ marginLeft: "auto", fontSize: 13.5, fontWeight: 600, color: C.tealInk, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontFamily: FONT }}>
            Show all <ChevronRight size={14} />
          </span>
        </div>

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
            <div style={{ display: "flex", alignItems: "center", gap: 13, background: "#fff", border: "1px solid #D5EDE6", borderRadius: 13, padding: "14px 16px", marginTop: 22 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", flex: "0 0 38px", background: readiness.allReady ? C.greenSoft : C.amberSoft, color: readiness.allReady ? C.green : C.amber }}>
                {readiness.allReady ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{readiness.ready} of {readiness.total} employee{readiness.total === 1 ? "" : "s"} ready for this run</div>
                {!readiness.allReady && readiness.firstUnsetup && <div style={{ fontSize: 13, color: C.muted }}>{readiness.total - readiness.ready} need{readiness.total - readiness.ready === 1 ? "s" : ""} setup before payday</div>}
              </div>
              {!readiness.allReady && readiness.firstUnsetup && (
                <button onClick={() => navigate("/payroll/employees/" + readiness.firstUnsetup.id)} style={{ background: "none", border: "none", fontSize: 13.5, fontWeight: 600, color: C.tealInk, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT }}>
                  Fix {(readiness.firstUnsetup.first_name || "employee").split(" ")[0]} <ChevronRight size={14} />
                </button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 13, background: "#fff", border: "1px solid #D5EDE6", borderRadius: 13, padding: "14px 16px", marginTop: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", flex: "0 0 38px", background: bankState === "ok" ? C.greenSoft : bankState === "pend" ? C.amberSoft : "#EEF1F5", color: bankState === "ok" ? C.green : bankState === "pend" ? C.amber : C.muted }}>
                <Landmark size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, display: "flex", alignItems: "center", gap: 8 }}>
                  {bankState === "ok" ? "Bank account connected" : bankState === "pend" ? "Verifying your bank account" : "Connect a bank account to pay by direct deposit"}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: bankState === "ok" ? C.greenSoft : "#EEF1F5", color: bankState === "ok" ? C.green : C.muted }}>
                    {bankState === "ok" ? "Direct deposit on" : bankState === "pend" ? "Direct deposit pending" : "Direct deposit off"}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: C.muted }}>
                  {bankState === "ok" ? "Employees can be paid by direct deposit." : bankState === "pend" ? "Watch for a small deposit, then confirm the amount to finish setup. You can still pay by cheque meanwhile." : "Until a bank is connected and verified, pay employees by cheque."}
                </div>
              </div>
              <button onClick={() => setShowBankConnect(true)} style={{ background: "#12262B", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 2px 8px rgba(18,38,43,0.22)" }}>
                <Landmark size={14} /> {bankState === "ok" ? "Manage" : bankState === "pend" ? "Confirm" : "Connect bank"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: "linear-gradient(135deg, #EAF8F4, #F1F8F6)", border: "1px solid #D5EDE6", borderRadius: 18, padding: "28px 30px", marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.tealInk, marginBottom: 8 }}>Pay schedule</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1.2 }}>Set up a pay schedule to see your next payday</div>
                <div style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>Choose how often you pay, and Novala will count down to each payday.</div>
              </div>
              <button onClick={() => navigate("/payroll/settings")} style={{ background: C.teal, color: "#fff", padding: "12px 22px", border: "none", borderRadius: 11, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: FONT, boxShadow: "0 2px 8px rgba(21,160,140,0.28)" }}>Set up pay schedule</button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 22, alignItems: "start" }}>
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

          <div>
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

            <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 16, padding: 20, boxShadow: "0 1px 2px rgba(16,26,43,0.04)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Setup resources</h3>
              <div style={{ marginTop: 8 }}>
                <ResourceLink icon={<Book size={20} />} label="View setup guide" onClick={() => setShowGuide(true)} />
                <ResourceLink icon={<ListChecks size={20} />} label="Things you will need" onClick={() => navigate("/payroll/settings")} />
                <ResourceLink icon={<Activity size={20} />} label="Setting up payroll" mins="2 min" onClick={() => navigate("/payroll/settings")} />
                <ResourceLink icon={<Activity size={20} />} label="Running your first payroll" mins="3 min" onClick={() => navigate("/payroll/run")} />
                <ResourceLink icon={<CreditCard size={20} />} label="Set up direct deposit" onClick={() => setShowBankConnect(true)} isLast />
              </div>
            </div>
          </div>
        </div>

        {showActions && <CreateActionsPanel initialFavs={favourites} onSave={(newFavs) => { setFavourites(newFavs); localStorage.setItem(FAVOURITES_STORAGE, JSON.stringify(newFavs)); setShowActions(false); }} onClose={() => setShowActions(false)} />}
        {showBankConnect && <BankConnectPanel onClose={() => setShowBankConnect(false)} />}
        {showGuide && <PayrollGuideSheet onClose={() => setShowGuide(false)} />}
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
      <div style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", flex: "0 0 38px", background: ic.bg, color: ic.fg }}><Icon size={19} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{item.title}</div>
        <div style={{ fontSize: 12.5, color: C.muted }}>{item.desc}</div>
      </div>
      <button onClick={item.onClick || onMarkDone} style={{ background: "#fff", color: C.ink, border: "1px solid " + C.line, borderRadius: 9, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>{item.action}</button>
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
      <span style={{ color: C.faint, display: "inline-flex" }}>{icon}</span>{label}
      {mins && <span style={{ marginLeft: "auto", fontSize: 12, color: C.faint, fontWeight: 500 }}>{mins}</span>}
    </div>
  );
}

function CreateActionsPanel({ initialFavs, onSave, onClose }) {
  const [favs, setFavs] = useState(initialFavs);
  const [query, setQuery] = useState("");
  const [dragId, setDragId] = useState(null);
  const toggleFav = (id) => {
    if (favs.includes(id)) setFavs(favs.filter(f => f !== id));
    else { if (favs.length >= MAX_FAVOURITES) return; setFavs([...favs, id]); }
  };
  const reorder = (fromId, toId) => {
    if (fromId === toId) return;
    const newFavs = [...favs];
    const fromIdx = newFavs.indexOf(fromId), toIdx = newFavs.indexOf(toId);
    newFavs.splice(fromIdx, 1); newFavs.splice(toIdx, 0, fromId);
    setFavs(newFavs);
  };
  const filtered = ACTIONS_CATALOG.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));
  const favActions = favs.map(id => ACTIONS_CATALOG.find(a => a.id === id)).filter(Boolean);
  const atMax = favs.length >= MAX_FAVOURITES;
  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(16,26,43,0.42)", zIndex: 1000 }} />
      <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", maxHeight: "100vh", width: "min(440px, 96vw)", background: "#fff", boxShadow: "-12px 0 40px rgba(16,26,43,0.18)", display: "flex", flexDirection: "column", zIndex: 1001, fontFamily: FONT }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid " + C.line }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: C.ink }}>Create actions</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4, display: "inline-flex" }}><X size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0, maxHeight: "calc(100vh - 140px)", padding: "18px 22px 8px", WebkitOverflowScrolling: "touch" }}>
          <div style={{ position: "relative", marginBottom: 14 }}>
            <Search size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all create actions" style={{ width: "100%", border: "1px solid " + C.line, borderRadius: 11, padding: "11px 38px 11px 40px", fontFamily: FONT, fontSize: 14, color: C.ink, outline: "none" }} />
            {query && <button onClick={() => setQuery("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.faint, cursor: "pointer", padding: 4 }}><X size={14} /></button>}
          </div>
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, marginBottom: 8 }}>Choose your favourites. These appear on your Create actions row. If you do not customise, your top actions update as Novala learns what you use.</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 14 }}>Select up to {MAX_FAVOURITES} <span style={{ color: C.faint, fontWeight: 500 }}>({favs.length} selected)</span></div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.faint, margin: "18px 0 6px" }}>Favourites</div>
          {favActions.length === 0 ? <div style={{ fontSize: 13, color: C.muted, padding: "14px 8px" }}>No favourites yet. Star actions below to add them.</div>
          : favActions.map(a => (
            <div key={a.id} draggable onDragStart={() => setDragId(a.id)} onDragEnd={() => setDragId(null)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragId) reorder(dragId, a.id); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 8px", borderRadius: 10 }}>
              <span style={{ color: C.faint, cursor: "grab", display: "grid", placeItems: "center" }}><GripVertical size={14} /></span>
              <button onClick={() => toggleFav(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.teal, padding: 0, display: "inline-flex" }}><Star size={20} fill="currentColor" /></button>
              <span style={{ flex: 1, fontSize: 14, color: C.ink, fontWeight: 500 }}>{a.label}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.faint, margin: "18px 0 6px" }}>Payroll</div>
          {filtered.length === 0 ? <div style={{ fontSize: 13, color: C.muted, padding: "14px 8px" }}>No actions match your search.</div>
          : filtered.map(a => {
            const isFav = favs.includes(a.id);
            const disabled = !isFav && atMax;
            return (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 8px", borderRadius: 10 }}>
                <button onClick={() => !disabled && toggleFav(a.id)} disabled={disabled} style={{ background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", color: isFav ? C.teal : C.faint, padding: 0, display: "inline-flex", opacity: disabled ? 0.35 : 1 }}><Star size={20} fill={isFav ? "currentColor" : "none"} /></button>
                <span style={{ flex: 1, fontSize: 14, color: C.ink, fontWeight: 500 }}>{a.label}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderTop: "1px solid " + C.line }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontWeight: 600, padding: "8px 4px", cursor: "pointer", fontFamily: FONT, fontSize: 14 }}>Cancel</button>
          <button onClick={() => onSave(favs)} style={{ background: C.teal, color: "#fff", border: "none", borderRadius: 11, padding: "10px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: FONT, boxShadow: "0 2px 8px rgba(21,160,140,0.28)" }}>Save</button>
        </div>
      </div>
    </>,
    document.body
  );
}

function BankConnectPanel({ onClose }) {
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState("CA");
  const [bankName, setBankName] = useState("");
  const [acctName, setAcctName] = useState("");
  const [transit, setTransit] = useState("");
  const [inst, setInst] = useState("");
  const [routing, setRouting] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [bsb, setBsb] = useState("");
  const [iban, setIban] = useState("");
  const [acct, setAcct] = useState("");

  const next = () => {
    if (step === 1) {
      if (!bankName.trim() || !acctName.trim()) { alert("Please fill in your bank and account holder name."); return; }
      setStep(2);
    } else {
      onClose();
    }
  };
  const back = () => { if (step === 1) onClose(); else setStep(step - 1); };

  const inputStyle = { width: "100%", border: "1px solid " + C.line, borderRadius: 11, padding: "12px 14px", fontFamily: FONT, fontSize: 14, color: C.ink, outline: "none" };
  const labelStyle = { fontSize: 12.5, fontWeight: 600, color: C.ink, marginBottom: 6, display: "block" };

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(16,26,43,0.42)", zIndex: 1000 }} />
      <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", maxHeight: "100vh", width: "min(440px, 96vw)", background: "#fff", boxShadow: "-12px 0 40px rgba(16,26,43,0.18)", display: "flex", flexDirection: "column", zIndex: 1001, fontFamily: FONT }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid " + C.line }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: C.ink }}>{step === 1 ? "Connect your bank" : "Verify your account"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4, display: "inline-flex" }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0, maxHeight: "calc(100vh - 140px)", padding: "18px 22px 8px", WebkitOverflowScrolling: "touch" }}>
          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <StepDot n={1} active={step === 1} done={step > 1} />
            <div style={{ flex: 1, height: 2, background: step > 1 ? C.green : C.line }} />
            <StepDot n={2} active={step === 2} done={false} />
          </div>

          {step === 1 && (
            <>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 6 }}>Your bank details</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>Enter the business chequing account payroll will draw from. We use bank-level encryption to keep this secure.</div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Country</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle}>
                  <option value="CA">Canada</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Bank name</label>
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="For example, Royal Bank of Canada" style={inputStyle} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Account holder name</label>
                <input value={acctName} onChange={(e) => setAcctName(e.target.value)} placeholder="Your business name" style={inputStyle} />
              </div>

              {country === "CA" && (
                <>
                  <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}><label style={labelStyle}>Transit number</label><input value={transit} onChange={(e) => setTransit(e.target.value)} placeholder="00000" maxLength={5} style={inputStyle} /></div>
                    <div style={{ flex: 1 }}><label style={labelStyle}>Institution number</label><input value={inst} onChange={(e) => setInst(e.target.value)} placeholder="000" maxLength={3} style={inputStyle} /></div>
                  </div>
                  <div style={{ marginBottom: 14 }}><label style={labelStyle}>Account number</label><input value={acct} onChange={(e) => setAcct(e.target.value)} placeholder="0000000" type="password" style={inputStyle} /></div>
                </>
              )}
              {country === "US" && (
                <>
                  <div style={{ marginBottom: 14 }}><label style={labelStyle}>Routing number (9 digits)</label><input value={routing} onChange={(e) => setRouting(e.target.value)} placeholder="000000000" maxLength={9} style={inputStyle} /></div>
                  <div style={{ marginBottom: 14 }}><label style={labelStyle}>Account number</label><input value={acct} onChange={(e) => setAcct(e.target.value)} placeholder="0000000" type="password" style={inputStyle} /></div>
                </>
              )}
              {country === "GB" && (
                <>
                  <div style={{ marginBottom: 14 }}><label style={labelStyle}>Sort code</label><input value={sortCode} onChange={(e) => setSortCode(e.target.value)} placeholder="00-00-00" maxLength={8} style={inputStyle} /></div>
                  <div style={{ marginBottom: 14 }}><label style={labelStyle}>Account number (8 digits)</label><input value={acct} onChange={(e) => setAcct(e.target.value)} placeholder="00000000" maxLength={8} type="password" style={inputStyle} /></div>
                </>
              )}
              {country === "AU" && (
                <>
                  <div style={{ marginBottom: 14 }}><label style={labelStyle}>BSB number</label><input value={bsb} onChange={(e) => setBsb(e.target.value)} placeholder="000-000" maxLength={7} style={inputStyle} /></div>
                  <div style={{ marginBottom: 14 }}><label style={labelStyle}>Account number</label><input value={acct} onChange={(e) => setAcct(e.target.value)} placeholder="00000000" type="password" style={inputStyle} /></div>
                </>
              )}
              {country === "other" && (
                <>
                  <div style={{ marginBottom: 14 }}><label style={labelStyle}>IBAN or account identifier</label><input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="Enter your account identifier" style={inputStyle} /></div>
                </>
              )}

              <div style={{ background: C.tealSoft, borderRadius: 10, padding: "12px 14px", fontSize: 12.5, color: C.tealInk, display: "flex", alignItems: "flex-start", gap: 10, marginTop: 8 }}>
                <span style={{ flexShrink: 0, marginTop: 2 }}>🔒</span>
                <span>Your information is encrypted and never shared. Used only to pay your employees.</span>
              </div>
            </>
          )}

          {step === 2 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.greenSoft, color: C.green, display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                <CheckCircle size={32} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 8 }}>Almost there</div>
              <div style={{ fontSize: 13.5, color: C.muted, marginBottom: 20, maxWidth: 340, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>We will deposit a small amount (less than $1.00) into your account within 1 to 2 business days. Come back and confirm the amount to finish setup.</div>
              <div style={{ background: C.amberSoft, borderRadius: 10, padding: 14, fontSize: 12.5, color: C.amber, textAlign: "left", display: "flex", alignItems: "flex-start", gap: 10 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Until verification is complete, pay employees by cheque.</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderTop: "1px solid " + C.line }}>
          <button onClick={back} style={{ background: "none", border: "none", color: C.muted, fontWeight: 600, padding: "8px 4px", cursor: "pointer", fontFamily: FONT, fontSize: 14 }}>{step === 1 ? "Cancel" : "Back"}</button>
          <button onClick={next} style={{ background: C.teal, color: "#fff", border: "none", borderRadius: 11, padding: "10px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: FONT, boxShadow: "0 2px 8px rgba(21,160,140,0.28)" }}>{step === 2 ? "Done" : "Continue"}</button>
        </div>
      </div>
    </>,
    document.body
  );
}

function StepDot({ n, active, done }) {
  const bg = done ? C.green : active ? C.teal : C.line;
  const fg = (done || active) ? "#fff" : C.muted;
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600, flex: "0 0 28px", background: bg, color: fg, transition: "0.18s" }}>
      {done ? <CheckCircle size={14} /> : n}
    </div>
  );
}

function PayrollGuideSheet({ onClose }) {
  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(16,26,43,0.25)", zIndex: 1000, animation: "novalaFadeIn 0.22s ease-out" }} />
      <div style={{ position: "fixed", bottom: 20, right: 20, height: "85vh", width: "min(440px, calc(100vw - 40px))", background: C.surface, boxShadow: "0 -12px 40px rgba(16,26,43,0.28), 0 6px 20px rgba(16,26,43,0.18)", borderRadius: 18, zIndex: 1001, display: "flex", flexDirection: "column", animation: "novalaSlideUpRight 0.3s ease-out", fontFamily: FONT, overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, " + C.teal + ", " + C.tealD + ")", flex: "0 0 auto", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "18px 18px 0 0" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Book size={16} /> Payroll guide
          </div>
          <button onClick={onClose} title="Close" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#fff", display: "grid", placeItems: "center" }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, WebkitOverflowScrolling: "touch" }}>
          <PayrollGuide embeddedInPanel onClose={onClose} />
        </div>
      </div>
      <style>{`
        @keyframes novalaFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes novalaSlideUpRight { from { transform: translateY(calc(100% + 30px)); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </>,
    document.body
  );
}
