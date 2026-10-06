from datetime import datetime
from typing import Literal, Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator


class AdminPushNotificationRequest(BaseModel):
    title: str = Field(..., max_length=120)
    message: str = Field(..., max_length=2000)
    recipient_type: Literal["all", "user"] = "all"
    user_id: Optional[UUID] = None

    @field_validator("title", "message")
    @classmethod
    def trim_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

    @model_validator(mode="after")
    def validate_recipient_and_payload(self):
        if self.recipient_type == "user" and self.user_id is None:
            raise ValueError("user_id is required for a specific-user notification.")
        if self.recipient_type == "all" and self.user_id is not None:
            raise ValueError("user_id is only allowed for a specific-user notification.")
        if len((self.title + self.message).encode("utf-8")) > 3500:
            raise ValueError("The combined notification title and message are too long.")
        return self

class NotificationResponse(BaseModel):
    id: UUID
    userId: UUID = Field(..., alias="user_id")
    type: str
    title: str
    message: str
    referenceId: Optional[str] = Field(None, alias="reference_id")
    isRead: bool = Field(..., alias="is_read")
    createdAt: datetime = Field(..., alias="created_at")
    readAt: Optional[datetime] = Field(None, alias="read_at")

    class Config:
        from_attributes = True
        populate_by_name = True

class UnreadCountResponse(BaseModel):
    unreadCount: int = Field(..., alias="unread_count")

    class Config:
        populate_by_name = True
