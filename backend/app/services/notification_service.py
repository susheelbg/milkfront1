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


NOTIFICATION_TRANSLATIONS = {
    "new_cattle": {
        "kn": {
            "title": "🐄 ಹೊಸ ರಾಸುಗಳು ಲಭ್ಯವಿದೆ",
            "message": "MilkMaatu ಸಂತೆಯಲ್ಲಿ ಹೊಸ ರಾಸುವಿನ ಮಾರಾಟದ ವಿವರಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಲಾಗಿದೆ."
        },
        "en": {
            "title": "🐄 New cattle available",
            "message": "A new cattle listing has been posted on MilkMaatu Sante."
        }
    },
    "new_feed": {
        "kn": {
            "title": "🌾 ಹೊಸ ಮೇವು ಲಭ್ಯವಿದೆ",
            "message": "MilkMaatu ದಲ್ಲಿ ಹೊಸ ದನದ ಮೇವಿನ ಉತ್ಪನ್ನವನ್ನು ಸೇರಿಸಲಾಗಿದೆ."
        },
        "en": {
            "title": "🌾 New feed available",
            "message": "A new cattle feed product has been added to MilkMaatu."
        }
    },
    "order_created": {
        "kn": {
            "title": "🛒 ಆದೇಶ ಸ್ವೀಕರಿಸಲಾಗಿದೆ",
            "message": "ನಿಮ್ಮ ಮೇವಿನ ಆದೇಶವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ."
        },
        "en": {
            "title": "🛒 Order Placed",
            "message": "Your feed order has been placed successfully."
        }
    },
    "order_dispatched": {
        "kn": {
            "title": "🚚 ಆದೇಶ ರವಾನಿಸಲಾಗಿದೆ",
            "message": "ನಿಮ್ಮ ಆದೇಶವನ್ನು ವಿತರಣೆಗೆ ರವಾನಿಸಲಾಗಿದೆ."
        },
        "en": {
            "title": "🚚 Order Dispatched",
            "message": "Your order has been dispatched for delivery."
        }
    },
    "order_delivered": {
        "kn": {
            "title": "✅ ಆದೇಶ ತಲುಪಿಸಲಾಗಿದೆ",
            "message": "ನಿಮ್ಮ ಆದೇಶವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ತಲುಪಿಸಲಾಗಿದೆ."
        },
        "en": {
            "title": "✅ Order Delivered",
            "message": "Your order has been successfully delivered."
        }
    }
}


