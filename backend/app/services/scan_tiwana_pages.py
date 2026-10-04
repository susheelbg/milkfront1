import asyncio
import re
import os
import httpx

BRAIN_DIR = "/Users/susheel/.gemini/antigravity-ide/brain/26a04922-a60c-4b15-85a4-5477152bf359"
TEST_DIR = os.path.join(BRAIN_DIR, "tiwana_official_test")
os.makedirs(TEST_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
}

PAGES = [
    "https://tiwana.in/",
    "https://tiwana.in/tiwana-nutrition/",
    "https://tiwana.in/bovine-nutrition/",
    "https://tiwana.in/calf-to-cow-program/",
    "https://tiwana.in/pregnancy-care-program/",
    "https://tiwana.in/products/",
]

async def scrape_page(client, page_url):
    print(f"Scraping {page_url}...")
    try:
        resp = await client.get(page_url, headers=HEADERS)
        if resp.status_code == 200:
            # find all wp-content/uploads URLs
            urls = re.findall(r'https?://tiwana\.in/wp-content/uploads/[^\s\'"<>\(\)]+', resp.text)
            print(f"Found {len(urls)} image/upload URLs on {page_url}")
            return urls
    except Exception as e:
        print(f"Error scraping {page_url}: {e}")
    return []

async def download_image(client, url):
    try:
        resp = await client.get(url, headers=HEADERS)
        if resp.status_code == 200 and len(resp.content) > 1000:
            clean_name = url.split("/")[-1]
            out_path = os.path.join(TEST_DIR, clean_name)
            with open(out_path, "wb") as f:
                f.write(resp.content)
            print(f"[DOWNLOADED] {url} -> {clean_name}")
            return (url, out_path)
    except Exception as e:
        pass
    return None

async def main():
    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        all_urls = set()
        for page in PAGES:
            urls = await scrape_page(client, page)
            for u in urls:
                if u.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                    all_urls.add(u)

        print(f"\nUnique image URLs discovered across tiwana.in: {len(all_urls)}")
        tasks = [download_image(client, u) for u in all_urls]
        results = await asyncio.gather(*tasks)
        downloaded = [r for r in results if r]
        print(f"Successfully downloaded {len(downloaded)} official images.")

if __name__ == "__main__":
    asyncio.run(main())
