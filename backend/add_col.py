import asyncio
from sqlalchemy import text
from app.core.database import engine

async def add_column():
    async with engine.begin() as conn:
        print("Executing ALTER TABLE to add 'language' column...")
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR DEFAULT 'kn';"))
        print("Done!")

if __name__ == "__main__":
    asyncio.run(add_column())
