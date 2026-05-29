from datetime import datetime, timedelta, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

def get_expiry_time():
    """Default expiry duration is 24 hours in the future."""
    return datetime.now(timezone.utc) + timedelta(hours=24)

class Cattle(Base):
    __tablename__ = "cattle"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="cattle_listings")
