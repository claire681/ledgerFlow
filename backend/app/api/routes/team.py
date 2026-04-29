from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional
import uuid
import traceback

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import TeamMember
from pydantic import BaseModel

router = APIRouter(prefix="/team", tags=["Team"])

ROLE_PERMISSIONS = {
    "admin": {
        "label":       "Admin",
        "icon":        "👑",
        "description": "Full access — manage team, view all data, edit everything",
        "permissions": [
            "View all data", "Edit transactions", "Upload documents",
            "Manage team", "Delete records", "Export reports",
            "Manage invoices", "Manage AI actions", "Manage organization settings",
        ],
        "can_delete":       True,
        "can_invite":       True,
        "can_edit":         True,
        "can_upload":       True,
        "can_export":       True,
        "can_manage_team":  True,
        "can_view_reports": True,
    },
    "accountant": {
        "label":       "Accountant",
        "icon":        "📊",
        "description": "Can view and edit all financial data but cannot manage team",
        "permissions": [
            "View all data", "Edit transactions", "Upload documents",
            "Export reports", "Manage invoices", "View dashboard",
        ],
        "can_delete":       False,
        "can_invite":       False,
        "can_edit":         True,
        "can_upload":       True,
        "can_export":       True,
        "can_manage_team":  False,
        "can_view_reports": True,
    },
    "staff": {
        "label":       "Staff",
        "icon":        "👤",
        "description": "Can upload documents and view their own uploads only",
        "permissions": ["Upload documents", "View own uploads"],
        "can_delete":       False,
        "can_invite":       False,
        "can_edit":         False,
        "can_upload":       True,
        "can_export":       False,
        "can_manage_team":  False,
        "can_view_reports": False,
    },
    "viewer": {
        "label":       "Viewer",
        "icon":        "👁",
        "description": "Read only — can view dashboard and reports but cannot edit",
        "permissions": ["View dashboard", "View reports"],
        "can_delete":       False,
        "can_invite":       False,
        "can_edit":         False,
        "can_upload":       False,
        "can_export":       False,
        "can_manage_team":  False,
        "can_view_reports": True,
    },
}


def member_to_dict(m: TeamMember) -> dict:
    return {
        "id":          str(m.id),
        "email":       m.email,
        "full_name":   m.full_name,
        "role":        m.role,
        "status":      m.status,
        "invited_at":  m.invited_at.isoformat()  if m.invited_at  else None,
        "accepted_at": m.accepted_at.isoformat() if m.accepted_at else None,
    }


class InviteCreate(BaseModel):
    email:     str
    full_name: Optional[str] = None
    role:      str           = "viewer"


class RoleUpdate(BaseModel):
    role: str


class StatusUpdate(BaseModel):
    status: str


# ── GET members ───────────────────────────────────────────────

