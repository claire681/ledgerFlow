from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from app.services.rag_service import search_similar_documents, find_duplicate_documents, store_document_embedding
from pydantic import BaseModel
import re
from datetime import datetime

router = APIRouter(prefix="/rag", tags=["rag"])

class SearchQuery(BaseModel):
    query: str
    limit: int = 8

def build_document_content(doc: dict) -> str:
    parts = []
    if doc.get("filename"):       parts.append(f"Filename: {doc['filename']}")
    if doc.get("vendor"):         parts.append(f"Vendor: {doc['vendor']}")
    if doc.get("client_name"):    parts.append(f"Client: {doc['client_name']}")
    if doc.get("total_amount"):   parts.append(f"Amount: ${doc['total_amount']}")
    if doc.get("doc_date"):       parts.append(f"Date: {doc['doc_date']}")
    if doc.get("suggested_cat"):  parts.append(f"Category: {doc['suggested_cat']}")
    if doc.get("doc_type"):       parts.append(f"Type: {doc['doc_type']}")
    if doc.get("status"):         parts.append(f"Status: {doc['status']}")
    if doc.get("payment_status"): parts.append(f"Payment: {doc['payment_status']}")
    if doc.get("currency"):       parts.append(f"Currency: {doc['currency']}")
    if doc.get("notes"):          parts.append(f"Notes: {doc['notes']}")
    return " | ".join(parts) or doc.get("filename", "Unknown document")

def build_metadata(doc: dict) -> dict:
    return {
        "filename":       doc.get("filename"),
        "vendor":         doc.get("vendor"),
        "client_name":    doc.get("client_name"),
        "amount":         str(doc.get("total_amount", "")),
        "doc_date":       str(doc.get("doc_date", "")),
        "category":       doc.get("suggested_cat"),
        "doc_type":       doc.get("doc_type"),
        "status":         doc.get("status"),
        "payment_status": doc.get("payment_status"),
        "currency":       doc.get("currency"),
    }

def format_result(doc: dict, similarity: float = 1.0, source: str = "filter") -> dict:
    return {
        "content":     build_document_content(doc),
        "metadata":    build_metadata(doc),
        "document_id": str(doc.get("id", doc.get("document_id", ""))),
        "similarity":  similarity,
        "source":      source,
    }

