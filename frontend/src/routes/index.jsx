import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomePage,
  BuyFeedsPage,
  OrderSummaryPage,
  SanteActionPage,
  SanteBuyPage,
  SanteSellPage,
  ProfilePage,
  OrdersPage,
  AdminDashboard,
  NandiniAIPage,
  DairyNewsPage,
  PrivacyPolicy,
  TermsAndConditions,
  Support,
  LoginPage,
  RegisterPage,
  ForgotPassword,
} from '../pages';
import { ShieldAlert } from 'lucide-react';

// MilkMaatu App Loading Screen
export const RouteLoader = () => (
  <div className="min-h-screen bg-[#0A2E1F] flex items-center justify-center">
    <div className="text-center space-y-3">
      <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs font-bold text-emerald-200">Loading MilkMaatu...</p>
    </div>
  </div>
);

// ProtectedRoute: Requires active Supabase session.
// Waits for session verification to resolve (loading === false) before deciding to render or redirect.
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// PublicOnlyRoute: Prevents logged-in users from seeing Login/Register again.
// If valid session exists, passes directly to /home.
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <RouteLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

// AdminRoute: Guarded by Supabase RBAC role (admin or super_admin)
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 shadow-xl p-8 max-w-sm w-full text-center animate-fade-in">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-black text-text-dark mb-1">Access Denied</h2>
          <p className="text-xs text-text-light mb-6">
            Administrator or Super Admin privileges are required to view this dashboard.
          </p>
          <button
            onClick={() => window.location.href = '/home'}
            className="w-full py-2.5 px-4 bg-primary text-text-dark font-black rounded-xl hover:opacity-90 transition-all text-xs cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return children;
};

// Routes configuration
export const routes = [
  // Public & compliance
  {
    path: '/privacy-policy',
    element: <PrivacyPolicy />,
  },
  {
    path: '/terms',
    element: <TermsAndConditions />,
  },
  {
    path: '/support',
    element: <Support />,
  },
  // Auth routes (Guests only — redirect to /home if already logged in)
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicOnlyRoute>
        <ForgotPassword />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/reset-password',
    element: <ForgotPassword />,
  },

  // Core Marketplace routes (Protected by Supabase Auth session)
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/nandini-ai',
    element: (
      <ProtectedRoute>
        <NandiniAIPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/news',
    element: (
      <ProtectedRoute>
        <DairyNewsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/feeds',
    element: (
      <ProtectedRoute>
        <BuyFeedsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/order-summary',
    element: (
      <ProtectedRoute>
        <OrderSummaryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/orders',
    element: (
      <ProtectedRoute>
        <OrdersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/sante',
    element: (
      <ProtectedRoute>
        <SanteActionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/sante-buy',
    element: (
      <ProtectedRoute>
        <SanteBuyPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/sante-sell',
    element: (
      <ProtectedRoute>
        <SanteSellPage />
      </ProtectedRoute>
    ),
  },

  // Cattle route aliases and fallbacks for cattle-buying navigation
  {
    path: '/cattle',
    element: <Navigate to="/sante-buy" replace />,
  },
  {
    path: '/cattle-buy',
    element: <Navigate to="/sante-buy" replace />,
  },
  {
    path: '/cattle-sell',
    element: <Navigate to="/sante-sell" replace />,
  },
  {
    path: '/sante/buy',
    element: <Navigate to="/sante-buy" replace />,
  },
  {
    path: '/sante/sell',
    element: <Navigate to="/sante-sell" replace />,
  },

  // Admin dashboard (Protected by Supabase Auth RBAC)
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },

  // Root and fallback routes
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
];
