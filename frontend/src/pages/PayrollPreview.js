import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, HelpCircle, Check, ChevronDown, AlertTriangle, Info, ArrowDown, ArrowUp } from "lucide-react";

const C = {
  ink: "#12262B",
  teal: "#15A08C",
  tealDark: "#0F8474",
  tealInk: "#0E8A78",
  tealSoft: "#E3F4F0",
  text: "#1B2533",
  muted: "#66748B",
  faint: "#94A0B2",
  line: "#E7EAF0",
  lineSoft: "#F1F3F7",
  surface: "#EEF1F5",
  cra: "#9AA8B2",
  craSoft: "#C0CAD2",
  warnBg: "#FFF8EC",
  warnLine: "#F1DCAD",
  warnText: "#8A5A00",
  warnIco: "#C07A00",
  infoBg: "#EDF3FB",
  infoLine: "#D4E2F2",
  infoText: "#33557A",
  thBg: "#FAFBFC",
  tfBg: "#F7F9FB",
};

const FONT = "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif";
const tabular = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1' };
const API = "https://api.getnovala.com";

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("token") || "";
}

function fmtMoney(n, currency) {
  const v = Number(n) || 0;
  try {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: currency || "CAD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  } catch (e) {
    return "$" + v.toFixed(2);
  }
}

function fmtDate(iso) {
  if (!iso) return "";
  const p = String(iso).split("T")[0].split("-");
  return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : String(iso);
}

function agencyLabel(country) {
  const c = (country || "").toUpperCase();
  if (c === "CA") return "CRA";
  if (c === "US") return "IRS";
  if (c === "GB" || c === "UK") return "HMRC";
  return "the tax authority";
}

function pick(o, ...keys) {
  for (const k of keys) {
    if (o && o[k] != null && o[k] !== "") return o[k];
  }
  return undefined;
}

function DetailRow({ k, v, sub, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: last ? "0" : "1px solid " + C.lineSoft }}>
      <span style={{ fontSize: 13.5, color: C.muted }}>{k}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.text, textAlign: "right" }}>
        {v}
        {sub && <span style={{ display: "block", fontSize: 12, fontWeight: 450, color: C.faint }}>{sub}</span>}
      </span>
    </div>
  );
}

