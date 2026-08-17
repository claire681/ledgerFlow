import React, { useEffect, useState } from "react";
import { MessageSquare, Calendar as CalendarIcon } from "lucide-react";
import EditModal, { CollapsibleSection } from "./EditModal";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const C = { ink: "#0E1A1A", muted: "#12262B", line: "#E7EAF0", brand: "#15A08C", brandDark: "#0F6E56", brandBg: "#E1F5EE" };

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Casual", "Contract", "Intern"];
const PAY_TYPES = ["hourly", "salary", "commission"];
const PAY_FREQUENCIES = ["Weekly", "Bi-weekly", "Semi-monthly", "Monthly"];

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

export default function EmploymentDetailsModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const employee = props.employee || {};
  const providedLocations = props.locations || [];

  const [title, setTitle] = useState("");
  const [empNumber, setEmpNumber] = useState("");
  const [dept, setDept] = useState("");
  const [empType, setEmpType] = useState("Full-time");
  const [payType, setPayType] = useState("hourly");
  const [payFreq, setPayFreq] = useState("Semi-monthly");
  const [startDate, setStartDate] = useState("");
  const [locId, setLocId] = useState("");
  const [workCity, setWorkCity] = useState("");
  const [workStreet, setWorkStreet] = useState("");
  const [workProvince, setWorkProvince] = useState("Alberta");
  const [workPostal, setWorkPostal] = useState("");
  const [status, setStatus] = useState("active");
  const [lastDayOfWork, setLastDayOfWork] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [showInListsOnly, setShowInListsOnly] = useState(false);
  const [locations, setLocations] = useState(providedLocations);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(function() {
    if (!isOpen) return;
    setTitle(employee.position_title || "");
    setEmpNumber(employee.employee_number || "");
    setDept(employee.department || "");
    setEmpType(employee.employment_type || "Full-time");
    setPayType(employee.pay_type || "hourly");
    setPayFreq(employee.pay_frequency || "Semi-monthly");
    setStartDate(employee.start_date ? String(employee.start_date).slice(0, 10) : "");
    setLocId(employee.work_location_id || "");
    setWorkCity(employee.work_city || "");
    setWorkStreet(employee.work_street || "");
    setWorkProvince(employee.work_province || "Alberta");
    setWorkPostal(employee.work_postal || "");
    setStatus(employee.employment_status || "active");
    setLastDayOfWork(employee.last_day_of_work ? String(employee.last_day_of_work).slice(0,10) : "");
    setStatusReason(employee.status_change_reason || "");
    setShowInListsOnly(!!employee.show_in_lists_only);
    setSaving(false); setSaveError(null);
    setFieldErrors({}); setAttempted(false);

    // Reload locations if not provided
    if (!providedLocations || providedLocations.length === 0) {
      fetch(API + "/api/v1/work-locations", { headers: authHeaders() })
        .then(function(r) { return r.ok ? r.json() : []; })
        .then(function(data) { setLocations(Array.isArray(data) ? data : (data.items || [])); })
        .catch(function() {});
    }
  }, [isOpen, employee, providedLocations]);

  async function handleSave() {
    if (!employee.id) return;
    // Validate required fields
    const errors = {};
    if (!title || !title.trim()) errors.title = "Job title is required";
    if (!startDate) errors.startDate = "Start date is required";
    if (!workCity || !workCity.trim()) errors.workCity = "City is required";
    if (!workStreet || !workStreet.trim()) errors.workStreet = "Street is required";
    if (!workPostal || !workPostal.trim()) errors.workPostal = "Postal code is required";
    if (!status) errors.status = "Select a status";
    const groupB = ["unpaid_leave", "terminated", "not_on_payroll", "deceased"];
    if (groupB.indexOf(status) !== -1) {
      if (!lastDayOfWork) errors.lastDayOfWork = "Enter the last day of work";
      if (!statusReason) errors.statusReason = "Select a reason";
    }
    setFieldErrors(errors);
    setAttempted(true);
    if (Object.keys(errors).length > 0) {
      setSaveError("Please fix the fields highlighted below");
      return;
    }
    setSaving(true); setSaveError(null);
    var body = {
      position_title: title || null,
      employee_number: empNumber || null,
      department: dept || null,
      employment_type: empType || null,
      pay_type: payType || null,
      pay_frequency: payFreq || null,
      start_date: startDate || null,
      work_location_id: locId || null,
      work_city: workCity || null,
      work_street: workStreet || null,
      work_province: workProvince || null,
      work_postal: workPostal || null,
      employment_status: status,
      last_day_of_work: lastDayOfWork || null,
      status_change_reason: statusReason || null,
      show_in_lists_only: showInListsOnly,
    };
    try {
      const r = await fetch(API + "/api/v1/payroll/employees/" + employee.id, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(body),
      });
      if (!r.ok) { const t = await r.text(); throw new Error("Save failed: " + (t || r.status)); }
      setSaving(false); onSaved && onSaved();
    } catch (e) { setSaving(false); setSaveError(e.message || "Save failed"); }
  }

  const employeeName = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "this employee";
  const positionRaw = employee.position_title || "";
  const subtitle = positionRaw ? (employeeName + " \u00b7 " + positionRaw) : employeeName;

  return (
    <EditModal
      isOpen={isOpen} onClose={onClose} onSave={handleSave}
      title="Edit employment details" subtitle={subtitle} iconLetter="E"
      saving={saving} saveError={saveError} saveDisabled={saving}
      hasUnsavedChanges={true} saveLabel="Save employment"
      secondaryAction={
        <a href="mailto:support@getnovala.com?subject=Feedback%20on%20employment"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.brandDark, textDecoration: "underline", fontWeight: 700 }}>
          <MessageSquare size={15} /> Give feedback
        </a>
      }
    >
      {attempted && Object.keys(fieldErrors).length > 0 && (
        <div style={{ background: "#FEE2E2", borderLeft: "3px solid #DC2626", borderRadius: "0 8px 8px 0", padding: "12px 14px", marginBottom: 18, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 16 }}>&#9888;</span>
          <div style={{ fontSize: 13, color: "#991B1B", fontWeight: 600 }}>Please fix the fields highlighted below ({Object.keys(fieldErrors).length} missing)</div>
        </div>
      )}
      <CollapsibleSection title="Role" defaultOpen={true}>
        <Field label="Position title" required error={fieldErrors.title}><TextInput value={title} onChange={setTitle} placeholder="Home care worker" error={fieldErrors.title} /></Field>
        <Field label="Employee ID number"><TextInput value={empNumber} onChange={setEmpNumber} placeholder="Optional. Auto-generated if left blank." /></Field>
        <TwoCol>
          <Field label="Department"><TextInput value={dept} onChange={setDept} placeholder="Care team" /></Field>
          <Field label="Employment type">
            <SelectInput value={empType} onChange={setEmpType}>
              {EMPLOYMENT_TYPES.map(function(e) { return <option key={e} value={e}>{e}</option>; })}
            </SelectInput>
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Pay type">
            <SelectInput value={payType} onChange={setPayType}>
              {PAY_TYPES.map(function(t) { return <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>; })}
            </SelectInput>
          </Field>
          <Field label="Pay frequency">
            <SelectInput value={payFreq} onChange={setPayFreq}>
              {PAY_FREQUENCIES.map(function(p) { return <option key={p} value={p}>{p}</option>; })}
            </SelectInput>
          </Field>
        </TwoCol>
      </CollapsibleSection>

      <CollapsibleSection title="Dates" defaultOpen={true}>
        <Field label="Start date" required error={fieldErrors.startDate}>
          <div style={{ display: "flex", alignItems: "center", height: 44, padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF" }}>
            <CalendarIcon size={14} color={C.muted} style={{ marginRight: 10 }} />
            <input type="date" value={startDate}
              onChange={function(e) { setStartDate(e.target.value); }}
              style={{ border: 0, outline: "none", fontSize: 14, color: C.ink, flex: 1, fontFamily: FONT, fontWeight: 500, background: "transparent" }} />
          </div>
        </Field>
      </CollapsibleSection>

      <CollapsibleSection title="Work location" defaultOpen={true}>
        <Field label="Street address" required error={fieldErrors.workStreet}>
          <TextInput value={workStreet} onChange={setWorkStreet} placeholder="123 Main Street" error={fieldErrors.workStreet} />
        </Field>
        <TwoCol>
          <Field label="City" required error={fieldErrors.workCity}>
            <TextInput value={workCity} onChange={setWorkCity} placeholder="Edmonton" error={fieldErrors.workCity} />
          </Field>
          <Field label="Province">
            <SelectInput value={workProvince} onChange={setWorkProvince}>
              <option value="Alberta">Alberta</option>
              <option value="British Columbia">British Columbia</option>
              <option value="Manitoba">Manitoba</option>
              <option value="New Brunswick">New Brunswick</option>
              <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
              <option value="Nova Scotia">Nova Scotia</option>
              <option value="Northwest Territories">Northwest Territories</option>
              <option value="Nunavut">Nunavut</option>
              <option value="Ontario">Ontario</option>
              <option value="Prince Edward Island">Prince Edward Island</option>
              <option value="Quebec">Quebec</option>
              <option value="Saskatchewan">Saskatchewan</option>
              <option value="Yukon">Yukon</option>
            </SelectInput>
          </Field>
        </TwoCol>
        <Field label="Postal code" required error={fieldErrors.workPostal}>
          <TextInput value={workPostal} onChange={setWorkPostal} placeholder="T5H 0S4" error={fieldErrors.workPostal} />
        </Field>
      </CollapsibleSection>
      <CollapsibleSection title="Status" defaultOpen={true}>
        {(function() {
          const helperMap = {
            active: "Actively working and receiving pay.",
            paid_leave: "Temporarily not working but receiving pay.",
            unpaid_leave: "Temporarily not working and not receiving pay.",
            terminated: "Employment has ended.",
            not_on_payroll: "No regular pay (for example, an owner or board member).",
            deceased: "Employee has passed away."
          };
          const groupB = ["unpaid_leave", "terminated", "not_on_payroll", "deceased"].indexOf(status) !== -1;
          const reasonOptions = [
            { key: "shortage_of_work", label: "Shortage of work or end of contract" },
            { key: "illness_or_injury", label: "Illness or injury" },
            { key: "quit", label: "Quit" },
            { key: "maternity", label: "Maternity" },
            { key: "retirement", label: "Retirement" },
            { key: "dismissal", label: "Dismissal" },
            { key: "leave_of_absence", label: "Leave of absence" },
            { key: "parental", label: "Parental" },
            { key: "other", label: "Other" }
          ];
          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <Field label="Status" required error={fieldErrors.status}>
                  <SelectInput value={status} onChange={function(v) { setStatus(v); setLastDayOfWork(""); setStatusReason(""); setShowInListsOnly(false); }}>
                    <option value="active">Active</option>
                    <option value="paid_leave">Paid leave of absence</option>
                    <option value="unpaid_leave">Unpaid leave of absence</option>
                    <option value="terminated">Terminated</option>
                    <option value="not_on_payroll">Not on payroll</option>
                    <option value="deceased">Deceased</option>
                  </SelectInput>
                </Field>
                <div style={{ marginTop: 6, fontSize: 12.5, color: C.muted, fontWeight: 500, lineHeight: 1.5 }}>{helperMap[status] || ""}</div>
                {groupB && (
                  <div>
                    <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={showInListsOnly} onChange={function(e) { setShowInListsOnly(e.target.checked); }} style={{ width: 16, height: 16, accentColor: "#15A08C" }} />
                      <label style={{ fontSize: 13, fontWeight: 500, color: "#12262B", cursor: "pointer" }} onClick={function() { setShowInListsOnly(!showInListsOnly); }}>Show in employee lists only</label>
                      <span title="Keeps this person visible in employee lists and reports, but excludes them from new pay runs." style={{ width: 14, height: 14, background: "#6B7280", color: "white", borderRadius: "50%", fontSize: 10, textAlign: "center", lineHeight: "14px", cursor: "help" }}>i</span>
                    </div>
                    <Field label="Reason for status change" required error={fieldErrors.statusReason}>
                      <SelectInput value={statusReason} onChange={setStatusReason}>
                        <option value="">Select one</option>
                        {reasonOptions.map(function(r) { return <option key={r.key} value={r.key}>{r.label}</option>; })}
                      </SelectInput>
                    </Field>
                  </div>
                )}
              </div>
              <div>
                {groupB && (
                  <Field label="Last day of work" required error={fieldErrors.lastDayOfWork}>
                    <TextInput type="date" value={lastDayOfWork} onChange={setLastDayOfWork} error={fieldErrors.lastDayOfWork} />
                  </Field>
                )}
              </div>
            </div>
          );
        })()}
      </CollapsibleSection>
    </EditModal>
  );
}

