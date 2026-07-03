# 🥛 MilkMaatu — Premium Dairy Farming Platform

MilkMaatu is a **mobile-first, multilingual** full-stack platform built specifically for dairy farmers in Karnataka. It connects farmers to feed suppliers, provides a local cattle marketplace (Sante), offers an AI-powered dairy assistant (Nandini AI), and gives administrators control over the platform — all translated dynamically in **Kannada (ಕನ್ನಡ)** and **English**.

The project is structured as a monorepo containing a high-performance FastAPI backend, a responsive React web frontend, and native Android packaging configuration via Capacitor.

🔗 **Production Deployments:**
- **Frontend / Portal:** [https://milkfront1.onrender.com](https://milkfront1.onrender.com)
- **API Documentation:** [https://milkfront1.onrender.com/docs](https://milkfront1.onrender.com/docs)

---

## 🌟 Key Application Features

### 1. 📱 Mobile-First Bottom Navigation
Designed primarily for mobile viewport usability, the layout utilizes a persistent bottom navigation bar ([BottomNavigation.jsx](file:///Users/susheel/milkfront1/frontend/src/components/BottomNavigation.jsx)) that provides single-thumb navigation across core sections:
* **Home (`/home`):** Quick-action dashboard showing stats, quick links, and a shortcut card to the Nandini AI assistant.
* **Sante Marketplace (`/sante`):** Expiring local cattle marketplace.
* **Buy Feeds (`/feeds`):** Direct catalog shop for purchasing cattle feed.
* **My Orders (`/orders`):** Live tracking of order shipment statuses.
* **Profile (`/profile`):** Management of delivery addresses, language preferences, and profile pictures.

### 2. 🌐 Localized Multilingual Experience
- **Kannada by Default:** To ensure maximum accessibility for local farmers in Karnataka, all new registrations default to Kannada.
- **Dynamic Toggle:** Users can instantly switch between English and ಕನ್ನಡ inside [ProfilePage.jsx](file:///Users/susheel/milkfront1/frontend/src/pages/ProfilePage.jsx) without forcing page refreshes.
- **Persistent Preferences:** The selected locale is saved locally in `localStorage` and synchronized with the backend user profile database.

### 3. 🔐 Secure Twilio Verify OTP Onboarding
A step-by-step secure registration & onboarding pipeline implemented inside [RegisterPage.jsx](file:///Users/susheel/milkfront1/frontend/src/pages/RegisterPage.jsx):
1. **Details Entry:** The farmer inputs their name and 10-digit mobile number.
2. **Send OTP:** Sends a 6-digit SMS verification code using **Twilio Verify**.
3. **Verify OTP:** A verification input screen with a 30-second countdown timer and resend functionality.
4. **Credential Setup:** On successful OTP verification, the user sets a secure login password and delivery address.

> [!WARNING]
> **Twilio Trial Account Limitation:** If you are testing Twilio OTP flows with a Twilio trial account, you **must** manually register the target phone numbers inside the **Verified Caller IDs** panel of your Twilio Console, otherwise Twilio will block the outgoing SMS.

### 4. 🐄 Sante Cattle Marketplace
A trusted local cattle marketplace with automated freshness controls:
* **Geographical Scoping:** Listings are grouped under local hub market hubs (e.g. *KRS Sante*, *Thendekere Sante*) scoped within a 20 KM radius.
* **24-Hour Expiry:** Listings are active for exactly **24 hours**. An automated background loop worker in the FastAPI server ([main.py](file:///Users/susheel/milkfront1/backend/app/main.py#L25-L50)) sweeps the database hourly to purge expired posts.
* **Camera-Only Uploads:** Image uploads are restricted to direct environment capture (`capture="environment"`), preventing arbitrary gallery uploads and promoting trust.

### 5. 🛍️ Buy Feeds Shop & Glassmorphic Cart
A shopping cart interface designed for high-friction environments:
- Products are priced per bag (ಚೀಲ).
- Interactive quantity adjustment buttons featuring oversized touch targets for mobile screens.
- **Glassmorphic Cart Bar:** A floating, translucent checkout bar that aggregates prices and total counts in real time.
- Pre-filled order summary checkouts matching saved profile delivery details.

### 6. 🧠 Nandini AI Dairy Farming Assistant
An AI chatbot powered by Google Gemini 2.5 Flash ([nandini_ai.py](file:///Users/susheel/milkfront1/backend/app/services/ai/nandini_ai.py)):
- **Language Alignment:** Converses in the language actively chosen by the farmer (Kannada or English).
- **Dairy Scoping:** Programmed with system instructions restricted to dairy husbandry, feed management, cattle vaccination schedules, milk fat optimization, and local Karnataka government schemes.
- **Guardrails:** Politely declines non-agricultural or non-farming prompts.

### 7. 🛡️ Administrative Dashboard (`/admin`)
A unified dashboard for platform operators ([AdminDashboard.jsx](file:///Users/susheel/milkfront1/frontend/src/pages/AdminDashboard.jsx)):
- **Overview:** Summarized cards displaying total platform revenue, active cattle postings, users count, and pending orders.
- **Feeds:** Add, update, or remove cattle feed products dynamically.
- **Orders:** Audit customer deliveries and toggle statuses (`Pending`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`).
- **Users:** Monitor accounts, addresses, roles (`user`, `admin`, `super_admin`).
- **Cattle:** Moderation dashboard to flag or delete inappropriate Sante listings.

---

## 🛠️ Technology Stack

### Frontend Client
- **React 18 & Vite:** Ultra-fast hot module replacement dev environment.
- **Tailwind CSS:** Responsive layouts using utility classes styled around an emerald-green and gold color palette.
- **React Router DOM v6:** Guarded client routing with authentication locks ([index.jsx](file:///Users/susheel/milkfront1/frontend/src/routes/index.jsx#L24-L37)).
- **Capacitor JS:** Bridges the React bundle to compiled native Android configurations.
- **Lucide React:** Icon packages.

### Backend Server
- **FastAPI:** High-performance, asynchronous Python REST API framework.
- **SQLAlchemy 2.0 (Async):** Object-Relational Mapper built for async context management.
- **PostgreSQL / Supabase:** Primary production database.
- **SQLite + aiosqlite:** Out-of-the-box local development database configuration requiring zero database installation.
- **Google GenAI SDK:** Direct API hooks into Gemini 2.5 Flash.
- **Cloudinary:** Base64 image parsing and storage CDN for user avatars.
- **Twilio Verify API:** SMS verification triggers and validation.

---

## 📂 Codebase Directory Map

```
milkfront1/
├── frontend/                     # React 18 Web App & Capacitor Packaging
│   ├── src/
│   │   ├── App.jsx               # App routing wrapper, handles bottom-nav visibility
│   │   ├── main.jsx              # DOM mounting entrypoint
│   │   ├── components/           # Modular UI widgets (Bottom Nav, Toast, Buttons)
│   │   ├── pages/                # Screen layouts (Home, Sante, Feeds, Profile, Admin)
│   │   ├── routes/
│   │   │   └── index.jsx         # Routes mapping with Protected/AdminRoute guards
│   │   ├── services/
│   │   │   ├── api/
│   │   │   │   ├── apiClient.js  # Centralized fetch wrapper adding JWT authorization headers
│   │   │   │   └── authApi.js    # Auth state managers
│   │   │   └── toastService.js   # Event alerts messaging service
│   │   └── i18n/                 # Localization translation dictionaries (en.json, kn.json)
│   ├── android/                  # Native Android wrapper project generated by Capacitor
│   ├── capacitor.config.json     # App IDs and permissions navigation rules
│   ├── tailwind.config.js        # Theme color palettes
│   └── vite.config.js            # Asset compiler settings
│
├── backend/                      # Python FastAPI REST API Server
│   ├── app/
│   │   ├── main.py               # API Router mounts, CORS, and background worker sweep loops
│   │   ├── core/
│   │   │   ├── database.py       # Async SQLAlchemy database session pooler
│   │   │   ├── config.py         # Pydantic Settings variable validation
│   │   │   └── security.py       # Password bcrypt hashing and JWT encoders
│   │   ├── models/               # SQLAlchemy Database schemas (User, Feed, Order, Cattle)
│   │   ├── routes/               # API route collections (auth, order, cattle, profile, ai)
│   │   ├── schemas/              # Pydantic serialization request/response schemas
│   │   └── services/             # Core utilities (Cloudinary upload, Twilio OTP, Gemini integration)
│   ├── seed.py                   # Script to bootstrap tables and verify super-admin credentials
│   ├── requirements.txt          # Python packages list
│   └── .env                      # Local server secrets (Not checked into source)
│
├── ANDROID_BUILD.md              # Android compilation & keystore signing guide
└── README.md                     # Central documentation guide (this file)
```

---

## 🚀 Local Development Environment Setup

### 1. Backend Server Setup
Make sure you have **Python 3.12+** installed on your development machine.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Initialize a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
   *(On Windows use: `venv\Scripts\activate`)*

3. Install requirements:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Create your local environmental file:
   ```bash
   cp .env.example .env
   ```
   *(By default, the SQLite database configuration `sqlite+aiosqlite:///./milkmaatu.db` will be used automatically. You do **not** need to install PostgreSQL or Supabase locally to run/test the code!)*

5. Bootstrap the database and seed initial administrator credentials:
   ```bash
   python seed.py
   ```
   *This initializes the SQLite database tables and seeds a default Super Admin account:*
   * **Phone:** `+917795056391`
   * **Password:** `Susheel@451`

6. Launch the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   * The server runs on **`http://localhost:8000`**
   * View interactive OpenAPI Swagger docs at **`http://localhost:8000/docs`**

---

### 2. Frontend Client Setup
Make sure you have **Node.js (v18+)** installed.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Create the frontend `.env` file pointing to your local FastAPI server:
   ```bash
   echo "VITE_API_URL=http://localhost:8000/api" > .env
   ```

4. Launch the local Vite development server:
   ```bash
   npm run dev
   ```
   * Open **`http://localhost:5173`** in your browser.
   * To test responsive layouts on your phone over the local network, run:
     ```bash
     npm run dev -- --host
     ```

---

## 🤖 Android Compilation & Native Packaging
The React codebase is compiled and synchronized into a native Android wrapper using **Capacitor**.

For step-by-step setup checklists, versioning modifications, keystore keys, and signed release APK/AAB builds instructions, refer to the [Android Build & Signing Instructions](file:///Users/susheel/milkfront1/ANDROID_BUILD.md) guide.

### Basic Sync Command Workflow:
```bash
# 1. Compile Vite frontend build assets
cd frontend
npm run build

# 2. Sync files and plugins to the native Android project directory
npx cap sync

# 3. Open the native project in Android Studio to build or run on a device
npx cap open android
```

---

## 🔑 Environment Variables Checklist

Ensure these variables are defined inside your `backend/.env` file:

| Variable | Dev / Fallback Value | Purpose |
|----------|----------------------|---------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./milkmaatu.db` | Async connection string to PostgreSQL (or SQLite local) |
| `JWT_SECRET` | *(Random 32-character string)* | Secure hashing seed key for user JWT authorization tokens |
| `JWT_ALGORITHM` | `HS256` | Token hashing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24 Hours) | Lifespan of logged-in sessions |
| `GEMINI_API_KEY` | *(Get from Google AI Studio)* | API key to communicate with Gemini 2.5 Flash for Nandini AI |
| `CLOUDINARY_CLOUD_NAME` | *(Optional / Cloudinary Account)* | Image CDN cloud name |
| `CLOUDINARY_API_KEY` | *(Optional / Cloudinary Account)* | Image CDN API key |
| `CLOUDINARY_API_SECRET` | *(Optional / Cloudinary Account)* | Image CDN secret key |
| `TWILIO_ACCOUNT_SID` | *(Optional / Twilio Console)* | Account ID for Twilio SMS operations |
| `TWILIO_AUTH_TOKEN` | *(Optional / Twilio Console)* | Authentication token for Twilio |
| `TWILIO_VERIFY_SERVICE_SID` | *(Optional / Twilio Console)* | Verification Service SID for Twilio Verify OTP |

> [!NOTE]
> **Mock Callbacks:** If `CLOUDINARY_CLOUD_NAME` or `TWILIO_ACCOUNT_SID` variables are left blank, the backend automatically activates fallback mocks (returning a default animal profile image URL and bypassing SMS delivery with mock OK approvals) to streamline rapid local developer onboarding!

---

## 📋 API Routes Reference

All backend service endpoints are prefixed with `/api`.

| Method | Endpoint | Auth Guard | Description |
|--------|----------|:----------:|-------------|
| **GET** | `/` | — | Health check checking if API is online |
| **POST** | `/api/auth/register` | — | Register a new profile |
| **POST** | `/api/auth/login` | — | Validate credentials and receive JWT access token |
| **POST** | `/api/auth/send-otp` | — | Send a Twilio Verify 6-digit SMS OTP |
| **POST** | `/api/auth/verify-otp` | — | Validate Twilio Verify 6-digit OTP |
| **POST** | `/api/auth/forgot-password/request-otp` | — | Request verification OTP for password resets |
| **POST** | `/api/auth/forgot-password/verify-otp` | — | Verify password reset verification code |
| **POST** | `/api/auth/forgot-password/reset` | — | Reset password on verified SMS session |
| **GET** | `/api/profile` | ✅ User | Retrieve profile data & language configurations |
| **PUT** | `/api/profile` | ✅ User | Update profile details (address, locale) |
| **GET** | `/api/feeds` | ✅ User | Get cattle feed inventory catalog |
| **POST** | `/api/orders` | ✅ User | Place a new cart purchase |
| **GET** | `/api/orders/my` | ✅ User | Retrieve individual customer purchase history |
| **GET** | `/api/cattle` | ✅ User | Browse active market cattle listings |
| **POST** | `/api/cattle` | ✅ User | Post a cattle listing (requires camera capture link) |
| **GET** | `/api/reports` | ✅ User | List daily milk logs |
| **POST** | `/api/reports` | ✅ User | Add a daily milk logs entry |
| **POST** | `/api/ai/nandini` | ✅ User | Query Nandini AI conversational chat endpoint |
| **GET** | `/api/admin/stats` | 🛡️ Admin | Get aggregates dashboard metrics |
| **DELETE**| `/api/cattle/{id}` | 🛡️ Admin | Moderation: delete a marketplace listing |
