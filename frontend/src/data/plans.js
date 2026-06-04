// Strategy B: match QB on price, win on AI + niche
export const PLANS = {
  starter: {
    id: "starter", name: "Starter",
    monthlyPrice: 25, originalPrice: 50,
    savings: "Save $25/mo for 3 months",
    topFeatures: ["Receipt scanner with Nova", "Smart bookkeeping", "Live dashboards", "Up to 100 transactions/mo", "Email support"],
  },
  growth: {
    id: "growth", name: "Growth",
    monthlyPrice: 49, originalPrice: 99,
    savings: "Save $50/mo for 3 months",
    topFeatures: ["Everything in Starter", "Unlimited transactions", "Multi-user team access", "Invoicing & payments", "Custom reports", "Priority support"],
  },
  scale: {
    id: "scale", name: "Scale",
    monthlyPrice: 99, originalPrice: 199,
    savings: "Save $100/mo for 3 months",
    topFeatures: ["Everything in Growth", "Advanced analytics", "Dedicated account manager", "Custom integrations", "API access", "SLA & priority chat"],
  },
};

export const PAYROLL_TIERS = {
  core: {
    id: "core", name: "Payroll Core",
    monthlyPrice: 25, originalPrice: 50, perEmployee: 4,
    savings: "Save $25/mo for 3 months",
    topFeatures: ["Full-service payroll", "Auto payroll", "Year-end tax forms (T4, T5)", "Direct deposit", "Free guided setup"],
    sections: {
      "Take care of payroll": [
        ["Full-service payroll", true], ["Auto payroll", true],
        ["Year-end tax forms (T4, T5)", true], ["Payroll reports", true],
        ["Record of Employment", true], ["Free guided setup", true],
        ["Direct deposit", true], ["Workers' compensation", false],
        ["Prioritized support", false],
      ],
      "Track hours worked": [
        ["Time tracking", false], ["Employee access", false],
        ["Mobile time tracking", false], ["Job & shift scheduling", false],
      ],
    },
  },
  premium: {
    id: "premium", name: "Payroll Premium",
    monthlyPrice: 40, originalPrice: 80, perEmployee: 6,
    savings: "Save $40/mo for 3 months",
    topFeatures: ["Everything in Core", "Workers' compensation", "Time tracking", "Employee access", "Prioritized support"],
    sections: {
      "Take care of payroll": [
        ["Full-service payroll", true], ["Auto payroll", true],
        ["Year-end tax forms (T4, T5)", true], ["Payroll reports", true],
        ["Record of Employment", true], ["Free guided setup", true],
        ["Direct deposit", true], ["Workers' compensation", true],
        ["Prioritized support", true],
      ],
      "Track hours worked": [
        ["Time tracking", true], ["Employee access", true],
        ["Mobile time tracking", false], ["Job & shift scheduling", false],
      ],
    },
  },
  elite: {
    id: "elite", name: "Payroll Elite",
    monthlyPrice: 80, originalPrice: 160, perEmployee: 9,
    savings: "Save $80/mo for 3 months",
    topFeatures: ["Everything in Premium", "Job & shift scheduling", "Mobile time tracking", "Advanced reports", "White-glove onboarding"],
    sections: {
      "Take care of payroll": [
        ["Full-service payroll", true], ["Auto payroll", true],
        ["Year-end tax forms (T4, T5)", true], ["Payroll reports", true],
        ["Record of Employment", true], ["Free guided setup", true],
        ["Direct deposit", true], ["Workers' compensation", true],
        ["Prioritized support", true],
      ],
      "Track hours worked": [
        ["Time tracking", true], ["Employee access", true],
        ["Mobile time tracking", true], ["Job & shift scheduling", true],
      ],
    },
  },
};

export const getPlan = (id) => PLANS[id] || PLANS.growth;
export const getPayroll = (id) => id ? PAYROLL_TIERS[id] : null;
