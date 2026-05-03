from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

from app.core.config import settings
from app.db.database import engine, Base
from app.services.scheduler import run_scheduler

# Import ALL models so SQLAlchemy knows about them
from app.models import models  # noqa: F401

# Import all routers
from app.api.routes import (
    auth, documents, transactions, agents,
    analytics, integrations, budgets, invoices, team,
)
from app.api.routes import (
    company, tax_reports, scenarios,
    ai_context, snapshots, preferences,
)
from app.api.routes.briefing import router as briefing_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Creates all tables automatically on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Start the briefing scheduler
    asyncio.create_task(run_scheduler())
    yield
    await engine.dispose()


app = FastAPI(
    title       = "LedgerFlow API",
    description = "AI-powered financial intelligence platform",
    version     = "2.0.0",
    lifespan    = lifespan,
)
from fastapi.responses import FileResponse

@app.get("/documents/{filename}")
async def view_document(filename: str):
    file_path = f"documents/{filename}"
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=filename
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://getnovala.com",
        "https://www.getnovala.com",
        "https://main.d1234567890.amplifyapp.com",  # replace with your Amplify URL later
    ],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Routes ────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/api/v1")
app.include_router(documents.router,    prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(agents.router,       prefix="/api/v1")
app.include_router(analytics.router,    prefix="/api/v1")
app.include_router(integrations.router, prefix="/api/v1")
app.include_router(budgets.router,      prefix="/api/v1")
app.include_router(invoices.router,     prefix="/api/v1")
app.include_router(briefing_router,     prefix="/api/v1")
app.include_router(team.router,         prefix="/api/v1")

# ── Phase 2 routes ────────────────────────────────────────────
app.include_router(company.router,      prefix="/api/v1")
app.include_router(tax_reports.router,  prefix="/api/v1")
app.include_router(scenarios.router,    prefix="/api/v1")
app.include_router(ai_context.router,   prefix="/api/v1")
app.include_router(snapshots.router,    prefix="/api/v1")
app.include_router(preferences.router,  prefix="/api/v1")


@app.get("/health")
async def health():
    return {
        "status":  "ok",
        "app":     "LedgerFlow",
        "version": "2.0.0",
    }