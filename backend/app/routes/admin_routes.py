import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_super_admin
from app.models.user import Profile
from app.models.feed import Feed
from app.models.order import Order, OrderItem
from app.models.cattle import Cattle
from app.schemas.user import ProfileResponse, UserRoleUpdate
from app.schemas.order import OrderResponse, OrderUpdate
from app.schemas.feed import FeedResponse
from app.utils.response import json_response

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

async def _sync_auth_users_to_profiles(db: AsyncSession):
    """Idempotently sync registered Supabase auth users into public.profiles."""
    try:
        sync_stmt = text("""
            INSERT INTO public.profiles (id, email, name, phone, address, role, created_at, updated_at)
            SELECT 
                id, 
                email, 
                COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', ''), 
                COALESCE(raw_user_meta_data->>'phone', raw_user_meta_data->>'phone_number', ''), 
                COALESCE(raw_user_meta_data->>'address', ''),
                'user',
                created_at,
                updated_at
            FROM auth.users
            ON CONFLICT (id) DO UPDATE 
            SET email = EXCLUDED.email
            WHERE public.profiles.email IS NULL OR public.profiles.email = '';
        """)
        await db.execute(sync_stmt)
        await db.commit()
    except Exception:
        # If DB user does not have permission on auth.users in non-supabase test env, continue safely
        pass

