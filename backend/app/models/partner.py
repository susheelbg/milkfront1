from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


# JSONB on PostgreSQL/Supabase, plain JSON elsewhere (SQLite tests)
JSONType = JSON().with_variant(JSONB(), "postgresql")


class Partner(Base):
    """A company whose product catalog is shown inside MilkMaatu (Cargill, ...)."""
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    tagline_en = Column(String, nullable=True)
    tagline_kn = Column(String, nullable=True)
    description_en = Column(Text, nullable=True)
    description_kn = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    products = relationship(
        "PartnerProduct", back_populates="partner",
        cascade="all, delete-orphan", order_by="PartnerProduct.display_order",
    )


class PartnerProduct(Base):
    __tablename__ = "partner_products"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    category = Column(String, nullable=True)
    animal_type = Column(String, nullable=True)              # cow | buffalo | cow_buffalo | free text
    milk_production_range = Column(String, nullable=True)    # e.g. "15–25 L/day"
    milk_production_range_kn = Column(String, nullable=True)

    description_en = Column(Text, nullable=True)
    description_kn = Column(Text, nullable=True)
    recommended_use_en = Column(Text, nullable=True)
    recommended_use_kn = Column(Text, nullable=True)
    feeding_instructions_en = Column(Text, nullable=True)
    feeding_instructions_kn = Column(Text, nullable=True)

    nutrition_data = Column(JSONType, nullable=True)

    image_url = Column(String, nullable=True)                # Supabase Storage URL only
    # approved | pending_approval (placeholder shown, needs manual image)
    image_status = Column(String, default="pending_approval", nullable=False)

    source_url = Column(String, nullable=True)
    source_checked_at = Column(DateTime, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    is_in_stock = Column(Boolean, default=True, nullable=False)
    show_in_buy_feeds = Column(Boolean, default=True, nullable=False)
    buy_feeds_price = Column(Float, default=0.0, nullable=True)

    display_order = Column(Integer, default=0, nullable=False)
    # Set by importer when a product changed/disappeared at source, or kn is missing
    needs_review = Column(Boolean, default=False, nullable=False)
    review_note = Column(String, nullable=True)

    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    partner = relationship("Partner", back_populates="products")
