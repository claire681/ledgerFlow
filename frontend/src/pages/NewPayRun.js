import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, Users, AlertCircle, RefreshCw, Plus, CheckCircle, UserX,
} from "lucide-react";
import {
  Button, Card, CardHeader, Input, Select, Checkbox, Spinner,
  colors, typography, spacing, radius,
} from "../design-system";

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
  weekly: 52, bi_weekly: 26, biweekly: 26,
  semi_monthly: 24, semimonthly: 24, monthly: 12,
};

const today = () => new Date().toISOString().split("T")[0];
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const getEmployeeName = (emp) =>
  emp.name || emp.full_name ||
  [emp.first_name, emp.last_name].filter(Boolean).join(" ") ||
  emp.email || "Unnamed employee";
const getEmployeeRate = (emp) => parseFloat(emp.hourly_rate || emp.pay_rate || 0) || 0;
const getEmployeeSalary = (emp) => parseFloat(emp.salary_amount || emp.salary || 0) || 0;
const getPayType = (emp) => (emp.pay_type || emp.employment_type || "hourly").toLowerCase();

const iconWrapStyle = {
  width: 38, height: 38,
  background: colors.brandSoft,
  borderRadius: radius.lg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const colHeaderStyle = {
  textAlign: "left",
  padding: "8px 12px",
  ...typography.labelUppercase,
  color: colors.textMuted,
  whiteSpace: "nowrap",
};

function ErrorBlock({ title, message }) {
  return (
    <Card style={{
      background: colors.dangerSoft,
      border: `1px solid ${colors.danger}40`,
      display: "flex",
      alignItems: "flex-start",
      gap: spacing[3],
      marginBottom: spacing[5],
    }}>
      <AlertCircle size={20} color={colors.danger} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ ...typography.bodyStrong, color: colors.dangerText, marginBottom: 4 }}>
          {title || "Something went wrong"}
        </div>
        <div style={{ ...typography.caption, color: colors.dangerText }}>{message}</div>
      </div>
    </Card>
  );
}

