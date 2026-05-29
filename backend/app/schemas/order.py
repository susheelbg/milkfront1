from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator

class OrderItemCreate(BaseModel):
    id: int = Field(..., description="Feed product ID")
    quantity: int = Field(..., gt=0)
    price: float = Field(..., description="Feed price per bag at purchase")

class OrderItemResponse(BaseModel):
    id: int = Field(..., description="OrderItem row ID")
    feed_id: Optional[int] = None
    name: Optional[str] = None   # Resolved from related Feed.title
    price: float
    quantity: int

    @model_validator(mode="before")
    @classmethod
    def resolve_feed_name(cls, values):
        # When loading from ORM, pull name from the related feed relationship
        if hasattr(values, "feed") and values.feed is not None:
            values.__dict__["name"] = values.feed.title
        return values

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customerName: str
    phoneNumber: str
    villageName: str
    address: str
    items: List[OrderItemCreate]
    totalPrice: float

class OrderUpdate(BaseModel):
    status: str = Field(..., description="New order status")

class OrderResponse(BaseModel):
    id: str
    customerName: Optional[str] = None
    phoneNumber: Optional[str] = None
    villageName: Optional[str] = None
    address: Optional[str] = None
    items: List[OrderItemResponse] = []
    totalPrice: float = 0.0
    status: str = "pending"
    createdAt: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def map_db_fields(cls, values):
        """Map SQLAlchemy ORM model fields to the camelCase response fields."""
        if hasattr(values, "__dict__") or hasattr(values, "__table__"):
            # It's an ORM object — map columns to camelCase
            d = {}
            d["id"] = values.id
            d["customerName"] = values.customer_name
            d["phoneNumber"] = values.phone_number
            d["villageName"] = values.village_name
            d["address"] = values.delivery_address
            d["totalPrice"] = values.total_amount
            d["status"] = values.order_status
            d["createdAt"] = values.created_at
            d["items"] = values.items if values.items else []
            return d
        return values

    class Config:
        from_attributes = True
        populate_by_name = True
