import { apiClient } from './apiClient';

export const chatApi = {
  getMessages: async ({ limit = 30, before, beforeId } = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before && beforeId) {
      params.set('before', before);
      params.set('before_id', beforeId);
    }
    return apiClient.get(`/community-chat/messages?${params.toString()}`);
  },

  sendMessage: async (payload) => apiClient.post('/community-chat/messages', payload),
  deleteMessage: async (messageId) => apiClient.delete(`/community-chat/messages/${messageId}`),
  reportMessage: async (messageId, reason) => apiClient.post(`/community-chat/messages/${messageId}/reports`, { reason }),
  getReports: async () => apiClient.get('/community-chat/admin/reports'),
  removeMessage: async (messageId) => apiClient.delete(`/community-chat/admin/messages/${messageId}`),
};