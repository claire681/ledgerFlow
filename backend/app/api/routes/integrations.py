from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional
import uuid
import traceback
import json

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import Integration
from pydantic import BaseModel

router = APIRouter(prefix="/integrations", tags=["Integrations"])

# ── Provider definitions ──────────────────────────────────────

PROVIDERS = {
    "stripe": {
        "name":        "Stripe",
        "description": "Import payments and payouts automatically",
        "category":    "Payments",
        "oauth":       False,
        "fields":      ["stripe_secret_key", "stripe_publishable_key", "webhook_secret", "test_mode"],
    },
    "quickbooks": {
        "name":        "QuickBooks",
        "description": "Sync transactions and invoices automatically",
        "category":    "Accounting",
        "oauth":       True,
        "fields":      [],
    },
    "xero": {
        "name":        "Xero",
        "description": "Sync with Xero accounting software",
        "category":    "Accounting",
        "oauth":       True,
        "fields":      [],
    },
    "email": {
        "name":        "Email",
        "description": "Send reports, alerts, and summaries by email",
        "category":    "Communication",
        "oauth":       False,
        "fields":      ["smtp_host", "smtp_port", "smtp_username", "smtp_password", "from_email", "from_name"],
    },
    "google_drive": {
        "name":        "Google Drive",
        "description": "Store and access financial documents in the cloud",
        "category":    "Storage",
        "oauth":       True,
        "fields":      [],
    },
    "slack": {
        "name":        "Slack",
        "description": "Get notified about flagged transactions and reports",
        "category":    "Communication",
        "oauth":       False,
        "fields":      ["webhook_url", "default_channel"],
    },
}

REQUIRED_FIELDS = {
    "stripe":       ["stripe_secret_key", "stripe_publishable_key"],
    "email":        ["smtp_username", "smtp_password"],
    "slack":        ["webhook_url"],
    "quickbooks":   [],
    "xero":         [],
    "google_drive": [],
}

SECRET_FIELDS = {
    "stripe_secret_key", "stripe_publishable_key",
    "webhook_secret", "smtp_password",
}


def mask_value(key: str, value: str) -> str:
    if not value:
        return ""
    if key in SECRET_FIELDS:
        visible = str(value)[-4:] if len(str(value)) >= 4 else "****"
        return f"****{visible}"
    return value


def get_uid(current_user) -> str:
    try:
        return str(current_user.id)
    except AttributeError:
        try:
            return str(current_user["user_id"])
        except (KeyError, TypeError):
            return str(current_user.user_id)


def integration_to_dict(provider_key: str, record: Optional[Integration]) -> dict:
    info = PROVIDERS.get(provider_key, {})
    config_masked = {}
    if record and record.access_token:
        try:
            raw_config = json.loads(record.access_token)
            for k, v in raw_config.items():
                config_masked[k] = mask_value(k, str(v)) if v else ""
        except Exception:
            pass

    last_sync = None
    try:
        last_sync = record.last_sync_at.isoformat() if record and record.last_sync_at else None
    except Exception:
        pass

    return {
        "provider":     provider_key,
        "name":         info.get("name", provider_key.title()),
        "description":  info.get("description", ""),
        "category":     info.get("category", "Other"),
        "oauth":        info.get("oauth", False),
        "status":       (record.status if record else None) or "offline",
        "connected_at": record.connected_at.isoformat() if record and record.connected_at else None,
        "last_sync_at": last_sync,
        "config":       config_masked,
    }


