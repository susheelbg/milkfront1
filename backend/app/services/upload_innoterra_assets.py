import asyncio
import os
import httpx
from app.core.config import settings

INNOTERRA_LOGO_SOURCE = "https://innoterra.in/wp-content/uploads/2023/04/Innoterra-Logo.png"

INNOTERRA_PRODUCTS_SOURCES = [
    ("aayush-rich", "Aayush Rich", "https://innoterra.in/wp-content/uploads/2025/03/IMG-Aayush-Rich.png"),
    ("aayush-vardhan", "Aayush Vardhan", "https://innoterra.in/wp-content/uploads/2025/03/IMG-Aayush-Vardhan.png"),
    ("aayush-special", "Aayush Special", "https://innoterra.in/wp-content/uploads/2026/07/IMG-Aayush-Special.png"),
    ("aayush-max", "Aayush Max", "https://innoterra.in/wp-content/uploads/2025/03/IMG-Aayush-Max.png"),
    ("aayush-supreme", "Aayush Supreme", "https://innoterra.in/wp-content/uploads/2025/03/IMG-Aayush-Supreme.png"),
    ("aayush-super", "Aayush Super", "https://innoterra.in/wp-content/uploads/2025/03/IMG-Aayush-Super.png"),
    ("aayush-nutri-balance", "Aayush Nutri Balance", "https://innoterra.in/wp-content/uploads/2025/03/IMG-Nutri-Balance.png"),
    ("aayush-transafe", "Aayush TranSafe", "https://innoterra.in/wp-content/uploads/2026/05/IMG-For-Mothers-Cow-Transafe.png"),
    ("aayush-nutri-grow", "Aayush Nutri Grow", "https://innoterra.in/wp-content/uploads/2026/05/IMG-For-Mothers-Cow-Nutri-Grow.png"),
    ("aayush-shakthi", "Aayush Shakthi", "https://innoterra.in/wp-content/uploads/2026/05/IMG-For-Calves-Shakthi.png"),
    ("aayush-calf-pro", "Aayush Calf Pro", "https://innoterra.in/wp-content/uploads/2026/05/IMG-For-Calves-Calf-PR.png"),
]

async def upload_asset(client: httpx.AsyncClient, source_url: str, storage_path: str) -> str:
    url_prefix = f"{settings.SUPABASE_URL}/storage/v1/object/milkmaatu-image"
    public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/milkmaatu-image/{storage_path}"
    
    # Download image from source URL (with browser user-agent)
    headers_get = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
    resp_get = await client.get(source_url, headers=headers_get, follow_redirects=True)
    if resp_get.status_code != 200:
        print(f"[ERROR] Failed to download {source_url} (HTTP {resp_get.status_code})")
        return ""
    
    content = resp_get.content
    content_type = resp_get.headers.get("content-type", "image/png")

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
        print("=== Uploading Innoterra Logo ===")
        logo_url = await upload_asset(client, INNOTERRA_LOGO_SOURCE, "partners/innoterra/logo/innoterra-logo.png")
        print(f"Logo URL: {logo_url}\n")

        print("=== Uploading Innoterra Product Images ===")
        results = {}
        for slug, name, source_url in INNOTERRA_PRODUCTS_SOURCES:
            storage_path = f"partners/innoterra/products/{slug}/{slug}.png"
            pub_url = await upload_asset(client, source_url, storage_path)
            results[name] = pub_url

        print("\n=== Summary of Uploaded URLs ===")
        print(f"LOGO: {logo_url}")
        for name, url in results.items():
            print(f"{name}: {url}")

if __name__ == "__main__":
    asyncio.run(main())
