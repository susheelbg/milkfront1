import { apiClient } from './apiClient';

export const cattleApi = {
  // Get active cattle posts
  getCattleListings: async (santeName = null) => {
    const url = santeName ? `/cattle?sante=${encodeURIComponent(santeName)}` : '/cattle';
    return await apiClient.get(url);
  },

  // Create cattle listing
  createCattleListing: async (cattleData) => {
    return await apiClient.post('/cattle', cattleData);
  },

  // Search cattle posts
  searchCattleListings: async (query, santeName = null) => {
    const url = `/cattle/search?q=${encodeURIComponent(query)}` + (santeName ? `&sante=${encodeURIComponent(santeName)}` : '');
    return await apiClient.get(url);
  },

  // Delete cattle post (Admin/Owner action)
  deleteCattleListing: async (id) => {
    return await apiClient.delete(`/cattle/${id}`);
  },
};
