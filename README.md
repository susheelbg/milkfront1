# 🥛 MilkMaatu — Premium Dairy Farming Platform

MilkMaatu is a **mobile-first, multilingual, and frictionless** full-stack platform built specifically for dairy farmers in Karnataka. It connects farmers to feed suppliers, provides a local cattle marketplace (Sante), offers an AI-powered dairy assistant (Nandini AI), delivers daily farmer news, and gives administrators control over the platform — all translated dynamically in **Kannada (ಕನ್ನಡ)** and **English**.

**Zero Login Friction:** MilkMaatu does not require farmers to create accounts, remember passwords, or verify OTPs. Farmers open the app directly into `/home` and can immediately browse feeds, post cattle in Sante, consult Nandini AI, and place orders.

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
| Sante | `/sante` | Local cattle marketplace (Buy & Sell) |
| Buy Feeds | `/feeds` | Cattle feed shop with 2-column mobile layout |
| My Orders | `/orders` | Order tracking by device history and phone |
| Profile | `/profile` | Local farmer details, language toggle, and support links |

---

### 2. 🌐 Multilingual — Kannada & English
- **Kannada by default** — maximum accessibility for Karnataka dairy farmers.
- **Instant toggle** on the Profile page. No page refresh needed.
- **Fully translated UI:** every label, message, button, and section heading switches language — including the Farmers News widget, Quick Services, Recommended Feeds, and error states.
- Translations live in [`src/i18n/kn.json`](frontend/src/i18n/kn.json) and [`src/i18n/en.json`](frontend/src/i18n/en.json).
- Selected locale is persisted in `localStorage` (`appLanguage`).

---

### 3. 🏠 Home Dashboard
The home screen is organized into clean, stacked sections:

#### 🌾 Recommended Feeds Ticker
Horizontally scrolling card carousel showing catalog feeds with instant navigation to details.

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
- **Public & Unauthenticated** — accessible to all farmers instantly.

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

### 5. 🔐 Supabase Authentication & Role-Based Access Control (RBAC)
MilkMaatu implements cryptographically verified authentication and role-based authorization:
- **Supabase Auth Integration**: User registration, login, session tokens, and password reset powered by Supabase Auth with persistent sessions across refreshes and Capacitor mobile restarts.
- **Three Core Roles**:
  - `user`: Default role for registering farmers. Can browse, purchase feeds, post cattle in Sante, and track orders. Cannot elevate own role.
  - `admin`: Can access the Admin Dashboard, manage feeds (create, edit, hide, delete), audit and dispatch customer orders, and moderate Sante listings.
  - `super_admin`: Full system control. Can promote users to `admin`, demote admins back to `user`, and manage administrative access. Protected by last Super Admin safeguards.
- **Server-Side Security & Cryptographic JWKS Verification**:
  - Tokens are cryptographically verified using Supabase JWKS public signing keys (ES256).
  - No insecure JWT decoding without signature verification.
  - All sensitive operations strictly guarded on FastAPI endpoints and database RLS.
- **Idempotent Super Admin Bootstrap**:
  - Reads `INITIAL_SUPER_ADMIN_EMAIL` and `INITIAL_SUPER_ADMIN_PASSWORD` from backend-only `.env`.
  - Automatically verifies and upserts the Super Admin account and profile on startup.
- **Historical Data Preservation**:
  - Safely preserves all 27 historical orders, 33 order items, and 11 cattle listings.
  - Historical integer user IDs preserved in `legacy_user_id` while new records link to UUID `user_id` referencing `public.profiles(id)`.
- **Order Placement Experience**:
  - Order confirmation screen displays only after the backend successfully creates the order.
  - Submit button is disabled during submission to prevent duplicate requests.
  - Confirmation screen displays for exactly 5000ms before auto-navigating to `/home`.

---

### 6. 🐄 Sante Cattle Marketplace
- Listings scoped to local market hubs (e.g. *KRS Sante*, *Thendekere Sante*) within a 20 km radius.
- **24-hour auto-expiry** — a background daemon sweeps the DB hourly to delete expired posts.
- **Direct seller phone contact** — one-tap phone calls to farmers.
- **Owner post management** — easily delete your own listings without needing an account.

---

