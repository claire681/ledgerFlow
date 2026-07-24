import React, { useEffect, useMemo, useState } from "react";
import EditModal, { CollapsibleSection } from "./EditModal";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

const C = {
  ink: "#0E1A1A",
  muted: "#12262B",
  faint: "#66748B",
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

/**
 * BasePayModal - full-screen edit modal for an employee's Base pay.
 *
 * Props:
 *   isOpen        boolean
 *   onClose       function
 *   onSaved       function called after successful save (parent should refresh employee)
 *   employee      employee object (must include id + current base pay fields)
 */
export default function BasePayModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const employee = props.employee || {};

  const initial = useMemo(function() {
    return {
      pay_type: (employee.pay_type || "hourly").toLowerCase(),
      hourly_rate: employee.hourly_rate != null ? String(employee.hourly_rate) : "",
      salary_amount: employee.salary_amount != null ? String(employee.salary_amount) : "",
      pay_frequency: employee.pay_frequency || "semimonthly",
      hours_per_day: employee.hours_per_day != null ? String(employee.hours_per_day) : "8",
      days_per_week: employee.days_per_week != null ? String(employee.days_per_week) : "5",
    };
  }, [employee.id, isOpen]);

  const [payType, setPayType] = useState(initial.pay_type);
  const [hourlyRate, setHourlyRate] = useState(initial.hourly_rate);
  const [salaryAmount, setSalaryAmount] = useState(initial.salary_amount);
  const [payFrequency, setPayFrequency] = useState(initial.pay_frequency);
  const [hoursPerDay, setHoursPerDay] = useState(initial.hours_per_day);
  const [daysPerWeek, setDaysPerWeek] = useState(initial.days_per_week);
  const [effectiveOn, setEffectiveOn] = useState("current_period");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Reset when modal opens
  useEffect(function() {
    if (isOpen) {
      setPayType(initial.pay_type);
      setHourlyRate(initial.hourly_rate);
      setSalaryAmount(initial.salary_amount);
      setPayFrequency(initial.pay_frequency);
      setHoursPerDay(initial.hours_per_day);
      setDaysPerWeek(initial.days_per_week);
      setEffectiveOn("current_period");
      setSaving(false);
      setSaveError(null);
    }
  }, [isOpen, initial]);

  const hasUnsavedChanges = (
    payType !== initial.pay_type ||
    (payType === "hourly" && hourlyRate !== initial.hourly_rate) ||
    (payType === "salary" && salaryAmount !== initial.salary_amount) ||
    payFrequency !== initial.pay_frequency ||
    hoursPerDay !== initial.hours_per_day ||
    daysPerWeek !== initial.days_per_week
  );

  const saveDisabled = !hasUnsavedChanges;

  async function handleSave() {
    setSaving(true);
    setSaveError(null);

    const body = {
      pay_type: payType,
      pay_frequency: payFrequency,
      hours_per_day: parseFloat(hoursPerDay) || null,
      days_per_week: parseFloat(daysPerWeek) || null,
    };

    if (payType === "hourly") {
      body.hourly_rate = parseFloat(hourlyRate) || 0;
      body.salary_amount = 0;
    } else if (payType === "salary") {
      body.salary_amount = parseFloat(salaryAmount) || 0;
      body.hourly_rate = 0;
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
  const subtitle = position ? (employeeName + " · " + position) : employeeName;

  const footerContent = (
    <div>
      <div style={{
        fontSize: 12.5, fontWeight: 700, color: C.faint, marginBottom: 8,
        letterSpacing: 0.4, textTransform: "uppercase",
      }}>
        Effective on
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: C.muted, fontWeight: 500, cursor: "pointer" }}>
          <input
            type="radio"
            checked={effectiveOn === "current_period"}
            onChange={function() { setEffectiveOn("current_period"); }}
            style={{ accentColor: C.brand }}
          />
          Effective pay period
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: C.muted, fontWeight: 500, cursor: "pointer" }}>
          <input
            type="radio"
            checked={effectiveOn === "beginning_of_year"}
            onChange={function() { setEffectiveOn("beginning_of_year"); }}
            style={{ accentColor: C.brand }}
          />
          Beginning of this year
        </label>
      </div>
      {effectiveOn === "beginning_of_year" && (
        <div style={{
          marginTop: 10, background: C.amberBg, borderRadius: 8, padding: "8px 12px",
          fontSize: 11.5, color: C.amber, lineHeight: 1.5,
        }}>
          Applies to all payrolls processed from now on, even if dated in the past. You may need to make historical corrections manually.
        </div>
      )}
    </div>
  );

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
          <div>
            <FormLabel>Rate per hour</FormLabel>
            <MoneyInput
              value={hourlyRate}
              onChange={setHourlyRate}
              suffix="/hr"
            />
          </div>
        )}

        {payType === "salary" && (
          <div style={{ marginBottom: 16 }}>
            <FormLabel>Annual salary</FormLabel>
            <MoneyInput
              value={salaryAmount}
              onChange={setSalaryAmount}
              suffix="/year"
            />
          </div>
        )}

        {payType === "commission" && (
          <div style={{ background: C.amberBg, borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: C.amber, lineHeight: 1.5 }}>
            Commission-only compensation is tracked via Additional pay types. No base rate is set here.
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <FormLabel>Pay frequency</FormLabel>
          <select
            value={payFrequency}
            onChange={function(e) { setPayFrequency(e.target.value); }}
            style={{
              width: "100%", boxSizing: "border-box", height: 44,
              padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10,
              fontSize: 14, color: C.muted, background: "white", fontFamily: FONT,
              cursor: "pointer",
            }}
          >
            {PAY_FREQUENCIES.map(function(f) {
              return <option key={f.value} value={f.value}>{f.label}</option>;
            })}
          </select>
        </div>

        <div style={{ marginTop: 20 }}>
          <FormLabel>Account mapping</FormLabel>
          <div style={{
            display: "flex", alignItems: "center", height: 44, padding: "0 14px",
            border: "1px solid " + C.line, borderRadius: 10, background: C.page,
          }}>
            <span style={{ color: C.faint, marginRight: 8 }}>🔒</span>
            <span style={{ fontSize: 13.5, color: C.muted, flex: 1 }}>Payroll Expenses: Wages</span>
          </div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 6, lineHeight: 1.5 }}>
            Used to categorize and map your payroll transactions. To edit, see Accounting under Payroll settings.
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Default working hours"
        subtitle="Optional"
      >
        <div style={{
          background: C.amberBg, borderRadius: 8, padding: "10px 14px",
          marginBottom: 14, fontSize: 12, color: C.amber, lineHeight: 1.5,
        }}>
          If {employee.first_name || "this employee"} works the same schedule every pay period, entering these enables Auto Payroll and helps calculate stat holiday ADW correctly.
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
        background: selected ? C.brandBg : "white",
        border: selected ? "2px solid " + C.brand : "1px solid " + C.line,
        borderRadius: 10,
        color: selected ? "#04342C" : C.muted,
        fontSize: 13.5,
        fontWeight: selected ? 700 : 600,
        cursor: "pointer",
        userSelect: "none",
        fontFamily: FONT,
      }}
    >
      {selected ? "● " : "○ "}{props.label}
    </div>
  );
}

function FormLabel(props) {
  return (
    <label style={{
      display: "block", fontSize: 12.5, fontWeight: 600,
      color: C.faint, marginBottom: 7,
    }}>
      {props.children}
    </label>
  );
}

function MoneyInput(props) {
  return (
    <div style={{
      display: "flex", alignItems: "center", height: 44,
      padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10, background: "white",
    }}>
      <span style={{ color: C.faint, marginRight: 8 }}>$</span>
      <input
        type="text"
        value={props.value}
        onChange={function(e) { props.onChange(e.target.value); }}
        style={{
          border: 0, outline: "none", fontSize: 14, color: C.muted,
          flex: 1, fontFamily: FONT, fontVariantNumeric: "tabular-nums",
        }}
      />
      {props.suffix && (
        <span style={{ color: C.faint, fontSize: 13 }}>{props.suffix}</span>
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
        fontSize: 14, color: C.muted, fontFamily: FONT,
        fontVariantNumeric: "tabular-nums",
      }}
    />
  );
}