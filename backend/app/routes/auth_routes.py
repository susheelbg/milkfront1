import re
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, OtpSendRequest, OtpVerifyRequest, TokenResponse, PasswordResetRequest
from app.schemas.user import UserResponse
from app.utils.response import json_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory store for pending registration data (simulates cache database like Redis)
# Maps phone number -> registration data dict
PENDING_REGISTRATIONS = {}

# In-memory store for pending password reset verification states
PENDING_PASSWORD_RESETS = {}

# In-memory store for rate limiting: maps phone -> list of timestamps
OTP_RATE_LIMITS = {}

def clean_and_format_indian_phone(phone: str) -> str:
    """
    Cleans the phone number and ensures it is a valid Indian mobile number in E.164 format (+91XXXXXXXXXX).
    Valid Indian mobile numbers start with 6, 7, 8, or 9 and are 10 digits long.
    """
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is required."
        )
        
    # Remove all whitespace, hyphens, parentheses, etc.
    cleaned = re.sub(r'[^\d+]', '', phone)
    
    # Check if starts with '+'
    if cleaned.startswith('+'):
        # E.164 format, must be +91 followed by 10 digits
        match = re.match(r'^\+91([6-9]\d{9})$', cleaned)
        if not match:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number format. Indian mobile numbers must start with +91 followed by 10 digits."
            )
        return cleaned
    
    # If no leading '+', check digits
    digits = re.sub(r'\D', '', cleaned)
    
    # Cases:
    # 1. 10 digits starting with 6-9 -> prepend +91
    if len(digits) == 10 and re.match(r'^[6-9]\d{9}$', digits):
        return f"+91{digits}"
        
    # 2. 11 digits starting with 0, followed by 10 digits starting with 6-9 -> prepend +91
    if len(digits) == 11 and digits.startswith('0'):
        local_num = digits[1:]
        if re.match(r'^[6-9]\d{9}$', local_num):
            return f"+91{local_num}"
            
    # 3. 12 digits starting with 91, followed by 10 digits starting with 6-9 -> prepend +
    if len(digits) == 12 and digits.startswith('91'):
        local_num = digits[2:]
        if re.match(r'^[6-9]\d{9}$', local_num):
            return f"+91{local_num}"
            
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid Indian mobile number. Please enter a valid 10-digit mobile number."
    )

def check_otp_rate_limit(phone: str):
    now = datetime.now(timezone.utc)
    timestamps = OTP_RATE_LIMITS.get(phone, [])
    # Filter out timestamps older than 5 minutes
    five_minutes_ago = now - timedelta(minutes=5)
    timestamps = [t for t in timestamps if t > five_minutes_ago]
    
    if len(timestamps) >= 3: # max 3 OTP sends per 5 minutes per phone number
        logger.warning(f"[RATE LIMIT] OTP limit reached for {phone}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please wait 5 minutes before trying again."
        )
        
    timestamps.append(now)
    OTP_RATE_LIMITS[phone] = timestamps


@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Validate Admin Access PIN
    if req.access_pin != settings.ACCESS_PIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Access PIN. Contact admin."
        )

    # Format and validate Indian number
    normalized_phone = clean_and_format_indian_phone(req.phone)

    # Check if user already exists in DB
    result = await db.execute(select(User).where(User.phone_number == normalized_phone))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is already registered in our system."
        )
        
    # Save the user in Supabase
    new_user = User(
        full_name=req.name,
        phone_number=normalized_phone,
        hashed_password=hash_password(req.password),
        address=req.address or "",
        village=req.villageName or "",
        role="user" if normalized_phone != "+917795056391" else "admin", # Susheel is Admin
        is_verified=True,
        phone_verified=True,
        consent_timestamp=datetime.fromisoformat(req.consent_timestamp.replace("Z", "+00:00")).replace(tzinfo=None) if req.consent_timestamp else datetime.now(timezone.utc).replace(tzinfo=None)
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return json_response(
        success=True,
        message="Farmer account created successfully.",
        data={"phone": normalized_phone}
    )

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Format and validate Indian number
    normalized_phone = clean_and_format_indian_phone(req.phone_number)

    result = await db.execute(select(User).where(User.phone_number == normalized_phone))
    user = result.scalars().first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password. Check demo credentials."
        )
        
    # Ensure user has completed phone verification
    if not user.phone_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your phone number has not been verified. Please verify your number first."
        )
        
    if user.account_status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended by administration."
        )
        
    if user.account_status == "deleted" or user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This account has been deleted."
        )
        
    # Create JWT access token
    access_token = create_access_token(data={"sub": user.phone_number})
    
    # Return user details alongside token
    user_payload = {
        "phone": user.phone_number,
        "name": user.full_name,
        "role": user.role,
        "address": user.address or "",
        "villageName": user.village or "",
        "language": user.language or "kn",
    }
    
    return json_response(
        success=True,
        message="Login successful",
        data={
            "token": {
                "access_token": access_token,
                "token_type": "bearer"
            },
            "user": user_payload
        }
    )

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    user_payload = {
        "phone": current_user.phone_number,
        "name": current_user.full_name,
        "role": current_user.role,
        "address": current_user.address or "",
        "villageName": current_user.village or "",
        "language": current_user.language or "kn",
        "is_verified": current_user.is_verified,
        "phone_verified": current_user.phone_verified,
        "created_at": current_user.created_at.isoformat(),
    }
    
    return json_response(
        success=True,
        message="Fetched current profile context successfully",
        data=user_payload
    )

@router.post("/forgot-password/reset")
async def forgot_password_reset(req: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    # Validate Admin Access PIN
    if req.access_pin != settings.ACCESS_PIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Access PIN. Contact admin."
        )

    # Format and validate Indian number
    normalized_phone = clean_and_format_indian_phone(req.phone)

    result = await db.execute(select(User).where(User.phone_number == normalized_phone))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    # Update password using hash function
    user.hashed_password = hash_password(req.password)
    await db.commit()
    
    return json_response(
        success=True,
        message="Password has been reset successfully.",
        data={"phone": normalized_phone}
    )
