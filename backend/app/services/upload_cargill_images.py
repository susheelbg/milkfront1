import asyncio
import os
import httpx
from app.core.config import settings
from app.services import partner_service as svc
from sqlalchemy import select
from app.models.partner import PartnerProduct

BRAIN_DIR = "/Users/susheel/.gemini/antigravity-ide/brain/26a04922-a60c-4b15-85a4-5477152bf359"

PRODUCT_IMAGE_MAPPING = [
    ("Milkgen8000", os.path.join(BRAIN_DIR, "media__1791062826536.png"), "partners/cargill/products/milkgen8000/milkgen8000.png"),
    ("Milkgen10000", os.path.join(BRAIN_DIR, "media__1791059022898.png"), "partners/cargill/products/milkgen10000/milkgen10000.png"),
    ("Pragati", os.path.join(BRAIN_DIR, "pragati_cargill.png"), "partners/cargill/products/pragati/pragati.png"),
    ("Milkgen5000", os.path.join(BRAIN_DIR, "media__1791058973997.png"), "partners/cargill/products/milkgen5000/milkgen5000.png"),
    ("Buffgen4000", os.path.join(BRAIN_DIR, "media__1791058955128.png"), "partners/cargill/products/buffgen4000/buffgen4000.png"),
    ("Bullet", os.path.join(BRAIN_DIR, "media__1791059002758.png"), "partners/cargill/products/bullet/bullet.png"),
]

async def upload_and_verify():
    await svc.ensure_partner_schema_and_seed()
    
    url_prefix = f"{settings.SUPABASE_URL}/storage/v1/object/milkmaatu-image"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "x-upsert": "true",
        "Content-Type": "image/png"
    }

    verified_urls = {}

    async with httpx.AsyncClient(timeout=30.0) as client:
        for name, local_file, storage_path in PRODUCT_IMAGE_MAPPING:
            if not os.path.exists(local_file):
                print(f"[ERROR] Local temp file missing for {name}: {local_file}")
                continue
            
            with open(local_file, "rb") as f:
                content = f.read()

            target_url = f"{url_prefix}/{storage_path}"
            resp = await client.post(target_url, content=content, headers=headers)
            
            if resp.status_code not in [200, 201]:
                print(f"[ERROR] Upload failed for {name} (HTTP {resp.status_code}): {resp.text}")
                continue

            public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/milkmaatu-image/{storage_path}"
            
            # Verify public accessibility before DB update
            verify_resp = await client.get(public_url)
            if verify_resp.status_code == 200:
                verified_urls[name] = public_url
                print(f"[VERIFIED & ACCESSIBLE] {name} -> {public_url}")
            else:
                print(f"[ERROR] Public URL verification failed for {name} (HTTP {verify_resp.status_code})")

    # Update database records ONLY for verified successful uploads
    async with svc.SessionLocal() as db:
        for name, public_url in verified_urls.items():
            res = await db.execute(select(PartnerProduct).where(PartnerProduct.name == name))
            product = res.scalars().first()
            if product:
                product.image_url = public_url
                product.image_status = "approved"
                product.needs_review = False
                product.review_note = None
                print(f"[DB UPDATED] {name} set to approved with {public_url}")
        await db.commit()

if __name__ == "__main__":
    asyncio.run(upload_and_verify())
