from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import AgentLog, Transaction, Document, TransactionType
from app.schemas.schemas import AgentChatRequest, AgentChatResponse
from app.core.config import settings

router = APIRouter(prefix="/agents", tags=["AI Agents"])


async def _build_context(user_id: str, db: AsyncSession) -> str:
    try:
        total_expenses = await db.scalar(
            select(func.sum(Transaction.amount)).where(
                Transaction.user_id == user_id,
                Transaction.txn_type == TransactionType.EXPENSE,
            )
        ) or 0.0

        total_revenue = await db.scalar(
            select(func.sum(Transaction.amount)).where(
                Transaction.user_id == user_id,
                Transaction.txn_type == TransactionType.INCOME,
            )
        ) or 0.0

        doc_count = await db.scalar(
            select(func.count(Document.id)).where(
                Document.user_id == user_id
            )
        ) or 0

        return (
            f"Total documents: {doc_count}\n"
            f"Total expenses: ${total_expenses:,.2f}\n"
            f"Total revenue: ${total_revenue:,.2f}\n"
            f"Net: ${total_revenue - total_expenses:,.2f}"
        )
    except Exception:
        return "No financial data available yet."


@router.post("/chat", response_model=AgentChatResponse)
async def agent_chat(
    body: AgentChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    context  = await _build_context(current_user["user_id"], db)
    messages = [m.model_dump() for m in body.messages]

    try:
        if body.provider == "gemini":
            import app.services.ai.gemini_service as gemini_svc
            reply = await gemini_svc.agent_chat(messages, context)
            model = settings.gemini_model
        else:
            import app.services.ai.openai_service as openai_svc
            reply = await openai_svc.agent_chat(messages, context)
            model = settings.openai_model

        log = AgentLog(
            id=uuid.uuid4(),
            user_id=current_user["user_id"],
            agent_name="ChatAgent",
            action=f"[{body.provider.upper()}] {body.messages[-1].content[:120]}",
        )
        db.add(log)

        return AgentChatResponse(reply=reply, provider=body.provider, model=model)

    except Exception as e:
        error_msg = str(e)
        print(f"Agent chat error: {error_msg}")
        return AgentChatResponse(
            reply=f"Error: {error_msg[:300]}",
            provider=body.provider,
            model="unknown"
        )


@router.get("/logs")
async def get_agent_logs(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    limit: int = 50,
):
    result = await db.execute(
        select(AgentLog)
        .where(AgentLog.user_id == current_user["user_id"])
        .order_by(AgentLog.created_at.desc())
        .limit(limit)
    )
    logs = result.scalars().all()
    return [
        {
            "id":         str(log.id),
            "agent":      log.agent_name,
            "action":     log.action,
            "status":     log.status,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]