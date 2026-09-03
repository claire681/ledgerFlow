"""APIVersionMiddleware - adds version headers to every response.

Headers added:
    X-API-Version: v1 (which version this endpoint belongs to)
    X-API-Current-Version: v1 (which is the recommended current)
    X-API-Deprecated: true (only if this version deprecated)
    X-API-Sunset-Date: 2027-01-01 (only if deprecated)

Also logs usage for analytics (which customers use which versions).
"""
import logging
import re
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.versioning.versions import current_version, get_version_info


logger = logging.getLogger("novala.versioning")

_VERSION_PATTERN = re.compile(r"^/api/(v\d+)/")


class APIVersionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # Extract version from URL path
        match = _VERSION_PATTERN.match(request.url.path)
        if not match:
            return response  # Non-API endpoint, skip

        endpoint_version = match.group(1)  # "v1", "v2", etc.
        current = current_version()

        # Add version headers
        response.headers["X-API-Version"] = endpoint_version
        response.headers["X-API-Current-Version"] = current.version

        # Deprecation warnings
        version_info = get_version_info(endpoint_version)
        if version_info and version_info.deprecated:
            response.headers["X-API-Deprecated"] = "true"
            if version_info.sunset_date:
                response.headers["X-API-Sunset-Date"] = version_info.sunset_date.isoformat()
            # Log deprecated usage for analytics
            logger.warning(
                "deprecated_api_used",
                extra={
                    "version": endpoint_version,
                    "path": request.url.path,
                    "sunset_date": version_info.sunset_date.isoformat() if version_info.sunset_date else None,
                },
            )

        return response
