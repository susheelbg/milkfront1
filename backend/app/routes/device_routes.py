"""
device_routes.py — FastAPI endpoints for FCM device token management.

Endpoints:
    POST   /api/devices/register      Register/update a device token
    POST   /api/devices/deactivate    Deactivate a device token on logout
    POST   /api/devices/test-push     Admin-only: send a test push to the current user's active device(s)
    GET    /api/devices/fcm-status    Admin-only: check Firebase Admin SDK initialization status
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import Profile
from app.models.user_device import UserDevice
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


@router.get("/fcm-health")
async def get_fcm_health():
    """Public diagnostic check to verify if Firebase Admin SDK is initialized on backend server."""
    from app.services.push_notification_service import check_firebase_status
    status_info = check_firebase_status()
    return json_response(
        success=True,
        message="Firebase Admin SDK health check",
        data=status_info,
    )


@router.get("/fcm-status")
async def get_fcm_status(
    admin_user: Profile = Depends(get_current_admin),
):
    """
    Admin-only: check Firebase Admin SDK initialization status.
    Returns safe diagnostic info — never returns credentials or token values.
    """
    from app.services.push_notification_service import check_firebase_status
    status_info = check_firebase_status()
    return json_response(
        success=True,
        message="Firebase Admin SDK status",
        data=status_info,
    )


@router.post("/test-push")
async def send_test_push(
    admin_user: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin-only: send a test FCM push notification to the current admin user's
    active device(s).

    This is a safe diagnostic tool to verify the full push pipeline:
      Firebase Admin SDK → FCM API → Android device

    Response includes:
      - firebase_initialized: bool
      - active_token_count: number of active tokens for this admin user
      - send_attempted: bool
      - result: success/error summary

    Never returns the actual token value or Firebase credentials.
    """
    from app.services.push_notification_service import (
        check_firebase_status,
        send_push_notifications,
    )

    # 1. Check Firebase status
    fb = check_firebase_status()
    if not fb["firebase_initialized"]:
        return json_response(
            success=False,
            message="Firebase Admin SDK is NOT initialized — check FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_PROJECT_ID on Render.",
            data={
                "firebase_initialized": False,
                "firebase_configured": fb["firebase_configured"],
                "firebase_project_id": fb["firebase_project_id"],
                "active_token_count": 0,
                "send_attempted": False,
            },
        )

    # 2. Count active tokens for this admin (safe: count only, no token values returned)
    result = await db.execute(
        select(UserDevice).where(
            UserDevice.user_id == admin_user.id,
            UserDevice.is_active.is_(True),
        )
    )
    active_devices = result.scalars().all()
    token_count = len(active_devices)
    platforms = [d.platform for d in active_devices]

    if token_count == 0:
        return json_response(
            success=False,
            message="No active device token found for your account. Log in on the Android app first, then retry.",
            data={
                "firebase_initialized": True,
                "firebase_project_id": fb["firebase_project_id"],
                "active_token_count": 0,
                "send_attempted": False,
                "hint": "Install the Android APK, log in, and ensure notification permission is granted.",
            },
        )

    # 3. Send test push
    logger.info(
        "[TEST PUSH] Admin %s requesting test push to %d device(s): %s",
        admin_user.id, token_count, platforms,
    )
    try:
        await send_push_notifications(
            db=db,
            user_ids=[admin_user.id],
            title="🔔 MilkMaatu Test Push",
            message="Firebase Cloud Messaging is working correctly!",
            type_name="test",
            reference_id=None,
        )
        return json_response(
            success=True,
            message=f"Test push sent to {token_count} active device(s). Check your Android notification tray.",
            data={
                "firebase_initialized": True,
                "firebase_project_id": fb["firebase_project_id"],
                "active_token_count": token_count,
                "platforms": platforms,
                "send_attempted": True,
            },
        )
    except Exception as e:
        logger.exception("[TEST PUSH] Test push failed for admin %s", admin_user.id)
        return json_response(
            success=False,
            message=f"Test push attempted but failed: {type(e).__name__}",
            data={
                "firebase_initialized": True,
                "firebase_project_id": fb["firebase_project_id"],
                "active_token_count": token_count,
                "send_attempted": True,
                "error_type": type(e).__name__,
            },
        )
