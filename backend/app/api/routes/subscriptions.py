import uuid
"""Subscription endpoints (PayPal)."""
from datetime import datetime, timezone, timedelta
from typing import Optional
import json
import os

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Subscription
from app.services import paypal_service

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


class PlanOut(BaseModel):
    slug: str
    name: str
    price_usd: float
    plan_id: str


class PlansResponse(BaseModel):
    mode: str
    plans: list[PlanOut]


class ActivateRequest(BaseModel):
    subscription_id: str
    plan_slug: str


class SubscriptionOut(BaseModel):
    id: str
    plan_slug: str
    paypal_subscription_id: Optional[str] = None
    paypal_plan_id: Optional[str] = None
    status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    last_payment_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None


def _parse_dt(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


def _sub_to_out(sub):
    return SubscriptionOut(
        id=str(sub.id),
        plan_slug=sub.plan_slug,
        paypal_subscription_id=sub.paypal_subscription_id,
        paypal_plan_id=sub.paypal_plan_id,
        status=sub.status,
        current_period_start=sub.current_period_start,
        current_period_end=sub.current_period_end,
        last_payment_at=sub.last_payment_at,
        cancelled_at=sub.cancelled_at,
    )


@router.get("/plans", response_model=PlansResponse)
async def list_plans():
    """List available subscription plans. Public endpoint."""
    try:
        config = paypal_service.get_plans_config()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    plans = [
        PlanOut(slug=slug, name=info["name"], price_usd=info["price_usd"], plan_id=info["plan_id"])
        for slug, info in config.get("plans", {}).items()
    ]
    return PlansResponse(mode=config.get("mode", "sandbox"), plans=plans)


@router.post("/activate", response_model=SubscriptionOut)
async def activate_subscription(
    body: ActivateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Activate a subscription after PayPal approval."""
    pp = await paypal_service.get_subscription(body.subscription_id)
    if pp["status"] != 200:
        raise HTTPException(status_code=400, detail=f"PayPal verification failed: HTTP {pp['status']}")
    sub_data = pp["body"]
    paypal_status = sub_data.get("status", "UNKNOWN")
    paypal_plan_id = sub_data.get("plan_id")
    try:
        config = paypal_service.get_plans_config()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    known_plan = config.get("plans", {}).get(body.plan_slug)
    if not known_plan:
        raise HTTPException(status_code=400, detail=f"Unknown plan_slug: {body.plan_slug}")
    if paypal_plan_id and paypal_plan_id != known_plan["plan_id"]:
        raise HTTPException(status_code=400, detail=f"plan_id mismatch: PayPal={paypal_plan_id}, expected={known_plan['plan_id']}")
    existing_q = await db.execute(select(Subscription).where(Subscription.paypal_subscription_id == body.subscription_id))
    sub = existing_q.scalar_one_or_none()
    billing_info = sub_data.get("billing_info", {}) or {}
    start_time = _parse_dt(sub_data.get("start_time"))
    next_billing = _parse_dt(billing_info.get("next_billing_time"))
    last_payment = _parse_dt((billing_info.get("last_payment") or {}).get("time"))
    if sub:
        sub.status = paypal_status
        sub.paypal_plan_id = paypal_plan_id or known_plan["plan_id"]
        sub.plan_slug = body.plan_slug
        if start_time:
            sub.current_period_start = start_time
        if next_billing:
            sub.current_period_end = next_billing
        if last_payment:
            sub.last_payment_at = last_payment
    else:
        sub = Subscription(
            user_id=current_user.id,
            paypal_subscription_id=body.subscription_id,
            paypal_plan_id=paypal_plan_id or known_plan["plan_id"],
            plan_slug=body.plan_slug,
            status=paypal_status,
            current_period_start=start_time,
            current_period_end=next_billing,
            last_payment_at=last_payment,
        )
        db.add(sub)
    if paypal_status in ("ACTIVE", "APPROVED"):
        current_user.plan = body.plan_slug
        # Mark trial state. next_billing_time = first real charge date (end of
        # trial). Fall back to now+14d if PayPal didn't provide it.
        # users.trial_ends_at is TIMESTAMP WITHOUT TIME ZONE, so strip tzinfo.
        trial_end = next_billing or (datetime.now(timezone.utc) + timedelta(days=14))
        if trial_end.tzinfo is not None:
            trial_end = trial_end.astimezone(timezone.utc).replace(tzinfo=None)
        await db.execute(
            text(
                "UPDATE users SET subscription_status = 'trialing', "
                "trial_ends_at = :te WHERE id = :uid"
            ),
            {"te": trial_end, "uid": str(current_user.id)},
        )

        # Schedule a trial-ending reminder email 3 days before trial ends.
        # The followup scheduler polls scheduled_emails and sends via SendGrid.
        try:
            reminder_at = trial_end - timedelta(days=3)
            reminder_at_tz = reminder_at.replace(tzinfo=timezone.utc)
            now_tz = datetime.now(timezone.utc)

            if reminder_at_tz > now_tz:
                slug_parts = body.plan_slug.split("_payroll_")
                if len(slug_parts) == 2:
                    pretty_name = f"{slug_parts[0].title()} + Payroll {slug_parts[1].title()}"
                else:
                    pretty_name = body.plan_slug.title()

                price = float(known_plan.get("price_usd", 0.0))
                first_name = (current_user.full_name or "").split(" ")[0] or "there"
                trial_end_str = trial_end.strftime("%B %d, %Y")

                subject_line = "Your Novala trial ends in 3 days"
                body_text = (
                    f"Hi {first_name},\n\n"
                    f"This is a heads up that your Novala free trial ends on "
                    f"{trial_end_str}, in 3 days.\n\n"
                    f"On that date, your {pretty_name} subscription will renew "
                    f"automatically at ${price:.2f}/month, billed to the payment "
                    f"method on file.\n\n"
                    f"If you would like to continue, no action is needed.\n"
                    f"To cancel before being charged, visit your billing "
                    f"settings at https://app.getnovala.com/billing.\n\n"
                    f"Thanks for trying Novala.\n\n"
                    f"The Novala team"
                )

                await db.execute(
                    text(
                        "INSERT INTO scheduled_emails "
                        "(id, user_id, to_email, to_name, subject, body, "
                        "scheduled_at, status, created_at) "
                        "VALUES (:id, :uid, :em, :nm, :sub, :bd, :sa, "
                        "'pending', NOW())"
                    ),
                    {
                        "id": str(uuid.uuid4()),
                        "uid": str(current_user.id),
                        "em": current_user.email,
                        "nm": current_user.full_name or "",
                        "sub": subject_line,
                        "bd": body_text,
                        "sa": reminder_at_tz,
                    },
                )
        except Exception as _e:
            print(f"[activate] failed to schedule trial reminder: {_e}")

    await db.commit()
    await db.refresh(sub)
    return _sub_to_out(sub)


@router.get("/me", response_model=Optional[SubscriptionOut])
async def get_my_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current user's most recent subscription, or null if none."""
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
        .limit(1)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return None
    return _sub_to_out(sub)


@router.post("/cancel", response_model=SubscriptionOut)
async def cancel_my_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel the current user's active subscription via PayPal."""
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == current_user.id)
        .where(Subscription.status.in_(["ACTIVE", "APPROVAL_PENDING", "APPROVED"]))
        .order_by(Subscription.created_at.desc())
        .limit(1)
    )
    sub = result.scalar_one_or_none()
    if not sub or not sub.paypal_subscription_id:
        raise HTTPException(status_code=404, detail="No active subscription to cancel")
    pp = await paypal_service.cancel_subscription(sub.paypal_subscription_id, reason="User requested cancellation")
    if pp["status"] not in (200, 204):
        raise HTTPException(status_code=400, detail=f"PayPal cancellation failed: HTTP {pp['status']}: {pp['body']}")
    sub.status = "CANCELLED"
    sub.cancelled_at = datetime.now(timezone.utc)
    current_user.plan = "free"
    await db.commit()
    await db.refresh(sub)
    return _sub_to_out(sub)


