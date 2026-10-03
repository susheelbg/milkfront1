import asyncio
import httpx
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base, get_db
from app.core.dependencies import get_current_admin
from app.services import partner_service as svc
import app.main as m

async def run_tests():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    Session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    svc.engine, svc.SessionLocal = engine, Session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await svc.ensure_partner_schema_and_seed()

    async def _db():
        async with Session() as db:
            yield db

    m.app.dependency_overrides[get_db] = _db
    m.app.dependency_overrides[get_current_admin] = lambda: object()

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=m.app), base_url="http://testserver") as client:
        # 1. Fetch public feeds
        r = await client.get("/api/feeds")
        assert r.status_code == 200, r.text
        feeds = r.json()
        names = [f["name"] for f in feeds]
        print("Public Buy Feeds names:", names)
        
        # Confirm Cargill products exist in Buy Feeds
        cargill_names = ["Milkgen8000", "Milkgen10000", "Pragati", "Milkgen5000", "Buffgen4000", "Bullet"]
        for cn in cargill_names:
            assert cn in names, f"{cn} missing from Buy Feeds"
            item = next(f for f in feeds if f["name"] == cn)
            assert item["image_url"] and "supabase.co/storage" in item["image_url"]
            assert item["price"] > 0

        # 2. Place an order for Milkgen8000 (ID 10001)
        m8k = next(f for f in feeds if f["name"] == "Milkgen8000")
        order_payload = {
            "customerName": "Test Farmer",
            "phoneNumber": "9999988888",
            "villageName": "Mandya",
            "address": "Farm 123",
            "totalPrice": m8k["price"] * 2,
            "items": [
                {"id": m8k["id"], "quantity": 2, "price": m8k["price"]}
            ]
        }
        r_ord = await client.post("/api/orders", json=order_payload)
        assert r_ord.status_code == 200, r_ord.text
        ord_data = r_ord.json()
        print("Order placed response:", ord_data)
        ord_obj = ord_data.get("data") or ord_data
        ord_id = ord_obj["id"]
        total_amt = ord_obj.get("total_amount") or ord_obj.get("totalPrice")
        print("Order placed successfully:", ord_id, "Total:", total_amt)
        assert total_amt == m8k["price"] * 2

        # 3. Admin updates price of Milkgen8000 to 2000
        p_id = m8k["partner_product_id"]
        r_up = await client.put(f"/api/admin/partner-products/{p_id}", json={"buy_feeds_price": 2000.0})
        assert r_up.status_code == 200, r_up.text

        # Verify new price in Buy Feeds
        feeds_updated = (await client.get("/api/feeds")).json()
        m8k_new = next(f for f in feeds_updated if f["name"] == "Milkgen8000")
        assert m8k_new["price"] == 2000.0, f"Expected 2000.0, got {m8k_new['price']}"

        # Confirm old order price is STILL historical price (3300 total)
        r_get_ord = await client.get("/api/orders/my-orders?phone=9999988888")
        assert r_get_ord.status_code == 200, r_get_ord.text
        hist_orders = r_get_ord.json()["data"]
        placed_ord = next(o for o in hist_orders if o["id"] == ord_id)
        assert placed_ord["totalPrice"] == m8k["price"] * 2, "Historical order price changed!"

        # 4. Admin hides Milkgen8000 from Buy Feeds only (show_in_buy_feeds = False)
        r_hide = await client.put(f"/api/admin/partner-products/{p_id}", json={"show_in_buy_feeds": False})
        assert r_hide.status_code == 200

        # Check Buy Feeds: Milkgen8000 must NOT appear
        feeds_after_hide = (await client.get("/api/feeds")).json()
        names_after_hide = [f["name"] for f in feeds_after_hide]
        assert "Milkgen8000" not in names_after_hide, "Milkgen8000 still visible in Buy Feeds"

        # Check Our Partners -> Cargill: Milkgen8000 MUST REMAIN VISIBLE
        r_partner = await client.get("/api/partners/1/products")
        assert r_partner.status_code == 200
        partner_prods = r_partner.json()["data"]["products"]
        partner_prod_names = [p["name"] for p in partner_prods]
        assert "Milkgen8000" in partner_prod_names, "Milkgen8000 was improperly hidden from Partners!"

        # 5. Restore Milkgen8000 to Buy Feeds
        await client.put(f"/api/admin/partner-products/{p_id}", json={"show_in_buy_feeds": True})
        feeds_restored = (await client.get("/api/feeds")).json()
        assert "Milkgen8000" in [f["name"] for f in feeds_restored]

    print("\n✅ ALL 12 PARTNER PRODUCT BUY FEEDS REQUIREMENTS VERIFIED!")

if __name__ == "__main__":
    asyncio.run(run_tests())
