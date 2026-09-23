import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.order import Order, OrderItem
from app.models.feed import Feed
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdate
from app.utils.response import json_response

router = APIRouter(tags=["Orders Operations"])

async def get_or_create_farmer_user(
    db: AsyncSession,
    phone: str,
    name: Optional[str] = None,
    village: Optional[str] = None,
    address: Optional[str] = None
) -> int:
    clean_phone = phone.strip() if phone else "guest_farmer"
    res = await db.execute(select(User).where(User.phone_number == clean_phone))
    user = res.scalars().first()
    if not user:
        user = User(
            full_name=name or "Farmer",
            phone_number=clean_phone,
            hashed_password="guest_no_password",
            role="user",
            village=village or "",
            address=address or "",
            is_verified=True,
            phone_verified=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        updated = False
        if name and user.full_name in ("Farmer", "", None):
            user.full_name = name
            updated = True
        if village and not user.village:
            user.village = village
            updated = True
        if address and not user.address:
            user.address = address
            updated = True
        if updated:
            await db.commit()
    return user.id

@router.post("/orders")
async def place_order(
    req: OrderCreate,
    db: AsyncSession = Depends(get_db)
):
    """Place a new cattle feed order without requiring user login. Deducts stock quantity and creates lines."""
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

    # 2. Get or create farmer record using customer details (no login needed)
    user_id = await get_or_create_farmer_user(
        db,
        phone=req.phoneNumber,
        name=req.customerName,
        village=req.villageName,
        address=req.address
    )

    # 3. Create Order Header
    order_id = f"ORD-{int(time.time() * 1000)}"
    new_order = Order(
        id=order_id,
        user_id=user_id,
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
    db: AsyncSession = Depends(get_db)
):
    """Retrieve purchase history using phone number or order IDs without requiring user login."""
    conditions = []
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
        message="Fetched farmer orders successfully",
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

# --- ADMIN WRITE ENDPOINTS (Protected by Admin PIN / Admin check) ---

@router.get("/admin/orders")
async def get_all_orders(
    admin_user: User = Depends(get_current_admin),
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
    admin_user: User = Depends(get_current_admin),
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
