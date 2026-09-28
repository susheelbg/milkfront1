import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useTranslation';
import { notificationApi } from '../services/api/notificationApi';
import { NotificationPanel } from './NotificationPanel';

export const Header = ({ showBack = false, onBack = null }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      // Silent catch for periodic polling errors
    }
  };

  const fetchFullNotifications = async () => {
    if (!isAuthenticated) return;
    setLoadingNotifications(true);
    try {
      const list = await notificationApi.getNotifications();
      setNotifications(list);
      const unread = list.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();
    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleBellClick = () => {
    if (!showNotifications) {
      fetchFullNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleNotificationReadLocal = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleAllMarkedReadLocal = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : null;

  return (
    <>
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
              <span className="text-2xl font-black text-black tracking-tight">
                Milk<span className="text-black">ಮಾತು</span>
              </span>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2.5">
            {/* Admin link if user has admin/super_admin role */}
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A2E1F] text-amber-400 font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#041D12] transition-colors"
              >
                <Shield size={14} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* In-App Notification Bell 🔔 */}
            {isAuthenticated && (
              <button
                onClick={handleBellClick}
                className="relative w-9 h-9 rounded-full bg-white/30 hover:bg-white/50 text-text-dark font-bold flex items-center justify-center transition-all cursor-pointer border border-black/10"
                title={t('notifications.title') || 'Notifications'}
                aria-label={t('notifications.title') || 'Notifications'}
              >
                <Bell size={18} className="text-text-dark" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs animate-bounce border-2 border-primary">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile Circle Avatar */}
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

      {/* Notification Slide-Over / Panel */}
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          loading={loadingNotifications}
          onClose={() => setShowNotifications(false)}
          onNotificationRead={handleNotificationReadLocal}
          onAllMarkedRead={handleAllMarkedReadLocal}
        />
      )}
    </>
  );
};
