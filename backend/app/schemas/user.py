from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class UserBase(BaseModel):
    full_name: str
    phone_number: str
    role: str = "user"
    address: Optional[str] = None
    village: Optional[str] = None
    profile_image: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    villageName: Optional[str] = None
    profile_image: Optional[str] = None

class UserResponse(BaseModel):
    phone: str = Field(..., serialization_alias="phone_number")
    name: str = Field(..., serialization_alias="full_name")
    role: str
    address: Optional[str] = ""
    villageName: Optional[str] = Field("", serialization_alias="village")
    profile_image: Optional[str] = ""
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
