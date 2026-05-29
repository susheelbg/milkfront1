from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class FeedBase(BaseModel):
    name: str = Field(..., validation_alias="title", serialization_alias="name")
    price: float
    description: Optional[str] = None
    category: str = "Dairy"
    image: Optional[str] = Field(None, validation_alias="image_url", serialization_alias="image")
    brand: Optional[str] = None
    stock_quantity: int = 100

class FeedCreate(FeedBase):
    pass

class FeedUpdate(BaseModel):
    name: Optional[str] = Field(None, validation_alias="title")
    price: Optional[float] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = Field(None, validation_alias="image_url")
    brand: Optional[str] = None
    stock_quantity: Optional[int] = None

class FeedResponse(FeedBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
