from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True) # e.g. ORD-17800293021
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total_amount = Column(Float, nullable=False)
    order_status = Column(String, default="pending") # pending, confirmed, shipped, delivered, cancelled
    delivery_address = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    payment_status = Column(String, default="pending") # pending, paid, refunded
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    feed_id = Column(Integer, ForeignKey("feeds.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False) # Capture historical price at purchase time

    # Relationships
    order = relationship("Order", back_populates="items")
    feed = relationship("Feed")
