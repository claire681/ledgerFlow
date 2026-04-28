from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from app.core.security import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard_stats(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        uid = str(current_user.id)

        # Total documents uploaded
        docs_result = await db.execute(
            text("SELECT COUNT(*) FROM documents WHERE user_id = :uid"),
            {"uid": uid}
        )
        docs_processed = docs_result.scalar() or 0

        # Total expenses
        exp_result = await db.execute(
            text("""
                SELECT COALESCE(SUM(ABS(amount)), 0)
                FROM transactions
                WHERE user_id = :uid
                AND LOWER(txn_type) = 'expense'
            """),
            {"uid": uid}
        )
        total_expenses = float(exp_result.scalar() or 0)

        # Total revenue — income transactions only, no double counting
        rev_result = await db.execute(
            text("""
                SELECT COALESCE(SUM(amount), 0)
                FROM transactions
                WHERE user_id = :uid
                AND LOWER(txn_type) = 'income'
            """),
            {"uid": uid}
        )
        total_revenue = float(rev_result.scalar() or 0)

        # Uncategorized transactions
        uncat_result = await db.execute(
            text("""
                SELECT COUNT(*)
                FROM transactions
                WHERE user_id = :uid
                AND category IS NULL
                AND ml_category IS NULL
            """),
            {"uid": uid}
        )
        uncategorized = uncat_result.scalar() or 0

        # Expense breakdown by category
        cat_result = await db.execute(
            text("""
                SELECT
                    COALESCE(category, ml_category, 'Uncategorized') AS cat,
                    SUM(ABS(amount)) AS total,
                    COUNT(*) AS cnt
                FROM transactions
                WHERE user_id = :uid
                AND LOWER(txn_type) = 'expense'
                GROUP BY COALESCE(category, ml_category, 'Uncategorized')
                ORDER BY total DESC
                LIMIT 10
            """),
            {"uid": uid}
        )
        expense_breakdown = [
            {
                "category": row.cat,
                "total":    float(row.total or 0),
                "count":    row.cnt,
            }
            for row in cat_result
        ]

        # Monthly summary
        monthly_result = await db.execute(
            text("""
                SELECT
                    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
                    COALESCE(SUM(CASE WHEN LOWER(txn_type) = 'income'
                        THEN amount ELSE 0 END), 0) AS total_income,
                    COALESCE(SUM(CASE WHEN LOWER(txn_type) = 'expense'
                        THEN ABS(amount) ELSE 0 END), 0) AS total_expenses
                FROM transactions
                WHERE user_id = :uid
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY DATE_TRUNC('month', created_at) DESC
                LIMIT 6
            """),
            {"uid": uid}
        )
        monthly_summary = [
            {
                "month":          row.month,
                "total_income":   float(row.total_income   or 0),
                "total_expenses": float(row.total_expenses or 0),
                "net":            float((row.total_income or 0) - (row.total_expenses or 0)),
            }
            for row in monthly_result
        ]

        # Recent transactions
        recent_result = await db.execute(
            text("""
                SELECT id, vendor, amount, txn_type, category,
                       ml_category, txn_date, status
                FROM transactions
                WHERE user_id = :uid
                ORDER BY created_at DESC
                LIMIT 8
            """),
            {"uid": uid}
        )
        recent_txns = [
            {
                "id":       str(row.id),
                "vendor":   row.vendor,
                "amount":   float(row.amount or 0),
                "txn_type": row.txn_type,
                "category": row.category or row.ml_category or "Uncategorized",
                "txn_date": row.txn_date,
                "status":   row.status or "ok",
            }
            for row in recent_result
        ]

        # Invoice summary
        inv_result = await db.execute(
            text("""
                SELECT
                    COUNT(*) AS total,
                    COALESCE(SUM(CASE WHEN LOWER(status) = 'paid'
                        THEN total ELSE 0 END), 0) AS paid_total,
                    COALESCE(SUM(CASE WHEN LOWER(status) IN ('due','overdue')
                        THEN total ELSE 0 END), 0) AS outstanding_total,
                    COUNT(CASE WHEN LOWER(status) IN ('due','overdue')
                        THEN 1 END) AS overdue_count
                FROM invoices
                WHERE user_id = :uid
            """),
            {"uid": uid}
        )
        inv_row = inv_result.fetchone()
        invoice_summary = {
            "total":             inv_row.total            if inv_row else 0,
            "paid_total":        float(inv_row.paid_total        or 0) if inv_row else 0,
            "outstanding_total": float(inv_row.outstanding_total or 0) if inv_row else 0,
            "overdue_count":     inv_row.overdue_count    if inv_row else 0,
        }

        return {
            "docs_processed":    docs_processed,
            "total_expenses":    total_expenses,
            "total_revenue":     total_revenue,
            "net_position":      total_revenue - total_expenses,
            "uncategorized":     uncategorized,
            "expense_breakdown": expense_breakdown,
            "monthly_summary":   monthly_summary,
            "recent_txns":       recent_txns,
            "invoice_summary":   invoice_summary,
        }

    except Exception as e:
        print(f"Dashboard stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cash-flow")
async def get_cash_flow(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        uid = str(current_user.id)
        result = await db.execute(
            text("""
                SELECT
                    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
                    COALESCE(SUM(CASE WHEN LOWER(txn_type) = 'income'
                        THEN amount ELSE 0 END), 0) AS income,
                    COALESCE(SUM(CASE WHEN LOWER(txn_type) = 'expense'
                        THEN ABS(amount) ELSE 0 END), 0) AS expenses
                FROM transactions
                WHERE user_id = :uid
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY DATE_TRUNC('month', created_at) DESC
                LIMIT 12
            """),
            {"uid": uid}
        )
        return [
            {
                "month":    row.month,
                "income":   float(row.income   or 0),
                "expenses": float(row.expenses or 0),
                "net":      float((row.income or 0) - (row.expenses or 0)),
            }
            for row in result
        ]
    except Exception as e:
        print(f"Cash flow error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/briefing")
async def get_daily_briefing(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        uid = str(current_user.id)

        txns = await db.execute(
            text("""
                SELECT vendor, amount, txn_type, category, ml_category, txn_date
                FROM transactions
                WHERE user_id = :uid
                ORDER BY created_at DESC
                LIMIT 50
            """),
            {"uid": uid}
        )
        transactions = txns.fetchall()

        docs = await db.execute(
            text("""
                SELECT filename, vendor, total_amount, status,
                       doc_date, suggested_cat, recorded_as
                FROM documents
                WHERE user_id = :uid
                ORDER BY uploaded_at DESC
                LIMIT 20
            """),
            {"uid": uid}
        )
        documents = docs.fetchall()

        invs = await db.execute(
            text("""
                SELECT invoice_number, to_name, total, status, due_date
                FROM invoices
                WHERE user_id = :uid
                ORDER BY created_at DESC
                LIMIT 20
            """),
            {"uid": uid}
        )
        invoices = invs.fetchall()

        observations = []

        uncategorized = [t for t in transactions if not t.category and not t.ml_category]
        if uncategorized:
            observations.append(
                f"{len(uncategorized)} transactions have no category — this affects your tax reports"
            )

        income_docs  = [d for d in documents if d.recorded_as == 'income']
        expense_docs = [d for d in documents if d.recorded_as == 'expense']

        if income_docs:
            total_income_docs = sum(d.total_amount or 0 for d in income_docs)
            observations.append(
                f"{len(income_docs)} income documents totalling ${total_income_docs:,.2f} recorded"
            )

        overdue = [i for i in invoices if i.status in ["overdue", "due"]]
        if overdue:
            total_overdue = sum(i.total or 0 for i in overdue)
            observations.append(
                f"{len(overdue)} unpaid invoices worth ${total_overdue:,.2f} — follow up to get paid"
            )

        income_txns  = [t for t in transactions if t.txn_type == 'income']
        expense_txns = [t for t in transactions if t.txn_type == 'expense']

        if income_txns and expense_txns:
            total_in  = sum(abs(t.amount or 0) for t in income_txns)
            total_out = sum(abs(t.amount or 0) for t in expense_txns)
            net       = total_in - total_out
            observations.append(
                f"Revenue ${total_in:,.2f} — Expenses ${total_out:,.2f} — Net ${net:,.2f}"
            )
        elif not income_txns and expense_txns:
            observations.append(
                "You have expenses recorded but no income — make sure to upload your income invoices"
            )

        actions = []
        if uncategorized:
            actions.append("Categorize transactions for tax reporting")
        if overdue:
            actions.append("Follow up on overdue invoices")
        if not transactions:
            actions.append("Upload your first receipt or invoice")

        return {
            "observations": observations,
            "actions":      actions,
            "summary": {
                "total_transactions":  len(transactions),
                "total_documents":     len(documents),
                "income_documents":    len(income_docs),
                "expense_documents":   len(expense_docs),
                "total_invoices":      len(invoices),
                "uncategorized_count": len(uncategorized),
                "overdue_count":       len(overdue),
            }
        }

    except Exception as e:
        print(f"Briefing error: {e}")
        return {
            "observations": [],
            "actions":      [],
            "summary":      {},
        }