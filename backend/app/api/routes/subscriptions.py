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
    return PlansResponse(mode=os.environ.get("PAYPAL_MODE", "sandbox").lower(), plans=plans)


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
    """Receive PayPal webhook events. Verifies signature, updates DB accordingly.

    Handles 9 event types:
      Subscription lifecycle: ACTIVATED, CANCELLED, SUSPENDED, EXPIRED,
      PAYMENT.FAILED, RE-ACTIVATED, UPDATED
      Payments: PAYMENT.SALE.COMPLETED, PAYMENT.SALE.REFUNDED
    """
    body_bytes = await request.body()

    try:
        event = json.loads(body_bytes.decode())
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    mode = (os.environ.get("PAYPAL_MODE", "sandbox") or "").lower()
    if mode == "live":
        webhook_id = os.environ.get("PAYPAL_WEBHOOK_ID_LIVE", "")
    else:
        webhook_id = os.environ.get("PAYPAL_WEBHOOK_ID_SANDBOX", "")
    if not webhook_id:
        webhook_id = os.environ.get("PAYPAL_WEBHOOK_ID", "")

    if not webhook_id:
        print(
            "[WEBHOOK] no webhook_id configured for mode={}; event={}".format(
                mode, event.get("event_type")
            )
        )
        return {
            "received": True,
            "verified": False,
            "note": "PAYPAL_WEBHOOK_ID not configured",
        }

    verify_payload = {
        "auth_algo": paypal_auth_algo,
        "cert_url": paypal_cert_url,
        "transmission_id": paypal_transmission_id,
        "transmission_sig": paypal_transmission_sig,
        "transmission_time": paypal_transmission_time,
        "webhook_id": webhook_id,
        "webhook_event": event,
    }

    verify = await paypal_service.api_request(
        "POST",
        "/v1/notifications/verify-webhook-signature",
        verify_payload,
    )

    if (
        verify["status"] != 200
        or (verify["body"] or {}).get("verification_status") != "SUCCESS"
    ):
        print("[WEBHOOK] signature verification failed: {}".format(verify))
        raise HTTPException(
            status_code=401,
            detail="Webhook signature verification failed",
        )

    event_type = event.get("event_type", "")
    resource = event.get("resource", {}) or {}

    print("[WEBHOOK] verified {}".format(event_type))

    if event_type.startswith("BILLING.SUBSCRIPTION"):
        await _handle_subscription_event(db, event_type, resource)
    elif event_type == "PAYMENT.SALE.COMPLETED":
        await _handle_payment_completed(db, resource)
    elif event_type in ("PAYMENT.SALE.REFUNDED", "PAYMENT.CAPTURE.REFUNDED"):
        await _handle_payment_refunded(db, resource)
    else:
        print("[WEBHOOK] unhandled event type: {}".format(event_type))

    return {
        "received": True,
        "verified": True,
        "event_type": event_type,
    }


async def _handle_subscription_event(
    db: AsyncSession, event_type: str, resource: dict
):
    paypal_sub_id = resource.get("id")
    if not paypal_sub_id:
        print("[WEBHOOK] no subscription id for {}".format(event_type))
        return

    q = await db.execute(
        select(Subscription).where(
            Subscription.paypal_subscription_id == paypal_sub_id
        )
    )
    sub = q.scalar_one_or_none()

    if not sub:
        print(
            "[WEBHOOK] unknown subscription {} for {}".format(
                paypal_sub_id, event_type
            )
        )
        return

    user_q = await db.execute(select(User).where(User.id == sub.user_id))
    user = user_q.scalar_one_or_none()

    if event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
        # PayPal fires ACTIVATED when the trial starts (since trial is $0).
        # Keep status as trialing if user is still in trial; the first real
        # PAYMENT.SALE.COMPLETED at end of trial flips them to active.
        is_trialing = (
            (sub.status or "").lower() == "trialing"
            or (user and (user.subscription_status or "").lower() == "trialing")
        )
        if not is_trialing:
            sub.status = "active"
            if user:
                user.subscription_status = "active"

    elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
        sub.status = "cancelled"
        sub.cancelled_at = datetime.now(timezone.utc)
        if user:
            user.subscription_status = "cancelled"

    elif event_type == "BILLING.SUBSCRIPTION.SUSPENDED":
        sub.status = "suspended"
        if user:
            user.subscription_status = "suspended"

    elif event_type == "BILLING.SUBSCRIPTION.EXPIRED":
        sub.status = "expired"
        if user:
            user.subscription_status = "expired"

    elif event_type == "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        sub.status = "past_due"
        if user:
            user.subscription_status = "past_due"

    elif event_type == "BILLING.SUBSCRIPTION.RE-ACTIVATED":
        sub.status = "active"
        if user:
            user.subscription_status = "active"

    elif event_type == "BILLING.SUBSCRIPTION.UPDATED":
        new_plan_id = resource.get("plan_id")
        if new_plan_id and new_plan_id != sub.paypal_plan_id:
            sub.paypal_plan_id = new_plan_id
            try:
                plans_config = await paypal_service.get_plans_config()
                plans_dict = (
                    (plans_config or {}).get("plans")
                    or (plans_config or {}).get("trial_plans")
                    or {}
                )
                for slug, info in plans_dict.items():
                    if info.get("plan_id") == new_plan_id:
                        sub.plan_slug = slug
                        break
            except Exception as e:
                print("[WEBHOOK] could not look up new plan slug: {}".format(e))

    # Always sync period dates and last payment if present in payload
    billing_info = resource.get("billing_info", {}) or {}
    nb = _parse_dt(billing_info.get("next_billing_time"))
    if nb:
        sub.current_period_end = nb

    last_payment = billing_info.get("last_payment", {}) or {}
    lp = _parse_dt(last_payment.get("time"))
    if lp:
        sub.last_payment_at = lp

    await db.commit()


async def _handle_payment_completed(db: AsyncSession, resource: dict):
    """A recurring payment was successfully captured.

    If the subscription was trialing or past_due, this is treated as the
    activating payment and status flips to active on both Subscription and User.
    """
    paypal_sub_id = resource.get("billing_agreement_id")
    if not paypal_sub_id:
        print("[WEBHOOK] PAYMENT.SALE.COMPLETED has no billing_agreement_id")
        return

    q = await db.execute(
        select(Subscription).where(
            Subscription.paypal_subscription_id == paypal_sub_id
        )
    )
    sub = q.scalar_one_or_none()
    if not sub:
        print(
            "[WEBHOOK] PAYMENT.SALE.COMPLETED for unknown sub {}".format(
                paypal_sub_id
            )
        )
        return

    sub.last_payment_at = datetime.now(timezone.utc)

    current_status = (sub.status or "").lower()
    if current_status in ("trialing", "approval_pending", "past_due"):
        sub.status = "active"
        user_q = await db.execute(select(User).where(User.id == sub.user_id))
        user = user_q.scalar_one_or_none()
        if user:
            user.subscription_status = "active"

    await db.commit()


async def _handle_payment_refunded(db: AsyncSession, resource: dict):
    """Log refund. Subscription cancellation flows through CANCELLED event."""
    paypal_sub_id = (
        resource.get("billing_agreement_id")
        or resource.get("sale_id")
        or resource.get("id")
    )
    amount = resource.get("amount") or resource.get("total")
    print(
        "[WEBHOOK] refund received for sub={} amount={}".format(
            paypal_sub_id, amount
        )
    )
