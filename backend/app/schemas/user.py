from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, AliasChoices

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
    phone: str = Field(..., validation_alias=AliasChoices("phone", "phone_number"))
    name: str = Field(..., validation_alias=AliasChoices("name", "full_name"))
    role: str
    address: Optional[str] = ""
    villageName: Optional[str] = Field("", validation_alias=AliasChoices("villageName", "village"))
    profile_image: Optional[str] = ""
    is_verified: bool
    createdAt: datetime = Field(..., validation_alias=AliasChoices("createdAt", "created_at"))

    class Config:
        from_attributes = True
        populate_by_name = True

