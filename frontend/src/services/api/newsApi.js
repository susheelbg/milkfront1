import { apiClient } from './apiClient';

export const newsApi = {
  /**
   * Latest news for Home page ticker (max 6)
   * GET /api/news/latest
   */
  getLatest: async (limit = 6) => {
    return await apiClient.get(`/news/latest?limit=${limit}`);
  },

  /**
   * All news with pagination + optional category filter
   * GET /api/news?category=cattle_health&page=1&limit=12
   */
  getAll: async ({ category = null, page = 1, limit = 12 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (category && category !== 'all') params.set('category', category);
    return await apiClient.get(`/news?${params.toString()}`);
  },
};
