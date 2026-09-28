import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import Profile
from app.schemas.user import ProfileUpdate, ProfileSyncRequest, ProfileResponse
from app.utils.response import json_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/me")
async def get_me(current_user: Profile = Depends(get_current_user)):
    """
    Fetch the currently authenticated user's profile based on verified Supabase JWT.
    """
    user_payload = {
        "id": str(current_user.id),
        "email": current_user.email or "",
        "name": current_user.name or "",
        "phone": current_user.phone or "",
        "address": current_user.address or "",
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else "",
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else "",
    }
    return json_response(
        success=True,
        message="Fetched profile successfully",
        data=user_payload
    )

@router.put("/profile")
async def update_profile(
    req: ProfileUpdate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Allows the authenticated user to update their name, phone, and address.
    Strictly prevents changing the user role.
    """
    if req.name is not None:
        current_user.name = req.name.strip()
    if req.phone is not None:
        current_user.phone = req.phone.strip()
    if req.address is not None:
        current_user.address = req.address.strip()

    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)

    user_payload = {
        "id": str(current_user.id),
        "email": current_user.email or "",
        "name": current_user.name or "",
        "phone": current_user.phone or "",
        "address": current_user.address or "",
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else "",
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else "",
    }
    return json_response(
        success=True,
        message="Profile updated successfully",
        data=user_payload
    )

@router.post("/sync-profile")
async def sync_profile(
    req: ProfileSyncRequest,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Called after Supabase client signup/login to ensure metadata is synced to public.profiles.
    Preserves existing role and never allows role escalation.
    """
    if req.name and not current_user.name:
        current_user.name = req.name.strip()
    if req.phone and not current_user.phone:
        current_user.phone = req.phone.strip()
    if req.address and not current_user.address:
        current_user.address = req.address.strip()

    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)

    return json_response(
        success=True,
        message="Profile synchronized successfully",
        data={
            "id": str(current_user.id),
            "email": current_user.email or "",
            "name": current_user.name or "",
            "phone": current_user.phone or "",
            "address": current_user.address or "",
            "role": current_user.role,
        }
    )

@router.delete("/account")
async def delete_account(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes the current user's account and completely purges all orders placed by them
    and all cattle listings created by them.
    """
    from sqlalchemy import text

    # Protect Super Admin from self-deletion
    if current_user.role == "super_admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super Admin accounts cannot be deleted."
        )

    user_id = current_user.id

    # 1. Delete all orders placed by this user
    await db.execute(text("DELETE FROM orders WHERE user_id = :uid"), {"uid": user_id})

    # 2. Delete all cattle listings created by this user
    await db.execute(text("DELETE FROM cattle WHERE user_id = :uid"), {"uid": user_id})

    # 3. Delete user profile
    await db.delete(current_user)

    # 4. Attempt to delete from Supabase auth.users if accessible
    try:
        await db.execute(text("DELETE FROM auth.users WHERE id = :uid"), {"uid": str(user_id)})
    except Exception:
        pass

    await db.commit()

    return json_response(
        success=True,
        message="Account and all associated orders and listings deleted successfully."
    )
