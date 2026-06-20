from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
import uuid
import random
import string
import os
from datetime import datetime, timedelta, timezone

from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserOut
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
import secrets
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

_login_codes = {}

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    body: UserRegister,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    existing = result.scalar_one_or_none()
    if existing:
        # Allow resumption of incomplete signups: if the user never finished
        # verification AND never started a paid subscription, treat this as
        # them continuing where they left off. Update password + full_name,
        # return a fresh token, and let the frontend continue normally.
        sub_status = getattr(existing, "subscription_status", None) or ""
        is_complete = (
            existing.is_verified
            and sub_status in ("active", "trialing", "past_due")
        )
        if is_complete:
            raise HTTPException(
                status_code=400,
                detail="An account with this email already exists. Please log in instead.",
            )
        existing.full_name = body.full_name or existing.full_name
        existing.hashed_pw = hash_password(body.password)
        if getattr(body, "company", None):
            existing.company = body.company
        await db.commit()
        await db.refresh(existing)
        token = create_access_token(data={"sub": str(existing.id)})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": str(existing.id),
            "email": existing.email,
        }
    user = User(
        id=str(uuid.uuid4()),
        email=body.email.lower(),
        full_name=body.full_name,
        company=getattr(body, 'company', None),
        hashed_pw=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user_id":      str(user.id),
        "email":        user.email,
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    body: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_pw):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user_id":      str(user.id),
        "email":        user.email,
    }


@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "email":      current_user.email,
        "full_name":  current_user.full_name,
        "company":    current_user.company,
        "first_name": current_user.full_name.split()[0] if current_user.full_name else "",
    }


@router.patch("/profile")
async def update_profile(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if "full_name" in body:
        current_user.full_name = body["full_name"]
    if "company" in body:
        current_user.company = body["company"]
    if "first_name" in body:
        parts = (current_user.full_name or "").split()
        if parts:
            parts[0] = body["first_name"]
            current_user.full_name = " ".join(parts)
        else:
            current_user.full_name = body["first_name"]
    await db.commit()
    await db.refresh(current_user)
    return {
        "email":      current_user.email,
        "full_name":  current_user.full_name,
        "company":    current_user.company,
        "first_name": current_user.full_name.split()[0] if current_user.full_name else "",
    }


@router.post("/send-login-code")
async def send_login_code(
    data: dict,
    db: AsyncSession = Depends(get_db),
):
    email = data.get("email", "").lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return {"message": "If an account exists a code has been sent."}

    code = ''.join(random.choices(string.digits, k=6))
    _login_codes[email] = {
        "code":    code,
        "expires": datetime.utcnow() + timedelta(minutes=10)
    }

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail as SGMail
        sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
        message = SGMail(
            from_email='noreply@getnovala.com',
            to_emails=email,
            subject='Your Novala sign in code',
            html_content=f'''
<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0F1729;border-radius:16px;">
  <div style="text-align:center;margin-bottom:32px;">
    <span style="font-size:24px;font-weight:800;color:#ffffff;">No<span style="color:#00D4A4">vala</span></span>
  </div>
  <h2 style="color:#ffffff;font-size:20px;margin-bottom:8px;">Your Novala sign in code</h2>
  <p style="color:#64748B;font-size:14px;margin-bottom:28px;">Use this code to sign in to your Novala account. It expires in 10 minutes.</p>
  <div style="text-align:center;padding:24px;background:#162035;border-radius:12px;border:1px solid #1E2D4A;margin-bottom:28px;">
    <div style="font-size:40px;font-weight:800;color:#00D4A4;letter-spacing:0.3em;">{code}</div>
  </div>
  <p style="color:#64748B;font-size:12px;text-align:center;">If you did not request this code you can safely ignore this email.</p>
</div>'''
        )
        sg.send(message)
    except Exception as e:
        print(f"SendGrid error: {e}")
        raise HTTPException(status_code=500, detail="Could not send email. Please try again.")

    return {"message": "Code sent successfully."}


@router.post("/verify-login-code")
async def verify_login_code(
    data: dict,
    db: AsyncSession = Depends(get_db),
):
    email = data.get("email", "").lower().strip()
    code  = data.get("code",  "").strip()

    stored = _login_codes.get(email)
    if not stored:
        raise HTTPException(status_code=400, detail="No code found. Please request a new one.")

    if datetime.utcnow() > stored["expires"]:
        del _login_codes[email]
        raise HTTPException(status_code=400, detail="Code has expired. Please request a new one.")

    if stored["code"] != code:
        raise HTTPException(status_code=400, detail="Invalid code. Please try again.")

    del _login_codes[email]

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user_id":      str(user.id),
        "email":        user.email,
    }