function SummaryStat({ label, value, emphasis }) {
  return (
    <div>
      <div style={{
        ...typography.tiny,
        color: colors.textMuted,
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: emphasis ? 22 : 18,
        fontWeight: 700,
        color: emphasis ? colors.brandPrimary : colors.textPrimary,
        fontFeatureSettings: '"tnum" 1',
        letterSpacing: "-0.01em",
      }}>
        {value}
      </div>
    </div>
  );
}

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
        if (!token) throw new Error("Not signed in. Please sign in first.");
        const [empRes, setRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/payroll/employees`, { headers: authHeaders() }),
          fetch(`${API_URL}/api/v1/payroll/settings`, { headers: authHeaders() }),
        ]);
        if (!empRes.ok) throw new Error(`Could not load employees (HTTP ${empRes.status})`);
        const empData = await empRes.json();
        const empList = Array.isArray(empData) ? empData : (empData.employees || empData.data || []);
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
    if (payType === "salary") return getEmployeeSalary(emp) / (form.pay_periods_per_year || 26);
    const rate = getEmployeeRate(emp);
    return (
      (vals.regular || 0) * rate +
      (vals.overtime || 0) * rate * 1.5 +
      (vals.vacation || 0) * rate +
      (vals.sick || 0) * rate +
      (vals.bonus || 0)
    );
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
          evening: 0, overnight: 0, weekend: 0, on_call: 0, travel: 0,
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
      if (body.employee_inputs.length === 0) throw new Error("Select at least one employee");
      const res = await fetch(`${API_URL}/api/v1/payroll/runs/preview`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Preview failed (HTTP ${res.status})`);
      }
      setPreview(await res.json());
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
      if (body.employee_inputs.length === 0) throw new Error("Select at least one employee");

      const createRes = await fetch(`${API_URL}/api/v1/payroll/runs`, {
        method: "POST", headers: authHeaders(),
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
        method: "POST", headers: authHeaders(),
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
    selectedCount > 0 && form.pay_period_start && form.pay_period_end && form.pay_date && !submitting;

  return (
    <div style={{
      background: colors.bgPage,
      minHeight: "100vh",
      fontFamily: typography.fontFamily,
      padding: `${spacing[8]}px ${spacing[10]}px ${120}px`,
      boxSizing: "border-box",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Back link + title */}
        <button
          onClick={() => navigate("/payroll/runs")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
            ...typography.bodySm, color: colors.textSecondary,
            padding: 0, marginBottom: spacing[3],
            fontFamily: typography.fontFamily,
          }}
        >
          <ArrowLeft size={16} />
          Pay runs
        </button>

        <h1 style={{
          ...typography.displaySm,
          color: colors.textPrimary,
          margin: `0 0 ${spacing[1]}px 0`,
        }}>
          New pay run
        </h1>
        <p style={{
          ...typography.body,
          color: colors.textSecondary,
          margin: `0 0 ${spacing[8]}px 0`,
        }}>
          Set the pay period, choose employees, enter hours, then save as draft.
        </p>

        {loading && (
          <div style={{ padding: `${spacing[12]}px 0`, textAlign: "center" }}>
            <Spinner size={20} label="Loading employees and settings..." inline />
          </div>
        )}

        {loadError && !loading && <ErrorBlock title="Could not load data" message={loadError} />}

        {!loading && !loadError && (
          <>
            {/* Pay Period */}
            <Card style={{ marginBottom: spacing[5] }}>
              <CardHeader
                title="Pay period"
                subtitle="The date range this run covers and when employees will be paid"
                icon={<div style={iconWrapStyle}><Calendar size={18} color={colors.brandPrimary} /></div>}
              />
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: spacing[4],
              }}>
                <Input
                  type="date"
                  label="Period start"
                  value={form.pay_period_start}
                  onChange={(e) => updateForm("pay_period_start", e.target.value)}
                />
                <Input
                  type="date"
                  label="Period end"
                  value={form.pay_period_end}
                  onChange={(e) => updateForm("pay_period_end", e.target.value)}
                />
                <Input
                  type="date"
                  label="Pay date"
                  value={form.pay_date}
                  onChange={(e) => updateForm("pay_date", e.target.value)}
                />
                <Select
                  label="Pay periods per year"
                  value={form.pay_periods_per_year}
                  onChange={(e) => updateForm("pay_periods_per_year", parseInt(e.target.value, 10))}
                  options={[
                    { value: 52, label: "Weekly (52)" },
                    { value: 26, label: "Biweekly (26)" },
                    { value: 24, label: "Semi-monthly (24)" },
                    { value: 12, label: "Monthly (12)" },
                  ]}
                />
              </div>
            </Card>

            {/* Employees */}
            <Card style={{ marginBottom: spacing[5] }} noPadding>
              <div style={{ padding: spacing[6], borderBottom: `1px solid ${colors.borderSubtle}` }}>
                <CardHeader
                  title="Employees and hours"
                  subtitle={`${selectedCount} of ${employees.length} selected`}
                  icon={<div style={iconWrapStyle}><Users size={18} color={colors.brandPrimary} /></div>}
                />
                <p style={{ ...typography.bodySm, color: colors.textSecondary, margin: `${spacing[1]}px 0 0` }}>
                  Tick the employees to include and enter their hours. Untick to exclude.
                </p>
              </div>

              {employees.length === 0 ? (
                <div style={{ padding: `${spacing[10]}px ${spacing[8]}px`, textAlign: "center" }}>
                  <div style={{
                    width: 56, height: 56, background: colors.bgCardActive,
                    borderRadius: radius.pill,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    marginBottom: spacing[3],
                  }}>
                    <UserX size={24} color={colors.textMuted} />
                  </div>
                  <div style={{ ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing[1] }}>
                    No employees yet
                  </div>
                  <p style={{ ...typography.bodySm, color: colors.textSecondary, margin: `0 0 ${spacing[4]}px` }}>
                    Add employees first on the Payroll page.
                  </p>
                  <Button variant="secondary" onClick={() => navigate("/payroll")}>
                    Go to Payroll
                  </Button>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: typography.fontFamily,
                    minWidth: 780,
                  }}>
                    <thead>
                      <tr style={{
                        background: colors.bgCardActive,
                        borderBottom: `1px solid ${colors.borderSubtle}`,
                      }}>
                        <th style={colHeaderStyle}>Employee</th>
                        <th style={colHeaderStyle}>Type</th>
                        <th style={{ ...colHeaderStyle, textAlign: "right" }}>Reg</th>
                        <th style={{ ...colHeaderStyle, textAlign: "right" }}>OT</th>
                        <th style={{ ...colHeaderStyle, textAlign: "right" }}>Vac</th>
                        <th style={{ ...colHeaderStyle, textAlign: "right" }}>Sick</th>
                        <th style={{ ...colHeaderStyle, textAlign: "right" }}>Bonus</th>
                        <th style={{ ...colHeaderStyle, textAlign: "right" }}>Est. gross</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp, idx) => {
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
                              borderBottom: idx < employees.length - 1 ? `1px solid ${colors.borderSubtle}` : "none",
                              background: isSelected ? colors.bgCardHover : colors.bgCard,
                              opacity: isSelected ? 1 : 0.6,
                              transition: "all 150ms ease",
                            }}
                          >
                            <td style={{ padding: `${spacing[3]}px ${spacing[3]}px` }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <Checkbox checked={isSelected} onChange={() => toggleEmployee(emp)} />
                                <div>
                                  <div style={{ ...typography.bodyMd, color: colors.textPrimary }}>
                                    {getEmployeeName(emp)}
                                  </div>
                                  <div style={{ ...typography.caption, color: colors.textSecondary }}>
                                    {isSalary
                                      ? `${formatCurrency(salary, emp.currency)} / yr`
                                      : `${formatCurrency(rate, emp.currency)} / hr`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: `${spacing[3]}px ${spacing[3]}px`, ...typography.caption, color: colors.textSecondary }}>
                              {isSalary ? "Salary" : "Hourly"}
                            </td>
                            <td style={{ padding: `${spacing[3]}px ${spacing[3]}px`, textAlign: "right" }}>
                              <Input inline numeric disabled={!isSelected || isSalary} value={sel?.regular ?? ""}
                                onChange={(e) => updateField(emp.id, "regular", e.target.value)} placeholder="0" />
                            </td>
                            <td style={{ padding: `${spacing[3]}px ${spacing[3]}px`, textAlign: "right" }}>
                              <Input inline numeric disabled={!isSelected || isSalary} value={sel?.overtime ?? ""}
                                onChange={(e) => updateField(emp.id, "overtime", e.target.value)} placeholder="0" />
                            </td>
                            <td style={{ padding: `${spacing[3]}px ${spacing[3]}px`, textAlign: "right" }}>
                              <Input inline numeric disabled={!isSelected || isSalary} value={sel?.vacation ?? ""}
                                onChange={(e) => updateField(emp.id, "vacation", e.target.value)} placeholder="0" />
                            </td>
                            <td style={{ padding: `${spacing[3]}px ${spacing[3]}px`, textAlign: "right" }}>
                              <Input inline numeric disabled={!isSelected || isSalary} value={sel?.sick ?? ""}
                                onChange={(e) => updateField(emp.id, "sick", e.target.value)} placeholder="0" />
                            </td>
                            <td style={{ padding: `${spacing[3]}px ${spacing[3]}px`, textAlign: "right" }}>
                              <Input inline numeric disabled={!isSelected} value={sel?.bonus ?? ""}
                                onChange={(e) => updateField(emp.id, "bonus", e.target.value)} placeholder="0" />
                            </td>
                            <td style={{
                              padding: `${spacing[3]}px ${spacing[3]}px`,
                              textAlign: "right",
                              ...typography.bodyStrong,
                              color: isSelected ? colors.textPrimary : colors.textMuted,
                              fontFeatureSettings: '"tnum" 1',
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
            </Card>

            {/* Preview totals */}
            {preview && (
              <Card style={{
                background: colors.brandSoft,
                border: `1px solid ${colors.brandSoftStrong}`,
                marginBottom: spacing[5],
              }}>
                <CardHeader
                  title="Preview totals"
                  subtitle="From the engine. Save as draft to persist these pay stubs."
                  icon={<div style={iconWrapStyle}><CheckCircle size={18} color={colors.brandPrimary} /></div>}
                />
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: spacing[4],
                }}>
                  <SummaryStat label="Employees" value={preview.employee_count} />
                  <SummaryStat label="Total gross" value={formatCurrency(preview.total_gross, preview.currency)} />
                  <SummaryStat label="Deductions" value={formatCurrency(preview.total_employee_deductions, preview.currency)} />
                  <SummaryStat label="Total net" value={formatCurrency(preview.total_net, preview.currency)} emphasis />
                  <SummaryStat label="Employer cost" value={formatCurrency(preview.total_employer_contributions, preview.currency)} />
                  <SummaryStat label="Remittance" value={formatCurrency(preview.total_remittance_owed, preview.currency)} />
                </div>
              </Card>
            )}

            {previewError && <ErrorBlock title="Preview failed" message={previewError} />}
            {submitError && <ErrorBlock title="Save failed" message={submitError} />}
          </>
        )}
      </div>

      {/* Sticky footer */}
      {!loading && !loadError && (
        <div style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          background: colors.bgCard,
          borderTop: `1px solid ${colors.borderDefault}`,
          padding: `${spacing[4]}px ${spacing[10]}px`,
          display: "flex",
          alignItems: "center",
          gap: spacing[3],
          zIndex: 10,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.04)",
        }}>
          <div style={{ flex: 1, ...typography.bodySm, color: colors.textSecondary }}>
            {selectedCount === 0 ? (
              "Select at least one employee to continue"
            ) : (
              <>
                <strong style={{ color: colors.textPrimary }}>{selectedCount}</strong>{" "}
                employees selected
                {estimatedGross > 0 && (
                  <>
                    {", estimated gross "}
                    <strong style={{ color: colors.textPrimary, fontFeatureSettings: '"tnum" 1' }}>
                      {formatCurrency(estimatedGross)}
                    </strong>
                  </>
                )}
              </>
            )}
          </div>
          <Button variant="ghost" onClick={() => navigate("/payroll/runs")} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handlePreview}
            disabled={selectedCount === 0 || previewing || submitting}
            iconLeft={<RefreshCw size={14} />}
          >
            {previewing ? "Calculating..." : "Preview"}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!canSubmit}
          >
            {submitting ? "Saving..." : "Save as draft"}
          </Button>
        </div>
      )}
    </div>
  );
}
