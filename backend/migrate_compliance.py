import asyncio
from sqlalchemy import text
from app.core.database import engine, is_sqlite

async def run_migration():
    async with engine.begin() as conn:
        print("Running compliance migration...")
        
        # 1. Add columns to users table
        columns = [
            ("account_status", "VARCHAR DEFAULT 'active'"),
            ("consent_timestamp", "TIMESTAMP WITHOUT TIME ZONE"),
            ("updated_at", "TIMESTAMP WITHOUT TIME ZONE"),
            ("deleted_at", "TIMESTAMP WITHOUT TIME ZONE")
        ]
        
        for col_name, col_type in columns:
            try:
                if is_sqlite:
                    # SQLite doesn't support ADD COLUMN IF NOT EXISTS, so try-except
                    await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                    print(f"Added column '{col_name}' to users table.")
                else:
                    await conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                    print(f"Added column '{col_name}' (if not exists) to users table.")
            except Exception as e:
                # Column might already exist
                print(f"Column '{col_name}' not added (it might already exist).")
                
        # 2. Bootstrapping new tables (e.g. cattle_reports)
        from app.models.cattle_report import CattleReport
        from app.core.database import Base
        await conn.run_sync(Base.metadata.create_all)
        print("Table bootstrap complete.")
        
    print("Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_migration())
