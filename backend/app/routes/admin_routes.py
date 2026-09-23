import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import func
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
from app.utils.response import json_response

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/stats")
async def get_admin_stats(
    admin_user: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve administrative metrics and analytics summaries."""
    # 1. Total profiles count
    users_res = await db.execute(select(func.count(Profile.id)))
    total_users = users_res.scalar_one()

    # 2. Total feeds count
    feeds_res = await db.execute(select(func.count(Feed.id)))
    total_feeds = feeds_res.scalar_one()

    # 3. Total orders and pending orders
    all_orders_res = await db.execute(select(func.count(Order.id)))
    total_all_orders = all_orders_res.scalar_one()

    orders_res = await db.execute(
        select(func.count(Order.id)).where(Order.order_status == "pending")
    )
    total_pending_orders = orders_res.scalar_one()

    # 4. Active cattle posts
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    cattle_res = await db.execute(
        select(func.count(Cattle.id)).where(Cattle.expires_at > current_time)
    )
    active_cattle_posts = cattle_res.scalar_one()

    # 5. Total revenue (sum total_amount for non-cancelled orders)
    revenue_res = await db.execute(
        select(func.sum(Order.total_amount)).where(Order.order_status != "cancelled")
    )
    total_revenue = revenue_res.scalar() or 0.0

    stats_payload = {
        "usersCount": total_users,
        "feedsCount": total_feeds,
        "ordersCount": total_all_orders,
        "pendingOrdersCount": total_pending_orders,
        "cattleCount": active_cattle_posts,
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
        .options(selectinload(Order.items).selectinload(OrderItem.feed))
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
        .options(selectinload(Order.items).selectinload(OrderItem.feed))
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
        .options(selectinload(Order.items).selectinload(OrderItem.feed))
    )
    reload_res = await db.execute(reload_stmt)
    updated_order = reload_res.scalars().first()
    
    payload = OrderResponse.model_validate(updated_order).model_dump()
    return json_response(
        success=True,
        message="Order status updated successfully",
        data=payload
    )
