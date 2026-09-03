# Novala API Versioning

Purpose: Change API safely without breaking existing customers.

Current version: v1 at /api/v1/

## For Integrators

Check version status: GET /api/versions

Every response includes headers:
- X-API-Version (which version)
- X-API-Current-Version (recommended)
- X-API-Deprecated: true (only if deprecated)
- X-API-Sunset-Date (only if sunset scheduled)

## Sunset Policy

- v1 supported minimum 12 months after v2 released
- Sunset date announced 6 months in advance minimum
- Emergency: security bug can force 30-day sunset

## Breaking vs Non-Breaking Changes

BREAKING (needs v2):
- Renaming/removing fields
- Changing field types
- Making optional fields required
- Removing endpoints
- Changing status codes

NON-BREAKING (stays on v1):
- Adding optional fields
- Adding new endpoints
- Bug fixes

## Releasing v2 (when ready)

1. Copy router file to v2 version
2. Register at /api/v2/ in main.py
3. Update app/versioning/versions.py registry
4. Announce deprecation to customers 6+ months before sunset

Owner: Claire (Founder)
Last updated: Phase 1
