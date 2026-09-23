from datetime import datetime, timedelta, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

def get_expiry_time():
    """Default expiry duration is 24 hours in the future."""
    return (datetime.now(timezone.utc) + timedelta(hours=24)).replace(tzinfo=None)

class Cattle(Base):
    __tablename__ = "cattle"

    id = Column(Integer, primary_key=True, index=True)
    legacy_user_id = Column(Integer, nullable=True) # Historical user ID preserved for legacy cattle listings
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    animal_name = Column(String, nullable=False)
    animal_type = Column(String, default="Cow") # Cow, Buffalo, Calf
    age = Column(Integer, nullable=False)
    milk_capacity = Column(String, nullable=False) # e.g. 20L/day
    price = Column(Integer, nullable=False)
    village = Column(String, nullable=False)
    description = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    sante_name = Column(String, nullable=False) # KRS Sante or Thendekere Sante
    expires_at = Column(DateTime, default=get_expiry_time, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    # Relationships
    profile = relationship("Profile", back_populates="cattle_listings", foreign_keys=[user_id])
    user = relationship("Profile", foreign_keys=[user_id], viewonly=True)
