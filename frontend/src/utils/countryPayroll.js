const PROVINCES_CA = ["Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Nova Scotia","Northwest Territories","Nunavut","Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon"];

const STATES_US = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];

const REGIONS_GB = ["England","Scotland","Wales","Northern Ireland"];
const REGIONS_AU = ["Australian Capital Territory","New South Wales","Northern Territory","Queensland","South Australia","Tasmania","Victoria","Western Australia"];

function isFilled(v) { return v !== undefined && v !== null && String(v).trim() !== ""; }

function rangeValidate(min, max) {
  return function(v) {
    if (!isFilled(v)) return true;
    var n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max;
  };
}

var COUNTRIES = {
  CA: {
    code: "CA", name: "Canada",
    taxId: {
      label: "Social insurance number", short: "SIN", placeholder: "XXX-XXX-XXX",
      validate: function(v) { return /^\d{3}[- ]?\d{3}[- ]?\d{3}$/.test(String(v || "").trim()); },
      errorMsg: "Enter a 9-digit SIN like 123-456-789"
    },
    taxForm: "TD1", regionLabel: "Province", regions: PROVINCES_CA,
    taxFields: [
      { k: "provinceEmp", l: "Province of employment", t: "select", req: true, opts: PROVINCES_CA },
      { k: "federalTD1", l: "Federal TD1 claim amount", t: "money", help: "From the employee's TD1 federal form, total claim amount on line 13.", validate: rangeValidate(0, 999999), errorMsg: "Enter $0 to $999,999" },
      { k: "provincialTD1", l: "Provincial TD1 claim amount", t: "money", help: "From the employee's provincial TD1 form, total claim amount.", validate: rangeValidate(0, 999999), errorMsg: "Enter $0 to $999,999" },
      { k: "additionalTax", l: "Voluntary extra federal tax per pay (optional)", t: "money", help: "Only if requested by the employee on TD1 page 2. Leave blank otherwise.", validate: rangeValidate(0, 99999), errorMsg: "Enter $0 to $99,999" },
      { k: "cppExempt", l: "CPP exempt", t: "select", opts: ["No","Yes"], help: "Most employees are not exempt. Set Yes only for clergy electing out, employees under 18, or those over 70 with a CPT30." },
      { k: "eiExempt", l: "EI exempt", t: "select", opts: ["No","Yes"], help: "Most employees are not exempt. Set Yes only for employees who own more than 40% of company shares or sole proprietors." }
    ]
  },
  US: {
    code: "US", name: "United States",
    taxId: {
      label: "Social security number", short: "SSN", placeholder: "XXX-XX-XXXX",
      validate: function(v) { return /^\d{3}[- ]?\d{2}[- ]?\d{4}$/.test(String(v || "").trim()); },
      errorMsg: "Enter a 9-digit SSN like 123-45-6789"
    },
    taxForm: "W-4", regionLabel: "State", regions: STATES_US,
    taxFields: [
      { k: "stateEmp", l: "State of employment", t: "select", req: true, opts: STATES_US },
      { k: "filingStatus", l: "Federal filing status", t: "select", opts: ["Single","Married filing jointly","Married filing separately","Head of household"] },
      { k: "allowances", l: "Federal allowances", t: "number", validate: rangeValidate(0, 99), errorMsg: "Enter 0 to 99" },
      { k: "additionalFedTax", l: "Voluntary extra federal withholding per pay (optional)", t: "money", help: "Only if requested by the employee on W-4 Step 4(c). Leave blank otherwise.", validate: rangeValidate(0, 99999), errorMsg: "Enter $0 to $99,999" },
      { k: "stateWithholding", l: "Voluntary extra state withholding per pay (optional)", t: "money", help: "Only if requested by the employee. Leave blank otherwise.", validate: rangeValidate(0, 99999), errorMsg: "Enter $0 to $99,999" },
      { k: "fedExempt", l: "Exempt from federal withholding", t: "select", opts: ["No","Yes"] }
    ]
  },
  GB: {
    code: "GB", name: "United Kingdom",
    taxId: {
      label: "National Insurance number", short: "NINO", placeholder: "AB 12 34 56 C",
      validate: function(v) {
        if (!isFilled(v)) return false;
        var clean = String(v).toUpperCase().replace(/\s/g, "");
        return /^[A-CEGHJ-PR-TW-Z]{1}[A-CEGHJ-NPR-TW-Z]{1}\d{6}[A-D]{1}$/.test(clean);
      },
      errorMsg: "Enter a valid NI number like AB 12 34 56 C"
    },
    taxForm: "P45 / P46", regionLabel: "Region", regions: REGIONS_GB,
    taxFields: [
      { k: "taxCode", l: "Tax code", t: "text", req: true, placeholder: "e.g. 1257L",
        validate: function(v) { return !isFilled(v) || /^\s*\d{2,4}[A-Z]{1,2}\s*$/i.test(String(v)); },
        errorMsg: "Enter a valid UK tax code like 1257L" },
      { k: "niCategory", l: "National Insurance category", t: "select", opts: ["A","B","C","F","H","I","J","L","M","S","V","X","Z"] },
      { k: "studentLoanPlan", l: "Student loan plan", t: "select", opts: ["None","Plan 1","Plan 2","Plan 4","Postgraduate"] },
      { k: "pensionPercent", l: "Pension contribution (%)", t: "number", validate: rangeValidate(0, 100), errorMsg: "Enter 0 to 100" }
    ]
  },
  AU: {
    code: "AU", name: "Australia",
    taxId: {
      label: "Tax file number", short: "TFN", placeholder: "XXX XXX XXX",
      validate: function(v) {
        var digits = String(v || "").replace(/\D/g, "");
        return digits.length === 8 || digits.length === 9;
      },
      errorMsg: "Enter an 8 or 9 digit TFN"
    },
    taxForm: "TFN declaration", regionLabel: "State or territory", regions: REGIONS_AU,
    taxFields: [
      { k: "tfnDeclared", l: "Tax file number provided", t: "select", opts: ["Yes","No, claim exemption","Pending"] },
      { k: "freeThreshold", l: "Claiming tax-free threshold", t: "select", opts: ["Yes","No"] },
      { k: "medicareExempt", l: "Medicare levy exemption", t: "select", opts: ["None","Half","Full"] },
      { k: "helpHecs", l: "HELP/HECS debt", t: "select", opts: ["No","Yes"] },
      { k: "superRate", l: "Superannuation rate (%)", t: "number", validate: rangeValidate(0, 50), errorMsg: "Enter 0 to 50" }
    ]
  }
};

