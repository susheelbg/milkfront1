import { apiClient } from './apiClient';

export const adminApi = {
  // Get all users registered
  getUsers: async () => {
    const res = await apiClient.get('/admin/users');
    return res && res.success ? res.data : res;
  },

  // Delete a user account (Admin action)
  deleteUser: async (phone) => {
    const res = await apiClient.delete(`/admin/users/${phone}`);
    return res && res.success ? res.data : res;
  },

  // Get admin stats / dashboard metrics
  getStats: async () => {
    const res = await apiClient.get('/admin/stats');
    return res && res.success ? res.data : res;
  },
};
