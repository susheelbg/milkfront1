from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.cattle import Cattle
from app.models.cattle_report import CattleReport
from app.schemas.compliance import CattleReportCreate
from app.utils.response import json_response

router = APIRouter(tags=["Compliance & Moderation"])

@router.post("/cattle/report")
async def report_cattle_listing(
    req: CattleReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """File a report against a Sante cattle listing."""
    # 1. Verify listing exists
    result = await db.execute(select(Cattle).where(Cattle.id == req.cattle_id))
    cattle = result.scalars().first()
    if not cattle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cattle listing not found."
        )

    # 2. Create the report
    report = CattleReport(
        cattle_id=req.cattle_id,
        reporter_id=current_user.id,
        reason=req.reason,
        status="pending"
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    return json_response(
        success=True,
        message="Listing has been reported successfully. Administration will review it shortly."
    )

@router.get("/admin/reports")
async def get_all_reports(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all filed content reports (Admin only)."""
    result = await db.execute(
        select(CattleReport)
        .order_by(CattleReport.created_at.desc())
    )
    reports = result.scalars().all()
    
    payload = []
    for r in reports:
        # Load related cattle details
        cattle_res = await db.execute(select(Cattle).where(Cattle.id == r.cattle_id))
        cattle = cattle_res.scalars().first()
        
        # Load reporter details
        reporter_res = await db.execute(select(User).where(User.id == r.reporter_id))
        reporter = reporter_res.scalars().first()
        
        payload.append({
            "id": r.id,
            "cattleId": r.cattle_id,
            "cattleName": cattle.animal_name if cattle else "Deleted Cattle",
            "sellerPhone": cattle.phone_number if cattle else "N/A",
            "reporterName": reporter.full_name if reporter else "Deleted User",
            "reporterPhone": reporter.phone_number if reporter else "N/A",
            "reason": r.reason,
            "status": r.status,
            "createdAt": r.created_at.isoformat()
        })
        
    return json_response(
        success=True,
        message="Reports retrieved successfully",
        data=payload
    )

@router.post("/admin/reports/{id}/dismiss")
async def dismiss_report(
    id: int,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Dismiss a filed report without taking action against listing (Admin only)."""
    result = await db.execute(select(CattleReport).where(CattleReport.id == id))
    report = result.scalars().first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )
        
    report.status = "dismissed"
    await db.commit()
    
    return json_response(
        success=True,
        message="Report dismissed successfully."
    )

@router.post("/admin/reports/{id}/action")
async def action_report(
    id: int,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Action a report by deleting the reported listing (Admin only)."""
    result = await db.execute(select(CattleReport).where(CattleReport.id == id))
    report = result.scalars().first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )
        
    # Delete listing
    await db.execute(delete(Cattle).where(Cattle.id == report.cattle_id))
    
    report.status = "actioned"
    await db.commit()
    
    return json_response(
        success=True,
        message="Report actioned and listing removed successfully."
    )

@router.post("/admin/users/{phone}/suspend")
async def suspend_user(
    phone: str,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Suspend a user from the platform (Admin only)."""
    result = await db.execute(select(User).where(User.phone_number == phone))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    user.account_status = "suspended"
    # Also delete their active listings
    await db.execute(delete(Cattle).where(Cattle.user_id == user.id))
    await db.commit()
    
    return json_response(
        success=True,
        message="User account suspended successfully."
    )

@router.post("/admin/users/{phone}/unsuspend")
async def unsuspend_user(
    phone: str,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Restore a suspended user account (Admin only)."""
    result = await db.execute(select(User).where(User.phone_number == phone))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    user.account_status = "active"
    await db.commit()
    
    return json_response(
        success=True,
        message="User account restored successfully."
    )
