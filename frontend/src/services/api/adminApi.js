import { apiClient } from './apiClient';

export const adminApi = {
  // Get all users registered
  getUsers: async () => {
    const res = await apiClient.get('/admin/users');
    if (res && res.success && Array.isArray(res.data)) return res.data;
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  // Get admin stats / dashboard metrics
  getStats: async () => {
    const res = await apiClient.get('/admin/stats');
    if (res && res.success && res.data) return res.data;
    return res || {};
  },

  // Get all catalog feeds (Admin)
  getFeeds: async () => {
    try {
      const res = await apiClient.get('/admin/feeds');
      if (res && res.success && Array.isArray(res.data)) return res.data;
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
    } catch {}
    const res2 = await apiClient.get('/feeds/admin');
    if (res2 && res2.success && Array.isArray(res2.data)) return res2.data;
    if (Array.isArray(res2)) return res2;
    return [];
  },

  // Update user role (Super Admin only) - pass UUID string
  updateUserRole: async (userId, role) => {
    const res = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return res && res.success ? (res.data || res) : res;
  },

  // Get all system orders
  getOrders: async () => {
    const res = await apiClient.get('/admin/orders');
    if (res && res.success && Array.isArray(res.data)) return res.data;
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    const res = await apiClient.put(`/admin/orders/${orderId}/status`, { status });
    return res && res.success ? (res.data || res) : res;
  },

  // Get all cattle listings
  getCattle: async () => {
    const res = await apiClient.get('/admin/cattle');
    if (res && res.success && Array.isArray(res.data)) return res.data;
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  // Delete cattle listing
  deleteCattle: async (cattleId) => {
    const res = await apiClient.delete(`/admin/cattle/${cattleId}`);
    return res && res.success ? (res.data || res) : res;
  },
};
