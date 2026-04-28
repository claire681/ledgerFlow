import json
import google.generativeai as genai
from app.core.config import settings

genai.configure(api_key=settings.gemini_api_key)


def _get_model(model_name: str = None):
    return genai.GenerativeModel(model_name or settings.gemini_model)


EXTRACTION_PROMPT = """You are a financial document data extraction AI.
Extract data and return ONLY a valid JSON object with these fields:
vendor, doc_date (YYYY-MM-DD), total_amount (number), currency (3-letter),
tax_amount (number or null), line_items ([{description, amount}]),
doc_type (invoice/receipt/statement/contract/other),
suggested_category, confidence (0.0-1.0), notes.
No markdown fences. Pure JSON only."""


async def extract_document_data(text: str) -> dict:
    """Use Gemini to extract structured data from document text."""
    model = _get_model()
    prompt = f"{EXTRACTION_PROMPT}\n\nDocument text:\n{text[:8000]}"

    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.1,
            response_mime_type="application/json",
        ),
    )
    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


async def agent_chat(messages: list[dict], context: str = "") -> str:
    """Multi-turn chat with Gemini."""
    model = _get_model()

    system_msg = "You are an expert AI accounting assistant. Help with invoices, categorization, reports, and financial analysis."
    if context:
        system_msg += f"\n\nUser context:\n{context}"

    history = []
    for m in messages[:-1]:
        history.append({
            "role":  "user" if m["role"] == "user" else "model",
            "parts": [m["content"]],
        })

    chat = model.start_chat(history=history)
    last_msg = messages[-1]["content"] if messages else "Hello"
    response = chat.send_message(last_msg)
    return response.text


async def categorize_transaction(
    vendor: str, amount: float, description: str = ""
) -> dict:
    """Gemini-based transaction categorization."""
    model = _get_model()
    prompt = f"""Categorize this transaction. Return ONLY JSON.
Vendor: {vendor}
Amount: ${amount}
Description: {description}

Fields: category, subcategory, confidence (float), is_deductible (bool)"""

    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.1,
            response_mime_type="application/json",
        ),
    )
    raw = response.text.strip().lstrip("```json").rstrip("```").strip()
    return json.loads(raw)

async def agent_chat(messages: list[dict], context: str = "") -> str:
    """Multi-turn chat with Gemini."""
    model = _get_model()
    system_msg = "You are an expert AI accounting assistant."
    if context:
        system_msg += f"\n\nUser context:\n{context}"

    history = []
    for m in messages[:-1]:
        history.append({
            "role":  "user" if m["role"] == "user" else "model",
            "parts": [m["content"]],
        })

    chat = model.start_chat(history=history)
    last_msg = messages[-1]["content"] if messages else "Hello"
    response = chat.send_message(last_msg)
    return response.text