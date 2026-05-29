import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.future import select
from app.core.database import engine, Base, SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.feed import Feed
from app.models.cattle import Cattle

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
                feed = Feed(**f_data)
                db.add(feed)
            await db.commit()

        # 4. Seed Cattle
        stmt = select(Cattle)
        result = await db.execute(stmt)
        existing_cattle = result.scalars().all()
        
        if not existing_cattle:
            print("[SEED DB] Seeding initial active Sante cattle postings...")
            
            c1 = Cattle(
                user_id=admin_id,
                animal_name="Jersey Cow",
                age=5,
                milk_capacity="20L/day",
                price=65000,
                village="Thendekere",
                sante_name="Thendekere Sante",
                description="Healthy Jersey cow with excellent milk output. Vaccinated and dewormed.",
                image_url="https://images.unsplash.com/photo-1546521858-7ce4593f159b?w=500&h=400&fit=crop",
                phone_number="+919876543210",
                expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
            )
            
            c2 = Cattle(
                user_id=admin_id,
                animal_name="Holstein Friesian",
                age=4,
                milk_capacity="25L/day",
                price=85000,
                village="Belgaum",
                sante_name="KRS Sante",
                description="Premium Holstein Friesian with best genetics. High milk quality assured.",
                image_url="https://images.unsplash.com/photo-1546521858-7ce4593f159b?w=500&h=400&fit=crop",
                phone_number="+919876543211",
                expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
            )
            
            db.add(c1)
            db.add(c2)
            await db.commit()

    print("[SEED COMPLETE] Database populated successfully! You are ready to log in.")

if __name__ == "__main__":
    asyncio.run(seed_database())
