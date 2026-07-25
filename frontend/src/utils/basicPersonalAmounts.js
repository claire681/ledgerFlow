// Basic Personal Amounts (BPA) for CRA payroll calculations.
// Federal from TD1; Provincial from TD1AB, TD1BC, TD1ON, etc.
// Update annually when CRA publishes new indexed values.

export const BPA = {
  2026: {
    federal: 16452,
    AB: 22769,
    // Other provinces: fill in when their 2026 TD1 forms are indexed.
    BC: null,
    MB: null,
    NB: null,
    NL: null,
    NS: null,
    NT: null,
    NU: null,
    ON: null,
    PE: null,
    QC: null,
    SK: null,
    YT: null,
  },
  2025: {
    federal: 16129,
    AB: 22323,
    BC: 12580,
    MB: 15780,
    NB: 13396,
    NL: 11067,
    NS: 11894,
    NT: 17842,
    NU: 18767,
    ON: 12747,
    PE: 14250,
    QC: 18571,
    SK: 18491,
    YT: 15705,
  },
};

export function getFederalBPA(year) {
  const y = year || new Date().getFullYear();
  if (BPA[y] && BPA[y].federal != null) return BPA[y].federal;
  return BPA[2025].federal;
}

export function getProvincialBPA(province, year) {
  const y = year || new Date().getFullYear();
  const code = (province || "").toUpperCase();
  if (BPA[y] && BPA[y][code] != null) return BPA[y][code];
  if (BPA[2025][code] != null) return BPA[2025][code];
  return null;
}

export default BPA;