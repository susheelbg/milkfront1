from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ChatMessageCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message_type: Literal["text", "voice"]
    content: Optional[str] = Field(None, max_length=2000)
    voice_path: Optional[str] = Field(None, max_length=512)

    @field_validator("content")
    @classmethod
    def trim_message_content(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty.")
        return value

    @field_validator("voice_path")
    @classmethod
    def validate_voice_path(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and (not value.strip() or ".." in value or value.startswith("/")):
            raise ValueError("Invalid voice message path.")
        return value

    @model_validator(mode="after")
    def validate_payload(self):
        if self.message_type == "text" and (self.content is None or self.voice_path is not None):
            raise ValueError("Text messages require content and cannot include a voice path.")
        if self.message_type == "voice" and (self.content is not None or self.voice_path is None):
            raise ValueError("Voice messages require a voice path and cannot include text content.")
        return self


class ChatMessageResponse(BaseModel):
    id: UUID
    user_id: UUID
    message_type: Literal["text", "voice"]
    content: Optional[str]
    voice_path: Optional[str]
    created_at: datetime
    display_name: str
    avatar_url: Optional[str] = None


class ChatMessagePage(BaseModel):
    items: list[ChatMessageResponse]
    has_more: bool


class ChatReportCreate(BaseModel):
    reason: str = Field(..., max_length=500)

    @field_validator("reason")
    @classmethod
    def trim_reason(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Report reason cannot be empty.")
        return value


class ChatModerationReport(BaseModel):
    id: UUID
    message_id: UUID
    reason: str
    created_at: datetime
    sender_name: str
    message_type: Literal["text", "voice"]
    content: Optional[str]
    voice_path: Optional[str]