@router.get("/members")
async def get_members(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        uid    = str(current_user.id)
        result = await db.execute(
            select(TeamMember)
            .where(TeamMember.owner_id == uid)
            .order_by(TeamMember.invited_at.desc())
        )
        members = result.scalars().all()

        active     = sum(1 for m in members if m.status == "active")
        pending    = sum(1 for m in members if m.status == "pending")
        roles_used = len(set(m.role for m in members))

        return {
            "members": [member_to_dict(m) for m in members],
            "summary": {
                "total":      len(members),
                "active":     active,
                "pending":    pending,
                "roles_used": roles_used,
            },
        }
    except Exception as e:
        print(f"get_members error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ── INVITE member ─────────────────────────────────────────────

@router.post("/invite")
async def invite_member(
    body:         InviteCreate,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    try:
        uid = str(current_user.id)

        if body.role not in ROLE_PERMISSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role. Choose from: {list(ROLE_PERMISSIONS.keys())}"
            )

        if not body.email or "@" not in body.email:
            raise HTTPException(status_code=400, detail="Invalid email address")

        # Check duplicate
        existing = await db.execute(
            select(TeamMember).where(
                TeamMember.owner_id == uid,
                TeamMember.email    == body.email.lower().strip(),
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="This email has already been invited"
            )

        member = TeamMember(
            id        = uuid.uuid4(),
            owner_id  = uid,
            email     = body.email.lower().strip(),
            full_name = body.full_name,
            role      = body.role,
            status    = "pending",
        )
        db.add(member)
        await db.commit()
        await db.refresh(member)

        # ── Send invitation email ─────────────────────────────
        try:
            from app.services.email_service import send_email
            role_info = ROLE_PERMISSIONS[body.role]
            body_html = f"""
            <h2 style="color:#0AB98A;font-size:20px;margin:0 0 16px;">
                You have been invited to join Novala
            </h2>
            <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">
                You have been invited to join as a
                <strong style="color:#111827;">{role_info['label']}</strong>.
            </p>
            <div style="background:#F0FDF9;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #D1FAE5;">
                <div style="font-size:13px;color:#065F46;margin-bottom:8px;font-weight:600;">
                    {role_info['icon']} Your Role — {role_info['label']}
                </div>
                <div style="font-size:12px;color:#374151;line-height:1.6;">
                    {role_info['description']}
                </div>
            </div>
            <div style="margin-bottom:20px;">
                <div style="font-size:12px;color:#6B7280;margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">
                    Your permissions
                </div>
                {"".join([f'<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#374151;"><span style="color:#0AB98A;font-weight:600;">✓</span>{p}</div>' for p in role_info['permissions']])}
            </div>
            <div style="background:#F8FAFC;border-radius:10px;padding:16px;border:1px solid #E2E8F0;font-size:13px;color:#6B7280;line-height:1.6;">
                To accept this invitation sign up or log in at
<a href="https://www.getnovala.com" style="color:#0AB98A;font-weight:600;">
https://www.getnovala.com
</a>
using this email address.
            </div>
            """
            await send_email(
                to_email  = member.email,
                subject   = f"You have been invited to join Novala as {role_info['label']}",
                body_html = body_html,
                to_name   = body.full_name or "",
            )
        except Exception as email_err:
            print(f"Team invite email failed: {email_err}")
            # Do not fail the request if email fails

        return {
            **member_to_dict(member),
            "message": f"Invitation sent to {member.email} as {ROLE_PERMISSIONS[body.role]['label']}",
            "success": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"invite_member error: {traceback.format_exc()}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── UPDATE role ───────────────────────────────────────────────

@router.patch("/{member_id}/role")
async def update_role(
    member_id:    str,
    body:         RoleUpdate,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    try:
        uid = str(current_user.id)

        if body.role not in ROLE_PERMISSIONS:
            raise HTTPException(status_code=400, detail="Invalid role")

        result = await db.execute(
            select(TeamMember).where(
                TeamMember.id       == member_id,
                TeamMember.owner_id == uid,
            )
        )
        member = result.scalar_one_or_none()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")

        member.role = body.role
        await db.commit()
        await db.refresh(member)

        return {
            **member_to_dict(member),
            "message": f"Role updated to {ROLE_PERMISSIONS[body.role]['label']}",
            "success": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"update_role error: {traceback.format_exc()}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── UPDATE status ─────────────────────────────────────────────

@router.patch("/{member_id}/status")
async def update_status(
    member_id:    str,
    body:         StatusUpdate,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    try:
        uid = str(current_user.id)

        if body.status not in ("active", "pending", "inactive"):
            raise HTTPException(status_code=400, detail="Invalid status")

        result = await db.execute(
            select(TeamMember).where(
                TeamMember.id       == member_id,
                TeamMember.owner_id == uid,
            )
        )
        member = result.scalar_one_or_none()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")

        member.status = body.status
        if body.status == "active":
            member.accepted_at = datetime.utcnow()
        await db.commit()
        await db.refresh(member)

        return {
            **member_to_dict(member),
            "message": f"Status updated to {body.status}",
            "success": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"update_status error: {traceback.format_exc()}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── DELETE member ─────────────────────────────────────────────

@router.delete("/{member_id}")
async def remove_member(
    member_id:    str,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    try:
        uid = str(current_user.id)

        result = await db.execute(
            select(TeamMember).where(
                TeamMember.id       == member_id,
                TeamMember.owner_id == uid,
            )
        )
        member = result.scalar_one_or_none()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")

        email = member.email
        await db.delete(member)
        await db.commit()

        return {
            "message": f"{email} has been removed from the team",
            "success": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"remove_member error: {traceback.format_exc()}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── GET roles ─────────────────────────────────────────────────

@router.get("/roles")
async def get_roles():
    return ROLE_PERMISSIONS


# ── GET summary for AI ────────────────────────────────────────

@router.get("/summary")
async def get_team_summary(
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    try:
        uid    = str(current_user.id)
        result = await db.execute(
            select(TeamMember).where(TeamMember.owner_id == uid)
        )
        members = result.scalars().all()

        by_role: dict = {}
        for m in members:
            if m.role not in by_role:
                by_role[m.role] = []
            by_role[m.role].append({
                "email":     m.email,
                "full_name": m.full_name,
                "status":    m.status,
            })

        return {
            "total_members": len(members),
            "active":        sum(1 for m in members if m.status == "active"),
            "pending":       sum(1 for m in members if m.status == "pending"),
            "by_role":       by_role,
            "roles_defined": list(ROLE_PERMISSIONS.keys()),
        }

    except Exception as e:
        print(f"get_team_summary error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))