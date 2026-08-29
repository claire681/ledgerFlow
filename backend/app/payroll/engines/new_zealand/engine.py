"""NZ payroll engine.

STUB: capabilities declared, calculate() not implemented yet.
Real implementation blocked on: IRD calculator reconciliation, KiwiSaver, Payday Filing.

Scheduled for Phase 7 of Novala roadmap. Registered here so the
CountryPack registry knows about the target country ahead of time.
"""
from ...country_pack import CountryPack
from ...types import PayCalculationInput, PayCalculationResult


class NewZealandPayrollEngine(CountryPack):
    """NZ payroll engine - STUB. Not yet implemented."""

    # PayrollEngine (legacy) attribute kept for supports_jurisdiction()
    country = "NZ"

    # CountryPack capability declaration (see docs/multi-country-naming.md)
    country_code = "NZ"  # ISO 3166-1 alpha-2
    currency = "NZD"    # ISO 4217
    default_locale = "en-NZ"      # BCP 47
    supported_locales = ["en-NZ", "mi-NZ"]  # Languages this engine will speak
    supported_regions = []                        # ISO 3166-2 - empty until reconciliation done
    tax_authority_name = "Inland Revenue Department"
    tax_authority_id = "ird_nz"
    date_format = "DD/MM/YYYY"

    def calculate(self, input: PayCalculationInput) -> PayCalculationResult:
        raise NotImplementedError(
            "NZ payroll engine is not yet implemented. "
            "This is a stub registered in the CountryPack registry "
            "to declare the target country. See roadmap Phase 7 for "
            "implementation schedule."
        )
