from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import Optional
import uuid
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import Transaction, Budget
from pydantic import BaseModel

router = APIRouter(prefix="/budgets", tags=["Budgets"])


class BudgetCreate(BaseModel):
    category:      str
    monthly_limit: float
    currency:      str = "USD"


class BudgetUpdate(BaseModel):
    monthly_limit: Optional[float] = None
    manual_spent:  Optional[float] = None
    currency:      Optional[str]   = None


class BudgetOut(BaseModel):
    id:            str
    category:      str
    monthly_limit: float
    spent:         float
    remaining:     float
    percentage:    float
    status:        str
    currency:      str
    manual_spent:  Optional[float] = None

    class Config:
        from_attributes = True


def calc_status(percentage: float) -> str:
    if percentage >= 100:
        return "exceeded"
    elif percentage >= 80:
        return "warning"
    elif percentage >= 50:
        return "moderate"
    return "good"


async def get_spent_for_category(
    db: AsyncSession,
    user_id: str,
    category: str,
    start: datetime,
) -> float:
    result = await db.execute(
        select(func.sum(func.abs(Transaction.amount)))
        .where(
            Transaction.user_id    == user_id,
            Transaction.category   == category,
            Transaction.created_at >= start,
        )
    )
    return float(result.scalar() or 0)


def build_budget_out(budget: Budget, spent: float) -> BudgetOut:
    # If user manually set spent, use that; otherwise use transaction total
    effective_spent = float(budget.manual_spent) if budget.manual_spent is not None else spent
    remaining       = max(0.0, budget.monthly_limit - effective_spent)
    percentage      = min(100.0, (effective_spent / budget.monthly_limit * 100)) if budget.monthly_limit > 0 else 0.0
    status          = calc_status(percentage)

    return BudgetOut(
        id=str(budget.id),
        category=budget.category,
        monthly_limit=budget.monthly_limit,
        spent=effective_spent,
        remaining=remaining,
        percentage=round(percentage, 1),
        status=status,
        currency=budget.currency or "USD",
        manual_spent=budget.manual_spent,
    )


@router.get("/", response_model=list[BudgetOut])
async def get_budgets(
    db:           AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    uid = str(current_user.id)

    result  = await db.execute(select(Budget).where(Budget.user_id == uid))
    budgets = result.scalars().all()

    if not budgets:
        return []

    now   = datetime.utcnow()
    start = datetime(now.year, now.month, 1)

    spending_result = await db.execute(
        select(
            Transaction.category,
            func.sum(func.abs(Transaction.amount)).label("total"),
        )
        .where(
            Transaction.user_id    == uid,
            Transaction.category   != None,
            Transaction.created_at >= start,
        )
        .group_by(Transaction.category)
    )
    spending = {row.category: float(row.total or 0) for row in spending_result}

    return [build_budget_out(b, spending.get(b.category, 0.0)) for b in budgets]


@router.post("/", response_model=BudgetOut)
async def create_budget(
    body:         BudgetCreate,
    db:           AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    uid = str(current_user.id)

    existing = await db.execute(
        select(Budget).where(
            Budget.user_id  == uid,
            Budget.category == body.category,
        )
    )
    budget = existing.scalar_one_or_none()

    if budget:
        budget.monthly_limit = body.monthly_limit
        budget.currency      = body.currency
        budget.updated_at    = datetime.utcnow()
    else:
        budget = Budget(
            id=uuid.uuid4(),
            user_id=uid,
            category=body.category,
            monthly_limit=body.monthly_limit,
            currency=body.currency,
        )
        db.add(budget)

    await db.commit()
    await db.refresh(budget)

    now   = datetime.utcnow()
    start = datetime(now.year, now.month, 1)
    spent = await get_spent_for_category(db, uid, body.category, start)

    return build_budget_out(budget, spent)


@router.patch("/{budget_id}", response_model=BudgetOut)
async def update_budget(
    budget_id:    str,
    body:         BudgetUpdate,
    db:           AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    uid = str(current_user.id)

    result = await db.execute(
        select(Budget).where(
            Budget.id      == budget_id,
            Budget.user_id == uid,
        )
    )
    budget = result.scalar_one_or_none()

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    if body.monthly_limit is not None:
        budget.monthly_limit = body.monthly_limit
    if body.currency is not None:
        budget.currency = body.currency
    if body.manual_spent is not None:
        budget.manual_spent = body.manual_spent
    budget.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(budget)

    now   = datetime.utcnow()
    start = datetime(now.year, now.month, 1)
    spent = await get_spent_for_category(db, uid, budget.category, start)

    return build_budget_out(budget, spent)


@router.delete("/{category}")
async def delete_budget(
    category:     str,
    db:           AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    uid = str(current_user.id)

    result = await db.execute(
        select(Budget).where(
            Budget.user_id  == uid,
            Budget.category == category,
        )
    )
    budget = result.scalar_one_or_none()

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    await db.delete(budget)
    await db.commit()

    return {"message": f"Budget for {category} deleted"}