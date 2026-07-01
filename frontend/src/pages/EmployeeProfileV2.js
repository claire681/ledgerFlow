import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  ChevronLeft, ChevronDown, Check, User, Phone, Briefcase, CreditCard,
  DollarSign, PlusCircle, Calendar, Receipt, MinusCircle
} from "lucide-react";
import { getCountryConfig, validateField } from "../utils/countryPayroll";

const FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const C = {
  ink: "#12262B", teal: "#15A08C", tealDark: "#0F8474", tealInk: "#0E8A78", tealSoft: "#E3F4F0",
  text: "#1B2533", muted: "#66748B", faint: "#94A0B2",
  line: "#E7EAF0", lineSoft: "#F1F3F7", surface: "#F4F6F8",
  amber: "#B7791F", amberSoft: "#FBF1DD", green: "#1F9D6B", greenSoft: "#E4F5EC",
  err: "#DC2626",
};

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token");
  return t ? { Authorization: "Bearer " + t } : {};
}

function isFilled(v) { return v !== undefined && v !== null && String(v).trim() !== ""; }

function taxIntroFor(country) {
  const c = country.code;
  if (c === "CA") return "Enter the employee's tax setup once (from their TD1). Novala calculates CRA federal tax, provincial tax, CPP, EI, employer contributions, and net pay automatically at every pay run.";
  if (c === "US") return "Enter the employee's tax setup once (from their W-4). Novala calculates federal income tax, FICA (Social Security and Medicare), state tax, employer contributions, and net pay automatically at every pay run.";
  if (c === "GB") return "Enter the employee's tax setup once (from their P45, P46, or starter checklist). Novala calculates PAYE income tax, employee and employer National Insurance, student loan deductions, and net pay automatically at every pay run.";
  if (c === "AU") return "Enter the employee's tax setup once (from their TFN declaration). Novala calculates PAYG withholding, Medicare levy, HELP/HECS, employer superannuation, and net pay automatically at every pay run.";
  return "Enter the employee's tax setup once. Novala calculates payroll taxes and net pay automatically at every pay run.";
}

function buildSections(country) {
  return [
    { id: "personal", title: "Personal info", icon: User, required: true, fields: [
      { k: "name", l: "Name", t: "text", req: true },
      { k: "preferred", l: "Preferred first name", t: "text" },
      { k: "email", l: "Email", t: "email" },
      { k: "mobilePhone", l: "Mobile phone number", t: "tel" },
      { k: "street", l: "Home address", t: "text", full: true },
      { k: "city", l: "City", t: "text" },
      { k: "province", l: country.regionLabel, t: "select", opts: country.regions },
      { k: "postal", l: "Postal code", t: "text" },
      { k: "birth", l: "Birth date", t: "date", req: true },
      { k: "gender", l: "Gender", t: "select", opts: ["Female","Male","Non-binary","Prefer not to say"] },
      { k: "taxId", l: country.taxId.label, t: "text", req: true,
        placeholder: country.taxId.placeholder,
        validate: country.taxId.validate, errorMsg: country.taxId.errorMsg },
    ]},
    { id: "emergency", title: "Emergency contact", icon: Phone, fields: [
      { k: "ecName", l: "Contact name", t: "text" },
      { k: "ecRel", l: "Relationship", t: "select", opts: ["Spouse","Parent","Sibling","Child","Friend","Other"] },
      { k: "ecPhone", l: "Phone number", t: "tel" },
      { k: "ecEmail", l: "Email", t: "email" },
    ]},
    { id: "employment", title: "Employment details", icon: Briefcase, required: true, fields: [
      { k: "empId", l: "Employee ID", t: "text" },
      { k: "jobTitle", l: "Job title", t: "text" },
      { k: "empType", l: "Employment type", t: "select", req: true, opts: ["Full-time","Part-time","Casual"] },
      { k: "startDate", l: "Start date", t: "date", req: true },
      { k: "workLocationId", l: "Work location", t: "wloc-select" },
    { k: "department", l: "Department", t: "text" },
      { k: "manager", l: "Manager", t: "text" },
    ]},
    { id: "payment", title: "Payment method", icon: CreditCard, required: true, fields: [
      { k: "method", l: "Payment method", t: "select", req: true, opts: ["Direct deposit","Cheque"] },
      { k: "institution", l: "Financial institution", t: "text", showIf: function(v) { return v.method === "Direct deposit"; } },
      { k: "transit", l: "Transit number", t: "text", showIf: function(v) { return v.method === "Direct deposit"; } },
      { k: "account", l: "Account number", t: "text", showIf: function(v) { return v.method === "Direct deposit"; } },
    ]},
    { id: "compensation", title: "Compensation", icon: DollarSign, required: true, isCustomSection: true, fields: [] },
    { id: "timeoff", title: "Time off", icon: Calendar, fields: [
      { k: "vacationPolicy", l: "Vacation policy", t: "select", opts: ["Accrued by hours worked","Fixed annual","Unpaid"] },
      { k: "accrualRate", l: "Accrual rate", t: "text" },
      { k: "balanceHours", l: "Current balance (hours)", t: "number" },
    ]},
    { id: "tax", title: "Tax setup (" + country.taxForm + ")", icon: Receipt, required: true, fields: country.taxFields, intro: taxIntroFor(country) },
  ];
}

