import asyncio
import os
import httpx
from sqlalchemy import select
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.partner import PartnerProduct

BRAIN_DIR = "/Users/susheel/.gemini/antigravity-ide/brain/26a04922-a60c-4b15-85a4-5477152bf359"
LOCAL_IMAGE_PATH = os.path.join(BRAIN_DIR, "media__1791096250271.jpg")

async def upload_image_to_supabase():
    if not os.path.exists(LOCAL_IMAGE_PATH):
        print(f"[ERROR] Local product image file not found: {LOCAL_IMAGE_PATH}")
        return ""

    with open(LOCAL_IMAGE_PATH, "rb") as f:
        content = f.read()

    url_prefix = f"{settings.SUPABASE_URL}/storage/v1/object/milkmaatu-image"
    storage_path = "partners/tiwana/products/tiwana-8000/tiwana-8000.png"
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
            print(f"[SUCCESS] Tiwana 8000 product image uploaded to Supabase Storage: {public_url}")
            return public_url
        else:
            print(f"[ERROR] Upload failed HTTP {resp.status_code}: {resp.text}")
            return ""

async def update_database(new_image_url: str):
    async with SessionLocal() as db:
        res = await db.execute(select(PartnerProduct).where(PartnerProduct.name == "Tiwana 8000"))
        prod = res.scalars().first()
        if prod:
            prod.image_url = new_image_url
            await db.commit()
            print(f"[SUCCESS] Updated Tiwana 8000 image URL in DB to: {new_image_url}")
        else:
            print("[ERROR] 'Tiwana 8000' product record not found in DB.")

async def main():
    print("=== Updating Tiwana 8000 Product Image ===")
    img_url = await upload_image_to_supabase()
    if img_url:
        await update_database(img_url)

if __name__ == "__main__":
    asyncio.run(main())
