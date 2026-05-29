from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, OtpVerifyRequest, TokenResponse
from app.schemas.user import UserResponse
from app.utils.response import json_response

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory store for pending registration data (simulates cache database like Redis)
# Maps phone number -> registration data dict
PENDING_REGISTRATIONS = {}

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
        
    # Store registration details in cache memory temporarily waiting for OTP verification
    PENDING_REGISTRATIONS[req.phone] = {
        "name": req.name,
        "password": hash_password(req.password),
        "address": req.address or "",
        "villageName": req.villageName or "",
    }
    
    # In a real app, WhatsApp OTP API call would go here
    # E.g. whatsapp_service.send_otp(req.phone, otp="1234")
    print(f"[WHATSAPP GATEWAY SIMULATION] Sending OTP Code '1234' to {req.phone}")
    
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
            detail="Registration session expired. Please register again."
        )
        
    # User OTP verified successfully. Save the user in Supabase
    new_user = User(
        full_name=pending["name"],
        phone_number=req.phone,
        hashed_password=pending["password"],
        address=pending["address"],
        village=pending["villageName"],
        role="user" if req.phone != "+919876543210" else "admin", # Demo user is Admin
        is_verified=True
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Remove from pending store
    PENDING_REGISTRATIONS.pop(req.phone, None)
    
    return json_response(
        success=True,
        message="WhatsApp OTP verified successfully. Profile created.",
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
        
    # Create JWT access token
    access_token = create_access_token(data={"sub": user.phone_number})
    
    # Return user details alongside token
    user_payload = {
        "phone": user.phone_number,
        "name": user.full_name,
        "role": user.role,
        "address": user.address or "",
        "villageName": user.village or "",
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
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at.isoformat(),
    }
    
    return json_response(
        success=True,
        message="Fetched current profile context successfully",
        data=user_payload
    )
