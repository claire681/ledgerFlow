from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Optional, List
from pathlib import Path
import uuid
import os
import html

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import Invoice, Document
from app.services.activity_service import log_activity
from pydantic import BaseModel

router = APIRouter(prefix="/invoices", tags=["Invoices"])


# ── Schemas ───────────────────────────────────────────────────────────────

class InvoiceItem(BaseModel):
    description: str
    quantity: float
    price: float


class InvoiceCreate(BaseModel):
    invoice_number: str
    date: Optional[str] = None
    due_date: Optional[str] = None
    terms: Optional[str] = None
    from_name: Optional[str] = None
    from_email: Optional[str] = None
    from_address: Optional[str] = None
    from_phone: Optional[str] = None
    from_bn: Optional[str] = None
    to_name: Optional[str] = None
    to_email: Optional[str] = None
    to_address: Optional[str] = None
    items: List[InvoiceItem] = []
    notes: Optional[str] = None
    tax_rate: float = 0
    discount: float = 0
    subtotal: float = 0
    tax_amount: float = 0
    total: float = 0
    currency: str = "USD"
    status: str = "draft"
    logo_url: Optional[str] = None


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    invoice_number: Optional[str] = None
    date: Optional[str] = None
    due_date: Optional[str] = None
    terms: Optional[str] = None
    from_name: Optional[str] = None
    from_email: Optional[str] = None
    from_address: Optional[str] = None
    from_phone: Optional[str] = None
    from_bn: Optional[str] = None
    to_name: Optional[str] = None
    to_email: Optional[str] = None
    to_address: Optional[str] = None
    items: Optional[List[InvoiceItem]] = None
    tax_rate: Optional[float] = None
    discount: Optional[float] = None
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    total: Optional[float] = None
    currency: Optional[str] = None
    logo_url: Optional[str] = None


# ── Local invoice file helpers ────────────────────────────────────────────

INVOICE_EXPORT_DIR = Path("uploads/invoices")


def ensure_invoice_export_dir() -> None:
    INVOICE_EXPORT_DIR.mkdir(parents=True, exist_ok=True)


def invoice_file_path(invoice_id: str) -> Path:
    ensure_invoice_export_dir()
    return INVOICE_EXPORT_DIR / f"{invoice_id}.html"


def format_money(amount: Optional[float], currency: Optional[str] = "USD") -> str:
    value = float(amount or 0)
    return f"{currency or 'USD'} {value:,.2f}"


