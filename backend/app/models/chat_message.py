import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    message_type = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    voice_path = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    profile = relationship("Profile", foreign_keys=[user_id])
    reports = relationship("ChatMessageReport", back_populates="message", cascade="all, delete-orphan")


class ChatMessageReport(Base):
    __tablename__ = "chat_message_reports"
    __table_args__ = (
        UniqueConstraint("message_id", "reporter_id", name="uq_chat_message_reporter"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(String(500), nullable=False)
    status = Column(String(16), nullable=False, default="open")
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    message = relationship("ChatMessage", back_populates="reports")
    reporter = relationship("Profile", foreign_keys=[reporter_id])