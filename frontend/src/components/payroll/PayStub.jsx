import React from "react";

// PayStub
// QuickBooks-style pay stub, Novala teal theme.
// Inline styles only, no new dependencies. JSX double quotes.
// All money and hour values come in as raw numbers/strings; formatted here.

const TEAL = "#15A08C";
const BRAND_DARK = "#0B7377";
const PAPER = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const LINE = "#E5E7EB";
const RULE = "#1A1A1A";
const DASH = "#C9CDD2";
const MINT_BG = "#E1F5EE";
const MINT_TEXT = "#0B7377";

// money(1667.9, true)  => "$1,667.90"
// money(2000)          => "2,000.00"
// money(-462.1, true)  => "-$462.10"
const money = (value, symbol = false) => {
  const n = Number(value) || 0;
  const body = Math.abs(n).toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = n < 0 ? "-" : "";
  return symbol ? sign + "$" + body : sign + body;
};

// num(80) => "80.00" (hours, rate)
const num = (value) => {
  const n = Number(value) || 0;
  return n.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// formatDate("2026-06-30") => "30-06-2026"
const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return dd + "-" + mm + "-" + yyyy;
};

const styles = {
  paper: {
    background: PAPER,
    border: "1px solid " + LINE,
    maxWidth: "640px",
    margin: "0 auto",
    fontFamily: "Inter, 'Plus Jakarta Sans', sans-serif",
    fontSize: "12px",
    color: INK,
    lineHeight: 1.5,
  },
  bar: { height: "8px", background: TEAL },
  label: { fontWeight: 600, letterSpacing: "0.3px" },
  addrMuted: { color: MUTED },
  colHead: { textAlign: "right", fontWeight: 600 },
  colHeadLeft: { textAlign: "left", fontWeight: 600 },
  ruleRow: { borderBottom: "1px solid " + RULE },
};

/**
 * PayStub
 * -------
 * Renders a single pay stub for one employee for one pay run.
 *
 * Expects data prop shape (from GET /paycheques/{id}):
 * {
 *   employer: { name, address_street, address_city, address_province, address_postal_code },
 *   employee_name, employee_address,
 *   pay_period_start, pay_period_end, pay_date,
 *   pay: { lines: [{type, hours, rate, current, ytd}], total: {current, ytd} },
 *   employee_taxes: { lines: [{type, current, ytd}], total: {current, ytd} },
 *   deductions_contributions: { lines: [], total: null },
 *   net_pay,
 *   memo
 * }
 */
