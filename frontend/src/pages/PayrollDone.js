import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { HelpCircle, X, Check, CreditCard, Receipt, ChevronDown, Search } from "lucide-react";

const FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

const C = {
  ink: "#12262B", teal: "#15A08C", tealDark: "#0F8474", tealInk: "#0E8A78", tealSoft: "#E3F4F0",
  text: "#1B2533", muted: "#66748B", faint: "#94A0B2", line: "#E7EAF0", lineSoft: "#F1F3F7",
  surface: "#F4F6F8",
};

const num = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1' };

const fmtMoney = (amount, currency = "CAD") =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount || 0));

// TODO: replace PLACEHOLDER_RUN with a fetch by payRunId once the finalized-run API is live.
const PLACEHOLDER_RUN = {
  schedule: "Semi-monthly: 15th and End of Month",
  periodLabel: "15 Jun to 30 Jun", payDate: "30/06/2026", deliverBy: "Tuesday, 30 Jun",
  employeesPaid: 1, employeeTakeHome: 24.59, totalCost: 25.57,
  chequeCount: 1, depositCount: 0, employeeTax: 0.41, employerTax: 0.57, agency: "CRA", currency: "CAD",
  employees: [{
    id: "emp-1", name: "Kemanzi, Claire", paymentMethod: "Paper cheque", isCheque: true,
    netPay: 24.59, address: "8460 106A Avenue NW", addressLine2: "Edmonton, AB T5H 0S4",
    paidFrom: "BrightCare RBC Chequing", paidBy: "Cheque ($24.59)",
    grossPay: 25.00, employeeDeductions: 0.41, employerCost: 0.57,
    payLines: [{ type: "Regular Pay", hours: 1.00, rate: 25.00, current: 25.00, ytd: 2300.00 }],
    employeeTaxes: [
      { type: "Canada Pension Plan", current: 0.00, ytd: 118.01 },
      { type: "Employment Insurance", current: 0.41, ytd: 37.50 },
      { type: "Income Tax", current: 0.00, ytd: 156.77 },
      { type: "Second Canada Pension Plan", current: 0.00, ytd: 0.00 },
    ],
    employerContributions: [
      { type: "Employment Insurance Employer", current: 0.57, ytd: 52.50 },
      { type: "Canada Pension Plan Employer", current: 0.00, ytd: 118.01 },
      { type: "Second Canada Pension Plan Employer", current: 0.00, ytd: 0.00 },
    ],
  }],
};

