import asyncio
import os
import httpx
from sqlalchemy import select
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.partner import Partner
from app.services import partner_service

BRAIN_DIR = "/Users/susheel/.gemini/antigravity-ide/brain/26a04922-a60c-4b15-85a4-5477152bf359"
LOCAL_LOGO_PATH = os.path.join(BRAIN_DIR, "media__1791095936974.jpg")

async def upload_logo_to_supabase():
    if not os.path.exists(LOCAL_LOGO_PATH):
        print(f"[ERROR] Local logo file not found: {LOCAL_LOGO_PATH}")
        return ""

    with open(LOCAL_LOGO_PATH, "rb") as f:
        content = f.read()

    url_prefix = f"{settings.SUPABASE_URL}/storage/v1/object/milkmaatu-image"
    storage_path = "partners/tiwana/logo/tiwana-logo.png"
    public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/milkmaatu-image/{storage_path}"

    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "x-upsert": "true",
        "Content-Type": "image/jpeg"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        target_url = f"{url_prefix}/{storage_path}"
        resp = await client.post(target_url, content=content, headers=headers)
        if resp.status_code in [200, 201]:
            print(f"[SUCCESS] Logo uploaded to Supabase Storage: {public_url}")
            return public_url
        else:
            print(f"[ERROR] Upload failed HTTP {resp.status_code}: {resp.text}")
            return ""

async def update_database(new_logo_url: str):
    async with SessionLocal() as db:
        res = await db.execute(select(Partner).where(Partner.slug == "tiwana"))
        partner = res.scalars().first()
        if partner:
            partner.logo_url = new_logo_url
            await db.commit()
            print(f"[SUCCESS] Updated Tiwana logo URL in DB to: {new_logo_url}")
        else:
            print("[ERROR] Tiwana partner record not found in DB.")

async def main():
    print("=== Updating Tiwana Nutrition Logo ===")
    logo_url = await upload_logo_to_supabase()
    if logo_url:
        await update_database(logo_url)

if __name__ == "__main__":
    asyncio.run(main())
