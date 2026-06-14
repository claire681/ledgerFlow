import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, X, Check } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const BRAND = "#0F9599";
const TEXT_PRIMARY = "#111827";
const TEXT_INK = "#1A2B2B";
const TEXT_SECONDARY = "#6B7280";
const TEXT_TERTIARY = "#9CA3AF";
const BG_CARD = "#FFFFFF";
const BG_PAGE = "#F7F9F9";
const BORDER = "#E5E7EB";
const BORDER_LIGHT = "#F0F4F4";
const SUCCESS_TEXT = "#166534";
const SUCCESS_SOFT = "#DCFCE7";
const SUCCESS_BORDER = "#86EFAC";

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const formatCurrency = (n, currency) => {
  const v = parseFloat(n) || 0;
  return v.toLocaleString("en-CA", { style: "currency", currency: currency || "CAD", minimumFractionDigits: 2 });
};

const formatDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-CA", { day: "2-digit", month: "short", year: "numeric" });
};

const TH = { background: BG_PAGE, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: TEXT_SECONDARY, textAlign: "left", padding: "12px 16px", borderBottom: "0.5px solid " + BORDER, textTransform: "uppercase", whiteSpace: "nowrap" };
const TD = { padding: "14px 16px", fontSize: 14, color: TEXT_PRIMARY, borderBottom: "0.5px solid " + BORDER_LIGHT };

function MetricCard({ label, value, highlight }) {
  return (
    <div style={{ background: highlight ? SUCCESS_SOFT : BG_PAGE, border: "0.5px solid " + (highlight ? SUCCESS_BORDER : BORDER), borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontSize: 12, color: highlight ? SUCCESS_TEXT : TEXT_TERTIARY, marginBottom: 5, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: highlight ? SUCCESS_TEXT : TEXT_INK, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

export default function PayrollPreview() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { payRunId } = useParams();

  const stubs = (loc.state && loc.state.stubs) || [];
  const run = (loc.state && loc.state.run) || null;
  const employee_inputs = (loc.state && loc.state.employee_inputs) || [];

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loc.state || !loc.state.stubs) {
      navigate("/payroll/run/" + payRunId);
    }
  }, []);

  const goBack = () => navigate("/payroll/run/" + payRunId);

  const handleFinalize = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const headers = { Authorization: "Bearer " + getToken(), "Content-Type": "application/json" };

      const calcRes = await fetch(API_URL + "/api/v1/payroll/runs/" + payRunId + "/calculate", {
        method: "POST",
        headers,
        body: JSON.stringify({ employee_inputs }),
      });
      if (!calcRes.ok) {
        const eb = await calcRes.json().catch(() => ({}));
        const msg = typeof eb.detail === "string" ? eb.detail : Array.isArray(eb.detail) ? eb.detail.map(d => d.msg || JSON.stringify(d)).join("; ") : ("Calculate failed (status " + calcRes.status + ").");
        throw new Error(msg);
      }

      const finRes = await fetch(API_URL + "/api/v1/payroll/runs/" + payRunId + "/finalize", {
        method: "POST",
        headers,
      });
      if (!finRes.ok) {
        const eb = await finRes.json().catch(() => ({}));
        const msg = typeof eb.detail === "string" ? eb.detail : Array.isArray(eb.detail) ? eb.detail.map(d => d.msg || JSON.stringify(d)).join("; ") : ("Finalize failed (status " + finRes.status + ").");
        throw new Error(msg);
      }

      navigate("/payroll/runs/" + payRunId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!stubs.length) return null;

  const totalGross = stubs.reduce((s, x) => s + (parseFloat(x.gross_pay) || 0), 0);
  const totalDeductions = stubs.reduce((s, x) => s + (parseFloat(x.total_employee_deductions) || 0), 0);
  const totalNet = stubs.reduce((s, x) => s + (parseFloat(x.net_pay) || 0), 0);
  const currency = (stubs[0] && stubs[0].currency) || (run && run.currency) || "CAD";

  return (
    <div style={{ background: BG_CARD, minHeight: "100vh", width: "100%", fontFamily: "inherit" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "0.5px solid " + BORDER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span onClick={goBack} style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 8, color: TEXT_SECONDARY, cursor: "pointer" }}><ArrowLeft size={18} /></span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT_INK, margin: 0, letterSpacing: "-0.01em" }}>Preview payroll</h1>
        </div>
        <span onClick={goBack} style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 8, color: TEXT_SECONDARY, cursor: "pointer" }}><X size={18} /></span>
      </div>

      <div style={{ padding: "24px 28px 16px" }}>

        <div style={{ background: BG_PAGE, border: "0.5px solid " + BORDER, borderRadius: 10, padding: "16px 18px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginBottom: 3 }}>Pay period</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_INK }}>
              {run ? (formatDate(run.pay_period_start) + " to " + formatDate(run.pay_period_end)) : ""}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginBottom: 3 }}>Pay date</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_INK }}>{run ? formatDate(run.pay_date) : ""}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginBottom: 3 }}>Employees</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_INK }}>{stubs.length}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          <MetricCard label="Total gross" value={formatCurrency(totalGross, currency)} />
          <MetricCard label="Total deductions" value={formatCurrency(totalDeductions, currency)} />
          <MetricCard label="Total net pay" value={formatCurrency(totalNet, currency)} highlight />
        </div>

        <div style={{ border: "0.5px solid " + BORDER, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TH}>Employee</th>
                <th style={{ ...TH, textAlign: "right" }}>Gross pay</th>
                <th style={{ ...TH, textAlign: "right" }}>Deductions</th>
                <th style={{ ...TH, textAlign: "right" }}>Net pay</th>
              </tr>
            </thead>
            <tbody>
              {stubs.map((stub, idx) => (
                <tr key={stub.id || stub.employee_id || idx}>
                  <td style={TD}>{stub.employee_name || stub.name || ("Employee " + (idx + 1))}</td>
                  <td style={{ ...TD, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(stub.gross_pay, stub.currency || currency)}</td>
                  <td style={{ ...TD, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(stub.total_employee_deductions, stub.currency || currency)}</td>
                  <td style={{ ...TD, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{formatCurrency(stub.net_pay, stub.currency || currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && (
          <div style={{ padding: 12, background: "#FEE2E2", border: "0.5px solid #F87171", borderRadius: 8, color: "#991B1B", fontSize: 13, marginBottom: 16 }}>
            <strong>Could not finalize:</strong> {error}
          </div>
        )}

      </div>

      <div style={{ background: BG_CARD, borderTop: "0.5px solid " + BORDER, padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={goBack} disabled={submitting} style={{ background: "transparent", color: TEXT_SECONDARY, fontSize: 13.5, fontWeight: 600, padding: "9px 14px", border: "none", borderRadius: 9, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          Back to draft
        </button>
        <button onClick={handleFinalize} disabled={submitting} style={{ background: BRAND, color: "white", fontSize: 14, fontWeight: 600, padding: "11px 22px", border: "none", borderRadius: 9, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7 }}>
          {submitting ? "Finalizing..." : "Finalize payroll"}
          {!submitting && <Check size={15} />}
        </button>
      </div>
    </div>
  );
}