async def execute_search(db: AsyncSession, user_id: str, query: str, limit: int) -> list:
    q   = query.lower().strip()
    now = datetime.now()
    conditions = ["d.user_id = :user_id"]
    params     = {"user_id": user_id, "limit": limit}

    # ── 0. Year-Month, Year only, Month only ──────────────────────
    # YYYY-MM e.g. 2026-03
    if re.match(r'^20\d{2}-(0[1-9]|1[0-2])$', q.strip()):
        parts = q.strip().split('-')
        conditions.append("d.doc_date LIKE :date_like")
        params["date_like"] = f"{parts[0]}-{parts[1]}%"
        where  = " AND ".join(conditions)
        result = await db.execute(text(f"SELECT * FROM documents d WHERE {where} ORDER BY d.uploaded_at DESC LIMIT :limit"), params)
        return [format_result(dict(r)) for r in result.mappings().all()]

    # Month only e.g. 02 or 03
    if re.match(r'^(0[1-9]|1[0-2])$', q.strip()):
        m = int(q.strip())
        conditions.append("d.doc_date LIKE :date_like")
        params["date_like"] = f"%-{m:02d}-%"
        where  = " AND ".join(conditions)
        result = await db.execute(text(f"SELECT * FROM documents d WHERE {where} ORDER BY d.uploaded_at DESC LIMIT :limit"), params)
        return [format_result(dict(r)) for r in result.mappings().all()]

    if re.match(r'^20\d{2}$', q.strip()):
        conditions.append("d.doc_date LIKE :date_like")
        params["date_like"] = f"{q.strip()}%"
        where  = " AND ".join(conditions)
        result = await db.execute(text(f"SELECT * FROM documents d WHERE {where} ORDER BY d.uploaded_at DESC LIMIT :limit"), params)
        return [format_result(dict(r)) for r in result.mappings().all()]

    # ── 1. Exact amount e.g. "$20" or "20" alone ──────────────────
    if re.match(r'^\$?(\d+(?:\.\d+)?)$', q) and not re.match(r'^20\d{2}$', q.strip()):
        val = float(re.match(r'^\$?(\d+(?:\.\d+)?)$', q).group(1))
        conditions.append("ROUND(CAST(d.total_amount AS NUMERIC), 2) = :exact_amount")
        params["exact_amount"] = round(val, 2)
        where  = " AND ".join(conditions)
        result = await db.execute(text(f"SELECT * FROM documents d WHERE {where} ORDER BY d.uploaded_at DESC LIMIT :limit"), params)
        return [format_result(dict(r)) for r in result.mappings().all()]

    # ── 2. Amount range ────────────────────────────────────────────
    over  = re.search(r'(?:over|above|more than|greater than)\s+\$?(\d+(?:\.\d+)?)', q)
    under = re.search(r'(?:under|below|less than)\s+\$?(\d+(?:\.\d+)?)', q)
    if over:
        conditions.append("CAST(d.total_amount AS NUMERIC) >= :min_amount")
        params["min_amount"] = float(over.group(1))
    if under:
        conditions.append("CAST(d.total_amount AS NUMERIC) <= :max_amount")
        params["max_amount"] = float(under.group(1))

    # ── 3. Amount with $ sign ──────────────────────────────────────
    dollar = re.search(r'\$(\d+(?:\.\d+)?)', q)
    if dollar and not over and not under:
        conditions.append("ROUND(CAST(d.total_amount AS NUMERIC), 2) = :exact_amount")
        params["exact_amount"] = round(float(dollar.group(1)), 2)

    # ── 4. Date filters using LIKE (doc_date stored as text) ───────
    # Exact date YYYY-MM-DD
    date_ymd = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', q)
    if date_ymd:
        d_str = f"{date_ymd.group(1)}-{int(date_ymd.group(2)):02d}-{int(date_ymd.group(3)):02d}"
        conditions.append("d.doc_date LIKE :date_like")
        params["date_like"] = f"{d_str}%"

    # YYYY-MM
    elif re.match(r'^\d{4}-\d{1,2}$', q.strip()):
        parts = q.strip().split('-')
        conditions.append("d.doc_date LIKE :date_like")
        params["date_like"] = f"{parts[0]}-{int(parts[1]):02d}%"

    # Just year e.g. 2026
    elif re.match(r'^20\d{2}$', q.strip()):
        conditions.append("d.doc_date LIKE :date_like")
        params["date_like"] = f"{q.strip()}%"

    # Just month number e.g. 02 or 03
    elif re.match(r'^0?[1-9]$|^1[0-2]$', q.strip()):
        m = int(q.strip())
        conditions.append("d.doc_date LIKE :date_like")
        params["date_like"] = f"%-{m:02d}-%"

    # Relative: last month
    elif 'last month' in q:
        m = now.month - 1 if now.month > 1 else 12
        y = now.year if now.month > 1 else now.year - 1
        conditions.append("d.doc_date LIKE :date_like")
        params["date_like"] = f"{y}-{m:02d}%"

    # Relative: this month
    elif 'this month' in q or 'current month' in q:
        conditions.append("d.doc_date LIKE :date_like")
        params["date_like"] = f"{now.year}-{now.month:02d}%"

    # Relative: this year
    elif 'this year' in q:
        conditions.append("d.doc_date LIKE :date_like")
        params["date_like"] = f"{now.year}%"

    # Month names
    else:
        month_names = {
            'january':'01','february':'02','march':'03','april':'04',
            'may':'05','june':'06','july':'07','august':'08',
            'september':'09','october':'10','november':'11','december':'12',
        }
        for name, num in month_names.items():
            if name in q:
                conditions.append("d.doc_date LIKE :date_like")
                params["date_like"] = f"%-{num}-%"
                break

    # ── 5. Payment status ──────────────────────────────────────────
    if 'unpaid' in q or 'overdue' in q or 'due' in q:
        conditions.append("d.payment_status = 'overdue'")
    elif re.search(r'\bpaid\b', q) and 'unpaid' not in q and 'due' not in q:
        conditions.append("d.payment_status = 'paid'")

    # ── 6. Document type ───────────────────────────────────────────
    if re.search(r'\breceipts?\b', q):
        conditions.append("d.doc_type = 'receipt'")
    elif re.search(r'\binvoices?\b', q):
        conditions.append("d.doc_type IN ('invoice_sent','invoice_received')")
    elif re.search(r'\bcontracts?\b', q):
        conditions.append("d.doc_type = 'contract'")
    elif 'bank statement' in q:
        conditions.append("d.doc_type = 'bank_statement'")

    # ── 7. Keyword search on text fields ──────────────────────────
    skip_words = {
        'all','show','me','find','get','search','list','last','this','month',
        'year','current','from','over','above','under','below','more','less',
        'than','and','or','the','a','an','with','in','of','for','how','many',
        'have','do','what','are','is','my','invoices','invoice','receipts',
        'receipt','documents','document','contracts','contract','paid','unpaid',
        'overdue','due','january','february','march','april','may','june',
        'july','august','september','october','november','december',
        'bank','statement','i','to','by','on',
    }
    keywords = []
    for w in re.split(r'\s+', q):
        w = w.strip('$,.')
        if w and len(w) > 1 and w not in skip_words and not re.match(r'^\d+(?:\.\d+)?$', w):
            keywords.append(w)

    if keywords:
        kw_parts = []
        for i, word in enumerate(keywords[:5]):
            key = f"kw{i}"
            params[key] = f"%{word}%"
            kw_parts.append(f"""(
                d.vendor ILIKE :{key} OR
                d.client_name ILIKE :{key} OR
                d.filename ILIKE :{key} OR
                d.suggested_cat ILIKE :{key} OR
                d.notes ILIKE :{key}
            )""")
        conditions.append(f"({' OR '.join(kw_parts)})")

    where  = " AND ".join(conditions)
    result = await db.execute(
        text(f"SELECT * FROM documents d WHERE {where} ORDER BY d.uploaded_at DESC LIMIT :limit"),
        params
    )
    rows = result.mappings().all()
    return [format_result(dict(r)) for r in rows]

