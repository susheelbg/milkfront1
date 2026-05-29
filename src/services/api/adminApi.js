import { apiClient, mockDelay } from './apiClient';

export const adminApi = {
  // Get all users registered
  getUsers: async () => {
    try {
      return await apiClient.get('/admin/users');
    } catch (err) {
      await mockDelay(600);
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      // Map users, omitting passwords for safety
      return users.map(u => ({
        name: u.name,
        phone: u.phone,
        role: u.role || 'farmer',
        villageName: u.villageName || '',
        address: u.address || '',
        createdAt: u.createdAt || new Date().toISOString(),
      }));
    }
  },

  // Delete a user account (Admin action)
  deleteUser: async (phone) => {
    try {
      return await apiClient.delete(`/admin/users/${phone}`);
    } catch (err) {
      await mockDelay(600);
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const filtered = users.filter(u => u.phone !== phone);
      localStorage.setItem('mock_users', JSON.stringify(filtered));
      return { success: true, message: 'User deleted successfully' };
    }
  },

  // Get admin stats / dashboard metrics
  getStats: async () => {
    try {
      return await apiClient.get('/admin/stats');
    } catch (err) {
      await mockDelay(500);
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const feeds = JSON.parse(localStorage.getItem('mock_feeds') || '[]');
      const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
      const cattle = JSON.parse(localStorage.getItem('mock_cattle') || '[]');

      return {
        usersCount: users.length,
        feedsCount: feeds.length,
        ordersCount: orders.length,
        cattleCount: cattle.length,
        totalRevenue: orders
          .filter(o => o.status === 'delivered' || o.status === 'confirmed' || o.status === 'shipped')
          .reduce((sum, o) => sum + (o.totalPrice || 0), 0),
      };
    }
  },
};
