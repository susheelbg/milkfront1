# 🥛 MilkMaatu — Premium Dairy Farming Platform

MilkMaatu is a **mobile-first, multilingual** full-stack platform built specifically for dairy farmers in Karnataka. It connects farmers to feed suppliers, provides a local cattle marketplace (Sante), offers an AI-powered dairy assistant (Nandini AI), delivers daily farmer news, and gives administrators control over the platform — all translated dynamically in **Kannada (ಕನ್ನಡ)** and **English**.

The project is a monorepo containing a high-performance FastAPI backend, a responsive React + Vite frontend, and native Android packaging via Capacitor.

🔗 **Production Deployments:**
- **App / Portal:** [https://milkfront1.onrender.com](https://milkfront1.onrender.com)
- **API Docs (Swagger):** [https://milkfront1.onrender.com/docs](https://milkfront1.onrender.com/docs)

---

## 🌟 Key Features

### 1. 📱 Mobile-First Bottom Navigation
Designed for single-thumb usage. A persistent bottom nav bar provides access to:
| Tab | Route | Description |
|-----|-------|-------------|
| Home | `/home` | Dashboard — quick services, news, recommended feeds |
| Sante | `/sante` | Local cattle marketplace |
| Buy Feeds | `/feeds` | Cattle feed shop |
| My Orders | `/orders` | Live order tracking |
| Profile | `/profile` | Address, language, and photo management |

---

### 2. 🌐 Multilingual — Kannada & English
- **Kannada by default** for all new accounts — maximum accessibility for Karnataka farmers.
- **Instant toggle** on the Profile page. No page refresh needed.
- **Fully translated UI:** every label, message, button, and section heading switches language — including the Farmers News widget, Quick Services, Recommended Feeds, and all error states.
- Translations live in [`src/i18n/kn.json`](frontend/src/i18n/kn.json) and [`src/i18n/en.json`](frontend/src/i18n/en.json).
- Selected locale is persisted in `localStorage` and synced to the backend profile.

---

### 3. 🏠 Home Dashboard
The home screen is organized into clean, stacked sections:

#### 🌾 Recommended Feeds
Horizontally scrollable card carousel showing top-rated feeds based on the farmer's profile.

#### ⚡ Quick Services — 4 Circular Buttons
Four large circular icon buttons in a single row for instant access:
- 🌾 **Buy Feeds** — Feed shop
- 🐄 **Sante** — Cattle marketplace
- 🥛 **Milk Record** — OCR milk slip extraction *(coming soon)*
- 🤖 **Nandini AI** — AI dairy assistant

#### 📰 Farmers News (ರೈತರ ಸುದ್ದಿ)
A horizontally scrollable news card widget sitting below Quick Services. Shows the latest farmer-relevant news articles fetched from trusted Karnataka news sources. Fully translates its heading and labels based on language setting.

---

### 4. 📰 Farmers News Feature
A lightweight, reliable news aggregation system that **never generates or stores article content** — only metadata.

#### Architecture
```
Prajavani RSS (Kannada) ──┐
                          ├─→ Keyword filter ─→ Store metadata only ─→ DB
The Hindu Agriculture ────┘   (no AI, no content copy)

Farmer taps article ─→ Original publisher website (direct link)
```

#### How it works
- **RSS-based** — fetches from verified Kannada and English agriculture news feeds every **3 hours**.
- **Keyword filtering** — 55 Kannada + 36 English broad farmer keywords (dairy, cattle, crops, irrigation, government schemes, market prices, weather, etc.).
- **Exclusion filter** — 13 patterns block cartoons, horoscopes, almanacs, letters to editor.
- **Metadata only** — title, source name, source URL, category, published date. No article content is stored or reproduced.
- **Auto-cleanup** — articles older than **7 days** are automatically deleted to keep the feed fresh.
- **Direct links** — tapping any article opens the original publisher website.
- **Language-aware UI** — section title/subtitle/buttons switch between Kannada and English.

#### Relevance Categories
| Category | ಕನ್ನಡ |
|----------|-------|
| `cattle_health` | ಹಸುಗಳ ಆರೋಗ್ಯ |
| `government_scheme` | ಸರ್ಕಾರಿ ಯೋಜನೆ |
| `weather_advisory` | ಹವಾಮಾನ & ನೀರಾವರಿ |
| `milk_price` | ಹಾಲಿನ ಬೆಲೆ |
| `farmer_advisory` | ರೈತ ಸಲಹೆ |
| `disease_alert` | ರೋಗ ಎಚ್ಚರಿಕೆ |
| `dairy_business` | ಮಾರುಕಟ್ಟೆ ಬೆಲೆ |

---

### 5. 🔐 Secure OTP Onboarding (Twilio Verify)
Step-by-step registration:
1. Enter name + 10-digit mobile number
2. Receive a 6-digit SMS OTP (Twilio Verify)
3. Verify with 30-second countdown + resend option
4. Set secure password and delivery address

> [!WARNING]
> **Twilio Trial Accounts:** You must register the target phone number in **Verified Caller IDs** in the Twilio Console before SMS can be sent.

---

### 6. 🐄 Sante Cattle Marketplace
- Listings scoped to local market hubs (e.g. *KRS Sante*, *Thendekere Sante*) within a 20 km radius.
- **24-hour auto-expiry** — a background daemon sweeps the DB hourly to delete expired posts.
- **Camera-only image capture** — prevents arbitrary gallery uploads, promotes trust.

---

### 7. 🛍️ Buy Feeds Shop
- **2-column grid** on mobile, 3-column on desktop.
- **Compact product cards** — image, name, price, and Add button only.
- **Tap a card → bottom sheet detail view** slides up with full description and a large Add to Cart button.
- **Glassmorphic floating cart bar** — real-time quantity + price totals.
- Pre-filled checkout using saved profile delivery address.

---

### 8. 🧠 Nandini AI — Dairy Assistant
Powered by **Google Gemini 2.5 Flash**:
- Responds in the farmer's active language (Kannada or English).
- Scoped to dairy husbandry, feed management, vaccination, milk fat, and Karnataka government schemes.
- Politely declines non-farming topics.

---

### 9. 🛡️ Admin Dashboard (`/admin`)
| Section | Capabilities |
|---------|-------------|
| Overview | Revenue, active listings, users, pending orders |
| Feeds | Add / edit / remove feed products |
| Orders | Audit orders, update status (Pending → Delivered) |
| Users | Monitor accounts, roles (`user`, `admin`, `super_admin`) |
| Cattle | Moderate / delete inappropriate Sante listings |
| News | View aggregated articles and source stats |

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18 + Vite** | Fast SPA with hot module replacement |
| **Tailwind CSS** | Utility-first responsive styling (emerald + gold palette) |
| **React Router DOM v6** | Auth-guarded client-side routing |
| **Capacitor JS** | Native Android bridge |
| **Lucide React** | Icon library |
| **i18n (custom)** | Kannada/English translation context |

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | Async Python REST API |
| **SQLAlchemy 2.0 (Async)** | ORM with async session management |
| **PostgreSQL / Supabase** | Production database |
| **SQLite + aiosqlite** | Zero-config local development database |
| **PyJWT + Passlib (Bcrypt)** | Auth token generation + password hashing |
| **Cloudinary SDK** | Image CDN for cattle photos |
| **Twilio Verify** | SMS OTP verification |
| **Google GenAI SDK** | Gemini 2.5 Flash for Nandini AI |
| **feedparser / xml.etree** | RSS parsing for Farmers News |
| **anyio** | Async thread pool for blocking I/O |

---

## 📂 Project Structure

```
milkfront1/
├── frontend/                         # React 18 + Vite frontend
│   ├── src/
│   │   ├── components/               # Shared UI components (Header, Card, Button, BottomNav)
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Dashboard with Quick Services + News + Feeds
│   │   │   ├── BuyFeedsPage.jsx      # Feed shop (2-col grid + bottom sheet detail)
│   │   │   ├── DairyNewsPage.jsx     # Full news listing page
│   │   │   ├── SantePage.jsx         # Cattle marketplace
│   │   │   ├── NandiniAIPage.jsx     # AI chat assistant
│   │   │   ├── ProfilePage.jsx       # Profile + language toggle
│   │   │   ├── AdminDashboard.jsx    # Admin control panel
│   │   │   └── ...
│   │   ├── i18n/
│   │   │   ├── kn.json               # Kannada translations
│   │   │   ├── en.json               # English translations
│   │   │   ├── LanguageContext.jsx   # React context provider
│   │   │   └── useTranslation.js     # Hook to access t()
│   │   ├── services/api/
│   │   │   ├── apiClient.js          # JWT-authenticated fetch wrapper
│   │   │   ├── feedsApi.js           # Feed catalog API calls
│   │   │   ├── newsApi.js            # Farmers News API calls
│   │   │   └── ...
│   │   └── styles/index.css          # Global styles + animations
│   ├── android/                      # Capacitor Android native project
│   └── .env                          # VITE_API_URL (not committed)
│
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── main.py                   # App bootstrap + background workers (news, Sante cleanup)
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic settings from environment
│   │   │   ├── security.py           # JWT + Bcrypt helpers
│   │   │   ├── database.py           # Async SQLAlchemy engine
│   │   │   └── dependencies.py       # Auth guard dependencies
│   │   ├── models/
│   │   │   ├── user.py               # User ORM model
│   │   │   ├── feed.py               # Feed product ORM model
│   │   │   ├── order.py              # Order ORM model
│   │   │   ├── cattle.py             # Sante cattle listing ORM model
│   │   │   ├── report.py             # Milk report ORM model
│   │   │   └── news.py               # NewsArticle ORM model
│   │   ├── routes/
│   │   │   ├── auth_routes.py        # Register, login, OTP, password reset
│   │   │   ├── profile_routes.py     # Profile read/update
│   │   │   ├── feed_routes.py        # Feed catalog
│   │   │   ├── order_routes.py       # Orders + checkout
│   │   │   ├── cattle_routes.py      # Sante marketplace
│   │   │   ├── report_routes.py      # Milk records
│   │   │   ├── ai_routes.py          # Nandini AI chat
│   │   │   ├── news_routes.py        # Farmers News API
│   │   │   └── admin_routes.py       # Admin dashboard
│   │   └── services/
│   │       ├── ai/nandini_ai.py      # Gemini integration
│   │       ├── news/
│   │       │   ├── news_sources.py   # RSS URLs, keywords, exclusions, categories
│   │       │   └── news_service.py   # RSS fetch, filter, cleanup, DB storage
│   │       └── ...                   # Cloudinary, Twilio helpers
│   ├── requirements.txt
│   └── .env                          # Backend secrets (not committed)
│
├── ANDROID_BUILD.md                  # Android keystore + APK/AAB guide
└── README.md                         # This file
```

---

## 🚀 Local Development Setup

### Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment (SQLite used locally by default — no Postgres needed)
cp .env.example .env

# Seed super-admin account
python seed.py

# Run with hot-reload
uvicorn app.main:app --reload --port 8000
```

- API available at **`http://localhost:8000`**
- Swagger docs at **`http://localhost:8000/docs`**

### Frontend

```bash
cd frontend

npm install

# Point to local backend
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Start dev server (browser)
npm run dev

# OR expose on local network (for phone testing)
npm run dev -- --host
```

Open **`http://localhost:5173`** in your browser.

---

## 🤖 Android Build

The React bundle is packaged into a native Android app via **Capacitor**.

```bash
# 1. Build frontend
cd frontend && npm run build

# 2. Sync to Android project
npx cap sync

# 3. Open in Android Studio
npx cap open android
```

See [ANDROID_BUILD.md](ANDROID_BUILD.md) for keystore setup, versioning, and signed APK/AAB release instructions.

---

## 🔑 Environment Variables

### `backend/.env`

| Variable | Default (Dev) | Purpose |
|----------|--------------|---------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./milkmaatu.db` | DB connection string |
| `JWT_SECRET` | *(random 32-char string)* | JWT signing secret |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24h) | Session lifespan |
| `GEMINI_API_KEY` | *(Google AI Studio)* | Nandini AI |
| `CLOUDINARY_CLOUD_NAME` | *(optional)* | Image CDN |
| `CLOUDINARY_API_KEY` | *(optional)* | Image CDN |
| `CLOUDINARY_API_SECRET` | *(optional)* | Image CDN |
| `TWILIO_ACCOUNT_SID` | *(optional)* | SMS OTP |
| `TWILIO_AUTH_TOKEN` | *(optional)* | SMS OTP |
| `TWILIO_VERIFY_SERVICE_SID` | *(optional)* | SMS OTP |

> [!NOTE]
> If `CLOUDINARY_CLOUD_NAME` or `TWILIO_ACCOUNT_SID` are blank, the backend uses built-in fallback mocks (default image URL + bypass OTP approval) so you can develop without third-party accounts.

---

## 📋 API Routes Reference

All endpoints are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/` | — | Health check |
| `POST` | `/api/auth/register` | — | Register new account |
| `POST` | `/api/auth/login` | — | Login + get JWT |
| `POST` | `/api/auth/send-otp` | — | Send Twilio OTP |
| `POST` | `/api/auth/verify-otp` | — | Verify OTP |
| `POST` | `/api/auth/forgot-password/request-otp` | — | Password reset OTP |
| `POST` | `/api/auth/forgot-password/verify-otp` | — | Verify reset OTP |
| `POST` | `/api/auth/forgot-password/reset` | — | Confirm new password |
| `GET` | `/api/profile` | ✅ User | Get profile |
| `PUT` | `/api/profile` | ✅ User | Update profile |
| `GET` | `/api/feeds` | ✅ User | Feed product catalog |
| `POST` | `/api/orders` | ✅ User | Place order |
| `GET` | `/api/orders/my` | ✅ User | My order history |
| `GET` | `/api/cattle` | ✅ User | Browse cattle listings |
| `POST` | `/api/cattle` | ✅ User | Post cattle listing |
| `GET` | `/api/reports` | ✅ User | Milk logs |
| `POST` | `/api/reports` | ✅ User | Add milk log |
| `POST` | `/api/ai/nandini` | ✅ User | Nandini AI chat |
| `GET` | `/api/news/latest` | ✅ User | Latest 6 farmer news articles |
| `GET` | `/api/news/all` | ✅ User | Paginated full news list |
| `GET` | `/api/admin/stats` | 🛡️ Admin | Platform metrics |
| `DELETE` | `/api/cattle/{id}` | 🛡️ Admin | Remove Sante listing |

---

## 🗺️ Background Workers

Two long-running async daemons start automatically with the server ([`main.py`](backend/app/main.py)):

| Worker | Interval | What it does |
|--------|---------|-------------|
| **Sante Sweeper** | Every 1 hour | Deletes cattle listings older than 24 hours |
| **News Worker** | Every 3 hours | Fetches RSS feeds → keyword filter → stores metadata → cleans up articles >7 days old |

---

*Built with ❤️ for Karnataka's dairy farmers.*
