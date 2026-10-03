import uuid
from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, Field, AliasChoices

class ProfileBase(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    preferred_language: Optional[str] = "kn"

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    preferred_language: Optional[str] = None

class ProfileSyncRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    preferred_language: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(user|admin|super_admin)$")

class ProfileResponse(BaseModel):
    id: str
    email: Optional[str] = ""
    name: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""
    preferred_language: str = "kn"
    role: str = "user"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Backwards compatibility alias
UserResponse = ProfileResponse
UserUpdate = ProfileUpdate
