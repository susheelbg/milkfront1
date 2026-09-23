from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.cattle import Cattle
from app.models.user import User
from app.schemas.cattle import CattleCreate, CattleResponse
from app.services.cloudinary_service import upload_image
from app.utils.response import json_response

router = APIRouter(tags=["Cattle Sante Marketplace"])

async def get_or_create_farmer_user(db: AsyncSession, phone: str, village: Optional[str] = None) -> int:
    clean_phone = phone.strip() if phone else "guest_farmer"
    res = await db.execute(select(User).where(User.phone_number == clean_phone))
    user = res.scalars().first()
    if not user:
        user = User(
            full_name="Farmer",
            phone_number=clean_phone,
            hashed_password="guest_no_password",
            role="user",
            village=village or "",
            is_verified=True,
            phone_verified=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user.id

@router.get("/cattle")
async def get_cattle_listings(
    sante: Optional[str] = None,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve active (non-expired) cattle listings, optionally filtered by Sante and search text."""
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Explicit join with ON condition so SQLAlchemy knows how to link tables
    query = (
        select(Cattle)
        .join(User, Cattle.user_id == User.id)
        .where(Cattle.expires_at > current_time)
    )
    
    if sante:
        query = query.where(Cattle.sante_name.ilike(f"%{sante}%"))
        
    if q:
        search_filter = f"%{q}%"
        query = query.where(
            (Cattle.animal_name.ilike(search_filter)) |
            (Cattle.village.ilike(search_filter)) |
            (Cattle.description.ilike(search_filter))
        )
        
    result = await db.execute(query.order_by(Cattle.created_at.desc()))
    cattle_list = result.scalars().all()
    
    # Format according to Pydantic alias fields (e.g. image_url -> image, user_id -> userId)
    payload = [CattleResponse.model_validate(c).model_dump(by_alias=True) for c in cattle_list]
    
    return json_response(
        success=True,
        message="Fetched active cattle listings",
        data=payload
    )

@router.get("/cattle/{id}")
async def get_cattle_detail(
    id: int,
    db: AsyncSession = Depends(get_db)
):
    """Fetch complete metadata for an individual cattle listing."""
    result = await db.execute(select(Cattle).where(Cattle.id == id))
    cattle = result.scalars().first()
    
    if not cattle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cattle listing with ID {id} not found."
        )
        
    payload = CattleResponse.model_validate(cattle).model_dump(by_alias=True)
    return json_response(
        success=True,
        message="Fetched cattle detail successfully",
        data=payload
    )

@router.post("/cattle")
async def create_cattle_listing(
    req: CattleCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new cattle listing in Sante without requiring user login."""
    # 1. Process base64 photo via Cloudinary
    cdn_url = upload_image(req.image)
    
    # 2. Link to farmer record via contact phone
    user_id = await get_or_create_farmer_user(db, req.contactNumber, req.villageName)
    
    # 3. Save in database
    new_cattle = Cattle(
        user_id=user_id,
        animal_name=req.animalName,
        animal_type="Cow",
        age=req.age,
        milk_capacity=req.milkCapacity,
        price=req.price,
        village=req.villageName,
        description=req.description,
        image_url=cdn_url,
        phone_number=req.contactNumber,
        sante_name=req.santeName
    )
    
    db.add(new_cattle)
    await db.commit()
    await db.refresh(new_cattle)
    
    payload = CattleResponse.model_validate(new_cattle).model_dump(by_alias=True)
    return json_response(
        success=True,
        message="Cattle posted to Sante successfully",
        data=payload
    )

@router.delete("/cattle/{id}")
async def delete_cattle_listing(
    id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a cattle listing by ID without requiring user login."""
    result = await db.execute(select(Cattle).where(Cattle.id == id))
    cattle = result.scalars().first()
    
    if not cattle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cattle listing with ID {id} not found."
        )
        
    await db.delete(cattle)
    await db.commit()
    
    return json_response(
        success=True,
        message="Listing deleted successfully"
    )