var DEFAULT_COUNTRY = "CA";

export function getCountryConfig(code) {
  if (!code) return COUNTRIES[DEFAULT_COUNTRY];
  var upper = String(code).toUpperCase();
  return COUNTRIES[upper] || COUNTRIES[DEFAULT_COUNTRY];
}

export function isCountrySupported(code) {
  if (!code) return false;
  return !!COUNTRIES[String(code).toUpperCase()];
}

export function listSupportedCountries() {
  return Object.values(COUNTRIES).map(function(c) { return { code: c.code, name: c.name }; });
}

export function validateField(field, value) {
  if (field.req && !isFilled(value)) return field.l + " is required";
  if (!isFilled(value)) return null;
  if (field.validate && !field.validate(value)) {
    return field.errorMsg || ("Invalid " + field.l.toLowerCase());
  }
  return null;
}

export function computeReadiness(values, countryCode) {
  var config = getCountryConfig(countryCode);
  var missing = [];
  var invalid = [];
  function check(k, lab) { if (!isFilled(values[k])) missing.push(lab); }
  check("name", "Name");
  check("birth", "Birth date");
  if (!isFilled(values.taxId)) missing.push(config.taxId.label);
  else if (config.taxId.validate && !config.taxId.validate(values.taxId)) invalid.push(config.taxId.label);
  check("empType", "Employment type");
  check("startDate", "Start date");
  check("method", "Payment method");
  check("payType", "Pay type");
  check("rate", "Rate");
  config.taxFields.forEach(function(f) {
    if (f.req && !isFilled(values[f.k])) missing.push(f.l);
    else if (isFilled(values[f.k]) && f.validate && !f.validate(values[f.k])) invalid.push(f.l);
  });
  return { ready: missing.length === 0 && invalid.length === 0, missing: missing, invalid: invalid };
}
