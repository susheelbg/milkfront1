# 🥛 MilkMaatu - Premium React Frontend Client

This is the complete, responsive, mobile-first web client application for the **MilkMaatu** dairy farmer ecosystem portal. Built using React, Vite, and Tailwind CSS, it connects asynchronously to the FastAPI backend service to provide seamless local trade, cattle feed deliveries, and smart AI assistance.

**Zero Friction Architecture:** Farmers are never forced to register, log in, or remember passwords. The application launches directly into the Home dashboard, pre-filling contact details from the farmer's locally saved preferences.

---

## 🛠️ Tech Stack & Styling
- **Core:** React 18, Vite 5 (Fast Refresh dev server)
- **Styling:** Tailwind CSS (Curated emerald + gold color theme, glassmorphism elements, dynamic micro-animations)
- **Icons:** Lucide React
- **Router:** React Router DOM (Frictionless direct access routes)
- **i18n:** Custom Kannada / English translation system
- **Build Tooling:** PostCSS, Autoprefixer

---

## 📂 Frontend Architecture

```
frontend/
├── src/
│   ├── main.jsx               # Entrypoint mounting App with LanguageProvider
│   ├── App.jsx                # Route canvas & persistent bottom navigation bar
│   ├── assets/                # Local static graphics & logo
│   ├── components/            # Reusable UI elements (Header, Button, Card, Toast, BottomNav)
│   ├── pages/                 # Full screen page views
│   │   ├── HomePage.jsx       # Services dashboard, quick actions, news & feed ticker
│   │   ├── BuyFeedsPage.jsx   # Cattle feed shopping catalog (2-col mobile grid)
│   │   ├── OrderSummaryPage.jsx # Checkout & order placement with prefilling
│   │   ├── OrdersPage.jsx     # Live order tracking
│   │   ├── SanteActionPage.jsx # Sante market hub action selector
│   │   ├── SanteBuyPage.jsx   # Browse & filter cattle listings
│   │   ├── SanteSellPage.jsx  # List new cattle for sale with photo upload
│   │   ├── DairyNewsPage.jsx  # Full farmers news page
│   │   ├── NandiniAIPage.jsx  # Gemini-powered Nandini AI chat assistant
│   │   ├── ProfilePage.jsx    # Local farmer details & language switcher
│   │   ├── AdminDashboard.jsx # Admin metrics & moderation (PIN guarded)
│   │   └── compliance/        # Privacy Policy, Terms, and Support pages
│   ├── routes/
│   │   └── index.jsx          # Direct route paths & Admin PIN challenge guard
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.js   # Central fetch wrapper with optional Admin PIN header
│   │   │   ├── authApi.js     # Local farmer profile storage & admin PIN session
│   │   │   ├── feedsApi.js    # Feeds catalog actions
│   │   │   ├── cattleApi.js   # Sante marketplace actions
│   │   │   ├── orderApi.js    # Feed order placements & tracking
│   │   │   └── newsApi.js     # Farmers News API caller
│   │   └── toastService.js    # Toast notification signals
│   └── styles/
│       └── index.css          # Tailwind directives, animations & custom scrollbars
├── package.json               # Package manifests and runner scripts
├── vercel.json                # Vercel SPA routing rewrites config
├── tailwind.config.js         # Custom colors & typography configuration
└── vite.config.js             # Vite compiler configuration
```

---

## 🚀 Local Developer Setup

### 1. Install Node.js Dependencies
Navigate to the `frontend/` directory and install packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `frontend/` root folder:
```env
VITE_API_URL=http://localhost:8000/api
```

### 3. Launch Development Server
Start Vite local web client:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Production Vercel Configuration

This client is optimized to deploy on **Vercel** with client-side routing support:
- [vercel.json](file:///Users/susheel/milkfront1/frontend/vercel.json) rewrites all sub-routes to `index.html` to prevent `404: NOT_FOUND` on page refreshes.
- Ensure the production environment variable `VITE_API_URL` is set in your Vercel project settings, pointing to your active backend (e.g., `https://milkfront1.onrender.com/api`).

---

## 🤖 Android Application (Capacitor)

The frontend is converted into a native Android app using Capacitor. 

To set up, configure, and compile signed release APKs and AABs, please see the [Android Build & Signing Instructions](file:///Users/susheel/milkfront1/ANDROID_BUILD.md) at the root of this project.
