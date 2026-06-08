# 🥛 MilkMaatu — Premium Dairy Farming Platform

MilkMaatu is a **mobile-first, multilingual** full-stack web application built specifically for dairy farmers in Karnataka. It connects farmers to feed suppliers, provides a local cattle marketplace (Sante), offers an AI-powered dairy assistant (Nandini AI), and gives administrators full control over the platform — all in **Kannada and English**.

Deployed live at: **[https://milkfront1.onrender.com](https://milkfront1.onrender.com)**

---

## ✨ Features

### 1. 📱 Mobile-First Bottom Navigation
A fixed bottom navigation bar provides seamless single-thumb navigation across the four core sections of the app:

| Tab | Icon | Route |
|-----|------|-------|
| Home | 🏠 | `/home` |
| Sante | 🏪 | `/sante` |
| Buy Feeds | 🛍️ | `/feeds` |
| My Orders | 📦 | `/orders` |

The header remains minimal (profile button only), and the bottom bar is always visible on authenticated user pages. Desktop mode floats the nav bar centered in the viewport.

---

### 2. 🌐 Dynamic Kannada / English Translation
- **Kannada is the default language** for all new users.
- Users can switch between ಕನ್ನಡ and English from their Profile settings — no page reload needed.
- Language preference is persisted in `localStorage` and synced to the backend user profile.

---

### 3. 🔐 WhatsApp OTP Registration Flow
A secure, step-by-step onboarding built for farmers:

1. **Step 1** — Enter name and 10-digit mobile number.
2. **Step 2** — Verify a mock OTP (default: **`1234`**) simulating a WhatsApp gateway.
3. **Step 3** — Set a password and add optional delivery address details.
4. **Step 4** — Account confirmed and auto-redirected to login.

---

### 4. 🐄 Sante Cattle Marketplace
A trusted, expiry-driven local marketplace for buying and selling cattle:

- Listings are **scoped within a 20 KM hub** (e.g. KRS Sante, Thendekere Sante).
- **Auto-expiry:** Every listing is automatically purged after **24 hours** by a background worker running on the server.
- **Live camera only:** Image uploads are restricted to `capture="environment"` (no gallery access), ensuring all photos are authentic and live.
- **Contact integration:** Tap to call or copy the seller's verified phone number.
- Farmers can choose to **Buy** or **Sell** from a clean action selector screen.

---

### 5. 🛒 Buy Feeds Shop
A modern shopping experience for cattle feed:

- Products are loaded dynamically from the backend API, priced **per bag (ಚೀಲ)**.
- Native-style `+` / `−` quantity selectors with large tap targets for mobile use.
- **Floating glassmorphic cart panel** — sticky, bottom-aligned, showing item count and grand total in real-time.
- Tapping checkout opens the **Order Summary** page where delivery address is pre-filled from the user's saved profile.
- Confirmed orders are tracked under **My Orders**.

---

### 6. 📦 My Orders
A dedicated order history page accessible from the bottom navigation:

- Displays all past orders with product names, quantities, totals, and live status badges.
- Status badges: `Pending`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`.
- Fetched live from the backend on every visit.

---

### 7. 🧠 Nandini AI — Dairy Farming Assistant
An intelligent conversational assistant powered by **Google Gemini 2.5 Flash**:

- Responds in **Kannada** (default) or **English** based on the user's current language preference.
- Focused strictly on dairy farming topics: milk yield, cattle health, fodder, vaccination, Karnataka government schemes, AI/breeding, and more.
- Smart guardrails politely decline unrelated questions.
- Conversation suggestions help first-time users get started instantly.
- Accessible via the Home page quick-action card at `/nandini-ai`.

> **Note for production:** The `GEMINI_API_KEY` environment variable must be set in the Render Dashboard for Nandini AI to function on the live server.

---

### 8. 👤 Profile Management
A clean, centered profile card showing:

- Name, mobile number, language preference, and role.
- Upload or change profile photo (via Cloudinary).
- Edit delivery address for pre-filled checkout.
- Language toggle (Kannada ↔ English).
- Logout.

---

### 9. 🛡️ Admin Dashboard (`/admin`)
A full-featured admin portal for dairy network operators (role: `admin`):

| Tab | Description |
|-----|-------------|
| **Overview** | Live stats: total revenue, active feeds, pending orders, cattle listings |
| **Feeds** | Add, edit, and delete cattle feed products in real time |
| **Orders** | View order details, customer info, and update order status |
| **Users** | Browse all registered farmer accounts and roles |
| **Cattle** | View and moderate active Sante listings (delete overrides) |

---

### 10. 📋 Milk Production Reports
- Farmers can log daily milk production records.
- Reports are stored per user and retrievable via the backend API.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling (yellow, emerald, white palette) |
| Lucide React | Icon library |
| React Router v6 | Client-side routing |
| i18n (custom) | Kannada / English translation system |

### Backend
| Technology | Purpose |
|-----------|---------|
| FastAPI | Python async REST API framework |
| SQLAlchemy 2.0 (async) | ORM for database access |
| PostgreSQL (Supabase) | Primary production database |
| SQLite + aiosqlite | Local dev fallback database |
| Pydantic v2 | Request/response validation |
| PyJWT + Passlib | JWT authentication and password hashing |
| Cloudinary | Profile photo upload and storage |
| Google GenAI SDK | Nandini AI (Gemini 2.5 Flash) |
| python-dotenv | Environment variable management |

---

## 📂 Project Structure

```
milkfront1/
├── frontend/                    # React 18 + Vite frontend
│   ├── src/
│   │   ├── App.jsx              # Root layout with bottom nav logic
│   │   ├── components/
│   │   │   ├── BottomNavigation.jsx  # Fixed 4-tab bottom nav bar
│   │   │   ├── Header.jsx            # Minimal header (profile button only)
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Logo.jsx
│   │   │   └── ToastContainer.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Dashboard with quick-action cards
│   │   │   ├── BuyFeedsPage.jsx      # Feed shop with cart
│   │   │   ├── OrderSummaryPage.jsx  # Checkout and order confirmation
│   │   │   ├── OrdersPage.jsx        # My Orders history
│   │   │   ├── SanteSelectorPage.jsx # Buy or Sell selector
│   │   │   ├── SanteActionPage.jsx   # Sante hub chooser
│   │   │   ├── SanteBuyPage.jsx      # Browse cattle listings
│   │   │   ├── SanteSellPage.jsx     # Post a cattle listing
│   │   │   ├── NandiniAIPage.jsx     # Nandini AI chat interface
│   │   │   ├── ProfilePage.jsx       # User profile and settings
│   │   │   ├── AdminDashboard.jsx    # Full admin portal
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── compliance/           # Privacy Policy, Terms, Support
│   │   ├── routes/
│   │   │   └── index.jsx             # Route config with ProtectedRoute + AdminRoute guards
│   │   ├── services/
│   │   │   ├── api/
│   │   │   │   ├── apiClient.js      # Central JWT-aware fetch wrapper
│   │   │   │   ├── aiApi.js          # Nandini AI endpoint
│   │   │   │   ├── authApi.js        # Login, register, OTP
│   │   │   │   ├── cattleApi.js      # Sante listings CRUD
│   │   │   │   ├── feedsApi.js       # Feed products
│   │   │   │   ├── orderApi.js       # Orders CRUD
│   │   │   │   ├── reportApi.js      # Milk reports
│   │   │   │   └── adminApi.js       # Admin-only endpoints
│   │   │   ├── authService.js
│   │   │   ├── branding.js
│   │   │   ├── dataService.js
│   │   │   └── toastService.js
│   │   └── i18n/
│   │       ├── en.json               # English translations
│   │       └── kn.json               # Kannada translations
│   └── .env                         # VITE_API_URL (points to Render backend)
│
└── backend/                     # FastAPI Python backend
    ├── app/
    │   ├── main.py              # FastAPI app, CORS, router registration, lifespan
    │   ├── core/
    │   │   ├── config.py        # Pydantic Settings (reads .env)
    │   │   ├── database.py      # SQLAlchemy async engine setup
    │   │   ├── dependencies.py  # JWT auth dependency (get_current_user)
    │   │   └── security.py      # Password hashing and JWT token creation
    │   ├── models/              # SQLAlchemy ORM models
    │   │   ├── user.py
    │   │   ├── feed.py
    │   │   ├── order.py
    │   │   ├── cattle.py
    │   │   └── cattle_report.py
    │   ├── routes/              # FastAPI routers (all mounted under /api)
    │   │   ├── auth_routes.py
    │   │   ├── feed_routes.py
    │   │   ├── order_routes.py
    │   │   ├── cattle_routes.py
    │   │   ├── profile_routes.py
    │   │   ├── admin_routes.py
    │   │   ├── ai_routes.py     # POST /api/ai/nandini
    │   │   └── report_routes.py
    │   ├── schemas/             # Pydantic request/response schemas
    │   ├── services/
    │   │   └── ai/
    │   │       └── nandini_ai.py  # Gemini 2.5 Flash integration
    │   └── utils/
    ├── requirements.txt
    ├── seed.py                  # Seed script for dev feed catalog
    └── .env                     # Backend secrets (not committed to git)
```

---

## 🚀 Running Locally

### Prerequisites
- Python 3.12+
- Node.js 18+
- A PostgreSQL database (or use the SQLite fallback for local dev)

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create backend/.env with the following variables:
# DATABASE_URL=sqlite+aiosqlite:///./milkmaatu.db   ← for local dev (SQLite)
# JWT_SECRET=your_secret_key_here
# JWT_ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=1440
# GEMINI_API_KEY=your_google_gemini_api_key
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_cloudinary_key
# CLOUDINARY_API_SECRET=your_cloudinary_secret
# MOCK_OTP=1234

# (Optional) Seed the database with test feed data
python seed.py

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The backend will be available at **http://localhost:8000**.  
Interactive API docs: **http://localhost:8000/docs**

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create frontend/.env
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Start the Vite dev server
npm run dev

# To expose on your local network (for testing on a phone)
npm run dev -- --host
```

Open **http://localhost:5173** (or the network URL shown in the terminal).

---

## ☁️ Production Deployment (Render)

The backend is deployed on **Render** as a Web Service.

Required environment variables on the Render Dashboard:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `JWT_SECRET` | Secure random string for JWT signing |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24 hours) |
| `GEMINI_API_KEY` | Google GenAI API key — **required for Nandini AI** |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `MOCK_OTP` | OTP for testing (`1234`) |

