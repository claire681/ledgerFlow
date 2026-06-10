// Tax default values for payroll
// Statutory amounts that change every tax year and differ by province
// Source: Canada Revenue Agency
// Maintainer: update annually based on CRA published amounts

export const TAX_YEAR = 2026;

// Federal basic personal amount
export const FEDERAL_BASIC_PERSONAL_AMOUNT = 16452;

// Provincial basic personal amounts for Canadian provinces and territories
export const PROVINCIAL_BASIC_PERSONAL_AMOUNTS = {
  AB: 22769,
  BC: 12932,
  MB: 15969,
  NB: 13396,
  NL: 11067,
  NS: 11744,
  NT: 17373,
  NU: 19274,
  ON: 12747,
  PE: 14250,
  QC: 18056,
  SK: 18491,
  YT: 16452,
};

export const getTaxDefaults = (country, province) => {
  const c = (country || "CA").toUpperCase();
  if (c === "CA") {
    const p = (province || "AB").toUpperCase();
    return {
      federal: FEDERAL_BASIC_PERSONAL_AMOUNT,
      provincial: PROVINCIAL_BASIC_PERSONAL_AMOUNTS[p] || FEDERAL_BASIC_PERSONAL_AMOUNT,
    };
  }
  return { federal: 0, provincial: 0 };
};
