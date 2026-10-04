import asyncio
import os
import httpx
from sqlalchemy import select
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.partner import PartnerProduct

BRAIN_DIR = "/Users/susheel/.gemini/antigravity-ide/brain/26a04922-a60c-4b15-85a4-5477152bf359/tiwana_official_test"

# Exact 1-to-1 official artwork mapping extracted from tiwana.in
OFFICIAL_PRODUCTS_MAP = [
    ("Tiwana 8000", "tiwana-8000", "2025_04_BAG-Tiwana-All-Artwork-50-KG-ok.pdf-2.png"),
    ("Tiwana 10000", "tiwana-10000", "2026_04_BAG-Tiwana-All-Artwork-50-KG-ok.pdf-5.png"),
    ("Milk Plus", "milk-plus", "2026_04_BAG-Tiwana-All-Artwork-50-KG-ok.pdf-3.png"),
    ("Silage Plus", "silage-plus", "2026_04_BAG-Tiwana-All-Artwork-50-KG-ok.pdf-4.png"),
    ("T-20 Dry", "t20-dry", "2025_04_BAG-Tiwana-All-Artwork-50-KG-ok.pdf-11.png"),
    ("T-20 Fresher", "t20-fresher", "2025_04_BAG-Tiwana-All-Artwork-50-KG-ok.pdf-12.png"),
    ("Dry Bovine", "dry-bovine", "2025_04_BAG-Tiwana-All-Artwork-50-KG-ok.pdf-10.png"),
    ("Calf Starter Plus", "calf-starter-plus", "2025_04_BAG-Tiwana-All-Artwork-50-KG-ok.pdf-6.png"),
    ("Calf Grower", "calf-grower", "2026_04_BAG-Tiwana-All-Artwork-50-KG-ok.pdf-7.png"),
    ("35 Protein", "35-protein", "2026_04_BAG-Tiwana-All-Artwork-50-KG-ok.pdf-8.png"),
]

async def upload_image_to_supabase(client: httpx.AsyncClient, local_file: str, slug: str) -> str:
    local_path = os.path.join(BRAIN_DIR, local_file)
    if not os.path.exists(local_path):
        print(f"[ERROR] Missing file: {local_path}")
        return ""

    with open(local_path, "rb") as f:
        content = f.read()

    url_prefix = f"{settings.SUPABASE_URL}/storage/v1/object/milkmaatu-image"
    storage_path = f"partners/tiwana/products/{slug}/{slug}.png"
    public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/milkmaatu-image/{storage_path}"

    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "x-upsert": "true",
        "Content-Type": "image/png"
    }

    target_url = f"{url_prefix}/{storage_path}"
    resp = await client.post(target_url, content=content, headers=headers)
    if resp.status_code in [200, 201]:
        print(f"[VERIFIED 200] {slug} -> {public_url}")
        return public_url
    else:
        print(f"[ERROR] Upload failed for {slug} (HTTP {resp.status_code}): {resp.text}")
        return ""

async def update_database(url_map: dict):
    async with SessionLocal() as db:
        res = await db.execute(select(PartnerProduct))
        products = res.scalars().all()
        updated_count = 0
        for p in products:
            if p.name in url_map and url_map[p.name]:
                p.image_url = url_map[p.name]
                updated_count += 1
        await db.commit()
        print(f"[SUCCESS] Updated {updated_count} Tiwana product image URLs in database!")

async def main():
    print("=== Uploading Official Tiwana Product Package Artwork to Supabase Storage ===")
    async with httpx.AsyncClient(timeout=30.0) as client:
        url_map = {}
        for name, slug, local_file in OFFICIAL_PRODUCTS_MAP:
            pub_url = await upload_image_to_supabase(client, local_file, slug)
            url_map[name] = pub_url

        await update_database(url_map)

if __name__ == "__main__":
    asyncio.run(main())
