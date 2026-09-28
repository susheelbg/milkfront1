import time
import re
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_, and_, func

from app.core.database import get_db
from app.core.dependencies import get_current_user_optional, get_current_admin
from app.models.order import Order, OrderItem
from app.models.feed import Feed
from app.models.user import Profile
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdate
from app.utils.response import json_response

router = APIRouter(tags=["Orders Operations"])

@router.post("/orders")
async def place_order(
    req: OrderCreate,
    current_user: Optional[Profile] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Place a new cattle feed order. Deducts stock quantity and creates lines.
    If authenticated via Supabase Auth, links order to current_user.id (UUID).
    """
    if not req.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot place an order with an empty cart."
        )

    # 1. Verify products and compute correct total
    calculated_total = 0.0
    items_to_create = []

    for item in req.items:
        result = await db.execute(select(Feed).where(Feed.id == item.id))
        feed = result.scalars().first()
        
        if not feed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Feed product with ID {item.id} not found."
            )
            
        if feed.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {feed.title}. Available: {feed.stock_quantity}"
            )
            
        # Deduct stock
        feed.stock_quantity -= item.quantity
        
        # Calculate totals
        line_total = feed.price * item.quantity
        calculated_total += line_total
        
        # Build OrderItem model with product_name snapshot
        items_to_create.append(
            OrderItem(
                feed_id=feed.id,
                product_name=feed.title,
                quantity=item.quantity,
                price=feed.price
            )
        )

    # 2. Determine target user ID and create Order Header
    order_id = f"ORD-{int(time.time() * 1000)}"
    cust_name = (req.customerName or "").strip() or (current_user.name if current_user else None) or "Farmer"
    cust_phone = (req.phoneNumber or "").strip() or (current_user.phone if current_user else None) or "-"
    cust_addr = (req.address or "").strip() or (current_user.address if current_user else None) or ""

    user_id_to_assign = current_user.id if current_user else None

    # Self-heal current_user profile metadata
    if current_user:
        profile_updated = False
        if not current_user.phone and cust_phone and cust_phone != "-":
            current_user.phone = cust_phone
            profile_updated = True
        if not current_user.address and cust_addr:
            current_user.address = cust_addr
            profile_updated = True
        if not current_user.name and cust_name and cust_name != "Farmer":
            current_user.name = cust_name
            profile_updated = True
        if profile_updated:
            await db.commit()
    elif cust_phone and cust_phone != "-":
        # Check if phone belongs to an existing registered profile
        digits = extract_phone_digits(cust_phone)
        if digits:
            prof_res = await db.execute(
                select(Profile).where(
                    (Profile.phone == cust_phone) |
                    (Profile.phone.like(f"%{digits}"))
                )
            )
            matching_prof = prof_res.scalars().first()
            if matching_prof:
                user_id_to_assign = matching_prof.id

    new_order = Order(
        id=order_id,
        user_id=user_id_to_assign,
        total_amount=calculated_total,
        order_status="pending",
        delivery_address=cust_addr,
        village_name=req.villageName,
        customer_name=cust_name,
        phone_number=cust_phone,
        payment_status="pending"
    )
    
    # Associate lines
    for line in items_to_create:
        line.order_id = order_id
        new_order.items.append(line)

    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    
    # Reload with selectinload for response serialization
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.feed))
    )
    res = await db.execute(stmt)
    full_order = res.scalars().first()

    payload = OrderResponse.model_validate(full_order).model_dump()

    return json_response(
        success=True,
        message="Cattle feed order placed successfully",
        data=payload
    )

def extract_phone_digits(phone_str: Optional[str]) -> Optional[str]:
    if not phone_str:
        return None
    digits = re.sub(r"\D", "", phone_str)
    return digits[-10:] if len(digits) >= 10 else (digits if len(digits) >= 6 else None)

@router.get("/orders/my-orders")
async def get_my_orders(
    phone: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    userId: Optional[str] = Query(None),
    ids: Optional[str] = Query(None),
    current_user: Optional[Profile] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve purchase history for authenticated user or by phone/email/userId/order IDs.
    Ensures strict privacy: authenticated users see all their past orders,
    while orders assigned to other users are strictly protected.
    """
    id_list = [i.strip() for i in ids.split(",") if i.strip()] if ids else []
    clean_req_phone = phone.strip() if phone and phone.strip() else None
    clean_req_email = email.strip().lower() if email and email.strip() else None
    clean_req_user_id = userId.strip() if userId and userId.strip() else None

    # Multi-tier profile resolution: JWT -> userId -> email -> phone
    target_profile = current_user

    if not target_profile and clean_req_user_id:
        try:
            target_uuid = uuid.UUID(clean_req_user_id)
            prof_res = await db.execute(select(Profile).where(Profile.id == target_uuid))
            target_profile = prof_res.scalars().first()
        except ValueError:
            pass

    if not target_profile and clean_req_email:
        prof_res = await db.execute(select(Profile).where(func.lower(Profile.email) == clean_req_email))
        target_profile = prof_res.scalars().first()

    if not target_profile and clean_req_phone:
        req_digits = extract_phone_digits(clean_req_phone)
        if req_digits:
            prof_stmt = select(Profile).where(
                (Profile.phone == clean_req_phone) |
                (Profile.phone.like(f"%{req_digits}"))
            )
            prof_res = await db.execute(prof_stmt)
            target_profile = prof_res.scalars().first()

    if target_profile:
        # Authenticated or matched registered user:
        # 1. All orders already assigned to target_profile.id
        # 2. Unclaimed guest orders (user_id is None) matching user's phone, name, or saved order IDs
        user_phone = (target_profile.phone or "").strip()
        user_name = (target_profile.name or "").strip()
        phones_to_check = [p for p in set([user_phone, clean_req_phone]) if p]

        unclaimed_conditions = []
        if id_list:
            unclaimed_conditions.append(Order.id.in_(id_list))
        for p in phones_to_check:
            unclaimed_conditions.append(Order.phone_number == p)
            digits = extract_phone_digits(p)
            if digits:
                unclaimed_conditions.append(Order.phone_number.like(f"%{digits}"))
        if user_name and len(user_name) >= 3 and user_name.lower() != "farmer":
            unclaimed_conditions.append(func.lower(Order.customer_name) == user_name.lower())

        if unclaimed_conditions:
            cond = or_(
                Order.user_id == target_profile.id,
                and_(
                    Order.user_id.is_(None),
                    or_(*unclaimed_conditions)
                )
            )
        else:
            cond = (Order.user_id == target_profile.id)
    else:
        # Unauthenticated guest user with no registered profile: ONLY query orders where user_id IS NULL.
        guest_conditions = []
        if id_list:
            guest_conditions.append(Order.id.in_(id_list))
        if clean_req_phone:
            guest_conditions.append(Order.phone_number == clean_req_phone)
            digits = extract_phone_digits(clean_req_phone)
            if digits:
                guest_conditions.append(Order.phone_number.like(f"%{digits}"))

        if not guest_conditions:
            return json_response(
                success=True,
                message="No orders requested",
                data=[]
            )

        cond = and_(
            Order.user_id.is_(None),
            or_(*guest_conditions) if len(guest_conditions) > 1 else guest_conditions[0]
        )

    stmt = (
        select(Order)
        .where(cond)
        .options(
            selectinload(Order.profile),
            selectinload(Order.items).selectinload(OrderItem.feed)
        )
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(stmt)
    orders = result.scalars().all()

    # Self-heal: claim any unclaimed guest orders for target_profile
    if target_profile and orders:
        claimed_any = False
        for o in orders:
            if o.user_id is None:
                o.user_id = target_profile.id
                claimed_any = True
        if claimed_any:
            await db.commit()

    payload = [OrderResponse.model_validate(o).model_dump() for o in orders]
    return json_response(
        success=True,
        message="Fetched orders successfully",
        data=payload
    )

@router.put("/orders/{id}/cancel")
async def cancel_order(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    """Cancel a pending order by ID, restoring feed stock levels."""
    stmt = (
        select(Order)
        .where(Order.id == id)
        .options(selectinload(Order.items).selectinload(OrderItem.feed))
    )
    result = await db.execute(stmt)
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found."
        )
        
    if order.order_status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already cancelled."
        )
        
    # Restore stock
    for item in order.items:
        if item.feed:
            item.feed.stock_quantity += item.quantity
            
    order.order_status = "cancelled"
    await db.commit()
    await db.refresh(order)
    
    payload = OrderResponse.model_validate(order).model_dump()
    return json_response(
        success=True,
        message="Order cancelled successfully and stock restored.",
        data=payload
    )

