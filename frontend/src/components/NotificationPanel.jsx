import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { notificationApi } from '../services/api/notificationApi';
import { toastService } from '../services/toastService';
import { Bell, CheckCheck, X, ChevronRight, Package, Sparkles } from 'lucide-react';

const getRelativeTime = (dateString, t) => {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.max(0, Math.floor((now - past) / 1000));

  if (diffInSeconds < 60) {
    return t('notifications.justNow') || 'Just now';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${t('notifications.minsAgo') || 'mins ago'}`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${t('notifications.hoursAgo') || 'hours ago'}`;
  }
  if (diffInHours < 48) {
    return t('notifications.yesterday') || 'Yesterday';
  }
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} ${t('notifications.daysAgo') || 'days ago'}`;
};

export const NotificationPanel = ({
  notifications = [],
  loading = false,
  onClose,
  onNotificationRead,
  onAllMarkedRead,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await notificationApi.markAsRead(notif.id);
        if (onNotificationRead) onNotificationRead(notif.id);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }

    if (onClose) onClose();

    // Navigate to targeted section based on notification type
    if (notif.type === 'new_cattle') {
      navigate('/sante-buy');
    } else if (notif.type === 'new_feed') {
      navigate('/feeds');
    } else {
      navigate('/home');
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllAsRead();
      if (onAllMarkedRead) onAllMarkedRead();
      toastService.success(t('notifications.markedAllSuccess') || 'All notifications marked as read.');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      toastService.error(err.message || 'Failed to mark notifications as read.');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end md:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md bg-white h-full md:h-auto md:max-h-[85vh] md:rounded-2xl shadow-2xl border border-border-light flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="bg-[#0A2E1F] text-white px-5 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
              🔔
            </div>
            <div>
              <h2 className="text-base font-black text-amber-400 tracking-tight">
                {t('notifications.title') || 'Notifications'}
              </h2>
              {unreadCount > 0 && (
                <p className="text-[11px] font-semibold text-emerald-200">
                  {unreadCount} {t('notifications.unread') || 'unread'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-[11px] font-bold bg-white/10 hover:bg-white/20 text-amber-300 px-2.5 py-1 rounded-lg transition-all"
                title={t('notifications.markAllAsRead') || 'Mark all as read'}
              >
                <CheckCheck size={14} />
                <span>{t('notifications.markAllAsRead') || 'Mark all read'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              aria-label="Close notifications panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-bg-light">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-light space-y-2">
              <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">{t('common.loading') || 'Loading...'}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 bg-amber-100/60 text-amber-600 rounded-2xl flex items-center justify-center mb-3 text-2xl border border-amber-200">
                🔔
              </div>
              <h3 className="text-sm font-bold text-text-dark mb-1">
                {t('notifications.noNotifications') || 'No notifications yet'}
              </h3>
              <p className="text-xs text-text-light max-w-xs">
                You will be notified when new cattle listings or feed products are available!
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = !notif.isRead;
              const icon = notif.type === 'new_cattle' ? '🐄' : notif.type === 'new_feed' ? '🌾' : '🔔';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                    isUnread
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs hover:bg-amber-100/80'
                      : 'bg-white border-border-light hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {/* Unread indicator dot */}
                  {isUnread && (
                    <span className="absolute top-3.5 right-3 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  )}

                  <div className="w-10 h-10 rounded-xl bg-white border border-border-light flex items-center justify-center text-xl shrink-0 shadow-xs">
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4
                        className={`text-xs font-black truncate ${
                          isUnread ? 'text-text-dark' : 'text-gray-700'
                        }`}
                      >
                        {notif.title}
                      </h4>
                    </div>

                    <p className="text-xs text-text-light line-clamp-2 mb-1.5 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-text-light font-bold">
                      <span className="text-emerald-700 font-extrabold">
                        {getRelativeTime(notif.createdAt, t)}
                      </span>
                      <span className="flex items-center gap-0.5 text-primary-dark font-extrabold hover:underline">
                        View <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
