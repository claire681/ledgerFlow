from sqlalchemy import (
    Column, String, Float, Boolean, Integer, Numeric,
    DateTime, Text, ForeignKey, JSON,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.db.database import Base


# ── Enums ──────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    admin      = "admin"
    accountant = "accountant"
    staff      = "staff"
    viewer     = "viewer"

class BusinessType(str, enum.Enum):
    corporation     = "corporation"
    llc             = "llc"
    sole_proprietor = "sole_proprietor"
    partnership     = "partnership"
    freelancer      = "freelancer"
    startup         = "startup"

class PlanType(str, enum.Enum):
    free     = "free"
    pro      = "pro"
    business = "business"

class InvoiceStatus(str, enum.Enum):
    draft   = "draft"
    sent    = "sent"
    due     = "due"
    paid    = "paid"
    overdue = "overdue"

class TransactionType(str, enum.Enum):
    income  = "income"
    expense = "expense"

class DocumentStatus(str, enum.Enum):
    pending   = "pending"
    processed = "processed"
    review    = "review"
    failed    = "failed"

class MemoryType(str, enum.Enum):
    business_fact = "business_fact"
    preference    = "preference"
    goal          = "goal"
    observation   = "observation"
    pattern       = "pattern"

class MemorySource(str, enum.Enum):
    user_stated = "user_stated"
    ai_observed = "ai_observed"
    calculated  = "calculated"

class ActivityType(str, enum.Enum):
    invoice_created     = "invoice_created"
    invoice_updated     = "invoice_updated"
    invoice_deleted     = "invoice_deleted"
    invoice_paid        = "invoice_paid"
    transaction_added   = "transaction_added"
    transaction_updated = "transaction_updated"
    document_uploaded   = "document_uploaded"
    document_deleted    = "document_deleted"
    receipt_scanned     = "receipt_scanned"
    budget_created      = "budget_created"
    budget_updated      = "budget_updated"
    tax_calculated      = "tax_calculated"
    tax_report_saved    = "tax_report_saved"
    scenario_saved      = "scenario_saved"
    ai_question_asked   = "ai_question_asked"
    report_exported     = "report_exported"
    profile_updated     = "profile_updated"
    team_member_invited = "team_member_invited"
    login               = "login"


# ── Aliases ────────────────────────────────────────────────────────────────

DocumentType      = DocumentStatus
TransactionStatus = TransactionType
InvoiceStatusEnum = InvoiceStatus
UserRoleEnum      = UserRole
AgentStatus       = DocumentStatus


# ── Helper ─────────────────────────────────────────────────────────────────

def new_uuid():
    return str(uuid.uuid4())


# ══════════════════════════════════════════════════════════════════════════
# USER
# ══════════════════════════════════════════════════════════════════════════

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email           = Column(String,  unique=True, index=True, nullable=False)
    full_name       = Column(String,  nullable=True)
    company         = Column(String,  nullable=True)
    hashed_pw       = Column(String,  nullable=False)
    role            = Column(String,  default="admin")
    plan            = Column(String,  default="free")
    is_active       = Column(Boolean, default=True)
    is_verified     = Column(Boolean, default=False)
    onboarding_done = Column(Boolean, default=False)
    last_page          = Column(String,  nullable=True)
    briefing_enabled   = Column(Boolean, default=True)
    briefing_time      = Column(String,  default="08:00")
    briefing_timezone  = Column(String,  default="America/Edmonton")
    last_briefing_at   = Column(DateTime(timezone=True), nullable=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())
    updated_at         = Column(DateTime(timezone=True), onupdate=func.now())

    documents          = relationship("Document",          back_populates="user", cascade="all, delete-orphan")
    transactions       = relationship("Transaction",       back_populates="user", cascade="all, delete-orphan")
    agent_logs         = relationship("AgentLog",          back_populates="user", cascade="all, delete-orphan")
    integrations       = relationship("Integration",       back_populates="user", cascade="all, delete-orphan")
    budgets            = relationship("Budget",            back_populates="user", cascade="all, delete-orphan")
    invoices           = relationship("Invoice",           back_populates="user", cascade="all, delete-orphan")
    team_members       = relationship("TeamMember",        back_populates="owner", cascade="all, delete-orphan")
    company_profile    = relationship("CompanyProfile",    back_populates="user", uselist=False, cascade="all, delete-orphan")
    tax_reports        = relationship("TaxReport",         back_populates="user", cascade="all, delete-orphan")
    what_if_scenarios  = relationship("WhatIfScenario",    back_populates="user", cascade="all, delete-orphan")
    ai_conversations   = relationship("AIConversation",    back_populates="user", cascade="all, delete-orphan")
    ai_memories        = relationship("AIMemory",          back_populates="user", cascade="all, delete-orphan")
    activity_logs      = relationship("ActivityLog",       back_populates="user", cascade="all, delete-orphan")
    preferences        = relationship("UserPreference",    back_populates="user", cascade="all, delete-orphan")
    financial_timeline = relationship("FinancialTimeline", back_populates="user", cascade="all, delete-orphan")
    upload_jobs        = relationship("UploadJob",         back_populates="user", cascade="all, delete-orphan")


# ══════════════════════════════════════════════════════════════════════════
# DOCUMENT
# ══════════════════════════════════════════════════════════════════════════
class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename       = Column(String,  nullable=False)
    file_type      = Column(String,  nullable=True)
    file_path      = Column(String,  nullable=True)
    file_size      = Column(Integer, nullable=True)
    vendor         = Column(String,  nullable=True)
    client_name    = Column(String,  nullable=True)
    total_amount   = Column(Float,   nullable=True)
    tax_amount     = Column(Float,   nullable=True)
    currency       = Column(String,  default="USD")
    doc_date       = Column(String,  nullable=True)
    suggested_cat  = Column(String,  nullable=True)
    confidence     = Column(Float,   nullable=True)
    status         = Column(String,  default="pending")   # processing_status
    payment_status = Column(String,  nullable=True)       # payment_status: due/paid/overdue/partially_paid
    paid_at        = Column(DateTime(timezone=True), nullable=True)
    is_deductible  = Column(Boolean, default=False)
    deduction_pct  = Column(Float,   default=1.0)
    notes          = Column(Text,    nullable=True)
    doc_type       = Column(String,  nullable=True)
    recorded_as    = Column(String,  nullable=True)
    uploaded_at    = Column(DateTime(timezone=True), server_default=func.now())

    user         = relationship("User",        back_populates="documents")
    transactions = relationship("Transaction", back_populates="document", cascade="all, delete-orphan")
    agent_logs   = relationship("AgentLog",    back_populates="document", cascade="all, delete-orphan")

# TRANSACTION
# ══════════════════════════════════════════════════════════════════════════

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id      = Column(UUID(as_uuid=True), ForeignKey("users.id"),     nullable=False)
    document_id  = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    vendor       = Column(String,  nullable=True)
    amount       = Column(Float,   nullable=False, default=0.0)
    currency     = Column(String,  default="USD")
    txn_date     = Column(String,  nullable=True)
    category     = Column(String,  nullable=True)
    ml_category  = Column(String,  nullable=True)
    txn_type     = Column(String,  default="expense")
    status       = Column(String,  default="ok")
    notes        = Column(Text,    nullable=True)
    is_recurring = Column(Boolean, default=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    user     = relationship("User",     back_populates="transactions")
    document = relationship("Document", back_populates="transactions")


# ══════════════════════════════════════════════════════════════════════════
# AGENT LOG
# ══════════════════════════════════════════════════════════════════════════

class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"),     nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    agent       = Column(String, nullable=True)
    action      = Column(Text,   nullable=True)
    result      = Column(Text,   nullable=True)
    status      = Column(String, default="pending")
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    user     = relationship("User",     back_populates="agent_logs")
    document = relationship("Document", back_populates="agent_logs")


# ══════════════════════════════════════════════════════════════════════════
# INTEGRATION
# ══════════════════════════════════════════════════════════════════════════

class Integration(Base):
    __tablename__ = "integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id      = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    provider     = Column(String, nullable=False)
    status       = Column(String, default="disconnected")
    access_token = Column(String, nullable=True)
    connected_at = Column(DateTime(timezone=True), nullable=True)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="integrations")


# ══════════════════════════════════════════════════════════════════════════
# BUDGET
# spent, remaining, percentage, status are CALCULATED — not stored in DB
# ══════════════════════════════════════════════════════════════════════════

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category      = Column(String, nullable=False)
    monthly_limit = Column(Float,  nullable=False, default=0.0)
    currency      = Column(String, default="USD")
    manual_spent  = Column(Float,  nullable=True)   # user-set override
    alert_at_pct  = Column(Float,  default=80.0)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="budgets")

