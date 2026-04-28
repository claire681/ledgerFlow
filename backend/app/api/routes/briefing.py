from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Optional
from zoneinfo import ZoneInfo, available_timezones
import traceback
import os

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import Invoice, Document, Budget, Transaction, User
from app.services.email_service import send_email
from pydantic import BaseModel

router = APIRouter(prefix="/briefing", tags=["Briefing"])

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Common timezones for the dropdown
COMMON_TIMEZONES = [
    "America/Edmonton",
    "America/Vancouver",
    "America/Toronto",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Halifax",
    "America/St_Johns",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Rome",
    "Europe/Madrid",
    "Europe/Amsterdam",
    "Europe/Stockholm",
    "Europe/Warsaw",
    "Europe/Kiev",
    "Europe/Moscow",
    "Africa/Lagos",
    "Africa/Nairobi",
    "Africa/Johannesburg",
    "Africa/Cairo",
    "Africa/Accra",
    "Asia/Dubai",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Dhaka",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Seoul",
    "Australia/Sydney",
    "Australia/Melbourne",
    "Australia/Perth",
    "Pacific/Auckland",
    "Pacific/Honolulu",
    "UTC",
]

BRIEFING_HOURS = [
    "05:00", "06:00", "07:00", "08:00",
    "09:00", "10:00", "11:00", "12:00",
]


def get_uid(current_user) -> str:
    try:
        return str(current_user.id)
    except AttributeError:
        try:
            return str(current_user["user_id"])
        except (KeyError, TypeError):
            return str(current_user.user_id)


class BriefingSettings(BaseModel):
    briefing_enabled:  bool = True
    briefing_time:     str  = "08:00"
    briefing_timezone: str  = "America/Edmonton"


async def gather_business_data(db: AsyncSession, uid: str) -> dict:
    """Gather all financial data for the briefing."""
    now             = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago  = now - timedelta(days=7)

    # ── Invoices ──────────────────────────────────────────────
    inv_result = await db.execute(
        select(Invoice).where(Invoice.user_id == uid)
    )
    invoices = inv_result.scalars().all()

    overdue_invoices = []
    for i in invoices:
        if i.status == "overdue":
            overdue_invoices.append(i)
        elif i.due_date and i.status not in ["paid", "draft"]:
            try:
                if datetime.strptime(i.due_date, "%Y-%m-%d") < now:
                    overdue_invoices.append(i)
            except Exception:
                pass

    due_soon = []
    for i in invoices:
        if i.due_date and i.status not in ["paid", "draft", "overdue"]:
            try:
                due_dt = datetime.strptime(i.due_date, "%Y-%m-%d")
                if now < due_dt <= now + timedelta(days=7):
                    due_soon.append(i)
            except Exception:
                pass

    total_outstanding = sum(
        float(i.total or 0) for i in invoices
        if i.status not in ["paid", "draft"]
    )

    # ── Documents ─────────────────────────────────────────────
    doc_result = await db.execute(
        select(Document).where(Document.user_id == uid)
    )
    documents    = doc_result.scalars().all()
    pending_docs = [d for d in documents if d.status == "review"]
    recent_docs = [d for d in documents if d.uploaded_at and d.uploaded_at >= seven_days_ago]
    # ── Budgets ───────────────────────────────────────────────
    budget_result = await db.execute(
        select(Budget).where(Budget.user_id == uid)
    )
    budgets = budget_result.scalars().all()

    # ── Transactions ──────────────────────────────────────────
    try:
        txn_result = await db.execute(
            select(Transaction).where(
                Transaction.user_id == uid,
                Transaction.txn_date >= thirty_days_ago.strftime("%Y-%m-%d"),
            )
        )
        transactions   = txn_result.scalars().all()
        total_expenses = sum(float(t.amount or 0) for t in transactions if t.txn_type == "expense")
        total_income   = sum(float(t.amount or 0) for t in transactions if t.txn_type == "income")
    except Exception:
        transactions   = []
        total_expenses = 0
        total_income   = 0

    return {
        "date":               now.strftime("%A, %B %d %Y"),
        "overdue_invoices":   [{"number": i.invoice_number, "amount": float(i.total or 0), "client": i.to_name, "days": i.days_overdue or 0} for i in overdue_invoices],
        "due_soon":           [{"number": i.invoice_number, "amount": float(i.total or 0), "client": i.to_name, "due": i.due_date} for i in due_soon],
        "total_outstanding":  total_outstanding,
        "pending_docs":       len(pending_docs),
        "recent_docs":        len(recent_docs),
        "total_expenses_30d": total_expenses,
        "total_income_30d":   total_income,
        "net_30d":            total_income - total_expenses,
        "budgets": [{"category": b.category, "limit": float(b.monthly_limit or 0)} for b in budgets],
        "total_invoices":     len(invoices),
        "paid_invoices":      len([i for i in invoices if i.status == "paid"]),
    }


