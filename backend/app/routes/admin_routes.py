from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.models.feed import Feed
from app.models.order import Order
from app.models.cattle import Cattle
from app.schemas.user import UserResponse
from app.utils.response import json_response

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/stats")
async def get_admin_stats(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve administrative metrics and analytics summaries."""
    # 1. Total users count
    users_res = await db.execute(select(func.count(User.id)))
    total_users = users_res.scalar_one()

    # 2. Total feeds count
    feeds_res = await db.execute(select(func.count(Feed.id)))
    total_feeds = feeds_res.scalar_one()

    # 3. Total orders count
    orders_res = await db.execute(select(func.count(Order.id)))
    total_orders = orders_res.scalar_one()

    # 4. Active cattle posts
    current_time = datetime.now(timezone.utc)
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
        "ordersCount": total_orders,
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
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve registered users in system (Admin only)."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    
    payload = [UserResponse.model_validate(u).model_dump(by_alias=True) for u in users]
    
    return json_response(
        success=True,
        message="Fetched users directory successfully",
        data=payload
    )
