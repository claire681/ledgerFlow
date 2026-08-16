import React, { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import EditModal, { CollapsibleSection } from "./EditModal";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  ink: "#0E1A1A", muted: "#12262B", line: "#E7EAF0",
  brand: "#15A08C", brandDark: "#0F6E56", brandBg: "#E1F5EE",
};

const CA_PROVINCES = [
  "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador",
  "Northwest Territories","Nova Scotia","Nunavut","Ontario","Prince Edward Island",
  "Quebec","Saskatchewan","Yukon",
];

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

export default function PersonalInfoModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const employee = props.employee || {};

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [sin, setSin] = useState("");
  const [street, setStreet] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [prov, setProv] = useState("Alberta");
  const [postal, setPostal] = useState("");
  const [mailingSame, setMailingSame] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(function() {
    if (!isOpen) return;
    setFirstName(employee.first_name || "");
    setLastName(employee.last_name || "");
    setEmail(employee.personal_email || employee.email || "");
    setPhone(employee.phone || "");
    setDob(employee.date_of_birth ? String(employee.date_of_birth).slice(0, 10) : "");
    setSin(employee.sin_or_ssn || employee.sin || "");
    setStreet(employee.address_line1 || employee.address || "");
    setLine2(employee.address_line2 || "");
    setCity(employee.city || "");
    setProv(employee.province_or_state || employee.province || "Alberta");
    setPostal(employee.postal_or_zip || employee.postal_code || "");
    setMailingSame(employee.mailing_address_same !== false);
    setSaving(false); setSaveError(null);
    setFieldErrors({}); setAttempted(false);
  }, [isOpen, employee]);

  async function handleSave() {
    if (!employee.id) return;
    // Validate required fields
    const errors = {};
    if (!firstName || !firstName.trim()) errors.firstName = "First name is required";
    if (!lastName || !lastName.trim()) errors.lastName = "Last name is required";
    // SIN: required + must be 9 digits
    if (!sin || !sin.trim()) {
      errors.sin = "SIN is required";
    } else {
      const sinDigits = sin.replace(/\D/g, "");
      if (sinDigits.length !== 9) errors.sin = "SIN must be 9 digits";
    }
    if (!street || !street.trim()) errors.street = "Street address is required";
    if (!city || !city.trim()) errors.city = "City is required";
    if (!prov || !prov.trim()) errors.prov = "Province is required";
    // Postal: required + Canadian format A1A 1A1 (with or without space)
    if (!postal || !postal.trim()) {
      errors.postal = "Postal code is required";
    } else {
      const postalClean = postal.replace(/\s/g, "").toUpperCase();
      if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(postalClean)) errors.postal = "Postal code must be in format A1A 1A1";
    }
    // Email: optional, but if filled must be valid
    if (email && email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address";
    }
    setFieldErrors(errors);
    setAttempted(true);
    if (Object.keys(errors).length > 0) {
      setSaveError("Please fix the fields highlighted below");
      return;
    }
    setSaving(true); setSaveError(null);
    var body = {
      first_name: firstName || null,
      last_name: lastName || null,
      personal_email: email || null,
      phone: phone || null,
      date_of_birth: dob || null,
      sin_or_ssn: sin || null,
      address_line1: street || null,
      address_line2: line2 || null,
      city: city || null,
      province_or_state: prov || null,
      postal_or_zip: postal || null,
      mailing_address_same: mailingSame,
    };
    try {
      const r = await fetch(API + "/api/v1/payroll/employees/" + employee.id, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(body),
      });
      if (!r.ok) { const t = await r.text(); throw new Error("Save failed: " + (t || r.status)); }
      setSaving(false);
      onSaved && onSaved();
    } catch (e) {
      setSaving(false); setSaveError(e.message || "Save failed");
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
      title="Edit personal information"
      subtitle={subtitle}
      iconLetter="P"
      saving={saving}
      saveError={saveError}
      saveDisabled={saving}
      hasUnsavedChanges={true}
      saveLabel="Save personal info"
      secondaryAction={
        <a href="mailto:support@getnovala.com?subject=Feedback%20on%20personal%20info"
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
      <CollapsibleSection title="Basic details" defaultOpen={true}>
        <TwoCol>
          <Field label="First name" required error={fieldErrors.firstName}><TextInput value={firstName} onChange={setFirstName} error={fieldErrors.firstName} /></Field>
          <Field label="Last name" required error={fieldErrors.lastName}><TextInput value={lastName} onChange={setLastName} error={fieldErrors.lastName} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Email" error={fieldErrors.email}><TextInput type="email" value={email} onChange={setEmail} error={fieldErrors.email} /></Field>
          <Field label="Phone"><TextInput value={phone} onChange={setPhone} placeholder="+1 (___) ___ ____" /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Date of birth"><TextInput type="date" value={dob} onChange={setDob} /></Field>
          <Field label="Social Insurance Number" required error={fieldErrors.sin}><TextInput value={sin} onChange={setSin} placeholder="XXX-XXX-XXX" error={fieldErrors.sin} /></Field>
        </TwoCol>
      </CollapsibleSection>

      <CollapsibleSection title="Home address" defaultOpen={true}>
        <Field label="Street" required error={fieldErrors.street}><TextInput value={street} onChange={setStreet} placeholder="10245 Whyte Avenue" error={fieldErrors.street} /></Field>
        <Field label="Unit / Suite (optional)"><TextInput value={line2} onChange={setLine2} /></Field>
        <TwoCol>
          <Field label="City" required error={fieldErrors.city}><TextInput value={city} onChange={setCity} placeholder="Edmonton" error={fieldErrors.city} /></Field>
          <Field label="Province" required error={fieldErrors.prov}>
            <SelectInput value={prov} onChange={setProv}>
              {CA_PROVINCES.map(function(p) { return <option key={p} value={p}>{p}</option>; })}
            </SelectInput>
          </Field>
        </TwoCol>
        <Field label="Postal code" required error={fieldErrors.postal}><TextInput value={postal} onChange={setPostal} placeholder="T6E 1Z9" error={fieldErrors.postal} /></Field>

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={function() { setMailingSame(!mailingSame); }}
            style={{
              width: 20, height: 20, borderRadius: 5,
              background: mailingSame ? C.brand : "#FFFFFF",
              border: mailingSame ? "0" : "1.5px solid " + C.line,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            {mailingSame && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 13, color: C.ink, fontWeight: 700 }}>Mailing address is the same</div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Uncheck if T4 slips should be mailed to a different address.</div>
          </div>
        </div>
      </CollapsibleSection>
    </EditModal>
  );
}

// --- helpers ---
function TwoCol(props) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 4 }}>{props.children}</div>;
}
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
  return (
    <div style={{ display: "flex", alignItems: "center", height: 44, padding: "0 14px", border: (props.error ? "1.5px solid #DC2626" : "1px solid " + C.line), borderRadius: 10, background: (props.error ? "#FEF5F5" : "#FFFFFF") }}>
      <input
        type={props.type || "text"}
        value={props.value || ""}
        placeholder={props.placeholder || ""}
        onChange={function(e) { props.onChange(e.target.value); }}
        style={{ border: 0, outline: "none", fontSize: 14, color: C.ink, flex: 1, fontFamily: FONT, fontWeight: 500, background: "transparent" }}
      />
    </div>
  );
}
function SelectInput(props) {
  return (
    <select
      value={props.value || ""}
      onChange={function(e) { props.onChange(e.target.value); }}
      style={{
        width: "100%", boxSizing: "border-box", height: 44,
        padding: "0 14px", border: "1px solid " + C.line, borderRadius: 10,
        fontSize: 14, color: C.ink, background: "#FFFFFF",
        cursor: "pointer", fontFamily: FONT, fontWeight: 500,
      }}
    >
      {props.children}
    </select>
  );
}