@router.post("/forgot-password")
async def forgot_password(
    data: dict,
    db: AsyncSession = Depends(get_db),
):
    email = data.get("email", "").lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return {"message": "If an account exists a reset link has been sent."}

    token = ''.join(random.choices(string.ascii_letters + string.digits, k=48))
    expires_at = datetime.utcnow() + timedelta(hours=1)

    await db.execute(text('''
        DELETE FROM password_reset_tokens WHERE email = :email
    '''), {"email": email})

    await db.execute(text('''
        INSERT INTO password_reset_tokens (token, email, expires_at, used)
        VALUES (:token, :email, :expires_at, false)
    '''), {"token": token, "email": email, "expires_at": expires_at})

    await db.commit()

    reset_url = f"https://app.getnovala.com/reset-password?token={token}"

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail as SGMail
        sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
        message = SGMail(
            from_email='noreply@getnovala.com',
            to_emails=email,
            subject='Reset your Novala password',
            html_content=f'''
<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0F1729;border-radius:16px;">
  <div style="text-align:center;margin-bottom:32px;">
    <span style="font-size:24px;font-weight:800;color:#ffffff;">No<span style="color:#00D4A4">vala</span></span>
  </div>
  <h2 style="color:#ffffff;font-size:20px;margin-bottom:8px;">Reset your password</h2>
  <p style="color:#64748B;font-size:14px;margin-bottom:28px;">We received a request to reset your Novala password. Click the button below to create a new password. This link expires in 1 hour.</p>
  <div style="text-align:center;margin-bottom:28px;">
    <a href="{reset_url}" style="display:inline-block;padding:14px 32px;background:#00D4A4;color:#0F1729;text-decoration:none;border-radius:12px;font-size:15px;font-weight:700;">Reset my password</a>
  </div>
  <p style="color:#64748B;font-size:12px;text-align:center;">If you did not request a password reset you can safely ignore this email. Your password will not change.</p>
</div>'''
        )
        sg.send(message)
    except Exception as e:
        print(f"SendGrid error: {e}")
        raise HTTPException(status_code=500, detail="Could not send email. Please try again.")

    return {"message": "If an account exists a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(
    data: dict,
    db: AsyncSession = Depends(get_db),
):
    token        = data.get("token", "").strip()
    new_password = data.get("new_password", "").strip()

    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required.")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    result = await db.execute(text('''
        SELECT token, email, expires_at, used
        FROM password_reset_tokens
        WHERE token = :token
    '''), {"token": token})
    row = result.fetchone()

    if not row:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link. Please request a new one.")

    if row.used:
        raise HTTPException(status_code=400, detail="This reset link has already been used. Please request a new one.")

    if datetime.utcnow() > row.expires_at:
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")

    email = row.email

    await db.execute(text('''
        UPDATE password_reset_tokens SET used = true WHERE token = :token
    '''), {"token": token})

    user_result = await db.execute(select(User).where(User.email == email))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_pw = hash_password(new_password)
    await db.commit()

    return {"message": "Password updated successfully."}


@router.delete("/account")
async def delete_account(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete the current user account and cascade-delete all related rows."""
    user_id = current_user.id
    result = await db.execute(text("""
        SELECT tc.table_name AS tname, kcu.column_name AS cname
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'users'
    """))
    for row in result.fetchall():
        # delete user transactions first so the generic cascade can delete documents
        # without hitting transactions_document_id_fkey
        await db.execute(text("DELETE FROM transactions WHERE user_id = CAST(:uid AS UUID)"), {"uid": str(current_user.id)})
        await db.execute(
            text(f'DELETE FROM "{row.tname}" WHERE "{row.cname}" = :uid'),
            {"uid": user_id}
        )
    await db.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})
    await db.commit()
    return {"detail": "Account deleted successfully."}


def _send_verification_email(to_email, code):
    """Send a 6-digit verification code via the existing SendGrid setup."""
    import sendgrid
    from sendgrid.helpers.mail import Mail
    from app.core.config import settings
    sg = sendgrid.SendGridAPIClient(api_key=settings.sendgrid_api_key)
    msg = Mail(
        from_email="support@getnovala.com",
        to_emails=to_email,
        subject="Your Novala verification code",
        html_content=f"""
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0E1A1A;">
          <h2 style="margin: 0 0 12px;">Your Novala verification code</h2>
          <p style="color: #5B6B6B; margin: 0 0 18px;">Enter this code to verify your email and finish setting up your account.</p>
          <p style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0F9599; background: #F1F5F5; padding: 18px; text-align: center; border-radius: 12px; margin: 0 0 18px;">{code}</p>
          <p style="color: #9AA8A8; font-size: 13px; margin: 0;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
        </div>
        """
    )
    sg.send(msg)


class _VerifyCodeRequest(BaseModel):
    code: str


@router.post("/send-verification-code")
async def send_verification_code(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a 6-digit code, store it on the user with a 10-minute expiry, email it."""
    code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.execute(
        text("UPDATE users SET verification_code = :code, verification_code_expires_at = :exp WHERE id = :uid"),
        {"code": code, "exp": expires_at, "uid": current_user.id}
    )
    await db.commit()
    try:
        _send_verification_email(current_user.email, code)
    except Exception as e:
        import logging
        logging.error(f"[verify] failed to send email to {current_user.email}: {e}")
        raise HTTPException(status_code=500, detail="Could not send verification email. Please try again.")
    return {"detail": "Verification code sent.", "expires_in_seconds": 600}


@router.post("/verify-code")
async def verify_code(
    body: _VerifyCodeRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check the code, mark verified on success."""
    result = await db.execute(
        text("SELECT verification_code, verification_code_expires_at FROM users WHERE id = :uid"),
        {"uid": current_user.id}
    )
    row = result.fetchone()
    if not row or not row.verification_code:
        raise HTTPException(status_code=400, detail="No verification code on file. Request a new one.")
    if row.verification_code != body.code.strip():
        raise HTTPException(status_code=400, detail="Incorrect code.")
    expires_at = row.verification_code_expires_at
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="Code expired. Request a new one.")
    await db.execute(
        text("UPDATE users SET is_verified = TRUE, verification_code = NULL, verification_code_expires_at = NULL WHERE id = :uid"),
        {"uid": current_user.id}
    )
    await db.commit()
    return {"detail": "Verified.", "is_verified": True}


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    """Return the current user's account snapshot. Used by the frontend verification guard."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": getattr(current_user, "full_name", None),
        "is_verified": bool(getattr(current_user, "is_verified", False)),
        "onboarding_completed": bool(getattr(current_user, "onboarding_completed", False)),
        "subscription_status": getattr(current_user, "subscription_status", None)
    }
