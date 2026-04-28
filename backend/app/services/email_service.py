
import traceback
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, To, From

from app.core.config import settings

SENDGRID_API_KEY   = settings.sendgrid_api_key
SENDGRID_FROM      = settings.sendgrid_from_email
SENDGRID_FROM_NAME = settings.sendgrid_from_name

def build_base_template(title: str, body_html: str) -> str:
    """Wraps any email content in a clean professional LedgerFlow template."""
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#F0FDF9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0AB98A 0%,#0EA5E9 100%);padding:32px 40px;">
              <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
                ⚡ LedgerFlow
              </div>
              <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">
                AI-Powered Financial Intelligence
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              {body_html}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #E2E8F0;background:#F8FAFC;">
              <div style="font-size:11px;color:#94A3B8;text-align:center;line-height:1.6;">
                You are receiving this email from LedgerFlow.<br/>
                This is an automated message — please do not reply directly to this email.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


async def send_email(
    to_email: str,
    subject:  str,
    body_html: str,
    to_name:   str = "",
) -> dict:
    """
    Central email sender. All email sending in LedgerFlow goes through this.
    Returns { success: bool, message: str }
    """
    if not SENDGRID_API_KEY:
        return {
            "success": False,
            "message": "SendGrid API key is not configured. Add SENDGRID_API_KEY to your .env file.",
        }

    try:
        html_content = build_base_template(subject, body_html)

        message = Mail(
            from_email   = From(SENDGRID_FROM, SENDGRID_FROM_NAME),
            to_emails    = To(to_email, to_name),
            subject      = subject,
            html_content = html_content,
        )

        sg  = SendGridAPIClient(SENDGRID_API_KEY)
        res = sg.send(message)

        if res.status_code in (200, 201, 202):
            return {
                "success": True,
                "message": f"Email sent successfully to {to_email}",
            }
        else:
            return {
                "success": False,
                "message": f"SendGrid returned status {res.status_code}",
            }

    except Exception as e:
        print(f"email_service error: {traceback.format_exc()}")
        return {
            "success": False,
            "message": f"Email failed: {str(e)}",
        }


async def send_test_email(to_email: str, to_name: str = "") -> dict:
    """Sends a test email to verify the integration is working."""
    body = """
    <h2 style="color:#0AB98A;font-size:22px;margin:0 0 16px;">
      ✅ Email Integration Working
    </h2>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
      Your LedgerFlow email integration is connected and working correctly.
      You will now receive:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;">
          <span style="color:#0AB98A;font-weight:600;">✓</span>
          <span style="color:#374151;font-size:14px;margin-left:8px;">Daily AI financial briefings</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;">
          <span style="color:#0AB98A;font-weight:600;">✓</span>
          <span style="color:#374151;font-size:14px;margin-left:8px;">Invoice payment notifications</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;">
          <span style="color:#0AB98A;font-weight:600;">✓</span>
          <span style="color:#374151;font-size:14px;margin-left:8px;">Budget alerts and warnings</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;">
          <span style="color:#0AB98A;font-weight:600;">✓</span>
          <span style="color:#374151;font-size:14px;margin-left:8px;">Overdue invoice reminders</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#0AB98A;font-weight:600;">✓</span>
          <span style="color:#374151;font-size:14px;margin-left:8px;">Team member notifications</span>
        </td>
      </tr>
    </table>
    <div style="margin-top:28px;padding:16px;background:#F0FDF9;border-radius:10px;border:1px solid #D1FAE5;">
      <div style="font-size:13px;color:#065F46;font-weight:600;">
        🚀 You are all set. LedgerFlow is now watching your finances.
      </div>
    </div>
    """
    return await send_email(
        to_email  = to_email,
        subject   = "✅ LedgerFlow — Email Integration Test",
        body_html = body,
        to_name   = to_name,
    )


