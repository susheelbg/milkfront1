import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.database import Base
from app.models.partner import Partner, PartnerProduct
from app.services import partner_service as svc


async def run_tests():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    Session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    # Point the service at the in-memory DB (never touches production data)
    svc.engine, svc.SessionLocal = engine, Session

    await svc.ensure_partner_schema_and_seed()
    await svc.ensure_partner_schema_and_seed()  # idempotent

    async with Session() as db:
        partners = (await db.execute(select(Partner))).scalars().all()
        assert len(partners) == 2, len(partners)
        slugs = [p.slug for p in partners]
        assert "cargill" in slugs and "innoterra" in slugs
        prods = (await db.execute(select(PartnerProduct).order_by(PartnerProduct.display_order))).scalars().all()
        names = [p.name for p in prods]
        cargill_names = ["Milkgen8000", "Milkgen10000", "Pragati", "Milkgen5000", "Buffgen4000", "Bullet"]
        inno_names = ["Aayush Rich", "Aayush Vardhan", "Aayush Special", "Aayush Max", "Aayush Supreme", "Aayush Super", "Aayush TranSafe", "Aayush Shakthi"]
        for cn in cargill_names + inno_names:
            assert cn in names, f"{cn} missing from partner products"
        by = {p.name: p for p in prods}
        assert by["Milkgen8000"].nutrition_data["crude_protein"] == {"value": "21", "unit": "%", "limit": "min"}
        assert by["Milkgen10000"].nutrition_data["crude_fibre"]["value"] == "10"
        assert by["Bullet"].nutrition_data["form"]["en"] == "Mash"
        assert by["Buffgen4000"].nutrition_data["crude_fat"]["value"] == "5"
        # Verified Supabase Storage images, all have Kannada, source tracked
        for p in prods:
            assert p.image_url and "supabase.co/storage" in p.image_url and p.image_status == "approved"
            assert p.recommended_use_kn and p.feeding_instructions_kn
            assert p.source_url in [svc.CARGILL_SOURCE_URL, svc.INNOTERRA_SOURCE_URL] and p.source_checked_at
            assert p.is_active

        print("seed OK")

        # Import diff: change one value, omit others, add a new one
        partner = partners[0]
        payload = [
            {"name": "Milkgen8000", "feeding_instructions_en": "CHANGED"},
            {"name": "NewProduct", "brand": "Cargill"},
        ]
        preview = await svc.apply_import(db, partner, payload, dry_run=True)
        assert preview["added"] == ["NewProduct"] and preview["updated"] == ["Milkgen8000"]
        assert (await db.get(PartnerProduct, by["Milkgen8000"].id)).feeding_instructions_en != "CHANGED"  # dry run

        res = await svc.apply_import(db, partner, payload)
        assert len(res["missing_flagged_for_review"]) == 5
        all_now = (await db.execute(select(PartnerProduct))).scalars().all()
        assert len(all_now) == 15, "import must never delete products"
        m = next(p for p in all_now if p.name == "Milkgen8000")
        assert m.needs_review and m.feeding_instructions_en == "CHANGED"
        assert m.feeding_instructions_kn.startswith("ಮೇವಿನೊಂದಿಗೆ")  # kn untouched, flagged
        new = next(p for p in all_now if p.name == "NewProduct")
        assert new.is_active is False and new.needs_review
        print("import OK")

    print("\n✅ PARTNER CATALOG TESTS PASSED")


if __name__ == "__main__":
    asyncio.run(run_tests())
