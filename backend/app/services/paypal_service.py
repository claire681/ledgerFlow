"""
PayPal API client.
Reads PAYPAL_CLIENT_ID / PAYPAL_SECRET / PAYPAL_MODE from environment
(loaded into the systemd service by EnvironmentFile=backend/.env).
"""
import os, json, time, base64, asyncio
import urllib.request, urllib.error
from pathlib import Path
from typing import Optional

CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("PAYPAL_SECRET", "")
MODE = os.environ.get("PAYPAL_MODE", "sandbox").lower()
BASE_URL = "https://api-m.sandbox.paypal.com" if MODE == "sandbox" else "https://api-m.paypal.com"

_token_cache = {"access_token": None, "expires_at": 0}
_token_lock = asyncio.Lock()

_PLANS_PATH = Path(__file__).resolve().parent.parent.parent / "paypal_plans.json"
_plans_cache: Optional[dict] = None


def _sync_get_token() -> dict:
    if not CLIENT_ID or not CLIENT_SECRET:
        raise RuntimeError("PAYPAL_CLIENT_ID or PAYPAL_SECRET not set in environment")
    auth = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    req = urllib.request.Request(
        f"{BASE_URL}/v1/oauth2/token",
        data=b"grant_type=client_credentials",
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"PayPal OAuth failed: HTTP {e.code}: {body[:300]}")


async def get_access_token() -> str:
    async with _token_lock:
        now = time.time()
        if _token_cache["access_token"] and _token_cache["expires_at"] > now + 60:
            return _token_cache["access_token"]
        data = await asyncio.to_thread(_sync_get_token)
        _token_cache["access_token"] = data["access_token"]
        _token_cache["expires_at"] = now + int(data.get("expires_in", 32400))
        return _token_cache["access_token"]


def _sync_request(method: str, path: str, token: str, payload: Optional[dict] = None, extra_headers: Optional[dict] = None) -> dict:
    url = f"{BASE_URL}{path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode()
            return {"status": resp.status, "body": json.loads(body) if body else None, "headers": dict(resp.headers)}
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            body_parsed = json.loads(body)
        except Exception:
            body_parsed = body
        return {"status": e.code, "body": body_parsed, "headers": dict(e.headers) if e.headers else {}}


async def api_request(method: str, path: str, payload: Optional[dict] = None, extra_headers: Optional[dict] = None) -> dict:
    token = await get_access_token()
    return await asyncio.to_thread(_sync_request, method, path, token, payload, extra_headers)


def get_plans_config() -> dict:
    global _plans_cache
    if _plans_cache is None:
        if not _PLANS_PATH.exists():
            raise FileNotFoundError(f"paypal_plans.json not found at {_PLANS_PATH}. Run scripts/setup_paypal_plans.py.")
        with open(_PLANS_PATH) as f:
            _plans_cache = json.load(f)
    return _plans_cache


async def create_subscription(plan_id: str, return_url: str, cancel_url: str, subscriber: Optional[dict] = None) -> dict:
    payload = {
        "plan_id": plan_id,
        "application_context": {
            "brand_name": "Novala",
            "shipping_preference": "NO_SHIPPING",
            "user_action": "SUBSCRIBE_NOW",
            "payment_method": {"payer_selected": "PAYPAL", "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED"},
            "return_url": return_url,
            "cancel_url": cancel_url,
        },
    }
    if subscriber:
        payload["subscriber"] = subscriber
    return await api_request("POST", "/v1/billing/subscriptions", payload)


async def get_subscription(subscription_id: str) -> dict:
    return await api_request("GET", f"/v1/billing/subscriptions/{subscription_id}")


async def cancel_subscription(subscription_id: str, reason: str = "User requested cancellation") -> dict:
    return await api_request("POST", f"/v1/billing/subscriptions/{subscription_id}/cancel", {"reason": reason})
