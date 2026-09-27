# 🥛 MilkMaatu — Premium Dairy Farming Platform

MilkMaatu is a **mobile-first, multilingual** full-stack digital platform built specifically for dairy farmers in Karnataka. It connects farmers directly to cattle feed suppliers, provides a local cattle marketplace (**Sante**), offers an AI-powered dairy advisory assistant (**Nandini AI**), delivers automated real-time local agriculture news (**Farmers News**), and provides administrators with comprehensive system governance and content moderation tools — all dynamically localized in **Kannada (ಕನ್ನಡ)** and **English**.

---

## 🔐 Authentication & Security Architecture

MilkMaatu utilizes **Supabase Auth** integrated with persistent client-side sessions and server-enforced **Role-Based Access Control (RBAC)** via **FastAPI**:

- **Normal Users (`user`):** Register or log in once to establish a persistent session across browser refreshes and native mobile app restarts. Users can browse feed products, place orders, post cattle listings on Sante, consult Nandini AI, track their order history, and submit content moderation reports.
- **Administrators (`admin`):** Authenticated users elevated to access the Admin Dashboard to manage feed catalogs, audit customer orders, update delivery statuses, moderate Sante cattle listings, and review reported content based on `public.profiles.role = 'admin'`.
- **Super Admins (`super_admin`):** Hold full system governance capabilities, including promoting or demoting user roles. Protected by automated **last-super-admin safeguards** to prevent accidental lockout.

FastAPI serves as the backend security boundary, cryptographically validating Supabase JWTs via **Supabase JWKS (ES256 signature verification)** on all protected endpoints.