function sectionStatus(section, values) {
  const reqKeys = section.fields.filter(function(f) { return f.req; }).map(function(f) { return f.k; });
  const anyFilled = section.fields.some(function(f) { return isFilled(values[f.k]); });
  if (reqKeys.length > 0) {
    const allReq = reqKeys.every(function(k) { return isFilled(values[k]); });
    if (allReq) return "done";
    return anyFilled ? "edit" : "start";
  }
  return anyFilled ? "done" : "start";
}

function formatDateForInput(d) {
  if (!d) return "";
  if (typeof d === "string" && d.length >= 10) return d.slice(0, 10);
  return d;
}

function employeeToValues(emp, country) {
  if (!emp) return {};
  const ti = emp.tax_info || {};
  const ded = Array.isArray(emp.deductions_list) && emp.deductions_list[0] ? emp.deductions_list[0] : {};
  const empTypeMap = { full_time: "Full-time", part_time: "Part-time", casual: "Casual" };
  const payScheduleMap = { weekly: "Weekly", bi_weekly: "Bi-weekly", semi_monthly: "Semi-monthly", monthly: "Monthly" };
  const rate = emp.pay_type === "hourly" ? emp.hourly_rate : emp.salary_amount;
  const result = {
    name: [emp.first_name, emp.last_name].filter(Boolean).join(" "),
    preferred: emp.preferred_name || "",
    email: emp.personal_email || "",
    mobilePhone: emp.phone || "",
    street: emp.address_line1 || "",
    city: emp.city || "",
    province: emp.province_or_state || "",
    postal: emp.postal_or_zip || "",
    birth: formatDateForInput(emp.date_of_birth),
    gender: emp.gender || "",
    taxId: emp.sin_or_ssn || "",
    ecName: emp.emergency_contact_name || "",
    ecRel: emp.emergency_contact_relationship || "",
    ecPhone: emp.emergency_contact_phone || "",
    ecEmail: emp.emergency_contact_email || "",
    empId: emp.employee_number || "",
    jobTitle: emp.position_title || "",
    empType: empTypeMap[emp.employment_type] || emp.employment_type || "",
    startDate: formatDateForInput(emp.start_date),
    workLocationId: emp.work_location_id || "",
    department: emp.department || "",
    manager: emp.manager_name || "",
    method: emp.account_type === "direct_deposit" ? "Direct deposit" : (emp.account_type === "cheque" ? "Cheque" : ""),
    institution: emp.bank_name || "",
    transit: emp.transit_number || "",
    account: emp.account_number_encrypted || "",
    payType: emp.pay_type === "hourly" ? "Hourly" : (emp.pay_type === "salary" ? "Salary" : ""),
    rate: rate != null ? String(rate) : "",
    standardHours: emp.hours_per_week != null ? String(emp.hours_per_week) : "",
    paySchedule: payScheduleMap[emp.pay_schedule] || emp.pay_schedule || "",
    overtime: ti.overtime || "",
    bonus: ti.bonus || "",
    vacationPay: ti.vacation_pay_enabled || "",
    vacationPolicy: emp.vacation_policy || "",
    accrualRate: ti.accrual_rate || "",
    balanceHours: ti.balance_hours != null ? String(ti.balance_hours) : "",
    deductionName: ded.name || "",
    deductionAmount: ded.amount != null ? String(ded.amount) : "",
  };
  country.taxFields.forEach(function(f) {
    result[f.k] = ti[f.k] != null ? String(ti[f.k]) : "";
  });
  return result;
}

