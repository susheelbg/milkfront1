import logging

logger = logging.getLogger(__name__)

# Simulated OTP storage (maps phone -> OTP string)
# For production, this could map to Redis or a database table with an expiry time.
_MOCK_OTP_STORE = {}

def send_otp(phone: str) -> bool:
    """
    Sends a WhatsApp OTP code to the specified phone number.
    Currently uses mock behavior with code '1234'.
    
    TODO: Replace with Twilio WhatsApp integration later.
    """
    logger.info(f"[OTP SERVICE] Request to send WhatsApp OTP to {phone}")
    
    # Store OTP '1234' for this phone number
    _MOCK_OTP_STORE[phone] = "1234"
    
    # Log simulated output
    print(f"[WHATSAPP GATEWAY SIMULATION] Sending OTP Code '1234' to {phone}")
    
    return True

def verify_otp(phone: str, otp: str) -> bool:
    """
    Verifies the provided WhatsApp OTP code for the specified phone number.
    Currently accepts '1234' as the valid code.
    
    TODO: Replace with Twilio WhatsApp integration later.
    """
    logger.info(f"[OTP SERVICE] Request to verify WhatsApp OTP for {phone}")
    
    expected_otp = _MOCK_OTP_STORE.get(phone, "1234") # Default fallback to '1234' for robustness
    
    if otp == expected_otp:
        # Clear OTP after successful verification
        _MOCK_OTP_STORE.pop(phone, None)
        return True
        
    return False
