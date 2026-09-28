import { apiClient } from './apiClient';

export const notificationApi = {
  /**
   * Fetch all notifications for the currently logged in user
   */
  getNotifications: async () => {
    const res = await apiClient.get('/notifications');
    return res?.data || [];
  },

  /**
   * Fetch unread notification count for badge
   */
  getUnreadCount: async () => {
    const res = await apiClient.get('/notifications/unread-count');
    return res?.data?.unreadCount || 0;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id) => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res?.data;
  },

  /**
   * Mark all unread notifications as read for current user
   */
  markAllAsRead: async () => {
    const res = await apiClient.patch('/notifications/read-all');
    return res?.data;
  },
};
