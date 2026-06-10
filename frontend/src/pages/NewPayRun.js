import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, Users, AlertCircle, RefreshCw, Plus,
  CheckCircle, UserX,
} from "lucide-react";

const TEAL = "#0F9599";
const TEAL_LIGHT = "#F0FDFA";
const TEAL_DARK = "#0C7C7F";
const FONT_FAMILY = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const getToken = () =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("token") ||
  "";

const authHeaders = () => ({
  "Authorization": `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

const formatCurrency = (value, currency) => {
  if (value === null || value === undefined) return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: currency || "CAD",
    }).format(num);
  } catch (e) {
    return num.toFixed(2);
  }
};

const PAY_SCHEDULE_TO_PERIODS = {
  weekly: 52,
  bi_weekly: 26,
  biweekly: 26,
  semi_monthly: 24,
  semimonthly: 24,
  monthly: 12,
};

const today = () => new Date().toISOString().split("T")[0];
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const getEmployeeName = (emp) =>
  emp.name ||
  emp.full_name ||
  [emp.first_name, emp.last_name].filter(Boolean).join(" ") ||
  emp.email ||
  "Unnamed employee";

const getEmployeeRate = (emp) => parseFloat(emp.hourly_rate || emp.pay_rate || 0) || 0;
const getEmployeeSalary = (emp) => parseFloat(emp.salary_amount || emp.salary || 0) || 0;
const getPayType = (emp) => (emp.pay_type || emp.employment_type || "hourly").toLowerCase();

const containerStyle = {
  fontFamily: FONT_FAMILY,
  padding: "32px 40px 120px",
  maxWidth: "1280px",
  margin: "0 auto",
  color: "#111827",
  minHeight: "100vh",
  background: "#FFFFFF",
};

const cardStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "20px",
};

const cardTitle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 4px 0",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const cardSubtitle = {
  fontSize: "13px",
  color: "#6B7280",
  margin: "0 0 20px 0",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "600",
  color: "#374151",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "14px",
  fontFamily: FONT_FAMILY,
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  background: "#FFFFFF",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const numberInputStyle = {
  ...inputStyle,
  width: "70px",
  padding: "6px 8px",
  fontSize: "13px",
  textAlign: "right",
};

const primaryBtn = {
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
};

const secondaryBtn = {
  background: "#FFFFFF",
  color: "#374151",
  border: "1px solid #D1D5DB",
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

const ghostBtn = {
  background: "transparent",
  color: "#6B7280",
  border: "none",
  padding: "8px 12px",
  fontSize: "14px",
  fontWeight: "500",
  fontFamily: FONT_FAMILY,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
};

export default function NewPayRun() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [form, setForm] = useState({
    pay_period_start: addDays(today(), -13),
    pay_period_end: today(),
    pay_date: addDays(today(), 2),
    pay_periods_per_year: 26,
    country: "CA",
    subnational: "AB",
  });

  const [selectedEmployees, setSelectedEmployees] = useState({});

  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = getToken();
        if (!token) {
          throw new Error("Not signed in. Please sign in first.");
        }
        const [empRes, setRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/payroll/employees`, { headers: authHeaders() }),
          fetch(`${API_URL}/api/v1/payroll/settings`, { headers: authHeaders() }),
        ]);

        if (!empRes.ok) {
          throw new Error(`Could not load employees (HTTP ${empRes.status})`);
        }
        const empData = await empRes.json();
        const empList = Array.isArray(empData)
          ? empData
          : (empData.employees || empData.data || []);
        setEmployees(empList);

        if (setRes.ok) {
          const setData = await setRes.json();
          setSettings(setData);
          const schedKey = (setData.default_pay_schedule || "").toLowerCase();
          setForm((prev) => ({
            ...prev,
            country: setData.country || prev.country,
            subnational: setData.province_or_state || prev.subnational,
            pay_periods_per_year:
              PAY_SCHEDULE_TO_PERIODS[schedKey] || prev.pay_periods_per_year,
          }));
        }
      } catch (err) {
        setLoadError(err.message || "Could not load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleEmployee = (emp) => {
    setSelectedEmployees((prev) => {
      const next = { ...prev };
      if (next[emp.id]) {
        delete next[emp.id];
      } else {
        next[emp.id] = { regular: 0, overtime: 0, vacation: 0, sick: 0, bonus: 0 };
      }
      return next;
    });
    setPreview(null);
    setPreviewError(null);
  };

  const updateField = (empId, field, value) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    setSelectedEmployees((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: numValue },
    }));
    setPreview(null);
    setPreviewError(null);
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setPreview(null);
    setPreviewError(null);
  };

  const estimateRowGross = (emp, vals) => {
    const payType = getPayType(emp);
    if (payType === "salary") {
      return getEmployeeSalary(emp) / (form.pay_periods_per_year || 26);
    }
    const rate = getEmployeeRate(emp);
    const regular = (vals.regular || 0) * rate;
    const overtime = (vals.overtime || 0) * rate * 1.5;
    const vacation = (vals.vacation || 0) * rate;
    const sick = (vals.sick || 0) * rate;
    return regular + overtime + vacation + sick + (vals.bonus || 0);
  };

  const buildBody = () => {
    const employee_inputs = Object.entries(selectedEmployees).map(([empId, vals]) => ({
      employee_id: empId,
      earnings: {
        hours: {
          regular: vals.regular || 0,
          overtime: vals.overtime || 0,
          stat_holiday: 0,
          vacation: vals.vacation || 0,
          sick: vals.sick || 0,
          evening: 0,
          overnight: 0,
          weekend: 0,
          on_call: 0,
          travel: 0,
        },
        bonus: vals.bonus || 0,
        commission: 0,
        reimbursement: 0,
      },
      deductions: [],
    }));

    return {
      pay_period_start: form.pay_period_start,
      pay_period_end: form.pay_period_end,
      pay_date: form.pay_date,
      pay_periods_per_year: form.pay_periods_per_year,
      country: form.country,
      subnational: form.subnational,
      employee_inputs,
    };
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setPreview(null);
    setPreviewError(null);
    try {
      const body = buildBody();
      if (body.employee_inputs.length === 0) {
        throw new Error("Select at least one employee");
      }
      const res = await fetch(`${API_URL}/api/v1/payroll/runs/preview`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Preview failed (HTTP ${res.status})`);
      }
      const data = await res.json();
      setPreview(data);
    } catch (err) {
      setPreviewError(err.message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body = buildBody();
      if (body.employee_inputs.length === 0) {
        throw new Error("Select at least one employee");
      }

      const createRes = await fetch(`${API_URL}/api/v1/payroll/runs`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          pay_period_start: body.pay_period_start,
          pay_period_end: body.pay_period_end,
          pay_date: body.pay_date,
          country: body.country,
        }),
      });
      if (!createRes.ok) {
        const errBody = await createRes.json().catch(() => ({}));
        throw new Error(errBody.detail || `Could not create run (HTTP ${createRes.status})`);
      }
      const run = await createRes.json();

      const calcRes = await fetch(`${API_URL}/api/v1/payroll/runs/${run.id}/calculate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          employee_inputs: body.employee_inputs,
          pay_periods_per_year: body.pay_periods_per_year,
          subnational: body.subnational,
        }),
      });
      if (!calcRes.ok) {
        const errBody = await calcRes.json().catch(() => ({}));
        throw new Error(errBody.detail || `Could not calculate (HTTP ${calcRes.status})`);
      }

      navigate("/payroll/runs");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = Object.keys(selectedEmployees).length;

  let estimatedGross = 0;
  Object.entries(selectedEmployees).forEach(([empId, vals]) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) estimatedGross += estimateRowGross(emp, vals);
  });

  const canSubmit =
    selectedCount > 0 &&
    form.pay_period_start &&
    form.pay_period_end &&
    form.pay_date &&
    !submitting;

  return (
    <div style={containerStyle}>
      <button
        onClick={() => navigate("/payroll/runs")}
        style={{ ...ghostBtn, marginBottom: "16px", paddingLeft: 0 }}
      >
        <ArrowLeft size={16} />
        Back to Pay Runs
      </button>

      <h1 style={{
        fontSize: "28px",
        fontWeight: "700",
        margin: "0 0 8px 0",
        color: "#111827",
      }}>
        New Pay Run
      </h1>
      <p style={{
        fontSize: "14px",
        color: "#6B7280",
        margin: "0 0 32px 0",
      }}>
        Set the pay period, select employees, enter hours, then preview before saving.
      </p>

      {loading && (
        <div style={{ padding: "80px 0", textAlign: "center", color: "#6B7280" }}>
          Loading employees and settings...
        </div>
      )}

      {loadError && !loading && (
        <div style={{
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: "12px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          color: "#991B1B",
          marginBottom: "20px",
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
              Could not load data
            </div>
            <div style={{ fontSize: "13px", color: "#7F1D1D" }}>{loadError}</div>
          </div>
        </div>
      )}

      {!loading && !loadError && (
        <>
          {/* Pay Period Card */}
          <div style={cardStyle}>
            <h2 style={cardTitle}>
              <Calendar size={18} color={TEAL} />
              Pay Period
            </h2>
            <p style={cardSubtitle}>
              The date range this pay run covers and when employees will be paid.
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
            }}>
              <div>
                <label style={labelStyle}>Period Start</label>
                <input
                  type="date"
                  value={form.pay_period_start}
                  onChange={(e) => updateForm("pay_period_start", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Period End</label>
                <input
                  type="date"
                  value={form.pay_period_end}
                  onChange={(e) => updateForm("pay_period_end", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Pay Date</label>
                <input
                  type="date"
                  value={form.pay_date}
                  onChange={(e) => updateForm("pay_date", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Pay Periods Per Year</label>
                <select
                  value={form.pay_periods_per_year}
                  onChange={(e) => updateForm("pay_periods_per_year", parseInt(e.target.value, 10))}
                  style={inputStyle}
                >
                  <option value={52}>Weekly (52)</option>
                  <option value={26}>Biweekly (26)</option>
                  <option value={24}>Semi-monthly (24)</option>
                  <option value={12}>Monthly (12)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Employees Card */}
          <div style={cardStyle}>
            <h2 style={cardTitle}>
              <Users size={18} color={TEAL} />
              Employees and Hours
              <span style={{
                marginLeft: "auto",
                fontSize: "13px",
                color: "#6B7280",
                fontWeight: "500",
              }}>
                {selectedCount} of {employees.length} selected
              </span>
            </h2>
            <p style={cardSubtitle}>
              Check employees to include in this run, then enter their hours.
            </p>

            {employees.length === 0 ? (
              <div style={{
                padding: "40px 20px",
                textAlign: "center",
                background: "#F9FAFB",
                borderRadius: "8px",
                color: "#6B7280",
              }}>
                <UserX size={32} style={{ margin: "0 auto 12px", color: "#9CA3AF" }} />
                <div style={{ fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
                  No employees yet
                </div>
                <div style={{ fontSize: "13px", marginBottom: "16px" }}>
                  Add employees first on the Payroll page.
                </div>
                <button
                  onClick={() => navigate("/payroll")}
                  style={secondaryBtn}
                >
                  Go to Payroll
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: FONT_FAMILY,
                  minWidth: "780px",
                }}>
                  <thead>
                    <tr style={{
                      background: "#F9FAFB",
                      borderBottom: "1px solid #E5E7EB",
                    }}>
                      <th style={thStyle}>Employee</th>
                      <th style={thStyle}>Type</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Reg</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>OT</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Vac</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Sick</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Bonus</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Est. Gross</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => {
                      const sel = selectedEmployees[emp.id];
                      const isSelected = !!sel;
                      const payType = getPayType(emp);
                      const isSalary = payType === "salary";
                      const rate = getEmployeeRate(emp);
                      const salary = getEmployeeSalary(emp);
                      const rowGross = isSelected ? estimateRowGross(emp, sel) : 0;
                      return (
                        <tr
                          key={emp.id}
                          style={{
                            borderBottom: "1px solid #F3F4F6",
                            background: isSelected ? "#F0FDFA" : "#FFFFFF",
                          }}
                        >
                          <td style={tdStyle}>
                            <label style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              cursor: "pointer",
                            }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleEmployee(emp)}
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  accentColor: TEAL,
                                  cursor: "pointer",
                                }}
                              />
                              <div>
                                <div style={{ fontWeight: "500", color: "#111827", fontSize: "14px" }}>
                                  {getEmployeeName(emp)}
                                </div>
                                <div style={{ fontSize: "12px", color: "#6B7280" }}>
                                  {isSalary
                                    ? `${formatCurrency(salary, emp.currency)} / yr`
                                    : `${formatCurrency(rate, emp.currency)} / hr`}
                                </div>
                              </div>
                            </label>
                          </td>
                          <td style={{ ...tdStyle, color: "#6B7280", fontSize: "12px" }}>
                            {payType === "salary" ? "Salary" : "Hourly"}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <input
                              type="number"
                              min="0"
                              step="0.25"
                              disabled={!isSelected || isSalary}
                              value={sel?.regular ?? ""}
                              onChange={(e) => updateField(emp.id, "regular", e.target.value)}
                              style={{
                                ...numberInputStyle,
                                background: !isSelected || isSalary ? "#F9FAFB" : "#FFFFFF",
                              }}
                              placeholder="0"
                            />
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <input
                              type="number"
                              min="0"
                              step="0.25"
                              disabled={!isSelected || isSalary}
                              value={sel?.overtime ?? ""}
                              onChange={(e) => updateField(emp.id, "overtime", e.target.value)}
                              style={{
                                ...numberInputStyle,
                                background: !isSelected || isSalary ? "#F9FAFB" : "#FFFFFF",
                              }}
                              placeholder="0"
                            />
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <input
                              type="number"
                              min="0"
                              step="0.25"
                              disabled={!isSelected || isSalary}
                              value={sel?.vacation ?? ""}
                              onChange={(e) => updateField(emp.id, "vacation", e.target.value)}
                              style={{
                                ...numberInputStyle,
                                background: !isSelected || isSalary ? "#F9FAFB" : "#FFFFFF",
                              }}
                              placeholder="0"
                            />
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <input
                              type="number"
                              min="0"
                              step="0.25"
                              disabled={!isSelected || isSalary}
                              value={sel?.sick ?? ""}
                              onChange={(e) => updateField(emp.id, "sick", e.target.value)}
                              style={{
                                ...numberInputStyle,
                                background: !isSelected || isSalary ? "#F9FAFB" : "#FFFFFF",
                              }}
                              placeholder="0"
                            />
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={!isSelected}
                              value={sel?.bonus ?? ""}
                              onChange={(e) => updateField(emp.id, "bonus", e.target.value)}
                              style={{
                                ...numberInputStyle,
                                background: !isSelected ? "#F9FAFB" : "#FFFFFF",
                              }}
                              placeholder="0"
                            />
                          </td>
                          <td style={{
                            ...tdStyle,
                            textAlign: "right",
                            fontWeight: "600",
                            color: isSelected ? "#111827" : "#9CA3AF",
                          }}>
                            {isSelected ? formatCurrency(rowGross, emp.currency) : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Preview Card */}
          {preview && (
            <div style={{
              ...cardStyle,
              background: TEAL_LIGHT,
              borderColor: "#A7F3D0",
            }}>
              <h2 style={cardTitle}>
                <CheckCircle size={18} color={TEAL_DARK} />
                Preview Totals
              </h2>
              <p style={cardSubtitle}>
                Calculations from the engine. Save as draft to persist these pay stubs.
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
              }}>
                <SummaryStat label="Employees" value={preview.employee_count} />
                <SummaryStat label="Total Gross" value={formatCurrency(preview.total_gross, preview.currency)} />
                <SummaryStat label="Deductions" value={formatCurrency(preview.total_employee_deductions, preview.currency)} />
                <SummaryStat label="Total Net" value={formatCurrency(preview.total_net, preview.currency)} emphasis />
                <SummaryStat label="Employer Cost" value={formatCurrency(preview.total_employer_contributions, preview.currency)} />
                <SummaryStat label="Remittance" value={formatCurrency(preview.total_remittance_owed, preview.currency)} />
              </div>
            </div>
          )}

          {previewError && (
            <ErrorBlock message={previewError} title="Preview failed" />
          )}
          {submitError && (
            <ErrorBlock message={submitError} title="Save failed" />
          )}
        </>
      )}

      {/* Sticky footer */}
      {!loading && !loadError && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#FFFFFF",
          borderTop: "1px solid #E5E7EB",
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          zIndex: 10,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
        }}>
          <div style={{ flex: 1, fontSize: "13px", color: "#6B7280" }}>
            {selectedCount === 0 ? (
              "Select at least one employee to continue"
            ) : (
              <>
                <strong style={{ color: "#111827" }}>{selectedCount}</strong>
                {" employees selected"}
                {estimatedGross > 0 && (
                  <>
                    {" "}
                    estimated gross
                    {" "}
                    <strong style={{ color: "#111827" }}>{formatCurrency(estimatedGross)}</strong>
                  </>
                )}
              </>
            )}
          </div>
          <button
            onClick={() => navigate("/payroll/runs")}
            style={ghostBtn}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handlePreview}
            style={secondaryBtn}
            disabled={selectedCount === 0 || previewing || submitting}
          >
            <RefreshCw size={14} className={previewing ? "spin" : ""} />
            {previewing ? "Calculating..." : "Preview"}
          </button>
          <button
            onClick={handleSave}
            style={{
              ...primaryBtn,
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
            disabled={!canSubmit}
          >
            {submitting ? "Saving..." : "Save as Draft"}
          </button>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: "11px",
  fontWeight: "600",
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px",
  fontSize: "14px",
  color: "#111827",
};

function SummaryStat({ label, value, emphasis }) {
  return (
    <div>
      <div style={{
        fontSize: "11px",
        fontWeight: "600",
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: "4px",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: emphasis ? "22px" : "18px",
        fontWeight: "700",
        color: emphasis ? TEAL_DARK : "#111827",
      }}>
        {value}
      </div>
    </div>
  );
}

function ErrorBlock({ message, title }) {
  return (
    <div style={{
      background: "#FEF2F2",
      border: "1px solid #FECACA",
      borderRadius: "12px",
      padding: "16px 20px",
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      color: "#991B1B",
      marginBottom: "20px",
    }}>
      <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
      <div>
        <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
          {title || "Something went wrong"}
        </div>
        <div style={{ fontSize: "13px", color: "#7F1D1D" }}>{message}</div>
      </div>
    </div>
  );
}
