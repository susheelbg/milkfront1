import uuid
import logging
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import get_db
from app.core.auth import verify_supabase_jwt
from app.models.user import Profile, User

logger = logging.getLogger(__name__)

security_required = HTTPBearer(auto_error=True)
security_optional = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
    db: AsyncSession = Depends(get_db),
) -> Optional[Profile]:
    """
    Extracts and validates Supabase JWT if present.
    Returns the Profile or None if unauthenticated.
    """
    if not credentials or not credentials.credentials:
        return None

    try:
        payload = verify_supabase_jwt(credentials.credentials)
        sub = payload.get("sub")
        if not sub:
            return None

        user_uuid = uuid.UUID(sub)
        result = await db.execute(select(Profile).where(Profile.id == user_uuid))
        profile = result.scalars().first()

        admin_email = (settings.INITIAL_SUPER_ADMIN_EMAIL or "").strip().lower()

        if profile:
            # Self-healing: if email matches configured Super Admin, ensure super_admin role
            if admin_email and profile.email and profile.email.strip().lower() == admin_email:
                if profile.role != "super_admin":
                    profile.role = "super_admin"
                    await db.commit()
                    await db.refresh(profile)
            return profile

        # If profile does not exist yet, create default user profile
        email = payload.get("email")
        user_metadata = payload.get("user_metadata", {})
        name = user_metadata.get("name") or user_metadata.get("full_name")
        phone = user_metadata.get("phone") or user_metadata.get("phone_number")
        address = user_metadata.get("address")

        is_super = bool(admin_email and email and email.strip().lower() == admin_email)
        assigned_role = "super_admin" if is_super else "user"

        profile = Profile(
            id=user_uuid,
            email=email,
            name=name,
            phone=phone,
            address=address,
            role=assigned_role,
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

        return profile
    except Exception as e:
        logger.debug(f"Optional auth failed: {e}")
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_required),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    """
    Validates Supabase JWT and returns the authenticated user's Profile.
    Raises 401 if missing, invalid, or expired.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_supabase_jwt(credentials.credentials)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing subject identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid subject UUID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(Profile).where(Profile.id == user_uuid))
    profile = result.scalars().first()

    admin_email = (settings.INITIAL_SUPER_ADMIN_EMAIL or "").strip().lower()

    if profile:
        # Self-healing: if email matches configured Super Admin, ensure super_admin role
        if admin_email and profile.email and profile.email.strip().lower() == admin_email:
            if profile.role != "super_admin":
                profile.role = "super_admin"
                await db.commit()
                await db.refresh(profile)
        return profile

    # Profile does not exist yet: create it
    email = payload.get("email")
    user_metadata = payload.get("user_metadata", {})
    name = user_metadata.get("name") or user_metadata.get("full_name")
    phone = user_metadata.get("phone") or user_metadata.get("phone_number")
    address = user_metadata.get("address")

    is_super = bool(admin_email and email and email.strip().lower() == admin_email)
    assigned_role = "super_admin" if is_super else "user"

    profile = Profile(
        id=user_uuid,
        email=email,
        name=name,
        phone=phone,
        address=address,
        role=assigned_role,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return profile

async def get_current_admin(
    current_user: Profile = Depends(get_current_user),
) -> Profile:
    """
    Asserts that the current user has either 'admin' or 'super_admin' role.
    """
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin or Super Admin privileges required",
        )
    return current_user

async def get_current_super_admin(
    current_user: Profile = Depends(get_current_user),
) -> Profile:
    """
    Asserts that the current user has 'super_admin' role.
    """
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Super Admin privileges required",
        )
    return current_user
