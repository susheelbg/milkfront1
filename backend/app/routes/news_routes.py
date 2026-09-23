from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.news.news_service import get_latest_news, get_all_news
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/news", tags=["Dairy News"])


class NewsItemOut(BaseModel):
    """
    Only metadata is returned — no article content.
    The farmer is directed to source_url (original publisher) to read the full article.
    """
    id: int
    kannada_title: str           # Original Kannada headline from the publisher
    source_name: str             # Publisher name
    source_url: str              # Direct link to original article
    category: str                # English key for filtering
    category_kn: str             # Kannada category label shown in UI
    is_alert: bool
    published_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class LatestNewsResponse(BaseModel):
    items: list[NewsItemOut]
    total: int


class AllNewsResponse(BaseModel):
    items: list[NewsItemOut]
    total: int
    page: int
    limit: int


@router.get("/latest", response_model=LatestNewsResponse)
async def latest_news(
    limit: int = Query(default=6, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Latest dairy news for the Home page widget. Default 6 items."""
    items = await get_latest_news(db, limit=limit)
    return {"items": items, "total": len(items)}


@router.get("", response_model=AllNewsResponse)
async def all_news(
    category: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Paginated dairy news, optionally filtered by category key."""
    items, total = await get_all_news(db, category=category, page=page, limit=limit)
    return {"items": items, "total": total, "page": page, "limit": limit}
