from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

def json_response(success: bool, message: str, data: any = None, status_code: int = 200) -> JSONResponse:
    """Format and return a standardized, frontend-friendly JSON response envelope."""
    content = {
        "success": success,
        "message": message,
        "data": jsonable_encoder(data)
    }
    return JSONResponse(content=content, status_code=status_code)
