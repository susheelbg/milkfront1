// Central API client wrapper for FastAPI/Supabase/JWT integration
// Fallbacks to localStorage-based mock database when server is not running

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Check if backend server is available (can be toggled manually or set via ENV)
// By default we check if we should run in mock mode
const USE_MOCK_API = true; // Set to false to force real API calls to FastAPI

// Helper to get JWT token
const getToken = () => localStorage.getItem('authToken');

// Helper to construct request headers
const getHeaders = (options = {}) => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers,
  });

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
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

  delete: async (endpoint, options = {}) => {
    return apiClient.request(endpoint, { ...options, method: 'DELETE' });
  },

  request: async (endpoint, options = {}) => {
    if (USE_MOCK_API) {
      // In mock mode, we intercept and handle using local simulation
      throw new Error('MOCK_MODE_ACTIVE');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const headers = getHeaders(options);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`API call to ${url} failed. falling back to mock...`, error);
      throw error; // Let the caller API handle fallback
    }
  },
};

// Initialize Mock Local database with seed data if not present
const SEED_FEEDS = [
  {
    id: 1,
    name: 'Premium Dairy Feed',
    price: 450,
    description: 'High-quality dairy feed enriched with minerals and vitamins',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=400&fit=crop',
    category: 'Dairy',
  },
  {
    id: 2,
    name: 'Nutritious Fodder Mix',
    price: 320,
    description: 'Balanced nutritious fodder for cattle growth',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=400&fit=crop',
    category: 'Fodder',
  },
  {
    id: 3,
    name: 'Golden Grain Supplement',
    price: 580,
    description: 'Premium grain supplement for enhanced milk production',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=400&fit=crop',
    category: 'Supplement',
  },
  {
    id: 4,
    name: 'Organic Grass Hay',
    price: 280,
    description: 'Organic dried grass hay for nutritious feeding',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=400&fit=crop',
    category: 'Hay',
  },
  {
    id: 5,
    name: 'Mineral Mix Supplement',
    price: 350,
    description: 'Essential minerals for bone and milk development',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=400&fit=crop',
    category: 'Mineral',
  },
  {
    id: 6,
    name: 'Protein Concentrate',
    price: 620,
    description: 'High protein concentrate for muscle development',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=400&fit=crop',
    category: 'Protein',
  },
];

const SEED_CATTLE = [
  {
    id: 1,
    animalName: 'Jersey Cow',
    price: 65000,
    age: 5,
    milkCapacity: '20L/day',
    contactNumber: '+91 9876543210',
    villageName: 'Thendekere',
    santeName: 'Thendekere Sante',
    description: 'Healthy jersey cow with excellent milk production. Vaccinated and dewormed.',
    image: 'https://images.unsplash.com/photo-1546521858-7ce4593f159b?w=500&h=400&fit=crop',
    postedDate: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    animalName: 'Holstein Friesian',
    price: 85000,
    age: 4,
    milkCapacity: '25L/day',
    contactNumber: '+91 9876543211',
    villageName: 'Belgaum',
    santeName: 'KRS Sante',
    description: 'Premium Holstein Friesian with best genetics. High milk quality assured.',
    image: 'https://images.unsplash.com/photo-1546521858-7ce4593f159b?w=500&h=400&fit=crop',
    postedDate: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
];

const SEED_USERS = [
  {
    phone: '+919876543210',
    password: 'demo123',
    name: 'Susheel',
    role: 'admin',
    address: 'Dairy Farm Road, Bengaluru',
    villageName: 'Gokula',
  }
];

// Initialize localStorage DB
export const initMockDb = () => {
  if (!localStorage.getItem('mock_feeds')) {
    localStorage.setItem('mock_feeds', JSON.stringify(SEED_FEEDS));
  }
  if (!localStorage.getItem('mock_cattle')) {
    localStorage.setItem('mock_cattle', JSON.stringify(SEED_CATTLE));
  }
  if (!localStorage.getItem('mock_users')) {
    localStorage.setItem('mock_users', JSON.stringify(SEED_USERS));
  }
  if (!localStorage.getItem('mock_orders')) {
    localStorage.setItem('mock_orders', JSON.stringify([]));
  }
};

// Auto initialize mock db
initMockDb();

// Generic helper to simulate API delay
export const mockDelay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));
