# 🥛 MilkMaatu - Premium Dairy Farming Platform

MilkMaatu is a premium, mobile-first, and multilingual web application designed specifically for dairy farmers in Karnataka. It features **Kannada as the default language** (with English as an optional language) throughout the application. It allows farmers to get high-quality cattle feed delivered directly from manufacturers to their doorstep, track milk production records, and easily buy or sell cattle through a trusted local marketplace hub (Sante).

Developed with a clean, modern, and high-converting yellow-white aesthetic, the platform features responsive cards, modern circular service buttons, dynamic shopping carts, and live camera-only listing restrictions.

---

## 📱 Mobile-First & Multilingual Features

### 1. Dynamic Translation System (Kannada Default)
* The application automatically boots in Kannada for all new users.
* Users can instantly switch between Kannada (ಕನ್ನಡ) and English from their profile settings without page reload.
* The selected language persists inside `localStorage` and is synced with the backend user profile database.

### 2. WhatsApp OTP Registration Flow
A secure, step-by-step onboarding experience built specifically with farmers in mind:
* **Step 1:** Enter your name and 10-digit mobile number.
* **Step 2:** Interactive screen to verify a mock OTP code sent via WhatsApp (simulating professional WhatsApp gateway integrations; default verification code is **`1234`**).
* **Step 3:** Setup your account password and add optional delivery details.
* **Step 4:** Account confirmation and automatic redirect to login.

### 3. Cattle Sante Marketplace (Direct Camera Only)
An interactive marketplace optimized for local trading (within **20 KM** hubs like KRS Sante and Thendekere Sante):
* **Sante listings automatically expire and delete after 24 hours** to prevent stale catalog info.
* **Live Camera Upload:** Restricts media select to live camera capture (`capture="environment"`). Gallery selections are blocked, ensuring only authentic, live photos of the cattle are posted.
* **Contact Integration:** Instantly call or copy the verified seller's mobile number with a single tap.

### 4. Buy Feeds Shop & Glassmorphic Cart
A modern shopping experience built for quick checkout on the move:
* Product items are loaded dynamically via modular APIs and priced **per bag (ಚೀಲ)**.
* Native-like quantity selectors (`+` / `-`) have large tap targets.
* **Floating Glassmorphic Cart:** A sticky, bottom-aligned status drawer displaying your total item count and price.
* **Smart Prefills:** Address forms automatically pull and prefill address fields from the active farmer's profile for seamless checkouts.

### 5. 🧠 Nandini AI Digital Assistant (🧠 ಸಹಾಯಕಿ)
* A smart AI assistant powered by Google GenAI `gemini-2.5-flash` to answer dairy farming questions.
* Dynamically speaks and responds based on the active user interface language (Kannada system prompt vs English system prompt).
* Smart guardrails restrict non-farming queries to stay helpful for dairy networks.

### 6. Admin Management Dashboard (`/admin`)
An administrative control portal allowing dairy network operators to moderate the ecosystem:
* **Overview tab:** Live statistics counters tracking total revenue, active feeds count, pending orders, and cattle listings.
* **Feeds Catalog tab:** Real-time adding, editing, and deleting cattle feed products.
* **Orders Tracker tab:** View order details including customer name, phone number, address, list of ordered products, grand total, and a status dropdown (Pending, Confirmed, Shipped, Delivered, Cancelled).
* **Users tab:** View the list of all registered farmer accounts and roles.
* **Cattle tab:** Active cattle posts viewer with moderation controls (immediate deletion/overrides).

---

## 🛠️ Tech Stack
* **Frontend Framework:** React 18 (Vite)
* **Backend Framework:** FastAPI (Python 3.12+)
* **Database:** PostgreSQL (with SQLite fallback)
* **Styling:** Tailwind CSS (Curated warm yellow, emerald, and white palette)
* **Icons:** Lucide React
* **Routing:** React Router v6
* **AI Engine:** Google GenAI (Gemini)

---

## 📂 Project Structure
The repository is divided into two primary subdirectories:
* **`frontend/`**: The complete React 18 + Vite + Tailwind CSS frontend application.
* **`backend/`**: The FastAPI backend services connecting to PostgreSQL/Supabase database tables.

---

## 🚀 Running Locally

### 1. Start the FastAPI Backend
Navigate to `backend` directory, activate virtual environment, install requirements, and run seed script:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8000
```

### 2. Start the Frontend
Navigate into the `frontend` directory, install the dependencies, and start Vite:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5174](http://localhost:5174)** or the terminal-displayed URL in your browser.

---

## 👤 Credits
Built and designed with premium mobile aesthetics by **Susheel**.

