"""Feedback endpoint: receives in-app feedback, logs to journalctl, attempts SendGrid delivery."""
import os, logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.core.security import get_current_user

logger = logging.getLogger("novala.feedback")
router = APIRouter()

class FeedbackPayload(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    page_context: Optional[str] = None
    attachment_filename: Optional[str] = None

@router.post("/feedback")
async def submit_feedback(payload: FeedbackPayload, current_user = Depends(get_current_user)):
    from_user_email = getattr(current_user, "email", "unknown")

    logger.info(
        "[FEEDBACK] from=%s page=%s attachment=%s msg=%r",
        from_user_email, payload.page_context or "unknown",
        payload.attachment_filename or "none", payload.message[:500]
    )

    api_key = os.environ.get("SENDGRID_API_KEY")
    if api_key:
        to_email = os.environ.get("FEEDBACK_TO_EMAIL", "kemaclaire01@gmail.com")
        from_email = os.environ.get("SENDGRID_FROM_EMAIL", "noreply@getnovala.com")
        body = (
            f"New feedback received in Novala.\n\n"
            f"From: {from_user_email}\n"
            f"Page/source: {payload.page_context or 'unknown'}\n"
            f"Attachment (filename only — upload pipeline not yet wired): {payload.attachment_filename or 'none'}\n\n"
            f"Message:\n{payload.message}\n"
        )
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            msg = Mail(
                from_email=from_email,
                to_emails=to_email,
                subject=f"Novala feedback from {from_user_email}",
                plain_text_content=body,
            )
            SendGridAPIClient(api_key).send(msg)
            logger.info("[FEEDBACK] email sent")
        except Exception as e:
            logger.warning("[FEEDBACK] email send failed (logged but not delivered): %s", e)
    else:
        logger.info("[FEEDBACK] SENDGRID_API_KEY not set; only logged")

    return {"success": True}
