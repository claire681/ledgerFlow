export const PAY_TYPES = [
  { id: "pt1", cat: "Regular pay", name: "Salary", active: true },
  { id: "pt2", cat: "Regular pay", name: "Hourly", active: true },
  { id: "pt3", cat: "Hourly", name: "Hourly 2", active: true },
  { id: "pt4", cat: "Regular pay", name: "Commission", active: true },
  { id: "pt5", cat: "", name: "Overtime Pay", active: true },
  { id: "pt6", cat: "", name: "Double Overtime Pay", active: true },
  { id: "pt7", cat: "", name: "Stat Holiday Pay", active: true },
  { id: "pt8", cat: "", name: "Bonus", active: true },
];

export const SCHEDULES = [
  { id: "default", isDefault: true, freq: "Twice a month", name: "Semi-monthly, 15th and End of Month", ends: "14/06/2026", payday: "15/06/2026" },
  { id: "final1", isDefault: false, freq: "Twice a month", name: "Final Pay, Former Employee", ends: "14/06/2026", payday: "15/06/2026" },
  { id: "final2", isDefault: false, freq: "Twice a month", name: "Final Pay, Former Employee 2", ends: "10/06/2026", payday: "15/06/2026" },
];

export const LOCATIONS = [
  { id: "primary", isPrimary: true, active: true, name: "Edmonton, AB", address: "49516 Range Road 174, Edmonton, AB T5H0S4" },
];

export const DEDUCTIONS = [];
