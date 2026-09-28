"""
device_service.py — Business logic for FCM device token registration.

Stage 1: Token registration only.  No push-message sending here.
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
    Register (or update) an FCM device token for the authenticated user.

    Logic:
    - If this device_token already exists in the table → take ownership for the
      current user, set is_active=True and update timestamps.
    - This handles the case where a user logged out and another user logs in on
      the same device: the token is reassigned to the new user.
    - Avoids duplicate rows: device_token has a UNIQUE constraint.
    """
    now = datetime.now(timezone.utc)

    # Use PostgreSQL upsert (INSERT … ON CONFLICT DO UPDATE)
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
                "is_active": True,
            },
        )
        .returning(UserDevice)
    )

    result = await db.execute(stmt)
    await db.commit()
    device = result.scalars().first()
    logger.info(
        "Device token registered/updated: user_id=%s platform=%s",
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
    Deactivate a device token on logout.

    Only deactivates the token if it currently belongs to the requesting user
    (prevents a user from deactivating another user's token).

    Returns True if a row was found and deactivated, False otherwise.
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
            "Deactivate: token not found for user_id=%s — already gone or different owner",
            user_id,
        )
        return False

    device.is_active = False
    device.updated_at = now
    await db.commit()
    logger.info("Device token deactivated: user_id=%s", user_id)
    return True
