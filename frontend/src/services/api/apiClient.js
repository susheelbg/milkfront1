// Central API client wrapper for FastAPI/Supabase/JWT integration
// Pure production client connected to FastAPI backend & Supabase Auth

import { supabase } from '../../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL;

console.log("Production API Base URL configured:", API_BASE_URL);

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not defined in production environment");
}

// Helper to construct request headers with Supabase Bearer token
const getHeaders = async (options = {}) => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers,
  });

  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch (err) {
    console.warn("Could not retrieve Supabase session token:", err);
  }

  return headers;
};

// Centralized fetch wrapper
export const apiClient = {
  get: async (endpoint, options = {}) => {
    return apiClient.request(endpoint, { ...options, method: 'GET' });
  },

  post: async (endpoint, body, options = {}) => {
    return apiClient.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put: async (endpoint, body, options = {}) => {
    return apiClient.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  patch: async (endpoint, body, options = {}) => {
    return apiClient.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete: async (endpoint, options = {}) => {
    return apiClient.request(endpoint, { ...options, method: 'DELETE' });
  },

  request: async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API CALL - START] Method: ${options.method || 'GET'} | URL: ${url}`);
    const headers = await getHeaders(options);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log(`[API CALL - RESPONSE] Status: ${response.status} | URL: ${url}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (response.status === 401 || response.status === 403) {
          console.error(`[API CALL - AUTH ERROR] Status: ${response.status} | URL: ${url} | Detail:`, errorData);
        }
        
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            // FastAPI validation errors are a list of dicts, format them nicely
            errorMessage = errorData.detail.map(err => {
              const location = err.loc ? err.loc.join('.') : 'field';
              return `${location}: ${err.msg}`;
            }).join(', ');
          } else if (typeof errorData.detail === 'object') {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`[API CALL - EXCEPTION] URL: ${url} | Error:`, error);
      throw error;
    }
  },
};

// Purge any old obsolete mock keys from localStorage
export const purgeObsoleteStorage = () => {
  try {
    localStorage.removeItem('mock_feeds');
    localStorage.removeItem('mock_cattle');
    localStorage.removeItem('mock_users');
    localStorage.removeItem('mock_orders');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  } catch (e) {}
};

purgeObsoleteStorage();
