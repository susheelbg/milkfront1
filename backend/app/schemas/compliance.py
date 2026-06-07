from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class CattleReportCreate(BaseModel):
    cattle_id: int = Field(..., description="ID of the listing being reported")
    reason: str = Field(..., description="Reason for reporting (spam, fake, offensive, fraud)")

class CattleReportResponse(BaseModel):
    id: int
    cattle_id: int
    reporter_id: int
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
