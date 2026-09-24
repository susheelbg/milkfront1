import asyncio
from sqlalchemy import text
from app.core.database import SessionLocal, engine

async def run_data_reset_migration():
    print("[MIGRATION START] Safe product catalog reset...")
    async with SessionLocal() as db:
        # 1. Add product_name to order_items if it does not exist
        print("1. Ensuring product_name column exists in order_items...")
        await db.execute(text("""
            ALTER TABLE order_items 
            ADD COLUMN IF NOT EXISTS product_name VARCHAR;
        """))
        await db.commit()

        # 2. Snapshot historical feed titles into order_items.product_name
        print("2. Preserving historical feed product titles into order_items.product_name...")
        await db.execute(text("""
            UPDATE order_items
            SET product_name = feeds.title
            FROM feeds
            WHERE order_items.feed_id = feeds.id
              AND (order_items.product_name IS NULL OR order_items.product_name = '');
        """))
        # Any items with null feed_id or still empty
        await db.execute(text("""
            UPDATE order_items
            SET product_name = 'Cattle Feed'
            WHERE product_name IS NULL OR product_name = '';
        """))
        await db.commit()

        # 3. Disassociate order_items.feed_id to safely remove old feeds without breaking referential integrity
        print("3. Disassociating order_items.feed_id to preserve historical order integrity...")
        await db.execute(text("""
            UPDATE order_items
            SET feed_id = NULL
            WHERE feed_id IS NOT NULL;
        """))
        await db.commit()

        # 4. Remove old product/feed records from the database
        print("4. Removing old product records from feeds table...")
        delete_res = await db.execute(text("DELETE FROM feeds;"))
        print(f"   Deleted {delete_res.rowcount} old feed records.")
        await db.commit()

        # 5. Add unit column to feeds table if not exists
        print("5. Ensuring unit column exists in feeds table...")
        await db.execute(text("""
            ALTER TABLE feeds 
            ADD COLUMN IF NOT EXISTS unit VARCHAR DEFAULT '50 kg';
        """))
        await db.commit()

        # 6. Reset feeds sequence if PostgreSQL sequence exists
        try:
            await db.execute(text("ALTER SEQUENCE IF EXISTS feeds_id_seq RESTART WITH 1;"))
            await db.commit()
            print("6. Reset feeds_id_seq sequence.")
        except Exception as e:
            print(f"6. Sequence reset note: {e}")

        # 7. Verification
        feed_cnt = (await db.execute(text("SELECT count(*) FROM feeds;"))).scalar()
        orders_cnt = (await db.execute(text("SELECT count(*) FROM orders;"))).scalar()
        items_cnt = (await db.execute(text("SELECT count(*) FROM order_items;"))).scalar()
        sample_items = (await db.execute(text("SELECT id, order_id, product_name, price, quantity FROM order_items LIMIT 5;"))).fetchall()

        print("\n[MIGRATION VERIFICATION]")
        print(f"Feeds count in database: {feed_cnt} (Must be 0)")
        print(f"Orders count in database: {orders_cnt} (Preserved)")
        print(f"Order items count: {items_cnt} (Preserved)")
        print("Sample preserved order items:")
        for item in sample_items:
            print(f"  Item ID {item[0]}: Order {item[1]}, Product: '{item[2]}', Price: ₹{item[3]}, Qty: {item[4]}")

    print("\n[MIGRATION COMPLETE] Safe product catalog data reset finished successfully!")

if __name__ == "__main__":
    asyncio.run(run_data_reset_migration())
