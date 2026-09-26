"""
News service — keyword-based RSS filtering, metadata-only storage.
No AI. No article content. Direct links to original publishers.

Runs every 3 hours. Auto-deletes articles older than NEWS_RETENTION_DAYS.
"""

import logging
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from typing import Optional

import anyio
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.news import NewsArticle
from app.services.news.news_sources import (
    CATEGORY_RULES,
    DAIRY_KEYWORDS_EN,
    DAIRY_KEYWORDS_KN,
    DEFAULT_CATEGORY,
    EXCLUDE_PATTERNS,
    NEWS_RETENTION_DAYS,
    NEWS_SOURCES,
)

logger = logging.getLogger(__name__)


# ─── Local helpers ────────────────────────────────────────────────────────────

def _is_kannada(text: str) -> bool:
    return sum(1 for c in text if "\u0C80" <= c <= "\u0CFF") >= 3


def _is_excluded(title: str) -> bool:
    return any(pat in title for pat in EXCLUDE_PATTERNS)


def _is_relevant(title: str, description: str, keywords: list[str]) -> bool:
    haystack = (title + " " + description).lower()
    return any(kw.lower() in haystack for kw in keywords)


def _detect_category(title: str, description: str = "") -> tuple[str, str]:
    haystack = (title + " " + description).lower()
    for kws, cat_key, cat_kn in CATEGORY_RULES:
        if any(kw.lower() in haystack for kw in kws):
            return cat_key, cat_kn
    return DEFAULT_CATEGORY


def _clean_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


# ─── RSS fetch (sync — runs in thread pool) ───────────────────────────────────

def _parse_rss(url: str, source_name: str) -> list[dict]:
    articles = []
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "MilkMaatu-NewsBot/1.0 (+https://milkmaatu.com)",
                "Accept-Language": "kn,en;q=0.5",
            },
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read()

        root = ET.fromstring(raw)
        ns = ""
        if root.tag.startswith("{"):
            ns = root.tag.split("}")[0] + "}"

        items = (
            root.findall(f".//{ns}item")
            or root.findall(".//item")
            or root.findall(f".//{ns}entry")
            or root.findall(".//entry")
        )

        for item in items[:30]:
            def _t(tag: str) -> str:
                el = item.find(f"{ns}{tag}") or item.find(tag)
                return (el.text or "").strip() if el is not None else ""

            title = _clean_html(_t("title"))
            link = _t("link") or _t("id")
            desc = _clean_html(_t("description") or _t("summary"))[:200]

            pub_str = _t("pubDate") or _t("published") or _t("updated")
            pub_date: Optional[datetime] = None
            try:
                pub_date = parsedate_to_datetime(pub_str).replace(tzinfo=None)
            except Exception:
                try:
                    pub_date = datetime.fromisoformat(
                        pub_str.replace("Z", "+00:00")
                    ).replace(tzinfo=None)
                except Exception:
                    pass

            if title and link:
                articles.append({
                    "title": title, "link": link, "desc": desc,
                    "pub_date": pub_date, "source_name": source_name,
                })

    except Exception as exc:
        logger.warning(f"[News] RSS failed for {url}: {exc}")

    return articles


# ─── Cleanup old articles ─────────────────────────────────────────────────────

async def cleanup_old_news(db: AsyncSession) -> int:
    """Delete articles older than NEWS_RETENTION_DAYS (7 days) based on published_at or created_at."""
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=NEWS_RETENTION_DAYS)
    result = await db.execute(
        delete(NewsArticle).where(
            (NewsArticle.published_at < cutoff) |
            ((NewsArticle.published_at == None) & (NewsArticle.created_at < cutoff)) |
            (NewsArticle.created_at < cutoff)
        )
    )
    deleted = result.rowcount or 0
    if deleted:
        await db.commit()
        logger.info(f"[News] Cleaned up {deleted} articles older than {NEWS_RETENTION_DAYS} days.")
    return deleted


# ─── Main refresh ─────────────────────────────────────────────────────────────

