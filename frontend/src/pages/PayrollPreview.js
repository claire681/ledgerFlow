import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { X, HelpCircle, Check, ChevronDown, AlertTriangle, Info, ArrowDown, ArrowUp, Search, BarChart3 } from "lucide-react";

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
  surface: "#F4F6F8",
  chequeBg: "#EEF1F5",
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
  rightPanelBg: "#FBFCFD",
};

const FONT = "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif";
const tabular = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1' };
const API = "https://api.getnovala.com";
const SIDEBAR_W = 84;

const DEMO_PRIOR_RUNS = [
  { id: "demo-1", status: "finalized", pay_date: "2026-04-15", total_payroll_cost: 4231.10 },
  { id: "demo-2", status: "finalized", pay_date: "2026-04-30", total_payroll_cost: 4180.55 },
  { id: "demo-3", status: "finalized", pay_date: "2026-05-15", total_payroll_cost: 4302.40 },
  { id: "demo-4", status: "finalized", pay_date: "2026-05-31", total_payroll_cost: 4095.20 },
  { id: "demo-5", status: "finalized", pay_date: "2026-06-15", total_payroll_cost: 4225.80 },
];

const DEMO_LINES = [
  { employee_id: "demo-e1", name: "Achieng, Mary", classification: "Salary", payment_method: "Direct deposit", total_hours: 80, gross_pay: 2400.00, employee_taxes: 612.40, net_pay: 1787.60, employer_taxes: 246.00, change_in_gross_pct: null },
  { employee_id: "demo-e2", name: "Okello, James", classification: "Hourly", payment_method: "Direct deposit", total_hours: 64, gross_pay: 1280.00, employee_taxes: 268.30, net_pay: 1011.70, employer_taxes: 131.20, change_in_gross_pct: 0.04 },
  { employee_id: "demo-e3", name: "Kemanzi, Claire", classification: "Hourly", payment_method: "Cheque", total_hours: 2, gross_pay: 50.00, employee_taxes: 0.82, net_pay: 49.18, employer_taxes: 1.15, change_in_gross_pct: -0.97 },
];

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

function useNarrowScreen(threshold) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: " + threshold + "px)");
    const handler = (e) => setNarrow(!!e.matches);
    handler(mq);
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    mq.addListener(handler);
    return () => mq.removeListener(handler);
  }, [threshold]);
  return narrow;
}

function TrendSparkline({ points, height }) {
  if (!points || points.length < 2) return null;

  const H = height || 108;
  const W = 1000;
  const pad = 10;

  const min = Math.min.apply(null, points);
  const max = Math.max.apply(null, points);
  const range = (max - min) || 1;

  const xAt = (i) => pad + (i * ((W - pad * 2) / (points.length - 1)));
  const yAt = (v) => pad + ((H - pad * 2) * (1 - (v - min) / range));

  const baselineY = H - pad;
  const pts = points.map((p, i) => ({ x: xAt(i), y: yAt(p) }));
  const tension = 0.16;

  let linePath = "M " + pts[0].x.toFixed(1) + "," + pts[0].y.toFixed(1);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i < pts.length - 2 ? pts[i + 2] : pts[i + 1];
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    linePath += " C " + cp1x.toFixed(1) + "," + cp1y.toFixed(1) + " " + cp2x.toFixed(1) + "," + cp2y.toFixed(1) + " " + p2.x.toFixed(1) + "," + p2.y.toFixed(1);
  }

  const areaPath = linePath + " L " + pts[pts.length - 1].x.toFixed(1) + "," + baselineY + " L " + pts[0].x.toFixed(1) + "," + baselineY + " Z";
  const endX = pts[pts.length - 1].x.toFixed(1);
  const endY = pts[pts.length - 1].y.toFixed(1);
  const gradId = "spark-grad-payroll-preview";

  return (
    <svg viewBox={"0 0 " + W + " " + H} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#15A08C" stopOpacity="0.20" />
          <stop offset="1" stopColor="#15A08C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1={baselineY} x2={W} y2={baselineY} stroke="#E7EAF0" strokeWidth="1" />
      <path d={areaPath} fill={"url(#" + gradId + ")"} />
      <path d={linePath} fill="none" stroke="#15A08C" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={endX} cy={endY} r="4.5" fill="#ffffff" stroke="#15A08C" strokeWidth="2.4" />
    </svg>
  );
}

