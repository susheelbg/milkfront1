# 🥛 MilkMaatu - Robust FastAPI Backend Services

This is the complete, modular, and production-ready Python FastAPI backend for the **MilkMaatu** cattle farmer application. It integrates asynchronously with **PostgreSQL (Supabase)**, supports Cloudinary CDN media uploads, manages an automated background worker purging Sante cattle postings older than 24 hours, and runs an RSS news aggregation daemon for dairy farmers.

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
* **Media Uploads:** Cloudinary SDK
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
│   │   ├── cloudinary_service.py # Cloudinary base64 media uploads
│   │   ├── ai/
│   │   │   └── nandini_ai.py  # Google GenAI model config and dairy farming filters
│   │   └── news/              # RSS news aggregation & keyword filtering daemons
│   └── utils/
│       └── response.py        # Standardized JSON response envelope formatting
├── requirements.txt           # Explicit dependencies specification
├── .env.example               # Template environment configuration file
└── README.md                  # Developer workflow guide (this file)
```

---

## 🚀 Local Developer Setup

### 1. Initialize Python Virtual Environment
Navigate to the `backend/` folder and create a clean Python virtual environment:

```bash
cd backend
python3 -m venv venv
```

Activate the environment:
* **macOS / Linux:** `source venv/bin/activate`
* **Windows:** `venv\Scripts\activate`

### 2. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Setup Local Environmental Variables
Copy the environmental template sheet to create a local `.env`:
```bash
cp .env.example .env
```
*By default, the `.env` settings fall back to using a local async SQLite database (`sqlite+aiosqlite:///./milkmaatu.db`). This allows you to run and test the backend **instantly** without configuring a live Supabase connection first!*

---

## 🛢️ Connecting Supabase PostgreSQL
To connect the backend to your live production Supabase database:
1. Copy your **Transactional Connection string** from the Supabase Dashboard under Settings > Database.
2. Ensure you append `+asyncpg` to the driver prefix:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:[your-password]@db.[your-supabase-id].supabase.co:5432/postgres
   ```
3. Update the `DATABASE_URL` field in your active `backend/.env` file. The server will automatically switch from local SQLite to high-performance connection pooling.

---

## 📸 Configuring Cloudinary Image Uploads
For Sante direct mobile-camera photo submissions:
1. Create a free account at [Cloudinary](https://cloudinary.com).
2. Retrieve your **Cloud Name**, **API Key**, and **API Secret** from the console panel.
3. Update the following fields in `backend/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
*If these parameters are left blank, the `cloudinary_service` operates in robust mock mode, automatically returning a default cow photo to prevent API failures during local testing.*

---

## 🧠 Configuring Nandini AI
Nandini AI is a smart dairy farming assistant powered by the Google GenAI `gemini-2.5-flash` model.
To configure it:
1. Obtain a Gemini API Key from Google AI Studio.
2. Update your `backend/.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```
* Nandini AI acts as a dedicated dairy assistant for Karnataka farmers (Kannada & English).

---

## 🛡️ Admin Security & Role-Based Access Control (RBAC)
Administrative endpoints (`/api/admin/*`, `/api/feeds/admin`, etc.) are secured via **Supabase Auth Bearer Tokens** and **JWKS Key Verification**:
- **Role Verification**: FastAPI dependencies (`get_current_admin` / `get_current_super_admin`) validate Supabase JWT tokens and verify `public.profiles` for `admin` or `super_admin` roles.
- **Single Security Boundary**: FastAPI enforces authorization at the server boundary. Client-side roles are never trusted.
- **Super Admin Protection**: Last remaining Super Admin cannot be demoted or removed.

---

## 🏁 Starting the FastAPI Server
To launch the API server locally:

```bash
uvicorn app.main:app --reload --port 8000
```

* **Interactive Swagger Documentation:** Open **[http://localhost:8000/docs](http://localhost:8000/docs)** to test the API endpoints directly from your browser!
* **Status Endpoint:** Open **[http://localhost:8000/](http://localhost:8000/)** to verify the server is live and running.
