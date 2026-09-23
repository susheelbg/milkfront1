import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
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
} from '../pages';
import { authApi } from '../services/api/authApi';
import { Lock, ArrowRight } from 'lucide-react';

// AdminRoute: Guarded by Admin Access PIN without requiring farmer user accounts
export const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(() => authApi.isAdminAuthenticated());
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (isAdmin) {
    return children;
  }

  const handleUnlock = (e) => {
    e.preventDefault();
    if (authApi.adminLogin(pin.trim())) {
      setIsAdmin(true);
      setError('');
    } else {
      setError('Invalid Admin PIN. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-border-light shadow-xl p-8 max-w-sm w-full text-center animate-fade-in">
        <div className="w-14 h-14 bg-primary-light text-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock size={28} />
        </div>
        <h2 className="text-xl font-black text-text-dark mb-1">Admin Access</h2>
        <p className="text-xs text-text-light mb-6">Enter Admin PIN to manage feeds and orders</p>
        
        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError('');
            }}
            placeholder="Enter PIN (4512)"
            autoFocus
            className="w-full text-center text-2xl tracking-widest font-black py-3 px-4 rounded-xl border border-border-light focus:border-primary focus:outline-none bg-bg-light"
          />
          {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-primary text-text-dark font-black rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Unlock Dashboard</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

// Routes configuration - completely open farmer experience
export const routes = [
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
    element: <HomePage />,
  },
  {
    path: '/nandini-ai',
    element: <NandiniAIPage />,
  },
  {
    path: '/news',
    element: <DairyNewsPage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
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
    element: <BuyFeedsPage />,
  },
  {
    path: '/order-summary',
    element: <OrderSummaryPage />,
  },
  {
    path: '/orders',
    element: <OrdersPage />,
  },
  {
    path: '/sante',
    element: <SanteActionPage />,
  },
  {
    path: '/sante-buy',
    element: <SanteBuyPage />,
  },
  {
    path: '/sante-sell',
    element: <SanteSellPage />,
  },
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
];