### 7. 🛍️ Buy Feeds Shop
- **2-column grid** on mobile, 3-column on desktop.
- **Compact product cards** — image, name, price, and Add button only.
- **Tap a card → bottom sheet detail view** slides up with full description and a large Add to Cart button.
- **Glassmorphic floating cart bar** — real-time quantity + price totals.
- Pre-filled checkout using saved profile delivery address with instant cash-on-delivery order placement.

---

### 8. 🧠 Nandini AI — Dairy Assistant
Powered by **Google Gemini 2.5 Flash**:
- Responds in the farmer's active language (Kannada or English).
- Scoped to dairy husbandry, feed management, vaccination, milk fat, and Karnataka government schemes.
- Politely declines non-farming topics.
- Completely open and accessible without login.

---

### 9. 🛡️ Admin Dashboard (`/admin`)
Administrative functions are protected by Supabase Auth RBAC (Admin or Super Admin required) with resilient dual-property fallback rendering ensuring 100% data visibility:
| Section | Capabilities | Access | Data Visibility & Features |
|---------|-------------|--------|----------------------------|
| Overview | Live database analytics, total revenue, catalog feeds, registered users, total & pending orders, cattle listings | Admin & Super Admin | Calculates system metrics, revenue totals, and instant quick actions |
| Feeds | Add / edit / hide / remove feed products | Admin & Super Admin | Complete feed catalog with visibility toggles, image previews, and price management |
| Orders | Audit all customer orders, view line items, delivery addresses, and customer contacts, update status | Admin & Super Admin | Full historical & live order audit with itemized feed breakdowns, addresses, and status selectors |
| Users | View registered user directory, promote users to Admin, demote Admins | Super Admin only | Registered user profiles with email, phone, address, registration dates, and Super Admin RBAC management |
| Cattle | Browse & moderate all Sante cattle listings (active & historical) | Admin & Super Admin | Full cattle listings view including breed, price, village, seller contact, and deletion actions |
| Moderation | Review compliance reports and suspend bad actors | Admin & Super Admin | Compliance review table with listing IDs, reporter phone numbers, report reasons, dismissal, actioning, and user account suspension |


---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18 + Vite** | Fast SPA with hot module replacement |
| **Tailwind CSS** | Utility-first responsive styling (emerald + gold palette) |
| **React Router DOM v6** | Client-side routing with direct access |
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
| **Cloudinary SDK** | Image CDN for cattle photos |
| **Google GenAI SDK** | Gemini 2.5 Flash for Nandini AI |
| **feedparser / xml.etree** | RSS parsing for Farmers News |
| **anyio** | Async thread pool for blocking I/O |

---

## 📂 Project Structure