async def refresh_news(db: AsyncSession) -> int:
    """
    Fetch all sources → keyword filter → store metadata only.
    Also cleans up articles older than NEWS_RETENTION_DAYS.
    Returns number of new articles stored.
    """
    # 1. Cleanup old articles first
    await cleanup_old_news(db)

    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=NEWS_RETENTION_DAYS)
    stored = 0

    for source in NEWS_SOURCES:
        raw = await anyio.to_thread.run_sync(
            lambda s=source: _parse_rss(s["url"], s["name"])
        )
        logger.info(f"[News] {source['name']}: {len(raw)} items fetched")

        keywords = DAIRY_KEYWORDS_KN if source["language"] == "kn" else DAIRY_KEYWORDS_EN

        for art in raw:
            title = art["title"]
            desc = art.get("desc", "")
            link = art["link"]
            pub_date = art.get("pub_date")

            # 0. Skip articles older than 7 days
            if pub_date and pub_date < cutoff:
                continue

            # 1. Language gate
            if source.get("require_kannada") and not _is_kannada(title):
                continue

            # 2. Exclusion filter (cartoons, horoscopes, etc.)
            if _is_excluded(title):
                continue

            # 3. Keyword relevance
            if not _is_relevant(title, desc, keywords):
                continue

            # 4. Dedup by URL
            existing = await db.execute(
                select(NewsArticle).where(NewsArticle.source_url == link)
            )
            if existing.scalars().first():
                continue

            cat_key, cat_kn = _detect_category(title, desc)
            is_kn = _is_kannada(title) or (source.get("language") == "kn")
            # 1st Priority for Kannada articles: score 10.0 vs 1.0 for English
            relevance = 10.0 if is_kn else 1.0

            # 5. Store METADATA ONLY — no content, no translation
            news = NewsArticle(
                original_title=title[:490],
                original_summary=None,
                kannada_title=title[:590],
                kannada_summary="",
                source_name=art["source_name"],
                source_url=link[:1990],
                image_url=None,
                category=cat_key,
                category_kn=cat_kn,
                is_alert=(cat_key == "disease_alert"),
                relevance_score=relevance,
                published_at=pub_date,
                fetched_at=datetime.now(timezone.utc).replace(tzinfo=None),
                created_at=datetime.now(timezone.utc).replace(tzinfo=None),
            )
            db.add(news)
            stored += 1
            logger.info(f"[News] ✅ {title[:65]} [{cat_kn}] (Priority: {'Kannada' if is_kn else 'English'})")

    if stored:
        await db.commit()

    logger.info(f"[News] Done — {stored} new articles stored.")
    return stored


# ─── Query helpers ────────────────────────────────────────────────────────────

async def get_latest_news(db: AsyncSession, limit: int = 6) -> list[NewsArticle]:
    """Retrieve latest farmer news. Strictly under 7 days old, with Kannada articles having 1st priority."""
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=NEWS_RETENTION_DAYS)
    valid_window = (
        (NewsArticle.published_at >= cutoff) |
        ((NewsArticle.published_at == None) & (NewsArticle.created_at >= cutoff))
    )
    result = await db.execute(
        select(NewsArticle)
        .where(valid_window)
        .order_by(
            NewsArticle.relevance_score.desc(),  # 1st priority: Kannada (10.0) first
            NewsArticle.published_at.desc().nullslast(),
            NewsArticle.created_at.desc(),
        )
        .limit(limit)
    )
    return result.scalars().all()


async def get_all_news(
    db: AsyncSession,
    category: Optional[str] = None,
    page: int = 1,
    limit: int = 12,
) -> tuple[list[NewsArticle], int]:
    """Retrieve paginated farmer news. Strictly under 7 days old, with Kannada articles having 1st priority."""
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=NEWS_RETENTION_DAYS)
    valid_window = (
        (NewsArticle.published_at >= cutoff) |
        ((NewsArticle.published_at == None) & (NewsArticle.created_at >= cutoff))
    )
    q = (
        select(NewsArticle)
        .where(valid_window)
        .order_by(
            NewsArticle.relevance_score.desc(),  # 1st priority: Kannada (10.0) first
            NewsArticle.published_at.desc().nullslast(),
            NewsArticle.created_at.desc(),
        )
    )
    count_q = select(func.count()).select_from(NewsArticle).where(valid_window)

    if category and category != "all":
        q = q.where(NewsArticle.category == category)
        count_q = count_q.where(NewsArticle.category == category)

    q = q.offset((page - 1) * limit).limit(limit)
    items = await db.execute(q)
    total = await db.execute(count_q)
    return items.scalars().all(), (total.scalar() or 0)

