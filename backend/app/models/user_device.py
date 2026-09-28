import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserDevice(Base):
    """
    Stores FCM device tokens associated with authenticated Supabase users.
    Supports one user → many devices and handles token refresh/logout cleanly.
    """
    __tablename__ = "user_devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    device_token = Column(String, nullable=False, unique=True)
    platform = Column(String, nullable=False, default="android")  # android | ios | web
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_seen_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_active = Column(Boolean, nullable=False, default=True)

    profile = relationship("Profile", foreign_keys=[user_id])

    __table_args__ = (
        # Index for fast lookup of active devices for a user (used when sending notifications)
        Index("ix_user_devices_user_active", "user_id", "is_active"),
    )