export default function PayrollDone() {
  const navigate = useNavigate();
  const { payRunId } = useParams();
  const location = useLocation();

  const run = location.state?.runData || PLACEHOLDER_RUN;
  const currency = run.currency || "CAD";

  const [activePaystub, setActivePaystub] = useState(null);
  const [chequeNumbers, setChequeNumbers] = useState({});
  const [sectionsOpen, setSectionsOpen] = useState({ pay: true, employee: true, employer: true });
  const [memo, setMemo] = useState("");

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && activePaystub) setActivePaystub(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activePaystub]);

  useEffect(() => {
    document.body.style.overflow = activePaystub ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activePaystub]);

  const totalRemittance = (run.employeeTax || 0) + (run.employerTax || 0);
  const empWord = run.employeesPaid === 1 ? "employee" : "employees";
  const chequeWord = run.chequeCount === 1 ? "cheque" : "cheques";

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: FONT, color: C.text, paddingTop: 0, paddingBottom: 140, overflowY: "auto" }}>
      <div style={{ maxWidth: 1640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderBottom: "1px solid " + C.line, background: "#fff", position: "sticky", top: 0, zIndex: 4 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>Run payroll</div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: C.ink, margin: 0 }}>{run.schedule}</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={iconBtnStyle} title="Help"><HelpCircle size={17} /></button>
            <button style={iconBtnStyle} title="Close" onClick={() => navigate("/payroll")}><X size={16} /></button>
          </div>
        </div>

        <div style={{ background: "linear-gradient(180deg, #F0FAF7, " + C.surface + ")", padding: "46px 40px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.teal, display: "grid", placeItems: "center", flex: "0 0 64px", boxShadow: "0 8px 24px rgba(21,160,140,0.32)" }}>
              <Check size={32} color="#fff" strokeWidth={3} />
            </div>
            <div>
              <h2 style={{ fontSize: 30, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em", margin: 0 }}>Payroll is done!</h2>
              <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>You paid {run.employeesPaid} {empWord} for the {run.periodLabel} pay period.</div>
            </div>
          </div>
          {run.chequeCount > 0 ? (
            <div style={pillStyle}>
              <div style={pillTitleStyle}><CreditCard size={16} color={C.tealInk} />{run.chequeCount} {chequeWord} to write</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>Deliver to your {empWord} by <b style={{ color: C.ink, fontWeight: 600 }}>{run.deliverBy}</b>.</div>
            </div>
          ) : (
            <div style={pillStyle}>
              <div style={pillTitleStyle}><CreditCard size={16} color={C.tealInk} />Direct deposits on the way</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>Arriving by <b style={{ color: C.ink, fontWeight: 600 }}>{run.deliverBy}</b>.</div>
            </div>
          )}
        </div>

        <div style={{ padding: "28px 40px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 26 }}>
            <Tile k="Employees paid" v={run.employeesPaid} />
            <Tile k="Employee take-home" v={fmtMoney(run.employeeTakeHome, currency)} />
            <Tile k="Total payroll cost" v={fmtMoney(run.totalCost, currency)} />
            <Tile k="Pay date" v={run.payDate} />
          </div>

          <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 14, padding: "6px 4px", marginBottom: 28, overflow: "hidden" }}>
            {run.chequeCount > 0 && (
              <NextRow Icon={CreditCard} title={"Write " + run.chequeCount + " " + chequeWord}
                detail={<>Deliver the cheque to your {empWord} by <b style={{ color: C.ink, fontWeight: 600 }}>{run.deliverBy}</b>. Enter the cheque number in the table below.</>}
                actions={<><button style={btnGhost}>Print pay stubs</button><button style={btnText}>Set up cheque printing</button></>} />
            )}
            <NextRow Icon={Receipt} title={"Remit " + fmtMoney(totalRemittance, currency) + " in taxes to " + run.agency}
              detail={<>{fmtMoney(run.employeeTax, currency)} withheld from the {empWord} plus {fmtMoney(run.employerTax, currency)} in employer contributions. Novala tracks this on your payroll liabilities.</>}
              actions={<button style={btnText}>View liabilities</button>} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 2px 12px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.ink, margin: 0 }}>Paid this run</h3>
          </div>
          <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 2px rgba(16,26,43,0.04)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: "left", width: 40 }}></th>
                  <th style={{ ...thStyle, textAlign: "left" }}>Name ({run.employeesPaid} of {run.employees.length})</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>Payment method</th>
                  <th style={thStyle}>Net pay</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>Cheque number</th>
                </tr>
              </thead>
              <tbody>
                {run.employees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ ...tdStyle, textAlign: "left" }}>
                      <span style={{ width: 18, height: 18, borderRadius: 5, border: "1.5px solid " + C.teal, background: C.teal, display: "inline-grid", placeItems: "center" }}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "left" }}><span style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>{emp.name}</span></td>
                    <td style={{ ...tdStyle, textAlign: "left" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: "#EEF1F5", color: "#51627A" }}>{emp.paymentMethod}</span>
                    </td>
                    <td style={{ ...tdStyle, ...num }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                        {fmtMoney(emp.netPay, currency)}
                        <button onClick={() => setActivePaystub(emp)} title="View paystub" aria-label="View paystub"
                          style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid " + C.line, background: "#fff", color: C.muted, cursor: "pointer", display: "inline-grid", placeItems: "center" }}>
                          <Search size={15} />
                        </button>
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "left" }}>
                      {emp.isCheque && (
                        <input value={chequeNumbers[emp.id] || ""} onChange={(e) => setChequeNumbers((s) => ({ ...s, [emp.id]: e.target.value }))} placeholder="Cheque number"
                          style={{ width: 150, border: "1px solid " + C.line, borderRadius: 9, padding: "8px 11px", fontFamily: FONT, fontSize: 13.5, color: C.ink }} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "#fff", borderTop: "1px solid " + C.line, padding: "16px 40px 16px 280px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 5, boxShadow: "0 -4px 16px rgba(16,26,43,0.05)" }}>
        <button style={btnGhost}>Download payroll reports</button>
        <button style={btnPrimary} onClick={() => navigate("/payroll")}>Done</button>
      </div>

      {activePaystub && <PaystubOverlay emp={activePaystub} run={run} currency={currency}
        sectionsOpen={sectionsOpen} toggleSection={(k) => setSectionsOpen((s) => ({ ...s, [k]: !s[k] }))}
        memo={memo} setMemo={setMemo} onClose={() => setActivePaystub(null)} />}
    </div>
  );
}

function Tile({ k, v }) {
  return (
    <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 2px rgba(16,26,43,0.03)" }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: C.faint, marginBottom: 8 }}>{k}</div>
      <div style={{ fontSize: 23, fontWeight: 600, color: C.ink, letterSpacing: "-0.01em", ...num }}>{v}</div>
    </div>
  );
}

