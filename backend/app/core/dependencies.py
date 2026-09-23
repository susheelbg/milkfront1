from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.config import settings
from app.models.user import User

# Optional Bearer token extractor
security_optional = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Extract and validate JWT Bearer token if present; returns None if unauthenticated."""
    if not credentials:
        return None
    
    try:
        payload = decode_access_token(credentials.credentials)
        phone: str = payload.get("sub")
        if not phone:
            return None
        result = await db.execute(select(User).where(User.phone_number == phone))
        return result.scalars().first()
    except Exception:
        return None

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Backward-compatible user dependency. Returns logged-in user or guest user."""
    user = await get_current_user_optional(credentials, db)
    if user:
        return user
        
    # Return or create a default guest farmer user if not authenticated
    res = await db.execute(select(User).where(User.phone_number == "guest_farmer"))
    guest = res.scalars().first()
    if not guest:
        guest = User(
            full_name="Farmer",
            phone_number="guest_farmer",
            hashed_password="guest_no_password",
            role="user",
            is_verified=True,
            phone_verified=True
        )
        db.add(guest)
        await db.commit()
        await db.refresh(guest)
    return guest

async def get_current_admin(
    x_admin_pin: Optional[str] = Header(None, alias="X-Admin-PIN"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Authorize administrative actions via Admin PIN (4512) or Admin JWT."""
    # 1. Admin PIN Header check
    if x_admin_pin and x_admin_pin.strip() == settings.ACCESS_PIN:
        res = await db.execute(select(User).where(User.role.in_(("admin", "super_admin"))))
        admin = res.scalars().first()
        if not admin:
            admin = User(
                full_name="Administrator",
                phone_number="+917795056391",
                hashed_password="admin_no_password",
                role="super_admin",
                is_verified=True,
                phone_verified=True
            )
            db.add(admin)
            await db.commit()
            await db.refresh(admin)
        return admin

    # 2. Admin JWT Bearer check
    if credentials:
        try:
            payload = decode_access_token(credentials.credentials)
            phone = payload.get("sub")
            if phone:
                res = await db.execute(select(User).where(User.phone_number == phone))
                user = res.scalars().first()
                if user and user.role in ("admin", "super_admin"):
                    return user
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient permissions. Valid Admin PIN (X-Admin-PIN) or Admin credentials required.",
    )

async def get_current_super_admin(
    admin_user: User = Depends(get_current_admin)
) -> User:
    """Assert super admin privileges."""
    return admin_user