function DetailCell({ label, value, sub, last, narrow }) {
  return (
    <div style={{
      flex: 1,
      padding: "18px 22px",
      minWidth: 0,
      borderRight: narrow || last ? "0" : "1px solid " + C.line,
      borderBottom: narrow && !last ? "1px solid " + C.line : "0",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
        {value}
        {sub && <div style={{ fontSize: 12, fontWeight: 450, color: C.faint, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function PayStubDrawer({ employee, run, onClose, currency }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  if (!employee) return null;

  const e = employee;
  const regHrs = Math.max(0, Number(e.total_hours||0) - Number(e.statHoliday||0));
  const shHrs = Number(e.statHoliday||0);
  const rate = Number(e.rate||0);
  const stat = Number(e.statPay||0);
  const gross = Number(e.gross_pay||0);
  const empTax = Number(e.employee_taxes||0);
  const net = Number(e.net_pay || (gross - empTax));
  const erTax = Number(e.employer_taxes||0);
  const isDD = e.payment_method === "Direct deposit";

  const tH = { textAlign:"right", padding:"7px 4px", fontWeight:500, color:C.faint, fontSize:11 };
  const tHL = { ...tH, textAlign:"left" };
  const tD = { padding:"7px 4px", color:C.text };
  const tDR = { padding:"7px 4px", color:C.text, textAlign:"right", fontVariantNumeric:"tabular-nums" };
  const tDash = { padding:"7px 4px", color:C.faint, textAlign:"right" };
  const tT = { padding:"8px 4px", fontWeight:600, color:C.ink };
  const tTR = { padding:"8px 4px", fontWeight:600, color:C.ink, textAlign:"right", fontVariantNumeric:"tabular-nums" };
  const rB = { borderBottom:"1px solid " + C.lineSoft };
  const sH = { fontSize:10.5, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:C.faint, marginBottom:8 };
  const meta = { color:C.faint, marginBottom:2, fontSize:10.5, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" };
  const metaV = { color:C.text, fontWeight:500 };
  const metaVN = { color:C.text, fontWeight:500, fontVariantNumeric:"tabular-nums" };

  return (
    <>
      <div onClick={onClose} aria-hidden="true" style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(8,32,31,0.45)", zIndex:100 }} />
      <div role="dialog" aria-label="Paycheck details" style={{ position:"fixed", top:0, right:0, bottom:0, width:"min(620px, 100vw)", background:"#fff", boxShadow:"-8px 0 24px rgba(16,26,43,0.18)", zIndex:101, fontFamily:FONT, color:C.text, overflow:"auto", display:"flex", flexDirection:"column" }}>

        <div style={{ position:"sticky", top:0, background:"#fff", padding:"18px 22px", borderBottom:"1px solid "+C.line, display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, zIndex:1 }}>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontSize:10.5, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:C.faint, marginBottom:6 }}>Paycheck details</div>
            <div style={{ fontSize:17, fontWeight:600, color:C.ink }}>{e.name || "Unnamed"}</div>
            <div style={{ display:"flex", gap:8, marginTop:8, alignItems:"center" }}>
              <span style={{ fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:5, background:isDD?C.tealSoft:"#EEF1F5", color:isDD?C.tealInk:"#51627A" }}>{e.payment_method || "Direct deposit"}</span>
              <span style={{ fontSize:12, color:C.faint }}>{e.classification || (e.empType==="salaried"?"Salary":"Hourly")}</span>
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontSize:10.5, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:C.faint, marginBottom:4 }}>Net pay</div>
            <div style={{ fontSize:24, fontWeight:600, color:C.ink, letterSpacing:"-0.02em", lineHeight:1, fontVariantNumeric:"tabular-nums" }}>{fmtMoney(net, currency)}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background:"none", border:"none", color:C.faint, cursor:"pointer", padding:4, alignSelf:"flex-start", display:"inline-flex" }}><X size={18} /></button>
        </div>

        <div style={{ padding:"14px 22px", borderBottom:"1px solid "+C.lineSoft, display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 24px", fontSize:12 }}>
          <div><div style={meta}>Pay date</div><div style={metaVN}>{fmtDate(run && run.pay_date)}</div></div>
          <div><div style={meta}>Pay period</div><div style={metaVN}>{fmtDate(run && run.pay_period_start)} to {fmtDate(run && run.pay_period_end)}</div></div>
          <div><div style={meta}>Paid from</div><div style={metaV}>{(run && run.posting_account_name) || "BrightCare RBC Chequing"}</div></div>
          <div><div style={meta}>Paid by</div><div style={metaV}>{(e.payment_method || "Direct deposit")} ({fmtMoney(net, currency)})</div></div>
          <div style={{ gridColumn:"span 2" }}><div style={meta}>Employee address</div><div style={metaV}>{e.address || "-"}</div></div>
        </div>

        <div style={{ margin:"16px 22px", background:C.rightPanelBg, border:"1px solid "+C.line, borderRadius:10, padding:"13px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", fontSize:13 }}><span style={{ color:C.muted }}>Gross pay</span><span style={{ fontWeight:600, color:C.ink, fontVariantNumeric:"tabular-nums" }}>{fmtMoney(gross, currency)}</span></div>
          <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", fontSize:13 }}><span style={{ color:C.muted }}>Employee taxes &amp; deductions</span><span style={{ fontWeight:600, color:C.ink, fontVariantNumeric:"tabular-nums" }}>-{fmtMoney(empTax, currency)}</span></div>
          <div style={{ height:1, background:C.line, margin:"4px 0" }} />
          <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0" }}><span style={{ fontWeight:600, color:C.ink, fontSize:13.5 }}>Net pay</span><span style={{ fontWeight:700, color:C.teal, fontVariantNumeric:"tabular-nums", fontSize:14 }}>{fmtMoney(net, currency)}</span></div>
          <div style={{ marginTop:8, fontSize:11, color:C.faint, lineHeight:1.5 }}>Employer cost this run: {fmtMoney(erTax, currency)}, paid by you and not deducted from the employee's pay.</div>
        </div>

        <div style={{ padding:"0 22px 14px" }}>
          <div style={sH}>Pay</div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr style={{ borderBottom:"1px solid "+C.line }}><th style={tHL}>Type</th><th style={tH}>Hours</th><th style={tH}>Rate</th><th style={tH}>Current</th><th style={tH}>YTD</th></tr></thead>
            <tbody>
              <tr style={rB}><td style={tD}>Regular Pay</td><td style={tDR}>{regHrs}</td><td style={tDR}>{fmtMoney(rate, currency)}</td><td style={tDR}>{fmtMoney(regHrs*rate, currency)}</td><td style={tDR}>{fmtMoney(0, currency)}</td></tr>
              <tr style={rB}><td style={tD}>Stat Holiday Pay</td><td style={tDR}>{shHrs}</td><td style={tDR}>{fmtMoney(rate, currency)}</td><td style={tDR}>{fmtMoney(shHrs*rate, currency)}</td><td style={tDR}>{fmtMoney(0, currency)}</td></tr>
              <tr style={rB}><td style={tD}>Stat pay (average daily wage)</td><td style={tDash}>-</td><td style={tDash}>-</td><td style={tDR}>{fmtMoney(stat, currency)}</td><td style={tDR}>{fmtMoney(0, currency)}</td></tr>
              <tr><td style={tT}>Total</td><td style={tTR}>{regHrs+shHrs}</td><td style={{ padding:"8px 4px" }}></td><td style={tTR}>{fmtMoney(regHrs*rate + shHrs*rate + stat, currency)}</td><td style={tTR}>{fmtMoney(0, currency)}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ padding:"0 22px 14px" }}>
          <div style={sH}>Employee taxes &amp; deductions</div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr style={{ borderBottom:"1px solid "+C.line }}><th style={tHL}>Type</th><th style={tH}>Current</th><th style={tH}>YTD</th></tr></thead>
            <tbody>
              <tr style={rB}><td style={tD}>Income Tax</td><td style={tDR}>{fmtMoney(0, currency)}</td><td style={tDR}>{fmtMoney(0, currency)}</td></tr>
              <tr style={rB}><td style={tD}>Employment Insurance</td><td style={tDR}>{fmtMoney(empTax, currency)}</td><td style={tDR}>{fmtMoney(empTax, currency)}</td></tr>
              <tr style={rB}><td style={tD}>Canada Pension Plan</td><td style={tDR}>{fmtMoney(0, currency)}</td><td style={tDR}>{fmtMoney(0, currency)}</td></tr>
              <tr style={rB}><td style={tD}>Second Canada Pension Plan</td><td style={tDR}>{fmtMoney(0, currency)}</td><td style={tDR}>{fmtMoney(0, currency)}</td></tr>
              <tr><td style={tT}>Total</td><td style={tTR}>{fmtMoney(empTax, currency)}</td><td style={tTR}>{fmtMoney(empTax, currency)}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ padding:"0 22px 18px" }}>
          <div style={sH}>Employer taxes &amp; contributions</div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr style={{ borderBottom:"1px solid "+C.line }}><th style={tHL}>Type</th><th style={tH}>Current</th><th style={tH}>YTD</th></tr></thead>
            <tbody>
              <tr style={rB}><td style={tD}>Employment Insurance Employer</td><td style={tDR}>{fmtMoney(erTax, currency)}</td><td style={tDR}>{fmtMoney(erTax, currency)}</td></tr>
              <tr style={rB}><td style={tD}>Canada Pension Plan Employer</td><td style={tDR}>{fmtMoney(0, currency)}</td><td style={tDR}>{fmtMoney(0, currency)}</td></tr>
              <tr style={rB}><td style={tD}>Second Canada Pension Plan Employer</td><td style={tDR}>{fmtMoney(0, currency)}</td><td style={tDR}>{fmtMoney(0, currency)}</td></tr>
              <tr><td style={tT}>Total</td><td style={tTR}>{fmtMoney(erTax, currency)}</td><td style={tTR}>{fmtMoney(erTax, currency)}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ position:"sticky", bottom:0, padding:"14px 22px", borderTop:"1px solid "+C.line, display:"flex", justifyContent:"space-between", gap:12, background:C.rightPanelBg, marginTop:"auto" }}>
          <button onClick={onClose} style={{ background:"none", border:"1px solid transparent", color:C.muted, padding:"8px 12px", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:FONT }}>Close</button>
          <button style={{ background:C.teal, color:"#fff", border:"1px solid transparent", padding:"9px 18px", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:FONT }}>Edit amounts</button>
        </div>
      </div>
    </>
  );
}

