"""API Versioning system for Novala.

Public API:
    from app.versioning import current_version, all_versions, VersionInfo

Register in main.py:
    app.add_middleware(APIVersionMiddleware)
"""
from app.versioning.versions import current_version, all_versions, VersionInfo, get_version_info
from app.versioning.middleware import APIVersionMiddleware

__all__ = ["current_version", "all_versions", "VersionInfo", "get_version_info", "APIVersionMiddleware"]
