from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.feed import Feed
from app.schemas.feed import FeedCreate, FeedUpdate, FeedResponse
from app.utils.response import json_response

router = APIRouter(tags=["Feeds Catalog"])

# --- PUBLIC ENDPOINTS ---

@router.get("/feeds")
async def get_feeds(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all available feed products with optional category and keyword filters."""
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
    
    # Parse through FeedResponse Pydantic schema to leverage alias mappings (title -> name, image_url -> image)
    payload = [FeedResponse.model_validate(f).model_dump(by_alias=True) for f in feeds]
    
    return payload # Return array directly to keep it simple for frontend mapping, or envelope it

@router.get("/feeds/{id}")
async def get_feed_by_id(id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve details for a specific feed product."""
    result = await db.execute(select(Feed).where(Feed.id == id))
    feed = result.scalars().first()
    
    if not feed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feed product with ID {id} not found in database catalog."
        )
        
    return FeedResponse.model_validate(feed).model_dump(by_alias=True)

# --- ADMIN WRITE ENDPOINTS (Protected by Admin Role check) ---

@router.post("/admin/feeds")
async def create_feed(
    req: FeedCreate,
    admin_user = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new feed product item (Admin only)."""
    # Create the SQLAlchemy model
    new_feed = Feed(
        title=req.name,
        price=req.price,
        description=req.description,
        brand=req.brand,
        stock_quantity=req.stock_quantity,
        image_url=req.image,
        category=req.category
    )
    
    db.add(new_feed)
    await db.commit()
    await db.refresh(new_feed)
    
    payload = FeedResponse.model_validate(new_feed).model_dump(by_alias=True)
    return json_response(
        success=True,
        message="Feed product created successfully",
        data=payload
    )

@router.put("/admin/feeds/{id}")
async def update_feed(
    id: int,
    req: FeedUpdate,
    admin_user = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update details of an existing feed product (Admin only)."""
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
    if "image" in update_data:
        feed.image_url = update_data["image"]
    if "brand" in update_data:
        feed.brand = update_data["brand"]
    if "stock_quantity" in update_data:
        feed.stock_quantity = update_data["stock_quantity"]
        
    await db.commit()
    await db.refresh(feed)
    
    payload = FeedResponse.model_validate(feed).model_dump(by_alias=True)
    return json_response(
        success=True,
        message="Feed product updated successfully",
        data=payload
    )

@router.delete("/admin/feeds/{id}")
async def delete_feed(
    id: int,
    admin_user = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a feed product item from the catalog (Admin only)."""
    result = await db.execute(select(Feed).where(Feed.id == id))
    feed = result.scalars().first()
    
    if not feed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feed product with ID {id} not found."
        )
        
    await db.delete(feed)
    await db.commit()
    
    return json_response(
        success=True,
        message="Feed product deleted successfully"
    )
