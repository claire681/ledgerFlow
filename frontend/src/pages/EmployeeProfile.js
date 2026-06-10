import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, User, Phone, Briefcase, CreditCard, DollarSign, PlusCircle, Plus, Receipt, Wallet,
  Calendar as CalIcon, MinusCircle, Edit2, AlertCircle, Info, ChevronRight, ChevronDown, Trash2,
} from "lucide-react";
import {
  Button, Card, CardHeader, StatusPill, Spinner, Drawer, Input, Select, Checkbox,
  colors, typography, spacing, radius,
} from "../design-system";
import { getTaxDefaults } from "../utils/taxDefaults";

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

const getSetupStatus = (emp) => {
  if (!emp) return "draft";
  const sin = emp.sin || emp.social_insurance_number;
  return sin ? "active" : "draft";
};

const maskSin = (sin) => {
  if (!sin) return "";
  const cleaned = String(sin).replace(/[^0-9]/g, "");
  if (cleaned.length < 3) return "***-***-***";
  return `XXX-XXX-${cleaned.slice(-3)}`;
};

const getInitials = (name) =>
  name.split(" ").map((s) => s[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();

const iconWrapStyle = {
  width: 38, height: 38, background: colors.brandSoft, borderRadius: radius.lg,
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

const ADDITIONAL_PAY_OPTIONS = [
  { id: "vacation_pay", label: "Vacation pay" },
  { id: "stat_holiday_pay", label: "Stat holiday pay" },
  { id: "sick_pay", label: "Sick pay" },
  { id: "bonus", label: "Bonus" },
  { id: "commission", label: "Commission" },
  { id: "overtime", label: "Overtime" },
  { id: "double_overtime", label: "Double overtime" },
  { id: "allowance", label: "Allowance" },
  { id: "reimbursement", label: "Reimbursement" },
];

const DEDUCTION_TYPE_OPTIONS = [
  { value: "", label: "Select type" },
  { value: "rrsp", label: "RRSP" },
  { value: "group_rrsp", label: "Group RRSP" },
  { value: "dental", label: "Dental" },
  { value: "vision", label: "Vision" },
  { value: "extended_health", label: "Extended health" },
  { value: "life_insurance", label: "Life insurance" },
  { value: "long_term_disability", label: "Long-term disability" },
  { value: "short_term_disability", label: "Short-term disability" },
  { value: "union_dues", label: "Union dues" },
  { value: "charitable_donation", label: "Charitable donation" },
  { value: "other", label: "Other" },
];


const VACATION_OPTIONS = [
  { value: "", label: "Select one" },
  { value: "add_new", label: "+ Add vacation policy" },
  { value: "accrue_4pct", label: "4.00% Accrue time/hrs worked" },
  { value: "paid_out_4pct", label: "4.00% Paid out each pay period" },
  { value: "dont_track", label: "Don't track vacation" },
];

const SICK_PAY_OPTIONS = [
  { value: "no_policy", label: "No sick pay policy" },
  { value: "add_new", label: "+ Add new sick pay policy" },
];

const UNPAID_TIME_OFF_OPTIONS = [
  { value: "no_policy", label: "No unpaid time off policy" },
  { value: "add_new", label: "+ Add new unpaid time off policy" },
];

const isSectionFilled = (sectionId, emp) => {
  if (!emp) return false;
  switch (sectionId) {
    case "personal":
      return !!(emp.first_name || emp.last_name || emp.email);
    case "emergency":
      return !!(emp.emergency_name || emp.emergency_home_phone || emp.emergency_mobile_phone || emp.emergency_email);
    case "employment":
      return !!(emp.hire_date || emp.work_location || emp.job_title || emp.employee_id);
    case "payment":
      return !!emp.payment_method;
    case "base_pay":
      return !!emp.pay_type && (parseFloat(emp.hourly_rate) > 0 || parseFloat(emp.salary_amount) > 0);
    case "additional_pay":
      return Array.isArray(emp.additional_pay_types) && emp.additional_pay_types.length > 0;
    case "time_off":
      return !!(emp.vacation_policy || emp.sick_pay_policy || emp.sick_pay || emp.unpaid_time_off_policy || emp.unpaid_time_off);
    case "tax":
      return !!(emp.federal_td1_amount || emp.federal_claim_amount || emp.federal_credit_amount || emp.provincial_claim_amount || emp.provincial_credit_amount || emp.cpp_exempt || emp.ei_exempt || emp.federal_income_tax_exempt);
    case "banking":
      return !!(emp.bank_name || emp.account_number);
    case "deductions":
      const handlePhotoSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSaveError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Image must be under 5MB");
      return;
    }
    setPhotoUploading(true);
    setSaveError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/api/v1/payroll/employees/${id}/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Photo upload failed");
      }
      const data = await res.json();
      setEmployee((prev) => ({ ...prev, photo_url: data.photo_url || data.url || prev.photo_url }));
    } catch (err) {
      setSaveError(err.message || "Photo upload failed");
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (Array.isArray(emp.deductions) && emp.deductions.length > 0) || !!emp.t4_dental_benefits_codes;
    default:
      return false;
  }
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

function EditDrawer({ open, onClose, title, children, onSave, saving, saveError }) {
  const footer = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing[2] }}>
      <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
      <Button variant="primary" onClick={onSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
  return (
    <Drawer isOpen={open} onClose={onClose} title={title} footer={footer}>
      <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>{children}</div>
      {saveError && (
        <div style={{
          background: colors.dangerSoft, padding: spacing[3], borderRadius: radius.md,
          marginTop: spacing[4], border: `1px solid ${colors.danger}40`,
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
      margin: `${spacing[4]}px 0 ${spacing[1]}px 0`, letterSpacing: "-0.01em",
    }}>{children}</h3>
  );
}

function Req() { return <span style={{ color: colors.danger, fontWeight: 600 }}> *</span>; }

const drawerH1Style = {
  fontSize: 20,
  fontWeight: 700,
  color: colors.textPrimary,
  margin: `0 0 ${spacing[2]}px 0`,
  letterSpacing: "-0.01em",
};

const SECTIONS = [
  { id: "personal", label: "Personal info", Icon: User, drawerTitle: "Edit personal info" },
  { id: "emergency", label: "Emergency contact", Icon: Phone, drawerTitle: "Edit emergency contact" },
  { id: "employment", label: "Employment details", Icon: Briefcase, drawerTitle: "Edit employment details" },
  { id: "payment", label: "Payment method", Icon: CreditCard, drawerTitle: "Edit payment method" },
  { id: "base_pay", label: "Base pay", Icon: DollarSign, drawerTitle: "Edit base pay" },
  { id: "additional_pay", label: "Additional pay types", Icon: PlusCircle, Plus, drawerTitle: "Edit additional pay types" },
  { id: "time_off", label: "Time off", Icon: CalIcon, drawerTitle: "Edit time off" },
  { id: "tax", label: "Tax withholdings", Icon: Receipt, drawerTitle: "Edit tax withholdings" },
  { id: "banking", label: "Direct deposit", Icon: Wallet, drawerTitle: "Edit direct deposit" },
  { id: "deductions", label: "Deductions and contributions", Icon: MinusCircle, drawerTitle: "Edit deductions and contributions" },
];

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("personal");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [taxSections, setTaxSections] = useState({ federal: true, provincial: true, exemptions: true });
  const toggleTaxSection = (key) => setTaxSections((p) => ({ ...p, [key]: !p[key] }));

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";
  const setActiveTab = (tab) => setSearchParams({ tab });
  const [photoUploading, setPhotoUploading] = useState(false);
  const [penHovered, setPenHovered] = useState(false);
  const fileInputRef = useRef(null);

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
    let newDraft = { ...employee };
    if (section === "tax") {
      const defaults = getTaxDefaults(employee.country || "CA", employee.province_or_state || employee.province_of_employment || employee.province || "AB");
      if (!newDraft.federal_td1_amount && !newDraft.federal_claim_amount && !newDraft.federal_credit_amount) {
        newDraft.federal_td1_amount = defaults.federal;
      }
      if (!newDraft.provincial_claim_amount && !newDraft.provincial_credit_amount) {
        newDraft.provincial_claim_amount = defaults.provincial;
      }
      if (newDraft.additional_federal_tax === undefined || newDraft.additional_federal_tax === null) {
        newDraft.additional_federal_tax = 0;
      }
    }
    setDraft(newDraft);
    setSaveError(null);
    setEditing(section);
  };
  const closeEditor = () => { if (saving) return; setEditing(null); setDraft({}); setSaveError(null); };
  const set = (field, value) => setDraft((p) => ({ ...p, [field]: value }));

  const addDeduction = () => {
    setDraft((p) => ({
      ...p,
      deductions: [...(p.deductions || []), { type: "", effective_pay_period: "", date: "" }],
    }));
  };
  const removeDeduction = (idx) => {
    setDraft((p) => ({
      ...p,
      deductions: (p.deductions || []).filter((_, i) => i !== idx),
    }));
  };
  const setDeductionField = (idx, field, value) => {
    setDraft((p) => ({
      ...p,
      deductions: (p.deductions || []).map((d, i) => i === idx ? { ...d, [field]: value } : d),
    }));
  };

  const toggleAdditionalPay = (typeId) => {
    setDraft((p) => {
      const current = p.additional_pay_types || [];
      const next = current.includes(typeId)
        ? current.filter((t) => t !== typeId)
        : [...current, typeId];
      return { ...p, additional_pay_types: next };
    });
  };

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
          padding: 0, marginBottom: spacing[5], fontFamily: typography.fontFamily,
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
  const setupStatus = getSetupStatus(employee);
  const payType = (employee.pay_type || "hourly").toLowerCase();
  const country = (employee.country || "CA").toUpperCase();
  const fullName = [employee.title, employee.first_name, employee.middle_initial || employee.m_i, employee.last_name].filter(Boolean).join(" ");
  const homeAddress = [employee.street_address, employee.address_line_2, employee.city, employee.province, employee.postal_code].filter(Boolean).join(", ");
  const mailingAddress = [employee.mailing_street_address, employee.mailing_address_line_2, employee.mailing_city, employee.mailing_province, employee.mailing_postal_code].filter(Boolean).join(", ");
  const emergencyAddress = [employee.emergency_address_line, employee.emergency_city, employee.emergency_province, employee.emergency_postal_code].filter(Boolean).join(", ");

  const enabledPayTypes = employee.additional_pay_types || [];
  const enabledLabels = ADDITIONAL_PAY_OPTIONS.filter((o) => enabledPayTypes.includes(o.id)).map((o) => o.label).join(", ");

  const currentSection = SECTIONS.find((s) => s.id === activeSection);

  let sectionContent = null;
  if (activeSection === "personal") {
    sectionContent = (
      <>
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
        <DetailRow last label="Social insurance number" value={maskSin(employee.sin || employee.social_insurance_number)} mono />
      </>
    );
  } else if (activeSection === "emergency") {
    sectionContent = (
      <>
        <DetailRow label="Name" value={employee.emergency_name} />
        <DetailRow label="Relationship" value={employee.emergency_relationship} />
        <DetailRow label="Home phone number" value={employee.emergency_home_phone} />
        <DetailRow label="Mobile phone number" value={employee.emergency_mobile_phone} />
        <DetailRow label="Email" value={employee.emergency_email} />
        <DetailRow last label="Address" value={emergencyAddress} />
      </>
    );
  } else if (activeSection === "employment") {
    sectionContent = (
      <>
        <DetailRow label="Status" value={(employee.status || "").replace("_", " ")} />
        <DetailRow label="Hire date" value={employee.hire_date} />
        <DetailRow label="Pay schedule" value={(employee.pay_schedule || "").replace("_", " ")} />
        <DetailRow label="Work location" value={employee.work_location} />
        <DetailRow label="Manager" value={employee.manager} />
        <DetailRow label="Department" value={employee.department} />
        <DetailRow label="Job title" value={employee.job_title} />
        <DetailRow label="Employee ID" value={employee.employee_id} />
        <DetailRow last label="Employment type" value={(employee.employment_type || "").replace("_", " ")} />
      </>
    );
  } else if (activeSection === "payment") {
    sectionContent = (
      <DetailRow last label="Payment method" value={(employee.payment_method || "").replace("_", " ")} />
    );
  } else if (activeSection === "base_pay") {
    sectionContent = (
      <>
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
            <DetailRow last label="Pay frequency" value={employee.pay_frequency} />
          </>
        )}
      </>
    );
  } else if (activeSection === "additional_pay") {
    sectionContent = (
      <DetailRow last label="Enabled pay types" value={enabledLabels} />
    );
  } else if (activeSection === "time_off") {
    const vacationLabel = employee.vacation_policy
      ? (VACATION_OPTIONS.find((o) => o.value === employee.vacation_policy) || {}).label
      : null;
    const sickPayValue = employee.sick_pay_policy || employee.sick_pay;
    const sickPayLabel = sickPayValue
      ? (SICK_PAY_OPTIONS.find((o) => o.value === sickPayValue) || {}).label
      : null;
    const unpaidValue = employee.unpaid_time_off_policy || employee.unpaid_time_off;
    const unpaidLabel = unpaidValue
      ? (UNPAID_TIME_OFF_OPTIONS.find((o) => o.value === unpaidValue) || {}).label
      : null;
    sectionContent = (
      <>
        <DetailRow label="Vacation policy" value={vacationLabel} />
        <DetailRow label="Sick pay" value={sickPayLabel} />
        <DetailRow last label="Unpaid time off" value={unpaidLabel} />
      </>
    );
  } else if (activeSection === "tax") {
    const provinceCode = (employee.province_or_state || employee.province_of_employment || employee.province || "").toUpperCase();
    const fedAmount = employee.federal_td1_amount || employee.federal_claim_amount || employee.federal_credit_amount;
    const provAmount = employee.provincial_claim_amount || employee.provincial_credit_amount;
    sectionContent = (
      <>
        <DetailRow label="Province" value={provinceCode} />
        <DetailRow label="Federal TD1 amount" value={fedAmount > 0 ? formatCurrency(fedAmount, employee.currency) : ""} mono />
        <DetailRow label="Additional federal tax (per pay)" value={employee.additional_federal_tax > 0 ? formatCurrency(employee.additional_federal_tax, employee.currency) : ""} mono />
        <DetailRow label="Provincial claim amount" value={provAmount > 0 ? formatCurrency(provAmount, employee.currency) : ""} mono />
        <DetailRow label="CPP exempt" value={employee.cpp_exempt === true ? "Yes" : "No"} />
        <DetailRow label="EI exempt" value={employee.ei_exempt === true ? "Yes" : "No"} />
        <DetailRow last label="Federal income tax exempt" value={employee.federal_income_tax_exempt === true ? "Yes" : "No"} />
      </>
    );
  } else if (activeSection === "banking") {
    sectionContent = (
      <>
        <DetailRow label="Bank" value={employee.bank_name} />
        <DetailRow label={country === "US" ? "Routing number" : "Transit number"} value={(employee.transit_number || employee.routing_number) ? "Set" : ""} />
        <DetailRow label="Account" value={employee.account_number ? "Set" : ""} />
        <DetailRow last label="Account type" value={employee.account_type} />
      </>
    );
  } else if (activeSection === "deductions") {
    const deds = Array.isArray(employee.deductions) ? employee.deductions : [];
    sectionContent = (
      <>
        <DetailRow label="Deductions and contributions on file" value={`${deds.length}`} />
        {deds.map((d, idx) => (
          <DetailRow
            key={idx}
            label={DEDUCTION_TYPE_OPTIONS.find((o) => o.value === d.type)?.label || d.type || "Deduction"}
            value={[d.effective_pay_period, d.date].filter(Boolean).join(" · ")}
          />
        ))}
        <DetailRow last label="T4 dental benefits codes" value={employee.t4_dental_benefits_codes} />
      </>
    );
  }

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
        padding: 0, marginBottom: spacing[3], fontFamily: typography.fontFamily,
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
          fontSize: 22, fontWeight: 700, color: colors.brandPrimary, flexShrink: 0,
        }}>{getInitials(name)}</div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3], flexWrap: "wrap" }}>
            <h1 style={{ ...typography.displaySm, color: colors.textPrimary, margin: 0 }}>{name}</h1>
            <StatusPill status={setupStatus} />
          </div>
          <p style={{ ...typography.body, color: colors.textSecondary, margin: `${spacing[1]}px 0 0` }}>
            {employee.job_title || "Employee"}
            {employee.email && (<>{" · "}{employee.email}</>)}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: spacing[6], alignItems: "flex-start", flexWrap: "wrap" }}>

        <nav style={{
          width: 260, minWidth: 260,
          background: colors.bgCard,
          border: `1px solid ${colors.borderDefault}`,
          borderRadius: radius.lg,
          padding: spacing[2],
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          {SECTIONS.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: "flex", alignItems: "center", gap: spacing[3],
                  padding: `${spacing[3]}px ${spacing[3]}px`,
                  background: isActive ? colors.brandSoft : "transparent",
                  border: "none", cursor: "pointer", borderRadius: radius.md,
                  ...typography.bodyMd,
                  color: isActive ? colors.brandPrimary : colors.textPrimary,
                  fontWeight: isActive ? 600 : 500,
                  textAlign: "left", fontFamily: typography.fontFamily,
                  transition: "background 150ms ease, color 150ms ease",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = colors.bgCardHover; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <s.Icon size={16} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{s.label}</span>
                {isActive && <ChevronRight size={14} />}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1, minWidth: 320 }}>
          <Card>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              marginBottom: spacing[4], gap: spacing[3],
            }}>
              <CardHeader
                title={currentSection?.label || ""}
                icon={<div style={iconWrapStyle}>{currentSection && <currentSection.Icon size={18} color={colors.brandPrimary} />}</div>}
              />
              <Button variant="primary" size="sm" onClick={() => openEditor(activeSection)} iconLeft={isSectionFilled(activeSection, employee) ? <Edit2 size={14} /> : <Plus size={14} />}>
                {isSectionFilled(activeSection, employee) ? "Edit" : "Start"}
              </Button>
            </div>
            <div>{sectionContent}</div>
          </Card>
        </div>
      </div>

      )}

      {activeTab === "paycheques" && (
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.borderDefault}`,
          borderRadius: radius.lg,
          padding: `${spacing[10]}px ${spacing[8]}px`,
          textAlign: "center",
        }}>
          <Receipt size={48} color={colors.textMuted} style={{ marginBottom: spacing[3] }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary, margin: `0 0 ${spacing[2]}px 0` }}>
            No paycheques yet
          </h3>
          <p style={{ ...typography.body, color: colors.textSecondary, margin: 0 }}>
            Pay stubs from completed payrolls will show here.
          </p>
        </div>
      )}

      {activeTab === "documents" && (
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.borderDefault}`,
          borderRadius: radius.lg,
          padding: `${spacing[10]}px ${spacing[8]}px`,
          textAlign: "center",
        }}>
          <Wallet size={48} color={colors.textMuted} style={{ marginBottom: spacing[3] }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary, margin: `0 0 ${spacing[2]}px 0` }}>
            Documents coming soon
          </h3>
          <p style={{ ...typography.body, color: colors.textSecondary, margin: 0 }}>
            Upload contracts, tax forms, and other employee documents here.
          </p>
        </div>
      )}

      {activeTab === "notes" && (
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.borderDefault}`,
          borderRadius: radius.lg,
          padding: `${spacing[10]}px ${spacing[8]}px`,
          textAlign: "center",
        }}>
          <Edit2 size={48} color={colors.textMuted} style={{ marginBottom: spacing[3] }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary, margin: `0 0 ${spacing[2]}px 0` }}>
            No notes yet
          </h3>
          <p style={{ ...typography.body, color: colors.textSecondary, margin: 0 }}>
            Add internal notes about this employee here.
          </p>
        </div>
      )}

      {activeTab === "permissions" && (
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.borderDefault}`,
          borderRadius: radius.lg,
          padding: `${spacing[10]}px ${spacing[8]}px`,
          textAlign: "center",
        }}>
          <User size={48} color={colors.textMuted} style={{ marginBottom: spacing[3] }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary, margin: `0 0 ${spacing[2]}px 0` }}>
            Permissions coming soon
          </h3>
          <p style={{ ...typography.body, color: colors.textSecondary, margin: 0 }}>
            Manage what this employee can see and do in Novala.
          </p>
        </div>
      )}

      {/* 1. Personal info drawer */}
      <EditDrawer open={editing === "personal"} onClose={closeEditor} title="Edit personal info" onSave={save} saving={saving} saveError={saveError}>
        <h2 style={drawerH1Style}>Tell us more about {employee.first_name || "this employee"}</h2>
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

      {/* 2. Emergency contact drawer */}
      <EditDrawer open={editing === "emergency"} onClose={closeEditor} title="Edit emergency contact" onSave={save} saving={saving} saveError={saveError}>
        <Input label="Name" value={draft.emergency_name || ""} onChange={(e) => set("emergency_name", e.target.value)} placeholder="Full name" />
        <Select label="Relationship" value={draft.emergency_relationship || ""} onChange={(e) => set("emergency_relationship", e.target.value)} options={[
          { value: "", label: "Select" },
          { value: "spouse", label: "Spouse" },
          { value: "parent", label: "Parent" },
          { value: "child", label: "Child" },
          { value: "sibling", label: "Sibling" },
          { value: "partner", label: "Partner" },
          { value: "friend", label: "Friend" },
          { value: "other", label: "Other" },
        ]} />
        <Input label="Home phone number" type="tel" value={draft.emergency_home_phone || ""} onChange={(e) => set("emergency_home_phone", e.target.value)} placeholder="(780) 555-0100" />
        <Input label="Mobile phone number" type="tel" value={draft.emergency_mobile_phone || ""} onChange={(e) => set("emergency_mobile_phone", e.target.value)} placeholder="(780) 555-0100" />
        <Input label="Email" type="email" value={draft.emergency_email || ""} onChange={(e) => set("emergency_email", e.target.value)} />
        <SubHeading>Address</SubHeading>
        <Input label="Street Address" value={draft.emergency_address_line || ""} onChange={(e) => set("emergency_address_line", e.target.value)} placeholder="123 Main Street" />
        <Input label="City" value={draft.emergency_city || ""} onChange={(e) => set("emergency_city", e.target.value)} />
        <Input label="Province" value={draft.emergency_province || ""} onChange={(e) => set("emergency_province", e.target.value)} />
        <Input label="Postal code" value={draft.emergency_postal_code || ""} onChange={(e) => set("emergency_postal_code", e.target.value)} placeholder="T0B 4A0" />
      </EditDrawer>

      {/* 3. Employment details drawer */}
      <EditDrawer open={editing === "employment"} onClose={closeEditor} title="Edit employment details" onSave={save} saving={saving} saveError={saveError}>
        <h2 style={drawerH1Style}>Let’s get down to {employee.first_name || "this employee"}’s employment specifics</h2>
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

      {/* 4. Payment method drawer - matches spec */}
      <EditDrawer
        open={editing === "payment_method"}
        onClose={closeEditor}
        title="Edit payment method"
        onSave={() => {
          if (draft.payment_method === "direct_deposit") {
            const inst = String(draft.institution_number || draft.direct_deposit_institution_number || "");
            const transit = String(draft.transit_number || draft.direct_deposit_transit_number || "");
            const acct = String(draft.account_number || draft.direct_deposit_account_number || "");
            if (!inst || inst.length !== 3) { setSaveError("Institution number must be 3 digits"); return; }
            if (!transit || transit.length !== 5) { setSaveError("Transit number must be 5 digits"); return; }
            if (!acct) { setSaveError("Account number is required"); return; }
          }
          save();
        }}
        saving={saving}
        saveError={saveError}
      >
        <h2 style={drawerH1Style}>
          How would you like to pay {employee.first_name || "this employee"}?
        </h2>

        <Select
          label="Payment method"
          value={draft.payment_method === "check" ? "paper_cheque" : (draft.payment_method || "paper_cheque")}
          onChange={(e) => set("payment_method", e.target.value)}
          options={[
            { value: "paper_cheque", label: "Paper cheque" },
            { value: "direct_deposit", label: "Direct deposit" },
          ]}
        />

        {draft.payment_method === "direct_deposit" && (
          <div style={{ marginTop: spacing[5] }}>
            <h3 style={{
              fontSize: 16, fontWeight: 700, color: colors.textPrimary,
              margin: `0 0 ${spacing[2]}px 0`, letterSpacing: "-0.01em",
            }}>
              Bank account details
            </h3>
            <p style={{
              fontSize: 13, color: colors.textSecondary,
              lineHeight: 1.55, margin: `0 0 ${spacing[4]}px 0`,
            }}>
              Where should we deposit {employee.first_name || "this employee"}&rsquo;s pay?
            </p>

            <div style={{ marginBottom: spacing[4] }}>
              <Select
                label={<>Account type<Req /></>}
                value={draft.account_type || draft.direct_deposit_account_type || "chequing"}
                onChange={(e) => set("account_type", e.target.value)}
                options={[
                  { value: "chequing", label: "Chequing" },
                  { value: "savings", label: "Savings" },
                ]}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: spacing[4] }}>
              <Input
                label={<>Institution number<Req /></>}
                value={draft.institution_number || draft.direct_deposit_institution_number || ""}
                onChange={(e) => set("institution_number", e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                placeholder="3 digits"
                inputMode="numeric"
              />
              <Input
                label={<>Transit number<Req /></>}
                value={draft.transit_number || draft.direct_deposit_transit_number || ""}
                onChange={(e) => set("transit_number", e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                placeholder="5 digits"
                inputMode="numeric"
              />
            </div>

            <Input
              label={<>Account number<Req /></>}
              value={draft.account_number || draft.direct_deposit_account_number || ""}
              onChange={(e) => set("account_number", e.target.value.replace(/[^0-9]/g, ""))}
              placeholder=""
              inputMode="numeric"
            />

            <div style={{
              fontSize: 12, color: colors.textSecondary,
              marginTop: spacing[3], lineHeight: 1.55,
            }}>
              Bank details are stored securely and used only for payroll.
            </div>
          </div>
        )}
      </EditDrawer>

      {/* 5. Base pay drawer - matches spec */}
      <EditDrawer
        open={editing === "base_pay"}
        onClose={closeEditor}
        title={employee.pay_type ? "Edit base pay" : "Add base pay"}
        onSave={() => {
          const pt = draft.pay_type || "hourly";
          if (pt === "hourly" && (!draft.hourly_rate || parseFloat(draft.hourly_rate) <= 0)) {
            setSaveError("Rate is required");
            return;
          }
          if (pt === "salary") {
            if (!draft.pay_frequency) { setSaveError("Pay frequency is required"); return; }
            if (!draft.salary_amount || parseFloat(draft.salary_amount) <= 0) { setSaveError("Salary is required"); return; }
          }
          if (draft.effective_option === "specific_date" && !draft.effective_date) {
            setSaveError("Date is required when Specific date is selected");
            return;
          }
          save();
        }}
        saving={saving}
        saveError={saveError}
      >

        <h3 style={{
          fontSize: 18, fontWeight: 700, color: colors.textPrimary,
          margin: `0 0 ${spacing[4]}px 0`, letterSpacing: "-0.01em",
        }}>
          Select compensation type
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { value: "hourly", label: "Hourly" },
            { value: "salary", label: "Salary" },
            { value: "commission", label: "Commission only" },
          ].map((o) => {
            const isSelected = (draft.pay_type || "hourly") === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => set("pay_type", o.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", textAlign: "left",
                  background: isSelected ? colors.brandSoft : colors.bgCard,
                  border: `1.5px solid ${isSelected ? colors.brandPrimary : colors.borderDefault}`,
                  borderRadius: 10, cursor: "pointer", width: "100%",
                  transition: "background 0.15s, border-color 0.15s",
                  fontFamily: typography.fontFamily,
                }}
              >
                <span style={{
                  flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
                  border: `2px solid ${isSelected ? colors.brandPrimary : colors.textMuted}`,
                  background: colors.bgCard, position: "relative",
                }}>
                  {isSelected && (
                    <span style={{
                      position: "absolute", inset: 3, borderRadius: "50%",
                      background: colors.brandPrimary,
                    }} />
                  )}
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>{o.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ height: 1, background: colors.borderDefault, margin: "24px 0" }} />

        {/* 2. Amount fields */}
        {(draft.pay_type || "hourly") === "hourly" && (
          <div style={{ maxWidth: 220 }}>
            <label style={{
              display: "block", ...typography.bodySm, fontWeight: 500,
              color: colors.textPrimary, marginBottom: 6,
            }}>
              Rate<Req />
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%",
                transform: "translateY(-50%)",
                color: colors.textSecondary,
                fontSize: 15, fontWeight: 600,
                pointerEvents: "none", zIndex: 1,
              }}>$</span>
              <input
                type="number" step="0.01"
                value={draft.hourly_rate || ""}
                onChange={(e) => set("hourly_rate", e.target.value)}
                placeholder="0.00"
                style={{
                  width: "100%", padding: "10px 14px 10px 28px",
                  fontSize: 15, fontFamily: typography.fontFamily,
                  color: colors.textPrimary, background: colors.bgCard,
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: 8, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        )}

        {(draft.pay_type === "salary") && (
          <div style={{
            display: "grid", gridTemplateColumns: "1.4fr 1fr",
            gap: 14, maxWidth: 420,
          }}>
            <Select label={<>Pay frequency<Req /></>} value={draft.pay_frequency || "per_year"} onChange={(e) => set("pay_frequency", e.target.value)} options={[
              { value: "per_year", label: "per year" },
              { value: "per_month", label: "per month" },
              { value: "per_pay_period", label: "per pay period" },
            ]} />
            <div>
              <label style={{
                display: "block", ...typography.bodySm, fontWeight: 500,
                color: colors.textPrimary, marginBottom: 6,
              }}>
                Salary<Req />
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%",
                  transform: "translateY(-50%)",
                  color: colors.textSecondary,
                  fontSize: 15, fontWeight: 600,
                  pointerEvents: "none", zIndex: 1,
                }}>$</span>
                <input
                  type="number" step="100"
                  value={draft.salary_amount || ""}
                  onChange={(e) => set("salary_amount", e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: "100%", padding: "10px 14px 10px 28px",
                    fontSize: 15, fontFamily: typography.fontFamily,
                    color: colors.textPrimary, background: colors.bgCard,
                    border: `1px solid ${colors.borderDefault}`,
                    borderRadius: 8, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {((draft.pay_type || "hourly") !== "commission") && (
          <div style={{ height: 1, background: colors.borderDefault, margin: "24px 0" }} />
        )}

        {/* 3. Account mapping */}
        <div>
          <Select label="Account mapping" value={draft.account_mapping || "payroll_expenses_wages"} onChange={(e) => set("account_mapping", e.target.value)} options={[
            { value: "payroll_expenses_wages", label: "Payroll Expenses:Wages" },
            { value: "payroll_expenses_salaries", label: "Payroll Expenses:Salaries" },
            { value: "payroll_expenses_bonuses", label: "Payroll Expenses:Bonuses" },
            { value: "payroll_expenses_commission", label: "Payroll Expenses:Commission" },
          ]} />
          <div style={{
            fontSize: 13, color: colors.textSecondary,
            marginTop: 6, lineHeight: 1.5,
          }}>
            Used to categorize and map your payroll transactions. To edit, see Accounting under{" "}
            <button
              type="button"
              onClick={() => navigate("/payroll")}
              style={{
                background: "none", border: "none", padding: 0,
                color: colors.brandPrimary, cursor: "pointer",
                fontFamily: typography.fontFamily, fontSize: 13,
                textDecoration: "underline",
              }}
            >Payroll settings</button>.
          </div>
        </div>

        <div style={{ height: 1, background: colors.borderDefault, margin: "24px 0" }} />

        {/* 4. Default working hours */}
        <h3 style={{
          fontSize: 18, fontWeight: 700, color: colors.textPrimary,
          margin: "0 0 6px 0", letterSpacing: "-0.01em",
        }}>
          Default working hours
        </h3>
        <p style={{
          fontSize: 13.5, color: colors.textSecondary,
          lineHeight: 1.55, margin: "0 0 16px 0",
        }}>
          Used to calculate your employee&rsquo;s time off. You can always change this when you run payroll.
        </p>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 16, maxWidth: 360,
        }}>
          <Input
            label="Hours per day"
            type="number" step="0.5"
            value={draft.hours_per_day !== undefined && draft.hours_per_day !== null && draft.hours_per_day !== "" ? draft.hours_per_day : 8}
            onChange={(e) => set("hours_per_day", e.target.value)}
          />
          <Input
            label="Days per week"
            type="number" step="0.5"
            value={draft.days_per_week !== undefined && draft.days_per_week !== null && draft.days_per_week !== "" ? draft.days_per_week : 5}
            onChange={(e) => set("days_per_week", e.target.value)}
          />
        </div>

        <div style={{ height: 1, background: colors.borderDefault, margin: "24px 0" }} />

        {/* 5. Effective on */}
        <h3 style={{
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 18, fontWeight: 700, color: colors.textPrimary,
          margin: "0 0 6px 0", letterSpacing: "-0.01em",
        }}>
          <CalIcon size={18} color={colors.textPrimary} />
          Effective on
        </h3>
        <p style={{
          fontSize: 13.5, color: colors.textSecondary,
          lineHeight: 1.55, margin: "0 0 16px 0",
        }}>
          When should this change start?
        </p>
        <Select
          label="Effective pay period"
          value={draft.effective_option || "immediately"}
          onChange={(e) => set("effective_option", e.target.value)}
          options={[
            { value: "immediately", label: "Immediately" },
            { value: "specific_date", label: "Specific date" },
          ]}
        />
        {draft.effective_option === "specific_date" && (
          <Input
            label={<>Date<Req /></>}
            type="date"
            value={draft.effective_date || ""}
            onChange={(e) => set("effective_date", e.target.value)}
          />
        )}

        <div style={{
          display: "flex", gap: 12, padding: 14, marginTop: 12,
          background: colors.brandSoft,
          border: `1px solid ${colors.brandPrimary}30`,
          borderRadius: 10,
        }}>
          <Info size={20} color={colors.brandPrimary} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13.5, color: colors.textSecondary, lineHeight: 1.55 }}>
            The change applies to all payrolls processed from now on, even if dated in the past.
          </div>
        </div>

      </EditDrawer>

      {/* 6. Additional pay types drawer */}
      <EditDrawer open={editing === "additional_pay"} onClose={closeEditor} title="Edit additional pay types" onSave={save} saving={saving} saveError={saveError}>
        <div style={{ ...typography.bodySm, color: colors.textSecondary, marginBottom: spacing[2] }}>
          Select which additional pay types apply to this employee.
        </div>
        {ADDITIONAL_PAY_OPTIONS.map((option) => {
          const isChecked = (draft.additional_pay_types || []).includes(option.id);
          return (
            <div key={option.id} style={{
              display: "flex", alignItems: "center", gap: spacing[3],
              padding: `${spacing[2]}px 0`,
              borderBottom: `1px solid ${colors.borderSubtle}`,
            }}>
              <Checkbox checked={isChecked} onChange={() => toggleAdditionalPay(option.id)} />
              <div style={{ ...typography.body, color: colors.textPrimary }}>{option.label}</div>
            </div>
          );
        })}
      </EditDrawer>

      {/* 7. Time off drawer - matches legacy boxes */}
      <EditDrawer open={editing === "time_off"} onClose={closeEditor} title="Edit time off" onSave={save} saving={saving} saveError={saveError}>
        <h2 style={drawerH1Style}>Manage time off policies</h2>

        <div>
          <Select
            label="Vacation policy"
            value={draft.vacation_policy || ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "add_new") {
                alert("Custom policies are coming soon. Pick one of the standard options for now.");
                return;
              }
              set("vacation_policy", v);
            }}
            options={VACATION_OPTIONS}
          />
          <div style={{
            fontSize: 13, color: colors.textSecondary,
            marginTop: 6, lineHeight: 1.5,
          }}>
            We recommend the <strong style={{ color: colors.textPrimary }}>Pay out each pay period</strong> option for part-time, hourly, and commissioned employees.
          </div>
        </div>

        <Select
          label="Sick pay"
          value={draft.sick_pay_policy || draft.sick_pay || "no_policy"}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "add_new") {
              alert("Custom policies are coming soon. Pick one of the standard options for now.");
              return;
            }
            set("sick_pay_policy", v);
          }}
          options={SICK_PAY_OPTIONS}
        />

        <Select
          label="Unpaid time off"
          value={draft.unpaid_time_off_policy || draft.unpaid_time_off || "no_policy"}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "add_new") {
              alert("Custom policies are coming soon. Pick one of the standard options for now.");
              return;
            }
            set("unpaid_time_off_policy", v);
          }}
          options={UNPAID_TIME_OFF_OPTIONS}
        />
      </EditDrawer>

      {/* 8. Tax withholdings drawer */}
      <EditDrawer open={editing === "tax"} onClose={closeEditor} title="Edit tax withholdings" onSave={save} saving={saving} saveError={saveError}>
        <h2 style={drawerH1Style}>
          What are {employee.first_name || "this employee"}&rsquo;s withholdings?
        </h2>

        {/* Federal withholding */}
        <div style={{ borderTop: `1px solid ${colors.borderDefault}` }}>
          <button
            type="button"
            onClick={() => toggleTaxSection("federal")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", background: "none", border: "none", cursor: "pointer",
              padding: `${spacing[4]}px 0`,
              fontFamily: typography.fontFamily,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.01em" }}>
              Federal withholding
            </span>
            <ChevronDown size={20} style={{
              transform: taxSections.federal ? "rotate(0)" : "rotate(-90deg)",
              transition: "transform 150ms ease",
              color: colors.textSecondary,
            }} />
          </button>
          {taxSections.federal && (
            <div style={{ paddingBottom: spacing[5] }}>
              <p style={{
                fontSize: 13, color: colors.textSecondary,
                lineHeight: 1.55, margin: `0 0 ${spacing[4]}px 0`,
              }}>
                The information for this page is on {employee.first_name || "the employee"}&rsquo;s TD-1 form.{" "}
                <a href="https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/td1.html" target="_blank" rel="noopener noreferrer" style={{ color: colors.brandPrimary, textDecoration: "underline" }}>
                  Need a blank TD-1 form?
                </a>
                {" "}If the TD-1 form is not available, the federal TD1 amount is set to the basic personal claim amount for now and can be updated later.
              </p>

              <div style={{ marginBottom: spacing[4] }}>
                <label style={{
                  display: "block", ...typography.bodySm, fontWeight: 500,
                  color: colors.textPrimary, marginBottom: 6,
                }}>
                  Federal TD1 amount (total claim amount)
                </label>
                <div style={{ position: "relative", maxWidth: 240 }}>
                  <span style={{
                    position: "absolute", left: 14, top: "50%",
                    transform: "translateY(-50%)",
                    color: colors.textSecondary,
                    fontSize: 15, fontWeight: 600,
                    pointerEvents: "none", zIndex: 1,
                  }}>$</span>
                  <input
                    type="number" step="0.01"
                    value={draft.federal_td1_amount !== undefined && draft.federal_td1_amount !== null && draft.federal_td1_amount !== "" ? draft.federal_td1_amount : (draft.federal_claim_amount || draft.federal_credit_amount || "")}
                    onChange={(e) => set("federal_td1_amount", e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: "100%", padding: "10px 14px 10px 28px",
                      fontSize: 15, fontFamily: typography.fontFamily,
                      color: colors.textPrimary, background: colors.bgCard,
                      border: `1px solid ${colors.borderDefault}`,
                      borderRadius: 8, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: "block", ...typography.bodySm, fontWeight: 500,
                  color: colors.textPrimary, marginBottom: 6,
                }}>
                  Additional income tax amount you want deducted from each paycheque
                </label>
                <div style={{ position: "relative", maxWidth: 240 }}>
                  <span style={{
                    position: "absolute", left: 14, top: "50%",
                    transform: "translateY(-50%)",
                    color: colors.textSecondary,
                    fontSize: 15, fontWeight: 600,
                    pointerEvents: "none", zIndex: 1,
                  }}>$</span>
                  <input
                    type="number" step="0.01"
                    value={draft.additional_federal_tax !== undefined && draft.additional_federal_tax !== null && draft.additional_federal_tax !== "" ? draft.additional_federal_tax : 0}
                    onChange={(e) => set("additional_federal_tax", e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: "100%", padding: "10px 14px 10px 28px",
                      fontSize: 15, fontFamily: typography.fontFamily,
                      color: colors.textPrimary, background: colors.bgCard,
                      border: `1px solid ${colors.borderDefault}`,
                      borderRadius: 8, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Provincial withholding */}
        <div style={{ borderTop: `1px solid ${colors.borderDefault}` }}>
          <button
            type="button"
            onClick={() => toggleTaxSection("provincial")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", background: "none", border: "none", cursor: "pointer",
              padding: `${spacing[4]}px 0`,
              fontFamily: typography.fontFamily,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.01em" }}>
              Provincial withholding
            </span>
            <ChevronDown size={20} style={{
              transform: taxSections.provincial ? "rotate(0)" : "rotate(-90deg)",
              transition: "transform 150ms ease",
              color: colors.textSecondary,
            }} />
          </button>
          {taxSections.provincial && (
            <div style={{ paddingBottom: spacing[5] }}>
              <p style={{
                fontSize: 13, color: colors.textSecondary,
                lineHeight: 1.55, margin: `0 0 ${spacing[4]}px 0`,
              }}>
                We use the basic personal amount for the province {employee.first_name || "the employee"} currently works in.
              </p>

              <div style={{ marginBottom: spacing[4] }}>
                <label style={{
                  display: "block", ...typography.bodySm, fontWeight: 500,
                  color: colors.textPrimary, marginBottom: 6,
                }}>
                  Province
                </label>
                <div style={{
                  padding: "10px 14px",
                  background: colors.bgCardActive,
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: colors.textPrimary,
                  maxWidth: 120,
                }}>
                  {(employee.province_or_state || employee.province_of_employment || employee.province || "AB").toUpperCase()}
                </div>
              </div>

              <div>
                <label style={{
                  display: "block", ...typography.bodySm, fontWeight: 500,
                  color: colors.textPrimary, marginBottom: 6,
                }}>
                  Provincial claim amount
                </label>
                <div style={{ position: "relative", maxWidth: 240 }}>
                  <span style={{
                    position: "absolute", left: 14, top: "50%",
                    transform: "translateY(-50%)",
                    color: colors.textSecondary,
                    fontSize: 15, fontWeight: 600,
                    pointerEvents: "none", zIndex: 1,
                  }}>$</span>
                  <input
                    type="number" step="0.01"
                    value={draft.provincial_claim_amount !== undefined && draft.provincial_claim_amount !== null && draft.provincial_claim_amount !== "" ? draft.provincial_claim_amount : (draft.provincial_credit_amount || "")}
                    onChange={(e) => set("provincial_claim_amount", e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: "100%", padding: "10px 14px 10px 28px",
                      fontSize: 15, fontFamily: typography.fontFamily,
                      color: colors.textPrimary, background: colors.bgCard,
                      border: `1px solid ${colors.borderDefault}`,
                      borderRadius: 8, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tax exemptions */}
        <div style={{ borderTop: `1px solid ${colors.borderDefault}`, borderBottom: `1px solid ${colors.borderDefault}` }}>
          <button
            type="button"
            onClick={() => toggleTaxSection("exemptions")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", background: "none", border: "none", cursor: "pointer",
              padding: `${spacing[4]}px 0`,
              fontFamily: typography.fontFamily,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.01em" }}>
              Tax exemptions
            </span>
            <ChevronDown size={20} style={{
              transform: taxSections.exemptions ? "rotate(0)" : "rotate(-90deg)",
              transition: "transform 150ms ease",
              color: colors.textSecondary,
            }} />
          </button>
          {taxSections.exemptions && (
            <div style={{ paddingBottom: spacing[5] }}>
              <p style={{
                fontSize: 13, color: colors.textSecondary,
                lineHeight: 1.55, margin: `0 0 ${spacing[4]}px 0`,
              }}>
                Tax exemptions are not common. Certain government criteria must be met. Contact a tax expert or the applicable tax agency if unsure.{" "}
                <a href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions.html" target="_blank" rel="noopener noreferrer" style={{ color: colors.brandPrimary, textDecoration: "underline" }}>
                  Get more info on tax exemptions
                </a>
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                {[
                  { id: "cpp_exempt", label: "Canada Pension Plan (CPP)" },
                  { id: "ei_exempt", label: "Employment Insurance (EI)" },
                  { id: "federal_income_tax_exempt", label: "Federal Income Tax" },
                ].map((opt) => (
                  <div key={opt.id} style={{
                    display: "flex", alignItems: "center", gap: spacing[3],
                    padding: `${spacing[2]}px 0`,
                  }}>
                    <Checkbox
                      checked={draft[opt.id] === true}
                      onChange={() => set(opt.id, !draft[opt.id])}
                    />
                    <div style={{ ...typography.body, color: colors.textPrimary }}>{opt.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </EditDrawer>

      {/* 10. Deductions and contributions drawer - legacy wording */}
      <EditDrawer open={editing === "deductions"} onClose={closeEditor} title="Edit deductions and contributions" onSave={save} saving={saving} saveError={saveError}>
        <Input label="T4 dental benefits codes" value={draft.t4_dental_benefits_codes || ""} onChange={(e) => set("t4_dental_benefits_codes", e.target.value)} />

        <SubHeading>Deductions and contributions</SubHeading>
        {(draft.deductions || []).length === 0 && (
          <div style={{ ...typography.bodySm, color: colors.textSecondary, padding: `${spacing[3]}px 0` }}>
            No deductions or contributions yet. Click below to add one.
          </div>
        )}
        {(draft.deductions || []).map((d, idx) => (
          <div key={idx} style={{
            padding: spacing[4],
            border: `1px solid ${colors.borderDefault}`,
            borderRadius: radius.md,
            display: "flex", flexDirection: "column", gap: spacing[3],
            position: "relative",
          }}>
            <button
              onClick={() => removeDeduction(idx)}
              title="Remove"
              style={{
                position: "absolute", top: spacing[2], right: spacing[2],
                background: "none", border: "none", cursor: "pointer",
                padding: 4, color: colors.textSecondary,
              }}
            >
              <Trash2 size={14} />
            </button>
            <Select
              label={<>Deduction/contribution type<Req /></>}
              value={d.type || ""}
              onChange={(e) => setDeductionField(idx, "type", e.target.value)}
              options={DEDUCTION_TYPE_OPTIONS}
            />
            <Input
              label="Effective pay period"
              value={d.effective_pay_period || ""}
              onChange={(e) => setDeductionField(idx, "effective_pay_period", e.target.value)}
            />
            <Input
              label={<>Date<Req /></>}
              type="date"
              value={d.date || ""}
              onChange={(e) => setDeductionField(idx, "date", e.target.value)}
            />
          </div>
        ))}
        <Button variant="secondary" onClick={addDeduction} iconLeft={<PlusCircle size={14} />}>
          Add deduction/contribution
        </Button>
      </EditDrawer>
    </div>
  );
}