function valuesToPatch(sectionId, v, currentEmp, country) {
  const ti = (currentEmp && currentEmp.tax_info) || {};
  if (sectionId === "personal") {
    const parts = (v.name || "").trim().split(/\s+/);
    return {
      first_name: parts[0] || "",
      last_name: parts.slice(1).join(" ") || "",
      preferred_name: v.preferred || null,
      personal_email: v.email || "",
      phone: v.mobilePhone || null,
      address_line1: v.street || null,
      city: v.city || null,
      province_or_state: v.province || null,
      postal_or_zip: v.postal || null,
      date_of_birth: v.birth || null,
      gender: v.gender || null,
      sin_or_ssn: v.taxId || null,
    };
  }
  if (sectionId === "emergency") {
    return {
      emergency_contact_name: v.ecName || null,
      emergency_contact_relationship: v.ecRel || null,
      emergency_contact_phone: v.ecPhone || null,
      emergency_contact_email: v.ecEmail || null,
    };
  }
  if (sectionId === "employment") {
    const empTypeMap = { "Full-time": "full_time", "Part-time": "part_time", "Casual": "casual" };
    return {
      employee_number: v.empId || null,
      position_title: v.jobTitle || null,
      employment_type: empTypeMap[v.empType] || (v.empType || "full_time").toLowerCase().replace(/[- ]/g, "_"),
      start_date: v.startDate || null,
      work_location_id: v.workLocationId || null,
    department: v.department || null,
      manager_name: v.manager || null,
    };
  }
  if (sectionId === "payment") {
    const dd = v.method === "Direct deposit";
    return {
      bank_name: dd ? (v.institution || null) : null,
      transit_number: dd ? (v.transit || null) : null,
      account_number_encrypted: dd ? (v.account || null) : null,
      account_type: dd ? "direct_deposit" : "cheque",
    };
  }
  if (sectionId === "basepay") {
    const isHourly = v.payType === "Hourly";
    const rateNum = v.rate ? Number(v.rate) : null;
    const psMap = { "Weekly": "weekly", "Bi-weekly": "bi_weekly", "Semi-monthly": "semi_monthly", "Monthly": "monthly" };
    return {
      pay_type: isHourly ? "hourly" : "salary",
      hourly_rate: isHourly ? rateNum : null,
      salary_amount: isHourly ? null : rateNum,
      hours_per_week: v.standardHours ? Number(v.standardHours) : null,
      pay_schedule: psMap[v.paySchedule] || (v.paySchedule || "").toLowerCase().replace(/[- ]/g, "_"),
    };
  }
  if (sectionId === "addpay") {
    return { tax_info: Object.assign({}, ti, {
      overtime: v.overtime || null,
      bonus: v.bonus || null,
      vacation_pay_enabled: v.vacationPay || null,
    })};
  }
  if (sectionId === "timeoff") {
    return {
      vacation_policy: v.vacationPolicy || null,
      tax_info: Object.assign({}, ti, {
        accrual_rate: v.accrualRate || null,
        balance_hours: v.balanceHours ? Number(v.balanceHours) : null,
      })
    };
  }
  if (sectionId === "tax") {
    const newTi = Object.assign({}, ti);
    country.taxFields.forEach(function(f) {
      if (f.t === "number" || f.t === "money") {
        newTi[f.k] = isFilled(v[f.k]) ? Number(v[f.k]) : null;
      } else {
        newTi[f.k] = v[f.k] || null;
      }
    });
    return { tax_info: newTi };
  }
  if (sectionId === "deductions") {
    return {
      deductions_list: v.deductionName ? [{
        name: v.deductionName,
        amount: v.deductionAmount ? Number(v.deductionAmount) : 0,
      }] : []
    };
  }
  return {};
}

function initialsFrom(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  const f = parts[0] && parts[0][0] || "";
  const l = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (f + l).toUpperCase();
}

