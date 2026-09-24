import { apiClient } from './apiClient';

export const feedsApi = {
  // Retrieve list of feeds
  getFeeds: async () => {
    const res = await apiClient.get('/feeds');
    return res && res.success ? res.data : (Array.isArray(res) ? res : (res?.data || []));
  },

  // Retrieve list of feeds including hidden ones (Admin action)
  getAdminFeeds: async () => {
    const res = await apiClient.get('/feeds/admin');
    return res && res.success ? res.data : (Array.isArray(res) ? res : (res?.data || []));
  },

  // Create new feed (Admin action)
  createFeed: async (feedData) => {
    const res = await apiClient.post('/feeds', feedData);
    return res && res.success ? res.data : res;
  },

  // Update existing feed (Admin action)
  updateFeed: async (id, feedData) => {
    const res = await apiClient.put(`/feeds/${id}`, feedData);
    return res && res.success ? res.data : res;
  },

  // Delete feed (Admin action)
  deleteFeed: async (id) => {
    const res = await apiClient.delete(`/feeds/${id}`);
    return res && res.success ? res.data : res;
  },
};