function TwoCol(props) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 4 }}>{props.children}</div>; }
function Field(props) {
  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#12262B", marginBottom: 7 }}>
        {props.label}{props.required && <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>}
      </label>
      {props.children}
      {props.error && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 4, fontWeight: 600 }}>{props.error}</div>}
    </div>
  );
}
function TextInput(props) {
  const errored = !!props.error;
  return (
    <div style={{ display: "flex", alignItems: "center", height: 44, padding: "0 14px", border: (errored ? "1.5px solid #DC2626" : "1px solid " + C.line), borderRadius: 10, background: (errored ? "#FEF5F5" : "#FFFFFF") }}>
      <input type={props.type || "text"} value={props.value || ""} placeholder={props.placeholder || ""}
        onChange={function(e) { props.onChange(e.target.value); }}
        style={{ border: 0, outline: "none", fontSize: 14, color: C.ink, flex: 1, fontFamily: FONT, fontWeight: 500, background: "transparent" }} />
    </div>
  );
}
function SelectInput(props) {
  return (
    <select value={props.value || ""} onChange={function(e) { props.onChange(e.target.value); }}
      style={{ width: "100%", boxSizing: "border-box", height: 44, padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10, fontSize: 14, color: C.ink, background: "#FFFFFF", cursor: "pointer", fontFamily: FONT, fontWeight: 500 }}>
      {props.children}
    </select>
  );
}