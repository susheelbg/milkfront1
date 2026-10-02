# 🥛 MilkMaatu — Premium Dairy Farming Platform

MilkMaatu is a **mobile-first, multilingual** full-stack digital platform built specifically for dairy farmers in Karnataka. It connects farmers directly to cattle feed suppliers, provides a local cattle marketplace (**Sante**), offers an AI-powered dairy advisory assistant (**Nandini AI**), delivers automated real-time local agriculture news (**Farmers News**), and provides administrators with comprehensive system governance — all dynamically localized in **Kannada (ಕನ್ನಡ)** and **English**.

🔗 **Live:**
- **Web App:** [https://milkfront1.onrender.com](https://milkfront1.onrender.com)
- **API Docs (Swagger):** [https://milkfront1.onrender.com/docs](https://milkfront1.onrender.com/docs)
- **Android Package:** `com.milkmaatu.app`
- **Firebase Project:** `milkfront1`

---

## 🌟 Key Features

### 1. 📱 Mobile-First Navigation
| Screen | Route | Description |
|--------|-------|-------------|
| **Home** | `/home` | Dashboard — Quick Services, News Ticker, Recommended Feeds |
| **Sante** | `/sante` | Local cattle marketplace (Buy & Sell) |
| **Buy Feeds** | `/feeds` | Cattle feed catalog with 2-column grid & bottom-sheet details |
| **My Orders** | `/orders` | Real-time order tracking and cancellation |
| **Profile** | `/profile` | Farmer profile management, language toggle, account settings |

### 2. 🌐 Multilingual Engine — Kannada & English
- **Kannada by default** — high accessibility for Karnataka dairy farmers.
- **Instant Language Toggle** — from Profile page, no page reload required.
- **Full UI Localization** — every button, dialog, error, and AI prompt localizes dynamically.
- **Locale Persistence** — stored in `localStorage` (`appLanguage`).
- Translation files: `frontend/src/i18n/kn.json` and `frontend/src/i18n/en.json`.

### 3. 🏠 Home Dashboard
- **🌾 Recommended Feeds Ticker:** Horizontally scrollable product carousel.
- **⚡ Quick Services Grid:** Buy Feeds, Sante, Milk Record, Nandini AI.
- **📰 Farmers News (ರೈತರ ಸುದ್ದಿ):** Horizontally scrolling regional agricultural news.

### 4. 📰 Farmers News Auto-Aggregator
```
Prajavani RSS (Kannada) ──────┐
                               ├─→ Keyword Filter ─→ Store Metadata Only ─→ PostgreSQL
The Hindu Agriculture (EN) ──┘   (Title, Source, Date, URL)

Farmer taps news item ──────────→ Opens publisher website directly in browser
```
- RSS synced every **6 hours** by background daemon.
- 55 Kannada + 36 English dairy/agriculture keywords.
- 13 noise-exclusion rules (horoscopes, entertainment, etc.).
- Articles older than **7 days** auto-purged.

### 5. 🐄 Sante Cattle Marketplace
- Local market hubs (Mandya, Tumkur, Hassan, Shivamogga, etc.)
- **24-hour listing expiry** — sweeper daemon purges hourly.
- One-tap phone dialer for direct buyer-seller contact.
- Photo upload via Supabase Storage (`milkmaatu-image` bucket).
- Community reporting & admin moderation of flagged listings.

### 6. 🛍️ Buy Feeds Shop & Cart
- 2-column responsive card grid on mobile.
- Dynamic pricing & flexible units (50 kg, 1 bag, 25 kg, etc.).
- Interactive bottom-sheet product details.
- Floating glassmorphic cart bar with real-time totals.
- Cash on Delivery checkout with profile address pre-fill.
- Order tracking (pending → processing → dispatched → delivered → cancelled) and cancellation.

### 7. 🧠 Nandini AI — Smart Dairy Assistant
- Powered by **Google Gemini 2.5 Flash**.
- Bilingual (Kannada / English) conversations.
- Domain-focused: cattle nutrition, milk yield, fat/SNF, vaccination, KMF/KCC schemes.
- Polite off-topic guardrails redirect to dairy farming.

### 8. 🔔 FCM Push Notifications

**Stage 1 (Live):** Device token registration.

```
Android App (@capacitor/push-notifications@8.1.2)
    ↓  FCM Token from Firebase
FastAPI  POST /api/devices/register
    ↓  PostgreSQL upsert (ON CONFLICT DO UPDATE)
public.user_devices (Supabase, RLS-protected)
```

**Lifecycle:**
| Event | Behaviour |
|-------|-----------|
| Login | Row upserted: `is_active = true`, `last_seen_at = now()` |
| Logout | Row updated: `is_active = false` — row is **never deleted** |
| Re-login | Same row reactivated: `is_active = true`, `last_seen_at = now()` |

**`public.user_devices` schema:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `user_id` | UUID FK | References `profiles(id)` CASCADE |
| `device_token` | TEXT UNIQUE | FCM registration token |
| `platform` | TEXT | `android` / `ios` / `web` |
| `created_at` | TIMESTAMPTZ | Row creation time |
| `updated_at` | TIMESTAMPTZ | Updated on every change |
| `last_seen_at` | TIMESTAMPTZ | Updated on every register call |
| `is_active` | BOOLEAN | `false` after logout |

**Stage 2 (Live):** Firebase Admin SDK initialized on backend. `send_push_notifications()` sends FCM multicast messages for new cattle/feed events. Invalid tokens are automatically deactivated on failed delivery.

### 9. 🛡️ Admin Dashboard (`/admin`)
| Section | Capabilities |
|---------|-------------|
| **Overview** | Platform metrics: users, orders, revenue, listings |
| **Feeds** | Add / edit / toggle visibility / delete feed products |
| **Orders** | Audit all orders, update status |
| **Users** | View directory, promote/demote roles (Super Admin) |
| **Cattle** | Audit & moderate Sante listings |
| **Reports** | Review flagged content; dismiss or remove offending posts |

### 10. 📜 Compliance & Support Pages
- **Privacy Policy** (`/privacy-policy`)
- **Terms & Conditions** (`/terms`)
- **Farmer Support** (`/support`)

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18 + Vite** | Fast SPA with hot module reloading |
| **Tailwind CSS** | Custom emerald/amber color system with glassmorphism |
| **React Router DOM v6** | Client-side routing with role-based guards |
| **Capacitor JS** | Native Android container bridge |
| **@capacitor/push-notifications** | FCM device token registration on Android |
| **Lucide React** | Modern SVG icon suite |
| **Custom i18n Context** | Multilingual Kannada/English translation provider |
| **Supabase JS SDK** | Auth, session management, and storage |

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI (Python 3.12+)** | Async Python web framework |
| **Uvicorn** | ASGI production server |
| **SQLAlchemy 2.0 (Async)** | Async ORM for PostgreSQL and SQLite |
| **asyncpg** | PostgreSQL production driver |
| **aiosqlite** | Local SQLite development fallback |
| **PostgreSQL / Supabase** | Production database and auth backend |
| **Supabase Storage** | Public object storage (`milkmaatu-image`) |
| **Google GenAI SDK** | Gemini 2.5 Flash for Nandini AI |
| **firebase-admin** | FCM push notification delivery (Stage 2) |
| **feedparser** | RSS parser for Farmers News daemon |

---

## 🔐 Authentication & Security

- **Supabase Auth** with persistent sessions across browser and native app.
- **Normal Users (`user`):** Login once — persistent session, full farmer features.
- **Admins (`admin`):** Elevated access to Admin Dashboard.
- **Super Admins (`super_admin`):** Full role management; protected by last-super-admin safeguard.
- **Backend JWT Verification:** FastAPI cryptographically validates Supabase JWTs via **JWKS ES256 signature verification**.
- **RLS:** Supabase Row Level Security enforced on `user_devices` and sensitive tables.

---

## 📂 Project Directory Structure

```
milkfront1/
├── frontend/                         # React 18 + Vite Web App
│   ├── src/
│   │   ├── main.jsx                  # Entrypoint — LanguageProvider + AuthProvider
│   │   ├── App.jsx                   # Route canvas + bottom navigation
│   │   ├── assets/                   # Static graphics & logo
│   │   ├── components/               # Header, BottomNav, Card, Button, Toast, Logo
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Supabase Auth state, FCM init on login
│   │   ├── i18n/                     # kn.json, en.json, LanguageContext, useTranslation
│   │   ├── lib/                      # Supabase client initializer
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Dashboard
│   │   │   ├── BuyFeedsPage.jsx      # Feed catalog & cart
│   │   │   ├── OrderSummaryPage.jsx  # Checkout
│   │   │   ├── OrdersPage.jsx        # Order tracking
│   │   │   ├── DairyNewsPage.jsx     # Farmers news
│   │   │   ├── SanteActionPage.jsx   # Cattle hub selector
│   │   │   ├── SanteBuyPage.jsx      # Browse & filter listings
│   │   │   ├── SanteSellPage.jsx     # Post cattle listing
│   │   │   ├── NandiniAIPage.jsx     # Gemini chat
│   │   │   ├── ProfilePage.jsx       # Profile & language toggle
│   │   │   ├── AdminDashboard.jsx    # Admin control panel (RBAC)
│   │   │   ├── LoginPage.jsx         # Login (circular logo)
│   │   │   ├── RegisterPage.jsx      # Registration
│   │   │   └── compliance/           # PrivacyPolicy, Terms, Support
│   │   ├── routes/                   # ProtectedRoute, PublicOnlyRoute, AdminRoute
│   │   ├── services/
│   │   │   ├── api/
│   │   │   │   ├── apiClient.js      # Fetch wrapper with Supabase Bearer token injection
│   │   │   │   ├── authApi.js        # Auth & profile API
│   │   │   │   ├── adminApi.js       # Admin endpoints
│   │   │   │   ├── feedsApi.js       # Feeds catalog
│   │   │   │   ├── cattleApi.js      # Sante marketplace
│   │   │   │   ├── orderApi.js       # Order placement & tracking
│   │   │   │   ├── newsApi.js        # Farmers News
│   │   │   │   └── deviceApi.js      # FCM device token registration/deactivation
│   │   │   ├── fcmService.js         # Firebase FCM token lifecycle management
│   │   │   ├── branding.js           # Single source of truth for logo URL & brand assets
│   │   │   └── toastService.js       # Toast notification signals
│   │   └── styles/
│   │       └── index.css             # Tailwind directives, animations, scrollbars
│   ├── public/
│   │   └── milkmaatu-logo.png        # Local logo asset
│   ├── android/                      # Native Android project (Capacitor)
│   │   └── app/
│   │       ├── google-services.json  # Firebase Android config (milkfront1)
│   │       └── build.gradle          # App-level Groovy Gradle (Firebase BoM, FCM)
│   ├── capacitor.config.ts           # Capacitor configuration
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/                          # FastAPI Backend Application
│   ├── app/
│   │   ├── main.py                   # App entrypoint, middleware, background workers
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic-settings (DATABASE_URL, SUPABASE_*, FIREBASE_*)
│   │   │   ├── database.py           # SQLAlchemy engine pools & async session
│   │   │   ├── auth.py               # Supabase JWKS ES256 cryptographic verification
│   │   │   └── dependencies.py       # RBAC dependencies (get_current_user/admin)
│   │   ├── models/
│   │   │   ├── user.py               # Profile & user table
│   │   │   ├── feed.py               # Feed product table
│   │   │   ├── order.py              # Orders & line items
│   │   │   ├── cattle.py             # Sante listings & expiry
│   │   │   ├── news.py               # Dairy news articles
│   │   │   └── user_device.py        # FCM device tokens (user_devices)
│   │   ├── routes/
│   │   │   ├── auth_routes.py        # Auth, profile sync
│   │   │   ├── feed_routes.py        # Public feeds + Admin product management
│   │   │   ├── order_routes.py       # Orders (user + admin)
│   │   │   ├── cattle_routes.py      # Sante marketplace
│   │   │   ├── profile_routes.py     # Profile updates
│   │   │   ├── admin_routes.py       # Admin dashboard
│   │   │   ├── ai_routes.py          # Nandini AI
│   │   │   ├── news_routes.py        # Farmers News API
│   │   │   ├── report_routes.py      # Content moderation reports
│   │   │   ├── notification_routes.py # In-app notifications
│   │   │   └── device_routes.py      # FCM device token registration & deactivation
│   │   ├── schemas/
│   │   │   ├── user.py, feed.py, order.py, cattle.py, device.py
│   │   ├── services/
│   │   │   ├── storage_service.py        # Supabase Storage base64 uploads
│   │   │   ├── device_service.py         # FCM token upsert, deactivation logic
│   │   │   ├── push_notification_service.py # Firebase Admin FCM send (Stage 2)
│   │   │   ├── notification_service.py   # In-app notification CRUD
│   │   │   ├── super_admin_bootstrap.py  # Idempotent Super Admin creation on startup
│   │   │   ├── ai/
│   │   │   │   └── nandini_ai.py         # Gemini 2.5 Flash + dairy farming filters
│   │   │   └── news/                     # RSS fetcher & keyword filter daemon
│   │   └── utils/
│   │       └── response.py               # Standardized JSON response envelope
│   ├── migrations/
│   │   └── 003_user_devices_table.sql    # user_devices table + RLS migration
│   ├── requirements.txt
│   └── .env                              # Backend secrets (not committed to Git)
│
├── ANDROID_BUILD.md                  # Android keystore, signing & APK/AAB build guide
└── README.md                         # This file — complete project documentation
```

---

## 🚀 Local Development Setup

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install requirements
pip install --upgrade pip
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API Root: `http://localhost:8000`
- Swagger API Docs: `http://localhost:8000/docs`

### 2. Frontend Setup (React + Vite)

```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev

# Expose to local network for mobile testing
npm run dev -- --host
```
- Local Web Portal: `http://localhost:5173`

---

## 🤖 Android Native Build

```bash
# 1. Build production React app
cd frontend && npm run build

# 2. Sync web build to native Android project
npx cap sync android

# 3. Compile signed release APK
cd android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
./gradlew assembleRelease
```

Output APK: `frontend/android/app/build/outputs/apk/release/app-release.apk`

See **[ANDROID_BUILD.md](ANDROID_BUILD.md)** for keystore setup, versioning, and Google Play AAB generation.

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection URL (`postgresql+asyncpg://...`) |
| `SUPABASE_URL` | Supabase project URL (`https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret for token verification |
| `INITIAL_SUPER_ADMIN_EMAIL` | Bootstrap Super Admin email |
| `INITIAL_SUPER_ADMIN_PASSWORD` | Bootstrap Super Admin password |
| `GEMINI_API_KEY` | Google Gemini API key for Nandini AI |
| `FIREBASE_PROJECT_ID` | Firebase project ID (`milkfront1`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin service account JSON (single-line minified) |

> ⚠️ `backend/.env` is listed in `.gitignore` and **never committed to Git**.

### Frontend (`frontend/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | FastAPI Backend URL (`https://milkfront1.onrender.com`) |
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Client Anon Key |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_FIREBASE_VAPID_KEY` | Firebase VAPID key for web push |

---

## 📋 API Endpoints Reference

All endpoints are prefixed with `/api`.

### 🟢 Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API Health Check |
| `GET` | `/api/feeds` | List active feed products |
| `GET` | `/api/cattle` | Browse active Sante cattle listings |
| `GET` | `/api/cattle/{id}` | Get cattle listing detail |
| `POST` | `/api/cattle` | Post new cattle listing |
| `POST` | `/api/ai/nandini` | Ask Nandini AI |
| `GET` | `/api/news/latest` | Fetch 6 most recent news items |
| `GET` | `/api/news` | Fetch paginated news articles |

### 🔐 Authenticated User Endpoints (Bearer JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/me` | Fetch authenticated profile |
| `PUT` | `/api/auth/profile` | Update profile (Name, Phone, Address) |
| `POST` | `/api/auth/sync-profile` | Sync Supabase metadata to profiles |
| `POST` | `/api/orders` | Create feed order |
| `GET` | `/api/orders/my-orders` | Fetch order history |
| `PUT` | `/api/orders/{id}/cancel` | Cancel pending order |
| `DELETE` | `/api/cattle/{id}` | Delete own cattle listing |
| `POST` | `/api/cattle/report` | Submit moderation report |
| `POST` | `/api/devices/register` | Register/refresh FCM device token |
| `POST` | `/api/devices/deactivate` | Deactivate FCM token on logout |

### 🛡️ Admin Endpoints (Admin / Super Admin JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Real-time dashboard analytics |
| `GET` | `/api/admin/users` | List all user profiles |
| `PUT` | `/api/admin/users/{id}/role` | Promote/demote role (Super Admin only) |
| `GET` | `/api/admin/feeds` | View all feeds (including hidden) |
| `POST` | `/api/feeds/admin` | Create feed product |
| `PATCH` | `/api/feeds/admin/{id}` | Update / toggle feed visibility |
| `DELETE` | `/api/feeds/admin/{id}` | Delete feed product |
| `GET` | `/api/admin/orders` | Audit all system orders |
| `PUT` | `/api/admin/orders/{id}/status` | Update order status |
| `GET` | `/api/admin/cattle` | Audit all Sante listings |
| `DELETE` | `/api/admin/cattle/{id}` | Moderate/delete cattle listing |
| `GET` | `/api/admin/reports` | View all content reports |
| `POST` | `/api/admin/reports/{id}/dismiss` | Dismiss report |
| `POST` | `/api/admin/reports/{id}/action` | Action report (delete offending post) |

---

## 🗺️ Background Daemons

| Daemon | Interval | Operation |
|--------|----------|-----------|
| **Sante Sweeper** | Every 1 hour | Purges expired cattle listings (`expires_at` past) |
| **News Refresh Worker** | Every 6 hours | Ingests RSS, filters keywords, purges items >7 days old |
| **Notification Cleanup Worker** | Every 30 minutes | Purges read notifications >12 hours & unread >7 days |

---

## 📸 Supabase Storage

Images uploaded to public bucket `milkmaatu-image`:
- `cattle/{user_id}/{uuid}.jpg` — Cattle listing photos
- `feeds/{uuid}.jpg` — Feed product catalog images
- `profiles/{user_id}/{uuid}.jpg` — Profile pictures
- `other/{uuid}.jpg` — Other assets (e.g., `logo.jpeg` — brand logo)

Brand logo URL: `https://ywgjsvrvyokzkhtyxqrt.supabase.co/storage/v1/object/public/milkmaatu-image/other/logo.jpeg`

---

## 🗄️ Database Migrations

Manual SQL migrations are applied via the Supabase SQL Editor:

| File | Description |
|------|-------------|
| `backend/migrations/003_user_devices_table.sql` | `public.user_devices` table with RLS policies |

---

*Built with ❤️ for Karnataka's dairy farmers.*
