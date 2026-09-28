from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class DeviceRegisterRequest(BaseModel):
    """Request body for POST /devices/register."""
    device_token: str = Field(..., min_length=1, description="FCM device registration token")
    platform: str = Field(default="android", description="Device platform: android | ios | web")


class DeviceResponse(BaseModel):
    """Response body for device registration/deactivation."""
    id: UUID
    userId: UUID = Field(..., alias="user_id")
    deviceToken: str = Field(..., alias="device_token")
    platform: str
    isActive: bool = Field(..., alias="is_active")
    createdAt: datetime = Field(..., alias="created_at")
    updatedAt: datetime = Field(..., alias="updated_at")
    lastSeenAt: datetime = Field(..., alias="last_seen_at")

    class Config:
        from_attributes = True
        populate_by_name = True
