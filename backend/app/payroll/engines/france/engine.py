"""FR payroll engine.

STUB: capabilities declared, calculate() not implemented yet.
Real implementation blocked on: URSSAF + income tax + CSG/CRDS + DSN reporting + 35-hour week rules.

Scheduled for Phase 7 of Novala roadmap. Registered here so the
CountryPack registry knows about the target country ahead of time.
"""
from ...country_pack import CountryPack
from ...types import PayCalculationInput, PayCalculationResult


class FrancePayrollEngine(CountryPack):
    """FR payroll engine - STUB. Not yet implemented."""

    # PayrollEngine (legacy) attribute kept for supports_jurisdiction()
    country = "FR"

    # CountryPack capability declaration (see docs/multi-country-naming.md)
    country_code = "FR"  # ISO 3166-1 alpha-2
    currency = "EUR"    # ISO 4217
    default_locale = "fr-FR"      # BCP 47
    supported_locales = ["fr-FR", "en-FR"]  # Languages this engine will speak
    supported_regions = []                        # ISO 3166-2 - empty until reconciliation done
    tax_authority_name = "Direction generale des Finances publiques"
    tax_authority_id = "dgfip"
    date_format = "DD/MM/YYYY"

    def calculate(self, input: PayCalculationInput) -> PayCalculationResult:
        raise NotImplementedError(
            "FR payroll engine is not yet implemented. "
            "This is a stub registered in the CountryPack registry "
            "to declare the target country. See roadmap Phase 7 for "
            "implementation schedule."
        )
