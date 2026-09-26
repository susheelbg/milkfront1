import logging
from typing import Optional, Dict, Any
import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

_jwks_clients: Dict[str, PyJWKClient] = {}

def get_jwks_client_for_url(base_url: str) -> Optional[PyJWKClient]:
    """Lazy initialize PyJWKClient for a specific Supabase base URL."""
    if not base_url:
        return None
    clean_base = base_url.rstrip("/")
    if clean_base not in _jwks_clients:
        jwks_url = f"{clean_base}/auth/v1/.well-known/jwks.json"
        _jwks_clients[clean_base] = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
    return _jwks_clients[clean_base]

def get_jwks_client() -> Optional[PyJWKClient]:
    """Lazy initialize PyJWKClient using configured SUPABASE_URL."""
    return get_jwks_client_for_url(settings.SUPABASE_URL)

def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Verifies Supabase JWT token using JWKS (ES256 / RS256) public keys.
    Falls back to SUPABASE_JWT_SECRET (HS256) if provided and JWKS fails.
    Extracts dynamic issuer from token if needed to guarantee signature verification.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decode unverified token claims & headers first to inspect alg, kid, and iss
    unverified_header = {}
    unverified_claims = {}
    try:
        unverified_header = jwt.get_unverified_header(token)
        unverified_claims = jwt.decode(token, options={"verify_signature": False})
    except Exception as e:
        logger.debug(f"Could not parse token headers: {e}")

    alg = unverified_header.get("alg", "ES256")
    iss = unverified_claims.get("iss", "")

    # 1. Primary verification: Supabase JWKS signing keys (ES256/RS256)
    target_base_url = settings.SUPABASE_URL
    if not target_base_url and iss and "supabase.co" in iss:
        # iss looks like https://<project>.supabase.co/auth/v1
        target_base_url = iss.replace("/auth/v1", "").rstrip("/")

    jwks = get_jwks_client_for_url(target_base_url) if target_base_url else get_jwks_client()
    if jwks and alg in ("ES256", "RS256", "ES384", "ES512"):
        try:
            signing_key = jwks.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256", "ES384", "ES512", "HS256"],
                options={"verify_exp": True, "verify_aud": False},
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            logger.debug(f"JWKS verification failed: {e}. Trying fallback...")

    # 2. Fallback verification: SUPABASE_JWT_SECRET (HS256)
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_exp": True, "verify_aud": False},
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            logger.debug(f"Secret fallback verification failed: {e}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication token or signature verification failed",
        headers={"WWW-Authenticate": "Bearer"},
    )