async def send_invoice_email(
    to_email:       str,
    to_name:        str,
    invoice_number: str,
    amount:         float,
    currency:       str = "USD",
    due_date:       str = "",
    from_name:      str = "LedgerFlow",
) -> dict:
    """Sends an invoice notification email to a client."""
    body = f"""
    <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">
      Invoice {invoice_number}
    </h2>
    <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">
      from <strong style="color:#111827;">{from_name}</strong>
    </p>

    <div style="background:#F8FAFC;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #E2E8F0;">
      <div style="font-size:13px;color:#6B7280;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em;">Amount Due</div>
      <div style="font-size:36px;font-weight:700;color:#0AB98A;">{currency} {amount:,.2f}</div>
      {f'<div style="font-size:13px;color:#6B7280;margin-top:8px;">Due: {due_date}</div>' if due_date else ''}
    </div>

    <p style="color:#374151;font-size:14px;line-height:1.7;">
      Please review and process this invoice at your earliest convenience.
    </p>
    """
    return await send_email(
        to_email  = to_email,
        subject   = f"Invoice {invoice_number} — {currency} {amount:,.2f}",
        body_html = body,
        to_name   = to_name,
    )


async def send_overdue_reminder(
    to_email:       str,
    to_name:        str,
    invoice_number: str,
    amount:         float,
    days_overdue:   int,
    currency:       str = "USD",
) -> dict:
    """Sends an overdue invoice reminder."""
    body = f"""
    <h2 style="color:#EF4444;font-size:20px;margin:0 0 16px;">
      ⚠️ Payment Overdue — {invoice_number}
    </h2>

    <div style="background:#FEF2F2;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #FECACA;">
      <div style="font-size:13px;color:#991B1B;margin-bottom:8px;">Outstanding Amount</div>
      <div style="font-size:32px;font-weight:700;color:#EF4444;">{currency} {amount:,.2f}</div>
      <div style="font-size:13px;color:#991B1B;margin-top:8px;">{days_overdue} days overdue</div>
    </div>

    <p style="color:#374151;font-size:14px;line-height:1.7;">
      This invoice is now <strong>{days_overdue} days past due</strong>.
      Please arrange payment as soon as possible to avoid any interruption to services.
    </p>
    """
    return await send_email(
        to_email  = to_email,
        subject   = f"⚠️ Payment Overdue — Invoice {invoice_number}",
        body_html = body,
        to_name   = to_name,
    )


async def send_budget_alert(
    to_email:    str,
    to_name:     str,
    category:    str,
    spent:       float,
    limit:       float,
    percentage:  float,
    currency:    str = "USD",
) -> dict:
    """Sends a budget alert when spending threshold is reached."""
    color  = "#EF4444" if percentage >= 100 else "#F59E0B"
    label  = "Exceeded" if percentage >= 100 else "Warning"
    emoji  = "🚨" if percentage >= 100 else "⚠️"

    body = f"""
    <h2 style="color:{color};font-size:20px;margin:0 0 16px;">
      {emoji} Budget {label} — {category}
    </h2>

    <div style="background:#F8FAFC;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #E2E8F0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <span style="font-size:13px;color:#6B7280;">Spent</span>
        <span style="font-size:15px;font-weight:700;color:{color};">{currency} {spent:,.2f}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
        <span style="font-size:13px;color:#6B7280;">Budget Limit</span>
        <span style="font-size:15px;font-weight:600;color:#111827;">{currency} {limit:,.2f}</span>
      </div>
      <div style="background:#E2E8F0;border-radius:99px;height:8px;overflow:hidden;">
        <div style="width:{min(percentage, 100):.0f}%;height:100%;background:{color};border-radius:99px;"></div>
      </div>
      <div style="font-size:12px;color:{color};margin-top:8px;font-weight:600;">
        {percentage:.0f}% of budget used
      </div>
    </div>

    <p style="color:#374151;font-size:14px;line-height:1.7;">
      Your <strong>{category}</strong> spending has reached {percentage:.0f}% of your monthly budget.
      Log in to LedgerFlow to review your expenses.
    </p>
    """
    return await send_email(
        to_email  = to_email,
        subject   = f"{emoji} Budget {label} — {category} at {percentage:.0f}%",
        body_html = body,
        to_name   = to_name,
    )