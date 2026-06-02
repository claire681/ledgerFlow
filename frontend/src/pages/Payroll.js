import React, { useState, useEffect, useMemo } from "react";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

// Novala tokens — keep brand color consistent
const BRAND = "#0F5959";
const BRAND_DARK = "#0A4747";
const LINK = "#0077C5";
const QB_GREEN = "#2CA01C";
const BG = "#FFFFFF";
const BG_SOFT = "#FAFBFC";
const BORDER = "#D4D7DC";
const ROW_DIVIDER = "#E3E5E8";
const SELECT_BG = "#F4F5F8";
const TEXT = "#393A3D";
const TEXT_MUTED = "#6B6C72";

const PERIODS_PER_YEAR = { weekly: 52, bi_weekly: 26, semi_monthly: 24, monthly: 12 };

const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("token") || "";
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const fmtMoney = (n, ccy = "CAD") => {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(n);
};

const fmtDateLong = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
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

function getNextPayDateISO(settings) {
  if (!settings || !settings.pay_period_anchor_date) {
    const d = new Date();
    d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
    return d.toISOString();
  }
  const anchor = new Date(settings.pay_period_anchor_date);
  const today = new Date();
  const periods = PERIODS_PER_YEAR[settings.default_pay_schedule] || 26;
  const daysPerPeriod = Math.round(365 / periods);
  let d = new Date(anchor);
  while (d < today) d.setDate(d.getDate() + daysPerPeriod);
  return d.toISOString();
}

// ============================================================================
// MAIN
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
    } catch (e) {}
  };
  const fetchSettings = async () => {
    try {
      const r = await fetch(`${API_URL}/api/v1/payroll/settings`, { headers: authHeaders() });
      if (r.ok) setSettings(await r.json());
    } catch (e) {}
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchSettings()]);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ background: BG, minHeight: "100vh", width: "100%" }}>
      <div style={{ padding: "24px 32px" }}>
        <TabNav tab={tab} setTab={setTab} />
        <div style={{ marginTop: 24 }}>
          {loading && <div style={{ textAlign: "center", padding: 60, color: TEXT_MUTED }}>Loading…</div>}
          {!loading && tab === "employees" && <EmployeesView employees={employees} settings={settings} onRefresh={fetchEmployees} setTab={setTab} />}
          {!loading && tab === "run" && <RunPayrollView employees={employees} settings={settings} />}
          {!loading && tab === "history" && <PayHistoryView />}
          {!loading && tab === "settings" && <SettingsView settings={settings} onUpdate={fetchSettings} />}
        </div>
      </div>
    </div>
  );
}

