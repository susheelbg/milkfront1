from typing import Optional
from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    phone_number: str = Field(..., description="10-digit number with country code, e.g. +919876543210")
    password: str = Field(..., min_length=6, description="User password")

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    phone: str = Field(..., description="E.g. +919876543210")
    password: str = Field(..., min_length=6)
    address: str = Field(None, description="Optional street address details")
    villageName: str = Field(None, description="Optional village name")
    consent_timestamp: Optional[str] = Field(None, description="Timestamp when user agreed to T&C / Privacy Policy")
    access_pin: str = Field(..., description="Access PIN value")

class OtpSendRequest(BaseModel):
    phone: str = Field(..., description="Mobile number to send OTP to")

class OtpVerifyRequest(BaseModel):
    phone: str = Field(..., description="Mobile number being verified")
    otp: str = Field(..., min_length=4, max_length=10, description="SMS OTP code (e.g. 123456)")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class PasswordResetRequest(BaseModel):
    phone: str = Field(..., description="Verified mobile number")
    password: str = Field(..., min_length=6, description="New password")
    access_pin: str = Field(..., description="Access PIN value")