# ══════════════════════════════════════════════════════════════════════════
# INVOICE
# ══════════════════════════════════════════════════════════════════════════

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    invoice_number = Column(String,  nullable=False)
    status         = Column(String,  default="draft")
    date           = Column(String,  nullable=True)
    due_date       = Column(String,  nullable=True)
    terms          = Column(String,  nullable=True)
    from_name      = Column(String,  nullable=True)
    from_email     = Column(String,  nullable=True)
    from_address   = Column(Text,    nullable=True)
    from_phone     = Column(String,  nullable=True)
    from_bn        = Column(String,  nullable=True)
    to_name        = Column(String,  nullable=True)
    to_email       = Column(String,  nullable=True)
    to_address     = Column(Text,    nullable=True)
    line_items     = Column(JSONB,   nullable=True)
    subtotal       = Column(Float,   default=0.0)
    tax_rate       = Column(Float,   default=0.0)
    tax_amount     = Column(Float,   default=0.0)
    discount       = Column(Float,   default=0.0)
    total          = Column(Float,   default=0.0)
    currency       = Column(String,  default="USD")
    notes          = Column(Text,    nullable=True)
    logo_url       = Column(Text,    nullable=True)  # Text not String — base64 logos are large
    days_overdue   = Column(Integer, default=0)
    paid_at        = Column(DateTime(timezone=True), nullable=True)
    sent_at        = Column(DateTime(timezone=True), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="invoices")


