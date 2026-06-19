from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

# Bearer token extractor
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Extract and validate the JWT Bearer token, returning the database User object."""
    token = credentials.credentials
    
    try:
        payload = decode_access_token(token)
        phone: str = payload.get("sub")
        if not phone:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials token claims.",
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    # Query the user in database
    result = await db.execute(select(User).where(User.phone_number == phone))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in system database.",
        )
        
    return user

def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Assert that the authenticated user possesses admin privileges."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Administrative privileges required.",
        )
    return current_user

def get_current_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Assert that the authenticated user possesses super admin privileges."""
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Super Administrative privileges required.",
        )
    return current_user
