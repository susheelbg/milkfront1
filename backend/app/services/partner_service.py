"""
Partner catalog service: seeding, serialization and the admin-run "update products" diff.

NO live scraping happens here. Cargill's site is protected by bot protection and the
catalog is a MilkMaatu-owned presentation of manually verified official information.
Admins update it by submitting verified product data (JSON) to the import endpoint,
which diffs it against the database and flags anything needing review.
"""
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import SessionLocal, engine
from app.models.partner import Partner, PartnerProduct

logger = logging.getLogger(__name__)

CARGILL_SOURCE_URL = "https://www.cargill.co.in/en/lactating"
CARGILL_VERIFIED_ON = "2026-10-04"
CARGILL_LOGO_URL = "https://ywgjsvrvyokzkhtyxqrt.supabase.co/storage/v1/object/public/milkmaatu-image/partners/cargill/logo/cargill-logo.jpg"

# Fields an import/update may touch (image is handled separately, never auto-overwritten)
IMPORTABLE_FIELDS = [
    "brand", "category", "animal_type", "milk_production_range", "milk_production_range_kn",
    "description_en", "description_kn", "recommended_use_en", "recommended_use_kn",
    "feeding_instructions_en", "feeding_instructions_kn", "nutrition_data", "source_url",
]
# English-source fields: if these change, the Kannada text is stale and must be re-reviewed
EN_SOURCE_TO_KN = {
    "description_en": "description_kn",
    "recommended_use_en": "recommended_use_kn",
    "feeding_instructions_en": "feeding_instructions_kn",
    "milk_production_range": "milk_production_range_kn",
}


def _nut(value: str, limit: str) -> dict:
    return {"value": value, "unit": "%", "limit": limit}


def _p(order, name, animal, rng, rng_kn, use_en, use_kn, feed_en, feed_kn, form_en, form_kn, cp, cf, cfib, image_slug, price):
    storage_base = "https://ywgjsvrvyokzkhtyxqrt.supabase.co/storage/v1/object/public/milkmaatu-image/partners/cargill/products"
    return {
        "name": name, "brand": "Cargill", "category": "Lactating cattle feed",
        "animal_type": animal,
        "milk_production_range": rng, "milk_production_range_kn": rng_kn,
        "description_en": None, "description_kn": None,  # not provided on the source page
        "recommended_use_en": use_en, "recommended_use_kn": use_kn,
        "feeding_instructions_en": feed_en, "feeding_instructions_kn": feed_kn,
        "nutrition_data": {
            "form": {"en": form_en, "kn": form_kn},
            "crude_protein": _nut(cp, "min"),
            "crude_fat": _nut(cf, "min"),
            "crude_fibre": _nut(cfib, "max"),
            "moisture": _nut("11", "max"),
        },
        "source_url": CARGILL_SOURCE_URL, "display_order": order,
        "image_url": f"{storage_base}/{image_slug}/{image_slug}.png",
        "image_status": "approved",
        "buy_feeds_price": price,
        "show_in_buy_feeds": True,
        "is_in_stock": True,
    }


