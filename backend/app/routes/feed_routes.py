from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.feed import Feed
from app.schemas.feed import FeedCreate, FeedUpdate, FeedResponse
from app.utils.response import json_response
from app.services.storage_service import upload_image

router = APIRouter(tags=["Feeds Catalog"])

from app.models.partner import PartnerProduct

def partner_product_to_feed_dict(p: PartnerProduct) -> dict:
    return {
        "id": 10000 + p.id,
        "name": p.name,
        "title": p.name,
        "price": float(p.buy_feeds_price) if p.buy_feeds_price is not None else 0.0,
        "description": p.recommended_use_en or p.description_en or f"{p.brand or 'Cargill'} {p.name}",
        "description_kn": p.recommended_use_kn or p.description_kn,
        "brand": p.brand or "Cargill",
        "category": p.category or "Lactating cattle feed",
        "unit": "50 kg",
        "image": p.image_url,
        "image_url": p.image_url,
        "is_in_stock": getattr(p, "is_in_stock", True) if getattr(p, "is_in_stock", True) is not None else True,
        "stock_quantity": 100 if (getattr(p, "is_in_stock", True) is not False) else 0,
        "is_hidden": False,
        "is_partner_product": True,
        "partner_product_id": p.id,
        "recommended_use_en": p.recommended_use_en,
        "recommended_use_kn": p.recommended_use_kn,
        "feeding_instructions_en": p.feeding_instructions_en,
        "feeding_instructions_kn": p.feeding_instructions_kn,
        "milk_production_range": p.milk_production_range,
        "milk_production_range_kn": p.milk_production_range_kn,
        "animal_type": p.animal_type,
        "nutrition_data": p.nutrition_data,
    }

# --- PUBLIC ENDPOINTS ---

@router.get("/feeds")
async def get_feeds(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all available feed products (standard feeds + partner products with show_in_buy_feeds=True)."""
    # 1. Fetch standard feeds
    query = select(Feed).where(Feed.is_hidden == False)
    if category:
        query = query.where(Feed.category == category)
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (Feed.title.ilike(search_filter)) | 
            (Feed.description.ilike(search_filter))
        )
    result = await db.execute(query.order_by(Feed.id.asc()))
    feeds = result.scalars().all()
    payload = [FeedResponse.model_validate(f).model_dump(by_alias=True) for f in feeds]

    # 2. Fetch PartnerProducts enabled for Buy Feeds (show_in_buy_feeds == True and is_active == True)
    pp_query = select(PartnerProduct).where(
        PartnerProduct.show_in_buy_feeds.is_(True),
        PartnerProduct.is_active.is_(True)
    )
    if search:
        search_filter = f"%{search}%"
        pp_query = pp_query.where(
            (PartnerProduct.name.ilike(search_filter)) |
            (PartnerProduct.description_en.ilike(search_filter)) |
            (PartnerProduct.recommended_use_en.ilike(search_filter))
        )
    pp_result = await db.execute(pp_query.order_by(PartnerProduct.display_order.asc(), PartnerProduct.id.asc()))
    partner_prods = pp_result.scalars().all()
    for p in partner_prods:
        payload.append(partner_product_to_feed_dict(p))

    return payload

@router.get("/feeds/admin")
async def get_feeds_admin(
    category: Optional[str] = None,
    search: Optional[str] = None,
    admin_user = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all feed products including hidden ones and partner products (Admin only)."""
    # 1. Standard feeds
    query = select(Feed)
    if category:
        query = query.where(Feed.category == category)
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (Feed.title.ilike(search_filter)) | 
            (Feed.description.ilike(search_filter))
        )
    result = await db.execute(query.order_by(Feed.id.asc()))
    feeds = result.scalars().all()
    payload = [FeedResponse.model_validate(f).model_dump(by_alias=True) for f in feeds]

    # 2. Partner products
    pp_query = select(PartnerProduct)
    if search:
        search_filter = f"%{search}%"
        pp_query = pp_query.where(
            (PartnerProduct.name.ilike(search_filter)) |
            (PartnerProduct.description_en.ilike(search_filter))
        )
    pp_result = await db.execute(pp_query.order_by(PartnerProduct.display_order.asc(), PartnerProduct.id.asc()))
    for p in pp_result.scalars().all():
        d = partner_product_to_feed_dict(p)
        d["is_hidden"] = not (p.show_in_buy_feeds and p.is_active)
        payload.append(d)

    return payload

