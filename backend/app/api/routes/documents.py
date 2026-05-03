from datetime import datetime, timedelta
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sql_delete, text
from app.db.database import get_db, AsyncSessionLocal
from app.core.security import get_current_user
from app.core.config import settings
from app.models.models import Document, Transaction, AgentLog, Invoice, UploadJob
from app.services.activity_service import log_activity
from app.services.s3_service import (
    upload_file_to_s3, download_file_from_s3,
    delete_file_from_s3, file_exists_in_s3,
)
from pydantic import BaseModel
from typing import Optional
import uuid
import traceback
import re
import mimetypes
import io

router = APIRouter(prefix="/documents", tags=["Documents"])


class DocumentUpdate(BaseModel):
    vendor:         Optional[str]   = None
    client_name:    Optional[str]   = None
    total_amount:   Optional[float] = None
    currency:       Optional[str]   = None
    doc_date:       Optional[str]   = None
    suggested_cat:  Optional[str]   = None
    status:         Optional[str]   = None
    payment_status: Optional[str]   = None
    notes:          Optional[str]   = None


# ── S3 key helpers ────────────────────────────────────────────

def build_s3_key(doc_id: str, filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return f"documents/{doc_id}{ext}"


def guess_media_type(filename: str) -> str:
    media_type, _ = mimetypes.guess_type(filename)
    return media_type or "application/octet-stream"


VALID_DOC_TYPES = {
    "receipt", "invoice_sent", "invoice_received",
    "bank_statement", "contract", "other",
}


def safe_doc_type(value: str) -> str:
    if not value:
        return "receipt"
    cleaned = str(value).lower().strip()
    return cleaned if cleaned in VALID_DOC_TYPES else "receipt"


def safe_status(value: str) -> str:
    valid = {"pending", "processed", "review", "failed"}
    if not value:
        return "pending"
    cleaned = str(value).lower().strip()
    return cleaned if cleaned in valid else "pending"


def determine_payment_status(
    doc_type: str,
    due_date: Optional[str],
    extracted_payment_status: str,
) -> str:
    if doc_type == "receipt":
        return "paid"
    if extracted_payment_status == "paid":
        return "paid"
    if doc_type in ("invoice_sent", "invoice_received"):
        if due_date:
            try:
                due = datetime.strptime(due_date, "%Y-%m-%d")
                if datetime.utcnow() > due:
                    return "overdue"
            except Exception:
                pass
        return "due"
    return "paid"


# ── Client name extraction ────────────────────────────────────

def extract_client_name_from_text(raw_text: str) -> Optional[str]:
    if not raw_text:
        return None

    bill_to_patterns = [
        r'bill\s+to[:\s]*\n([^\n]+)',
        r'billed?\s+to[:\s]*\n([^\n]+)',
        r'customer[:\s]*\n([^\n]+)',
        r'client[:\s]*\n([^\n]+)',
        r'sold\s+to[:\s]*\n([^\n]+)',
        r'ship\s+to[:\s]*\n([^\n]+)',
        r'invoice\s+to[:\s]*\n([^\n]+)',
        r'bill\s+to[:\s]+([A-Z][a-zA-Z\s]{2,40})',
        r'customer[:\s]+([A-Z][a-zA-Z\s]{2,40})',
        r'client[:\s]+([A-Z][a-zA-Z\s]{2,40})',
        r'sold\s+to[:\s]+([A-Z][a-zA-Z\s]{2,40})',
    ]

    skip_patterns = [
        r'\d{3}[-.\s]\d{3}[-.\s]\d{4}',
        r'[\w.+-]+@[\w-]+\.[a-z]{2,}',
        r'\d{1,5}\s+\w+\s+(st|ave|rd|blvd|dr|lane|ln|way|court|ct)',
        r'^\d+$',
        r'\d{4}-\d{2}-\d{2}',
        r'(invoice|receipt|total|amount|date|due|tax|gst|hst)',
        r'(po box|p\.o\. box)',
    ]

    text_lower = raw_text.lower()

    for pattern in bill_to_patterns:
        match = re.search(pattern, text_lower, re.IGNORECASE | re.MULTILINE)
        if match:
            candidate = match.group(1).strip()
            skip = any(re.search(sp, candidate, re.IGNORECASE) for sp in skip_patterns)
            if skip:
                continue
            words = candidate.split()
            if len(words) < 1 or len(candidate) < 3:
                continue
            cleaned = re.sub(r'[^a-zA-Z\s\-\.]', '', candidate).strip()
            if len(cleaned) >= 3:
                orig_match = re.search(
                    re.escape(match.group(1).strip()[:20]),
                    raw_text, re.IGNORECASE
                )
                if orig_match:
                    orig = raw_text[orig_match.start():orig_match.start() + len(cleaned)]
                    return orig.strip()
                return cleaned.title()

    return None


# ── Invoice link helper ───────────────────────────────────────

async def find_invoice_for_document(
    db: AsyncSession,
    user_id: str,
    d: Document,
) -> Optional[Invoice]:
    result = await db.execute(
        select(Invoice)
        .where(
            Invoice.user_id == user_id,
            Invoice.notes   == f"Auto-created from: {d.filename}",
        )
        .order_by(Invoice.created_at.desc())
    )
    return result.scalars().first()


async def doc_to_dict(db: AsyncSession, d: Document) -> dict:
    linked_invoice = await find_invoice_for_document(db, d.user_id, d)

    # Check if file exists in S3
    s3_key   = build_s3_key(str(d.id), d.filename)
    has_file = file_exists_in_s3(s3_key)

    raw_payment_status = getattr(d, "payment_status", None) or "paid"
    if raw_payment_status not in ("paid", "overdue", "due", "partially_paid"):
        raw_payment_status = "paid"

    doc_type = safe_doc_type(getattr(d, "doc_type", None))
    if raw_payment_status == "due" and doc_type in ("invoice_sent", "invoice_received"):
        if d.doc_date:
            try:
                due = datetime.strptime(d.doc_date, "%Y-%m-%d")
                if datetime.utcnow() > due:
                    raw_payment_status = "overdue"
            except Exception:
                pass

    return {
        "id":               str(d.id),
        "filename":         d.filename,
        "file_type":        d.file_type,
        "file_size":        d.file_size,
        "vendor":           d.vendor,
        "client_name":      getattr(d, "client_name", None),
        "total_amount":     d.total_amount,
        "tax_amount":       d.tax_amount,
        "currency":         d.currency or "USD",
        "doc_date":         d.doc_date,
        "suggested_cat":    d.suggested_cat,
        "confidence":       d.confidence,
        "status":           safe_status(d.status),
        "payment_status":   raw_payment_status,
        "paid_at":          d.paid_at.isoformat() if getattr(d, "paid_at", None) else None,
        "notes":            d.notes,
        "is_deductible":    d.is_deductible,
        "deduction_pct":    d.deduction_pct,
        "doc_type":         doc_type,
        "recorded_as":      getattr(d, "recorded_as", None) or "expense",
        "uploaded_at":      d.uploaded_at.isoformat() if d.uploaded_at else None,
        "has_file":         has_file,
        "view_url":         f"/documents/{d.id}/view",
        "download_url":     f"/documents/{d.id}/download",
        "linked_invoice_id":       str(linked_invoice.id)                if linked_invoice else None,
        "linked_invoice_number":   linked_invoice.invoice_number         if linked_invoice else None,
        "linked_invoice_view_url": f"/invoices/{linked_invoice.id}/view" if linked_invoice else None,
    }


# ── Smart categorization ──────────────────────────────────────

CATEGORY_RULES = [
    (["brightcare", "caregiver", "home health", "homecare", "care worker",
      "nursing", "personal support", "psw", "healthcare worker"],
     "Caregiver Wages"),
    (["anthropic", "openai", "chatgpt", "github", "aws", "amazon web",
      "google cloud", "microsoft", "azure", "dropbox", "slack", "zoom",
      "notion", "figma", "canva", "hubspot", "quickbooks", "xero",
      "software", "saas", "subscription", "license", "app store"],
     "Software & SaaS"),
    (["uber", "lyft", "taxi", "gas station", "fuel", "petro", "shell",
      "esso", "bp", "chevron", "parking", "transit", "bus", "train",
      "airline", "flight", "mileage", "transport"],
     "Transportation"),
    (["office depot", "staples", "best buy", "office", "supplies",
      "stationery", "printer", "ink", "toner", "paper", "pen"],
     "Office Supplies"),
    (["rent", "lease", "property", "facility", "building", "landlord",
      "mortgage", "storage", "coworking", "wework"],
     "Rent & Facilities"),
    (["insurance", "insure", "coverage", "policy", "premium", "allstate",
      "state farm", "intact", "desjardins", "sunlife", "manulife"],
     "Insurance"),
    (["hydro", "electricity", "water", "gas utility", "internet", "wifi",
      "phone", "mobile", "rogers", "bell", "telus", "shaw", "cogeco",
      "utility", "utilities", "enbridge"],
     "Utilities"),
    (["restaurant", "cafe", "coffee", "starbucks", "tim hortons",
      "mcdonald", "subway", "pizza", "doordash", "uber eats", "skip",
      "grubhub", "food", "meal", "catering", "grocery", "supermarket"],
     "Food & Meals"),
    (["facebook", "instagram", "google ads", "meta", "advertising",
      "marketing", "promotion", "campaign", "seo", "mailchimp",
      "newsletter", "social media"],
     "Marketing"),
    (["lawyer", "legal", "accountant", "consultant", "advisor",
      "professional", "contractor", "freelancer", "agency"],
     "Professional Services"),
    (["payroll", "salary", "wages", "paycheque", "employee",
      "staff", "worker pay", "direct deposit"],
     "Payroll"),
    (["apple", "dell", "hp", "lenovo", "monitor", "laptop", "computer",
      "keyboard", "mouse", "hardware", "equipment", "tool", "device",
      "iphone", "ipad", "macbook"],
     "Hardware & Equipment"),
]


def smart_categorize(vendor: str, raw_text: str, ai_category: str) -> str:
    search_text = f"{vendor or ''} {raw_text or ''}".lower()
    for keywords, category in CATEGORY_RULES:
        for keyword in keywords:
            if keyword.lower() in search_text:
                return category
    if ai_category and ai_category.lower() not in ("other", "income", "", "none"):
        return ai_category
    if vendor:
        return vendor.split()[0].title() + " Expense"
    return "General Expense"


def detect_payment_status(raw_text: str, extracted: dict) -> str:
    text_lower = (raw_text or "").lower()
    for kw in ["payment received", "paid in full", "thank you for your payment",
               "amount paid", "balance: $0", "balance: 0.00",
               "payment confirmation", "transaction complete", "approved",
               "zero balance", "settled"]:
        if kw in text_lower:
            return "paid"
    for kw in ["overdue", "past due", "payment overdue", "late payment",
               "collection", "final notice"]:
        if kw in text_lower:
            return "overdue"
    for kw in ["amount due", "balance due", "please pay", "payment due",
               "due date", "owing", "please remit"]:
        if kw in text_lower:
            return "due"
    if extracted.get("due_date"):
        return "due"
    return "draft"


def extract_text(file_bytes: bytes, filename: str) -> tuple[str, str]:
    ext          = Path(filename).suffix.lower().lstrip(".")
    text_content = ""
    try:
        if ext == "pdf":
            try:
                import pdfplumber, io
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    text_content = "\n".join(page.extract_text() or "" for page in pdf.pages)
            except Exception:
                text_content = file_bytes.decode("utf-8", errors="ignore")
        elif ext == "csv":
            text_content = file_bytes.decode("utf-8", errors="ignore")
        elif ext in ("png", "jpg", "jpeg", "tiff", "webp"):
            try:
                import pytesseract
                from PIL import Image
                import io
                text_content = pytesseract.image_to_string(Image.open(io.BytesIO(file_bytes)))
            except Exception:
                text_content = ""
        else:
            text_content = file_bytes.decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"Text extraction error: {e}")
        text_content = ""
    return text_content.strip(), ext


