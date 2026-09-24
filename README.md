# 🥛 MilkMaatu — Premium Dairy Farming Platform

MilkMaatu is a **mobile-first, multilingual** full-stack platform built specifically for dairy farmers in Karnataka. It connects farmers to feed suppliers, provides a local cattle marketplace (Sante), offers an AI-powered dairy assistant (Nandini AI), delivers daily farmer news, and gives administrators full control over the platform — all translated dynamically in **Kannada (ಕನ್ನಡ)** and **English**.

**Authentication & Security Architecture:**
MilkMaatu utilizes **Supabase Authentication** with persistent sessions and server-enforced **Role-Based Access Control (RBAC)**:
- **Normal Users:** Register or log in once on first use to establish a persistent Supabase session across browser refreshes and mobile app sessions. They can browse feeds, post cattle in Sante, consult Nandini AI, and place orders tied to their authenticated profile.
- **Admins:** Authenticate through the standard Supabase Auth system and access the Admin Dashboard to manage feeds, audit orders, and moderate Sante listings based on `public.profiles.role = 'admin'`.
- **Super Admins:** Possess top-level administrative authority including role management (promoting/demoting users) guarded by last-super-admin safeguards.

FastAPI acts as the strict backend security boundary, cryptographically verifying Supabase JWTs via Supabase JWKS (ES256).

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
| My Orders | `/orders` | Order tracking by authenticated customer profile |
| Profile | `/profile` | Farmer details, language toggle, and account settings |

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
- **Data Integrity & Line-Item Snapshotting**:
  - Order line items snapshot `product_name` directly onto `order_items`.
  - Orders link directly to UUID `user_id` referencing `public.profiles(id)` for verified customer records.
- **Order Placement Experience**:
  - Order confirmation screen displays only after the backend successfully creates the order.
  - Submit button is disabled during submission to prevent duplicate requests.
  - Confirmation screen displays for approximately 5000ms before auto-navigating to `/home`.

---

### 6. 🐄 Sante Cattle Marketplace
- Listings scoped to local market hubs within a 20 km radius.
- **24-hour auto-expiry** — a background daemon sweeps the DB hourly to delete expired posts.
- **Direct seller phone contact** — one-tap phone calls to farmers.
- **Owner post management** — delete your own listings easily.

---

### 7. 🛍️ Buy Feeds Shop
- **2-column grid** on mobile, 3-column on desktop.
- **Real Database-Driven:** Feeds are sourced live from PostgreSQL via FastAPI (`/api/feeds`). Only active, non-hidden feeds are shown to users.
- **Dynamic Units & Pricing:** Displays units (e.g., `50 kg`, `1 bag`) as configured by administrators.
- **Compact product cards** — image, name, price, unit, and Add button.
- **Tap a card → bottom sheet detail view** slides up with full description and a large Add to Cart button.
- **Glassmorphic floating cart bar** — real-time quantity + price totals.
- Pre-filled checkout using saved profile delivery address with instant cash-on-delivery order placement.

---

### 8. 🧠 Nandini AI — Dairy Assistant
Powered by **Google Gemini 2.5 Flash**:
- Responds in the farmer's active language (Kannada or English).
- Scoped to dairy husbandry, feed management, vaccination, milk fat, and Karnataka government schemes.
- Politely declines non-farming topics.

---

