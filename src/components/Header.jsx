import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { authService } from '../services/authService';
import { useState } from 'react';

export const Header = ({ showBack = false, onBack = null }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="bg-primary sticky top-0 z-40 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              className="text-text-dark hover:opacity-70 transition-opacity"
            >
              ←
            </button>
          ) : null}
          <h1 className="text-2xl font-bold text-text-dark cursor-pointer hover:opacity-80" onClick={() => navigate('/home')}>
            MilkMaatu
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <button onClick={() => navigate('/home')} className="text-text-dark hover:opacity-70 font-medium transition-opacity">
            Home
          </button>
          <button onClick={() => navigate('/feeds')} className="text-text-dark hover:opacity-70 font-medium transition-opacity">
            Buy Feeds
          </button>
          <button onClick={() => navigate('/sante')} className="text-text-dark hover:opacity-70 font-medium transition-opacity">
            Sante
          </button>
          <button
            onClick={handleLogout}
            className="bg-text-dark text-white px-4 py-2 rounded-lg hover:opacity-80 transition-opacity flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-text-dark"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-primary-light border-t-2 border-primary-dark">
          <nav className="flex flex-col p-4 gap-3">
            <button onClick={() => { navigate('/home'); setMenuOpen(false); }} className="text-text-dark hover:opacity-70 font-medium text-left py-2">
              Home
            </button>
            <button onClick={() => { navigate('/feeds'); setMenuOpen(false); }} className="text-text-dark hover:opacity-70 font-medium text-left py-2">
              Buy Feeds
            </button>
            <button onClick={() => { navigate('/sante'); setMenuOpen(false); }} className="text-text-dark hover:opacity-70 font-medium text-left py-2">
              Sante
            </button>
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="bg-text-dark text-white px-4 py-2 rounded-lg hover:opacity-80 transition-opacity flex items-center gap-2 justify-center"
            >
              <LogOut size={18} />
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
