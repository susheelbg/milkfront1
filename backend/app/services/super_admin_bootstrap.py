import logging
import httpx
from sqlalchemy import text
from app.core.config import settings
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

async def bootstrap_super_admin():
    """
    Idempotent bootstrap process for the initial Super Admin:
    1. Reads credentials from backend environment.
    2. Checks if the Super Admin user exists in Supabase Auth / auth.users.
    3. If missing, creates the user via the Supabase Auth Admin REST API.
    4. Ensures a corresponding public.profiles row exists with role='super_admin'.
    Never logs or exposes the password or service-role key.
    """
    email = settings.INITIAL_SUPER_ADMIN_EMAIL.strip().lower() if settings.INITIAL_SUPER_ADMIN_EMAIL else ""
    password = settings.INITIAL_SUPER_ADMIN_PASSWORD.strip() if settings.INITIAL_SUPER_ADMIN_PASSWORD else ""
    supabase_url = settings.SUPABASE_URL.rstrip("/")
    service_role_key = settings.SUPABASE_SERVICE_ROLE_KEY.strip() if settings.SUPABASE_SERVICE_ROLE_KEY else ""

    if not email or not password:
        logger.info("[SUPER ADMIN BOOTSTRAP] No INITIAL_SUPER_ADMIN credentials configured. Skipping.")
        return

    if not supabase_url or not service_role_key:
        logger.warning("[SUPER ADMIN BOOTSTRAP] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Cannot run bootstrap.")
        return

    logger.info(f"[SUPER ADMIN BOOTSTRAP] Verifying Super Admin account for: {email}")

    auth_user_id = None

    # Step 1: Check if user exists in auth.users via database connection
    try:
        async with SessionLocal() as db:
            res = await db.execute(text("SELECT id FROM auth.users WHERE lower(email) = :email"), {"email": email})
            auth_user_id = res.scalar()
    except Exception as e:
        logger.warning(f"[SUPER ADMIN BOOTSTRAP] Direct auth.users query failed ({e}). Checking via Supabase REST API...")

    # Step 2: If not found in DB, check / create via Supabase Admin API
    if not auth_user_id:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                # Check via Admin API list users
                list_resp = await client.get(
                    f"{supabase_url}/auth/v1/admin/users",
                    headers={
                        "apikey": service_role_key,
                        "Authorization": f"Bearer {service_role_key}",
                    }
                )
                if list_resp.status_code == 200:
                    users_data = list_resp.json().get("users", [])
                    for u in users_data:
                        if u.get("email", "").lower() == email:
                            auth_user_id = u.get("id")
                            break

                # Create if still not found
                if not auth_user_id:
                    create_resp = await client.post(
                        f"{supabase_url}/auth/v1/admin/users",
                        headers={
                            "apikey": service_role_key,
                            "Authorization": f"Bearer {service_role_key}",
                        },
                        json={
                            "email": email,
                            "password": password,
                            "email_confirm": True,
                            "user_metadata": {"name": "Super Admin"}
                        }
                    )
                    if create_resp.status_code in (200, 201):
                        auth_user_id = create_resp.json().get("id")
                        logger.info("[SUPER ADMIN BOOTSTRAP] Successfully created Supabase Auth user.")
                    else:
                        logger.error(f"[SUPER ADMIN BOOTSTRAP] Failed to create auth user: HTTP {create_resp.status_code}")
                        return
        except Exception as e:
            logger.error(f"[SUPER ADMIN BOOTSTRAP] Error communicating with Supabase Admin API: {e}")
            return

    if not auth_user_id:
        logger.error("[SUPER ADMIN BOOTSTRAP] Could not resolve auth_user_id.")
        return

    # Step 3: Ensure public.profiles record has role='super_admin' AND auth.users has role in raw_app_meta_data
    try:
        async with SessionLocal() as db:
            await db.execute(text("""
                INSERT INTO public.profiles (id, email, name, role)
                VALUES (:id, :email, 'Super Admin', 'super_admin')
                ON CONFLICT (id) DO UPDATE 
                SET role = 'super_admin', email = :email, updated_at = now();
            """), {"id": auth_user_id, "email": email})

            # Also sync role to auth.users.raw_app_meta_data so it appears directly in Supabase JWT claims
            try:
                await db.execute(text("""
                    UPDATE auth.users 
                    SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb
                    WHERE id = :id;
                """), {"id": auth_user_id})
            except Exception as e_meta:
                logger.debug(f"[SUPER ADMIN BOOTSTRAP] Direct raw_app_meta_data update note: {e_meta}")

            await db.commit()
            logger.info(f"[SUPER ADMIN BOOTSTRAP] Confirmed Super Admin role in public.profiles (ID: {auth_user_id}).")
    except Exception as e:
        logger.error(f"[SUPER ADMIN BOOTSTRAP] Failed to upsert public.profiles row: {e}")
