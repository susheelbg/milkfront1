import { apiClient } from './apiClient';

export const feedsApi = {
  // Retrieve list of feeds
  getFeeds: async () => {
    return await apiClient.get('/feeds');
  },

  // Retrieve list of feeds including hidden ones (Admin action)
  getAdminFeeds: async () => {
    return await apiClient.get('/feeds/admin');
  },

  // Create new feed (Admin action)
  createFeed: async (feedData) => {
    return await apiClient.post('/feeds', feedData);
  },

  // Update existing feed (Admin action)
  updateFeed: async (id, feedData) => {
    return await apiClient.put(`/feeds/${id}`, feedData);
  },

  // Delete feed (Admin action)
  deleteFeed: async (id) => {
    return await apiClient.delete(`/feeds/${id}`);
  },
};