```
milkfront1/
├── frontend/                         # React 18 + Vite frontend
│   ├── src/
│   │   ├── components/               # Header, BottomNav, Card, Button, etc.
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Dashboard with Quick Services + News + Feeds
│   │   │   ├── BuyFeedsPage.jsx      # Feed shop (2-col grid + bottom sheet detail)
│   │   │   ├── OrderSummaryPage.jsx  # Checkout & order placement
│   │   │   ├── OrdersPage.jsx        # My Orders live tracking
│   │   │   ├── DairyNewsPage.jsx     # Full news listing page
│   │   │   ├── SanteActionPage.jsx   # Sante hub selector (Buy / Sell)
│   │   │   ├── SanteBuyPage.jsx      # Browse & filter cattle listings
│   │   │   ├── SanteSellPage.jsx     # Post cattle ad with direct photo upload
│   │   │   ├── NandiniAIPage.jsx     # AI chat assistant
│   │   │   ├── ProfilePage.jsx       # Local farmer details & language toggle
│   │   │   └── AdminDashboard.jsx    # Admin control panel (PIN guarded)
│   │   ├── i18n/
│   │   │   ├── kn.json               # Kannada translations
│   │   │   ├── en.json               # English translations
│   │   │   ├── LanguageContext.jsx   # React context provider
│   │   │   └── useTranslation.js     # Hook to access t()
│   │   ├── services/api/
│   │   │   ├── apiClient.js          # Fetch wrapper supporting optional Admin PIN
│   │   │   ├── authApi.js            # Local farmer profile & admin PIN manager
│   │   │   ├── feedsApi.js           # Feed catalog actions
│   │   │   ├── cattleApi.js          # Sante marketplace actions
│   │   │   ├── orderApi.js           # Feed order placements & status
│   │   │   └── newsApi.js            # Farmers News API calls
│   │   └── styles/index.css          # Global styles + animations
│   ├── android/                      # Capacitor Android native project
│   └── .env                          # VITE_API_URL
│
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── main.py                   # App bootstrap + background daemons
│   │   ├── core/
│   │   │   ├── config.py             # Settings from environment (ACCESS_PIN, etc.)
│   │   │   ├── database.py           # Async SQLAlchemy engine
│   │   │   └── dependencies.py       # Admin PIN & guest user dependencies
│   │   ├── models/
│   │   │   ├── user.py               # User / farmer ORM model
│   │   │   ├── feed.py               # Feed product ORM model
│   │   │   ├── order.py              # Order & items ORM model
│   │   │   ├── cattle.py             # Sante cattle listing ORM model
│   │   │   └── news.py               # NewsArticle ORM model
│   │   ├── routes/
│   │   │   ├── feed_routes.py        # Feed catalog (public + admin)
│   │   │   ├── order_routes.py       # Order placement & tracking (public + admin)
│   │   │   ├── cattle_routes.py      # Sante marketplace (public)
│   │   │   ├── profile_routes.py     # Profile details
│   │   │   ├── ai_routes.py          # Nandini AI chat (public)
│   │   │   ├── news_routes.py        # Farmers News API (public)
│   │   │   └── admin_routes.py       # Admin stats & moderation
│   │   └── services/
│   │       ├── ai/nandini_ai.py      # Gemini integration
│   │       ├── news/                 # RSS news fetch & filter workers
│   │       └── cloudinary_service.py # Cloudinary image upload helper
│   ├── requirements.txt
│   └── .env                          # Backend secrets
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

# Run with hot-reload
uvicorn app.main:app --reload --port 8000
```

- API available at **`http://localhost:8000`**
- Swagger docs at **`http://localhost:8000/docs`**

### Frontend

```bash
cd frontend

npm install

# Configure environment
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Start dev server
npm run dev

# Expose on local Wi-Fi for phone testing
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
| `ACCESS_PIN` | `4512` | Admin Access PIN for `/admin` |
| `GEMINI_API_KEY` | *(Google AI Studio)* | Nandini AI assistant |
| `CLOUDINARY_CLOUD_NAME` | *(optional)* | Image CDN |
| `CLOUDINARY_API_KEY` | *(optional)* | Image CDN |
| `CLOUDINARY_API_SECRET` | *(optional)* | Image CDN |

---

## 📋 API Routes Reference

All endpoints are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/` | — | Health check |
| `GET` | `/api/feeds` | — | Feed product catalog (public) |
| `POST` | `/api/orders` | — | Place order (customer name + phone) |
| `GET` | `/api/orders/my-orders` | — | Order history by phone / order IDs |
| `PUT` | `/api/orders/{id}/cancel` | — | Cancel pending order |
| `GET` | `/api/cattle` | — | Browse active Sante cattle |
| `POST` | `/api/cattle` | — | Post cattle listing |
| `DELETE` | `/api/cattle/{id}` | — | Delete cattle listing |
| `POST` | `/api/cattle/report` | — | Report cattle listing for review |
| `POST` | `/api/ai/nandini` | — | Nandini AI chat (Kannada / English) |
| `GET` | `/api/news/latest` | — | Latest 6 farmer news articles |
| `GET` | `/api/news` | — | Paginated full news list |
| `GET` | `/api/admin/stats` | 🛡️ Admin PIN | Platform metrics and counters |
| `GET` | `/api/admin/orders` | 🛡️ Admin PIN | Audit all system orders |
| `PUT` | `/api/admin/orders/{id}/status` | 🛡️ Admin PIN | Update dispatch status |
| `GET` | `/api/feeds/admin` | 🛡️ Admin PIN | View all feeds including hidden |

---

## 🗺️ Background Workers

Two long-running async daemons start automatically with the server ([`main.py`](backend/app/main.py)):

| Worker | Interval | What it does |
|--------|---------|-------------|
| **Sante Sweeper** | Every 1 hour | Deletes cattle listings older than 24 hours |
| **News Worker** | Every 3 hours | Fetches RSS feeds → keyword filter → stores metadata → cleans up articles >7 days old |

---

*Built with ❤️ for Karnataka's dairy farmers.*
