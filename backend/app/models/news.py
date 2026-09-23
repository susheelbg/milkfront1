from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float
from app.core.database import Base


class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)

    # Original (English) content from the RSS source
    original_title = Column(String(500), nullable=False)
    original_summary = Column(Text, nullable=True)

    # Kannada translated content (produced by Gemini)
    kannada_title = Column(String(600), nullable=False)
    kannada_summary = Column(Text, nullable=False)

    # Source metadata
    source_name = Column(String(150), nullable=False)
    source_url = Column(String(2000), nullable=False, unique=True, index=True)
    image_url = Column(String(2000), nullable=True)

    # Category (English key and Kannada label)
    category = Column(String(80), nullable=False, default="general_dairy")
    category_kn = Column(String(150), nullable=False, default="ಸಾಮಾನ್ಯ ಡೈರಿ")

    # Flags
    is_alert = Column(Boolean, default=False, nullable=False)
    relevance_score = Column(Float, default=0.5, nullable=False)

    # Timestamps
    published_at = Column(DateTime, nullable=True)
    fetched_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
    )
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
        index=True,
    )
