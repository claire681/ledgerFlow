import React, { useState, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const BRAND = "#0F5959";
const ACCENT = "#0AB98A";

const EMPTY_FORM = {
  first_name: "", last_name: "", personal_email: "",
  position_title: "", employment_type: "full_time", start_date: "",
  pay_type: "salary", salary_amount: "", hourly_rate: "",
  hours_per_week: "40", pay_schedule: "bi_weekly", currency: "CAD",
  department: "", employee_number: "", notes: "",
};

export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/payroll/employees`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
      setError("");
    } catch (e) {
      setError(`Failed to load: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const openAdd = () => { setEditingEmp(null); setForm(EMPTY_FORM); setError(""); setDrawerOpen(true); };
  const openEdit = (emp) => {
    setEditingEmp(emp);
    setForm({
      first_name: emp.first_name || "", last_name: emp.last_name || "",
      personal_email: emp.personal_email || "", position_title: emp.position_title || "",
      employment_type: emp.employment_type || "full_time",
      start_date: emp.start_date || "",
      pay_type: emp.pay_type || "salary",
      salary_amount: emp.salary_amount != null ? String(emp.salary_amount) : "",
      hourly_rate: emp.hourly_rate != null ? String(emp.hourly_rate) : "",
      hours_per_week: emp.hours_per_week != null ? String(emp.hours_per_week) : "40",
      pay_schedule: emp.pay_schedule || "bi_weekly",
      currency: emp.currency || "CAD",
      department: emp.department || "",
      employee_number: emp.employee_number || "",
      notes: emp.notes || "",
    });
    setError("");
    setDrawerOpen(true);
  };
  const closeDrawer = () => { setDrawerOpen(false); setEditingEmp(null); setForm(EMPTY_FORM); setError(""); };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.personal_email.trim()) {
      setError("First name, last name, and email are required");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      personal_email: form.personal_email.trim().toLowerCase(),
      employment_type: form.employment_type,
      pay_type: form.pay_type,
      pay_schedule: form.pay_schedule,
      currency: form.currency,
    };
    if (form.position_title) payload.position_title = form.position_title;
    if (form.start_date) payload.start_date = form.start_date;
    if (form.pay_type === "salary" && form.salary_amount) payload.salary_amount = parseFloat(form.salary_amount);
    if (form.pay_type === "hourly" && form.hourly_rate) payload.hourly_rate = parseFloat(form.hourly_rate);
    if (form.hours_per_week) payload.hours_per_week = parseFloat(form.hours_per_week);
    if (form.department) payload.department = form.department;
    if (form.employee_number) payload.employee_number = form.employee_number;
    if (form.notes) payload.notes = form.notes;

    try {
      const url = editingEmp
        ? `${API_URL}/api/v1/payroll/employees/${editingEmp.id}`
        : `${API_URL}/api/v1/payroll/employees`;
      const method = editingEmp ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      await fetchEmployees();
      closeDrawer();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvite = async (emp) => {
    if (!window.confirm(`Send profile-completion invite to ${emp.first_name} at ${emp.personal_email}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/payroll/employees/${emp.id}/send-invite`, {
        method: "POST", headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.email_sent) {
        alert(`Invite emailed to ${emp.personal_email}. Link expires in 7 days.`);
      } else {
        try { await navigator.clipboard.writeText(data.invite_url); } catch (_) {}
        alert(`Invite link generated and copied to clipboard:\n\n${data.invite_url}\n\nEmail delivery failed${data.email_error ? ` (${data.email_error})` : ""}. Send this link manually.`);
      }
      fetchEmployees();
    } catch (e) {
      alert(`Failed to send invite: ${e.message}`);
    }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Terminate ${emp.first_name} ${emp.last_name}? Their record stays for compliance, but they'll be marked terminated.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/payroll/employees/${emp.id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchEmployees();
    } catch (e) {
      alert(`Failed: ${e.message}`);
    }
  };

  const formatPay = (e) => {
    if (e.pay_type === "salary" && e.salary_amount) return `${e.currency} $${Number(e.salary_amount).toLocaleString()}/yr`;
    if (e.pay_type === "hourly" && e.hourly_rate) return `${e.currency} $${Number(e.hourly_rate).toFixed(2)}/hr`;
    return "—";
  };

  const statusPill = (status) => {
    const map = {
      active: { bg: "#d1fae5", fg: "#065f46" },
      terminated: { bg: "#fee2e2", fg: "#991b1b" },
      on_leave: { bg: "#fef3c7", fg: "#92400e" },
      inactive: { bg: "#e5e7eb", fg: "#374151" },
    };
    const c = map[status] || map.inactive;
    return <span style={{ padding: "3px 10px", background: c.bg, color: c.fg, borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{status}</span>;
  };

  const invitePill = (e) => {
    if (e.profile_completed) return <span style={{ padding: "3px 10px", background: "#d1fae5", color: "#065f46", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>Profile complete</span>;
    if (e.invite_status === "pending") return <span style={{ padding: "3px 10px", background: "#fef3c7", color: "#92400e", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>Invite pending</span>;
    return <span style={{ padding: "3px 10px", background: "#f3f4f6", color: "#6b7280", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>Not invited</span>;
  };

  const initials = (e) => `${(e.first_name || "?")[0]}${(e.last_name || "?")[0]}`.toUpperCase();

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 }}>Payroll</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0 0" }}>Manage employees, pay schedules, and direct deposits.</p>
        </div>
        <button onClick={openAdd} style={{
          background: BRAND, color: "#ffffff", border: "none", padding: "10px 20px",
          borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}>+ Add Employee</button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", color: "#991b1b", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading employees…</div>
      ) : employees.length === 0 ? (
        <div style={{
          background: "#ffffff", border: "1px dashed #d1d5db", borderRadius: 12,
          padding: "60px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111827", margin: "0 0 8px 0" }}>No employees yet</h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px 0" }}>Add your first employee to start running payroll.</p>
          <button onClick={openAdd} style={{
            background: BRAND, color: "#ffffff", border: "none", padding: "12px 24px",
            borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>+ Add your first employee</button>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={th}>Employee</th>
                <th style={th}>Position</th>
                <th style={th}>Pay</th>
                <th style={th}>Status</th>
                <th style={th}>Invite</th>
                <th style={{ ...th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", background: BRAND,
                        color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700,
                      }}>{initials(emp)}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{emp.first_name} {emp.last_name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{emp.personal_email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <div style={{ fontSize: 14, color: "#111827" }}>{emp.position_title || "—"}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{(emp.employment_type || "").replace(/_/g, " ")}</div>
                  </td>
                  <td style={td}>
                    <div style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>{formatPay(emp)}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{(emp.pay_schedule || "").replace(/_/g, " ")}</div>
                  </td>
                  <td style={td}>{statusPill(emp.status)}</td>
                  <td style={td}>{invitePill(emp)}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <button onClick={() => openEdit(emp)} style={actionBtn}>Edit</button>
                    <button onClick={() => handleSendInvite(emp)} style={{ ...actionBtn, color: ACCENT }}>
                      {emp.invite_status === "pending" ? "Resend" : "Send invite"}
                    </button>
                    <button onClick={() => handleDelete(emp)} style={{ ...actionBtn, color: "#dc2626" }}>Terminate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {drawerOpen && (
        <>
          <div onClick={closeDrawer} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000,
          }} />
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "#ffffff",
            zIndex: 1001, overflowY: "auto", boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
          }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
                {editingEmp ? "Edit employee" : "Add new employee"}
              </h2>
              <button onClick={closeDrawer} style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>

            <div style={{ padding: 28 }}>
              {error && (
                <div style={{ background: "#fef2f2", color: "#991b1b", padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 13 }}>{error}</div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <Field label="First name *" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
                <Field label="Last name *" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
              </div>
              <Field label="Personal email *" type="email" value={form.personal_email} onChange={(v) => setForm({ ...form, personal_email: v })} />
              <Field label="Position title" value={form.position_title} onChange={(v) => setForm({ ...form, position_title: v })} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <Select label="Employment type" value={form.employment_type} onChange={(v) => setForm({ ...form, employment_type: v })}
                  options={[["full_time", "Full-time"], ["part_time", "Part-time"], ["contract", "Contract"], ["intern", "Intern"]]} />
                <Field label="Start date" type="date" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Pay type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["salary", "hourly"].map((t) => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, pay_type: t })} style={{
                      flex: 1, padding: 10, borderRadius: 6, border: `1px solid ${form.pay_type === t ? BRAND : "#d1d5db"}`,
                      background: form.pay_type === t ? "#f0fafa" : "#ffffff",
                      color: form.pay_type === t ? BRAND : "#374151",
                      fontWeight: 600, fontSize: 14, cursor: "pointer",
                    }}>{t === "salary" ? "Annual salary" : "Hourly rate"}</button>
                  ))}
                </div>
              </div>

              {form.pay_type === "salary" ? (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 14 }}>
                  <Field label="Annual salary" type="number" value={form.salary_amount} onChange={(v) => setForm({ ...form, salary_amount: v })} placeholder="60000" />
                  <Select label="Currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })}
                    options={[["CAD", "CAD"], ["USD", "USD"]]} />
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <Field label="Hourly rate" type="number" value={form.hourly_rate} onChange={(v) => setForm({ ...form, hourly_rate: v })} placeholder="25.00" />
                  <Field label="Hrs / week" type="number" value={form.hours_per_week} onChange={(v) => setForm({ ...form, hours_per_week: v })} />
                  <Select label="Currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })}
                    options={[["CAD", "CAD"], ["USD", "USD"]]} />
                </div>
              )}

              <Select label="Pay schedule" value={form.pay_schedule} onChange={(v) => setForm({ ...form, pay_schedule: v })}
                options={[["weekly", "Weekly"], ["bi_weekly", "Bi-weekly (every 2 weeks)"], ["semi_monthly", "Semi-monthly (twice a month)"], ["monthly", "Monthly"]]} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} placeholder="Optional" />
                <Field label="Employee #" value={form.employee_number} onChange={(v) => setForm({ ...form, employee_number: v })} placeholder="Optional" />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3} style={{ ...inputBase, fontFamily: "inherit", resize: "vertical" }} placeholder="Optional internal notes" />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button onClick={closeDrawer} style={{
                  flex: 1, padding: 12, borderRadius: 8, border: "1px solid #d1d5db",
                  background: "#ffffff", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#374151",
                }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{
                  flex: 2, padding: 12, borderRadius: 8, border: "none",
                  background: saving ? "#9ca3af" : BRAND, color: "#ffffff",
                  fontWeight: 600, fontSize: 14, cursor: saving ? "default" : "pointer",
                }}>{saving ? "Saving…" : editingEmp ? "Save changes" : "Add employee"}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const th = { textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4 };
const td = { padding: "14px 16px", fontSize: 14, color: "#111827", verticalAlign: "middle" };
const actionBtn = { background: "transparent", border: "none", color: BRAND, fontSize: 13, fontWeight: 600, marginLeft: 14, cursor: "pointer" };
const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 };
const inputBase = { width: "100%", padding: 10, border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, color: "#111827", boxSizing: "border-box" };

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputBase} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputBase}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
