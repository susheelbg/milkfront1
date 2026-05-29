import { apiClient } from './apiClient';

export const orderApi = {
  // Create a new order
  createOrder: async (orderData) => {
    const res = await apiClient.post('/orders', orderData);
    return res && res.success ? res.data : res;
  },

  // Get orders list (Admin action)
  getOrders: async () => {
    const res = await apiClient.get('/admin/orders');
    return res && res.success ? res.data : res;
  },

  // Update status (Admin action)
  updateOrderStatus: async (orderId, status) => {
    const res = await apiClient.put(`/admin/orders/${orderId}/status`, { status });
    return res && res.success ? res.data : res;
  },
};
