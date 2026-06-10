import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Briefcase, DollarSign, Receipt, CreditCard,
  Edit2, AlertCircle,
} from "lucide-react";
import {
  Button, Card, CardHeader, StatusPill, Spinner, Drawer, Input, Select,
  colors, typography, spacing, radius,
} from "../design-system";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  "Authorization": `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

const formatCurrency = (value, currency) => {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  try {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: currency || "CAD" }).format(num);
  } catch (e) { return num.toFixed(2); }
};

const getEmployeeName = (emp) =>
  emp.name || emp.full_name ||
  [emp.first_name, emp.last_name].filter(Boolean).join(" ") ||
  emp.email || "Unnamed";

const getEmployeeRate = (emp) => parseFloat(emp.hourly_rate || emp.pay_rate || 0) || 0;
const getEmployeeSalary = (emp) => parseFloat(emp.salary_amount || emp.salary || 0) || 0;
const getPayType = (emp) => (emp.pay_type || emp.employment_type || "hourly").toLowerCase();

const getInitials = (name) =>
  name.split(" ").map((s) => s[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();

const iconWrapStyle = {
  width: 38, height: 38, background: colors.brandSoft, borderRadius: radius.lg,
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

function DetailRow({ label, value, mono, last }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: `${spacing[3]}px 0`,
      borderBottom: last ? "none" : `1px solid ${colors.borderSubtle}`,
      gap: spacing[3],
    }}>
      <div style={{ ...typography.bodySm, color: colors.textSecondary }}>{label}</div>
      <div style={{
        ...typography.body, color: value ? colors.textPrimary : colors.textMuted,
        ...(mono ? { fontFeatureSettings: '"tnum" 1' } : {}),
        textAlign: "right", wordBreak: "break-word",
      }}>{value || "Not set"}</div>
    </div>
  );
}

function SectionCard({ title, subtitle, icon, onEdit, children }) {
  return (
    <Card style={{ marginBottom: spacing[5] }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: spacing[3], gap: spacing[3],
      }}>
        <CardHeader title={title} subtitle={subtitle} icon={icon} />
        <Button variant="ghost" size="sm" onClick={onEdit} iconLeft={<Edit2 size={14} />}>
          Edit
        </Button>
      </div>
      <div>{children}</div>
    </Card>
  );
}

function EditDrawer({ open, onClose, title, children, onSave, saving, saveError }) {
  const footer = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing[2] }}>
      <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
      <Button variant="primary" onClick={onSave} disabled={saving}>
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
  return (
    <Drawer isOpen={open} onClose={onClose} title={title} footer={footer}>
      <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
        {children}
      </div>
      {saveError && (
        <div style={{
          background: colors.dangerSoft,
          padding: spacing[3], borderRadius: radius.md,
          marginTop: spacing[4],
          border: `1px solid ${colors.danger}40`,
        }}>
          <div style={{ ...typography.bodySm, color: colors.dangerText }}>{saveError}</div>
        </div>
      )}
    </Drawer>
  );
}

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      let emp = null;
      let res = await fetch(`${API_URL}/api/v1/payroll/employees/${id}`, { headers: authHeaders() });
      if (res.status === 404 || res.status === 405) {
        const listRes = await fetch(`${API_URL}/api/v1/payroll/employees`, { headers: authHeaders() });
        if (!listRes.ok) throw new Error(`Could not load (HTTP ${listRes.status})`);
        const list = await listRes.json();
        const arr = Array.isArray(list) ? list : (list.employees || list.data || []);
        emp = arr.find((e) => String(e.id) === String(id));
        if (!emp) throw new Error("Employee not found");
      } else if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Could not load (HTTP ${res.status})`);
      } else {
        emp = await res.json();
      }
      setEmployee(emp);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const openEditor = (section) => {
    setDraft({ ...employee });
    setSaveError(null);
    setEditing(section);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditing(null);
    setDraft({});
    setSaveError(null);
  };

  const set = (field, value) => setDraft((p) => ({ ...p, [field]: value }));

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/payroll/employees/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Save failed (HTTP ${res.status})`);
      }
      const updated = await res.json().catch(() => null);
      if (updated && typeof updated === "object" && updated.id) {
        setEmployee(updated);
      } else {
        await load();
      }
      setEditing(null);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: colors.bgPage, padding: spacing[8], minHeight: "100%", width: "100%" }}>
        <div style={{ textAlign: "center", paddingTop: spacing[12] }}>
          <Spinner size={20} label="Loading employee..." inline />
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div style={{
        background: colors.bgPage, fontFamily: typography.fontFamily,
        padding: `${spacing[6]}px ${spacing[8]}px`,
        width: "100%", minHeight: "100%", boxSizing: "border-box",
      }}>
        <button onClick={() => navigate("/payroll/employees")} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
          ...typography.bodySm, color: colors.textSecondary,
          padding: 0, marginBottom: spacing[5],
          fontFamily: typography.fontFamily,
        }}>
          <ArrowLeft size={16} /> Employees
        </button>
        <Card style={{ background: colors.dangerSoft, border: `1px solid ${colors.danger}40` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: spacing[3] }}>
            <AlertCircle size={20} color={colors.danger} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...typography.bodyStrong, color: colors.dangerText, marginBottom: 4 }}>
                Could not load employee
              </div>
              <div style={{ ...typography.caption, color: colors.dangerText, marginBottom: spacing[3] }}>
                {error || "Not found"}
              </div>
              <Button variant="secondary" onClick={load}>Try again</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const name = getEmployeeName(employee);
  const status = (employee.status || "active").toLowerCase();
  const country = (employee.country || "CA").toUpperCase();

  return (
    <div style={{
      background: colors.bgPage, fontFamily: typography.fontFamily,
      padding: `${spacing[6]}px ${spacing[8]}px`,
      width: "100%", minHeight: "100%", boxSizing: "border-box",
    }}>
      <div style={{ width: "100%" }}>

        <button onClick={() => navigate("/payroll/employees")} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
          ...typography.bodySm, color: colors.textSecondary,
          padding: 0, marginBottom: spacing[3],
          fontFamily: typography.fontFamily,
        }}>
          <ArrowLeft size={16} /> Employees
        </button>

        <div style={{
          display: "flex", alignItems: "center", gap: spacing[4],
          marginBottom: spacing[6], flexWrap: "wrap",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: radius.pill,
            background: colors.brandSoft,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 700, color: colors.brandPrimary,
            flexShrink: 0,
          }}>{getInitials(name)}</div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: spacing[3], flexWrap: "wrap" }}>
              <h1 style={{ ...typography.displaySm, color: colors.textPrimary, margin: 0 }}>{name}</h1>
              <StatusPill status={status} />
            </div>
            <p style={{ ...typography.body, color: colors.textSecondary, margin: `${spacing[1]}px 0 0` }}>
              {employee.role || employee.title || "Employee"}
              {employee.email && (<>{" · "}{employee.email}</>)}
            </p>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: spacing[5],
        }}>

          <SectionCard
            title="Personal info"
            subtitle="Name, contact, and address"
            icon={<div style={iconWrapStyle}><User size={18} color={colors.brandPrimary} /></div>}
            onEdit={() => openEditor("personal")}
          >
            <DetailRow label="First name" value={employee.first_name} />
            <DetailRow label="Last name" value={employee.last_name} />
            <DetailRow label="Email" value={employee.email} />
            <DetailRow label="Phone" value={employee.phone} />
            <DetailRow label="Date of birth" value={employee.date_of_birth} />
            <DetailRow last label="Address" value={[employee.address_line, employee.city, employee.province_or_state, employee.postal_code].filter(Boolean).join(", ")} />
          </SectionCard>

          <SectionCard
            title="Employment"
            subtitle="Role, dates, and pay schedule"
            icon={<div style={iconWrapStyle}><Briefcase size={18} color={colors.brandPrimary} /></div>}
            onEdit={() => openEditor("employment")}
          >
            <DetailRow label="Employee number" value={employee.employee_number || employee.employee_id} />
            <DetailRow label="Role" value={employee.role || employee.title} />
            <DetailRow label="Start date" value={employee.start_date || employee.hire_date} />
            <DetailRow label="Employment type" value={(employee.employment_type || "").replace("_", " ")} />
            <DetailRow last label="Pay schedule" value={(employee.pay_schedule || "").replace("_", " ")} />
          </SectionCard>

          <SectionCard
            title="Compensation"
            subtitle="Pay type and rate"
            icon={<div style={iconWrapStyle}><DollarSign size={18} color={colors.brandPrimary} /></div>}
            onEdit={() => openEditor("compensation")}
          >
            <DetailRow label="Pay type" value={getPayType(employee)} />
            {getPayType(employee) === "salary" ? (
              <DetailRow label="Annual salary" value={getEmployeeSalary(employee) > 0 ? formatCurrency(getEmployeeSalary(employee), employee.currency) : ""} mono />
            ) : (
              <DetailRow label="Hourly rate" value={getEmployeeRate(employee) > 0 ? formatCurrency(getEmployeeRate(employee), employee.currency) : ""} mono />
            )}
            <DetailRow label="Hours per period" value={employee.hours_per_period || employee.hours_per_week} mono />
            <DetailRow last label="Overtime eligible" value={employee.overtime_eligible === false ? "No" : "Yes"} />
          </SectionCard>

          <SectionCard
            title="Tax info"
            subtitle="Jurisdiction and credits"
            icon={<div style={iconWrapStyle}><Receipt size={18} color={colors.brandPrimary} /></div>}
            onEdit={() => openEditor("tax")}
          >
            <DetailRow label="Country" value={country} />
            <DetailRow label="Province or state" value={employee.province_or_state || employee.province} />
            <DetailRow label="Tax ID" value={(employee.tax_id || employee.sin || employee.ssn) ? "Set" : ""} />
            <DetailRow label="Federal credit amount" value={employee.federal_credit_amount > 0 ? formatCurrency(employee.federal_credit_amount, employee.currency) : ""} mono />
            <DetailRow last label="Provincial credit amount" value={employee.provincial_credit_amount > 0 ? formatCurrency(employee.provincial_credit_amount, employee.currency) : ""} mono />
          </SectionCard>

          <SectionCard
            title="Direct deposit"
            subtitle="Where pay is deposited"
            icon={<div style={iconWrapStyle}><CreditCard size={18} color={colors.brandPrimary} /></div>}
            onEdit={() => openEditor("banking")}
          >
            <DetailRow label="Bank" value={employee.bank_name} />
            <DetailRow label={country === "US" ? "Routing number" : "Transit number"} value={(employee.transit_number || employee.routing_number) ? "Set" : ""} />
            <DetailRow label="Account" value={employee.account_number ? "Set" : ""} />
            <DetailRow last label="Account type" value={employee.account_type} />
          </SectionCard>
        </div>
      </div>

      <EditDrawer open={editing === "personal"} onClose={closeEditor} title="Edit personal info" onSave={save} saving={saving} saveError={saveError}>
        <Input label="First name" value={draft.first_name || ""} onChange={(e) => set("first_name", e.target.value)} />
        <Input label="Last name" value={draft.last_name || ""} onChange={(e) => set("last_name", e.target.value)} />
        <Input label="Email" type="email" value={draft.email || ""} onChange={(e) => set("email", e.target.value)} />
        <Input label="Phone" type="tel" value={draft.phone || ""} onChange={(e) => set("phone", e.target.value)} />
        <Input label="Date of birth" type="date" value={draft.date_of_birth || ""} onChange={(e) => set("date_of_birth", e.target.value)} />
        <Input label="Street address" value={draft.address_line || ""} onChange={(e) => set("address_line", e.target.value)} />
        <Input label="City" value={draft.city || ""} onChange={(e) => set("city", e.target.value)} />
        <Input label="Postal or ZIP code" value={draft.postal_code || ""} onChange={(e) => set("postal_code", e.target.value)} />
      </EditDrawer>

      <EditDrawer open={editing === "employment"} onClose={closeEditor} title="Edit employment" onSave={save} saving={saving} saveError={saveError}>
        <Input label="Employee number" value={draft.employee_number || ""} onChange={(e) => set("employee_number", e.target.value)} />
        <Input label="Role or title" value={draft.role || draft.title || ""} onChange={(e) => set("role", e.target.value)} />
        <Input label="Start date" type="date" value={draft.start_date || ""} onChange={(e) => set("start_date", e.target.value)} />
        <Select label="Employment type" value={draft.employment_type || "full_time"} onChange={(e) => set("employment_type", e.target.value)} options={[
          { value: "full_time", label: "Full time" },
          { value: "part_time", label: "Part time" },
          { value: "contract", label: "Contract" },
          { value: "casual", label: "Casual" },
        ]} />
        <Select label="Pay schedule" value={draft.pay_schedule || "biweekly"} onChange={(e) => set("pay_schedule", e.target.value)} options={[
          { value: "weekly", label: "Weekly" },
          { value: "biweekly", label: "Biweekly" },
          { value: "semi_monthly", label: "Semi-monthly" },
          { value: "monthly", label: "Monthly" },
        ]} />
        <Select label="Status" value={draft.status || "active"} onChange={(e) => set("status", e.target.value)} options={[
          { value: "active", label: "Active" },
          { value: "on_leave", label: "On leave" },
          { value: "terminated", label: "Terminated" },
        ]} />
      </EditDrawer>

      <EditDrawer open={editing === "compensation"} onClose={closeEditor} title="Edit compensation" onSave={save} saving={saving} saveError={saveError}>
        <Select label="Pay type" value={draft.pay_type || "hourly"} onChange={(e) => set("pay_type", e.target.value)} options={[
          { value: "hourly", label: "Hourly" },
          { value: "salary", label: "Salary" },
        ]} />
        {(draft.pay_type || "hourly") === "hourly" ? (
          <Input label="Hourly rate" type="number" step="0.01" value={draft.hourly_rate || ""} onChange={(e) => set("hourly_rate", e.target.value)} />
        ) : (
          <Input label="Annual salary" type="number" step="100" value={draft.salary_amount || ""} onChange={(e) => set("salary_amount", e.target.value)} />
        )}
        <Input label="Default hours per period" type="number" step="0.5" value={draft.hours_per_period || draft.hours_per_week || ""} onChange={(e) => set("hours_per_period", e.target.value)} />
      </EditDrawer>

      <EditDrawer open={editing === "tax"} onClose={closeEditor} title="Edit tax info" onSave={save} saving={saving} saveError={saveError}>
        <Select label="Country" value={draft.country || "CA"} onChange={(e) => set("country", e.target.value)} options={[
          { value: "CA", label: "Canada" },
          { value: "US", label: "United States" },
          { value: "GB", label: "United Kingdom" },
          { value: "AU", label: "Australia" },
          { value: "IE", label: "Ireland" },
        ]} />
        <Input label="Province or state code" value={draft.province_or_state || ""} onChange={(e) => set("province_or_state", e.target.value)} placeholder="e.g. AB, ON, NY, CA" />
        <Input label={(draft.country || country) === "US" ? "SSN" : (draft.country || country) === "CA" ? "SIN" : "Tax ID"} value={draft.tax_id || draft.sin || draft.ssn || ""} onChange={(e) => set("tax_id", e.target.value)} />
        <Input label="Federal credit amount" type="number" step="0.01" value={draft.federal_credit_amount || ""} onChange={(e) => set("federal_credit_amount", e.target.value)} />
        <Input label="Provincial or state credit amount" type="number" step="0.01" value={draft.provincial_credit_amount || ""} onChange={(e) => set("provincial_credit_amount", e.target.value)} />
      </EditDrawer>

      <EditDrawer open={editing === "banking"} onClose={closeEditor} title="Edit direct deposit" onSave={save} saving={saving} saveError={saveError}>
        <Input label="Bank name" value={draft.bank_name || ""} onChange={(e) => set("bank_name", e.target.value)} />
        <Input label={country === "US" ? "Routing number" : "Transit number"} value={draft.transit_number || draft.routing_number || ""} onChange={(e) => set("transit_number", e.target.value)} />
        <Input label="Account number" value={draft.account_number || ""} onChange={(e) => set("account_number", e.target.value)} />
        <Select label="Account type" value={draft.account_type || "checking"} onChange={(e) => set("account_type", e.target.value)} options={[
          { value: "checking", label: "Checking" },
          { value: "savings", label: "Savings" },
        ]} />
      </EditDrawer>
    </div>
  );
}
