import base64
import uuid
import re
import httpx
from typing import Optional
from app.core.config import settings

# Default premium cattle photo fallback
DEFAULT_CATTLE_IMAGE = "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=640&h=360&fit=crop"

def upload_image(image_data: str, folder: str = "other", user_id: Optional[str] = None) -> str:
    """
    Upload base64 image data or URI to Supabase Storage bucket 'milkmaatu-image'.
    Organizes files into:
      - cattle/{user_id}/{unique_filename}
      - feeds/{unique_filename}
      - profiles/{user_id}/{unique_filename}
      - other/{unique_filename}
    Returns the public Supabase Storage URL.
    """
    if not image_data:
        return DEFAULT_CATTLE_IMAGE

    # Check if the image_data is already a valid remote HTTP/HTTPS URL
    if image_data.startswith("http://") or image_data.startswith("https://"):
        return image_data

    # Content type & extension resolution
    content_type = "image/jpeg"
    ext = "jpg"

    if image_data.startswith("data:"):
        match = re.match(r"^data:(image/(jpeg|jpg|png|webp));base64,(.*)$", image_data, re.DOTALL | re.IGNORECASE)
        if match:
            raw_type = match.group(1).lower()
            if "png" in raw_type:
                content_type = "image/png"
                ext = "png"
            elif "webp" in raw_type:
                content_type = "image/webp"
                ext = "webp"
            else:
                content_type = "image/jpeg"
                ext = "jpg"
            base64_str = match.group(3)
        else:
            parts = image_data.split(";base64,")
            if len(parts) == 2:
                header = parts[0].lower()
                base64_str = parts[1]
                if "png" in header:
                    content_type = "image/png"
                    ext = "png"
                elif "webp" in header:
                    content_type = "image/webp"
                    ext = "webp"
                else:
                    content_type = "image/jpeg"
                    ext = "jpg"
            else:
                base64_str = image_data
    else:
        base64_str = image_data

    # Validate image format restriction (jpeg, png, webp)
    if content_type not in ("image/jpeg", "image/png", "image/webp"):
        print(f"[SUPABASE STORAGE WARNING] Unsupported content type '{content_type}'. Defaulting to image/jpeg.")
        content_type = "image/jpeg"
        ext = "jpg"

    try:
        raw_bytes = base64.b64decode(base64_str)
    except Exception as e:
        print(f"[SUPABASE STORAGE ERROR] Base64 decode failed: {e}")
        return DEFAULT_CATTLE_IMAGE

    # Validate file size limit (10MB)
    if len(raw_bytes) > 10 * 1024 * 1024:
        print("[SUPABASE STORAGE ERROR] File size exceeds 10MB limit.")
        return DEFAULT_CATTLE_IMAGE

    # Generate collision-resistant UUID filename
    unique_filename = f"{uuid.uuid4().hex}.{ext}"

    # Folder structure logic
    clean_user_id = str(user_id) if user_id else "anonymous"
    if folder == "cattle":
        path = f"cattle/{clean_user_id}/{unique_filename}"
    elif folder == "feeds":
        path = f"feeds/{unique_filename}"
    elif folder == "profiles":
        path = f"profiles/{clean_user_id}/{unique_filename}"
    elif folder.startswith("partners/") and ".." not in folder:
        path = f"{folder.strip('/')}/{unique_filename}"
    else:
        path = f"other/{unique_filename}"

    # Supabase Storage Upload API
    supabase_url = settings.SUPABASE_URL.rstrip("/")
    bucket_name = "milkmaatu-image"
    upload_endpoint = f"{supabase_url}/storage/v1/object/{bucket_name}/{path}"

    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(upload_endpoint, content=raw_bytes, headers=headers)
            if resp.status_code in (200, 201):
                public_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{path}"
                print(f"[SUPABASE STORAGE] Image uploaded successfully to: {public_url}")
                return public_url
            else:
                print(f"[SUPABASE STORAGE ERROR] Upload failed with HTTP {resp.status_code}: {resp.text}")
                return DEFAULT_CATTLE_IMAGE
    except Exception as e:
        print(f"[SUPABASE STORAGE EXCEPTION] Exception during image upload: {e}")
        return DEFAULT_CATTLE_IMAGE


