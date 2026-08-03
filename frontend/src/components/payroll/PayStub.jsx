import React from "react";

// PayStub - Novala canonical pay stub component
// Reference: mockup-paystub-asbuilt.html
// Letter proportion (816 x 1056 at screen scale), Inter, tabular numerals.

const TEAL = "#15A08C";
const PAPER = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "#6B7280";
const LINE = "#E5E7EB";
const DASH = "#C9CDD2";
const MINT_BG = "#E1F5EE";
const MINT_TEXT = "#0B7377";
const STAT_AMBER_BG = "#FEF6E7";

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
    width: "100%",
    maxWidth: "816px",
    minHeight: "1056px",
    margin: "0 auto",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "13px",
    color: INK,
    lineHeight: 1.5,
    boxShadow: "0 4px 20px rgba(16,26,43,.10)",
  },
  bar: { height: "9px", background: TEAL },
  label: { fontWeight: 700, letterSpacing: "0.3px", fontSize: "12.5px" },
  muted: { color: MUTED },
  rule: { borderBottom: "1px solid " + INK },
  n: { fontVariantNumeric: "tabular-nums" },
  thH: { fontWeight: 700, textAlign: "right", paddingBottom: "5px", fontSize: "12.5px" },
  thHL: { fontWeight: 700, textAlign: "left", paddingBottom: "5px", fontSize: "12.5px" },
};

