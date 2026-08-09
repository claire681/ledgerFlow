import React from "react";
// PayStub - Novala canonical pay stub component (STACKED FULL-WIDTH LAYOUT)
// Letter proportion (816 x 1056), Inter, tabular numerals.

const TEAL = "#15A08C";
const PAPER = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "#6B7280";
const LINE = "#E5E7EB";
const DASH = "#C9CDD2";
const MINT_BG = "#E1F5EE";
const MINT_TEXT = "#0B7377";
const HEADER_INK = "#12262B";

const money = (value, symbol = false) => {
  const n = Number(value) || 0;
  const body = Math.abs(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sign = n < 0 ? "-" : "";
  return sign + (symbol ? "$" : "") + body;
};

const num = (value) => {
  const n = Number(value) || 0;
  return n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

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
    width: 816,
    minHeight: 1056,
    background: PAPER,
    color: INK,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 12,
    fontVariantNumeric: "tabular-nums lining-nums",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    margin: "0 auto",
    boxSizing: "border-box",
    position: "relative",
    padding: "0 0 40px",
  },
  bar: { height: 9, background: TEAL },
  content: { padding: "32px 44px 0" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: HEADER_INK,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  columnLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: HEADER_INK,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  headerRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 32,
    marginBottom: 24,
  },
  bold: { fontWeight: 700, color: INK, fontSize: 14 },
  muted: { color: MUTED, fontSize: 11, lineHeight: 1.5 },
  dashed: { borderTop: "1px dashed " + DASH, margin: "24px 0 28px" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
    marginBottom: 26,
  },
  th: {
    textAlign: "left",
    padding: "8px 0",
    borderBottom: "1px solid " + LINE,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: MUTED,
    textTransform: "uppercase",
  },
  thRight: {
    textAlign: "right",
    padding: "8px 0",
    borderBottom: "1px solid " + LINE,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: MUTED,
    textTransform: "uppercase",
  },
  td: { padding: "10px 0", color: INK },
  tdRight: { padding: "10px 0", color: INK, textAlign: "right" },
  totalRow: { borderTop: "1px solid " + LINE },
  totalCell: { padding: "10px 0", color: INK, fontWeight: 700 },
  totalCellRight: { padding: "10px 0", color: INK, fontWeight: 700, textAlign: "right" },
  summaryBox: {
    border: "1px solid " + LINE,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 20,
  },
  summaryRow: {
    padding: "14px 20px",
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid " + LINE,
    fontSize: 13,
  },
  summaryRowLast: {
    padding: "18px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: MINT_BG,
  },
  summaryLabel: { color: INK, fontSize: 13 },
  summaryValue: { color: INK, fontWeight: 700, fontSize: 13 },
  netLabel: {
    color: MINT_TEXT,
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  netValue: {
    color: MINT_TEXT,
    fontWeight: 700,
    fontSize: 22,
    fontVariantNumeric: "tabular-nums lining-nums",
  },
  footer: {
    fontSize: 11,
    color: MUTED,
    textAlign: "right",
    marginTop: 12,
  },
  memoBox: {
    marginTop: 24,
    padding: "12px 16px",
    background: "#F9FAFB",
    border: "1px solid " + LINE,
    borderRadius: 6,
  },
  memoLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: MUTED,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  memoText: { fontSize: 12, color: INK, fontStyle: "italic" },
};

export default function PayStub({ data }) {
  if (!data) return null;

  const employer = data.employer || {};
  const employerName = employer.name || data.employer_name || "";
  const employerStreet = employer.address_street || "";
  const employerCityLine = [employer.address_city, employer.address_province, employer.address_postal_code]
    .filter(Boolean).join(" ");

  const empName = data.employee_name || "";
  const empAddrLines = String(data.employee_address || "").split("\n").filter(Boolean);
  const empLine1 = empAddrLines[0] || "";
  const empLine2 = empAddrLines[1] || "";

  const periodBeginning = formatDate(data.pay_period_start);
  const periodEnding = formatDate(data.pay_period_end);
  const payDate = formatDate(data.pay_date);

  const payLines = (data.pay && data.pay.lines) || [];
  const taxLines = (data.employee_taxes && data.employee_taxes.lines) || [];
  const deductLines = (data.deductions_contributions && data.deductions_contributions.lines) || [];

  const payTotal = (data.pay && data.pay.total) || { current: 0, ytd: 0 };
  const taxTotal = (data.employee_taxes && data.employee_taxes.total) || { current: 0, ytd: 0 };
  const deductTotal = (data.deductions_contributions && data.deductions_contributions.total) || { current: 0, ytd: 0 };

  const netPay = data.net_pay;
  const memo = data.memo || "";
  const hasMemo = String(memo).trim().length > 0;

  const method = (data.payment_method || data.pay_method || "").toLowerCase();
  const isCheque = method.includes("cheque") || method.includes("check");
  const chequeNo = data.cheque_number;

  return (
    <div style={styles.paper}>
      {/* Teal bar top */}
      <div style={styles.bar} />

      <div style={styles.content}>
        {/* Three column header */}
        <div style={styles.headerRow}>
          <div>
            <div style={styles.columnLabel}>Employer</div>
            <div style={styles.bold}>{employerName}</div>
            {employerStreet && <div style={styles.muted}>{employerStreet}</div>}
            {employerCityLine && <div style={styles.muted}>{employerCityLine}</div>}
          </div>
          <div>
            <div style={styles.columnLabel}>Pay period</div>
            <div style={{ fontSize: 13, color: INK, marginBottom: 4 }}>
              {periodBeginning && periodEnding ? periodBeginning + " - " + periodEnding : (periodBeginning || periodEnding || "")}
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>
              Pay date: <strong style={{ color: INK }}>{payDate}</strong>
            </div>
          </div>
          <div>
            <div style={styles.columnLabel}>Employee</div>
            <div style={styles.bold}>{empName}</div>
            {empLine1 && <div style={styles.muted}>{empLine1}</div>}
            {empLine2 && <div style={styles.muted}>{empLine2}</div>}
          </div>
        </div>

        <div style={styles.dashed} />

        {/* PAY table - full width */}
        {payLines.length > 0 && (
          <div>
            <div style={styles.sectionLabel}>Pay</div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.thRight}>Hours</th>
                  <th style={styles.thRight}>Rate</th>
                  <th style={styles.thRight}>Current</th>
                  <th style={styles.thRight}>YTD</th>
                </tr>
              </thead>
              <tbody>
                {payLines.map(function(l, i) {
                  return (
                    <tr key={i}>
                      <td style={styles.td}>{l.label || l.type || ""}</td>
                      <td style={styles.tdRight}>{l.hours != null ? num(l.hours) : ""}</td>
                      <td style={styles.tdRight}>{l.rate != null ? money(l.rate, true) : ""}</td>
                      <td style={styles.tdRight}>{money(l.current, true)}</td>
                      <td style={styles.tdRight}>{money(l.ytd, true)}</td>
                    </tr>
                  );
                })}
                <tr style={styles.totalRow}>
                  <td style={styles.totalCell}>Total gross</td>
                  <td></td>
                  <td></td>
                  <td style={styles.totalCellRight}>{money(payTotal.current, true)}</td>
                  <td style={styles.totalCellRight}>{money(payTotal.ytd, true)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TAXES table - full width */}
        {taxLines.length > 0 && (
          <div>
            <div style={styles.sectionLabel}>Taxes</div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.thRight}>Current</th>
                  <th style={styles.thRight}>YTD</th>
                </tr>
              </thead>
              <tbody>
                {taxLines.map(function(l, i) {
                  return (
                    <tr key={i}>
                      <td style={styles.td}>{l.label || l.type || ""}</td>
                      <td style={styles.tdRight}>{money(l.current, true)}</td>
                      <td style={styles.tdRight}>{money(l.ytd, true)}</td>
                    </tr>
                  );
                })}
                <tr style={styles.totalRow}>
                  <td style={styles.totalCell}>Total taxes</td>
                  <td style={styles.totalCellRight}>{money(taxTotal.current, true)}</td>
                  <td style={styles.totalCellRight}>{money(taxTotal.ytd, true)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* DEDUCTIONS table - full width */}
        {deductLines.length > 0 && (
          <div>
            <div style={styles.sectionLabel}>Deductions</div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.thRight}>Current</th>
                  <th style={styles.thRight}>YTD</th>
                </tr>
              </thead>
              <tbody>
                {deductLines.map(function(l, i) {
                  return (
                    <tr key={i}>
                      <td style={styles.td}>{l.label || l.type || ""}</td>
                      <td style={styles.tdRight}>{money(l.current, true)}</td>
                      <td style={styles.tdRight}>{money(l.ytd, true)}</td>
                    </tr>
                  );
                })}
                <tr style={styles.totalRow}>
                  <td style={styles.totalCell}>Total deductions</td>
                  <td style={styles.totalCellRight}>{money(deductTotal.current, true)}</td>
                  <td style={styles.totalCellRight}>{money(deductTotal.ytd, true)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* SUMMARY - full width */}
        <div style={styles.summaryBox}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Gross pay</span>
            <span style={styles.summaryValue}>{money(payTotal.current, true)}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Less: total taxes</span>
            <span style={styles.summaryLabel}>-{money(taxTotal.current, true)}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Less: total deductions</span>
            <span style={styles.summaryLabel}>-{money(deductTotal.current, true)}</span>
          </div>
          <div style={styles.summaryRowLast}>
            <span style={styles.netLabel}>Net pay</span>
            <span style={styles.netValue}>{money(netPay, true)}</span>
          </div>
        </div>

        {/* Payment method footer */}
        <div style={styles.footer}>
          Paid by <strong style={{ color: INK }}>{isCheque ? "Cheque" : "Direct deposit"}</strong>
          {isCheque && chequeNo ? (<span> &middot; Cheque no <strong style={{ color: INK }}>{chequeNo}</strong></span>) : null}
        </div>

        {/* Memo (if any) */}
        {hasMemo && (
          <div style={styles.memoBox}>
            <div style={styles.memoLabel}>Memo</div>
            <div style={styles.memoText}>{memo}</div>
          </div>
        )}
      </div>

      {/* Teal bar bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 9, background: TEAL }} />
    </div>
  );
}