@router.get("/stats")
async def get_admin_stats(
    admin_user: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve administrative metrics and analytics summaries."""
    # Ensure all registered users are synchronized
    await _sync_auth_users_to_profiles(db)

    # 1. Total profiles count (All registered users)
    users_res = await db.execute(select(func.count(Profile.id)))
    total_users = users_res.scalar_one()

    # 2. Feeds count (Total products vs Active feeds)
    all_feeds_res = await db.execute(select(func.count(Feed.id)))
    total_feeds = all_feeds_res.scalar_one()

    active_feeds_res = await db.execute(
        select(func.count(Feed.id)).where(Feed.is_hidden == False)
    )
    active_feeds = active_feeds_res.scalar_one()

    # 3. Total orders and pending orders
    all_orders_res = await db.execute(select(func.count(Order.id)))
    total_all_orders = all_orders_res.scalar_one()

    orders_res = await db.execute(
        select(func.count(Order.id)).where(Order.order_status == "pending")
    )
    total_pending_orders = orders_res.scalar_one()

    # 4. Cattle posts
    all_cattle_res = await db.execute(select(func.count(Cattle.id)))
    total_cattle = all_cattle_res.scalar_one()

    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    active_cattle_res = await db.execute(
        select(func.count(Cattle.id)).where(Cattle.expires_at > current_time)
    )
    active_cattle_posts = active_cattle_res.scalar_one()

    # 5. Total revenue (sum total_amount for non-cancelled orders)
    revenue_res = await db.execute(
        select(func.sum(Order.total_amount)).where(Order.order_status != "cancelled")
    )
    total_revenue = revenue_res.scalar() or 0.0

    stats_payload = {
        "usersCount": total_users,
        "feedsCount": active_feeds, # Active feeds count
        "activeFeedsCount": active_feeds, # Explicit active feeds count
        "productsCount": total_feeds, # Total catalog products count
        "ordersCount": total_all_orders, # Total orders
        "pendingOrdersCount": total_pending_orders,
        "cattleCount": total_cattle,
        "activeCattleCount": active_cattle_posts,
        "totalRevenue": float(total_revenue)
    }

    return json_response(
        success=True,
        message="Fetched dashboard metrics successfully",
        data=stats_payload
    )

@router.get("/users")
async def get_all_users(
    admin_user: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all user profiles in the system (Admin only)."""
    await _sync_auth_users_to_profiles(db)

    result = await db.execute(select(Profile).order_by(Profile.created_at.desc()))
    profiles = result.scalars().all()
    
    payload = [
        {
            "id": str(p.id),
            "email": p.email or "",
            "name": p.name or "",
            "phone": p.phone or "",
            "address": p.address or "",
            "role": p.role,
            "created_at": p.created_at.isoformat() if p.created_at else "",
            "updated_at": p.updated_at.isoformat() if p.updated_at else "",
        }
        for p in profiles
    ]
    
    return json_response(
        success=True,
        message="Fetched users directory successfully",
        data=payload
    )


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    req: UserRoleUpdate,
    super_admin: Profile = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Promote or demote a user's role (Super Admin only).
    Protects the last remaining Super Admin from being demoted.
    """
    try:
        target_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user UUID format."
        )

    # Validate role
    if req.role not in ("user", "admin", "super_admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'user', 'admin', or 'super_admin'."
        )

    result = await db.execute(select(Profile).where(Profile.id == target_uuid))
    target_user = result.scalars().first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found."
        )

    # Protect the last Super Admin from demotion
    if target_user.role == "super_admin" and req.role != "super_admin":
        count_res = await db.execute(
            select(func.count(Profile.id)).where(Profile.role == "super_admin")
        )
        sa_count = count_res.scalar_one()
        if sa_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the only remaining Super Admin."
            )

    target_user.role = req.role
    target_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(target_user)

    return json_response(
        success=True,
        message=f"User role updated to '{req.role}' successfully.",
        data={
            "id": str(target_user.id),
            "email": target_user.email or "",
            "name": target_user.name or "",
            "phone": target_user.phone or "",
            "role": target_user.role,
        }
    )

@router.get("/orders")
async def get_all_orders_admin(
    admin_user: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all orders placed across the system, including legacy orders (Admin only)."""
    stmt = (
        select(Order)
        .options(
            selectinload(Order.profile),
            selectinload(Order.items).selectinload(OrderItem.feed)
        )
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(stmt)
    orders = result.scalars().all()
    
    payload = [OrderResponse.model_validate(o).model_dump() for o in orders]
    return json_response(
        success=True,
        message="Fetched all system orders successfully",
        data=payload
    )

@router.put("/orders/{order_id}/status")
async def update_order_status_admin(
    order_id: str,
    req: OrderUpdate,
    admin_user: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Modify the dispatch status of an order (Admin only)."""
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.profile),
            selectinload(Order.items).selectinload(OrderItem.feed)
        )
    )
    result = await db.execute(stmt)
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
        
    order.order_status = req.status
    await db.commit()
    
    reload_stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.profile),
            selectinload(Order.items).selectinload(OrderItem.feed)
        )
    )
    reload_res = await db.execute(reload_stmt)
    updated_order = reload_res.scalars().first()
    
    payload = OrderResponse.model_validate(updated_order).model_dump()
    return json_response(
        success=True,
        message="Order status updated successfully",
        data=payload
    )

@router.get("/feeds")
async def get_all_feeds_admin(
    admin_user: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all feed products in the system including hidden ones (Admin only)."""
    result = await db.execute(select(Feed).order_by(Feed.id.asc()))
    feeds = result.scalars().all()
    payload = [FeedResponse.model_validate(f).model_dump(by_alias=True) for f in feeds]
    return json_response(
        success=True,
        message="Fetched all catalog feeds successfully",
        data=payload
    )

@router.get("/cattle")
async def get_all_cattle_admin(
    admin_user: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all Sante cattle listings in the system with real seller information (Admin only)."""
    result = await db.execute(
        select(Cattle)
        .options(selectinload(Cattle.profile))
        .order_by(Cattle.created_at.desc())
    )
    cattle_list = result.scalars().all()
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    payload = []
    for c in cattle_list:
        seller_name = c.profile.name if (c.profile and c.profile.name) else "Farmer"
        seller_email = c.profile.email if (c.profile and c.profile.email) else ""
        is_expired = c.expires_at < current_time if c.expires_at else False
        payload.append({
            "id": c.id,
            "animalName": c.animal_name,
            "animalType": c.animal_type or "Cow",
            "age": c.age,
            "milkCapacity": c.milk_capacity,
            "price": c.price,
            "villageName": c.village,
            "santeName": c.sante_name,
            "description": c.description,
            "image": c.image_url or "",
            "contactNumber": c.phone_number,
            "sellerName": seller_name,
            "sellerEmail": seller_email,
            "isExpired": is_expired,
            "status": "expired" if is_expired else "active",
            "expiresAt": c.expires_at.isoformat() if c.expires_at else "",
            "postedDate": c.created_at.isoformat() if c.created_at else "",
        })
        
    return json_response(
        success=True,
        message="Fetched all cattle listings successfully",
        data=payload
    )

@router.delete("/cattle/{cattle_id}")
async def delete_cattle_admin(
    cattle_id: int,
    admin_user: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a Sante cattle listing (Admin moderation)."""
    result = await db.execute(select(Cattle).where(Cattle.id == cattle_id))
    cattle = result.scalars().first()
    if not cattle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cattle listing {cattle_id} not found."
        )
    await db.delete(cattle)
    await db.commit()
    return json_response(
        success=True,
        message="Cattle listing deleted successfully."
    )

