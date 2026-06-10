import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, RefreshCw, AlertCircle } from "lucide-react";
import {
  Button, Card, Input, StatusPill, EmptyState, Spinner,
  colors, typography, spacing, radius,
} from "../design-system";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  "Authorization": `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

const formatCurrency = (value, currency) => {
  if (value === null || value === undefined) return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  try {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: currency || "CAD" }).format(num);
  } catch (e) { return num.toFixed(2); }
};

const getEmployeeName = (emp) =>
  emp.name || emp.full_name ||
  [emp.first_name, emp.last_name].filter(Boolean).join(" ") ||
  emp.email || "Unnamed";

const getEmployeeRate = (emp) => parseFloat(emp.hourly_rate || emp.pay_rate || 0) || 0;
const getEmployeeSalary = (emp) => parseFloat(emp.salary_amount || emp.salary || 0) || 0;
const getPayType = (emp) => (emp.pay_type || emp.employment_type || "hourly").toLowerCase();

const getPayDescription = (emp) => {
  if (getPayType(emp) === "salary") {
    const s = getEmployeeSalary(emp);
    return s > 0 ? `${formatCurrency(s, emp.currency)} / yr` : "Not set";
  }
  const r = getEmployeeRate(emp);
  return r > 0 ? `${formatCurrency(r, emp.currency)} / hr` : "Not set";
};

const getInitials = (name) =>
  name.split(" ").map((s) => s[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();

const thStyle = {
  textAlign: "left", padding: "12px 20px",
  ...typography.labelUppercase, color: colors.textMuted, whiteSpace: "nowrap",
};
const tdStyle = { padding: "14px 20px", ...typography.body };

export default function EmployeesList() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/payroll/employees`, { headers: authHeaders() });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Could not load employees (HTTP ${res.status})`);
      }
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : (data.employees || data.data || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = employees.filter((emp) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      getEmployeeName(emp).toLowerCase().includes(q) ||
      (emp.email || "").toLowerCase().includes(q) ||
      (emp.role || emp.title || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{
      background: colors.bgPage,
      fontFamily: typography.fontFamily,
      padding: `${spacing[6]}px ${spacing[8]}px`,
      width: "100%", minHeight: "100%", boxSizing: "border-box",
    }}>
      <div style={{ width: "100%" }}>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: spacing[6], flexWrap: "wrap", gap: spacing[4],
        }}>
          <div>
            <h1 style={{ ...typography.displaySm, color: colors.textPrimary, margin: 0, marginBottom: spacing[1] }}>
              Employees
            </h1>
            <p style={{ ...typography.body, color: colors.textSecondary, margin: 0 }}>
              Manage your team's profiles, pay, tax info, and direct deposit
            </p>
          </div>
          <div style={{ display: "flex", gap: spacing[2] }}>
            <Button variant="secondary" onClick={load} iconLeft={<RefreshCw size={14} />}>
              Refresh
            </Button>
            <Button variant="primary" onClick={() => navigate("/payroll")} iconLeft={<Plus size={16} />}>
              Add employee
            </Button>
          </div>
        </div>

        {employees.length > 0 && (
          <div style={{ marginBottom: spacing[5], maxWidth: 420 }}>
            <Input
              type="text"
              placeholder="Search by name, email, or role"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {loading && (
          <div style={{ padding: `${spacing[12]}px 0`, textAlign: "center" }}>
            <Spinner size={20} label="Loading employees..." inline />
          </div>
        )}

        {error && !loading && (
          <Card style={{
            background: colors.dangerSoft,
            border: `1px solid ${colors.danger}40`,
            display: "flex", alignItems: "flex-start", gap: spacing[3],
          }}>
            <AlertCircle size={20} color={colors.danger} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...typography.bodyStrong, color: colors.dangerText, marginBottom: 4 }}>
                Could not load employees
              </div>
              <div style={{ ...typography.caption, color: colors.dangerText }}>{error}</div>
            </div>
            <Button variant="secondary" size="sm" onClick={load}>Try again</Button>
          </Card>
        )}

        {!loading && !error && employees.length === 0 && (
          <Card noPadding>
            <EmptyState
              icon={<Users />}
              title="No employees yet"
              description="Add employees to set their pay, tax info, and direct deposit. They will appear when you create a pay run."
              action={{
                label: "Add your first employee",
                onClick: () => navigate("/payroll"),
                icon: <Plus size={16} />,
              }}
            />
          </Card>
        )}

        {!loading && !error && employees.length > 0 && filtered.length === 0 && (
          <Card>
            <div style={{ textAlign: "center", padding: `${spacing[5]}px 0` }}>
              <div style={{ ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing[1] }}>
                No matches for "{search}"
              </div>
              <p style={{ ...typography.bodySm, color: colors.textSecondary, margin: 0 }}>
                Try a different search term
              </p>
            </div>
          </Card>
        )}

        {!loading && !error && filtered.length > 0 && (
          <Card noPadding>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: typography.fontFamily, minWidth: 720 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Pay type</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Rate</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp, idx) => {
                    const name = getEmployeeName(emp);
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => navigate(`/payroll/employees/${emp.id}`)}
                        style={{
                          borderBottom: idx < filtered.length - 1 ? `1px solid ${colors.borderSubtle}` : "none",
                          cursor: "pointer",
                          transition: "background 150ms ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgCardHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = colors.bgCard; }}
                      >
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: radius.pill,
                              background: colors.brandSoft,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              ...typography.bodyStrong, color: colors.brandPrimary,
                              flexShrink: 0, fontSize: 13,
                            }}>
                              {getInitials(name)}
                            </div>
                            <div>
                              <div style={{ ...typography.bodyMd, color: colors.textPrimary }}>{name}</div>
                              {emp.email && (
                                <div style={{ ...typography.caption, color: colors.textSecondary }}>{emp.email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: colors.textSecondary }}>
                          {emp.role || emp.title || ""}
                        </td>
                        <td style={{ ...tdStyle, color: colors.textSecondary, textTransform: "capitalize" }}>
                          {getPayType(emp)}
                        </td>
                        <td style={{
                          ...tdStyle, textAlign: "right",
                          ...typography.bodyMd, color: colors.textPrimary,
                          fontFeatureSettings: '"tnum" 1',
                        }}>
                          {getPayDescription(emp)}
                        </td>
                        <td style={tdStyle}>
                          <StatusPill status={emp.status || "active"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
