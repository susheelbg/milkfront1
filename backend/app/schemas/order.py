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
        elif hasattr(values, "name") and values.name:
            pass
        elif hasattr(values, "feed_id") and values.feed_id:
            values.__dict__["name"] = f"Feed Item #{values.feed_id}"
        elif isinstance(values, dict) and not values.get("name"):
            feed_id = values.get("feed_id")
            values["name"] = f"Feed Item #{feed_id}" if feed_id else "Cattle Feed"
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
    customerEmail: Optional[str] = None
    email: Optional[str] = None
    phoneNumber: Optional[str] = None
    villageName: Optional[str] = None
    address: Optional[str] = None
    items: List[OrderItemResponse] = []
    totalPrice: float = 0.0
    status: str = "pending"
    paymentStatus: str = "pending"
    createdAt: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def map_db_fields(cls, values):
        """Map SQLAlchemy ORM model fields to the camelCase response fields."""
        if hasattr(values, "__dict__") or hasattr(values, "__table__"):
            # It's an ORM object — map columns to camelCase
            d = {}
            d["id"] = values.id
            
            profile = getattr(values, "profile", None)
            
            cust_name = getattr(values, "customer_name", None)
            if not cust_name and profile and profile.name:
                cust_name = profile.name
            d["customerName"] = cust_name or "Farmer"

            cust_email = getattr(profile, "email", None) if profile else None
            d["customerEmail"] = cust_email or ""
            d["email"] = cust_email or ""

            phone = getattr(values, "phone_number", None)
            if not phone and profile and profile.phone:
                phone = profile.phone
            d["phoneNumber"] = phone or "-"

            d["villageName"] = getattr(values, "village_name", None) or ""
            
            addr = getattr(values, "delivery_address", None)
            if not addr and profile and profile.address:
                addr = profile.address
            d["address"] = addr or ""

            d["totalPrice"] = values.total_amount if values.total_amount is not None else 0.0
            d["status"] = values.order_status or "pending"
            d["paymentStatus"] = getattr(values, "payment_status", "pending") or "pending"
            d["createdAt"] = values.created_at
            d["items"] = values.items if values.items else []
            return d
        return values

    class Config:
        from_attributes = True
        populate_by_name = True

