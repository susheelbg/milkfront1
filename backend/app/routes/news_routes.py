from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.services.news.news_service import get_latest_news, get_all_news, refresh_news, cleanup_old_news
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/news", tags=["Dairy News"])


class NewsItemOut(BaseModel):
    """
    Metadata-only schema for farmer news articles.
    Provides backward-compatible field names for Kannada & English UI rendering.
    """
    id: int
    kannada_title: str
    original_title: str
    title: Optional[str] = None
    title_kn: Optional[str] = None
    title_en: Optional[str] = None
    summary_kn: Optional[str] = ""
    summary_en: Optional[str] = ""
    source_name: str
    source_url: str
    image_url: Optional[str] = None
    category: str
    category_kn: Optional[str] = "ರೈತ ಸುದ್ದಿ"
    is_alert: bool = False
    relevance_score: float = 1.0
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_article(cls, item):
        title_kn = item.kannada_title or item.original_title or ""
        title_en = item.original_title or item.kannada_title or ""
        return cls(
            id=item.id,
            kannada_title=title_kn,
            original_title=title_en,
            title=title_kn,
            title_kn=title_kn,
            title_en=title_en,
            summary_kn=item.kannada_summary or "",
            summary_en=item.original_summary or "",
            source_name=item.source_name,
            source_url=item.source_url,
            image_url=item.image_url,
            category=item.category or "general_dairy",
            category_kn=item.category_kn or "ರೈತ ಸುದ್ದಿ",
            is_alert=bool(item.is_alert),
            relevance_score=float(item.relevance_score or 1.0),
            published_at=item.published_at,
            created_at=item.created_at,
        )


class LatestNewsResponse(BaseModel):
    items: List[NewsItemOut]
    total: int


class AllNewsResponse(BaseModel):
    items: List[NewsItemOut]
    total: int
    page: int
    limit: int


@router.get("/latest", response_model=LatestNewsResponse)
async def latest_news(
    limit: int = Query(default=6, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """Latest farmer news for the Home page widget. Kannada articles given 1st priority."""
    items = await get_latest_news(db, limit=limit)
    payload = [NewsItemOut.from_orm_article(it) for it in items]
    return {"items": payload, "total": len(payload)}


@router.get("", response_model=AllNewsResponse)
async def all_news(
    category: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Paginated farmer news with Kannada prioritized first. Publicly accessible without authentication."""
    items, total = await get_all_news(db, category=category, page=page, limit=limit)
    payload = [NewsItemOut.from_orm_article(it) for it in items]
    return {"items": payload, "total": total, "page": page, "limit": limit}


@router.post("/refresh")
async def trigger_news_refresh(
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger news refresh and purge articles older than 7 days."""
    deleted = await cleanup_old_news(db)
    added = await refresh_news(db)
    return {
        "success": True,
        "message": f"News refreshed. Added {added} fresh articles. Purged {deleted} outdated articles older than 7 days.",
        "added": added,
        "deleted": deleted,
    }

