/**
 * LedgerFlow Tax Engine
 * Calculates corporate tax with federal + state/province split
 * Returns a clean breakdown object for the UI and PDF
 */

export function calculateTax({
  revenue,
  deductions,
  countryData,
  stateCode,
  useCustomRate,
  customRate,
  includeVAT,
}) {
  // ── Sanitize inputs ────────────────────────────────────────
  const rev        = Math.max(parseFloat(revenue)    || 0, 0);
  const ded        = Math.max(parseFloat(deductions)  || 0, 0);
  const taxableIncome = Math.max(rev - ded, 0);

  if (!countryData) {
    return {
      taxableIncome: 0,
      federalTax:    0,
      stateTax:      0,
      vatTax:        0,
      totalTax:      0,
      netProfit:     0,
      federalRate:   0,
      stateRate:     0,
      effectiveRate: 0,
      taxSaved:      0,
      stateName:     '',
      stateSalesTax: 0,
    };
  }

  // ── Federal rate ───────────────────────────────────────────
  let federalRate = countryData.corporateTax || 0;

  // ── State / Province rate ──────────────────────────────────
  let stateRate    = 0;
  let stateName    = '';
  let stateSalesTax = 0;

  if (
    countryData.hasState &&
    stateCode &&
    countryData.states &&
    countryData.states[stateCode]
  ) {
    const stateData  = countryData.states[stateCode];
    stateRate        = stateData.extraTax    || 0;
    stateName        = stateData.name        || '';
    stateSalesTax    = stateData.salesTax    || 0;
  }

  // ── Custom rate override ───────────────────────────────────
  // Custom rate replaces the TOTAL corporate rate (federal + state)
  let totalCorporateRate = federalRate + stateRate;
  if (useCustomRate && customRate !== '' && customRate !== null) {
    totalCorporateRate = Math.max(parseFloat(customRate) || 0, 0) / 100;
    federalRate        = totalCorporateRate;
    stateRate          = 0;
  }

  // ── Corporate tax ──────────────────────────────────────────
  const federalTax  = taxableIncome * federalRate;
  const stateTax    = taxableIncome * stateRate;
  const corporateTax = federalTax + stateTax;

  // ── VAT / Sales tax ────────────────────────────────────────
  // Use state sales tax if a state is selected, otherwise country sales tax
  const salesTaxRate = (
    countryData.hasState && stateCode && stateSalesTax > 0
      ? stateSalesTax
      : countryData.salesTax || 0
  );
  const vatTax = includeVAT ? (rev * salesTaxRate) : 0;

  // ── Totals ─────────────────────────────────────────────────
  const totalTax    = corporateTax + vatTax;
  const netProfit   = rev - totalTax - ded;
  const effectiveRate = rev > 0 ? (totalTax / rev) * 100 : 0;

  // ── Tax saved from deductions ──────────────────────────────
  const taxSaved    = ded * totalCorporateRate;

  return {
    taxableIncome,
    federalTax,
    stateTax,
    corporateTax,
    vatTax,
    totalTax,
    netProfit,
    federalRate,
    stateRate,
    totalCorporateRate,
    effectiveRate,
    taxSaved,
    stateName,
    stateSalesTax,
    salesTaxRate,
  };
}