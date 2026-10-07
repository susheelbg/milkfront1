import asyncio
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import httpx
from fastapi import FastAPI, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.chat_message import ChatMessage, ChatMessageReport
from app.models.user import Profile
from app.routes.chat_routes import (
    create_chat_message,
    delete_own_chat_message,
    get_chat_messages,
    get_chat_reports,
    remove_chat_message_admin,
    report_chat_message,
    router as chat_router,
)
from app.schemas.chat import ChatMessageCreate, ChatReportCreate


async def run_tests():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as db:
        farmer_id = uuid.uuid4()
        another_farmer_id = uuid.uuid4()
        admin_id = uuid.uuid4()
        farmer = Profile(id=farmer_id, name="Farmer One", email="private@example.com", phone="9999999999", address="Private Address", role="user")
        another_farmer = Profile(id=another_farmer_id, name="Farmer Two", role="user")
        admin = Profile(id=admin_id, name="Chat Admin", role="admin")
        db.add_all([farmer, another_farmer, admin])
        await db.commit()

        try:
            await get_current_admin(current_user=farmer)
        except HTTPException as error:
            assert error.status_code == 403
        else:
            raise AssertionError("Normal user passed the admin guard")

        test_app = FastAPI()
        test_app.include_router(chat_router, prefix="/api")
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app), base_url="http://test") as client:
            unauthenticated = await client.get("/api/community-chat/messages")
            assert unauthenticated.status_code in (401, 403)

        with patch("app.routes.chat_routes._validate_voice_object", new=AsyncMock()):
            text_message = await create_chat_message(
                req=ChatMessageCreate(message_type="text", content="  ನಮಸ್ಕಾರ 🙏  "),
                current_user=farmer,
                db=db,
            )
            assert text_message.content == "ನಮಸ್ಕಾರ 🙏"
            assert text_message.user_id == farmer_id
            assert text_message.display_name == "Farmer One"
            assert not hasattr(text_message, "email")

            voice_path = f"{farmer_id}/recording.webm"
            voice_message = await create_chat_message(
                req=ChatMessageCreate(message_type="voice", voice_path=voice_path),
                current_user=farmer,
                db=db,
            )
            assert voice_message.voice_path == voice_path

            image_path = f"{farmer_id}/chat-photo.png"
            image_message = await create_chat_message(
                req=ChatMessageCreate(message_type="image", image_path=image_path),
                current_user=farmer,
                db=db,
            )
            assert image_message.image_path == image_path
            assert image_message.message_type == "image"

            try:
                await create_chat_message(
                    req=ChatMessageCreate(message_type="voice", voice_path=f"{another_farmer_id}/spoof.webm"),
                    current_user=farmer,
                    db=db,
                )
            except HTTPException as error:
                assert error.status_code == 400
            else:
                raise AssertionError("Voice path belonging to another user was accepted")

        page = await get_chat_messages(limit=30, current_user=farmer, db=db)
        assert len(page.items) == 3
        assert {item.user_id for item in page.items} == {farmer_id}

        try:
            ChatMessageCreate(message_type="text", content="hello", user_id=str(another_farmer_id))
        except Exception:
            pass
        else:
            raise AssertionError("Client-supplied sender id was accepted")

        try:
            await report_chat_message(
                message_id=text_message.id,
                req=ChatReportCreate(reason="self-report"),
                current_user=farmer,
                db=db,
            )
        except HTTPException as error:
            assert error.status_code == 400
        else:
            raise AssertionError("User reported their own message")

        await report_chat_message(
            message_id=text_message.id,
            req=ChatReportCreate(reason="Spam"),
            current_user=another_farmer,
            db=db,
        )
        reports = await get_chat_reports(admin_user=admin, db=db)
        assert len(reports) == 1
        assert reports[0].sender_name == "Farmer One"
        assert reports[0].reason == "Spam"

        await delete_own_chat_message(message_id=text_message.id, current_user=farmer, db=db)
        remaining = (await db.execute(select(ChatMessage).where(ChatMessage.id == text_message.id))).scalar_one_or_none()
        assert remaining is None

        async def override_db():
            yield db

        async def override_current_user():
            return farmer

        test_app.dependency_overrides[get_db] = override_db
        test_app.dependency_overrides[get_current_user] = override_current_user
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app), base_url="http://test") as client:
            unauthorized_reports = await client.get("/api/community-chat/admin/reports")
            assert unauthorized_reports.status_code == 403

        await remove_chat_message_admin(message_id=voice_message.id, admin_user=admin, db=db)
        assert await db.get(ChatMessage, voice_message.id) is None
        assert await db.get(ChatMessageReport, reports[0].id) is None

    await engine.dispose()
    print("Community chat auth, identity, voice ownership, reporting, and moderation tests passed.")


if __name__ == "__main__":
    asyncio.run(run_tests())
