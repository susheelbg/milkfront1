import { apiClient } from './apiClient';

export const cattleApi = {
  // Get active or all cattle posts - safely unpacks response envelope and guarantees an Array
  getCattleListings: async (santeName = null, includeExpired = false) => {
    try {
      const params = [];
      if (santeName) params.push(`sante=${encodeURIComponent(santeName)}`);
      if (includeExpired) params.push('include_expired=true');
      const queryString = params.length > 0 ? `?${params.join('&')}` : '';
      const res = await apiClient.get(`/cattle${queryString}`);
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
