"""Provider router - picks the right payment provider based on country/customer.

Uses a registry pattern. Adding a new provider = adding to the registry.
"""
from typing import Optional
from app.providers.base import PaymentProvider


# Registry: country ISO code -> list of providers that support it
# First provider in list is default for that country
_REGISTRY: dict[str, list[PaymentProvider]] = {}


def register_provider(provider: PaymentProvider) -> None:
    """Register a provider for its supported countries."""
    for country in provider.supported_countries:
        _REGISTRY.setdefault(country, []).append(provider)


def get_provider(country: str, provider_name: Optional[str] = None) -> PaymentProvider:
    """Get the payment provider for a country.

    Args:
        country: ISO 3166 country code (e.g. "CA")
        provider_name: Optional - request specific provider (e.g. "stripe" for US)

    Returns:
        PaymentProvider instance

    Raises:
        ValueError: if no provider supports this country / provider not found
    """
    country = country.upper()
    providers = _REGISTRY.get(country, [])

    if not providers:
        raise ValueError(f"No payment provider registered for country: {country}")

    if provider_name is None:
        return providers[0]  # default

    for p in providers:
        if p.name == provider_name:
            return p

    raise ValueError(
        f"Provider '{provider_name}' not registered for {country}. "
        f"Available: {[p.name for p in providers]}"
    )


def list_providers(country: Optional[str] = None) -> dict[str, list[str]]:
    """List all registered providers, optionally filtered by country."""
    if country:
        return {country.upper(): [p.name for p in _REGISTRY.get(country.upper(), [])]}
    return {c: [p.name for p in providers] for c, providers in _REGISTRY.items()}
