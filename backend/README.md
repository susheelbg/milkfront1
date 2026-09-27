# 🥛 MilkMaatu - Robust FastAPI Backend Services

This is the complete, modular, and production-ready Python FastAPI backend for the **MilkMaatu** cattle farmer application. It integrates asynchronously with **PostgreSQL (Supabase)**, supports Supabase Storage media uploads (`milkmaatu-images`), manages an automated background worker purging Sante cattle postings older than 24 hours, and runs an RSS news aggregation daemon for dairy farmers.

**Authentication & Security Architecture:**
MilkMaatu utilizes **Supabase Authentication** with persistent sessions and role-based access control (RBAC):
- **Normal Users:** Register or log in once to establish a persistent Supabase session. User orders and profile modifications link directly to their authenticated `public.profiles.id`.
- **Admins:** Authenticate through the standard Supabase Auth system and access the Admin Dashboard to manage feeds, audit orders, and moderate Sante listings based on `public.profiles.role = 'admin'`.
- **Super Admins:** Possess top-level administrative authority including role management (promoting/demoting users) guarded by last-super-admin safeguards.

FastAPI cryptographically verifies Supabase JWT access tokens via public JWKS key sets (ES256).

---

## 🛠️ Tech Stack & Dependencies
* **Framework:** FastAPI (Python 3.12+)
* **Server:** Uvicorn
* **Database ORM:** SQLAlchemy 2.0 (Asyncio support)
* **Database Drivers:** `asyncpg` (PostgreSQL / Supabase), `aiosqlite` (Local fallback SQLite)
* **Auth & Security:** Supabase Auth + PyJWT with JWKS verification + RBAC
* **Media Uploads:** Supabase Storage REST API (`milkmaatu-images` bucket)
* **AI Integration:** Google GenAI SDK (`gemini-2.5-flash`)
* **News Aggregation:** `feedparser` / `xml.etree`

---

## 📂 Backend Architecture

```
backend/
├── app/
│   ├── main.py                # Server boot initializer & background worker daemons
│   ├── core/
│   │   ├── config.py          # Config Pydantic-settings (DATABASE_URL, SUPABASE_*, etc.)
│   │   ├── database.py        # SQLAlchemy engine pools & async session managers
│   │   ├── auth.py            # Supabase JWKS cryptographic verification
│   │   └── dependencies.py    # RBAC dependencies (get_current_user, get_current_admin)
│   ├── models/
│   │   ├── user.py            # Profile & user DB table mapping
│   │   ├── feed.py            # Feeds product DB table mapping with unit
│   │   ├── order.py           # Orders & line-items DB table mapping with snapshot product_name
│   │   ├── cattle.py          # Sante ads & expiry DB table mapping
│   │   └── news.py            # Dairy news articles DB table mapping
│   ├── schemas/
│   │   ├── user.py            # User & admin schemas
│   │   ├── feed.py            # Feed product schemas
│   │   ├── order.py           # Order create & response schemas
│   │   └── cattle.py          # Sante marketplace schemas
│   ├── routes/
│   │   ├── feed_routes.py     # Public feed catalog + Admin product management
│   │   ├── order_routes.py    # Authenticated order placement + Admin order audits
│   │   ├── cattle_routes.py   # Public Sante marketplace (Buy, Sell, Delete)
│   │   ├── profile_routes.py  # Profile retrieval & address updates
│   │   ├── admin_routes.py    # Administrative dashboard, stats, users, feeds, cattle & orders
│   │   ├── ai_routes.py       # Public Nandini AI chat assistant endpoint
│   │   ├── news_routes.py     # Public Farmers News API
│   │   └── report_routes.py   # Public Sante cattle listing reporting
│   ├── services/
│   │   ├── storage_service.py # Supabase Storage base64 media uploads
│   │   ├── ai/
│   │   │   └── nandini_ai.py  # Google GenAI model config and dairy farming filters
│   │   └── news/              # RSS news aggregation & keyword filtering daemons
│   └── utils/
│       └── response.py        # Standardized JSON response envelope formatting
├── requirements.txt           # Explicit dependencies specification
└── .env                       # Environment secrets (DATABASE_URL, SUPABASE_URL, etc.)
```

---

## ⚡ Quick Start & Setup

### 1. Install Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment
Create a `.env` file in the `backend/` root directory:
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@host:6543/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
INITIAL_SUPER_ADMIN_EMAIL=admin@milkmaatu.com
INITIAL_SUPER_ADMIN_PASSWORD=secure-password
GEMINI_API_KEY=your-gemini-key
```

### 3. Run Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
- API Docs (Swagger): `http://localhost:8000/docs`

---

## 📸 Supabase Storage Integration
Image uploads (Cattle photos, Feed product catalog images, Profile pictures) are stored in the public Supabase Storage bucket **`milkmaatu-images`**:
- `cattle/{user_id}/{unique_filename}`
- `feeds/{unique_filename}`
- `profiles/{user_id}/{unique_filename}`
- `other/{unique_filename}`

---

## 🧠 Configuring Nandini AI
Nandini AI is a smart dairy farming assistant powered by the Google GenAI `gemini-2.5-flash` model.
To configure it:
1. Obtain a Gemini API Key from Google AI Studio.
2. Update your `backend/.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```

---

## 🛡️ Admin Security & Role-Based Access Control (RBAC)
Administrative endpoints (`/api/admin/*`, `/api/feeds/admin`, etc.) are secured via **Supabase Auth Bearer Tokens** and **JWKS Key Verification**:
- **Role Verification**: FastAPI dependencies (`get_current_admin` / `get_current_super_admin`) validate Supabase JWT tokens and verify `public.profiles` for `admin` or `super_admin` roles.
- **Idempotent Super Admin Bootstrap**: Automatically verifies or creates the Super Admin account on server startup.
