import React, { useState } from "react";
import { X as XIcon, HelpCircle, ChevronDown, Pencil } from "lucide-react";

const BRAND = "#0F5959";
const BRAND_DARK = "#0A4040";
const BORDER = "#DDE5E5";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const RED = "#D9453C";

const API_URL = process.env.REACT_APP_API_URL || "";

function authHeaders() {
  const t = localStorage.getItem("novala_token") || localStorage.getItem("auth_token") || localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function EditOverlayShell({ title, onCancel, onSave, saving, error, children, hideSave }) {
  return (
    <div style={shellBase}>
      <style>{`
        @keyframes nvIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .nv-overlay-input:focus { border-color: ${BRAND} !important; box-shadow: 0 0 0 4px rgba(15,89,89,0.14) !important; }
        .nv-overlay-icon-btn:hover { background: #F1F5F5; color: ${INK}; }
        .nv-overlay-save:hover:not(:disabled) { background: ${BRAND_DARK} !important; transform: translateY(-1px); }
        .nv-overlay-cancel:hover { color: ${BRAND_DARK}; }
      `}</style>
      <div style={shellTopBar}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: INK, margin: 0, letterSpacing: "-0.005em" }}>{title}</h2>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button className="nv-overlay-icon-btn" style={iconBtn} aria-label="Help" title="Help">
            <HelpCircle size={20} strokeWidth={1.9} />
          </button>
          <button className="nv-overlay-icon-btn" onClick={onCancel} style={iconBtn} aria-label="Close">
            <XIcon size={20} strokeWidth={2.1} />
          </button>
        </div>
      </div>
      <div style={shellBody}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 40px 140px 40px" }}>
          {error && <div style={errorBanner}>{error}</div>}
          {children}
        </div>
      </div>
      <div style={shellFooter}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="nv-overlay-cancel" onClick={onCancel} style={cancelBtn}>Cancel</button>
          {!hideSave && (
            <button className="nv-overlay-save" onClick={onSave} disabled={saving} style={{
              ...saveBtn,
              background: saving ? "#9CA3AF" : BRAND,
              cursor: saving ? "default" : "pointer",
              boxShadow: saving ? "none" : "0 8px 20px -8px rgba(15,89,89,0.6)",
            }}>{saving ? "Saving…" : "Save"}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children, hint, style }) {
  return (
    <div style={{ marginBottom: 22, ...style }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: SUB, marginBottom: 6, letterSpacing: "0.01em" }}>
        {label}{required && <span style={{ color: RED, marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 12.5, color: SUB, marginTop: 6, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function TextInput(props) {
  return <input {...props} className="nv-overlay-input" style={{
    width: "100%", padding: "11px 14px", fontSize: 14.5,
    border: `1.6px solid ${BORDER}`, borderRadius: 10, outline: "none",
    background: "#fff", color: INK, fontFamily: "inherit",
    transition: "border-color 0.18s, box-shadow 0.18s",
    boxSizing: "border-box",
    ...(props.style || {}),
  }} />;
}

function Select({ children, ...props }) {
  return (
    <div style={{ position: "relative" }}>
      <select {...props} className="nv-overlay-input" style={{
        width: "100%", padding: "11px 38px 11px 14px", fontSize: 14.5,
        border: `1.6px solid ${BORDER}`, borderRadius: 10, outline: "none",
        background: "#fff", color: INK, appearance: "none", WebkitAppearance: "none",
        fontFamily: "inherit", cursor: "pointer",
        transition: "border-color 0.18s, box-shadow 0.18s",
        boxSizing: "border-box",
        ...(props.style || {}),
      }}>{children}</select>
      <ChevronDown size={18} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: SUB }} />
    </div>
  );
}

async function patchEmployee(id, body) {
  const r = await fetch(`${API_URL}/api/v1/payroll/employees/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({ detail: `HTTP ${r.status}` }));
    throw new Error(e.detail || `HTTP ${r.status}`);
  }
  return r.json();
}

export function EditPersonalInfo({ employee, onClose, onSaved }) {
  const [f, setF] = useState({
    title: employee.title || "",
    first_name: employee.first_name || "",
    middle_initial: employee.middle_initial || "",
    last_name: employee.last_name || "",
    preferred_first_name: employee.preferred_first_name || "",
    email: employee.email || "",
    home_phone: employee.home_phone || "",
    home_phone_ext: employee.home_phone_ext || "",
    work_phone: employee.work_phone || "",
    work_phone_ext: employee.work_phone_ext || "",
    mobile_phone: employee.mobile_phone || employee.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.first_name.trim() || !f.last_name.trim()) { setErr("First name and last name are required."); return; }
    setSaving(true); setErr("");
    try { await patchEmployee(employee.id, { ...f, phone: f.mobile_phone }); onSaved(); }
    catch (e) { setErr(e.message); setSaving(false); }
  };

  return (
    <EditOverlayShell title="Edit personal info" onCancel={onClose} onSave={save} saving={saving} error={err}>
      <h1 style={pageHeading}>Tell us more about {employee.first_name}</h1>
      <Field label="Title">
        <TextInput value={f.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Mr, Ms, Dr" style={{ maxWidth: 280 }} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 2.5fr", gap: 16 }}>
        <Field label="First name" required><TextInput value={f.first_name} onChange={e => set("first_name", e.target.value)} /></Field>
        <Field label="M.I."><TextInput value={f.middle_initial} onChange={e => set("middle_initial", e.target.value)} maxLength={4} /></Field>
        <Field label="Last name" required><TextInput value={f.last_name} onChange={e => set("last_name", e.target.value)} /></Field>
      </div>
      <Field label="Preferred first name">
        <TextInput value={f.preferred_first_name} onChange={e => set("preferred_first_name", e.target.value)} style={{ maxWidth: 400 }} />
      </Field>
      <Field label="Email"><TextInput type="email" value={f.email} onChange={e => set("email", e.target.value)} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 16 }}>
        <Field label="Home phone number"><TextInput value={f.home_phone} onChange={e => set("home_phone", e.target.value)} placeholder="(780) 555-0100" /></Field>
        <Field label="ext."><TextInput value={f.home_phone_ext} onChange={e => set("home_phone_ext", e.target.value)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 16 }}>
        <Field label="Work phone number"><TextInput value={f.work_phone} onChange={e => set("work_phone", e.target.value)} placeholder="(780) 555-0100" /></Field>
        <Field label="ext."><TextInput value={f.work_phone_ext} onChange={e => set("work_phone_ext", e.target.value)} /></Field>
      </div>
      <Field label="Mobile phone number">
        <TextInput value={f.mobile_phone} onChange={e => set("mobile_phone", e.target.value)} placeholder="(780) 555-0100" />
      </Field>
    </EditOverlayShell>
  );
}

export function EditEmploymentDetails({ employee, onClose, onSaved }) {
  const [f, setF] = useState({
    status: employee.status || "active",
    hire_date: (employee.hire_date || "").slice(0, 10),
    pay_schedule: employee.pay_schedule || "",
    work_location: employee.work_location || "",
    manager: employee.manager || employee.manager_name || "",
    department: employee.department || "",
    job_title: employee.job_title || "",
    employee_number: employee.employee_number || employee.employee_id_number || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const statusOpts = [
    { value: "active",     label: "Active",     hint: "Actively working and receiving pay. (Per-employee subscription rate applies.)" },
    { value: "on_leave",   label: "On leave",   hint: "Temporarily away (e.g. parental, medical)." },
    { value: "inactive",   label: "Inactive",   hint: "Not currently working but record kept." },
    { value: "terminated", label: "Terminated", hint: "No longer employed." },
  ];

  const save = async () => {
    if (!f.hire_date) { setErr("Hire date is required."); return; }
    setSaving(true); setErr("");
    try { await patchEmployee(employee.id, f); onSaved(); }
    catch (e) { setErr(e.message); setSaving(false); }
  };

  return (
    <EditOverlayShell title="Edit employment details" onCancel={onClose} onSave={save} saving={saving} error={err}>
      <h1 style={pageHeading}>Let's get down to {employee.first_name}'s employment specifics</h1>
      <Field label="Status" required hint={statusOpts.find(o => o.value === f.status)?.hint}>
        <Select value={f.status} onChange={e => set("status", e.target.value)} style={{ maxWidth: 360 }}>
          {statusOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </Field>
      <Field label="Hire date" required>
        <TextInput type="date" value={f.hire_date} onChange={e => set("hire_date", e.target.value)} style={{ maxWidth: 260 }} />
      </Field>
      <Field label="Pay schedule" required hint="Manage pay schedules in Payroll Settings.">
        <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 480 }}>
          <Select value={f.pay_schedule} onChange={e => set("pay_schedule", e.target.value)}>
            <option value="">Select a schedule</option>
            <option value="weekly">Weekly</option>
            <option value="bi_weekly">Bi-weekly</option>
            <option value="semi_monthly">Semi-monthly — 15th &amp; End of Month</option>
            <option value="monthly">Monthly</option>
          </Select>
          <button type="button" title="Manage schedules" style={pencilBtn}><Pencil size={16} strokeWidth={1.9} /></button>
        </div>
      </Field>
      <Field label="Work location" required>
        <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 560 }}>
          <TextInput value={f.work_location} onChange={e => set("work_location", e.target.value)} placeholder="e.g. 49516 Range Road 174, Edmonton, AB" />
          <button type="button" title="Manage locations" style={pencilBtn}><Pencil size={16} strokeWidth={1.9} /></button>
        </div>
      </Field>
      <Field label="Manager"><TextInput value={f.manager} onChange={e => set("manager", e.target.value)} placeholder="Select a manager" style={{ maxWidth: 480 }} /></Field>
      <Field label="Department"><TextInput value={f.department} onChange={e => set("department", e.target.value)} placeholder="Select a department" style={{ maxWidth: 480 }} /></Field>
      <Field label="Job title"><TextInput value={f.job_title} onChange={e => set("job_title", e.target.value)} style={{ maxWidth: 480 }} /></Field>
      <Field label="Employee ID"><TextInput value={f.employee_number} onChange={e => set("employee_number", e.target.value)} style={{ maxWidth: 320 }} /></Field>
    </EditOverlayShell>
  );
}

export function EditPaymentMethod({ employee, onClose, onSaved }) {
  const normalize = (m) => ((m || "").toString().toLowerCase().includes("direct") || (m || "").toString().toLowerCase().includes("deposit")) ? "direct_deposit" : "paper_cheque";
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(normalize(employee.pay_method));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setSaving(true); setErr("");
    try { await patchEmployee(employee.id, { pay_method: method }); onSaved(); }
    catch (e) { setErr(e.message); setSaving(false); }
  };

  return (
    <EditOverlayShell title="Edit payment method" onCancel={onClose} onSave={save} saving={saving} error={err}>
      {step === 1 ? (
        <div>
          <h1 style={pageHeading}>Payment method</h1>
          <div style={{ padding: 24, border: `1px solid ${BORDER}`, borderRadius: 14, maxWidth: 420, background: "#fff" }}>
            <div style={{ fontSize: 13, color: SUB, fontWeight: 600, marginBottom: 8 }}>Current method</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: INK, marginBottom: 16 }}>
              {method === "direct_deposit" ? "Deposit to one account" : "Paper cheque"}
            </div>
            <button onClick={() => setStep(2)} style={{ padding: "9px 22px", border: `1.5px solid ${BRAND}`, borderRadius: 8, background: "#fff", color: BRAND, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Edit</button>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ color: SUB, fontSize: 14, lineHeight: 1.55, marginBottom: 28, maxWidth: 580 }}>
            We asked this employee to enter their personal, tax, and banking info in Novala Workforce. Turn this off if you want to fill this in yourself.
          </p>
          <h1 style={{ ...pageHeading, marginBottom: 28 }}>How would you like to pay {employee.first_name}?</h1>
          <Field label="Payment method">
            <Select value={method} onChange={e => setMethod(e.target.value)} style={{ maxWidth: 400 }}>
              <option value="paper_cheque">Paper cheque</option>
              <option value="direct_deposit">Direct deposit</option>
            </Select>
          </Field>
        </div>
      )}
    </EditOverlayShell>
  );
}

const shellBase = { position: "fixed", inset: 0, background: "#fff", zIndex: 9998, display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", animation: "nvIn 0.28s cubic-bezier(0.16,1,0.3,1)" };
const shellTopBar = { flexShrink: 0, background: "#F7F8F9", padding: "14px 28px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" };
const shellBody = { flex: 1, overflowY: "auto", background: "#fff" };
const shellFooter = { flexShrink: 0, background: "#fff", padding: "16px 0", borderTop: `1px solid ${BORDER}` };
const iconBtn = { width: 36, height: 36, borderRadius: 999, border: "none", background: "transparent", color: SUB, cursor: "pointer", display: "grid", placeItems: "center", transition: "background 0.15s, color 0.15s" };
const errorBanner = { background: "#FDECEB", color: RED, padding: 14, borderRadius: 10, fontSize: 13.5, marginBottom: 24, border: "1px solid rgba(217,69,60,0.15)" };
const cancelBtn = { background: "transparent", border: "none", color: BRAND, fontWeight: 600, fontSize: 15, cursor: "pointer", padding: "10px 4px", transition: "color 0.15s" };
const saveBtn = { border: "none", borderRadius: 10, padding: "12px 32px", color: "#fff", fontWeight: 700, fontSize: 15, transition: "background 0.15s, transform 0.15s, box-shadow 0.15s" };
const pageHeading = { fontSize: 26, fontWeight: 700, color: INK, margin: "0 0 32px 0", letterSpacing: "-0.015em", lineHeight: 1.2 };
const pencilBtn = { flexShrink: 0, width: 38, height: 38, borderRadius: 8, border: `1.5px solid ${BORDER}`, background: "#fff", color: SUB, cursor: "pointer", display: "grid", placeItems: "center" };

// ============================================================================
// SCREEN 4d — Base Pay Drawer (right-side slide-out)
// ============================================================================

export function BasePayDrawer({ employee, onClose, onSaved }) {
  const [payType, setPayType] = useState(employee.pay_type || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const options = [
    { value: "hourly",     label: "Hourly" },
    { value: "salary",     label: "Salary" },
    { value: "commission", label: "Commission only" },
  ];

  const save = async () => {
    if (!payType) { setErr("Please select a compensation type."); return; }
    setSaving(true); setErr("");
    try { await patchEmployee(employee.id, { pay_type: payType }); onSaved(); }
    catch (e) { setErr(e.message); setSaving(false); }
  };

  return (
    <div style={drawerBackdrop} onClick={onClose}>
      <style>{`
        @keyframes nvSlideRight { from { transform: translateX(100%); } to { transform: none; } }
      `}</style>
      <div style={drawerPanel} onClick={e => e.stopPropagation()}>
        <div style={drawerHeader}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: INK, margin: 0 }}>Add base pay</h2>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="nv-overlay-icon-btn" style={iconBtn} title="Edit" aria-label="Edit">
              <Pencil size={18} strokeWidth={1.9} />
            </button>
            <button className="nv-overlay-icon-btn" onClick={onClose} style={iconBtn} aria-label="Close">
              <XIcon size={20} strokeWidth={2.1} />
            </button>
          </div>
        </div>

        <div style={drawerBody}>
          {err && <div style={errorBanner}>{err}</div>}
          <h3 style={{ fontSize: 18, fontWeight: 700, color: INK, margin: "0 0 20px 0", letterSpacing: "-0.01em" }}>
            Select compensation type
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {options.map(o => (
              <button key={o.value} onClick={() => setPayType(o.value)} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "16px 18px", textAlign: "left",
                background: payType === o.value ? "#F0FAFA" : "#fff",
                border: `1.5px solid ${payType === o.value ? BRAND : BORDER}`,
                borderRadius: 10, cursor: "pointer", width: "100%",
                transition: "background 0.15s, border-color 0.15s",
              }}>
                <span style={{
                  flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
                  border: `2px solid ${payType === o.value ? BRAND : "#9CA3AF"}`,
                  background: "#fff", position: "relative",
                }}>
                  {payType === o.value && <span style={{ position: "absolute", inset: 3, borderRadius: "50%", background: BRAND }} />}
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>{o.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={drawerFooter}>
          <button className="nv-overlay-cancel" onClick={onClose} style={cancelBtn}>Cancel</button>
          <button className="nv-overlay-save" onClick={save} disabled={saving} style={{
            ...saveBtn,
            background: saving ? "#9CA3AF" : BRAND,
            cursor: saving ? "default" : "pointer",
            boxShadow: saving ? "none" : "0 8px 20px -8px rgba(15,89,89,0.6)",
          }}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SCREEN 4e — Edit Time Off (full-screen overlay)
// ============================================================================

export function EditTimeOff({ employee, onClose, onSaved }) {
  const [f, setF] = useState({
    vacation_policy: employee.vacation_policy || "",
    sick_pay_policy: employee.sick_pay_policy || "no_policy",
    unpaid_time_off_policy: employee.unpaid_time_off_policy || "no_policy",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSelect = (key) => (e) => {
    const v = e.target.value;
    if (v === "add_new") {
      alert("Custom policies — coming soon. Pick one of the standard options for now.");
      return;
    }
    set(key, v);
  };

  const save = async () => {
    setSaving(true); setErr("");
    try { await patchEmployee(employee.id, f); onSaved(); }
    catch (e) { setErr(e.message); setSaving(false); }
  };

  return (
    <EditOverlayShell title="Edit time off" onCancel={onClose} onSave={save} saving={saving} error={err}>
      <h1 style={pageHeading}>Manage time off policies</h1>

      <Field label="Vacation policy" hint={
        <span>We recommend the <strong>Pay out each pay period</strong> option for part-time, hourly, and commissioned employees.</span>
      }>
        <Select value={f.vacation_policy} onChange={handleSelect("vacation_policy")} style={{ maxWidth: 520 }}>
          <option value="">Select one</option>
          <option value="add_new">+ Add vacation policy</option>
          <option value="accrue_4pct">4.00% Accrue time/hrs worked</option>
          <option value="paid_out_4pct">4.00% Paid out each pay period</option>
          <option value="dont_track">Don't track vacation</option>
        </Select>
      </Field>

      <Field label="Sick pay">
        <Select value={f.sick_pay_policy} onChange={handleSelect("sick_pay_policy")} style={{ maxWidth: 520 }}>
          <option value="no_policy">No sick pay policy</option>
          <option value="add_new">+ Add new sick pay policy</option>
        </Select>
      </Field>

      <Field label="Unpaid time off">
        <Select value={f.unpaid_time_off_policy} onChange={handleSelect("unpaid_time_off_policy")} style={{ maxWidth: 520 }}>
          <option value="no_policy">No unpaid time off policy</option>
          <option value="add_new">+ Add new unpaid time off policy</option>
        </Select>
      </Field>
    </EditOverlayShell>
  );
}

// Drawer styles
const drawerBackdrop = {
  position: "fixed", inset: 0, background: "rgba(14,26,26,0.45)",
  backdropFilter: "blur(4px)", zIndex: 9998,
  display: "flex", justifyContent: "flex-end",
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
};
const drawerPanel = {
  width: 480, maxWidth: "100%", height: "100vh", background: "#fff",
  display: "flex", flexDirection: "column",
  boxShadow: "-12px 0 32px -12px rgba(0,0,0,0.2)",
  animation: "nvSlideRight 0.28s cubic-bezier(0.16,1,0.3,1)",
};
const drawerHeader = {
  flexShrink: 0, padding: "18px 24px",
  borderBottom: `1px solid ${BORDER}`,
  display: "flex", justifyContent: "space-between", alignItems: "center",
};
const drawerBody = { flex: 1, overflowY: "auto", padding: "28px 24px" };
const drawerFooter = {
  flexShrink: 0, padding: "16px 24px",
  borderTop: `1px solid ${BORDER}`,
  display: "flex", justifyContent: "space-between", alignItems: "center",
};

