from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, Field, model_validator

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
    userId: Optional[Union[str, int]] = None
    animalName: str
    price: int
    age: int
    milkCapacity: str
    contactNumber: str
    villageName: str
    santeName: str
    description: str
    image: str
    postedDate: datetime
    expiresAt: datetime

    @model_validator(mode="before")
    @classmethod
    def map_db_fields(cls, values):
        if hasattr(values, "__dict__") or hasattr(values, "__table__"):
            d = {}
            d["id"] = values.id
            uid = getattr(values, "user_id", None)
            leg_uid = getattr(values, "legacy_user_id", None)
            d["userId"] = str(uid) if uid else (str(leg_uid) if leg_uid else None)
            d["animalName"] = values.animal_name
            d["price"] = values.price
            d["age"] = values.age
            d["milkCapacity"] = values.milk_capacity
            d["contactNumber"] = values.phone_number
            d["villageName"] = values.village
            d["santeName"] = values.sante_name
            d["description"] = values.description
            d["image"] = values.image_url or ""
            d["postedDate"] = values.created_at
            d["expiresAt"] = values.expires_at
            return d
        return values

    class Config:
        from_attributes = True
        populate_by_name = True
