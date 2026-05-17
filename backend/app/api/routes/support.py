from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
import sendgrid
from sendgrid.helpers.mail import Mail

router = APIRouter(prefix="/support", tags=["support"])

@router.post("/send")
async def send_support(
    request: Request,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        body       = await request.json()
        category   = body.get("category", "General")
        subject    = body.get("subject", "")
        message    = body.get("message", "")
        user_email = body.get("user_email", current_user.email)

        sg  = sendgrid.SendGridAPIClient(api_key=settings.sendgrid_api_key)
        msg = Mail(
            from_email   = "support@getnovala.com",
            to_emails    = "novala.support@gmail.com",
            subject      = f"[Novala Support] [{category}] {subject}",
            html_content = f"""
            <h2>New Support Request</h2>
            <p><strong>From:</strong> {user_email}</p>
            <p><strong>Category:</strong> {category}</p>
            <p><strong>Subject:</strong> {subject}</p>
            <hr/>
            <p>{message.replace(chr(10), '<br/>')}</p>
            """,
        )
        msg.reply_to = user_email
        sg.send(msg)
        return {"success": True}
    except Exception as e:
        print(f"Support send error: {e}")
        return {"success": False, "error": str(e)}
