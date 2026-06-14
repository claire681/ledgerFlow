import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, X, ChevronDown, Check, Plus, ExternalLink, ArrowRight,
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const BRAND = "#0F9599";
const BRAND_DARK = "#0F6E56";
const BRAND_SOFT = "#E1F5EE";
const TEXT_PRIMARY = "#111827";
const TEXT_INK = "#1A2B2B";
const TEXT_SECONDARY = "#6B7280";
const TEXT_TERTIARY = "#9CA3AF";
const BG_CARD = "#FFFFFF";
const BG_HOVER = "#F9FAFB";
const BORDER = "#E5E7EB";
const BORDER_LIGHT = "#F0F4F4";
const DANGER = "#DC2626";
const SUCCESS_TEXT = "#166534";
const SUCCESS_SOFT = "#DCFCE7";

const ROLE_SEED = [
  "Manager", "Supervisor", "Administrator", "Office Administrator",
  "Accountant", "Bookkeeper", "Receptionist", "Sales Representative",
  "Customer Service Representative", "Driver", "Technician", "Cleaner",
  "Cook", "Cashier", "Labourer", "Caregiver",
];

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  Authorization: "Bearer " + getToken(),
  "Content-Type": "application/json",
});

function FormField({ label, required, value, onChange, error, placeholder, type, helper, maxLength }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TEXT_INK, marginBottom: 6 }}>
        {label}{required && <span style={{ color: BRAND, marginLeft: 4 }}>*</span>}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{ width: "100%", padding: "10px 12px", border: "0.5px solid " + (error ? DANGER : BORDER), borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: TEXT_PRIMARY, background: BG_CARD }}
      />
      {error && <div style={{ fontSize: 12, color: DANGER, marginTop: 5 }}>{error}</div>}
      {helper && !error && <div style={{ fontSize: 11.5, color: TEXT_TERTIARY, marginTop: 5 }}>{helper}</div>}
    </div>
  );
}

function RoleCombobox({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [customRoles, setCustomRoles] = useState([]);
  const [customMode, setCustomMode] = useState(false);
  const inputRef = useRef(null);
  const closeTimer = useRef(null);

  const allRoles = [...ROLE_SEED, ...customRoles];
  const typed = value.trim();
  const filtered = typed === ""
    ? allRoles
    : allRoles.filter(r => r.toLowerCase().includes(typed.toLowerCase()));
  const exactMatch = allRoles.some(r => r.toLowerCase() === typed.toLowerCase());
  const showCreate = typed !== "" && !exactMatch;
  const showPersistentCustom = typed === "" || exactMatch;

  const pickRole = (r) => {
    onChange(r);
    setOpen(false);
    setCustomMode(false);
  };

  const createCustom = () => {
    const newRole = typed;
    if (!newRole) return;
    if (!allRoles.some(r => r.toLowerCase() === newRole.toLowerCase())) {
      setCustomRoles(prev => [...prev, newRole]);
    }
    onChange(newRole);
    setOpen(false);
    setCustomMode(false);
  };

  const openCustomMode = () => {
    onChange("");
    setCustomMode(true);
    if (inputRef.current) inputRef.current.focus();
  };

  const onInputFocus = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const onInputBlur = () => {
    closeTimer.current = setTimeout(() => { setOpen(false); setCustomMode(false); }, 160);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onInputFocus}
        onBlur={onInputBlur}
        placeholder={customMode ? "Type your custom role..." : "Pick a role or type your own"}
        style={{ width: "100%", padding: "10px 12px", border: "0.5px solid " + BORDER, borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: TEXT_PRIMARY, background: BG_CARD }}
      />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,0.08)", maxHeight: 280, overflowY: "auto", zIndex: 50 }}>
          {customMode && (
            <div style={{ padding: "10px 12px", fontSize: 12.5, color: BRAND_DARK, borderBottom: "0.5px solid " + BORDER_LIGHT, background: BRAND_SOFT }}>
              Type your role in the field above, then choose Add "...".
            </div>
          )}
          {filtered.map(r => {
            const isCustom = customRoles.includes(r);
            return (
              <div key={r} onMouseDown={(e) => { e.preventDefault(); pickRole(r); }}
                style={{ padding: "9px 12px", fontSize: 13.5, color: TEXT_PRIMARY, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = BG_HOVER; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span>{r}</span>
                {isCustom && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 10, background: BG_HOVER, color: TEXT_TERTIARY, fontWeight: 600 }}>Custom</span>}
              </div>
            );
          })}
          {showCreate && (
            <div onMouseDown={(e) => { e.preventDefault(); createCustom(); }}
              style={{ padding: "10px 12px", fontSize: 13.5, color: BRAND_DARK, cursor: "pointer", borderTop: "0.5px solid " + BORDER_LIGHT, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={13} />Add "{typed}" as a custom role
            </div>
          )}
          {showPersistentCustom && (
            <div onMouseDown={(e) => { e.preventDefault(); openCustomMode(); }}
              style={{ padding: "10px 12px", fontSize: 13.5, color: BRAND_DARK, cursor: "pointer", borderTop: "0.5px solid " + BORDER_LIGHT, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={13} />Custom role</span>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 10, background: BRAND_SOFT, color: BRAND_DARK, fontWeight: 600 }}>type your own</span>
            </div>
          )}
        </div>
      )}
      <div style={{ fontSize: 11.5, color: TEXT_TERTIARY, marginTop: 5 }}>Pick a role, or choose Custom role to type your own.</div>
    </div>
  );
}

