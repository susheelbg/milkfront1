"""
device_routes.py — FastAPI endpoints for FCM device token registration (Stage 1).

Endpoints:
    POST   /api/devices/register           Register/update a device token
    DELETE /api/devices/{device_token}     Deactivate a device token on logout
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import Profile
from app.schemas.device import DeviceRegisterRequest, DeviceDeactivateRequest, DeviceResponse
from app.services import device_service
from app.utils.response import json_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.post("/register")
async def register_device(
    req: DeviceRegisterRequest,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Register or update an FCM device token for the authenticated user.

    - Associates the token with the currently logged-in Supabase user.
    - user_id is determined from the verified JWT — never trusted from the request body.
    - Duplicate tokens are handled via upsert: same token, new user → token reassigned.
    - Updates last_seen_at on each call so stale tokens can be detected later.
    """
    device = await device_service.register_device(
        db=db,
        user_id=current_user.id,
        device_token=req.device_token,
        platform=req.platform,
    )

    if not device:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register device token.",
        )

    payload = DeviceResponse.model_validate(device).model_dump(by_alias=True)
    return json_response(
        success=True,
        message="Device token registered successfully",
        data=payload,
    )


@router.post("/deactivate")
async def deactivate_device(
    req: DeviceDeactivateRequest,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Deactivate a device token on user logout.

    - Accepts the token in the request body (avoids URL-encoding issues).
    - Only the token's current owner can deactivate it.
    - Returns 200 even if the token is not found (idempotent — safe for logout).
    - The app must call this BEFORE calling Supabase signOut.
    """
    deactivated = await device_service.deactivate_device(
        db=db,
        user_id=current_user.id,
        device_token=req.device_token,
    )

    if not deactivated:
        return json_response(
            success=True,
            message="Device token was not active (already removed or not owned by this user)",
        )

    return json_response(
        success=True,
        message="Device token deactivated successfully",
    )
