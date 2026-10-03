import asyncio
from app.core.database import SessionLocal
from app.models.feed import Feed
from app.models.partner import PartnerProduct
from sqlalchemy import select

async def check():
    async with SessionLocal() as db:
        feeds = (await db.execute(select(Feed))).scalars().all()
        print("FEEDS IN DB:", [(f.id, f.title) for f in feeds])
        prods = (await db.execute(select(PartnerProduct))).scalars().all()
        print("PARTNER PRODUCTS IN DB:", [(p.id, p.name) for p in prods])

if __name__ == "__main__":
    asyncio.run(check())
