"""Country pack capability contract.

A CountryPack is a PayrollEngine that ALSO declares its full capabilities:
- what currency it uses
- what regions (provinces/states/prefectures) it supports
- which tax authority it remits to
- which locales it supports

Purpose: when Novala adds country #11, adding a CountryPack subclass and
registering it in the registry is enough. Every other subsystem (routing,
validation, capability queries, provider matching) reads from the pack's
own declaration -- no cross-file changes needed.

Naming follows docs/multi-country-naming.md:
- country_code:      ISO 3166-1 alpha-2  (CA, US, GB, DE, JP, ZA, ...)
- currency:          ISO 4217            (CAD, USD, GBP, EUR, JPY, ZAR, ...)
- supported_regions: ISO 3166-2          (CA-AB, US-CA, GB-ENG, DE-BY, JP-13, ...)
- default_locale:    BCP 47              (en-CA, fr-CA, en-US, de-DE, ja-JP, ...)
- supported_locales: BCP 47              (list of the above)
"""
from typing import List, Optional
from .base import PayrollEngine


class CountryPack(PayrollEngine):
    """A country pack is a PayrollEngine with formal capability declaration.

    Every concrete subclass MUST set these class attributes:
        country_code, currency, default_locale,
        supported_locales, supported_regions, tax_authority_name

    Optional but recommended:
        tax_authority_id, date_format

    Validation runs at registration time (see registry.py). Any pack missing
    a required field fails LOUD at import, not at payroll runtime.
    """

    # Required capability fields (no defaults - subclass MUST set)
    country_code: str = ""              # ISO 3166-1 alpha-2, e.g. "CA"
    currency: str = ""                  # ISO 4217, e.g. "CAD"
    default_locale: str = ""            # BCP 47, e.g. "en-CA"
    supported_locales: List[str] = []   # BCP 47, e.g. ["en-CA", "fr-CA"]
    supported_regions: List[str] = []   # ISO 3166-2, e.g. ["CA-AB", "CA-BC", ...]
    tax_authority_name: str = ""        # Human name, e.g. "Canada Revenue Agency"

    # Optional capability fields
    tax_authority_id: str = ""          # Machine ID, e.g. "cra"
    date_format: str = "YYYY-MM-DD"     # Display convention

    @classmethod
    def validate_capabilities(cls) -> None:
        """Check that all required capability fields are set.

        Called at registration time. Raises ValueError with a clear
        message listing every missing field.
        """
        required = [
            "country_code", "currency", "default_locale",
            "supported_locales", "supported_regions", "tax_authority_name",
        ]
        missing = [f for f in required if not getattr(cls, f, None)]
        if missing:
            raise ValueError(
                f"CountryPack '{cls.__name__}' missing required capability fields: "
                f"{', '.join(missing)}. See docs/multi-country-naming.md."
            )
        # Consistency check with PayrollEngine's country attribute
        if getattr(cls, "country", "") and cls.country != cls.country_code:
            raise ValueError(
                f"CountryPack '{cls.__name__}' has inconsistent country codes: "
                f"country='{cls.country}', country_code='{cls.country_code}'. "
                f"Use country_code as the canonical value."
            )

    def supports_region(self, region_code: str) -> bool:
        """Check if this pack supports a specific ISO 3166-2 region."""
        target = (region_code or "").upper()
        return target in [r.upper() for r in self.supported_regions]

    def supports_locale(self, locale: str) -> bool:
        """Check if this pack supports a specific BCP 47 locale."""
        return locale in self.supported_locales
