import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const authHeaders = () => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? "Bearer " + token : "",
  };
};

const SLATE = "#12262B";
const INK = "#1A1A1A";
const RULE = "#333";
const LINE = "#C9CED6";
const TEAL = "#15A08C";
const TEAL_HOVER = "#0F8474";
const MUTED = "#5F6B7A";

const money = (n) => {
  const v = Number(n) || 0;
  return "$" + v.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * PayrollTaxPrintView
 * -------------------
 * Opens as a new tab from the Print toolbar button on Payroll taxes.
 * Renders a full letter-size printable report and calls window.print()
 * once the data is loaded.
 *
 * Query params:
 *   ?tab=payments  (default)
 *   ?tab=filings
 */
export default function PayrollTaxPrintView() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "payments";
  const [pd7a, setPd7a] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tab === "payments") {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      fetch(`${API_URL}/api/v1/payroll/taxes/pd7a?year=${year}&month=${month}`, {
        headers: authHeaders(),
      })
        .then((r) => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then((data) => {
          setPd7a(data);
          if (data.company && data.company.name) {
            setCompanyName(data.company.name);
          }
          setLoading(false);
          setTimeout(() => window.print(), 400);
        })
        .catch((e) => {
          setError("Could not load data: " + e.message);
          setLoading(false);
        });
    } else {
      // Filings tab: no live endpoint yet, use static T4 data
      setLoading(false);
      setTimeout(() => window.print(), 400);
    }
  }, [tab]);

  const title = tab === "filings"
    ? "Novala Payroll: Tax filings"
    : "Novala Payroll: Tax payments";

  return (
    <div style={{ margin: 0, background: "#EDEFF2", fontFamily: "Inter, sans-serif", fontSize: 14, color: INK, minHeight: "100vh" }}>
      <style>{`
        @media print {
          @page { size: letter; margin: 0; }
          body { background: #fff !important; }
          .print-bar { display: none !important; }
          .print-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
            min-height: 100vh !important;
            padding: 0.6in !important;
          }
        }
      `}</style>

      {/* Control bar (hidden when printing) */}
      <div className="print-bar" style={{
        background: "#fff",
        borderBottom: "1px solid #E3E7EC",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "sticky",
        top: 0,
      }}>
        <button
          onClick={() => window.print()}
          style={{
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            borderRadius: 10,
            padding: "9px 18px",
            cursor: "pointer",
            background: TEAL,
            color: "#fff",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = TEAL_HOVER}
          onMouseLeave={(e) => e.currentTarget.style.background = TEAL}
        >
          Print
        </button>
        <button
          onClick={() => window.close()}
          style={{
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 10,
            padding: "9px 18px",
            cursor: "pointer",
            background: "#fff",
            color: SLATE,
            border: "1px solid " + LINE,
          }}
        >
          Cancel
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ color: MUTED, fontSize: 13, fontWeight: 600 }}>
          This view opens the browser print dialog. Choose your printer or Save as PDF.
        </div>
      </div>

      {/* Sheet (visible + printed) */}
      <div className="print-sheet" style={{
        background: "#fff",
        width: 816,
        maxWidth: "100%",
        minHeight: 1056,
        margin: "24px auto",
        padding: "64px 72px",
        boxShadow: "0 1px 6px rgba(16,30,40,0.16)",
      }}>
        <h1 style={{
          fontSize: 24, fontWeight: 700, color: SLATE, margin: "0 0 6px",
        }}>
          {title}
        </h1>
        <div style={{
          fontSize: 16, fontWeight: 700, color: SLATE, margin: "0 0 28px",
        }}>
          {companyName || "Company"}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: MUTED, fontWeight: 600 }}>
            Loading...
          </div>
        ) : error ? (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: 8,
            padding: "10px 12px",
            color: "#991B1B",
            fontSize: 13,
            fontWeight: 600,
          }}>
            {error}
          </div>
        ) : tab === "payments" ? (
          <PaymentsTable pd7a={pd7a} />
        ) : (
          <FilingsTable />
        )}
      </div>
    </div>
  );
}

function PaymentsTable({ pd7a }) {
  const hasData = pd7a && pd7a.paycheque_count > 0;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          <TH>Tax type</TH>
          <TH>Period</TH>
          <TH>Payment status</TH>
          <TH>Amount</TH>
          <TH>Due date</TH>
          <TH>Notes</TH>
        </tr>
      </thead>
      <tbody>
        {hasData ? (
          <tr>
            <TD bold>Federal taxes</TD>
            <TD num>{pd7a.period_label || (pd7a.period_start + " to " + pd7a.period_end)}</TD>
            <TD>
              {pd7a.status === "ready_to_pay" ? "Ready to pay" :
               pd7a.status === "overdue" ? "Overdue" :
               "Waiting"}
            </TD>
            <TD num bold>{money(pd7a.current_payment)}</TD>
            <TD num>{pd7a.due_date_display}</TD>
            <TD>Pay by {pd7a.due_date_display}</TD>
          </tr>
        ) : (
          <tr>
            <TD colSpan={6}>Nothing to print for this view.</TD>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function FilingsTable() {
  const currentYear = new Date().getFullYear();
  const dueDate = "01/03/" + (currentYear + 1);
  const period = "01/01/" + currentYear + " to 31/12/" + currentYear;

  const rows = [
    { name: "T4 summary", period, status: "Not due yet", dueDate, method: "Manually file" },
    { name: "T4 employer slips", period, status: "Not due yet", dueDate, method: "Manually file with XML" },
    { name: "T4 employee slips", period, status: "Not due yet", dueDate, method: "Manually file" },
  ];

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          <TH>Filing</TH>
          <TH>Period</TH>
          <TH>Status</TH>
          <TH>Due date</TH>
          <TH>Method</TH>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <TD bold>{r.name}</TD>
            <TD num>{r.period}</TD>
            <TD>{r.status}</TD>
            <TD num>{r.dueDate}</TD>
            <TD>{r.method}</TD>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TH({ children }) {
  return (
    <th style={{
      textAlign: "left",
      textTransform: "uppercase",
      letterSpacing: "0.4px",
      fontSize: 12,
      fontWeight: 700,
      color: SLATE,
      border: "1px solid " + RULE,
      padding: "12px 14px",
      background: "#fff",
    }}>
      {children}
    </th>
  );
}

function TD({ children, bold, num, colSpan }) {
  return (
    <td
      colSpan={colSpan}
      style={{
        border: "1px solid " + RULE,
        padding: "14px 14px",
        color: INK,
        verticalAlign: "top",
        fontWeight: bold ? 700 : 500,
        fontVariantNumeric: num ? "tabular-nums" : "normal",
      }}
    >
      {children}
    </td>
  );
}