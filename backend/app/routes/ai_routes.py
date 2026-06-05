from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from app.services.ai.nandini_ai import nandini_ai_service
from app.utils.response import json_response
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["Nandini AI"])

class AIRequest(BaseModel):
    prompt: str = Field(..., description="The query for Nandini AI")
    language: Optional[str] = Field(None, description="Preferred language ('kn' or 'en')")

@router.post("/nandini")
async def ask_nandini(req: AIRequest, current_user: User = Depends(get_current_user)):
    """
    Endpoint for Nandini AI dairy farming assistant.
    """
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt cannot be empty"
        )
    
    lang = req.language or current_user.language or "kn"
    
    try:
        response_text = await nandini_ai_service.get_response(req.prompt.strip(), lang=lang)
        return {"response": response_text}
    except Exception as e:
        print(f"[AI ROUTE EXCEPTION] {e}", flush=True)
        return {"response": "ಕ್ಷಮಿಸಿ, ಉತ್ತರವನ್ನು ಪಡೆಯುವಲ್ಲಿ ತೊಂದರೆಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ."}
