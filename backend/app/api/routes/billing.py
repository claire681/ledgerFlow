import stripe
import os
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User

from app.core.config import settings
stripe.api_key = settings.stripe_secret_key

router = APIRouter(prefix="/billing", tags=["billing"])

PLANS = {
    "essentials": {"name": "Essentials Monthly", "price": 1900, "currency": "usd", "interval": "month"},
    "premium":    {"name": "Premium Monthly",    "price": 4900, "currency": "usd", "interval": "month"},
}

@router.get("/plans")
async def get_plans():
    return PLANS

@router.post("/create-checkout")
async def create_checkout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    body = await request.json()
    plan = body.get("plan", "essentials")
    if plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    # Check if user already has active subscription
    result = await db.execute(
        text("SELECT subscription_status, stripe_customer_id FROM users WHERE id = :id"),
        {"id": current_user.id}
    )
    row = result.mappings().first()

    # If already active, send to billing portal instead
    if row and row["subscription_status"] == "active" and row["stripe_customer_id"]:
        try:
            portal = stripe.billing_portal.Session.create(
                customer=row["stripe_customer_id"],
                return_url="https://www.getnovala.com/billing",
            )
            return {"url": portal.url}
        except Exception:
            pass

    p = PLANS[plan]

    # Create new checkout session
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="subscription",
        customer_email=current_user.email,
        line_items=[{
            "price_data": {
                "currency":     p["currency"],
                "unit_amount":  p["price"],
                "recurring":    {"interval": p["interval"]},
                "product_data": {"name": f"Novala {p['name']}"},
            },
            "quantity": 1,
        }],
        success_url="https://www.getnovala.com/billing?success=true",
        cancel_url="https://www.getnovala.com/billing?cancelled=true",
        metadata={"user_id": str(current_user.id), "plan": plan},
    )

    return {"url": session.url}

@router.get("/status")
async def get_billing_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT plan, trial_ends_at, subscription_status, stripe_customer_id FROM users WHERE id = :id"),
        {"id": current_user.id}
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)

@router.post("/portal")
async def billing_portal(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT stripe_customer_id FROM users WHERE id = :id"),
        {"id": current_user.id}
    )
    row = result.mappings().first()
    if not row or not row["stripe_customer_id"]:
        raise HTTPException(status_code=400, detail="No active subscription found")
    portal = stripe.billing_portal.Session.create(
        customer=row["stripe_customer_id"],
        return_url="https://www.getnovala.com/billing",
    )
    return {"url": portal.url}

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload    = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            import json
            event = stripe.Event.construct_from(json.loads(payload), stripe.api_key)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session    = event["data"]["object"]
        user_id    = session["metadata"].get("user_id")
        plan       = session["metadata"].get("plan", "essentials")
        customer_id = session.get("customer")
        if user_id:
            await db.execute(
                text("""UPDATE users SET plan = :plan, subscription_status = 'active',
                    stripe_customer_id = :customer_id WHERE id = :id::uuid"""),
                {"plan": plan, "id": user_id, "customer_id": customer_id}
            )
            await db.commit()

    if event["type"] == "customer.subscription.deleted":
        session  = event["data"]["object"]
        customer = session.get("customer")
        if customer:
            await db.execute(
                text("UPDATE users SET plan = 'free', subscription_status = 'cancelled' WHERE stripe_customer_id = :cid"),
                {"cid": customer}
            )
            await db.commit()

    if event["type"] == "invoice.payment_failed":
        session  = event["data"]["object"]
        customer = session.get("customer")
        if customer:
            await db.execute(
                text("UPDATE users SET subscription_status = 'past_due' WHERE stripe_customer_id = :cid"),
                {"cid": customer}
            )
            await db.commit()

    return {"status": "ok"}
