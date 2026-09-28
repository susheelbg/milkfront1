from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field

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
