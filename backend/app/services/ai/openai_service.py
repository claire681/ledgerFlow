import json
from openai import AsyncOpenAI
from app.core.config import settings
import os

from openai import AsyncOpenAI
from dotenv import load_dotenv
import os

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def call_ai_api(messages):
    response = await client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        messages=messages,
        temperature=0.3,
    )
    return response.choices[0].message.content

client = AsyncOpenAI(api_key=settings.openai_api_key)

ACCOUNTING_SYSTEM = """You are an expert AI accounting assistant for a business accounting platform.
You help with: analyzing invoices/receipts, categorizing transactions (GAAP),
syncing to QuickBooks, generating financial reports, flagging anomalies.
Be concise and professional. Use proper accounting terminology."""

EXTRACTION_SYSTEM = """You are a financial document data extraction AI.
Extract structured data from the provided document text.
Return ONLY valid JSON with these exact fields:
{
  "vendor": string,
  "doc_date": string (YYYY-MM-DD),
  "total_amount": number,
  "currency": string (3-letter code),
  "tax_amount": number or null,
  "line_items": [{"description": string, "amount": number}],
  "doc_type": "invoice"|"receipt"|"statement"|"contract"|"other",
  "suggested_category": string,
  "confidence": number (0.0-1.0),
  "notes": string
}
Return ONLY the JSON object, no markdown, no explanation."""


async def extract_document_data(text: str) -> dict:
    """Use GPT-4o to extract structured data from raw document text."""
    response = await client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": EXTRACTION_SYSTEM},
            {"role": "user",   "content": f"Extract data from this document:\n\n{text[:8000]}"},
        ],
        temperature=0.1,
    )
    raw = response.choices[0].message.content
    return json.loads(raw)


async def agent_chat(messages: list[dict], context: str = "") -> str:
    """Multi-turn accounting agent chat."""
    system = ACCOUNTING_SYSTEM
    if context:
        system += f"\n\nUser financial context:\n{context}"

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[{"role": "system", "content": system}] + messages,
        temperature=0.7,
        max_tokens=1000,
    )
    return response.choices[0].message.content


async def categorize_transaction(
    vendor: str, amount: float, description: str = ""
) -> dict:
    """Ask GPT to suggest a category for a transaction."""
    prompt = f"""Categorize this business transaction:
Vendor: {vendor}
Amount: ${amount}
Description: {description}

Return JSON:
{{
  "category": string,
  "subcategory": string,
  "confidence": float,
  "is_deductible": bool
}}"""

    response = await client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are an accounting categorization AI. Return only JSON."},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.1,
    )
    return json.loads(response.choices[0].message.content)


async def generate_report(report_type: str, data: dict) -> str:
    """Generate a narrative financial report."""
    prompt = f"""Generate a professional {report_type} report based on this data:
{json.dumps(data, indent=2)}

Format it clearly with sections, key insights, and recommendations."""

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": ACCOUNTING_SYSTEM},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.5,
        max_tokens=2000,
    )
    return response.choices[0].message.content

async def agent_chat(messages: list[dict], context: str = "") -> str:
    """Multi-turn accounting agent chat."""
    system = ACCOUNTING_SYSTEM
    if context:
        system += f"\n\nUser financial context:\n{context}"

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[{"role": "system", "content": system}] + messages,
        temperature=0.7,
        max_tokens=1000,
    )
    return response.choices[0].message.content