# Exactly the six products verified on https://www.cargill.co.in/en/lactating
CARGILL_PRODUCTS = [
    _p(1, "Milkgen8000", "cow", "15–25 L/day", "15–25 L/day",
       "Suitable for cows giving 15–25 litres of milk/day.",
       "ದಿನಕ್ಕೆ 15–25 ಲೀಟರ್ ಹಾಲು ನೀಡುವ ಹಸುಗಳಿಗೆ ಸೂಕ್ತ.",
       "1 kg/day for every 2.5 L milk, with fodder.",
       "ಮೇವಿನೊಂದಿಗೆ ಪ್ರತಿ 2.5 ಲೀಟರ್ ಹಾಲಿಗೆ ದಿನಕ್ಕೆ 1 ಕೆ.ಜಿ.",
       "3mm roasted pellets", "3mm ಹುರಿದ ಪೆಲೆಟ್‌ಗಳು", "21", "4", "12", "milkgen8000", 1650.0),
    _p(2, "Milkgen10000", "cow", "> 25 L/day", "> 25 L/day",
       "Suitable for cows giving more than 25 litres of milk/day.",
       "ದಿನಕ್ಕೆ 25 ಲೀಟರ್‌ಗಿಂತ ಹೆಚ್ಚು ಹಾಲು ನೀಡುವ ಹಸುಗಳಿಗೆ ಸೂಕ್ತ.",
       "1 kg/day for every 2.5 L milk, with fodder/corn silage.",
       "ಮೇವು/ಕಾರ್ನ್ ಸೈಲೇಜ್‌ನೊಂದಿಗೆ ಪ್ರತಿ 2.5 ಲೀಟರ್ ಹಾಲಿಗೆ ದಿನಕ್ಕೆ 1 ಕೆ.ಜಿ.",
       "3mm roasted pellets", "3mm ಹುರಿದ ಪೆಲೆಟ್‌ಗಳು", "24", "4", "10", "milkgen10000", 1850.0),
    _p(3, "Pragati", "cow_buffalo", "Cow ≤ 12 L/day · Buffalo ≤ 6 L/day", "ಹಸು ≤ 12 L/day · ಎಮ್ಮೆ ≤ 6 L/day",
       "Suitable for cows giving up to 12 litres/day and buffaloes giving up to 6 litres/day.",
       "ದಿನಕ್ಕೆ 12 ಲೀಟರ್‌ವರೆಗೆ ಹಾಲು ನೀಡುವ ಹಸುಗಳಿಗೆ ಮತ್ತು 6 ಲೀಟರ್‌ವರೆಗೆ ಹಾಲು ನೀಡುವ ಎಮ್ಮೆಗಳಿಗೆ ಸೂಕ್ತ.",
       "1 kg/day for every 2 L milk + 1 kg for better health, with fodder.",
       "ಮೇವಿನೊಂದಿಗೆ ಪ್ರತಿ 2 ಲೀಟರ್ ಹಾಲಿಗೆ ದಿನಕ್ಕೆ 1 ಕೆ.ಜಿ. + ಉತ್ತಮ ಆರೋಗ್ಯಕ್ಕಾಗಿ ಹೆಚ್ಚುವರಿ 1 ಕೆ.ಜಿ.",
       "6mm roasted pellets", "6mm ಹುರಿದ ಪೆಲೆಟ್‌ಗಳು", "20", "3", "12", "pragati", 1450.0),
    _p(4, "Milkgen5000", "cow", "≤ 15 L/day", "≤ 15 L/day",
       "Suitable for cows giving up to 15 litres/day.",
       "ದಿನಕ್ಕೆ 15 ಲೀಟರ್‌ವರೆಗೆ ಹಾಲು ನೀಡುವ ಹಸುಗಳಿಗೆ ಸೂಕ್ತ.",
       "1 kg/day for every 2 L milk, with fodder.",
       "ಮೇವಿನೊಂದಿಗೆ ಪ್ರತಿ 2 ಲೀಟರ್ ಹಾಲಿಗೆ ದಿನಕ್ಕೆ 1 ಕೆ.ಜಿ.",
       "3mm roasted pellets", "3mm ಹುರಿದ ಪೆಲೆಟ್‌ಗಳು", "20", "2.5", "12", "milkgen5000", 1350.0),
    _p(5, "Buffgen4000", "buffalo", "> 10 L/day", "> 10 L/day",
       "Suitable for buffaloes giving more than 10 litres/day.",
       "ದಿನಕ್ಕೆ 10 ಲೀಟರ್‌ಗಿಂತ ಹೆಚ್ಚು ಹಾಲು ನೀಡುವ ಎಮ್ಮೆಗಳಿಗೆ ಸೂಕ್ತ.",
       "1 kg/day for every 2 L milk, with fodder.",
       "ಮೇವಿನೊಂದಿಗೆ ಪ್ರತಿ 2 ಲೀಟರ್ ಹಾಲಿಗೆ ದಿನಕ್ಕೆ 1 ಕೆ.ಜಿ.",
       "3mm roasted pellets", "3mm ಹುರಿದ ಪೆಲೆಟ್‌ಗಳು", "22", "5", "12", "buffgen4000", 1550.0),
    _p(6, "Bullet", "cow_buffalo", "≤ 10 L/day", "≤ 10 L/day",
       "Suitable for cows and buffaloes giving up to 10 litres/day.",
       "ದಿನಕ್ಕೆ 10 ಲೀಟರ್‌ವರೆಗೆ ಹಾಲು ನೀಡುವ ಹಸುಗಳು ಮತ್ತು ಎಮ್ಮೆಗಳಿಗೆ ಸೂಕ್ತ.",
       "1 kg/day for every 2 L milk + 1 kg for better health, with fodder.",
       "ಮೇವಿನೊಂದಿಗೆ ಪ್ರತಿ 2 ಲೀಟರ್ ಹಾಲಿಗೆ ದಿನಕ್ಕೆ 1 ಕೆ.ಜಿ. + ಉತ್ತಮ ಆರೋಗ್ಯಕ್ಕಾಗಿ ಹೆಚ್ಚುವರಿ 1 ಕೆ.ಜಿ.",
       "Mash", "ಮ್ಯಾಶ್", "19", "2.5", "15", "bullet", 1250.0),
]


