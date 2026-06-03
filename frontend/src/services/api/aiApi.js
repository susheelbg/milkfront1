import { apiClient } from './apiClient';

export const aiApi = {
  /**
   * Send prompt/query to Nandini AI dairy farming assistant
   * @param {string} prompt 
   * @returns {Promise<{response: string}>}
   */
  askNandini: async (prompt) => {
    const res = await apiClient.post('/ai/nandini', { prompt });
    if (res && res.response) {
      return res;
    }
    throw new Error('Failed to get response from Nandini AI');
  }
};
