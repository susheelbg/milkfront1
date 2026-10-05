import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from unittest.mock import patch

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import Profile
from app.models.notification import Notification
from app.models.user_device import UserDevice
from app.services import notification_service
from app.services import push_notification_service

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

def verify_android_push_payload():
    with patch.object(push_notification_service, "_get_firebase_app", return_value=object()):
        with patch("firebase_admin.messaging.send_each") as send_each:
            send_each.return_value = SimpleNamespace(
                success_count=1,
                failure_count=0,
                responses=[SimpleNamespace(exception=None)],
            )
            push_notification_service._send_batch(
                tokens=["test-token"],
                title="New cattle available",
                message="A new cattle listing was posted.",
                type_name="new_cattle",
                reference_id="101",
            )

    message = send_each.call_args.args[0][0]
    android_notification = message.android.notification
    assert message.notification.title == "New cattle available"
    assert message.notification.body == "A new cattle listing was posted."
    assert message.data == {"type": "new_cattle", "reference_id": "101"}
    assert message.android.priority == "high"
    assert android_notification.title == message.notification.title
    assert android_notification.body == message.notification.body
    assert android_notification.channel_id == "milkmaatu_high_importance"
    assert android_notification.icon == "ic_stat_ic_notification"
    assert android_notification.color == "#D97706"
    assert android_notification.default_sound is True
    assert android_notification.default_vibrate_timings is True
    assert android_notification.visibility == "public"


async def run_tests():
    verify_android_push_payload()
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        print("=== 1. Setting up Test Users ===")
        user_a_id = uuid.uuid4()
        user_b_id = uuid.uuid4()
        user_c_id = uuid.uuid4()

        user_a = Profile(id=user_a_id, email="farmer_a@milkmaatu.com", name="Farmer A", role="user", preferred_language="kn")
        user_b = Profile(id=user_b_id, email="farmer_b@milkmaatu.com", name="Farmer B", role="user", preferred_language="en")
        user_c = Profile(id=user_c_id, email="admin@milkmaatu.com", name="Admin C", role="admin", preferred_language="kn")

        db.add_all([user_a, user_b, user_c])
        await db.commit()

        print("=== 2. Testing Cattle Listing Notifications (Excluding Owner & Localized) ===")
        # User A posts cattle
        count = await notification_service.create_notifications_for_all_users(
            db=db,
            title="🐄 New cattle available",
            message="A new cattle listing has been posted on MilkMaatu.",
            type_name="new_cattle",
            reference_id="101",
            exclude_user_id=user_a_id
        )
        assert count >= 2, f"Expected at least 2 notifications created, got {count}"

        # Verify User A has 0 notifications
        notifs_a = await notification_service.get_user_notifications(db, user_a_id)
        assert len(notifs_a) == 0, f"User A should have 0 notifications, got {len(notifs_a)}"

        # Verify User B (English preference) has English notification
        notifs_b = await notification_service.get_user_notifications(db, user_b_id)
        assert len(notifs_b) == 1, f"User B should have 1 notification, got {len(notifs_b)}"
        assert notifs_b[0].title == "🐄 New cattle available"
        assert notifs_b[0].reference_id == "101"
        assert notifs_b[0].is_read == False

        # Verify User C (Kannada preference) has Kannada notification
        notifs_c = await notification_service.get_user_notifications(db, user_c_id)
        assert len(notifs_c) == 1, f"User C should have 1 notification, got {len(notifs_c)}"
        assert notifs_c[0].title == "🐄 ಹೊಸ ರಾಸುಗಳು ಲಭ್ಯವಿದೆ"

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
        assert count_feed >= 3, f"Expected at least 3 feed notifications, got {count_feed}"

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

        print("=== 6. Testing Push Failure Isolation and Invalid Token Deactivation ===")
        invalid_token = "invalid-fcm-token"
        db.add(UserDevice(user_id=user_b_id, device_token=invalid_token, platform="android"))
        await db.commit()

        with patch(
            "app.services.push_notification_service._send_batch",
            return_value=[(invalid_token, SimpleNamespace(code="UNREGISTERED"))],
        ):
            count_push = await notification_service.create_notifications_for_all_users(
                db=db,
                title="Push test",
                message="The in-app record must survive push failure.",
                type_name="new_feed",
                reference_id="203",
            )

        assert count_push >= 3, "In-app notifications must be created despite an invalid FCM token"
        device_id = (await db.execute(
            select(UserDevice.id).where(UserDevice.device_token == invalid_token)
        )).scalar_one()
        device = await db.get(UserDevice, device_id)
        assert device is not None and device.is_active is False, "Unregistered FCM tokens must be deactivated"

        db.add(UserDevice(user_id=user_b_id, device_token="outage-fcm-token", platform="android"))
        await db.commit()
        with patch(
            "app.services.push_notification_service._send_batch",
            side_effect=RuntimeError("simulated Firebase outage"),
        ):
            count_outage = await notification_service.create_notifications_for_all_users(
                db=db,
                title="Push outage test",
                message="The business event must still complete.",
                type_name="new_cattle",
                reference_id="102",
            )
        assert count_outage >= 2, "Push outages must not prevent in-app notification creation"

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
