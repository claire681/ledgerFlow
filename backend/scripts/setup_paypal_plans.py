"""
One-shot script to create PayPal Products + Plans for Novala.
Reads PAYPAL_CLIENT_ID / PAYPAL_SECRET / PAYPAL_MODE from backend/.env.
Saves resulting IDs to backend/paypal_plans.json.
Idempotent: re-running reuses existing product/plans by name.
"""
import os, base64, json, sys, urllib.request, urllib.error

# Load .env
env = {}
with open(".env") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k] = v.strip()

CID = env.get("PAYPAL_CLIENT_ID", "")
SEC = env.get("PAYPAL_SECRET", "")
MODE = env.get("PAYPAL_MODE", "sandbox")
BASE = "https://api-m.sandbox.paypal.com" if MODE == "sandbox" else "https://api-m.paypal.com"

if not CID or not SEC:
    print("[FAIL] PAYPAL_CLIENT_ID or PAYPAL_SECRET missing")
    sys.exit(1)


def get_token():
    auth = base64.b64encode(f"{CID}:{SEC}".encode()).decode()
    req = urllib.request.Request(
        f"{BASE}/v1/oauth2/token",
        data=b"grant_type=client_credentials",
        headers={"Authorization": f"Basic {auth}", "Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())["access_token"]


def api(method, path, token, payload=None):
    data = json.dumps(payload).encode() if payload else None
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode()
            return resp.status, (json.loads(body) if body else None)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try: body = json.loads(body)
        except: pass
        return e.code, body


def find_product(token, name):
    status, body = api("GET", "/v1/catalogs/products?page_size=100", token)
    if status != 200: return None
    for p in body.get("products", []):
        if p.get("name") == name: return p
    return None


def create_product(token):
    payload = {
        "name": "Novala Subscription",
        "description": "Cloud-based accounting software subscription for small businesses",
        "type": "SERVICE",
        "category": "SOFTWARE",
    }
    status, body = api("POST", "/v1/catalogs/products", token, payload)
    if status not in (200, 201):
        print(f"[FAIL] create product: HTTP {status}: {body}")
        sys.exit(1)
    return body


def find_plan(token, product_id, name):
    status, body = api("GET", f"/v1/billing/plans?product_id={product_id}&page_size=100", token)
    if status != 200: return None
    for p in body.get("plans", []):
        if p.get("name") == name: return p
    return None


def create_plan(token, product_id, name, price):
    payload = {
        "product_id": product_id,
        "name": name,
        "description": f"Recurring monthly subscription: {name}",
        "status": "ACTIVE",
        "billing_cycles": [{
            "frequency": {"interval_unit": "MONTH", "interval_count": 1},
            "tenure_type": "REGULAR",
            "sequence": 1,
            "total_cycles": 0,
            "pricing_scheme": {"fixed_price": {"value": f"{price:.2f}", "currency_code": "USD"}},
        }],
        "payment_preferences": {
            "auto_bill_outstanding": True,
            "setup_fee_failure_action": "CONTINUE",
            "payment_failure_threshold": 3,
        },
    }
    status, body = api("POST", "/v1/billing/plans", token, payload)
    if status not in (200, 201):
        print(f"[FAIL] create plan {name}: HTTP {status}: {body}")
        sys.exit(1)
    return body


# === main ===
print(f"PayPal mode: {MODE}")
token = get_token()
print(f"[OK] access token acquired")

prod_name = "Novala Subscription"
existing = find_product(token, prod_name)
if existing:
    product_id = existing["id"]
    print(f"[REUSE] product '{prod_name}' -> {product_id}")
else:
    p = create_product(token)
    product_id = p["id"]
    print(f"[CREATE] product '{prod_name}' -> {product_id}")

tiers = [
    ("starter", "Novala Starter Monthly", 19.00),
    ("pro", "Novala Pro Monthly", 49.00),
    ("premium", "Novala Premium Monthly", 99.00),
]

plans = {}
for slug, name, price in tiers:
    existing = find_plan(token, product_id, name)
    if existing:
        pid = existing["id"]
        print(f"[REUSE] plan '{name}' -> {pid}")
    else:
        p = create_plan(token, product_id, name, price)
        pid = p["id"]
        print(f"[CREATE] plan '{name}' ${price}/mo -> {pid}")
    plans[slug] = {"plan_id": pid, "name": name, "price_usd": price}

config = {"mode": MODE, "product_id": product_id, "plans": plans}
with open("paypal_plans.json", "w") as f:
    json.dump(config, f, indent=2)

print("")
print("[DONE] config saved to backend/paypal_plans.json:")
print(json.dumps(config, indent=2))
