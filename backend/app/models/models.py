from sqlalchemy import (
    Column, String, Float, Boolean, Integer, Numeric,
    DateTime, Date, Text, ForeignKey, JSON,
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

    # Subscription / billing state (DB columns added via alembic)
    subscription_status = Column(String, nullable=True)
    trial_ends_at = Column(DateTime(timezone=False), nullable=True)
    stripe_customer_id = Column(String, nullable=True)

    # Email verification
    verification_code = Column(String, nullable=True)
    verification_code_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Onboarding wizard state
    onboarding_completed = Column(Boolean, nullable=True)
    onboarding_step = Column(Integer, nullable=True)
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


    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
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
    tax_registration   = Column(JSONB, nullable=True, default=dict)
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


# === PAYROLL MODELS (Phase 1: Canada + US) ===

class Employee(Base):
    __tablename__ = "employees"

    # System
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)  # set when employee accepts portal invite

    # Personal
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    preferred_name = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    marital_status = Column(String, nullable=True)
    sin_or_ssn = Column(String, nullable=True)  # encrypted at rest in prod

    # Contact
    phone = Column(String, nullable=True)
    personal_email = Column(String, nullable=False, index=True)

    # Address
    address_line1 = Column(String, nullable=True)
    address_line2 = Column(String, nullable=True)
    city = Column(String, nullable=True)
    province_or_state = Column(String, nullable=True)
    postal_or_zip = Column(String, nullable=True)
    country = Column(String, nullable=True)

    # Employment
    employee_number = Column(String, nullable=True)
    position_title = Column(String, nullable=True)
    department = Column(String, nullable=True)
    employment_type = Column(String, nullable=False, default="full_time")
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(String, nullable=False, default="active")
    manager_name = Column(String, nullable=True)

    # Compensation
    pay_type = Column(String, nullable=False, default="salary")
    salary_amount = Column(Numeric(12, 2), nullable=True)
    hourly_rate = Column(Numeric(12, 2), nullable=True)
    hours_per_week = Column(Numeric(5, 2), nullable=True)
    pay_schedule = Column(String, nullable=True, default="bi_weekly")
    currency = Column(String, nullable=False, default="CAD")

    # Banking
    bank_name = Column(String, nullable=True)
    transit_number = Column(String, nullable=True)
    institution_number = Column(String, nullable=True)
    routing_number = Column(String, nullable=True)
    account_number_encrypted = Column(String, nullable=True)
    account_type = Column(String, nullable=True)

    # Tax info (country-specific JSONB)
    tax_info = Column(JSONB, nullable=True, default=dict)

    # Emergency contact
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_relationship = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    emergency_contact_email = Column(String, nullable=True)

    # Self-service invite tracking (no separate invite table needed)
    invite_token = Column(String, nullable=True, unique=True, index=True)
    invite_status = Column(String, nullable=True)
    invite_expires_at = Column(DateTime(timezone=True), nullable=True)
    invite_sent_at = Column(DateTime(timezone=True), nullable=True)
    invite_accepted_at = Column(DateTime(timezone=True), nullable=True)
    profile_completed = Column(Boolean, default=False)

    # Notes
    notes = Column(Text, nullable=True)

    # Timestamps
    # Time off policies (Screen 4e)
    vacation_policy = Column(String(80))
    sick_pay_policy = Column(String(80))
    unpaid_time_off_policy = Column(String(80))
    # Deductions & contributions (Screen 4f)
    dental_benefit_code = Column(String(10))
    deductions_list = Column(JSONB)
    # Mailing address (Screen 4a — when "Mailing address is the same" is unchecked)
    mailing_address_same = Column(Boolean, default=True)
    mailing_address_line1 = Column(String(255))
    mailing_address_line2 = Column(String(255))
    mailing_city = Column(String(120))
    mailing_province_or_state = Column(String(40))
    mailing_postal_or_zip = Column(String(20))
    # Base pay extensions (Screen 4d conditional fields)
    pay_frequency = Column(String(40))
    hours_per_day = Column(Numeric(5, 2))
    days_per_week = Column(Numeric(5, 2))
    account_mapping = Column(String(255))
    # Base pay effective date (Screen 4d Effective on section)
    effective_date = Column(Date)
    # Work location
    work_location_id = Column(UUID(as_uuid=True), ForeignKey("work_locations.id", ondelete="SET NULL"), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PayrollSettings(Base):
    __tablename__ = "payroll_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False, index=True)

    # Country/jurisdiction
    country = Column(String, nullable=False, default="CA")
    province_or_state = Column(String, nullable=True)

    # Pay schedule
    default_pay_schedule = Column(String, nullable=False, default="bi_weekly")
    pay_period_anchor_date = Column(Date, nullable=True)
    pay_schedule_config = Column(JSONB, nullable=True, default=dict)

    # Currency
    currency = Column(String, nullable=False, default="CAD")

    # Custom deduction rates (overrides country defaults if set)
    # Examples:
    #   CA: {"federal_tax_rate": 0.15, "cpp_rate": 0.0595, "ei_rate": 0.0166}
    #   US: {"federal_tax_rate": 0.12, "social_security_rate": 0.062, "medicare_rate": 0.0145}
    custom_deduction_rates = Column(JSONB, nullable=True, default=dict)

    # Company bank info (for direct deposit later)
    company_bank_name = Column(String, nullable=True)
    company_transit_number = Column(String, nullable=True)
    company_institution_number = Column(String, nullable=True)
    company_routing_number = Column(String, nullable=True)
    company_account_number_encrypted = Column(String, nullable=True)

    # Tax filing IDs
    business_number = Column(String, nullable=True)  # Canada
    ein = Column(String, nullable=True)              # US

    # Active flag (set true when owner finishes setup)
    payroll_active = Column(Boolean, default=False)
    bank_details = Column(JSONB, nullable=True, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())



# === PAY RUN MODELS ===

class PayRun(Base):
    __tablename__ = "pay_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    pay_period_start = Column(Date, nullable=False)
    pay_period_end = Column(Date, nullable=False)
    pay_date = Column(Date, nullable=False, index=True)

    status = Column(String, nullable=False, default="approved")  # draft, approved, paid, voided
    country = Column(String, nullable=False, default="CA")
    currency = Column(String, nullable=False, default="CAD")

    total_gross = Column(Numeric(14, 2), nullable=False, default=0)
    total_deductions = Column(Numeric(14, 2), nullable=False, default=0)
    total_net = Column(Numeric(14, 2), nullable=False, default=0)
    employee_count = Column(Integer, nullable=False, default=0)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)

    # Multi-country engine fields
    total_employer_contributions = Column(Numeric(14, 2), nullable=False, default=0)
    total_remittance_owed = Column(Numeric(14, 2), nullable=False, default=0)
    finalized_at = Column(DateTime(timezone=True), nullable=True)
    finalized_by_user_id = Column(UUID(as_uuid=True), nullable=True)
    voided_at = Column(DateTime(timezone=True), nullable=True)
    void_reason = Column(Text, nullable=True)


