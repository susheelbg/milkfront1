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

class OtpSendRequest(BaseModel):
    phone: str = Field(..., description="Mobile number to send OTP to")

class OtpVerifyRequest(BaseModel):
    phone: str = Field(..., description="Mobile number being verified")
    otp: str = Field(..., min_length=4, max_length=4, description="WhatsApp OTP code (e.g. 1234)")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
