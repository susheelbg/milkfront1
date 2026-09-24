import { apiClient } from './apiClient';

export const reportApi = {
  // File listing report
  reportListing: async (cattleId, reason) => {
    return await apiClient.post('/cattle/report', { cattle_id: cattleId, reason });
  },

  // Get all reports (Admin only)
  getReports: async () => {
    const res = await apiClient.get('/admin/reports');
    if (res && res.success && Array.isArray(res.data)) return res.data;
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return res || [];
  },

  // Dismiss report (Admin only)
  dismissReport: async (id) => {
    return await apiClient.post(`/admin/reports/${id}/dismiss`);
  },

  // Action report (Admin only)
  actionReport: async (id) => {
    return await apiClient.post(`/admin/reports/${id}/action`);
  },

  // Suspend User (Admin only)
  suspendUser: async (phone) => {
    return await apiClient.post(`/admin/users/${phone}/suspend`);
  },

  // Unsuspend User (Admin only)
  unsuspendUser: async (phone) => {
    return await apiClient.post(`/admin/users/${phone}/unsuspend`);
  },
};
