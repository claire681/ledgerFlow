"""
LedgerFlow AI Service
Powers the intelligent assistant throughout the app.
No provider names exposed — this is LedgerFlow AI.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import AIConversation
from app.services.memory_service import (
    build_memory_prompt,
    extract_memories_from_conversation,
)
from app.services.activity_service import log_activity
from app.core.config import settings
from typing import Optional, Tuple
from datetime import datetime
import uuid
import httpx
import json


# ── System prompt ─────────────────────────────────────────────────────────

LEDGERFLOW_SYSTEM_PROMPT = """You are LedgerFlow AI — an intelligent financial assistant built into LedgerFlow.
You help small business owners understand their finances using their REAL data.
NEVER mention third-party AI providers. You are LedgerFlow AI only.
ALWAYS use actual numbers from the data provided. Never say $0 if real data shows other values.
Keep responses concise, specific, and end with a recommended action.
"""


# ── Get conversation history ──────────────────────────────────────────────

async def get_conversation_history(
    db:         AsyncSession,
    user_id:    str,
    session_id: str,
    limit:      int = 10,
) -> list[dict]:
    try:
        result = await db.execute(
            select(AIConversation)
            .where(
                AIConversation.user_id    == user_id,
                AIConversation.session_id == session_id,
            )
            .order_by(AIConversation.created_at)
            .limit(limit)
        )
        conversations = result.scalars().all()
        return [
            {"role": c.role, "content": c.content}
            for c in conversations
        ]
    except Exception as e:
        print(f"Get conversation history error: {e}")
        return []


# ── Save conversation message ─────────────────────────────────────────────

async def save_conversation_message(
    db:               AsyncSession,
    user_id:          str,
    session_id:       str,
    role:             str,
    content:          str,
    page:             Optional[str]  = None,
    context_snapshot: Optional[dict] = None,
    tokens_used:      Optional[int]  = None,
):
    try:
        message = AIConversation(
            id               = str(uuid.uuid4()),
            user_id          = user_id,
            session_id       = session_id,
            page             = page,
            role             = role,
            content          = content,
            context_snapshot = context_snapshot,
            tokens_used      = tokens_used,
        )
        db.add(message)
        await db.commit()
    except Exception as e:
        print(f"Failed to save conversation message: {e}")
        try:
            await db.rollback()
        except Exception:
            pass


# ── Call AI API ───────────────────────────────────────────────────────────

async def call_ai_api(messages: list[dict]) -> Tuple[str, Optional[int]]:
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type":  "application/json",
            },
            json={
                "model":       "gpt-4o-mini",
                "messages":    messages,
                "max_tokens":  1024,
                "temperature": 0.7,
            },
        )
        response.raise_for_status()
        data        = response.json()
        reply       = data["choices"][0]["message"]["content"]
        tokens_used = data.get("usage", {}).get("total_tokens", None)
        return reply, tokens_used


# ── Contextual suggestions ────────────────────────────────────────────────

def get_contextual_suggestions(
    page:         Optional[str],
    page_context: Optional[dict],
) -> list[str]:
    # Frontend handles suggestions — return empty
    return []


# ── Generate dashboard insights ───────────────────────────────────────────

async def generate_dashboard_insights(
    db:        AsyncSession,
    user_id:   str,
    real_data: str = "",
) -> list[dict]:
    """
    Generates business insights from real financial data only.
    For small datasets uses fallback parser directly — no AI hallucination.
    """
    if not real_data or real_data.strip() == "":
        return _fallback_insights("")

    # Parse real values first
    income   = 0.0
    expenses = 0.0
    docs     = 0

    for line in real_data.splitlines():
        line = line.strip()
        try:
            if "Total income all time:" in line:
                income = float(line.split("$")[1].replace(",", ""))
            elif "Total expenses all time:" in line:
                expenses = float(line.split("$")[1].replace(",", ""))
            elif line.startswith("DOCUMENTS:"):
                for p in line.split("|"):
                    if "Total=" in p:
                        docs = int(p.split("=")[1].strip())
        except Exception:
            pass

    # If data is small (less than $1000 total activity) use fallback directly
    # This prevents AI from hallucinating large fake numbers
    if income + expenses < 1000:
        return _fallback_insights(real_data)

    # For larger datasets use AI
    try:
        prompt = f"""You are a financial analyst for a small business finance app.
Analyze the real financial data below and generate exactly 4 business insights.
Use ONLY the numbers from the data. Do not invent numbers not present in the data.

STRICT RULES:
- Only use numbers that appear in the data below
- NEVER mention: database, schema, column, migration, SQL, error, or any technical term
- If a number is not in the data, do not reference it

REAL FINANCIAL DATA:
{real_data}

