import { apiClient } from './apiClient';

export const orderApi = {
  // Create a new order (public / farmer action)
  createOrder: async (orderData) => {
    const res = await apiClient.post('/orders', orderData);
    return res && res.success ? res.data : res;
  },

  // Get orders list (Admin action)
  getOrders: async () => {
    const res = await apiClient.get('/admin/orders');
    return res && res.success ? res.data : res;
  },

  // Retrieve purchase history for farmer by phone or order IDs without login
  getMyOrders: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.phone) query.append('phone', params.phone);
    if (params.ids && params.ids.length > 0) {
      query.append('ids', Array.isArray(params.ids) ? params.ids.join(',') : params.ids);
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiClient.get(`/orders/my-orders${qs}`);
    return res && res.success ? res.data : (Array.isArray(res) ? res : []);
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    const res = await apiClient.put(`/orders/${orderId}/cancel`);
    return res && res.success ? res.data : res;
  },

  // Update status (Admin action)
  updateOrderStatus: async (orderId, status) => {
    const res = await apiClient.put(`/admin/orders/${orderId}/status`, { status });
    return res && res.success ? res.data : res;
  },
};
