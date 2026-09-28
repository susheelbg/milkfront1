import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from sqlalchemy import func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.user import Profile
from app.models.notification import Notification

logger = logging.getLogger(__name__)

async def create_notifications_for_all_users(
    db: AsyncSession,
    title: str,
    message: str,
    type_name: str,
    reference_id: Optional[str] = None,
    exclude_user_id: Optional[uuid.UUID] = None
) -> int:
    """
    Creates an in-app notification record for all registered users (excluding exclude_user_id if provided).
    Uses bulk insertion for efficiency and is safely wrapped so notification failures never crash business actions.
    """
    try:
        # Fetch all registered profile IDs
        query = select(Profile.id)
        if exclude_user_id:
            query = query.where(Profile.id != exclude_user_id)
        
        result = await db.execute(query)
        profile_ids = result.scalars().all()

        if not profile_ids:
            logger.info("[NOTIFICATION SERVICE] No registered users to notify.")
            return 0

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        notifications_to_create = [
            Notification(
                id=uuid.uuid4(),
                user_id=pid,
                type=type_name,
                title=title,
                message=message,
                reference_id=str(reference_id) if reference_id is not None else None,
                is_read=False,
                created_at=now,
                read_at=None
            )
            for pid in profile_ids
        ]

        db.add_all(notifications_to_create)
        await db.commit()
        logger.info(f"[NOTIFICATION SERVICE] Successfully created {len(notifications_to_create)} notifications of type '{type_name}'.")
        return len(notifications_to_create)
    except Exception as e:
        logger.error(f"[NOTIFICATION SERVICE ERROR] Failed to create notifications: {e}")
        await db.rollback()
        return 0

async def get_user_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 50
) -> List[Notification]:
    """Retrieve notifications for a specific user, ordered by creation date descending."""
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    return res.scalars().all()

async def get_unread_count(
    db: AsyncSession,
    user_id: uuid.UUID
) -> int:
    """Get the count of unread notifications for a specific user."""
    stmt = (
        select(func.count(Notification.id))
        .where(
            Notification.user_id == user_id,
            Notification.is_read == False
        )
    )
    res = await db.execute(stmt)
    return res.scalar_one() or 0

async def mark_notification_as_read(
    db: AsyncSession,
    user_id: uuid.UUID,
    notification_id: uuid.UUID
) -> Optional[Notification]:
    """Mark a single notification as read if it belongs to user_id."""
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == user_id
    )
    res = await db.execute(stmt)
    notif = res.scalars().first()

    if notif:
        notif.is_read = True
        notif.read_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()
        await db.refresh(notif)
    return notif

async def mark_all_notifications_as_read(
    db: AsyncSession,
    user_id: uuid.UUID
) -> int:
    """Mark all unread notifications for a user as read."""
    stmt = select(Notification).where(
        Notification.user_id == user_id,
        Notification.is_read == False
    )
    res = await db.execute(stmt)
    unread_list = res.scalars().all()

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for notif in unread_list:
        notif.is_read = True
        notif.read_at = now

    if unread_list:
        await db.commit()
    return len(unread_list)

async def cleanup_expired_notifications(db: AsyncSession) -> dict:
    """
    Cleanup daemon logic:
    1. Read notifications: Deleted 12 hours after read_at.
    2. Old unread notifications: Deleted 7 days after created_at.
    """
    try:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        twelve_hours_ago = now - timedelta(hours=12)
        seven_days_ago = now - timedelta(days=7)

        # 1. Delete read notifications older than 12h
        stmt_read = delete(Notification).where(
            Notification.is_read == True,
            Notification.read_at <= twelve_hours_ago
        )
        res_read = await db.execute(stmt_read)
        read_deleted = res_read.rowcount or 0

        # 2. Delete unread notifications older than 7 days
        stmt_unread = delete(Notification).where(
            Notification.is_read == False,
            Notification.created_at <= seven_days_ago
        )
        res_unread = await db.execute(stmt_unread)
        unread_deleted = res_unread.rowcount or 0

        await db.commit()
        return {"read_deleted": read_deleted, "unread_deleted": unread_deleted}
    except Exception as e:
        logger.error(f"[NOTIFICATION CLEANUP ERROR] {e}")
        await db.rollback()
        return {"read_deleted": 0, "unread_deleted": 0}
