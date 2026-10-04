import asyncio
import os
import httpx
from PIL import Image, ImageDraw, ImageFont
from app.core.config import settings

BRAIN_DIR = "/Users/susheel/.gemini/antigravity-ide/brain/26a04922-a60c-4b15-85a4-5477152bf359"
TIWANA_DIR = os.path.join(BRAIN_DIR, "tiwana_assets")
os.makedirs(TIWANA_DIR, exist_ok=True)

OFFICIAL_TIWANA_LOGO_URL = "https://tiwana.in/wp-content/uploads/2025/04/Tiwana-Logo-PNG-1.png"

TIWANA_PRODUCTS_MAPPING = [
    ("tiwana-8000", "Tiwana 8000", "High Yield Bovine Feed 21% CP", "#1b5e20", "#e8f5e9"),
    ("tiwana-10000", "Tiwana 10000", "Ultra High Yield Feed 24% CP", "#0d47a1", "#e3f2fd"),
    ("milk-plus", "Milk Plus", "Balanced Lactating Cattle Feed", "#004d40", "#e0f2f1"),
    ("silage-plus", "Silage Plus", "Silage Compatible Cattle Feed", "#33691e", "#f1f8e9"),
    ("t20-dry", "T-20 Dry", "Dry Cow & Buffalo Feed 18% CP", "#e65100", "#fff3e0"),
    ("t20-fresher", "T-20 Fresher", "Transition Nutrition 21 Days Calving", "#4a148c", "#f3e5f5"),
    ("dry-bovine", "Dry Bovine", "Bovine Maintenance Nutrition", "#3e2723", "#efebe9"),
    ("calf-starter-plus", "Calf Starter Plus", "Calf Starter Feed 0-6 Months", "#bf360c", "#fbe9e7"),
    ("calf-grower", "Calf Grower", "Calf Growth Feed 6-12 Months", "#006064", "#e0f7fa"),
    ("35-protein", "35 Protein", "Bypass Protein Concentrate 35% CP", "#880e4f", "#fce4ec"),
]

def create_bag_image(name: str, subtitle: str, primary_color: str, bg_color: str, save_path: str):
    width, height = 600, 800
    img = Image.new("RGBA", (width, height), (250, 248, 244, 255))
    draw = ImageDraw.Draw(img)

    # Feed Bag contour
    bag_box = [100, 80, 500, 740]
    draw.rectangle(bag_box, fill=bg_color, outline=primary_color, width=4)
    
    # Top & Bottom stitch lines
    draw.rectangle([100, 80, 500, 140], fill=primary_color)
    draw.rectangle([100, 680, 500, 740], fill=primary_color)

    # Text overlay
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
        font_sub = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
        font_brand = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
    except Exception:
        font_large = font_sub = font_brand = ImageFont.load_default()

    # Brand Title
    draw.text((300, 110), "TIWANA NUTRITION", fill="#ffffff", font=font_brand, anchor="mm")
    
    # Center Product Badge
    badge_box = [130, 220, 470, 500]
    draw.rectangle(badge_box, fill="#ffffff", outline=primary_color, width=3)
    
    draw.text((300, 310), name, fill=primary_color, font=font_large, anchor="mm")
    draw.text((300, 400), subtitle, fill="#333333", font=font_sub, anchor="mm")
    
    # Quality Seal
    draw.ellipse([250, 540, 350, 640], fill=primary_color)
    draw.text((300, 590), "100% CATTLE\nNUTRITION", fill="#ffffff", font=font_sub, anchor="mm")

    # Bottom Text
    draw.text((300, 710), "NET WEIGHT 50 KG", fill="#ffffff", font=font_sub, anchor="mm")

    img.save(save_path, "PNG")
    print(f"Generated bag image for {name} -> {save_path}")

async def download_official_logo(client: httpx.AsyncClient) -> str:
    logo_path = os.path.join(TIWANA_DIR, "tiwana-logo.png")
    try:
        resp = await client.get(OFFICIAL_TIWANA_LOGO_URL)
        if resp.status_code == 200 and len(resp.content) > 100:
            with open(logo_path, "wb") as f:
                f.write(resp.content)
            print(f"Downloaded official logo to {logo_path}")
            return logo_path
    except Exception as e:
        print(f"Logo download error: {e}")
    
    # Fallback logo generation if download failed
    img = Image.new("RGBA", (400, 200), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([10, 10, 390, 190], outline="#1b5e20", width=4)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
    except Exception:
        font = ImageFont.load_default()
    draw.text((200, 100), "TIWANA NUTRITION", fill="#1b5e20", font=font, anchor="mm")
    img.save(logo_path, "PNG")
    return logo_path

async def upload_local_file(client: httpx.AsyncClient, local_path: str, storage_path: str) -> str:
    url_prefix = f"{settings.SUPABASE_URL}/storage/v1/object/milkmaatu-image"
    public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/milkmaatu-image/{storage_path}"
    
    if not os.path.exists(local_path):
        print(f"[ERROR] Missing local file: {local_path}")
        return ""

    with open(local_path, "rb") as f:
        content = f.read()

    content_type = "image/png"

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

    resp_verify = await client.get(public_url)
    if resp_verify.status_code == 200:
        print(f"[VERIFIED] {storage_path} -> {public_url}")
        return public_url
    else:
        print(f"[ERROR] Public access check failed for {public_url} (HTTP {resp_verify.status_code})")
        return ""

async def main():
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        print("=== Step 1: Downloading Official Tiwana Logo ===")
        logo_path = await download_official_logo(client)
        logo_url = await upload_local_file(client, logo_path, "partners/tiwana/logo/tiwana-logo.png")
        print(f"Uploaded Tiwana Logo URL: {logo_url}\n")

        print("=== Step 2: Generating and Uploading 10 Tiwana Cattle Feed Products ===")
        results = {}
        for slug, name, sub, primary, bg in TIWANA_PRODUCTS_MAPPING:
            local_path = os.path.join(TIWANA_DIR, f"{slug}.png")
            create_bag_image(name, sub, primary, bg, local_path)
            storage_path = f"partners/tiwana/products/{slug}/{slug}.png"
            pub_url = await upload_local_file(client, local_path, storage_path)
            results[name] = pub_url

        print("\n=== Summary of Uploaded Tiwana Assets ===")
        print(f"LOGO: {logo_url}")
        for name, url in results.items():
            print(f"{name}: {url}")

if __name__ == "__main__":
    asyncio.run(main())
