import logging
from typing import Optional, Dict, Any
import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

_jwks_client: Optional[PyJWKClient] = None

def get_jwks_client() -> Optional[PyJWKClient]:
    """Lazy initialize PyJWKClient to fetch and cache public signing keys from Supabase."""
    global _jwks_client
    if _jwks_client is None and settings.SUPABASE_URL:
        base_url = settings.SUPABASE_URL.rstrip("/")
        jwks_url = f"{base_url}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
    return _jwks_client

def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Verifies Supabase JWT token using JWKS (ES256 / RS256) public keys.
    Falls back to SUPABASE_JWT_SECRET (HS256) if provided and JWKS fails.
    Never decodes without cryptographic signature verification.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Primary verification: Supabase JWKS signing keys (ES256/RS256)
    jwks = get_jwks_client()
    if jwks:
        try:
            signing_key = jwks.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256", "HS256"],
                audience="authenticated",
                options={"verify_exp": True},
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            logger.debug(f"JWKS verification failed: {e}. Checking fallback secret...")

    # 2. Fallback verification: SUPABASE_JWT_SECRET if present
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_exp": True},
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            logger.error(f"Fallback secret verification failed: {e}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication token or signature verification failed",
        headers={"WWW-Authenticate": "Bearer"},
    )