function SelfSetupCard({ selected, onClick, title, body }) {
  return (
    <div onClick={onClick} style={{ border: "1.5px solid " + (selected ? BRAND : BORDER), background: selected ? BRAND_SOFT : BG_CARD, borderRadius: 10, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12 }}>
      <span style={{ width: 18, height: 18, borderRadius: "50%", border: "1.6px solid " + (selected ? BRAND : TEXT_TERTIARY), display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2 }}>
        {selected && <span style={{ width: 9, height: 9, borderRadius: "50%", background: BRAND }} />}
      </span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: selected ? BRAND_DARK : TEXT_INK, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

function TaskItem({ text }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13.5, color: TEXT_PRIMARY, lineHeight: 1.55 }}>
      <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: "50%", background: BG_HOVER, display: "grid", placeItems: "center", marginTop: 1 }}>
        <ArrowRight size={11} style={{ color: BRAND }} />
      </span>
      <span>{text}</span>
    </li>
  );
}

export default function AddEmployee() {
  const navigate = useNavigate();
  const [step, setStep] = useState("form");
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [selfSetup, setSelfSetup] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [createdEmployee, setCreatedEmployee] = useState(null);

  const goBack = () => navigate("/payroll/employees");

  const validate = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = "First name is required.";
    if (!lastName.trim()) e.lastName = "Last name is required.";
    if (selfSetup && !email.trim()) e.email = "Email is required to send the invite.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        status: "active",
      };
      if (email.trim()) payload.personal_email = email.trim();
      if (mobile.trim()) payload.mobile_phone = mobile.trim();
      if (role.trim()) payload.position_title = role.trim();
      if (hireDate) payload.start_date = hireDate;
      const res = await fetch(API_URL + "/api/v1/payroll/employees", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = typeof body.detail === "string" ? body.detail
                  : Array.isArray(body.detail) ? body.detail.map(d => d.msg || JSON.stringify(d)).join("; ")
                  : ("Could not create employee (status " + res.status + ").");
        throw new Error(msg);
      }
      const data = await res.json();
      setCreatedEmployee(data);
      setStep("success");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFirstName(""); setMiddleInitial(""); setLastName("");
    setEmail(""); setMobile(""); setRole(""); setHireDate("");
    setSelfSetup(true); setErrors({}); setSubmitError(null);
    setCreatedEmployee(null); setStep("form");
  };

  const successName = (createdEmployee && createdEmployee.first_name) || firstName.trim() || "your new employee";
  const successId = createdEmployee && createdEmployee.id;

  return (
    <div style={{ background: BG_CARD, minHeight: "100vh", width: "100%", fontFamily: "inherit" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "0.5px solid " + BORDER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span onClick={goBack} style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 8, color: TEXT_SECONDARY, cursor: "pointer" }}><ArrowLeft size={18} /></span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT_INK, margin: 0, letterSpacing: "-0.01em" }}>Add an employee</h1>
        </div>
        <span onClick={goBack} style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 8, color: TEXT_SECONDARY, cursor: "pointer" }}><X size={18} /></span>
      </div>

      {step === "form" && (
        <div style={{ padding: "28px 28px 60px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 640 }}>

            <h2 style={{ fontSize: 24, fontWeight: 700, color: TEXT_INK, margin: "0 0 8px", letterSpacing: "-0.01em" }}>Who's your new team member?</h2>
            <p style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.6, margin: "0 0 8px" }}>
              Add your employee to get them paid. Add their email (mobile coming soon) to give them access to their employee portal in Novala, where they can view pay, T4s, and documents.
            </p>
            <a onClick={() => alert("Employee portal walkthrough coming next")} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: BRAND_DARK, cursor: "pointer" }}>
              Learn how the employee portal works<ExternalLink size={13} />
            </a>

            <div style={{ marginTop: 28, background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 12, padding: 24 }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 12, marginBottom: 16 }}>
                <FormField label="First name" required value={firstName} onChange={setFirstName} error={errors.firstName} placeholder="Claire" />
                <FormField label="M.I." value={middleInitial} onChange={(v) => setMiddleInitial(v.slice(0, 1))} placeholder="" maxLength={1} />
                <FormField label="Last name" required value={lastName} onChange={setLastName} error={errors.lastName} placeholder="Kemanzi" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <FormField label="Email (for the invite)" required={selfSetup} value={email} onChange={setEmail} error={errors.email} placeholder="claire@brightcare.ca" type="email" helper="We email the setup invite here. Add a mobile later to text it too." />
              </div>

              <div style={{ marginBottom: 16 }}>
                <FormField label="Mobile (optional)" value={mobile} onChange={setMobile} placeholder="780-555-0123" type="tel" helper="Used for text invites once SMS is connected." />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_INK, marginBottom: 6 }}>Role</div>
                <RoleCombobox value={role} onChange={setRole} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <FormField label="Hire date" value={hireDate} onChange={setHireDate} type="date" />
              </div>

              <div style={{ height: "0.5px", background: BORDER, margin: "0 -24px 24px" }} />

              <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT_INK, margin: "0 0 5px" }}>Save time: let them set up their own details</h3>
              <p style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.55, margin: "0 0 14px" }}>They can enter personal, tax, and direct deposit info themselves, securely.</p>

              <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                <SelfSetupCard selected={selfSetup} onClick={() => setSelfSetup(true)} title="Employee self setup" body="We email them a secure link to complete their own personal, tax, and direct deposit info." />
                <SelfSetupCard selected={!selfSetup} onClick={() => setSelfSetup(false)} title="I'll enter everything myself" body="You fill in all of their details now. You can still invite them to the portal later." />
              </div>

              {selfSetup && (
                <div style={{ background: BRAND_SOFT, border: "0.5px solid " + BRAND, borderRadius: 10, padding: 16, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: BRAND_DARK, marginBottom: 8 }}>
                    What {firstName.trim() || "they"} will be asked to complete
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 6 }}>
                    {["Personal details and address", "SIN and tax forms (TD1)", "Direct deposit banking", "Emergency contact"].map(item => (
                      <li key={item} style={{ fontSize: 13, color: BRAND_DARK, display: "flex", alignItems: "center", gap: 8 }}>
                        <Check size={14} />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {submitError && (
                <div style={{ padding: 12, background: "#FEE2E2", border: "0.5px solid #F87171", borderRadius: 8, color: "#991B1B", fontSize: 13, marginTop: 16 }}>
                  {submitError}
                </div>
              )}

              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleSubmit} disabled={submitting} style={{ background: BRAND, color: "white", fontSize: 14, fontWeight: 600, padding: "11px 22px", border: "none", borderRadius: 9, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7 }}>
                  {submitting ? "Adding..." : "Add employee"}<ArrowRight size={15} />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {step === "success" && (
        <div style={{ padding: "28px 28px 60px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 720, textAlign: "center" }}>

            <div style={{ width: 64, height: 64, borderRadius: "50%", background: SUCCESS_SOFT, margin: "12px auto 18px", display: "grid", placeItems: "center" }}>
              <Check size={32} style={{ color: SUCCESS_TEXT }} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: TEXT_INK, margin: "0 0 8px", letterSpacing: "-0.02em" }}>You added {successName}!</h2>
            <p style={{ fontSize: 14, color: TEXT_SECONDARY, margin: "0 0 28px" }}>Here's what's next to get them ready for payroll.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, textAlign: "left", marginBottom: 28 }}>
              <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>For you</div>
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 10 }}>
                  <TaskItem text={"Complete " + successName + "'s payroll info"} />
                  <TaskItem text="Add role and any credentials or certifications, with expiry dates" />
                  <TaskItem text="Share documents in their portal" />
                </ul>
              </div>
              <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>For {successName}</div>
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 10 }}>
                  <TaskItem text="Download the Novala app to view pay, T4s, and documents" />
                </ul>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button onClick={resetForm} style={{ background: BG_CARD, color: BRAND_DARK, fontSize: 14, fontWeight: 600, padding: "10px 18px", border: "0.5px solid " + BRAND, borderRadius: 9, cursor: "pointer", fontFamily: "inherit" }}>
                Add another employee
              </button>
              <button onClick={() => successId ? navigate("/payroll/employees/" + successId) : navigate("/payroll/employees")} style={{ background: BRAND, color: "white", fontSize: 14, fontWeight: 600, padding: "11px 22px", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit" }}>
                Finish payroll info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
