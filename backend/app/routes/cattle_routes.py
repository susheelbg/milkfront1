from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.cattle import Cattle
from app.models.user import User
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
    
    # Explicit join with ON condition so SQLAlchemy knows how to link tables
    query = (
        select(Cattle)
        .join(User, Cattle.user_id == User.id)
        .where(Cattle.expires_at > current_time)
    )
    
    if sante:
        sante_lower = sante.lower()
        if "krs" in sante_lower or "ಕೆ.ಆರ್.ಎಸ್" in sante_lower:
            query = query.where(Cattle.sante_name.in_(["KRS Sante", "ಕೆ.ಆರ್.ಎಸ್ ಸಂತೆ"]))
        elif "thendekere" in sante_lower or "ತೆಂಡೆಕೆರೆ" in sante_lower:
            query = query.where(Cattle.sante_name.in_(["Thendekere Sante", "ತೆಂಡೆಕೆರೆ ಸಂತೆ"]))
        else:
            query = query.where(Cattle.sante_name.ilike(sante))
        
    if q:
        search_filter = f"%{q}%"
        query = query.where(
            (Cattle.animal_name.ilike(search_filter)) | 
            (Cattle.village.ilike(search_filter)) | 
            (Cattle.description.ilike(search_filter))
        )
        
    result = await db.execute(query.order_by(Cattle.created_at.desc()))
    listings = result.scalars().all()
    
    # Map models through Pydantic to ensure serialization aliases align with React naming
    payload = [CattleResponse.model_validate(c).model_dump(by_alias=True) for c in listings]
    return payload # Return array directly to keep it simple for frontend mapping, or envelope it


@router.get("/cattle/search")
async def search_cattle_listings(
    q: str,
    sante: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Search active listings directly via query string parameters."""
    return await get_cattle_listings(sante=sante, q=q, db=db)

@router.post("/cattle")
async def create_cattle_listing(
    req: CattleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new cattle listing in Sante. Handles Cloudinary base64 image uploads."""
    # 1. Process base64 photo via Cloudinary
    cdn_url = upload_image(req.image)
    
    # 2. Save in database
    new_cattle = Cattle(
        user_id=current_user.id,
        animal_name=req.animalName,
        animal_type="Cow", # Default type
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a cattle listing. Restricts deletions to listing owners or administrators."""
    result = await db.execute(select(Cattle).where(Cattle.id == id))
    cattle = result.scalars().first()
    
    if not cattle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cattle listing with ID {id} not found."
        )
        
    # Check permissions (Owner or Admin)
    if cattle.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized. Only listing owners or administrators can delete posts."
        )
        
    await db.delete(cattle)
    await db.commit()
    
    return json_response(
        success=True,
        message="Listing deleted successfully"
    )
