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
            ("deleted_at", "TIMESTAMP WITHOUT TIME ZONE"),
            ("phone_verified", "BOOLEAN DEFAULT FALSE")
        ]
        
        for col_name, col_type in columns:
            try:
                if is_sqlite:
                    # SQLite doesn't support ADD COLUMN IF NOT EXISTS, so try-except
                    # Translate TIMESTAMP WITHOUT TIME ZONE and BOOLEAN for SQLite compatibility
                    sql_type = col_type
                    if "TIMESTAMP" in col_type:
                        sql_type = "DATETIME"
                    elif "BOOLEAN" in col_type:
                        sql_type = "INTEGER DEFAULT 0"
                    await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {sql_type};"))
                    print(f"Added column '{col_name}' to users table.")
                else:
                    await conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                    print(f"Added column '{col_name}' (if not exists) to users table.")
            except Exception as e:
                # Column might already exist
                print(f"Column '{col_name}' not added (it might already exist).")
                
        # 2. Migrate existing verified users to phone_verified = True
        try:
            if is_sqlite:
                await conn.execute(text("UPDATE users SET phone_verified = 1 WHERE is_verified = 1 OR is_verified = 'true';"))
            else:
                await conn.execute(text("UPDATE users SET phone_verified = TRUE WHERE is_verified = TRUE;"))
            print("Successfully migrated existing verified users to phone_verified = TRUE.")
        except Exception as e:
            print(f"Failed to migrate existing verified users: {e}")
            
        # 3. Bootstrapping new tables (e.g. cattle_reports)
        from app.models.cattle_report import CattleReport
        from app.core.database import Base
        await conn.run_sync(Base.metadata.create_all)
        print("Table bootstrap complete.")
        
    print("Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_migration())
