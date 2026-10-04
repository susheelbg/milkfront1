import asyncio
import os
import httpx
from app.core.config import settings
from app.services import partner_service as svc
from sqlalchemy import select
from app.models.partner import PartnerProduct

LOCAL_FILE = "/Users/susheel/.gemini/antigravity-ide/brain/26a04922-a60c-4b15-85a4-5477152bf359/media__1791094436081.jpg"

async def upload_and_update():
    if not os.path.exists(LOCAL_FILE):
        print(f"[ERROR] File not found: {LOCAL_FILE}")
        return

    with open(LOCAL_FILE, "rb") as f:
        content = f.read()

    url_prefix = f"{settings.SUPABASE_URL}/storage/v1/object/milkmaatu-image"
    
    paths = [
        "partners/godrej/products/godrej-bypro-plus/godrej-bypro-plus.jpg",
        "partners/godrej/products/godrej-bypro-plus/godrej-bypro-plus.png"
    ]

    verified_url = ""

    async with httpx.AsyncClient(timeout=30.0) as client:
        for storage_path in paths:
            headers = {
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "x-upsert": "true",
                "Content-Type": "image/jpeg"
            }
            target_url = f"{url_prefix}/{storage_path}"
            resp = await client.post(target_url, content=content, headers=headers)
            print(f"[UPLOAD] {storage_path} -> HTTP {resp.status_code}")

            public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/milkmaatu-image/{storage_path}"
            verify_resp = await client.get(public_url)
            if verify_resp.status_code == 200:
                print(f"[VERIFIED] {public_url}")
                verified_url = public_url

    if not verified_url:
        print("[ERROR] Verification failed!")
        return

    # Update database record in PostgreSQL
    async with svc.SessionLocal() as db:
        res = await db.execute(select(PartnerProduct).where(PartnerProduct.name == "Godrej Bypro Plus"))
        prod = res.scalars().first()
        if prod:
            prod.image_url = verified_url
            prod.image_status = "approved"
            prod.needs_review = False
            prod.review_note = None
            await db.commit()
            print(f"[DB UPDATED] Godrej Bypro Plus image_url set to {verified_url}")
        else:
            print("[ERROR] Godrej Bypro Plus not found in DB")

if __name__ == "__main__":
    asyncio.run(upload_and_update())
