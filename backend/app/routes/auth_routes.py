import logging
import base64
import binascii
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import Profile
from app.schemas.user import ProfileUpdate, ProfileSyncRequest, ProfileResponse, ProfileAvatarUpload
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
        "avatar_url": current_user.avatar_url,
        "preferred_language": getattr(current_user, "preferred_language", "kn") or "kn",
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
    Allows the authenticated user to update their name, phone, address, and preferred_language.
    Strictly prevents changing the user role.
    """
    if req.name is not None:
        current_user.name = req.name.strip()
    if req.phone is not None:
        current_user.phone = req.phone.strip()
    if req.address is not None:
        current_user.address = req.address.strip()
    if req.preferred_language is not None and req.preferred_language in ("kn", "en"):
        current_user.preferred_language = req.preferred_language

    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)

    user_payload = {
        "id": str(current_user.id),
        "email": current_user.email or "",
        "name": current_user.name or "",
        "phone": current_user.phone or "",
        "address": current_user.address or "",
        "avatar_url": current_user.avatar_url,
        "preferred_language": getattr(current_user, "preferred_language", "kn") or "kn",
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else "",
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else "",
    }
    return json_response(
        success=True,
        message="Profile updated successfully",
        data=user_payload
    )

@router.post("/profile/avatar")
async def upload_profile_avatar(
    req: ProfileAvatarUpload,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a validated profile image to the existing user-scoped Storage path."""
    if "," not in req.image_data:
        raise HTTPException(status_code=400, detail="Upload a JPEG, PNG, or WebP image.")
    data_header, encoded_image = req.image_data.split(",", 1)
    allowed_types = {
        "data:image/jpeg;base64": "jpeg",
        "data:image/jpg;base64": "jpeg",
        "data:image/png;base64": "png",
        "data:image/webp;base64": "webp",
    }
    image_format = allowed_types.get(data_header.lower())
    if image_format is None:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, and WebP images are allowed.")
    try:
        image_bytes = base64.b64decode(encoded_image, validate=True)
    except (binascii.Error, ValueError) as error:
        raise HTTPException(status_code=400, detail="Invalid image data.") from error
    if not image_bytes or len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Profile images must be smaller than 5 MB.")

    valid_signature = (
        (image_format == "jpeg" and image_bytes.startswith(b"\xff\xd8\xff"))
        or (image_format == "png" and image_bytes.startswith(b"\x89PNG\r\n\x1a\n"))
        or (image_format == "webp" and image_bytes.startswith(b"RIFF") and image_bytes[8:12] == b"WEBP")
    )
    if not valid_signature:
        raise HTTPException(status_code=415, detail="The image contents do not match the declared format.")

    from app.core.config import settings
    from app.services.storage_service import DEFAULT_CATTLE_IMAGE, delete_image, upload_image_async

    old_avatar_url = current_user.avatar_url
    avatar_url = await upload_image_async(
        req.image_data,
        folder="profiles",
        user_id=str(current_user.id),
    )
    expected_prefix = (
        f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/"
        f"milkmaatu-image/profiles/{current_user.id}/"
    )
    if avatar_url == DEFAULT_CATTLE_IMAGE or not avatar_url.startswith(expected_prefix):
        raise HTTPException(status_code=502, detail="Profile photo upload failed. Please try again.")

    current_user.avatar_url = avatar_url
    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)
    owner_prefix = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/milkmaatu-image/profiles/{current_user.id}/"
    if old_avatar_url and old_avatar_url.startswith(owner_prefix) and old_avatar_url != avatar_url:
        await asyncio.to_thread(delete_image, old_avatar_url)
    return json_response(
        success=True,
        message="Profile photo updated successfully.",
        data={"avatar_url": current_user.avatar_url},
    )


@router.delete("/profile/avatar")
async def remove_profile_avatar(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.storage_service import delete_image

    old_avatar_url = current_user.avatar_url
    current_user.avatar_url = None
    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    from app.core.config import settings
    owner_prefix = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/milkmaatu-image/profiles/{current_user.id}/"
    if old_avatar_url and old_avatar_url.startswith(owner_prefix):
        await asyncio.to_thread(delete_image, old_avatar_url)
    return json_response(
        success=True,
        message="Profile photo removed.",
        data={"avatar_url": None},
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
    if req.preferred_language and req.preferred_language in ("kn", "en"):
        current_user.preferred_language = req.preferred_language

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
            "avatar_url": current_user.avatar_url,
            "preferred_language": getattr(current_user, "preferred_language", "kn") or "kn",
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
