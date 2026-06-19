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

  // Create a new administrative user (Super Admin only)
  createAdmin: async (adminData) => {
    const res = await apiClient.post('/admin/create-admin', adminData);
    return res && res.success ? res.data : res;
  },

  // Update user role (Super Admin only)
  updateUserRole: async (phone, role) => {
    const res = await apiClient.put(`/admin/users/${phone}/role`, { role });
    return res && res.success ? res.data : res;
  },
};

