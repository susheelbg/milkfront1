import React from 'react';
import { Navigate } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  HomePage,
  BuyFeedsPage,
  OrderSummaryPage,
  SanteSelectorPage,
  SanteActionPage,
  SanteBuyPage,
  SanteSellPage,
  ProfilePage,
  AdminDashboard,
  NandiniAIPage,
} from '../pages';
import { authApi } from '../services/api/authApi';

// Protected route component
export const ProtectedRoute = ({ children }) => {
  if (!authApi.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin route component
export const AdminRoute = ({ children }) => {
  const user = authApi.getCurrentUser();
  if (!authApi.isAuthenticated() || user?.role !== 'admin') {
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
    path: '/sante',
    element: (
      <ProtectedRoute>
        <SanteSelectorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/sante-action',
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

