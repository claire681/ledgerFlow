import React, { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import EditModal, { CollapsibleSection } from "./EditModal";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const C = { ink: "#0E1A1A", muted: "#12262B", line: "#E7EAF0", brand: "#15A08C", brandDark: "#0F6E56", brandBg: "#E1F5EE" };

const RELATIONSHIPS = ["Spouse","Partner","Parent","Sibling","Child","Friend","Other family","Other"];

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

export default function EmergencyContactsModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const employee = props.employee || {};

  const [p1Name, setP1Name] = useState("");
  const [p1Rel, setP1Rel] = useState("Spouse");
  const [p1Phone, setP1Phone] = useState("");
  const [p1Email, setP1Email] = useState("");
  const [p2Name, setP2Name] = useState("");
  const [p2Rel, setP2Rel] = useState("Parent");
  const [p2Phone, setP2Phone] = useState("");
  const [p2Email, setP2Email] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(function() {
    if (!isOpen) return;
    setP1Name(employee.emergency_contact_name || employee.emergency_name || "");
    setP1Rel(employee.emergency_contact_relationship || employee.emergency_relationship || "Spouse");
    setP1Phone(employee.emergency_contact_phone || employee.emergency_phone || "");
    setP1Email(employee.emergency_contact_email || "");
    setP2Name(employee.emergency_contact_2_name || "");
    setP2Rel(employee.emergency_contact_2_relationship || "Parent");
    setP2Phone(employee.emergency_contact_2_phone || "");
    setP2Email(employee.emergency_contact_2_email || "");
    setSaving(false); setSaveError(null);
  }, [isOpen, employee]);

  async function handleSave() {
    if (!employee.id) return;
    setSaving(true); setSaveError(null);
    var body = {
      emergency_contact_name: p1Name || null,
      emergency_contact_relationship: p1Rel || null,
      emergency_contact_phone: p1Phone || null,
      emergency_contact_email: p1Email || null,
      emergency_contact_2_name: p2Name || null,
      emergency_contact_2_relationship: p2Rel || null,
      emergency_contact_2_phone: p2Phone || null,
      emergency_contact_2_email: p2Email || null,
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
      title="Edit emergency contacts" subtitle={subtitle} iconLetter="E"
      saving={saving} saveError={saveError} saveDisabled={saving}
      hasUnsavedChanges={true} saveLabel="Save contacts"
      secondaryAction={
        <a href="mailto:support@getnovala.com?subject=Feedback%20on%20emergency%20contacts"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.brandDark, textDecoration: "underline", fontWeight: 700 }}>
          <MessageSquare size={15} /> Give feedback
        </a>
      }
    >
      <CollapsibleSection title="Primary contact" defaultOpen={true}>
        <Field label="Full name"><TextInput value={p1Name} onChange={setP1Name} placeholder="John Kemanzi" /></Field>
        <Field label="Relationship">
          <SelectInput value={p1Rel} onChange={setP1Rel}>
            {RELATIONSHIPS.map(function(r) { return <option key={r} value={r}>{r}</option>; })}
          </SelectInput>
        </Field>
        <TwoCol>
          <Field label="Phone"><TextInput value={p1Phone} onChange={setP1Phone} placeholder="+1 (___) ___ ____" /></Field>
          <Field label="Email (optional)"><TextInput type="email" value={p1Email} onChange={setP1Email} /></Field>
        </TwoCol>
      </CollapsibleSection>

      <CollapsibleSection title="Secondary contact (optional)" defaultOpen={false}>
        <Field label="Full name"><TextInput value={p2Name} onChange={setP2Name} /></Field>
        <Field label="Relationship">
          <SelectInput value={p2Rel} onChange={setP2Rel}>
            {RELATIONSHIPS.map(function(r) { return <option key={r} value={r}>{r}</option>; })}
          </SelectInput>
        </Field>
        <TwoCol>
          <Field label="Phone"><TextInput value={p2Phone} onChange={setP2Phone} placeholder="+1 (___) ___ ____" /></Field>
          <Field label="Email (optional)"><TextInput type="email" value={p2Email} onChange={setP2Email} /></Field>
        </TwoCol>
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