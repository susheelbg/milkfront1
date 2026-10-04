import asyncio
import os
import httpx

BRAIN_DIR = "/Users/susheel/.gemini/antigravity-ide/brain/26a04922-a60c-4b15-85a4-5477152bf359"
TEST_DIR = os.path.join(BRAIN_DIR, "tiwana_official_test")
os.makedirs(TEST_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
}

# Scan candidates across different months and artwork PDF indices
YEAR_MONTHS = ["2026/04", "2025/04", "2024/08", "2024/07", "2024/06"]

async def main():
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        found_urls = []
        
        # Test BAG-Tiwana-All-Artwork-50-KG-ok.pdf-X.png
        for ym in YEAR_MONTHS:
            for i in range(1, 20):
                urls = [
                    f"https://tiwana.in/wp-content/uploads/{ym}/BAG-Tiwana-All-Artwork-50-KG-ok.pdf-{i}.png",
                    f"https://tiwana.in/wp-content/uploads/{ym}/BAG-Tiwana-All-Artwork-50-KG.pdf-{i}.png",
                    f"https://tiwana.in/wp-content/uploads/{ym}/Tiwana-Bag-{i}.png",
                    f"https://tiwana.in/wp-content/uploads/{ym}/Tiwana-Bag-{i}.jpg",
                ]
                for url in urls:
                    try:
                        resp = await client.get(url, headers=HEADERS)
                        if resp.status_code == 200 and len(resp.content) > 1000:
                            clean_name = url.split("/")[-1]
                            out_path = os.path.join(TEST_DIR, clean_name)
                            with open(out_path, "wb") as f:
                                f.write(resp.content)
                            print(f"[FOUND] {url} -> {clean_name} ({len(resp.content)} bytes)")
                            found_urls.append((url, out_path))
                    except Exception:
                        pass

        print(f"\nTotal official artwork files downloaded: {len(found_urls)}")

if __name__ == "__main__":
    asyncio.run(main())