async def extract_with_ai(raw_text: str, filename: str) -> dict:
    if not raw_text or len(raw_text.strip()) < 5:
        return {}
    try:
        import httpx, json as json_lib

        prompt = f"""You are a financial document classifier and data extractor.

Classify this document into ONE of:
- "receipt" — receipt for something user BOUGHT (expense, already paid)
- "invoice_sent" — invoice user SENT to a client (income to collect)
- "invoice_received" — invoice FROM a vendor (expense to pay)
- "bank_statement" — bank or credit card statement
- "contract" — contract or agreement
- "other" — anything else

Detect payment status:
- "paid" — payment received or completed
- "due" — amount still owed
- "overdue" — payment is late
- "draft" — unclear or new

Return ONLY this JSON:
{{
  "doc_type": "receipt|invoice_sent|invoice_received|bank_statement|contract|other",
  "payment_status": "paid|due|overdue|draft",
  "vendor": "company or person who issued this, or null",
  "client_name": "BILL TO / customer / client name if present, or null",
  "total_amount": 0.00,
  "tax_amount": 0.00,
  "currency": "USD",
  "doc_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "invoice_number": "invoice number if present or null",
  "suggested_category": "Software & SaaS, Marketing, Rent & Facilities, Professional Services, Payroll, Transportation, Office Supplies, Hardware & Equipment, Insurance, Utilities, Food & Meals, Income, or Other",
  "confidence": 0.85,
  "notes": "one line summary"
}}

Document filename: {filename}
Document text:
{raw_text[:3000]}

Return ONLY valid JSON. No markdown."""

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type":  "application/json",
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "You are a financial document classifier. Return only valid JSON."},
                        {"role": "user",   "content": prompt},
                    ],
                    "max_tokens": 400,
                    "temperature": 0.1,
                },
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            clean   = content.strip()
            if "```" in clean:
                parts = clean.split("```")
                clean = parts[1] if len(parts) > 1 else clean
                if clean.startswith("json"):
                    clean = clean[4:]
            return json_lib.loads(clean.strip())
    except Exception as e:
        print(f"AI extraction error: {e}")
        return {}


