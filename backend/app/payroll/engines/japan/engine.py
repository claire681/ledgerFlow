"""JP payroll engine.

STUB: capabilities declared, calculate() not implemented yet.
Real implementation blocked on: National Tax Agency reconciliation, Japanese locale mandatory, prefecture-specific rules.

Scheduled for Phase 7 of Novala roadmap. Registered here so the
CountryPack registry knows about the target country ahead of time.
"""
from ...country_pack import CountryPack
from ...types import PayCalculationInput, PayCalculationResult


class JapanPayrollEngine(CountryPack):
    """JP payroll engine - STUB. Not yet implemented."""

    # PayrollEngine (legacy) attribute kept for supports_jurisdiction()
    country = "JP"

    # CountryPack capability declaration (see docs/multi-country-naming.md)
    country_code = "JP"  # ISO 3166-1 alpha-2
    currency = "JPY"    # ISO 4217
    default_locale = "ja-JP"      # BCP 47
    supported_locales = ["ja-JP", "en-JP"]  # Languages this engine will speak
    supported_regions = []                        # ISO 3166-2 - empty until reconciliation done
    tax_authority_name = "National Tax Agency (Kokuzeicho)"
    tax_authority_id = "nta"
    date_format = "YYYY-MM-DD"

    def calculate(self, input: PayCalculationInput) -> PayCalculationResult:
        raise NotImplementedError(
            "JP payroll engine is not yet implemented. "
            "This is a stub registered in the CountryPack registry "
            "to declare the target country. See roadmap Phase 7 for "
            "implementation schedule."
        )
