import asyncio
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select

# Core and Database
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models.cattle import Cattle
from app.models.user import User

# Modular routers
from app.routes.auth_routes import router as auth_router
from app.routes.feed_routes import router as feed_router
from app.routes.order_routes import router as order_router
from app.routes.cattle_routes import router as cattle_router
from app.routes.profile_routes import router as profile_router
from app.routes.admin_routes import router as admin_router
from app.routes.ai_routes import router as ai_router
from app.routes.report_routes import router as report_router
from app.routes.news_routes import router as news_router

# Background loop for Sante listing sweeps
async def clean_expired_listings_worker():
    """Background worker that runs hourly to sweep and purge expired cattle listings."""
    print("[BACKGROUND WORKER] Sante cattle listings cleanup daemon started successfully.")
    while True:
        try:
            # Sleep for 1 hour (3600 seconds)
            await asyncio.sleep(3600)
            
            async with SessionLocal() as db:
                current_time = datetime.now(timezone.utc).replace(tzinfo=None)
                # Find posts where expires_at is in the past
                stmt = select(Cattle).where(Cattle.expires_at < current_time)
                result = await db.execute(stmt)
                expired_posts = result.scalars().all()
                
                if expired_posts:
                    for post in expired_posts:
                        await db.delete(post)
                    await db.commit()
                    print(f"[BACKGROUND WORKER] Hourly sweep complete. Purged {len(expired_posts)} expired listings.")
        except asyncio.CancelledError:
            print("[BACKGROUND WORKER] Sweeper task was cancelled.")
            break
        except Exception as e:
            print(f"[BACKGROUND WORKER ERROR] Failure encountered: {e}")


async def news_refresh_worker():
    """Background worker: refreshes dairy news from RSS every 6 hours."""
    from app.services.news.news_service import refresh_news
    print("[NEWS WORKER] Dairy news refresh daemon started.")
    # Run once immediately on startup, then every 6 hours
    while True:
        try:
            async with SessionLocal() as db:
                count = await refresh_news(db)
                print(f"[NEWS WORKER] Refresh complete — {count} new articles stored.")
        except asyncio.CancelledError:
            print("[NEWS WORKER] Cancelled.")
            break
        except Exception as e:
            print(f"[NEWS WORKER ERROR] {e}")
        # Wait 3 hours before next refresh (8 times a day = always fresh)
        await asyncio.sleep(3 * 3600)

# Lifespan Context Manager (replaces startup/shutdown events)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Startup: Run idempotent Super Admin bootstrap (No auto-migrations)
    print("[SERVER INITS] Running idempotent Super Admin bootstrap...")
    try:
        from app.services.super_admin_bootstrap import bootstrap_super_admin
        await bootstrap_super_admin()
        print("[SERVER INITS] Super Admin bootstrap verified.")
    except Exception as e:
        print(f"[SERVER INITS WARNING] Super admin bootstrap issue: {e}")

    # 2. Start background worker tasks
    worker_task = asyncio.create_task(clean_expired_listings_worker())
    news_task = asyncio.create_task(news_refresh_worker())
    
    yield
    
    # 3. Shutdown: Stop background tasks cleanly
    print("[SERVER SHUTDOWN] Terminating background tasks...")
    worker_task.cancel()
    news_task.cancel()
    await asyncio.gather(worker_task, news_task, return_exceptions=True)
    print("[SERVER SHUTDOWN] Cleanup complete. Goodbye!")

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API services for the MilkMaatu premium farmer marketplace portal.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints under prefix (e.g. /api)
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(feed_router, prefix=settings.API_PREFIX)
app.include_router(order_router, prefix=settings.API_PREFIX)
app.include_router(cattle_router, prefix=settings.API_PREFIX)
app.include_router(profile_router, prefix=settings.API_PREFIX)
app.include_router(admin_router, prefix=settings.API_PREFIX)
app.include_router(ai_router, prefix=settings.API_PREFIX)
app.include_router(report_router, prefix=settings.API_PREFIX)
app.include_router(news_router, prefix=settings.API_PREFIX)

@app.get("/", tags=["Health Check"])
async def root():
    return {
        "success": True,
        "message": "MilkMaatu Backend API server is online and running",
        "docs_url": "/docs"
    }
