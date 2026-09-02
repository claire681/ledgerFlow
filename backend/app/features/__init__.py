"""Feature flag system for Novala.

Public API:
    from app.features import feature_enabled

Usage:
    if await feature_enabled("new_cpp_formula", customer_id=customer.id):
        # new code
    else:
        # old code
"""
from app.features.flags import feature_enabled, clear_cache

__all__ = ["feature_enabled", "clear_cache"]
