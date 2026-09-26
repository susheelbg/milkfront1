import { apiClient } from './apiClient';

export const feedsApi = {
  // Retrieve list of feeds
  getFeeds: async () => {
    const res = await apiClient.get('/feeds');
    return res && res.success ? res.data : (Array.isArray(res) ? res : (res?.data || []));
  },

  // Retrieve list of feeds including hidden ones (Admin action)
  getAdminFeeds: async () => {
    try {
      const res = await apiClient.get('/admin/feeds');
      if (res && res.success && Array.isArray(res.data)) return res.data;
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
    } catch {}
    const res2 = await apiClient.get('/feeds/admin');
    if (res2 && res2.success && Array.isArray(res2.data)) return res2.data;
    if (Array.isArray(res2)) return res2;
    if (res2 && Array.isArray(res2.data)) return res2.data;
    return [];
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

