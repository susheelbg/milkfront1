import { apiClient, mockDelay } from './apiClient';

export const orderApi = {
  // Create a new order
  createOrder: async (orderData) => {
    try {
      return await apiClient.post('/orders', orderData);
    } catch (err) {
      await mockDelay(1000);
      const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
      
      const newOrder = {
        id: 'ORD-' + Date.now(),
        customerName: orderData.customerName,
        phoneNumber: orderData.phoneNumber,
        villageName: orderData.villageName,
        address: orderData.address,
        items: orderData.items,
        totalPrice: orderData.totalPrice,
        status: 'pending', // pending, confirmed, shipped, delivered, cancelled
        createdAt: new Date().toISOString(),
      };

      orders.push(newOrder);
      localStorage.setItem('mock_orders', JSON.stringify(orders));
      return newOrder;
    }
  },

  // Get orders list
  getOrders: async () => {
    try {
      return await apiClient.get('/orders');
    } catch (err) {
      await mockDelay(800);
      return JSON.parse(localStorage.getItem('mock_orders') || '[]');
    }
  },

  // Update status (Admin action)
  updateOrderStatus: async (orderId, status) => {
    try {
      return await apiClient.put(`/orders/${orderId}/status`, { status });
    } catch (err) {
      await mockDelay(600);
      const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
      const index = orders.findIndex(o => o.id === orderId);
      
      if (index !== -1) {
        orders[index].status = status;
        localStorage.setItem('mock_orders', JSON.stringify(orders));
        return orders[index];
      }
      throw new Error(`Order with ID ${orderId} not found`);
    }
  },
};
