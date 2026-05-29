from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CattleCreate(BaseModel):
    animalName: str = Field(..., validation_alias="animalName")
    price: int
    age: int
    milkCapacity: str = Field(..., validation_alias="milkCapacity")
    contactNumber: str = Field(..., validation_alias="contactNumber")
    villageName: str = Field(..., validation_alias="villageName")
    santeName: str = Field(..., validation_alias="santeName")
    description: str
    image: Optional[str] = Field(None, description="Base64 or Cloudinary URL")

class CattleResponse(BaseModel):
    id: int
    animalName: str = Field(..., validation_alias="animal_name", serialization_alias="animalName")
    price: int
    age: int
    milkCapacity: str = Field(..., validation_alias="milk_capacity", serialization_alias="milkCapacity")
    contactNumber: str = Field(..., validation_alias="phone_number", serialization_alias="contactNumber")
    villageName: str = Field(..., validation_alias="village", serialization_alias="villageName")
    santeName: str = Field(..., validation_alias="sante_name", serialization_alias="santeName")
    description: str
    image: str = Field(..., validation_alias="image_url", serialization_alias="image")
    postedDate: datetime = Field(..., validation_alias="created_at", serialization_alias="postedDate")
    expiresAt: datetime = Field(..., validation_alias="expires_at", serialization_alias="expiresAt")

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
DefinitionName = "CattleResponse"
