from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import verify_password
from app.models.user import User
from app.models.cattle import Cattle
from app.schemas.user import UserUpdate, UserResponse
from app.services.cloudinary_service import upload_image
from app.utils.response import json_response

router = APIRouter(prefix="/profile", tags=["Farmer Profile"])

@router.get("")
async def get_profile(current_user: User = Depends(get_current_user)):
    """Retrieve profile context details for the logged-in farmer."""
    payload = UserResponse.model_validate(current_user).model_dump(by_alias=True)
    return json_response(
        success=True,
        message="Profile details fetched successfully",
        data=payload
    )

@router.put("")
async def update_profile(
    req: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Modify details for the current user's profile."""
    update_data = req.model_dump(exclude_unset=True)
    
    if "name" in update_data:
        current_user.full_name = update_data["name"]
        
    if "address" in update_data:
        current_user.address = update_data["address"]
        
    if "villageName" in update_data:
        current_user.village = update_data["villageName"]
        
    if "profile_image" in update_data and update_data["profile_image"]:
        # If photo data is base64, save to Cloudinary and store URL
        cdn_url = upload_image(update_data["profile_image"])
        current_user.profile_image = cdn_url
        
    if "language" in update_data:
        current_user.language = update_data["language"]
        
    await db.commit()
    await db.refresh(current_user)
    
    payload = UserResponse.model_validate(current_user).model_dump(by_alias=True)
    return json_response(
        success=True,
        message="Profile details updated successfully",
        data=payload
    )

class DeleteAccountRequest(BaseModel):
    password: str = Field(..., min_length=6)

@router.delete("/delete-account")
async def delete_account(
    req: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Permanently disables and anonymizes user profile (Play Store compliant deletion)."""
    # 1. Verify password
    if not verify_password(req.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password verification. Unable to delete account."
        )

    # 2. Delete all active cattle listings for this user
    await db.execute(delete(Cattle).where(Cattle.user_id == current_user.id))

    # 3. Soft-delete and anonymize user
    current_user.full_name = "Deleted User"
    current_user.phone_number = f"deleted_{current_user.id}_{datetime.now().timestamp()}"
    current_user.address = ""
    current_user.village = ""
    current_user.profile_image = ""
    current_user.account_status = "deleted"
    current_user.deleted_at = datetime.now(timezone.utc).replace(tzinfo=None)

    await db.commit()

    return json_response(
        success=True,
        message="Your account has been deleted successfully."
    )
