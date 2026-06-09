"""Tests for the engine registry."""
from app.payroll.registry import get_engine, is_supported, ENGINE_REGISTRY
from app.payroll.engines.canada import CanadaPayrollEngine
from app.payroll.engines.uk import UKPayrollEngine
from app.payroll.engines.australia import AustraliaPayrollEngine
from app.payroll.engines.usa import USAPayrollEngine
from app.payroll.engines.ireland import IrelandPayrollEngine

import pytest


def test_all_5_countries_registered():
    """Every supported country has an engine."""
    for code in ["CA", "GB", "AU", "US", "IE"]:
        engine = get_engine(code)
        assert engine is not None


def test_get_engine_types():
    """Each country returns the right engine type."""
    assert isinstance(get_engine("CA"), CanadaPayrollEngine)
    assert isinstance(get_engine("GB"), UKPayrollEngine)
    assert isinstance(get_engine("UK"), UKPayrollEngine)  # alias
    assert isinstance(get_engine("AU"), AustraliaPayrollEngine)
    assert isinstance(get_engine("US"), USAPayrollEngine)
    assert isinstance(get_engine("IE"), IrelandPayrollEngine)


def test_lowercase_normalizes():
    """Lowercase country codes still work."""
    assert isinstance(get_engine("ca"), CanadaPayrollEngine)


def test_unsupported_raises():
    """Unknown country raises ValueError with a helpful message."""
    with pytest.raises(ValueError) as exc_info:
        get_engine("XX")
    assert "XX" in str(exc_info.value)
    assert "Supported" in str(exc_info.value)


def test_is_supported():
    assert is_supported("CA") is True
    assert is_supported("XX") is False
    assert is_supported("") is False
