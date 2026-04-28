from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.models import (
    DocumentStatus, DocumentType,
    TransactionType, TransactionStatus
)


# ── Auth ──────────────────────────────────────

class UserRegister(BaseModel):
    email:     EmailStr
    password:  str = Field(min_length=8)
    full_name: Optional[str] = None
    company:   Optional[str] = None

class UserLogin(BaseModel):
    email:    EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      str
    email:        str

class UserOut(BaseModel):
    id:         UUID
    email:      str
    full_name:  Optional[str]
    company:    Optional[str]
    is_active:  bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Documents ─────────────────────────────────

class LineItem(BaseModel):
    description: str
    amount:      float

class DocumentOut(BaseModel):
    id:            UUID
    filename:      str
    doc_type:      Optional[DocumentType]
    status:        DocumentStatus
    vendor:        Optional[str]
    doc_date:      Optional[str]
    total_amount:  Optional[float]
    currency:      Optional[str]
    tax_amount:    Optional[float]
    line_items:    Optional[List[LineItem]]
    suggested_cat: Optional[str]
    confidence:    Optional[float]
    ai_notes:      Optional[str]
    uploaded_at:   datetime
    processed_at:  Optional[datetime]

    class Config:
        from_attributes = True

class DocumentUpdate(BaseModel):
    vendor:        Optional[str] = None
    doc_date:      Optional[str] = None
    total_amount:  Optional[float] = None
    currency:      Optional[str] = None
    suggested_cat: Optional[str] = None
    doc_type:      Optional[DocumentType] = None
    status:        Optional[DocumentStatus] = None


# ── Transactions ──────────────────────────────

class TransactionCreate(BaseModel):
    vendor:      str
    amount:      float
    currency:    str = "USD"
    txn_date:    Optional[str] = None
    category:    Optional[str] = None
    txn_type:    TransactionType
    notes:       Optional[str] = None
    tags:        Optional[List[str]] = None
    document_id: Optional[UUID] = None

class TransactionUpdate(BaseModel):
    vendor:      Optional[str] = None
    amount:      Optional[float] = None
    category:    Optional[str] = None
    subcategory: Optional[str] = None
    txn_type:    Optional[TransactionType] = None
    status:      Optional[TransactionStatus] = None
    notes:       Optional[str] = None
    tags:        Optional[List[str]] = None

class TransactionOut(BaseModel):
    id:            UUID
    vendor:        Optional[str]
    amount:        float
    currency:      str
    txn_date:      Optional[str]
    category:      Optional[str]
    subcategory:   Optional[str]
    txn_type:      Optional[TransactionType]
    status:        TransactionStatus
    notes:         Optional[str]
    tags:          Optional[List[str]]
    ml_category:   Optional[str]
    ml_confidence: Optional[float]
    created_at:    datetime

    class Config:
        from_attributes = True


# ── AI / Agent ────────────────────────────────

class ChatMessage(BaseModel):
    role:    str
    content: str

class AgentChatRequest(BaseModel):
    messages: List[ChatMessage]
    provider: str = "openai"

class AgentChatResponse(BaseModel):
    reply:    str
    provider: str
    model:    str

class ExtractionResult(BaseModel):
    vendor:        Optional[str]
    doc_date:      Optional[str]
    total_amount:  Optional[float]
    currency:      Optional[str]
    tax_amount:    Optional[float]
    line_items:    Optional[List[LineItem]]
    doc_type:      Optional[str]
    suggested_cat: Optional[str]
    confidence:    float
    notes:         Optional[str]


# ── Analytics ─────────────────────────────────

class ExpenseByCategory(BaseModel):
    category: str
    total:    float
    count:    int

class MonthlySummary(BaseModel):
    month:          str
    total_income:   float
    total_expenses: float
    net:            float

class DashboardStats(BaseModel):
    docs_processed:    int
    total_expenses:    float
    total_revenue:     float
    uncategorized:     int
    expense_breakdown: List[ExpenseByCategory]
    monthly_summary:   List[MonthlySummary]


# ── Integrations ──────────────────────────────

class IntegrationOut(BaseModel):
    id:           UUID
    provider:     str
    is_active:    bool
    connected_at: Optional[datetime]

    class Config:
        from_attributes = True