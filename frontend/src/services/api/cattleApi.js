import { apiClient } from './apiClient';

export const cattleApi = {
  // Get active cattle posts - safely unpacks response envelope and guarantees an Array
  getCattleListings: async (santeName = null) => {
    try {
      const url = santeName ? `/cattle?sante=${encodeURIComponent(santeName)}` : '/cattle';
      const res = await apiClient.get(url);
      if (res && Array.isArray(res.data)) {
        return res.data;
      }
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.error('cattleApi.getCattleListings error:', err);
      return [];
    }
  },

  // Create cattle listing
  createCattleListing: async (cattleData) => {
    const res = await apiClient.post('/cattle', cattleData);
    return res && res.success ? (res.data || res) : res;
  },

  // Search cattle posts
  searchCattleListings: async (query, santeName = null) => {
    try {
      const url = `/cattle/search?q=${encodeURIComponent(query)}` + (santeName ? `&sante=${encodeURIComponent(santeName)}` : '');
      const res = await apiClient.get(url);
      if (res && Array.isArray(res.data)) {
        return res.data;
      }
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.error('cattleApi.searchCattleListings error:', err);
      return [];
    }
  },

  // Delete cattle post (Admin/Owner action)
  deleteCattleListing: async (id) => {
    return await apiClient.delete(`/cattle/${id}`);
  },
};