def build_invoice_html(inv: Invoice) -> str:
    def esc(value: Optional[str]) -> str:
        return html.escape(value or "")

    line_items = inv.line_items or []
    rows_html = ""

    if line_items:
        for item in line_items:
            description = esc(str(item.get("description", "")))
            quantity = float(item.get("quantity", 0) or 0)
            price = float(item.get("price", 0) or 0)
            line_total = quantity * price

            rows_html += f"""
                <tr>
                    <td>{description}</td>
                    <td style="text-align:right;">{quantity:,.2f}</td>
                    <td style="text-align:right;">{format_money(price, inv.currency)}</td>
                    <td style="text-align:right;">{format_money(line_total, inv.currency)}</td>
                </tr>
            """
    else:
        rows_html = """
            <tr>
                <td colspan="4" style="text-align:center;color:#666;">No line items</td>
            </tr>
        """

    notes_html = f"""
        <div class="notes-box">
            <div class="section-title">Notes</div>
            <div>{esc(inv.notes)}</div>
        </div>
    """ if inv.notes else ""

    logo_html = f'<img src="{esc(inv.logo_url)}" alt="logo" style="max-height:70px;max-width:180px;object-fit:contain;" />' if inv.logo_url else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice {esc(inv.invoice_number or "Invoice")}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {{
      font-family: Georgia, serif;
      background: #f7f7f8;
      color: #111827;
      margin: 0;
      padding: 24px;
    }}
    .invoice {{
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 48px 52px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    }}
    .top {{
      display: flex;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
      margin-bottom: 40px;
    }}
    .title {{
      font-size: 38px;
      font-weight: 700;
      color: #52b788;
      margin-bottom: 16px;
      font-family: Georgia, serif;
    }}
    .muted {{
      color: #444;
      font-size: 13px;
      line-height: 1.6;
    }}
    .bill-details {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      background: #eaf7f0;
      padding: 24px 28px;
      margin-bottom: 0;
    }}
    .section-title {{
      font-size: 13px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 6px;
    }}
    .detail-row {{
      display: flex;
      gap: 8px;
      font-size: 13px;
      color: #1a1a2e;
      margin-bottom: 3px;
    }}
    .detail-label {{
      min-width: 100px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }}
    th, td {{
      padding: 12px 8px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }}
    th {{
      text-align: left;
      color: #1a1a2e;
      font-size: 13px;
      font-weight: 600;
      border-bottom: 1px solid #bbb;
    }}
    .totals {{
      margin-left: auto;
      width: 300px;
      max-width: 100%;
    }}
    .totals-row {{
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      border-bottom: 1px solid #ddd;
    }}
    .totals-row.total {{
      font-size: 15px;
      font-weight: 700;
      border-bottom: none;
    }}
    .paid-label {{
      text-align: right;
      color: #52b788;
      font-weight: 700;
      font-size: 15px;
      margin-top: 4px;
    }}
    .notes-box {{
      margin-top: 24px;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      white-space: pre-wrap;
      line-height: 1.6;
      font-size: 13px;
      color: #64748b;
    }}
    @media (max-width: 700px) {{
      body {{ padding: 12px; }}
      .invoice {{ padding: 18px; }}
      .bill-details {{ grid-template-columns: 1fr; }}
    }}
  </style>
</head>
<body>
  <div class="invoice">
    <div class="top">
      <div>
        <div class="title">INVOICE</div>
        <div class="muted">
          <strong>{esc(inv.from_name or "")}</strong><br>
          {esc(inv.from_bn or "")}<br>
          {esc(inv.from_address or "")}<br>
          {esc(inv.from_email or "")}<br>
          {esc(inv.from_phone or "")}
        </div>
      </div>
      <div style="text-align:right;">
        {logo_html}
      </div>
    </div>

    <div class="bill-details">
      <div>
        <div class="section-title">Bill to</div>
        <div style="font-size:14px;color:#1a1a2e;">{esc(inv.to_name or "—")}</div>
        <div class="muted">{esc(inv.to_email or "")}</div>
        <div class="muted">{esc(inv.to_address or "")}</div>
      </div>
      <div>
        <div class="section-title">Invoice details</div>
        <div class="detail-row"><span class="detail-label">Invoice no.:</span><span>{esc(inv.invoice_number or "—")}</span></div>
        <div class="detail-row"><span class="detail-label">Terms:</span><span>{esc(inv.terms or "Net 30")}</span></div>
        <div class="detail-row"><span class="detail-label">Invoice date:</span><span>{esc(inv.date or "")}</span></div>
        <div class="detail-row"><span class="detail-label">Due date:</span><span>{esc(inv.due_date or "")}</span></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:30px;">#</th>
          <th style="width:160px;">Product or service</th>
          <th>Description</th>
          <th style="text-align:right;width:50px;">Qty</th>
          <th style="text-align:right;width:90px;">Rate</th>
          <th style="text-align:right;width:90px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows_html}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Total</span>
        <span>{format_money(inv.total, inv.currency)}</span>
      </div>
      <div class="totals-row">
        <span>Payment</span>
        <span>{format_money(inv.total if inv.status == 'paid' else 0, inv.currency)}</span>
      </div>
      <div class="totals-row total">
        <span>Balance due</span>
        <span>{format_money(0 if inv.status == 'paid' else inv.total, inv.currency)}</span>
      </div>
      {"<div class='paid-label'>Paid in Full</div>" if inv.status == 'paid' else ""}
    </div>

    {notes_html}
  </div>
