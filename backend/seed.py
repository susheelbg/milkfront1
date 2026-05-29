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

SEED_FEEDS = [
    {
        "title": "Premium Dairy Feed",
        "price": 450.0,
        "description": "High-quality dairy feed enriched with minerals and vitamins",
        "image_url": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=400&fit=crop",
        "category": "Dairy",
        "brand": "MilkMaatu FeedCo",
        "stock_quantity": 120
    },
    {
        "title": "Nutritious Fodder Mix",
        "price": 320.0,
        "description": "Balanced nutritious fodder for cattle growth",
        "image_url": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=400&fit=crop",
        "category": "Fodder",
        "brand": "GreenGrow Fodder",
        "stock_quantity": 85
    },
    {
        "title": "Golden Grain Supplement",
        "price": 580.0,
        "description": "Premium grain supplement for enhanced milk production",
        "image_url": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=400&fit=crop",
        "category": "Supplement",
        "brand": "HarvestGolden",
        "stock_quantity": 60
    },
    {
        "title": "Organic Grass Hay",
        "price": 280.0,
        "description": "Organic dried grass hay for nutritious feeding",
        "image_url": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=400&fit=crop",
        "category": "Hay",
        "brand": "EcoHay Farms",
        "stock_quantity": 150
    },
    {
        "title": "Mineral Mix Supplement",
        "price": 350.0,
        "description": "Essential minerals for bone and milk development",
        "image_url": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=400&fit=crop",
        "category": "Mineral",
        "brand": "VitaCattle",
        "stock_quantity": 100
    },
    {
        "title": "Protein Concentrate",
        "price": 620.0,
        "description": "High protein concentrate for muscle development",
        "image_url": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=400&fit=crop",
        "category": "Protein",
        "brand": "ProBeef Max",
        "stock_quantity": 40
    }
]

async def seed_database():
    print("[SEED DAEMON] Starting database seed process...")
    
    # 1. Connect and ensure all tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with SessionLocal() as db:
        # 1.5. Clean all existing listings data to start from a completely clean slate
        print("[SEED DB] Purging all existing feeds, cattle, and orders data from Supabase...")
        from sqlalchemy import delete
        await db.execute(delete(Cattle))
        await db.execute(delete(Feed))
        await db.execute(delete(Order))  # Cascades automatically to OrderItem
        await db.commit()

        # 2. Seed Users
        # Check if the demo admin exists
        stmt = select(User).where(User.phone_number == "+919876543210")
        result = await db.execute(stmt)
        admin_exists = result.scalars().first()
        
        admin_id = None
        if not admin_exists:
            print("[SEED DB] Seeding system administrator profile...")
            admin = User(
                full_name="Susheel",
                phone_number="+919876543210",
                hashed_password=hash_password("demo123"),
                role="admin",
                address="Dairy Farm Road, Bengaluru",
                village="Gokula",
                is_verified=True
            )
            db.add(admin)
            await db.commit()
            await db.refresh(admin)
            admin_id = admin.id
        else:
            admin_id = admin_exists.id

        # Seeding a default farmer
        stmt = select(User).where(User.phone_number == "+919999999999")
        result = await db.execute(stmt)
        farmer_exists = result.scalars().first()
        
        if not farmer_exists:
            print("[SEED DB] Seeding mock farmer profile...")
            farmer = User(
                full_name="Ramesh Kumar",
                phone_number="+919999999999",
                hashed_password=hash_password("farmer123"),
                role="user",
                address="House 12, Main St",
                village="Thendekere",
                is_verified=True
            )
            db.add(farmer)
            await db.commit()

        # 3. Seed Feeds
        stmt = select(Feed)
        result = await db.execute(stmt)
        existing_feeds = result.scalars().all()
        
        if not existing_feeds:
            print("[SEED DB] Seeding catalog feeds products...")
            for f_data in SEED_FEEDS:
                # Upload to Cloudinary to replace dummy unsplash URL
                f_data["image_url"] = upload_image(f_data["image_url"])
                feed = Feed(**f_data)
                db.add(feed)
            await db.commit()
        else:
            # Upgrade existing feeds if they still have dummy unsplash images
            print("[SEED DB] Checking existing feeds for dummy images...")
            for feed in existing_feeds:
                if feed.image_url and "unsplash.com" in feed.image_url:
                    print(f"[SEED DB] Uploading dummy image for feed '{feed.title}' to Cloudinary...")
                    feed.image_url = upload_image(feed.image_url)
            await db.commit()

        # 4. Cattle Seeding is skipped to let marketplace start completely empty and clean for real farmer uploads

    print("[SEED COMPLETE] Database populated successfully! You are ready to log in.")

if __name__ == "__main__":
    asyncio.run(seed_database())