### 9. 🛡️ Admin Dashboard (`/admin`)
Administrative functions are protected by Supabase Auth RBAC (Admin or Super Admin required) with 100% database-driven visibility:
| Section | Capabilities | Access | Data Source |
|---------|-------------|--------|-------------|
| Overview | Live database analytics: active feeds, total products, orders, registered users, cattle listings | Admin & Super Admin | PostgreSQL (`/api/admin/stats`) |
| Feeds | Add, edit, hide/unhide, delete cattle feeds (Name, description, price, unit, stock, image, status) | Admin & Super Admin | PostgreSQL (`/api/admin/feeds`) |
| Orders | Audit real customer orders, customer contact info, itemized snapshots, order status updates | Admin & Super Admin | PostgreSQL (`/api/admin/orders`) |
| Users | View registered user profiles (name, email, phone, address, role, joined date), Super Admin role promotions | Admin (view) / Super Admin (roles) | `public.profiles` (`/api/admin/users`) |
| Cattle | Browse & moderate all Sante cattle listings with real seller contacts, location, expiry status | Admin & Super Admin | PostgreSQL (`/api/admin/cattle`) |

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18 + Vite** | Fast SPA with hot module replacement |
| **Tailwind CSS** | Utility-first responsive styling (emerald + gold palette) |
| **React Router DOM v6** | Client-side routing with RBAC protection |
| **Capacitor JS** | Native Android bridge |
| **Lucide React** | Icon library |
| **i18n (custom)** | Kannada/English translation context |

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | Async Python REST API |
| **SQLAlchemy 2.0 (Async)** | ORM with async session management |
| **PostgreSQL / Supabase** | Production database & Auth source of truth |
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
│   │   │   └── AdminDashboard.jsx    # Admin control panel (Supabase RBAC)
│   │   ├── i18n/
│   │   │   ├── kn.json               # Kannada translations
│   │   │   ├── en.json               # English translations
│   │   │   ├── LanguageContext.jsx   # React context provider
│   │   │   └── useTranslation.js     # Hook to access t()
│   │   ├── services/api/
│   │   │   ├── apiClient.js          # Fetch wrapper with Supabase Bearer Auth
│   │   │   ├── authApi.js            # Supabase Auth integration & profile sync
│   │   │   ├── feedsApi.js           # Feed catalog actions
│   │   │   ├── cattleApi.js          # Sante marketplace actions
│   │   │   ├── orderApi.js           # Feed order placements & status
│   │   │   └── newsApi.js            # Farmers News API calls
│   │   └── styles/index.css          # Global styles + animations
│   ├── android/                      # Capacitor Android native project
│   └── .env                          # VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── main.py                   # App bootstrap + background daemons
│   │   ├── core/
│   │   │   ├── config.py             # Settings from environment (DATABASE_URL, SUPABASE_*, etc.)
│   │   │   ├── database.py           # Async SQLAlchemy engine
│   │   │   ├── auth.py               # Supabase JWKS cryptographic verification
│   │   │   └── dependencies.py       # RBAC dependencies (get_current_user, get_current_admin)
│   │   ├── models/
│   │   │   ├── user.py               # Profile & user DB table mapping
│   │   │   ├── feed.py               # Feeds product DB table mapping with unit
│   │   │   ├── order.py              # Order & items DB table mapping with snapshot product_name
│   │   │   ├── cattle.py             # Sante cattle listing ORM model
│   │   │   └── news.py               # NewsArticle ORM model
│   │   ├── routes/
│   │   │   ├── feed_routes.py        # Feed catalog (public + admin)
│   │   │   ├── order_routes.py       # Order placement & tracking (authenticated + admin)
│   │   │   ├── cattle_routes.py      # Sante marketplace (public)
│   │   │   ├── profile_routes.py     # Profile details & update
│   │   │   ├── ai_routes.py          # Nandini AI chat (public)
│   │   │   ├── news_routes.py        # Farmers News API (public)
│   │   │   └── admin_routes.py       # Admin stats, users, feeds, cattle & orders
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

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:pwd@db.host:5432/postgres` | DB connection string |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase service role secret |
| `INITIAL_SUPER_ADMIN_EMAIL` | `admin@milkmaatu.com` | Initial super admin bootstrap email |
| `INITIAL_SUPER_ADMIN_PASSWORD`| `securepassword` | Initial super admin bootstrap password |
| `GEMINI_API_KEY` | `AIza...` | Nandini AI assistant |
| `CLOUDINARY_CLOUD_NAME` | `mycloud` | Image CDN (optional) |
| `CLOUDINARY_API_KEY` | `123456` | Image CDN (optional) |
| `CLOUDINARY_API_SECRET` | `secret` | Image CDN (optional) |

---

## 📋 API Routes Reference

All endpoints are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/` | — | Health check |
| `GET` | `/api/feeds` | — | Feed product catalog (public, active only) |
| `POST` | `/api/orders` | 🛡️ Bearer JWT | Place order linked to authenticated profile |
| `GET` | `/api/orders/my-orders` | 🛡️ Bearer JWT | Order history for authenticated user |
| `PUT` | `/api/orders/{id}/cancel` | 🛡️ Bearer JWT | Cancel pending order |
| `GET` | `/api/cattle` | — | Browse active Sante cattle |
| `POST` | `/api/cattle` | — | Post cattle listing |
| `DELETE` | `/api/cattle/{id}` | — | Delete cattle listing |
| `POST` | `/api/cattle/report` | — | Report cattle listing for review |
| `POST` | `/api/ai/nandini` | — | Nandini AI chat (Kannada / English) |
| `GET` | `/api/news/latest` | — | Latest 6 farmer news articles |
| `GET` | `/api/news` | — | Paginated full news list |
| `GET` | `/api/admin/stats` | 🛡️ Bearer JWT (Admin) | Platform metrics from real database |
| `GET` | `/api/admin/users` | 🛡️ Bearer JWT (Admin) | Registered users list from `public.profiles` |
| `PATCH`| `/api/admin/users/{id}/role` | 🛡️ Bearer JWT (Super Admin) | Change user role with last-super-admin protection |
| `GET` | `/api/admin/feeds` | 🛡️ Bearer JWT (Admin) | View all feeds including hidden |
| `POST` | `/api/feeds/admin` | 🛡️ Bearer JWT (Admin) | Create new feed |
| `PATCH`| `/api/feeds/admin/{id}` | 🛡️ Bearer JWT (Admin) | Update / hide / unhide feed |
| `DELETE`| `/api/feeds/admin/{id}` | 🛡️ Bearer JWT (Admin) | Delete feed |
| `GET` | `/api/admin/orders` | 🛡️ Bearer JWT (Admin) | Audit all system orders with line items |
| `PUT` | `/api/admin/orders/{id}/status` | 🛡️ Bearer JWT (Admin) | Update order status |
| `GET` | `/api/admin/cattle` | 🛡️ Bearer JWT (Admin) | Moderate Sante cattle listings |
| `DELETE`| `/api/admin/cattle/{id}` | 🛡️ Bearer JWT (Admin) | Remove moderated cattle listing |

---

## 🗺️ Background Workers

Two long-running async daemons start automatically with the server ([`main.py`](backend/app/main.py)):

| Worker | Interval | What it does |
|--------|---------|-------------|
| **Sante Sweeper** | Every 1 hour | Deletes cattle listings older than 24 hours |
| **News Worker** | Every 3 hours | Fetches RSS feeds → keyword filter → stores metadata → cleans up articles >7 days old |

---

*Built with ❤️ for Karnataka's dairy farmers.*