function formatMoney(v) {
  if (!isFilled(v)) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatViewValue(field, value) {
  if (field.t === "wloc-select") {
    if (!value) return "";
    const locs = field.workLocations || [];
    if (locs.length === 0) return "Loading location...";
    const found = locs.find(function(l) { return String(l.id) === String(value); });
    return found ? (found.name || "(Unnamed)") : "";
  }
  if (!isFilled(value)) return null;
  if (field.t === "money") return formatMoney(value);
  return String(value);
}

export default function EmployeeProfileV2() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [values, setValues] = useState({});
  const [draft, setDraft] = useState({});
  const [workLocations, setWorkLocations] = useState([]);
  useEffect(function() {
    fetch(API_URL + "/api/v1/work-locations", { headers: authHeaders() })
      .then(function(r) { return r.ok ? r.json() : []; })
      .then(function(data) { setWorkLocations(data || []); })
      .catch(function() {});
  }, []);
  const [openId, setOpenId] = useState("personal");
  const [searchParams] = useSearchParams();
  useEffect(function() {
    const section = searchParams.get("section");
    if (section) setOpenId(section);
  }, [searchParams]);
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [companyCountry, setCompanyCountry] = useState("CA");
  const [companyProvince, setCompanyProvince] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const country = useMemo(function() { return getCountryConfig(companyCountry); }, [companyCountry]);
  const sections = useMemo(function() { return buildSections(country); }, [country]);

  useEffect(function() {
    if (!id) return;
    setLoading(true);
    fetch(API_URL + "/api/v1/payroll/employees/" + id, { headers: authHeaders() })
      .then(function(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(data) {
        const emp = data.employee || data;
        setEmployee(emp);
        setLoading(false);
      })
      .catch(function(err) { setLoadError(err.message); setLoading(false); });
  }, [id]);

  useEffect(function() {
    fetch(API_URL + "/api/v1/company/profile", { headers: authHeaders() })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (!data) return;
        const co = data.company || data;
        const country = co.country || co.address_country;
        const province = co.province_state || co.address_province;
        if (country) setCompanyCountry(country);
        if (province) setCompanyProvince(province);
      })
      .catch(function() {});
  }, []);

  useEffect(function() {
    if (employee) setValues(employeeToValues(employee, country));
  }, [employee, country]);

  useEffect(function() {
    if (!toast) return;
    const t = setTimeout(function() { setToast(null); }, 2800);
    return function() { clearTimeout(t); };
  }, [toast]);

  const startEdit = function(sid) {
    const section = sections.find(function(s) { return s.id === sid; });
    const seeded = Object.assign({}, values);
    if (section) {
      section.fields.forEach(function(f) {
        if (!isFilled(seeded[f.k]) && f.default != null) seeded[f.k] = f.default;
        if (!isFilled(seeded[f.k]) && (f.k === "provinceEmp" || f.k === "province") && companyProvince) {
          seeded[f.k] = companyProvince;
        }
      });
    }
    setDraft(seeded);
    setFieldErrors({});
    setEditingId(sid);
    setOpenId(sid);
  };
  const cancelEdit = function() { setEditingId(null); setDraft({}); setFieldErrors({}); };
  const setOpen = function(sid) {
    if (editingId) return;
    setOpenId(function(cur) { return cur === sid ? null : sid; });
  };
  const onFieldChange = function(k, val) {
    setDraft(function(d) { return Object.assign({}, d, { [k]: val }); });
    if (fieldErrors[k]) setFieldErrors(function(fe) { return Object.assign({}, fe, { [k]: null }); });
  };

  const saveSection = async function(sid) {
    const section = sections.find(function(s) { return s.id === sid; });
    const visibleFields = section.fields.filter(function(f) { return !f.showIf || f.showIf(draft); });
    const errs = {};
    visibleFields.forEach(function(f) {
      const err = validateField(f, draft[f.k]);
      if (err) errs[f.k] = err;
    });
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setToast({ kind: "err", msg: "Please fix the errors below" });
      return;
    }

    setSavingId(sid);
    try {
      const patch = valuesToPatch(sid, draft, employee, country);
      const res = await fetch(API_URL + "/api/v1/payroll/employees/" + id, {
        method: "PATCH",
        headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error("Save failed (" + res.status + "): " + txt.slice(0, 200));
      }
      const updated = await res.json();
      const emp = updated.employee || updated;
      setEmployee(emp);
      setEditingId(null);
      setDraft({});
      setFieldErrors({});
      setToast({ kind: "ok", msg: "Saved " + section.title.toLowerCase() });
    } catch (err) {
      setToast({ kind: "err", msg: err.message });
    } finally {
      setSavingId(null);
    }
  };

  const requiredSections = sections.filter(function(s) { return s.required; });
  const allRequiredDone = useMemo(function() {
    return requiredSections.every(function(s) { return sectionStatus(s, values) === "done"; });
  }, [values, requiredSections]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: FONT, color: C.muted, textAlign: "center" }}>Loading employee...</div>;
  }
  if (loadError) {
    return (
      <div style={{ padding: 40, fontFamily: FONT }}>
        <div style={{ background: "#FEE2E2", border: "1px solid #F87171", color: "#991B1B", padding: 16, borderRadius: 10 }}>
          Could not load employee: {loadError}
        </div>
        <button onClick={function() { navigate("/payroll/employees"); }} style={{ marginTop: 16, fontFamily: FONT, fontWeight: 600, fontSize: 14, color: C.tealInk, background: "none", border: 0, cursor: "pointer" }}>
          Back to Employees
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: FONT, color: C.text, padding: "26px 40px 90px", maxWidth: 1500, margin: "0 auto" }}>
      <div onClick={function() { navigate("/payroll/employees"); }} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 600, color: C.tealInk, cursor: "pointer", marginBottom: 18 }}>
        <ChevronLeft size={16} /> Employees
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.tealSoft, color: C.tealInk, display: "grid", placeItems: "center", fontWeight: 600, fontSize: 22, flex: "0 0 64px" }}>
          {initialsFrom(values.name)}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 25, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em" }}>{values.name || "Unnamed employee"}</h1>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 20, background: allRequiredDone ? C.greenSoft : C.amberSoft, color: allRequiredDone ? C.green : C.amber }}>
              {allRequiredDone ? <Check size={13} /> : <DotIcon size={13} />}
              {allRequiredDone ? "Active" : "Draft"}
            </span>
          </div>
          <div style={{ fontSize: 13.5, color: C.muted, marginTop: 2 }}>Employee, {country.name}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "262px 1fr", gap: 26, alignItems: "start" }}>
        <Rail sections={sections} values={values} openId={openId} onPick={setOpen} editingId={editingId} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sections.map(function(s) {
            return (
              <Section workLocations={workLocations} key={s.id} section={s} values={values} draft={draft} country={country} employeeId={id}
                isOpen={openId === s.id} isEditing={editingId === s.id} isSaving={savingId === s.id}
                disabledByOtherEdit={!!editingId && editingId !== s.id}
                fieldErrors={fieldErrors}
                onToggleOpen={function() { setOpen(s.id); }}
                onEdit={function() { startEdit(s.id); }}
                onCancel={cancelEdit}
                onSave={function() { saveSection(s.id); }}
                onChange={onFieldChange}
              />
            );
          })}
        </div>
      </div>
      {toast && (
        <div style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", background: toast.kind === "err" ? "#7F1D1D" : C.ink, color: "#fff", fontSize: 13, fontWeight: 500, padding: "11px 18px", borderRadius: 10, zIndex: 80, display: "flex", alignItems: "center", gap: 9, boxShadow: "0 8px 24px rgba(16,26,43,0.3)" }}>
          {toast.kind === "ok" ? <Check size={16} color="#7FE3D2" /> : <span style={{ color: "#FCA5A5", fontWeight: 700 }}>!</span>}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

function DotIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}

function Rail({ sections, values, openId, onPick, editingId }) {
  return (
    <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 15, padding: 8, position: "sticky", top: 20, boxShadow: "0 1px 2px rgba(16,26,43,0.04)" }}>
      {sections.map(function(s) {
        const st = sectionStatus(s, values);
        const on = openId === s.id;
        const Icon = s.icon;
        const disabled = !!editingId && editingId !== s.id;
        const dotColor = st === "done" ? C.green : (st === "edit" ? C.teal : C.amber);
        return (
          <button key={s.id} onClick={function() { onPick(s.id); }} disabled={disabled}
            style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", border: 0,
              background: on ? C.tealSoft : "none", fontFamily: FONT, fontSize: 13.5,
              fontWeight: on ? 600 : 500, color: on ? C.tealInk : C.text, padding: "11px 12px",
              borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", textAlign: "left", opacity: disabled ? 0.5 : 1 }}>
            <span style={{ width: 18, height: 18, color: on ? C.tealInk : C.faint, flex: "0 0 18px" }}>
              <Icon size={18} />
            </span>
            <span style={{ flex: 1 }}>{s.title}</span>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor }} />
          </button>
        );
      })}
    </div>
  );
}