function TabNav({ tab, setTab }) {
  const tabs = [
    { id: "employees", label: "Employees" },
    { id: "run", label: "Run payroll" },
    { id: "history", label: "Pay history" },
    { id: "settings", label: "Settings" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${BORDER}` }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          padding: "10px 18px", background: "transparent", border: "none",
          borderBottom: `3px solid ${tab === t.id ? BRAND : "transparent"}`,
          color: tab === t.id ? TEXT : TEXT_MUTED,
          fontWeight: tab === t.id ? 600 : 500, fontSize: 15, cursor: "pointer", marginBottom: -1,
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ============================================================================
// EMPLOYEES VIEW — QB-style
// ============================================================================

function EmployeesView({ employees, settings, onRefresh, setTab }) {
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [sortAsc, setSortAsc] = useState(true);
  const [privacy, setPrivacy] = useState(false);
  const [showAddOverlay, setShowAddOverlay] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);

  const nextPayISO = getNextPayDateISO(settings);

  const filtered = useMemo(() => {
    let list = employees.slice();
    if (statusFilter === "active") list = list.filter(e => e.status === "active");
    else if (statusFilter === "inactive") list = list.filter(e => e.status !== "active");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => (e.first_name + " " + e.last_name + " " + (e.personal_email || "") + " " + (e.position_title || "")).toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const A = (a.last_name + a.first_name).toLowerCase();
      const B = (b.last_name + b.first_name).toLowerCase();
      return sortAsc ? A.localeCompare(B) : B.localeCompare(A);
    });
    return list;
  }, [employees, statusFilter, search, sortAsc]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 24, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 500, color: TEXT, margin: 0 }}>Employees</h1>
          <div style={{ display: "inline-flex", marginTop: 16, background: SELECT_BG, padding: 3, borderRadius: 8, border: `1px solid ${BORDER}` }}>
            {[["list", "List"], ["directory", "Directory"]].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "6px 18px", borderRadius: 6,
                background: view === v ? "#FFFFFF" : "transparent", border: "none",
                boxShadow: view === v ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                color: view === v ? TEXT : TEXT_MUTED,
                fontWeight: view === v ? 600 : 500, fontSize: 14, cursor: "pointer",
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <div style={{ display: "inline-flex" }}>
            <button onClick={() => setTab("run")} style={{
              background: BRAND, color: "#fff", border: "none",
              padding: "10px 22px", borderRadius: "6px 0 0 6px",
              fontWeight: 500, fontSize: 15, cursor: "pointer",
            }}>Run payroll</button>
            <button onClick={() => setTab("run")} style={{
              background: BRAND, color: "#fff", border: "none",
              borderLeft: "1px solid rgba(255,255,255,0.25)",
              padding: "10px 12px", borderRadius: "0 6px 6px 0",
              cursor: "pointer", fontSize: 12,
            }}>▾</button>
          </div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4 }}>Next payroll due {fmtDateLong(nextPayISO)}</div>
          <button onClick={() => setTab("history")} style={{ background: "none", border: "none", color: LINK, fontSize: 14, cursor: "pointer", padding: 0 }}>Paycheque list</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 13, color: TEXT_MUTED }}>Privacy</span>
            <button onClick={() => setPrivacy(!privacy)} aria-label="Toggle privacy" style={{
              width: 36, height: 20, borderRadius: 10,
              background: privacy ? BRAND : "#C6CBD2", border: "none",
              position: "relative", cursor: "pointer", padding: 0,
            }}>
              <span style={{ position: "absolute", top: 2, left: privacy ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.15s" }} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "0 1 320px" }}>
          <input
            placeholder="Find an employee" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 36px 9px 12px", border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14, color: TEXT, boxSizing: "border-box" }}
          />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, fontSize: 14 }}>🔍</span>
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={outlinedBtn}>
          <option value="active">Active Employees</option>
          <option value="inactive">Inactive Employees</option>
          <option value="all">All Employees</option>
        </select>

        <div style={{ flex: 1 }} />

        <button onClick={() => setTab("settings")} style={outlinedBtn}>Edit payroll items</button>
        <button onClick={() => setShowAddOverlay(true)} style={outlinedBtn}>Add an employee</button>
        <button title="Table settings" style={{ ...outlinedBtn, padding: "8px 12px" }}>⚙</button>
      </div>

      <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: BG_SOFT }}>
              <th style={{ ...thSpec, width: 60 }}></th>
              <th style={thSpec}>
                <button onClick={() => setSortAsc(!sortAsc)} style={{ background: "none", border: "none", padding: 0, fontSize: 12, fontWeight: 600, color: TEXT_MUTED, letterSpacing: 0.5, textTransform: "uppercase", cursor: "pointer" }}>
                  Name {sortAsc ? "▲" : "▼"}
                </button>
              </th>
              <th style={thSpec}>Pay rate</th>
              <th style={thSpec}>Pay method</th>
              <th style={thSpec}>Available vacation</th>
              <th style={thSpec}>Status</th>
              <th style={thSpec}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 60, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>
                {employees.length === 0 ? "No employees yet. Click \"Add an employee\" above to get started." : "No matches for your filters."}
              </td></tr>
            ) : (
              filtered.map(emp => (
                <EmployeeRow key={emp.id} emp={emp} privacy={privacy} onEdit={() => setEditingEmp(emp)} onRefresh={onRefresh} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddOverlay && (
        <AddEmployeeOverlay
          onClose={() => setShowAddOverlay(false)}
          onCreated={() => { setShowAddOverlay(false); onRefresh(); }}
          onCreatedEnterMore={(emp) => { setShowAddOverlay(false); onRefresh(); setEditingEmp(emp); }}
        />
      )}

      {editingEmp && (
        <EmployeeEditDrawer
          employee={editingEmp}
          onClose={() => setEditingEmp(null)}
          onSaved={() => { setEditingEmp(null); onRefresh(); }}
        />
      )}
    </>
  );
}

function EmployeeRow({ emp, privacy, onEdit, onRefresh }) {
  const initials = `${(emp.last_name || "?")[0]}${(emp.first_name || "?")[0]}`.toUpperCase();
  const displayName = `${(emp.last_name || "").toUpperCase()}, ${emp.first_name || ""}`;
  const payRate = (() => {
    if (emp.pay_type === "hourly" && emp.hourly_rate) return `${fmtMoney(parseFloat(emp.hourly_rate), emp.currency || "CAD")}/hour`;
    if (emp.pay_type === "salary" && emp.salary_amount) return `${fmtMoney(parseFloat(emp.salary_amount), emp.currency || "CAD")}/year`;
    return "—";
  })();
  const payMethod = emp.bank_name ? "Direct deposit" : "Paper cheque";
  const masked = (s) => privacy ? "••••••" : s;

  const handleInvite = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Send a profile-completion invite to ${emp.first_name} at ${emp.personal_email}?`)) return;
    try {
      const r = await fetch(`${API_URL}/api/v1/payroll/employees/${emp.id}/send-invite`, { method: "POST", headers: authHeaders() });
      const d = await r.json();
      if (d.email_sent) alert(`Invite emailed to ${emp.personal_email}.`);
      else {
        try { await navigator.clipboard.writeText(d.invite_url); } catch (_) {}
        alert(`Invite link copied to clipboard:\n\n${d.invite_url}`);
      }
      onRefresh();
    } catch (err) { alert(`Failed: ${err.message}`); }
  };

  const handleTerminate = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Mark ${emp.first_name} ${emp.last_name} as inactive? Their record stays for compliance.`)) return;
    try {
      await fetch(`${API_URL}/api/v1/payroll/employees/${emp.id}`, { method: "DELETE", headers: authHeaders() });
      onRefresh();
    } catch (err) { alert(`Failed: ${err.message}`); }
  };

  return (
    <tr style={{ borderTop: `1px solid ${ROW_DIVIDER}`, cursor: "pointer" }} onClick={onEdit}
        onMouseEnter={e => e.currentTarget.style.background = BG_SOFT}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <td style={tdSpec}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: BRAND, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600 }}>{initials}</div>
      </td>
      <td style={tdSpec}>
        <div style={{ fontSize: 15, color: TEXT, fontWeight: 500 }}>{displayName}</div>
        {emp.position_title && <div style={{ fontSize: 13, color: TEXT_MUTED }}>{emp.position_title}</div>}
      </td>
      <td style={{ ...tdSpec, color: TEXT, fontSize: 14 }}>{masked(payRate)}</td>
      <td style={{ ...tdSpec, color: TEXT, fontSize: 14 }}>{payMethod}</td>
      <td style={{ ...tdSpec, color: TEXT_MUTED, fontSize: 14 }}>Not set up</td>
      <td style={tdSpec}>{statusPill(emp.status)}</td>
      <td style={{ ...tdSpec, textAlign: "right", whiteSpace: "nowrap" }}>
        <button onClick={handleInvite} style={linkBtn}>{emp.invite_status === "pending" ? "Resend invite" : "Send invite"}</button>
        <button onClick={handleTerminate} style={{ ...linkBtn, color: "#C03A2B" }}>Inactive</button>
      </td>
    </tr>
  );
}

// ============================================================================
// ADD EMPLOYEE — FULL-SCREEN OVERLAY (QB Screen 2)
// ============================================================================

function AddEmployeeOverlay({ onClose, onCreated, onCreatedEnterMore }) {
  const [form, setForm] = useState({
    first_name: "", middle_initial: "", last_name: "",
    email: "", hire_date: "", onboarding: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const u = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    setErr("");
    if (!form.first_name.trim() || !form.last_name.trim()) { setErr("First name and last name are required."); return; }
    if (!form.onboarding) { setErr("Please choose an onboarding method."); return; }
    if (form.onboarding === "self_onboard" && !form.email.trim()) { setErr("Email is required for self-onboarding so we can send the invite."); return; }

    setSaving(true);
    const preferred = form.middle_initial.trim() ? `${form.first_name.trim()} ${form.middle_initial.trim()}.` : "";
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      personal_email: (form.email || `pending-${Date.now()}@placeholder.local`).trim().toLowerCase(),
    };
    if (preferred) payload.preferred_name = preferred;
    if (form.hire_date) payload.start_date = form.hire_date;

    try {
      const r = await fetch(`${API_URL}/api/v1/payroll/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({ detail: `HTTP ${r.status}` }));
        throw new Error(e.detail || `HTTP ${r.status}`);
      }
      const emp = await r.json();

      if (form.onboarding === "self_onboard") {
        try {
          const inv = await fetch(`${API_URL}/api/v1/payroll/employees/${emp.id}/send-invite`, { method: "POST", headers: authHeaders() });
          const d = await inv.json();
          if (d.email_sent) alert(`${emp.first_name} added and invite emailed to ${emp.personal_email}.`);
          else {
            try { await navigator.clipboard.writeText(d.invite_url); } catch (_) {}
            alert(`${emp.first_name} added. Email delivery failed — invite link copied to clipboard:\n\n${d.invite_url}`);
          }
        } catch (inviteErr) {
          alert(`${emp.first_name} added, but invite send failed: ${inviteErr.message}.`);
        }
        onCreated();
      } else {
        onCreatedEnterMore(emp);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#FFFFFF", zIndex: 9999, overflowY: "auto" }}>
      <div style={{ padding: "20px 32px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 22, fontWeight: 500, color: TEXT, margin: 0 }}>Add an employee</h2>
        <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "none", fontSize: 26, cursor: "pointer", color: TEXT_MUTED, lineHeight: 1, padding: 4 }}>×</button>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 32px 80px 32px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 600, color: TEXT, margin: "0 0 14px 0", lineHeight: 1.2 }}>Who's your new team member?</h1>
        <p style={{ fontSize: 15, color: TEXT_MUTED, margin: "0 0 6px 0", lineHeight: 1.5 }}>
          Add your employee to get them paid. Include their email or mobile number to give them access to Novala Workforce, where they can view pay, T4s and more.
        </p>
        <a href="#" onClick={e => e.preventDefault()} style={{ color: LINK, fontSize: 14, textDecoration: "none" }}>Find out more about Novala Workforce</a>

        {err && <div style={{ marginTop: 18, background: "#FEF2F2", color: "#991B1B", padding: 10, borderRadius: 6, fontSize: 13 }}>{err}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 12, marginTop: 28 }}>
          <SpecField label="First name" value={form.first_name} onChange={v => u("first_name", v)} />
          <SpecField label="M.I." value={form.middle_initial} onChange={v => u("middle_initial", v.slice(0, 1).toUpperCase())} maxLength={1} />
          <SpecField label="Last name" value={form.last_name} onChange={v => u("last_name", v)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
          <SpecField label="Email" type="email" value={form.email} onChange={v => u("email", v)} />
          <SpecField label="Hire date" type="date" value={form.hire_date} onChange={v => u("hire_date", v)} placeholder="dd/mm/yyyy" />
        </div>

        <hr style={{ marginTop: 36, marginBottom: 24, border: "none", borderTop: `1px solid ${BORDER}` }} />

        <h3 style={{ fontSize: 18, fontWeight: 600, color: TEXT, margin: "0 0 6px 0" }}>Let your employee self onboard and save time</h3>
        <p style={{ fontSize: 14, color: TEXT_MUTED, margin: "0 0 18px 0" }}>They can enter personal, tax and direct deposit info themselves through a secure link.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <RadioOption checked={form.onboarding === "self_onboard"} onChange={() => u("onboarding", "self_onboard")}
            label="Employee self onboard" sub="We'll email them a secure link to fill in their own personal, banking and tax info." />
          <RadioOption checked={form.onboarding === "enter_myself"} onChange={() => u("onboarding", "enter_myself")}
            label="I'll enter all their info myself" sub="Continue to the full profile editor (SIN, banking, tax forms, emergency contact)." />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40, gap: 10 }}>
          <button onClick={onClose} style={{ ...outlinedBtn, padding: "10px 22px", fontSize: 15 }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{
            background: saving ? "#9CA3AF" : BRAND, color: "#fff", border: "none",
            padding: "10px 24px", borderRadius: 6, fontWeight: 500, fontSize: 15,
            cursor: saving ? "default" : "pointer",
          }}>{saving ? "Adding..." : "Add employee"}</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EMPLOYEE EDIT DRAWER (full profile — for "enter myself" path & Edit clicks)
