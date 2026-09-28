"""
device_service.py — Business logic for FCM device token registration.

Stage 1: Token registration only.  No push-message sending here.

Lifecycle:
  register_device()   → INSERT … ON CONFLICT (device_token) DO UPDATE
                        Sets is_active=True, updates last_seen_at/updated_at.
                        Row is NEVER deleted by this function.

  deactivate_device() → UPDATE SET is_active=False, updated_at=now
                        Row is NEVER deleted. Token is retained in the table
                        so that re-login can reactivate the same row cleanly.
"""
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models.user_device import UserDevice

logger = logging.getLogger(__name__)


async def register_device(
    db: AsyncSession,
    user_id: UUID,
    device_token: str,
    platform: str = "android",
) -> UserDevice:
    """
    Register (or reactivate) an FCM device token for the authenticated user.

    Uses PostgreSQL INSERT … ON CONFLICT (device_token) DO UPDATE so that:
    - First login with this token  → inserts a new row (is_active=True).
    - Re-login with same token     → updates is_active=True, last_seen_at, updated_at.
                                     The existing row is reused — no duplicate created.
    - New user, same device token  → reassigns user_id to the new user.

    The row is NEVER deleted by this function.
    """
    now = datetime.now(timezone.utc)

    stmt = (
        pg_insert(UserDevice)
        .values(
            user_id=user_id,
            device_token=device_token,
            platform=platform,
            created_at=now,
            updated_at=now,
            last_seen_at=now,
            is_active=True,
        )
        .on_conflict_do_update(
            index_elements=["device_token"],
            set_={
                "user_id": user_id,
                "platform": platform,
                "updated_at": now,
                "last_seen_at": now,
                "is_active": True,     # Re-activate if was previously deactivated
            },
        )
        .returning(UserDevice)
    )

    result = await db.execute(stmt)
    await db.commit()
    device = result.scalars().first()
    logger.info(
        "Device token registered/reactivated: user_id=%s platform=%s is_active=True",
        user_id,
        platform,
    )
    return device


async def deactivate_device(
    db: AsyncSession,
    user_id: UUID,
    device_token: str,
) -> bool:
    """
    Deactivate a device token on logout by setting is_active=False.

    IMPORTANT: This function UPDATES the row — it does NOT delete it.
    The row is kept in user_devices so that:
    - The login/logout history is preserved.
    - Re-login with the same token reactivates the SAME row (no duplicate).

    Only deactivates if the token currently belongs to the requesting user
    (prevents cross-user interference).

    Returns True if a row was found and updated, False if not found.
    """
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(UserDevice).where(
            UserDevice.device_token == device_token,
            UserDevice.user_id == user_id,
        )
    )
    device = result.scalars().first()

    if not device:
        logger.debug(
            "Deactivate: token not found for user_id=%s (already inactive or different owner)",
            user_id,
        )
        return False

    # UPDATE only — row is never deleted
    device.is_active = False
    device.updated_at = now
    # last_seen_at is intentionally NOT updated here —
    # it should only reflect the last successful active registration.
    await db.commit()
    logger.info(
        "Device token deactivated (is_active=False, row retained): user_id=%s",
        user_id,
    )
    return True

