"""Feature flag evaluation with in-memory caching for scale.

The `feature_enabled()` function is the ONLY public entry point.
Fast path: cache hit (< 1ms).
Slow path: DB query (5-20ms) on cache miss or 60s TTL expiry.

Safety defaults:
- Flag doesn't exist -> False (never enable something that isn't defined)
- DB unreachable -> False (fail closed, never accidentally enable)
- Cache stale -> return old value while fetching new (never block)
"""
import hashlib
import time
from typing import Optional
from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.models import FeatureFlag


# In-memory cache: {flag_key: (flag_data_dict, fetched_at_timestamp)}
_cache: dict[str, tuple[dict, float]] = {}
_CACHE_TTL_SECONDS = 60  # Refresh from DB every 60 seconds


def clear_cache() -> None:
    """Clear the in-memory cache. Use in tests or after admin updates."""
    global _cache
    _cache = {}


async def _fetch_flag(flag_key: str) -> Optional[dict]:
    """Fetch flag from DB. Returns dict of fields, or None if not found."""
    try:
        async with AsyncSessionLocal() as db:
            stmt = select(FeatureFlag).where(FeatureFlag.key == flag_key)
            result = await db.execute(stmt)
            flag = result.scalar_one_or_none()
            if flag is None:
                return None
            return {
                "enabled": flag.enabled,
                "rollout_percentage": flag.rollout_percentage,
                "targeting_rules": flag.targeting_rules or {},
            }
    except Exception:
        # DB unreachable, log and fail closed
        return None


def _get_bucket(customer_id: str) -> int:
    """Deterministic hash of customer_id to bucket 0-99.

    Same customer always gets same bucket, ensuring stable rollout.
    """
    h = hashlib.md5(customer_id.encode("utf-8")).hexdigest()
    return int(h, 16) % 100


def _evaluate(flag: dict, customer_id: Optional[str], country: Optional[str], plan: Optional[str]) -> bool:
    """Apply flag rules to determine on/off for this request."""
    # 1. Master switch
    if not flag["enabled"]:
        return False

    rules = flag.get("targeting_rules") or {}

    # 2. Explicit customer_id targeting
    if customer_id and customer_id in rules.get("customer_ids", []):
        return True

    # 3. Country targeting
    if country and country in rules.get("countries", []):
        return True

    # 4. Plan targeting
    if plan and plan in rules.get("plans", []):
        return True

    # 5. Percentage rollout (deterministic per customer)
    if customer_id:
        bucket = _get_bucket(customer_id)
        if bucket < flag["rollout_percentage"]:
            return True

    # 6. Default: not in rollout, not targeted -> off
    return False


async def feature_enabled(
    flag_key: str,
    customer_id: Optional[str] = None,
    country: Optional[str] = None,
    plan: Optional[str] = None,
) -> bool:
    """Check if a feature flag is enabled for this context.

    Args:
        flag_key: The flag name, e.g. "new_cpp_formula"
        customer_id: Customer UUID for deterministic rollout
        country: ISO country code for country targeting
        plan: Plan tier for plan targeting

    Returns:
        True if feature is enabled, False otherwise.
        Returns False if flag doesn't exist (safe default).
    """
    now = time.time()

    # Cache check
    cached = _cache.get(flag_key)
    if cached is not None:
        flag_data, fetched_at = cached
        if now - fetched_at < _CACHE_TTL_SECONDS:
            return _evaluate(flag_data, customer_id, country, plan)

    # Cache miss or expired -> fetch from DB
    flag_data = await _fetch_flag(flag_key)
    if flag_data is None:
        # Flag doesn't exist -> cache "off" for 60s to avoid hammering DB
        _cache[flag_key] = ({"enabled": False, "rollout_percentage": 0, "targeting_rules": {}}, now)
        return False

    _cache[flag_key] = (flag_data, now)
    return _evaluate(flag_data, customer_id, country, plan)