# ══════════════════════════════════════════════════════════════════════════
# TEAM
# ══════════════════════════════════════════════════════════════════════════

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    email       = Column(String, nullable=False)
    full_name   = Column(String, nullable=True)
    role        = Column(String, default="viewer")
    status      = Column(String, default="pending")
    invited_at  = Column(DateTime(timezone=True), server_default=func.now())
    accepted_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="team_members")


class TeamInvite(Base):
    __tablename__ = "team_invites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id   = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    email      = Column(String, nullable=False)
    role       = Column(String, default="viewer")
    token      = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ══════════════════════════════════════════════════════════════════════════
# COMPANY PROFILE
# ══════════════════════════════════════════════════════════════════════════

class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id            = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_name       = Column(String,  nullable=True)
    business_type      = Column(String,  default="corporation")
    industry           = Column(String,  nullable=True)
    website            = Column(String,  nullable=True)
    phone              = Column(String,  nullable=True)
    contact_email      = Column(String,  nullable=True)
    logo_url           = Column(Text,    nullable=True)
    address            = Column(Text,    nullable=True)
    country            = Column(String,  default="US")
    province_state     = Column(String,  nullable=True)
    currency           = Column(String,  default="USD")
    fiscal_year_start  = Column(Integer, default=1)
    tax_year           = Column(Integer, nullable=True)
    vat_registered     = Column(Boolean, default=False)
    vat_number         = Column(String,  nullable=True)
    annual_revenue_est = Column(Numeric(14, 2), nullable=True)
    employee_count     = Column(Integer, nullable=True)
    founded_year       = Column(Integer, nullable=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())
    updated_at         = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="company_profile")


# ══════════════════════════════════════════════════════════════════════════
# TAX REPORT
# ══════════════════════════════════════════════════════════════════════════

class TaxReport(Base):
    __tablename__ = "tax_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title            = Column(String,  nullable=True)
    tax_year         = Column(Integer, nullable=True)
    report_date      = Column(String,  nullable=True)
    country          = Column(String,  nullable=False, default="US")
    country_name     = Column(String,  nullable=True)
    province_state   = Column(String,  nullable=True)
    province_name    = Column(String,  nullable=True)
    currency         = Column(String,  default="USD")
    business_type    = Column(String,  nullable=True)
    revenue          = Column(Float,   default=0.0)
    total_deductions = Column(Float,   default=0.0)
    deductions_json  = Column(JSON,    default=dict)
    taxable_income   = Column(Float,   default=0.0)
    federal_rate     = Column(Float,   default=0.0)
    federal_tax      = Column(Float,   default=0.0)
    state_rate       = Column(Float,   default=0.0)
    state_tax        = Column(Float,   default=0.0)
    corporate_tax    = Column(Float,   default=0.0)
    vat_rate         = Column(Float,   default=0.0)
    vat_tax          = Column(Float,   default=0.0)
    total_tax        = Column(Float,   default=0.0)
    net_profit       = Column(Float,   default=0.0)
    effective_rate   = Column(Float,   default=0.0)
    tax_saved        = Column(Float,   default=0.0)
    full_result_json = Column(JSON,    default=dict)
    vat_included     = Column(Boolean, default=True)
    custom_rate_used = Column(Boolean, default=False)
    custom_rate      = Column(Float,   nullable=True)
    ai_summary       = Column(Text,    nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="tax_reports")


