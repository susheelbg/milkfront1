import re
import cloudinary
import cloudinary.uploader
from app.core.config import settings

# Configure Cloudinary if keys are provided
if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )
    CLOUDINARY_ENABLED = True
else:
    print("[CLOUDINARY] Cloudinary keys not fully set in .env. Mocking image uploads...")
    CLOUDINARY_ENABLED = False

# Default premium cattle photo fallback
DEFAULT_CATTLE_IMAGE = "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=500&h=400&fit=crop"

def upload_image(image_data: str) -> str:
    """Upload base64 image, raw string, or remote URL to Cloudinary, returning the secure CDN URL."""
    if not image_data:
        return DEFAULT_CATTLE_IMAGE

    # Check if the image_data is already a Cloudinary web URL
    if (image_data.startswith("http://") or image_data.startswith("https://")) and "res.cloudinary.com" in image_data:
        return image_data

    # Check if Cloudinary is not configured
    if not CLOUDINARY_ENABLED:
        print("[CLOUDINARY MOCK] Cloudinary disabled. Returning original URL / default.")
        if image_data.startswith("http://") or image_data.startswith("https://"):
            return image_data
        return DEFAULT_CATTLE_IMAGE

    try:
        # Cloudinary uploader accepts base64, data URIs, or standard remote HTTP URLs!
        upload_result = cloudinary.uploader.upload(
            image_data,
            folder="milkmaatu_sante",
            overwrite=True,
            resource_type="image"
        )
        return upload_result.get("secure_url", DEFAULT_CATTLE_IMAGE)
    except Exception as e:
        print(f"[CLOUDINARY ERROR] Failed to upload image: {e}. Falling back to default.")
        return DEFAULT_CATTLE_IMAGE