function CompensationSectionCard({ section, isOpen, onToggleOpen, employeeId }) {
  const Icon = section.icon;
  const [earnings, setEarnings] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    if (!employeeId) {
      setLoading(false);
      return;
    }
    var headers = Object.assign({ "Content-Type": "application/json" }, authHeaders());
    Promise.all([
      fetch(API_URL + "/api/v1/employee-pay-items/employee/" + employeeId, { headers: headers })
        .then(function(r) { return r.ok ? r.json() : []; }),
      fetch(API_URL + "/api/v1/employee-deduction-items/employee/" + employeeId, { headers: headers })
        .then(function(r) { return r.ok ? r.json() : []; })
    ]).then(function(results) {
      setEarnings(results[0] || []);
      setDeductions(results[1] || []);
      setLoading(false);
    }).catch(function() {
      setLoading(false);
    });
  }, [employeeId]);

  const [drawerMode, setDrawerMode] = useState(null);

  return (
    <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 15, boxShadow: "0 1px 2px rgba(16,26,43,0.04)", overflow: "hidden" }}>
      <div onClick={onToggleOpen}
           style={{ display: "flex", alignItems: "center", gap: 13, padding: "18px 22px", cursor: "pointer" }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: C.tealSoft, color: C.tealInk, display: "grid", placeItems: "center", flex: "0 0 30px" }}>
          <Icon size={17} />
        </span>
        <h3 style={{ flex: 1, fontSize: 16, fontWeight: 700, color: C.ink }}>{section.title}</h3>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: C.amberSoft, color: C.amber }}>
          Not started
        </span>
        <ChevronDown size={18} color={C.muted} style={{ transform: isOpen ? "none" : "rotate(-90deg)", transition: "transform 0.2s" }} />
      </div>
      {isOpen && (
        <div style={{ padding: "20px 22px", borderTop: "1px solid " + C.lineSoft }}>

          {/* EARNINGS sub-section */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Earnings</span>
            <button onClick={function() { setDrawerMode("earning"); }} style={{ background: "#fff", color: C.text, border: "1px solid " + C.line, borderRadius: 6, padding: "6px 11px", fontWeight: 500, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT }}>
              <span style={{ color: C.tealInk, fontSize: 14, lineHeight: 1, fontWeight: 600 }}>+</span>
              Add earning
            </button>
          </div>
          <div style={{ background: "#FCFCFD", border: "1px solid " + C.line, borderRadius: 8, padding: "32px 20px", textAlign: "center", marginBottom: 22 }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>No earnings assigned yet</div>
            <div style={{ fontSize: 11.5, color: C.faint }}>Click "Add earning" to assign a pay type from your catalog</div>
          </div>

          {/* DEDUCTIONS sub-section */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Deductions &amp; contributions</span>
            <button onClick={function() { setDrawerMode("deduction"); }} style={{ background: "#fff", color: C.text, border: "1px solid " + C.line, borderRadius: 6, padding: "6px 11px", fontWeight: 500, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT }}>
              <span style={{ color: C.tealInk, fontSize: 14, lineHeight: 1, fontWeight: 600 }}>+</span>
              Add deduction
            </button>
          </div>
          <div style={{ background: "#FCFCFD", border: "1px solid " + C.line, borderRadius: 8, padding: "32px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>No deductions assigned yet</div>
            <div style={{ fontSize: 11.5, color: C.faint }}>Click "Add deduction" to assign a deduction type</div>
          </div>

        </div>
      )}
      {drawerMode && (
        <CompensationDrawer mode={drawerMode} employeeId={employeeId} onClose={function() { setDrawerMode(null); }} />
      )}
    </div>
  );
}

function CompensationDrawer({ mode, employeeId, onClose }) {
  const isEarning = mode === "earning";
  const title = isEarning ? "Add earning" : "Add deduction";
  const sub = isEarning
    ? "Pick a pay type from your catalog and set the rate"
    : "Pick a deduction type from your catalog and set the amount";

  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(function() {
    var headers = Object.assign({ "Content-Type": "application/json" }, authHeaders());
    var endpoint = isEarning ? "/api/v1/pay-types" : "/api/v1/deduction-types";
    fetch(API_URL + endpoint, { headers: headers })
      .then(function(r) { return r.ok ? r.json() : []; })
      .then(function(data) {
        var items = Array.isArray(data) ? data : (data.items || []);
        var activeOnly = items.filter(function(t) { return t.is_active !== false; });
        setCatalog(activeOnly);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }, [isEarning]);

  function taxSummary(item) {
    if (isEarning) {
      var flags = [];
      if (item.federal_taxable) flags.push("Federal");
      if (item.cpp_contributable) flags.push("CPP");
      if (item.ei_insurable) flags.push("EI");
      if (item.vacationable) flags.push("Vacation");
      return flags.length ? flags.join(", ") : "Non-taxable";
    }
    return null;
  }

  function formatRate(item) {
    var rate = isEarning ? item.default_rate : item.default_amount;
    var unit = item.unit_label || "";
    if (rate == null || rate === "") return "Not set" + (unit ? " " + unit : "");
    var num = Number(rate);
    var formatted = num.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return formatted + (unit ? " " + unit : "");
  }

  return createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(14,26,31,0.35)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}
         onClick={onClose}>
      <div onClick={function(e) { e.stopPropagation(); }}
           style={{ width: 520, height: "100vh", background: "#fff", boxShadow: "-20px 0 40px rgba(14,26,31,0.15)", display: "flex", flexDirection: "column", fontFamily: FONT }}>
        <div style={{ padding: "20px 26px 18px", borderBottom: "1px solid " + C.line, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, letterSpacing: "-0.01em", marginBottom: 2 }}>{title}</div>
            <div style={{ fontSize: 12.5, color: C.muted }}>{sub}</div>
          </div>
          <button onClick={onClose}
                  style={{ background: "none", border: 0, color: C.faint, cursor: "pointer", padding: 6, borderRadius: 6, display: "grid", placeItems: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 26px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 11 }}>
            {isEarning ? "Pay type" : "Deduction type"}
          </div>

          {loading && (
            <div style={{ color: C.muted, fontSize: 13, padding: "20px 0" }}>Loading catalog...</div>
          )}

          {!loading && catalog.length === 0 && (
            <div style={{ background: "#FCFCFD", border: "1px solid " + C.line, borderRadius: 8, padding: "32px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>No {isEarning ? "pay types" : "deduction types"} in your catalog yet</div>
              <div style={{ fontSize: 11.5, color: C.faint }}>Add some in Payroll settings first</div>
            </div>
          )}

          {!loading && catalog.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 8, overflow: "hidden" }}>
              {catalog.map(function(item, idx) {
                var isSelected = selectedId === item.id;
                var lastIdx = catalog.length - 1;
                var rowStyle = {
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "13px 16px",
                  borderBottom: idx < lastIdx ? "1px solid " + C.lineSoft : "none",
                  cursor: "pointer",
                  background: isSelected ? C.tealSoft : "#fff",
                  transition: "background 0.1s"
                };
                var dotStyle = {
                  width: 16, height: 16, borderRadius: "50%",
                  border: "2px solid " + (isSelected ? C.teal : C.line),
                  flex: "0 0 16px",
                  display: "grid",
                  placeItems: "center",
                  background: "#fff"
                };
                return (
                  <div key={item.id} onClick={function() { setSelectedId(item.id); }} style={rowStyle}>
                    <div style={dotStyle}>
                      {isSelected && (
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal }}></div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 2 }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        {isEarning && (
                          <span>{taxSummary(item)}</span>
                        )}
                        {!isEarning && item.is_pre_tax && (
                          <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 600, color: C.tealInk, background: C.tealSoft, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.01em" }}>Pre-tax</span>
                        )}
                        {!isEarning && !item.is_pre_tax && (
                          <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 600, color: C.muted, background: C.surface, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.01em" }}>Post-tax</span>
                        )}
                        {!isEarning && item.employer_matched && (
                          <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 600, color: C.green, background: C.greenSoft, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.01em" }}>Employer match</span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums", fontSize: 13, color: C.ink, fontWeight: 500, textAlign: "right", flex: "0 0 auto" }}>
                      {formatRate(item)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ padding: "18px 26px", borderTop: "1px solid " + C.line, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, background: "#fff" }}>
          <button onClick={onClose}
                  style={{ padding: "10px 18px", borderRadius: 10, fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer", border: "1px solid " + C.line, color: C.ink, background: "#fff" }}>
            Cancel
          </button>
          <button disabled
                  style={{ padding: "10px 18px", borderRadius: 10, fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "not-allowed", border: "1px solid transparent", color: "#fff", background: "#C3CBD6" }}>
            Add to employee
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Section({ section, values, draft, country, isOpen, isEditing, isSaving, disabledByOtherEdit, fieldErrors, onToggleOpen, onEdit, onCancel, onSave, onChange, workLocations, employeeId }) {
  const Icon = section.icon;
  const status = sectionStatus(section, values);
  const pill = status === "done" ? { bg: C.greenSoft, fg: C.green, label: "Done" }
    : status === "edit" ? { bg: C.tealSoft, fg: C.tealInk, label: "In progress" }
    : { bg: C.amberSoft, fg: C.amber, label: "Start" };
  const actLabel = status === "start" ? "Start" : "Edit";
  const v = isEditing ? draft : values;

  // Special-case rendering for Compensation section
  if (section.id === "compensation") {
    return (
      <CompensationSectionCard
        section={section}
        isOpen={isOpen}
        onToggleOpen={onToggleOpen}
        employeeId={employeeId}
      />
    );
  }
  const visibleFields = section.fields.filter(function(f) { return !f.showIf || f.showIf(v); });

  return (
    <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 15, boxShadow: "0 1px 2px rgba(16,26,43,0.04)", overflow: "hidden" }}>
      <div onClick={function() { if (!isEditing && !disabledByOtherEdit) onToggleOpen(); }}
        style={{ display: "flex", alignItems: "center", gap: 13, padding: "18px 22px", cursor: isEditing || disabledByOtherEdit ? "default" : "pointer" }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: C.tealSoft, color: C.tealInk, display: "grid", placeItems: "center", flex: "0 0 30px" }}>
          <Icon size={17} />
        </span>
        <h3 style={{ flex: 1, fontSize: 16, fontWeight: 600, color: C.ink }}>{section.title}</h3>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: pill.bg, color: pill.fg }}>
          {status === "done" && <Check size={12} />} {pill.label}
        </span>
        {!isEditing && (
          <button onClick={function(e) { e.stopPropagation(); onEdit(); }} disabled={disabledByOtherEdit}
            style={{ fontSize: 13.5, fontWeight: 600, color: C.tealInk, background: "none", border: 0, cursor: disabledByOtherEdit ? "not-allowed" : "pointer", padding: "6px 8px", borderRadius: 8, opacity: disabledByOtherEdit ? 0.5 : 1 }}>
            {actLabel}
          </button>
        )}
        <ChevronDown size={18} color={C.muted} style={{ transform: isOpen ? "none" : "rotate(-90deg)", transition: "transform 0.2s" }} />
      </div>
      {isOpen && (
        <div style={{ padding: "4px 22px 22px", borderTop: "1px solid " + C.lineSoft }}>
          {isEditing ? (
            <div>
              {section.intro && (
                <div style={{ marginTop: 10, padding: "12px 14px", background: C.tealSoft, borderRadius: 10, fontSize: 13, color: C.tealInk, lineHeight: 1.5 }}>{section.intro}</div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 18px", padding: "18px 0 4px" }}>
                {visibleFields.map(function(f) {
                  return (
                    <FieldEditor key={f.k} field={f.t === "wloc-select" ? Object.assign({}, f, { workLocations: workLocations }) : f} value={draft[f.k]} error={fieldErrors[f.k]} onChange={function(val) { onChange(f.k, val); }} />
                  );
                })}
              </div>
              {section.id === "tax" && country && country.calculationSource && (
                <div style={{ marginTop: 18, padding: "10px 14px", background: C.lineSoft, borderRadius: 8, fontSize: 12, color: C.muted, lineHeight: 1.45 }}>{country.calculationSource}</div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, padding: "16px 0 2px", marginTop: 6, borderTop: "1px solid " + C.lineSoft }}>
                <button onClick={onCancel} disabled={isSaving} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, background: "#fff", border: "1px solid " + C.line, color: C.ink, borderRadius: 10, padding: "9px 18px", cursor: isSaving ? "not-allowed" : "pointer" }}>Cancel</button>
                <button onClick={onSave} disabled={isSaving} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, background: isSaving ? "#C3CBD6" : C.teal, color: "#fff", border: "1px solid transparent", borderRadius: 10, padding: "9px 18px", cursor: isSaving ? "not-allowed" : "pointer", boxShadow: isSaving ? "none" : "0 1px 2px rgba(21,160,140,0.3)" }}>
                  {isSaving ? "Saving..." : "Save " + (section.shortTitle || section.title.split(" (")[0])}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {visibleFields.map(function(f) {
                const display = formatViewValue(f.t === "wloc-select" ? Object.assign({}, f, { workLocations: workLocations }) : f, v[f.k]);
                return (
                  <div key={f.k} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, padding: "13px 0", borderBottom: "1px solid " + C.lineSoft }}>
                    <span style={{ fontSize: 13.5, color: C.muted }}>{f.l}</span>
                    <span style={{ fontSize: 13.5, color: display ? C.ink : C.faint, fontWeight: display ? 500 : 400, fontStyle: display ? "normal" : "italic", textAlign: "right" }}>
                      {display || "Not set"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldEditor({ field, value, error, onChange }) {
  const v = value == null ? "" : value;
  const borderColor = error ? C.err : C.line;
  const common = {
    border: "1px solid " + borderColor, borderRadius: 10, padding: "10px 12px",
    fontFamily: FONT, fontSize: 14, color: C.ink, background: "#fff", width: "100%",
  };
  let control;
  if (field.t === "select") {
    control = (
      <select value={v} onChange={function(e) { onChange(e.target.value); }} style={Object.assign({}, common, { cursor: "pointer" })}>
        <option value="">Select</option>
        {field.opts.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
      </select>
    );
  } else if (field.t === "wloc-select") {
    const locs = field.workLocations || [];
    control = (
        <select value={v} onChange={function(e) { onChange(e.target.value); }} style={Object.assign({}, common, { cursor: "pointer" })}>
            <option value="">Select a location</option>
            {locs.map(function(loc) { return <option key={loc.id} value={loc.id}>{loc.name || "(Unnamed location)"}</option>; })}
        </select>
    );
} else if (field.t === "money") {
    control = (
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 14 }}>$</span>
        <input value={v} inputMode="decimal" placeholder="0.00" onChange={function(e) { onChange(e.target.value); }} style={Object.assign({}, common, { paddingLeft: 24 })} />
      </div>
    );
  } else {
    const type = field.t === "date" ? "date" : field.t === "email" ? "email" : field.t === "tel" ? "tel" : field.t === "number" ? "number" : "text";
    control = (
      <input type={type} value={v} placeholder={field.placeholder || (field.t === "date" ? "" : "Not set")} onChange={function(e) { onChange(e.target.value); }} style={common} />
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gridColumn: field.full ? "1 / -1" : "auto" }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>
        {field.l}{field.req && <span style={{ color: C.amber, marginLeft: 3 }}>*</span>}
      </label>
      {control}
      {field.help && !error && (
        <div style={{ marginTop: 6, fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
          {field.help}
          {field.helpLink && (
            <> <a href={field.helpLink.url} target="_blank" rel="noopener noreferrer" style={{ color: C.tealInk, textDecoration: "none", fontWeight: 600, marginLeft: 4 }}>{field.helpLink.label} ↗</a></>
          )}
        </div>
      )}
      {error && (
        <div style={{ marginTop: 6, fontSize: 12, color: C.err, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontWeight: 700 }}>!</span> {error}
        </div>
      )}
    </div>
  );
}
