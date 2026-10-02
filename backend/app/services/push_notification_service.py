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


def _get_firebase_app():
    """Initialize Firebase Admin once, using backend-only service-account credentials."""
    if not settings.FIREBASE_SERVICE_ACCOUNT_JSON:
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
                raw_json = settings.FIREBASE_SERVICE_ACCOUNT_JSON.strip()
                if os.path.exists(raw_json):
                    with open(raw_json, "r", encoding="utf-8") as f:
                        service_account_info = json.load(f)
                else:
                    if (raw_json.startswith('"') and raw_json.endswith('"')) or (raw_json.startswith("'") and raw_json.endswith("'")):
                        raw_json = raw_json[1:-1].strip()
                    service_account_info = json.loads(raw_json)

                credential_project_id = service_account_info.get("project_id")
                if credential_project_id != settings.FIREBASE_PROJECT_ID:
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
                logger.info(
                    "[FIREBASE] Admin SDK initialized successfully — project: %s app: %s",
                    settings.FIREBASE_PROJECT_ID, _FIREBASE_APP_NAME,
                )
                return app
            except Exception:
                logger.exception("Firebase Admin initialization failed; push delivery is disabled.")
                return None


def check_firebase_status() -> dict:
    """
    Safe diagnostic: check if Firebase Admin is configured and initialized.
    Never returns credentials, private keys, or token values.
    """
    has_config = bool(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
    project_id = settings.FIREBASE_PROJECT_ID or "NOT SET"
    app = _get_firebase_app()
    return {
        "firebase_configured": has_config,
        "firebase_project_id": project_id,
        "firebase_initialized": app is not None,
        "firebase_app_name": app.name if app else None,
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
        logger.warning("[FCM] Firebase app not initialized — skipping batch send.")
        return None

    from firebase_admin import messaging

    data = {"type": type_name}
    if reference_id is not None:
        data["reference_id"] = reference_id

    multicast = messaging.MulticastMessage(
        notification=messaging.Notification(title=title, body=message),
        data=data,
        tokens=tokens,
    )
    batch_response = messaging.send_each_for_multicast(multicast, app=app)
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
    return getattr(error, "code", None) in {"UNREGISTERED", "SENDER_ID_MISMATCH"}


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
        logger.info("[FCM] send_push_notifications called with empty user_ids — no push sent.")
        return

    logger.info("[FCM] Push requested for %d recipient user(s) | type=%s", len(user_ids), type_name)

    try:
        result = await db.execute(
            select(UserDevice.device_token).where(
                UserDevice.user_id.in_(user_ids),
                UserDevice.is_active.is_(True),
            )
        )
        tokens = list(result.scalars().all())
    except Exception:
        logger.exception("Could not retrieve active device tokens; skipping push delivery.")
        try:
            await db.rollback()
        except Exception:
            pass
        return

    if not tokens:
        logger.info(
            "[FCM] No active device tokens found for %d user(s) — push skipped (type=%s).",
            len(user_ids), type_name,
        )
        return

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