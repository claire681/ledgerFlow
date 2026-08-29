"""DE payroll engine.

STUB: capabilities declared, calculate() not implemented yet.
Real implementation blocked on: BZSt + solidarity + church tax + Sozialversicherung + Elster.

Scheduled for Phase 7 of Novala roadmap. Registered here so the
CountryPack registry knows about the target country ahead of time.
"""
from ...country_pack import CountryPack
from ...types import PayCalculationInput, PayCalculationResult


class GermanyPayrollEngine(CountryPack):
    """DE payroll engine - STUB. Not yet implemented."""

    # PayrollEngine (legacy) attribute kept for supports_jurisdiction()
    country = "DE"

    # CountryPack capability declaration (see docs/multi-country-naming.md)
    country_code = "DE"  # ISO 3166-1 alpha-2
    currency = "EUR"    # ISO 4217
    default_locale = "de-DE"      # BCP 47
    supported_locales = ["de-DE", "en-DE"]  # Languages this engine will speak
    supported_regions = []                        # ISO 3166-2 - empty until reconciliation done
    tax_authority_name = "Bundeszentralamt fuer Steuern"
    tax_authority_id = "bzst"
    date_format = "DD.MM.YYYY"

    def calculate(self, input: PayCalculationInput) -> PayCalculationResult:
        raise NotImplementedError(
            "DE payroll engine is not yet implemented. "
            "This is a stub registered in the CountryPack registry "
            "to declare the target country. See roadmap Phase 7 for "
            "implementation schedule."
        )
