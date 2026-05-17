from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from app.core.config import settings
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import sendgrid
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition, ReplyTo
import base64

router = APIRouter(prefix="/followup", tags=["followup"])

class ScheduleFollowupBody(BaseModel):
    invoice_id:     Optional[str] = None
    document_id:    Optional[str] = None
    to_email:       str
    to_name:        Optional[str] = None
    amount:         Optional[float] = None
    invoice_number: Optional[str] = None
    due_date:       Optional[str] = None
    scheduled_at:   str
    message:        Optional[str] = None
    pdf_base64:     Optional[str] = None
    pdf_filename:   Optional[str] = None

@router.post("/schedule")
async def schedule_followup(
    body: ScheduleFollowupBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get company info
    result = await db.execute(
        text("SELECT company_name FROM company_profiles WHERE user_id = :uid"),
        {"uid": current_user.id}
    )
    row = result.mappings().first()
    company_name = row["company_name"] if row else current_user.email.split('@')[0]

    subject = f"Follow-up: Invoice {body.invoice_number or ''} — Payment Reminder"

    # Use custom message or default
    if body.message:
        body_text = body.message
    else:
        body_text = f"""Dear {body.to_name or 'Valued Client'},

I hope this message finds you well. This is a friendly reminder regarding your outstanding invoice.

Invoice Details:
- Invoice Number: {body.invoice_number or 'N/A'}
- Amount Due: ${body.amount or 'N/A'}
- Due Date: {body.due_date or 'N/A'}

Please find the invoice attached to this email for your reference.

Kindly process the payment at your earliest convenience. If you have already sent payment, please disregard this message.

Thank you for your continued business.

Best regards,
{company_name}"""

    scheduled_dt = datetime.fromisoformat(body.scheduled_at.replace('Z', '+00:00'))

    await db.execute(
        text("""
            INSERT INTO scheduled_emails
            (user_id, invoice_id, document_id, to_email, to_name, subject, body, scheduled_at, pdf_base64, pdf_filename)
            VALUES (:user_id, :invoice_id, :document_id, :to_email, :to_name, :subject, :body, :scheduled_at, :pdf_base64, :pdf_filename)
        """),
        {
            "user_id":      str(current_user.id),
            "invoice_id":   body.invoice_id,
            "document_id":  body.document_id,
            "to_email":     body.to_email,
            "to_name":      body.to_name,
            "subject":      subject,
            "body":         body_text,
            "scheduled_at": scheduled_dt,
            "pdf_base64":   body.pdf_base64,
            "pdf_filename": body.pdf_filename or f"Invoice_{body.invoice_number or 'invoice'}.pdf",
        }
    )
    await db.commit()
    return {"success": True, "scheduled_at": body.scheduled_at}

@router.get("/list")
async def list_followups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("""
            SELECT id, invoice_id, document_id, to_email, to_name,
                   subject, scheduled_at, sent_at, status, created_at
            FROM scheduled_emails
            WHERE user_id = :uid
            ORDER BY scheduled_at DESC
            LIMIT 20
        """),
        {"uid": current_user.id}
    )
    rows = result.mappings().all()
    return {"followups": [dict(r) for r in rows]}

