import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Store, ShoppingBag, Package } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    {
      id: 'home',
      label: t('common.home') || 'Home',
      icon: Home,
      path: '/home',
    },
    {
      id: 'sante',
      label: t('home.sante') || 'Sante',
      icon: Store,
      path: '/sante',
    },
    {
      id: 'feeds',
      label: t('home.buyFeeds') || 'Buy Feeds',
      icon: ShoppingBag,
      path: '/feeds',
    },
    {
      id: 'orders',
      label: t('common.myOrders') || 'My Orders',
      icon: Package,
      path: '/orders',
    },
  ];

  // Helper to determine if a route is active
  const isActive = (path) => {
    if (path === '/home') {
      return location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border-light shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:max-w-2xl md:mx-auto md:bottom-4 md:rounded-2xl md:border md:shadow-xl transition-all duration-300">
      <div 
        className="flex items-center justify-around w-full"
        style={{
          paddingTop: '8px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-1 px-2 text-center group cursor-pointer focus:outline-none transition-all duration-200"
              style={{ minHeight: '48px' }} // Large touch target
              aria-label={item.label}
            >
              {/* Icon Container with subtle animation and highlighting */}
              <div 
                className={`relative p-1.5 rounded-xl transition-all duration-300 ${
                  active 
                    ? 'bg-primary-light text-emerald-600 scale-105' 
                    : 'text-text-light group-hover:text-text-dark group-hover:bg-bg-light'
                }`}
              >
                <Icon 
                  size={22} 
                  className={`transition-transform duration-300 ${active ? 'stroke-[2.5px]' : 'stroke-[2px]'}`}
                />
                
                {/* Active indicator dot/pill */}
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full animate-fade-in" />
                )}
              </div>

              {/* Label */}
              <span 
                className={`text-[10px] sm:text-xs tracking-tight transition-colors duration-200 select-none ${
                  active 
                    ? 'text-emerald-700 font-extrabold' 
                    : 'text-text-light group-hover:text-text-dark font-semibold'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
