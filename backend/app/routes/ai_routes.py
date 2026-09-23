from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from app.services.ai.nandini_ai import nandini_ai_service

router = APIRouter(prefix="/ai", tags=["Nandini AI"])

class AIRequest(BaseModel):
    prompt: str = Field(..., description="The query for Nandini AI")
    language: Optional[str] = Field(None, description="Preferred language ('kn' or 'en')")

@router.post("/nandini")
async def ask_nandini(req: AIRequest):
    """
    Public endpoint for Nandini AI dairy farming assistant.
    No farmer registration or login required.
    """
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt cannot be empty"
        )
    
    lang = req.language or "kn"
    
    try:
        response_text = await nandini_ai_service.get_response(req.prompt.strip(), lang=lang)
        return {"response": response_text}
    except Exception as e:
        print(f"[AI ROUTE EXCEPTION] {e}", flush=True)
        return {"response": "ಕ್ಷಮಿಸಿ, ಉತ್ತರವನ್ನು ಪಡೆಯುವಲ್ಲಿ ತೊಂದರೆಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ."}
