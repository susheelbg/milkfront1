import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, User } from 'lucide-react';
import { authApi } from '../services/api/authApi';
import { Logo } from './Logo';
import { useTranslation } from '../i18n/useTranslation';

export const Header = ({ showBack = false, onBack = null }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(authApi.getCurrentUser());
  }, []);

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

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
          <nav className="hidden md:flex items-center gap-6 mr-3">
            <button onClick={() => navigate('/home')} className="text-text-dark hover:opacity-75 font-semibold transition-opacity">
              {t('common.home')}
            </button>
            <button onClick={() => navigate('/feeds')} className="text-text-dark hover:opacity-75 font-semibold transition-opacity">
              {t('home.buyFeeds')}
            </button>
            <button onClick={() => navigate('/sante')} className="text-text-dark hover:opacity-75 font-semibold transition-opacity">
              {t('home.sante')}
            </button>
            {currentUser?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="text-text-dark hover:opacity-75 font-semibold transition-opacity">
                {t('common.admin')}
              </button>
            )}
          </nav>

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

          {/* Hamburger (Mobile) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-text-dark p-1 bg-white/30 rounded-lg hover:bg-white/55 transition-colors"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-primary-light border-t border-primary-dark shadow-inner animate-slide-up">
          <nav className="flex flex-col p-4 gap-2">
            <button onClick={() => { navigate('/home'); setMenuOpen(false); }} className="text-text-dark hover:bg-primary/20 px-3 py-2 rounded-lg font-semibold text-left transition-colors">
              {t('common.home')}
            </button>
            <button onClick={() => { navigate('/feeds'); setMenuOpen(false); }} className="text-text-dark hover:bg-primary/20 px-3 py-2 rounded-lg font-semibold text-left transition-colors">
              {t('home.buyFeeds')}
            </button>
            <button onClick={() => { navigate('/sante'); setMenuOpen(false); }} className="text-text-dark hover:bg-primary/20 px-3 py-2 rounded-lg font-semibold text-left transition-colors">
              {t('home.sante')}
            </button>
            <button onClick={() => { navigate('/profile'); setMenuOpen(false); }} className="text-text-dark hover:bg-primary/20 px-3 py-2 rounded-lg font-semibold text-left transition-colors">
              {t('common.profile')}
            </button>
            {currentUser?.role === 'admin' && (
              <button onClick={() => { navigate('/admin'); setMenuOpen(false); }} className="text-text-dark hover:bg-primary/20 px-3 py-2 rounded-lg font-semibold text-left transition-colors">
                {t('admin.dashboard')}
              </button>
            )}
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="bg-red-500 text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 justify-center font-bold text-sm mt-2"
            >
              <LogOut size={16} />
              {t('common.logout')}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

