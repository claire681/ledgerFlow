"""Audit log helper.

Simple helper to record audit events from any endpoint. Country-agnostic.
Used by paycheque void/adjust, form archival, settings changes, etc.
"""
from uuid import uuid4, UUID
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import AuditEvent


async def log_event(
    db: AsyncSession,
    user_id: UUID,
    event_type: str,
    entity_type: str,
    action: str,
    entity_id: Optional[UUID] = None,
    actor_user_id: Optional[UUID] = None,
    details: Optional[Dict[str, Any]] = None,
    commit: bool = False,
) -> AuditEvent:
    """Insert an audit event row.
    
    Args:
      user_id: Whose account this event belongs to (for multi-tenancy filter)
      event_type: Dotted string like "paycheque.void", "form.archive"
      entity_type: "paycheque", "form", "employee", "company_profile", etc
      action: "create", "update", "void", "delete", "archive", "mark_paid"
      entity_id: Optional. The affected record's ID
      actor_user_id: Who performed it (usually current_user.id). Defaults to user_id.
      details: JSONB blob for context (reason, before/after, amounts, etc)
      commit: If True, commit the transaction. Default False (caller commits).
    
    Returns the inserted AuditEvent (unrefreshed).
    """
    if actor_user_id is None:
        actor_user_id = user_id
    
    event = AuditEvent(
        id=uuid4(),
        user_id=user_id,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        actor_user_id=actor_user_id,
        action=action,
        details=details or {},
    )
    db.add(event)
    if commit:
        await db.commit()
    return event
