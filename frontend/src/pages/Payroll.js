import React, { useState, useEffect, useMemo } from "react";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const BRAND = "#0F5959";
const ACCENT = "#0AB98A";
const QB_GREEN = "#2CA01C";
const BG = "#F8FAFB";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const TEXT_MUTED = "#6B7280";

const EMPTY_FORM = {
  first_name: "", last_name: "", preferred_name: "",
  date_of_birth: "", gender: "", marital_status: "", sin_or_ssn: "",
  phone: "", personal_email: "",
  address_line1: "", address_line2: "", city: "", province_or_state: "",
  postal_or_zip: "", country: "CA",
  employee_number: "", position_title: "", department: "",
  employment_type: "full_time", start_date: "", manager_name: "",
  pay_type: "salary", salary_amount: "", hourly_rate: "",
  hours_per_week: "40", pay_schedule: "bi_weekly", currency: "CAD",
  emergency_contact_name: "", emergency_contact_relationship: "",
  emergency_contact_phone: "", emergency_contact_email: "",
  notes: "",
};

const PERIODS_PER_YEAR = { weekly: 52, bi_weekly: 26, semi_monthly: 24, monthly: 12 };

const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("token") || "";
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const fmtMoney = (n, ccy = "CAD") => {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(n);
};

function grossPerPeriod(emp, hoursOverride) {
  if (emp.pay_type === "salary") {
    const periods = PERIODS_PER_YEAR[emp.pay_schedule] || 26;
    return parseFloat(emp.salary_amount || 0) / periods;
  }
  const rate = parseFloat(emp.hourly_rate || 0);
  const hrs = parseFloat(hoursOverride != null ? hoursOverride : (emp.hours_per_week || 0));
  return rate * hrs;
}

function calculateDeductions(gross, country) {
  if (country === "US") {
    const federal_tax = gross * 0.12;
    const social_security = gross * 0.062;
    const medicare = gross * 0.0145;
    return { federal_tax, social_security, medicare, total: federal_tax + social_security + medicare };
  }
  const federal_tax = gross * 0.15;
  const cpp = gross * 0.0595;
  const ei = gross * 0.0166;
  return { federal_tax, cpp, ei, total: federal_tax + cpp + ei };
}