export default function PayStub({ data }) {
  if (!data) return null;

  const employer = data.employer || {};
  const employerName = employer.name || "";

  // Format employer address as "street" and "city province postal"
  const employerLine1 = employer.address_street || "";
  const employerCityProvPostal = [
    employer.address_city,
    employer.address_province,
    employer.address_postal_code,
  ].filter(Boolean).join(" ");
  const employerLine2 = employerCityProvPostal;

  // Employee address - already newline-joined from backend
  const empAddress = data.employee_address || "";
  const empAddrLines = empAddress.split("\n").filter(Boolean);
  const empLine1 = empAddrLines[0] || "";
  const empLine2 = empAddrLines[1] || "";

  // Pay period display
  const periodBeginning = formatDate(data.pay_period_start);
  const periodEnding = formatDate(data.pay_period_end);
  const payDate = formatDate(data.pay_date);

  // Total hours - sum from pay lines
  const totalHours = (data.pay && data.pay.lines || []).reduce((sum, line) => {
    return sum + (Number(line.hours) || 0);
  }, 0);

  const netPay = Number(data.net_pay) || 0;
  const memo = data.memo;
  const hasMemo = memo && memo.trim && memo.trim().length > 0;

  // Earnings, taxes, deductions
  const earnings = (data.pay && data.pay.lines) || [];
  const taxes = (data.employee_taxes && data.employee_taxes.lines) || [];
  const deductions = (data.deductions_contributions && data.deductions_contributions.lines) || [];

  // Summary values
  const totalPayCurrent = Number(data.pay && data.pay.total && data.pay.total.current) || 0;
  const totalPayYtd = Number(data.pay && data.pay.total && data.pay.total.ytd) || 0;
  const taxesCurrent = Number(data.employee_taxes && data.employee_taxes.total && data.employee_taxes.total.current) || 0;
  const taxesYtd = Number(data.employee_taxes && data.employee_taxes.total && data.employee_taxes.total.ytd) || 0;
  const deductionsCurrent = Number(data.deductions_contributions && data.deductions_contributions.total && data.deductions_contributions.total.current) || 0;
  const deductionsYtd = Number(data.deductions_contributions && data.deductions_contributions.total && data.deductions_contributions.total.ytd) || 0;

  return (
    <div style={styles.paper}>
      <div style={styles.bar} />

      {/* Check-stub header */}
      <div style={{ padding: "20px 28px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{employerName}</div>
            {employerLine1 && <div style={styles.addrMuted}>{employerLine1}</div>}
            {employerLine2 && <div style={styles.addrMuted}>{employerLine2}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 600 }}>Pay Stub Detail</div>
            <div style={styles.addrMuted}>PAY DATE: {payDate}</div>
            <div style={styles.addrMuted}>NET PAY: {money(netPay, true)}</div>
          </div>
        </div>
        <div style={{ marginTop: "22px" }}>
          <div style={{ fontWeight: 600 }}>{data.employee_name}</div>
          {empLine1 && <div style={styles.addrMuted}>{empLine1}</div>}
          {empLine2 && <div style={styles.addrMuted}>{empLine2}</div>}
        </div>
      </div>

      <div style={{ ...styles.bar, marginTop: "12px" }} />

      {/* Detail block */}
      <div style={{ padding: "22px 28px 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "24px" }}>
          <div style={{ flex: 1 }}>
            <div style={styles.label}>EMPLOYER</div>
            <div>{employerName}</div>
            {employerLine1 && <div style={styles.addrMuted}>{employerLine1}</div>}
            {employerLine2 && <div style={styles.addrMuted}>{employerLine2}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.label}>PAY PERIOD</div>
            <table style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <td style={{ color: MUTED, padding: "1px 0" }}>Period Beginning</td>
                  <td style={{ textAlign: "right" }}>{periodBeginning}</td>
                </tr>
                <tr>
                  <td style={{ color: MUTED, padding: "1px 0" }}>Period Ending</td>
                  <td style={{ textAlign: "right" }}>{periodEnding}</td>
                </tr>
                <tr>
                  <td style={{ color: MUTED, padding: "1px 0" }}>Pay Date</td>
                  <td style={{ textAlign: "right" }}>{payDate}</td>
                </tr>
                <tr>
                  <td style={{ color: MUTED, padding: "1px 0" }}>Total Hours</td>
                  <td style={{ textAlign: "right" }}>{num(totalHours)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: "18px" }}>
          <div style={styles.label}>EMPLOYEE</div>
          <div>{data.employee_name}</div>
          {empLine1 && <div style={styles.addrMuted}>{empLine1}</div>}
          {empLine2 && <div style={styles.addrMuted}>{empLine2}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "8px" }}>
          <div style={styles.label}>NET PAY:</div>
          <div style={{ fontWeight: 600 }}>{money(netPay, true)}</div>
        </div>

        {hasMemo && (
          <div style={{ marginTop: "14px", ...styles.label }}>MEMO: {memo}</div>
        )}
      </div>

      <div style={{ borderTop: "1px dashed " + DASH, marginTop: "16px" }} />

      {/* Earnings / taxes / summary grid */}
      <div style={{ padding: "18px 28px 24px", display: "flex", gap: "28px" }}>
        {/* Left column: PAY + TAXES */}
        <div style={{ flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={styles.ruleRow}>
                <th style={{ ...styles.colHeadLeft, paddingBottom: "4px" }}>PAY</th>
                <th style={styles.colHead}>Hours</th>
                <th style={styles.colHead}>Rate</th>
                <th style={styles.colHead}>Current</th>
                <th style={styles.colHead}>YTD</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((row, i) => (
                <tr key={"pay-" + i}>
                  <td style={{ paddingTop: i === 0 ? "5px" : 0 }}>{row.type || row.label}</td>
                  <td style={{ textAlign: "right" }}>{num(row.hours)}</td>
                  <td style={{ textAlign: "right" }}>{num(row.rate)}</td>
                  <td style={{ textAlign: "right" }}>{money(row.current)}</td>
                  <td style={{ textAlign: "right" }}>{money(row.ytd)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "48px" }}>
            <thead>
              <tr style={styles.ruleRow}>
                <th style={{ ...styles.colHeadLeft, paddingBottom: "4px" }}>TAXES</th>
                <th style={styles.colHead}>Current</th>
                <th style={styles.colHead}>YTD</th>
              </tr>
            </thead>
            <tbody>
              {taxes.map((row, i) => (
                <tr key={"tax-" + i}>
                  <td style={{ paddingTop: i === 0 ? "5px" : 0 }}>{row.type || row.label}</td>
                  <td style={{ textAlign: "right" }}>{money(row.current)}</td>
                  <td style={{ textAlign: "right" }}>{money(row.ytd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column: DEDUCTIONS + SUMMARY + Net Pay bar */}
        <div style={{ flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={styles.ruleRow}>
                <th style={{ ...styles.colHeadLeft, paddingBottom: "4px" }}>DEDUCTIONS</th>
                <th style={styles.colHead}>Current</th>
                <th style={styles.colHead}>YTD</th>
              </tr>
            </thead>
            <tbody>
              {deductions.length === 0 ? (
                <tr>
                  <td style={{ paddingTop: "5px", color: FAINT }}>None</td>
                  <td />
                  <td />
                </tr>
              ) : (
                deductions.map((row, i) => (
                  <tr key={"ded-" + i}>
                    <td style={{ paddingTop: i === 0 ? "5px" : 0 }}>{row.type || row.label}</td>
                    <td style={{ textAlign: "right" }}>{money(row.current)}</td>
                    <td style={{ textAlign: "right" }}>{money(row.ytd)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ marginTop: "48px", border: "1px solid " + RULE }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={styles.ruleRow}>
                  <th style={{ textAlign: "left", fontWeight: 600, padding: "5px 10px" }}>SUMMARY</th>
                  <th style={{ textAlign: "right", fontWeight: 600, padding: "5px 10px" }}>Current</th>
                  <th style={{ textAlign: "right", fontWeight: 600, padding: "5px 10px" }}>YTD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "3px 10px" }}>Total Pay</td>
                  <td style={{ textAlign: "right", padding: "3px 10px" }}>{money(totalPayCurrent, true)}</td>
                  <td style={{ textAlign: "right", padding: "3px 10px" }}>{money(totalPayYtd, true)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 10px" }}>Taxes</td>
                  <td style={{ textAlign: "right", padding: "3px 10px" }}>{money(taxesCurrent, true)}</td>
                  <td style={{ textAlign: "right", padding: "3px 10px" }}>{money(taxesYtd, true)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 10px" }}>Deductions</td>
                  <td style={{ textAlign: "right", padding: "3px 10px" }}>{money(deductionsCurrent, true)}</td>
                  <td style={{ textAlign: "right", padding: "3px 10px" }}>{money(deductionsYtd, true)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "10px",
            padding: "8px 10px",
            background: MINT_BG,
          }}>
            <span style={{ fontWeight: 600, color: MINT_TEXT }}>Net Pay</span>
            <span style={{ fontWeight: 600, color: MINT_TEXT }}>{money(netPay, true)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}