async def generate_briefing_with_ai(data: dict) -> str:
    """Ask Claude to write the briefing in plain English."""
    if not ANTHROPIC_API_KEY:
        return generate_briefing_simple(data)

    try:
        import httpx
        prompt = f"""
You are LedgerFlow's AI financial assistant. Write a concise friendly morning briefing email body (HTML) for a small business owner based on this data:

Date: {data['date']}
Overdue invoices: {data['overdue_invoices']}
Due soon (7 days): {data['due_soon']}
Total outstanding: ${data['total_outstanding']:,.2f}
Last 30 days income: ${data['total_income_30d']:,.2f}
Last 30 days expenses: ${data['total_expenses_30d']:,.2f}
Net last 30 days: ${data['net_30d']:,.2f}
Documents needing review: {data['pending_docs']}
Budgets: {data['budgets']}

Write HTML only. Be direct, insightful and actionable. Use simple language.
Highlight urgent items in red (#EF4444). Use green (#0AB98A) for positive items.
Include a health score out of 100 based on the data.
Keep it under 400 words.
Do NOT include html, head, or body tags — just the inner content.
"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key":         ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type":      "application/json",
                },
                json={
                    "model":      "claude-sonnet-4-20250514",
                    "max_tokens": 1000,
                    "messages":   [{"role": "user", "content": prompt}],
                },
            )
        if res.status_code == 200:
            return res.json()["content"][0]["text"]
    except Exception:
        print(f"AI briefing error: {traceback.format_exc()}")

    return generate_briefing_simple(data)


def generate_briefing_simple(data: dict) -> str:
    """Fallback briefing without AI."""
    overdue_html = ""
    if data["overdue_invoices"]:
        items = "".join([
            f'<tr>'
            f'<td style="padding:8px 0;border-bottom:1px solid #FEE2E2;font-size:14px;color:#374151;">{i["number"]} — {i["client"] or "Client"}</td>'
            f'<td style="padding:8px 0;border-bottom:1px solid #FEE2E2;font-size:14px;font-weight:700;color:#EF4444;text-align:right;">${i["amount"]:,.2f}</td>'
            f'</tr>'
            for i in data["overdue_invoices"]
        ])
        overdue_html = f"""
        <div style="background:#FEF2F2;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #FECACA;">
          <div style="font-size:14px;font-weight:700;color:#EF4444;margin-bottom:12px;">
            🚨 {len(data["overdue_invoices"])} Overdue Invoice{"s" if len(data["overdue_invoices"]) > 1 else ""}
          </div>
          <table width="100%">{items}</table>
          <div style="font-size:13px;color:#991B1B;margin-top:12px;font-weight:600;">
            Total outstanding: ${data["total_outstanding"]:,.2f}
          </div>
        </div>
        """

    net_color = "#0AB98A" if data["net_30d"] >= 0 else "#EF4444"
    net_label = "Profit" if data["net_30d"] >= 0 else "Loss"

    return f"""
    <h2 style="color:#111827;font-size:20px;margin:0 0 6px;">Good morning! 👋</h2>
    <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">{data["date"]}</p>

    {overdue_html}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding:4px;">
          <div style="background:#F0FDF9;border-radius:12px;padding:18px;border:1px solid #D1FAE5;">
            <div style="font-size:11px;color:#065F46;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">30-Day Income</div>
            <div style="font-size:22px;font-weight:700;color:#0AB98A;">${data["total_income_30d"]:,.2f}</div>
          </div>
        </td>
        <td style="padding:4px;">
          <div style="background:#F8FAFC;border-radius:12px;padding:18px;border:1px solid #E2E8F0;">
            <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">30-Day Expenses</div>
            <div style="font-size:22px;font-weight:700;color:#374151;">${data["total_expenses_30d"]:,.2f}</div>
          </div>
        </td>
        <td style="padding:4px;">
          <div style="background:#F8FAFC;border-radius:12px;padding:18px;border:1px solid #E2E8F0;">
            <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Net {net_label}</div>
            <div style="font-size:22px;font-weight:700;color:{net_color};">${abs(data["net_30d"]):,.2f}</div>
          </div>
        </td>
      </tr>
    </table>

    {f'<div style="background:#FFF7ED;border-radius:10px;padding:14px 16px;border:1px solid #FED7AA;margin-bottom:20px;font-size:13px;color:#92400E;">📋 {data["pending_docs"]} document{"s" if data["pending_docs"] > 1 else ""} need{"s" if data["pending_docs"] == 1 else ""} your review.</div>' if data["pending_docs"] else ""}

    <div style="background:#F0FDF9;border-radius:10px;padding:14px 16px;border:1px solid #D1FAE5;font-size:13px;color:#065F46;">
      ✅ LedgerFlow is monitoring your finances. Have a productive day!
    </div>
    """


# ── GET /briefing/settings ────────────────────────────────────

@router.get("/settings")
async def get_briefing_settings(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return {
            "briefing_enabled":  getattr(current_user, "briefing_enabled",  True),
            "briefing_time":     getattr(current_user, "briefing_time",     "08:00"),
            "briefing_timezone": getattr(current_user, "briefing_timezone", "America/Edmonton"),
            "last_briefing_at":  current_user.last_briefing_at.isoformat() if getattr(current_user, "last_briefing_at", None) else None,
            "timezones":         COMMON_TIMEZONES,
            "available_times":   BRIEFING_HOURS,
        }
    except Exception as e:
        print(f"get_briefing_settings error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /briefing/settings ───────────────────────────────────

@router.post("/settings")
async def save_briefing_settings(
    body:         BriefingSettings,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    try:
        if body.briefing_timezone not in COMMON_TIMEZONES:
            raise HTTPException(status_code=400, detail="Invalid timezone")
        if body.briefing_time not in BRIEFING_HOURS:
            raise HTTPException(status_code=400, detail="Invalid briefing time")

        current_user.briefing_enabled  = body.briefing_enabled
        current_user.briefing_time     = body.briefing_time
        current_user.briefing_timezone = body.briefing_timezone

        await db.commit()
        await db.refresh(current_user)

        return {
            "success":          True,
            "message":          "Briefing settings saved",
            "briefing_enabled": current_user.briefing_enabled,
            "briefing_time":    current_user.briefing_time,
            "briefing_timezone": current_user.briefing_timezone,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"save_briefing_settings error: {traceback.format_exc()}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /briefing/send ───────────────────────────────────────

@router.post("/send")
async def send_briefing(
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    try:
        uid   = get_uid(current_user)
        email = str(current_user.email)
        name  = getattr(current_user, "full_name", "") or email

        data = await gather_business_data(db, uid)
        html = await generate_briefing_with_ai(data)

        result = await send_email(
            to_email  = email,
            subject   = f"📊 LedgerFlow Morning Briefing — {data['date']}",
            body_html = html,
            to_name   = name,
        )

        if result.get("success"):
            try:
                current_user.last_briefing_at = datetime.utcnow()
                await db.commit()
            except Exception:
                pass

        return result

    except Exception as e:
        print(f"send_briefing error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /briefing/preview ─────────────────────────────────────

@router.get("/preview")
async def preview_briefing(
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    try:
        uid  = get_uid(current_user)
        data = await gather_business_data(db, uid)
        html = await generate_briefing_with_ai(data)
        return {
            "success": True,
            "date":    data["date"],
            "html":    html,
            "data":    data,
        }
    except Exception as e:
        print(f"preview_briefing error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))