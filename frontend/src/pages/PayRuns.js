import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";

const TEAL = "#0F9599";
const FONT_FAMILY = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const getToken = () =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("token") ||
  "";

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "#92400E", bg: "#FEF3C7", Icon: Clock },
  calculated: { label: "Calculated", color: "#1E40AF", bg: "#DBEAFE", Icon: FileText },
  finalized: { label: "Finalized", color: "#065F46", bg: "#D1FAE5", Icon: CheckCircle },
  voided: { label: "Voided", color: "#991B1B", bg: "#FEE2E2", Icon: XCircle },
};

const formatCurrency = (value, currency) => {
  if (value === null || value === undefined) return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: currency || "CAD",
    }).format(num);
  } catch (e) {
    return num.toFixed(2);
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
};

const headerCell = {
  textAlign: "left",
  padding: "12px 20px",
  fontSize: "11px",
  fontWeight: "600",
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const bodyCell = {
  padding: "16px 20px",
  fontSize: "14px",
};

export default function PayRuns() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRuns = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        throw new Error("You are not signed in. Please sign in to view pay runs.");
      }
      const response = await fetch(`${API_URL}/api/v1/payroll/runs`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || `Request failed with status ${response.status}`);
      }
      const data = await response.json();
      setRuns(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load pay runs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const containerStyle = {
    fontFamily: FONT_FAMILY,
    padding: "32px 40px",
    maxWidth: "1280px",
    margin: "0 auto",
    color: "#111827",
    minHeight: "calc(100vh - 64px)",
    background: "#FFFFFF",
  };

  const primaryButton = {
    background: TEAL,
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    fontFamily: FONT_FAMILY,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "background 0.15s",
  };

  const secondaryButton = {
    background: "#FFFFFF",
    color: "#374151",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    padding: "9px 16px",
    fontSize: "14px",
    fontWeight: "500",
    fontFamily: FONT_FAMILY,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  };

  return (
    <div style={containerStyle}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "32px",
        flexWrap: "wrap",
        gap: "16px",
      }}>
        <div>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "700",
            margin: "0 0 8px 0",
            color: "#111827",
          }}>
            Pay Runs
          </h1>
          <p style={{
            fontSize: "14px",
            color: "#6B7280",
            margin: 0,
          }}>
            Manage payroll cycles for your team
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={fetchRuns} style={secondaryButton} title="Refresh">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => navigate("/payroll/runs/new")}
            style={primaryButton}
          >
            <Plus size={16} />
            New Pay Run
          </button>
        </div>
      </div>

      {loading && (
        <div style={{
          padding: "80px 0",
          textAlign: "center",
          color: "#6B7280",
          fontSize: "14px",
        }}>
          Loading pay runs...
        </div>
      )}

      {error && !loading && (
        <div style={{
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: "12px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          color: "#991B1B",
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
              Could not load pay runs
            </div>
            <div style={{ fontSize: "13px", color: "#7F1D1D" }}>{error}</div>
          </div>
          <button onClick={fetchRuns} style={{
            ...secondaryButton,
            color: "#991B1B",
            borderColor: "#FECACA",
          }}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && runs.length === 0 && (
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "80px 40px",
          textAlign: "center",
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            background: "#F0FDFA",
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}>
            <FileText size={28} color={TEAL} />
          </div>
          <h2 style={{
            fontSize: "18px",
            fontWeight: "600",
            margin: "0 0 8px 0",
            color: "#111827",
          }}>
            No pay runs yet
          </h2>
          <p style={{
            fontSize: "14px",
            color: "#6B7280",
            maxWidth: "440px",
            margin: "0 auto 24px",
            lineHeight: "1.5",
          }}>
            Create your first pay run to calculate gross pay, taxes, and net pay for your team in one cycle.
          </p>
          <button
            onClick={() => navigate("/payroll/runs/new")}
            style={primaryButton}
          >
            <Plus size={16} />
            Create your first pay run
          </button>
        </div>
      )}

      {!loading && !error && runs.length > 0 && (
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: FONT_FAMILY,
          }}>
            <thead>
              <tr style={{
                background: "#F9FAFB",
                borderBottom: "1px solid #E5E7EB",
              }}>
                <th style={headerCell}>Pay Period</th>
                <th style={headerCell}>Pay Date</th>
                <th style={headerCell}>Employees</th>
                <th style={{ ...headerCell, textAlign: "right" }}>Net Total</th>
                <th style={headerCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const config = STATUS_CONFIG[run.status] || STATUS_CONFIG.draft;
                const Icon = config.Icon;
                return (
                  <tr
                    key={run.id}
                    onClick={() => navigate(`/payroll/runs/${run.id}`)}
                    style={{
                      borderBottom: "1px solid #F3F4F6",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                  >
                    <td style={bodyCell}>
                      <div style={{ fontWeight: "500", color: "#111827" }}>
                        {formatDate(run.pay_period_start)} to {formatDate(run.pay_period_end)}
                      </div>
                    </td>
                    <td style={{ ...bodyCell, color: "#374151" }}>
                      {formatDate(run.pay_date)}
                    </td>
                    <td style={{ ...bodyCell, color: "#374151" }}>
                      {run.employee_count || 0}
                    </td>
                    <td style={{ ...bodyCell, textAlign: "right", fontWeight: "600", color: "#111827" }}>
                      {formatCurrency(run.total_net, run.currency)}
                    </td>
                    <td style={bodyCell}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: config.bg,
                        color: config.color,
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}>
                        <Icon size={12} />
                        {config.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
