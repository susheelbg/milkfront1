import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Explicitly load .env file from the backend root folder if available
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))
if os.path.exists(env_path):
    load_dotenv(env_path)

# Fallback values for active production Supabase project
DEFAULT_SUPABASE_URL = "https://ywgjsvrvyokzkhtyxqrt.supabase.co"
DEFAULT_SUPABASE_JWT_SECRET = "wSbB7VAzhGcGtv+7/ZdN/ycUBZm5OBanU+ZxclCdkqzoFAWg3Pk7hPKe+RvmPv0g8boF6eYdGutBPY+UOTysVQ=="
DEFAULT_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Z2pzdnJ2eW9remtodHl4cXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTg4OTM5NywiZXhwIjoyMDk1NDY1Mzk3fQ.lWD7fjrH_lK8qBeTToZH0aXhf5l-OJo8KaF__CrRzq8"
DEFAULT_SUPER_ADMIN_EMAIL = "jeeva451451@gmail.com"
DEFAULT_SUPER_ADMIN_PASSWORD = "Susheel@24"

class Settings(BaseSettings):
    # App Settings
    API_PREFIX: str = "/api"
    PROJECT_NAME: str = "MilkMaatu Backend API"
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL") or "sqlite+aiosqlite:///./milkmaatu.db"

    # Supabase Settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or DEFAULT_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or DEFAULT_SERVICE_ROLE_KEY
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET") or DEFAULT_SUPABASE_JWT_SECRET

    # Initial Super Admin Bootstrap Credentials
    INITIAL_SUPER_ADMIN_EMAIL: str = os.getenv("INITIAL_SUPER_ADMIN_EMAIL") or DEFAULT_SUPER_ADMIN_EMAIL
    INITIAL_SUPER_ADMIN_PASSWORD: str = os.getenv("INITIAL_SUPER_ADMIN_PASSWORD") or DEFAULT_SUPER_ADMIN_PASSWORD

    # Cloudinary Config
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME") or "drj9c8kpj"
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY") or "634265763474295"
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET") or "J96eghvyo40pqfTBMWQmkuFESis"

    # Gemini API settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") or ""

    # CORS Settings
    CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=env_path if os.path.exists(env_path) else None,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