class PayStub(Base):
    __tablename__ = "pay_stubs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pay_run_id = Column(UUID(as_uuid=True), ForeignKey("pay_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False, index=True)

    # Employee snapshot at time of run
    employee_name = Column(String(200), nullable=True)
    employee_email = Column(String(255), nullable=True)
    position_title = Column(String(200), nullable=True)

    # Hour breakdown by category
    hours_regular = Column(Numeric(8, 2), nullable=False, default=0)
    hours_overtime = Column(Numeric(8, 2), nullable=False, default=0)
    hours_stat_holiday = Column(Numeric(8, 2), nullable=False, default=0)
    hours_vacation = Column(Numeric(8, 2), nullable=False, default=0)
    hours_sick = Column(Numeric(8, 2), nullable=False, default=0)
    hours_evening = Column(Numeric(8, 2), nullable=False, default=0)
    hours_overnight = Column(Numeric(8, 2), nullable=False, default=0)
    hours_weekend = Column(Numeric(8, 2), nullable=False, default=0)
    hours_on_call = Column(Numeric(8, 2), nullable=False, default=0)
    hours_travel = Column(Numeric(8, 2), nullable=False, default=0)

    # Pay basis
    pay_type = Column(String(20), nullable=True)
    hourly_rate = Column(Numeric(10, 2), nullable=True)
    salary_amount = Column(Numeric(10, 2), nullable=False, default=0)

    # Earnings
    gross_pay = Column(Numeric(12, 2), nullable=False, default=0)
    bonus = Column(Numeric(10, 2), nullable=False, default=0)
    commission = Column(Numeric(10, 2), nullable=False, default=0)
    reimbursement = Column(Numeric(10, 2), nullable=False, default=0)

    # Employee deductions (country-agnostic)
    federal_tax = Column(Numeric(10, 2), nullable=False, default=0)
    provincial_or_state_tax = Column(Numeric(10, 2), nullable=False, default=0)
    local_tax = Column(Numeric(10, 2), nullable=False, default=0)
    social_security_employee = Column(Numeric(10, 2), nullable=False, default=0)
    social_security_2_employee = Column(Numeric(10, 2), nullable=False, default=0)
    unemployment_employee = Column(Numeric(10, 2), nullable=False, default=0)
    other_employee_deductions = Column(JSONB, nullable=True)
    total_employee_deductions = Column(Numeric(12, 2), nullable=False, default=0)

    # Employer contributions
    social_security_employer = Column(Numeric(10, 2), nullable=False, default=0)
    unemployment_employer = Column(Numeric(10, 2), nullable=False, default=0)
    workers_comp_employer = Column(Numeric(10, 2), nullable=False, default=0)
    other_employer_contributions = Column(JSONB, nullable=True)
    total_employer_contributions = Column(Numeric(12, 2), nullable=False, default=0)

    # Net
    net_pay = Column(Numeric(12, 2), nullable=False, default=0)

    # Audit + artifacts
    calculation_snapshot = Column(JSONB, nullable=True)
    paystub_pdf_s3_key = Column(String(500), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    currency = Column(String(3), nullable=False, default="CAD")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    paypal_subscription_id = Column(String, unique=True, nullable=True, index=True)
    paypal_plan_id = Column(String, nullable=False)
    plan_slug = Column(String, nullable=False)

    status = Column(String, default="APPROVAL_PENDING", nullable=False, index=True)

    approval_url = Column(String(2048), nullable=True)

    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    last_payment_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="subscriptions")


