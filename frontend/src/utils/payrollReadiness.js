// Section-by-section completeness check (drives Edit/Start labels).
export const isSectionFilled = (sectionId, emp) => {
  if (!emp) return false;
  switch (sectionId) {
    case "personal":
      return !!(emp.first_name || emp.last_name || emp.email);
    case "emergency":
      return !!(
        emp.emergency_name ||
        emp.emergency_home_phone ||
        emp.emergency_mobile_phone ||
        emp.emergency_email
      );
    case "employment":
      return !!(emp.hire_date || emp.work_location || emp.work_location_id || emp.job_title || emp.employee_id);
    case "payment_method":
      return !!emp.payment_method;
    case "base_pay":
      return !!emp.pay_type && (parseFloat(emp.hourly_rate) > 0 || parseFloat(emp.salary_amount) > 0);
    case "additional_pay":
      return Array.isArray(emp.additional_pay_types) && emp.additional_pay_types.length > 0;
    case "time_off":
      return !!(
        emp.vacation_policy ||
        emp.sick_pay_policy ||
        emp.sick_pay ||
        emp.unpaid_time_off_policy ||
        emp.unpaid_time_off
      );
    case "tax":
      return !!(
        emp.federal_td1_amount ||
        emp.federal_claim_amount ||
        emp.federal_credit_amount ||
        emp.provincial_claim_amount ||
        emp.provincial_credit_amount ||
        emp.cpp_exempt ||
        emp.ei_exempt ||
        emp.federal_income_tax_exempt
      );
    case "banking":
      return !!(emp.bank_name || emp.account_number);
    case "deductions":
      return (
        (Array.isArray(emp.deductions) && emp.deductions.length > 0) ||
        !!emp.t4_dental_benefits_codes
      );
    default:
      return false;
  }
};

// Payroll readiness: stricter than isSectionFilled, requires the specific fields
// needed to actually run a pay run. Returns { ready: bool, missing: [{section, label}] }
// where section is the EmployeeProfile section id to deep-link into.
export const getReadiness = (emp) => {
  if (!emp) return { ready: false, missing: [{ section: "personal", label: "personal info" }] };
  const missing = [];

  if (!emp.first_name || !emp.last_name) {
    missing.push({ section: "personal", label: "name" });
  }
  if (!emp.sin && !emp.social_insurance_number) {
    missing.push({ section: "personal", label: "SIN" });
  }

  const hasBasePay = !!emp.pay_type && (parseFloat(emp.hourly_rate) > 0 || parseFloat(emp.salary_amount) > 0);
  if (!hasBasePay) missing.push({ section: "base_pay", label: "pay rate" });

  if (!emp.pay_schedule) missing.push({ section: "employment", label: "pay schedule" });

  if (!emp.work_location && !emp.work_location_id) missing.push({ section: "employment", label: "work location" });

  if (!isSectionFilled("tax", emp)) missing.push({ section: "tax", label: "tax withholdings" });

  if (!emp.payment_method) missing.push({ section: "payment_method", label: "payment method" });

  return { ready: missing.length === 0, missing };
};