function NextRow({ Icon, title, detail, actions }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: "1px solid " + C.lineSoft }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: C.tealSoft, color: C.tealInk, display: "grid", placeItems: "center", flex: "0 0 38px" }}>
        <Icon size={19} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{title}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 1 }}>{detail}</div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{actions}</div>
    </div>
  );
}

function PaystubOverlay({ emp, run, currency, sectionsOpen, toggleSection, memo, setMemo, onClose }) {
  const sumCurrent = (rows) => rows.reduce((s, r) => s + (r.current || 0), 0);
  const sumYtd = (rows) => rows.reduce((s, r) => s + (r.ytd || 0), 0);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, height: "100vh", background: "#fff", zIndex: 9999, display: "flex", flexDirection: "column", fontFamily: FONT }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 40px", borderBottom: "1px solid " + C.line, background: "#FBFCFD" }}>
        <button style={iconBtnStyle} title="Help"><HelpCircle size={16} /></button>
        <button style={iconBtnStyle} title="Close" onClick={onClose}><X size={16} /></button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "34px 40px 40px", maxWidth: 1280, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>Pay to</div>
            <div style={{ fontSize: 30, fontWeight: 600, color: C.ink, letterSpacing: "-0.015em" }}>{emp.name}</div>
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>Net pay</div>
              <div style={{ fontSize: 36, fontWeight: 600, color: C.ink, lineHeight: 1, letterSpacing: "-0.02em", ...num }}>{fmtMoney(emp.netPay, currency)}</div>
            </div>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 10, border: "1px solid " + C.line, borderRadius: 9, padding: "8px 14px", fontSize: 13.5, fontWeight: 500, background: "#fff", cursor: "pointer", color: C.text }}>
              Make adjustment <ChevronDown size={14} color={C.faint} />
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: "18px 26px", margin: "26px 0", padding: "22px 0", borderTop: "1px solid " + C.lineSoft, borderBottom: "1px solid " + C.lineSoft }}>
          <MetaCell k="Employee address" v={emp.address} l2={emp.addressLine2} />
          <MetaCell k="Pay date" v={run.payDate} numFmt />
          <MetaCell k="Pay period" v={run.periodLabel} numFmt />
          <MetaCell k="Paid from" v={emp.paidFrom} />
          <MetaCell k="Paid by" v={emp.paidBy} />
        </div>

        <div style={{ margin: "0 0 12px", background: "linear-gradient(180deg, #FBFEFD, #F4FAF8)", border: "1px solid " + C.tealSoft, borderRadius: 13, padding: "18px 22px", maxWidth: 520 }}>
          <SumRow label="Gross pay" value={fmtMoney(emp.grossPay, currency)} />
          <SumRow label={"Employee taxes \u0026 deductions"} value={"- " + fmtMoney(emp.employeeDeductions, currency)} />
          <div style={{ height: 1, background: C.tealSoft, margin: "8px 0" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 15, color: C.ink, fontWeight: 600, padding: "5px 0" }}>
            <span>Net pay</span>
            <span style={{ fontSize: 20, color: C.tealInk, fontWeight: 600, ...num }}>{fmtMoney(emp.netPay, currency)}</span>
          </div>
          <div style={{ fontSize: 12, color: C.faint, marginTop: 9 }}>
            Employer cost this run: {fmtMoney(emp.employerCost, currency)}, paid by you and not deducted from the employee's pay.
          </div>
        </div>

        <Section title="Pay" open={sectionsOpen.pay} onToggle={() => toggleSection("pay")}>
          <SectionTable cols={["Type", "Hours", "Rate", "Current", "YTD"]}
            rows={emp.payLines.map((r) => [r.type, Number(r.hours).toFixed(2), fmtMoney(r.rate, currency), fmtMoney(r.current, currency), fmtMoney(r.ytd, currency)])}
            totals={["Total", "", "", fmtMoney(emp.payLines.reduce((s, r) => s + r.current, 0), currency), fmtMoney(emp.payLines.reduce((s, r) => s + r.ytd, 0), currency)]} />
        </Section>

        <Section title={"Employee taxes \u0026 deductions"} open={sectionsOpen.employee} onToggle={() => toggleSection("employee")}>
          <SectionTable cols={["Type", "Current", "YTD"]}
            rows={emp.employeeTaxes.map((r) => [r.type, fmtMoney(r.current, currency), fmtMoney(r.ytd, currency)])}
            totals={["Total", fmtMoney(sumCurrent(emp.employeeTaxes), currency), fmtMoney(sumYtd(emp.employeeTaxes), currency)]} />
        </Section>

        <Section title={"Employer taxes \u0026 contributions"} open={sectionsOpen.employer} onToggle={() => toggleSection("employer")}>
          <SectionTable cols={["Type", "Current", "YTD"]}
            rows={emp.employerContributions.map((r) => [r.type, fmtMoney(r.current, currency), fmtMoney(r.ytd, currency)])}
            totals={["Total", fmtMoney(sumCurrent(emp.employerContributions), currency), fmtMoney(sumYtd(emp.employerContributions), currency)]} />
        </Section>

        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, margin: "30px 0 8px" }}>Memo</div>
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Add a note to this paystub"
          style={{ width: "100%", maxWidth: 520, minHeight: 90, border: "1px solid " + C.line, borderRadius: 11, padding: "12px 14px", fontFamily: FONT, fontSize: 13.5, color: C.ink, resize: "vertical" }} />
      </div>

      <div style={{ borderTop: "1px solid " + C.line, padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
        <button style={{ ...btnText, color: C.muted }} onClick={onClose}>Close</button>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={btnGhost}>Transaction journal</button>
          <button style={btnPrimary}>Print</button>
        </div>
      </div>
    </div>
  );
}

