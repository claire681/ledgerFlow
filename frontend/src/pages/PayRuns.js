import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, RefreshCw, AlertCircle } from "lucide-react";
import {
  Button, Card, StatusPill, EmptyState, Spinner,
  colors, typography, spacing,
} from "../design-system";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const getToken = () =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("token") ||
  "";

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

const thStyle = {
  textAlign: "left",
  padding: "12px 20px",
  ...typography.labelUppercase,
  color: colors.textMuted,
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "16px 20px",
  ...typography.body,
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
        throw new Error(errBody.detail || `Request failed (HTTP ${response.status})`);
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

  return (
    <div style={{
      background: colors.bgPage,
      minHeight: "100vh",
      fontFamily: typography.fontFamily,
      padding: `${spacing[8]}px ${spacing[10]}px`,
      boxSizing: "border-box",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: spacing[8],
          flexWrap: "wrap",
          gap: spacing[4],
        }}>
          <div>
            <h1 style={{
              ...typography.displaySm,
              color: colors.textPrimary,
              margin: 0,
              marginBottom: spacing[1],
            }}>
              Pay runs
            </h1>
            <p style={{
              ...typography.body,
              color: colors.textSecondary,
              margin: 0,
            }}>
              Manage payroll cycles for your team
            </p>
          </div>
          <div style={{ display: "flex", gap: spacing[2] }}>
            <Button variant="secondary" size="md" onClick={fetchRuns} iconLeft={<RefreshCw size={14} />}>
              Refresh
            </Button>
            <Button variant="primary" size="md" onClick={() => navigate("/payroll/runs/new")} iconLeft={<Plus size={16} />}>
              New pay run
            </Button>
          </div>
        </div>

        {loading && (
          <div style={{ padding: `${spacing[12]}px 0`, textAlign: "center" }}>
            <Spinner size={20} label="Loading pay runs..." inline />
          </div>
        )}

        {error && !loading && (
          <Card style={{
            background: colors.dangerSoft,
            border: `1px solid ${colors.danger}40`,
            display: "flex",
            alignItems: "flex-start",
            gap: spacing[3],
          }}>
            <AlertCircle size={20} color={colors.danger} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{
                ...typography.bodyStrong,
                color: colors.dangerText,
                marginBottom: 4,
              }}>
                Could not load pay runs
              </div>
              <div style={{ ...typography.caption, color: colors.dangerText }}>
                {error}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchRuns}>
              Try again
            </Button>
          </Card>
        )}

        {!loading && !error && runs.length === 0 && (
          <Card noPadding>
            <EmptyState
              icon={<FileText />}
              title="No pay runs yet"
              description="Create your first pay run to calculate gross pay, taxes, and net pay for your team in one cycle."
              action={{
                label: "Create your first pay run",
                onClick: () => navigate("/payroll/runs/new"),
                icon: <Plus size={16} />,
              }}
            />
          </Card>
        )}

        {!loading && !error && runs.length > 0 && (
          <Card noPadding>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: typography.fontFamily,
            }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
                  <th style={thStyle}>Pay period</th>
                  <th style={thStyle}>Pay date</th>
                  <th style={thStyle}>Employees</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Net total</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, idx) => (
                  <tr
                    key={run.id}
                    onClick={() => navigate(`/payroll/runs/${run.id}`)}
                    style={{
                      borderBottom: idx < runs.length - 1 ? `1px solid ${colors.borderSubtle}` : "none",
                      cursor: "pointer",
                      transition: "background 150ms ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgCardHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = colors.bgCard; }}
                  >
                    <td style={tdStyle}>
                      <div style={{ ...typography.bodyMd, color: colors.textPrimary }}>
                        {formatDate(run.pay_period_start)} to {formatDate(run.pay_period_end)}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: colors.textSecondary }}>
                      {formatDate(run.pay_date)}
                    </td>
                    <td style={{ ...tdStyle, color: colors.textSecondary }}>
                      {run.employee_count || 0}
                    </td>
                    <td style={{
                      ...tdStyle,
                      textAlign: "right",
                      ...typography.bodyStrong,
                      color: colors.textPrimary,
                      fontFeatureSettings: '"tnum" 1',
                    }}>
                      {formatCurrency(run.total_net, run.currency)}
                    </td>
                    <td style={tdStyle}>
                      <StatusPill status={run.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
