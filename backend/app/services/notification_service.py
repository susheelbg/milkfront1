import logging
import uuid
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from sqlalchemy import func, delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import Profile
from app.models.notification import Notification
from app.models.feed import Feed
from app.models.cattle import Cattle
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


def fetch_all_supabase_users() -> List[dict]:
    """
    Fetches all registered users from Supabase Auth Admin API using SUPABASE_SERVICE_ROLE_KEY.
    """
    supabase_url = settings.SUPABASE_URL.rstrip("/")
    endpoint = f"{supabase_url}/auth/v1/admin/users"
    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
    }
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(endpoint, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("users", [])
            else:
                logger.warning(f"Supabase Admin API returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.warning(f"Could not fetch Supabase Auth users via Admin API: {e}")
    return []


async def sync_profiles_from_supabase_auth(db: AsyncSession) -> set:
    """
    Ensure all registered Supabase Auth users exist in public.profiles.
    Returns the set of all verified profile user UUIDs.
    """
    res = await db.execute(select(Profile.id))
    existing_ids = set(res.scalars().all())

    auth_users = fetch_all_supabase_users()
    for u in auth_users:
        raw_id = u.get("id")
        if not raw_id:
            continue
        try:
            u_id = uuid.UUID(raw_id)
        except ValueError:
            continue

        if u_id not in existing_ids:
            try:
                new_prof = Profile(
                    id=u_id,
                    email=u.get("email"),
                    name=u.get("user_metadata", {}).get("name"),
                    phone=u.get("user_metadata", {}).get("phone"),
                    role=u.get("app_metadata", {}).get("role") or "user"
                )
                db.add(new_prof)
                await db.commit()
                existing_ids.add(u_id)
            except Exception as e:
                logger.warning(f"Could not auto-insert profile for auth user {u_id}: {e}")
                try:
                    await db.rollback()
                except Exception:
                    pass

    return existing_ids


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
    Syncs with Supabase Auth so no registered farmer is missed.
    """
    try:
        # Sync profiles with Supabase Auth to guarantee all users are present
        target_user_ids = await sync_profiles_from_supabase_auth(db)

        # Exclude listing owner/creator if requested
        if exclude_user_id:
            target_user_ids.discard(exclude_user_id)

        if not target_user_ids:
            logger.info("[NOTIFICATION SERVICE] No target registered users to notify.")
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
            for pid in target_user_ids
        ]

        db.add_all(notifications_to_create)
        await db.commit()
        logger.info(f"[NOTIFICATION SERVICE] Successfully created {len(notifications_to_create)} notifications of type '{type_name}'.")
        return len(notifications_to_create)
    except Exception as e:
        logger.error(f"[NOTIFICATION SERVICE ERROR] Failed to create notifications: {e}")
        try:
            await db.rollback()
        except Exception:
            pass
        return 0

async def dispatch_notifications_background(
    title: str,
    message: str,
    type_name: str,
    reference_id: Optional[str] = None,
    exclude_user_id: Optional[uuid.UUID] = None
):
    """Background task wrapper that creates its own DB session for notifications."""
    async with SessionLocal() as db:
        try:
            await create_notifications_for_all_users(
                db=db,
                title=title,
                message=message,
                type_name=type_name,
                reference_id=reference_id,
                exclude_user_id=exclude_user_id
            )
        except Exception as e:
            logger.error(f"Error in background notification task: {e}")


async def ensure_user_recent_notifications(db: AsyncSession, user_id: uuid.UUID):
    """
    Auto-seeds notifications for active recent feeds (created in last 7 days)
    and active cattle listings if the user is missing a notification record for them.
    """
    try:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        seven_days_ago = now - timedelta(days=7)

        # Fetch existing reference IDs for this user
        ref_stmt = select(Notification.reference_id, Notification.type).where(Notification.user_id == user_id)
        ref_res = await db.execute(ref_stmt)
        existing_keys = {(str(row[0]), row[1]) for row in ref_res.fetchall() if row[0]}

        new_notifs = []

        # Check recent visible feed products
        feeds_stmt = select(Feed).where(Feed.is_hidden == False, Feed.created_at >= seven_days_ago)
        feeds_res = await db.execute(feeds_stmt)
        recent_feeds = feeds_res.scalars().all()

        for feed in recent_feeds:
            key = (str(feed.id), "new_feed")
            if key not in existing_keys:
                new_notifs.append(
                    Notification(
                        id=uuid.uuid4(),
                        user_id=user_id,
                        type="new_feed",
                        title="🌾 New feed available",
                        message="A new cattle feed product has been added to MilkMaatu.",
                        reference_id=str(feed.id),
                        is_read=False,
                        created_at=feed.created_at or now
                    )
                )

        # Check recent active cattle listings (excluding posts owned by user_id)
        cattle_stmt = select(Cattle).where(
            Cattle.expires_at > now,
            Cattle.created_at >= seven_days_ago
        )
        cattle_res = await db.execute(cattle_stmt)
        recent_cattle = cattle_res.scalars().all()

        for c in recent_cattle:
            if c.user_id and c.user_id == user_id:
                continue
            key = (str(c.id), "new_cattle")
            if key not in existing_keys:
                new_notifs.append(
                    Notification(
                        id=uuid.uuid4(),
                        user_id=user_id,
                        type="new_cattle",
                        title="🐄 New cattle available",
                        message="A new cattle listing has been posted on MilkMaatu.",
                        reference_id=str(c.id),
                        is_read=False,
                        created_at=c.created_at or now
                    )
                )

        if new_notifs:
            db.add_all(new_notifs)
            await db.commit()
            logger.info(f"[NOTIFICATION SERVICE] Auto-seeded {len(new_notifs)} missing recent notifications for user {user_id}")
    except Exception as e:
        logger.debug(f"[NOTIFICATION SERVICE] Auto-seed check fallback: {e}")
        try:
            await db.rollback()
        except Exception:
            pass


async def get_user_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 50
) -> List[Notification]:
    """Retrieve notifications for a specific user, ensuring active recent listings are populated."""
    await ensure_user_recent_notifications(db, user_id)

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
    await ensure_user_recent_notifications(db, user_id)

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
        try:
            await db.rollback()
        except Exception:
            pass
        return {"read_deleted": 0, "unread_deleted": 0}
