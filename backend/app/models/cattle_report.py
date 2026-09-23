from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class CattleReport(Base):
    __tablename__ = "cattle_reports"

    id = Column(Integer, primary_key=True, index=True)
    cattle_id = Column(Integer, ForeignKey("cattle.id", ondelete="CASCADE"), nullable=False)
    legacy_reporter_id = Column(Integer, nullable=True)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    reason = Column(String, nullable=False) # e.g. spam, fake, offensive, fraud
    status = Column(String, default="pending") # pending, dismissed, actioned
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    # Relationships
    cattle = relationship("Cattle", backref="reports")
    reporter = relationship("Profile", foreign_keys=[reporter_id], backref="reported_items")