def extract_basic(raw_text: str, filename: str) -> dict:
    result = {}
    if raw_text:
        for pattern in [
            r'total[:\s]+\$?([\d,]+\.?\d*)',
            r'amount[:\s]+\$?([\d,]+\.?\d*)',
            r'\$\s*([\d,]+\.\d{2})',
            r'([\d,]+\.\d{2})',
        ]:
            match = re.search(pattern, raw_text.lower())
            if match:
                try:
                    result["total_amount"] = float(match.group(1).replace(",", ""))
                    break
                except Exception:
                    pass
        for pattern in [r'(\d{4}-\d{2}-\d{2})', r'(\d{1,2}/\d{1,2}/\d{4})']:
            match = re.search(pattern, raw_text)
            if match:
                result["doc_date"] = match.group(1)
                break
    stem                 = Path(filename).stem.replace("_", " ").replace("-", " ")
    result["vendor"]     = stem[:50] if stem else None
    result["currency"]   = "USD"
    result["confidence"] = 0.3
    return result


async def get_unique_invoice_number(
    db: AsyncSession, user_id: str, extracted_number: str = None
) -> str:
    if extracted_number:
        existing = await db.execute(
            select(Invoice).where(
                Invoice.user_id        == user_id,
                Invoice.invoice_number == extracted_number,
            )
        )
        if existing.scalar_one_or_none() is None:
            return extracted_number
    counter = 1001
    while True:
        candidate = f"INV-{str(counter).zfill(4)}"
        existing  = await db.execute(
            select(Invoice).where(
                Invoice.user_id        == user_id,
                Invoice.invoice_number == candidate,
            )
        )
        if existing.scalar_one_or_none() is None:
            return candidate
        counter += 1


