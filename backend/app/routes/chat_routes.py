import logging
import uuid
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_, select
from sqlalchemy.exc import DBAPIError, IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.chat_message import ChatMessage, ChatMessageReport
from app.models.user import Profile
from app.schemas.chat import ChatMessageCreate, ChatMessagePage, ChatMessageResponse, ChatModerationReport, ChatReportCreate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/community-chat", tags=["Community Chat"])


async def _validate_voice_object(voice_path: str) -> None:
    from app.core.config import settings

    storage_url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/authenticated/chat-voice/{voice_path}"
    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(storage_url, headers=headers)
    except httpx.HTTPError as error:
        raise HTTPException(status_code=502, detail="Could not verify uploaded voice message.") from error
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Uploaded voice message was not found.")

    audio = response.content
    if not audio or len(audio) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Voice messages must be smaller than 5 MB.")
    extension = voice_path.rsplit(".", 1)[-1].lower()
    signatures = {
        "webm": audio.startswith(b"\x1a\x45\xdf\xa3"),
        "mp4": len(audio) >= 12 and audio[4:8] == b"ftyp",
        "aac": len(audio) >= 2 and audio[0] == 0xFF and audio[1] & 0xF6 == 0xF0,
        "ogg": audio.startswith(b"OggS"),
        "3gp": len(audio) >= 12 and audio[4:8] == b"ftyp",
    }
    if not signatures.get(extension, False):
        raise HTTPException(status_code=415, detail="Voice file contents do not match a supported audio format.")


def _message_response(message: ChatMessage) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=message.id,
        user_id=message.user_id,
        message_type=message.message_type,
        content=message.content,
        voice_path=message.voice_path,
        image_path=message.image_path,
        created_at=message.created_at,
        display_name=(message.profile.name or "MilkMaatu Farmer").strip() or "MilkMaatu Farmer",
        avatar_url=message.profile.avatar_url,
    )


@router.get("/messages", response_model=ChatMessagePage)
async def get_chat_messages(
    limit: int = Query(30, ge=1, le=50),
    before: Optional[datetime] = None,
    before_id: Optional[uuid.UUID] = None,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if (before is None) != (before_id is None):
        raise HTTPException(status_code=422, detail="before and before_id must be provided together.")

    stmt = select(ChatMessage).options(selectinload(ChatMessage.profile))
    if before is not None and before_id is not None:
        stmt = stmt.where(
            or_(
                ChatMessage.created_at < before,
                and_(ChatMessage.created_at == before, ChatMessage.id < before_id),
            )
        )
    result = await db.execute(
        stmt.order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc()).limit(limit + 1)
    )
    messages = result.scalars().all()
    has_more = len(messages) > limit
    return ChatMessagePage(
        items=[_message_response(message) for message in messages[:limit]],
        has_more=has_more,
    )


@router.post("/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_message(
    req: ChatMessageCreate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    voice_path = req.voice_path
    image_path = req.image_path
    if req.message_type == "voice":
        owner_prefix = f"{current_user.id}/"
        if not voice_path or not voice_path.startswith(owner_prefix) or "/" in voice_path[len(owner_prefix):]:
            raise HTTPException(status_code=400, detail="Voice path must belong to the authenticated user.")
        if not voice_path.lower().endswith((".webm", ".mp4", ".aac", ".ogg", ".3gp")):
            raise HTTPException(status_code=415, detail="Unsupported voice message format.")
        await _validate_voice_object(voice_path)
    elif req.message_type == "image":
        owner_prefix = f"{current_user.id}/"
        if not image_path or not image_path.startswith(owner_prefix) or "/" in image_path[len(owner_prefix):]:
            raise HTTPException(status_code=400, detail="Image path must belong to the authenticated user.")
        if not image_path.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            raise HTTPException(status_code=415, detail="Unsupported image message format.")

    message = ChatMessage(
        user_id=current_user.id,
        message_type=req.message_type,
        content=req.content,
        voice_path=voice_path,
        image_path=image_path,
    )
    db.add(message)
    try:
        await db.commit()
        await db.refresh(message)
    except DBAPIError as error:
        await db.rollback()
        if "Chat message rate limit exceeded" in str(error.orig):
            raise HTTPException(status_code=429, detail="Please wait before sending another message.") from error
        raise

    message.profile = current_user
    return _message_response(message)


@router.delete("/messages/{message_id}")
async def delete_own_chat_message(
    message_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatMessage).where(
            ChatMessage.id == message_id,
            ChatMessage.user_id == current_user.id,
        )
    )
    message = result.scalar_one_or_none()
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found or access denied.")
    await db.delete(message)
    await db.commit()
    return {"success": True, "message": "Message deleted."}


@router.post("/messages/{message_id}/reports", status_code=status.HTTP_201_CREATED)
async def report_chat_message(
    message_id: uuid.UUID,
    req: ChatReportCreate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ChatMessage).where(ChatMessage.id == message_id))
    message = result.scalar_one_or_none()
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found.")
    if message.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot report your own message.")

    db.add(ChatMessageReport(message_id=message_id, reporter_id=current_user.id, reason=req.reason))
    try:
        await db.commit()
    except IntegrityError as error:
        await db.rollback()
        raise HTTPException(status_code=409, detail="You have already reported this message.") from error
    return {"success": True, "message": "Report submitted."}


@router.get("/admin/reports", response_model=list[ChatModerationReport])
async def get_chat_reports(
    admin_user: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ChatMessageReport)
        .join(ChatMessage, ChatMessage.id == ChatMessageReport.message_id)
        .options(
            selectinload(ChatMessageReport.message).selectinload(ChatMessage.profile),
        )
        .where(ChatMessageReport.status == "open")
        .order_by(ChatMessageReport.created_at.desc())
        .limit(200)
    )
    result = await db.execute(stmt)
    reports = result.scalars().all()
    return [
        ChatModerationReport(
            id=report.id,
            message_id=report.message.id,
            reason=report.reason,
            created_at=report.created_at,
            sender_name=(report.message.profile.name or "MilkMaatu Farmer").strip() or "MilkMaatu Farmer",
            message_type=report.message.message_type,
            content=report.message.content,
            voice_path=report.message.voice_path,
            image_path=report.message.image_path,
        )
        for report in reports
    ]


@router.delete("/admin/messages/{message_id}")
async def remove_chat_message_admin(
    message_id: uuid.UUID,
    admin_user: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    message = await db.get(ChatMessage, message_id)
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found.")
    await db.delete(message)
    await db.commit()
    return {"success": True, "message": "Message removed."}