🔗 **Production Deployments:**
- **Web App / Portal:** [https://milkfront1.onrender.com](https://milkfront1.onrender.com)
- **API Documentation (Swagger):** [https://milkfront1.onrender.com/docs](https://milkfront1.onrender.com/docs)

---

## 🌟 Key Features

### 1. 📱 Mobile-First Ergonomic Navigation
Designed for seamless single-thumb usage on mobile screens:
| Screen | Route | Description |
|--------|-------|-------------|
| **Home** | `/home` | Main dashboard — Quick Services, News Ticker, Recommended Feeds |
| **Sante** | `/sante` | Local cattle marketplace action hub (Buy & Sell) |
| **Buy Feeds** | `/feeds` | Cattle feed catalog with 2-column grid & bottom-sheet details |
| **My Orders** | `/orders` | Real-time order tracking and cancellation for logged-in farmers |
| **Profile** | `/profile` | Farmer profile management, language toggle, and account settings |

---

### 2. 🌐 Multilingual Engine — Kannada (ಕನ್ನಡ) & English
- **Kannada by default** — engineered for high accessibility among dairy farmers in regional Karnataka.
- **Instant Language Toggle** — accessible from the Profile page header and persistent state. No page reload required.
- **Comprehensive UI Localization** — every button, dialog, navigation link, feed product, news widget, error state, and AI prompt context translates dynamically.
- **Locale Persistence** — stored in browser `localStorage` (`appLanguage`) for smooth navigation.
- Translation files: [`frontend/src/i18n/kn.json`](frontend/src/i18n/kn.json) and [`frontend/src/i18n/en.json`](frontend/src/i18n/en.json).

---

### 3. 🏠 Home Dashboard
The home screen organizes essential tools into structured sections:

- **🌾 Recommended Feeds Ticker:** Horizontally scrollable product carousel with immediate access to feed details and purchase options.
- **⚡ Quick Services Grid:** 4 prominent quick-access buttons:
  - 🌾 **Buy Feeds** — Access the cattle feed store.
  - 🐄 **Sante** — Local cattle marketplace.
  - 🥛 **Milk Record** — OCR milk slip scanner utility.
  - 🤖 **Nandini AI** — AI-powered dairy virtual assistant.
- **📰 Farmers News (ರೈತರ ಸುದ್ದಿ):** Horizontally scrolling news card widget showing verified regional agricultural news articles direct from trusted publishers.

---

### 4. 📰 Farmers News Auto-Aggregator (ರೈತರ ಸುದ್ದಿ)
A lightweight, compliance-friendly news aggregation subsystem that **never stores full article content** — preserving publisher copyright.

```
Prajavani RSS (Kannada) ──────┐
                              ├─→ Keyword Filter ─→ Store Metadata Only ─→ PostgreSQL
The Hindu Agriculture (EN) ──┘   (Title, Source, Date, URL)

Farmer taps news item ──────────→ Opens publisher website directly in new browser tab
```

- **Automated RSS Fetching:** Background worker syncs verified feeds every **6 hours**.
- **Targeted Keyword Filtering:** Matches against 55 Kannada + 36 English dairy and agricultural keywords (milk prices, cattle care, irrigation, KMF updates, government schemes).
- **Noise Suppression:** 13 exclusion rules filter out horoscopes, entertainment, and non-relevant content.
- **Automated Purge:** Articles older than **7 days** are automatically cleaned up to keep feeds fresh.
- **Direct Publisher Links:** Tapping any card opens the original article on the publisher's website.

---

### 5. 🐄 Sante Cattle Marketplace & Moderation
- **Local Market Hubs:** Listings grouped by local Sante hubs (e.g., Mandya, Tumkur, Hassan, Shivamogga).
- **24-Hour Listing Expiry:** Posts expire after 24 hours. An automated background sweeper daemon cleans up expired listings hourly.
- **Direct Seller Dialing:** One-tap phone dialer button (`tel:` protocol) connects buyers to cattle sellers instantly.
- **Supabase Storage Integration:** Photos are uploaded and served via public bucket `milkmaatu-images`.
- **Community Moderation & Reporting:** Users can flag inappropriate or fraudulent cattle listings (`/api/cattle/report`). Administrators can review, dismiss, or action reports to remove listings.

---

### 6. 🛍️ Buy Feeds Shop & Cart Management
- **Responsive Layout:** 2-column card grid on mobile devices, expanding on tablet and desktop screens.
- **Dynamic Pricing & Flexible Units:** Products support custom unit descriptions (e.g., `50 kg`, `1 bag`, `25 kg`).
- **Interactive Product Details:** Tapping any product opens a slide-up bottom sheet with detailed descriptions and full specs.
- **Floating Cart Bar:** Real-time glassmorphic cart bar showing item counts and total amount.
- **Cash on Delivery Checkout:** Pre-fills saved address details from the user's profile with instant order creation.
- **Order Tracking & Cancellation:** Farmers can track order status (`pending`, `processing`, `dispatched`, `delivered`, `cancelled`) and cancel pending orders.

---

### 7. 🧠 Nandini AI — Smart Dairy Assistant
Powered by **Google Gemini 2.5 Flash**:
- **Bilingual Conversations:** Interacts fluently in Kannada or English depending on the active locale.
- **Dairy Husbandry Domain Focus:** Specializes in cattle nutrition, milk yield optimization, fat/SNF improvement, vaccination schedules, disease prevention, and Karnataka government schemes (KMF, KCC, Pasu Bhagya).
- **Polite Off-Topic Guardrails:** Redirects non-agricultural queries back to dairy farming.

---

### 8. 🛡️ Admin Dashboard & Governance (`/admin`)
Restricted to users with `admin` or `super_admin` roles:

| Section | Capabilities | Data Source |
|---------|-------------|-------------|
| **Overview** | Platform metrics: total users, active feeds, total catalog items, pending orders, total orders, active cattle listings, total revenue | Live PostgreSQL query (`/api/admin/stats`) |
| **Feeds** | Add new feeds, edit price/unit/stock/image, toggle visibility (hide/unhide), delete products | PostgreSQL (`/api/admin/feeds`) |
| **Orders** | Review all customer orders, inspect itemized line snapshots, view contact info, update order status | PostgreSQL (`/api/admin/orders`) |
| **Users** | View user directory (name, email, phone, address, role, registration date), promote/demote roles (Super Admin) | `public.profiles` (`/api/admin/users`) |
| **Cattle** | Audit active and expired Sante listings, moderate content, remove invalid posts | PostgreSQL (`/api/admin/cattle`) |
| **Reports** | Review flagged cattle listing reports submitted by users; dismiss or remove offending posts | PostgreSQL (`/api/admin/reports`) |

---

### 9. 📜 Compliance & Support Pages
MilkMaatu includes full static and compliance documentation accessible to all users:
- **Privacy Policy (`/privacy-policy`):** Details data privacy, Supabase Auth session security, and profile metadata policies.
- **Terms & Conditions (`/terms`):** Terms of service for Sante marketplace listings, feed purchases, and community guidelines.
- **Farmer Support (`/support`):** Help center with contact details and platform usage guides.

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18 + Vite** | Fast SPA framework with hot module reloading |
| **Tailwind CSS** | Custom responsive styling with emerald/amber color system |
| **React Router DOM v6** | Client-side routing with role-based route guards |
| **Capacitor JS** | Native Android container bridge |
| **Lucide React** | Modern SVG icon suite |
| **Custom i18n Context** | Multilingual Kannada/English translation provider |

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | High-performance asynchronous Python web framework |
| **SQLAlchemy 2.0 (Async)** | Async ORM engine for PostgreSQL and SQLite |
| **PostgreSQL / Supabase** | Production database and auth backend |
| **Supabase Storage** | Public object storage bucket `milkmaatu-images` |
| **SQLite + aiosqlite** | Zero-config local development database |
| **Google GenAI SDK** | Gemini 2.5 Flash LLM engine for Nandini AI |
| **feedparser & xml.etree** | RSS parser for Farmers News worker |

---

## 📂 Project Directory Structure

```
milkfront1/
├── frontend/                         # React 18 + Vite Web App
│   ├── src/
│   │   ├── components/               # Header, BottomNav, Card, Button, Input, ToastContainer
│   │   ├── context/                  # AuthContext (Supabase Auth provider)
│   │   ├── i18n/                     # kn.json, en.json, LanguageContext, useTranslation
│   │   ├── lib/                      # Supabase client initializer
│   │   ├── pages/                    # Web pages
│   │   │   ├── HomePage.jsx          # Dashboard (Quick Services, News, Feeds)
│   │   │   ├── BuyFeedsPage.jsx      # Feed catalog & cart bottom sheet
│   │   │   ├── OrderSummaryPage.jsx  # Checkout & order confirmation
│   │   │   ├── OrdersPage.jsx        # Customer order tracking & cancellation
│   │   │   ├── DairyNewsPage.jsx     # Paginated full news section
│   │   │   ├── SanteActionPage.jsx   # Cattle hub selection
│   │   │   ├── SanteBuyPage.jsx      # Sante cattle browsing & filtering
│   │   │   ├── SanteSellPage.jsx     # Post cattle listing with photo upload
│   │   │   ├── NandiniAIPage.jsx     # Gemini 2.5 Flash chat screen
│   │   │   ├── ProfilePage.jsx       # Profile settings & language toggle
│   │   │   ├── AdminDashboard.jsx    # Admin control panel (RBAC protected)
│   │   │   ├── auth/                 # LoginPage, RegisterPage, ForgotPassword
│   │   │   └── compliance/           # PrivacyPolicy, TermsAndConditions, Support
│   │   ├── routes/                   # Route definitions & guards (ProtectedRoute, AdminRoute)
│   │   ├── services/api/             # API clients (auth, feeds, cattle, orders, news)
│   │   └── styles/index.css          # Tailwind CSS & global animations
│   ├── android/                      # Native Android project (Capacitor)
│   └── .env                          # VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│
├── backend/                          # FastAPI Backend Application
│   ├── app/
│   │   ├── main.py                   # App entrypoint, middleware, background workers
│   │   ├── core/                     # config.py, database.py, auth.py (JWKS), dependencies.py
│   │   ├── models/                   # User/Profile, Feed, Order/OrderItem, Cattle, CattleReport, News
│   │   ├── routes/                   # auth, feed, order, cattle, profile, admin, ai, report, news
│   │   ├── schemas/                  # Pydantic validation schemas
│   │   ├── services/                 # Nandini AI, news fetcher, storage_service, Super Admin bootstrap
│   │   └── utils/                    # JSON response formatters
│   ├── requirements.txt              # Python dependencies
│   └── .env                          # Backend database & API keys
│
├── ANDROID_BUILD.md                  # Android release signing & build instructions
└── README.md                         # Project documentation
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
- Interactive Swagger API Docs: `http://localhost:8000/docs`

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

The web app is compiled into a native Android APK / AAB package using **Capacitor**:

```bash
# 1. Build production React app
cd frontend && npm run build

# 2. Sync web build to native Android project
npx cap sync

# 3. Compile signed release APK via Gradle (macOS example)
cd android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
./gradlew assembleRelease
```

Detailed guide for keystore setup, versioning, and Google Play Store AAB generation is available in **[ANDROID_BUILD.md](ANDROID_BUILD.md)**.

---

## 🔑 Environment Variables Reference

### Backend Environment File (`backend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql+asyncpg://postgres:pass@db.xxx.supabase.co:5432/postgres` |
| `SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `INITIAL_SUPER_ADMIN_EMAIL` | Bootstrap Super Admin email | `admin@milkmaatu.com` |
| `INITIAL_SUPER_ADMIN_PASSWORD` | Bootstrap Super Admin password | `SuperSecretPass123` |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSy...` |

### Frontend Environment File (`frontend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | FastAPI Backend API URL | `http://localhost:8000` or `https://milkfront1.onrender.com` |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Client Anon Key | `eyJ...` |

---

## 📋 API Endpoints Reference

All endpoints are prefixed with `/api`.

### 🟢 Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API Health Check |
| `GET` | `/api/feeds` | List active catalog feed products |
| `GET` | `/api/cattle` | Browse active Sante cattle listings |
| `GET` | `/api/cattle/{id}` | Get detailed cattle listing metadata |
| `POST` | `/api/cattle` | Post new cattle listing (optional auth) |
| `POST` | `/api/ai/nandini` | Ask Nandini AI a question (Kannada / English) |
| `GET` | `/api/news/latest` | Fetch 6 most recent agricultural news items |
| `GET` | `/api/news` | Fetch paginated agricultural news articles |

### 🔐 Authenticated User Endpoints (Bearer JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/me` | Fetch authenticated profile details |
| `PUT` | `/api/auth/profile` | Update profile details (Name, Phone, Address) |
| `POST` | `/api/auth/sync-profile` | Sync Supabase Auth metadata to `public.profiles` |
| `POST` | `/api/orders` | Create feed order linked to user profile |
| `GET` | `/api/orders/my-orders` | Fetch user order history |
| `PUT` | `/api/orders/{id}/cancel` | Cancel pending order |
| `DELETE` | `/api/cattle/{id}` | Delete own cattle listing |
| `POST` | `/api/cattle/report` | Submit moderation report against a cattle post |

### 🛡️ Admin Endpoints (Admin / Super Admin JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Fetch real-time dashboard business analytics |
| `GET` | `/api/admin/users` | List all user profiles |
| `PUT` | `/api/admin/users/{id}/role` | Promote/demote user role (**Super Admin only**) |
| `GET` | `/api/admin/feeds` | View all catalog feeds (including hidden items) |
| `POST` | `/api/feeds/admin` | Create new feed product |
| `PATCH` | `/api/feeds/admin/{id}` | Update feed product or toggle visibility |
| `DELETE` | `/api/feeds/admin/{id}` | Delete feed product |
| `GET` | `/api/admin/orders` | Audit all system orders with line items |
| `PUT` | `/api/admin/orders/{id}/status` | Update order dispatch status |
| `GET` | `/api/admin/cattle` | Audit all Sante cattle listings |
| `DELETE` | `/api/admin/cattle/{id}` | Moderate/delete cattle listing |
| `GET` | `/api/admin/reports` | View all user-submitted content reports |
| `POST` | `/api/admin/reports/{id}/dismiss` | Dismiss reported item |
| `POST` | `/api/admin/reports/{id}/action` | Action report by deleting offending cattle post |

---

## 🗺️ Background Daemons

The FastAPI application runs two automated async background daemons initialized on server startup ([`main.py`](backend/app/main.py)):

| Daemon | Interval | Operation |
|--------|----------|-----------|
| **Sante Sweeper Daemon** | Every 1 hour | Scans cattle database table and purges listings past their `expires_at` timestamp. |
| **News Refresh Worker** | Every 6 hours | Ingests RSS feeds, applies agricultural keyword filters, saves metadata, and deletes items older than 7 days. |

---

*Built with ❤️ for Karnataka's dairy farmers.*
