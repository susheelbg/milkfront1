import logging
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are "Nandini AI", a smart dairy farming assistant.
Your task is to help farmers with dairy farming-related queries.
You must ONLY answer dairy farming-related questions. This includes topics like: cattle, milk production, milk sales, cattle feed, cow/buffalo health, dairy business, milk pricing, and farm management.

If the user asks anything outside of these dairy farming topics (for example: general knowledge, history, recipes, non-dairy agriculture, politics, general technology, math, programming, entertainment, etc.), you MUST reply with exactly:
"ನಾನು ನಂದಿನಿ AI. ನಾನು ಕೇವಲ ಹಾಲು ಮತ್ತು ಹೈನುಗಾರಿಕೆ ಸಂಬಂಧಿತ ಪ್ರಶ್ನೆಗಳಿಗೆ ಮಾತ್ರ ಉತ್ತರ ಕೊಡಬಲ್ಲೆ."

Rules:
1. All responses must be in the Kannada language only.
2. Keep responses short, simple, and farmer-friendly. Do not write long paragraphs.
3. Maintain a helpful and respectful tone.
"""

FALLBACK_RESPONSE = "ನಾನು ನಂದಿನಿ AI. ನಾನು ಕೇವಲ ಹಾಲು ಮತ್ತು ಹೈನುಗಾರಿಕೆ ಸಂಬಂಧಿತ ಪ್ರಶ್ನೆಗಳಿಗೆ ಮಾತ್ರ ಉತ್ತರ ಕೊಡಬಲ್ಲೆ."

class NandiniAIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        # Print API key presence check (only boolean exists check)
        print(f"[NandiniAI] API Key exists: {bool(self.api_key)}", flush=True)
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not configured in settings.")
            self.client = None
        else:
            self.client = genai.Client(api_key=self.api_key)

    async def get_response(self, prompt: str) -> str:
        # Fallback dynamic initialization
        if not self.client and settings.GEMINI_API_KEY:
            self.api_key = settings.GEMINI_API_KEY
            print(f"[NandiniAI] API Key exists (dynamic check): {bool(self.api_key)}", flush=True)
            self.client = genai.Client(api_key=self.api_key)

        print(f"[NandiniAI] Received user prompt: '{prompt}'", flush=True)

        if not self.client:
            raise ValueError("Gemini API client is not initialized due to missing API key.")

        try:
            import anyio
            
            def call_gemini():
                print(f"[NandiniAI] Calling Gemini model=gemini-2.5-flash...", flush=True)
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        temperature=0.2,
                    ),
                )
                print(f"[NandiniAI] Gemini raw response: {response}", flush=True)
                return response

            response_obj = await anyio.to_thread.run_sync(call_gemini)
            
            if not response_obj or not response_obj.text:
                print(f"[NandiniAI WARNING] Gemini response text is empty or blocked. Object: {response_obj}", flush=True)
                return FALLBACK_RESPONSE

            final_text = response_obj.text.strip()
            print(f"[NandiniAI] Final output: '{final_text}'", flush=True)
            return final_text
        except Exception as e:
            print(f"[NandiniAI EXCEPTION] Error calling Gemini API: {str(e)}", flush=True)
            import traceback
            traceback.print_exc()
            raise e

nandini_ai_service = NandiniAIService()
