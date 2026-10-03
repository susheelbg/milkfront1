import { apiClient } from './apiClient';

const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

export const partnersApi = {
  // ── Public (reads MilkMaatu's own database only) ──
  list: async () => unwrap(await apiClient.get('/partners')) || [],
  products: async (partnerId) => unwrap(await apiClient.get(`/partners/${partnerId}/products`)),
  product: async (productId) => unwrap(await apiClient.get(`/partner-products/${productId}`)),

  // ── Admin ──
  adminList: async () => unwrap(await apiClient.get('/admin/partners')) || [],
  adminCreatePartner: (body) => apiClient.post('/admin/partners', body),
  adminUpdatePartner: (id, body) => apiClient.put(`/admin/partners/${id}`, body),
  adminDeletePartner: (id) => apiClient.delete(`/admin/partners/${id}`),
  adminProducts: async (partnerId) => unwrap(await apiClient.get(`/admin/partners/${partnerId}/products`)),
  adminCreateProduct: (body) => apiClient.post('/admin/partner-products', body),
  adminUpdateProduct: (id, body) => apiClient.put(`/admin/partner-products/${id}`, body),
  adminDeleteProduct: (id) => apiClient.delete(`/admin/partner-products/${id}`),
  adminImport: (partnerId, products, dryRun = false) =>
    apiClient.post(`/admin/partners/${partnerId}/import`, { products, dry_run: dryRun }),
};
