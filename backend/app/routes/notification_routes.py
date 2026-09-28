import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import Profile
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.services import notification_service
from app.utils.response import json_response

router = APIRouter(tags=["Notifications"])


@router.get("/notifications")
async def get_my_notifications(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve notifications for the authenticated user."""
    notifications = await notification_service.get_user_notifications(db, current_user.id)
    payload = [NotificationResponse.model_validate(n).model_dump(by_alias=True) for n in notifications]
    return json_response(
        success=True,
        message="Notifications retrieved successfully",
        data=payload
    )


@router.get("/notifications/unread-count")
async def get_my_unread_count(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the count of unread notifications for the authenticated user."""
    count = await notification_service.get_unread_count(db, current_user.id)
    payload = UnreadCountResponse(unread_count=count).model_dump(by_alias=True)
    return json_response(
        success=True,
        message="Unread count retrieved successfully",
        data=payload
    )


@router.patch("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all unread notifications for the authenticated user as read."""
    count = await notification_service.mark_all_notifications_as_read(db, current_user.id)
    return json_response(
        success=True,
        message=f"{count} notifications marked as read",
        data={"markedCount": count}
    )


@router.patch("/notifications/{id}/read")
async def mark_single_notification_read(
    id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a single notification as read if it belongs to the authenticated user."""
    notif = await notification_service.mark_notification_as_read(db, current_user.id, id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied."
        )
    payload = NotificationResponse.model_validate(notif).model_dump(by_alias=True)
    return json_response(
        success=True,
        message="Notification marked as read",
        data=payload
    )
