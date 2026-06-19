from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_super_admin
from app.core.security import hash_password
from app.models.user import User
from app.models.feed import Feed
from app.models.order import Order
from app.models.cattle import Cattle
from app.schemas.user import UserResponse, AdminCreate, UserRoleUpdate
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

    # 3. Pending orders count (only status == "pending")
    orders_res = await db.execute(
        select(func.count(Order.id)).where(Order.order_status == "pending")
    )
    total_orders = orders_res.scalar_one()

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


@router.post("/create-admin")
async def create_new_admin(
    req: AdminCreate,
    super_admin: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new administrative user (Super Admin only)."""
    # Normalize phone
    normalized_phone = req.phone.strip()
    if len(normalized_phone) == 10 and not normalized_phone.startswith("+"):
        normalized_phone = f"+91{normalized_phone}"
    elif not normalized_phone.startswith("+"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number must start with + followed by country code (e.g. +91)."
        )

    # Check if user already exists
    result = await db.execute(select(User).where(User.phone_number == normalized_phone))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this phone number already exists."
        )

    new_admin = User(
        full_name=req.name,
        phone_number=normalized_phone,
        hashed_password=hash_password(req.password),
        role="admin",
        address=req.address or "",
        village=req.villageName or "",
        is_verified=True,
        phone_verified=True,
    )
    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)

    return json_response(
        success=True,
        message="Admin created successfully.",
        data=UserResponse.model_validate(new_admin).model_dump(by_alias=True)
    )


@router.put("/users/{phone}/role")
async def update_user_role(
    phone: str,
    req: UserRoleUpdate,
    super_admin: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Promote or demote a user's role (Super Admin only)."""
    # Normalize phone
    normalized_phone = phone.strip()
    if len(normalized_phone) == 10 and not normalized_phone.startswith("+"):
        normalized_phone = f"+91{normalized_phone}"

    # Verify target is not the super admin themselves
    if normalized_phone == super_admin.phone_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own super admin role."
        )

    # Validate roles allowed to set: only 'admin' or 'user'
    if req.role not in ("admin", "user"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'admin' or 'user'."
        )

    result = await db.execute(select(User).where(User.phone_number == normalized_phone))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    user.role = req.role
    await db.commit()
    await db.refresh(user)

    return json_response(
        success=True,
        message=f"User role updated to {req.role} successfully.",
        data=UserResponse.model_validate(user).model_dump(by_alias=True)
    )

