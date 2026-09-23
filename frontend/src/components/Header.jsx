import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { useTranslation } from '../i18n/useTranslation';

export const Header = ({ showBack = false, onBack = null }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAdmin, isSuperAdmin } = useAuth();

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : null);

  return (
    <header className="bg-primary sticky top-0 z-40 shadow-sm border-b border-primary-dark">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              className="text-text-dark hover:opacity-70 transition-opacity text-xl font-bold bg-white/20 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ←
            </button>
          ) : null}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/home')}
            role="button"
            aria-label="Go to home"
          >
            <Logo
              imgClassName="h-9 w-auto"
              fallbackClassName="text-xl font-black"
              alt="MilkMaatu"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Admin link if user has admin/super_admin role */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A2E1F] text-amber-400 font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#041D12] transition-colors"
            >
              <Shield size={14} />
              <span>Admin</span>
            </button>
          )}

          {/* Profile Circle Avatar (both desktop & mobile) */}
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full bg-white text-text-dark font-bold border-2 border-text-dark flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
            title="Profile & Settings"
            aria-label="Profile & Settings"
          >
            {initial ? initial : <User size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
};