async def upload_image_async(image_data: str, folder: str = "other", user_id: Optional[str] = None) -> str:
    """
    Async upload base64 image data or URI to Supabase Storage with fast non-blocking client.
    Returns public Supabase Storage URL or DEFAULT_CATTLE_IMAGE fallback on error.
    """
    if not image_data:
        return DEFAULT_CATTLE_IMAGE

    if image_data.startswith("http://") or image_data.startswith("https://"):
        return image_data

    content_type = "image/jpeg"
    ext = "jpg"

    if image_data.startswith("data:"):
        match = re.match(r"^data:(image/(jpeg|jpg|png|webp));base64,(.*)$", image_data, re.DOTALL | re.IGNORECASE)
        if match:
            raw_type = match.group(1).lower()
            if "png" in raw_type:
                content_type = "image/png"
                ext = "png"
            elif "webp" in raw_type:
                content_type = "image/webp"
                ext = "webp"
            base64_str = match.group(3)
        else:
            parts = image_data.split(";base64,")
            if len(parts) == 2:
                header = parts[0].lower()
                base64_str = parts[1]
                if "png" in header:
                    content_type = "image/png"
                    ext = "png"
                elif "webp" in header:
                    content_type = "image/webp"
                    ext = "webp"
            else:
                base64_str = image_data
    else:
        base64_str = image_data

    try:
        raw_bytes = base64.b64decode(base64_str)
    except Exception as e:
        print(f"[SUPABASE STORAGE ERROR] Base64 decode failed: {e}")
        return DEFAULT_CATTLE_IMAGE

    if len(raw_bytes) > 10 * 1024 * 1024:
        print("[SUPABASE STORAGE ERROR] File size exceeds 10MB limit.")
        return DEFAULT_CATTLE_IMAGE

    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    clean_user_id = str(user_id) if user_id else "anonymous"
    if folder == "cattle":
        path = f"cattle/{clean_user_id}/{unique_filename}"
    elif folder == "feeds":
        path = f"feeds/{unique_filename}"
    elif folder == "profiles":
        path = f"profiles/{clean_user_id}/{unique_filename}"
    elif folder.startswith("partners/") and ".." not in folder:
        path = f"{folder.strip('/')}/{unique_filename}"
    else:
        path = f"other/{unique_filename}"

    supabase_url = settings.SUPABASE_URL.rstrip("/")
    bucket_name = "milkmaatu-image"
    upload_endpoint = f"{supabase_url}/storage/v1/object/{bucket_name}/{path}"

    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(upload_endpoint, content=raw_bytes, headers=headers)
            if resp.status_code in (200, 201):
                public_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{path}"
                print(f"[SUPABASE STORAGE] Image uploaded successfully to: {public_url}")
                return public_url
            else:
                print(f"[SUPABASE STORAGE ERROR] Upload failed with HTTP {resp.status_code}: {resp.text}")
                return DEFAULT_CATTLE_IMAGE
    except Exception as e:
        print(f"[SUPABASE STORAGE EXCEPTION] Async upload exception: {e}")
        return DEFAULT_CATTLE_IMAGE

def delete_image(image_url: str) -> bool:
    """
    Deletes an image from Supabase Storage if it belongs to 'milkmaatu-image'.
    """
    if not image_url or "milkmaatu-image" not in image_url:
        return False

    supabase_url = settings.SUPABASE_URL.rstrip("/")
    bucket_name = "milkmaatu-image"
    prefix = f"{supabase_url}/storage/v1/object/public/{bucket_name}/"

    if not image_url.startswith(prefix):
        return False

    relative_path = image_url[len(prefix):]
    delete_endpoint = f"{supabase_url}/storage/v1/object/{bucket_name}"

    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.request("DELETE", delete_endpoint, json={"prefixes": [relative_path]}, headers=headers)
            return resp.status_code in (200, 204)
    except Exception as e:
        print(f"[SUPABASE STORAGE ERROR] Delete failed for {relative_path}: {e}")
        return False
