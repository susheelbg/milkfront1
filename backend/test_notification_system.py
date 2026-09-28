import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import Profile
from app.models.notification import Notification
from app.services import notification_service

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

async def run_tests():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        print("=== 1. Setting up Test Users ===")
        user_a_id = uuid.uuid4()
        user_b_id = uuid.uuid4()
        user_c_id = uuid.uuid4()

        user_a = Profile(id=user_a_id, email="farmer_a@milkmaatu.com", name="Farmer A", role="user")
        user_b = Profile(id=user_b_id, email="farmer_b@milkmaatu.com", name="Farmer B", role="user")
        user_c = Profile(id=user_c_id, email="admin@milkmaatu.com", name="Admin C", role="admin")

        db.add_all([user_a, user_b, user_c])
        await db.commit()

        print("=== 2. Testing Cattle Listing Notifications (Excluding Owner) ===")
        # User A posts cattle
        count = await notification_service.create_notifications_for_all_users(
            db=db,
            title="🐄 New cattle available",
            message="A new cattle listing has been posted on MilkMaatu.",
            type_name="new_cattle",
            reference_id="101",
            exclude_user_id=user_a_id
        )
        assert count == 2, f"Expected 2 notifications created, got {count}"

        # Verify User A has 0 notifications
        notifs_a = await notification_service.get_user_notifications(db, user_a_id)
        assert len(notifs_a) == 0, f"User A should have 0 notifications, got {len(notifs_a)}"

        # Verify User B has 1 notification
        notifs_b = await notification_service.get_user_notifications(db, user_b_id)
        assert len(notifs_b) == 1, f"User B should have 1 notification, got {len(notifs_b)}"
        assert notifs_b[0].title == "🐄 New cattle available"
        assert notifs_b[0].reference_id == "101"
        assert notifs_b[0].is_read == False

        unread_count_b = await notification_service.get_unread_count(db, user_b_id)
        assert unread_count_b == 1, f"User B unread count should be 1, got {unread_count_b}"

        print("=== 3. Testing Feed Product Notifications (All Users) ===")
        # Admin C creates feed
        count_feed = await notification_service.create_notifications_for_all_users(
            db=db,
            title="🌾 New feed available",
            message="A new cattle feed product has been added to MilkMaatu.",
            type_name="new_feed",
            reference_id="202"
        )
        assert count_feed == 3, f"Expected 3 feed notifications, got {count_feed}"

        unread_count_b = await notification_service.get_unread_count(db, user_b_id)
        assert unread_count_b == 2, f"User B unread count should be 2, got {unread_count_b}"

        print("=== 4. Testing Read Behavior & Single Mark As Read ===")
        notif_to_read = notifs_b[0]
        read_item = await notification_service.mark_notification_as_read(db, user_b_id, notif_to_read.id)
        assert read_item.is_read == True
        assert read_item.read_at is not None

        # Ensure User A cannot mark User B's notification as read
        unauth_read = await notification_service.mark_notification_as_read(db, user_a_id, notif_to_read.id)
        assert unauth_read is None, "User A must not be able to mark User B's notification as read"

        unread_count_b = await notification_service.get_unread_count(db, user_b_id)
        assert unread_count_b == 1, f"User B unread count should now be 1, got {unread_count_b}"

        print("=== 5. Testing Mark All As Read ===")
        marked_count = await notification_service.mark_all_notifications_as_read(db, user_b_id)
        assert marked_count == 1, f"Expected 1 remaining notification marked read, got {marked_count}"

        unread_count_b = await notification_service.get_unread_count(db, user_b_id)
        assert unread_count_b == 0, f"User B unread count should be 0, got {unread_count_b}"

        print("=== 6. Testing 12-Hour Post-Read Deletion & Cleanup Daemon ===")
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # 6a. Freshly read notification (read 1 hour ago) -> Should NOT be deleted
        fresh_read = Notification(
            id=uuid.uuid4(),
            user_id=user_a_id,
            type="new_cattle",
            title="Recent Read",
            message="Read 1h ago",
            is_read=True,
            created_at=now - timedelta(hours=2),
            read_at=now - timedelta(hours=1)
        )

        # 6b. Old read notification (read 13 hours ago) -> SHOULD be deleted (12h rule)
        old_read = Notification(
            id=uuid.uuid4(),
            user_id=user_a_id,
            type="new_cattle",
            title="Old Read",
            message="Read 13h ago",
            is_read=True,
            created_at=now - timedelta(hours=14),
            read_at=now - timedelta(hours=13)
        )

        # 6c. Stale unread notification (created 8 days ago) -> SHOULD be deleted (7d rule)
        stale_unread = Notification(
            id=uuid.uuid4(),
            user_id=user_a_id,
            type="new_feed",
            title="Stale Unread",
            message="Created 8d ago",
            is_read=False,
            created_at=now - timedelta(days=8)
        )

        db.add_all([fresh_read, old_read, stale_unread])
        await db.commit()

        # Execute cleanup
        result = await notification_service.cleanup_expired_notifications(db)
        print(f"Cleanup result: {result}")
        assert result["read_deleted"] >= 1, "Expected at least 1 read notification deleted after 12h"
        assert result["unread_deleted"] >= 1, "Expected at least 1 unread notification deleted after 7d"

        # Verify fresh_read still exists
        check_fresh = await db.get(Notification, fresh_read.id)
        assert check_fresh is not None, "Freshly read notification (<12h) must NOT be deleted"

        # Verify old_read was deleted
        check_old = await db.get(Notification, old_read.id)
        assert check_old is None, "Old read notification (>12h post read_at) MUST be deleted"

        # Verify stale_unread was deleted
        check_stale = await db.get(Notification, stale_unread.id)
        assert check_stale is None, "Stale unread notification (>7d post created_at) MUST be deleted"

    print("\n✅ ALL NOTIFICATION SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_tests())