@router.get("/status")
async def get_followup_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get follow-up status for all invoices and documents."""
    result = await db.execute(
        text("""
            SELECT invoice_id, document_id, status, scheduled_at, sent_at
            FROM scheduled_emails
            WHERE user_id = :uid
            ORDER BY created_at DESC
        """),
        {"uid": current_user.id}
    )
    rows = result.mappings().all()
    status_map = {}
    for r in rows:
        if r["invoice_id"]:
            key = f"invoice_{r['invoice_id']}"
            if key not in status_map:
                status_map[key] = {"status": r["status"], "scheduled_at": str(r["scheduled_at"]), "sent_at": str(r["sent_at"]) if r["sent_at"] else None}
        if r["document_id"]:
            key = f"document_{r['document_id']}"
            if key not in status_map:
                status_map[key] = {"status": r["status"], "scheduled_at": str(r["scheduled_at"]), "sent_at": str(r["sent_at"]) if r["sent_at"] else None}
    return {"status_map": status_map}

@router.delete("/{followup_id}")
async def cancel_followup(
    followup_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        text("DELETE FROM scheduled_emails WHERE id = :id AND user_id = :uid AND status = 'pending'"),
        {"id": followup_id, "uid": str(current_user.id)}
    )
    await db.commit()
    return {"success": True}

async def send_scheduled_emails(db: AsyncSession):
    """Called by scheduler every minute to send due emails."""
    try:
        now = datetime.utcnow()
        result = await db.execute(
            text("""
                SELECT * FROM scheduled_emails
                WHERE status = 'pending'
                AND scheduled_at <= :now
            """),
            {"now": now}
        )
        emails = result.mappings().all()

        for email in emails:
            try:
                # Get user info for reply-to
                user_result = await db.execute(
                    text("SELECT email, full_name FROM users WHERE id = :uid"),
                    {"uid": str(email["user_id"])}
                )
                user_row    = user_result.mappings().first()
                user_email  = user_row["email"]     if user_row else "support@getnovala.com"
                user_name   = user_row["full_name"] if user_row else "Novala"

                # Get company name
                company_result = await db.execute(
                    text("SELECT company_name FROM company_profiles WHERE user_id = :uid"),
                    {"uid": str(email["user_id"])}
                )
                company_row  = company_result.mappings().first()
                company_name = company_row["company_name"] if company_row else user_name

                sg  = sendgrid.SendGridAPIClient(api_key=settings.sendgrid_api_key)
                msg = Mail(
                    from_email = (f"invoices@getnovala.com", company_name),
                    to_emails  = email["to_email"],
                    subject    = email["subject"],
                    plain_text_content = email["body"],
                )
                msg.reply_to = ReplyTo(user_email, company_name)

                # Attach PDF if available
                if email.get("pdf_base64"):
                    attachment           = Attachment()
                    attachment.file_content = FileContent(email["pdf_base64"])
                    attachment.file_name    = FileName(email["pdf_filename"] or "invoice.pdf")
                    attachment.file_type    = FileType("application/pdf")
                    attachment.disposition  = Disposition("attachment")
                    msg.attachment          = attachment
                elif email.get("document_id"):
                    # Try to fetch from S3
                    try:
                        doc_result = await db.execute(
                            text("SELECT file_path, filename FROM documents WHERE id = :id"),
                            {"id": str(email["document_id"])}
                        )
                        doc_row = doc_result.mappings().first()
                        if doc_row and doc_row["file_path"]:
                            from app.services.s3_service import download_file_from_s3
                            file_bytes           = download_file_from_s3(doc_row["file_path"])
                            attachment           = Attachment()
                            attachment.file_content = FileContent(base64.b64encode(file_bytes).decode())
                            attachment.file_name    = FileName(doc_row["filename"] or "document.pdf")
                            attachment.file_type    = FileType("application/pdf")
                            attachment.disposition  = Disposition("attachment")
                            msg.attachment          = attachment
                    except Exception as e:
                        print(f"Could not attach document: {e}")

                sg.send(msg)

                await db.execute(
                    text("UPDATE scheduled_emails SET status = 'sent', sent_at = :now WHERE id = :id"),
                    {"now": now, "id": str(email["id"])}
                )
                await db.commit()
                print(f"[FollowUp] Sent to {email['to_email']}")

            except Exception as e:
                import traceback
                print(f"[FollowUp] Failed {email['id']}: {traceback.format_exc()}")
                await db.execute(
                    text("UPDATE scheduled_emails SET status = 'failed' WHERE id = :id"),
                    {"id": str(email["id"])}
                )
                await db.commit()
    except Exception as e:
        import traceback
        print(f"[FollowUp] Scheduler error: {traceback.format_exc()}")