def _checked_at() -> datetime:
    return datetime.strptime(CARGILL_VERIFIED_ON, "%Y-%m-%d")


async def ensure_partner_schema_and_seed() -> None:
    """Idempotent: create the two tables if missing and seed Cargill + its six products."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(
                lambda sync_conn: Partner.__table__.create(sync_conn, checkfirst=True)
            )
            await conn.run_sync(
                lambda sync_conn: PartnerProduct.__table__.create(sync_conn, checkfirst=True)
            )
            # Add columns if missing in existing DB
            for sql in [
                "ALTER TABLE partner_products ADD COLUMN show_in_buy_feeds BOOLEAN DEFAULT TRUE NOT NULL;",
                "ALTER TABLE partner_products ADD COLUMN buy_feeds_price FLOAT DEFAULT 0.0;",
                "ALTER TABLE partner_products ADD COLUMN is_in_stock BOOLEAN DEFAULT TRUE NOT NULL;",
            ]:
                try:
                    await conn.execute(text(sql))
                except Exception:
                    pass
    except Exception as e:
        logger.warning(f"[PARTNERS] Table creation check failed: {e}")

    try:
        async with SessionLocal() as db:
            existing = (await db.execute(select(Partner).where(Partner.slug == "cargill"))).scalars().first()
            if not existing:
                partner = Partner(
                    slug="cargill", name="Cargill",
                    tagline_en="Animal Nutrition & Dairy Feed",
                    tagline_kn="ಪಶು ಪೋಷಣೆ ಮತ್ತು ಡೈರಿ ಆಹಾರ",
                    description_en="Cargill India animal nutrition products for lactating dairy cows and buffaloes.",
                    description_kn="ಹಾಲು ನೀಡುವ ಹಸುಗಳು ಮತ್ತು ಎಮ್ಮೆಗಳಿಗಾಗಿ ಕಾರ್ಗಿಲ್ ಇಂಡಿಯಾದ ಪಶು ಪೋಷಣೆ ಉತ್ಪನ್ನಗಳು.",
                    logo_url=CARGILL_LOGO_URL,
                    is_active=True, display_order=1,
                )
                db.add(partner)
                await db.flush()
                for item in CARGILL_PRODUCTS:
                    db.add(PartnerProduct(
                        partner_id=partner.id, is_active=True,
                        source_checked_at=_checked_at(),
                        needs_review=False, review_note=None, **item,
                    ))
                await db.commit()
                logger.info("[PARTNERS] Seeded Cargill with %d verified products.", len(CARGILL_PRODUCTS))
            else:
                # Update existing seeded partner products to ensure default prices and visibility are set
                prods = (await db.execute(select(PartnerProduct).where(PartnerProduct.partner_id == existing.id))).scalars().all()
                price_map = {p["name"]: (p["buy_feeds_price"], p["show_in_buy_feeds"]) for p in CARGILL_PRODUCTS}
                updated = False
                for p in prods:
                    if p.name in price_map:
                        def_price, def_show = price_map[p.name]
                        if p.buy_feeds_price is None or p.buy_feeds_price == 0.0:
                            p.buy_feeds_price = def_price
                            updated = True
                        if p.show_in_buy_feeds is None:
                            p.show_in_buy_feeds = def_show
                            updated = True
                if updated:
                    await db.commit()
    except Exception as e:
        logger.warning(f"[PARTNERS] Seeding/migration failed: {e}")


# ───────────────────────────── serialization ─────────────────────────────

def _iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


def partner_to_dict(p: Partner, product_count: Optional[int] = None) -> dict:
    return {
        "id": p.id, "slug": p.slug, "name": p.name,
        "tagline_en": p.tagline_en, "tagline_kn": p.tagline_kn,
        "description_en": p.description_en, "description_kn": p.description_kn,
        "logo_url": p.logo_url, "is_active": p.is_active, "display_order": p.display_order,
        "product_count": product_count,
        "created_at": _iso(p.created_at), "updated_at": _iso(p.updated_at),
    }


def product_to_dict(p: PartnerProduct, admin: bool = False) -> dict:
    data = {
        "id": p.id, "partner_id": p.partner_id, "name": p.name, "brand": p.brand,
        "category": p.category, "animal_type": p.animal_type,
        "milk_production_range": p.milk_production_range,
        "milk_production_range_kn": p.milk_production_range_kn,
        "description_en": p.description_en, "description_kn": p.description_kn,
        "recommended_use_en": p.recommended_use_en, "recommended_use_kn": p.recommended_use_kn,
        "feeding_instructions_en": p.feeding_instructions_en,
        "feeding_instructions_kn": p.feeding_instructions_kn,
        "nutrition_data": p.nutrition_data, "image_url": p.image_url,
        "show_in_buy_feeds": p.show_in_buy_feeds, "buy_feeds_price": p.buy_feeds_price,
        "is_in_stock": getattr(p, "is_in_stock", True) if getattr(p, "is_in_stock", True) is not None else True,
        "display_order": p.display_order,
    }
    if admin:
        data.update({
            "is_active": p.is_active, "image_status": p.image_status,
            "needs_review": p.needs_review, "review_note": p.review_note,
            "source_url": p.source_url, "source_checked_at": _iso(p.source_checked_at),
            "created_at": _iso(p.created_at), "updated_at": _iso(p.updated_at),
        })
    return data


# ───────────────────────────── import / update ─────────────────────────────

def _norm(v: Any) -> Any:
    return v.strip() if isinstance(v, str) else v


async def apply_import(db: AsyncSession, partner: Partner, items: list[dict], dry_run: bool = False) -> dict:
    """
    Diff verified product data against the DB.
    - new product        -> added (hidden until admin publishes; image pending)
    - changed fields     -> updated; Kannada left untouched unless supplied, flagged for review
    - missing at source  -> flagged needs_review (NEVER deleted)
    Images are never overwritten by an import.
    """
    res = await db.execute(select(PartnerProduct).where(PartnerProduct.partner_id == partner.id))
    by_name = {p.name.strip().lower(): p for p in res.scalars().all()}
    seen: set[str] = set()
    added, updated, unchanged = [], [], []
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    for raw in items:
        name = _norm(raw.get("name"))
        if not name:
            continue
        key = name.lower()
        seen.add(key)
        existing = by_name.get(key)
        if existing is None:
            added.append(name)
            if not dry_run:
                fields = {f: _norm(raw.get(f)) for f in IMPORTABLE_FIELDS if f in raw}
                has_kn = bool(fields.get("recommended_use_kn") or fields.get("feeding_instructions_kn"))
                db.add(PartnerProduct(
                    partner_id=partner.id, name=name,
                    is_active=False,  # admin reviews before publishing
                    image_status="pending_approval", source_checked_at=now,
                    display_order=int(raw.get("display_order") or len(by_name) + len(added)),
                    needs_review=True,
                    review_note="New product from import — review data" + ("" if has_kn else " and add Kannada translation"),
                    **fields,
                ))
            continue

        changes, stale_kn = [], []
        for f in IMPORTABLE_FIELDS:
            if f not in raw:
                continue
            new_val = _norm(raw[f])
            if new_val != getattr(existing, f):
                changes.append(f)
                if not dry_run:
                    setattr(existing, f, new_val)
                if f in EN_SOURCE_TO_KN and EN_SOURCE_TO_KN[f] not in raw:
                    stale_kn.append(EN_SOURCE_TO_KN[f])
        if not dry_run:
            existing.source_checked_at = now
            if changes:
                notes = [f"Changed at source: {', '.join(changes)}"]
                if stale_kn:
                    notes.append(f"Kannada may be outdated: {', '.join(stale_kn)}")
                existing.needs_review = True
                existing.review_note = "; ".join(notes)
        (updated if changes else unchanged).append(name)

    missing = [p.name for k, p in by_name.items() if k not in seen and p.is_active]
    if not dry_run:
        for k, p in by_name.items():
            if k not in seen:
                p.needs_review = True
                p.review_note = "Not present in latest import — verify at source before keeping/hiding"
        await db.commit()

    return {"added": added, "updated": updated, "unchanged": unchanged,
            "missing_flagged_for_review": missing, "dry_run": dry_run}
