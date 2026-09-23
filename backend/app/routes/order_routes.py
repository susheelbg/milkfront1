import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_

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
        
        # Build OrderItem model
        items_to_create.append(
            OrderItem(
                feed_id=feed.id,
                quantity=item.quantity,
                price=feed.price
            )
        )

    # 2. Create Order Header linked to user UUID if authenticated
    order_id = f"ORD-{int(time.time() * 1000)}"
    new_order = Order(
        id=order_id,
        user_id=current_user.id if current_user else None,
        total_amount=calculated_total,
        order_status="pending",
        delivery_address=req.address,
        village_name=req.villageName,
        customer_name=req.customerName,
        phone_number=req.phoneNumber,
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

@router.get("/orders/my-orders")
async def get_my_orders(
    phone: Optional[str] = Query(None),
    ids: Optional[str] = Query(None),
    current_user: Optional[Profile] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve purchase history for authenticated user or by phone/order IDs.
    """
    conditions = []
    
    if current_user:
        conditions.append(Order.user_id == current_user.id)
        if current_user.phone:
            conditions.append(Order.phone_number == current_user.phone)
            
    if ids:
        id_list = [i.strip() for i in ids.split(",") if i.strip()]
        if id_list:
            conditions.append(Order.id.in_(id_list))
            
    if phone and phone.strip():
        clean_phone = phone.strip()
        conditions.append(Order.phone_number == clean_phone)
        
    if not conditions:
        return json_response(
            success=True,
            message="No orders requested",
            data=[]
        )
        
    stmt = (
        select(Order)
        .where(or_(*conditions) if len(conditions) > 1 else conditions[0])
        .options(selectinload(Order.items).selectinload(OrderItem.feed))
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(stmt)
    orders = result.scalars().all()
    
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

# --- ADMIN WRITE ENDPOINTS (Protected by Supabase Auth Admin Role) ---

@router.get("/admin/orders")
async def get_all_orders(
    admin_user: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all orders placed across the system (Admin only)."""
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

@router.put("/admin/orders/{id}/status")
async def update_order_status(
    id: str,
    req: OrderUpdate,
    admin_user: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Modify the dispatch status of an order (Admin only)."""
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
        
    order.order_status = req.status
    await db.commit()
    
    reload_stmt = (
        select(Order)
        .where(Order.id == id)
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
