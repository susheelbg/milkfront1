"""
Verified RSS sources for Karnataka/Indian farmer news.
Broad agriculture coverage — not limited to dairy only.
"""

NEWS_SOURCES = [
    {
        "name": "ಪ್ರಜಾವಾಣಿ",
        "url": "https://www.prajavani.net/feed",
        "language": "kn",
        "require_kannada": True,
    },
    {
        "name": "The Hindu Agriculture",
        "url": "https://www.thehindu.com/sci-tech/agriculture/feeder/default.rss",
        "language": "en",
        "require_kannada": False,
    },
    {
        "name": "Deccan Herald",
        "url": "https://www.deccanherald.com/rss/agriculture.rss",
        "language": "en",
        "require_kannada": False,
    },
]

# ─── FARMER relevance keywords (broad — all farming, not just dairy) ──────────

FARMER_KEYWORDS_KN = [
    # Dairy / cattle
    "ಹೈನು", "ಹೈನುಗಾರ", "ಹೈನುಗಾರಿಕೆ",
    "ಹಸು", "ಹಸುಗಳ", "ಎಮ್ಮೆ", "ಕೋಣ",
    "ಹಾಲು", "ಹಾಲಿನ",
    "ಪಶು", "ಪಶುಗಳ", "ಪಶುಸಂಗೋಪನ",
    "ಪಶುವೈದ್ಯ", "ಪಶು ರೋಗ", "ಪಶು ಆಹಾರ",
    "ಮೇವು", "ಲಸಿಕೆ", "ಕರು",
    "ಡೈರಿ", "ಡೇರಿ",
    "ಗೋಶಾಲೆ", "ಗೋಪಾಲ", "ಗೋಪಾಲಕ",
    "ಕ್ಷೀರ", "ಜಾನುವಾರು",
    "ಕೆಎಂಎಫ್", "KMF", "NDDB",
    # General farming / agriculture
    "ರೈತ", "ರೈತರ", "ರೈತರಿಗೆ",
    "ಕೃಷಿ", "ಕೃಷಿಕ",
    "ಬೆಳೆ", "ಬೆಳೆಗಾರ",
    "ಹೊಲ", "ತೋಟ",
    "ಮಳೆ", "ನೀರಾವರಿ",
    "ಬರ", "ಬರಗಾಲ",
    "ಯೋಜನೆ", "ಸಬ್ಸಿಡಿ", "ಅನುದಾನ",
    "ಕೃಷಿ ಸಾಲ", "ಫಸಲ್",
    "ಮಾರುಕಟ್ಟೆ", "ಬೆಲೆ",
    "ಕೀಟ", "ರೋಗ", "ಕ್ರಿಮಿ",
    "ಗೊಬ್ಬರ", "ಬೀಜ",
    "ಕರ್ನಾಟಕ ಕೃಷಿ",
    "ಇಲಾಖೆ",
]

FARMER_KEYWORDS_EN = [
    # Dairy / cattle
    "dairy", "cattle", "milk", "cow", "buffalo",
    "livestock", "fodder", "animal husbandry",
    "KMF", "NDDB", "ICAR", "milch", "bovine", "veterinary",
    # General farming
    "farmer", "farmers", "agriculture", "agri", "crop",
    "harvest", "irrigation", "drought", "flood",
    "subsidy", "scheme", "mandi", "kisan",
    "paddy", "sugarcane", "horticulture", "sowing",
    "fertiliser", "fertilizer", "pesticide", "seed",
    "Karnataka farm",
]

# Combined alias used for sources that mix languages
DAIRY_KEYWORDS = FARMER_KEYWORDS_KN + FARMER_KEYWORDS_EN
DAIRY_KEYWORDS_KN = FARMER_KEYWORDS_KN
DAIRY_KEYWORDS_EN = FARMER_KEYWORDS_EN

# ─── Exclusion patterns (cartoons, horoscopes, non-news) ─────────────────────