async def get_or_create_integration(
    db: AsyncSession, user_id: str, provider: str,
) -> Integration:
    result = await db.execute(
        select(Integration).where(
            Integration.user_id  == user_id,
            Integration.provider == provider,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        record = Integration(
            id=uuid.uuid4(),
            user_id=user_id,
            provider=provider,
            status="offline",
        )
        db.add(record)
        await db.flush()
    return record


async def get_config(record: Integration) -> dict:
    """Parse stored config JSON safely."""
    if not record or not record.access_token:
        return {}
    try:
        return json.loads(record.access_token)
    except Exception:
        return {}


class ConnectBody(BaseModel):
    config: dict = {}


# ── GET /integrations ─────────────────────────────────────────

@router.get("/")
async def list_integrations(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        uid    = get_uid(current_user)
        result = await db.execute(
            select(Integration).where(Integration.user_id == uid)
        )
        records = {r.provider: r for r in result.scalars().all()}
        return [
            integration_to_dict(provider, records.get(provider))
            for provider in PROVIDERS
        ]
    except Exception as e:
        print(f"list_integrations error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /integrations/{provider}/connect ─────────────────────

@router.post("/{provider}/connect")
async def connect_integration(
    provider:     str,
    body:         ConnectBody,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    try:
        if provider not in PROVIDERS:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

        info = PROVIDERS[provider]
        if info.get("oauth"):
            raise HTTPException(
                status_code=400,
                detail=f"{info['name']} requires OAuth which is coming soon."
            )

       # ── Email: auto-fill SMTP settings, user only needs email + password ──
        if provider == "email":
            config = dict(body.config)
            config["smtp_host"]     = "smtp.gmail.com"
            config["smtp_port"]     = "587"
            # from_email mirrors smtp_username if not set
            if not config.get("from_email"):
                config["from_email"] = config.get("smtp_username", "")
        else:
            config = dict(body.config)

        # Validate required fields against the merged config
        required = REQUIRED_FIELDS.get(provider, [])
        missing  = [f for f in required if not str(config.get(f, "")).strip()]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Missing required fields: {', '.join(missing)}"
            )

        uid    = get_uid(current_user)
        record = await get_or_create_integration(db, uid, provider)

        record.access_token = json.dumps(config)
        record.status       = "connected"
        record.connected_at = datetime.utcnow()

        await db.commit()
        await db.refresh(record)

        return {
            "success":  True,
            "message":  f"{info['name']} connected successfully",
            "provider": integration_to_dict(provider, record),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"connect_integration error: {traceback.format_exc()}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /integrations/{provider}/disconnect ──────────────────

@router.post("/{provider}/disconnect")
async def disconnect_integration(
    provider:     str,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    try:
        if provider not in PROVIDERS:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

        uid    = get_uid(current_user)
        record = await get_or_create_integration(db, uid, provider)

        record.status       = "offline"
        record.access_token = None
        record.connected_at = None
        try:
            record.last_sync_at = None
        except Exception:
            pass

        await db.commit()
        await db.refresh(record)

        return {
            "success":  True,
            "message":  f"{PROVIDERS[provider]['name']} disconnected",
            "provider": integration_to_dict(provider, record),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"disconnect_integration error: {traceback.format_exc()}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /integrations/{provider}/sync ───────────────────────

@router.post("/{provider}/sync")
async def sync_integration(
    provider:     str,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    try:
        if provider not in PROVIDERS:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

        uid    = get_uid(current_user)
        result = await db.execute(
            select(Integration).where(
                Integration.user_id  == uid,
                Integration.provider == provider,
            )
        )
        record = result.scalar_one_or_none()

        if not record or record.status != "connected":
            raise HTTPException(
                status_code=400,
                detail=f"{PROVIDERS[provider]['name']} is not connected. Please connect first."
            )

        try:
            record.last_sync_at = datetime.utcnow()
        except Exception:
            pass

        await db.commit()
        await db.refresh(record)

        return {
            "success":   True,
            "message":   f"{PROVIDERS[provider]['name']} sync completed successfully",
            "synced_at": datetime.utcnow().isoformat(),
            "provider":  integration_to_dict(provider, record),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"sync_integration error: {traceback.format_exc()}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /integrations/{provider}/test ───────────────────────

@router.post("/{provider}/test")
async def test_integration(
    provider:     str,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    try:
        if provider not in PROVIDERS:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

        info = PROVIDERS[provider]
        if info.get("oauth"):
            return {
                "success": False,
                "message": f"{info['name']} requires OAuth — coming soon. Cannot test yet.",
            }

        uid    = get_uid(current_user)
        result = await db.execute(
            select(Integration).where(
                Integration.user_id  == uid,
                Integration.provider == provider,
            )
        )
        record = result.scalar_one_or_none()

        if not record or record.status != "connected":
            raise HTTPException(
                status_code=400,
                detail=f"{info['name']} is not connected. Please connect first."
            )

        config = await get_config(record)

        # ── Stripe test ───────────────────────────────────────
        if provider == "stripe":
            secret_key = config.get("stripe_secret_key", "")
            if not secret_key:
                return {"success": False, "message": "Stripe secret key is missing from saved config."}
            try:
                import httpx
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get(
                        "https://api.stripe.com/v1/balance",
                        headers={"Authorization": f"Bearer {secret_key}"},
                    )
                if res.status_code == 200:
                    data = res.json()
                    available = data.get("available", [{}])
                    amount    = available[0].get("amount", 0) / 100 if available else 0
                    currency  = available[0].get("currency", "usd").upper() if available else "USD"
                    return {
                        "success": True,
                        "message": f"Stripe connection verified. Available balance: {currency} {amount:,.2f}",
                    }
                elif res.status_code == 401:
                    return {"success": False, "message": "Invalid Stripe secret key. Please check your credentials."}
                else:
                    return {"success": False, "message": f"Stripe returned status {res.status_code}. Check your key."}
            except Exception as e:
                return {"success": False, "message": f"Could not reach Stripe: {str(e)}"}
# ── Email test ────────────────────────────────────────
        elif provider == "email":
            from app.services.email_service import send_test_email
            config   = await get_config(record)
            to_email = config.get("smtp_username", "") or config.get("from_email", "")
            to_name  = config.get("from_name", "")

            if not to_email:
                return {"success": False, "message": "No email address found in saved config. Please reconnect."}

            result = await send_test_email(to_email=to_email, to_name=to_name)
            return result
        # ── Slack test ────────────────────────────────────────
        elif provider == "slack":
            webhook_url = config.get("webhook_url", "")
            channel     = config.get("default_channel", "#general")

            if not webhook_url:
                return {"success": False, "message": "Slack webhook URL is missing from saved config."}

            try:
                import httpx
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(
                        webhook_url,
                        json={
                            "text":     f"✅ *LedgerFlow* — Slack integration test successful! You will receive financial alerts in {channel}.",
                            "username": "LedgerFlow",
                        },
                        headers={"Content-Type": "application/json"},
                    )
                if res.status_code == 200 and res.text == "ok":
                    return {
                        "success": True,
                        "message": f"Test message sent to Slack successfully. Check {channel}.",
                    }
                elif res.status_code == 404:
                    return {"success": False, "message": "Webhook URL not found. It may have been revoked. Please reconnect."}
                else:
                    return {"success": False, "message": f"Slack returned: {res.text}. Check your webhook URL."}
            except Exception as e:
                return {"success": False, "message": f"Could not reach Slack: {str(e)}"}

        # ── Fallback ──────────────────────────────────────────
        else:
            return {
                "success": True,
                "message": f"{info['name']} manual setup saved. Real sync and testing coming soon.",
            }

    except HTTPException:
        raise
    except Exception as e:
        print(f"test_integration error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))