Return ONLY a valid JSON array, no markdown:
[
  {{
    "type": "warning|opportunity|info|success",
    "title": "Short title max 8 words",
    "description": "Specific insight using real numbers only. Max 2 sentences.",
    "action": "One specific action the business owner should take",
    "priority": "high|medium|low"
  }}
]"""

        messages = [
            {
                "role":    "system",
                "content": "You are a financial analyst. Only use numbers from the data provided. Never invent numbers. Return only valid JSON array.",
            },
            {
                "role":    "user",
                "content": prompt,
            },
        ]

        reply, _ = await call_ai_api(messages)

        clean = reply.strip()
        if "```" in clean:
            parts = clean.split("```")
            clean = parts[1] if len(parts) > 1 else clean
            if clean.startswith("json"):
                clean = clean[4:]
        clean = clean.strip()

        insights = json.loads(clean)

        BLOCKED = [
            "database", "schema", "column", "migration", "table", "sql",
            "accepted_at", "team_members", "error", "missing column",
        ]
        filtered = []
        for insight in insights:
            text = (
                insight.get("title", "") +
                insight.get("description", "") +
                insight.get("action", "")
            ).lower()
            if not any(b in text for b in BLOCKED):
                filtered.append(insight)

        return filtered[:4] if filtered else _fallback_insights(real_data)

    except Exception as e:
        print(f"Dashboard insights error: {e}")
        return _fallback_insights(real_data)

    except Exception as e:
        print(f"DASHBOARD CONTEXT ERROR: {e}")
        import traceback
        traceback.print_exc()
        return f"Dashboard context error: {e}"

def _fallback_insights(real_data: str) -> list[dict]:
    """
    Parses real_data string directly to produce safe financial insights.
    Never returns database errors.
    """
    income   = 0.0
    expenses = 0.0
    profit   = 0.0
    docs     = 0
    overdue  = 0

    for line in (real_data or "").splitlines():
        line = line.strip()
        try:
            if "Total income all time:" in line:
                income = float(line.split("$")[1].replace(",", ""))
            elif "Total expenses all time:" in line:
                expenses = float(line.split("$")[1].replace(",", ""))
            elif "Net profit:" in line:
                profit = float(line.split("$")[1].replace(",", ""))
            elif line.startswith("DOCUMENTS:"):
                for p in line.split("|"):
                    if "Total=" in p:
                        docs = int(p.split("=")[1].strip())
            elif line.startswith("INVOICES:"):
                for p in line.split("|"):
                    if "Overdue=" in p:
                        try:
                            overdue = int(p.split("=")[1].split(" ")[0].strip())
                        except Exception:
                            pass
        except Exception:
            pass

    insights = []

    if income > 0 or expenses > 0:
        insights.append({
            "type":        "success" if profit >= 0 else "warning",
            "title":       "Current financial position",
            "description": f"Revenue is ${income:,.2f} with ${expenses:,.2f} in expenses, giving a net profit of ${profit:,.2f}.",
            "action":      "Review your top expense categories to find savings opportunities",
            "priority":    "high",
        })

    if overdue > 0:
        insights.append({
            "type":        "warning",
            "title":       f"{overdue} invoice{'s' if overdue > 1 else ''} overdue",
            "description": f"You have {overdue} overdue invoice{'s' if overdue > 1 else ''} that need follow-up to protect your cash flow.",
            "action":      "Go to Invoices and send reminders to clients with outstanding balances",
            "priority":    "high",
        })

    if docs > 0:
        insights.append({
            "type":        "info",
            "title":       f"{docs} document{'s' if docs > 1 else ''} on record",
            "description": f"You have {docs} document{'s' if docs > 1 else ''} uploaded and processed in LedgerFlow.",
            "action":      "Open Documents to verify all extracted data is correctly categorized",
            "priority":    "low",
        })

    tax = profit * 0.15 if profit > 0 else 0
    if tax > 0:
        insights.append({
            "type":        "info",
            "title":       "Estimated tax to set aside",
            "description": f"At a 15% rate your estimated tax on ${profit:,.2f} profit is ${tax:,.2f}.",
            "action":      "Open Tax Calculator and run a full estimate with deductions applied",
            "priority":    "medium",
        })

    if not insights:
        insights.append({
            "type":        "info",
            "title":       "Build your financial picture",
            "description": "Upload documents or create transactions to see real business insights here.",
            "action":      "Go to Documents and upload your first receipt or invoice",
            "priority":    "high",
        })

    return insights[:4]


# ── Legacy function kept for compatibility ────────────────────────────────

async def ask_ledgerflow_ai(
    db:           AsyncSession,
    user_id:      str,
    question:     str,
    session_id:   Optional[str]  = None,
    page_context: Optional[dict] = None,
    page:         Optional[str]  = None,
) -> dict:
    """Legacy function. Main AI calls now go through ai_context.py /ai/ask route."""
    if not session_id:
        session_id = str(uuid.uuid4())

    history = await get_conversation_history(db, user_id, session_id)

    messages = [
        {"role": "system", "content": LEDGERFLOW_SYSTEM_PROMPT},
    ] + history + [
        {"role": "user", "content": question},
    ]

    await save_conversation_message(
        db, user_id, session_id,
        role    = "user",
        content = question,
        page    = page,
    )

    tokens_used = None
    try:
        reply, tokens_used = await call_ai_api(messages)
    except Exception as e:
        print(f"AI call failed: {e}")
        reply = "I am having trouble connecting right now. Please try again."

    await save_conversation_message(
        db, user_id, session_id,
        role        = "assistant",
        content     = reply,
        page        = page,
        tokens_used = tokens_used,
    )

    try:
        await log_activity(
            db, user_id,
            action_type = "ai_question_asked",
            page        = page,
            action_data = {"question": question[:100], "tokens_used": tokens_used},
        )
    except Exception:
        pass

    try:
        await extract_memories_from_conversation(db, user_id, question, reply)
    except Exception:
        pass

    return {
        "reply":       reply,
        "session_id":  session_id,
        "suggestions": [],
        "tokens_used": tokens_used,
    }