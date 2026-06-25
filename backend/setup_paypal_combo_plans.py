#!/usr/bin/env python3
"""
Create 9 combined plan+payroll PayPal subscription plans.
Idempotent: skips any slug already present in paypal_plans.json.
Saves after each successful create so a mid-run failure preserves progress.
"""

import os
import json
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox")
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_SECRET = os.getenv("PAYPAL_SECRET")

BASE_URL = (
    "https://api-m.sandbox.paypal.com"
    if PAYPAL_MODE == "sandbox"
    else "https://api-m.paypal.com"
)
PLANS_FILE = "paypal_plans.json"

# slug, display name, monthly price USD
ALL_COMBOS = [
    ("essentials", "Essentials", 19),
    ("premium", "Premium", 49),
    ("scale", "Scale", 99),
    ("essentials_payroll_core", "Essentials + Payroll Core", 44),
    ("premium_payroll_core", "Premium + Payroll Core", 74),
    ("scale_payroll_core", "Scale + Payroll Core", 124),
    ("essentials_payroll_premium", "Essentials + Payroll Premium", 59),
    ("premium_payroll_premium", "Premium + Payroll Premium", 89),
    ("scale_payroll_premium", "Scale + Payroll Premium", 139),
    ("essentials_payroll_elite", "Essentials + Payroll Elite", 99),
    ("premium_payroll_elite", "Premium + Payroll Elite", 129),
    ("scale_payroll_elite", "Scale + Payroll Elite", 179),
]


def get_access_token():
    r = requests.post(
        BASE_URL + "/v1/oauth2/token",
        auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET),
        data={"grant_type": "client_credentials"},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def load_existing():
    if not os.path.exists(PLANS_FILE):
        raise SystemExit("paypal_plans.json not found")
    with open(PLANS_FILE) as f:
        return json.load(f)


def save(data):
    with open(PLANS_FILE, "w") as f:
        json.dump(data, f, indent=2)


def create_plan(token, product_id, display_name, price_usd):
    body = {
        "product_id": product_id,
        "name": "Novala " + display_name + " Monthly",
        "description": display_name + " plan, billed monthly",
        "status": "ACTIVE",
        "billing_cycles": [
            {
                "frequency": {"interval_unit": "MONTH", "interval_count": 1},
                "tenure_type": "REGULAR",
                "sequence": 1,
                "total_cycles": 0,
                "pricing_scheme": {
                    "fixed_price": {
                        "value": "%.2f" % price_usd,
                        "currency_code": "USD",
                    }
                },
            }
        ],
        "payment_preferences": {
            "auto_bill_outstanding": True,
            "setup_fee_failure_action": "CONTINUE",
            "payment_failure_threshold": 3,
        },
    }
    r = requests.post(
        BASE_URL + "/v1/billing/plans",
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
        },
        json=body,
        timeout=30,
    )
    if r.status_code >= 400:
        raise SystemExit(
            "Create failed for " + display_name + ": "
            + str(r.status_code) + " " + r.text
        )
    return r.json()["id"]


def main():
    if not PAYPAL_CLIENT_ID or not PAYPAL_SECRET:
        raise SystemExit("Missing PAYPAL_CLIENT_ID or PAYPAL_SECRET")

    print("Mode: " + PAYPAL_MODE)
    print("Base URL: " + BASE_URL)

    data = load_existing()
    product_id = data.get("product_id")
    if not product_id:
        raise SystemExit("No product_id in paypal_plans.json")

    print("Product: " + product_id)
    plans = data.setdefault("plans", {})
    print("Existing: " + ", ".join(sorted(plans.keys())))
    print()

    token = get_access_token()

    created = 0
    skipped = 0
    for slug, display_name, price_usd in ALL_COMBOS:
        if slug in plans and plans[slug].get("plan_id"):
            print("SKIP " + slug + " ($" + str(price_usd) + ") -> " + plans[slug]["plan_id"])
            skipped += 1
            continue
        plan_id = create_plan(token, product_id, display_name, price_usd)
        plans[slug] = {
            "plan_id": plan_id,
            "name": "Novala " + display_name + " Monthly",
            "price_usd": float(price_usd),
        }
        save(data)
        print("OK   " + slug + " ($" + str(price_usd) + ") -> " + plan_id)
        created += 1

    print()
    print(
        "Done. Created " + str(created)
        + ", skipped " + str(skipped)
        + ", total " + str(len(plans))
    )


if __name__ == "__main__":
    main()
