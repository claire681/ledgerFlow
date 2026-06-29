"""
Seed default pay types and deduction types for a user.
Runs idempotently - safe to call multiple times for the same user.
Country-aware: seeds different defaults based on company country (currently Canada).
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.models.models import PayType, DeductionType


# Canadian default pay types - all earnings
CANADA_DEFAULT_PAY_TYPES = [
    {
        "name": "Salary",
        "description": "Fixed amount per pay period",
        "calc_method": "fixed",
        "default_rate": None,
        "unit_label": None,
        "federal_taxable": True,
        "cpp_contributable": True,
        "ei_insurable": True,
        "vacationable": True,
        "wcb_reportable": True,
        "t4_box": "14",
    },
    {
        "name": "Hourly wage",
        "description": "Pay per hour worked",
        "calc_method": "rate_hours",
        "default_rate": None,
        "unit_label": "per hour",
        "federal_taxable": True,
        "cpp_contributable": True,
        "ei_insurable": True,
        "vacationable": True,
        "wcb_reportable": True,
        "t4_box": "14",
    },
    {
        "name": "Overtime",
        "description": "Hours beyond standard schedule",
        "calc_method": "rate_hours",
        "default_rate": None,
        "unit_label": "per hour (1.5x)",
        "federal_taxable": True,
        "cpp_contributable": True,
        "ei_insurable": True,
        "vacationable": True,
        "wcb_reportable": True,
        "t4_box": "14",
    },
    {
        "name": "Statutory holiday pay",
        "description": "Pay for public holidays",
        "calc_method": "fixed",
        "default_rate": None,
        "unit_label": "per day",
        "federal_taxable": True,
        "cpp_contributable": True,
        "ei_insurable": True,
        "vacationable": True,
        "wcb_reportable": True,
        "t4_box": "14",
    },
    {
        "name": "Vacation pay",
        "description": "Vacation accrual or payout",
        "calc_method": "percent_gross",
        "default_rate": 4.00,
        "unit_label": "% of gross",
        "federal_taxable": True,
        "cpp_contributable": True,
        "ei_insurable": True,
        "vacationable": False,
        "wcb_reportable": True,
        "t4_box": "14",
    },
    {
        "name": "Bonus",
        "description": "One-time additional payment",
        "calc_method": "fixed",
        "default_rate": None,
        "unit_label": None,
        "federal_taxable": True,
        "cpp_contributable": True,
        "ei_insurable": True,
        "vacationable": True,
        "wcb_reportable": True,
        "t4_box": "14",
    },
    {
        "name": "Mileage reimbursement",
        "description": "Vehicle expense payback (non-taxable)",
        "calc_method": "rate_units",
        "default_rate": 0.68,
        "unit_label": "per km",
        "federal_taxable": False,
        "cpp_contributable": False,
        "ei_insurable": False,
        "vacationable": False,
        "wcb_reportable": False,
        "t4_box": None,
    },
]


# Canadian default deductions
CANADA_DEFAULT_DEDUCTIONS = [
    {
        "name": "RRSP contribution",
        "description": "Retirement savings plan",
        "calc_method": "percent_gross",
        "default_amount": 5.00,
        "unit_label": "% of gross",
        "is_pre_tax": True,
        "employer_matched": True,
    },
    {
        "name": "Health benefits premium",
        "description": "Extended health insurance",
        "calc_method": "fixed",
        "default_amount": None,
        "unit_label": "per month",
        "is_pre_tax": False,
        "employer_matched": True,
    },
    {
        "name": "Dental benefits premium",
        "description": "Dental insurance plan",
        "calc_method": "fixed",
        "default_amount": None,
        "unit_label": "per month",
        "is_pre_tax": False,
        "employer_matched": True,
    },
    {
        "name": "Garnishment",
        "description": "Court-ordered deduction",
        "calc_method": "fixed",
        "default_amount": None,
        "unit_label": None,
        "is_pre_tax": False,
        "employer_matched": False,
    },
    {
        "name": "Union dues",
        "description": "Union membership fees",
        "calc_method": "percent_gross",
        "default_amount": 1.50,
        "unit_label": "% of gross",
        "is_pre_tax": True,
        "employer_matched": False,
    },
]


async def seed_payroll_defaults_for_user(db: AsyncSession, owner_id: UUID, country: str = "CA") -> dict:
    """
    Seeds default pay types and deductions for a user.
    Idempotent: checks for existing defaults before inserting.
    Returns a dict with counts of items created.
    """
    result = {"pay_types_created": 0, "deductions_created": 0}

    # Check if user already has default pay types
    existing_pay_types = await db.execute(
        select(PayType).where(
            PayType.owner_id == owner_id,
            PayType.is_default == True,
            PayType.deleted_at.is_(None),
        )
    )
    existing_pay_type_names = {pt.name for pt in existing_pay_types.scalars().all()}

    # Seed pay types
    if country == "CA":
        for pt_data in CANADA_DEFAULT_PAY_TYPES:
            if pt_data["name"] not in existing_pay_type_names:
                pt = PayType(
                    owner_id=owner_id,
                    country=country,
                    is_default=True,
                    is_active=True,
                    country_flags={},
                    **pt_data
                )
                db.add(pt)
                result["pay_types_created"] += 1

    # Check existing default deductions
    existing_deductions = await db.execute(
        select(DeductionType).where(
            DeductionType.owner_id == owner_id,
            DeductionType.is_default == True,
            DeductionType.deleted_at.is_(None),
        )
    )
    existing_deduction_names = {d.name for d in existing_deductions.scalars().all()}

    if country == "CA":
        for d_data in CANADA_DEFAULT_DEDUCTIONS:
            if d_data["name"] not in existing_deduction_names:
                d = DeductionType(
                    owner_id=owner_id,
                    country=country,
                    is_default=True,
                    is_active=True,
                    country_flags={},
                    **d_data
                )
                db.add(d)
                result["deductions_created"] += 1

    await db.commit()
    return result
