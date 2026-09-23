import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=True)
    name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    role = Column(String, nullable=False, default="user") # user, admin, super_admin
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    orders = relationship("Order", back_populates="profile", foreign_keys="Order.user_id")
    cattle_listings = relationship("Cattle", back_populates="profile", foreign_keys="Cattle.user_id")

# Alias for backwards compatibility where User was imported
User = Profile
