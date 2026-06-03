import os
from typing import List
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Explicitly load .env file from the backend root folder
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))
load_dotenv(env_path)

class Settings(BaseSettings):
    # App Settings
    API_PREFIX: str = "/api"
    PROJECT_NAME: str = "MilkMaatu Backend API"
    
    # Database Settings
    # Fallback to local async sqlite if not specified
    DATABASE_URL: str = "sqlite+aiosqlite:///./milkmaatu.db"

    # Security Settings
    JWT_SECRET: str = "super_secret_jwt_signature_key_change_me_in_production_123456"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 Hours

    # Cloudinary Config
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Mock OTP Config
    MOCK_OTP: str = "1234"

    # Gemini API settings
    GEMINI_API_KEY: str = ""

    # CORS Settings
    # Load comma-separated origins from environment or default to allow all
    CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