The frontend `.env` should point to the production backend:
```
VITE_API_URL=https://milkfront1.onrender.com/api
```

---

## 🔑 API Routes Summary

All routes are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | — | Health check |
| `POST` | `/api/auth/register` | — | Register a new user |
| `POST` | `/api/auth/login` | — | Login and get JWT token |
| `POST` | `/api/auth/verify-otp` | — | Verify OTP during registration |
| `GET` | `/api/feeds` | ✅ | List all feed products |
| `POST` | `/api/orders` | ✅ | Place a new order |
| `GET` | `/api/orders/my` | ✅ | Get current user's orders |
| `GET` | `/api/cattle` | ✅ | List active Sante cattle listings |
| `POST` | `/api/cattle` | ✅ | Post a new cattle listing |
| `DELETE` | `/api/cattle/{id}` | ✅ Admin | Delete a listing |
| `GET` | `/api/profile` | ✅ | Get user profile |
| `PUT` | `/api/profile` | ✅ | Update user profile |
| `POST` | `/api/ai/nandini` | ✅ | Ask Nandini AI a dairy question |
| `GET` | `/api/admin/stats` | ✅ Admin | Dashboard overview stats |
| `GET` | `/api/reports` | ✅ | Get milk production reports |

---

## 👤 Credits

Built and designed with premium mobile aesthetics by **Susheel**.
