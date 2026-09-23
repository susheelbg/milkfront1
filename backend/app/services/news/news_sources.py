"""
Verified working Kannada dairy farming news sources (tested 2026-09-23).

Only RSS feeds confirmed accessible from this server are listed.
Articles are filtered locally by Kannada dairy keywords — no AI needed.
"""

# ─── Verified RSS sources ────────────────────────────────────────────────────

NEWS_SOURCES = [
    {
        "name": "ಪ್ರಜಾವಾಣಿ",
        "url": "https://www.prajavani.net/feed",
        "language": "kn",
        "require_kannada": True,   # Skip articles without Kannada text
        "dairy_specific": False,   # General news → must pass keyword filter
    },
    {
        "name": "The Hindu Agriculture",
        "url": "https://www.thehindu.com/sci-tech/agriculture/feeder/default.rss",
        "language": "en",
        "require_kannada": False,  # English source — pass dairy keywords in EN
        "dairy_specific": True,    # Already agriculture-focused — lower keyword bar
    },
]

# ─── Dairy relevance keywords ────────────────────────────────────────────────

DAIRY_KEYWORDS_KN = [
    "ಹೈನು", "ಹೈನುಗಾರ", "ಹೈನುಗಾರಿಕೆ",
    "ಹಸು", "ಹಸುಗಳ", "ಹಸುಗಳಿಗೆ",
    "ಹಾಲು", "ಹಾಲಿನ",
    "ಎಮ್ಮೆ", "ಕೋಣ",
    "ಪಶು", "ಪಶುಗಳ", "ಪಶುಸಂಗೋಪನ",
    "ಪಶುವೈದ್ಯ", "ಪಶು ರೋಗ", "ಪಶು ಆಹಾರ", "ಪಶು ಆರೋಗ್ಯ",
    "ಮೇವು", "ಮೇವಿನ",
    "ಲಸಿಕೆ",
    "ಕರು", "ಕರುಗಳ",
    "ಡೈರಿ", "ಡೇರಿ",
    "ಕೆಎಂಎಫ್",
    "ಗೋಶಾಲೆ",
    "ಗೋಪಾಲ", "ಗೋಪಾಲಕ", "ಗೋಪಾಲನ",
    "ಕ್ಷೀರ",
    "ಜಾನುವಾರು",  # livestock
    "KMF", "NDDB", "ICAR",
]

# Patterns to EXCLUDE — prevents cartoons, horoscopes, events from matching
EXCLUDE_PATTERNS = [
    "ಕಾರ್ಟೂನು",      # cartoon
    "ಭವಿಷ್ಯ",        # horoscope
    "ಪಂಚಾಂಗ",        # almanac
    "ವಾಚಕರ ವಾಣಿ",    # letters to editor
    "ನಗರದಲ್ಲಿ ಇಂದು",  # today in city (events)
    "ಗುದ್ದು",         # comic/satire column
    "ಅಂಕಣ",          # column (opinions)
]

DAIRY_KEYWORDS_EN = [
    "dairy", "cattle", "milk", "cow", "buffalo",
    "livestock", "fodder", "animal husbandry",
    "KMF", "NDDB", "ICAR", "milch", "bovine",
    "herd", "udder", "goat milk", "sheep milk",
    "veterinary", "cattle feed", "crossbred",
]

# Combined — used when language is mixed
DAIRY_KEYWORDS = DAIRY_KEYWORDS_KN + DAIRY_KEYWORDS_EN

# ─── Category detection rules ─────────────────────────────────────────────────

CATEGORY_RULES = [
    (
        ["ಲಸಿಕೆ", "ಲಸಿಕಾ", "vaccine", "vaccination"],
        "vaccination", "ಲಸಿಕೆ",
    ),
    (
        ["ರೋಗ", "disease", "outbreak", "ಎಚ್ಚರಿಕೆ", "ಸಾಂಕ್ರಾಮಿಕ", "ಜ್ವರ", "ಕಾಯಿಲೆ", "alert"],
        "disease_alert", "ರೋಗ ಎಚ್ಚರಿಕೆ",
    ),
    (
        ["ಆರೋಗ್ಯ", "ಚಿಕಿತ್ಸೆ", "ಪಶುವೈದ್ಯ", "health", "treatment", "veterinary", "vet"],
        "cattle_health", "ಹಸುಗಳ ಆರೋಗ್ಯ",
    ),
    (
        ["ಹಾಲಿನ ಬೆಲೆ", "ಹಾಲು ದರ", "milk price", "ಬೆಲೆ ಏರಿಕೆ", "ಬೆಲೆ ಇಳಿಕೆ"],
        "milk_price", "ಹಾಲಿನ ಬೆಲೆ",
    ),
    (
        ["ಹಾಲು ಉತ್ಪಾದನ", "milk production", "ಹಾಲು ಸಂಗ್ರಹ", "milch"],
        "milk_production", "ಹಾಲು ಉತ್ಪಾದನೆ",
    ),
    (
        ["ಯೋಜನೆ", "ಸಬ್ಸಿಡಿ", "scheme", "subsidy", "ಸರ್ಕಾರ", "government", "ಇಲಾಖೆ", "ಅನುದಾನ"],
        "government_scheme", "ಸರ್ಕಾರಿ ಯೋಜನೆ",
    ),
    (
        ["ಮೇವು", "ಪಶು ಆಹಾರ", "fodder", "cattle feed", "feed", "ಹುಲ್ಲು"],
        "cattle_feed", "ಪಶು ಆಹಾರ",
    ),
    (
        ["ತಂತ್ರಜ್ಞಾನ", "technology", "digital", "app", "automation"],
        "dairy_technology", "ಡೈರಿ ತಂತ್ರಜ್ಞಾನ",
    ),
    (
        ["ಹವಾಮಾನ", "weather", "ಮಳೆ", "ಬಿಸಿಲು", "ಚಳಿ", "climate", "heat stress"],
        "weather_advisory", "ಹವಾಮಾನ ಸಲಹೆ",
    ),
    (
        ["ಮಾರುಕಟ್ಟೆ", "market", "ಮಾರಾಟ", "business", "export", "import", "trade"],
        "dairy_business", "ಡೈರಿ ವ್ಯಾಪಾರ",
    ),
    (
        ["ಸಲಹೆ", "ಮಾಹಿತಿ", "ತರಬೇತಿ", "advice", "training", "ರೈತ", "farmer", "tips"],
        "farmer_advisory", "ರೈತ ಸಲಹೆ",
    ),
]

DEFAULT_CATEGORY = ("general_dairy", "ಹೈನುಗಾರಿಕೆ")
