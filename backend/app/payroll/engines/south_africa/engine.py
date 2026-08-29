"""ZA payroll engine.

STUB: capabilities declared, calculate() not implemented yet.
Real implementation blocked on: SARS + UIF + SDL + local payment rail (Ozow, Peach, or similar).

Scheduled for Phase 7 of Novala roadmap. Registered here so the
CountryPack registry knows about the target country ahead of time.
"""
from ...country_pack import CountryPack
from ...types import PayCalculationInput, PayCalculationResult


class SouthAfricaPayrollEngine(CountryPack):
    """ZA payroll engine - STUB. Not yet implemented."""

    # PayrollEngine (legacy) attribute kept for supports_jurisdiction()
    country = "ZA"

    # CountryPack capability declaration (see docs/multi-country-naming.md)
    country_code = "ZA"  # ISO 3166-1 alpha-2
    currency = "ZAR"    # ISO 4217
    default_locale = "en-ZA"      # BCP 47
    supported_locales = ["en-ZA", "af-ZA", "zu-ZA", "xh-ZA"]  # Languages this engine will speak
    supported_regions = []                        # ISO 3166-2 - empty until reconciliation done
    tax_authority_name = "South African Revenue Service"
    tax_authority_id = "sars"
    date_format = "YYYY-MM-DD"

    def calculate(self, input: PayCalculationInput) -> PayCalculationResult:
        raise NotImplementedError(
            "ZA payroll engine is not yet implemented. "
            "This is a stub registered in the CountryPack registry "
            "to declare the target country. See roadmap Phase 7 for "
            "implementation schedule."
        )