@router.post("/search")
async def semantic_search(
    body: SearchQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query   = body.query.strip()
    user_id = str(current_user.id)

    results  = await execute_search(db, user_id, query, body.limit)
    seen_ids = {r["document_id"] for r in results}

    if len(results) < body.limit:
        rag_results = await search_similar_documents(db, user_id, query, 3)
        for r in rag_results:
            doc_id = str(r.get("document_id", ""))
            if doc_id not in seen_ids:
                seen_ids.add(doc_id)
                r["source"] = "semantic"
                results.append(r)

    return {"results": results[:body.limit], "count": len(results[:body.limit])}

@router.get("/duplicates")
async def get_duplicates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    duplicates = await find_duplicate_documents(db, str(current_user.id))
    return {"duplicates": duplicates, "count": len(duplicates)}

@router.post("/embed/{document_id}")
async def embed_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT * FROM documents WHERE id = :id AND user_id = :uid"),
        {"id": document_id, "uid": current_user.id}
    )
    doc = result.mappings().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc      = dict(doc)
    content  = build_document_content(doc)
    metadata = build_metadata(doc)
    success  = await store_document_embedding(db, str(current_user.id), document_id, content, metadata=metadata)
    return {"success": success}

@router.post("/embed-all")
async def embed_all_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("""
            SELECT d.* FROM documents d
            LEFT JOIN document_embeddings de ON d.id = de.document_id
            WHERE d.user_id = :uid AND de.id IS NULL
        """),
        {"uid": current_user.id}
    )
    docs     = result.mappings().all()
    embedded = 0
    for doc in docs:
        doc      = dict(doc)
        content  = build_document_content(doc)
        metadata = build_metadata(doc)
        success  = await store_document_embedding(db, str(current_user.id), str(doc["id"]), content, metadata=metadata)
        if success:
            embedded += 1
    return {"success": True, "embedded": embedded, "total": len(docs)}

class RAGAskBody(BaseModel):
    question: str

@router.post("/ask")
async def rag_ask(
    body: RAGAskBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Answer a question using RAG - search documents first then answer."""
    from openai import AsyncOpenAI
    from app.core.config import settings

    client  = AsyncOpenAI(api_key=settings.openai_api_key)
    user_id = str(current_user.id)

    # Search relevant documents
    similar_docs = await search_similar_documents(db, user_id, body.question, limit=5)

    # Also do SQL search
    sql_docs = await execute_search(db, user_id, body.question, 5)

    # Combine and deduplicate
    seen = set()
    all_docs = []
    for doc in sql_docs + similar_docs:
        doc_id = str(doc.get("document_id", ""))
        if doc_id not in seen:
            seen.add(doc_id)
            all_docs.append(doc)

    # Build context from documents
    if all_docs:
        context = "Here are the relevant documents from the user's account:\n\n"
        for i, doc in enumerate(all_docs[:5], 1):
            context += f"Document {i}:\n{doc.get('content', '')}\n\n"
    else:
        context = "No specific documents found matching this question."

    # Build prompt
    system_prompt = f"""You are Novala's Smart Search AI Assistant. You help users find and understand their financial documents.

You have access to the user's actual documents. Answer questions based ONLY on the documents provided.
Be specific - mention exact amounts, dates, vendor names from the documents.
If the information is not in the documents say so clearly.
Keep answers concise and helpful.

{context}"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": body.question},
        ],
        max_tokens=500,
    )

    answer = response.choices[0].message.content

    return {
        "answer":    answer,
        "documents": all_docs[:5],
        "count":     len(all_docs),
    }
