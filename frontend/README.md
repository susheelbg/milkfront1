# 🥛 MilkMaatu - Premium React Frontend Client

This is the complete, responsive, and user-friendly web client application for the **MilkMaatu** dairy farmer ecosystem portal. Built using React, Vite, and Tailwind CSS, it connects asynchronously to the FastAPI backend service to provide seamless local trade, cattle feed deliveries, and smart AI assistance.

---

## 🛠️ Tech Stack & Styling
- **Core:** React 18, Vite 5 (Fast Refresh dev server)
- **Styling:** Tailwind CSS (Curated color theme, glassmorphism elements, dynamic micro-animations)
- **Icons:** Lucide React
- **Router:** React Router DOM (Client-side protected route wrappers)
- **Build Tooling:** PostCSS, Autoprefixer

---

## 📂 Frontend Architecture

```
frontend/
├── src/
│   ├── main.jsx               # Entrypoint mounting App
│   ├── App.jsx                # Route rendering canvas
│   ├── assets/                # Local static graphics
│   ├── components/            # Reusable UI elements (Header, Button, Card, Toast)
│   ├── data/                  # Static values configuration
│   ├── pages/                 # Full screen page views
│   │   ├── HomePage.jsx       # Services dashboard
│   │   ├── LoginPage.jsx       # Safe JWT logins
│   │   ├── RegisterPage.jsx    # User signups with OTP simulation
│   │   ├── ProfilePage.jsx     # User details & order history
│   │   ├── BuyFeedsPage.jsx    # Cattle feed shopping list
│   │   ├── SanteSelectorPage.jsx # Sante main menu
│   │   ├── SanteBuyPage.jsx    # Browse cattle listings
│   │   ├── SanteSellPage.jsx   # List new cattle for sale
│   │   ├── AdminDashboard.jsx  # Platform metrics & controls
│   │   └── NandiniAIPage.jsx   # Nandini AI Chat assistant Page
│   ├── routes/
│   │   └── index.jsx          # Route paths mapping & guard filters
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.js   # Central fetch wrapper with auth header injectors
│   │   │   ├── authApi.js     # Auth & profile request endpoints
│   │   │   ├── feedsApi.js    # Feeds catalog actions
│   │   │   ├── cattleApi.js   # Sante marketplace actions
│   │   │   ├── orderApi.js    # Feed order placements
│   │   │   └── aiApi.js       # Nandini AI assistant caller
│   │   └── toastService.js    # Toast notification signals
│   └── styles/
│       └── index.css          # Tailwind directives & scrollbar styling
├── package.json               # Package manifests and runner scripts
├── vercel.json                # Vercel SPA routing rewrites config
├── tailwind.config.js         # Custom colors configuration
└── vite.config.js             # Vite compilers configuration
```

---

## 🚀 Local Developer Setup

### 1. Install Node.js Dependencies
Navigate to the `frontend/` directory and install the packages:
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

This client is optimized to deploy instantly on **Vercel** with client-side routing support:
- [vercel.json](file:///Users/susheel/milkfront1/frontend/vercel.json) rewrites all sub-routes to `index.html` to prevent `404: NOT_FOUND` on page refreshes.
- Ensure the production environment variable `VITE_API_URL` is set in your Vercel project settings, pointing to your active Render backend (e.g., `https://<render-backend-url>/api`).
