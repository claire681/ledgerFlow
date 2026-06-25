#!/usr/bin/env python3
"""
Create 12 PayPal plans WITH 14-day free trial.

Each plan has two billing cycles:
1. TRIAL: 14 days at $0
2. REGULAR: Monthly at the base price (infinite)

After running, paypal_plans.json points to the new trial-enabled plan IDs.
Old non-trial plans remain in PayPal but become unused.
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
PLANS_FILE = (
    "paypal_plans.live.json"
    if PAYPAL_MODE == "live"
    else "paypal_plans.json"
)
TRIAL_DAYS = 14

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


def get_token():
    r = requests.post(
        BASE_URL + "/v1/oauth2/token",
        auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET),
        data={"grant_type": "client_credentials"},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def create_trial_plan(token, product_id, display_name, price_usd):
    body = {
        "product_id": product_id,
        "name": "Novala " + display_name + " Monthly (14d trial)",
        "description": display_name + ": 14 days free, then $" + str(int(price_usd)) + "/month",
        "status": "ACTIVE",
        "billing_cycles": [
            {
                "frequency": {"interval_unit": "DAY", "interval_count": TRIAL_DAYS},
                "tenure_type": "TRIAL",
                "sequence": 1,
                "total_cycles": 1,
                "pricing_scheme": {
                    "fixed_price": {"value": "0.00", "currency_code": "USD"}
                },
            },
            {
                "frequency": {"interval_unit": "MONTH", "interval_count": 1},
                "tenure_type": "REGULAR",
                "sequence": 2,
                "total_cycles": 0,
                "pricing_scheme": {
                    "fixed_price": {"value": "%.2f" % price_usd, "currency_code": "USD"}
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
        raise SystemExit("Create failed for " + display_name + ": " + str(r.status_code) + " " + r.text)
    return r.json()["id"]


def main():
    if not PAYPAL_CLIENT_ID or not PAYPAL_SECRET:
        raise SystemExit("Missing PAYPAL_CLIENT_ID or PAYPAL_SECRET")

    print("Mode: " + PAYPAL_MODE)
    print("Trial: " + str(TRIAL_DAYS) + " days")

    print("Plans file: " + PLANS_FILE)

    token = get_token()

    if os.path.exists(PLANS_FILE):
        with open(PLANS_FILE) as f:
            data = json.load(f)
    else:
        print("Plans file not found, will create new one.")
        data = {}

    if not data.get("product_id"):
        print("No product_id in file. Creating new Novala product in " + PAYPAL_MODE + " mode...")
        r = requests.post(
            BASE_URL + "/v1/catalogs/products",
            headers={
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json",
            },
            json={
                "name": "Novala",
                "description": "AI accounting and payroll software",
                "type": "SERVICE",
                "category": "SOFTWARE",
            },
            timeout=30,
        )
        if r.status_code >= 400:
            raise SystemExit(
                "Product create failed: " + str(r.status_code) + " " + r.text
            )
        data["product_id"] = r.json()["id"]
        print("Created product: " + data["product_id"])
        with open(PLANS_FILE, "w") as f:
            json.dump(data, f, indent=2)

    product_id = data["product_id"]
    print("Product: " + product_id)
    trial_plans = data.setdefault("trial_plans", {})

    created = 0
    skipped = 0
    for slug, display_name, price_usd in ALL_COMBOS:
        if slug in trial_plans and trial_plans[slug].get("plan_id"):
            print("SKIP " + slug + " -> " + trial_plans[slug]["plan_id"])
            skipped += 1
            continue
        plan_id = create_trial_plan(token, product_id, display_name, price_usd)
        trial_plans[slug] = {
            "plan_id": plan_id,
            "name": "Novala " + display_name + " Monthly (14d trial)",
            "price_usd": float(price_usd),
            "trial_days": TRIAL_DAYS,
        }
        with open(PLANS_FILE, "w") as f:
            json.dump(data, f, indent=2)
        print("OK   " + slug + " ($" + str(price_usd) + ") -> " + plan_id)
        created += 1

    # Point main "plans" at trial-enabled plans so backend serves trial IDs
    data["plans"] = dict(trial_plans)
    with open(PLANS_FILE, "w") as f:
        json.dump(data, f, indent=2)

    print()
    print("Done. Created " + str(created) + ", skipped " + str(skipped))
    print(PLANS_FILE + " plans[] now points to TRIAL-enabled plans.")


if __name__ == "__main__":
    main()