</body>
</html>
"""


def ensure_invoice_export_file(inv: Invoice) -> Path:
    ensure_invoice_export_dir()
    path = invoice_file_path(str(inv.id))
    path.write_text(build_invoice_html(inv), encoding="utf-8")
    return path


# ── Helper ────────────────────────────────────────────────────────────────

def invoice_to_dict(inv: Invoice) -> dict:
    return {
        "id": str(inv.id),
        "invoice_number": inv.invoice_number,
        "date": inv.date,
        "due_date": inv.due_date,
        "terms": inv.terms,
        "from_name": inv.from_name,
        "from_email": inv.from_email,
        "from_address": inv.from_address,
        "from_phone": getattr(inv, 'from_phone', None),
        "from_bn": getattr(inv, 'from_bn', None),
        "logo_url": getattr(inv, 'logo_url', None),
        "to_name": inv.to_name,
        "to_email": inv.to_email,
        "to_address": inv.to_address,
        "line_items": inv.line_items or [],
        "notes": inv.notes,
        "tax_rate": inv.tax_rate or 0,
        "discount": inv.discount or 0,
        "subtotal": inv.subtotal or 0,
        "tax_amount": inv.tax_amount or 0,
        "total": inv.total or 0,
        "currency": inv.currency or "USD",
        "status": inv.status or "draft",
        "days_overdue": inv.days_overdue or 0,
        "created_at": inv.created_at.isoformat() if inv.created_at else None,
        "updated_at": inv.updated_at.isoformat() if inv.updated_at else None,
        "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
        "view_url": f"/invoices/{inv.id}/view",
        "download_url": f"/invoices/{inv.id}/download",
    }


def next_invoice_number(existing_count: int) -> str:
    return f"INV-{str(existing_count + 1001).zfill(4)}"


def detect_invoice_status(doc: Document) -> str:
    search_text = (
        (doc.notes or "") + " " +
        (doc.filename or "") + " " +
        (doc.suggested_cat or "")
    ).lower()

    if any(kw in search_text for kw in [
        "paid", "payment received", "settled", "zero balance",
        "thank you for your payment", "receipt", "payment confirmation",
    ]):
        return "paid"

    if any(kw in search_text for kw in [
        "overdue", "past due", "late payment", "final notice",
        "collection", "immediately",
    ]):
        return "overdue"

    if any(kw in search_text for kw in [
        "amount due", "balance due", "please pay", "payment due",
        "invoice", "owing", "please remit", "due date",
    ]):
        return "due"

    return "draft"


async def get_unique_invoice_number(
    db: AsyncSession, user_id: str
) -> str:
    counter = 1001
    while True:
        candidate = f"INV-{str(counter).zfill(4)}"
        existing = await db.execute(
            select(Invoice).where(
                Invoice.user_id == user_id,
                Invoice.invoice_number == candidate,
            )
        )
        if existing.scalar_one_or_none() is None:
            return candidate
        counter += 1


async def get_invoice_or_404(
    db: AsyncSession,
    invoice_id: str,
    user_id: str,
) -> Invoice:
    result = await db.execute(
        select(Invoice).where(
            Invoice.id == invoice_id,
            Invoice.user_id == user_id,
        )
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


# ── LIST ──────────────────────────────────────────────────────────────────

@router.get("/")
async def list_invoices(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice)
        .where(Invoice.user_id == current_user.id)
        .order_by(Invoice.created_at.desc())
    )
    invoices = result.scalars().all()

    now = datetime.utcnow()
    for inv in invoices:
        if inv.due_date and inv.status not in ["paid", "draft"]:
            try:
                due = datetime.strptime(inv.due_date, "%Y-%m-%d")
                if due < now:
                    inv.days_overdue = (now - due).days
                    if inv.status != "overdue":
                        inv.status = "overdue"
            except Exception:
                pass

    await db.commit()
    return [invoice_to_dict(inv) for inv in invoices]


# ── CREATE ────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def create_invoice(
    body: InvoiceCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = Invoice(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        invoice_number=body.invoice_number,
        date=body.date or datetime.utcnow().strftime("%Y-%m-%d"),
        due_date=body.due_date,
        from_name=body.from_name,
        from_email=body.from_email,
        from_address=body.from_address,
        to_name=body.to_name,
        to_email=body.to_email,
        to_address=body.to_address,
        line_items=[item.model_dump() for item in body.items],
        notes=body.notes,
        tax_rate=body.tax_rate,
        subtotal=body.subtotal,
        tax_amount=body.tax_amount,
        total=body.total,
        currency=body.currency,
        status=body.status,
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)

    ensure_invoice_export_file(invoice)

    try:
        await log_activity(
            db, current_user.id,
            action_type="invoice_created",
            page="invoices",
            action_data={
                "invoice_id": str(invoice.id),
                "invoice_number": invoice.invoice_number,
                "total": invoice.total,
                "to_name": invoice.to_name,
            },
        )
    except Exception:
        pass

    return invoice_to_dict(invoice)


# ── AUTO CREATE FROM DOCUMENT ─────────────────────────────────────────────

@router.post("/auto-create/{doc_id}")
async def auto_create_from_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc_result = await db.execute(
        select(Document).where(
            Document.id == doc_id,
            Document.user_id == current_user.id,
        )
    )
    doc = doc_result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.total_amount or doc.total_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Document has no extracted amount. Cannot create invoice."
        )

    payment_status = detect_invoice_status(doc)
    inv_number = await get_unique_invoice_number(db,current_user.id )
    due_date = (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d")

    invoice = Invoice(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        invoice_number=inv_number,
        date=doc.doc_date or datetime.utcnow().strftime("%Y-%m-%d"),
        due_date=due_date,
        to_name=doc.vendor or "Client",
        from_name="",
        subtotal=float(doc.total_amount or 0),
        tax_amount=float(doc.tax_amount or 0),
        total=float(doc.total_amount or 0),
        currency=doc.currency or "USD",
        status=payment_status,
        notes=f"Auto-created from: {doc.filename}",
        line_items=[
            {
                "description": doc.suggested_cat or "Services",
                "quantity": 1,
                "price": float(doc.total_amount or 0),
            }
        ],
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)

    ensure_invoice_export_file(invoice)

    try:
        await log_activity(
            db, current_user.id,
            action_type="invoice_created",
            page="documents",
            action_data={
                "invoice_id": str(invoice.id),
                "doc_id": doc_id,
                "auto": True,
                "vendor": doc.vendor,
                "total": doc.total_amount,
                "payment_status": payment_status,
            },
        )
    except Exception:
        pass

    return {
        **invoice_to_dict(invoice),
        "message": f"✅ Invoice {inv_number} created — status: {payment_status}",
        "auto_created": True,
        "payment_status": payment_status,
    }


# ── AUTO CREATE FROM ALL DOCUMENTS ───────────────────────────────────────

@router.post("/auto-create-all")
async def auto_create_from_all_documents(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc_result = await db.execute(
        select(Document).where(
            Document.user_id == current_user.id,
            Document.total_amount > 0,
        )
    )
    documents = doc_result.scalars().all()

    if not documents:
        return {
            "created": 0,
            "message": "No documents with amounts found",
            "invoices": [],
        }

    due_date = (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d")
    created_invoices = []

    for doc in documents:
        try:
            payment_status = detect_invoice_status(doc)
            inv_number = await get_unique_invoice_number(db, current_user.id)

            invoice = Invoice(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                invoice_number=inv_number,
                date=doc.doc_date or datetime.utcnow().strftime("%Y-%m-%d"),
                due_date=due_date,
                to_name=doc.vendor or "Client",
                from_name="",
                subtotal=float(doc.total_amount or 0),
                tax_amount=float(doc.tax_amount or 0),
                total=float(doc.total_amount or 0),
                currency=doc.currency or "USD",
                status=payment_status,
                notes=f"Auto-created from: {doc.filename}",
                line_items=[
                    {
                        "description": doc.suggested_cat or "Services",
                        "quantity": 1,
                        "price": float(doc.total_amount or 0),
                    }
                ],
            )
            db.add(invoice)
            await db.flush()
            ensure_invoice_export_file(invoice)
            created_invoices.append(f"{inv_number} ({payment_status})")

        except Exception as e:
            print(f"Error creating invoice for {doc.filename}: {e}")
            continue

    await db.commit()

    return {
        "created": len(created_invoices),
        "message": f"✅ Created {len(created_invoices)} invoices automatically",
        "invoices": created_invoices,
    }


# ── GET single ────────────────────────────────────────────────────────────

@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await get_invoice_or_404(db, invoice_id,current_user.id )
    return invoice_to_dict(invoice)


# ── VIEW ──────────────────────────────────────────────────────────────────

@router.get("/{invoice_id}/view", response_class=HTMLResponse)
async def view_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await get_invoice_or_404(db, invoice_id,current_user.id )
    path = ensure_invoice_export_file(invoice)
    return HTMLResponse(path.read_text(encoding="utf-8"))


@router.get("/{invoice_id}/download")
async def download_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await get_invoice_or_404(db, invoice_id,current_user.id )
    path = ensure_invoice_export_file(invoice)
    download_name = f"{invoice.invoice_number or 'invoice'}.html"
    return FileResponse(
        path=str(path),
        media_type="text/html",
        filename=download_name,
        content_disposition_type="attachment",
    )


# ── UPDATE ────────────────────────────────────────────────────────────────

@router.patch("/{invoice_id}")
async def update_invoice(
    invoice_id: str,
    body: InvoiceUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await get_invoice_or_404(db, invoice_id,current_user.id )

    if body.status is not None:
        invoice.status = body.status
        if body.status == "paid":
            invoice.paid_at = datetime.utcnow()

    if body.notes is not None: invoice.notes = body.notes
    if body.to_name is not None: invoice.to_name = body.to_name
    if body.to_email is not None: invoice.to_email = body.to_email
    if body.to_address is not None: invoice.to_address = body.to_address
    if body.due_date is not None: invoice.due_date = body.due_date
    if body.date is not None: invoice.date = body.date
    if body.terms is not None: invoice.terms = body.terms
    if body.from_name is not None: invoice.from_name = body.from_name
    if body.from_email is not None: invoice.from_email = body.from_email
    if body.from_address is not None: invoice.from_address = body.from_address
    if body.total is not None: invoice.total = body.total
    if body.subtotal is not None: invoice.subtotal = body.subtotal
    if body.tax_amount is not None: invoice.tax_amount = body.tax_amount
    if body.tax_rate is not None: invoice.tax_rate = body.tax_rate
    if body.items is not None: invoice.line_items = [i.model_dump() for i in body.items]

    invoice.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(invoice)

    ensure_invoice_export_file(invoice)

    try:
        await log_activity(
            db, current_user.id,
            action_type="invoice_updated",
            page="invoices",
            action_data={
                "invoice_id": invoice_id,
                "status": invoice.status,
            },
        )
    except Exception:
        pass

    return invoice_to_dict(invoice)


# ── MARK PAID ─────────────────────────────────────────────────────────────

@router.post("/{invoice_id}/mark-paid")
async def mark_invoice_paid(
    invoice_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await get_invoice_or_404(db, invoice_id,current_user.id )

    invoice.status = "paid"
    invoice.paid_at = datetime.utcnow()
    invoice.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(invoice)

    ensure_invoice_export_file(invoice)

    return {
        "message": f"Invoice {invoice.invoice_number} marked as paid",
        "invoice_id": invoice_id,
        "paid_at": invoice.paid_at.isoformat(),
        "view_url": f"/invoices/{invoice.id}/view",
        "download_url": f"/invoices/{invoice.id}/download",
    }


# ── DELETE ────────────────────────────────────────────────────────────────

@router.delete("/{invoice_id}", status_code=204)
async def delete_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await get_invoice_or_404(db, invoice_id,current_user.id )
    path = invoice_file_path(str(invoice.id))
    await db.delete(invoice)
    await db.commit()
    if path.exists():
        try:
            path.unlink()
        except Exception as e:
            print(f"Failed to delete invoice export file: {e}")