import React from 'react';
import { Navigate } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  ForgotPassword,
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
  PrivacyPolicy,
  TermsAndConditions,
  Support,
} from '../pages';
import { authApi } from '../services/api/authApi';

// Protected route component
export const ProtectedRoute = ({ children }) => {
  if (!authApi.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const AdminRoute = ({ children }) => {
  const user = authApi.getCurrentUser();
  if (!authApi.isAuthenticated() || !['admin', 'super_admin'].includes(user?.role)) {
    return <Navigate to="/home" replace />;
  }
  return children;
};

// Routes configuration
export const routes = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
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
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
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
  {
    path: '/',
    element: authApi.isAuthenticated() ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
];

