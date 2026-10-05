import asyncio
import json
import logging
import threading
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user_device import UserDevice

logger = logging.getLogger(__name__)

_FIREBASE_APP_NAME = "milkmaatu-push"
_firebase_lock = threading.Lock()


_last_init_error: Optional[str] = None


def _get_service_account_raw() -> tuple[Optional[str], Optional[str]]:
    """Read the backend-only service account from its required setting."""
    if settings.FIREBASE_SERVICE_ACCOUNT_JSON and settings.FIREBASE_SERVICE_ACCOUNT_JSON.strip():
        return settings.FIREBASE_SERVICE_ACCOUNT_JSON.strip(), "FIREBASE_SERVICE_ACCOUNT_JSON"
    return None, None


def _get_firebase_app():
    """Initialize Firebase Admin once, using backend-only service-account credentials."""
    global _last_init_error

    raw_json, key_found = _get_service_account_raw()
    if not raw_json:
        _last_init_error = "FIREBASE_SERVICE_ACCOUNT_JSON is empty (no matching env var found)."
        return None

    if settings.FIREBASE_PROJECT_ID != "milkfront1":
        _last_init_error = "FIREBASE_PROJECT_ID must be 'milkfront1'."
        logger.error("Firebase Admin initialization requires FIREBASE_PROJECT_ID=milkfront1.")
        return None

    import firebase_admin
    from firebase_admin import credentials

    try:
        return firebase_admin.get_app(_FIREBASE_APP_NAME)
    except ValueError:
        pass

    with _firebase_lock:
        try:
            return firebase_admin.get_app(_FIREBASE_APP_NAME)
        except ValueError:
            try:
                import os
                if os.path.exists(raw_json):
                    with open(raw_json, "r", encoding="utf-8") as f:
                        service_account_info = json.load(f)
                else:
                    if (raw_json.startswith('"') and raw_json.endswith('"')) or (raw_json.startswith("'") and raw_json.endswith("'")):
                        raw_json = raw_json[1:-1].strip()
                    service_account_info = json.loads(raw_json)

                credential_project_id = service_account_info.get("project_id")
                if credential_project_id != settings.FIREBASE_PROJECT_ID:
                    _last_init_error = f"Project mismatch: service account project is '{credential_project_id}' but FIREBASE_PROJECT_ID is '{settings.FIREBASE_PROJECT_ID}'"
                    logger.error(
                        "Firebase service-account project (%s) does not match FIREBASE_PROJECT_ID (%s).",
                        credential_project_id, settings.FIREBASE_PROJECT_ID,
                    )
                    return None

                credential = credentials.Certificate(service_account_info)
                app = firebase_admin.initialize_app(
                    credential,
                    {"projectId": settings.FIREBASE_PROJECT_ID},
                    name=_FIREBASE_APP_NAME,
                )
                _last_init_error = None
                logger.info(
                    "[FIREBASE] Admin SDK initialized successfully via env var '%s' — project: %s app: %s",
                    key_found, settings.FIREBASE_PROJECT_ID, _FIREBASE_APP_NAME,
                )
                return app
            except Exception as e:
                _last_init_error = f"{type(e).__name__}: {str(e)}"
                logger.exception("Firebase Admin initialization failed; push delivery is disabled.")
                return None


def check_firebase_status() -> dict:
    """
    Safe diagnostic: check if Firebase Admin is configured and initialized.
    Never returns credentials, private keys, or token values.
    """
    import os
    raw_json, key_found = _get_service_account_raw()
    all_env_keys = [k for k in os.environ.keys() if "FIREBASE" in k.upper() or "SERVICE" in k.upper() or "ACCOUNT" in k.upper()]
    app = _get_firebase_app()
    return {
        "firebase_configured": bool(raw_json),
        "key_found_name": key_found,
        "matching_env_keys": all_env_keys,
        "firebase_project_id": settings.FIREBASE_PROJECT_ID or "NOT SET",
        "firebase_initialized": app is not None,
        "firebase_app_name": app.name if app else None,
        "init_error": _last_init_error if app is None else None,
    }


