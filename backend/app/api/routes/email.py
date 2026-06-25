"""Email sending route. Lets the logged-in user send an email to anyone
(e.g., an employee) from inside Novala, using SendGrid. The recipient sees the
user's company name as the sender, replies go to the user, and every send is
logged for the audit trail."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
import logging
from datetime import datetime, timezone
import uuid

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User, CompanyProfile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/email", tags=["Email"])

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail, Email as SgEmail, To, ReplyTo, Content
    HAS_SENDGRID = True
except ImportError:
    HAS_SENDGRID = False


class EmailSendRequest(BaseModel):
    to_email: EmailStr
    to_name: Optional[str] = None
    subject: str
    body: str


class EmailSendResponse(BaseModel):
    ok: bool
    message: str


def _safe_company_name(name: Optional[str]) -> str:
    cleaned = (name or "").strip()
    return cleaned if cleaned else "Your company"


@router.post("/send", response_model=EmailSendResponse)
async def send_email(
    payload: EmailSendRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not HAS_SENDGRID:
        raise HTTPException(status_code=503, detail="Email service is not configured")
    api_key = os.getenv("SENDGRID_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Email service is not configured")

    # Find the company name for the From header
    result = await db.execute(
        select(CompanyProfile).where(CompanyProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    company_name = _safe_company_name(profile.company_name if profile else None)

    sender_name = current_user.full_name or current_user.email
    sender_email_for_reply = current_user.email

    from_email_addr = os.getenv("SENDGRID_FROM_EMAIL", "noreply@getnovala.com")
    from_display = f"{company_name} via Novala"

    footer = (
        f"\n\n---\nSent by {sender_name} at {company_name} via Novala. "
        f"Reply to this email to reach {sender_name} directly."
    )
    full_body = payload.body.rstrip() + footer

    try:
        mail = Mail(
            from_email=SgEmail(from_email_addr, from_display),
            to_emails=To(payload.to_email, payload.to_name),
            subject=payload.subject,
            plain_text_content=Content("text/plain", full_body),
        )
        mail.reply_to = ReplyTo(sender_email_for_reply, sender_name)

        sg = SendGridAPIClient(api_key)
        resp = sg.send(mail)
        if resp.status_code >= 300:
            logger.warning(f"SendGrid returned {resp.status_code}: {resp.body}")
            raise HTTPException(status_code=502, detail=f"SendGrid rejected the email (status {resp.status_code})")
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception("SendGrid send failed")
        raise HTTPException(status_code=502, detail=f"Could not send email: {ex}")

    # Audit log
    try:
        from sqlalchemy import text
        await db.execute(text("""
            INSERT INTO sent_emails (
                id, sender_user_id, sender_email, sender_company_name,
                recipient_email, recipient_name, subject, body, sent_at
            ) VALUES (
                :id, :uid, :sem, :cn, :re, :rn, :sub, :bd, :ts
            )
        """), {
            "id": str(uuid.uuid4()),
            "uid": str(current_user.id),
            "sem": current_user.email,
            "cn": company_name,
            "re": payload.to_email,
            "rn": payload.to_name or "",
            "sub": payload.subject,
            "bd": full_body,
            "ts": datetime.now(timezone.utc),
        })
        await db.commit()
    except Exception as ex:
        # Audit failure should not break the user's send. Log and move on.
        logger.warning(f"sent_emails audit insert failed: {ex}")
        await db.rollback()

    return EmailSendResponse(ok=True, message="Email sent")
