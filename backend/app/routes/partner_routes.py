"""
Partner catalog API.

Public  : GET /api/partners, /api/partners/{id}, /api/partners/{id}/products, /api/partner-products/{id}
Admin   : CRUD for partners + products, product list incl. hidden, and the Update/Import endpoint.
The frontend only ever reads our own database — nothing here calls a partner website.
"""
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.partner import Partner, PartnerProduct
from app.models.user import Profile
from app.services import partner_service as svc
from app.services.storage_service import DEFAULT_CATTLE_IMAGE, upload_image_async
from app.utils.response import json_response

router = APIRouter(tags=["Partners"])


# ───────────────────────────── schemas ─────────────────────────────

class PartnerIn(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    tagline_en: Optional[str] = None
    tagline_kn: Optional[str] = None
    description_en: Optional[str] = None
    description_kn: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class ProductIn(BaseModel):
    partner_id: Optional[int] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    animal_type: Optional[str] = None
    milk_production_range: Optional[str] = None
    milk_production_range_kn: Optional[str] = None
    description_en: Optional[str] = None
    description_kn: Optional[str] = None
    recommended_use_en: Optional[str] = None
    recommended_use_kn: Optional[str] = None
    feeding_instructions_en: Optional[str] = None
    feeding_instructions_kn: Optional[str] = None
    nutrition_data: Optional[Any] = None
    source_url: Optional[str] = None
    is_active: Optional[bool] = None
    show_in_buy_feeds: Optional[bool] = None
    buy_feeds_price: Optional[float] = None
    display_order: Optional[int] = None
    needs_review: Optional[bool] = None
    review_note: Optional[str] = None
    image: Optional[str] = None          # base64 data URI -> uploaded to Supabase Storage
    remove_image: Optional[bool] = None


class ImportIn(BaseModel):
    products: list[dict]
    dry_run: bool = False


def _slugify(s: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "partner"


async def _store_image(slug: str, image: str) -> str:
    """Only base64 uploads are accepted — never hotlink a remote URL."""
    if not image.startswith("data:"):
        raise HTTPException(status_code=400, detail="Image must be uploaded as a file; remote URLs are not accepted.")
    url = await upload_image_async(image, folder=f"partners/{slug}/products")
    if not url or url == DEFAULT_CATTLE_IMAGE or not url.startswith(settings.SUPABASE_URL.rstrip("/")):
        raise HTTPException(status_code=502, detail="Image upload to Supabase Storage failed.")
    return url


async def _get_partner_or_404(db: AsyncSession, partner_id: int) -> Partner:
    p = await db.get(Partner, partner_id)
    if not p:
        raise HTTPException(status_code=404, detail="Partner not found")
    return p


# ───────────────────────────── public ─────────────────────────────

@router.get("/partners")
async def list_partners(db: AsyncSession = Depends(get_db)):
    counts = dict((await db.execute(
        select(PartnerProduct.partner_id, func.count(PartnerProduct.id))
        .where(PartnerProduct.is_active.is_(True)).group_by(PartnerProduct.partner_id)
    )).all())
    rows = (await db.execute(
        select(Partner).where(Partner.is_active.is_(True)).order_by(Partner.display_order, Partner.id)
    )).scalars().all()
    return json_response(True, "Partners fetched", [svc.partner_to_dict(p, counts.get(p.id, 0)) for p in rows])


@router.get("/partners/{partner_id}")
async def get_partner(partner_id: int, db: AsyncSession = Depends(get_db)):
    p = await _get_partner_or_404(db, partner_id)
    if not p.is_active:
        raise HTTPException(status_code=404, detail="Partner not found")
    return json_response(True, "Partner fetched", svc.partner_to_dict(p))


@router.get("/partners/{partner_id}/products")
async def list_partner_products(partner_id: int, db: AsyncSession = Depends(get_db)):
    p = await _get_partner_or_404(db, partner_id)
    if not p.is_active:
        raise HTTPException(status_code=404, detail="Partner not found")
    rows = (await db.execute(
        select(PartnerProduct)
        .where(PartnerProduct.partner_id == partner_id, PartnerProduct.is_active.is_(True))
        .order_by(PartnerProduct.display_order, PartnerProduct.id)
    )).scalars().all()
    return json_response(True, "Products fetched", {
        "partner": svc.partner_to_dict(p, len(rows)),
        "products": [svc.product_to_dict(r) for r in rows],
    })


@router.get("/partner-products/{product_id}")
async def get_partner_product(product_id: int, db: AsyncSession = Depends(get_db)):
    prod = await db.get(PartnerProduct, product_id)
    if not prod or not prod.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    partner = await db.get(Partner, prod.partner_id)
    return json_response(True, "Product fetched", {
        "product": svc.product_to_dict(prod),
        "partner": svc.partner_to_dict(partner) if partner else None,
    })


# ───────────────────────────── admin: partners ─────────────────────────────

@router.get("/admin/partners")
async def admin_list_partners(admin: Profile = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    counts = dict((await db.execute(
        select(PartnerProduct.partner_id, func.count(PartnerProduct.id)).group_by(PartnerProduct.partner_id)
    )).all())
    rows = (await db.execute(select(Partner).order_by(Partner.display_order, Partner.id))).scalars().all()
    return json_response(True, "Partners fetched", [svc.partner_to_dict(p, counts.get(p.id, 0)) for p in rows])


@router.post("/admin/partners")
async def admin_create_partner(req: PartnerIn, admin: Profile = Depends(get_current_admin),
                               db: AsyncSession = Depends(get_db)):
    if not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="Partner name is required")
    slug = _slugify(req.slug or req.name)
    if (await db.execute(select(Partner).where(Partner.slug == slug))).scalars().first():
        raise HTTPException(status_code=409, detail="A partner with this slug already exists")
    data = req.model_dump(exclude_unset=True)
    data.update(name=req.name.strip(), slug=slug)
    data.setdefault("is_active", True)
    data.setdefault("display_order", 0)
    p = Partner(**data)
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return json_response(True, "Partner created", svc.partner_to_dict(p, 0), 201)


@router.put("/admin/partners/{partner_id}")
async def admin_update_partner(partner_id: int, req: PartnerIn, admin: Profile = Depends(get_current_admin),
                               db: AsyncSession = Depends(get_db)):
    p = await _get_partner_or_404(db, partner_id)
    data = req.model_dump(exclude_unset=True)
    data.pop("slug", None)  # slug is a stable identifier (storage path)
    for k, v in data.items():
        setattr(p, k, v)
    await db.commit()
    await db.refresh(p)
    return json_response(True, "Partner updated", svc.partner_to_dict(p))


@router.delete("/admin/partners/{partner_id}")
async def admin_delete_partner(partner_id: int, admin: Profile = Depends(get_current_admin),
                               db: AsyncSession = Depends(get_db)):
    p = await _get_partner_or_404(db, partner_id)
    await db.delete(p)
    await db.commit()
    return json_response(True, "Partner deleted")


# ───────────────────────────── admin: products ─────────────────────────────

@router.get("/admin/partners/{partner_id}/products")
async def admin_list_products(partner_id: int, admin: Profile = Depends(get_current_admin),
                              db: AsyncSession = Depends(get_db)):
    p = await _get_partner_or_404(db, partner_id)
    rows = (await db.execute(
        select(PartnerProduct).where(PartnerProduct.partner_id == partner_id)
        .order_by(PartnerProduct.display_order, PartnerProduct.id)
    )).scalars().all()
    return json_response(True, "Products fetched", {
        "partner": svc.partner_to_dict(p, len(rows)),
        "products": [svc.product_to_dict(r, admin=True) for r in rows],
    })


@router.post("/admin/partner-products")
async def admin_create_product(req: ProductIn, admin: Profile = Depends(get_current_admin),
                               db: AsyncSession = Depends(get_db)):
    if not req.partner_id or not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="partner_id and name are required")
    partner = await _get_partner_or_404(db, req.partner_id)
    data = req.model_dump(exclude_unset=True, exclude={"image", "remove_image"})
    data["name"] = req.name.strip()
    data.setdefault("is_active", True)
    prod = PartnerProduct(**data)
    if req.image:
        prod.image_url = await _store_image(partner.slug, req.image)
        prod.image_status = "approved"
    db.add(prod)
    await db.commit()
    await db.refresh(prod)
    return json_response(True, "Product created", svc.product_to_dict(prod, admin=True), 201)


@router.put("/admin/partner-products/{product_id}")
async def admin_update_product(product_id: int, req: ProductIn, admin: Profile = Depends(get_current_admin),
                               db: AsyncSession = Depends(get_db)):
    prod = await db.get(PartnerProduct, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    data = req.model_dump(exclude_unset=True, exclude={"image", "remove_image", "partner_id"})
    for k, v in data.items():
        setattr(prod, k, v)
    if req.image:
        partner = await db.get(Partner, prod.partner_id)
        prod.image_url = await _store_image(partner.slug, req.image)
        prod.image_status = "approved"
    elif req.remove_image:
        prod.image_url = None
        prod.image_status = "pending_approval"
    await db.commit()
    await db.refresh(prod)
    return json_response(True, "Product updated", svc.product_to_dict(prod, admin=True))


@router.delete("/admin/partner-products/{product_id}")
async def admin_delete_product(product_id: int, admin: Profile = Depends(get_current_admin),
                               db: AsyncSession = Depends(get_db)):
    prod = await db.get(PartnerProduct, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(prod)
    await db.commit()
    return json_response(True, "Product deleted")


@router.post("/admin/partners/{partner_id}/import")
async def admin_import_products(partner_id: int, req: ImportIn, admin: Profile = Depends(get_current_admin),
                                db: AsyncSession = Depends(get_db)):
    """
    'Update Products': submit verified product data; it is diffed against the database.
    Adds new (hidden, for review), updates changed, flags disappeared — never deletes.
    This endpoint does not fetch any external website.
    """
    partner = await _get_partner_or_404(db, partner_id)
    if not req.products:
        raise HTTPException(status_code=400, detail="No products supplied")
    result = await svc.apply_import(db, partner, req.products, dry_run=req.dry_run)
    return json_response(True, "Import preview" if req.dry_run else "Import applied", result)
