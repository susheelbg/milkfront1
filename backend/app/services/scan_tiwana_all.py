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

YEAR_MONTHS = ["2026/04", "2025/04", "2024/08", "2024/07", "2024/06", "2025/05", "2025/06", "2024/09", "2024/10", "2024/11", "2024/12"]

FILE_PATTERNS = [
    "BAG-Tiwana-All-Artwork-50-KG-ok.pdf-{i}.png",
    "BAG-Tiwana-All-Artwork-50-KG.pdf-{i}.png",
    "BAG-Tiwana-{i}.png",
    "Tiwana-Bag-{i}.png",
    "T-20-{i}.png",
    "Calf-Starter-{i}.png",
    "Tiwana-8000-{i}.png",
    "Tiwana-10000-{i}.png",
    "Milk-Plus-{i}.png",
    "Silage-Plus-{i}.png",
    "Calf-Grower-{i}.png",
    "35-Protein-{i}.png",
    "T-20-Dry-{i}.png",
    "T-20-Fresher-{i}.png",
    "Dry-Bovine-{i}.png",
]

async def check(client, url):
    try:
        resp = await client.get(url, headers=HEADERS)
        if resp.status_code == 200 and len(resp.content) > 2000:
            filename = url.replace("https://tiwana.in/wp-content/uploads/", "").replace("/", "_")
            out_path = os.path.join(TEST_DIR, filename)
            with open(out_path, "wb") as f:
                f.write(resp.content)
            print(f"[SUCCESS 200] {url} -> {filename} ({len(resp.content)} bytes)")
            return True
    except Exception:
        pass
    return False

async def main():
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        sem = asyncio.Semaphore(15)
        
        async def sem_check(url):
            async with sem:
                await check(client, url)

        tasks = []
        for ym in YEAR_MONTHS:
            for pat in FILE_PATTERNS:
                for i in range(1, 21):
                    url = f"https://tiwana.in/wp-content/uploads/{ym}/{pat.format(i=i)}"
                    tasks.append(sem_check(url))

        print(f"Scanning {len(tasks)} potential official image URLs...")
        await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