@router.get("/feeds/{id}")
async def get_feed_by_id(id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve details for a specific feed product."""
    if id >= 10000:
        pp_id = id - 10000
        res = await db.execute(select(PartnerProduct).where(PartnerProduct.id == pp_id))
        p = res.scalars().first()
        if not p or not p.is_active or not p.show_in_buy_feeds:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Partner feed product with ID {id} not found."
            )
        return partner_product_to_feed_dict(p)

    result = await db.execute(select(Feed).where(Feed.id == id))
    feed = result.scalars().first()
    if not feed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feed product with ID {id} not found in database catalog."
        )
    return FeedResponse.model_validate(feed).model_dump(by_alias=True)

# --- ADMIN WRITE ENDPOINTS (Protected by Admin Role check) ---

@router.post("/feeds")
async def create_feed(
    req: FeedCreate,
    background_tasks: BackgroundTasks,
    admin_user = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new feed product item (Admin only)."""
    cdn_url = upload_image(req.image, folder="feeds") if req.image else None
    cdn_url_2 = upload_image(req.image2, folder="feeds") if req.image2 else None
    
    # Create the SQLAlchemy model
    new_feed = Feed(
        title=req.name,
        price=req.price,
        description=req.description,
        brand=req.brand,
        stock_quantity=req.stock_quantity,
        image_url=cdn_url,
        image_url_2=cdn_url_2,
        category=req.category,
        unit=req.unit or "50 kg",
        is_hidden=req.is_hidden
    )
    
    db.add(new_feed)
    await db.commit()
    await db.refresh(new_feed)
    
    # Trigger in-app notification for registered users via background task
    from app.services.notification_service import dispatch_notifications_background
    background_tasks.add_task(
        dispatch_notifications_background,
        title="🌾 New feed available",
        message="A new cattle feed product has been added to MilkMaatu.",
        type_name="new_feed",
        reference_id=str(new_feed.id),
        title_kn="🌾 ಹೊಸ ಮೇವು ಲಭ್ಯವಿದೆ",
        message_kn="MilkMaatu ದಲ್ಲಿ ಹೊಸ ದನದ ಮೇವಿನ ಉತ್ಪನ್ನವನ್ನು ಸೇರಿಸಲಾಗಿದೆ.",
        title_en="🌾 New feed available",
        message_en="A new cattle feed product has been added to MilkMaatu."
    )
    
    payload = FeedResponse.model_validate(new_feed).model_dump(by_alias=True)
    return json_response(
        success=True,
        message="Feed product created successfully",
        data=payload
    )

@router.put("/feeds/{id}")
async def update_feed(
    id: int,
    req: FeedUpdate,
    admin_user = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update details of an existing feed product (Admin only). Supports partner feeds (id >= 10000)."""
    if id >= 10000:
        pp_id = id - 10000
        res = await db.execute(select(PartnerProduct).where(PartnerProduct.id == pp_id))
        partner_prod = res.scalars().first()
        if not partner_prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Partner feed product with ID {id} not found."
            )

        update_data = req.model_dump(exclude_unset=True)
        if "price" in update_data and update_data["price"] is not None:
            partner_prod.buy_feeds_price = float(update_data["price"])
        if "is_hidden" in update_data and update_data["is_hidden"] is not None:
            partner_prod.show_in_buy_feeds = not update_data["is_hidden"]
        if "is_in_stock" in update_data and update_data["is_in_stock"] is not None:
            partner_prod.is_in_stock = bool(update_data["is_in_stock"])
        elif "stock_quantity" in update_data and update_data["stock_quantity"] is not None:
            partner_prod.is_in_stock = update_data["stock_quantity"] > 0
        if "name" in update_data and update_data["name"]:
            partner_prod.name = update_data["name"]
        if "description" in update_data and update_data["description"]:
            partner_prod.recommended_use_en = update_data["description"]

        await db.commit()
        await db.refresh(partner_prod)
        d = partner_product_to_feed_dict(partner_prod)
        d["is_hidden"] = not (partner_prod.show_in_buy_feeds and partner_prod.is_active)
        return json_response(
            success=True,
            message="Partner feed product updated successfully",
            data=d
        )

    result = await db.execute(select(Feed).where(Feed.id == id))
    feed = result.scalars().first()
    
    if not feed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feed product with ID {id} not found."
        )
        
    # Apply updates
    update_data = req.model_dump(exclude_unset=True)
    
    if "name" in update_data:
        feed.title = update_data["name"]
    if "price" in update_data:
        feed.price = update_data["price"]
    if "description" in update_data:
        feed.description = update_data["description"]
    if "category" in update_data:
        feed.category = update_data["category"]
    if "unit" in update_data:
        feed.unit = update_data["unit"]
    if "image" in update_data:
        feed.image_url = upload_image(update_data["image"], folder="feeds") if update_data["image"] else None
    if "image2" in update_data:
        feed.image_url_2 = upload_image(update_data["image2"], folder="feeds") if update_data["image2"] else None
    if "brand" in update_data:
        feed.brand = update_data["brand"]
    if "stock_quantity" in update_data:
        feed.stock_quantity = update_data["stock_quantity"]
    if "is_hidden" in update_data:
        feed.is_hidden = update_data["is_hidden"]
        
    await db.commit()
    await db.refresh(feed)
    
    payload = FeedResponse.model_validate(feed).model_dump(by_alias=True)
    return json_response(
        success=True,
        message="Feed product updated successfully",
        data=payload
    )

@router.delete("/feeds/{id}")
async def delete_feed(
    id: int,
    admin_user = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a feed product item from the catalog (Admin only). For partner feeds, hides from Buy Feeds."""
    if id >= 10000:
        pp_id = id - 10000
        res = await db.execute(select(PartnerProduct).where(PartnerProduct.id == pp_id))
        partner_prod = res.scalars().first()
        if partner_prod:
            partner_prod.show_in_buy_feeds = False
            await db.commit()
        return json_response(success=True, message="Partner feed product hidden from Buy Feeds catalog.")

    result = await db.execute(select(Feed).where(Feed.id == id))
    feed = result.scalars().first()
    
    if not feed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feed product with ID {id} not found."
        )
        
    from app.models.order import OrderItem
    from sqlalchemy import update
    # Snapshot product name into any referencing order items and disassociate feed_id
    await db.execute(
        update(OrderItem)
        .where(OrderItem.feed_id == id)
        .values(
            product_name=feed.title,
            feed_id=None
        )
    )

    await db.delete(feed)
    await db.commit()
    
    return json_response(
        success=True,
        message="Feed product deleted successfully from catalog."
    )

