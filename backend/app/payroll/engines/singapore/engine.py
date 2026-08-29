"""SG payroll engine.

STUB: capabilities declared, calculate() not implemented yet.
Real implementation blocked on: IRAS + CPF reconciliation.

Scheduled for Phase 7 of Novala roadmap. Registered here so the
CountryPack registry knows about the target country ahead of time.
"""
from ...country_pack import CountryPack
from ...types import PayCalculationInput, PayCalculationResult


class SingaporePayrollEngine(CountryPack):
    """SG payroll engine - STUB. Not yet implemented."""

    # PayrollEngine (legacy) attribute kept for supports_jurisdiction()
    country = "SG"

    # CountryPack capability declaration (see docs/multi-country-naming.md)
    country_code = "SG"  # ISO 3166-1 alpha-2
    currency = "SGD"    # ISO 4217
    default_locale = "en-SG"      # BCP 47
    supported_locales = ["en-SG", "zh-SG", "ms-SG", "ta-SG"]  # Languages this engine will speak
    supported_regions = []                        # ISO 3166-2 - empty until reconciliation done
    tax_authority_name = "Inland Revenue Authority of Singapore"
    tax_authority_id = "iras"
    date_format = "DD/MM/YYYY"

    def calculate(self, input: PayCalculationInput) -> PayCalculationResult:
        raise NotImplementedError(
            "SG payroll engine is not yet implemented. "
            "This is a stub registered in the CountryPack registry "
            "to declare the target country. See roadmap Phase 7 for "
            "implementation schedule."
        )
