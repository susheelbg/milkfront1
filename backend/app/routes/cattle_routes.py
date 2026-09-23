from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.dependencies import get_current_user_optional, get_current_user
from app.models.cattle import Cattle
from app.models.user import Profile
from app.schemas.cattle import CattleCreate, CattleResponse
from app.services.cloudinary_service import upload_image
from app.utils.response import json_response

router = APIRouter(tags=["Cattle Sante Marketplace"])

@router.get("/cattle")
async def get_cattle_listings(
    sante: Optional[str] = None,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve active (non-expired) cattle listings, optionally filtered by Sante and search text."""
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    query = select(Cattle).where(Cattle.expires_at > current_time)
    
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
    current_user: Optional[Profile] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Create a new cattle listing in Sante. Links to authenticated user UUID if logged in."""
    cdn_url = upload_image(req.image) if req.image else ""
    
    new_cattle = Cattle(
        user_id=current_user.id if current_user else None,
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
    current_user: Optional[Profile] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Delete a cattle listing by ID. Allowed if owner or admin."""
    result = await db.execute(select(Cattle).where(Cattle.id == id))
    cattle = result.scalars().first()
    
    if not cattle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cattle listing with ID {id} not found."
        )
        
    # Check permissions if authenticated
    if current_user:
        is_owner = (cattle.user_id == current_user.id)
        is_admin = (current_user.role in ("admin", "super_admin"))
        if not (is_owner or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this listing."
            )
            
    await db.delete(cattle)
    await db.commit()
    
    return json_response(
        success=True,
        message="Listing deleted successfully"
    )
