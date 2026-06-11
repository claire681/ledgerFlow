// CRA T4 Box 45 dental benefits codes
// These are CRA-defined and must match the official definitions exactly.
// The selected code is written to the employee's T4 Box 45, so altered
// wording or mis-mapped codes produce incorrect tax filings.
// Source: Canada Revenue Agency T4 reporting guide
// Maintainer: confirm against CRA before changing any meaning

export const DENTAL_CODES = [
  { code: "1", access: "No access", who: "No one covered" },
  { code: "2", access: "Yes", who: "The payee" },
  { code: "3", access: "Yes", who: "The payee, their spouse, and dependents" },
  { code: "4", access: "Yes", who: "The payee and their spouse" },
  { code: "5", access: "Yes", who: "The payee and their dependents" },
];

export const DENTAL_CODE_OPTIONS = [
  { value: "", label: "Select an option" },
  ...DENTAL_CODES.map((c) => ({ value: c.code, label: `Code ${c.code}` })),
];
