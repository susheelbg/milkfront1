# 🥛 MilkMaatu - Robust FastAPI Backend Services

This is the complete, modular, and production-ready Python FastAPI backend for the **MilkMaatu** cattle farmer application. It integrates asynchronously with **PostgreSQL (Supabase)**, supports Cloudinary CDN media uploads, manages an automated background worker purging Sante cattle postings older than 24 hours, and runs an RSS news aggregation daemon for dairy farmers.

**Frictionless Farmer Architecture:** Farmer endpoints (Feeds, Sante Marketplace, Nandini AI, Dairy News, Orders) are open and require no farmer authentication or passwords. Administrative endpoints are secured via an **Admin Access PIN** (`ACCESS_PIN=4512`).

---

## 🛠️ Tech Stack & Dependencies
* **Framework:** FastAPI (Python 3.12+)
* **Server:** Uvicorn
* **Database ORM:** SQLAlchemy 2.0 (Asyncio support)
* **Database Drivers:** `asyncpg` (PostgreSQL / Supabase), `aiosqlite` (Local fallback SQLite)
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
│   │   ├── config.py          # Config Pydantic-settings (ACCESS_PIN, DATABASE_URL, etc.)
│   │   ├── database.py        # SQLAlchemy engine pools & async session managers
│   │   └── dependencies.py    # Admin PIN verification & optional guest user helpers
│   ├── models/
│   │   ├── user.py            # Farmer & admin DB table mapping
│   │   ├── feed.py            # Feeds product DB table mapping
│   │   ├── order.py           # Orders & line-items DB table mapping
│   │   ├── cattle.py          # Sante ads & expiry DB table mapping
│   │   └── news.py            # Dairy news articles DB table mapping
│   ├── schemas/
│   │   ├── user.py            # User & admin schemas
│   │   ├── feed.py            # Feed product schemas
│   │   ├── order.py           # Order create & response schemas
│   │   └── cattle.py          # Sante marketplace schemas
│   ├── routes/
│   │   ├── feed_routes.py     # Public feed catalog + Admin product management
│   │   ├── order_routes.py    # Public order placement + Admin order audits
│   │   ├── cattle_routes.py   # Public Sante marketplace (Buy, Sell, Delete)
│   │   ├── profile_routes.py  # Profile retrieval & address updates
│   │   ├── admin_routes.py    # Administrative dashboard counters & moderation
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
* Fully accessible to all farmers without requiring authentication.

---

## 🛡️ Admin Security (ACCESS_PIN)
Administrative endpoints (`/admin/*`, `/api/feeds/admin`) are secured via the `X-Admin-PIN` header:
- Default PIN: `4512` (configurable in `backend/.env` via `ACCESS_PIN`).
- When an admin unlocks the Admin Portal on the frontend, the client passes this header to authorize administrative operations.

---

## 🏁 Starting the FastAPI Server
To launch the API server locally:

```bash
uvicorn app.main:app --reload --port 8000
```

* **Interactive Swagger Documentation:** Open **[http://localhost:8000/docs](http://localhost:8000/docs)** to test the API endpoints directly from your browser!
* **Status Endpoint:** Open **[http://localhost:8000/](http://localhost:8000/)** to verify the server is live and running.
