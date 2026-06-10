// Canadian pay type catalog with CRA and Revenu Quebec tax treatment.
// This is the maintained pay-type tax table; the Edit pay type drawer
// reads from here. Tax treatment values are display-only in the UI; they
// are not user-editable per employee.
//
// Country-aware: each country has its own entry. T4 / Releve / Quebec
// rows are CA-specific. US / UK / AU equivalents can plug in here later
// (W-2 boxes, P60 fields, PAYG categories) without changing the drawer.

export const PAY_TYPE_DEFINITIONS = {
  CA: [
    {
      key: "stat_holiday_pay",
      label: "Stat Holiday Pay",
      category: "Holiday and time off",
      defaultRateAmount: "1.0x base pay",
      defaultAccountMapping: "Payroll Expenses:Wages",
      taxSettings: {
        taxable: true,
        insurable: true,
        pensionable: true,
        taxableQuebec: true,
        t4Boxes: ["14", "24", "26", "56"],
        releveBoxes: ["A", "G", "I"],
        roe: {
          insurableEarnings: true,
          insurableHours: true,
          payDates: false,
          payPeriodEndDate: true,
        },
      },
    },
    {
      key: "stat_pay_average_daily_wage",
      label: "Stat pay - average daily wage",
      category: "Holiday and time off",
      defaultRateAmount: "",
      defaultAccountMapping: "Payroll Expenses:Wages",
      taxSettings: {
        taxable: true,
        insurable: true,
        pensionable: true,
        taxableQuebec: true,
        t4Boxes: ["14", "24", "26", "56"],
        releveBoxes: ["A", "G", "I"],
        roe: {
          insurableEarnings: true,
          insurableHours: true,
          payDates: false,
          payPeriodEndDate: true,
        },
      },
    },
    {
      key: "bonus",
      label: "Bonus",
      category: "Additional earnings",
      defaultRateAmount: "",
      defaultAccountMapping: "Payroll Expenses:Bonuses",
      taxSettings: {
        taxable: true,
        insurable: true,
        pensionable: true,
        taxableQuebec: true,
        t4Boxes: ["14", "24", "26", "56"],
        releveBoxes: ["A", "G", "I"],
        roe: {
          insurableEarnings: true,
          insurableHours: false,
          payDates: false,
          payPeriodEndDate: false,
        },
      },
    },
    {
      key: "commission",
      label: "Commission",
      category: "Additional earnings",
      defaultRateAmount: "",
      defaultAccountMapping: "Payroll Expenses:Commissions",
      taxSettings: {
        taxable: true,
        insurable: true,
        pensionable: true,
        taxableQuebec: true,
        t4Boxes: ["14", "24", "26", "42", "56"],
        releveBoxes: ["A", "G", "I", "M"],
        roe: {
          insurableEarnings: true,
          insurableHours: false,
          payDates: false,
          payPeriodEndDate: false,
        },
      },
    },
    {
      key: "overtime",
      label: "Overtime",
      category: "Hours-based",
      defaultRateAmount: "1.5x base pay",
      defaultAccountMapping: "Payroll Expenses:Wages",
      taxSettings: {
        taxable: true,
        insurable: true,
        pensionable: true,
        taxableQuebec: true,
        t4Boxes: ["14", "24", "26", "56"],
        releveBoxes: ["A", "G", "I"],
        roe: {
          insurableEarnings: true,
          insurableHours: true,
          payDates: true,
          payPeriodEndDate: true,
        },
      },
    },
    {
      key: "shift_differential",
      label: "Shift differential",
      category: "Hours-based",
      defaultRateAmount: "",
      defaultAccountMapping: "Payroll Expenses:Wages",
      taxSettings: {
        taxable: true,
        insurable: true,
        pensionable: true,
        taxableQuebec: true,
        t4Boxes: ["14", "24", "26", "56"],
        releveBoxes: ["A", "G", "I"],
        roe: {
          insurableEarnings: true,
          insurableHours: true,
          payDates: true,
          payPeriodEndDate: true,
        },
      },
    },
    {
      key: "vacation_pay",
      label: "Vacation pay",
      category: "Holiday and time off",
      defaultRateAmount: "",
      defaultAccountMapping: "Payroll Expenses:Wages",
      taxSettings: {
        taxable: true,
        insurable: true,
        pensionable: true,
        taxableQuebec: true,
        t4Boxes: ["14", "24", "26", "56"],
        releveBoxes: ["A", "G", "I"],
        roe: {
          insurableEarnings: true,
          insurableHours: false,
          payDates: false,
          payPeriodEndDate: true,
        },
      },
    },
    {
      key: "sick_pay",
      label: "Sick pay",
      category: "Holiday and time off",
      defaultRateAmount: "1.0x base pay",
      defaultAccountMapping: "Payroll Expenses:Wages",
      taxSettings: {
        taxable: true,
        insurable: true,
        pensionable: true,
        taxableQuebec: true,
        t4Boxes: ["14", "24", "26", "56"],
        releveBoxes: ["A", "G", "I"],
        roe: {
          insurableEarnings: true,
          insurableHours: true,
          payDates: true,
          payPeriodEndDate: true,
        },
      },
    },
  ],
  // US, UK, AU definitions plug in here later in the same shape.
};

export function getPayTypesForCountry(country) {
  return PAY_TYPE_DEFINITIONS[country] || PAY_TYPE_DEFINITIONS.CA;
}

export function getPayTypeByKey(country, key) {
  const list = getPayTypesForCountry(country);
  return list.find((pt) => pt.key === key) || null;
}

// Country-specific labels for the tax-settings block in the drawer.
// Returning shape: { treatments: [], boxes: [], roeRows: [] }
export function getTaxSettingsRows(country) {
  if (country === "CA") {
    return {
      treatments: [
        { key: "taxable", label: "Taxable" },
        { key: "insurable", label: "Insurable" },
        { key: "pensionable", label: "Pensionable" },
        { key: "taxableQuebec", label: "Taxable (Quebec)" },
      ],
      boxes: [
        { key: "t4Boxes", label: "T4 Boxes" },
        { key: "releveBoxes", label: "Releve Boxes" },
      ],
      roeRows: [
        { key: "insurableEarnings", label: "Insurable earnings" },
        { key: "insurableHours", label: "Insurable hours" },
        { key: "payDates", label: "Pay dates" },
        { key: "payPeriodEndDate", label: "Pay period end date" },
      ],
    };
  }
  return {
    treatments: [
      { key: "taxable", label: "Taxable" },
      { key: "insurable", label: "Insurable" },
      { key: "pensionable", label: "Pensionable" },
    ],
    boxes: [],
    roeRows: [],
  };
}
