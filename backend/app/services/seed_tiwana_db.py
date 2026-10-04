import asyncio
from app.services.partner_service import ensure_partner_schema_and_seed

async def main():
    print("Seeding database with Tiwana Nutrition partner and products...")
    await ensure_partner_schema_and_seed()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