# === PAYROLL ENGINE MODELS (Phase 2) ===

class YTDBalance(Base):
    __tablename__ = "ytd_balances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    tax_year = Column(Integer, nullable=False, index=True)
    jurisdiction = Column(String(20), nullable=False)

    ytd_gross = Column(Numeric(14, 2), nullable=False, default=0)
    ytd_federal_tax = Column(Numeric(14, 2), nullable=False, default=0)
    ytd_provincial_or_state_tax = Column(Numeric(14, 2), nullable=False, default=0)
    ytd_social_security_employee = Column(Numeric(14, 2), nullable=False, default=0)
    ytd_social_security_employer = Column(Numeric(14, 2), nullable=False, default=0)
    ytd_unemployment_employee = Column(Numeric(14, 2), nullable=False, default=0)
    ytd_unemployment_employer = Column(Numeric(14, 2), nullable=False, default=0)
    ytd_pensionable_earnings = Column(Numeric(14, 2), nullable=False, default=0)
    ytd_insurable_earnings = Column(Numeric(14, 2), nullable=False, default=0)
    ytd_other_deductions = Column(JSONB, nullable=True)

    last_pay_run_id = Column(UUID(as_uuid=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class TaxTable(Base):
    __tablename__ = "tax_tables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country = Column(String(2), nullable=False)
    subnational = Column(String(20), nullable=True)
    tax_year = Column(Integer, nullable=False)
    table_type = Column(String(50), nullable=False)
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date, nullable=True)
    data = Column(JSONB, nullable=False)
    source_url = Column(String(500), nullable=True)
    source_document_hash = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by_user_id = Column(UUID(as_uuid=True), nullable=True)


class PayrollAuditLog(Base):
    __tablename__ = "payroll_audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    action = Column(String(50), nullable=False)
    actor_user_id = Column(UUID(as_uuid=True), nullable=True)
    actor_role = Column(String(50), nullable=True)
    before_state = Column(JSONB, nullable=True)
    after_state = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    ai_session_id = Column(UUID(as_uuid=True), nullable=True)
    ai_was_overridden = Column(Boolean, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class WorkLocation(Base):
    __tablename__ = "work_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    is_primary = Column(Boolean, nullable=False, default=False)
    status = Column(String(20), nullable=False, default="active")

    # Address
    street_address = Column(String, nullable=True)
    municipality = Column(String, nullable=True)
    province = Column(String(10), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(2), nullable=False, default="CA")

    # Extended fields for full Work Locations UI
    name = Column(String(200), nullable=True)
    suite = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    is_international = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

# ── Pay Types & Deductions ────────────────────────────────────────────

class PayType(Base):
    """
    Catalog of earning types: salary, hourly, overtime, bonus, mileage, etc.
    Each pay type carries tax-treatment flags that drive payroll calculations.
    Country-specific defaults are seeded based on company country.
    """
    __tablename__ = "pay_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Basic info
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    country = Column(String, nullable=False, default="CA")  # Inherited from company at creation

    # Classification
    is_default = Column(Boolean, default=False, nullable=False, index=True)  # Seeded vs custom
    is_active = Column(Boolean, default=True, nullable=False)

    # Calculation method: fixed | rate_hours | rate_units | percent_gross
    calc_method = Column(String, nullable=False, default="fixed")
    default_rate = Column(Numeric(12, 4), nullable=True)  # Used as starting rate per employee
    unit_label = Column(String, nullable=True)  # "per visit", "per km", "per hour"

    # Canadian tax flags
    federal_taxable = Column(Boolean, default=True, nullable=False)
    cpp_contributable = Column(Boolean, default=True, nullable=False)
    ei_insurable = Column(Boolean, default=True, nullable=False)
    vacationable = Column(Boolean, default=True, nullable=False)
    wcb_reportable = Column(Boolean, default=True, nullable=False)

    # Reporting
    t4_box = Column(String, nullable=True, default="14")  # Default to Box 14 (employment income)

    # Country-specific tax flags as JSONB for future expansion
    # e.g. for US: {"federal_withholding": true, "fica_applicable": true, "futa_applicable": true}
    country_flags = Column(JSONB, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class DeductionType(Base):
    """
    Catalog of deduction types: RRSP, health benefits, garnishments, union dues, etc.
    Each deduction carries tax-treatment rules (pre-tax vs post-tax, employer match).
    """
    __tablename__ = "deduction_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    country = Column(String, nullable=False, default="CA")

    is_default = Column(Boolean, default=False, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Calculation: fixed | percent_gross
    calc_method = Column(String, nullable=False, default="fixed")
    default_amount = Column(Numeric(12, 4), nullable=True)
    unit_label = Column(String, nullable=True)  # "/month", "% of gross"

    # Tax treatment
    is_pre_tax = Column(Boolean, default=False, nullable=False)  # Reduces taxable income
    employer_matched = Column(Boolean, default=False, nullable=False)  # Employer contributes too

    # Country-specific flags
    country_flags = Column(JSONB, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)



class EmployeePayItem(Base):
    """
    Links an employee to a pay type (Salary, Hourly wage, Overtime, etc.).
    Inherits tax rules from the pay_type. Rate can be overridden per employee.
    """
    __tablename__ = "employee_pay_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    pay_type_id = Column(UUID(as_uuid=True), ForeignKey("pay_types.id", ondelete="RESTRICT"), nullable=False, index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Per-employee overrides (NULL means use pay_type default)
    rate_override = Column(Numeric(12, 4), nullable=True)
    unit_label_override = Column(String(50), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    paused_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class EmployeeDeductionItem(Base):
    """
    Links an employee to a deduction type (RRSP, health benefits, garnishment, etc.).
    Inherits tax rules from the deduction_type. Amount can be overridden per employee.
    """
    __tablename__ = "employee_deduction_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    deduction_type_id = Column(UUID(as_uuid=True), ForeignKey("deduction_types.id", ondelete="RESTRICT"), nullable=False, index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Per-employee overrides (NULL means use deduction_type default)
    amount_override = Column(Numeric(12, 4), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    paused_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
