import { apiClient } from './apiClient';

export const adminApi = {
  // Get all users registered
  getUsers: async () => {
    const res = await apiClient.get('/admin/users');
    return res && res.success ? res.data : res;
  },

  // Get admin stats / dashboard metrics
  getStats: async () => {
    const res = await apiClient.get('/admin/stats');
    return res && res.success ? res.data : res;
  },

  // Update user role (Super Admin only) - pass UUID string
  updateUserRole: async (userId, role) => {
    const res = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return res && res.success ? res.data : res;
  },

  // Get all system orders
  getOrders: async () => {
    const res = await apiClient.get('/admin/orders');
    return res && res.success ? res.data : res;
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    const res = await apiClient.put(`/admin/orders/${orderId}/status`, { status });
    return res && res.success ? res.data : res;
  },
};