function MetaCell({ k, v, l2, numFmt }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: C.faint, marginBottom: 5 }}>{k}</div>
      <div style={{ fontSize: 14, color: C.ink, fontWeight: 500, ...(numFmt ? num : {}) }}>
        {v}
        {l2 && <span style={{ display: "block", fontWeight: 450, color: C.muted, marginTop: 1 }}>{l2}</span>}
      </div>
    </div>
  );
}

function SumRow({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13.5, color: C.muted, padding: "5px 0" }}>
      <span>{label}</span>
      <span style={{ fontWeight: 600, color: C.ink, ...num }}>{value}</span>
    </div>
  );
}

function Section({ title, open, onToggle, children }) {
  return (
    <div style={{ marginTop: 30 }}>
      <h3 onClick={onToggle} style={{ fontSize: 16, fontWeight: 600, color: C.ink, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none", margin: 0 }}>
        <ChevronDown size={18} color={C.muted} style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform 0.2s" }} />
        {title}
      </h3>
      {open && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
}

function SectionTable({ cols, rows, totals }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
      <thead>
        <tr>{cols.map((c, i) => (
          <th key={i} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: C.faint, padding: "10px 14px", textAlign: i === 0 ? "left" : "right", borderBottom: "1px solid " + C.line }}>{c}</th>
        ))}</tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri}>{r.map((cell, ci) => (
            <td key={ci} style={{ padding: "13px 14px", textAlign: ci === 0 ? "left" : "right", borderBottom: "1px solid " + C.lineSoft, color: ci === 0 ? C.ink : C.text, ...(ci > 0 ? num : {}) }}>{cell}</td>
          ))}</tr>
        ))}
        <tr>{totals.map((cell, ci) => (
          <td key={ci} style={{ padding: "13px 14px", textAlign: ci === 0 ? "left" : "right", fontWeight: 700, color: C.ink, background: "#FAFBFC", ...(ci > 0 ? num : {}) }}>{cell}</td>
        ))}</tr>
      </tbody>
    </table>
  );
}

const iconBtnStyle = { width: 34, height: 34, borderRadius: 9, border: "1px solid " + C.line, background: "#fff", color: C.muted, cursor: "pointer", display: "grid", placeItems: "center" };
const pillStyle = { background: "#fff", border: "1px solid " + C.line, borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 2px rgba(16,26,43,0.04)" };
const pillTitleStyle = { fontSize: 13, fontWeight: 600, color: C.ink, display: "flex", alignItems: "center", gap: 8 };
const thStyle = { textAlign: "right", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: C.faint, padding: "13px 20px", background: "#FAFBFC", borderBottom: "1px solid " + C.line, whiteSpace: "nowrap" };
const tdStyle = { padding: "16px 20px", borderBottom: "1px solid " + C.lineSoft, textAlign: "right", color: C.text, whiteSpace: "nowrap" };
const btnGhost = { fontFamily: FONT, fontWeight: 600, fontSize: 14, borderRadius: 10, cursor: "pointer", border: "1px solid " + C.line, background: "#fff", color: C.ink, padding: "9px 16px" };
const btnPrimary = { fontFamily: FONT, fontWeight: 600, fontSize: 14, borderRadius: 10, cursor: "pointer", border: "1px solid transparent", background: C.teal, color: "#fff", padding: "9px 18px", boxShadow: "0 1px 2px rgba(21,160,140,0.3)" };
const btnText = { fontFamily: FONT, fontWeight: 600, fontSize: 14, borderRadius: 10, cursor: "pointer", border: "1px solid transparent", background: "none", color: C.tealInk, padding: "10px 6px" };
