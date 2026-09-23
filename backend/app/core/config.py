import os
from typing import List
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
    DATABASE_URL: str = "sqlite+aiosqlite:///./milkmaatu.db"

    # Supabase Settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Initial Super Admin Bootstrap Credentials
    INITIAL_SUPER_ADMIN_EMAIL: str = ""
    INITIAL_SUPER_ADMIN_PASSWORD: str = ""

    # Cloudinary Config
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Gemini API settings
    GEMINI_API_KEY: str = ""

    # CORS Settings
    CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=env_path,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
