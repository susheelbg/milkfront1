from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import Profile
from app.schemas.user import ProfileUpdate
from app.utils.response import json_response

router = APIRouter(prefix="/profile", tags=["Farmer Profile"])

@router.get("")
async def get_profile(current_user: Profile = Depends(get_current_user)):
    """Retrieve profile context details for the logged-in user."""
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
        message="Profile details fetched successfully",
        data=user_payload
    )

@router.put("")
async def update_profile(
    req: ProfileUpdate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Modify details for the current user's profile without altering their role."""
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
        message="Profile details updated successfully",
        data=user_payload
    )