EXCLUDE_PATTERNS = [
    "ಕಾರ್ಟೂನು",
    "ಭವಿಷ್ಯ",
    "ಪಂಚಾಂಗ",
    "ವಾಚಕರ ವಾಣಿ",
    "ನಗರದಲ್ಲಿ ಇಂದು",
    "ಗುದ್ದು",
    "ಅಂಕಣ",
    "ರಾಶಿ",
    "ಜ್ಯೋತಿಷ",
    "ಕ್ರಿಕೆಟ್",
    "ಸಿನಿಮಾ",
    "ಚಲನಚಿತ್ರ",
    "ಮನರಂಜನ",
]

# ─── Category detection rules ─────────────────────────────────────────────────

CATEGORY_RULES = [
    (["ಲಸಿಕೆ", "vaccine", "vaccination"],
     "vaccination", "ಲಸಿಕೆ"),
    (["ರೋಗ", "disease", "outbreak", "ಎಚ್ಚರಿಕೆ", "ಸಾಂಕ್ರಾಮಿಕ", "alert", "ಕೀಟ", "ಕ್ರಿಮಿ"],
     "disease_alert", "ರೋಗ ಎಚ್ಚರಿಕೆ"),
    (["ಆರೋಗ್ಯ", "health", "ಚಿಕಿತ್ಸೆ", "ಪಶುವೈದ್ಯ", "veterinary"],
     "cattle_health", "ಹಸುಗಳ ಆರೋಗ್ಯ"),
    (["ಹಾಲಿನ ಬೆಲೆ", "ಹಾಲು ದರ", "milk price"],
     "milk_price", "ಹಾಲಿನ ಬೆಲೆ"),
    (["ಹಾಲು ಉತ್ಪಾದನ", "milk production", "milch"],
     "milk_production", "ಹಾಲು ಉತ್ಪಾದನೆ"),
    (["ಯೋಜನೆ", "ಸಬ್ಸಿಡಿ", "scheme", "subsidy", "ಸರ್ಕಾರ", "government", "ಅನುದಾನ", "kisan", "ಇಲಾಖೆ"],
     "government_scheme", "ಸರ್ಕಾರಿ ಯೋಜನೆ"),
    (["ಮೇವು", "ಪಶು ಆಹಾರ", "fodder", "cattle feed", "ಗೊಬ್ಬರ", "ಬೀಜ", "fertiliser", "fertilizer", "seed"],
     "cattle_feed", "ಕೃಷಿ ಸರಕು"),
    (["ತಂತ್ರಜ್ಞಾನ", "technology", "digital", "app"],
     "dairy_technology", "ತಂತ್ರಜ್ಞಾನ"),
    (["ಹವಾಮಾನ", "weather", "ಮಳೆ", "ಬಿಸಿಲು", "ಬರ", "drought", "flood", "ನೀರಾವರಿ", "irrigation"],
     "weather_advisory", "ಹವಾಮಾನ & ನೀರಾವರಿ"),
    (["ಮಾರುಕಟ್ಟೆ", "market", "ಬೆಲೆ", "mandi", "ಮಾರಾಟ", "export", "trade"],
     "dairy_business", "ಮಾರುಕಟ್ಟೆ ಬೆಲೆ"),
    (["ಸಲಹೆ", "ತರಬೇತಿ", "advice", "training", "tips", "ಮಾಹಿತಿ"],
     "farmer_advisory", "ರೈತ ಸಲಹೆ"),
    (["ಬೆಳೆ", "crop", "harvest", "ಹೊಲ", "ತೋಟ", "paddy", "horticulture", "sugarcane"],
     "general_dairy", "ಬೆಳೆ & ಕೃಷಿ"),
]

DEFAULT_CATEGORY = ("general_dairy", "ರೈತ ಸುದ್ದಿ")

# How many days to keep articles before auto-deletion
NEWS_RETENTION_DAYS = 7
