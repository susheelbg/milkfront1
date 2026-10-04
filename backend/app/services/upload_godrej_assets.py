import asyncio
import os
import httpx
from app.core.config import settings

BRAIN_DIR = "/Users/susheel/.gemini/antigravity-ide/brain/26a04922-a60c-4b15-85a4-5477152bf359"

GODREJ_LOGO_FILE = os.path.join(BRAIN_DIR, "godrej_logo_1791093516174.png")

GODREJ_PRODUCTS_MAPPING = [
    ("godrej-samruddhi", "Godrej Samruddhi", os.path.join(BRAIN_DIR, "godrej_samruddhi_1791093700652.png")),
    ("godrej-transeefeed-d60", "Godrej Transeefeed D-60", os.path.join(BRAIN_DIR, "godrej_transeefeed_1791093774288.png")),
    ("godrej-dhanavruddhi", "Godrej Dhanavruddhi", os.path.join(BRAIN_DIR, "media__1791058955128.png")),
    ("godrej-dairy-xpert", "Godrej Dairy Xpert", os.path.join(BRAIN_DIR, "media__1791062826536.png")),
    ("godrej-bypro-plus", "Godrej Bypro Plus", os.path.join(BRAIN_DIR, "media__1790597884216.png")),
    ("godrej-dhanlaxmi-g", "Godrej Dhanlaxmi-G", os.path.join(BRAIN_DIR, "media__1790599742818.png")),
]

async def upload_local_file(client: httpx.AsyncClient, local_path: str, storage_path: str) -> str:
    url_prefix = f"{settings.SUPABASE_URL}/storage/v1/object/milkmaatu-image"
    public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/milkmaatu-image/{storage_path}"
    
    if not os.path.exists(local_path):
        print(f"[ERROR] Missing local file: {local_path}")
        return ""

    with open(local_path, "rb") as f:
        content = f.read()

    content_type = "image/jpeg" if local_path.endswith(".jpg") or local_path.endswith(".jpeg") else "image/png"

    headers_post = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "x-upsert": "true",
        "Content-Type": content_type
    }

    target_url = f"{url_prefix}/{storage_path}"
    resp_post = await client.post(target_url, content=content, headers=headers_post)
    if resp_post.status_code not in [200, 201]:
        print(f"[ERROR] Upload failed for {storage_path} (HTTP {resp_post.status_code}): {resp_post.text}")
        return ""

    # Verify public accessibility
    resp_verify = await client.get(public_url)
    if resp_verify.status_code == 200:
        print(f"[VERIFIED] {storage_path} -> {public_url}")
        return public_url
    else:
        print(f"[ERROR] Public access check failed for {public_url} (HTTP {resp_verify.status_code})")
        return ""

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("=== Uploading Godrej Agrovet Logo ===")
        logo_url = await upload_local_file(client, GODREJ_LOGO_FILE, "partners/godrej/logo/godrej-logo.png")
        print(f"Logo URL: {logo_url}\n")

        print("=== Uploading Godrej Cattle Feed Product Images ===")
        results = {}
        for slug, name, local_path in GODREJ_PRODUCTS_MAPPING:
            ext = ".jpg" if local_path.endswith(".jpg") or local_path.endswith(".jpeg") else ".png"
            storage_path = f"partners/godrej/products/{slug}/{slug}{ext}"
            pub_url = await upload_local_file(client, local_path, storage_path)
            results[name] = pub_url

        print("\n=== Summary of Uploaded URLs ===")
        print(f"LOGO: {logo_url}")
        for name, url in results.items():
            print(f"{name}: {url}")

if __name__ == "__main__":
    asyncio.run(main())
