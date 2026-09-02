"""Unit tests for feature flag evaluation logic.

Tests the pure _evaluate() and _get_bucket() functions without hitting DB.
"""
import pytest
from app.features.flags import _evaluate, _get_bucket


# --- _get_bucket tests -----------------------------------------------

def test_bucket_is_deterministic():
    """Same customer_id always returns same bucket."""
    assert _get_bucket("customer-abc") == _get_bucket("customer-abc")
    assert _get_bucket("customer-xyz") == _get_bucket("customer-xyz")


def test_bucket_is_in_range():
    """Bucket must be 0-99."""
    for i in range(100):
        bucket = _get_bucket(f"customer-{i}")
        assert 0 <= bucket < 100


def test_bucket_distribution_is_uniform():
    """1000 customers should spread across buckets fairly evenly."""
    buckets = [_get_bucket(f"customer-{i}") for i in range(1000)]
    # Expect ~10 per bucket, allow variance
    for target in range(0, 100, 10):
        in_range = sum(1 for b in buckets if target <= b < target + 10)
        assert 60 < in_range < 140, f"bucket {target}-{target+10}: {in_range}"


# --- _evaluate tests -------------------------------------------------

def test_disabled_flag_returns_false():
    """enabled=False always returns False, regardless of anything else."""
    flag = {"enabled": False, "rollout_percentage": 100, "targeting_rules": {"customer_ids": ["c1"]}}
    assert _evaluate(flag, customer_id="c1", country="CA", plan="pro") is False


def test_customer_id_targeting():
    """Customer explicitly in targeting_rules gets True."""
    flag = {"enabled": True, "rollout_percentage": 0, "targeting_rules": {"customer_ids": ["special-c1"]}}
    assert _evaluate(flag, customer_id="special-c1", country=None, plan=None) is True
    assert _evaluate(flag, customer_id="other-c2", country=None, plan=None) is False


def test_country_targeting():
    """Customer in targeted country gets True."""
    flag = {"enabled": True, "rollout_percentage": 0, "targeting_rules": {"countries": ["CA", "US"]}}
    assert _evaluate(flag, customer_id="c1", country="CA", plan=None) is True
    assert _evaluate(flag, customer_id="c1", country="US", plan=None) is True
    assert _evaluate(flag, customer_id="c1", country="GB", plan=None) is False


def test_plan_targeting():
    """Customer on targeted plan gets True."""
    flag = {"enabled": True, "rollout_percentage": 0, "targeting_rules": {"plans": ["pro", "business"]}}
    assert _evaluate(flag, customer_id="c1", country=None, plan="pro") is True
    assert _evaluate(flag, customer_id="c1", country=None, plan="business") is True
    assert _evaluate(flag, customer_id="c1", country=None, plan="free") is False


def test_percentage_rollout_0_never_enables():
    """rollout_percentage=0 means off for everyone (unless targeted)."""
    flag = {"enabled": True, "rollout_percentage": 0, "targeting_rules": {}}
    for i in range(100):
        assert _evaluate(flag, customer_id=f"c{i}", country=None, plan=None) is False


def test_percentage_rollout_100_always_enables():
    """rollout_percentage=100 means on for everyone with a customer_id."""
    flag = {"enabled": True, "rollout_percentage": 100, "targeting_rules": {}}
    for i in range(100):
        assert _evaluate(flag, customer_id=f"c{i}", country=None, plan=None) is True


def test_percentage_rollout_50_enables_roughly_half():
    """rollout_percentage=50 should enable ~50% of customers."""
    flag = {"enabled": True, "rollout_percentage": 50, "targeting_rules": {}}
    enabled_count = sum(
        1 for i in range(1000)
        if _evaluate(flag, customer_id=f"c{i}", country=None, plan=None)
    )
    # Allow 45-55% variance
    assert 450 <= enabled_count <= 550, f"got {enabled_count}/1000"


def test_deterministic_evaluation():
    """Same inputs always return same result."""
    flag = {"enabled": True, "rollout_percentage": 50, "targeting_rules": {}}
    for i in range(100):
        cid = f"customer-{i}"
        result1 = _evaluate(flag, customer_id=cid, country=None, plan=None)
        result2 = _evaluate(flag, customer_id=cid, country=None, plan=None)
        assert result1 == result2


def test_targeting_beats_rollout():
    """Targeted customer gets True even at 0% rollout."""
    flag = {"enabled": True, "rollout_percentage": 0, "targeting_rules": {"customer_ids": ["c1"]}}
    assert _evaluate(flag, customer_id="c1", country=None, plan=None) is True


def test_no_customer_id_falls_through_percentage():
    """Without customer_id, percentage rollout can't apply (no bucket)."""
    flag = {"enabled": True, "rollout_percentage": 100, "targeting_rules": {}}
    assert _evaluate(flag, customer_id=None, country=None, plan=None) is False


def test_empty_targeting_rules():
    """Missing/empty targeting_rules should not crash."""
    flag = {"enabled": True, "rollout_percentage": 100, "targeting_rules": {}}
    assert _evaluate(flag, customer_id="c1", country=None, plan=None) is True
