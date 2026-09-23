from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.services.news.news_service import get_latest_news, get_all_news
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/news", tags=["Dairy News"])


class NewsItemOut(BaseModel):
    """
    Only metadata is returned — no article content.
    The farmer is directed to source_url (original publisher) to read the full article.
    """
    id: int
    title_kn: str
    title_en: str
    summary_kn: str
    summary_en: str
    source_name: str
    source_url: str
    image_url: Optional[str] = None
    category: str
    published_at: Optional[datetime] = None

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
):
    """Latest dairy news for the Home page widget. Publicly accessible without authentication."""
    items = await get_latest_news(db, limit=limit)
    return {"items": items, "total": len(items)}


@router.get("", response_model=AllNewsResponse)
async def all_news(
    category: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Paginated dairy news. Publicly accessible without authentication."""
    items, total = await get_all_news(db, category=category, page=page, limit=limit)
    return {"items": items, "total": total, "page": page, "limit": limit}