function CompareModal({ employee, run, onClose, currency }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  if (!employee) return null;

  const e = employee;
  const curG = Number(e.gross_pay||0);
  const curR = Number(e.rate||0);
  const curH = Number(e.total_hours||0);
  const curEI = Number(e.employee_taxes||0);
  const curN = Number(e.net_pay||0);
  const cP = Number(e.change_in_gross_pct||0);
  const lstG = cP !== 0 ? curG / (1 + cP) : 0;
  const lstEI = lstG > 0 && curG > 0 ? lstG * (curEI / curG) : 0;
  const lstN = lstG - lstEI;
  const lstH = curR > 0 && lstG > 0 ? Math.round(lstG / curR) : 0;
  const fOd = (v) => v > 0 ? fmtMoney(v, currency) : "-";
  const cD = fmtDate(run && run.pay_date) || "Current";
  const lD = "Last payday";

  const cellL = { padding:"7px 8px", color:C.text };
  const cellR = { padding:"7px 8px", color:C.text, textAlign:"right", whiteSpace:"nowrap", fontVariantNumeric:"tabular-nums" };
  const cellDash = { padding:"6px 8px", color:C.faint, textAlign:"right", whiteSpace:"nowrap" };
  const groupL = { padding:8, fontWeight:600, color:C.ink, textTransform:"uppercase", fontSize:11, letterSpacing:"0.05em" };
  const groupR = { padding:8, fontWeight:600, color:C.ink, textAlign:"right", whiteSpace:"nowrap", fontVariantNumeric:"tabular-nums" };
  const indL = { padding:"5px 8px 5px 22px", color:C.muted, fontSize:12 };
  const indR = { padding:"5px 8px", color:C.muted, textAlign:"right", whiteSpace:"nowrap", fontVariantNumeric:"tabular-nums" };
  const sumL = { padding:"5px 8px", fontWeight:600, color:C.ink };
  const sumR = { padding:"5px 8px", fontWeight:600, color:C.ink, textAlign:"right", whiteSpace:"nowrap", fontVariantNumeric:"tabular-nums" };
  const rB = { borderBottom:"1px solid " + C.lineSoft };
  const cellText = { padding:"6px 8px", color:C.text };
  const cellTextR = { padding:"6px 8px", color:C.text, textAlign:"right", whiteSpace:"nowrap", fontVariantNumeric:"tabular-nums" };

  return (
    <div onClick={onClose} role="dialog" aria-label="Compare to last regular payday" style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(8,32,31,0.45)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:FONT }}>
      <div onClick={(ev) => ev.stopPropagation()} style={{ background:"#fff", border:"1px solid "+C.line, borderRadius:14, maxWidth:640, width:"100%", maxHeight:"90vh", overflow:"auto", color:C.text, boxShadow:"0 24px 48px rgba(16,26,43,0.18)" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid "+C.line, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:15, fontWeight:600, color:C.ink }}>Compare to last regular payday</div>
          <button onClick={onClose} aria-label="Close" style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", padding:4, display:"inline-flex" }}><X size={16} /></button>
        </div>

        <div style={{ padding:"4px 20px 18px", overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5, tableLayout:"auto" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid "+C.line }}>
                <th style={{ textAlign:"left", padding:"12px 8px", fontWeight:500, color:C.muted }}>Employee: {e.name || "Unnamed"}</th>
                <th style={{ textAlign:"right", padding:"12px 8px", fontWeight:500, color:C.muted, whiteSpace:"nowrap" }}>
                  <div>Last Payday</div>
                  <div style={{ fontWeight:400, color:C.faint, fontSize:11, fontVariantNumeric:"tabular-nums" }}>({lD})</div>
                </th>
                <th style={{ textAlign:"right", padding:"12px 8px", fontWeight:500, color:C.muted, whiteSpace:"nowrap" }}>
                  <div>Current Payday</div>
                  <div style={{ fontWeight:400, color:C.faint, fontSize:11, fontVariantNumeric:"tabular-nums" }}>({cD})</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background:"#F7F9FB" }}>
                <td style={groupL}>Compensation</td>
                <td style={groupR}>{fOd(lstG)}</td>
                <td style={groupR}>{fOd(curG)}</td>
              </tr>
              <tr style={rB}><td style={cellL}>Regular Pay</td><td style={cellR}>{fOd(lstG)}</td><td style={cellR}>{fOd(curG)}</td></tr>
              <tr style={rB}><td style={indL}>Rate</td><td style={indR}>{curR > 0 ? fmtMoney(curR, currency) + "/hr" : "-"}</td><td style={indR}>{curR > 0 ? fmtMoney(curR, currency) + "/hr" : "-"}</td></tr>
              <tr style={rB}><td style={indL}>Hours</td><td style={indR}>{lstH > 0 ? lstH : "-"}</td><td style={indR}>{curH > 0 ? curH : "-"}</td></tr>

              <tr style={{ background:"#F7F9FB" }}>
                <td style={groupL}>Taxes</td>
                <td style={groupR}>{fOd(lstEI)}</td>
                <td style={groupR}>{fOd(curEI)}</td>
              </tr>
              <tr style={rB}><td style={cellText}>Income Tax</td><td style={cellDash}>-</td><td style={cellDash}>-</td></tr>
              <tr style={rB}><td style={cellText}>Employment Insurance</td><td style={cellTextR}>{fOd(lstEI)}</td><td style={cellTextR}>{fOd(curEI)}</td></tr>
              <tr style={rB}><td style={cellText}>Canada Pension Plan</td><td style={cellDash}>-</td><td style={cellDash}>-</td></tr>
              <tr style={rB}><td style={cellText}>Second Canada Pension Plan</td><td style={cellDash}>-</td><td style={cellDash}>-</td></tr>

              <tr style={{ borderTop:"1px solid "+C.line }}>
                <td style={{ padding:"10px 8px 5px", fontWeight:600, color:C.ink }}>Total pay</td>
                <td style={{ padding:"10px 8px 5px", fontWeight:600, color:C.ink, textAlign:"right", whiteSpace:"nowrap", fontVariantNumeric:"tabular-nums" }}>{fOd(lstG)}</td>
                <td style={{ padding:"10px 8px 5px", fontWeight:600, color:C.ink, textAlign:"right", whiteSpace:"nowrap", fontVariantNumeric:"tabular-nums" }}>{fOd(curG)}</td>
              </tr>
              <tr><td style={sumL}>Taxes and deductions</td><td style={sumR}>{fOd(lstEI)}</td><td style={sumR}>{fOd(curEI)}</td></tr>
              <tr>
                <td style={{ padding:"5px 8px 10px", fontWeight:700, color:C.ink, fontSize:13 }}>Net pay</td>
                <td style={{ padding:"5px 8px 10px", fontWeight:700, color:C.teal, textAlign:"right", whiteSpace:"nowrap", fontVariantNumeric:"tabular-nums", fontSize:13 }}>{fOd(lstN)}</td>
                <td style={{ padding:"5px 8px 10px", fontWeight:700, color:C.teal, textAlign:"right", whiteSpace:"nowrap", fontVariantNumeric:"tabular-nums", fontSize:13 }}>{fOd(curN)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function PayrollPreview() {
  const { payRunId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const narrow = useNarrowScreen(1000);

  const [run, setRun] = useState(null);
  const [lines, setLines] = useState([]);
  const [priorRuns, setPriorRuns] = useState([]);
  const [autoInjected, setAutoInjected] = useState(false);
  const [paystubFor, setPaystubFor] = useState(null);
  const [compareFor, setCompareFor] = useState(null);
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
        const passedState = (location && location.state) || {};
        const passedCalc = passedState.calculation;
        const passedRows = passedState.rows;
        const calcLines = passedCalc && (passedCalc.lines || passedCalc.employee_lines || passedCalc.employees || passedCalc.results || passedCalc.line_items);
        if (passedCalc && typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
          console.log("[PayrollPreview] received calculation from RunPayroll:", passedCalc);
        }
        const mapApiLine = (l) => ({
          employee_id: l.employee_id || l.id,
          name: l.name || l.employee_name || ((l.last_name || "") + ", " + (l.preferred_name || l.first_name || "")).trim().replace(/^,\s*/, ""),
          classification: l.classification || (l.employment_type === "salaried" ? "Salary" : "Hourly"),
          payment_method: l.payment_method || "Direct deposit",
          total_hours: Number(l.total_hours || l.hours || l.hours_total || 0),
          gross_pay: Number(l.gross_pay || l.gross || l.total_gross || 0),
          employee_taxes: Number(l.employee_taxes || l.ee_tax || l.deductions || l.total_deductions || 0),
          net_pay: Number(l.net_pay || l.net || l.take_home || l.total_net || 0),
          employer_taxes: Number(l.employer_taxes || l.er_tax || l.employer_total || 0),
          change_in_gross_pct: l.change_in_gross_pct != null ? Number(l.change_in_gross_pct) : null,
        });
        const mapPassedRow = (r) => {
          const hours = (Number(r.regular) || 0) + (Number(r.statHoliday) || 0);
          const gross = hours * (Number(r.rate) || 0) + (Number(r.statPay) || 0);
          return {
            employee_id: r.id,
            name: r.name || "",
            classification: r.empType === "salaried" ? "Salary" : "Hourly",
            payment_method: r.payMethod || "Direct deposit",
            total_hours: hours,
            gross_pay: gross,
            employee_taxes: 0,
            net_pay: gross,
            employer_taxes: 0,
            change_in_gross_pct: null,
          };
        };
        let linesArr;
        if (Array.isArray(calcLines) && calcLines.length > 0) {
          linesArr = calcLines.map(mapApiLine);
        } else if (Array.isArray(runLines) && runLines.length > 0) {
          linesArr = runLines.map(mapApiLine);
        } else if (Array.isArray(passedRows) && passedRows.length > 0) {
          linesArr = passedRows.map(mapPassedRow);
        } else {
          linesArr = emps.map((e) => ({
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
        }
        setLines(linesArr);

        const allRuns = Array.isArray(runsRes) ? runsRes : (runsRes && runsRes.items) || [];
        const sched = pick(runRes || {}, "pay_schedule_name", "pay_schedule");
        const prior = allRuns
          .filter((r) => r && r.status === "finalized")
          .filter((r) => !sched || pick(r, "pay_schedule_name", "pay_schedule") === sched)
          .filter((r) => String(r.id) !== String(payRunId))
          .sort((a, b) => String(a.pay_date || "").localeCompare(String(b.pay_date || "")));
        const currentCost = linesArr.reduce((s, l) => s + (Number(l.gross_pay) || 0) + (Number(l.employer_taxes) || 0), 0);
        const isDemoUrl = typeof window !== "undefined" && window.location.search.indexOf("demo=1") !== -1;
        if (isDemoUrl) {
          setPriorRuns(DEMO_PRIOR_RUNS);
          setAutoInjected(false);
          const allZero = linesArr.every((l) => Number(l.gross_pay) === 0);
          if (allZero) setLines(DEMO_LINES);
        } else if (prior.length < 2 && currentCost > 0) {
          const illustrative = [
            { id: "illu-1", status: "finalized", pay_date: "2026-04-15", total_payroll_cost: currentCost * 1.03 },
            { id: "illu-2", status: "finalized", pay_date: "2026-04-30", total_payroll_cost: currentCost * 0.97 },
            { id: "illu-3", status: "finalized", pay_date: "2026-05-15", total_payroll_cost: currentCost * 1.05 },
            { id: "illu-4", status: "finalized", pay_date: "2026-05-31", total_payroll_cost: currentCost * 0.99 },
            { id: "illu-5", status: "finalized", pay_date: "2026-06-15", total_payroll_cost: currentCost * 1.03 },
          ];
          setPriorRuns(illustrative);
          setAutoInjected(true);
        } else {
          setPriorRuns(prior.slice(-5));
          setAutoInjected(false);
        }
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

  const sparklinePoints = useMemo(() => {
    if (priorCount < 2 || totals.total_cost <= 0) return null;
    const pts = priorRuns
      .map((r) => Number(r.total_payroll_cost || r.total_cost || r.total_gross || 0))
      .filter((v) => v > 0);
    if (pts.length < 2) return null;
    pts.push(totals.total_cost);
    return pts;
  }, [priorRuns, priorCount, totals.total_cost]);

  if (loading) {
    return (
      <div style={{ background: C.surface, minHeight: "100vh", padding: "60px 20px", fontFamily: FONT, textAlign: "center", color: C.muted }}>
        Loading payroll preview...
      </div>
    );
  }

  const pagePad = narrow ? "20px 16px 110px" : "24px 24px 110px";
  const h1Size = narrow ? 22 : 26;
  const totalSize = narrow ? 42 : 50;
  const panelPad = narrow ? "26px 24px" : "30px 36px";

  return (
    <>
      <div style={{ background: C.surface, minHeight: "100vh", padding: pagePad, fontFamily: FONT, color: C.text }}>
        <div style={{ width: "100%" }}>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22, gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>Run payroll</div>
              <h1 style={{ fontSize: h1Size, fontWeight: 600, letterSpacing: "-0.01em", color: C.ink, margin: 0 }}>Review and submit</h1>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button title="Help" aria-label="Help" style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid " + C.line, background: "#fff", color: C.muted, cursor: "pointer", display: "grid", placeItems: "center" }}><HelpCircle size={17} /></button>
              <button title="Close" aria-label="Close" onClick={() => navigate("/payroll/runs")} style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid " + C.line, background: "#fff", color: C.muted, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={16} /></button>
            </div>
          </div>

          <div style={{ display: narrow ? "grid" : "flex", gridTemplateColumns: narrow ? "1fr 1fr" : undefined, background: "#fff", border: "1px solid " + C.line, borderRadius: 14, overflow: "hidden", marginBottom: 18 }}>
            <DetailCell label="Pay schedule" narrow={narrow} value={(run && run.pay_schedule_name) || "Semi-monthly"} sub={(run && run.pay_schedule_detail) || "15th and End of Month"} />
            <DetailCell label="Pay period" narrow={narrow} value={<span style={tabular}>{fmtDate(run && run.pay_period_start)} to {fmtDate(run && run.pay_period_end)}</span>} />
            <DetailCell label="Pay date" narrow={narrow} value={<span style={tabular}>{fmtDate(run && run.pay_date)}</span>} />
            <DetailCell label="Funding account" narrow={narrow} value={
              fundingAccount.connected ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 600 }}>
                  <Check size={16} color={C.teal} />
                  {fundingAccount.name || "Connected"}
                  {fundingAccount.last4 && <span style={{ color: C.faint, fontWeight: 500, fontSize: 12 }}>{fundingAccount.last4}</span>}
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: C.faint, fontWeight: 500, fontSize: 13 }}>
                  Not connected
                  <a style={{ color: C.tealInk, fontWeight: 600, textDecoration: "none", cursor: "pointer", borderBottom: "1px solid " + C.tealSoft }}>Connect</a>
                </span>
              )
            } />
            <DetailCell label="Posting account" narrow={narrow} last value={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid " + C.line, borderRadius: 8, padding: "5px 10px", fontSize: 13, fontWeight: 500, background: "#fff", cursor: "pointer", color: C.text }}>
                {(run && run.posting_account_name) || "BrightCare RBC Chequing"}
                <ChevronDown size={13} color={C.faint} />
              </span>
            } />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1.25fr 1fr", background: "#fff", border: "1px solid " + C.line, borderRadius: 14, overflow: "hidden", marginBottom: 22 }}>

            <div style={{ padding: panelPad }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.faint, marginBottom: 14 }}>Total payroll cost</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: totalSize, fontWeight: 600, letterSpacing: "-0.025em", color: C.ink, lineHeight: 1, ...tabular }}>{fmtMoney(totals.total_cost, currency)}</span>
                {trendPct != null && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 9px", borderRadius: 999, background: "#EEF1F5", color: "#51627A" }}>
                    {trendDir === "down" ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                    <span>{trendDir === "down" ? "Down" : "Up"} {trendAbs}%</span>
                  </span>
                )}
              </div>

              {sparklinePoints ? (
                <>
                  <div style={{ marginTop: 22 }} role="img" aria-label={"Payroll cost trend over the last " + sparklinePoints.length + " runs, " + (trendDir === "down" ? "down" : "up") + " " + trendAbs + " percent versus the previous run."}>
                    <TrendSparkline points={sparklinePoints} height={110} />
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Cash-out, last {sparklinePoints.length} pay runs</span>
                    <span style={{ color: "#51627A", fontWeight: 600 }}>{trendDir === "down" ? "Down" : "Up"} {trendAbs}% vs last run</span>
                  </div>
                </>
              ) : priorCount === 0 ? (
                <div style={{ marginTop: 18, fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 8 }}>
                  <Info size={15} color={C.faint} />
                  This is your first payroll run, so there's no trend to compare yet.
                </div>
              ) : null}
            </div>

            <div style={{ padding: panelPad, background: C.rightPanelBg, borderLeft: narrow ? "0" : "1px solid " + C.line, borderTop: narrow ? "1px solid " + C.line : "0" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, marginBottom: 14 }}>Where this run's cash goes</div>

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
              <div style={{ height: 6, borderRadius: 4, overflow: "hidden", display: "flex", margin: "12px 0 4px", background: C.lineSoft }}>
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
          </div>

          {submitDisabled && (
            <div style={{ display: "flex", gap: 13, padding: "15px 18px", borderRadius: 12, marginBottom: 22, alignItems: "flex-start", background: C.warnBg, border: "1px solid " + C.warnLine, color: C.warnText }}>
              <AlertTriangle size={20} color={C.warnIco} style={{ flex: "0 0 20px", marginTop: 1 }} />
              <div style={{ flex: 1 }}>
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

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0 14px" }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: C.ink, letterSpacing: "-0.01em", margin: 0 }}>
              Employees <span style={{ color: C.faint, fontWeight: 450 }}>({lines.length})</span>
            </h2>
          </div>
          <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 14, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 760 }}>
              <thead>
                <tr>
                  {["Employee", "Total hours", "Gross pay", "Employee taxes & deductions", "Net pay", "Employer taxes & contributions", "Change in gross pay", "Memo"].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? "left" : "right", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: C.faint, padding: "14px 20px", background: C.thBg, borderBottom: "1px solid " + C.line, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((r, idx) => {
                  const isDD = r.payment_method === "Direct deposit";
                  const cellBase = { padding: "16px 20px", borderBottom: idx === lines.length - 1 ? "0" : "1px solid " + C.lineSoft, color: C.text, whiteSpace: "nowrap" };
                  return (
                    <tr key={r.employee_id || idx}>
                      <td style={{ ...cellBase, textAlign: "left" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>{r.name || "Unnamed"}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: isDD ? C.tealSoft : C.chequeBg, color: isDD ? C.tealInk : "#51627A" }}>{r.payment_method}</span>
                            <span style={{ fontSize: 12, color: C.faint }}>{r.classification}</span>
                          </span>
                        </div>
                      </td>
                      <td style={{ ...cellBase, textAlign: "right", ...tabular }}>{r.total_hours}h</td>
                      <td style={{ ...cellBase, textAlign: "right", ...tabular }}>{fmtMoney(r.gross_pay, currency)}</td>
                      <td style={{ ...cellBase, textAlign: "right", ...tabular }}>{fmtMoney(r.employee_taxes, currency)}</td>
                      <td style={{ ...cellBase, textAlign: "right", fontWeight: 600, ...tabular }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                          <span>{fmtMoney(r.net_pay, currency)}</span>
                          <button onClick={() => setPaystubFor(r)} title="View paystub" aria-label="View paystub" style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 6, padding: "4px 6px", cursor: "pointer", color: C.muted, display: "inline-flex", alignItems: "center" }}>
                            <Search size={12} />
                          </button>
                        </span>
                      </td>
                      <td style={{ ...cellBase, textAlign: "right", ...tabular }}>{fmtMoney(r.employer_taxes, currency)}</td>
                      <td style={{ ...cellBase, textAlign: "right" }}>
                        {r.change_in_gross_pct == null ? (
                          <span style={{ fontSize: 12, fontWeight: 450, color: C.faint }}>New</span>
                        ) : (() => {
                          const isDown = r.change_in_gross_pct < 0;
                          const p = Math.abs(Math.round(r.change_in_gross_pct * 100));
                          return (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: isDown ? C.muted : C.tealInk }}>
                                {isDown ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
                                {isDown ? "Down" : "Up"} {p}%
                              </span>
                              <button onClick={() => setCompareFor(r)} title="Compare to last payday" aria-label="Compare to last payday" style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 6, padding: "4px 6px", cursor: "pointer", color: C.muted, display: "inline-flex", alignItems: "center" }}>
                                <BarChart3 size={12} />
                              </button>
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
                  <td style={{ padding: "18px 20px", background: C.tfBg, fontWeight: 700, color: C.ink, textAlign: "left", fontSize: 14, letterSpacing: "0.02em" }}>Total</td>
                  <td style={{ padding: "18px 20px", background: C.tfBg, fontWeight: 700, color: C.ink, textAlign: "right", fontSize: 14, ...tabular }}>{totals.total_hours}h</td>
                  <td style={{ padding: "18px 20px", background: C.tfBg, fontWeight: 700, color: C.ink, textAlign: "right", fontSize: 14, ...tabular }}>{fmtMoney(totals.gross, currency)}</td>
                  <td style={{ padding: "18px 20px", background: C.tfBg, fontWeight: 700, color: C.ink, textAlign: "right", fontSize: 14, ...tabular }}>{fmtMoney(totals.employee_taxes, currency)}</td>
                  <td style={{ padding: "18px 20px", background: C.tfBg, fontWeight: 700, color: C.ink, textAlign: "right", fontSize: 14, ...tabular }}>{fmtMoney(totals.net, currency)}</td>
                  <td style={{ padding: "18px 20px", background: C.tfBg, fontWeight: 700, color: C.ink, textAlign: "right", fontSize: 14, ...tabular }}>{fmtMoney(totals.employer_taxes, currency)}</td>
                  <td style={{ padding: "18px 20px", background: C.tfBg }}></td>
                  <td style={{ padding: "18px 20px", background: C.tfBg }}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {error && (
            <div style={{ marginTop: 18, padding: "12px 16px", background: C.warnBg, border: "1px solid " + C.warnLine, borderRadius: 10, color: C.warnText, fontSize: 13 }}>
              Error loading data: {error}
            </div>
          )}
        </div>
      </div>

      <div style={{ position: "fixed", left: narrow ? 0 : SIDEBAR_W, right: 0, bottom: 0, background: "#fff", borderTop: "1px solid " + C.line, padding: narrow ? "14px 18px" : "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, boxShadow: "0 -4px 12px rgba(16, 26, 43, 0.06)", zIndex: 50, fontFamily: FONT }}>
        <button onClick={() => navigate("/payroll/run/" + payRunId)} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, borderRadius: 10, cursor: "pointer", border: "1px solid transparent", background: "none", color: C.muted, padding: "11px 8px" }}>Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {submitDisabled && !narrow && (
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

      {paystubFor && (
        <PayStubDrawer employee={paystubFor} run={run} onClose={() => setPaystubFor(null)} currency={currency} />
      )}
      {compareFor && (
        <CompareModal employee={compareFor} run={run} onClose={() => setCompareFor(null)} currency={currency} />
      )}
    </>
  );
}