def resolve_localized_content(
    type_name: str,
    lang: str,
    default_title: str,
    default_message: str,
    title_kn: Optional[str] = None,
    message_kn: Optional[str] = None,
    title_en: Optional[str] = None,
    message_en: Optional[str] = None
) -> tuple[str, str]:
    """Resolves localized (title, message) pair based on target user's preferred language (kn vs en)."""
    lang = (lang or "kn").lower()

    if lang == "kn":
        if title_kn and message_kn:
            return title_kn, message_kn
        if type_name in NOTIFICATION_TRANSLATIONS:
            return (
                NOTIFICATION_TRANSLATIONS[type_name]["kn"]["title"],
                NOTIFICATION_TRANSLATIONS[type_name]["kn"]["message"],
            )
        return default_title, default_message

    # English or fallback
    if title_en and message_en:
        return title_en, message_en
    if type_name in NOTIFICATION_TRANSLATIONS:
        return (
            NOTIFICATION_TRANSLATIONS[type_name]["en"]["title"],
            NOTIFICATION_TRANSLATIONS[type_name]["en"]["message"],
        )
    return default_title, default_message


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
                    role=u.get("app_metadata", {}).get("role") or "user",
                    preferred_language="kn"
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
    exclude_user_id: Optional[uuid.UUID] = None,
    title_kn: Optional[str] = None,
    message_kn: Optional[str] = None,
    title_en: Optional[str] = None,
    message_en: Optional[str] = None,
) -> int:
    """
    Creates an in-app notification record for all registered users, matching each user's preferred language (Kannada vs English).
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

        # Query each target user's preferred language
        lang_stmt = select(Profile.id, Profile.preferred_language).where(Profile.id.in_(target_user_ids))
        lang_res = await db.execute(lang_stmt)
        user_lang_map = {row[0]: (row[1] or "kn").lower() for row in lang_res.fetchall()}

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        notifications_to_create = []

        # Group target user IDs by language for push dispatches
        users_by_lang: dict[str, list[uuid.UUID]] = {"kn": [], "en": []}

        for pid in target_user_ids:
            user_lang = user_lang_map.get(pid, "kn")
            if user_lang not in users_by_lang:
                users_by_lang[user_lang] = []
            users_by_lang[user_lang].append(pid)

            t_title, t_message = resolve_localized_content(
                type_name=type_name,
                lang=user_lang,
                default_title=title,
                default_message=message,
                title_kn=title_kn,
                message_kn=message_kn,
                title_en=title_en,
                message_en=message_en,
            )

            notifications_to_create.append(
                Notification(
                    id=uuid.uuid4(),
                    user_id=pid,
                    type=type_name,
                    title=t_title,
                    message=t_message,
                    reference_id=str(reference_id) if reference_id is not None else None,
                    is_read=False,
                    created_at=now,
                    read_at=None
                )
            )

        db.add_all(notifications_to_create)
        await db.commit()
        logger.info(f"[NOTIFICATION SERVICE] Successfully created {len(notifications_to_create)} localized notifications of type '{type_name}'.")

        # Send FCM Push Notifications for each language group
        try:
            from app.services.push_notification_service import send_push_notifications

            for lang_code, uids in users_by_lang.items():
                if not uids:
                    continue
                p_title, p_message = resolve_localized_content(
                    type_name=type_name,
                    lang=lang_code,
                    default_title=title,
                    default_message=message,
                    title_kn=title_kn,
                    message_kn=message_kn,
                    title_en=title_en,
                    message_en=message_en,
                )
                await send_push_notifications(
                    db=db,
                    user_ids=uids,
                    title=p_title,
                    message=p_message,
                    type_name=type_name,
                    reference_id=str(reference_id) if reference_id is not None else None,
                )
        except Exception:
            logger.exception("Push delivery failed after in-app notifications were committed.")

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
    exclude_user_id: Optional[uuid.UUID] = None,
    title_kn: Optional[str] = None,
    message_kn: Optional[str] = None,
    title_en: Optional[str] = None,
    message_en: Optional[str] = None,
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
                exclude_user_id=exclude_user_id,
                title_kn=title_kn,
                message_kn=message_kn,
                title_en=title_en,
                message_en=message_en,
            )
        except Exception as e:
            logger.error(f"Error in background notification task: {e}")


async def ensure_user_recent_notifications(db: AsyncSession, user_id: uuid.UUID):
    """
    Auto-seeds notifications for active recent feeds (created in last 7 days)
    and active cattle listings if the user is missing a notification record for them,
    localized to the user's preferred language (Kannada vs English).
    """
    try:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        seven_days_ago = now - timedelta(days=7)

        # Fetch user profile language
        p_stmt = select(Profile.preferred_language).where(Profile.id == user_id)
        p_res = await db.execute(p_stmt)
        user_lang = (p_res.scalar() or "kn").lower()

        # Fetch existing reference IDs for this user
        ref_stmt = select(Notification.reference_id, Notification.type).where(Notification.user_id == user_id)
        ref_res = await db.execute(ref_stmt)
        existing_keys = {(str(row[0]), row[1]) for row in ref_res.fetchall() if row[0]}

        new_notifs = []

        # Check recent visible feed products
        feeds_stmt = select(Feed).where(Feed.is_hidden == False, Feed.created_at >= seven_days_ago)
        feeds_res = await db.execute(feeds_stmt)
        recent_feeds = feeds_res.scalars().all()

        feed_title, feed_msg = resolve_localized_content(
            "new_feed", user_lang, "🌾 New feed available", "A new cattle feed product has been added to MilkMaatu."
        )

        for feed in recent_feeds:
            key = (str(feed.id), "new_feed")
            if key not in existing_keys:
                new_notifs.append(
                    Notification(
                        id=uuid.uuid4(),
                        user_id=user_id,
                        type="new_feed",
                        title=feed_title,
                        message=feed_msg,
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

        cattle_title, cattle_msg = resolve_localized_content(
            "new_cattle", user_lang, "🐄 New cattle available", "A new cattle listing has been posted on MilkMaatu."
        )

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
                        title=cattle_title,
                        message=cattle_msg,
                        reference_id=str(c.id),
                        is_read=False,
                        created_at=c.created_at or now
                    )
                )

        if new_notifs:
            db.add_all(new_notifs)
            await db.commit()
            logger.info(f"[NOTIFICATION SERVICE] Auto-seeded {len(new_notifs)} missing localized recent notifications for user {user_id}")
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
