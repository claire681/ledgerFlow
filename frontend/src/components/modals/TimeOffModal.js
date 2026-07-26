import React, { useEffect, useMemo, useState } from "react";
import { MessageSquare, Palmtree, Stethoscope, Clock } from "lucide-react";
import EditModal, { CollapsibleSection } from "./EditModal";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

const C = {
  ink: "#0E1A1A",
  muted: "#12262B",
  line: "#E7EAF0",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
};

const VACATION_POLICIES = [
  { value: "Accrued by hours worked", label: "Accrued by hours worked" },
  { value: "Fixed annual", label: "Fixed annual" },
  { value: "Unpaid", label: "Unpaid" },
];

const SICK_POLICIES = [
  { value: "none", label: "No sick pay" },
  { value: "fixed", label: "Fixed paid days per year" },
  { value: "accrued", label: "Accrued per hour worked" },
];

const UNPAID_POLICIES = [
  { value: "not_allowed", label: "Not allowed" },
  { value: "as_requested", label: "As requested" },
  { value: "with_approval", label: "With manager approval" },
];

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

export default function TimeOffModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const employee = props.employee || {};
  const initialData = props.data || null;

  const taxInfo = (employee.tax_info && typeof employee.tax_info === "object") ? employee.tax_info : {};

  const initial = useMemo(function() {
    var ti = (initialData && initialData.vacation) ? initialData : null;
    return {
      vacationPolicy: employee.vacation_policy || "Accrued by hours worked",
      accrualRate: ti ? (ti.vacation.accrual_rate || "") : (taxInfo.accrual_rate || ""),
      balanceHours: ti ? (ti.vacation.balance_hours || "") : (taxInfo.balance_hours || ""),
      sickPolicy: ti ? (ti.sick_pay.policy || "none") : (taxInfo.sick_policy || "none"),
      sickDaysPerYear: ti ? (ti.sick_pay.days_per_year || "") : (taxInfo.sick_days_per_year || ""),
      unpaidLeavePolicy: ti ? (ti.unpaid_leave.policy || "as_requested") : (taxInfo.unpaid_leave_policy || "as_requested"),
    };
  }, [initialData, employee]);

  const [vacationPolicy, setVacationPolicy] = useState(initial.vacationPolicy);
  const [accrualRate, setAccrualRate] = useState(String(initial.accrualRate || ""));
  const [balanceHours, setBalanceHours] = useState(String(initial.balanceHours || ""));
  const [sickPolicy, setSickPolicy] = useState(initial.sickPolicy);
  const [sickDaysPerYear, setSickDaysPerYear] = useState(String(initial.sickDaysPerYear || ""));
  const [unpaidLeavePolicy, setUnpaidLeavePolicy] = useState(initial.unpaidLeavePolicy);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(function() {
    if (isOpen) {
      setVacationPolicy(initial.vacationPolicy);
      setAccrualRate(String(initial.accrualRate || ""));
      setBalanceHours(String(initial.balanceHours || ""));
      setSickPolicy(initial.sickPolicy);
      setSickDaysPerYear(String(initial.sickDaysPerYear || ""));
      setUnpaidLeavePolicy(initial.unpaidLeavePolicy);
      setSaving(false); setSaveError(null);
    }
  }, [isOpen, initial]);

  const hasChanges = (
    vacationPolicy !== initial.vacationPolicy ||
    accrualRate !== String(initial.accrualRate || "") ||
    balanceHours !== String(initial.balanceHours || "") ||
    sickPolicy !== initial.sickPolicy ||
    sickDaysPerYear !== String(initial.sickDaysPerYear || "") ||
    unpaidLeavePolicy !== initial.unpaidLeavePolicy
  );

  async function handleSave() {
    if (!employee.id) return;
    setSaving(true); setSaveError(null);
    var currentTaxInfo = (employee.tax_info && typeof employee.tax_info === "object") ? employee.tax_info : {};
    var body = {
      vacation_policy: vacationPolicy,
      tax_info: Object.assign({}, currentTaxInfo, {
        accrual_rate: accrualRate === "" ? null : Number(accrualRate),
        balance_hours: balanceHours === "" ? null : Number(balanceHours),
        sick_policy: sickPolicy,
        sick_days_per_year: sickDaysPerYear === "" ? null : Number(sickDaysPerYear),
        unpaid_leave_policy: unpaidLeavePolicy,
      }),
    };
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

  const employeeName = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "this employee";
  const positionRaw = employee.position_title || "";
  const subtitle = positionRaw ? (employeeName + " \u00b7 " + positionRaw) : employeeName;

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="Edit time off"
      subtitle={subtitle}
      iconLetter="T"
      saving={saving}
      saveError={saveError}
      saveDisabled={!hasChanges || saving}
      hasUnsavedChanges={hasChanges}
      saveLabel="Save time off"
      secondaryAction={
        <a
          href="mailto:support@getnovala.com?subject=Feedback%20on%20time%20off"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.brandDark, textDecoration: "underline", fontWeight: 700 }}
        >
          <MessageSquare size={15} /> Give feedback
        </a>
      }
    >
      <CollapsibleSection title="Vacation" defaultOpen={true}>
        <FormLabel>Vacation policy</FormLabel>
        <select
          value={vacationPolicy}
          onChange={function(e) { setVacationPolicy(e.target.value); }}
          style={selectStyle}
        >
          {VACATION_POLICIES.map(function(p) {
            return <option key={p.value} value={p.value}>{p.label}</option>;
          })}
        </select>

        {vacationPolicy !== "Unpaid" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
            <div>
              <FormLabel>Accrual rate (%)</FormLabel>
              <div style={inputBoxStyle}>
                <input
                  type="text"
                  value={accrualRate}
                  onChange={function(e) { setAccrualRate(e.target.value); }}
                  style={inputStyle}
                  placeholder="4"
                />
                <span style={{ color: C.muted, fontSize: 13, fontWeight: 600, marginLeft: 6 }}>%</span>
              </div>
            </div>
            <div>
              <FormLabel>Current balance (hours)</FormLabel>
              <div style={inputBoxStyle}>
                <input
                  type="text"
                  value={balanceHours}
                  onChange={function(e) { setBalanceHours(e.target.value); }}
                  style={inputStyle}
                  placeholder="0"
                />
                <span style={{ color: C.muted, fontSize: 13, fontWeight: 500, marginLeft: 6 }}>hrs</span>
              </div>
            </div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Sick pay" defaultOpen={true}>
        <FormLabel>Sick pay policy</FormLabel>
        <select
          value={sickPolicy}
          onChange={function(e) { setSickPolicy(e.target.value); }}
          style={selectStyle}
        >
          {SICK_POLICIES.map(function(p) {
            return <option key={p.value} value={p.value}>{p.label}</option>;
          })}
        </select>

        {sickPolicy !== "none" && (
          <div style={{ marginTop: 16 }}>
            <FormLabel>Days per year</FormLabel>
            <div style={inputBoxStyle}>
              <input
                type="text"
                value={sickDaysPerYear}
                onChange={function(e) { setSickDaysPerYear(e.target.value); }}
                style={inputStyle}
                placeholder="5"
              />
              <span style={{ color: C.muted, fontSize: 13, fontWeight: 500, marginLeft: 6 }}>days</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 12.5, color: C.muted, fontWeight: 500, lineHeight: 1.5 }}>
              Days used this year are tracked automatically from finalized pay runs.
            </div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Unpaid leave" defaultOpen={true}>
        <FormLabel>Unpaid leave policy</FormLabel>
        <select
          value={unpaidLeavePolicy}
          onChange={function(e) { setUnpaidLeavePolicy(e.target.value); }}
          style={selectStyle}
        >
          {UNPAID_POLICIES.map(function(p) {
            return <option key={p.value} value={p.value}>{p.label}</option>;
          })}
        </select>
        <div style={{ marginTop: 10, fontSize: 12.5, color: C.muted, fontWeight: 500, lineHeight: 1.5 }}>
          Unpaid leave does not reduce vacation or sick balances. Hours taken as unpaid are excluded from gross pay.
        </div>
      </CollapsibleSection>
    </EditModal>
  );
}

function FormLabel(props) {
  return (
    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#12262B", marginBottom: 7 }}>
      {props.children}
    </label>
  );
}

const selectStyle = {
  width: "100%", boxSizing: "border-box", height: 44,
  padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10,
  fontSize: 14, color: C.ink, background: "#FFFFFF",
  cursor: "pointer", fontFamily: FONT, fontWeight: 500,
};

const inputBoxStyle = {
  display: "flex", alignItems: "center", height: 44,
  padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF",
};

const inputStyle = {
  border: 0, outline: "none", fontSize: 14, color: C.ink,
  flex: 1, fontFamily: FONT, fontVariantNumeric: "tabular-nums", fontWeight: 500,
  background: "transparent",
};