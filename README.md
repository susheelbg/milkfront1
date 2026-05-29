# 🥛 MilkMaatu - Premium Dairy Farming Platform

MilkMaatu is a premium, mobile-first web application designed specifically for dairy farmers. It allows farmers to get high-quality cattle feed delivered directly from manufacturers to their doorstep, track milk production records, and easily buy or sell cattle through a trusted local marketplace hub (Sante).

Developed with a clean, modern, and high-converting yellow-white aesthetic, the platform features responsive cards, modern circular service buttons, dynamic shopping carts, and live camera-only listing restrictions.

---

## 📱 Mobile-First Features

### 1. WhatsApp OTP Registration Flow
A secure, step-by-step onboarding experience built specifically with farmers in mind:
* **Step 1:** Enter your name and 10-digit mobile number.
* **Step 2:** Interactive screen to verify a mock OTP code sent via WhatsApp (simulating professional WhatsApp gateway integrations; default verification code is **`1234`**).
* **Step 3:** Setup your account password and add optional delivery details.
* **Step 4:** Account confirmation and automatic redirect to login.

### 2. Cattle Sante Marketplace (Direct Camera Only)
An interactive marketplace optimized for local trading (within 40 KM hubs like KRS Sante and Thendekere Sante):
* **Sante listings automatically expire and delete after 24 hours** to prevent stale catalog info.
* **Live Camera Upload:** Restricts media select to live camera capture (`capture="environment"`). Gallery selections are blocked, ensuring only authentic, live photos of the cattle are posted.
* **Contact Integration:** Instantly call or copy the verified seller's mobile number with a single tap.

### 3. Buy Feeds Shop & Glassmorphic Cart
A modern shopping experience built for quick checkout on the move:
* Product items are loaded dynamically via modular APIs.
* Native-like quantity selectors (`+` / `-`) have large tap targets.
* **Floating Glassmorphic Cart:** A sticky, bottom-aligned status drawer displaying your total item count and price.
* **Smart Prefills:** Address forms automatically pull and prefill address fields from the active farmer's profile for seamless checkouts.

### 4. Admin Management Dashboard (`/admin`)
An administrative control portal allowing dairy network operators to moderate the ecosystem:
* **Overview tab:** Live statistics counters tracking total revenue, active feeds count, pending orders, and cattle listings.
* **Feeds Catalog tab:** Real-time adding, editing, and deleting cattle feed products.
* **Orders Tracker tab:** View order details including customer name, phone number, address, list of ordered products, grand total, and a status dropdown (Pending, Confirmed, Shipped, Delivered, Cancelled).
* **Users tab:** View the list of all registered farmer accounts and roles.
* **Cattle tab:** Active cattle posts viewer with moderation controls (immediate deletion/overrides).

---

## 🛠️ Tech Stack
* **Framework:** React 18 (Vite)
* **Styling:** Tailwind CSS (Curated warm yellow, emerald, and white palette)
* **Icons:** Lucide React
* **Routing:** React Router v6
* **Data State:** Synchronized LocalStorage simulated database layers

---

## 📂 Backend-Ready API Structure
The frontend has been designed with clean abstractions under `src/services/api/` to make connecting to a **FastAPI + Supabase** backend tomorrow extremely easy:

```
src/services/api/
├── apiClient.js     # Centralized fetch client (JWT token insertion, configurable API Base URL)
├── authApi.js       # Login, Registration, WhatsApp OTP delivery, Profile updates
├── feedsApi.js      # Feeds list retrieval, catalog modifications
├── orderApi.js      # Order creations, tracking status updates
├── cattleApi.js     # Sante postings, search queries, delete moderations
└── adminApi.js      # Admin statistics metrics, registered user lists
```

### Transitioning to a Live FastAPI Server
By default, the `apiClient.js` runs in local mock mode. When you deploy your FastAPI server, simply configure:
1. Set the server host environment variable `VITE_API_URL` to your FastAPI server (e.g. `http://localhost:8000/api`).
2. Open `src/services/api/apiClient.js` and change `USE_MOCK_API` to `false`.
3. The client will automatically transition from local simulation to making real HTTP requests, injecting `Authorization: Bearer <JWT_Token>` headers on all protected queries.

---

## 🚀 Running Locally

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Start the Development Server
To launch the app on your computer:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. Expose to Mobile Phone (Wi-Fi)
To test the direct camera capture and mobile views on your physical phone:
1. Ensure both your computer and phone are connected to the **same Wi-Fi network**.
2. Run Vite exposing host interfaces:
   ```bash
   npm run dev -- --host
   ```
3. Type the **Network URL** (e.g., `http://192.168.1.4:5173`) printed in your terminal directly into your phone's browser.

---

## 👤 Credits
Built and designed with premium mobile aesthetics by **Susheel**.