async def get_document_or_404(
    db: AsyncSession, doc_id: str, user_id: str,
) -> Document:
    result = await db.execute(
        select(Document).where(
            Document.id      == doc_id,
            Document.user_id == user_id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


async def update_upload_job(
    db: AsyncSession,
    job_id: str,
    step: str,
    progress: int,
    status: str = "processing",
    error_message: Optional[str] = None,
):
    result = await db.execute(select(UploadJob).where(UploadJob.id == job_id))
    job    = result.scalar_one_or_none()
    if not job:
        return
    job.current_step  = step
    job.progress      = progress
    job.status        = status
    job.error_message = error_message
    job.updated_at    = datetime.utcnow()
    await db.commit()


async def process_document_upload_job(
    job_id:     str,
    user_id:    str,
    filename:   str,
    file_bytes: bytes,
    txn_type:   str,
):
    async with AsyncSessionLocal() as db:
        try:
            await update_upload_job(db, job_id, "reading_document", 15)
            raw_text, file_ext = extract_text(file_bytes, filename)
            await update_upload_job(db, job_id, "extracting_data", 35)

            doc = Document(
                id=str(uuid.uuid4()),
                user_id=user_id,
                filename=filename,
                file_type=file_ext,
                file_size=len(file_bytes),
                status="pending",
                currency="USD",
                doc_type=None,
                recorded_as=None,
                client_name=None,
                payment_status=None,
            )
            db.add(doc)
            await db.flush()

            # ── Upload to S3 instead of local storage ────────
            s3_key = build_s3_key(str(doc.id), filename)
            content_type = guess_media_type(filename)
            upload_file_to_s3(
                file_bytes   = file_bytes,
                filename     = filename,
                folder       = "documents",
                content_type = content_type,
            )
            # Store s3_key in file_path column
            doc.file_path = s3_key 
            has_openai = (
                bool(settings.openai_api_key)
                and settings.openai_api_key.startswith("sk-")
                and len(settings.openai_api_key) > 20
            )

            extracted = {}
            if has_openai and raw_text:
                extracted = await extract_with_ai(raw_text, filename)
            if not extracted:
                extracted = extract_basic(raw_text, filename)

            await update_upload_job(db, job_id, "classifying", 55)

            ai_doc_type = safe_doc_type(extracted.get("doc_type", "receipt"))

            if txn_type == "income":
                doc_type = "invoice_sent"
            elif txn_type == "expense":
                doc_type = "receipt"
            else:
                doc_type = ai_doc_type

            doc_type    = safe_doc_type(doc_type)
            recorded_as = "income" if doc_type == "invoice_sent" else "expense"

            ai_client_name    = extracted.get("client_name")
            regex_client_name = extract_client_name_from_text(raw_text)
            client_name       = ai_client_name or regex_client_name
            if client_name:
                client_name = str(client_name).strip()[:200]
                if len(client_name) < 2:
                    client_name = None

            ai_payment_status = extracted.get("payment_status", "")
            detected_ps       = detect_payment_status(raw_text, extracted)
            raw_ps            = ai_payment_status if ai_payment_status in (
                "paid", "due", "overdue", "draft"
            ) else detected_ps

            payment_status = determine_payment_status(
                doc_type,
                extracted.get("due_date"),
                raw_ps,
            )

            doc.notes = extracted.get("notes") or doc.notes

            ai_category = (
                extracted.get("suggested_category")
                or extracted.get("suggested_cat")
                or ""
            )
            smart_category = smart_categorize(
                extracted.get("vendor", "") or Path(filename).stem,
                raw_text,
                ai_category,
            )

            doc.vendor         = extracted.get("vendor")
            doc.client_name    = client_name
            doc.total_amount   = extracted.get("total_amount")
            doc.tax_amount     = extracted.get("tax_amount")
            doc.currency       = extracted.get("currency", "USD")
            doc.doc_date       = extracted.get("doc_date")
            doc.suggested_cat  = smart_category
            doc.confidence     = float(extracted.get("confidence", 0.3))
            doc.status         = "processed" if (doc.confidence or 0) >= 0.7 else "review"
            doc.doc_type       = doc_type
            doc.recorded_as    = recorded_as
            doc.payment_status = payment_status

            await update_upload_job(db, job_id, "saving_document", 70)

            transaction_created = False
            auto_invoice        = None
            extracted_amount    = doc.total_amount

            if extracted_amount and float(extracted_amount) > 0:
                amount = float(extracted_amount)

                if doc_type in ("receipt", "invoice_received"):
                    txn = Transaction(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        document_id=doc.id,
                        vendor=doc.vendor or Path(filename).stem,
                        amount=amount,
                        currency=doc.currency or "USD",
                        txn_date=doc.doc_date or datetime.utcnow().strftime("%Y-%m-%d"),
                        category=smart_category,
                        ml_category=smart_category,
                        txn_type="expense",
                        status="ok",
                    )
                    db.add(txn)
                    transaction_created = True

                elif doc_type == "invoice_sent":
                    inv_number = await get_unique_invoice_number(
                        db, user_id, extracted.get("invoice_number"),
                    )
                    due_date = extracted.get("due_date") or (
                        datetime.utcnow() + timedelta(days=30)
                    ).strftime("%Y-%m-%d")

                    auto_invoice = Invoice(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        invoice_number=inv_number,
                        date=doc.doc_date or datetime.utcnow().strftime("%Y-%m-%d"),
                        due_date=due_date,
                        to_name=client_name or doc.vendor or "Client",
                        from_name="",
                        subtotal=amount,
                        tax_amount=float(doc.tax_amount or 0),
                        total=amount,
                        currency=doc.currency or "USD",
                        status=payment_status,
                        notes=f"Auto-created from: {doc.filename}",
                        line_items=[{
                            "description": smart_category,
                            "quantity":    1,
                            "price":       amount,
                        }],
                    )
                    db.add(auto_invoice)

                    txn = Transaction(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        document_id=doc.id,
                        vendor=client_name or doc.vendor or "Client",
                        amount=amount,
                        currency=doc.currency or "USD",
                        txn_date=doc.doc_date or datetime.utcnow().strftime("%Y-%m-%d"),
                        category="Income",
                        ml_category="Income",
                        txn_type="income",
                        status="ok",
                    )
                    db.add(txn)
                    transaction_created = True

            await update_upload_job(db, job_id, "creating_records", 85)
            await db.commit()
            await db.refresh(doc)

            try:
                await log_activity(
                    db, user_id,
                    action_type="document_uploaded",
                    page="documents",
                    action_data={
                        "filename":            filename,
                        "vendor":              doc.vendor,
                        "client_name":         client_name,
                        "amount":              doc.total_amount,
                        "doc_type":            doc_type,
                        "recorded_as":         recorded_as,
                        "payment_status":      payment_status,
                        "status":              doc.status,
                        "transaction_created": transaction_created,
                        "invoice_created":     auto_invoice is not None,
                    },
                )
            except Exception:
                pass

            await update_upload_job(db, job_id, "refreshing_dashboard", 95)
            await update_upload_job(db, job_id, "completed", 100, status="completed")

        except Exception as e:
            await db.rollback()
            print(f"Upload job failed: {traceback.format_exc()}")
            await update_upload_job(
                db, job_id, "failed", 100,
                status="failed", error_message=str(e),
            )


# ── Routes ────────────────────────────────────────────────────

@router.get("/")
async def list_documents(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = str(current_user.id)
    result  = await db.execute(
        select(Document)
        .where(Document.user_id == user_id)
        .order_by(Document.uploaded_at.desc())
    )
    docs = result.scalars().all()
    return [await doc_to_dict(db, d) for d in docs]


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file:             UploadFile   = File(...),
    txn_type:         str          = "auto",
    current_user=Depends(get_current_user),
    db:               AsyncSession = Depends(get_db),
):
    user_id    = str(current_user.id)
    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="File is empty")

    job = UploadJob(
        id=uuid.uuid4(),
        user_id=user_id,
        filename=file.filename,
        status="uploaded",
        current_step="uploading",
        progress=0,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    background_tasks.add_task(
        process_document_upload_job,
        str(job.id),
        user_id,
        file.filename,
        file_bytes,
        txn_type,
    )

    return {
        "job_id":       str(job.id),
        "status":       "uploaded",
        "current_step": "uploading",
        "progress":     0,
        "message":      "Upload started. Processing document.",
    }


@router.get("/upload-status/{job_id}")
async def get_upload_status(
    job_id:      str,
    current_user=Depends(get_current_user),
    db:          AsyncSession = Depends(get_db),
):
    user_id = str(current_user.id)
    result  = await db.execute(
        select(UploadJob).where(
            UploadJob.id      == job_id,
            UploadJob.user_id == user_id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Upload job not found")
    return {
        "job_id":        str(job.id),
        "filename":      job.filename,
        "status":        job.status,
        "current_step":  job.current_step,
        "progress":      job.progress,
        "error_message": job.error_message,
    }


@router.get("/{doc_id}")
async def get_document(
    doc_id:      str,
    current_user=Depends(get_current_user),
    db:          AsyncSession = Depends(get_db),
):
    user_id = str(current_user.id)
    doc     = await get_document_or_404(db, doc_id, user_id)
    return await doc_to_dict(db, doc)


@router.get("/{doc_id}/view")
async def view_document_file(
    doc_id:      str,
    current_user=Depends(get_current_user),
    db:          AsyncSession = Depends(get_db),
):
    user_id  = str(current_user.id)
    doc      = await get_document_or_404(db, doc_id, user_id)
    s3_key   = doc.file_path or build_s3_key(str(doc.id), doc.filename)

    try:
        file_bytes   = download_file_from_s3(s3_key)
        media_type   = guess_media_type(doc.filename)
        return StreamingResponse(
            io.BytesIO(file_bytes),
            media_type=media_type,
            headers={"Content-Disposition": f'inline; filename="{doc.filename}"'},
        )
    except Exception:
        raise HTTPException(status_code=404, detail="File not found in storage")


@router.get("/{doc_id}/download")
async def download_document_file(
    doc_id:      str,
    current_user=Depends(get_current_user),
    db:          AsyncSession = Depends(get_db),
):
    user_id  = str(current_user.id)
    doc      = await get_document_or_404(db, doc_id, user_id)
    s3_key   = doc.file_path or build_s3_key(str(doc.id), doc.filename)

    try:
        file_bytes = download_file_from_s3(s3_key)
        media_type = guess_media_type(doc.filename)
        return StreamingResponse(
            io.BytesIO(file_bytes),
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{doc.filename}"'},
        )
    except Exception:
        raise HTTPException(status_code=404, detail="File not found in storage")


@router.patch("/{doc_id}")
async def update_document(
    doc_id:      str,
    body:        DocumentUpdate,
    current_user=Depends(get_current_user),
    db:          AsyncSession = Depends(get_db),
):
    user_id = str(current_user.id)
    doc     = await get_document_or_404(db, doc_id, user_id)
    for field, value in body.dict(exclude_unset=True).items():
        if value is not None:
            setattr(doc, field, value)
    await db.commit()
    await db.refresh(doc)
    return await doc_to_dict(db, doc)


@router.patch("/{doc_id}/mark-paid")
async def mark_document_paid(
    doc_id:      str,
    current_user=Depends(get_current_user),
    db:          AsyncSession = Depends(get_db),
):
    user_id = str(current_user.id)
    doc     = await get_document_or_404(db, doc_id, user_id)
    doc.payment_status = "paid"
    doc.paid_at        = datetime.utcnow()
    await db.commit()
    await db.refresh(doc)
    return await doc_to_dict(db, doc)


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id:      str,
    current_user=Depends(get_current_user),
    db:          AsyncSession = Depends(get_db),
):
    user_id = str(current_user.id)
    doc     = await get_document_or_404(db, doc_id, user_id)

    # Delete from S3
    s3_key = doc.file_path or build_s3_key(str(doc.id), doc.filename)
    delete_file_from_s3(s3_key)

    try:
        await db.execute(
            text("DELETE FROM agent_logs WHERE document_id = :id"), {"id": doc_id}
        )
        await db.execute(
            sql_delete(Transaction).where(Transaction.document_id == doc_id)
        )
        await db.delete(doc)
        await db.commit()
    except Exception as e:
        await db.rollback()
        print(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

    try:
        await log_activity(
            db, user_id,
            action_type="document_deleted",
            page="documents",
            action_data={"document_id": doc_id},
        )
    except Exception:
        pass