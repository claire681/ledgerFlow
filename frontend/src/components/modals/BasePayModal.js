import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, HelpCircle, Lock, CalendarClock } from "lucide-react";
import EditModal, { CollapsibleSection } from "./EditModal";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

const C = {
  ink: "#0E1A1A",
  muted: "#12262B",
  line: "#E7EAF0",
  page: "#F8F9FA",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  amber: "#854F0B",
  amberBg: "#FAEEDA",
};

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

const PAY_FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "semimonthly", label: "Semi-monthly" },
  { value: "monthly", label: "Monthly" },
];

const SALARY_PERIODS = [
  { value: "year", label: "per year" },
  { value: "month", label: "per month" },
  { value: "week", label: "per week" },
];

export default function BasePayModal(props) {
  const navigate = useNavigate();
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const employee = props.employee || {};

  const initial = useMemo(function() {
    return {
      pay_type: (employee.pay_type || "hourly").toLowerCase(),
      hourly_rate: employee.hourly_rate != null ? String(employee.hourly_rate) : "",
      salary_amount: employee.salary_amount != null ? String(employee.salary_amount) : "",
      salary_period: "year",
      pay_frequency: employee.pay_frequency || "semimonthly",
      hours_per_day: employee.hours_per_day != null ? String(employee.hours_per_day) : "8",
      days_per_week: employee.days_per_week != null ? String(employee.days_per_week) : "5",
    };
  }, [employee.id, isOpen]);

  const [payType, setPayType] = useState(initial.pay_type);
  const [hourlyRate, setHourlyRate] = useState(initial.hourly_rate);
  const [salaryAmount, setSalaryAmount] = useState(initial.salary_amount);
  const [salaryPeriod, setSalaryPeriod] = useState(initial.salary_period);
  const [payFrequency, setPayFrequency] = useState(initial.pay_frequency);
  const [hoursPerDay, setHoursPerDay] = useState(initial.hours_per_day);
  const [daysPerWeek, setDaysPerWeek] = useState(initial.days_per_week);
  const [effectiveOn, setEffectiveOn] = useState("immediately");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [attempted, setAttempted] = useState(false);

  useEffect(function() {
    if (isOpen) {
      setPayType(initial.pay_type);
      setHourlyRate(initial.hourly_rate);
      setSalaryAmount(initial.salary_amount);
      setSalaryPeriod(initial.salary_period);
      setPayFrequency(initial.pay_frequency);
      setHoursPerDay(initial.hours_per_day);
      setDaysPerWeek(initial.days_per_week);
      setEffectiveOn("immediately");
      setSaving(false);
      setSaveError(null);
      setFieldErrors({});
      setAttempted(false);
    }
  }, [isOpen, initial]);

  const hasUnsavedChanges = (
    payType !== initial.pay_type ||
    (payType === "hourly" && hourlyRate !== initial.hourly_rate) ||
    (payType === "salary" && (salaryAmount !== initial.salary_amount || salaryPeriod !== initial.salary_period)) ||
    payFrequency !== initial.pay_frequency ||
    hoursPerDay !== initial.hours_per_day ||
    daysPerWeek !== initial.days_per_week
  );

  const saveDisabled = !hasUnsavedChanges;

  async function handleSave() {
    // Validate
    const errors = {};
    if (payType === "hourly") {
      const rate = parseFloat(hourlyRate);
      if (!hourlyRate || isNaN(rate) || rate <= 0) errors.hourlyRate = "Hourly rate must be greater than 0";
    } else if (payType === "salary") {
      const amt = parseFloat(salaryAmount);
      if (!salaryAmount || isNaN(amt) || amt <= 0) errors.salaryAmount = "Salary amount must be greater than 0";
    }
    setFieldErrors(errors);
    setAttempted(true);
    if (Object.keys(errors).length > 0) {
      setSaveError("Please fix the fields highlighted below");
      return;
    }
    setSaving(true);
    setSaveError(null);

    const body = {
      pay_type: payType,
      pay_frequency: payFrequency,
    };

    if (payType === "hourly") {
      body.hourly_rate = parseFloat(hourlyRate) || 0;
      body.salary_amount = 0;
      body.hours_per_day = parseFloat(hoursPerDay) || null;
      body.days_per_week = parseFloat(daysPerWeek) || null;
    } else if (payType === "salary") {
      let annual = parseFloat(salaryAmount) || 0;
      if (salaryPeriod === "month") annual = annual * 12;
      else if (salaryPeriod === "week") annual = annual * 52;
      body.salary_amount = annual;
      body.hourly_rate = 0;
      body.hours_per_day = parseFloat(hoursPerDay) || null;
      body.days_per_week = parseFloat(daysPerWeek) || null;
    } else {
      body.hourly_rate = 0;
      body.salary_amount = 0;
    }

    try {
      const r = await fetch(API + "/api/v1/payroll/employees/" + employee.id, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error("Save failed: " + (txt || r.status));
      }
      setSaving(false);
      onSaved && onSaved();
    } catch (e) {
      setSaving(false);
      setSaveError(e.message || "Save failed");
    }
  }

  const employeeName = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "Employee";
  const position = employee.position_title || "";
  const subtitle = position ? (employeeName + " \u00b7 " + position) : employeeName;
  const firstName = employee.first_name || "this employee";

  const isCommission = payType === "commission";

  const footerContent = !isCommission ? (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <CalendarClock size={18} color={C.ink} />
        <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Effective on</span>
      </div>
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 12 }}>
        When should this change start?
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Effective pay period</label>
          <HelpCircle size={14} color={C.muted} style={{ cursor: "help" }} />
        </div>
        <select
          value={effectiveOn}
          onChange={function(e) { setEffectiveOn(e.target.value); }}
          style={{
            width: "100%", boxSizing: "border-box", height: 44,
            padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10,
            fontSize: 14, color: C.ink, background: "#FFFFFF",
            cursor: "pointer", fontFamily: FONT, fontWeight: 500,
          }}
        >
          <option value="immediately">Immediately</option>
          <option value="next_period">Next pay period</option>
        </select>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 10 }}>
        <Info size={16} color={C.brand} style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
          Applies to all pay runs processed from now on, even if dated in the past.
        </span>
      </div>
    </div>
  ) : null;

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="Edit Base pay"
      subtitle={subtitle}
      iconLetter="$"
      saving={saving}
      saveError={saveError}
      saveDisabled={saveDisabled}
      hasUnsavedChanges={hasUnsavedChanges}
      footerContent={footerContent}
      saveLabel="Save Base pay"
    >
      <CollapsibleSection title="Compensation type">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <TypeChip label="Hourly" selected={payType === "hourly"} onClick={function() { setPayType("hourly"); }} />
          <TypeChip label="Salary" selected={payType === "salary"} onClick={function() { setPayType("salary"); }} />
          <TypeChip label="Commission only" selected={payType === "commission"} onClick={function() { setPayType("commission"); }} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Compensation details">
        {payType === "hourly" && (
          <div style={{ marginBottom: 16 }}>
            <FormLabel>Rate per hour</FormLabel>
            <MoneyInput value={hourlyRate} onChange={setHourlyRate} suffix="/hr" />
          </div>
        )}

        {payType === "salary" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <FormLabel>Pay frequency</FormLabel>
              <select
                value={salaryPeriod}
                onChange={function(e) { setSalaryPeriod(e.target.value); }}
                style={{
                  width: "100%", boxSizing: "border-box", height: 44,
                  padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10,
                  fontSize: 14, color: C.ink, background: "#FFFFFF",
                  cursor: "pointer", fontFamily: FONT, fontWeight: 500,
                }}
              >
                {SALARY_PERIODS.map(function(p) {
                  return <option key={p.value} value={p.value}>{p.label}</option>;
                })}
              </select>
            </div>
            <div>
              <FormLabel>Salary</FormLabel>
              <MoneyInput value={salaryAmount} onChange={setSalaryAmount} />
            </div>
          </div>
        )}

        {payType === "commission" && (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <Info size={18} color={C.brand} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>
                A commission pay type will be automatically assigned once you save changes. You can rename it in Additional pay types from the employee profile.
              </span>
            </div>
            <div style={{
              background: C.brandBg, border: "1px solid " + C.line,
              borderRadius: 10, padding: "14px 16px",
              display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16,
            }}>
              <Info size={18} color={C.brandDark} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 700, lineHeight: 1.5 }}>
                Overtime, stat pay, and time off policies are not available for commission only employees.
              </span>
            </div>
          </div>
        )}

        {!isCommission && (
          <div style={{ marginTop: 16 }}>
            <FormLabel>Pay frequency</FormLabel>
            <select
              value={payFrequency}
              onChange={function(e) { setPayFrequency(e.target.value); }}
              style={{
                width: "100%", boxSizing: "border-box", height: 44,
                padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10,
                fontSize: 14, color: C.ink, background: "#FFFFFF",
                cursor: "pointer", fontFamily: FONT, fontWeight: 500,
              }}
            >
              {PAY_FREQUENCIES.map(function(f) {
                return <option key={f.value} value={f.value}>{f.label}</option>;
              })}
            </select>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <FormLabel>Account mapping</FormLabel>
          <div style={{
            display: "flex", alignItems: "center", height: 44, padding: "0 14px",
            border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF",
          }}>
            <Lock size={14} color={C.muted} style={{ marginRight: 10 }} />
            <span style={{ fontSize: 14, color: C.ink, flex: 1, fontWeight: 500 }}>
              Payroll Expenses: Wages
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
            Used to categorize and map your payroll transactions. To edit, see Accounting under{" "}
            <a
              onClick={function() { onClose && onClose(); navigate("/payroll/settings"); }}
              style={{ color: C.brandDark, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
            >
              Payroll settings
            </a>
            .
          </div>
        </div>
      </CollapsibleSection>

      {!isCommission && (
        <CollapsibleSection title="Default working hours" subtitle="Optional">
          <div style={{
            background: C.amberBg, borderRadius: 8, padding: "10px 14px",
            marginBottom: 14, fontSize: 12.5, color: C.amber, lineHeight: 1.5, fontWeight: 500,
          }}>
            If {firstName} works the same schedule every pay period, entering these enables Auto Payroll and helps calculate stat holiday ADW correctly.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FormLabel>Hours per day</FormLabel>
              <NumberInput value={hoursPerDay} onChange={setHoursPerDay} />
            </div>
            <div>
              <FormLabel>Days per week</FormLabel>
              <NumberInput value={daysPerWeek} onChange={setDaysPerWeek} />
            </div>
          </div>
        </CollapsibleSection>
      )}
    </EditModal>
  );
}

// ---- Sub-components ----

function TypeChip(props) {
  const selected = props.selected;
  return (
    <div
      onClick={props.onClick}
      style={{
        padding: "10px 18px",
        background: selected ? C.brandBg : "#FFFFFF",
        border: selected ? "2px solid " + C.brand : "1px solid " + C.line,
        borderRadius: 10,
        color: selected ? C.ink : C.muted,
        fontSize: 13.5,
        fontWeight: 700,
        cursor: "pointer",
        userSelect: "none",
        fontFamily: FONT,
      }}
    >
      {props.label}
    </div>
  );
}

function FormLabel(props) {
  return (
    <label style={{
      display: "block", fontSize: 13, fontWeight: 700,
      color: "#12262B", marginBottom: 7,
    }}>
      {props.children}
    </label>
  );
}

function MoneyInput(props) {
  return (
    <div style={{
      display: "flex", alignItems: "center", height: 44,
      padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF",
    }}>
      <span style={{ color: C.muted, marginRight: 8, fontWeight: 600 }}>$</span>
      <input
        type="text"
        value={props.value}
        onChange={function(e) { props.onChange(e.target.value); }}
        style={{
          border: 0, outline: "none", fontSize: 14, color: C.ink,
          flex: 1, fontFamily: FONT, fontVariantNumeric: "tabular-nums", fontWeight: 500,
        }}
      />
      {props.suffix && (
        <span style={{ color: C.muted, fontSize: 13, fontWeight: 500 }}>{props.suffix}</span>
      )}
    </div>
  );
}

function NumberInput(props) {
  return (
    <input
      type="number"
      value={props.value}
      onChange={function(e) { props.onChange(e.target.value); }}
      style={{
        width: "100%", boxSizing: "border-box", height: 44,
        padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10,
        fontSize: 14, color: C.ink, fontFamily: FONT,
        fontVariantNumeric: "tabular-nums", fontWeight: 500,
      }}
    />
  );
}