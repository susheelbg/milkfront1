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
| **Home** | `/home` | Dashboard — Quick Services, Farmers News Ticker, Recommended Feeds |
| **Sante** | `/sante` | Local cattle marketplace (Buy & Sell) |
| **Buy Feeds** | `/feeds` | Cattle feed catalog with 2-column grid, 2-image carousel & instant purchase |
| **My Orders** | `/orders` | Real-time order tracking and cancellation |
| **Profile** | `/profile` | Farmer profile management, language toggle, account settings |

### 2. 🌐 Multilingual Engine — Kannada & English
- **Kannada by default** — high accessibility for Karnataka dairy farmers.
- **Instant Language Toggle** — from Profile page, no page reload required.
- **Full UI Localization** — every button, dialog, toast, cart drawer, error, and AI prompt localizes dynamically.
- **Locale Persistence** — stored in `localStorage` (`appLanguage`).
- Translation files: `frontend/src/i18n/kn.json` and `frontend/src/i18n/en.json`.

### 3. 🏠 Home Dashboard
- **🌾 Recommended Feeds Ticker:** Horizontally scrollable product carousel. Tapping a product auto-opens its detail modal directly on `/feeds`.
- **⚡ Quick Services Grid:** 
  - **Buy Feeds** (`🌾`) — Navigate to feed catalog.
  - **Sante** (Vector Line-Art `CowIcon`) — Local cattle marketplace.
  - **Milk Record** (`📄`) — Pending feature with helpful prompt.
  - **Nandini AI** (`Brain` 🧠) — AI advisory assistant.
- **📰 Farmers News (ರೈತರ ಸುದ್ದಿ):** Horizontally scrolling regional agricultural news.

### 4. 🛒 Header Cart Button & Interactive Cart Drawer (`CartPanel.jsx`)
- **Header Placement:** Shopping Cart icon (`<ShoppingCart>`) located directly to the **left of the Notification Bell (`<Bell>`)**.
- **Real-Time Badge:** Badge counter showing the total item quantity currently in cart.
- **Interactive Slide-Over Cart Drawer:**
  - Lists all added items with product image thumbnail, name, unit price, and item subtotal.
  - Interactive quantity controls (`+` increase, `-` decrease, `Trash` remove item).
  - Clear Cart action.
  - Total amount calculation.
  - **"Proceed to Checkout" / "ಖರೀದಿಗೆ ಮುಂದುವರಿಯಿರಿ"** button navigating directly to 1-tap order summary (`/order-summary`).
- **Bilingual Cart Experience:** All cart drawer titles, empty states, item count labels, and buttons dynamically follow the selected language (**Kannada** or **English**).

### 5. 📰 Farmers News Auto-Aggregator
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

### 6. 🐄 Sante Cattle Marketplace
- Local market hubs (Mandya, Tumkur, Hassan, Shivamogga, etc.).
- **24-hour listing expiry** — sweeper daemon purges hourly.
- One-tap phone dialer for direct buyer-seller contact.
- Photo upload via Supabase Storage (`milkmaatu-image` bucket).
- Community reporting & admin moderation of flagged listings.
- Rendered with a clean, custom line-art vector `CowIcon`.

### 7. 🛍️ Buy Feeds Shop, 2-Image Carousel & Dual Purchase Flow
- **Up to 2 Images per Feed:** Admin can upload up to 2 product photos (`image_url` & `image_url_2`) to Supabase Storage.
- **Swipeable Image Carousel:** Interactive mobile carousel with touch swipe gestures, left/right chevrons, and dot indicators when multiple images exist.
- **Responsive Overflow-Free Description:** Dedicated description container with `break-words` and `whitespace-pre-line` formatting to ensure text wraps cleanly without horizontal overflow on small mobile screens.
- **Dual Purchase Actions (`+ Add to Cart` & `⚡ Buy Now`):**
  - **`+ Add to Cart`** adds product to cart and updates cart drawer.
  - **`⚡ Buy Now — ₹[price]`** performs instant 1-tap checkout via `/order-summary`.
  - Buttons located **both directly above the product description** and in the sticky mobile bottom bar.
- **Other Products Grid:** Scrolling down inside the product detail view presents an "Other Products You Might Like" grid to switch products seamlessly.

### 8. 🧠 Nandini AI — Smart Dairy Assistant
- Powered by **Google Gemini 2.5 Flash**.
- Bilingual (Kannada / English) conversations.
- Domain-focused: cattle nutrition, milk yield, fat/SNF, vaccination, KMF/KCC schemes.
- Polite off-topic guardrails redirect to dairy farming.

### 9. 🔔 FCM Push Notifications
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

**Stage 2 (Live):** Firebase Admin SDK initialized on backend. `send_push_notifications()` sends FCM multicast messages for new cattle/feed events. Invalid tokens (`NOT_FOUND` / `UNREGISTERED`) are automatically deactivated on failed delivery.

### 10. 🛡️ Admin Dashboard (`/admin`)
| Section | Capabilities |
|---------|-------------|
| **Overview** | Platform metrics: users, orders, revenue, listings |
| **Feeds** | Add / edit feed products (up to 2 image uploads) / toggle visibility / delete |
| **Orders** | Audit all orders, update status |
| **Users** | View directory, promote/demote roles (Super Admin) |
| **Cattle** | Audit & moderate Sante listings |
| **Reports** | Review flagged content; dismiss or remove offending posts |

