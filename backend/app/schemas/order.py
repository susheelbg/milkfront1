from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class OrderItemCreate(BaseModel):
    id: int = Field(..., description="Feed product ID")
    quantity: int = Field(..., gt=0)
    price: float = Field(..., description="Feed price per bag at purchase")

class OrderItemResponse(BaseModel):
    id: int = Field(..., description="Feed product ID")
    name: str = Field(..., description="Feed name")
    price: float
    quantity: int

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customerName: str = Field(..., validation_alias="customerName")
    phoneNumber: str = Field(..., validation_alias="phoneNumber")
    villageName: str = Field(..., validation_alias="villageName")
    address: str
    items: List[OrderItemCreate]
    totalPrice: float = Field(..., validation_alias="totalPrice")

class OrderUpdate(BaseModel):
    status: str = Field(..., description="New order status")

class OrderResponse(BaseModel):
    id: str
    customerName: str = Field(..., serialization_alias="customerName")
    phoneNumber: str = Field(..., serialization_alias="phoneNumber")
    villageName: str = Field(..., serialization_alias="villageName")
    address: str
    items: List[OrderItemResponse]
    totalPrice: float = Field(..., serialization_alias="totalPrice")
    status: str = Field(..., serialization_alias="order_status")
    createdAt: datetime = Field(..., serialization_alias="created_at")

    class Config:
        from_attributes = True
        populate_by_name = True