function getNextPayDate(settings) {
  if (!settings || !settings.pay_period_anchor_date) return "—";
  const anchor = new Date(settings.pay_period_anchor_date);
  const today = new Date();
  const periods = PERIODS_PER_YEAR[settings.default_pay_schedule] || 26;
  const daysPerPeriod = Math.round(365 / periods);
  let d = new Date(anchor);
  while (d < today) d.setDate(d.getDate() + daysPerPeriod);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Payroll() {
  const [tab, setTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const r = await fetch(`${API_URL}/api/v1/payroll/employees`, { headers: authHeaders() });
      if (r.ok) setEmployees(await r.json());
    } catch (e) { /* surfaced elsewhere */ }
  };
  const fetchSettings = async () => {
    try {
      const r = await fetch(`${API_URL}/api/v1/payroll/settings`, { headers: authHeaders() });
      if (r.ok) setSettings(await r.json());
    } catch (e) { /* non-critical */ }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchSettings()]);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ background: BG, minHeight: "100vh" }}>
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px 0 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: TEXT, margin: 0 }}>Payroll</h1>
              <p style={{ fontSize: 13, color: TEXT_MUTED, margin: "4px 0 0 0" }}>Run payroll, manage employees, and track tax obligations.</p>
            </div>
            <button onClick={() => setTab("run")} style={primaryBtn}>Run payroll →</button>
          </div>
          <TabNav tab={tab} setTab={setTab} />
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px" }}>
        {loading && <div style={{ textAlign: "center", padding: 60, color: TEXT_MUTED }}>Loading…</div>}
        {!loading && tab === "employees" && (
          <EmployeesView employees={employees} settings={settings} onRefresh={fetchEmployees} />
        )}
        {!loading && tab === "run" && (
          <RunPayrollView employees={employees} settings={settings} />
        )}
        {!loading && tab === "history" && <PayHistoryView />}
        {!loading && tab === "settings" && (
          <SettingsView settings={settings} onUpdate={fetchSettings} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TAB NAV
// ============================================================================

function TabNav({ tab, setTab }) {
  const tabs = [
    { id: "employees", label: "Employees" },
    { id: "run", label: "Run payroll" },
    { id: "history", label: "Pay history" },
    { id: "settings", label: "Settings" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${BORDER}`, marginBottom: -1 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          padding: "12px 18px", background: "transparent", border: "none",
          borderBottom: `2px solid ${tab === t.id ? BRAND : "transparent"}`,
          color: tab === t.id ? BRAND : TEXT_MUTED,
          fontWeight: tab === t.id ? 700 : 500, fontSize: 14, cursor: "pointer",
          marginBottom: -1,
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ============================================================================
// EMPLOYEES VIEW
// ============================================================================

function EmployeesView({ employees, settings, onRefresh }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = useMemo(() => {
    const active = employees.filter(e => e.status === "active");
    const monthly = active.reduce((sum, e) => {
      if (e.pay_type === "salary" && e.salary_amount) return sum + parseFloat(e.salary_amount) / 12;
      if (e.pay_type === "hourly" && e.hourly_rate && e.hours_per_week)
        return sum + parseFloat(e.hourly_rate) * parseFloat(e.hours_per_week) * 52 / 12;
      return sum;
    }, 0);
    const pending = employees.filter(e => e.invite_status === "pending").length;
    return {
      activeCount: active.length, monthly, pending,
      nextPay: getNextPayDate(settings),
    };
  }, [employees, settings]);

  const filtered = employees.filter(e => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.first_name + " " + e.last_name + " " + e.personal_email + " " + (e.position_title || "")).toLowerCase().includes(q);
  });

  const ccy = settings?.currency || "CAD";

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Active employees" value={stats.activeCount} subtitle={`${employees.length} total`} />
        <StatCard label="Monthly payroll" value={fmtMoney(stats.monthly, ccy)} subtitle="estimated gross" />
        <StatCard label="Next pay date" value={stats.nextPay} subtitle={settings?.default_pay_schedule?.replace("_", "-") || "Not set"} />
        <StatCard label="Pending invites" value={stats.pending} subtitle={stats.pending ? "awaiting profile" : "all set"} highlight={stats.pending > 0} />
      </div>

      <div style={cardStyle}>
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderBottom: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            <input
              placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputBase, maxWidth: 280, padding: "8px 12px" }}
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputBase, maxWidth: 160, padding: "8px 12px" }}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
          <button onClick={() => { setEditing(null); setDrawerOpen(true); }} style={primaryBtn}>+ Add employee</button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>👥</div>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: TEXT, margin: "0 0 6px 0" }}>
              {employees.length === 0 ? "No employees yet" : "No matches"}
            </h3>
            <p style={{ fontSize: 13, color: TEXT_MUTED, margin: "0 0 20px 0" }}>
              {employees.length === 0 ? "Add your first employee to start running payroll." : "Try a different search or filter."}
            </p>
            {employees.length === 0 && (
              <button onClick={() => setDrawerOpen(true)} style={primaryBtn}>+ Add your first employee</button>
            )}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFBFC" }}>
                <th style={th}>Employee</th>
                <th style={th}>Position</th>
                <th style={th}>Pay</th>
                <th style={th}>Schedule</th>
                <th style={th}>Status</th>
                <th style={th}>Profile</th>
                <th style={{ ...th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <EmployeeRow key={emp.id} emp={emp} onEdit={() => { setEditing(emp); setDrawerOpen(true); }} onRefresh={onRefresh} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawerOpen && (
        <EmployeeDrawer editing={editing} onClose={() => { setDrawerOpen(false); setEditing(null); }} onSaved={() => { setDrawerOpen(false); setEditing(null); onRefresh(); }} />
      )}
    </>
  );
}

function EmployeeRow({ emp, onEdit, onRefresh }) {
  const formatPay = () => {
    if (emp.pay_type === "salary" && emp.salary_amount) return `${fmtMoney(parseFloat(emp.salary_amount), emp.currency || "CAD")}/yr`;
    if (emp.pay_type === "hourly" && emp.hourly_rate) return `${fmtMoney(parseFloat(emp.hourly_rate), emp.currency || "CAD")}/hr`;
    return "—";
  };
  const initials = `${(emp.first_name || "?")[0]}${(emp.last_name || "?")[0]}`.toUpperCase();

  const handleInvite = async () => {
    if (!window.confirm(`Send a profile-completion invite to ${emp.first_name} at ${emp.personal_email}?`)) return;
    try {
      const r = await fetch(`${API_URL}/api/v1/payroll/employees/${emp.id}/send-invite`, { method: "POST", headers: authHeaders() });
      const d = await r.json();
      if (d.email_sent) alert(`Invite emailed to ${emp.personal_email}.`);
      else {
        try { await navigator.clipboard.writeText(d.invite_url); } catch (_) {}
        alert(`Invite link copied to clipboard:\n\n${d.invite_url}\n\nEmail send failed${d.email_error ? `: ${d.email_error}` : ""}.`);
      }
      onRefresh();
    } catch (e) { alert(`Failed: ${e.message}`); }
  };

  const handleTerminate = async () => {
    if (!window.confirm(`Terminate ${emp.first_name} ${emp.last_name}? Their record is preserved for compliance.`)) return;
    try {
      await fetch(`${API_URL}/api/v1/payroll/employees/${emp.id}`, { method: "DELETE", headers: authHeaders() });
      onRefresh();
    } catch (e) { alert(`Failed: ${e.message}`); }
  };

  return (
    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
      <td style={td}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: BRAND, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{initials}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{emp.first_name} {emp.last_name}</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED }}>{emp.personal_email}</div>
          </div>
        </div>
      </td>
      <td style={td}>
        <div style={{ fontSize: 14, color: TEXT }}>{emp.position_title || "—"}</div>
        <div style={{ fontSize: 12, color: TEXT_MUTED }}>{(emp.employment_type || "").replace(/_/g, " ")}</div>
      </td>
      <td style={td}>
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{formatPay()}</div>
        <div style={{ fontSize: 12, color: TEXT_MUTED }}>{emp.pay_type}</div>
      </td>
      <td style={td}>
        <div style={{ fontSize: 13, color: TEXT }}>{(emp.pay_schedule || "—").replace(/_/g, " ")}</div>
      </td>
      <td style={td}>{statusPill(emp.status)}</td>
      <td style={td}>{invitePill(emp)}</td>
      <td style={{ ...td, textAlign: "right" }}>
        <button onClick={onEdit} style={linkBtn}>Edit</button>
        <button onClick={handleInvite} style={{ ...linkBtn, color: ACCENT }}>{emp.invite_status === "pending" ? "Resend" : "Send invite"}</button>
        <button onClick={handleTerminate} style={{ ...linkBtn, color: "#DC2626" }}>Terminate</button>
      </td>
    </tr>
  );
}

// ============================================================================
// EMPLOYEE DRAWER (Add / Edit form)
// ============================================================================

function EmployeeDrawer({ editing, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    if (!editing) return EMPTY_FORM;
    const f = { ...EMPTY_FORM };
    Object.keys(EMPTY_FORM).forEach(k => {
      const v = editing[k];
      f[k] = v == null ? "" : String(v);
    });
    return f;
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const u = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.personal_email.trim()) {
      setErr("First name, last name, and email are required."); return;
    }
    setSaving(true); setErr("");
    const payload = {};
    Object.keys(form).forEach(k => {
      const v = form[k];
      if (v === "" || v == null) return;
      if (["salary_amount", "hourly_rate", "hours_per_week"].includes(k)) payload[k] = parseFloat(v);
      else payload[k] = v;
    });
    payload.first_name = payload.first_name.trim();
    payload.last_name = payload.last_name.trim();
    payload.personal_email = payload.personal_email.trim().toLowerCase();

    try {
      const url = editing ? `${API_URL}/api/v1/payroll/employees/${editing.id}` : `${API_URL}/api/v1/payroll/employees`;
      const method = editing ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(payload) });
      if (!r.ok) {
        const e = await r.json().catch(() => ({ detail: `HTTP ${r.status}` }));
        throw new Error(e.detail || `HTTP ${r.status}`);
      }
      onSaved();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 640, background: "#fff", zIndex: 1001, overflowY: "auto", boxShadow: "-8px 0 30px rgba(0,0,0,0.12)" }}>
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>{editing ? "Edit employee" : "Add new employee"}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: TEXT_MUTED, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 28 }}>
          {err && <div style={{ background: "#FEF2F2", color: "#991B1B", padding: 10, borderRadius: 6, marginBottom: 18, fontSize: 13 }}>{err}</div>}

          <Section title="Personal information">
            <Row>
              <Field label="First name *" value={form.first_name} onChange={v => u("first_name", v)} />
              <Field label="Last name *" value={form.last_name} onChange={v => u("last_name", v)} />
            </Row>
            <Row>
              <Field label="Preferred name" value={form.preferred_name} onChange={v => u("preferred_name", v)} placeholder="Optional" />
              <Field label="Date of birth" type="date" value={form.date_of_birth} onChange={v => u("date_of_birth", v)} />
            </Row>
            <Row>
              <Select label="Gender" value={form.gender} onChange={v => u("gender", v)} options={[["", "—"], ["female", "Female"], ["male", "Male"], ["non_binary", "Non-binary"], ["prefer_not_to_say", "Prefer not to say"]]} />
              <Select label="Marital status" value={form.marital_status} onChange={v => u("marital_status", v)} options={[["", "—"], ["single", "Single"], ["married", "Married"], ["common_law", "Common-law"], ["divorced", "Divorced"], ["widowed", "Widowed"]]} />
            </Row>
            <Field label={form.country === "US" ? "Social Security Number (SSN)" : "Social Insurance Number (SIN)"} value={form.sin_or_ssn} onChange={v => u("sin_or_ssn", v)} placeholder={form.country === "US" ? "XXX-XX-XXXX" : "XXX XXX XXX"} />
          </Section>

          <Section title="Contact">
            <Row>
              <Field label="Personal email *" type="email" value={form.personal_email} onChange={v => u("personal_email", v)} />
              <Field label="Phone" value={form.phone} onChange={v => u("phone", v)} placeholder="(555) 123-4567" />
            </Row>
            <Field label="Address line 1" value={form.address_line1} onChange={v => u("address_line1", v)} />
            <Field label="Address line 2" value={form.address_line2} onChange={v => u("address_line2", v)} placeholder="Apt, suite, etc. (optional)" />
            <Row3>
              <Field label="City" value={form.city} onChange={v => u("city", v)} />
              <Field label={form.country === "US" ? "State" : "Province"} value={form.province_or_state} onChange={v => u("province_or_state", v)} />
              <Field label={form.country === "US" ? "ZIP" : "Postal code"} value={form.postal_or_zip} onChange={v => u("postal_or_zip", v)} />
            </Row3>
            <Select label="Country" value={form.country} onChange={v => u("country", v)} options={[["CA", "Canada"], ["US", "United States"]]} />
          </Section>

          <Section title="Employment">
            <Row>
              <Field label="Position title" value={form.position_title} onChange={v => u("position_title", v)} placeholder="e.g. Caregiver" />
              <Field label="Department" value={form.department} onChange={v => u("department", v)} placeholder="e.g. Home Care" />
            </Row>
            <Row>
              <Select label="Employment type" value={form.employment_type} onChange={v => u("employment_type", v)} options={[["full_time", "Full-time"], ["part_time", "Part-time"], ["contract", "Contract"], ["intern", "Intern"]]} />
              <Field label="Start date" type="date" value={form.start_date} onChange={v => u("start_date", v)} />
            </Row>
            <Row>
              <Field label="Employee #" value={form.employee_number} onChange={v => u("employee_number", v)} placeholder="Optional" />
              <Field label="Manager" value={form.manager_name} onChange={v => u("manager_name", v)} placeholder="Optional" />
            </Row>
          </Section>

          <Section title="Compensation">
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Pay type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["salary", "Annual salary"], ["hourly", "Hourly rate"]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => u("pay_type", v)} style={{
                    flex: 1, padding: 10, borderRadius: 6,
                    border: `1px solid ${form.pay_type === v ? BRAND : "#D1D5DB"}`,
                    background: form.pay_type === v ? "#F0FAFA" : "#fff",
                    color: form.pay_type === v ? BRAND : "#374151",
                    fontWeight: 600, fontSize: 14, cursor: "pointer",
                  }}>{l}</button>
                ))}
              </div>
            </div>
            {form.pay_type === "salary" ? (
              <Row>
                <Field label="Annual salary" type="number" value={form.salary_amount} onChange={v => u("salary_amount", v)} placeholder="60000" />
                <Select label="Currency" value={form.currency} onChange={v => u("currency", v)} options={[["CAD", "CAD"], ["USD", "USD"]]} />
              </Row>
            ) : (
              <Row3>
                <Field label="Hourly rate" type="number" value={form.hourly_rate} onChange={v => u("hourly_rate", v)} placeholder="25.00" />
                <Field label="Hrs / week" type="number" value={form.hours_per_week} onChange={v => u("hours_per_week", v)} />
                <Select label="Currency" value={form.currency} onChange={v => u("currency", v)} options={[["CAD", "CAD"], ["USD", "USD"]]} />
              </Row3>
            )}
            <Select label="Pay schedule" value={form.pay_schedule} onChange={v => u("pay_schedule", v)} options={[["weekly", "Weekly (52/yr)"], ["bi_weekly", "Bi-weekly (26/yr)"], ["semi_monthly", "Semi-monthly (24/yr)"], ["monthly", "Monthly (12/yr)"]]} />
          </Section>

          <Section title="Emergency contact (optional)">
            <Row>
              <Field label="Full name" value={form.emergency_contact_name} onChange={v => u("emergency_contact_name", v)} />
              <Field label="Relationship" value={form.emergency_contact_relationship} onChange={v => u("emergency_contact_relationship", v)} placeholder="Spouse, parent..." />
            </Row>
            <Row>
              <Field label="Phone" value={form.emergency_contact_phone} onChange={v => u("emergency_contact_phone", v)} />
              <Field label="Email" type="email" value={form.emergency_contact_email} onChange={v => u("emergency_contact_email", v)} />
            </Row>
          </Section>

          <Section title="Notes">
            <textarea value={form.notes} onChange={e => u("notes", e.target.value)} rows={3} placeholder="Internal notes (not visible to employee)" style={{ ...inputBase, fontFamily: "inherit", resize: "vertical" }} />
          </Section>

          <div style={{ display: "flex", gap: 10, marginTop: 24, paddingTop: 18, borderTop: `1px solid ${BORDER}` }}>
            <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#374151" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 8, border: "none", background: saving ? "#9CA3AF" : BRAND, color: "#fff", fontWeight: 600, fontSize: 14, cursor: saving ? "default" : "pointer" }}>{saving ? "Saving…" : editing ? "Save changes" : "Add employee"}</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// RUN PAYROLL VIEW
// ============================================================================

function RunPayrollView({ employees, settings }) {
  const active = employees.filter(e => e.status === "active");
  const [selected, setSelected] = useState(() => new Set(active.map(e => e.id)));
  const [hoursOverride, setHoursOverride] = useState({});
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [processing, setProcessing] = useState(false);
  const country = settings?.country || "CA";

  const calc = useMemo(() => {
    const rows = active.map(emp => {
      const gross = grossPerPeriod(emp, hoursOverride[emp.id]);
      const ded = calculateDeductions(gross, country);
      return { emp, gross, deductions: ded, net: gross - ded.total };
    });
    const included = rows.filter(r => selected.has(r.emp.id));
    const totals = included.reduce((acc, r) => ({
      gross: acc.gross + r.gross,
      deductions: acc.deductions + r.deductions.total,
      net: acc.net + r.net,
    }), { gross: 0, deductions: 0, net: 0 });
    return { rows, totals, count: included.length };
  }, [active, selected, hoursOverride, country]);

  const toggle = (id) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  };

  const handleProcess = async () => {
    if (calc.count === 0) { alert("Select at least one employee."); return; }
    const confirmed = window.confirm(`Process pay run for ${calc.count} employee(s)?\n\nGross: ${fmtMoney(calc.totals.gross)}\nDeductions: ${fmtMoney(calc.totals.deductions)}\nNet: ${fmtMoney(calc.totals.net)}\n\nPay date: ${payDate}`);
    if (!confirmed) return;
    setProcessing(true);

    // Pay period = (pay_date - one schedule period) to pay_date
    const periodsPerYear = PERIODS_PER_YEAR[settings?.default_pay_schedule] || 26;
    const daysPerPeriod = Math.round(365 / periodsPerYear);
    const payDateObj = new Date(payDate);
    const periodStart = new Date(payDateObj); periodStart.setDate(periodStart.getDate() - daysPerPeriod + 1);

    const payStubs = calc.rows.filter(r => selected.has(r.emp.id)).map(({ emp, gross, deductions, net }) => ({
      employee_id: emp.id,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      employee_email: emp.personal_email,
      position_title: emp.position_title || null,
      pay_type: emp.pay_type,
      hours_worked: emp.pay_type === "hourly" ? parseFloat(hoursOverride[emp.id] != null ? hoursOverride[emp.id] : (emp.hours_per_week || 0)) : null,
      hourly_rate: emp.hourly_rate ? parseFloat(emp.hourly_rate) : null,
      gross: parseFloat(gross.toFixed(2)),
      deductions: Object.fromEntries(Object.entries(deductions).filter(([k]) => k !== "total").map(([k, v]) => [k, parseFloat(v.toFixed(2))])),
      deductions_total: parseFloat(deductions.total.toFixed(2)),
      net: parseFloat(net.toFixed(2)),
      currency: emp.currency || "CAD",
    }));

    const payload = {
      pay_period_start: periodStart.toISOString().slice(0, 10),
      pay_period_end: payDateObj.toISOString().slice(0, 10),
      pay_date: payDate,
      country,
      currency: settings?.currency || "CAD",
      pay_stubs: payStubs,
    };

    try {
      const r = await fetch(`${API_URL}/api/v1/payroll/pay-runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({ detail: `HTTP ${r.status}` }));
        throw new Error(e.detail || `HTTP ${r.status}`);
      }
      const saved = await r.json();
      alert(`Pay run processed ✓\n\n${saved.employee_count} employees · Net paid: ${fmtMoney(saved.total_net)}\n\nFind it under the Pay History tab.`);
    } catch (e) {
      alert(`Failed to process pay run: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (active.length === 0) {
    return (
      <div style={{ ...cardStyle, padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>💵</div>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: TEXT, margin: "0 0 6px 0" }}>No active employees</h3>
        <p style={{ fontSize: 13, color: TEXT_MUTED, margin: 0 }}>Add employees before running payroll.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ ...cardStyle, padding: 20, marginBottom: 16, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Pay date</div>
          <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} style={{ ...inputBase, padding: "6px 10px", marginTop: 4, width: 160 }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Country / Schedule</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginTop: 6 }}>{country === "CA" ? "🇨🇦 Canada" : "🇺🇸 United States"} · {(settings?.default_pay_schedule || "bi_weekly").replace("_", "-")}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Selected</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>{calc.count} of {active.length}</div>
        </div>
      </div>

      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFBFC" }}>
              <th style={{ ...th, width: 36 }}>
                <input type="checkbox" checked={selected.size === active.length} onChange={() => setSelected(selected.size === active.length ? new Set() : new Set(active.map(e => e.id)))} />
              </th>
              <th style={th}>Employee</th>
              <th style={th}>Pay type</th>
              <th style={th}>Hours</th>
              <th style={{ ...th, textAlign: "right" }}>Gross</th>
              <th style={{ ...th, textAlign: "right" }}>Deductions</th>
              <th style={{ ...th, textAlign: "right" }}>Net pay</th>
            </tr>
          </thead>
          <tbody>
            {calc.rows.map(({ emp, gross, deductions, net }) => {
              const isSelected = selected.has(emp.id);
              return (
                <tr key={emp.id} style={{ borderBottom: `1px solid ${BORDER}`, opacity: isSelected ? 1 : 0.5 }}>
                  <td style={td}><input type="checkbox" checked={isSelected} onChange={() => toggle(emp.id)} /></td>
                  <td style={td}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{emp.first_name} {emp.last_name}</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED }}>{emp.position_title || "—"}</div>
                  </td>
                  <td style={td}>
                    <div style={{ fontSize: 13, color: TEXT, textTransform: "capitalize" }}>{emp.pay_type}</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED }}>{emp.pay_type === "salary" ? `${fmtMoney(parseFloat(emp.salary_amount), emp.currency)}/yr` : `${fmtMoney(parseFloat(emp.hourly_rate), emp.currency)}/hr`}</div>
                  </td>
                  <td style={td}>
                    {emp.pay_type === "hourly" ? (
                      <input type="number" value={hoursOverride[emp.id] != null ? hoursOverride[emp.id] : (emp.hours_per_week || 0)} onChange={e => setHoursOverride({ ...hoursOverride, [emp.id]: e.target.value })} style={{ ...inputBase, width: 80, padding: "6px 8px" }} />
                    ) : <span style={{ fontSize: 13, color: TEXT_MUTED }}>—</span>}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontSize: 14, fontWeight: 600, color: TEXT }}>{fmtMoney(gross, emp.currency)}</td>
                  <td style={{ ...td, textAlign: "right", fontSize: 14, color: "#DC2626" }}>−{fmtMoney(deductions.total, emp.currency)}</td>
                  <td style={{ ...td, textAlign: "right", fontSize: 15, fontWeight: 700, color: QB_GREEN }}>{fmtMoney(net, emp.currency)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#FAFBFC", borderTop: `2px solid ${BORDER}` }}>
              <td colSpan={4} style={{ ...td, fontWeight: 700, color: TEXT }}>Totals ({calc.count} employees)</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700, fontSize: 15, color: TEXT }}>{fmtMoney(calc.totals.gross)}</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700, fontSize: 15, color: "#DC2626" }}>−{fmtMoney(calc.totals.deductions)}</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 800, fontSize: 16, color: QB_GREEN }}>{fmtMoney(calc.totals.net)}</td>
            </tr>
          </tfoot>
        </table>

        <div style={{ padding: 20, borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, color: TEXT_MUTED }}>
            Deductions estimated using {country === "CA" ? "Canada (Federal 15% · CPP 5.95% · EI 1.66%)" : "US (Federal 12% · Social Security 6.2% · Medicare 1.45%)"} simplified rates. Adjust under Settings or wait for full CRA/IRS tax table support.
          </div>
          <button onClick={handleProcess} disabled={processing || calc.count === 0} style={{ ...primaryBtn, background: processing ? "#9CA3AF" : QB_GREEN, padding: "12px 24px", fontSize: 15 }}>
            {processing ? "Processing…" : `Process pay run · ${fmtMoney(calc.totals.net)}`}
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// PAY HISTORY VIEW
// ============================================================================

function PayHistoryView() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/v1/payroll/pay-runs`, { headers: authHeaders() });
        if (r.ok) setRuns(await r.json());
      } catch (e) { /* surface inline */ } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: TEXT_MUTED }}>Loading pay runs…</div>;
  if (runs.length === 0) return (
    <div style={{ ...cardStyle, padding: 60, textAlign: "center" }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>📜</div>
      <h3 style={{ fontSize: 17, fontWeight: 600, color: TEXT, margin: "0 0 6px 0" }}>No pay runs yet</h3>
      <p style={{ fontSize: 13, color: TEXT_MUTED, margin: 0 }}>Once you process your first pay run from the Run Payroll tab, it shows up here.</p>
    </div>
  );

  return (
    <>
      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFBFC" }}>
              <th style={th}>Pay date</th>
              <th style={th}>Period</th>
              <th style={th}>Employees</th>
              <th style={{ ...th, textAlign: "right" }}>Gross</th>
              <th style={{ ...th, textAlign: "right" }}>Deductions</th>
              <th style={{ ...th, textAlign: "right" }}>Net paid</th>
              <th style={th}>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {runs.map(pr => (
              <tr key={pr.id} style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }} onClick={() => setSelected(pr)}>
                <td style={td}><div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{new Date(pr.pay_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div></td>
                <td style={td}><div style={{ fontSize: 13, color: TEXT_MUTED }}>{new Date(pr.pay_period_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(pr.pay_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div></td>
                <td style={td}><div style={{ fontSize: 14, color: TEXT }}>{pr.employee_count}</div></td>
                <td style={{ ...td, textAlign: "right", fontSize: 14, color: TEXT }}>{fmtMoney(pr.total_gross, pr.currency)}</td>
                <td style={{ ...td, textAlign: "right", fontSize: 14, color: "#DC2626" }}>−{fmtMoney(pr.total_deductions, pr.currency)}</td>
                <td style={{ ...td, textAlign: "right", fontSize: 15, fontWeight: 700, color: QB_GREEN }}>{fmtMoney(pr.total_net, pr.currency)}</td>
                <td style={td}>{statusPill(pr.status)}</td>
                <td style={{ ...td, textAlign: "right", fontSize: 13, color: BRAND, fontWeight: 600 }}>View →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <PayRunDetailDrawer payRun={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function PayRunDetailDrawer({ payRun, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/v1/payroll/pay-runs/${payRun.id}`, { headers: authHeaders() });
        if (r.ok) setDetail(await r.json());
      } finally { setLoading(false); }
    })();
  }, [payRun.id]);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 720, background: "#fff", zIndex: 1001, overflowY: "auto", boxShadow: "-8px 0 30px rgba(0,0,0,0.12)" }}>
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Pay run</div>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: TEXT, margin: "2px 0 0 0" }}>{new Date(payRun.pay_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</h2>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: TEXT_MUTED, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            <StatCard label="Gross" value={fmtMoney(payRun.total_gross, payRun.currency)} subtitle={`${payRun.employee_count} employees`} />
            <StatCard label="Deductions" value={fmtMoney(payRun.total_deductions, payRun.currency)} subtitle="taxes + contributions" />
            <StatCard label="Net paid" value={fmtMoney(payRun.total_net, payRun.currency)} subtitle="to employees" />
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Pay stubs</div>
          {loading ? <div style={{ color: TEXT_MUTED, fontSize: 13 }}>Loading…</div> : (
            <div style={{ ...cardStyle }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#FAFBFC" }}>
                  <th style={th}>Employee</th>
                  <th style={{ ...th, textAlign: "right" }}>Gross</th>
                  <th style={{ ...th, textAlign: "right" }}>Deductions</th>
                  <th style={{ ...th, textAlign: "right" }}>Net</th>
                </tr></thead>
                <tbody>
                  {(detail?.pay_stubs || []).map(s => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={td}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{s.employee_name}</div>
                        <div style={{ fontSize: 12, color: TEXT_MUTED }}>{s.position_title || "—"}</div>
                      </td>
                      <td style={{ ...td, textAlign: "right", fontSize: 14, color: TEXT }}>{fmtMoney(s.gross, s.currency)}</td>
                      <td style={{ ...td, textAlign: "right", fontSize: 13, color: "#DC2626" }}>
                        −{fmtMoney(s.deductions_total, s.currency)}
                        <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 400 }}>{Object.entries(s.deductions || {}).map(([k, v]) => `${k.replace(/_/g, " ")}: ${fmtMoney(v, s.currency)}`).join(" · ")}</div>
                      </td>
                      <td style={{ ...td, textAlign: "right", fontSize: 14, fontWeight: 700, color: QB_GREEN }}>{fmtMoney(s.net, s.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// SETTINGS VIEW
// ============================================================================

function SettingsView({ settings, onUpdate }) {
  const [form, setForm] = useState({
    country: settings?.country || "CA",
    province_or_state: settings?.province_or_state || "",
    default_pay_schedule: settings?.default_pay_schedule || "bi_weekly",
    pay_period_anchor_date: settings?.pay_period_anchor_date || "",
    currency: settings?.currency || "CAD",
    business_number: settings?.business_number || "",
    ein: settings?.ein || "",
    payroll_active: settings?.payroll_active || false,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const u = (k, v) => setForm({ ...form, [k]: v });

  const save = async () => {
    setSaving(true); setMsg("");
    const payload = { ...form };
    if (!payload.pay_period_anchor_date) delete payload.pay_period_anchor_date;
    try {
      const r = await fetch(`${API_URL}/api/v1/payroll/settings`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setMsg("Settings saved");
      onUpdate();
      setTimeout(() => setMsg(""), 2500);
    } catch (e) { setMsg(`Failed: ${e.message}`); } finally { setSaving(false); }
  };

  return (
    <div style={{ ...cardStyle, padding: 28, maxWidth: 720 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT, margin: "0 0 6px 0" }}>Payroll settings</h2>
      <p style={{ fontSize: 13, color: TEXT_MUTED, margin: "0 0 24px 0" }}>Sets the country, schedule, and tax IDs used across all pay runs.</p>

      <Row>
        <Select label="Country" value={form.country} onChange={v => u("country", v)} options={[["CA", "🇨🇦 Canada"], ["US", "🇺🇸 United States"]]} />
        <Field label={form.country === "US" ? "State" : "Province"} value={form.province_or_state} onChange={v => u("province_or_state", v)} placeholder={form.country === "US" ? "e.g. CA, TX" : "e.g. AB, ON"} />
      </Row>
      <Row>
        <Select label="Default pay schedule" value={form.default_pay_schedule} onChange={v => u("default_pay_schedule", v)} options={[["weekly", "Weekly"], ["bi_weekly", "Bi-weekly"], ["semi_monthly", "Semi-monthly"], ["monthly", "Monthly"]]} />
        <Select label="Currency" value={form.currency} onChange={v => u("currency", v)} options={[["CAD", "CAD"], ["USD", "USD"]]} />
      </Row>
      <Field label="Pay period anchor date" type="date" value={form.pay_period_anchor_date} onChange={v => u("pay_period_anchor_date", v)} />
      {form.country === "CA"
        ? <Field label="Business Number (BN)" value={form.business_number} onChange={v => u("business_number", v)} placeholder="123456789RP0001" />
        : <Field label="EIN" value={form.ein} onChange={v => u("ein", v)} placeholder="XX-XXXXXXX" />}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
        <button onClick={save} disabled={saving} style={{ ...primaryBtn, padding: "10px 22px" }}>{saving ? "Saving…" : "Save settings"}</button>
        {msg && <span style={{ fontSize: 13, color: msg.startsWith("Failed") ? "#DC2626" : QB_GREEN, fontWeight: 600 }}>{msg}</span>}
      </div>
    </div>
  );
}

// ============================================================================
// SHARED UI
// ============================================================================

function StatCard({ label, value, subtitle, highlight }) {
  return (
    <div style={{ ...cardStyle, padding: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: highlight ? "#F59E0B" : TEXT, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{subtitle}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ children }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>; }
function Row3({ children }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>{children}</div>; }

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputBase} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={inputBase}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function statusPill(status) {
  const map = {
    active: { bg: "#D1FAE5", fg: "#065F46" },
    terminated: { bg: "#FEE2E2", fg: "#991B1B" },
    on_leave: { bg: "#FEF3C7", fg: "#92400E" },
    inactive: { bg: "#E5E7EB", fg: "#374151" },
  };
  const c = map[status] || map.inactive;
  return <span style={{ padding: "3px 10px", background: c.bg, color: c.fg, borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{status}</span>;
}

function invitePill(e) {
  if (e.profile_completed) return <span style={{ padding: "3px 10px", background: "#D1FAE5", color: "#065F46", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>Complete</span>;
  if (e.invite_status === "pending") return <span style={{ padding: "3px 10px", background: "#FEF3C7", color: "#92400E", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>Invite pending</span>;
  return <span style={{ padding: "3px 10px", background: "#F3F4F6", color: "#6B7280", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>Not invited</span>;
}

// ============================================================================
// STYLES
// ============================================================================

const cardStyle = { background: "#fff", borderRadius: 10, border: `1px solid ${BORDER}`, overflow: "hidden" };
const primaryBtn = { background: BRAND, color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" };
const linkBtn = { background: "transparent", border: "none", color: BRAND, fontSize: 13, fontWeight: 600, marginLeft: 12, cursor: "pointer" };
const inputBase = { width: "100%", padding: 10, border: `1px solid #D1D5DB`, borderRadius: 6, fontSize: 14, color: TEXT, boxSizing: "border-box", background: "#fff" };
const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 };
const th = { textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${BORDER}` };
const td = { padding: "14px 16px", fontSize: 14, color: TEXT, verticalAlign: "middle" };
