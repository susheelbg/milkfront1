from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
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