def _send_batch(
    tokens: list[str],
    title: str,
    message: str,
    type_name: str,
    reference_id: Optional[str],
) -> Optional[list[tuple[str, Optional[Exception]]]]:
    """Send one Firebase batch and pair each token with its response error, if any."""
    app = _get_firebase_app()
    if app is None:
        print("[FCM WARNING] Firebase app not initialized — FIREBASE_SERVICE_ACCOUNT_JSON may be missing/invalid on Render.")
        logger.warning("[FCM] Firebase app not initialized — skipping batch send.")
        return None

    from firebase_admin import messaging

    data = {"type": type_name}
    if reference_id is not None:
        data["reference_id"] = str(reference_id)

    messages = [
        messaging.Message(
            notification=messaging.Notification(title=title, body=message),
            data=data,
            token=token,
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    title=title,
                    body=message,
                    icon="ic_stat_milkmaatu",
                    color="#D97706",
                    channel_id="milkmaatu_high_importance",
                    default_sound=True,
                    default_vibrate_timings=True,
                    visibility="public",
                ),
            ),
        )
        for token in tokens
    ]

    batch_response = messaging.send_each(messages, app=app)
    print(f"[FCM SUCCESS] Batch sent: {len(tokens)} token(s) | Success={batch_response.success_count} Failure={batch_response.failure_count} | Type={type_name}")
    logger.info(
        "[FCM] Batch sent: %d tokens | success=%d failure=%d | type=%s",
        len(tokens),
        batch_response.success_count,
        batch_response.failure_count,
        type_name,
    )
    return [
        (token, response.exception)
        for token, response in zip(tokens, batch_response.responses)
    ]


def _is_invalid_token_error(error: Exception) -> bool:
    # Firebase Admin Python SDK (HTTP v1 API) returns:
    #   NOT_FOUND        — token unregistered / app uninstalled (most common)
    #   UNREGISTERED     — alias for NOT_FOUND in some SDK versions
    #   SENDER_ID_MISMATCH — token registered to a different Firebase project
    return getattr(error, "code", None) in {"NOT_FOUND", "UNREGISTERED", "SENDER_ID_MISMATCH"}


async def send_push_notifications(
    db: AsyncSession,
    user_ids: list[UUID],
    title: str,
    message: str,
    type_name: str,
    reference_id: Optional[str] = None,
) -> None:
    """Send best-effort pushes to active devices; push failures never escape this function."""
    if not user_ids:
        print("[FCM INFO] send_push_notifications called with 0 target users — no push sent.")
        logger.info("[FCM] send_push_notifications called with empty user_ids — no push sent.")
        return

    print(f"[FCM PUSH REQUEST] Requesting push for {len(user_ids)} recipient user(s) | Type={type_name}")
    logger.info("[FCM] Push requested for %d recipient user(s) | type=%s", len(user_ids), type_name)

    try:
        result = await db.execute(
            select(UserDevice.device_token).where(
                UserDevice.user_id.in_(user_ids),
                UserDevice.is_active.is_(True),
            )
        )
        tokens = list(result.scalars().all())
    except Exception as db_err:
        print(f"[FCM DB ERROR] Could not retrieve active device tokens: {db_err}")
        logger.exception("Could not retrieve active device tokens; skipping push delivery.")
        try:
            await db.rollback()
        except Exception:
            pass
        return

    if not tokens:
        print(f"[FCM NOTICE] No active device tokens (is_active=True) found in user_devices for target user(s) — push skipped.")
        logger.info(
            "[FCM] No active device tokens found for %d user(s) — push skipped (type=%s).",
            len(user_ids), type_name,
        )
        return

    print(f"[FCM DISPATCH] Found {len(tokens)} active device token(s) — delivering via Firebase...")
    logger.info("[FCM] Found %d active device token(s) — sending FCM batch(es).", len(tokens))

    invalid_tokens = []
    for offset in range(0, len(tokens), 500):
        token_batch = tokens[offset:offset + 500]
        try:
            responses = await asyncio.to_thread(
                _send_batch,
                token_batch,
                title,
                message,
                type_name,
                reference_id,
            )
            if responses is None:
                return
            batch_invalid = [
                token for token, error in responses
                if error is not None and _is_invalid_token_error(error)
            ]
            if batch_invalid:
                logger.info("[FCM] %d token(s) are invalid/unregistered — will deactivate.", len(batch_invalid))
            invalid_tokens.extend(batch_invalid)
        except Exception:
            logger.exception("Firebase push batch failed; in-app notifications remain available.")

    if invalid_tokens:
        try:
            await db.execute(
                update(UserDevice)
                .where(
                    UserDevice.device_token.in_(invalid_tokens),
                    UserDevice.is_active.is_(True),
                )
                .values(is_active=False, updated_at=datetime.now(timezone.utc))
            )
            await db.commit()
            logger.info("Deactivated %d invalid FCM device token(s).", len(invalid_tokens))
        except Exception:
            logger.exception("Could not deactivate invalid FCM device tokens.")
            try:
                await db.rollback()
            except Exception:
                pass