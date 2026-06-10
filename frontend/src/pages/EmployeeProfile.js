import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Briefcase, CreditCard, DollarSign, Receipt, Wallet,
  Calendar as CalIcon, MinusCircle, Edit2, AlertCircle,
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
    <Card>
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

function SubHeading({ children }) {
  return (
    <h3 style={{
      fontSize: 15, fontWeight: 700, color: colors.textPrimary,
      margin: `${spacing[4]}px 0 ${spacing[1]}px 0`,
      letterSpacing: "-0.01em",
    }}>{children}</h3>
  );
}

function Req() {
  return <span style={{ color: colors.danger, fontWeight: 600 }}> *</span>;
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

  const openEditor = (section) => { setDraft({ ...employee }); setSaveError(null); setEditing(section); };
  const closeEditor = () => { if (saving) return; setEditing(null); setDraft({}); setSaveError(null); };
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
      if (updated && typeof updated === "object" && updated.id) setEmployee(updated);
      else await load();
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
  const payType = (employee.pay_type || "hourly").toLowerCase();
  const country = (employee.country || "CA").toUpperCase();

  const fullName = [employee.title, employee.first_name, employee.middle_initial || employee.m_i, employee.last_name].filter(Boolean).join(" ");
  const homeAddress = [employee.street_address, employee.address_line_2, employee.city, employee.province, employee.postal_code].filter(Boolean).join(", ");
  const mailingAddress = [employee.mailing_street_address, employee.mailing_address_line_2, employee.mailing_city, employee.mailing_province, employee.mailing_postal_code].filter(Boolean).join(", ");

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
              {employee.job_title || "Employee"}
              {employee.email && (<>{" · "}{employee.email}</>)}
            </p>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: spacing[5],
        }}>

          {/* 1. Personal info */}
          <SectionCard
            title="Personal info"
            icon={<div style={iconWrapStyle}><User size={18} color={colors.brandPrimary} /></div>}
            onEdit={() => openEditor("personal")}
          >
            <DetailRow label="Name" value={fullName} />
            <DetailRow label="Preferred first name" value={employee.preferred_first_name} />
            <DetailRow label="Email" value={employee.email} />
            <DetailRow label="Home phone number" value={employee.home_phone} />
            <DetailRow label="Work phone number" value={employee.work_phone} />
            <DetailRow label="Mobile phone number" value={employee.mobile_phone} />
            <DetailRow label="Home address" value={homeAddress} />
            <DetailRow label="Mailing address" value={mailingAddress} />
            <DetailRow label="Birth date" value={employee.birth_date} />
            <DetailRow label="Gender" value={employee.gender} />
            <DetailRow last label="Social insurance number" value={(employee.sin || employee.social_insurance_number) ? "Set" : ""} />
          </SectionCard>

          {/* 2. Employment details */}
          <SectionCard
            title="Employment details"
            icon={<div style={iconWrapStyle}><Briefcase size={18} color={colors.brandPrimary} /></div>}
            onEdit={() => openEditor("employment")}
          >
            <DetailRow label="Status" value={(employee.status || "").replace("_", " ")} />
            <DetailRow label="Hire date" value={employee.hire_date} />
            <DetailRow label="Pay schedule" value={(employee.pay_schedule || "").replace("_", " ")} />
            <DetailRow label="Work location" value={employee.work_location} />
            <DetailRow label="Manager" value={employee.manager} />
            <DetailRow label="Department" value={employee.department} />
            <DetailRow label="Job title" value={employee.job_title} />
            <DetailRow label="Employee ID" value={employee.employee_id} />
            <DetailRow last label="Employment type" value={(employee.employment_type || "").replace("_", " ")} />
          </SectionCard>

          {/* 3. Payment method */}
          <SectionCard
            title="Payment method"
            icon={<div style={iconWrapStyle}><CreditCard size={18} color={colors.brandPrimary} /></div>}
            onEdit={() => openEditor("payment")}
          >
            <DetailRow last label="Payment method" value={(employee.payment_method || "").replace("_", " ")} />
          </SectionCard>

          {/* 4. Base pay */}
          <SectionCard
            title="Base pay"
            icon={<div style={iconWrapStyle}><DollarSign size={18} color={colors.brandPrimary} /></div>}
            onEdit={() => openEditor("base_pay")}
          >
            <DetailRow label="Pay type" value={payType === "salary" ? "Salary" : payType === "commission" ? "Commission only" : "Hourly"} />
            {payType === "salary" ? (
              <>
                <DetailRow label="Salary" value={employee.salary_amount > 0 ? formatCurrency(employee.salary_amount, employee.currency) : ""} mono />
                <DetailRow label="Hours per day" value={employee.hours_per_day} mono />
                <DetailRow last label="Days per week" value={employee.days_per_week} mono />
              </>
            ) : payType === "commission" ? (
              <DetailRow last label="Pay frequency" value={employee.pay_frequency} />
            ) : (
              <>
                <DetailRow label="Rate per hour" value={employee.hourly_rate > 0 ? formatCurrency(employee.hourly_rate, employee.currency) : ""} mono />
                <DetailRow label="Hours per day" value={employee.hours_per_day} mono />
                <DetailRow label="Pay frequency" value={employee.pay_frequency} />
                <DetailRow last label="Overtime eligible" value={employee.overtime_eligible === false ? "No" : "Yes"} />
              </>
            )}
          </SectionCard>

          {/* 5. Tax info */}
          <SectionCard
            title="Tax info"
            subtitle="Jurisdiction and credits"
            icon={<div style={iconWrapStyle}><Receipt size={18} color={colors.brandPrimary} /></div>}
            onEdit={() => openEditor("tax")}
          >
            <DetailRow label="Country" value={country} />
            <DetailRow label="Province or state" value={employee.province_or_state || employee.province} />
            <DetailRow label="Federal credit amount" value={employee.federal_credit_amount > 0 ? formatCurrency(employee.federal_credit_amount, employee.currency) : ""} mono />
            <DetailRow last label="Provincial credit amount" value={employee.provincial_credit_amount > 0 ? formatCurrency(employee.provincial_credit_amount, employee.currency) : ""} mono />
          </SectionCard>

          {/* 6. Direct deposit */}
          <SectionCard
            title="Direct deposit"
            subtitle="Where pay is deposited"
            icon={<div style={iconWrapStyle}><Wallet size={18} color={colors.brandPrimary} /></div>}
            onEdit={() => openEditor("banking")}
          >
            <DetailRow label="Bank" value={employee.bank_name} />
            <DetailRow label={country === "US" ? "Routing number" : "Transit number"} value={(employee.transit_number || employee.routing_number) ? "Set" : ""} />
            <DetailRow label="Account" value={employee.account_number ? "Set" : ""} />
            <DetailRow last label="Account type" value={employee.account_type} />
          </SectionCard>

          {/* 7. Time off */}
          <SectionCard
            title="Time off"
            subtitle="Manage time off policies"
            icon={<div style={iconWrapStyle}><CalIcon size={18} color={colors.brandPrimary} /></div>}
            onEdit={() => openEditor("time_off")}
          >
            <DetailRow label="Vacation policy" value={employee.vacation_policy} />
            <DetailRow label="Sick pay" value={employee.sick_pay} />
            <DetailRow last label="Unpaid time off" value={employee.unpaid_time_off} />
          </SectionCard>

          {/* 8. Deductions and contributions */}
          <SectionCard
            title="Deductions and contributions"
            icon={<div style={iconWrapStyle}><MinusCircle size={18} color={colors.brandPrimary} /></div>}
            onEdit={() => openEditor("deductions")}
          >
            <DetailRow label="Deductions on file" value={Array.isArray(employee.deductions) ? `${employee.deductions.length}` : "0"} />
            <DetailRow last label="T4 dental benefits codes" value={employee.t4_dental_benefits_codes} />
          </SectionCard>
        </div>
      </div>

      {/* 1. Personal info drawer */}
      <EditDrawer open={editing === "personal"} onClose={closeEditor} title="Edit personal info" onSave={save} saving={saving} saveError={saveError}>
        <Input label="Title" value={draft.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Mr, Ms, Dr" />
        <Input label={<>First name<Req /></>} value={draft.first_name || ""} onChange={(e) => set("first_name", e.target.value)} />
        <Input label="M.I." value={draft.middle_initial || draft.m_i || ""} onChange={(e) => set("middle_initial", e.target.value)} />
        <Input label={<>Last name<Req /></>} value={draft.last_name || ""} onChange={(e) => set("last_name", e.target.value)} />
        <Input label="Preferred first name" value={draft.preferred_first_name || ""} onChange={(e) => set("preferred_first_name", e.target.value)} />
        <Input label="Email" type="email" value={draft.email || ""} onChange={(e) => set("email", e.target.value)} />
        <Input label="Home phone number" type="tel" value={draft.home_phone || ""} onChange={(e) => set("home_phone", e.target.value)} placeholder="(780) 555-0100" />
        <Input label="ext." value={draft.home_phone_ext || ""} onChange={(e) => set("home_phone_ext", e.target.value)} />
        <Input label="Work phone number" type="tel" value={draft.work_phone || ""} onChange={(e) => set("work_phone", e.target.value)} placeholder="(780) 555-0100" />
        <Input label="ext." value={draft.work_phone_ext || ""} onChange={(e) => set("work_phone_ext", e.target.value)} />
        <Input label="Mobile phone number" type="tel" value={draft.mobile_phone || ""} onChange={(e) => set("mobile_phone", e.target.value)} placeholder="(780) 555-0100" />

        <SubHeading>Home address</SubHeading>
        <Input label={<>Street Address<Req /></>} value={draft.street_address || ""} onChange={(e) => set("street_address", e.target.value)} placeholder="123 Main Street" />
        <Input label="Address line 2" value={draft.address_line_2 || ""} onChange={(e) => set("address_line_2", e.target.value)} placeholder="Apt, suite, unit" />
        <Input label={<>City<Req /></>} value={draft.city || ""} onChange={(e) => set("city", e.target.value)} />
        <Input label={<>Province<Req /></>} value={draft.province || ""} onChange={(e) => set("province", e.target.value)} />
        <Input label={<>Postal code<Req /></>} value={draft.postal_code || ""} onChange={(e) => set("postal_code", e.target.value)} placeholder="T0B 4A0" />

        <SubHeading>Mailing address</SubHeading>
        <Input label={<>Street Address<Req /></>} value={draft.mailing_street_address || ""} onChange={(e) => set("mailing_street_address", e.target.value)} placeholder="123 Main Street" />
        <Input label="Address line 2" value={draft.mailing_address_line_2 || ""} onChange={(e) => set("mailing_address_line_2", e.target.value)} placeholder="Apt, suite, unit" />
        <Input label={<>City<Req /></>} value={draft.mailing_city || ""} onChange={(e) => set("mailing_city", e.target.value)} />
        <Input label={<>Province<Req /></>} value={draft.mailing_province || ""} onChange={(e) => set("mailing_province", e.target.value)} />
        <Input label={<>Postal code<Req /></>} value={draft.mailing_postal_code || ""} onChange={(e) => set("mailing_postal_code", e.target.value)} placeholder="T0B 4A0" />

        <Input label={<>Birth date<Req /></>} type="date" value={draft.birth_date || ""} onChange={(e) => set("birth_date", e.target.value)} />
        <Select label="Gender" value={draft.gender || ""} onChange={(e) => set("gender", e.target.value)} options={[
          { value: "", label: "Select" },
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "non_binary", label: "Non-binary" },
          { value: "prefer_not_to_say", label: "Prefer not to say" },
        ]} />
        <Input label={<>Social insurance number<Req /></>} value={draft.sin || draft.social_insurance_number || ""} onChange={(e) => set("sin", e.target.value)} placeholder="123-456-789" />
      </EditDrawer>

      {/* 2. Employment details drawer */}
      <EditDrawer open={editing === "employment"} onClose={closeEditor} title="Edit employment details" onSave={save} saving={saving} saveError={saveError}>
        <Select label={<>Status<Req /></>} value={draft.status || "active"} onChange={(e) => set("status", e.target.value)} options={[
          { value: "active", label: "Active" },
          { value: "on_leave", label: "On leave" },
          { value: "inactive", label: "Inactive" },
          { value: "terminated", label: "Terminated" },
        ]} />
        <Input label={<>Hire date<Req /></>} type="date" value={draft.hire_date || ""} onChange={(e) => set("hire_date", e.target.value)} />
        <Select label={<>Pay schedule<Req /></>} value={draft.pay_schedule || "biweekly"} onChange={(e) => set("pay_schedule", e.target.value)} options={[
          { value: "weekly", label: "Weekly" },
          { value: "biweekly", label: "Biweekly" },
          { value: "semi_monthly", label: "Semi-monthly" },
          { value: "monthly", label: "Monthly" },
        ]} />
        <Input label={<>Work location<Req /></>} value={draft.work_location || ""} onChange={(e) => set("work_location", e.target.value)} placeholder="e.g. 49516 Range Road 174, Edmonton, AB" />
        <Input label="Manager" value={draft.manager || ""} onChange={(e) => set("manager", e.target.value)} placeholder="Select a manager" />
        <Input label="Department" value={draft.department || ""} onChange={(e) => set("department", e.target.value)} placeholder="Select a department" />
        <Input label="Job title" value={draft.job_title || ""} onChange={(e) => set("job_title", e.target.value)} />
        <Input label="Employee ID" value={draft.employee_id || ""} onChange={(e) => set("employee_id", e.target.value)} />
        <Select label="Employment type" value={draft.employment_type || "full_time"} onChange={(e) => set("employment_type", e.target.value)} options={[
          { value: "full_time", label: "Full time" },
          { value: "part_time", label: "Part time" },
          { value: "contract", label: "Contract" },
          { value: "casual", label: "Casual" },
        ]} />
      </EditDrawer>

      {/* 3. Payment method drawer */}
      <EditDrawer open={editing === "payment"} onClose={closeEditor} title="Edit payment method" onSave={save} saving={saving} saveError={saveError}>
        <Select label="Payment method" value={draft.payment_method || "direct_deposit"} onChange={(e) => set("payment_method", e.target.value)} options={[
          { value: "direct_deposit", label: "Direct deposit" },
          { value: "check", label: "Check" },
          { value: "cash", label: "Cash" },
        ]} />
      </EditDrawer>

      {/* 4. Base pay drawer */}
      <EditDrawer open={editing === "base_pay"} onClose={closeEditor} title={employee.pay_type ? "Edit base pay" : "Add base pay"} onSave={save} saving={saving} saveError={saveError}>
        <Select label="Pay type" value={draft.pay_type || "hourly"} onChange={(e) => set("pay_type", e.target.value)} options={[
          { value: "hourly", label: "Hourly" },
          { value: "salary", label: "Salary" },
          { value: "commission", label: "Commission only" },
        ]} />
        {(draft.pay_type || "hourly") === "hourly" && (
          <>
            <Input label={<>Rate per hour<Req /></>} type="number" step="0.01" value={draft.hourly_rate || ""} onChange={(e) => set("hourly_rate", e.target.value)} placeholder="0.00" />
            <Input label="Hours per day" type="number" step="0.5" value={draft.hours_per_day || ""} onChange={(e) => set("hours_per_day", e.target.value)} />
            <Select label={<>Pay frequency<Req /></>} value={draft.pay_frequency || "biweekly"} onChange={(e) => set("pay_frequency", e.target.value)} options={[
              { value: "weekly", label: "Weekly" },
              { value: "biweekly", label: "Biweekly" },
              { value: "semi_monthly", label: "Semi-monthly" },
              { value: "monthly", label: "Monthly" },
            ]} />
            <Select label="Overtime eligible" value={draft.overtime_eligible === false ? "no" : "yes"} onChange={(e) => set("overtime_eligible", e.target.value === "yes")} options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]} />
          </>
        )}
        {(draft.pay_type === "salary") && (
          <>
            <Input label={<>Salary<Req /></>} type="number" step="100" value={draft.salary_amount || ""} onChange={(e) => set("salary_amount", e.target.value)} placeholder="0.00" />
            <Input label="Hours per day" type="number" step="0.5" value={draft.hours_per_day || ""} onChange={(e) => set("hours_per_day", e.target.value)} />
            <Input label="Days per week" type="number" step="0.5" value={draft.days_per_week || ""} onChange={(e) => set("days_per_week", e.target.value)} />
          </>
        )}
        {(draft.pay_type === "commission") && (
          <Select label={<>Pay frequency<Req /></>} value={draft.pay_frequency || "biweekly"} onChange={(e) => set("pay_frequency", e.target.value)} options={[
            { value: "weekly", label: "Weekly" },
            { value: "biweekly", label: "Biweekly" },
            { value: "semi_monthly", label: "Semi-monthly" },
            { value: "monthly", label: "Monthly" },
          ]} />
        )}
      </EditDrawer>

      {/* 5. Tax info drawer */}
      <EditDrawer open={editing === "tax"} onClose={closeEditor} title="Edit tax info" onSave={save} saving={saving} saveError={saveError}>
        <Select label="Country" value={draft.country || "CA"} onChange={(e) => set("country", e.target.value)} options={[
          { value: "CA", label: "Canada" },
          { value: "US", label: "United States" },
          { value: "GB", label: "United Kingdom" },
          { value: "AU", label: "Australia" },
          { value: "IE", label: "Ireland" },
        ]} />
        <Input label="Province or state code" value={draft.province_or_state || ""} onChange={(e) => set("province_or_state", e.target.value)} placeholder="e.g. AB, ON, NY, CA" />
        <Input label="Federal credit amount" type="number" step="0.01" value={draft.federal_credit_amount || ""} onChange={(e) => set("federal_credit_amount", e.target.value)} />
        <Input label="Provincial or state credit amount" type="number" step="0.01" value={draft.provincial_credit_amount || ""} onChange={(e) => set("provincial_credit_amount", e.target.value)} />
      </EditDrawer>

      {/* 6. Direct deposit drawer */}
      <EditDrawer open={editing === "banking"} onClose={closeEditor} title="Edit direct deposit" onSave={save} saving={saving} saveError={saveError}>
        <Input label="Bank name" value={draft.bank_name || ""} onChange={(e) => set("bank_name", e.target.value)} />
        <Input label={country === "US" ? "Routing number" : "Transit number"} value={draft.transit_number || draft.routing_number || ""} onChange={(e) => set("transit_number", e.target.value)} />
        <Input label="Account number" value={draft.account_number || ""} onChange={(e) => set("account_number", e.target.value)} />
        <Select label="Account type" value={draft.account_type || "checking"} onChange={(e) => set("account_type", e.target.value)} options={[
          { value: "checking", label: "Checking" },
          { value: "savings", label: "Savings" },
        ]} />
      </EditDrawer>

      {/* 7. Time off drawer */}
      <EditDrawer open={editing === "time_off"} onClose={closeEditor} title="Edit time off" onSave={save} saving={saving} saveError={saveError}>
        <Input label="Vacation policy" value={draft.vacation_policy || ""} onChange={(e) => set("vacation_policy", e.target.value)} />
        <Input label="Sick pay" value={draft.sick_pay || ""} onChange={(e) => set("sick_pay", e.target.value)} />
        <Input label="Unpaid time off" value={draft.unpaid_time_off || ""} onChange={(e) => set("unpaid_time_off", e.target.value)} />
      </EditDrawer>

      {/* 8. Deductions and contributions drawer */}
      <EditDrawer open={editing === "deductions"} onClose={closeEditor} title="Edit deductions and contributions" onSave={save} saving={saving} saveError={saveError}>
        <Input label="T4 dental benefits codes" value={draft.t4_dental_benefits_codes || ""} onChange={(e) => set("t4_dental_benefits_codes", e.target.value)} />
        <div style={{ ...typography.bodySm, color: colors.textSecondary, padding: `${spacing[3]}px ${spacing[4]}px`, background: colors.bgCardActive, borderRadius: radius.md }}>
          To add or remove specific deductions and contributions in detail, use the legacy management screen for now (we are rebuilding the add/remove flow next).
        </div>
        <Button variant="secondary" onClick={() => navigate("/payroll")}>
          Manage deductions in detail
        </Button>
      </EditDrawer>
    </div>
  );
}