### 11. 📜 Compliance & Support Pages
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
| **Lucide React** | Modern SVG icon suite (`ShoppingCart`, `Bell`, `Brain`, `Shield`, etc.) |
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

## 📂 Project Directory Structure

```
milkfront1/
├── frontend/                         # React 18 + Vite Web App
│   ├── src/
│   │   ├── main.jsx                  # Entrypoint — LanguageProvider + AuthProvider
│   │   ├── App.jsx                   # Route canvas + bottom navigation
│   │   ├── assets/                   # Static graphics & logo
│   │   ├── components/               # Header, CartPanel, NotificationPanel, BottomNav, Card, Button, Toast
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Supabase Auth state, FCM init on login
│   │   ├── i18n/                     # kn.json, en.json, LanguageContext, useTranslation
│   │   ├── lib/                      # Supabase client initializer
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Dashboard (Quick Services with vector CowIcon & Brain icon)
│   │   │   ├── BuyFeedsPage.jsx      # Feed catalog, 2-image carousel & instant purchase
│   │   │   ├── OrderSummaryPage.jsx  # Checkout
│   │   │   ├── OrdersPage.jsx        # Order tracking
│   │   │   ├── DairyNewsPage.jsx     # Farmers news
│   │   │   ├── SanteActionPage.jsx   # Cattle hub selector
│   │   │   ├── SanteBuyPage.jsx      # Browse & filter listings
│   │   │   ├── SanteSellPage.jsx     # Post cattle listing
│   │   │   ├── NandiniAIPage.jsx     # Gemini chat
│   │   │   ├── ProfilePage.jsx       # Profile & language toggle
│   │   │   ├── AdminDashboard.jsx    # Admin control panel (RBAC & 2-image feed management)
│   │   │   ├── LoginPage.jsx         # Login
│   │   │   ├── RegisterPage.jsx      # Registration
│   │   │   └── compliance/           # PrivacyPolicy, Terms, Support
│   │   ├── routes/                   # ProtectedRoute, PublicOnlyRoute, AdminRoute
│   │   ├── services/
│   │   │   ├── api/                  # apiClient, authApi, adminApi, feedsApi, cattleApi, orderApi, newsApi, deviceApi
│   │   │   ├── fcmService.js         # Firebase FCM token lifecycle management
│   │   │   ├── branding.js           # Single source of truth for logo URL & brand assets
│   │   │   └── toastService.js       # Toast notification signals
│   │   └── styles/
│   │       └── index.css             # Tailwind directives, animations, scrollbars
│   ├── public/
│   │   └── milkmaatu-logo.png        # Local logo asset
│   ├── android/                      # Native Android project (Capacitor)
│   ├── capacitor.config.ts
│   ├── package.json
│   └── vite.config.js
│
├── backend/                          # FastAPI Backend Application
│   ├── app/
│   │   ├── main.py                   # App entrypoint, middleware, background workers
│   │   ├── core/                     # config.py, database.py, auth.py, dependencies.py
│   │   ├── models/                   # user.py, feed.py (image_url_2), order.py, cattle.py, news.py, user_device.py
│   │   ├── routes/                   # auth, feed, order, cattle, profile, admin, ai, news, report, notification, device
│   │   ├── schemas/                  # user.py, feed.py (image2 support), order.py, cattle.py, device.py
│   │   ├── services/                 # storage_service, device_service, push_notification_service, notification_service, nandini_ai
│   │   └── utils/
│   ├── migrations/
│   │   └── 003_user_devices_table.sql
│   ├── requirements.txt
│   └── .env
│
├── ANDROID_BUILD.md                  # Android build guide
└── README.md                         # Complete project documentation
```

---

## 🚀 Local Development Setup

### 1. Backend Setup (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Root: `http://localhost:8000`
- Swagger API Docs: `http://localhost:8000/docs`

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Local Web Portal: `http://localhost:5173`

---

## 🤖 Android Native Build

```bash
cd frontend && npm run build
npx cap sync android
cd android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
./gradlew assembleRelease
```
Output APK: `frontend/android/app/build/outputs/apk/release/app-release.apk`

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
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin service account JSON |

### Frontend (`frontend/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | FastAPI Backend URL (`https://milkfront1.onrender.com`) |
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Client Anon Key |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |

---

## 📋 API Endpoints Reference

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

### 🔐 Authenticated User Endpoints (Bearer JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/me` | Fetch authenticated profile |
| `PUT` | `/api/auth/profile` | Update profile (Name, Phone, Address) |
| `POST` | `/api/orders` | Create feed order |
| `GET` | `/api/orders/my-orders` | Fetch order history |
| `PUT` | `/api/orders/{id}/cancel` | Cancel pending order |
| `POST` | `/api/devices/register` | Register/refresh FCM device token |

---

## 🗺️ Background Daemons

| Daemon | Interval | Operation |
|--------|----------|-----------|
| **Sante Sweeper** | Every 1 hour | Purges expired cattle listings (`expires_at` past) |
| **News Refresh Worker** | Every 6 hours | Ingests RSS, filters keywords, purges items >7 days old |
| **Notification Cleanup Worker** | Every 30 minutes | Purges read notifications >12 hours & unread >7 days |

---

*Built with ❤️ for Karnataka's dairy farmers.*