# ══════════════════════════════════════════════════════════════════════════
# WHAT-IF SCENARIO
# ══════════════════════════════════════════════════════════════════════════

class WhatIfScenario(Base):
    __tablename__ = "what_if_scenarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title         = Column(String, nullable=True)
    a_label       = Column(String, default="Scenario A")
    a_country     = Column(String, nullable=True)
    a_province    = Column(String, nullable=True)
    a_revenue     = Column(Float,  default=0.0)
    a_deductions  = Column(Float,  default=0.0)
    a_total_tax   = Column(Float,  default=0.0)
    a_net_profit  = Column(Float,  default=0.0)
    a_result_json = Column(JSON,   default=dict)
    b_label       = Column(String, default="Scenario B")
    b_country     = Column(String, nullable=True)
    b_province    = Column(String, nullable=True)
    b_revenue     = Column(Float,  default=0.0)
    b_deductions  = Column(Float,  default=0.0)
    b_total_tax   = Column(Float,  default=0.0)
    b_net_profit  = Column(Float,  default=0.0)
    b_result_json = Column(JSON,   default=dict)
    ai_comparison = Column(Text,   nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="what_if_scenarios")


# ══════════════════════════════════════════════════════════════════════════
# AI CONVERSATION
# ══════════════════════════════════════════════════════════════════════════

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_id       = Column(String,  nullable=False, index=True)
    page             = Column(String,  nullable=True)
    role             = Column(String,  nullable=False)
    content          = Column(Text,    nullable=False)
    context_snapshot = Column(JSON,    nullable=True)
    tokens_used      = Column(Integer, nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="ai_conversations")


# ══════════════════════════════════════════════════════════════════════════
# AI MEMORY
# ══════════════════════════════════════════════════════════════════════════

class AIMemory(Base):
    __tablename__ = "ai_memories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id      = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    memory_type  = Column(String,  default="business_fact")
    memory_key   = Column(String,  nullable=False)
    memory_value = Column(Text,    nullable=False)
    confidence   = Column(Float,   default=1.0)
    source       = Column(String,  default="ai_observed")
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="ai_memories")


# ══════════════════════════════════════════════════════════════════════════
# ACTIVITY LOG
# ══════════════════════════════════════════════════════════════════════════

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action_type = Column(String, nullable=False)
    action_data = Column(JSON,   nullable=True)
    page        = Column(String, nullable=True)
    description = Column(String, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="activity_logs")


# ══════════════════════════════════════════════════════════════════════════
# USER PREFERENCE
# ══════════════════════════════════════════════════════════════════════════

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    preference_key   = Column(String, nullable=False)
    preference_value = Column(Text,   nullable=True)
    updated_at       = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship("User", back_populates="preferences")


# ══════════════════════════════════════════════════════════════════════════
# FINANCIAL TIMELINE
# ══════════════════════════════════════════════════════════════════════════

class FinancialTimeline(Base):
    __tablename__ = "financial_timeline"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id           = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    period            = Column(String,  nullable=False)
    year              = Column(Integer, nullable=False)
    month             = Column(Integer, nullable=False)
    total_revenue     = Column(Float,   default=0.0)
    invoice_revenue   = Column(Float,   default=0.0)
    other_revenue     = Column(Float,   default=0.0)
    total_expenses    = Column(Float,   default=0.0)
    top_categories    = Column(JSON,    default=dict)
    gross_profit      = Column(Float,   default=0.0)
    net_profit        = Column(Float,   default=0.0)
    tax_estimate      = Column(Float,   default=0.0)
    net_after_tax     = Column(Float,   default=0.0)
    invoice_count     = Column(Integer, default=0)
    paid_invoices     = Column(Integer, default=0)
    transaction_count = Column(Integer, default=0)
    document_count    = Column(Integer, default=0)
    revenue_change    = Column(Float,   default=0.0)
    expense_change    = Column(Float,   default=0.0)
    profit_change     = Column(Float,   default=0.0)
    ai_insight        = Column(Text,    nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    updated_at        = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="financial_timeline")


# ══════════════════════════════════════════════════════════════════════════
# UPLOAD JOB
# ══════════════════════════════════════════════════════════════════════════

class UploadJob(Base):
    __tablename__ = "upload_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename      = Column(String, nullable=False)
    status        = Column(String, default="uploaded")
    current_step  = Column(String, default="uploading")
    progress      = Column(Integer, default=0)
    error_message = Column(Text,   nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="upload_jobs")