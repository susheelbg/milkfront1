from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, OtpSendRequest, OtpVerifyRequest, TokenResponse, PasswordResetRequest
from app.schemas.user import UserResponse
from app.utils.response import json_response
from app.services.otp import otp_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory store for pending registration data (simulates cache database like Redis)
# Maps phone number -> registration data dict
PENDING_REGISTRATIONS = {}

# In-memory store for pending password reset verification states
PENDING_PASSWORD_RESETS = {}

@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if user already exists in DB
    result = await db.execute(select(User).where(User.phone_number == req.phone))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is already registered in our system."
        )
        
    pending = PENDING_REGISTRATIONS.get(req.phone)
    if not pending or not pending.get("verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP verification required before completing registration."
        )
        
    # Save the user in Supabase
    new_user = User(
        full_name=req.name,
        phone_number=req.phone,
        hashed_password=hash_password(req.password),
        address=req.address or "",
        village=req.villageName or "",
        role="user" if req.phone != "+917795056391" else "admin", # Susheel is Admin
        is_verified=True,
        consent_timestamp=datetime.fromisoformat(req.consent_timestamp) if req.consent_timestamp else datetime.now(timezone.utc).replace(tzinfo=None)
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Remove from pending store
    PENDING_REGISTRATIONS.pop(req.phone, None)
    
    return json_response(
        success=True,
        message="Farmer account created successfully.",
        data={"phone": req.phone}
    )

@router.post("/send-otp")
async def send_otp(req: OtpSendRequest):
    print(f"[WHATSAPP GATEWAY SIMULATION] Sending OTP Code '1234' to {req.phone}")
    PENDING_REGISTRATIONS[req.phone] = {"verified": False}
    return json_response(
        success=True,
        message="WhatsApp mock verification OTP code sent. Use code '1234'.",
        data={"phone": req.phone}
    )

@router.post("/verify-otp")
async def verify_otp(req: OtpVerifyRequest, db: AsyncSession = Depends(get_db)):
    if req.otp != "1234":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP verification code. Please enter 1234."
        )
        
    pending = PENDING_REGISTRATIONS.get(req.phone)
    if not pending:
        # Check if the user is already registered
        result = await db.execute(select(User).where(User.phone_number == req.phone))
        if result.scalars().first():
            return json_response(success=True, message="Phone already verified.", data={"phone": req.phone})
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration session expired. Please send OTP again."
        )
        
    pending["verified"] = True
    
    return json_response(
        success=True,
        message="WhatsApp OTP verified successfully.",
        data={"phone": req.phone}
    )

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone_number == req.phone_number))
    user = result.scalars().first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password. Check demo credentials."
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
        "created_at": current_user.created_at.isoformat(),
    }
    
    return json_response(
        success=True,
        message="Fetched current profile context successfully",
        data=user_payload
    )

@router.post("/forgot-password/request-otp")
async def forgot_password_request_otp(req: OtpSendRequest, db: AsyncSession = Depends(get_db)):
    # Verify phone exists in the database
    result = await db.execute(select(User).where(User.phone_number == req.phone))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number is not registered."
        )
    
    # Send OTP using the abstraction service
    otp_service.send_otp(req.phone)
    PENDING_PASSWORD_RESETS[req.phone] = {"verified": False}
    
    return json_response(
        success=True,
        message="Forgot password OTP sent via WhatsApp.",
        data={"phone": req.phone}
    )

@router.post("/forgot-password/verify-otp")
async def forgot_password_verify_otp(req: OtpVerifyRequest):
    # Verify using the abstraction service
    if not otp_service.verify_otp(req.phone, req.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP verification code. Please enter 1234."
        )
    
    # Check if we have a request tracking state
    pending = PENDING_PASSWORD_RESETS.get(req.phone)
    if not pending:
        PENDING_PASSWORD_RESETS[req.phone] = {}
        pending = PENDING_PASSWORD_RESETS[req.phone]
        
    pending["verified"] = True
    
    return json_response(
        success=True,
        message="WhatsApp OTP verified successfully for password reset.",
        data={"phone": req.phone}
    )

@router.post("/forgot-password/reset")
async def forgot_password_reset(req: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    pending = PENDING_PASSWORD_RESETS.get(req.phone)
    if not pending or not pending.get("verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP verification is required before resetting password."
        )
    
    result = await db.execute(select(User).where(User.phone_number == req.phone))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    # Update password using hash function
    user.hashed_password = hash_password(req.password)
    await db.commit()
    
    # Clean up pending state
    PENDING_PASSWORD_RESETS.pop(req.phone, None)
    
    return json_response(
        success=True,
        message="Password has been reset successfully.",
        data={"phone": req.phone}
    )

