import logging
from twilio.rest import Client
from app.core.config import settings

logger = logging.getLogger(__name__)

def _get_twilio_client():
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.error("Twilio credentials not configured in settings")
        raise ValueError("Twilio Account SID or Auth Token is missing from configuration.")
    if not settings.TWILIO_VERIFY_SERVICE_SID:
        logger.error("Twilio Verify Service SID not configured in settings")
        raise ValueError("Twilio Verify Service SID is missing from configuration.")
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

def send_otp(phone: str) -> bool:
    """
    Sends a verification SMS OTP using Twilio Verify service.
    Expects phone to be in E.164 format (+91XXXXXXXXXX).
    """
    logger.info(f"Initiating Twilio Verify SMS OTP for phone: {phone}")
    try:
        client = _get_twilio_client()
        verification = client.verify.v2.services(settings.TWILIO_VERIFY_SERVICE_SID) \
                                     .verifications \
                                     .create(to=phone, channel='sms')
        logger.info(f"Twilio Verify SMS status for {phone}: {verification.status}")
        return verification.status == "pending"
    except Exception as e:
        logger.error(f"Failed to send SMS OTP to {phone} via Twilio Verify: {e}", exc_info=True)
        raise

def verify_otp(phone: str, otp: str) -> bool:
    """
    Verifies a verification SMS OTP using Twilio Verify service.
    Expects phone to be in E.164 format (+91XXXXXXXXXX).
    """
    logger.info(f"Verifying Twilio Verify SMS OTP for phone: {phone}")
    try:
        client = _get_twilio_client()
        verification_check = client.verify.v2.services(settings.TWILIO_VERIFY_SERVICE_SID) \
                                           .verification_checks \
                                           .create(to=phone, code=otp)
        logger.info(f"Twilio Verify SMS verification status for {phone}: {verification_check.status}")
        return verification_check.status == "approved"
    except Exception as e:
        logger.error(f"Failed to verify OTP for {phone} via Twilio Verify: {e}", exc_info=True)
        raise
