import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { authApi } from '../services/api/authApi';
import { Logo } from './Logo';
import { useTranslation } from '../i18n/useTranslation';

export const Header = ({ showBack = false, onBack = null }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(authApi.getCurrentUser());
  }, []);

  const initial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : null;

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
          {/* Desktop Nav */}
          {['admin', 'super_admin'].includes(currentUser?.role) && (
            <nav className="hidden md:flex items-center gap-6 mr-3">
              <button onClick={() => navigate('/admin')} className="text-text-dark hover:opacity-75 font-semibold transition-opacity">
                {t('common.admin')}
              </button>
            </nav>
          )}

          {/* Profile Circle Avatar (both desktop & mobile) */}
          {currentUser && (
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full bg-white text-text-dark font-bold border-2 border-text-dark flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
              title="View Profile"
            >
              {initial ? initial : <User size={16} />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

