# 🥛 MilkMaatu - Robust FastAPI Backend Services

This is the complete, modular, and production-ready Python FastAPI backend for the **MilkMaatu** cattle farmer application. It integrates asynchronously with **PostgreSQL (Supabase)**, handles password hashing (Bcrypt), manages secure JWT authorizations, supports Cloudinary CDN media uploads, and features an automated background worker purging Sante cattle postings older than 24 hours.

---

## 🛠️ Tech Stack & Dependencies
* **Framework:** FastAPI (Python 3.12+)
* **Server:** Uvicorn
* **Database ORM:** SQLAlchemy (Asyncio support)
* **Database Drivers:** `asyncpg` (PostgreSQL / Supabase), `aiosqlite` (Local fallback SQLite)
* **Authorizations:** PyJWT
* **Security:** Passlib (Bcrypt hashing)
* **Media Uploads:** Cloudinary SDK
* **AI Integration:** Google GenAI SDK (`gemini-2.5-flash`)

---

## 📂 Backend Architecture

```
backend/
├── app/
│   ├── main.py                # Server boot initializer & Sante purging daemon task
│   ├── core/
│   │   ├── config.py          # Config Pydantic-settings environment parser
│   │   ├── security.py        # Passwords hashing & JWT encoders/decoders
│   │   ├── database.py        # SQLAlchemy engine pools & async session managers
│   │   └── dependencies.py    # Route-guard JWT injectors & admin checks
│   ├── models/
│   │   ├── user.py            # User profile DB table mapping
│   │   ├── feed.py            # Feeds product DB table mapping
│   │   ├── order.py           # Orders & line-items DB table mapping
│   │   └── cattle.py          # Sante ads & expiry DB table mapping
│   ├── schemas/
│   │   ├── auth.py            # Input schema for signups and login credentials
│   │   ├── user.py            # User schema profile responses
│   │   ├── feed.py            # Products schema catalog records
│   │   ├── order.py           # Order payload creations
│   │   └── cattle.py          # Marketplace Sante schemas & aliases
│   ├── routes/
│   │   ├── auth_routes.py     # Signup, verify Twilio SMS OTP, JWT login
│   │   ├── feed_routes.py     # Catalog search & admin item edits
│   │   ├── order_routes.py    # Purchases & admin status dropdowns
│   │   ├── cattle_routes.py   # Sante listings & direct camera uploads
│   │   ├── profile_routes.py  # Profile retrieval & address updates
│   │   ├── admin_routes.py    # Administrative dashboard counters
│   │   └── ai_routes.py       # Nandini AI chat assistant endpoint
│   ├── services/
│   │   ├── cloudinary_service.py # Cloudinary base64 media uploads
│   │   ├── otp/
│   │   │   └── otp_service.py    # Twilio Verify SMS OTP abstraction
│   │   └── ai/
│   │       └── nandini_ai.py  # Google GenAI model config and dairy farming filters
│   └── utils/
│       └── response.py        # Standardized envelope formatting
├── requirements.txt           # Explicit dependencies specification
├── .env.example               # Template environment configuration file
├── seed.py                    # Auto-population script for testing
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
Install all platform packages listed in `requirements.txt`:
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
2. Ensure you append `+asyncpg` to the driver prefix. It should look like this:
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
*If these parameters are left blank, the `cloudinary_service` operates in robust mock mode, automatically returning a default cow photo to prevent API failures during local testing!*

---

## 🧠 Configuring Nandini AI
Nandini AI is a smart dairy farming assistant powered by the Google GenAI `gemini-2.5-flash` model.
To configure it:
1. Obtain a Gemini API Key from Google AI Studio.
2. Update your `backend/.env` file to include:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```
The backend verifies the key presence at startup. Nandini AI acts as a dedicated dairy farming assistant specifically tailored for Karnataka farmers:
* **Language:** Responds dynamically in the language matching the user's current interface choice (Kannada or English).
* **Focus Areas:** Covers dairy farming, cow & buffalo care, feed/fodder, milk production, fat/SNF, vaccination/health, breeding, Karnataka milk unions, and government dairy schemes.
* **Format:** Keeps responses short, practical (usually 1-4 lines), and direct.
* **Guardrails:** Politely declines non-farming or non-livestock related queries.

---

## 💬 Twilio Verify SMS OTP & Password Resets
The backend supports secure onboarding and password resets via Twilio Verify SMS:
* **Endpoints:**
  * `POST /api/auth/send-otp`: Triggers a 6-digit SMS verification code to the farmer's mobile number.
  * `POST /api/auth/verify-otp`: Securely checks the submitted registration verification code.
  * `POST /api/auth/forgot-password/request-otp`: Triggers a password reset SMS verification code.
  * `POST /api/auth/forgot-password/verify-otp`: Validates the reset verification code.
  * `POST /api/auth/forgot-password/reset`: Updates the user's password using standard bcrypt hashing.
* **OTP Integration Service (`otp_service.py`):**
  * Integrated directly with the Twilio REST API to trigger SMS-channel verifications and approve verification checks using your environment credentials.

> ⚠️ **Twilio Trial Account Gotcha:** Twilio Trial accounts only allow sending SMS messages to **Verified Caller IDs**. If you run into a `TwilioRestException` (HTTP 403 error) during local registration, make sure you have added your testing phone number under **Phone Numbers > Verified Caller IDs** in your Twilio Console.

---

## 🌱 Seeding Test Data
Run the database bootstrapping seed script to automatically build tables and populate feeds, admin accounts, and default cattle posts:

```bash
python seed.py
```
* **Success Message:** `[SEED COMPLETE] Database populated successfully! You are ready to log in.`
* This seeds the main admin demo account (**Phone:** `+919876543210`, **Password:** `demo123`) and products feeds matching the frontend schema.

---

## 🏁 Starting the FastAPI Server
To launch the API server locally:

```bash
uvicorn app.main:app --reload --port 8000
```

* **Interactive Swagger Documentation:** Open **[http://localhost:8000/docs](http://localhost:8000/docs)** to test the API endpoints directly from your browser!
* **Status Endpoint:** Open **[http://localhost:8000/](http://localhost:8000/)** to verify the server is live and running.

---

## 🔗 Connecting the React Frontend
Connecting your running React client to the new live backend is extremely easy:

1. Open your frontend source code folder at `frontend/`.
2. Open [apiClient.js](file:///Users/susheel/milkfront1/frontend/src/services/api/apiClient.js).
3. Toggle `USE_MOCK_API` to `false`:
   ```javascript
   const USE_MOCK_API = false;
   ```
4. Start both servers:
   * **FastAPI Backend:** `uvicorn app.main:app --reload --port 8000` (listening on port 8000)
   - **Vite React Frontend:** `npm run dev -- --host` (listening on port 5173, mapping requests to `http://localhost:8000/api`)
5. The application will immediately stop reading simulated data and run real query requests to the backend server.