export default function PayrollPreview() {
  const { payRunId } = useParams();
  const navigate = useNavigate();

  const [run, setRun] = useState(null);
  const [lines, setLines] = useState([]);
  const [priorRuns, setPriorRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      const token = getToken();
      const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" };
      try {
        const [runRes, employeesRes, runsRes] = await Promise.all([
          fetch(API + "/api/v1/payroll/runs/" + payRunId, { headers }).then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch(API + "/api/v1/payroll/employees", { headers }).then((r) => r.ok ? r.json() : []).catch(() => []),
          fetch(API + "/api/v1/payroll/runs", { headers }).then((r) => r.ok ? r.json() : []).catch(() => []),
        ]);
        if (cancelled) return;
        setRun(runRes);

        const runLines = (runRes && runRes.lines) || [];
        const emps = Array.isArray(employeesRes) ? employeesRes : (employeesRes && employeesRes.items) || [];

        const linesArr = Array.isArray(runLines) && runLines.length > 0
          ? runLines.map((l) => ({
              employee_id: l.employee_id || l.id,
              name: l.name || ((l.last_name || "") + ", " + (l.preferred_name || l.first_name || "")).trim().replace(/^,\s*/, ""),
              classification: l.classification || (l.employment_type === "salaried" ? "Salary" : "Hourly"),
              payment_method: l.payment_method || "Direct deposit",
              total_hours: Number(l.total_hours || l.hours || 0),
              gross_pay: Number(l.gross_pay || l.gross || 0),
              employee_taxes: Number(l.employee_taxes || l.ee_tax || 0),
              net_pay: Number(l.net_pay || l.net || 0),
              employer_taxes: Number(l.employer_taxes || l.er_tax || 0),
              change_in_gross_pct: l.change_in_gross_pct != null ? Number(l.change_in_gross_pct) : null,
            }))
          : emps.map((e) => ({
              employee_id: e.id,
              name: ((e.last_name || "") + ", " + (e.preferred_name || e.first_name || "")).trim().replace(/^,\s*/, ""),
              classification: e.employment_type === "salaried" ? "Salary" : "Hourly",
              payment_method: "Direct deposit",
              total_hours: 0,
              gross_pay: 0,
              employee_taxes: 0,
              net_pay: 0,
              employer_taxes: 0,
              change_in_gross_pct: null,
            }));
        setLines(linesArr);

        const allRuns = Array.isArray(runsRes) ? runsRes : (runsRes && runsRes.items) || [];
        const sched = pick(runRes || {}, "pay_schedule_name", "pay_schedule");
        const prior = allRuns
          .filter((r) => r && r.status === "finalized")
          .filter((r) => !sched || pick(r, "pay_schedule_name", "pay_schedule") === sched)
          .filter((r) => String(r.id) !== String(payRunId))
          .sort((a, b) => String(a.pay_date || "").localeCompare(String(b.pay_date || "")));
        setPriorRuns(prior.slice(-5));
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(String((e && e.message) || e));
          setLoading(false);
        }
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [payRunId]);

  const totals = useMemo(() => {
    const gross = lines.reduce((s, r) => s + (Number(r.gross_pay) || 0), 0);
    const employee_taxes = lines.reduce((s, r) => s + (Number(r.employee_taxes) || 0), 0);
    const net = lines.reduce((s, r) => s + (Number(r.net_pay) || 0), 0);
    const employer_taxes = lines.reduce((s, r) => s + (Number(r.employer_taxes) || 0), 0);
    const total_hours = lines.reduce((s, r) => s + (Number(r.total_hours) || 0), 0);
    const total_cost = gross + employer_taxes;
    const cra_remittance = employee_taxes + employer_taxes;
    const take_home_pct = total_cost > 0 ? Math.round((net / total_cost) * 100) : 0;
    const remit_pct = total_cost > 0 ? 100 - take_home_pct : 0;
    if (process.env.NODE_ENV !== "production" && total_cost > 0) {
      const eps = 0.01;
      if (Math.abs(net + cra_remittance - total_cost) > eps) {
        console.warn("[PayrollPreview] invariant fail: net + cra_remittance != total_cost", { net, cra_remittance, total_cost });
      }
      if (Math.abs(gross - employee_taxes - net) > eps) {
        console.warn("[PayrollPreview] invariant fail: gross - employee_taxes != net", { gross, employee_taxes, net });
      }
    }
    return { gross, employee_taxes, net, employer_taxes, total_hours, total_cost, cra_remittance, take_home_pct, remit_pct };
  }, [lines]);

  const fundingAccount = (run && run.funding_account) || { connected: false, name: "", last4: "" };
  const ddCount = lines.filter((r) => r.payment_method === "Direct deposit").length;
  const submitDisabled = !fundingAccount.connected && ddCount > 0;
  const showBlueInfo = !fundingAccount.connected && ddCount === 0 && lines.length > 0;
  const country = (run && (run.country || run.company_country)) || "CA";
  const currency = (run && (run.currency || run.currency_code)) || "CAD";
  const agency = agencyLabel(country);

  const priorCount = priorRuns.length;
  let trendPct = null;
  if (priorCount > 0 && totals.total_cost > 0) {
    const last = priorRuns[priorRuns.length - 1];
    const lastCost = Number(last.total_payroll_cost || last.total_cost || last.total_gross || 0);
    if (lastCost > 0) {
      trendPct = Math.round(((totals.total_cost - lastCost) / lastCost) * 100);
    }
  }
  const trendDir = trendPct == null ? null : (trendPct < 0 ? "down" : trendPct > 0 ? "up" : "flat");
  const trendAbs = trendPct == null ? null : Math.abs(trendPct);

  if (loading) {
    return (
      <div style={{ background: C.surface, minHeight: "100vh", padding: "60px 20px", fontFamily: FONT, textAlign: "center", color: C.muted }}>
        Loading payroll preview...
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, minHeight: "100vh", padding: "28px 20px 80px", fontFamily: FONT, color: C.text }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", background: "#fff", borderRadius: 16, boxShadow: "0 1px 2px rgba(16,26,43,.04), 0 8px 28px rgba(16,26,43,.07)", overflow: "hidden", border: "1px solid " + C.line }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 32px 20px", borderBottom: "1px solid " + C.line }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", color: C.faint, marginBottom: 5 }}>Run payroll</div>
            <h1 style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em", color: C.ink, margin: 0 }}>Review and submit</h1>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button title="Help" aria-label="Help" style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid " + C.line, background: "#fff", color: C.muted, cursor: "pointer", display: "grid", placeItems: "center" }}><HelpCircle size={17} /></button>
            <button title="Close" aria-label="Close" onClick={() => navigate("/payroll/runs")} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid " + C.line, background: "#fff", color: C.muted, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={16} /></button>
          </div>
        </div>

        <div style={{ padding: "28px 32px 8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.12fr 1fr", gap: 18, marginBottom: 22 }}>

            <div style={{ border: "1px solid " + C.line, borderRadius: 14, padding: "22px 24px", background: "linear-gradient(180deg, #FBFCFD 0%, #F8FAFB 100%)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.faint, marginBottom: 13 }}>Total payroll cost</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.025em", color: C.ink, lineHeight: 1, ...tabular }}>{fmtMoney(totals.total_cost, currency)}</span>
                {trendPct != null && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 9px", borderRadius: 999, background: C.surface, color: "#51627A" }}>
                    {trendDir === "down" ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                    <span>{trendDir === "down" ? "Down" : "Up"} {trendAbs}%</span>
                  </span>
                )}
              </div>

              {priorCount >= 2 ? (
                <>
                  <div style={{ marginTop: 16, height: 66, borderRadius: 8, background: C.lineSoft, opacity: 0.35 }} aria-label={"Payroll cost trend over the last " + (priorCount + 1) + " runs, " + (trendDir === "down" ? "down" : "up") + " " + trendAbs + " percent versus the previous run."} />
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Cash-out, last {priorCount + 1} pay runs</span>
                    <span style={{ color: "#51627A", fontWeight: 600 }}>{trendDir === "down" ? "Down" : "Up"} {trendAbs}% vs last run</span>
                  </div>
                </>
              ) : priorCount === 0 ? (
                <div style={{ marginTop: 13, fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 8 }}>
                  <Info size={15} color={C.faint} />
                  This is your first payroll run, so there's no trend to compare yet.
                </div>
              ) : null}

              <div style={{ height: 1, background: C.lineSoft, margin: "19px 0 15px" }} />
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, marginBottom: 13 }}>Where this run's cash goes</div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: C.teal, display: "inline-block" }} />
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: C.ink }}>Employee take-home</span>
                </span>
                <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.ink, ...tabular }}>{fmtMoney(totals.net, currency)}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, minWidth: 34, textAlign: "right", ...tabular }}>{totals.take_home_pct}%</span>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: C.cra, display: "inline-block" }} />
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: C.ink }}>To {agency} (taxes and contributions)</span>
                </span>
                <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.ink, ...tabular }}>{fmtMoney(totals.cra_remittance, currency)}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, minWidth: 34, textAlign: "right", ...tabular }}>{totals.remit_pct}%</span>
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 4, overflow: "hidden", display: "flex", margin: "11px 0 4px", background: C.lineSoft }}>
                <div style={{ background: C.teal, width: totals.take_home_pct + "%" }} />
                <div style={{ background: C.cra, width: totals.remit_pct + "%" }} />
              </div>

              <div style={{ margin: "11px 0 2px 20px", paddingLeft: 14, borderLeft: "2px solid " + C.line, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: C.craSoft, display: "inline-block" }} />
                    <span style={{ fontSize: 13, color: C.muted }}>Employee taxes withheld</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, ...tabular }}>{fmtMoney(totals.employee_taxes, currency)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: C.cra, display: "inline-block" }} />
                    <span style={{ fontSize: 13, color: C.muted }}>Employer taxes and contributions</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, ...tabular }}>{fmtMoney(totals.employer_taxes, currency)}</span>
                </div>
              </div>

              <div style={{ marginTop: 13, fontSize: 11.5, color: C.faint, lineHeight: 1.5, display: "flex", gap: 7 }}>
                <Info size={14} color={C.cra} style={{ flex: "0 0 14px", marginTop: 2 }} />
                <span>You remit both the employee's withheld taxes and your employer contributions to {agency}, so both add up to the {agency} total.</span>
              </div>
            </div>

            <div style={{ border: "1px solid " + C.line, borderRadius: 14, padding: "22px 24px", background: "#fff" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.faint, marginBottom: 13 }}>Run details</div>
              <DetailRow k="Pay schedule" v={(run && run.pay_schedule_name) || "Semi-monthly"} sub={(run && run.pay_schedule_detail) || "15th and End of Month"} />
              <DetailRow k="Pay period" v={<span style={tabular}>{fmtDate(run && run.pay_period_start)} to {fmtDate(run && run.pay_period_end)}</span>} />
              <DetailRow k="Pay date" v={<span style={tabular}>{fmtDate(run && run.pay_date)}</span>} />
              <DetailRow k="Funding account" v={
                fundingAccount.connected ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 600 }}>
                    <Check size={16} color={C.teal} />
                    {fundingAccount.name || "Connected"}
                    {fundingAccount.last4 && <span style={{ color: C.faint, fontWeight: 500, fontSize: 12 }}>{fundingAccount.last4}</span>}
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: C.faint, fontWeight: 500 }}>
                    Not connected
                    <a style={{ color: C.tealInk, fontWeight: 600, textDecoration: "none", cursor: "pointer", borderBottom: "1px solid " + C.tealSoft }}>Connect bank account</a>
                  </span>
                )
              } />
              <DetailRow last k="Posting account" v={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10, border: "1px solid " + C.line, borderRadius: 9, padding: "7px 11px", fontSize: 13.5, fontWeight: 500, background: "#fff", cursor: "pointer", color: C.text }}>
                  {(run && run.posting_account_name) || "BrightCare RBC Chequing"}
                  <ChevronDown size={14} color={C.faint} />
                </span>
              } />
            </div>
          </div>

          {submitDisabled && (
            <div style={{ display: "flex", gap: 13, padding: "15px 18px", borderRadius: 12, marginBottom: 22, alignItems: "flex-start", background: C.warnBg, border: "1px solid " + C.warnLine, color: C.warnText }}>
              <AlertTriangle size={20} color={C.warnIco} style={{ flex: "0 0 20px", marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>Connect a bank account to run direct deposit</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                  {ddCount} {ddCount === 1 ? "employee is" : "employees are"} set to direct deposit and need a funding account before this run can go out. Connect a bank, or switch {ddCount === 1 ? "them" : "those employees"} to cheque to pay manually.
                </div>
                <div style={{ marginTop: 11, display: "flex", gap: 10 }}>
                  <button style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, borderRadius: 8, padding: "8px 14px", cursor: "pointer", background: C.teal, color: "#fff", border: "1px solid transparent" }}>Connect bank account</button>
                  <button style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, borderRadius: 8, padding: "8px 14px", cursor: "pointer", background: "#fff", border: "1px solid " + C.warnLine, color: C.warnText }}>Switch to cheque</button>
                </div>
              </div>
            </div>
          )}

          {showBlueInfo && (
            <div style={{ display: "flex", gap: 13, padding: "15px 18px", borderRadius: 12, marginBottom: 22, alignItems: "flex-start", background: C.infoBg, border: "1px solid " + C.infoLine, color: C.infoText }}>
              <Info size={20} style={{ flex: "0 0 20px", marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>No funding account needed for this run</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                  Everyone here is paid by cheque, so no money moves through Novala. Submitting records the run, posts the journal entry, and generates pay stubs. You write the cheques.
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0 12px" }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: C.ink, letterSpacing: "-0.01em", margin: 0 }}>
              Employees <span style={{ color: C.faint, fontWeight: 450 }}>({lines.length})</span>
            </h2>
          </div>

          <div style={{ border: "1px solid " + C.line, borderRadius: 13, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 760 }}>
              <thead>
                <tr>
                  {["Employee", "Total hours", "Gross pay", "Employee taxes", "Net pay", "Employer cost", "Change", "Memo"].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? "left" : "right", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: C.faint, padding: "13px 16px", background: C.thBg, borderBottom: "1px solid " + C.line, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((r, idx) => {
                  const isDD = r.payment_method === "Direct deposit";
                  const cellBase = { padding: "15px 16px", borderBottom: idx === lines.length - 1 ? "0" : "1px solid " + C.lineSoft, color: C.text, whiteSpace: "nowrap" };
                  return (
                    <tr key={r.employee_id || idx}>
                      <td style={{ ...cellBase, textAlign: "left" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>{r.name || "Unnamed"}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: isDD ? C.tealSoft : C.surface, color: isDD ? C.tealInk : "#51627A" }}>{r.payment_method}</span>
                            <span style={{ fontSize: 12, color: C.faint }}>{r.classification}</span>
                          </span>
                        </div>
                      </td>
                      <td style={{ ...cellBase, textAlign: "right", ...tabular }}>{r.total_hours}h</td>
                      <td style={{ ...cellBase, textAlign: "right", ...tabular }}>{fmtMoney(r.gross_pay, currency)}</td>
                      <td style={{ ...cellBase, textAlign: "right", ...tabular }}>{fmtMoney(r.employee_taxes, currency)}</td>
                      <td style={{ ...cellBase, textAlign: "right", fontWeight: 600, ...tabular }}>
                        {fmtMoney(r.net_pay, currency)}
                        <span title="View breakdown" style={{ color: C.faint, marginLeft: 5, fontSize: 12, cursor: "pointer" }}>{"\u25CB"}</span>
                      </td>
                      <td style={{ ...cellBase, textAlign: "right", ...tabular }}>{fmtMoney(r.employer_taxes, currency)}</td>
                      <td style={{ ...cellBase, textAlign: "right" }}>
                        {r.change_in_gross_pct == null ? (
                          <span style={{ fontSize: 12, fontWeight: 450, color: C.faint }}>New</span>
                        ) : (() => {
                          const isDown = r.change_in_gross_pct < 0;
                          const p = Math.abs(Math.round(r.change_in_gross_pct * 100));
                          return (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: isDown ? C.muted : C.tealInk }}>
                              {isDown ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
                              {isDown ? "Down" : "Up"} {p}%
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ ...cellBase, textAlign: "right", color: C.faint, fontSize: 12, cursor: "pointer" }}>+ Add</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ padding: 16, background: C.tfBg, fontWeight: 700, color: C.ink, textAlign: "left", fontSize: 14, letterSpacing: "0.02em" }}>Total</td>
                  <td style={{ padding: 16, background: C.tfBg, fontWeight: 700, color: C.ink, textAlign: "right", fontSize: 14, ...tabular }}>{totals.total_hours}h</td>
                  <td style={{ padding: 16, background: C.tfBg, fontWeight: 700, color: C.ink, textAlign: "right", fontSize: 14, ...tabular }}>{fmtMoney(totals.gross, currency)}</td>
                  <td style={{ padding: 16, background: C.tfBg, fontWeight: 700, color: C.ink, textAlign: "right", fontSize: 14, ...tabular }}>{fmtMoney(totals.employee_taxes, currency)}</td>
                  <td style={{ padding: 16, background: C.tfBg, fontWeight: 700, color: C.ink, textAlign: "right", fontSize: 14, ...tabular }}>{fmtMoney(totals.net, currency)}</td>
                  <td style={{ padding: 16, background: C.tfBg, fontWeight: 700, color: C.ink, textAlign: "right", fontSize: 14, ...tabular }}>{fmtMoney(totals.employer_taxes, currency)}</td>
                  <td style={{ padding: 16, background: C.tfBg }}></td>
                  <td style={{ padding: 16, background: C.tfBg }}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid " + C.line, padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 18 }}>
          <button onClick={() => navigate("/payroll/run/" + payRunId)} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, borderRadius: 10, cursor: "pointer", border: "1px solid transparent", background: "none", color: C.muted, padding: "11px 8px" }}>Back</button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {submitDisabled && (
              <span id="submit-hint" aria-live="polite" style={{ fontSize: 12.5, color: C.warnText, display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={14} color={C.warnIco} />Connect a funding account to submit
              </span>
            )}
            <button style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, borderRadius: 10, cursor: "pointer", border: "1px solid " + C.line, background: "#fff", color: C.ink, padding: "11px 18px" }}>Preview payroll details</button>
            <span style={{ display: "inline-flex", alignItems: "stretch", borderRadius: 10, overflow: "hidden" }}>
              <button disabled={submitDisabled} aria-disabled={submitDisabled} aria-describedby={submitDisabled ? "submit-hint" : undefined} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: submitDisabled ? "not-allowed" : "pointer", border: "1px solid transparent", background: submitDisabled ? "#C3CBD6" : C.teal, color: "#fff", padding: "11px 24px", borderRadius: 0, boxShadow: submitDisabled ? "none" : "0 1px 2px rgba(21,160,140,.3)" }}>Submit payroll</button>
              <button disabled={submitDisabled} aria-label="Submit options" style={{ background: submitDisabled ? "#C3CBD6" : C.teal, color: "#fff", border: 0, borderLeft: "1px solid rgba(255,255,255,.22)", padding: "0 12px", cursor: submitDisabled ? "not-allowed" : "pointer", display: "grid", placeItems: "center" }}>
                <ChevronDown size={14} />
              </button>
            </span>
          </div>
        </div>

        {error && (
          <div style={{ padding: "12px 32px", background: C.warnBg, color: C.warnText, fontSize: 13 }}>
            Error loading data: {error}
          </div>
        )}
      </div>
    </div>
  );
}