export default function PayStub({ data }) {
  if (!data) return null;

  const employer = data.employer || {};
  const employerName = employer.name || "";
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

  const totalHours = payLines.reduce(function (sum, l) { return sum + (Number(l.hours) || 0); }, 0);
  const netPay = data.net_pay;
  const memo = data.memo || "";
  const hasMemo = String(memo).trim().length > 0;

  return (
    <div style={styles.paper}>

      {/* 3.1 Leading space */}
      <div style={{ height: "60px" }} />

      {/* 3.2 First teal bar */}
      <div style={styles.bar} />

      {/* 3.3 Header block */}
      <div style={{ padding: "22px 44px 26px", display: "flex", justifyContent: "space-between", gap: "24px" }}>
        <div>
          <div style={{ fontWeight: 700 }}>{employerName}</div>
          {employerStreet && <div style={styles.muted}>{employerStreet}</div>}
          {employerCityLine && <div style={styles.muted}>{employerCityLine}</div>}

          <div style={{ marginTop: "20px", fontWeight: 700 }}>{empName}</div>
          {empLine1 && <div style={styles.muted}>{empLine1}</div>}
          {empLine2 && <div style={styles.muted}>{empLine2}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700 }}>Pay Stub Detail</div>
          <div style={Object.assign({}, styles.muted, styles.n)}>PAY DATE: {payDate}</div>
          <div style={Object.assign({}, styles.muted, styles.n)}>NET PAY: {money(netPay, true)}</div>
        </div>
      </div>

      {/* 3.4 Second teal bar */}
      <div style={styles.bar} />

      {/* 3.5 Detail block */}
      <div style={{ padding: "26px 44px 4px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "36px" }}>
          <div style={{ flex: 1 }}>
            <div style={styles.label}>EMPLOYER</div>
            <div>{employerName}</div>
            {employerStreet && <div style={styles.muted}>{employerStreet}</div>}
            {employerCityLine && <div style={styles.muted}>{employerCityLine}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.label}>PAY PERIOD</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr><td style={styles.muted}>Period Beginning</td><td style={Object.assign({ textAlign: "right" }, styles.n)}>{periodBeginning}</td></tr>
                <tr><td style={styles.muted}>Period Ending</td><td style={Object.assign({ textAlign: "right" }, styles.n)}>{periodEnding}</td></tr>
                <tr><td style={styles.muted}>Pay Date</td><td style={Object.assign({ textAlign: "right" }, styles.n)}>{payDate}</td></tr>
                <tr><td style={styles.muted}>Total Hours</td><td style={Object.assign({ textAlign: "right" }, styles.n)}>{num(totalHours)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: "22px" }}>
          <div style={styles.label}>EMPLOYEE</div>
          <div>{empName}</div>
          {empLine1 && <div style={styles.muted}>{empLine1}</div>}
          {empLine2 && <div style={styles.muted}>{empLine2}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px", paddingTop: "8px" }}>
          <div style={styles.label}>NET PAY:</div>
          <div style={Object.assign({ fontWeight: 700 }, styles.n)}>{money(netPay, true)}</div>
        </div>

        {hasMemo && (
          <div style={Object.assign({ marginTop: "14px" }, styles.label)}>MEMO: {memo}</div>
        )}

      </div>

      {/* 3.6 Dashed separator */}
      <div style={{ borderTop: "1px dashed " + DASH, margin: "20px 44px 0" }} />

      {/* 3.7 Grid */}
      <div style={{ padding: "22px 44px 28px", display: "flex", gap: "36px" }}>

        {/* Left column */}
        <div style={{ flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={styles.rule}>
                <th style={styles.thHL}>PAY</th>
                <th style={styles.thH}>Hours</th>
                <th style={styles.thH}>Rate</th>
                <th style={styles.thH}>Current</th>
                <th style={styles.thH}>YTD</th>
              </tr>
            </thead>
            <tbody>
              {payLines.map(function (row, i) {
                const label = row.type || row.label || "";
                const isStat = /stat|holiday/i.test(label);
                const subtitle = row.holiday_name || row.subtitle || null;
                const baseCell = isStat
                  ? { background: STAT_AMBER_BG, padding: "10px 6px" }
                  : { paddingTop: i === 0 ? "6px" : "2px", paddingBottom: "2px" };
                return (
                  <tr key={"pay-" + i}>
                    <td style={baseCell}>
                      <div style={{ fontWeight: isStat ? 700 : "inherit", color: "#0E1A1A" }}>{label}</div>
                      {isStat && subtitle && (
                        <div style={{ fontSize: 11, color: "#0E1A1A", fontWeight: 700, marginTop: 2 }}>{subtitle}</div>
                      )}
                    </td>
                    <td style={Object.assign({}, baseCell, { textAlign: "right" }, styles.n)}>{num(row.hours)}</td>
                    <td style={Object.assign({}, baseCell, { textAlign: "right" }, styles.n)}>{num(row.rate)}</td>
                    <td style={Object.assign({}, baseCell, { textAlign: "right", fontWeight: isStat ? 700 : "inherit" }, styles.n)}>{money(row.current)}</td>
                    <td style={Object.assign({}, baseCell, { textAlign: "right" }, styles.n)}>{money(row.ytd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "56px" }}>
            <thead>
              <tr style={styles.rule}>
                <th style={styles.thHL}>TAXES</th>
                <th style={styles.thH}>Current</th>
                <th style={styles.thH}>YTD</th>
              </tr>
            </thead>
            <tbody>
              {taxLines.map(function (row, i) {
                const label = row.type || row.label || "";
                return (
                  <tr key={"tax-" + i}>
                    <td style={{ paddingTop: i === 0 ? "6px" : "2px", paddingBottom: "2px" }}>{label}</td>
                    <td style={Object.assign({ textAlign: "right", paddingTop: i === 0 ? "6px" : "2px", paddingBottom: "2px" }, styles.n)}>{money(row.current)}</td>
                    <td style={Object.assign({ textAlign: "right", paddingTop: i === 0 ? "6px" : "2px", paddingBottom: "2px" }, styles.n)}>{money(row.ytd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={styles.rule}>
                <th style={styles.thHL}>DEDUCTIONS</th>
                <th style={styles.thH}>Current</th>
                <th style={styles.thH}>YTD</th>
              </tr>
            </thead>
            <tbody>
              {deductLines.length === 0 ? (
                <tr>
                  <td style={Object.assign({ paddingTop: "6px" }, styles.muted)}>None</td>
                  <td></td>
                  <td></td>
                </tr>
              ) : deductLines.map(function (row, i) {
                const label = row.type || row.label || "";
                return (
                  <tr key={"ded-" + i}>
                    <td style={{ paddingTop: i === 0 ? "6px" : "2px", paddingBottom: "2px" }}>{label}</td>
                    <td style={Object.assign({ textAlign: "right", paddingTop: i === 0 ? "6px" : "2px", paddingBottom: "2px" }, styles.n)}>{money(row.current)}</td>
                    <td style={Object.assign({ textAlign: "right", paddingTop: i === 0 ? "6px" : "2px", paddingBottom: "2px" }, styles.n)}>{money(row.ytd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ border: "1px solid " + LINE, marginTop: "52px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid " + LINE }}>
                  <th style={Object.assign({}, styles.thHL, { padding: "9px 12px" })}>SUMMARY</th>
                  <th style={Object.assign({}, styles.thH, { padding: "9px 12px" })}>Current</th>
                  <th style={Object.assign({}, styles.thH, { padding: "9px 12px" })}>YTD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "6px 12px" }}>Total Pay</td>
                  <td style={Object.assign({ padding: "6px 12px", textAlign: "right" }, styles.n)}>{money(payTotal.current, true)}</td>
                  <td style={Object.assign({ padding: "6px 12px", textAlign: "right" }, styles.n)}>{money(payTotal.ytd, true)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 12px" }}>Taxes</td>
                  <td style={Object.assign({ padding: "6px 12px", textAlign: "right" }, styles.n)}>{money(taxTotal.current, true)}</td>
                  <td style={Object.assign({ padding: "6px 12px", textAlign: "right" }, styles.n)}>{money(taxTotal.ytd, true)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 12px" }}>Deductions</td>
                  <td style={Object.assign({ padding: "6px 12px", textAlign: "right" }, styles.n)}>{money((deductTotal && deductTotal.current) || 0, true)}</td>
                  <td style={Object.assign({ padding: "6px 12px", textAlign: "right" }, styles.n)}>{money((deductTotal && deductTotal.ytd) || 0, true)}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", background: MINT_BG, padding: "10px 12px" }}>
              <div style={{ fontWeight: 700, color: MINT_TEXT }}>Net Pay</div>
              <div style={Object.assign({ fontWeight: 700, color: MINT_TEXT }, styles.n)}>{money(netPay, true)}</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