// ============================================================================

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
  bank_name: "", transit_number: "", institution_number: "", routing_number: "",
  account_number_encrypted: "", account_type: "",
  emergency_contact_name: "", emergency_contact_relationship: "",
  emergency_contact_phone: "", emergency_contact_email: "",
  notes: "",
};

function EmployeeEditDrawer({ employee, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    const f = { ...EMPTY_FORM };
    Object.keys(EMPTY_FORM).forEach(k => {
      const v = employee[k];
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
      const r = await fetch(`${API_URL}/api/v1/payroll/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
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
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 680, background: "#fff", zIndex: 1001, overflowY: "auto", boxShadow: "-8px 0 30px rgba(0,0,0,0.12)" }}>
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: TEXT, margin: 0 }}>Edit {employee.first_name} {employee.last_name}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: TEXT_MUTED, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 28 }}>
          {err && <div style={{ background: "#FEF2F2", color: "#991B1B", padding: 10, borderRadius: 6, marginBottom: 18, fontSize: 13 }}>{err}</div>}

          <FormSection title="Personal information">
            <Row><Field label="First name *" value={form.first_name} onChange={v => u("first_name", v)} /><Field label="Last name *" value={form.last_name} onChange={v => u("last_name", v)} /></Row>
            <Row><Field label="Preferred name" value={form.preferred_name} onChange={v => u("preferred_name", v)} /><Field label="Date of birth" type="date" value={form.date_of_birth} onChange={v => u("date_of_birth", v)} /></Row>
            <Row>
              <Select label="Gender" value={form.gender} onChange={v => u("gender", v)} options={[["", "—"], ["female", "Female"], ["male", "Male"], ["non_binary", "Non-binary"], ["prefer_not_to_say", "Prefer not to say"]]} />
              <Select label="Marital status" value={form.marital_status} onChange={v => u("marital_status", v)} options={[["", "—"], ["single", "Single"], ["married", "Married"], ["common_law", "Common-law"], ["divorced", "Divorced"], ["widowed", "Widowed"]]} />
            </Row>
            <Field label={form.country === "US" ? "Social Security Number (SSN)" : "Social Insurance Number (SIN)"} value={form.sin_or_ssn} onChange={v => u("sin_or_ssn", v)} placeholder={form.country === "US" ? "XXX-XX-XXXX" : "XXX XXX XXX"} />
          </FormSection>

          <FormSection title="Contact">
            <Row><Field label="Personal email *" type="email" value={form.personal_email} onChange={v => u("personal_email", v)} /><Field label="Phone" value={form.phone} onChange={v => u("phone", v)} placeholder="(555) 123-4567" /></Row>
            <Field label="Address line 1" value={form.address_line1} onChange={v => u("address_line1", v)} />
            <Field label="Address line 2" value={form.address_line2} onChange={v => u("address_line2", v)} placeholder="Apt, suite (optional)" />
            <Row3><Field label="City" value={form.city} onChange={v => u("city", v)} /><Field label={form.country === "US" ? "State" : "Province"} value={form.province_or_state} onChange={v => u("province_or_state", v)} /><Field label={form.country === "US" ? "ZIP" : "Postal code"} value={form.postal_or_zip} onChange={v => u("postal_or_zip", v)} /></Row3>
            <Select label="Country" value={form.country} onChange={v => u("country", v)} options={[["CA", "Canada"], ["US", "United States"]]} />
          </FormSection>

          <FormSection title="Employment">
            <Row><Field label="Position title" value={form.position_title} onChange={v => u("position_title", v)} placeholder="e.g. Caregiver" /><Field label="Department" value={form.department} onChange={v => u("department", v)} /></Row>
            <Row>
              <Select label="Employment type" value={form.employment_type} onChange={v => u("employment_type", v)} options={[["full_time", "Full-time"], ["part_time", "Part-time"], ["contract", "Contract"], ["intern", "Intern"]]} />
              <Field label="Hire date" type="date" value={form.start_date} onChange={v => u("start_date", v)} />
            </Row>
            <Row><Field label="Employee #" value={form.employee_number} onChange={v => u("employee_number", v)} /><Field label="Manager" value={form.manager_name} onChange={v => u("manager_name", v)} /></Row>
          </FormSection>

          <FormSection title="Compensation">
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
              <Row><Field label="Annual salary" type="number" value={form.salary_amount} onChange={v => u("salary_amount", v)} placeholder="60000" /><Select label="Currency" value={form.currency} onChange={v => u("currency", v)} options={[["CAD", "CAD"], ["USD", "USD"]]} /></Row>
            ) : (
              <Row3><Field label="Hourly rate" type="number" value={form.hourly_rate} onChange={v => u("hourly_rate", v)} placeholder="25.00" /><Field label="Hrs / week" type="number" value={form.hours_per_week} onChange={v => u("hours_per_week", v)} /><Select label="Currency" value={form.currency} onChange={v => u("currency", v)} options={[["CAD", "CAD"], ["USD", "USD"]]} /></Row3>
            )}
            <Select label="Pay schedule" value={form.pay_schedule} onChange={v => u("pay_schedule", v)} options={[["weekly", "Weekly (52/yr)"], ["bi_weekly", "Bi-weekly (26/yr)"], ["semi_monthly", "Semi-monthly (24/yr)"], ["monthly", "Monthly (12/yr)"]]} />
          </FormSection>

          <FormSection title="Direct deposit (optional)">
            <Field label="Bank name" value={form.bank_name} onChange={v => u("bank_name", v)} placeholder="e.g. RBC" />
            {form.country === "CA" ? (
              <Row3><Field label="Transit #" value={form.transit_number} onChange={v => u("transit_number", v)} /><Field label="Institution #" value={form.institution_number} onChange={v => u("institution_number", v)} /><Field label="Account #" value={form.account_number_encrypted} onChange={v => u("account_number_encrypted", v)} /></Row3>
            ) : (
              <Row><Field label="Routing #" value={form.routing_number} onChange={v => u("routing_number", v)} /><Field label="Account #" value={form.account_number_encrypted} onChange={v => u("account_number_encrypted", v)} /></Row>
            )}
            <Select label="Account type" value={form.account_type} onChange={v => u("account_type", v)} options={[["", "—"], ["chequing", "Chequing"], ["savings", "Savings"], ["checking", "Checking"]]} />
          </FormSection>

          <FormSection title="Emergency contact (optional)">
            <Row><Field label="Full name" value={form.emergency_contact_name} onChange={v => u("emergency_contact_name", v)} /><Field label="Relationship" value={form.emergency_contact_relationship} onChange={v => u("emergency_contact_relationship", v)} /></Row>
            <Row><Field label="Phone" value={form.emergency_contact_phone} onChange={v => u("emergency_contact_phone", v)} /><Field label="Email" type="email" value={form.emergency_contact_email} onChange={v => u("emergency_contact_email", v)} /></Row>
          </FormSection>

          <FormSection title="Notes">
            <textarea value={form.notes} onChange={e => u("notes", e.target.value)} rows={3} placeholder="Internal notes (not visible to employee)" style={{ ...inputBase, fontFamily: "inherit", resize: "vertical" }} />
          </FormSection>

          <div style={{ display: "flex", gap: 10, marginTop: 24, paddingTop: 18, borderTop: `1px solid ${BORDER}` }}>
            <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 6, border: `1px solid ${BORDER}`, background: "#fff", fontWeight: 500, fontSize: 14, cursor: "pointer", color: TEXT }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 6, border: "none", background: saving ? "#9CA3AF" : BRAND, color: "#fff", fontWeight: 500, fontSize: 15, cursor: saving ? "default" : "pointer" }}>{saving ? "Saving…" : "Save changes"}</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// RUN PAYROLL
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
    const totals = included.reduce((a, r) => ({ gross: a.gross + r.gross, deductions: a.deductions + r.deductions.total, net: a.net + r.net }), { gross: 0, deductions: 0, net: 0 });
    return { rows, totals, count: included.length };
  }, [active, selected, hoursOverride, country]);

  const toggle = (id) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const handleProcess = async () => {
    if (calc.count === 0) { alert("Select at least one employee."); return; }
    if (!window.confirm(`Process pay run for ${calc.count} employee(s)?\n\nGross: ${fmtMoney(calc.totals.gross)}\nDeductions: ${fmtMoney(calc.totals.deductions)}\nNet: ${fmtMoney(calc.totals.net)}\n\nPay date: ${payDate}`)) return;
    setProcessing(true);

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
      pay_date: payDate, country, currency: settings?.currency || "CAD", pay_stubs: payStubs,
    };

    try {
      const r = await fetch(`${API_URL}/api/v1/payroll/pay-runs`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(payload) });
      if (!r.ok) { const e = await r.json().catch(() => ({ detail: `HTTP ${r.status}` })); throw new Error(e.detail || `HTTP ${r.status}`); }
      const saved = await r.json();
      alert(`Pay run processed ✓\n\n${saved.employee_count} employees · Net paid: ${fmtMoney(saved.total_net)}\n\nFind it under the Pay History tab.`);
    } catch (e) {
      alert(`Failed: ${e.message}`);
    } finally { setProcessing(false); }
  };

  if (active.length === 0) {
    return <div style={{ ...cardStyle, padding: 60, textAlign: "center" }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>💵</div>
      <h3 style={{ fontSize: 17, fontWeight: 600, color: TEXT, margin: "0 0 6px 0" }}>No active employees</h3>
      <p style={{ fontSize: 14, color: TEXT_MUTED, margin: 0 }}>Add employees before running payroll.</p>
    </div>;
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
          <thead><tr style={{ background: BG_SOFT }}>
            <th style={{ ...thSpec, width: 36 }}><input type="checkbox" checked={selected.size === active.length} onChange={() => setSelected(selected.size === active.length ? new Set() : new Set(active.map(e => e.id)))} /></th>
            <th style={thSpec}>Employee</th>
            <th style={thSpec}>Pay type</th>
            <th style={thSpec}>Hours</th>
            <th style={{ ...thSpec, textAlign: "right" }}>Gross</th>
            <th style={{ ...thSpec, textAlign: "right" }}>Deductions</th>
            <th style={{ ...thSpec, textAlign: "right" }}>Net pay</th>
          </tr></thead>
          <tbody>
            {calc.rows.map(({ emp, gross, deductions, net }) => {
              const sel = selected.has(emp.id);
              return (
                <tr key={emp.id} style={{ borderTop: `1px solid ${ROW_DIVIDER}`, opacity: sel ? 1 : 0.5 }}>
                  <td style={tdSpec}><input type="checkbox" checked={sel} onChange={() => toggle(emp.id)} /></td>
                  <td style={tdSpec}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{emp.first_name} {emp.last_name}</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED }}>{emp.position_title || "—"}</div>
                  </td>
                  <td style={tdSpec}>
                    <div style={{ fontSize: 13, color: TEXT, textTransform: "capitalize" }}>{emp.pay_type}</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED }}>{emp.pay_type === "salary" ? `${fmtMoney(parseFloat(emp.salary_amount), emp.currency)}/yr` : `${fmtMoney(parseFloat(emp.hourly_rate), emp.currency)}/hr`}</div>
                  </td>
                  <td style={tdSpec}>
                    {emp.pay_type === "hourly" ? (
                      <input type="number" value={hoursOverride[emp.id] != null ? hoursOverride[emp.id] : (emp.hours_per_week || 0)} onChange={e => setHoursOverride({ ...hoursOverride, [emp.id]: e.target.value })} style={{ ...inputBase, width: 80, padding: "6px 8px" }} />
                    ) : <span style={{ fontSize: 13, color: TEXT_MUTED }}>—</span>}
                  </td>
                  <td style={{ ...tdSpec, textAlign: "right", fontSize: 14, fontWeight: 600, color: TEXT }}>{fmtMoney(gross, emp.currency)}</td>
                  <td style={{ ...tdSpec, textAlign: "right", fontSize: 14, color: "#DC2626" }}>−{fmtMoney(deductions.total, emp.currency)}</td>
                  <td style={{ ...tdSpec, textAlign: "right", fontSize: 15, fontWeight: 700, color: QB_GREEN }}>{fmtMoney(net, emp.currency)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: BG_SOFT, borderTop: `2px solid ${BORDER}` }}>
              <td colSpan={4} style={{ ...tdSpec, fontWeight: 700, color: TEXT }}>Totals ({calc.count} employees)</td>
              <td style={{ ...tdSpec, textAlign: "right", fontWeight: 700, fontSize: 15, color: TEXT }}>{fmtMoney(calc.totals.gross)}</td>
              <td style={{ ...tdSpec, textAlign: "right", fontWeight: 700, fontSize: 15, color: "#DC2626" }}>−{fmtMoney(calc.totals.deductions)}</td>
              <td style={{ ...tdSpec, textAlign: "right", fontWeight: 800, fontSize: 16, color: QB_GREEN }}>{fmtMoney(calc.totals.net)}</td>
            </tr>
          </tfoot>
        </table>

        <div style={{ padding: 20, borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, color: TEXT_MUTED }}>
            Deductions estimated using {country === "CA" ? "Canada (Federal 15% · CPP 5.95% · EI 1.66%)" : "US (Federal 12% · SS 6.2% · Medicare 1.45%)"} simplified rates.
          </div>
          <button onClick={handleProcess} disabled={processing || calc.count === 0} style={{
            background: processing ? "#9CA3AF" : QB_GREEN, color: "#fff", border: "none",
            padding: "12px 24px", borderRadius: 6, fontWeight: 600, fontSize: 15,
            cursor: processing ? "default" : "pointer",
          }}>{processing ? "Processing…" : `Process pay run · ${fmtMoney(calc.totals.net)}`}</button>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// PAY HISTORY
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
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: TEXT_MUTED }}>Loading pay runs…</div>;
  if (runs.length === 0) return (
    <div style={{ ...cardStyle, padding: 60, textAlign: "center" }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>📜</div>
      <h3 style={{ fontSize: 17, fontWeight: 600, color: TEXT, margin: "0 0 6px 0" }}>No pay runs yet</h3>
      <p style={{ fontSize: 14, color: TEXT_MUTED, margin: 0 }}>Once you process your first pay run from the Run Payroll tab, it shows up here.</p>
    </div>
  );

  return (
    <>
      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: BG_SOFT }}>
            <th style={thSpec}>Pay date</th>
            <th style={thSpec}>Period</th>
            <th style={thSpec}>Employees</th>
            <th style={{ ...thSpec, textAlign: "right" }}>Gross</th>
            <th style={{ ...thSpec, textAlign: "right" }}>Deductions</th>
            <th style={{ ...thSpec, textAlign: "right" }}>Net paid</th>
            <th style={thSpec}>Status</th>
            <th></th>
          </tr></thead>
          <tbody>
            {runs.map(pr => (
              <tr key={pr.id} style={{ borderTop: `1px solid ${ROW_DIVIDER}`, cursor: "pointer" }} onClick={() => setSelected(pr)}>
                <td style={tdSpec}><div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{new Date(pr.pay_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div></td>
                <td style={tdSpec}><div style={{ fontSize: 13, color: TEXT_MUTED }}>{new Date(pr.pay_period_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(pr.pay_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div></td>
                <td style={tdSpec}><div style={{ fontSize: 14, color: TEXT }}>{pr.employee_count}</div></td>
                <td style={{ ...tdSpec, textAlign: "right", fontSize: 14, color: TEXT }}>{fmtMoney(pr.total_gross, pr.currency)}</td>
                <td style={{ ...tdSpec, textAlign: "right", fontSize: 14, color: "#DC2626" }}>−{fmtMoney(pr.total_deductions, pr.currency)}</td>
                <td style={{ ...tdSpec, textAlign: "right", fontSize: 15, fontWeight: 700, color: QB_GREEN }}>{fmtMoney(pr.total_net, pr.currency)}</td>
                <td style={tdSpec}>{statusPill(pr.status)}</td>
                <td style={{ ...tdSpec, textAlign: "right", fontSize: 13, color: BRAND, fontWeight: 600 }}>View →</td>
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
            <h2 style={{ fontSize: 19, fontWeight: 600, color: TEXT, margin: "2px 0 0 0" }}>{new Date(payRun.pay_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</h2>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: TEXT_MUTED, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            <StatBox label="Gross" value={fmtMoney(payRun.total_gross, payRun.currency)} sub={`${payRun.employee_count} employees`} />
            <StatBox label="Deductions" value={fmtMoney(payRun.total_deductions, payRun.currency)} sub="taxes + contributions" />
            <StatBox label="Net paid" value={fmtMoney(payRun.total_net, payRun.currency)} sub="to employees" />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Pay stubs</div>
          {loading ? <div style={{ color: TEXT_MUTED, fontSize: 13 }}>Loading…</div> : (
            <div style={cardStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: BG_SOFT }}>
                  <th style={thSpec}>Employee</th>
                  <th style={{ ...thSpec, textAlign: "right" }}>Gross</th>
                  <th style={{ ...thSpec, textAlign: "right" }}>Deductions</th>
                  <th style={{ ...thSpec, textAlign: "right" }}>Net</th>
                </tr></thead>
                <tbody>
                  {(detail?.pay_stubs || []).map(s => (
                    <tr key={s.id} style={{ borderTop: `1px solid ${ROW_DIVIDER}` }}>
                      <td style={tdSpec}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{s.employee_name}</div>
                        <div style={{ fontSize: 12, color: TEXT_MUTED }}>{s.position_title || "—"}</div>
                      </td>
                      <td style={{ ...tdSpec, textAlign: "right", fontSize: 14, color: TEXT }}>{fmtMoney(s.gross, s.currency)}</td>
                      <td style={{ ...tdSpec, textAlign: "right", fontSize: 13, color: "#DC2626" }}>
                        −{fmtMoney(s.deductions_total, s.currency)}
                        <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 400 }}>{Object.entries(s.deductions || {}).map(([k, v]) => `${k.replace(/_/g, " ")}: ${fmtMoney(v, s.currency)}`).join(" · ")}</div>
                      </td>
                      <td style={{ ...tdSpec, textAlign: "right", fontSize: 14, fontWeight: 700, color: QB_GREEN }}>{fmtMoney(s.net, s.currency)}</td>
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
// SETTINGS
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
      setMsg("Settings saved"); onUpdate(); setTimeout(() => setMsg(""), 2500);
    } catch (e) { setMsg(`Failed: ${e.message}`); } finally { setSaving(false); }
  };

  return (
    <div style={{ ...cardStyle, padding: 28, maxWidth: 720 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: TEXT, margin: "0 0 6px 0" }}>Payroll settings</h2>
      <p style={{ fontSize: 14, color: TEXT_MUTED, margin: "0 0 24px 0" }}>Sets the country, schedule, and tax IDs used across all pay runs.</p>
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
        <button onClick={save} disabled={saving} style={{ background: saving ? "#9CA3AF" : BRAND, color: "#fff", border: "none", padding: "10px 22px", borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: saving ? "default" : "pointer" }}>{saving ? "Saving…" : "Save settings"}</button>
        {msg && <span style={{ fontSize: 13, color: msg.startsWith("Failed") ? "#DC2626" : QB_GREEN, fontWeight: 600 }}>{msg}</span>}
      </div>
    </div>
  );
}

// ============================================================================
// SHARED UI
// ============================================================================

function StatBox({ label, value, sub }) {
  return <div style={{ ...cardStyle, padding: 18 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginTop: 4 }}>{value}</div>
    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{sub}</div>
  </div>;
}

function FormSection({ title, children }) {
  return <div style={{ marginBottom: 22 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>{title}</div>
    {children}
  </div>;
}

function Row({ children }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>; }
function Row3({ children }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>{children}</div>; }

function SpecField({ label, value, onChange, type = "text", placeholder, maxLength }) {
  return <div>
    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 6 }}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 15, color: TEXT, boxSizing: "border-box", background: "#fff" }} />
  </div>;
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return <div style={{ marginBottom: 14 }}>
    <label style={lbl}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputBase} />
  </div>;
}

function Select({ label, value, onChange, options }) {
  return <div style={{ marginBottom: 14 }}>
    <label style={lbl}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} style={inputBase}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </div>;
}

function RadioOption({ checked, onChange, label, sub }) {
  return <button type="button" onClick={onChange} style={{
    display: "flex", alignItems: "flex-start", gap: 12,
    padding: "14px 16px", textAlign: "left", background: checked ? "#F0FAFA" : "#fff",
    border: `1px solid ${checked ? BRAND : BORDER}`, borderRadius: 6, cursor: "pointer", width: "100%",
  }}>
    <span style={{
      flexShrink: 0, marginTop: 2, width: 18, height: 18, borderRadius: "50%",
      border: `2px solid ${checked ? BRAND : "#9CA3AF"}`, position: "relative",
      background: "#fff",
    }}>
      {checked && <span style={{ position: "absolute", inset: 3, borderRadius: "50%", background: BRAND }} />}
    </span>
    <div>
      <div style={{ fontSize: 15, fontWeight: 500, color: TEXT }}>{label}</div>
      <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 2 }}>{sub}</div>
    </div>
  </button>;
}

function statusPill(status) {
  const map = {
    active: { bg: "#D1FAE5", fg: "#065F46", label: "Active" },
    terminated: { bg: "#FEE2E2", fg: "#991B1B", label: "Inactive" },
    on_leave: { bg: "#FEF3C7", fg: "#92400E", label: "On leave" },
    inactive: { bg: "#E5E7EB", fg: "#374151", label: "Inactive" },
    approved: { bg: "#D1FAE5", fg: "#065F46", label: "Approved" },
    paid: { bg: "#DBEAFE", fg: "#1E40AF", label: "Paid" },
    draft: { bg: "#F3F4F6", fg: "#6B7280", label: "Draft" },
  };
  const c = map[status] || map.inactive;
  return <span style={{ padding: "3px 10px", background: c.bg, color: c.fg, borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{c.label}</span>;
}

const cardStyle = { background: "#fff", borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" };
const outlinedBtn = { background: "#fff", color: BRAND, border: `1px solid ${BRAND}`, padding: "8px 16px", borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: "pointer" };
const linkBtn = { background: "transparent", border: "none", color: BRAND, fontSize: 13, fontWeight: 500, marginLeft: 14, cursor: "pointer" };
const inputBase = { width: "100%", padding: 10, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14, color: TEXT, boxSizing: "border-box", background: "#fff" };
const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 4 };
const thSpec = { textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${BORDER}` };
const tdSpec = { padding: "14px 16px", fontSize: 15, color: TEXT, verticalAlign: "middle" };