@router.post("/webhook")
async def paypal_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    paypal_transmission_id: Optional[str] = Header(None, alias="paypal-transmission-id"),
    paypal_transmission_time: Optional[str] = Header(None, alias="paypal-transmission-time"),
    paypal_transmission_sig: Optional[str] = Header(None, alias="paypal-transmission-sig"),
    paypal_cert_url: Optional[str] = Header(None, alias="paypal-cert-url"),
    paypal_auth_algo: Optional[str] = Header(None, alias="paypal-auth-algo"),
):
    """Receive PayPal webhook events. Verifies signature, updates DB accordingly."""
    body_bytes = await request.body()
    try:
        event = json.loads(body_bytes.decode())
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    webhook_id = os.environ.get("PAYPAL_WEBHOOK_ID", "")
    if not webhook_id:
        print(f"[WEBHOOK] PAYPAL_WEBHOOK_ID not set; event received: {event.get('event_type')}")
        return {"received": True, "verified": False, "note": "PAYPAL_WEBHOOK_ID not configured"}

    verify_payload = {
        "auth_algo": paypal_auth_algo,
        "cert_url": paypal_cert_url,
        "transmission_id": paypal_transmission_id,
        "transmission_sig": paypal_transmission_sig,
        "transmission_time": paypal_transmission_time,
        "webhook_id": webhook_id,
        "webhook_event": event,
    }
    verify = await paypal_service.api_request("POST", "/v1/notifications/verify-webhook-signature", verify_payload)
    if verify["status"] != 200 or (verify["body"] or {}).get("verification_status") != "SUCCESS":
        print(f"[WEBHOOK] signature verification failed: {verify}")
        raise HTTPException(status_code=401, detail="Webhook signature verification failed")

    event_type = event.get("event_type", "")
    resource = event.get("resource", {}) or {}

    if event_type.startswith("BILLING.SUBSCRIPTION"):
        paypal_sub_id = resource.get("id")
        if not paypal_sub_id:
            return {"received": True, "note": "no subscription id in resource"}
        q = await db.execute(select(Subscription).where(Subscription.paypal_subscription_id == paypal_sub_id))
        sub = q.scalar_one_or_none()
        if not sub:
            return {"received": True, "note": f"unknown subscription {paypal_sub_id}"}

        if event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
            sub.status = "ACTIVE"
        elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
            sub.status = "CANCELLED"
            sub.cancelled_at = datetime.now(timezone.utc)
            user_q = await db.execute(select(User).where(User.id == sub.user_id))
            user = user_q.scalar_one_or_none()
            if user:
                user.plan = "free"
        elif event_type == "BILLING.SUBSCRIPTION.SUSPENDED":
            sub.status = "SUSPENDED"
        elif event_type == "BILLING.SUBSCRIPTION.EXPIRED":
            sub.status = "EXPIRED"

        billing_info = resource.get("billing_info", {}) or {}
        nb = _parse_dt(billing_info.get("next_billing_time"))
        if nb:
            sub.current_period_end = nb
        lp = _parse_dt((billing_info.get("last_payment") or {}).get("time"))
        if lp:
            sub.last_payment_at = lp
        await db.commit()

    elif event_type == "PAYMENT.SALE.COMPLETED":
        sub_id = resource.get("billing_agreement_id")
        if sub_id:
            q = await db.execute(select(Subscription).where(Subscription.paypal_subscription_id == sub_id))
            sub = q.scalar_one_or_none()
            if sub:
                sub.last_payment_at = datetime.now(timezone.utc)
                await db.commit()

    return {"received": True, "verified": True, "event_type": event_type}
