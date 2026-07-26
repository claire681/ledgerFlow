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
  const [locations, setLocations] = useState(providedLocations);
  const [saving, setSaving] = useState(false);
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
    setSaving(false); setSaveError(null);

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
      <CollapsibleSection title="Role" defaultOpen={true}>
        <Field label="Position title"><TextInput value={title} onChange={setTitle} placeholder="Home care worker" /></Field>
        <Field label="Employee number"><TextInput value={empNumber} onChange={setEmpNumber} placeholder="Optional. Auto-generated if left blank." /></Field>
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
        <Field label="Start date">
          <div style={{ display: "flex", alignItems: "center", height: 44, padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF" }}>
            <CalendarIcon size={14} color={C.muted} style={{ marginRight: 10 }} />
            <input type="date" value={startDate}
              onChange={function(e) { setStartDate(e.target.value); }}
              style={{ border: 0, outline: "none", fontSize: 14, color: C.ink, flex: 1, fontFamily: FONT, fontWeight: 500, background: "transparent" }} />
          </div>
        </Field>
      </CollapsibleSection>

      <CollapsibleSection title="Work location" defaultOpen={true}>
        <Field label="Location">
          <SelectInput value={locId} onChange={setLocId}>
            <option value="">Select a work location</option>
            {locations.map(function(l) {
              return <option key={l.id} value={l.id}>{l.name}{l.province_or_state ? " \u00b7 " + l.province_or_state : ""}</option>;
            })}
          </SelectInput>
        </Field>
        {locations.length === 0 && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: C.muted, fontWeight: 500, lineHeight: 1.5 }}>
            No work locations set up yet. Add one in Payroll settings.
          </div>
        )}
      </CollapsibleSection>
    </EditModal>
  );
}

function TwoCol(props) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 4 }}>{props.children}</div>; }
function Field(props) {
  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#12262B", marginBottom: 7 }}>{props.label}</label>
      {props.children}
    </div>
  );
}
function TextInput(props) {
  return (
    <div style={{ display: "flex", alignItems: "center", height: 44, padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10, background: "#FFFFFF" }}>
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