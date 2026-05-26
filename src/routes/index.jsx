import React from 'react';
import { Navigate } from 'react-router-dom';
import {
  LoginPage,
  HomePage,
  BuyFeedsPage,
  OrderSummaryPage,
  SanteSelectorPage,
  SanteActionPage,
  SanteBuyPage,
  SanteSellPage,
} from '../pages';
import { authService } from '../services/authService';

// Protected route component
export const ProtectedRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
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
    path: '/home',
    element: (
      <ProtectedRoute>
        <HomePage />
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
    element: authService.isAuthenticated() ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
];
