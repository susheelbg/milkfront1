import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.future import select
from app.core.database import engine, Base, SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.feed import Feed
from app.models.cattle import Cattle
from app.models.order import Order
from app.services.cloudinary_service import upload_image

async def seed_database():
    print("[SEED DAEMON] Starting database seed process...")
    
    # 1. Connect and ensure all tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with SessionLocal() as db:
        # As per user request, we do not purge any user data, feeds, cattle, or orders.
        # Everything remains permanently stored and untouched.

        # 2. Seed Users
        # Check if the demo admin exists
        stmt = select(User).where(User.phone_number == "+917795056391")
        result = await db.execute(stmt)
        admin_exists = result.scalars().first()
        
        admin_id = None
        if not admin_exists:
            print("[SEED DB] Seeding system administrator profile...")
            admin = User(
                full_name="Susheel",
                phone_number="+917795056391",
                hashed_password=hash_password("Susheel@451"),
                role="super_admin",
                address="Dairy Farm Road, Bengaluru",
                village="Gokula",
                is_verified=True,
                phone_verified=True
            )
            db.add(admin)
            await db.commit()
            await db.refresh(admin)
            admin_id = admin.id
        else:
            admin_id = admin_exists.id

        # Mock farmer seeding is removed as per user request to store all user profiles solely in the database

        # 3. Seed Feeds
        # Dummy feeds seeding is removed as per user request to only store admin uploads
        print("[SEED DB] Skipping dummy feeds seeding to preserve only admin uploaded feeds...")

        # 4. Cattle Seeding is skipped to let marketplace start completely empty and clean for real farmer uploads

    print("[SEED COMPLETE] Database populated successfully! You are ready to log in.")

if __name__ == "__main__":
    asyncio.run(seed_database())
